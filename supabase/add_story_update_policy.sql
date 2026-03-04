-- ================================================================
-- Add UPDATE Policy to Stories
-- Run this in Supabase SQL Editor
-- ================================================================

-- DROP POLICY IF EXISTS "Users and Moderators can update stories" ON stories;

CREATE POLICY "Users and Moderators can update stories"
  ON stories FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR 
    ((auth.jwt() ->> 'email') IN ('janinatroper@gmail.com', 'lvalsote@stanford.edu', 'ngounder@stanford.edu'))
  )
  WITH CHECK (
    auth.uid() = author_id OR 
    ((auth.jwt() ->> 'email') IN ('janinatroper@gmail.com', 'lvalsote@stanford.edu', 'ngounder@stanford.edu'))
  );
