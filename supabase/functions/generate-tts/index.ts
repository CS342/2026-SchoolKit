// Supabase Edge Function: generate-tts
// Proxies ElevenLabs text-to-speech so the API key stays server-side.
// Requires a signed-in user (anonymous sessions count).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Bound per-request ElevenLabs spend
const MAX_TEXT_CHARS = 5000;

// Generation settings are part of the cache key, so changing them never serves
// audio produced with the old ones.
const MODEL_ID = 'eleven_multilingual_v2';
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.5 };
const CACHE_BUCKET = 'tts-cache';

async function cacheKey(voiceId: string, text: string): Promise<string> {
  const input = JSON.stringify([MODEL_ID, VOICE_SETTINGS, voiceId, text]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${voiceId}/${hex}.mp3`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Require a real user session (anonymous auth users included)
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, voiceId } = await req.json()
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('EXPO_PUBLIC_ELEVENLABS_API_KEY')

    if (!apiKey) {
      console.error('Missing ElevenLabs API Key in environment secrets')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key missing from server environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!text || !voiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing text or voiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof text !== 'string' || text.length > MAX_TEXT_CHARS) {
      return new Response(
        JSON.stringify({ error: `Text too long (max ${MAX_TEXT_CHARS} characters)` }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof voiceId !== 'string' || !/^[A-Za-z0-9]+$/.test(voiceId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid voiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Shared cache: serve previously generated audio without calling ElevenLabs.
    // Any read error (usually "not found") falls through to generation.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const objectPath = await cacheKey(voiceId, text);
    const { data: cached } = await admin.storage.from(CACHE_BUCKET).download(objectPath);
    if (cached) {
      return new Response(cached, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'X-TTS-Cache': 'hit' },
      })
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return new Response(
        JSON.stringify({
          error: 'ElevenLabs API Error',
          details: errorData.detail?.status || 'Unknown error',
          message: errorData.detail?.message || 'Failed to generate speech'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBlob = await response.blob()

    const { error: cacheWriteError } = await admin.storage
      .from(CACHE_BUCKET)
      .upload(objectPath, audioBlob, { contentType: 'audio/mpeg', upsert: true });
    if (cacheWriteError) console.warn('TTS cache write failed:', cacheWriteError.message);

    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-TTS-Cache': 'miss',
      },
    })
  } catch (error) {
    console.error('TTS function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
