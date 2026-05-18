import { supabase } from "../lib/supabase";

export interface GSTR2BRecord {
  vendor_gstin: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  itc_availability: 'Available' | 'Ineligible';
}

export interface ReconResult {
  record_id: string;
  status: 'matched' | 'mismatched' | 'missing_in_books' | 'missing_in_portal';
  matched_purchase_id?: string;
  match_score: number;
  notes?: string;
}

/**
 * Levenshtein Distance for Fuzzy Matching
 */
function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, (_, i) => i)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function calculateFuzzyScore(s1: string, s2: string): number {
  const distance = getLevenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

export const itcShieldService = {
  /**
   * Run the Neural Reconciliation Engine
   */
  async reconcile(businessId: string, returnPeriod: string) {
    console.log(`[ITC Shield] Starting reconciliation for ${returnPeriod}`);

    // 1. Fetch Purchase Invoices
    const { data: purchases, error: pError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, contact_id, contacts(gstin)')
      .eq('business_id', businessId)
      .eq('is_purchase', true);

    if (pError) throw pError;

    // 2. Fetch GSTR-2B Records
    const { data: portalRecords, error: rError } = await supabase
      .from('gstr2b_records')
      .select('*')
      .eq('business_id', businessId)
      .eq('reconciliation_status', 'pending');

    if (rError) throw rError;

    const results: ReconResult[] = [];

    for (const record of (portalRecords || [])) {
      let bestMatch: any = null;
      let highestScore = 0;

      // Filter purchases by same vendor GSTIN
      const vendorPurchases = purchases?.filter(p => 
        (p.contacts as any)?.gstin?.toLowerCase() === record.vendor_gstin.toLowerCase()
      );

      if (!vendorPurchases || vendorPurchases.length === 0) {
        results.push({
          record_id: record.id,
          status: 'missing_in_books',
          match_score: 0,
          notes: 'No purchases found for this GSTIN'
        });
        continue;
      }

      for (const purchase of vendorPurchases) {
        // Direct Match Score
        const invScore = calculateFuzzyScore(purchase.invoice_number, record.invoice_number);
        const amtDiff = Math.abs(Number(purchase.total_amount) - Number(record.invoice_value));
        const amtScore = amtDiff < 1 ? 1 : (amtDiff < 10 ? 0.9 : 0);

        const totalScore = (invScore * 0.7) + (amtScore * 0.3);

        if (totalScore > highestScore) {
          highestScore = totalScore;
          bestMatch = purchase;
        }
      }

      if (highestScore > 0.95) {
        results.push({
          record_id: record.id,
          status: 'matched',
          matched_purchase_id: bestMatch.id,
          match_score: highestScore
        });
      } else if (highestScore > 0.6) {
        results.push({
          record_id: record.id,
          status: 'mismatched',
          matched_purchase_id: bestMatch.id,
          match_score: highestScore,
          notes: `Potential match found (${Math.round(highestScore * 100)}% confidence). Amount diff: ${Math.abs(Number(bestMatch.total_amount) - Number(record.invoice_value))}`
        });
      } else {
        results.push({
          record_id: record.id,
          status: 'missing_in_books',
          match_score: highestScore,
          notes: 'No close match found in books'
        });
      }
    }

    // 4. Update Records in DB
    for (const res of results) {
      await supabase
        .from('gstr2b_records')
        .update({
          reconciliation_status: res.status,
          matched_purchase_id: res.matched_purchase_id,
          match_score: res.match_score
        })
        .eq('id', res.record_id);
    }

    // 5. Detect missing in portal (Purchases not in results)
    const matchedPurchaseIds = results.filter(r => r.matched_purchase_id).map(r => r.matched_purchase_id);
    const missingInPortal = purchases?.filter(p => !matchedPurchaseIds.includes(p.id));

    return {
      processed: results.length,
      matched: results.filter(r => r.status === 'matched').length,
      mismatched: results.filter(r => r.status === 'mismatched').length,
      missing_in_books: results.filter(r => r.status === 'missing_in_books').length,
      missing_in_portal: missingInPortal?.length || 0
    };
  }
};
