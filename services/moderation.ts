// Currently disabled as no OpenAI API key is available
// import { OpenAI } from 'openai';

// In a real production app, this should be in .env
// const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;


// Initialize OpenAI client only if API key is available
// let client: OpenAI | null = null;

// if (OPENAI_API_KEY) {
//   try {
//     client = new OpenAI({
//       apiKey: OPENAI_API_KEY,
//       dangerouslyAllowBrowser: true // Required for React Native/Expo if not using a backend proxy
//     });
//   } catch (error) {
//     console.warn("Failed to initialize OpenAI client:", error);
//   }
// } else {
//   console.warn("Missing EXPO_PUBLIC_OPENAI_API_KEY. Moderation will be disabled.");
// }

export async function moderateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
  // Moderation disabled: User does not have an OpenAI API key yet.
  // Returning safe=true allows the app to function without moderation.
  console.log("Moderation bypassed (no API key). Content allowed:", text.substring(0, 50));
  return { safe: true };
  
  /* 
  // Original implementation below:
  try {
    if (!client) {
      console.warn("Moderation skipped: No OpenAI client initialized (missing API key).");
      return { safe: true };
    }

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: `You are a content moderator for a school application. 
      Analyze the following comment. 
      If it contains hate speech, severe profanity, bullying, or inappropriate sexual content, reply with "UNSAFE". 
      Otherwise, reply with "SAFE".
      
      Comment: "${text}"`,
      store: true,
    });

    const output = response.output_text?.trim()?.toUpperCase() || "";
    
    // Check if the model explicitly said UNSAFE
    if (output.includes("UNSAFE")) {
      return { safe: false, reason: "Content flagged as inappropriate for school environment." };
    }

    // Default to safe if it says SAFE or something else (unless it's an error)
    return { safe: true };

  } catch (error) {
    console.error("Moderation API Error:", error);
    // Fail safe: if moderation is down, do we block or allow?
    // For a school app, it might be safer to block or warn, but let's allow with a warning log for now to avoid blocking legitimate users during outages.
    // However, usually "fail closed" is better for safety. Let's return true (safe) but log it, or false?
    // Let's decide to ALLOW if the API fails, so the app isn't broken, but log the error.
    return { safe: true };
  }
  */
}
