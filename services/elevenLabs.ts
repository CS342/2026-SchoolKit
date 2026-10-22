import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabaseUrl, supabase, supabaseAnonKey } from '../lib/supabase';

// ─── Guide roster ────────────────────────────────────────────────────────────
// Each guide is an ElevenLabs voice plus a persona (name, description, background).
// Voices come from the ElevenLabs voice library, chosen for a calm, warm read and a
// native accent matching the guide's background. Library voices need a paid plan,
// and owners can withdraw them — verify any new id with generate-tts before adding.
//
// `languages` is what a guide reads natively. The multilingual model will read any
// language with any voice, but carries the voice's accent over, so the picker only
// offers a guide in its own languages. Bilingual guides appear in both — only list a
// language ElevenLabs has verified for the voice. `node --env-file=.env
// scripts/search-voices.js --audit` checks all of this against ElevenLabs.

export type VoiceLang = 'en' | 'es';

/** Where a guide's accent is from; labels live in locales under auth.voice.accents. */
export type AccentKey =
  | 'us' | 'uk' | 'nigeria' | 'india' | 'philippines' | 'singapore' | 'china'
  | 'middleEast' | 'jamaica' | 'italy' | 'ukraine' | 'poland' | 'portugal' | 'bilingual'
  | 'mexico' | 'colombia' | 'argentina' | 'peru' | 'chile' | 'venezuela' | 'cuba'
  | 'puertoRico' | 'spain' | 'latinAmerica'
  | 'usSouth' | 'canada' | 'haiti' | 'trinidad' | 'hawaii' | 'maori' | 'newZealand'
  | 'australia' | 'kenya' | 'ghana' | 'southAfrica' | 'korea' | 'japan' | 'malaysia'
  | 'indonesia' | 'pakistan' | 'bangladesh' | 'nepal' | 'vietnam' | 'egypt' | 'iran'
  | 'turkey' | 'ireland' | 'scotland' | 'wales' | 'romania' | 'croatia' | 'russia'
  | 'dominicanRepublic' | 'guatemala' | 'honduras' | 'costaRica' | 'panama' | 'ecuador'
  | 'uruguay' | 'paraguay' | 'canaryIslands';

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
  MAE: "0rEo3eAjssGDUCXHYENf",
  MARCUS: "hILdTfuUq4LRBMrxHERr",
  JASMINE: "TJz0pp7opUc4JvMXMXob",
  AVERY: "FVQMzxJGPUBtfz1Azdoy",
  GRAHAM: "WiSG5mEVOrVd3iKQcGZG",
  JEAN: "uOTaQ3KfK7rOT2MpeNyr",
  ROHAN: "fx5le4FFKvx12m8z2cAr",
  LEILANI: "0f4r1bLyisMv67ocsZMl",
  KEKOA: "Eqw4o5WB3NXnOBL9xr97",
  TAMA: "cwdmeUHVFO9BmZhUar4w",
  SOPHIE: "pcKdPWtbF6bM9o7NHjCI",
  GRACE: "56bWURjYFHyYyVf490Dp",
  JADE: "luVEyhT3CocLZaLBps8v",
  LACHLAN: "SCbIlR40EEyW2I6quW1h",
  WANJIRU: "hrMENUPSbAbVQk6jkV5k",
  OTIENO: "Tq0wwawNLxDlPBzvUgNg",
  AKOSUA: "sR34GJdHBDjDlecWZUFt",
  KWAME: "dInDfi2rwzYkrgMV18kn",
  LINDIWE: "atf1ppeJGCYFBlCLZ26e",
  THABO: "ddNwxTGW1Qc7ZuSevaHF",
  JIWOO: "Zjb2Dbq5IbWDKpVOllIo",
  MINJUN: "LoXeQQJXcdhPF6vk2Phy",
  YUKI: "u6a6bRv82Zfi9NzoIqvt",
  KENJI: "Gwf9mOMZG8bkPbhsbOVc",
  AISYAH: "15Y62ZlO8it2f5wduybx",
  BUDI: "9NYgcIL78AKSeryIsaGH",
  KARTHIK: "rgltZvTfiMmgWweZhh7n",
  AYESHA: "HHJcozd8AgLT2VmACyDV",
  BILAL: "hV1InkNCNhrjdXJO4OkG",
  NUSRAT: "SYVQhjMSUvWA1w0HkidA",
  RAHIM: "hll21KcaaV8dqm92ernf",
  SUMAN: "wSqJHoFr4miaDhsEE4TG",
  LINH: "ZVr9F7qrezAMJU6AxnPD",
  MINH: "EliyIyR0jlrh5WJTn4Vz",
  PAOLO: "iSwrnpET4L5IyyN7X7UT",
  KARIM: "IES4nrmZdUBHByLBde0P",
  SHIRIN: "WwAjIyMBDBNl1dvId9Xe",
  DARIUSH: "rNb3hdSf0n4ROIbYC8Bl",
  ELIF: "WN6vSvkPbV9z2UoBJRYW",
  EMRE: "Aq1CvMcf5BlfAAgoxyj2",
  AOIFE: "t6WJWTYTryhcQnrBHdCr",
  CIAN: "qwaVDEGNsBllYcZO1ZOJ",
  EILIDH: "TVmbglAk3F1GkiCoOq47",
  CALLUM: "gUbIduqGzBP438teh4ZA",
  FFION: "73fZMjboCm1aBVyxTbBp",
  RHYS: "aKQdyEogZx5VoND0oujS",
  IOANA: "54YYBuRuAG6KJooiOhFI",
  ANDREI: "8WRfTpaUoqZSfTerOXzI",
  LUKA: "DS5zQQzzakuVi8Mip84y",
  ANYA: "jmuki9rdPecaWw4g7Exe",
  // Bilingual
  LUCIA: "9FuMHon7Kyk1AGgnR8C2",
  VICTOR: "ZwLTvq6uCfb4W00YFl7F",
  TERESA: "A0g6t0RQc9zkMPsGNEIG",
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
  PAULA: "kcQkGnn0HAT2JRDQ4Ljp",
  TOMAS: "94zOad0g7T7K4oa7zhDq",
  HECTOR: "Yb8JGzcZyW5YYzenhRCm",
  VALERIA: "rixsIpPlTphvsJd2mI03",
  JOAQUIN: "gbTn1bmCvNgk0QEAVyfM",
  GLORIA: "szJ1F5SgxGkjGanyygoW",
  YASMIN: "NNLcf0MlUZirnZQqeMJ8",
  ORLANDO: "1hB7zCGWj11SeMuBseeI",
  MARISOL: "MbMvLOFbicjtQwgx0j2r",
  ALEJANDRA: "z1o4UXhrDfZ9yFTF1GMZ",
  MARIELA: "rDUarjldKdij6COlETSO",
  RUBEN: "5DY4cCSxmZ3HkhapcISO",
  MARIANA: "YGs0nghTKhDWpBrHx02x",
  FELIPE: "yytxkT3pNVMWDHn3KXrY",
  BELEN: "2QjYVazROABcdPGvht9o",
  FACUNDO: "AvFwmpNEfWWu5mtNDqhH",
  SEBASTIAN: "Lb6lk8BScSZnmQ7fS97u",
  MANUEL: "syjZiIvIUSwKREBfMpKZ",
  ROCIO: "SbxCN6LQhBInYaeKjhhW",
  NAYRA: "OgAcRHdVLdLpidpAVSz8",
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
  { id: VOICES.OMAR, name: "Omar", description: en("Empathetic & Natural"), accent: 'middleEast', languages: ['en'], initial: "O", color: "#94A3B8" },
  { id: VOICES.SIMONE, name: "Simone", description: en("Calm & Grounded"), accent: 'jamaica', languages: ['en'], initial: "S", color: "#22C55E" },
  { id: VOICES.TOMASZ, name: "Tomasz", description: en("Calm & Approachable"), accent: 'poland', languages: ['en'], initial: "T", color: "#818CF8" },
  { id: VOICES.MEI, name: "Mei", description: en("Warm & Calm"), accent: 'singapore', languages: ['en'], initial: "M", color: "#FB923C" },
  { id: VOICES.BILL, name: "Bill", description: en("Wise & Comforting"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_bill.png"), initial: "B", color: "#60A5FA" },
  { id: VOICES.GIULIA, name: "Giulia", description: en("Soothing & Soft"), accent: 'italy', languages: ['en'], initial: "G", color: "#F472B6" },
  { id: VOICES.TIAGO, name: "Tiago", description: en("Hopeful & Calm"), accent: 'portugal', languages: ['en'], initial: "T", color: "#5B8DEF" },
  { id: VOICES.OLENA, name: "Olena", description: en("Natural & Friendly"), accent: 'ukraine', languages: ['en'], initial: "O", color: "#10B981" },
  { id: VOICES.MIRA, name: "Mira", description: en("Soothing & Calming"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_mira.png"), initial: "M", color: "#A78BFA" },
  { id: VOICES.GEORGE, name: "George", description: en("Warm Storyteller"), accent: 'uk', languages: ['en'], image: require("../assets/images/voice_george.png"), initial: "G", color: "#0EA5E9" },
  { id: VOICES.HOPE, name: "Hope", description: en("Bright & Uplifting"), accent: 'us', languages: ['en'], image: require("../assets/images/voice_hope.png"), initial: "H", color: "#F59E0B" },
  { id: VOICES.LILY, name: "Lily", description: en("Soft & Velvety"), accent: 'uk', languages: ['en'], image: require("../assets/images/voice_lily.png"), initial: "L", color: "#C084FC" },
  { id: VOICES.MAE, name: "Mae", description: en("Wise & Warm"), accent: 'usSouth', languages: ['en'], initial: "M", color: "#5B8DEF" },
  { id: VOICES.MARCUS, name: "Marcus", description: en("Deep & Calm"), accent: 'us', languages: ['en'], initial: "M", color: "#EC4899" },
  { id: VOICES.JASMINE, name: "Jasmine", description: en("Bright & Grounded"), accent: 'us', languages: ['en'], initial: "J", color: "#10B981" },
  { id: VOICES.AVERY, name: "Avery", description: en("Gentle & Engaging"), accent: 'canada', languages: ['en'], initial: "A", color: "#F59E0B" },
  { id: VOICES.GRAHAM, name: "Graham", description: en("Calm Storyteller"), accent: 'canada', languages: ['en'], initial: "G", color: "#6366F1" },
  { id: VOICES.JEAN, name: "Jean", description: en("Calm & Thoughtful"), accent: 'haiti', languages: ['en'], initial: "J", color: "#C084FC" },
  { id: VOICES.ROHAN, name: "Rohan", description: en("Hopeful & Warm"), accent: 'trinidad', languages: ['en'], initial: "R", color: "#0EA5E9" },
  { id: VOICES.LEILANI, name: "Leilani", description: en("Calm & Kind"), accent: 'hawaii', languages: ['en'], initial: "L", color: "#F97316" },
  { id: VOICES.KEKOA, name: "Kekoa", description: en("Relaxed & Natural"), accent: 'hawaii', languages: ['en'], initial: "K", color: "#14B8A6" },
  { id: VOICES.TAMA, name: "Tama", description: en("Rich & Inviting"), accent: 'maori', languages: ['en'], initial: "T", color: "#A78BFA" },
  { id: VOICES.SOPHIE, name: "Sophie", description: en("Warm & Inviting"), accent: 'newZealand', languages: ['en'], initial: "S", color: "#94A3B8" },
  { id: VOICES.GRACE, name: "Grace", description: en("Warm & Sweet"), accent: 'australia', languages: ['en'], initial: "G", color: "#22C55E" },
  { id: VOICES.JADE, name: "Jade", description: en("Calm & Gentle"), accent: 'australia', languages: ['en'], initial: "J", color: "#818CF8" },
  { id: VOICES.LACHLAN, name: "Lachlan", description: en("Relaxed & Easygoing"), accent: 'australia', languages: ['en'], initial: "L", color: "#FB923C" },
  { id: VOICES.WANJIRU, name: "Wanjiru", description: en("Calm & Soulful"), accent: 'kenya', languages: ['en'], initial: "W", color: "#60A5FA" },
  { id: VOICES.OTIENO, name: "Otieno", description: en("Calm & Steady"), accent: 'kenya', languages: ['en'], initial: "O", color: "#F472B6" },
  { id: VOICES.AKOSUA, name: "Akosua", description: en("Natural & Soft"), accent: 'ghana', languages: ['en'], initial: "A", color: "#5B8DEF" },
  { id: VOICES.KWAME, name: "Kwame", description: en("Calm & Clear"), accent: 'ghana', languages: ['en'], initial: "K", color: "#EC4899" },
  { id: VOICES.LINDIWE, name: "Lindiwe", description: en("Calm & Clear"), accent: 'southAfrica', languages: ['en'], initial: "L", color: "#10B981" },
  { id: VOICES.THABO, name: "Thabo", description: en("Friendly & Deep"), accent: 'southAfrica', languages: ['en'], initial: "T", color: "#F59E0B" },
  { id: VOICES.JIWOO, name: "Ji-woo", description: en("Calm & Natural"), accent: 'korea', languages: ['en'], initial: "J", color: "#6366F1" },
  { id: VOICES.MINJUN, name: "Min-jun", description: en("Warm & Confident"), accent: 'korea', languages: ['en'], initial: "M", color: "#C084FC" },
  { id: VOICES.YUKI, name: "Yuki", description: en("Calm & Clear"), accent: 'japan', languages: ['en'], initial: "Y", color: "#0EA5E9" },
  { id: VOICES.KENJI, name: "Kenji", description: en("Deep & Steady"), accent: 'japan', languages: ['en'], initial: "K", color: "#F97316" },
  { id: VOICES.AISYAH, name: "Aisyah", description: en("Soothing & Gentle"), accent: 'malaysia', languages: ['en'], initial: "A", color: "#14B8A6" },
  { id: VOICES.BUDI, name: "Budi", description: en("Calm & Upbeat"), accent: 'indonesia', languages: ['en'], initial: "B", color: "#A78BFA" },
  { id: VOICES.KARTHIK, name: "Karthik", description: en("Clear & Warm"), accent: 'india', languages: ['en'], initial: "K", color: "#94A3B8" },
  { id: VOICES.AYESHA, name: "Ayesha", description: en("Calm & Clear"), accent: 'pakistan', languages: ['en'], initial: "A", color: "#22C55E" },
  { id: VOICES.BILAL, name: "Bilal", description: en("Calm & Articulate"), accent: 'pakistan', languages: ['en'], initial: "B", color: "#818CF8" },
  { id: VOICES.NUSRAT, name: "Nusrat", description: en("Warm & Articulate"), accent: 'bangladesh', languages: ['en'], initial: "N", color: "#FB923C" },
  { id: VOICES.RAHIM, name: "Rahim", description: en("Warm & Natural"), accent: 'bangladesh', languages: ['en'], initial: "R", color: "#60A5FA" },
  { id: VOICES.SUMAN, name: "Suman", description: en("Calm & Warm"), accent: 'nepal', languages: ['en'], initial: "S", color: "#F472B6" },
  { id: VOICES.LINH, name: "Linh", description: en("Clear & Warm"), accent: 'vietnam', languages: ['en'], initial: "L", color: "#5B8DEF" },
  { id: VOICES.MINH, name: "Minh", description: en("Easygoing & Natural"), accent: 'vietnam', languages: ['en'], initial: "M", color: "#EC4899" },
  { id: VOICES.PAOLO, name: "Paolo", description: en("Light & Pleasant"), accent: 'philippines', languages: ['en'], initial: "P", color: "#10B981" },
  { id: VOICES.KARIM, name: "Karim", description: en("Warm & Cheerful"), accent: 'egypt', languages: ['en'], initial: "K", color: "#F59E0B" },
  { id: VOICES.SHIRIN, name: "Shirin", description: en("Warm & Soothing"), accent: 'iran', languages: ['en'], initial: "S", color: "#6366F1" },
  { id: VOICES.DARIUSH, name: "Dariush", description: en("Natural Storyteller"), accent: 'iran', languages: ['en'], initial: "D", color: "#C084FC" },
  { id: VOICES.ELIF, name: "Elif", description: en("Gentle & Warm"), accent: 'turkey', languages: ['en'], initial: "E", color: "#0EA5E9" },
  { id: VOICES.EMRE, name: "Emre", description: en("Friendly & Steady"), accent: 'turkey', languages: ['en'], initial: "E", color: "#F97316" },
  { id: VOICES.AOIFE, name: "Aoife", description: en("Warm & Engaging"), accent: 'ireland', languages: ['en'], initial: "A", color: "#14B8A6" },
  { id: VOICES.CIAN, name: "Cian", description: en("Warm & Trustworthy"), accent: 'ireland', languages: ['en'], initial: "C", color: "#A78BFA" },
  { id: VOICES.EILIDH, name: "Eilidh", description: en("Soft & Warm"), accent: 'scotland', languages: ['en'], initial: "E", color: "#94A3B8" },
  { id: VOICES.CALLUM, name: "Callum", description: en("Friendly & Calm"), accent: 'scotland', languages: ['en'], initial: "C", color: "#22C55E" },
  { id: VOICES.FFION, name: "Ffion", description: en("Soft & Friendly"), accent: 'wales', languages: ['en'], initial: "F", color: "#818CF8" },
  { id: VOICES.RHYS, name: "Rhys", description: en("Calm & Grounded"), accent: 'wales', languages: ['en'], initial: "R", color: "#FB923C" },
  { id: VOICES.IOANA, name: "Ioana", description: en("Soothing & Calm"), accent: 'romania', languages: ['en'], initial: "I", color: "#60A5FA" },
  { id: VOICES.ANDREI, name: "Andrei", description: en("Clear & Warm"), accent: 'romania', languages: ['en'], initial: "A", color: "#F472B6" },
  { id: VOICES.LUKA, name: "Luka", description: en("Natural & Calm"), accent: 'croatia', languages: ['en'], initial: "L", color: "#5B8DEF" },
  { id: VOICES.ANYA, name: "Anya", description: en("Calm & Warm"), accent: 'russia', languages: ['en'], initial: "A", color: "#EC4899" },
  // ── Spanish ───────────────────────────────────
  { id: VOICES.ELENA, name: "Elena", description: es("Sabia y serena"), accent: 'latinAmerica', languages: ['es'], initial: "E", color: "#A78BFA" },
  { id: VOICES.RAFAEL, name: "Rafael", description: es("Cálido y cercano"), accent: 'mexico', languages: ['es'], initial: "R", color: "#5B8DEF" },
  { id: VOICES.XIMENA, name: "Ximena", description: es("Tranquila y clara"), accent: 'mexico', languages: ['es'], initial: "X", color: "#F59E0B" },
  { id: VOICES.ANDRES, name: "Andrés", description: es("Cálido y profundo"), accent: 'colombia', languages: ['es'], initial: "A", color: "#10B981" },
  { id: VOICES.DANIELA, name: "Daniela", description: es("Natural y conversadora"), accent: 'colombia', languages: ['es'], initial: "D", color: "#F472B6" },
  { id: VOICES.MATEO, name: "Mateo", description: es("Sereno y melodioso"), accent: 'peru', languages: ['es'], initial: "M", color: "#14B8A6" },
  { id: VOICES.FLORENCIA, name: "Florencia", description: es("Cálida y clara"), accent: 'argentina', languages: ['es'], initial: "F", color: "#FB923C" },
  { id: VOICES.GABRIEL, name: "Gabriel", description: es("Claro y didáctico"), accent: 'venezuela', languages: ['es'], initial: "G", color: "#94A3B8" },
  { id: VOICES.YANELIS, name: "Yanelis", description: es("Relajada y cálida"), accent: 'cuba', languages: ['es'], initial: "Y", color: "#C084FC" },
  { id: VOICES.MARTIN, name: "Martín", description: es("Relajado y amable"), accent: 'argentina', languages: ['es'], initial: "M", color: "#0EA5E9" },
  { id: VOICES.ROSA, name: "Rosa", description: es("Tranquila y gentil"), accent: 'peru', languages: ['es'], initial: "R", color: "#EC4899" },
  { id: VOICES.JAVIER, name: "Javier", description: es("Amigable y natural"), accent: 'puertoRico', languages: ['es'], initial: "J", color: "#22C55E" },
  { id: VOICES.CATALINA, name: "Catalina", description: es("Cálida y segura"), accent: 'chile', languages: ['es'], initial: "C", color: "#818CF8" },
  { id: VOICES.CARMEN, name: "Carmen", description: es("Natural y clara"), accent: 'spain', languages: ['es'], initial: "C", color: "#F97316" },
  { id: VOICES.PAULA, name: "Paula", description: es("Cálida y amable"), accent: 'latinAmerica', languages: ['es'], initial: "P", color: "#10B981" },
  { id: VOICES.TOMAS, name: "Tomás", description: es("Tranquilo y conversador"), accent: 'latinAmerica', languages: ['es'], initial: "T", color: "#F59E0B" },
  { id: VOICES.HECTOR, name: "Héctor", description: es("Sabio y sereno"), accent: 'latinAmerica', languages: ['es'], initial: "H", color: "#6366F1" },
  { id: VOICES.VALERIA, name: "Valeria", description: es("Tranquila y equilibrada"), accent: 'mexico', languages: ['es'], initial: "V", color: "#C084FC" },
  { id: VOICES.JOAQUIN, name: "Joaquín", description: es("Amable y confiable"), accent: 'mexico', languages: ['es'], initial: "J", color: "#0EA5E9" },
  { id: VOICES.GLORIA, name: "Gloria", description: es("Clara y tranquila"), accent: 'us', languages: ['es'], initial: "G", color: "#F97316" },
  { id: VOICES.YASMIN, name: "Yasmín", description: es("Clara y amigable"), accent: 'dominicanRepublic', languages: ['es'], initial: "Y", color: "#14B8A6" },
  { id: VOICES.ORLANDO, name: "Orlando", description: es("Sereno y profesional"), accent: 'cuba', languages: ['es'], initial: "O", color: "#A78BFA" },
  { id: VOICES.MARISOL, name: "Marisol", description: es("Cálida y empática"), accent: 'guatemala', languages: ['es'], initial: "M", color: "#94A3B8" },
  { id: VOICES.ALEJANDRA, name: "Alejandra", description: es("Gentil y cercana"), accent: 'honduras', languages: ['es'], initial: "A", color: "#22C55E" },
  { id: VOICES.MARIELA, name: "Mariela", description: es("Tranquila y narradora"), accent: 'costaRica', languages: ['es'], initial: "M", color: "#818CF8" },
  { id: VOICES.RUBEN, name: "Rubén", description: es("Amigable y seguro"), accent: 'panama', languages: ['es'], initial: "R", color: "#FB923C" },
  { id: VOICES.MARIANA, name: "Mariana", description: es("Cálida y serena"), accent: 'venezuela', languages: ['es'], initial: "M", color: "#60A5FA" },
  { id: VOICES.FELIPE, name: "Felipe", description: es("Suave y cálido"), accent: 'chile', languages: ['es'], initial: "F", color: "#F472B6" },
  { id: VOICES.BELEN, name: "Belén", description: es("Gentil y amigable"), accent: 'ecuador', languages: ['es'], initial: "B", color: "#5B8DEF" },
  { id: VOICES.FACUNDO, name: "Facundo", description: es("Compasivo y sincero"), accent: 'uruguay', languages: ['es'], initial: "F", color: "#EC4899" },
  { id: VOICES.SEBASTIAN, name: "Sebastián", description: es("Cálido y directo"), accent: 'paraguay', languages: ['es'], initial: "S", color: "#10B981" },
  { id: VOICES.MANUEL, name: "Manuel", description: es("Pleno y gentil"), accent: 'spain', languages: ['es'], initial: "M", color: "#F59E0B" },
  { id: VOICES.ROCIO, name: "Rocío", description: es("Cálida y tranquilizadora"), accent: 'spain', languages: ['es'], initial: "R", color: "#6366F1" },
  { id: VOICES.NAYRA, name: "Nayra", description: es("Tranquila y amable"), accent: 'canaryIslands', languages: ['es'], initial: "N", color: "#C084FC" },
  // ── Bilingual ─────────────────────────────────
  { id: VOICES.LUCIA, name: "Lucía", description: { en: "Calm & Easygoing", es: "Tranquila y serena" }, accent: 'bilingual', languages: ['en', 'es'], initial: "L", color: "#EC4899" },
  { id: VOICES.VICTOR, name: "Víctor", description: { en: "Warm & Conversational", es: "Cálido y conversador" }, accent: 'bilingual', languages: ['en', 'es'], initial: "V", color: "#6366F1" },
  { id: VOICES.TERESA, name: "Teresa", description: { en: "Gentle & Wise", es: "Sabia y cariñosa" }, accent: 'bilingual', languages: ['en', 'es'], initial: "T", color: "#0EA5E9" },
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

/** Picker sections. Labels live in locales under auth.voice.regions. */
export type VoiceRegion =
  | 'northAmerica' | 'africa' | 'asia' | 'middleEast' | 'europe' | 'oceania'
  | 'neutral' | 'centralAmerica' | 'southAmerica' | 'spain' | 'bilingual';

const ACCENT_REGION: Record<AccentKey, VoiceRegion> = {
  // North America, including the Caribbean and U.S. Spanish
  us: 'northAmerica', usSouth: 'northAmerica', canada: 'northAmerica', jamaica: 'northAmerica',
  haiti: 'northAmerica', trinidad: 'northAmerica', mexico: 'northAmerica', cuba: 'northAmerica',
  puertoRico: 'northAmerica', dominicanRepublic: 'northAmerica',
  nigeria: 'africa', kenya: 'africa', ghana: 'africa', southAfrica: 'africa',
  india: 'asia', china: 'asia', singapore: 'asia', philippines: 'asia', korea: 'asia', japan: 'asia',
  malaysia: 'asia', indonesia: 'asia', pakistan: 'asia', bangladesh: 'asia', nepal: 'asia', vietnam: 'asia',
  middleEast: 'middleEast', egypt: 'middleEast', iran: 'middleEast', turkey: 'middleEast',
  uk: 'europe', ireland: 'europe', scotland: 'europe', wales: 'europe', italy: 'europe', portugal: 'europe',
  poland: 'europe', ukraine: 'europe', romania: 'europe', croatia: 'europe', russia: 'europe',
  hawaii: 'oceania', maori: 'oceania', newZealand: 'oceania', australia: 'oceania',
  latinAmerica: 'neutral',
  guatemala: 'centralAmerica', honduras: 'centralAmerica', costaRica: 'centralAmerica', panama: 'centralAmerica',
  colombia: 'southAmerica', venezuela: 'southAmerica', ecuador: 'southAmerica', peru: 'southAmerica',
  chile: 'southAmerica', argentina: 'southAmerica', uruguay: 'southAmerica', paraguay: 'southAmerica',
  spain: 'spain', canaryIslands: 'spain',
  bilingual: 'bilingual',
};

const REGION_ORDER: Record<VoiceLang, VoiceRegion[]> = {
  en: ['northAmerica', 'africa', 'asia', 'middleEast', 'europe', 'oceania', 'bilingual'],
  es: ['neutral', 'northAmerica', 'centralAmerica', 'southAmerica', 'spain', 'bilingual'],
};

/** A language's guides grouped into picker sections, in order, skipping empty ones. */
export function voiceSections(lang: VoiceLang): { region: VoiceRegion; voices: VoiceData[] }[] {
  const voices = voicesFor(lang);
  return REGION_ORDER[lang]
    .map((region) => ({ region, voices: voices.filter((v) => ACCENT_REGION[v.accent] === region) }))
    .filter((s) => s.voices.length > 0);
}

/** A guide's description in the UI language, falling back to whichever it has. */
export const voiceDescription = (v: VoiceData, lang: VoiceLang) => v.description[lang] ?? v.description.en ?? v.description.es ?? '';


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
