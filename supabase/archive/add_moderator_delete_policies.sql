-- Allow moderators to delete any story
CREATE POLICY "Moderators can delete any story"
  ON stories FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY['janinatroper@gmail.com'::text, 'lvalsote@stanford.edu'::text, 'ngounder@stanford.edu'::text])
  );

-- Allow moderators to delete story reports (dismiss)
CREATE POLICY "Moderators can delete story reports"
  ON story_reports FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY['janinatroper@gmail.com'::text, 'lvalsote@stanford.edu'::text, 'ngounder@stanford.edu'::text])
  );

-- Allow moderators to delete any comment
CREATE POLICY "Moderators can delete any comment"
  ON story_comments FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY['janinatroper@gmail.com'::text, 'lvalsote@stanford.edu'::text, 'ngounder@stanford.edu'::text])
  );

-- Allow moderators to delete comment reports (dismiss)
CREATE POLICY "Moderators can delete comment reports"
  ON comment_reports FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY['janinatroper@gmail.com'::text, 'lvalsote@stanford.edu'::text, 'ngounder@stanford.edu'::text])
  );
