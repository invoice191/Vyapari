import { supabase } from "../lib/supabase";

export interface OCRExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number | null;
  total: number;
}

export interface OCRExtractionResult {
  vendor_name: string;
  vendor_gstin: string | null;
  bill_date: string;
  bill_number: string | null;
  items: OCRExtractedItem[];
  subtotal: number;
  tax_total: number;
  grand_total: number;
}

export const ocrService = {
  extractFromImage: async (imageBase64: string, mimeType: string): Promise<OCRExtractionResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('ocr-service', {
        body: { image: imageBase64, mimeType }
      });

      if (error) throw error;
      return data as OCRExtractionResult;
    } catch (error) {
      console.error("OCR Extraction Failure:", error);
      throw error;
    }
  }
};
