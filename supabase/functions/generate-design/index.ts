// Supabase Edge Function: generate-design
// Proxies OpenAI to generate a DesignDocument from structured input or a free-form prompt.
// Keeps the API key server-side so the client never sees it.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT = `You are a design layout generator. You output ONLY valid JSON representing a DesignDocument.

CANVAS: The user will specify canvas width and height. All objects must stay within these bounds.

AVAILABLE OBJECT TYPES:

1. rect — Rectangle shape
   Required fields: type:"rect", id (string), name (string), x, y, width, height (numbers), rotation:0, opacity:1, visible:true, locked:false, fill (hex color), stroke (hex or ""), strokeWidth (number), cornerRadius (number)

2. ellipse — Ellipse/circle
   Required fields: type:"ellipse", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth

3. text — Text label
   Required fields: type:"text", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, text (string content), fontSize (number), fontFamily:"Arial", fontStyle:"normal"|"bold"|"italic"|"bold italic", fill (hex), align:"left"|"center"|"right", lineHeight:1.2

4. line — Straight line
   Required fields: type:"line", id, name, x:0, y:0, width:0, height:0, rotation:0, opacity:1, visible:true, locked:false, points:[x1,y1,x2,y2], stroke (hex), strokeWidth, lineCap:"round", lineJoin:"round"

DESIGN RULES:
- Use sequential IDs: "ai_0", "ai_1", "ai_2", etc.
- Objects earlier in the array render BEHIND later objects (z-order).
- Place background shapes first, then accent elements, then text on top.
- Ensure text is readable: use dark text on light backgrounds, light text on dark backgrounds.
- Use harmonious color palettes. Keep to 3-5 colors.
- Leave padding/margins around edges (at least 5% of canvas dimensions).
- Text fontSize should be proportional to canvas size (titles: 4-6% of width, body: 2-3%).
- Make designs visually appealing with layered shapes, accent bars, and decorative elements.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "version": 1,
  "canvas": { "width": <number>, "height": <number>, "background": "<hex>" },
  "objects": [ ...array of objects... ],
  "assets": {}
}`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const { mode, canvas, structured, prompt, templateSkeleton } = body as {
    mode: string;
    canvas: { width: number; height: number };
    structured?: {
      title?: string;
      subtitle?: string;
      bodyText?: string;
      accentColor?: string;
      style?: string;
    };
    prompt?: string;
    templateSkeleton?: string;
  };

  const lines: string[] = [];
  lines.push(`Canvas size: ${canvas.width}x${canvas.height} pixels.`);

  if (templateSkeleton) {
    lines.push(
      `Use this layout skeleton as a starting point. Preserve the general positioning but fill in content, refine colors, and adjust sizes to look polished:`,
    );
    lines.push(templateSkeleton);
  }

  if (mode === 'structured' && structured) {
    lines.push(`Create a design with the following content:`);
    if (structured.title) lines.push(`Title: "${structured.title}"`);
    if (structured.subtitle) lines.push(`Subtitle: "${structured.subtitle}"`);
    if (structured.bodyText) lines.push(`Body text: "${structured.bodyText}"`);
    if (structured.accentColor)
      lines.push(`Use this accent color prominently: ${structured.accentColor}`);
    if (structured.style)
      lines.push(`Design style: ${structured.style} (adapt typography, shapes, and spacing to match this aesthetic)`);
  } else if (mode === 'prompt' && prompt) {
    lines.push(`Design request: ${prompt}`);
  }

  lines.push(
    `Generate a complete, visually appealing design document. Include background shapes, accent elements, and properly positioned text. Return ONLY the JSON object.`,
  );

  return lines.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Parse request
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { mode, canvas } = body as {
    mode?: string;
    canvas?: { width?: number; height?: number };
  };

  if (!mode || !['structured', 'prompt'].includes(mode)) {
    return jsonResponse({ error: 'mode must be "structured" or "prompt"' }, 400);
  }
  if (!canvas?.width || !canvas?.height) {
    return jsonResponse({ error: 'canvas.width and canvas.height are required' }, 400);
  }

  // Call OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured on server' }, 502);
  }

  const userPrompt = buildUserPrompt(body);

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
        temperature: 0.7,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errText);
      return jsonResponse(
        { error: 'AI generation failed. Please try again.' },
        502,
      );
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 502);
    }

    const designDoc = JSON.parse(content);

    // Basic validation
    if (!designDoc.canvas || !Array.isArray(designDoc.objects)) {
      return jsonResponse({ error: 'AI returned invalid design structure' }, 502);
    }

    return jsonResponse(designDoc);
  } catch (err) {
    console.error('generate-design error:', err);
    return jsonResponse({ error: 'Failed to generate design' }, 502);
  }
});
