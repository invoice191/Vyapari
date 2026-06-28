/**
 * Smart Retail Analytics Engine
 * Algorithms: FP-Growth (Market Basket), RFM 5-Tier Scoring, ABC-XYZ Inventory Matrix
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  contactId: string | null;
  items: string[]; // product names
  total: number;
  date: Date;
}

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface FrequentItemset {
  items: string[];
  support: number;
  count: number;
}

export interface RFMResult {
  contactId: string;
  name: string;
  phone: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number; // 1-5
  fScore: number; // 1-5
  mScore: number; // 1-5
  rfmTotal: number; // 3-15
  segment: RFMSegment;
  segmentColor: string;
  segmentIcon: string;
  avgOrderValue: number;
  trend: 'rising' | 'stable' | 'declining';
}

export type RFMSegment =
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'Recent Customers'
  | 'Promising'
  | 'Need Attention'
  | 'About to Sleep'
  | 'At Risk'
  | 'Cannot Lose Them'
  | 'Hibernating'
  | 'Lost';

export interface ABCXYZResult {
  productId: string;
  productName: string;
  totalRevenue: number;
  revenueShare: number;    // cumulative %
  abcClass: 'A' | 'B' | 'C';
  avgDailySales: number;
  coefficientOfVariation: number; // CV = std/mean
  xyzClass: 'X' | 'Y' | 'Z';
  matrix: string; // e.g. "AX", "BZ"
  recommendation: string;
  urgency: 'critical' | 'medium' | 'low';
}

// ─────────────────────────────────────────────
// ALGORITHM 1: FP-GROWTH (Frequent Pattern Mining)
// ─────────────────────────────────────────────

class FPNode {
  item: string | null;
  count: number;
  parent: FPNode | null;
  children: Map<string, FPNode>;
  nodeLink: FPNode | null;

  constructor(item: string | null, count: number, parent: FPNode | null) {
    this.item = item;
    this.count = count;
    this.parent = parent;
    this.children = new Map();
    this.nodeLink = null;
  }
}

class FPTree {
  root: FPNode;
  headerTable: Map<string, { count: number; head: FPNode | null }>;
  minSupport: number;

  constructor(minSupport: number) {
    this.root = new FPNode(null, 0, null);
    this.headerTable = new Map();
    this.minSupport = minSupport;
  }

  insert(transaction: string[], count = 1) {
    let current = this.root;
    for (const item of transaction) {
      if (!current.children.has(item)) {
        const newNode = new FPNode(item, count, current);
        current.children.set(item, newNode);
        // Link into header table
        const header = this.headerTable.get(item);
        if (header) {
          let link = header.head;
          while (link && link.nodeLink) link = link.nodeLink;
          if (link) link.nodeLink = newNode;
        } else {
          this.headerTable.set(item, { count, head: newNode });
        }
      } else {
        const node = current.children.get(item)!;
        node.count += count;
        const header = this.headerTable.get(item);
        if (header) header.count += count;
      }
      current = current.children.get(item)!;
    }
  }

  getPrefixPaths(item: string): Array<{ path: string[]; count: number }> {
    const paths: Array<{ path: string[]; count: number }> = [];
    let node = this.headerTable.get(item)?.head || null;
    while (node) {
      const path: string[] = [];
      let parent = node.parent;
      while (parent && parent.item !== null) {
        path.unshift(parent.item);
        parent = parent.parent;
      }
      if (path.length > 0) paths.push({ path, count: node.count });
      node = node.nodeLink;
    }
    return paths;
  }
}

function fpGrowth(
  transactions: string[][],
  minSupportRatio: number
): FrequentItemset[] {
  const totalTransactions = transactions.length;
  if (totalTransactions === 0) return [];

  const minCount = Math.ceil(minSupportRatio * totalTransactions);

  // Count item frequencies
  const itemCount = new Map<string, number>();
  for (const tx of transactions) {
    for (const item of tx) {
      itemCount.set(item, (itemCount.get(item) || 0) + 1);
    }
  }

  // Filter infrequent items
  const freqItems = new Map<string, number>();
  itemCount.forEach((count, item) => {
    if (count >= minCount) freqItems.set(item, count);
  });

  if (freqItems.size === 0) return [];

  const result: FrequentItemset[] = [];

  // Add single frequent items
  freqItems.forEach((count, item) => {
    result.push({
      items: [item],
      support: count / totalTransactions,
      count,
    });
  });

  // Build FP-Tree with transactions sorted by frequency (descending)
  const sortedItems = [...freqItems.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);

  const tree = new FPTree(minCount);
  for (const tx of transactions) {
    const filtered = tx
      .filter(i => freqItems.has(i))
      .sort((a, b) => (freqItems.get(b) || 0) - (freqItems.get(a) || 0));
    if (filtered.length > 0) tree.insert(filtered);
  }

  // Mine conditional pattern bases for each frequent item
  function mineTree(
    conditionalTree: FPTree,
    suffix: string[],
    minCnt: number,
    totalTx: number
  ) {
    // Iterate items in ascending frequency order (bottom up)
    const sortedHeader = [...conditionalTree.headerTable.entries()].sort(
      (a, b) => a[1].count - b[1].count
    );

    for (const [item, { count }] of sortedHeader) {
      const newSuffix = [item, ...suffix];
      if (count >= minCnt) {
        result.push({
          items: newSuffix,
          support: count / totalTx,
          count,
        });

        // Build conditional FP-tree
        const prefixPaths = conditionalTree.getPrefixPaths(item);
        if (prefixPaths.length === 0) continue;

        const condTree = new FPTree(minCnt);
        // Count conditional frequencies
        const condCount = new Map<string, number>();
        for (const { path, count: pathCount } of prefixPaths) {
          for (const p of path) {
            condCount.set(p, (condCount.get(p) || 0) + pathCount);
          }
        }
        // Filter by min support and build
        for (const { path, count: pathCount } of prefixPaths) {
          const filtered = path.filter(p => (condCount.get(p) || 0) >= minCnt);
          if (filtered.length > 0) condTree.insert(filtered, pathCount);
        }

        if (condTree.headerTable.size > 0) {
          mineTree(condTree, newSuffix, minCnt, totalTx);
        }
      }
    }
  }

  mineTree(tree, [], minCount, totalTransactions);

  return result;
}

function generateAssociationRules(
  itemsets: FrequentItemset[],
  minConfidence: number,
  transactions: string[][]
): AssociationRule[] {
  const rules: AssociationRule[] = [];
  const totalTx = transactions.length;

  // Build support lookup
  const supportMap = new Map<string, number>();
  for (const is of itemsets) {
    const key = [...is.items].sort().join('||');
    supportMap.set(key, is.support);
  }

  const getSupport = (items: string[]): number => {
    const key = [...items].sort().join('||');
    return supportMap.get(key) || 0;
  };

  // Generate rules from itemsets with 2+ items
  for (const is of itemsets) {
    if (is.items.length < 2) continue;

    // Generate all non-empty proper subsets as antecedents
    const n = is.items.length;
    for (let mask = 1; mask < (1 << n) - 1; mask++) {
      const antecedent: string[] = [];
      const consequent: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) antecedent.push(is.items[i]);
        else consequent.push(is.items[i]);
      }
      if (antecedent.length === 0 || consequent.length === 0) continue;

      const antecedentSupport = getSupport(antecedent);
      if (antecedentSupport === 0) continue;

      const confidence = is.support / antecedentSupport;
      if (confidence < minConfidence) continue;

      const consequentSupport = getSupport(consequent);
      const lift = consequentSupport > 0 ? confidence / consequentSupport : 0;

      rules.push({ antecedent, consequent, support: is.support, confidence, lift });
    }
  }

  // Sort by lift descending, deduplicate
  return rules
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 50); // top 50 rules
}

// ─────────────────────────────────────────────
// ALGORITHM 2: RFM 5-TIER SCORING
// ─────────────────────────────────────────────

function computeRFMScores(customers: Array<{
  contactId: string;
  name: string;
  phone: string;
  invoices: Array<{ total: number; date: Date }>;
}>): RFMResult[] {
  const now = new Date();

  // Compute raw R, F, M values
  const raw = customers.map(c => {
    const invoices = c.invoices.sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastDate = invoices[0]?.date || now;
    const recencyDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const frequency = invoices.length;
    const monetary = invoices.reduce((sum, i) => sum + i.total, 0);
    const avgOrderValue = frequency > 0 ? monetary / frequency : 0;

    // Trend: compare last 30 days vs prior 30 days
    const last30 = invoices.filter(i => (now.getTime() - i.date.getTime()) <= 30 * 86400000).length;
    const prior30 = invoices.filter(i => {
      const diff = now.getTime() - i.date.getTime();
      return diff > 30 * 86400000 && diff <= 60 * 86400000;
    }).length;
    const trend: 'rising' | 'stable' | 'declining' =
      last30 > prior30 ? 'rising' : last30 < prior30 ? 'declining' : 'stable';

    return { ...c, recencyDays, frequency, monetary, avgOrderValue, trend };
  });

  if (raw.length === 0) return [];

  // Quintile scorer: assigns 1-5 based on percentile
  function quintileScore(values: number[], targetValue: number, lowerIsBetter = false): number {
    const sorted = [...values].sort((a, b) => a - b);
    const rank = sorted.indexOf(targetValue); // position in sorted ascending
    const percentile = rank / (sorted.length - 1 || 1);
    const score = Math.ceil(percentile * 5);
    const clamped = Math.max(1, Math.min(5, score));
    return lowerIsBetter ? 6 - clamped : clamped; // flip for recency (lower days = better)
  }

  const allRecency = raw.map(r => r.recencyDays);
  const allFrequency = raw.map(r => r.frequency);
  const allMonetary = raw.map(r => r.monetary);

  return raw.map(r => {
    const rScore = quintileScore(allRecency, r.recencyDays, true);
    const fScore = quintileScore(allFrequency, r.frequency, false);
    const mScore = quintileScore(allMonetary, r.monetary, false);
    const rfmTotal = rScore + fScore + mScore;

    const segment = classifyRFMSegment(rScore, fScore, mScore);
    const { color, icon } = getSegmentMeta(segment);

    return {
      contactId: r.contactId,
      name: r.name,
      phone: r.phone,
      recencyDays: r.recencyDays,
      frequency: r.frequency,
      monetary: r.monetary,
      rScore,
      fScore,
      mScore,
      rfmTotal,
      segment,
      segmentColor: color,
      segmentIcon: icon,
      avgOrderValue: r.avgOrderValue,
      trend: r.trend,
    };
  });
}

function classifyRFMSegment(r: number, f: number, m: number): RFMSegment {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 4 && f <= 2) return 'Recent Customers';
  if (r >= 3 && f >= 2) return 'Potential Loyalists';
  if (r >= 3 && f <= 1) return 'Promising';
  if (r <= 2 && f >= 4 && m >= 4) return 'Cannot Lose Them';
  if (r <= 2 && f >= 3) return 'At Risk';
  if (r <= 2 && f <= 2 && m >= 3) return 'Need Attention';
  if (r <= 2 && f <= 2 && m >= 2) return 'About to Sleep';
  if (r <= 1 && f >= 2) return 'Hibernating';
  return 'Lost';
}

function getSegmentMeta(segment: RFMSegment): { color: string; icon: string } {
  const map: Record<RFMSegment, { color: string; icon: string }> = {
    'Champions':           { color: '#10B981', icon: '🏆' },
    'Loyal Customers':     { color: '#6366F1', icon: '💎' },
    'Potential Loyalists': { color: '#8B5CF6', icon: '⭐' },
    'Recent Customers':    { color: '#3B82F6', icon: '🆕' },
    'Promising':           { color: '#06B6D4', icon: '🌟' },
    'Need Attention':      { color: '#F59E0B', icon: '⚠️' },
    'About to Sleep':      { color: '#F97316', icon: '😴' },
    'At Risk':             { color: '#EF4444', icon: '🚨' },
    'Cannot Lose Them':    { color: '#DC2626', icon: '🔴' },
    'Hibernating':         { color: '#6B7280', icon: '❄️' },
    'Lost':                { color: '#374151', icon: '💀' },
  };
  return map[segment] || { color: '#6B7280', icon: '❓' };
}

// ─────────────────────────────────────────────
// ALGORITHM 3: ABC-XYZ INVENTORY MATRIX
// ─────────────────────────────────────────────

function computeABCXYZ(products: Array<{
  productId: string;
  productName: string;
  dailySales: number[]; // array of daily units sold (last N days)
  revenuePerUnit: number;
}>): ABCXYZResult[] {
  if (products.length === 0) return [];

  // Compute per-product revenue totals
  const withRevenue = products.map(p => {
    const totalUnits = p.dailySales.reduce((a, b) => a + b, 0);
    const totalRevenue = totalUnits * p.revenuePerUnit;
    const avgDailySales = totalUnits / (p.dailySales.length || 1);

    // Coefficient of variation = stdDev / mean
    const mean = avgDailySales;
    const variance =
      p.dailySales.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) /
      (p.dailySales.length || 1);
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 999;

    return { ...p, totalRevenue, avgDailySales, cv };
  });

  // ABC Classification (by cumulative revenue share)
  const totalRevenue = withRevenue.reduce((a, p) => a + p.totalRevenue, 0);
  const sortedByRevenue = [...withRevenue].sort((a, b) => b.totalRevenue - a.totalRevenue);
  let cumulative = 0;

  const abcMap = new Map<string, 'A' | 'B' | 'C'>();
  const cumulativeMap = new Map<string, number>();
  for (const p of sortedByRevenue) {
    cumulative += totalRevenue > 0 ? p.totalRevenue / totalRevenue : 0;
    cumulativeMap.set(p.productId, cumulative);
    if (cumulative <= 0.7) abcMap.set(p.productId, 'A');
    else if (cumulative <= 0.9) abcMap.set(p.productId, 'B');
    else abcMap.set(p.productId, 'C');
  }

  // XYZ Classification (by coefficient of variation)
  // X = predictable (CV < 0.5), Y = variable (0.5–1.0), Z = irregular (>1.0)
  return withRevenue.map(p => {
    const abcClass = abcMap.get(p.productId) || 'C';
    const revenueShare = cumulativeMap.get(p.productId) || 0;
    const xyzClass: 'X' | 'Y' | 'Z' = p.cv < 0.5 ? 'X' : p.cv < 1.0 ? 'Y' : 'Z';
    const matrix = `${abcClass}${xyzClass}`;

    const recommendation = getABCXYZRecommendation(abcClass, xyzClass);
    const urgency: 'critical' | 'medium' | 'low' =
      abcClass === 'A' ? 'critical' : abcClass === 'B' ? 'medium' : 'low';

    return {
      productId: p.productId,
      productName: p.productName,
      totalRevenue: p.totalRevenue,
      revenueShare,
      abcClass,
      avgDailySales: p.avgDailySales,
      coefficientOfVariation: p.cv,
      xyzClass,
      matrix,
      recommendation,
      urgency,
    };
  });
}

function getABCXYZRecommendation(abc: 'A' | 'B' | 'C', xyz: 'X' | 'Y' | 'Z'): string {
  const matrix: Record<string, string> = {
    AX: 'High-value, predictable demand. Maintain strict safety stock. Automate replenishment.',
    AY: 'High-value, variable demand. Use demand forecasting. Review weekly.',
    AZ: 'High-value, irregular demand. Track closely. Accept higher safety stock.',
    BX: 'Medium-value, predictable. Standard reorder policies apply. Monitor monthly.',
    BY: 'Medium-value, variable. Use statistical reorder points. Review bi-weekly.',
    BZ: 'Medium-value, irregular. Consider reducing SKU variety or bundling.',
    CX: 'Low-value, predictable. Bulk purchase to reduce overhead costs.',
    CY: 'Low-value, variable. Periodic review. Consider stocking only on demand.',
    CZ: 'Low-value, irregular. Consider discontinuing or making to-order only.',
  };
  return matrix[`${abc}${xyz}`] || 'Review stock policy for this product.';
}

// ─────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ─────────────────────────────────────────────

export interface SmartRetailAnalyticsResult {
  // FP-Growth results
  frequentItemsets: FrequentItemset[];
  associationRules: AssociationRule[];
  topBundles: AssociationRule[]; // top 10 by lift

  // RFM results
  rfmResults: RFMResult[];
  rfmSummary: Record<RFMSegment, number>; // segment → count

  // ABC-XYZ results
  abcXYZResults: ABCXYZResult[];
  abcSummary: { A: number; B: number; C: number };
  xyzSummary: { X: number; Y: number; Z: number };

  // Metadata
  totalTransactions: number;
  totalCustomers: number;
  totalProducts: number;
  computedAt: Date;
}

export function runSmartRetailAnalytics(params: {
  transactions: Transaction[];
  customers: Array<{ contactId: string; name: string; phone: string; invoices: Array<{ total: number; date: Date }> }>;
  inventory: Array<{ productId: string; productName: string; dailySales: number[]; revenuePerUnit: number }>;
  minSupportRatio?: number;
  minConfidence?: number;
}): SmartRetailAnalyticsResult {
  const {
    transactions,
    customers,
    inventory,
    minSupportRatio = 0.05,
    minConfidence = 0.3,
  } = params;

  // 1. FP-Growth
  const txItems = transactions.map(t => [...new Set(t.items)]); // deduplicate items per tx
  const frequentItemsets = fpGrowth(txItems, minSupportRatio);
  const associationRules = generateAssociationRules(frequentItemsets, minConfidence, txItems);
  const topBundles = associationRules
    .filter(r => r.lift > 1.0 && r.antecedent.length <= 2)
    .slice(0, 10);

  // 2. RFM Scoring
  const rfmResults = computeRFMScores(customers);
  const rfmSummary = {} as Record<RFMSegment, number>;
  for (const r of rfmResults) {
    rfmSummary[r.segment] = (rfmSummary[r.segment] || 0) + 1;
  }

  // 3. ABC-XYZ
  const abcXYZResults = computeABCXYZ(inventory);
  const abcSummary = { A: 0, B: 0, C: 0 };
  const xyzSummary = { X: 0, Y: 0, Z: 0 };
  for (const p of abcXYZResults) {
    abcSummary[p.abcClass]++;
    xyzSummary[p.xyzClass]++;
  }

  return {
    frequentItemsets,
    associationRules,
    topBundles,
    rfmResults,
    rfmSummary,
    abcXYZResults,
    abcSummary,
    xyzSummary,
    totalTransactions: transactions.length,
    totalCustomers: customers.length,
    totalProducts: inventory.length,
    computedAt: new Date(),
  };
}
