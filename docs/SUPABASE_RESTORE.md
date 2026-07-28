# Supabase Restore / Recreate Runbook

Status as of 2026-07-28: the original project **SchoolKit** (`inquvsymyujundkwxzju`,
org `azqpzsyhzrpiuzpwzdfk`) is **paused (INACTIVE), not deleted**. Its DNS is
NXDOMAIN while paused. Restoring requires org owner/admin privileges in the
dashboard — the CLI token on this machine gets a 403.

All code-side work is already done (see "Already done" below). What remains is
the project itself plus a few commands once it's live.

## Path A — restore the paused project (try this first)

1. Go to https://supabase.com/dashboard, open the **SchoolKit** project, and
   click **Restore project**. (If you don't see the button, a teammate who
   owns the `azqpzsyhzrpiuzpwzdfk` org must do it — likely whoever created the
   project on 2026-01-28.)
   - Free-tier projects paused >90 days may not be restorable in place; the
     dashboard will tell you. If restore fails → Path B.
2. Once it's ACTIVE, from the repo root:
   ```sh
   supabase link --project-ref inquvsymyujundkwxzju
   supabase config push                       # enables anonymous sign-ins
   supabase secrets set OPENAI_API_KEY=sk-... ELEVENLABS_API_KEY=...
   supabase functions deploy generate-design generate-tts translate-story
   supabase functions deploy get-shared-design --no-verify-jwt
   ```
3. The DB schema/data already exist in the restored project, so **do not**
   `db push` the migration — but do run the "missing pieces check" below,
   since a few objects only ever existed in the dashboard and should be
   verified: `user_bookmarks`, `resource_progress`, `stories.status/
   attempt_count/rejected_norms/previous_title/previous_body`,
   `profiles.voice_id/preferred_language`, and the `avatars`/`design-assets`
   buckets. Compare against `supabase/migrations/20260728000000_initial_schema.sql`
   and apply any missing statements in the SQL editor.
4. `.env` should already be correct (same URL/anon key). Verify with the
   healthcheck (below).

## Path B — recreate from scratch

1. Create a new project (dashboard, or:
   `supabase projects create schoolkit --org-id <org> --db-password <pw>`).
2. From the repo root:
   ```sh
   supabase link --project-ref <new-ref>
   supabase db push                           # applies the consolidated migration
   supabase config push                       # enables anonymous sign-ins
   supabase secrets set OPENAI_API_KEY=sk-... ELEVENLABS_API_KEY=...
   supabase functions deploy generate-design generate-tts translate-story
   supabase functions deploy get-shared-design --no-verify-jwt
   ```
3. Update `.env` with the new `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Dashboard → Settings → API).
4. If the app is deployed on Vercel, update the same two env vars there and
   redeploy.

## Manual dashboard checks (both paths)

- **Auth → Providers**: Email enabled; **Anonymous sign-ins** enabled
  (config push should handle this, but verify).
- **Auth → URL Configuration**: set the site URL / redirect URLs for the
  deployed web app (needed for email confirmation + password reset links).
- **Storage**: `avatars`, `journal-images`, `design-assets` buckets exist
  (migration creates them on Path B).

## Key rotation (do regardless of path)

- **Rotate the OpenAI key** that was in `.env` as `EXPO_PUBLIC_OPENAI_API_KEY`:
  it was wired into the client bundle by the (now-removed) bypass code and the
  repo has a `dist/` build. Treat it as exposed. Set the new key only as a
  Supabase secret (`OPENAI_API_KEY`).
- After rotating, remove `EXPO_PUBLIC_OPENAI_API_KEY` and `OPENAI_API_KEY`
  from `.env` — the client no longer reads them.
- `EXPO_PUBLIC_ELEVENLABS_API_KEY` in `.env` is also unused by the client now;
  the key belongs in the `ELEVENLABS_API_KEY` secret. Rotate if it was ever
  deployed in a public bundle.

## Verify end-to-end

Run the healthcheck (tests anonymous auth, all 17 tables, 3 buckets, and all
4 edge functions):
```sh
node --env-file=.env scripts/supabase-healthcheck.js
```
Then `npx tsc --noEmit` (should be 0 errors) and `npm run web` for a manual
smoke test: guest sign-in → onboarding → For You feed → stories → journal →
design editor (AI generate + share link).

## Already done (code side, 2026-07-28)

- `supabase/migrations/20260728000000_initial_schema.sql`: full consolidated
  schema — all 17 tables (incl. previously dashboard-only `user_bookmarks`,
  `resource_progress`, stories moderation columns, profile voice/language
  columns), RLS policies (moderator emails centralized in an
  `is_moderator()` SQL function), triggers, indexes, storage buckets +
  policies, and the realtime publication for `resources`.
- Edge functions hardened: `generate-design` no longer accepts a
  client-supplied API key; `generate-design`/`generate-tts`/`translate-story`
  now require a signed-in user (anonymous sessions count) and cap input sizes;
  all four functions are registered in `supabase/config.toml`.
- All four SUPABASE-BYPASS blocks reverted: real auth restored in
  `AuthContext`, design-load errors fail loudly instead of opening a blank
  doc, AI generation goes through the edge function again, design asset
  uploads re-enabled (and a bug fixed where the `design_assets` insert never
  executed).
- `services/elevenLabs.ts` and `app/story-detail.tsx` now send the user's
  session token to edge functions instead of the anon key.
- `lib/database.types.ts` rewritten to cover all 17 tables with the correct
  supabase-js v2 shape — TypeScript errors went from 113 to 0. Once the
  project is live you can optionally replace it with
  `supabase gen types typescript --project-id <ref>` (keep the app-level
  aliases at the bottom of the file).
- `.env.example` corrected: client needs only the Supabase URL + anon key.
