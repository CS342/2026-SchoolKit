import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// ─── Guide roster ────────────────────────────────────────────────────────────
// Each guide is an ElevenLabs voice plus a persona (name, description, background).
// Voices come from the ElevenLabs voice library, chosen for a calm, warm read and a
// native accent matching the guide's background. Library voices need a paid plan,
// and owners can withdraw them — verify any new id with generate-tts before adding.
//
// `languages` is what a guide reads natively. The multilingual model will read any
// language with any voice, but carries the voice's accent over, so the picker only
// offers a guide in its own languages. Bilingual guides appear in both.

export type VoiceLang = 'en' | 'es';

/** Where a guide's accent is from; labels live in locales under auth.voice.accents. */
export type AccentKey =
  | 'us' | 'uk' | 'nigeria' | 'india' | 'philippines' | 'singapore' | 'china'
  | 'middleEast' | 'jamaica' | 'italy' | 'ukraine' | 'poland' | 'portugal' | 'bilingual'
  | 'mexico' | 'colombia' | 'argentina' | 'peru' | 'chile' | 'venezuela' | 'cuba'
  | 'puertoRico' | 'spain' | 'latinAmerica';

export type VoiceData = {
  id: string;
  name: string;
  /** Short personality line, written per language the guide is offered in. */
  description: Partial<Record<VoiceLang, string>>;
  accent: AccentKey;
  languages: VoiceLang[];
  /** Avatar art, kept for when new art lands; hidden while SHOW_VOICE_AVATARS is false. */
  image?: any; // require() returns number or object
  initial: string; // shown in place of the avatar
  color: string;   // initial-avatar background colour
};

/** Avatars are hidden until art matching the new roster is made (assets kept in place). */
export const SHOW_VOICE_AVATARS = false;

// Voice IDs
export const VOICES = {
  // English
  PETER: "ZthjuvLPty3kTMaNKVKb",
  MIRA: "ZqvIIuD5aI9JFejebHiH",
  IMANI: "u0REnIJvUgcGQYW2Ux8K",
  TUNDE: "U7wWSnxIJwCjioxt86mk",
  PRIYA: "ftDdhfYtmfGP0tFlBYA1",
  WEI: "h1i3CVVBUuF6s46cxUGG",
  LAYLA: "aCChyB4P5WEomwRsOKRh",
  ANDRE: "CMUEYyUNA4TrldQy4HLM",
  ADAEZE: "QqgW7xZ3mjIAgZVFMwJz",
  ARJUN: "1U02n4nD6AdIZ9CjF053",
  LIGAYA: "T2OtqAWGDq4sh6HX3MwH",
  OMAR: "tlz2I4zMDRDFMFFHKQv6",
  SIMONE: "Q9Vh1SycNbxygVIup9vI",
  TOMASZ: "8jMNCczgLGJQ3uVTkRhG",
  MEI: "6qpxBH5KUSDb40bij36w",
  BILL: "pqHfZKP75CvOlQylNhV4",
  GIULIA: "75MqelvgFq5upx0r44WK",
  TIAGO: "IpCcRCVYm2nsZJjBFn4H",
  OLENA: "UNdMSgUJcBHXfJ1iKmVI",
  HOPE: "OYTbf65OHHFELVut7v2H",
  GEORGE: "JBFqnCBsd6RMkjVDRZzb",
  LILY: "pFZP5JQG7iQjIQuC4Bku",
  // Bilingual
  LUCIA: "tvWD4i07Hg5L4uEvbxYV",
  VICTOR: "cMKZRsVE5V7xf6qCp9fF",
  // Spanish
  ELENA: "2rigMbVWLdqtBSCahJFX",
  RAFAEL: "JgmJ33RuT4tPQOENamHR",
  XIMENA: "m7yTemJqdIqrcNleANfX",
  ANDRES: "W1hAcdh0RNsPYUA7fkJh",
  DANIELA: "b2htR0pMe28pYwCY9gnP",
  MATEO: "rBqbBncz61jpuaOTI1GW",
  FLORENCIA: "bN1bDXgDIGX5lw0rtY2B",
  GABRIEL: "wF7p6L9pwDvZVDoqbRiE",
  YANELIS: "tGaqHUoNeMUctS0nje4o",
  MARTIN: "ByVRQtaK1WDOvTmP1PKO",
  ROSA: "WrKMouCyVAmTemNLZkOw",
  JAVIER: "zwDSHuqO0tEVwNUuHmR1",
  CATALINA: "prblQcKOdF08ozhxP2mk",
  CARMEN: "UOIqAnmS11Reiei1Ytkc",
};

const en = (description: string) => ({ en: description });
const es = (description: string) => ({ es: description });

/** Display order — interleaved so no background or gender clusters at the top; each
 *  language's default leads its list, and bilingual guides close both. */
export const VOICE_ROSTER: VoiceData[] = [
  // ── English ───────────────────────────────────
  { id: VOICES.PETER, name: "Peter", description: en("Confident & Reliable"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_peter.png"), initial: "P", color: "#5B8DEF" },
  { id: VOICES.IMANI, name: "Imani", description: en("Caring & Warm"), accent: 'us', languages: ['en'], initial: "I", color: "#EC4899" },
  { id: VOICES.TUNDE, name: "Tunde", description: en("Warm & Calm"), accent: 'nigeria', languages: ['en'], initial: "T", color: "#10B981" },
  { id: VOICES.PRIYA, name: "Priya", description: en("Soft & Engaging"), accent: 'india', languages: ['en'], initial: "P", color: "#F59E0B" },
  { id: VOICES.WEI, name: "Wei", description: en("Gentle & Friendly"), accent: 'china', languages: ['en'], initial: "W", color: "#6366F1" },
  { id: VOICES.LAYLA, name: "Layla", description: en("Inviting & Polished"), accent: 'middleEast', languages: ['en'], initial: "L", color: "#C084FC" },
  { id: VOICES.ANDRE, name: "Andre", description: en("Warm & Optimistic"), accent: 'us', languages: ['en'], initial: "A", color: "#0EA5E9" },
  { id: VOICES.ADAEZE, name: "Adaeze", description: en("Calm & Clear"), accent: 'nigeria', languages: ['en'], initial: "A", color: "#F97316" },
  { id: VOICES.ARJUN, name: "Arjun", description: en("Smooth & Gentle"), accent: 'india', languages: ['en'], initial: "A", color: "#14B8A6" },
  { id: VOICES.LIGAYA, name: "Ligaya", description: en("Wise Storyteller"), accent: 'philippines', languages: ['en'], initial: "L", color: "#A78BFA" },
  { id: VOICES.OMAR, name: "Omar", description: en("Empathetic & Natural"), accent: 'middleEast', languages: ['en'], initial: "O", color: "#64748B" },
  { id: VOICES.SIMONE, name: "Simone", description: en("Calm & Grounded"), accent: 'jamaica', languages: ['en'], initial: "S", color: "#22C55E" },
  { id: VOICES.TOMASZ, name: "Tomasz", description: en("Calm & Approachable"), accent: 'poland', languages: ['en'], initial: "T", color: "#818CF8" },
  { id: VOICES.MEI, name: "Mei", description: en("Warm & Calm"), accent: 'singapore', languages: ['en'], initial: "M", color: "#FB923C" },
  { id: VOICES.BILL, name: "Bill", description: en("Wise & Comforting"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_bill.png"), initial: "B", color: "#334155" },
  { id: VOICES.GIULIA, name: "Giulia", description: en("Soothing & Soft"), accent: 'italy', languages: ['en'], initial: "G", color: "#F472B6" },
  { id: VOICES.TIAGO, name: "Tiago", description: en("Hopeful & Calm"), accent: 'portugal', languages: ['en'], initial: "T", color: "#5B8DEF" },
  { id: VOICES.OLENA, name: "Olena", description: en("Natural & Friendly"), accent: 'ukraine', languages: ['en'], initial: "O", color: "#10B981" },
  { id: VOICES.MIRA, name: "Mira", description: en("Soothing & Calming"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_mira.png"), initial: "M", color: "#A78BFA" },
  { id: VOICES.GEORGE, name: "George", description: en("Warm Storyteller"), accent: 'uk', languages: ['en'], image: require("../assets/images/voice_george.png"), initial: "G", color: "#0EA5E9" },
  { id: VOICES.HOPE, name: "Hope", description: en("Bright & Uplifting"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_hope.png"), initial: "H", color: "#F59E0B" },
  { id: VOICES.LILY, name: "Lily", description: en("Soft & Velvety"), accent: 'uk', languages: ['en'], image: require("../assets/images/voice_lily.png"), initial: "L", color: "#C084FC" },
  // ── Spanish ───────────────────────────────────
  { id: VOICES.ELENA, name: "Elena", description: es("Sabia y serena"), accent: 'latinAmerica', languages: ['es'], initial: "E", color: "#A78BFA" },
  { id: VOICES.RAFAEL, name: "Rafael", description: es("Cálido y cercano"), accent: 'mexico', languages: ['es'], initial: "R", color: "#5B8DEF" },
  { id: VOICES.XIMENA, name: "Ximena", description: es("Tranquila y clara"), accent: 'mexico', languages: ['es'], initial: "X", color: "#F59E0B" },
  { id: VOICES.ANDRES, name: "Andrés", description: es("Cálido y profundo"), accent: 'colombia', languages: ['es'], initial: "A", color: "#10B981" },
  { id: VOICES.DANIELA, name: "Daniela", description: es("Natural y conversadora"), accent: 'colombia', languages: ['es'], initial: "D", color: "#F472B6" },
  { id: VOICES.MATEO, name: "Mateo", description: es("Sereno y melodioso"), accent: 'peru', languages: ['es'], initial: "M", color: "#14B8A6" },
  { id: VOICES.FLORENCIA, name: "Florencia", description: es("Cálida y clara"), accent: 'argentina', languages: ['es'], initial: "F", color: "#FB923C" },
  { id: VOICES.GABRIEL, name: "Gabriel", description: es("Claro y didáctico"), accent: 'venezuela', languages: ['es'], initial: "G", color: "#64748B" },
  { id: VOICES.YANELIS, name: "Yanelis", description: es("Relajada y cálida"), accent: 'cuba', languages: ['es'], initial: "Y", color: "#C084FC" },
  { id: VOICES.MARTIN, name: "Martín", description: es("Relajado y amable"), accent: 'argentina', languages: ['es'], initial: "M", color: "#0EA5E9" },
  { id: VOICES.ROSA, name: "Rosa", description: es("Tranquila y gentil"), accent: 'peru', languages: ['es'], initial: "R", color: "#EC4899" },
  { id: VOICES.JAVIER, name: "Javier", description: es("Amigable y natural"), accent: 'puertoRico', languages: ['es'], initial: "J", color: "#22C55E" },
  { id: VOICES.CATALINA, name: "Catalina", description: es("Cálida y segura"), accent: 'chile', languages: ['es'], initial: "C", color: "#818CF8" },
  { id: VOICES.CARMEN, name: "Carmen", description: es("Natural y clara"), accent: 'spain', languages: ['es'], initial: "C", color: "#F97316" },
  // ── Bilingual ─────────────────────────────────
  { id: VOICES.LUCIA, name: "Lucía", description: { en: "Friendly & Calm", es: "Amable y tranquila" }, accent: 'bilingual', languages: ['en', 'es'], initial: "L", color: "#EC4899" },
  { id: VOICES.VICTOR, name: "Víctor", description: { en: "Calm & Soft-spoken", es: "Tranquilo y suave" }, accent: 'bilingual', languages: ['en', 'es'], initial: "V", color: "#6366F1" },
];

export const VOICE_META: Record<string, VoiceData> = Object.fromEntries(VOICE_ROSTER.map((v) => [v.id, v]));

/** The guide new users (or users whose guide doesn't read their language) get. */
export const DEFAULT_VOICE: Record<VoiceLang, string> = { en: VOICES.PETER, es: VOICES.ELENA };

export const toVoiceLang = (language: string | null | undefined): VoiceLang =>
  language === 'spanish' || language === 'es' ? 'es' : 'en';

/** Guides offered for a language, in display order. */
export const voicesFor = (lang: VoiceLang) => VOICE_ROSTER.filter((v) => v.languages.includes(lang));

/** The voice to read `lang` with: the chosen guide if it reads that language natively,
 *  else that language's default. Also maps retired voice ids (no longer in the roster)
 *  to the default, so saved preferences from older rosters keep working. */
export function resolveVoice(voiceId: string | null | undefined, lang: VoiceLang): string {
  const meta = voiceId ? VOICE_META[voiceId] : undefined;
  return meta && meta.languages.includes(lang) ? meta.id : DEFAULT_VOICE[lang];
}

/** A guide's description in the UI language, falling back to whichever it has. */
export const voiceDescription = (v: VoiceData, lang: VoiceLang) => v.description[lang] ?? v.description.en ?? v.description.es ?? '';

import { supabaseUrl, supabase, supabaseAnonKey } from '../lib/supabase';

export const generateSpeech = async (text: string, voiceId: string = DEFAULT_VOICE.en): Promise<string | null> => {
  try {
    // On native, reuse audio already cached on this device before spending a request
    let filePath: string | null = null;
    if (Platform.OS !== 'web') {
      const hash = text.split("").reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      filePath = `${FileSystem.cacheDirectory}speech_${voiceId}_${hash}_${text.length}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) return filePath;
    }

    // The edge function requires a signed-in user; fall back to the anon key
    // only if no session exists (the function will reject it with a 401).
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? supabaseAnonKey;

    console.log('Sending TTS request to Edge Function...');
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ text, voiceId }),
    });

    console.log('TTS Response status:', response.status);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.error('TTS Proxy Error response:', errorJson);
      throw new Error(errorJson.message || errorJson.error || `TTS service returned ${response.status}`);
    }

    const audioBlob = await response.blob();

    // On web: return a blob URL directly (FileSystem not available)
    if (!filePath) {
      return URL.createObjectURL(audioBlob);
    }

    // On native: cache to FileSystem and return file path
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(filePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          resolve(filePath);
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(audioBlob);
    });

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
