// Supabase Edge Function: generate-design
// Proxies OpenAI calls server-side so the API key never reaches the client.
// The client sends pre-built messages and model params; this function forwards them to OpenAI.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Parse request — client sends { messages, temperature, max_tokens, apiKey }
  let body: { messages: unknown[]; temperature?: number; max_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: 'messages array is required' }, 400);
  }

  // Call OpenAI — prefer server secret, fall back to client-provided key
  const openaiKey = Deno.env.get('OPENAI_API_KEY') || (body as Record<string, unknown>).apiKey as string;
  if (!openaiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY secret or pass apiKey in body.' }, 502);
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 16384,
        messages: body.messages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errText);
      return jsonResponse(
        { error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 500)}` },
        502,
      );
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 502);
    }

    const designDoc = JSON.parse(content);

    if (!designDoc.canvas || !Array.isArray(designDoc.objects)) {
      return jsonResponse({ error: 'AI returned invalid design structure' }, 502);
    }

    return jsonResponse(designDoc);
  } catch (err) {
    console.error('generate-design error:', err);
    return jsonResponse({ error: `Server error: ${String(err).slice(0, 500)}` }, 502);
  }
});
