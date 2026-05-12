import { Product } from "./types";

export interface OCRResult {
  vendor_name?: string;
  vendor_gstin?: string;
  bill_date?: string;
  bill_number?: string;
  payment_terms?: string;
  grand_total?: number;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_rate?: number;
  }>;
}

export interface ReconciliationDiscrepancy {
  type: "PRICE_MISMATCH" | "QUANTITY_MISMATCH" | "UNRECOGNIZED_ITEM" | "VENDOR_MISMATCH";
  item?: any;
  expected?: any;
  actual?: any;
  description: string;
}

const stringSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

const editDistance = (s1: string, s2: string): number => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

export const reconciliationService = {
  reconcileInvoice: (ocrResult: OCRResult, inventory: any[] = [], contacts: any[] = []) => {
    const discrepancies: ReconciliationDiscrepancy[] = [];
    const matchedItems: any[] = [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const safeContacts = Array.isArray(contacts) ? contacts : [];

    // 1. Vendor Matching
    let matchedVendor = null;
    if (ocrResult.vendor_name) {
      // Priority 1: GSTIN match
      if (ocrResult.vendor_gstin) {
        matchedVendor = safeContacts.find(c => c.gstin === ocrResult.vendor_gstin);
      }
      
      // Priority 2: Name match (fuzzy)
      if (!matchedVendor) {
        const vendorScores = safeContacts.map(c => ({
          contact: c,
          score: stringSimilarity(ocrResult.vendor_name || "", c.name || "")
        }));
        
        const bestMatch = vendorScores.sort((a, b) => b.score - a.score)[0];
        if (bestMatch && bestMatch.score > 0.7) {
          matchedVendor = bestMatch.contact;
        }
      }
    }

    if (!matchedVendor) {
      discrepancies.push({
        type: "VENDOR_MISMATCH",
        actual: ocrResult.vendor_name,
        description: `Vendor "${ocrResult.vendor_name}" not found in master records.`
      });
    }

    // 2. Item Matching
    (ocrResult?.items || []).forEach(ocrItem => {
      const itemDesc = ocrItem.description || "Unknown Item";
      
      // Fuzzy item match
      const itemScores = safeInventory.map(p => ({
        product: p,
        score: stringSimilarity(itemDesc, p.name || "")
      }));

      const bestItemMatch = itemScores.sort((a, b) => b.score - a.score)[0];
      const matchedProduct = bestItemMatch && bestItemMatch.score > 0.6 ? bestItemMatch.product : null;

      if (!matchedProduct) {
        discrepancies.push({
          type: "UNRECOGNIZED_ITEM",
          item: ocrItem,
          description: `Item "${itemDesc}" not recognized in product master.`
        });
        matchedItems.push({ ...ocrItem, matched: false });
        return;
      }

      // Check price discrepancy (against cost_price for purchases)
      const expectedPrice = matchedProduct.cost_price || 0;
      const actualPrice = ocrItem.unit_price;
      
      if (expectedPrice > 0 && Math.abs(expectedPrice - actualPrice) / expectedPrice > 0.15) {
        discrepancies.push({
          type: "PRICE_MISMATCH",
          item: ocrItem,
          expected: expectedPrice,
          actual: actualPrice,
          description: `Price deviation detected for "${itemDesc}". Master Cost: ₹${expectedPrice}, Billed: ₹${actualPrice}`
        });
      }

      matchedItems.push({
        ...ocrItem,
        matched: true,
        productId: matchedProduct.id,
        masterName: matchedProduct.name,
        masterPrice: matchedProduct.cost_price
      });
    });

    return {
      success: discrepancies.length === 0,
      discrepancies,
      matchedItems,
      matchedVendor,
      vendorMatch: !!matchedVendor,
    };
  }
};
