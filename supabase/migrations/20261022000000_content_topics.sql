-- Content topics. A topic groups one or more content pages ("versions"); each version
-- carries its own audience in doc.audience, and readers get the version that fits them
-- (features/content/versions.ts). A universal page is simply a topic with one version.

-- ─── table ───────────────────────────────────────────────────────
CREATE TABLE content_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,                  -- the reader-facing URL: /page/<slug>
  name        text NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER content_topics_updated_at
  BEFORE UPDATE ON content_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE content_pages
  ADD COLUMN topic_id uuid REFERENCES content_topics(id) ON DELETE CASCADE;

-- ─── backfill ────────────────────────────────────────────────────
-- One topic per existing page, reusing the page's id and slug: the library's resource id
-- (cp_<id>) and /page/<slug> links stay the same, so bookmarks, downloads and reading
-- progress survive.
INSERT INTO content_topics (id, slug, name, created_by, created_at)
  SELECT id, slug, title, created_by, created_at FROM content_pages;

UPDATE content_pages SET topic_id = id;

ALTER TABLE content_pages ALTER COLUMN topic_id SET NOT NULL;
CREATE INDEX idx_content_pages_topic ON content_pages(topic_id);

-- ─── RLS ─────────────────────────────────────────────────────────
-- Readers can see a topic once it has a published version (so draft topic names stay
-- private); moderators see and manage all topics, matching content_pages.
ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics with a published version are viewable by all"
  ON content_topics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM content_pages p WHERE p.topic_id = content_topics.id AND p.status = 'published'
  ));

CREATE POLICY "Moderators can view all topics"
  ON content_topics FOR SELECT TO authenticated
  USING (public.is_moderator());

CREATE POLICY "Moderators can insert topics"
  ON content_topics FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator());

CREATE POLICY "Moderators can update topics"
  ON content_topics FOR UPDATE TO authenticated
  USING (public.is_moderator());

CREATE POLICY "Moderators can delete topics"
  ON content_topics FOR DELETE TO authenticated
  USING (public.is_moderator());
