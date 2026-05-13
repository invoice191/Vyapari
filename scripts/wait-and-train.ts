import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const businessId = "496f6191-e37d-459a-ac0f-18aa59b68d41"; // Prajwal Traders
const targetInvoices = 10000; // Trigger training once seeding reaches >= 10,000 invoices

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
});

async function pollAndTrain() {
  console.log("=== STARTING BACKGROUND WATCHER (wait-and-train.ts) ===");
  console.log(`Monitoring business: ${businessId}`);
  console.log(`Target invoice count to trigger training: ${targetInvoices}`);

  const interval = setInterval(async () => {
    try {
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);

      if (error) {
        console.error("Watcher polling error:", error.message);
        return;
      }

      const currentCount = count || 0;
      console.log(`[Watcher] Progress: ${currentCount} / ${targetInvoices} invoices seeded...`);

      if (currentCount >= targetInvoices) {
        console.log(`[Watcher] Success! Invoice target (${targetInvoices}) reached.`);
        console.log("[Watcher] Executing 'npx tsx scripts/train-ml.ts' in the background...");
        clearInterval(interval);
        
        try {
          const output = execSync("npx tsx scripts/train-ml.ts", { encoding: "utf-8" });
          console.log("[Watcher] ML Training execution output:");
          console.log(output);
          console.log("[Watcher] Task completed. Exiting.");
          process.exit(0);
        } catch (execErr: any) {
          console.error("[Watcher] Failed to execute training script:", execErr.message);
          process.exit(1);
        }
      }
    } catch (err: any) {
      console.error("[Watcher] Unexpected error:", err.message);
    }
  }, 5000); // Poll every 5 seconds
}

pollAndTrain().catch(err => {
  console.error("[Watcher] Critical error:", err);
  process.exit(1);
});
