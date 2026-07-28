-- Content pages (block model). A page is a ContentDoc stored as JSONB in `doc`.
-- See docs/content-blocks-spec.md. Additive migration — touches no existing tables.

-- ─── table ───────────────────────────────────────────────────────
CREATE TABLE content_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  category     text,
  tags         text[] NOT NULL DEFAULT '{}',
  doc          jsonb NOT NULL,                        -- the ContentDoc
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_pages_status ON content_pages(status);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);

CREATE TRIGGER content_pages_updated_at
  BEFORE UPDATE ON content_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────
-- Published pages are public educational content (readable by anon + authenticated,
-- since the app browses under anonymous sessions). Drafts are visible only to their
-- author and moderators. Writes are moderator-only — the design editor is already
-- admin/moderator-gated (see 20260728020000_rbac.sql); researcher accounts are granted
-- the `moderator` role to author pages.
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are viewable by all"
  ON content_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors and moderators can view drafts"
  ON content_pages FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_moderator());

CREATE POLICY "Moderators can insert pages"
  ON content_pages FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator());

CREATE POLICY "Moderators can update pages"
  ON content_pages FOR UPDATE TO authenticated
  USING (public.is_moderator());

CREATE POLICY "Moderators can delete pages"
  ON content_pages FOR DELETE TO authenticated
  USING (public.is_moderator());

-- ─── storage: images embedded in content pages ───────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Content images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-images');

CREATE POLICY "Moderators manage content images"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'content-images' AND public.is_moderator())
  WITH CHECK (bucket_id = 'content-images' AND public.is_moderator());
