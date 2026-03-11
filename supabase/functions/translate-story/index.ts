import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body } = await req.json()
    
    if (!title && !body) {
      return new Response(JSON.stringify({ error: 'Missing title or body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('EXPO_PUBLIC_OPEN_AI_MODERATION_KEY')
    
    if (!openAiKey) {
      console.error('Missing OpenAI API Key in environment secrets')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key missing from server environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const translateText = async (text: string) => {
      if (!text || text.trim().length === 0) return "";
      
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Translate the following text to Spanish. Return only the translated text, no explanations.' },
            { role: 'user', content: text },
          ],
          temperature: 0.1,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error('OpenAI API error:', json);
        throw new Error(json.error?.message || `OpenAI API returned ${res.status}`);
      }
      return json.choices?.[0]?.message?.content?.trim() ?? text;
    };

    const [translatedTitle, translatedBody] = await Promise.all([
      title ? translateText(title) : Promise.resolve(""),
      body ? translateText(body) : Promise.resolve("")
    ]);

    return new Response(
      JSON.stringify({ title: translatedTitle, body: translatedBody }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Translation function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
