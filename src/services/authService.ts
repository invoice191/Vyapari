import { supabase } from "../lib/supabase";

export const authService = {
  createProfile: async (userId: string, data: {
    full_name: string;
    business_name: string;
    industry: string;
    role?: string;
  }) => {
    // 1. Create a business record first
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name: data.business_name,
        settings: { onboarding_completed: true, industry: data.industry }
      })
      .select()
      .single();

    if (bizError) throw bizError;

    // 2. Create the profile linked to the business
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: data.full_name,
        business_id: business.id,
        role: data.role || 'owner'
      });

    if (profileError) throw profileError;

    // 3. Log the event
    await supabase.from('audit_logs').insert({
      action: 'BUSINESS_ONBOARDING_COMPLETED',
      module: 'Auth',
      metadata: { business_id: business.id, business_name: data.business_name },
      severity: 'Info'
    });

    return business;
  },

  updateSettings: async (businessId: string, settings: any) => {
    const { error } = await supabase
      .from('businesses')
      .update({ settings })
      .eq('id', businessId);
    if (error) throw error;
  }
};
