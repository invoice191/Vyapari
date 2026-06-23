import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "email and otp are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = type === "signup"
      ? "Your Vyapari Verification Code"
      : "Your Vyapari Login Code";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #334155;border-radius:20px;overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">vyapari</h1>
                      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Retail Intelligence Platform</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;font-weight:700;">
                        ${type === "signup" ? "Verify your account" : "Your login code"}
                      </h2>
                      <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        ${type === "signup"
          ? "Welcome to Vyapari! Use the code below to verify your email address and activate your account."
          : "Use the code below to complete your sign-in."}
                      </p>

                      <!-- OTP Box -->
                      <div style="background:#1e293b;border:2px solid #6366f1;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
                        <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Verification Code</p>
                        <p style="margin:0;color:#fff;font-size:42px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;">${otp}</p>
                      </div>

                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                        ⏱️ This code expires in <strong style="color:#94a3b8;">10 minutes</strong>
                      </p>
                      <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
                        If you didn't request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
                      <p style="margin:0;color:#475569;font-size:12px;">
                        © 2025 Vyapari · Retail Intelligence Platform<br>
                        <span style="color:#334155;">This is an automated message, please do not reply.</span>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vyapari <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-otp-email error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
