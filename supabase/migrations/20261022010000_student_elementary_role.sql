-- Elementary school students (Pre-K–5) as their own reader role, alongside student-k8
-- (middle school) and student-hs. Content pages target it via doc.audience.roles.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student-elementary' BEFORE 'student-k8';

ALTER TABLE stories
  ALTER COLUMN target_audiences SET DEFAULT ARRAY['student-elementary', 'student-k8', 'student-hs', 'parent', 'staff']::TEXT[];
