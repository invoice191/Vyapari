export interface Business {
  id: string;
  name: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  state_code: string;
  upi_id?: string;
  invoice_prefix: string;
  invoice_counter: number;
  settings: any;
  plan: 'free' | 'starter' | 'growth' | 'pro';
  created_at: string;
}

export interface Profile {
  id: string;
  business_id: string;
  full_name: string;
  role: 'owner' | 'manager' | 'staff';
  phone?: string;
  avatar_url?: string;
  language_preference: 'en' | 'hi';
  created_at: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
export type ContactType = 'customer' | 'supplier';
