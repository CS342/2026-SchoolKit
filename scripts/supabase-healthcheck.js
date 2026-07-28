// Live Supabase health check for SchoolKit.
// Usage: node --env-file=.env scripts/supabase-healthcheck.js
// Tests anonymous auth, every table the app queries, storage buckets,
// and edge function reachability (minimal probes — no OpenAI/ElevenLabs spend).
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (run with --env-file=.env)');
  process.exit(1);
}
const supabase = createClient(url, key);

const TABLES = [
  'profiles', 'resources', 'designs', 'design_assets', 'journals', 'journal_pages',
  'stories', 'story_comments', 'story_likes', 'story_bookmarks', 'story_reports',
  'comment_reports', 'comment_likes', 'resource_progress', 'user_bookmarks',
  'earned_accomplishments', 'user_questions',
];
const FUNCTIONS = ['generate-design', 'generate-tts', 'get-shared-design', 'translate-story'];
const BUCKETS = ['journal-images', 'avatars', 'design-assets'];

(async () => {
  console.log('URL:', url);
  let failures = 0;

  console.log('\n== AUTH ==');
  const { data: auth, error: authErr } = await supabase.auth.signInAnonymously();
  if (authErr) {
    failures++;
    console.log(`anonymous sign-in FAIL: ${authErr.message}`);
  } else {
    console.log(`anonymous sign-in OK (uid ${auth.user.id.slice(0, 8)}…)`);
  }

  console.log('\n== TABLES (select as anon-authed user) ==');
  for (const t of TABLES) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) failures++;
    console.log(`${t.padEnd(24)} ${error ? 'ERROR: ' + error.message : 'OK (visible rows: ' + count + ')'}`);
  }

  console.log('\n== STORAGE ==');
  for (const b of BUCKETS) {
    const { error } = await supabase.storage.from(b).list('', { limit: 1 });
    if (error) failures++;
    console.log(`${b.padEnd(24)} ${error ? 'ERROR: ' + error.message : 'OK'}`);
  }

  // Live functions answer minimal probes with 4xx; missing ones 404/unreachable.
  console.log('\n== EDGE FUNCTIONS ==');
  const session = (await supabase.auth.getSession()).data.session;
  for (const f of FUNCTIONS) {
    try {
      const res = await fetch(`${url}/functions/v1/${f}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session ? session.access_token : key}`,
          apikey: key,
        },
        body: JSON.stringify({}),
      });
      const ok = res.status < 500 && res.status !== 404;
      if (!ok) failures++;
      const text = (await res.text()).slice(0, 120).replace(/\s+/g, ' ');
      console.log(`${f.padEnd(20)} HTTP ${res.status} ${ok ? '(deployed)' : '(NOT DEPLOYED?)'} — ${text}`);
    } catch (e) {
      failures++;
      console.log(`${f.padEnd(20)} UNREACHABLE: ${e.message}`);
    }
  }

  await supabase.auth.signOut();
  console.log(failures ? `\n${failures} check(s) FAILED.` : '\nAll checks passed.');
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
