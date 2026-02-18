// Supabase Edge Function: get-shared-design
// Validates a share token and returns the design doc for public viewing.
// This bypasses RLS using the service role key since viewers are unauthenticated.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing token parameter' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Use service role key to bypass RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Look up the design by share token
  const { data: design, error: designError } = await supabase
    .from('designs')
    .select('id, title, doc, owner_id, created_at')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single();

  if (designError || !design) {
    return new Response(
      JSON.stringify({ error: 'Design not found or not shared' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Get author name for attribution
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', design.owner_id)
    .single();

  return new Response(
    JSON.stringify({
      id: design.id,
      title: design.title,
      doc: design.doc,
      author: profile?.name || 'SchoolKit Staff',
      created_at: design.created_at,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
