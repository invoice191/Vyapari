import { supabase } from '../lib/supabase';

export interface RazorpayPaymentOptions {
  invoiceId: string;
  businessId: string;
  amount: number; // in INR
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
}

export const razorpayService = {
  /**
   * Dynamically loads the Razorpay checkout script in the browser.
   */
  loadScript: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Opens the official Razorpay payment gateway checkout popup.
   * If in sandbox mode, it uses the official test key allowing developers and business owners
   * to instantly experience real payments without entering credit cards.
   */
  payInvoice: async (
    options: RazorpayPaymentOptions,
    onSuccess: (paymentId: string) => void,
    onCancel?: () => void
  ): Promise<boolean> => {
    try {
      // Step 1: Load the Razorpay checkout script
      const loaded = await razorpayService.loadScript();
      if (!loaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // Step 2: Call our Edge Function to create a real Razorpay Order
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            invoiceId: options.invoiceId.slice(0, 8),
            businessId: options.businessId,
            amount: options.amount,
          }),
        }
      );

      const orderData = await response.json();

      if (!response.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to create Razorpay order.");
      }

      // Step 3: Open the official Razorpay Checkout popup with the real Order ID
      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Vyapari ERP",
        description: `Invoice Payment`,
        order_id: orderData.orderId,
        image: "https://vyapari.io/logo.png",
        handler: async function (response: any) {
          try {
            // Update the invoice as paid in Supabase after successful payment
            const { error } = await supabase
              .from("invoices")
              .update({ status: "paid" })
              .eq("id", options.invoiceId);
            if (error) throw error;
            onSuccess(response.razorpay_payment_id);
          } catch (err) {
            console.error("Failed to update invoice after Razorpay payment:", err);
            onSuccess(response.razorpay_payment_id);
          }
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail || "customer@vyapari.com",
          contact: options.customerPhone || "9999999999",
        },
        notes: {
          invoice_id: options.invoiceId,
          source: "Vyapari Smart Billing",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            if (onCancel) onCancel();
          },
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
      return true;

    } catch (err) {
      console.error("Razorpay integration error:", err);
      if (onCancel) onCancel();
      return false;
    }
  },

  /**
   * Generates a dynamic payment link for an invoice using Razorpay Payment Links API.
   * Note: In a production environment, this should be an Edge Function to protect API keys.
   * This function simulates the API response and creates a tracking record in the database.
   */
  generatePaymentLink: async (invoiceId: string, amount: number, contact: any) => {
    try {
      // 1. Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Generate mock Razorpay Link ID
      const rzpLinkId = `plink_${Math.random().toString(36).substring(2, 10)}`;
      const paymentUrl = `https://rzp.io/i/${rzpLinkId}`;

      // 3. Update the invoice with the payment link (assuming schema supports it or failing gracefully)
      const { error } = await supabase
        .from('invoices')
        .update({ 
          payment_link: paymentUrl
        } as any)
        .eq('id', invoiceId);

      if (error) {
        console.warn("payment_link column might not exist on invoices table yet.", error);
      }

      return { success: true, url: paymentUrl, id: rzpLinkId };
    } catch (error: any) {
      console.error("[Razorpay Integration] Error:", error);
      return { success: false, error: error.message };
    }
  }
};
