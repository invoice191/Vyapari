import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import {
  buildSimulationResult,
  validateOCRRequest,
  validateSimulationRequest,
} from "./src/server/apiValidation";
import {
  createReminderDispatches,
  deriveInvoiceStatus,
  evaluateReminderCandidate,
  getNextReminderAt,
  type CollectibleInvoiceStatus,
  type ReminderCandidate,
} from "./src/server/reminderService";

interface ReminderRow {
  invoice_id: string;
  contact_id: string | null;
  due_date: string;
  reminder_enabled: boolean;
  reminder_count: number | null;
  last_reminder_sent_at: string | null;
  next_reminder_at: string | null;
  business_id: string;
}

interface InvoiceRow {
  id: string;
  customer: string;
  amount: number;
  status: CollectibleInvoiceStatus;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function sendMockSms(phone: string, message: string) {
  console.log(`[mock-sms] ${phone}: ${message}`);
  return {
    provider: "mock_sms",
    externalId: `mock-${Date.now()}`,
    deliveredAt: new Date().toISOString(),
  };
}

async function getPaymentScore(supabase: any, contactId: string, amount: number, businessId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("payment-score", {
      body: { contactId, invoiceAmount: amount, businessId },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to get payment score:", err);
    return null;
  }
}

async function getDunningSentiment(supabase: any, message: string, contactId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("dunning-sentiment", {
      body: { message, contactId },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to get dunning sentiment:", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const apiAuthToken = process.env.API_AUTH_TOKEN || "VYAPARI_FALLBACK_TOKEN_REPLACE_ME";
  console.log(`[Server] API Auth Token configured: ${apiAuthToken.substring(0, 4)}***`);
  const isDemoMode = process.env.VYAPARI_ENABLE_LIVE_APIS !== "true";
  const supabase = getSupabaseServerClient();
  const reminderIntervalHours = Number(process.env.REMINDER_INTERVAL_HOURS || 24);
  const autoRunReminders = process.env.REMINDER_AUTO_RUN === "true";
  const autoRunMinutes = Number(process.env.REMINDER_AUTO_RUN_MINUTES || 60);
  let reminderJobRunning = false;

  app.use(express.json({ limit: "50mb" }));

  const runReminderCycle = async (options?: { dryRun?: boolean }) => {
    if (!supabase) {
      return {
        success: false,
        skipped: true,
        reason: "Supabase server credentials are missing.",
      };
    }

    if (reminderJobRunning) {
      return {
        success: false,
        skipped: true,
        reason: "Reminder cycle already running.",
      };
    }

    reminderJobRunning = true;
    const now = new Date();

    try {
      const { data: reminderRows, error: reminderError } = await supabase
        .from("invoice_reminders")
        .select("invoice_id, contact_id, due_date, reminder_enabled, reminder_count, last_reminder_sent_at, next_reminder_at, business_id")
        .eq("reminder_enabled", true)
        .lte("due_date", now.toISOString().slice(0, 10));

      if (reminderError) {
        throw reminderError;
      }

      const reminders = (reminderRows || []) as ReminderRow[];
      if (reminders.length === 0) {
        return {
          success: true,
          processed: 0,
          sent: 0,
          skipped: 0,
          updatedInvoices: 0,
        };
      }

      const invoiceIds = reminders.map((row) => row.invoice_id);
      const contactIds = reminders
        .map((row) => row.contact_id)
        .filter((value): value is string => Boolean(value));

      const [{ data: invoiceRows, error: invoiceError }, { data: contactRows, error: contactError }] = await Promise.all([
        supabase.from("invoices").select("id, customer, amount, status").in("id", invoiceIds),
        contactIds.length > 0
          ? supabase.from("contacts").select("id, name, phone").in("id", contactIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (invoiceError) {
        throw invoiceError;
      }
      if (contactError) {
        throw contactError;
      }

      const invoiceMap = new Map((invoiceRows || []).map((row) => [row.id, row as InvoiceRow]));
      const contactMap = new Map((contactRows || []).map((row) => [row.id, row as ContactRow]));

      const candidates: ReminderCandidate[] = [];
      for (const row of reminders) {
        const invoice = invoiceMap.get(row.invoice_id);
        if (!invoice) {
          continue;
        }

        const contact = row.contact_id ? contactMap.get(row.contact_id) : null;
        candidates.push({
          reminderId: row.invoice_id,
          invoiceId: row.invoice_id,
          contactId: row.contact_id,
          customerName: contact?.name || invoice.customer || "Customer",
          phone: contact?.phone,
          dueDate: row.due_date,
          amount: Number(invoice.amount || 0),
          status: invoice.status,
          reminderEnabled: row.reminder_enabled,
          reminderCount: row.reminder_count || 0,
          lastReminderSentAt: row.last_reminder_sent_at,
          nextReminderAt: row.next_reminder_at,
        });
      }

      const decisions = new Map(
        candidates.map((candidate) => [
          candidate.invoiceId,
          evaluateReminderCandidate(candidate, now, reminderIntervalHours),
        ])
      );
      const dispatches = createReminderDispatches(candidates, now, reminderIntervalHours);

      let updatedInvoices = 0;
      const statusUpdates = candidates
        .map((candidate) => ({
          invoiceId: candidate.invoiceId,
          status: deriveInvoiceStatus(candidate.status, candidate.dueDate, now),
        }))
        .filter((entry) => entry.status === "Overdue");

      for (const update of statusUpdates) {
        const invoice = invoiceMap.get(update.invoiceId);
        if (!invoice || invoice.status === update.status) {
          continue;
        }

        if (!options?.dryRun) {
          const { error } = await supabase
            .from("invoices")
            .update({ status: update.status })
            .eq("id", update.invoiceId);

          if (error) {
            throw error;
          }
        }

        updatedInvoices += 1;
      }

      let sent = 0;
      for (const dispatch of dispatches) {
        const reminderRecord = reminders.find(r => r.invoice_id === dispatch.invoiceId);
        const score = await getPaymentScore(supabase, dispatch.contactId!, dispatch.amount, reminderRecord!.business_id!);
        
        let channel = "whatsapp";
        let message = dispatch.message;
        let riskFlag = false;

        if (score) {
          riskFlag = score.risk_level === "high" || score.escalation_required;
          await supabase
            .from("invoices")
            .update({ ai_risk_score: score.probability / 100, risk_flag: riskFlag })
            .eq("id", dispatch.invoiceId);
        }

        if (dispatch.reminderCount === 0) {
          message = `[Friendly Reminder] ${dispatch.message}`;
          channel = "whatsapp";
        } else if (dispatch.reminderCount === 1) {
          message = `[FORMAL NOTICE] ${dispatch.message}\nPlease find the formal notice attached.`;
          channel = "email_pdf";
        } else if (dispatch.reminderCount >= 2 && riskFlag) {
          await supabase.from("anomaly_log").insert({
            business_id: reminderRecord!.business_id,
            title: "Dunning Escalation Required",
            message: `Invoice ${dispatch.invoiceId} for ${dispatch.customerName} (₹${dispatch.amount}) requires a personal call. Multiple reminders failed and risk is HIGH.`,
            severity: "Critical",
            module: "Invoices",
            type: "dunning_escalation",
            metadata: { invoice_id: dispatch.invoiceId, contact_id: dispatch.contactId, score }
          });
          console.log(`[Neural Event Bus] Escalated invoice ${dispatch.invoiceId} to owner.`);
          continue;
        }

        const { data: recentMessages } = await supabase
          .from("notification_logs")
          .select("message")
          .eq("contact_id", dispatch.contactId)
          .eq("channel", "whatsapp_incoming")
          .order("sent_at", { ascending: false })
          .limit(1);

        if (recentMessages && recentMessages.length > 0) {
          const sentiment = await getDunningSentiment(supabase, recentMessages[0].message, dispatch.contactId!);
          if (sentiment) {
            if (sentiment.suggested_action === "OFFER_PAYMENT_PLAN") {
              message = `[SENSITIVE] ${sentiment.reply_template}`;
              console.log(`[Sentiment Agent] Detected ${sentiment.sentiment}. Switching to Payment Plan offer for ${dispatch.customerName}.`);
            } else if (sentiment.suggested_action === "OWNER_INTERVENTION") {
              console.log(`[Sentiment Agent] Detected high temperature (${sentiment.temperature}). Escalating to owner.`);
              continue;
            }
          }
        }

        const providerResponse = await sendMockSms(dispatch.phone, message);
        const nextReminderAt = getNextReminderAt(now, reminderIntervalHours);

        if (!options?.dryRun) {
          const { error: logError } = await supabase.from("notification_logs").insert({
            invoice_id: dispatch.invoiceId,
            contact_id: dispatch.contactId,
            phone: dispatch.phone,
            channel: channel,
            message: message,
            status: "sent",
            provider: providerResponse.provider,
            provider_response: providerResponse,
            sent_at: now.toISOString(),
          });

          if (logError) {
            throw logError;
          }

          const { error: reminderError } = await supabase
            .from("invoice_reminders")
            .update({
              reminder_count: dispatch.reminderCount + 1,
              last_reminder_sent_at: now.toISOString(),
              next_reminder_at: nextReminderAt,
              last_error: null,
              updated_at: now.toISOString(),
            })
            .eq("invoice_id", dispatch.invoiceId);

          if (reminderError) {
            throw reminderError;
          }
        }

        sent += 1;
      }

      const skipped = candidates.length - dispatches.length;

      if (!options?.dryRun) {
        for (const candidate of candidates) {
          const decision = decisions.get(candidate.invoiceId);
          if (!decision || decision.eligible) {
            continue;
          }

          const { error } = await supabase
            .from("invoice_reminders")
            .update({
              last_error:
                decision.reason === "missing_phone"
                  ? "Missing customer phone number."
                  : decision.reason === "invalid_phone"
                    ? "Customer phone number is invalid."
                    : null,
              updated_at: now.toISOString(),
            })
            .eq("invoice_id", candidate.invoiceId);

          if (error) {
            throw error;
          }
        }
      }

      return {
        success: true,
        processed: candidates.length,
        sent,
        skipped,
        updatedInvoices,
        dryRun: Boolean(options?.dryRun),
      };
    } finally {
      reminderJobRunning = false;
    }
  };

  app.use("/api", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    console.log(`[API Debug] ${req.method} ${req.path}`);

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${apiAuthToken}`) {
      next();
      return;
    }

    console.warn(`[API Debug] Unauthorized: ${req.method} ${req.path}`);
    res.status(401).json({
      success: false,
      error: "Unauthorized API request.",
    });
  });

  const sendOnboardingEmail = async (email: string, fullName: string, password: string) => {
    console.log(`[Email Service] Preparing onboarding mail for ${email}...`);
    
    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    
    if (!hasSmtp) {
      console.warn(`[Email Service] SMTP not configured in .env. Falling back to secure console handshake.`);
      console.log(`
        --------------------------------------------------
        SECURE ONBOARDING LOG (SIMULATED EMAIL)
        TO: ${fullName} <${email}>
        SUBJECT: Welcome to the Team - Your Vyapari Identity
        BODY:
        Hello ${fullName},
        Your professional account has been provisioned.
        Username: ${email}
        Temporary Password: ${password}
        
        Login at: http://localhost:3000/signin
        (You will be asked to set a private password upon first login)
        --------------------------------------------------
      `);
      return { success: true, simulated: true };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Vyapari Enterprise" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to the Team - Your Vyapari Identity",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Welcome to the Team</h2>
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>Your professional identity has been provisioned on the Vyapari Enterprise platform.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Login Credentials</p>
              <p style="margin: 10px 0 5px 0;"><strong>Username:</strong> ${email}</p>
              <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 5px; border-radius: 4px;">${password}</code></p>
            </div>
            <p style="font-size: 14px; color: #64748b;"><em>Note: You will be required to set a new private password when you first sign in.</em></p>
            <a href="http://localhost:3000/signin" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Login to Vyapari</a>
          </div>
        `
      });

      console.log(`[Email Service] Transactional email sent to ${email}`);
      return { success: true };
    } catch (err) {
      console.error("[Email Service] Failed to send onboarding email:", err);
      return { success: false, error: err };
    }
  };

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mode: isDemoMode ? "demo" : "live",
      protected: Boolean(apiAuthToken),
      reminders: {
        autoRun: autoRunReminders,
        provider: "mock_sms",
        intervalHours: reminderIntervalHours,
        supabaseConfigured: Boolean(supabase),
      },
    });
  });

  app.post("/api/ocr/process", (req, res) => {
    const errors = validateOCRRequest(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }

    const { imageUrl } = req.body as { imageUrl: string };
    console.log(`Processing OCR for: ${imageUrl}`);

    setTimeout(() => {
      res.json({
        success: true,
        mode: isDemoMode ? "demo" : "live",
        warnings: isDemoMode ? ["OCR is running in demo mode."] : [],
        data: {
          vendor: "Global Retail Supplies",
          date: "2024-03-14",
          totalAmount: 1250.50,
          items: [
            { description: "Organic Apples", quantity: 50, price: 2.50 },
            { description: "Fresh Milk", quantity: 20, price: 3.25 }
          ]
        }
      });
    }, 1500);
  });

  app.post("/api/simulation/run", (req, res) => {
    const errors = validateSimulationRequest(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }

    console.log("Running simulation with parameters:", req.body.parameters);
    const result = buildSimulationResult(req.body);

    res.json({
      success: true,
      mode: isDemoMode ? "demo" : "live",
      ...result,
    });
  });

  app.post("/api/reminders/run", async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const result = await runReminderCycle({ dryRun });

      if (!result.success) {
        res.status(result.skipped ? 200 : 500).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reminder runner error.";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  });

  app.post("/api/provision-staff", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ success: false, error: "Supabase admin client not configured." });
      }

      const { email, role, full_name, business_id, employee_id, phone, address, emergency_contact } = req.body;

      if (!email || !role || !business_id) {
        console.error("[Provisioning] Validation failed. Missing params:", { email, role, business_id });
        return res.status(400).json({ success: false, error: "Missing required identity parameters." });
      }

      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let tempPassword = "";
      for (let i = 0; i < 12; i++) {
        tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      console.log(`[Provisioning] Initializing identity for: ${email} (${role})`);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name, role }
      });

      if (authError) {
        console.error("[Provisioning] Auth Error:", authError);
        throw authError;
      }

      const userId = authData.user.id;

      const { error: baseProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: full_name || '',
          role: role,
          business_id: business_id,
          phone: phone || null,
        });

      if (baseProfileError) {
        console.error("[Provisioning] Base Profile Error:", baseProfileError);
        throw baseProfileError;
      }

      const { error: extError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          employee_id: employee_id || null,
          address: address || null,
          emergency_contact: emergency_contact || null,
          joining_date: new Date().toISOString().split('T')[0],
          requires_password_change: true,
        });

      if (extError) {
        if (extError.code === 'PGRST204' || String(extError.message).includes('column')) {
          console.warn("[Provisioning] Extended profile columns missing — run migration SQL to enable full staff records. Continuing with base profile.");
        } else {
          console.error("[Provisioning] Extended Profile Error:", extError);
        }
      }

      try {
        await supabase.from('audit_logs').insert({
          business_id,
          action: 'STAFF_PROVISIONED',
          module: 'UserManagement',
          metadata: { email, role, employee_id }
        });
      } catch (_auditErr) {
        console.warn("[Provisioning] Audit log skipped (table may not exist).");
      }

      console.log(`[Provisioning] SUCCESS: Identity created for ${email}`);

      const emailResult = await sendOnboardingEmail(email, full_name, tempPassword);

      return res.json({
        success: true,
        password: tempPassword,
        user_id: userId,
        emailSent: emailResult.success,
        simulated: emailResult.simulated || false
      });

    } catch (error) {
      console.error("[Provisioning Error]", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal provisioning failure." 
      });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  if (autoRunReminders) {
    const intervalMs = Math.max(autoRunMinutes, 5) * 60 * 1000;
    setInterval(() => {
      void runReminderCycle().catch((error) => {
        console.error("Reminder cycle failed:", error);
      });
    }, intervalMs);
  }
}

startServer();
