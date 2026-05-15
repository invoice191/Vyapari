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

  createUser: async (userData: any) => {
    try {
      const apiUrl = `${window.location.origin}/api/provision-staff`;
      console.log(`[Provisioning Debug] Requesting: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_API_AUTH_TOKEN}`
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Provisioning failed');

      return {
        password: result.password,
        user_id: result.user_id
      };
    } catch (error) {
      console.error("Provisioning Error:", error);
      throw error;
    }
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
