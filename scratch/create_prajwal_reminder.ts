import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://nossraveojtofrpjxlhn.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createOverdueReminder() {
  console.log("=== Autonomous Overdue Bill & Scheduler Utility ===");
  
  // 1. Fetch the default business ID
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name')
    .limit(1);
    
  if (bizError || !businesses || businesses.length === 0) {
    throw new Error("No business configuration found: " + (bizError?.message || "Empty list"));
  }
  
  const businessId = businesses[0].id;
  const businessName = businesses[0].name;
  console.log(`✓ Synchronized Business: ${businessName} (${businessId})`);

  // 2. Fetch or create contact Prajwal
  const phone = "+919359850496";
  const name = "Prajwal";
  
  let contactId: string | null = null;
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('phone', phone)
    .eq('business_id', businessId)
    .limit(1);

  if (existingContacts && existingContacts.length > 0) {
    contactId = existingContacts[0].id;
    console.log(`✓ Existing customer Prajwal detected with ID: ${contactId}`);
  } else {
    const { data: newContact, error: contactInsertError } = await supabase
      .from('contacts')
      .insert({
        business_id: businessId,
        name: name,
        phone: phone,
        email: "prajwal@vyapari.in",
        type: "customer"
      })
      .select()
      .single();

    if (contactInsertError) {
      throw new Error(`Failed to provision contact: ${contactInsertError.message}`);
    }
    contactId = newContact.id;
    console.log(`✓ Successfully provisioned customer Prajwal with ID: ${contactId}`);
  }

  // 3. Create Overdue Invoice for Prajwal
  const invNumber = `INV-OD-FEES-${Math.floor(10000 + Math.random() * 90000)}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); // Overdue starting yesterday
  
  const { data: invoice, error: invoiceInsertError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invNumber,
      business_id: businessId,
      contact_id: contactId,
      total_amount: 5000, // INR 5,000 Overdue Fees
      partial_paid_amount: 0,
      status: 'overdue', // Sets correct status 'overdue' (matching check constraint lowercase!)
      type: 'sale',
      invoice_date: yesterday.toISOString().split('T')[0],
      due_date: yesterday.toISOString().split('T')[0]
    })
    .select()
    .single();

  if (invoiceInsertError) {
    throw new Error(`Failed to insert invoice: ${invoiceInsertError.message}`);
  }
  const invoiceId = invoice.id;
  console.log(`✓ Successfully registered Overdue Fees Bill: ${invoice.invoice_number} (ID: ${invoiceId})`);

  // 4. Calculate 10:00 AM Morning Timestamp for Today (May 19, 2026)
  // Local Time: 2026-05-19 10:00:00 IST (+05:30)
  const remindTime = new Date("2026-05-19T10:00:00+05:30");
  
  // 5. Schedule WhatsApp Queue notification
  const messageText = `Namaste Prajwalji, this is an automated alert from Vyapari. Your bill #${invNumber} for Overdue Fees is unpaid. Amount: ₹5,000. Please settle immediately today. Pay at: http://localhost:3000/pay?inv=${invNumber}`;
  const { data: qItem, error: qError } = await supabase
    .from('whatsapp_queue')
    .insert({
      business_id: businessId,
      contact_id: contactId,
      phone: phone,
      message: messageText,
      message_type: 'automation',
      reference_id: invoiceId,
      reference_type: 'invoice',
      scheduled_for: remindTime.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (qError) {
    throw new Error(`Failed to schedule WhatsApp queue: ${qError.message}`);
  }
  console.log(`✓ Successfully queued and scheduled WhatsApp alert for Prajwal!`);

  // 6. Schedule general dashboard reminder (without contact_id column)
  const { data: reminder, error: reminderInsertError } = await supabase
    .from('reminders')
    .insert({
      business_id: businessId,
      message: `Scheduled payment reminder alert for Prajwal (9359850496) at 10:00 AM regarding Overdue Fees bill (${invNumber}).`,
      remind_at: remindTime.toISOString(),
      status: 'pending',
      created_by: 'dunning'
    })
    .select()
    .single();

  if (reminderInsertError) {
    throw new Error(`Failed to schedule reminders: ${reminderInsertError.message}`);
  }

  console.log(`✓ Successfully scheduled general reminder!`);
  console.log(`\n=== Scheduled Reminder Specifications ===`);
  console.log(`  - Target Customer: ${name}`);
  console.log(`  - Target Phone: ${phone}`);
  console.log(`  - Scheduled For: ${remindTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`);
  console.log(`  - Invoice Number: ${invNumber}`);
  console.log(`  - Message Body: "${messageText}"`);
}

createOverdueReminder().catch(err => {
  console.error("❌ Execution failed:", err);
});
