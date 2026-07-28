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

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
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

    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
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
