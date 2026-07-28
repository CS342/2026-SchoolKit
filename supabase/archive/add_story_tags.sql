-- ================================================================
-- Add Content Tags to Stories
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add story_tags array column to stories table
ALTER TABLE stories
ADD COLUMN story_tags TEXT[] DEFAULT '{}'::TEXT[];
