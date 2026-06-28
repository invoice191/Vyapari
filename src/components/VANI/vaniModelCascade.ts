// ═══════════════════════════════════════════════════════════
// VANI 3.0 — MODEL CASCADE ENGINE
// Tries multiple Gemini models in priority order.
// Never burns all quota on one model.
//
// Free Tier Limits (Daily/Minute):
//   gemini-2.5-flash      → verified working, high RPM
//   gemini-2.0-flash      → fallback
//   gemini-flash-latest   → alias, different pool
// ═══════════════════════════════════════════════════════════

export const MODEL_CASCADE = [
  { id: "gemini-2.5-flash",    name: "Gemini 2.5 Flash",  rpm: 14 },
  { id: "gemini-flash-latest", name: "Gemini Flash Latest", rpm: 14 },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", rpm: 18 },
] as const;

// ── IN-MEMORY BLOCK LIST (resets on page refresh) ──────────
interface BlockRecord {
  blockedUntil: number;
  requestsThisMinute: number;
  minuteStart: number;
}

const blockMap = new Map<string, BlockRecord>();

function getRecord(modelId: string): BlockRecord {
  if (!blockMap.has(modelId)) {
    blockMap.set(modelId, { blockedUntil: 0, requestsThisMinute: 0, minuteStart: Date.now() });
  }
  const rec = blockMap.get(modelId)!;
  // Reset minute counter if a full minute has passed
  if (Date.now() - rec.minuteStart > 60_000) {
    rec.requestsThisMinute = 0;
    rec.minuteStart = Date.now();
  }
  return rec;
}

export function markModelBlocked(modelId: string, retryAfterSeconds = 60) {
  const rec = getRecord(modelId);
  rec.blockedUntil = Date.now() + retryAfterSeconds * 1_000;
  console.warn(`[VANI Cascade] ${modelId} blocked for ${retryAfterSeconds}s`);
}

export function recordModelRequest(modelId: string) {
  getRecord(modelId).requestsThisMinute++;
}

export function isModelAvailable(modelId: string): boolean {
  const rec = getRecord(modelId);
  if (rec.blockedUntil > Date.now()) return false;
  const model = MODEL_CASCADE.find(m => m.id === modelId);
  if (!model) return false;
  // Leave 2-req buffer before hitting RPM ceiling
  return rec.requestsThisMinute < model.rpm - 2;
}

/** Returns the first available model ID, or null if all are blocked. */
export function getNextAvailableModel(): string | null {
  for (const m of MODEL_CASCADE) {
    if (isModelAvailable(m.id)) return m.id;
  }
  return null;
}

// ── CLIENT-SIDE GLOBAL RATE GUARD (across all models) ──────
const globalTimestamps: number[] = [];
const GLOBAL_MAX_RPM = 12; // conservative

export function canMakeRequest(): boolean {
  const now = Date.now();
  const recent = globalTimestamps.filter(t => now - t < 60_000);
  globalTimestamps.length = 0;
  globalTimestamps.push(...recent);
  if (recent.length >= GLOBAL_MAX_RPM) {
    console.warn(`[VANI Cascade] Global RPM guard: ${recent.length} requests in last minute`);
    return false;
  }
  return true;
}

export function recordGlobalRequest() {
  globalTimestamps.push(Date.now());
}
