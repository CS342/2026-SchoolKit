import * as FileSystem from 'expo-file-system/legacy';

const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

// Voice IDs
export const VOICES = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  ADAM: "pNInz6obpgDQGcFmaJgB",
  ANTONI: "ErXwobaYiN019PkySvjV",
};

export type VoiceData = {
  id: string;
  name: string;
  description: string;
  image: any; // require() returns number or object
};

export const VOICE_META: Record<string, VoiceData> = {
  [VOICES.RACHEL]: {
    id: VOICES.RACHEL,
    name: "Rachel",
    description: "Calm & Young",
    image: require("../assets/images/voice_rachel.png"), 
  },
  [VOICES.ADAM]: {
    id: VOICES.ADAM,
    name: "Adam",
    description: "Deep & Narration",
    image: require("../assets/images/voice_adam.png"),
  },
  [VOICES.ANTONI]: {
    id: VOICES.ANTONI,
    name: "Antoni",
    description: "Friendly & Well-rounded",
    image: require("../assets/images/voice_antoni.png"),
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
