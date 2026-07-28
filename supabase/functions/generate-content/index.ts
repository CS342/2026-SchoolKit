// Supabase Edge Function: generate-content
// A thin, authenticated OpenAI JSON proxy for the content-page AI (generate + edit).
// Keeps the API key server-side. Unlike generate-design it does NOT validate the
// returned shape — the client validates with zod (parseContentDoc / validateOps),
// so this stays generic. Requires a signed-in user (anonymous sessions count).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

const MAX_TOKENS_CAP = 16384;
const MAX_PROMPT_CHARS = 60000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Require a real user session (anonymous auth users included).
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: { messages: unknown[]; temperature?: number; max_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: 'messages array is required' }, 400);
  }
  const promptChars = JSON.stringify(body.messages).length;
  if (promptChars > MAX_PROMPT_CHARS) {
    return jsonResponse({ error: `Prompt too large (${promptChars} chars, max ${MAX_PROMPT_CHARS})` }, 413);
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured. Set the OPENAI_API_KEY secret in Supabase.' }, 502);
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        temperature: body.temperature ?? 0.6,
        max_tokens: Math.min(body.max_tokens ?? MAX_TOKENS_CAP, MAX_TOKENS_CAP),
        messages: body.messages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errText);
      return jsonResponse({ error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 500)}` }, 502);
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) return jsonResponse({ error: 'Empty response from AI' }, 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ error: 'AI returned malformed JSON' }, 502);
    }
    // Return the raw object under `result`; the client validates it.
    return jsonResponse({ result: parsed });
  } catch (err) {
    console.error('generate-content error:', err);
    return jsonResponse({ error: `Server error: ${String(err).slice(0, 500)}` }, 502);
  }
});
