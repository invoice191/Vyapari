import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://nossraveojtofrpjxlhn.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not defined in the environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("🚀 Starting 'Supreme Electronics Showroom' provisioning script...");

  const email = "showroom@vyapari.com";
  const password = "Showroom@123";
  const businessName = "Supreme Electronics Showroom";

  // 1. Create or Find Auth User
  let userId: string;
  console.log(`Checking if user ${email} exists...`);
  
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.users.find((u: any) => u.email === email);

  if (existingUser) {
    userId = (existingUser as any).id;
    console.log(`User already exists with ID: ${userId}`);
  } else {
    console.log(`User not found. Creating user ${email}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Rajesh Kumar (Owner)",
        phone: "+91 9900887766",
        business_name: businessName
      }
    });

    if (createError) {
      console.error("Failed to create user:", createError.message);
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log(`User created successfully with ID: ${userId}`);
  }

  // 2. Provision Business
  let businessId: string;
  console.log(`Checking if business '${businessName}' exists for this user...`);

  // Try to find if user already has a profile with a business
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', userId)
    .single();

  if (profile?.business_id) {
    businessId = profile.business_id;
    console.log(`Found existing business linked to user profile: ${businessId}`);
  } else {
    console.log("No business link found. Creating new business...");
    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        owner_name: "Rajesh Kumar",
        email: email,
        phone: "+91 9900887766",
        address: "Plot 42, Electronics Zone, Phase 1",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400051",
        onboarding_completed: true,
        settings: {
          currency: "INR",
          tax_system: "GST",
          enable_auto_dunning: true
        }
      })
      .select('id')
      .single();

    if (bizError) {
      console.error("Failed to create business:", bizError.message);
      process.exit(1);
    }

    businessId = biz.id;
    console.log(`Business created successfully with ID: ${businessId}`);
  }

  // 3. Upsert User Profile
  console.log("Configuring owner profile...");
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      business_id: businessId,
      full_name: "Rajesh Kumar",
      display_name: "Rajesh Kumar",
      email: email,
      phone: "+91 9900887766",
      role: "owner",
      status: "Active"
    });

  if (profileError) {
    console.error("Failed to upsert profile:", profileError.message);
    process.exit(1);
  }
  console.log("Profile ready.");

  // Clear existing items/contacts/invoices if re-running to avoid duplicates
  console.log("Cleaning up old data to prevent duplication...");
  const deletes = [
    { table: 'ledger_entries', field: 'business_id' },
    { table: 'invoice_items', field: 'business_id' },
    { table: 'invoices', field: 'business_id' },
    { table: 'stock_movements', field: 'business_id' },
    { table: 'stock', field: 'business_id' },
    { table: 'products', field: 'business_id' },
    { table: 'contacts', field: 'business_id' },
    { table: 'categories', field: 'business_id' }
  ];

  for (const del of deletes) {
    const { error } = await supabase.from(del.table).delete().eq(del.field, businessId);
    if (error) {
      console.warn(`Warning: Failed to clear table ${del.table}:`, error.message);
    } else {
      console.log(`Successfully cleared ${del.table}.`);
    }
  }

  // 4. Seed Categories
  console.log("Seeding categories...");
  const categoriesData = [
    { name: "Smartphones", description: "Mobile devices & accessories", business_id: businessId, user_id: userId },
    { name: "Laptops", description: "Laptops & computing power", business_id: businessId, user_id: userId },
    { name: "Home Appliances", description: "Smart TVs, ACs, refrigerators", business_id: businessId, user_id: userId },
    { name: "Audio", description: "Headphones, speakers, soundbars", business_id: businessId, user_id: userId }
  ];

  const { data: seededCategories, error: catError } = await supabase
    .from('categories')
    .insert(categoriesData)
    .select('*');

  if (catError) {
    console.error("Failed to seed categories:", catError.message);
    process.exit(1);
  }
  console.log(`Seeded ${seededCategories.length} categories.`);

  const getCatId = (name: string) => seededCategories.find(c => c.name === name)?.id;

  // 5. Seed Contacts (Supplier & Customers)
  console.log("Seeding supplier and customer contacts...");
  const contactsData = [
    {
      name: "Reliance Digital Distributor",
      phone: "+91 9999888877",
      email: "wholesale@reliance.com",
      type: "supplier",
      business_id: businessId,
      user_id: userId,
      address: "Industrial Area Gate 4, Pune",
      city: "Pune",
      state: "Maharashtra"
    },
    {
      name: "Priyanka Sen",
      phone: "+91 9876543210",
      email: "priyanka@gmail.com",
      type: "customer",
      business_id: businessId,
      user_id: userId,
      address: "A-404, Sea Breeze Apartments, Bandra",
      city: "Mumbai",
      state: "Maharashtra",
      credit_limit: 150000,
      current_outstanding: 0,
      payment_terms: "Net 15",
      credit_score: 810,
      clv_tier: "Gold"
    },
    {
      name: "Amit Verma",
      phone: "+91 9123456789",
      email: "amit.v@hotmail.com",
      type: "customer",
      business_id: businessId,
      user_id: userId,
      address: "Sector 15, Hiranandani",
      city: "Navi Mumbai",
      state: "Maharashtra",
      credit_limit: 80000,
      current_outstanding: 29990,
      payment_terms: "Net 15",
      credit_score: 640,
      clv_tier: "Silver"
    }
  ];

  const { data: seededContacts, error: contactError } = await supabase
    .from('contacts')
    .insert(contactsData)
    .select('*');

  if (contactError) {
    console.error("Failed to seed contacts:", contactError.message);
    process.exit(1);
  }
  console.log(`Seeded ${seededContacts.length} contacts.`);

  const getContactId = (name: string) => seededContacts.find(c => c.name === name)?.id;

  // 6. Seed Products
  console.log("Seeding premium showroom products...");
  const productsData = [
    {
      name: "Apple iPhone 15 Pro",
      sku: "IPH15P-128",
      category_id: getCatId("Smartphones"),
      supplier_id: getContactId("Reliance Digital Distributor"),
      cost_price: 110000,
      selling_price: 134900,
      gst_rate: 18,
      unit: "pcs",
      reorder_point: 5,
      quantity: 18,
      business_id: businessId,
      user_id: userId
    },
    {
      name: "Samsung 55\" OLED 4K TV",
      sku: "SAM-OLED-55",
      category_id: getCatId("Home Appliances"),
      supplier_id: getContactId("Reliance Digital Distributor"),
      cost_price: 85000,
      selling_price: 115000,
      gst_rate: 18,
      unit: "pcs",
      reorder_point: 10,
      quantity: 8, // Low Stock alert!
      business_id: businessId,
      user_id: userId
    },
    {
      name: "Dell XPS 13 Laptop",
      sku: "DELL-XPS13",
      category_id: getCatId("Laptops"),
      supplier_id: getContactId("Reliance Digital Distributor"),
      cost_price: 120000,
      selling_price: 149990,
      gst_rate: 18,
      unit: "pcs",
      reorder_point: 4,
      quantity: 12,
      business_id: businessId,
      user_id: userId
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      sku: "SONY-XM5",
      category_id: getCatId("Audio"),
      supplier_id: getContactId("Reliance Digital Distributor"),
      cost_price: 22000,
      selling_price: 29990,
      gst_rate: 18,
      unit: "pcs",
      reorder_point: 8,
      quantity: 25,
      business_id: businessId,
      user_id: userId
    },
    {
      name: "LG Smart Refrigerator 450L",
      sku: "LG-REF-450",
      category_id: getCatId("Home Appliances"),
      supplier_id: getContactId("Reliance Digital Distributor"),
      cost_price: 55000,
      selling_price: 69990,
      gst_rate: 18,
      unit: "pcs",
      reorder_point: 6,
      quantity: 4, // Low Stock alert!
      business_id: businessId,
      user_id: userId
    }
  ];

  const { data: seededProducts, error: prodError } = await supabase
    .from('products')
    .insert(productsData)
    .select('*');

  if (prodError) {
    console.error("Failed to seed products:", prodError.message);
    process.exit(1);
  }
  console.log(`Seeded ${seededProducts.length} products.`);

  // Seed the initial stock in public.stock table
  console.log("Seeding initial stock levels in stock table...");
  const stockRecords = seededProducts.map(p => {
    const original = productsData.find(pd => pd.sku === p.sku)!;
    return {
      product_id: p.id,
      user_id: userId,
      business_id: businessId,
      quantity: original.quantity
    };
  });

  const { error: stockError } = await supabase
    .from('stock')
    .insert(stockRecords);

  if (stockError) {
    console.error("Failed to seed stock records:", stockError.message);
    process.exit(1);
  }
  console.log("Seeded initial stock levels successfully.");

  const getProduct = (name: string) => seededProducts.find(p => p.name === name);

  // 7. Seed Invoices
  console.log("Seeding transaction history (Invoices)...");

  // Invoice 1: Priyanka Sen bought iPhone 15 Pro (Paid)
  const phoneProd = getProduct("Apple iPhone 15 Pro")!;
  const invoice1Data = {
    invoice_number: "INV-2026-001",
    contact_id: getContactId("Priyanka Sen"),
    invoice_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 114322, // 134900 / 1.18
    discount_amt: 0,
    gst_amt: 20578,
    total_amount: 134900,
    amount_paid: 134900,
    amount_remaining: 0,
    payment_method: "upi",
    status: "paid",
    created_via: "manual",
    business_id: businessId,
    user_id: userId
  };

  const { data: inv1, error: inv1Error } = await supabase
    .from('invoices')
    .insert(invoice1Data)
    .select('*')
    .single();

  if (inv1Error) {
    console.error("Failed to create Invoice 1:", inv1Error.message);
    process.exit(1);
  }

  // Insert Invoice 1 Items
  await supabase.from('invoice_items').insert({
    invoice_id: inv1.id,
    product_id: phoneProd.id,
    quantity: 1,
    unit_price: 134900,
    cost_price: 110000,
    gst_rate: 18,
    business_id: businessId,
    user_id: userId
  });

  // Invoice 2: Amit Verma bought Sony WH-1000XM5 (Overdue)
  const audioProd = getProduct("Sony WH-1000XM5 Headphones")!;
  const invoice2Data = {
    invoice_number: "INV-2026-002",
    contact_id: getContactId("Amit Verma"),
    invoice_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days ago
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue by 3 days
    subtotal: 25415, // 29990 / 1.18
    discount_amt: 0,
    gst_amt: 4575,
    total_amount: 29990,
    amount_paid: 0,
    amount_remaining: 29990,
    payment_method: "cash",
    status: "overdue",
    created_via: "manual",
    business_id: businessId,
    user_id: userId
  };

  const { data: inv2, error: inv2Error } = await supabase
    .from('invoices')
    .insert(invoice2Data)
    .select('*')
    .single();

  if (inv2Error) {
    console.error("Failed to create Invoice 2:", inv2Error.message);
    process.exit(1);
  }

  // Insert Invoice 2 Items
  await supabase.from('invoice_items').insert({
    invoice_id: inv2.id,
    product_id: audioProd.id,
    quantity: 1,
    unit_price: 29990,
    cost_price: 22000,
    gst_rate: 18,
    business_id: businessId,
    user_id: userId
  });

  // 8. Create some Ledger Entries for the accounts
  console.log("Writing ledger entries...");
  await supabase.from('ledger_entries').insert([
    {
      contact_id: getContactId("Priyanka Sen"),
      type: "debit",
      amount: 134900,
      invoice_id: inv1.id,
      description: "Sales Invoice INV-2026-001",
      business_id: businessId,
      user_id: userId,
      entity_name: "Priyanka Sen",
      category: "sales"
    },
    {
      contact_id: getContactId("Priyanka Sen"),
      type: "credit",
      amount: 134900,
      invoice_id: inv1.id,
      description: "Payment received for INV-2026-001 via UPI",
      business_id: businessId,
      user_id: userId,
      entity_name: "Priyanka Sen",
      category: "receipt"
    },
    {
      contact_id: getContactId("Amit Verma"),
      type: "debit",
      amount: 29990,
      invoice_id: inv2.id,
      description: "Sales Invoice INV-2026-002",
      business_id: businessId,
      user_id: userId,
      entity_name: "Amit Verma",
      category: "sales"
    }
  ]);

  // 9. Initialize invoice sequences
  await supabase.from('invoice_sequences').upsert({
    business_id: businessId,
    prefix: "INV",
    last_number: 2
  });

  console.log("\n✨ Setup complete!");
  console.log("=========================================");
  console.log(`Showroom Account: ${email}`);
  console.log(`Password:         ${password}`);
  console.log(`Showroom Name:    ${businessName}`);
  console.log("=========================================");
  console.log("You can now sign in using these credentials to check the electronics showroom dashboard!");
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
