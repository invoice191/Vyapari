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
          description: `Price deviation detected for "${itemDesc}". Master Cost: Rs.${expectedPrice}, Billed: Rs.${actualPrice}`
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
  },

  /**
   * Intelligent Auto-Matching:
   * Finds potential pending Purchase Orders in the DB that align with this OCR receipt
   */
  findMatchingPurchaseOrder: async (supabaseClient: any, businessId: string, vendorId: string, billTotal: number) => {
    if (!vendorId) return null;

    // 1. Fetch open POs for this vendor
    const { data: openPOs } = await supabaseClient
      .from('purchase_orders')
      .select('*')
      .eq('business_id', businessId)
      .eq('supplier_id', vendorId)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false });

    if (!openPOs || openPOs.length === 0) return null;

    // 2. Score each PO to find the closest matching logical candidate
    const scoredPOs = openPOs.map((po: any) => {
      let score = 0;
      
      // Perfect match on amount = HUGE points
      const amountDiff = Math.abs(Number(po.total_amount) - Number(billTotal));
      if (amountDiff < 1) score += 100;
      else if (amountDiff < (Number(po.total_amount) * 0.05)) score += 50; // within 5%
      
      return { po, score };
    }).filter((s: any) => s.score > 0);

    // Sort by highest score
    scoredPOs.sort((a: any, b: any) => b.score - a.score);

    return scoredPOs.length > 0 ? scoredPOs[0].po : null;
  },

  /**
   * Universal Bank Statement CSV Parser
   * Uses heuristics to identify Date, Description, Debit, Credit columns from arbitrary bank CSV formats (HDFC, ICICI, SBI)
   */
  parseBankCSV: (csvContent: string) => {
    try {
      const lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) return [];

      let headerIdx = -1;
      
      // Heuristic: Find the header row (contains Date, Narration/Description, Debit/Withdrawal, Credit/Deposit)
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const lineLower = lines[i].toLowerCase();
        if (lineLower.includes("date") && (lineLower.includes("particular") || lineLower.includes("description") || lineLower.includes("narration"))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        throw new Error("Could not detect standard bank statement headers.");
      }

      const headers = lines[headerIdx].split(',').map(h => h.toLowerCase().replace(/["']/g, '').trim());
      
      const dateCol = headers.findIndex(h => h.includes("date"));
      const descCol = headers.findIndex(h => h.includes("description") || h.includes("particular") || h.includes("narration"));
      const debitCol = headers.findIndex(h => h.includes("debit") || h.includes("withdrawal"));
      const creditCol = headers.findIndex(h => h.includes("credit") || h.includes("deposit"));
      const amountCol = headers.findIndex(h => h === "amount");

      const transactions = [];

      for (let i = headerIdx + 1; i < lines.length; i++) {
        // Handle basic CSV splitting (ignoring commas inside quotes for a robust parser, but simple split for now)
        // Simplified regex to split by comma outside quotes
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cleanCols = cols.map((c: string) => c.replace(/^"|"$/g, '').trim());

        if (cleanCols.length < 3) continue;

        let type = 'unknown';
        let amount = 0;

        if (debitCol !== -1 && cleanCols[debitCol] && Number(cleanCols[debitCol]) > 0) {
          type = 'debit';
          amount = Number(cleanCols[debitCol]);
        } else if (creditCol !== -1 && cleanCols[creditCol] && Number(cleanCols[creditCol]) > 0) {
          type = 'credit';
          amount = Number(cleanCols[creditCol]);
        } else if (amountCol !== -1) {
          const rawAmt = Number(cleanCols[amountCol]);
          type = rawAmt < 0 ? 'debit' : 'credit';
          amount = Math.abs(rawAmt);
        }

        if (amount > 0) {
          transactions.push({
            date: cleanCols[dateCol],
            description: descCol !== -1 ? cleanCols[descCol] : 'Unknown Transaction',
            type,
            amount
          });
        }
      }

      return transactions;
    } catch (e: any) {
      console.error("[CSV Parser] Failed:", e);
      throw e;
    }
  }
};
