
import Tesseract from 'tesseract.js';

export interface ExtractedData {
  vendor: string;
  invoice_no: string;
  date: string;
  total_amount: number;
  confidence: number;
  items: Array<{ description: string; quantity: number; total: number }>;
}

export const LocalOCRService = {
  /**
   * Main entry point for local OCR
   */
  async extractFromImage(imagePath: string): Promise<ExtractedData> {
    console.log("[LocalOCR] Starting extraction...");
    
    const result = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: m => console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`) }
    );

    const text = result.data.text;
    console.log("[LocalOCR] Raw Text Extracted:", text);

    return this.parseText(text, result.data.confidence);
  },

  /**
   * Heuristic parser for raw text - "Trained" for Indian Invoice ecosystem
   */
  parseText(text: string, ocrConfidence: number): ExtractedData {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // 1. IMPROVED VENDOR DETECTION
    // Often vendors have "Pvt Ltd", "Store", "Shop", "Agency" in their name
    let vendor = "Unknown Vendor";
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.match(/(?:Pvt|Ltd|Store|Shop|Agency|Enterprise|Distributor|Trading|Mart|Foods)/i)) {
        vendor = line;
        break;
      }
    }
    if (vendor === "Unknown Vendor" && lines.length > 0) vendor = lines[0];

    // 2. ROBUST DATE DETECTION (Supports DD/MM/YY, DD-MMM-YYYY, etc.)
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,           // 09/05/2026
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i, // 09 May 2026
      /(?:Date|Dated)[:.\s]*(\d{1,2}[.\s]\d{1,2}[.\s]\d{2,4})/i // Date: 09.05.26
    ];
    
    let date = new Date().toLocaleDateString();
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = match[1];
        break;
      }
    }

    // 3. GSTIN DETECTION (Indian Standard)
    const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/);
    const gstin = gstinMatch ? gstinMatch[0] : null;

    // 4. IMPROVED INVOICE NO
    const invPatterns = [
      /(?:Invoice|Bill|Inv|Tax Invoice|Memo)\s*(?:No|#|Num)?[:.\s]*([A-Z0-9\-\/]+)/i,
      /\b(?:Vch|Ref)[:.\s]*([A-Z0-9\-\/]+)/i
    ];
    let invoice_no = "B-LOCAL-" + Math.floor(Math.random() * 1000);
    for (const pattern of invPatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 3) {
        invoice_no = match[1];
        break;
      }
    }

    // 5. SMARTER TOTAL AMOUNT DETECTION
    // Look for lines containing "Total", "Grand Total", "Amount Payable", "Net"
    const amountPatterns = [
      /(?:Grand Total|Total Amount|Net Payable|Amount Payable|Amount Due)[:.\s]*₹?\s*(\d+(?:[.,]\d{2})?)/i,
      /(?:Total|Net)[:.\s]*₹?\s*(\d+(?:[.,]\d{2})?)/i,
      /₹\s*(\d+(?:[.,]\d{2})?)/ // Any amount following a Rupee symbol at the end of text
    ];
    
    let total_amount = 0;
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        total_amount = parseFloat(match[1].replace(',', ''));
        break;
      }
    }

    // 6. "TRAINED" ITEM TABLE EXTRACTION
    const items: any[] = [];
    lines.forEach(line => {
      // Pattern: Item Name ... Qty x Price ... Total
      // Example: "Basmati Rice 5kg 1 x 650.00 650.00"
      const lineItemsMatch = line.match(/(.*?)\s+(\d+(?:\.\d+)?)\s*[*x]\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
      
      if (lineItemsMatch) {
        items.push({
          description: lineItemsMatch[1].trim(),
          quantity: parseFloat(lineItemsMatch[2]),
          total: parseFloat(lineItemsMatch[4])
        });
      } else {
        // Fallback for simple "Item Name Price"
        const simpleMatch = line.match(/^([A-Z\s]+)\s+(\d+(?:\.\d{2})?)$/i);
        if (simpleMatch && !line.match(/Total|Net|GST|SGST|CGST/i)) {
          items.push({
            description: simpleMatch[1].trim(),
            quantity: 1,
            total: parseFloat(simpleMatch[2])
          });
        }
      }
    });

    // If still no items, look for anything that looks like a product name and a price
    if (items.length === 0) {
      lines.forEach(line => {
        if (line.match(/\d+(?:[.,]\d{2})/) && line.length > 5 && !line.match(/Total|Bill|Invoice|GST/i)) {
          const parts = line.split(/\s{2,}/);
          if (parts.length >= 2) {
            items.push({ description: parts[0], quantity: 1, total: parseFloat(parts[parts.length-1].replace(',', '')) });
          }
        }
      });
    }

    if (items.length === 0 && total_amount > 0) {
      items.push({ description: "Extracted Goods", quantity: 1, total: total_amount });
    }

    return {
      vendor: gstin ? `${vendor} (GST: ${gstin})` : vendor,
      invoice_no,
      date,
      total_amount,
      confidence: Math.round(ocrConfidence),
      items: items.slice(0, 10) // Limit to top 10 items for local engine
    };
  }
};
