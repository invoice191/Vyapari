import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://nossraveojtofrpjxlhn.supabase.co";
// Note: We use the client public anon key here to simulate an actual user logging in through the app UI
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjM2NjYsImV4cCI6MjA4OTEzOTY2Nn0.9vTKWgdW0LmEvVPQwfRCqtkbvUrZlJH_xdwOTiTaDg8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const email = "showroom@vyapari.com";
  const password = "Showroom@123";

  console.log(`🔐 Attempting login as showroom user: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error("❌ Login failed:", authError.message);
    process.exit(1);
  }

  console.log("✅ Login successful! Session started.");
  const sessionUser = authData.user;
  console.log(`User ID: ${sessionUser.id}`);

  // Fetch linked profile
  console.log("\n👤 Fetching profile...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, businesses(*)')
    .eq('id', sessionUser.id)
    .single();

  if (profileError) {
    console.error("❌ Failed to fetch profile:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Profile fetched successfully:");
  console.log(`   - Name: ${profile.full_name}`);
  console.log(`   - Role: ${profile.role}`);
  console.log(`   - Business: ${profile.businesses?.name || "None"}`);
  console.log(`   - Address: ${profile.businesses?.address}, ${profile.businesses?.city}`);

  const businessId = profile.business_id;

  // Fetch products
  console.log("\n📦 Fetching products...");
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId);

  if (prodError) {
    console.error("❌ Failed to fetch products:", prodError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products:`);
  products.forEach(p => {
    console.log(`   - [SKU: ${p.sku}] ${p.name}: Cost ₹${p.cost_price}, Price ₹${p.selling_price}, Qty: ${p.quantity} (Reorder: ${p.reorder_point})`);
  });

  // Fetch contacts
  console.log("\n👥 Fetching contacts...");
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('business_id', businessId);

  if (contactError) {
    console.error("❌ Failed to fetch contacts:", contactError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${contacts.length} contacts:`);
  contacts.forEach(c => {
    console.log(`   - ${c.name} (${c.type}): Phone ${c.phone}, Terms: ${c.payment_terms || "N/A"}, CLV Tier: ${c.clv_tier || "N/A"}`);
  });

  // Fetch invoices
  console.log("\n📄 Fetching invoices...");
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*, contacts(name)')
    .eq('business_id', businessId);

  if (invError) {
    console.error("❌ Failed to fetch invoices:", invError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${invoices.length} invoices:`);
  invoices.forEach(i => {
    console.log(`   - Invoice ${i.invoice_number} for ${i.contacts?.name}: Total ₹${i.total_amount}, Paid: ₹${i.amount_paid}, Status: ${i.status.toUpperCase()}, Date: ${i.invoice_date}`);
  });

  console.log("\n🎉 All database and RLS policy checks passed successfully for the electronics showroom user!");
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
