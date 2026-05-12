
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  const businessId = '6f2549a0-6228-4061-8288-6644f1073809'; // The target business
  const userId = '6f2549a0-6228-4061-8288-6644f1073809'; // Using same ID for simplicity in mock

  console.log("Seeding high-fidelity data for business:", businessId);

  // 1. Clear existing data for this business (Safely)
  await supabase.from('invoice_items').delete().eq('business_id', businessId);
  await supabase.from('invoices').delete().eq('business_id', businessId);
  await supabase.from('ledger_entries').delete().eq('business_id', businessId);
  await supabase.from('stock_movements').delete().eq('business_id', businessId);
  await supabase.from('products').delete().eq('business_id', businessId);
  await supabase.from('contacts').delete().eq('business_id', businessId);

  // 2. Create Contacts (Customers & Suppliers)
  const customers = [
    { name: 'Rahul Sharma', phone: '9876543210', type: 'customer', email: 'rahul@example.com', business_id: businessId, city: 'Mumbai', clv_tier: 'Gold' },
    { name: 'Anita Patel', phone: '9123456789', type: 'customer', email: 'anita@example.com', business_id: businessId, city: 'Ahmedabad', clv_tier: 'Silver' },
    { name: 'Vikram Singh', phone: '9988776655', type: 'customer', email: 'vikram@example.com', business_id: businessId, city: 'Delhi', clv_tier: 'Bronze' },
    { name: 'Suresh Kumar', phone: '9898989898', type: 'customer', email: 'suresh@example.com', business_id: businessId, city: 'Mumbai', clv_tier: 'Gold' },
    { name: 'Global Distributors', phone: '8001234567', type: 'supplier', business_id: businessId, city: 'Surat' }
  ];
  const { data: contactData } = await supabase.from('contacts').insert(customers).select();

  // 3. Create Categories
  const categories = [
    { name: 'Electronics', business_id: businessId },
    { name: 'FMCG', business_id: businessId },
    { name: 'Home Appliances', business_id: businessId }
  ];
  const { data: catData } = await supabase.from('categories').insert(categories).select();

  // 4. Create Products with variable margins
  const products = [
    { name: 'Smartphone Pro 14', cost_price: 45000, selling_price: 52000, category_id: catData?.[0].id, quantity: 15, reorder_point: 5, business_id: businessId, sku: 'SP14' },
    { name: 'Wireless Earbuds', cost_price: 1200, selling_price: 1500, category_id: catData?.[0].id, quantity: 50, reorder_point: 10, business_id: businessId, sku: 'WE20' },
    { name: 'Tea Powder (1kg)', cost_price: 320, selling_price: 380, category_id: catData?.[1].id, quantity: 200, reorder_point: 40, business_id: businessId, sku: 'TEA1' },
    { name: 'Cooking Oil (5L)', cost_price: 650, selling_price: 720, category_id: catData?.[1].id, quantity: 120, reorder_point: 30, business_id: businessId, sku: 'OIL5' },
    { name: 'Smart LED TV 43"', cost_price: 22000, selling_price: 28000, category_id: catData?.[2].id, quantity: 8, reorder_point: 3, business_id: businessId, sku: 'TV43' },
    { name: 'Mixer Grinder', cost_price: 3500, selling_price: 4800, category_id: catData?.[2].id, quantity: 25, reorder_point: 5, business_id: businessId, sku: 'MX50' }
  ];
  const { data: prodData } = await supabase.from('products').insert(products).select();

  // 5. Create Invoices (Sales) over 90 days
  const invoices = [];
  const items = [];
  const ledgers = [];

  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 1.5)); // Spread over 90 days
    
    const customer = contactData?.[Math.floor(Math.random() * 4)]; // Pick first 4 customers
    const productCount = Math.floor(Math.random() * 3) + 1;
    let subtotal = 0;
    
    const invoiceId = crypto.randomUUID();
    const invNum = `INV-${2000 + i}`;

    for (let j = 0; j < productCount; j++) {
      const product = prodData?.[Math.floor(Math.random() * prodData.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const price = (product?.selling_price || 100) * (Math.random() > 0.8 ? 0.95 : 1); // Occasional discount
      const total = qty * price;
      
      items.push({
        invoice_id: invoiceId,
        product_id: product?.id,
        quantity: qty,
        unit_price: price,
        cost_price: product?.cost_price,
        line_total: total,
        business_id: businessId,
        created_at: date.toISOString()
      });
      subtotal += total;
    }

    const totalAmt = subtotal * 1.12; // 12% GST

    invoices.push({
      id: invoiceId,
      invoice_number: invNum,
      contact_id: customer?.id,
      invoice_date: date.toISOString().split('T')[0],
      subtotal: subtotal,
      gst_amt: subtotal * 0.12,
      total_amount: totalAmt,
      status: Math.random() > 0.1 ? 'paid' : 'overdue',
      payment_method: 'cash',
      business_id: businessId,
      created_at: date.toISOString()
    });

    // Ledger entries
    ledgers.push({
      contact_id: customer?.id,
      type: 'credit',
      amount: totalAmt,
      invoice_id: invoiceId,
      description: `Sale ${invNum}`,
      timestamp: date.toISOString(),
      business_id: businessId,
      entity_name: customer?.name
    });
  }

  // 6. Add some Expenses (Debit) to ledger
  for (let i = 0; i < 15; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 6));
    const amount = Math.floor(Math.random() * 20000) + 5000;
    
    ledgers.push({
      type: 'debit',
      amount: amount,
      description: i % 3 === 0 ? 'Rent Payment' : 'Supplier Payment',
      timestamp: date.toISOString(),
      business_id: businessId,
      entity_name: 'Landlord / Supplier'
    });
  }

  await supabase.from('invoices').insert(invoices);
  await supabase.from('invoice_items').insert(items);
  await supabase.from('ledger_entries').insert(ledgers);

  console.log("Seeding complete!");
}

seedData();
