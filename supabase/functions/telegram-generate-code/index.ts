import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nossraveojtofrpjxlhn.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { business_id } = await req.json();
    if (!business_id) {
      throw new Error("business_id is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Generate a 4-digit numeric code
    const numericCode = Math.floor(1000 + Math.random() * 9000);
    const code = `VYP-${numericCode}`;

    // Upsert or insert new code
    // We'll just insert a new one and let the old ones expire
    const { data, error } = await supabase
      .from('telegram_connect_codes')
      .insert([
        { 
          business_id, 
          code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      code: data.code, 
      expires_at: data.expires_at,
      expires_in: 600
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
