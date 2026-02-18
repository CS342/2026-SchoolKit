import { OpenAI } from 'openai';

// In a real production app, this should be in .env
// For this task, we'll use the provided key directly as requested/implied by the context
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;


const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native/Expo if not using a backend proxy
});

export async function moderateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
  try {
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
}
