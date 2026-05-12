import { ocrService } from "./ocrService";
import { dssService } from "./dssService";
import { invoiceService } from "./invoiceService";

/**
 * Gemini Service (Legacy Wrapper)
 * Delegates to specialized services for production reliability.
 */
export const geminiService = {
  // Legacy method preserved for compatibility
  getAIInsights: async (data: any) => {
    return await dssService.generateBusinessBriefing(data);
  },

  analyzeInvoice: async (imageBase64: string, mimeType: string) => {
    return await ocrService.extractFromImage(imageBase64, mimeType);
  },

  generateBriefing: async (data: any) => {
    return await dssService.generateBusinessBriefing(data);
  },

  parseNaturalLanguageInvoice: async (businessId: string, command: string, products: any[]) => {
    return await invoiceService.parseNaturalLanguageInvoice(businessId, command, products);
  }
};
