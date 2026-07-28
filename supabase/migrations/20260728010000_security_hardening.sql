-- ================================================================
-- SchoolKit — security hardening
-- Fixes findings from the live RLS audit (2026-07-28):
--   1. resources: world-writable -> owner/moderator-scoped
--   2. report-count triggers: INVOKER -> SECURITY DEFINER (queue was dead)
--   3. stories: authors could self-approve / reset report_count
--   4. stories: unmoderated bodies were readable by everyone
--   5. owner DELETE policies (data deletion / GDPR)
--   6. journal-images: public+enumerable -> private, owner-scoped reads
--   7. story_comments: moderator UPDATE (redact / clear counts)
-- ================================================================

-- ─── 1. resources: scope writes to owner or moderator ────────────
ALTER TABLE resources ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can update resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON resources;

CREATE POLICY "Owner or moderator can insert resources"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.is_moderator());
CREATE POLICY "Owner or moderator can update resources"
  ON resources FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_moderator());
CREATE POLICY "Owner or moderator can delete resources"
  ON resources FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_moderator());
-- SELECT ("Anyone can view resources") is unchanged.

-- ─── 2. report-count triggers run with definer rights ────────────
-- These UPDATE the parent row on behalf of a reporter who is neither the
-- author nor a moderator, so under INVOKER rights the stories UPDATE policy
-- matched zero rows and report_count never moved. SECURITY DEFINER runs them
-- as the table owner (bypasses RLS). The story trigger also sets a
-- transaction-local flag so the moderation guard (below) lets the bump through.
CREATE OR REPLACE FUNCTION increment_story_report_count()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_report_bump', 'on', true);
  UPDATE stories SET report_count = report_count + 1 WHERE id = NEW.story_id;
  PERFORM set_config('app.allow_report_bump', 'off', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_report_count()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE story_comments SET report_count = report_count + 1 WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 3. stories: block author self-moderation ────────────────────
-- Authors keep normal edit rights (and may resubmit: status -> 'pending'),
-- but cannot approve/reject their own story or alter report_count. Moderators
-- and the report-count trigger (via the flag) are exempt.
CREATE OR REPLACE FUNCTION guard_story_moderation_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.allow_report_bump', true) = 'on' THEN
    RETURN NEW;               -- the report-count trigger's own bump
  END IF;
  IF public.is_moderator() THEN
    RETURN NEW;               -- moderators may change anything
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'Only moderators can change story status to %', NEW.status
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  NEW.report_count := OLD.report_count;   -- authors can't touch the counter
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stories_guard_moderation ON stories;
CREATE TRIGGER stories_guard_moderation
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION guard_story_moderation_columns();

-- ─── 4. stories: don't serve unmoderated bodies ──────────────────
DROP POLICY IF EXISTS "Anyone authenticated can read stories" ON stories;
CREATE POLICY "Read approved, own, or as moderator"
  ON stories FOR SELECT TO authenticated
  USING (status = 'approved' OR auth.uid() = author_id OR public.is_moderator());

-- ─── 5. owner DELETE policies (were missing) ─────────────────────
CREATE POLICY "Users can delete own resource progress"
  ON resource_progress FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own earned accomplishments"
  ON earned_accomplishments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Users can delete own questions"
  ON user_questions FOR DELETE USING (auth.uid() = user_id);

-- ─── 7. story_comments: moderator UPDATE (redact / clear counts) ──
CREATE POLICY "Moderators can update comments"
  ON story_comments FOR UPDATE TO authenticated
  USING (public.is_moderator()) WITH CHECK (public.is_moderator());

-- ─── 6. journal-images: private bucket, owner-scoped reads ───────
UPDATE storage.buckets SET public = false WHERE id = 'journal-images';

DROP POLICY IF EXISTS "Anyone can read journal images" ON storage.objects;
CREATE POLICY "Owners can read own journal images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars bucket: allow owners to delete their own avatar (was missing)
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
