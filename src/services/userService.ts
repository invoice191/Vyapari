import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  business_id: string;
  created_at?: string;
  status?: string;
}

export const userService = {
  getUsersByBusiness: async (businessId: string): Promise<UserProfile[]> => {
    // We can join with auth.users if we have access, but typically profiles stores all we need
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', businessId);
      
    if (error) throw error;
    
    // Fallback status/email if not in profile yet
    return data.map(p => ({
      ...p,
      status: p.status || 'Active',
      email: p.email || `${p.id.substring(0, 5)}@business.com`
    }));
  },

  updateRole: async (userId: string, newRole: string, businessId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .eq('business_id', businessId);
    if (error) throw error;
  },

  suspendUser: async (userId: string, businessId: string, currentStatus = 'Active') => {
    const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId)
      .eq('business_id', businessId);
    if (error) throw error;
  },

  createUser: async (user: { full_name: string; email: string; role: string; business_id: string }) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
        status: 'Active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteUser: async (userId: string, businessId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .eq('business_id', businessId);
    if (error) throw error;
  }
};
