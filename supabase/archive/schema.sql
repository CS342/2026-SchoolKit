-- Create the earned_accomplishments table
CREATE TABLE IF NOT EXISTS public.earned_accomplishments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  piece_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, piece_id)
);

-- Enable RLS
ALTER TABLE public.earned_accomplishments ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Users can view their own earned accomplishments
CREATE POLICY "Users can view their own earned accomplishments"
  ON public.earned_accomplishments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can insert their own earned accomplishments
CREATE POLICY "Users can insert their own earned accomplishments"
  ON public.earned_accomplishments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own earned accomplishments (e.g. for re-syncing timestamps)
CREATE POLICY "Users can update their own earned accomplishments"
  ON public.earned_accomplishments
  FOR UPDATE
  USING (auth.uid() = user_id);
-- SchoolKit Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/inquvsymyujundkwxzju/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student-k8', 'student-hs', 'parent', 'staff');
CREATE TYPE school_status AS ENUM ('current-treatment', 'returning-after-treatment', 'supporting-student', 'special-needs');

-- Profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role user_role,
  school_statuses school_status[] DEFAULT '{}',
  grade_level TEXT,
  topics TEXT[] DEFAULT '{}',
  profile_picture_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources table (for dynamic content management)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'book-outline',
  target_roles user_role[] DEFAULT '{}',
  design_id UUID,  -- links to designs(id) when resource is a published design
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Profiles policies: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Resources policies: everyone can read resources
CREATE POLICY "Anyone can view resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert some sample resources (optional)
INSERT INTO resources (title, description, category, icon, target_roles) VALUES
  ('Talking to Teachers', 'Tips for communicating with school staff about your situation', 'School Support', 'school-outline', '{student-k8, student-hs}'),
  ('Staying Connected with Friends', 'Ways to maintain friendships during treatment', 'Social', 'people-outline', '{student-k8, student-hs}'),
  ('Managing Schoolwork', 'Strategies for keeping up with assignments', 'Academics', 'book-outline', '{student-k8, student-hs}'),
  ('Supporting Your Child', 'Guide for parents navigating school during treatment', 'Parent Guide', 'heart-outline', '{parent}'),
  ('504 Plans & IEPs', 'Understanding educational accommodations', 'Legal Rights', 'document-outline', '{parent, staff}'),
  ('Creating Inclusive Classrooms', 'Best practices for supporting students with health conditions', 'Teaching', 'school-outline', '{staff}');

-- ============================================
-- User Questions / Feedback (collected for future content direction)
-- ============================================
CREATE TABLE user_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  role user_role,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own questions"
  ON user_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Storage: Avatar bucket (run separately or create manually in Dashboard)
-- ============================================
-- Note: Create bucket manually in Dashboard → Storage → New bucket → "avatars" (public)
-- Or run these SQL commands:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Resource progress table (created by user)
-- CREATE TABLE public.resource_progress (
--   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
--   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
--   resource_id text,
--   is_opened boolean DEFAULT false,
--   is_completed boolean DEFAULT false,
--   updated_at timestamptz DEFAULT now()
-- );
-- Note: A UNIQUE constraint on (user_id, resource_id) is required for upsert to work.
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
