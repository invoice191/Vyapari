import { useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useGlobalData } from "../../context/DataContext";
import { supabase } from "../../lib/supabase";
import { executeVANIAction } from "./vaniExecutor";
import type { VANIMessage, VANIResponse, VANIContextData } from "./vani.types";
import { SYSTEM_PROMPT } from "./vaniPrompt";
import {
  MODEL_CASCADE,
  markModelBlocked,
  recordModelRequest,
  isModelAvailable,
  canMakeRequest,
  recordGlobalRequest,
} from "./vaniModelCascade";
import {
  computeMath,
  quickClassifyIntent,
  buildLocalFallback,
} from "./vaniLocalEngine";

// ── SLEEP HELPER ─────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── TRIM CONTEXT TO MINIMUM TOKENS ───────────────────────────
// Full product/invoice objects are huge. We only send what AI needs.
function trimProducts(products: any[]) {
  return products.slice(0, 25).map((p) => ({
    name: p.name,
    sku: p.sku,
    qty: p.stock_quantity,
    price: p.selling_price,
    reorder: p.reorder_point,
    cat: p.category,
  }));
}
function trimInvoices(invoices: any[]) {
  return invoices.slice(0, 15).map((i) => ({
    num: i.invoice_number,
    contact: i.contact_name,
    total: i.total,
    status: i.status,
    due: i.due_date,
  }));
}
function trimContacts(contacts: any[]) {
  return contacts.slice(0, 25).map((c) => ({
    name: c.name,
    type: c.type,
    outstanding: c.outstanding_amount,
    phone: c.phone,
  }));
}

// ── INSTANT LOCAL REPLY (shown before AI responds) ───────────
function buildInstantReply(transcript: string, intent: string, businessName: string): string | null {
  const t = transcript.toLowerCase();

  if (intent === "CREATE_INVOICE") return `✅ Invoice drawer khol raha hoon...`;
  if (intent === "SHOW_LOW_STOCK")  return `📦 Inventory check kar raha hoon — low stock items dhundh raha hoon...`;
  if (intent === "SHOW_DEAD_STOCK") return `📊 Dead stock analysis kar raha hoon...`;
  if (intent === "QUERY_CUSTOMER")  return `👤 Customer data fetch kar raha hoon...`;
  if (intent === "PAYMENT_STATUS")  return `💳 Pending payments check kar raha hoon...`;
  if (intent === "QUERY_INVOICE")   return `🧾 Invoices dhundh raha hoon...`;
  if (intent === "SHOW_REPORT")     return `📈 Report prepare kar raha hoon...`;
  if (intent === "NAVIGATE")        return `🔀 Page pe navigate kar raha hoon...`;
  if (intent === "SEND_REMINDER")   return `📲 Reminder bhejna process kar raha hoon...`;
  if (intent === "STRATEGIC_PLAN" || intent === "MARKET_SIMULATION")
    return `🧠 Business analysis kar raha hoon — ek second...`;
  if (/open setting|settings kholo|setting/.test(t)) return `⚙️ Settings khol raha hoon...`;

  return null; // conversational — let AI handle it fully
}

// ── VANI LOGS CACHE (avoid DB hit every query) ───────────────
let logsCache: unknown[] = [];
let logsCacheTime = 0;
const LOGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedLogs(businessId: string): Promise<unknown[]> {
  if (Date.now() - logsCacheTime < LOGS_CACHE_TTL) return logsCache;
  try {
    const { data } = await supabase
      .from("vani_logs")
      .select("transcript, intent")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(3);
    logsCache = data ?? [];
    logsCacheTime = Date.now();
  } catch { /* non-critical */ }
  return logsCache;
}

// ── SINGLE MODEL FETCH ────────────────────────────────────────
async function tryGeminiModel(
  modelId: string,
  contents: unknown[],
  apiKey: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: VANIResponse } | { ok: false; isRateLimit: boolean; retryAfter?: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { temperature: 0.3, responseMimeType: "application/json", maxOutputTokens: 1024 },
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(1200);
    if (signal?.aborted) return { ok: false, isRateLimit: false };

    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal });
    } catch {
      return { ok: false, isRateLimit: false };
    }

    if (res.ok) {
      try {
        const raw = await res.json();
        const text = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        let parsed: VANIResponse;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        }
        if (parsed?.reply) return { ok: true, data: parsed };
      } catch { /* malformed JSON */ }
      return { ok: false, isRateLimit: false };
    }

    if (res.status === 429) {
      let retryAfter = 60;
      try {
        const errBody = await res.json();
        const match = JSON.stringify(errBody).match(/"retryDelay"\s*:\s*"(\d+)s"/);
        if (match) retryAfter = parseInt(match[1]);
      } catch { /* ignore */ }
      return { ok: false, isRateLimit: true, retryAfter };
    }

    if (res.status !== 503 && res.status !== 500) {
      return { ok: false, isRateLimit: false };
    }
  }
  return { ok: false, isRateLimit: false };
}

// ── CASCADE: tries each model in order ───────────────────────
async function callGeminiCascade(
  contents: unknown[],
  apiKey: string,
  signal?: AbortSignal
): Promise<VANIResponse | null> {
  for (const model of MODEL_CASCADE) {
    if (!isModelAvailable(model.id)) {
      console.log(`[VANI Cascade] Skipping ${model.id} (blocked)`);
      continue;
    }

    console.log(`[VANI Cascade] Trying ${model.id}...`);
    recordModelRequest(model.id);
    recordGlobalRequest();

    const result = await tryGeminiModel(model.id, contents, apiKey, signal);

    if (result.ok) {
      console.log(`[VANI Cascade] ✅ ${model.id} responded`);
      return result.data;
    }

    const failed = result as { ok: false; isRateLimit: boolean; retryAfter?: number };
    if (failed.isRateLimit) {
      markModelBlocked(model.id, failed.retryAfter ?? 65);
      continue;
    }
    console.warn(`[VANI Cascade] ❌ ${model.id} failed, trying next...`);
  }
  return null;
}

// ═════════════════════════════════════════════════════════════
// useVANI — Main Hook
// ═════════════════════════════════════════════════════════════
export function useVANI() {
  const { business, profile } = useAuth();
  const dataContext = useGlobalData();

  const [messages, setMessages] = useState<VANIMessage[]>([{
    id: "welcome",
    role: "vani",
    content: `Namaste! Main VANI hoon — ${business?.name ?? "your"} ka AI brain. Kuch bhi poochho — business, invoices, stock, GST — ya simply baat karo.`,
    timestamp: new Date(),
  }]);

  const [isLoading, setIsLoading] = useState(false);
  const lastReplyRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  // ── BUILD LEAN CONTEXT (fast — no DB wait) ──────────────────
  const buildContext = useCallback(async (): Promise<VANIContextData> => {
    // Fire DB call in background — don't await it on critical path
    const logsPromise = getCachedLogs(business?.id ?? "");

    const history = messages
      .filter((m) => !m.isTyping && m.id !== "welcome")
      .slice(-4) // ← reduced from 8 to 4 — fewer tokens
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

    const logs = await logsPromise; // await here — but it's likely cached

    return {
      business_name: business?.name ?? "",
      business_id: business?.id ?? "",
      current_user_role: (profile?.role as "owner" | "staff" | "banker") ?? "staff",
      products: trimProducts(dataContext?.products ?? []),      // ← lean objects
      invoices: trimInvoices(dataContext?.invoices ?? []),      // ← lean objects
      contacts: trimContacts(dataContext?.contacts ?? []),      // ← lean objects
      ledger_entries: [],                                        // ← skip ledger (rarely used)
      conversation_history: history,
      recent_vani_logs: logs,
    };
  }, [business, profile, dataContext, messages]);

  // ── SPEAK ───────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, "").replace(/\n+/g, ". ").slice(0, 180);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "hi-IN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  // ── MAIN PROCESS ────────────────────────────────────────────
  const process = useCallback(async (rawTranscript: string) => {
    const transcript = rawTranscript.trim();
    if (!transcript || isLoading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const localIntent = quickClassifyIntent(transcript);

    // ── LAYER 1: Math — instant, zero API ───────────────────
    const mathResult = computeMath(transcript);
    if (mathResult) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: transcript, timestamp: new Date() },
        { id: crypto.randomUUID(), role: "vani", content: mathResult, timestamp: new Date() },
      ]);
      speakText(mathResult);
      return;
    }

    // ── LAYER 2: Show instant reply + navigate immediately ──
    const instantReply = buildInstantReply(transcript, localIntent, business?.name ?? "");
    const instantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: transcript, timestamp: new Date() },
      instantReply
        ? { id: instantId, role: "vani", content: instantReply, timestamp: new Date() }
        : { id: "typing", role: "vani", content: "", timestamp: new Date(), isTyping: true },
    ]);
    setIsLoading(true);

    // Fire navigation immediately (parallel with AI call)
    if (localIntent !== "CONVERSATION") {
      executeVANIAction({
        intent: localIntent as any,
        confidence: 0.8,
        params: { query: transcript },
      });
    }

    // ── LAYER 3: Rate guard — use local fallback ────────────
    if (!canMakeRequest()) {
      const fallback = buildLocalFallback(transcript, localIntent, {
        products: dataContext?.products as any[],
        invoices: dataContext?.invoices as any[],
        contacts: dataContext?.contacts as any[],
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "typing" && m.id !== instantId),
        { id: crypto.randomUUID(), role: "vani", content: fallback, timestamp: new Date() },
      ]);
      speakText(fallback.split("\n")[0]);
      setIsLoading(false);
      return;
    }

    // ── LAYER 4: Gemini Cascade ──────────────────────────────
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key missing");

      const context = await buildContext();
      const userMsg = `<transcript>${transcript}</transcript><context>${JSON.stringify({
        business_name: context.business_name,
        role: context.current_user_role,
        products: context.products,
        invoices: context.invoices,
        contacts: context.contacts,
      })}</context>`;

      // Only include last 2 turns of conversation history (not the full prompt each time)
      const contents = [
        ...context.conversation_history.slice(-2).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content.slice(0, 300) }], // ← cap history tokens
        })),
        { role: "user", parts: [{ text: userMsg }] },
      ];

      const aiResult = await callGeminiCascade(contents, apiKey, controller.signal);

      if (aiResult) {
        if (aiResult.reply === lastReplyRef.current) aiResult.reply += " ↩";
        lastReplyRef.current = aiResult.reply;

        // Replace typing/instant with AI reply
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing" && m.id !== instantId),
          {
            id: crypto.randomUUID(),
            role: "vani",
            content: aiResult.reply,
            timestamp: new Date(),
            action: aiResult.action,
          },
        ]);

        // If AI detected a better intent, execute it
        if (aiResult.action?.intent && aiResult.action.intent !== "CLARIFY") {
          executeVANIAction(aiResult.action);
        }
        if (aiResult.spoken_response) speakText(aiResult.spoken_response);

        // Log fire-and-forget
        supabase.from("vani_logs").insert({
          business_id: business?.id,
          transcript,
          intent: aiResult.action?.intent ?? "CONVERSATION",
          confidence: aiResult.action?.confidence ?? 1.0,
          reply: aiResult.reply,
          spoken_response: aiResult.spoken_response,
          execution_status: aiResult.action ? "executed" : "answered",
          created_at: new Date().toISOString(),
        }).then(() => {}, () => {});

      } else {
        // ── LAYER 5: Local Contextual Fallback ────────────────
        const fallback = buildLocalFallback(transcript, localIntent, {
          products: dataContext?.products as any[],
          invoices: dataContext?.invoices as any[],
          contacts: dataContext?.contacts as any[],
        });
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing" && m.id !== instantId),
          { id: crypto.randomUUID(), role: "vani", content: fallback, timestamp: new Date() },
        ]);
        speakText(fallback.split("\n")[0].replace(/\*\*/g, ""));
      }

    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("[VANI] Error:", err);

      const fallback = buildLocalFallback(transcript, localIntent, {
        products: dataContext?.products as any[],
        invoices: dataContext?.invoices as any[],
        contacts: dataContext?.contacts as any[],
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "typing" && m.id !== instantId),
        { id: crypto.randomUUID(), role: "vani", content: fallback, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, buildContext, business, dataContext, speakText]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: "welcome",
      role: "vani",
      content: "New session started. Main sun raha hoon.",
      timestamp: new Date(),
    }]);
  }, []);

  return { messages, isLoading, process, clearMessages };
}
