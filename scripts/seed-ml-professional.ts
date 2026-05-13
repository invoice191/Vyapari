import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const businessId = "496f6191-e37d-459a-ac0f-18aa59b68d41"; // Prajwal Traders

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log("=== STARTING PROFESSIONAL ML DATA SEEDING ===");
  console.log(`Target Business ID: ${businessId}`);

  // 1. Clean existing records for this business to ensure a perfect clean sandbox
  console.log("Purging old transactional data...");
  const { error: purgeItemsErr } = await supabase
    .from("invoice_items")
    .delete()
    .eq("business_id", businessId);
  if (purgeItemsErr) console.warn("Purge items warning:", purgeItemsErr.message);

  const { error: purgeInvoicesErr } = await supabase
    .from("invoices")
    .delete()
    .eq("business_id", businessId);
  if (purgeInvoicesErr) console.warn("Purge invoices warning:", purgeInvoicesErr.message);

  const { error: purgeStockMovErr } = await supabase
    .from("stock_movements")
    .delete()
    .eq("business_id", businessId);
  if (purgeStockMovErr) console.warn("Purge stock movements warning:", purgeStockMovErr.message);

  const { error: purgeStockErr } = await supabase
    .from("stock")
    .delete()
    .eq("business_id", businessId);
  if (purgeStockErr) console.warn("Purge stock warning:", purgeStockErr.message);

  const { error: purgePOItemsErr } = await supabase
    .from("purchase_order_items")
    .delete()
    .eq("business_id", businessId);
  if (purgePOItemsErr) console.warn("Purge PO items warning:", purgePOItemsErr.message);

  const { error: purgePOErr } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("business_id", businessId);
  if (purgePOErr) console.warn("Purge PO warning:", purgePOErr.message);

  const { error: purgeProductsErr } = await supabase
    .from("products")
    .delete()
    .eq("business_id", businessId);
  if (purgeProductsErr) console.warn("Purge products warning:", purgeProductsErr.message);

  const { error: purgeContactsErr } = await supabase
    .from("contacts")
    .delete()
    .eq("business_id", businessId);
  if (purgeContactsErr) console.warn("Purge contacts warning:", purgeContactsErr.message);

  console.log("Database purged successfully!");

  // 2. Seed 10 realistic Indian retail products
  console.log("Inserting professional products...");
  const productData = [
    { name: "Basmati Rice Premium", sku: "BAS-RIC-01", cost_price: 80, selling_price: 110, gst_rate: 5, unit: "kg", quantity: 500 },
    { name: "Toor Dal Super", sku: "TOR-DAL-01", cost_price: 120, selling_price: 160, gst_rate: 5, unit: "kg", quantity: 400 },
    { name: "Sunflower Oil 1L", sku: "SUN-OIL-01", cost_price: 110, selling_price: 140, gst_rate: 5, unit: "litre", quantity: 300 },
    { name: "Tata Salt Iodized", sku: "TAT-SLT-01", cost_price: 20, selling_price: 28, gst_rate: 0, unit: "pcs", quantity: 1000 },
    { name: "Britannia Marie Gold", sku: "BRT-MAR-01", cost_price: 30, selling_price: 40, gst_rate: 18, unit: "pcs", quantity: 800 },
    { name: "Amul Butter 500g", sku: "AML-BTR-01", cost_price: 200, selling_price: 250, gst_rate: 12, unit: "pcs", quantity: 200 },
    { name: "Sugar Pure", sku: "SGR-PUR-01", cost_price: 35, selling_price: 44, gst_rate: 5, unit: "kg", quantity: 600 },
    { name: "Wheat Flour Ashirvaad 5kg", sku: "ASH-FLR-05", cost_price: 210, selling_price: 260, gst_rate: 5, unit: "pcs", quantity: 150 },
    { name: "Red Label Tea 250g", sku: "RED-TEA-01", cost_price: 95, selling_price: 120, gst_rate: 5, unit: "pcs", quantity: 400 },
    { name: "Surf Excel Easy Wash 1kg", sku: "SRF-EXL-01", cost_price: 115, selling_price: 150, gst_rate: 18, unit: "pcs", quantity: 300 }
  ].map(p => ({ ...p, business_id: businessId }));

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .insert(productData)
    .select("id, name, selling_price, cost_price, gst_rate");

  if (prodErr || !products) {
    console.error("Failed to seed products:", prodErr?.message);
    process.exit(1);
  }
  console.log(`Inserted ${products.length} products.`);

  // Also seed product stock levels
  const stockData = products.map(p => ({
    product_id: p.id,
    business_id: businessId,
    quantity: 150,
    reorder_level: 20
  }));
  const { error: stockErr } = await supabase.from("stock").insert(stockData);
  if (stockErr) console.warn("Stock seeding warning:", stockErr.message);

  // 3. Seed 100 realistic customers (contacts)
  console.log("Generating 100 professional customers (40 Loyalists, 30 Churners, 30 Occasional)...");
  const contactsData: any[] = [];
  
  // 40 Loyalists
  for (let i = 1; i <= 40; i++) {
    contactsData.push({
      business_id: businessId,
      name: `Loyalist Customer ${i}`,
      type: "customer",
      phone: `9000000${String(i).padStart(3, "0")}`,
      email: `loyalist${i}@prajwaltraders.com`,
      address: `Loyalist Lane, Block ${i}`,
      city: "Bengaluru",
      state: "Karnataka",
      clv_tier: "Platinum",
      loyalty_points: 500
    });
  }

  // 30 Churners
  for (let i = 1; i <= 30; i++) {
    contactsData.push({
      business_id: businessId,
      name: `Churner Customer ${i}`,
      type: "customer",
      phone: `9100000${String(i).padStart(3, "0")}`,
      email: `churner${i}@prajwaltraders.com`,
      address: `Churner Circle, Apt ${i}`,
      city: "Bengaluru",
      state: "Karnataka",
      clv_tier: "Silver",
      loyalty_points: 50
    });
  }

  // 30 Occasionals
  for (let i = 1; i <= 30; i++) {
    contactsData.push({
      business_id: businessId,
      name: `Occasional Customer ${i}`,
      type: "customer",
      phone: `9200000${String(i).padStart(3, "0")}`,
      email: `occasional${i}@prajwaltraders.com`,
      address: `Occasional Road, Villa ${i}`,
      city: "Bengaluru",
      state: "Karnataka",
      clv_tier: "Gold",
      loyalty_points: 150
    });
  }

  const { data: contacts, error: contactsErr } = await supabase
    .from("contacts")
    .insert(contactsData)
    .select("id, name, clv_tier");

  if (contactsErr || !contacts) {
    console.error("Failed to seed customers:", contactsErr?.message);
    process.exit(1);
  }
  console.log(`Inserted ${contacts.length} customers.`);

  // 4. Generate 500 days of history
  console.log("Generating 500 days of invoice data (~11,000 invoices)...");
  const invoicesList: any[] = [];
  const invoiceItemsToCreate: { [invoiceNum: string]: any[] } = {};

  const today = new Date();
  let invoiceCounter = 1;

  for (let d = 500; d >= 1; d--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - d);
    const dateStr = currentDate.toISOString().slice(0, 10);

    // Filter customers who buy on this day
    contacts.forEach((c, index) => {
      let shouldBuy = false;
      
      if (index < 40) {
        // Loyalist (index 0 - 39): buys every ~2.2 days
        shouldBuy = Math.random() < (1 / 2.2);
      } else if (index < 70) {
        // Churner (index 40 - 69): buys every ~4 days ONLY for the first 150 days of history (i.e., d between 500 and 350)
        if (d >= 350) {
          shouldBuy = Math.random() < (1 / 4.0);
        }
      } else {
        // Occasional (index 70 - 99): buys every ~15 days
        shouldBuy = Math.random() < (1 / 15.0);
      }

      if (shouldBuy) {
        const invNum = `INV-${String(invoiceCounter++).padStart(6, "0")}`;
        
        // Select purchased items based on realistic rules to create strong association rules
        const itemsBought: any[] = [];
        
        // Association rule 1: Rice + Dal + Oil
        if (Math.random() < 0.7) {
          itemsBought.push(products[0]); // Rice
          if (Math.random() < 0.8) itemsBought.push(products[1]); // Dal
          if (Math.random() < 0.75) itemsBought.push(products[2]); // Oil
        } else if (Math.random() < 0.6) {
          // Association rule 2: Marie Gold + Tea
          itemsBought.push(products[4]); // marie gold
          if (Math.random() < 0.85) itemsBought.push(products[8]); // tea
        } else {
          // General purchase: Sugar + Wheat flour
          itemsBought.push(products[6]); // sugar
          if (Math.random() < 0.8) itemsBought.push(products[7]); // wheat flour
          if (Math.random() < 0.4) itemsBought.push(products[3]); // salt
          if (Math.random() < 0.3) itemsBought.push(products[5]); // butter
          if (Math.random() < 0.3) itemsBought.push(products[9]); // detergent
        }

        if (itemsBought.length === 0) {
          itemsBought.push(products[Math.floor(Math.random() * products.length)]);
        }

        // Calculate pricing
        let subtotal = 0;
        let gst_amt = 0;
        const lineItems = itemsBought.map(p => {
          const qty = Math.floor(Math.random() * 3) + 1;
          const lineTotal = p.selling_price * qty;
          const gst = lineTotal * (p.gst_rate / 100);
          subtotal += lineTotal;
          gst_amt += gst;

          return {
            product_id: p.id,
            business_id: businessId,
            quantity: qty,
            unit_price: p.selling_price,
            cost_price: p.cost_price,
            gst_rate: p.gst_rate,
            total: lineTotal
          };
        });

        const discount = Math.random() < 0.2 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
        const total = subtotal + gst_amt - discount;

        invoicesList.push({
          business_id: businessId,
          contact_id: c.id,
          invoice_number: invNum,
          invoice_date: dateStr,
          due_date: dateStr,
          subtotal,
          discount_amt: discount,
          gst_amt,
          total_amount: total,
          payment_method: Math.random() < 0.6 ? "UPI" : Math.random() < 0.7 ? "Cash" : "Card",
          status: "Paid",
          type: "sale",
          is_purchase: false
        });

        invoiceItemsToCreate[invNum] = lineItems;
      }
    });
  }

  console.log(`Generated ${invoicesList.length} invoices to seed. Bulk inserting in chunks...`);

  // Bulk insert invoices in chunks of 500 for extremely high performance
  const chunkSize = 500;
  for (let i = 0; i < invoicesList.length; i += chunkSize) {
    const chunk = invoicesList.slice(i, i + chunkSize);
    const { data: insertedInvs, error: invErr } = await supabase
      .from("invoices")
      .insert(chunk)
      .select("id, invoice_number");

    if (invErr || !insertedInvs) {
      console.error(`Failed to insert invoice chunk ${i}:`, invErr?.message);
      process.exit(1);
    }

    // Prepare and insert items for this chunk
    const itemsChunk: any[] = [];
    insertedInvs.forEach(inv => {
      const items = invoiceItemsToCreate[inv.invoice_number];
      if (items) {
        items.forEach(item => {
          itemsChunk.push({
            ...item,
            invoice_id: inv.id
          });
        });
      }
    });

    const { error: itemsErr } = await supabase
      .from("invoice_items")
      .insert(itemsChunk);

    if (itemsErr) {
      console.error(`Failed to insert items chunk for ${i}:`, itemsErr.message);
      process.exit(1);
    }

    console.log(`Inserted chunk [${i} to ${Math.min(i + chunkSize, invoicesList.length)}]...`);
  }

  console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
  console.log(`Total Invoices Inserted: ${invoicesList.length}`);
}

main().catch(err => {
  console.error("Critical error in seeding script:", err);
  process.exit(1);
});
