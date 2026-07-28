-- ================================================================
-- SchoolKit — consolidated initial schema
-- Supersedes the loose scripts (schema.sql, stories-schema.sql,
-- journal-tables.sql, designs-schema.sql, add_*.sql) and adds the
-- objects that only existed in the old project's dashboard:
--   * user_bookmarks table
--   * stories.status / attempt_count / rejected_norms columns
--   * resource_progress table (was commented out in schema.sql)
--   * avatars / journal-images / design-assets storage buckets
--   * realtime publication for resources
-- Apply to a fresh project with: supabase db push
-- ================================================================

-- ─── Types ───────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student-k8', 'student-hs', 'parent', 'staff');
CREATE TYPE school_status AS ENUM ('current-treatment', 'returning-after-treatment', 'supporting-student', 'special-needs');

-- ─── Shared functions ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── profiles ────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role user_role,
  school_statuses school_status[] DEFAULT '{}',
  grade_level TEXT,
  topics TEXT[] DEFAULT '{}',
  profile_picture_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  voice_id TEXT,
  preferred_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── resources ───────────────────────────────────────────────────
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'book-outline',
  target_roles user_role[] DEFAULT '{}',
  design_id UUID,  -- links to designs(id) when resource is a published design
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources"
  ON resources FOR SELECT TO authenticated USING (true);
-- Publishing flow (design editor) needs write access
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update resources"
  ON resources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE TO authenticated USING (true);

-- useResources() subscribes to postgres_changes on this table
ALTER PUBLICATION supabase_realtime ADD TABLE resources;

-- ─── user_questions ──────────────────────────────────────────────
CREATE TABLE user_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  role user_role,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own questions"
  ON user_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── user_bookmarks (was dashboard-only in the old project) ──────
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,  -- hardcoded resource slug or resources.id as text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks"
  ON user_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_bookmarks_user ON user_bookmarks(user_id, created_at DESC);

-- ─── earned_accomplishments ──────────────────────────────────────
CREATE TABLE public.earned_accomplishments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  piece_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, piece_id)
);

ALTER TABLE public.earned_accomplishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earned accomplishments"
  ON public.earned_accomplishments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own earned accomplishments"
  ON public.earned_accomplishments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own earned accomplishments"
  ON public.earned_accomplishments FOR UPDATE USING (auth.uid() = user_id);

-- ─── resource_progress (was commented out in schema.sql) ─────────
CREATE TABLE public.resource_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  is_opened boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_id)  -- required for the client's upsert onConflict
);

ALTER TABLE public.resource_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resource progress"
  ON resource_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resource progress"
  ON resource_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resource progress"
  ON resource_progress FOR UPDATE USING (auth.uid() = user_id);

-- ─── stories (incl. moderation columns added later in old project) ─
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role user_role,
  looking_for TEXT[],
  target_audiences TEXT[] DEFAULT ARRAY['student-k8', 'student-hs', 'parent', 'staff']::TEXT[],
  story_tags TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejected_norms TEXT[] DEFAULT '{}'::TEXT[],
  attempt_count INTEGER NOT NULL DEFAULT 1,
  report_count INTEGER NOT NULL DEFAULT 0,
  previous_title TEXT,
  previous_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role user_role,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES story_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE TABLE story_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE TABLE comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES story_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- Moderator emails (single source of truth for policies below).
-- NOTE: keep in sync with MODERATOR_EMAILS in app/(tabs)/stories.tsx / app/story-detail.tsx
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() ->> 'email') IN (
    'janinatroper@gmail.com',
    'lvalsote@stanford.edu',
    'ngounder@stanford.edu'
  );
$$ LANGUAGE sql STABLE;

-- Stories policies
CREATE POLICY "Anyone authenticated can read stories"
  ON stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Non-anonymous users can create stories"
  ON stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users and Moderators can update stories"
  ON stories FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_moderator())
  WITH CHECK (auth.uid() = author_id OR public.is_moderator());
CREATE POLICY "Authors can delete own stories"
  ON stories FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Moderators can delete any story"
  ON stories FOR DELETE TO authenticated USING (public.is_moderator());

-- Comment policies
CREATE POLICY "Anyone authenticated can read comments"
  ON story_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Non-anonymous users can create comments"
  ON story_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments"
  ON story_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Moderators can delete any comment"
  ON story_comments FOR DELETE TO authenticated USING (public.is_moderator());

-- Story bookmark policies
CREATE POLICY "Users can view own story bookmarks"
  ON story_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own story bookmarks"
  ON story_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own story bookmarks"
  ON story_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Like policies
CREATE POLICY "Anyone authenticated can read likes"
  ON story_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own likes"
  ON story_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes"
  ON story_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read all comment likes"
  ON comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own comment likes"
  ON comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes"
  ON comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Report policies
CREATE POLICY "Users can create their own reports"
  ON story_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reports"
  ON story_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Moderators can view all reports"
  ON story_reports FOR SELECT TO authenticated USING (public.is_moderator());
CREATE POLICY "Moderators can delete story reports"
  ON story_reports FOR DELETE TO authenticated USING (public.is_moderator());

CREATE POLICY "Users can create their own comment reports"
  ON comment_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own comment reports"
  ON comment_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Moderators can view all comment reports"
  ON comment_reports FOR SELECT TO authenticated USING (public.is_moderator());
CREATE POLICY "Moderators can delete comment reports"
  ON comment_reports FOR DELETE TO authenticated USING (public.is_moderator());

-- Report-count triggers
CREATE OR REPLACE FUNCTION increment_story_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories SET report_count = report_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_story_reported
  AFTER INSERT ON story_reports
  FOR EACH ROW EXECUTE FUNCTION increment_story_report_count();

CREATE OR REPLACE FUNCTION increment_comment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE story_comments SET report_count = report_count + 1 WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_reported
  AFTER INSERT ON comment_reports
  FOR EACH ROW EXECUTE FUNCTION increment_comment_report_count();

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_comments_story_id ON story_comments(story_id, created_at ASC);
CREATE INDEX idx_story_bookmarks_user ON story_bookmarks(user_id);
CREATE INDEX idx_story_likes_story ON story_likes(story_id);
CREATE INDEX idx_story_likes_user ON story_likes(user_id);

-- ─── designs ─────────────────────────────────────────────────────
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Design',
  doc JSONB NOT NULL DEFAULT '{
    "version": 1,
    "canvas": { "width": 1280, "height": 720, "background": "#FFFFFF" },
    "objects": [],
    "assets": {}
  }'::jsonb,
  thumbnail_url TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  published_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own designs"
  ON designs FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Published designs are viewable by all"
  ON designs FOR SELECT TO authenticated USING (published_resource_id IS NOT NULL);
CREATE POLICY "Owner can insert designs"
  ON designs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own designs"
  ON designs FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own designs"
  ON designs FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Asset owner can manage"
  ON design_assets FOR ALL TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Design owner can view assets"
  ON design_assets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = design_assets.design_id
        AND designs.owner_id = auth.uid()
    )
  );

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_designs_owner ON designs(owner_id, updated_at DESC);
CREATE INDEX idx_designs_share_token ON designs(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_design_assets_design ON design_assets(design_id);

-- ─── journals ────────────────────────────────────────────────────
CREATE TABLE journals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL CHECK (char_length(title) <= 40),
  cover_id   text NOT NULL,
  paper_id   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journal_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id   uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  page_index   int NOT NULL DEFAULT 0,
  text_entry   text NOT NULL DEFAULT '',
  paths        jsonb NOT NULL DEFAULT '[]'::jsonb,
  images       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journal_id, page_index)
);

CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journal_pages_journal_id ON journal_pages(journal_id);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own journals"
  ON journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals"
  ON journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals"
  ON journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals"
  ON journals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select own journal pages"
  ON journal_pages FOR SELECT USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own journal pages"
  ON journal_pages FOR INSERT WITH CHECK (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own journal pages"
  ON journal_pages FOR UPDATE USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own journal pages"
  ON journal_pages FOR DELETE USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

CREATE TRIGGER journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER journal_pages_updated_at
  BEFORE UPDATE ON journal_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage buckets & policies ──────────────────────────────────
-- NOTE: journal-images is public for parity with the old project.
-- Consider making it private + signed URLs (requires JournalContext changes).
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('journal-images', 'journal-images', true),
  ('design-assets', 'design-assets', true)
ON CONFLICT (id) DO NOTHING;

-- avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- journal-images
CREATE POLICY "Users can upload journal images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can read journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-images');
CREATE POLICY "Users can delete own journal images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- design-assets
CREATE POLICY "Staff can upload design assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Staff can update own design assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read access for design assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'design-assets');
CREATE POLICY "Staff can delete own design assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
