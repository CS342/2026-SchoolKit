-- Comment Reports Schema Updates

-- 1. Create the comment_reports table
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES story_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id) -- A user can only report a specific comment once
);

-- 2. Add report_count to story_comments table
ALTER TABLE story_comments
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;

-- 3. Enable RLS on comment_reports
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- 4. Policies for comment_reports
CREATE POLICY "Users can create their own comment reports"
  ON comment_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own comment reports"
  ON comment_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all comment reports"
  ON comment_reports FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY['janinatroper@gmail.com'::text, 'lvalsote@stanford.edu'::text, 'ngounder@stanford.edu'::text])
  );

-- 5. Create function and trigger to auto-increment report_count
CREATE OR REPLACE FUNCTION increment_comment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE story_comments
  SET report_count = report_count + 1
  WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_reported ON comment_reports;
CREATE TRIGGER on_comment_reported
  AFTER INSERT ON comment_reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_report_count();
