-- ================================================================
-- Story Reports Schema Updates
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Create the story_reports table
CREATE TABLE story_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- A user can only report a specific story once
);

-- 2. Add report_count to stories table
ALTER TABLE stories
ADD COLUMN report_count INTEGER NOT NULL DEFAULT 0;

-- 3. Enable RLS on story_reports
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- 4. Policies for story_reports
CREATE POLICY "Users can create their own reports"
  ON story_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON story_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all reports"
  ON story_reports FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('janinatroper@gmail.com', 'lvalsote@stanford.edu', 'ngounder@stanford.edu'));

-- 5. Create function and trigger to auto-increment report_count
CREATE OR REPLACE FUNCTION increment_story_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET report_count = report_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_story_reported
  AFTER INSERT ON story_reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_report_count();
