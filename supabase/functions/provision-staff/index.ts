import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, full_name, role, business_id, phone, employee_id, address, emergency_contact } = await req.json();

    if (!email || !full_name || !business_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Generate a strong temporary password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let tempPassword = "";
    for (let i = 0; i < 12; i++) {
      tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        full_name, 
        business_id,
        is_staff: true
      }
    });

    if (authError) throw authError;

    // 3. Upsert Profile with extended information
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name,
        email,
        role,
        business_id,
        phone,
        employee_id,
        address,
        emergency_contact,
        requires_password_change: true,
        status: 'Active',
        created_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // 4. Log the action
    await supabase.from('audit_logs').insert({
      business_id,
      action: 'STAFF_PROVISIONED',
      module: 'UserManagement',
      metadata: { email, role, employee_id }
    });

    // Note: In a production environment, you would integrate an email provider (Resend, SendGrid, etc.)
    // to send the email. For now, we return the temp password so the Owner can share it or we can simulate the UI.
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Staff member provisioned successfully.",
      tempPassword,
      loginUrl: `${req.headers.get('origin') || 'http://localhost:3000'}/signin`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[ProvisionStaff] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
