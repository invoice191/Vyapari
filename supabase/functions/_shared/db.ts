
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://nossraveojtofrpjxlhn.supabase.co';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ';

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function getBusinessByChatId(chatId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .single();

  if (error) return null;
  return data;
}

export async function updateBusinessTelegram(businessId: string, chatId: string, enabled: boolean) {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      telegram_chat_id: chatId,
      telegram_notifications_enabled: enabled,
    })
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTodaySummary(businessId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Sales today
  const { data: sales, error: salesError } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('business_id', businessId)
    .eq('invoice_date', today)
    .eq('is_purchase', false);

  // Invoice count today
  const invoiceCount = sales?.length || 0;
  const totalSales = sales?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

  // New customers today
  const { data: customers, error: customerError } = await supabase
    .from('contacts')
    .select('id')
    .eq('business_id', businessId)
    .eq('type', 'customer')
    .gte('created_at', `${today}T00:00:00Z`);

  const newCustomers = customers?.length || 0;

  // Top product today
  const { data: topProductData } = await supabase.rpc('get_top_product_today', { 
    p_business_id: businessId,
    p_date: today 
  });
  
  // Total outstanding dues
  const { data: duesData } = await supabase
    .from('invoices')
    .select('total_amount, partial_paid_amount')
    .eq('business_id', businessId)
    .eq('payment_status', 'unpaid');
    
  const totalDues = duesData?.reduce((acc, curr) => acc + (Number(curr.total_amount) - Number(curr.partial_paid_amount)), 0) || 0;

  return {
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    totalSales,
    invoiceCount,
    newCustomers,
    topProduct: topProductData?.[0]?.product_name || 'N/A',
    totalDues
  };
}
