-- ============================================================
-- Journal Tables for SchoolKit
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Journals table (one row per notebook)
CREATE TABLE journals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL CHECK (char_length(title) <= 40),
  cover_id   text NOT NULL,
  paper_id   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_journals_user_id ON journals(user_id);

-- 2. Journal pages table (one row per page)
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

CREATE INDEX idx_journal_pages_journal_id ON journal_pages(journal_id);

-- 3. RLS policies
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_pages ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own journals
CREATE POLICY "Users can select own journals"
  ON journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals"
  ON journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON journals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON journals FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only see/modify pages belonging to their journals
CREATE POLICY "Users can select own journal pages"
  ON journal_pages FOR SELECT
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own journal pages"
  ON journal_pages FOR INSERT
  WITH CHECK (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own journal pages"
  ON journal_pages FOR UPDATE
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own journal pages"
  ON journal_pages FOR DELETE
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER journal_pages_updated_at
  BEFORE UPDATE ON journal_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Storage bucket for journal images
-- Run this separately or create via Supabase Dashboard → Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload/read/delete their own images
CREATE POLICY "Users can upload journal images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-images');

CREATE POLICY "Users can delete own journal images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
