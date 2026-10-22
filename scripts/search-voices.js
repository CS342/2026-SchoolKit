// Search the ElevenLabs voice library for new guide candidates (services/elevenLabs.ts).
// Usage: node --env-file=.env scripts/search-voices.js [filters]
//
//   --language en|es        voice's native language
//   --accent nigerian       ElevenLabs accent label (e.g. indian, mexican, colombian, irish)
//   --gender female|male
//   --age young|middle_aged|old
//   --search "calm warm"    free text over name/description
//   --limit 20              results to show (max 100)
//   --also es               only voices ElevenLabs has also verified in this language
//                           (find bilingual guides: --language en --also es)
//   --json                  print raw JSON instead of a table
//   --verify                also generate a one-line sample through our generate-tts
//                           function per result (spends a few credits; confirms it plays)
//   --audit                 instead of searching, check every guide in the roster: still
//                           available, ElevenLabs' accent/gender/age, credit rate, and
//                           whether it's verified in each language we offer it in
//
// Needs ELEVENLABS_VOICES_KEY in .env: a key restricted to *read* voices only, separate
// from the TTS key in Supabase secrets, so this script can't spend credits on its own.
// Results are sorted by 1-year usage; voices already in the roster are marked ✓.
const fs = require('fs');
const path = require('path');

const KEY = process.env.ELEVENLABS_VOICES_KEY;
if (!KEY) {
  console.error('Missing ELEVENLABS_VOICES_KEY (run with --env-file=.env; see header comment)');
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const LANG_NAMES = { en: 'en', english: 'en', es: 'es', spanish: 'es' };
const params = new URLSearchParams({ page_size: String(Math.min(Number(opt('limit') ?? 20), 100)), sort: 'usage_character_count_1y' });
for (const [key, value] of [['language', LANG_NAMES[opt('language')] ?? opt('language')], ['accent', opt('accent')], ['gender', opt('gender')], ['age', opt('age')], ['search', opt('search')]]) {
  if (value) params.set(key, value);
}

const rosterSource = fs.readFileSync(path.join(__dirname, '..', 'services', 'elevenLabs.ts'), 'utf8');
const roster = new Set(rosterSource.match(/"[A-Za-z0-9]{20}"/g)?.map((s) => s.slice(1, -1)) ?? []);

/** Roster guides as written in VOICE_ROSTER: { id, name, accent, languages }. */
function rosterGuides() {
  const ids = Object.fromEntries([...rosterSource.matchAll(/^\s+([A-Z]+): "([A-Za-z0-9]{20})",/gm)].map((m) => [m[1], m[2]]));
  return [...rosterSource.matchAll(/\{ id: VOICES\.([A-Z]+), name: "([^"]+)",.*?accent: '(\w+)', languages: \[([^\]]*)\]/g)]
    .map((m) => ({ id: ids[m[1]], name: m[2], accent: m[3], languages: [...m[4].matchAll(/'(\w+)'/g)].map((l) => l[1]) }));
}

/** A voice's metadata: library voices via search-by-id (the per-voice endpoint 404s for
 *  some of them), ElevenLabs' built-in voices via /v1/voices. Null if it's gone. */
async function lookup(id) {
  const shared = await (await fetch(`https://api.elevenlabs.io/v1/shared-voices?search=${id}&page_size=5`, { headers: { 'xi-api-key': KEY } })).json();
  const hit = (shared.voices ?? []).find((v) => v.voice_id === id);
  if (hit) return { accent: hit.accent, gender: hit.gender, age: hit.age, rate: hit.rate, verified_languages: hit.verified_languages };
  const res = await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, { headers: { 'xi-api-key': KEY } });
  if (!res.ok) return null;
  const v = await res.json();
  return { ...v.labels, rate: v.sharing?.rate, verified_languages: v.verified_languages };
}

async function audit() {
  let problems = 0;
  for (const g of rosterGuides()) {
    const v = await lookup(g.id);
    if (!v) { problems++; console.log(`✗ ${g.name.padEnd(10)} ${g.id}  not found — withdrawn from the library?`); continue; }
    const labels = v;
    const verified = new Set((v.verified_languages ?? []).map((l) => l.language));
    const unverified = g.languages.filter((l) => verified.size && !verified.has(l));
    const rate = v.rate;
    const warn = [rate && rate !== 1 ? `${rate}x credits` : '', unverified.length ? `not verified in ${unverified.join('/')}` : ''].filter(Boolean);
    if (warn.length) problems++;
    console.log(`${warn.length ? '⚠' : '✓'} ${g.name.padEnd(10)} ${g.id}  ours: ${g.accent}/${g.languages.join('+')}  ElevenLabs: ${[labels.accent, labels.gender, labels.age].filter(Boolean).join(' · ')}${warn.length ? '  ⚠ ' + warn.join('; ') : ''}`);
  }
  console.log(`\n${problems ? `${problems} guide(s) need a look` : 'All guides OK'}`);
}

async function verify(voiceId, lang) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  verify.token ??= (await (await fetch(`${url}/auth/v1/signup`, { method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' }, body: '{}' })).json()).access_token;
  const text = lang === 'es' ? 'Hola, soy tu guía.' : "Hi, I'm your guide.";
  const res = await fetch(`${url}/functions/v1/generate-tts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${verify.token}`, apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });
  return res.ok ? 'plays' : `FAILS ${res.status} ${((await res.json().catch(() => ({}))).details ?? '')}`;
}

(async () => {
  if (flag('audit')) return audit();
  const also = LANG_NAMES[opt('also')] ?? opt('also');
  const limit = Number(params.get('page_size'));
  // --also filters client-side, so page through (up to 10 pages of 100) until enough match.
  if (also) params.set('page_size', '100');
  let voices = [];
  let total_count;
  for (let page = 0; page < (also ? 10 : 1) && voices.length < limit; page++) {
    params.set('page', String(page));
    const res = await fetch(`https://api.elevenlabs.io/v1/shared-voices?${params}`, { headers: { 'xi-api-key': KEY } });
    if (!res.ok) {
      console.error(`ElevenLabs ${res.status}:`, (await res.text()).slice(0, 300));
      process.exit(1);
    }
    const body = await res.json();
    total_count = body.total_count;
    voices.push(...(body.voices ?? []).filter((v) => !also || (v.verified_languages ?? []).some((l) => l.language === also)));
    if (!body.has_more) break;
  }
  voices = voices.slice(0, limit);
  if (flag('json')) { console.log(JSON.stringify(voices, null, 2)); return; }

  console.log(`${voices.length} of ${total_count ?? '?'} matches (${params})\n`);
  for (const v of voices) {
    // verified_languages repeats per model; show each en/es accent once, then a count of the rest.
    const verified = [...new Set((v.verified_languages ?? []).map((l) => `${l.language}${l.accent ? `/${l.accent}` : ''}`))];
    const ours = verified.filter((l) => /^(en|es)\b/.test(l));
    const others = verified.length - ours.length;
    const langs = [ours.join(', ') || v.language, others ? `+${others} other` : ''].filter(Boolean).join(' ');
    const rate = v.rate && v.rate !== 1 ? `  ⚠ ${v.rate}x credits` : '';
    const status = flag('verify') ? `  [${await verify(v.voice_id, LANG_NAMES[opt('language')] ?? 'en')}]` : '';
    console.log(`${roster.has(v.voice_id) ? '✓' : ' '} ${v.voice_id}  ${v.name}`);
    console.log(`    ${v.accent ?? '?'} · ${v.gender ?? '?'} · ${v.age ?? '?'} · ${v.descriptive ?? ''} · speaks: ${langs}${rate}${status}`);
    if (v.description) console.log(`    ${v.description.replace(/\s+/g, ' ').slice(0, 140)}`);
    if (v.preview_url) console.log(`    ▶ ${v.preview_url}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
