import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface PaymentScore {
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
  reason: string;
  suggestion: string;
}

export function usePaymentScore(customerId: string, invoiceAmount: number) {
  const { profile } = useAuth();
  const [score, setScore] = useState<PaymentScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId || invoiceAmount < 1 || !profile?.business_id) {
      setScore(null);
      return;
    }

    const cacheKey = `payment_score_${customerId}_${Math.round(invoiceAmount / 100) * 100}`;

    const fetchScore = async () => {
      setLoading(true);

      try {
        // Check cache first
        const { data: cached } = await supabase.from('ai_cache')
          .select('response')
          .eq('cache_key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (cached) {
          setScore(cached.response as PaymentScore);
          setLoading(false);
          return;
        }

        // Fetch customer data for context
        const { data: customer } = await supabase
          .rpc('get_customer_credit_status', {
            p_business_id: profile.business_id,
            p_contact_id: customerId
          });

        // Call Gemini Edge Function
        const { data, error } = await supabase.functions.invoke('payment-score', {
          body: { customerData: customer?.[0], invoiceAmount }
        });

        if (error) throw error;

        const result = data as PaymentScore;

        // Cache for 30 minutes
        await supabase.from('ai_cache').upsert({
          cache_key: cacheKey,
          response: result,
          business_id: profile.business_id,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        setScore(result);
      } catch (err) {
        console.error('Payment Score Error:', err);
        // Fallback for offline/error
        setScore(null);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchScore, 1000);
    return () => clearTimeout(debounce);
  }, [customerId, invoiceAmount, profile?.business_id]);

  return { score, loading };
}
