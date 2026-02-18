import * as FileSystem from 'expo-file-system/legacy';

const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

// Voice IDs
export const VOICES = {
  // User favourites
  PETER: "ZthjuvLPty3kTMaNKVKb",
  MIRA: "ZqvIIuD5aI9JFejebHiH",
  HOPE: "OYTbf65OHHFELVut7v2H",
  // Default / premade
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  SARAH: "EXAVITQu4vr4xnSDxMaL",
  EMILY: "LcfcDJNUP1GQjkzn1xUU",
  LILY: "pFZP5JQG7iQjIQuC4Bku",
  ALICE: "Xb7hH8MSUJpSbSDYk0k2",
  MATILDA: "XrExE9yKIg1WjnnlVkGX",
  THOMAS: "GBv7mTt0atIp3Br8iCZE",
  BILL: "pqHfZKP75CvOlQylNhV4",
  CHRIS: "iP95p4xoKVk53GoZ742B",
  JAMES: "ZQe5CZNOzWyzPSCn5a3c",
  GEORGE: "JBFqnCBsd6RMkjVDRZzb",
  BRIAN: "nPczCjzI2devNBz1zQrb",
  DANIEL: "onwK4e9ZLuTAKqWW03F9",
};

export type VoiceData = {
  id: string;
  name: string;
  description: string;
  accent: string;
  image?: any; // require() returns number or object
  initial: string; // fallback initial letter for avatar
  color: string;   // fallback avatar background colour
};

export const VOICE_META: Record<string, VoiceData> = {
  // ── User favourites ───────────────────────────
  [VOICES.PETER]: {
    id: VOICES.PETER,
    name: "Peter",
    description: "Confident & Reliable",
    accent: "American",
    image: require("../assets/images/voice_peter.png"),
    initial: "P",
    color: "#5B8DEF",
  },
  [VOICES.MIRA]: {
    id: VOICES.MIRA,
    name: "Mira",
    description: "Soothing & Calming",
    accent: "American",
    image: require("../assets/images/voice_mira.png"),
    initial: "M",
    color: "#A78BFA",
  },
  [VOICES.HOPE]: {
    id: VOICES.HOPE,
    name: "Hope",
    description: "Bright & Uplifting",
    accent: "American",
    image: require("../assets/images/voice_hope.png"),
    initial: "H",
    color: "#F59E0B",
  },
  // ── American ──────────────────────────────────
  [VOICES.RACHEL]: {
    id: VOICES.RACHEL,
    name: "Rachel",
    description: "Calm & Young",
    accent: "American",
    image: require("../assets/images/voice_rachel.png"),
    initial: "R",
    color: "#EC4899",
  },
  [VOICES.SARAH]: {
    id: VOICES.SARAH,
    name: "Sarah",
    description: "Warm & Professional",
    accent: "American",
    image: require("../assets/images/voice_sarah.png"),
    initial: "S",
    color: "#F472B6",
  },
  [VOICES.EMILY]: {
    id: VOICES.EMILY,
    name: "Emily",
    description: "Calm & Gentle",
    accent: "American",
    image: require("../assets/images/voice_emily.png"),
    initial: "E",
    color: "#818CF8",
  },
  [VOICES.THOMAS]: {
    id: VOICES.THOMAS,
    name: "Thomas",
    description: "Calm & Warm",
    accent: "American",
    image: require("../assets/images/voice_thomas.png"),
    initial: "T",
    color: "#6366F1",
  },
  [VOICES.BILL]: {
    id: VOICES.BILL,
    name: "Bill",
    description: "Friendly & Comforting",
    accent: "American",
    image: require("../assets/images/voice_bill.png"),
    initial: "B",
    color: "#10B981",
  },
  [VOICES.CHRIS]: {
    id: VOICES.CHRIS,
    name: "Chris",
    description: "Natural & Down-to-earth",
    accent: "American",
    image: require("../assets/images/voice_chris.png"),
    initial: "C",
    color: "#14B8A6",
  },
  // ── British ───────────────────────────────────
  [VOICES.LILY]: {
    id: VOICES.LILY,
    name: "Lily",
    description: "Soft & Velvety",
    accent: "British",
    image: require("../assets/images/voice_lily.png"),
    initial: "L",
    color: "#C084FC",
  },
  [VOICES.ALICE]: {
    id: VOICES.ALICE,
    name: "Alice",
    description: "Clear & Engaging",
    accent: "British",
    image: require("../assets/images/voice_alice.png"),
    initial: "A",
    color: "#FB923C",
  },
  [VOICES.GEORGE]: {
    id: VOICES.GEORGE,
    name: "George",
    description: "Warm & Authoritative",
    accent: "British",
    image: require("../assets/images/voice_george.png"),
    initial: "G",
    color: "#0EA5E9",
  },
  [VOICES.BRIAN]: {
    id: VOICES.BRIAN,
    name: "Brian",
    description: "Deep & Trustworthy",
    accent: "British",
    image: require("../assets/images/voice_brian.png"),
    initial: "B",
    color: "#64748B",
  },
  [VOICES.DANIEL]: {
    id: VOICES.DANIEL,
    name: "Daniel",
    description: "Refined & Articulate",
    accent: "British",
    image: require("../assets/images/voice_daniel.png"),
    initial: "D",
    color: "#334155",
  },
  // ── Australian ────────────────────────────────
  [VOICES.MATILDA]: {
    id: VOICES.MATILDA,
    name: "Matilda",
    description: "Warm & Friendly",
    accent: "Australian",
    image: require("../assets/images/voice_matilda.png"),
    initial: "M",
    color: "#F97316",
  },
  [VOICES.JAMES]: {
    id: VOICES.JAMES,
    name: "James",
    description: "Calm & Gentle",
    accent: "Australian",
    image: require("../assets/images/voice_james.png"),
    initial: "J",
    color: "#22C55E",
  },
};

export const generateSpeech = async (text: string, voiceId: string = VOICES.RACHEL): Promise<string | null> => {
  try {
    if (!API_KEY) {
      console.error("ElevenLabs API Key is missing");
      return null;
    }

    // Create a unique filename based on text hash (simple hash for demo)
    const hash = text.split("").reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const fileName = `speech_${voiceId}_${hash}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Check if file exists in cache
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      console.log("Using cached audio:", filePath);
      return filePath;
    }

    console.log("Generating new speech with ElevenLabs...");
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API Error:", response.status, errorText);
        return null;
    }

    // Save the audio file
    // Note: React Native's fetch with blob() support varies, but direct download is often cleaner if we had a URL.
    // Since we get binary data, we can use arrayBuffer and writeAsStringAsync with encoding.
    
    // Better approach for Expo: Use FileSystem.downloadAsync implies a URL, but we need to post data.
    // Standard fetch response.blob() -> FileReader -> base64 -> writeAsStringAsync
    
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(filePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log("Audio saved to:", filePath);
          resolve(filePath);
        } catch (e) {
            console.error("Error writing audio file:", e);
            resolve(null);
        }
      };
      reader.onerror = () => {
          console.error("Error reading blob");
          resolve(null);
      };
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};
