const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPEN_AI_MODERATION_KEY?.trim();

export async function moderateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
  if (!OPENAI_API_KEY) {
    console.warn('Moderation skipped: no API key configured.');
    return { safe: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: text,
      }),
    });

    if (!response.ok) {
      console.warn('Moderation API returned', response.status, '— allowing content.');
      return { safe: true };
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) return { safe: true };

    if (result.flagged) {
      return {
        safe: false,
        reason: "Your comment was flagged as it may violate our community norms. Please review the guidelines and try again.",
      };
    }

    return { safe: true };
  } catch (error) {
    console.error('Moderation error:', error);
    return { safe: true };
  }
}
