
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nossraveojtofrpjxlhn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BUSINESS_ID = '5b9ba1c9-636c-4813-8d62-1718104d498c';
const USER_ID = '34100592-e541-44ae-948d-38c3fa6d317b';
const PHONE = '9359850496';

async function run() {
  console.log("--- Starting End-to-End SMS & Invoice Test ---");

  // 1. Create/Ensure Contact
  console.log("1. Checking/Creating Contact...");
  let contactId;
  const { data: existing } = await supabase.from('contacts').select('id').eq('phone', PHONE).eq('business_id', BUSINESS_ID).single();
  
  if (existing) {
    contactId = existing.id;
    console.log("   Found existing contact:", contactId);
  } else {
    const { data: newContact, error: cErr } = await supabase.from('contacts').insert({
      business_id: BUSINESS_ID,
      user_id: USER_ID,
      name: 'Test Customer (9359850496)',
      phone: PHONE,
      type: 'customer'
    }).select().single();
    
    if (cErr) throw cErr;
    contactId = newContact.id;
    console.log("   Created new contact:", contactId);
  }

  // 2. Create Invoice
  console.log("2. Creating Invoice (Due Today)...");
  const today = new Date().toISOString().split('T')[0];
  const invoiceNumber = `TEST-SMS-${Math.floor(Math.random() * 10000)}`;
  
  const { data: invoice, error: iErr } = await supabase.from('invoices').insert({
    business_id: BUSINESS_ID,
    contact_id: contactId,
    invoice_number: invoiceNumber,
    invoice_date: today,
    due_date: today,
    total_amount: 1250.50,
    status: 'sent',
    payment_status: 'unpaid',
    user_id: USER_ID,
    notes: 'Automated SMS testing invoice.'
  }).select().single();

  if (iErr) throw iErr;
  console.log("   Invoice created successfully:", invoice.invoice_number, "ID:", invoice.id);

  // 3. Send SMS via Edge Function
  console.log("3. Triggering SMS via Edge Function...");
  const message = `Hello from Vyapari! Your invoice ${invoice.invoice_number} for Rs. 1250.50 is due today (${today}). Please pay here: https://vyapari.io/pay/${invoice.id}`;
  
  const { data: smsResult, error: sErr } = await supabase.functions.invoke('whatsapp-processor', {
    body: {
      direct: true,
      phone: PHONE,
      message: message,
      channel: 'sms',
      businessId: BUSINESS_ID,
      contactId: contactId,
      referenceId: invoice.id,
      referenceType: 'invoice'
    }
  });

  if (sErr) {
    console.error("   SMS Trigger Failed:", sErr);
    try {
      const body = await (sErr as any).context?.text();
      if (body) console.log("   Error Body:", body);
    } catch(e) {}
  } else {
    console.log("   SMS Result:", smsResult);
  }

  console.log("--- Test Complete ---");
}

run().catch(console.error);
