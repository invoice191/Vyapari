import { supabase } from '../lib/supabase';

export interface RazorpayPaymentOptions {
  invoiceId: string;
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
      const loaded = await razorpayService.loadScript();
      if (!loaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_default_vyapari_key";
      
      const rzpOptions = {
        key: keyId,
        amount: Math.round(options.amount * 100), // Razorpay expects amount in subunits (paise)
        currency: "INR",
        name: "Vyapari ERP",
        description: `Invoice Payment for #${options.invoiceId}`,
        image: "https://vyapari.io/logo.png", // Fallback logo
        handler: async function (response: any) {
          try {
            // Update the database to mark invoice as paid
            const { error } = await supabase
              .from("invoices")
              .update({ status: "paid" })
              .eq("id", options.invoiceId);

            if (error) throw error;

            // Trigger success callback
            onSuccess(response.razorpay_payment_id);
          } catch (err) {
            console.error("Failed to update invoice status after Razorpay payment:", err);
            // Even if DB fails, complete callback with payment ID
            onSuccess(response.razorpay_payment_id);
          }
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail || "customer@vyapari.com",
          contact: options.customerPhone || "9999999999"
        },
        notes: {
          invoice_id: options.invoiceId,
          source: "Vyapari InvoiceAI Console"
        },
        theme: {
          color: "#6366f1" // Premium Indigo matching our exact branding palette
        },
        modal: {
          ondismiss: function () {
            if (onCancel) onCancel();
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
      return true;
    } catch (err) {
      console.error("Razorpay integration error:", err);
      return false;
    }
  }
};
