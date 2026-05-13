import { Product as InventoryItem, Invoice, AuditLog as StockLog } from '../types';

export interface Sale {
  id: string;
  timestamp: string;
  amount: number;
  item_ids: string[];
}

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}

// -- Priority & Scoring -----------------------------------------
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type EngineCategory = 
  | 'pricing' 
  | 'inventory' 
  | 'finance' 
  | 'forecast' 
  | 'rfm' 
  | 'discount' 
  | 'market' 
  | 'cashflow' 
  | 'deadstock' 
  | 'churn' 
  | 'gst' 
  | 'bundle';
export type ActionType = 'restock' | 'reprice' | 'liquidate' | 'investigate' | 'monitor' | 'simulate';

// -- The core recommendation atom ------------------------------
export interface DSSRecommendation {
  id: string;                         // deterministic: `${engine}-${itemId}-${hash}`
  engine: EngineCategory;
  priority: RecommendationPriority;
  score: number;                      // 0-100 composite urgency score
  confidence: number;                 // 0-1 data quality confidence
  title: string;                      // "Critical: Basmati Rice will stock out in 4 days"
  headline: string;                   // one-line business impact
  detail: string;                     // 2-3 sentence explanation with numbers
  impactEstimate: {
    metric: string;                   // "Revenue at risk"
    value: number;                    // 45000
    unit: string;                     // "Rs." | "units" | "days" | "%"
    direction: 'positive' | 'negative' | 'neutral';
  };
  action: {
    type: ActionType;
    label: string;                    // "Reorder 200 units now"
    deepLink: string;                 // '/inventory/item-id?action=restock'
  };
  explanation?: {                     // Glass-box reasoning
    logic: string;
    variables: string[];
    weight: number;
  };
  evidence: string[];                 // ["Sold 12 units/day avg", "4 units left", "Min stock: 20"]
  affectedItemId?: string;
  affectedItemName?: string;
  days_until_stockout?: number;       // inventoryEngine specific
  suggestedPrice?: number;            // pricingEngine specific
  cashFlowImpact?: number;            // financialEngine specific
  createdAt: Date;
  expiresAt: Date;                    // recommendation is stale after this
}

// -- Insight (AI narrative layer) ------------------------------
export interface DSSInsight {
  id: string;
  type: 'ai_narrative' | 'rule_summary' | 'trend_alert' | 'festival_warning';
  title: string;
  body: string;
  relatedRecommendationIds: string[];
  confidence: number;
  source: 'gemini' | 'rules_engine';
  impact?: string;
  icon?: any;
  streaming?: boolean;
  streamedText?: string;
}

// -- Simulation ------------------------------------------------
export interface SimulationParams {
  label: string;                      // "Festive Season Boost Scenario"
  priceChangePct: number;
  footfallChangePct: number;
  costChangePct: number;
  newProductRevenue: number;
  discountCampaignPct: number;        // NEW: bulk discount effect
  periods: number;
  baselineMonths: number;             // how many months of history to use
}

export interface SimulationSnapshot {
  revenue: number;
  grossProfit: number;
  netProfit: number;
  cashFlow: number;
  inventoryValue: number;
  unitsSold: number;
}

export interface SimulationResult {
  id: string;
  label: string;
  params: SimulationParams;
  current: SimulationSnapshot;
  simulated: SimulationSnapshot;
  monthly: {                          // month-by-month projection
    month: string;
    current: SimulationSnapshot;
    simulated: SimulationSnapshot;
  }[];
  delta: {
    revenueChange: number;
    revenueChangePct: number;
    profitChange: number;
    profitChangePct: number;
    roi: number;
    breakEvenMonths: number;
  };
  rippleEffects: {
    description: string;
    severity: 'positive' | 'warning' | 'critical';
  }[];
  recommendation: string;
  generatedAt: Date;
  executionMs: number;
}

// -- Forecast --------------------------------------------------
export interface ForecastResult {
  itemId: string;
  itemName: string;
  periods: {
    month: string;
    predictedDemand: number;
    lowerBound: number;
    upperBound: number;
    seasonalityFactor: number;
    isFestivalMonth: boolean;
  }[];
  confidence: number;
  modelUsed: 'weighted_avg' | 'linear_regression' | 'seasonal_decomposition';
  dataPointsUsed: number;
  accuracy?: number;                  // MAE against last known period if available
}

// -- Engine I/O ------------------------------------------------
export interface EngineInput {
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  sales: Sale[];
  invoices: Invoice[];
  ledgerEntries: LedgerEntry[];
  rules: any; // We'll use the imported rules.json
  analysisDate: Date;
}

export interface EngineOutput {
  engine: EngineCategory;
  recommendations: DSSRecommendation[];
  insights: DSSInsight[];
  metrics?: { label: string; value: number; unit?: string }[];
  executionMs: number;
  dataQuality: number;                // 0-1, affects confidence scoring
  forecasts?: ForecastResult[];
}

// -- Full Analysis Result --------------------------------------
export interface DSSAnalysisResult {
  id: string;
  engineOutputs: EngineOutput[];
  recommendations: DSSRecommendation[];     // merged + ranked
  insights: DSSInsight[];
  forecasts: ForecastResult[];
  vani_narrative?: any;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalRevenueAtRisk: number;
    totalOpportunityValue: number;
    healthScore: number;              // 0-100 overall business health
    healthComponents: {
      cashRunway: number;             // 0-25
      revenueGrowth: number;          // 0-20
      inventoryHealth: number;        // 0-20
      customerHealth: number;         // 0-20
      marginHealth: number;           // 0-15
    };
  };
  inventory?: InventoryItem[];
  invoices?: Invoice[];
  executionMs: number;
  analysedAt: Date;
}
