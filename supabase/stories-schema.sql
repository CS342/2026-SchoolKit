-- ================================================================
-- Stories Feature Schema
-- Run this in Supabase SQL Editor after the main schema.sql
-- ================================================================

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role user_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story comments (flat, no threading)
CREATE TABLE story_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role user_role,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story bookmarks (separate from resource bookmarks)
CREATE TABLE story_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_bookmarks ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Anyone authenticated can read stories"
  ON stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Non-anonymous users can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Comment policies
CREATE POLICY "Anyone authenticated can read comments"
  ON story_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Non-anonymous users can create comments"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
  ON story_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Bookmark policies
CREATE POLICY "Users can view own story bookmarks"
  ON story_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own story bookmarks"
  ON story_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own story bookmarks"
  ON story_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on stories (reuses existing function)
CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_comments_story_id ON story_comments(story_id, created_at ASC);
CREATE INDEX idx_story_bookmarks_user ON story_bookmarks(user_id);
