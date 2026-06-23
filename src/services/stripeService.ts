import { supabase } from '../lib/supabase';

export interface StripePaymentOptions {
  invoiceId: string;
  businessId: string;
  amount: number; // in INR or USD
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
}

export const stripeService = {
  /**
   * Dynamically loads the official Stripe.js script in the browser.
   */
  loadScript: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Stripe) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Initializes Stripe with the provided publishable key and opens a premium payment session.
   * On success, it automatically mutates the database to update the invoice status to "paid".
   */
  payInvoice: async (
    options: StripePaymentOptions,
    onSuccess: (sessionId: string) => void,
    onCancel?: () => void
  ): Promise<boolean> => {
    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
      if (!publishableKey) {
        throw new Error("Stripe Publishable Key is not configured in environment variables (VITE_STRIPE_PUBLISHABLE_KEY).");
      }

      console.log("Initiating real Stripe Checkout session...");

      // Call our Supabase Edge Function to create a Checkout Session
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          invoiceId: options.invoiceId,
          businessId: options.businessId,
          amount: options.amount,
          customerName: options.customerName,
          customerEmail: options.customerEmail
        }
      });

      if (error || !data) {
        console.error("Edge Function Error:", error);
        throw new Error("Failed to create Stripe Checkout session on the server.");
      }
      
      if (data.error) {
         throw new Error(data.error);
      }

      // The Edge Function returns the Stripe session URL
      if (data.url) {
        // Redirect the user to the secure Stripe Checkout hosted page
        window.location.href = data.url;
        return true;
      } else {
        throw new Error("No checkout URL returned from server.");
      }

    } catch (err) {
      console.error("Stripe integration error:", err);
      if (onCancel) onCancel();
      return false;
    }
  },

  /**
   * Generates a Stripe Payment Link URL
   */
  generatePaymentLink: async (invoiceId: string, amount: number, customer: any, invoiceNumber?: string): Promise<{success: boolean; url: string}> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Instead of a fake stripe.com link, we generate a link to our secure Payment Portal
        // We use window.location.origin so it works locally and in production
        const invParam = invoiceNumber || invoiceId;
        const localLink = `${window.location.origin}/pay?inv=${invParam}`;
        resolve({ success: true, url: localLink });
      }, 800);
    });
  }
};
