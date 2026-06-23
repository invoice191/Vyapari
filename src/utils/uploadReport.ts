import { SupabaseClient } from '@supabase/supabase-js';

export async function uploadInvoicePDF(
  supabase: SupabaseClient,
  pdfBlob: Blob,
  invoiceNumber: string,
  contactName: string,
  businessId: string
): Promise<string> {
  const date = new Date().toISOString().split("T")[0];
  const safeName = contactName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  
  const storagePath = `${businessId}/invoices/INV-${invoiceNumber}_${safeName}_${date}.pdf`;

  const { data, error } = await supabase.storage
    .from("reports")
    .upload(storagePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return storagePath;
}
