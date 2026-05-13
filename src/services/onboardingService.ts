import { supabase } from "../lib/supabase";

export const onboardingService = {
  completeOnboarding: async (userId: string, data: any) => {
    console.log("[OnboardingService] Starting completion for user:", userId);
    
    // 1. Get existing business_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("[OnboardingService] Profile fetch failed:", profileError);
      throw profileError;
    }

    let businessId = profile?.business_id;
    console.log("[OnboardingService] Found businessId:", businessId);

    // 2. Map data to snake_case for DB
    const businessData = {
      name: data.businessName,
      gstin: data.gst,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logo_url: data.logoUrl,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      owner_name: data.ownerName || profile?.full_name,
      owner_pin: data.ownerPin, // Correct mapping from camelCase formData
      onboarding_completed: true
    };

    let business;
    if (businessId) {
      console.log("[OnboardingService] Updating existing business...");
      const { data: updatedBiz, error: updateError } = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', businessId)
        .select()
        .single();
      
      if (updateError) {
        console.error("[OnboardingService] Business update failed:", updateError);
        throw updateError;
      }
      business = updatedBiz;
    } else {
      console.log("[OnboardingService] Creating new business (Fallback path)...");
      const { data: newBiz, error: bizError } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();
      
      if (bizError) {
        console.error("[OnboardingService] Business insert failed:", bizError);
        throw bizError;
      }
      business = newBiz;
      businessId = business.id;
      
      // Link profile if not linked
      await supabase.from('profiles').update({ business_id: businessId }).eq('id', userId);
    }

    // 3. Upsert invoice sequence
    console.log("[OnboardingService] Initializing invoice sequence...");
    const { error: seqError } = await supabase
      .from('invoice_sequences')
      .upsert({
        business_id: businessId,
        prefix: data.invoicePrefix || 'INV',
        last_number: Math.max(0, (data.invoiceStart || 1) - 1)
      }, { onConflict: 'business_id' });

    if (seqError) {
      console.error("[OnboardingService] Sequence upsert failed:", seqError);
      throw seqError;
    }

    // 4. Initial Product (if provided)
    if (data.firstProduct?.name) {
      console.log("[OnboardingService] Creating first product...");
      const { data: product, error: prodError } = await supabase
        .from('products')
        .insert([{
          business_id: businessId,
          user_id: userId,
          name: data.firstProduct.name,
          sku: data.firstProduct.sku,
          cost_price: data.firstProduct.unit_price * 0.7, // Assume 30% margin
          selling_price: data.firstProduct.unit_price,
          quantity: 100, // Give some initial stock
          gst_rate: 18
        }])
        .select()
        .single();

      if (!prodError && product) {
        // Also sync to stock table
        await supabase.from('stock').upsert({
          product_id: product.id,
          quantity: 100,
          business_id: businessId,
          user_id: userId
        }, { onConflict: 'product_id' });
      } else if (prodError) {
        console.warn("[OnboardingService] First product creation failed (non-critical):", prodError);
      }
    }

    // 5. Initial Contact (if provided)
    if (data.firstContact?.name) {
      console.log("[OnboardingService] Creating first contact...");
      await supabase.from('contacts').insert([{
        business_id: businessId,
        user_id: userId,
        name: data.firstContact.name,
        type: data.firstContact.type || 'customer',
        phone: data.firstContact.phone
      }]);
    }

    console.log("[OnboardingService] Onboarding workflow successful!");
    return business;
  }
};
