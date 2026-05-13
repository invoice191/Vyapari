import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.SMOKE_SUPABASE_EMAIL;
const password = process.env.SMOKE_SUPABASE_PASSWORD;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing SMOKE_SUPABASE_EMAIL or SMOKE_SUPABASE_PASSWORD in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const assertNoError = (error, step) => {
  if (error) {
    throw new Error(`${step} failed: ${error.message}`);
  }
};

const run = async () => {
  const tag = `SMOKE-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  console.log(`[1/7] Signing in as ${email} ...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  assertNoError(authError, "Auth sign-in");
  const userId = authData.user.id;

  console.log("[2/7] Checking/Inserting business ...");
  let businessId;
  const { data: existingBiz, error: bizGetErr } = await supabase
    .from("businesses")
    .select("id")
    .limit(1);
  assertNoError(bizGetErr, "Fetch business");

  if (existingBiz && existingBiz.length > 0) {
    businessId = existingBiz[0].id;
    console.log(`Using existing business ID: ${businessId}`);
  } else {
    const { data: newBiz, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        name: `${tag} Enterprises`,
        settings: { onboarding_completed: true }
      })
      .select("id")
      .single();
    assertNoError(bizErr, "Insert business");
    businessId = newBiz.id;
    console.log(`Created new business ID: ${businessId}`);
  }

  console.log("[3/7] Checking/Inserting profile ...");
  const { data: existingProfile, error: profileGetErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .limit(1);
  assertNoError(profileGetErr, "Fetch profile");

  if (existingProfile && existingProfile.length > 0) {
    console.log("Using existing user profile");
  } else {
    const { error: profileErr } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        business_id: businessId,
        full_name: "Smoke Test Executor",
        role: "owner",
        email: email
      });
    assertNoError(profileErr, "Insert profile");
    console.log("Created new user profile");
  }

  console.log("[4/7] Inserting product ...");
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .insert({
      business_id: businessId,
      name: `${tag} Premium Widget`,
      sku: `SKU-${tag.substring(6)}`,
      selling_price: 249.50,
      cost_price: 150.00,
      quantity: 100,
      reorder_level: 10,
      gst_rate: 18,
      unit: "pcs"
    })
    .select("id,name")
    .single();
  assertNoError(prodErr, "Insert product");
  console.log(`Created product: ${product.name} (ID: ${product.id})`);

  console.log("[5/7] Inserting contact ...");
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .insert({
      business_id: businessId,
      name: `${tag} Customer`,
      type: "customer",
      phone: "9876543210",
      email: `${tag.toLowerCase()}@example.com`,
      address: "123 Smoke Test Lane",
      state: "Maharashtra"
    })
    .select("id,name")
    .single();
  assertNoError(contactErr, "Insert contact");
  console.log(`Created contact: ${contact.name} (ID: ${contact.id})`);

  console.log("[6/7] Inserting invoice ...");
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      business_id: businessId,
      contact_id: contact.id,
      invoice_number: `INV-${tag.substring(6)}`,
      invoice_date: today,
      subtotal: 249.50,
      discount_amt: 0.00,
      gst_amt: 44.91,
      total_amount: 294.41,
      payment_method: "UPI",
      status: "Pending"
    })
    .select("id,invoice_number,total_amount")
    .single();
  assertNoError(invErr, "Insert invoice");
  console.log(`Created invoice: ${invoice.invoice_number} (Total: ${invoice.total_amount})`);

  console.log("[7/7] Smoke test successfully completed.");
  console.log(JSON.stringify({
    success: true,
    tag,
    results: {
      businessId,
      productId: product.id,
      contactId: contact.id,
      invoiceId: invoice.id
    }
  }, null, 2));
};

run().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});
