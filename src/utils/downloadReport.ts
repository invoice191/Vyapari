import { SupabaseClient } from '@supabase/supabase-js';

export type ReportFormat = "pdf" | "xlsx" | "csv";

export interface ReportDownloadOptions {
  reportType: ReportType;
  format?: ReportFormat;
  data: Record<string, unknown>;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  businessName: string;
  businessId: string;
  contactName?: string;
  invoiceNumber?: string;
  creditNoteNumber?: string;
  poNumber?: string;
  supplierName?: string;
  scenarioName?: string;
  dateRange?: { from: string; to: string };
}

export type ReportType =
  | "INVOICE_PDF"
  | "SALES_REPORT"
  | "INVENTORY_REPORT"
  | "CUSTOMER_LEDGER"
  | "CASH_FLOW_FORECAST"
  | "RFM_SEGMENTS"
  | "AUDIT_LOG"
  | "GST_ITC_REPORT"
  | "FRAUD_GUARD_REPORT"
  | "DUNNING_REPORT"
  | "PROCUREMENT_REORDER"
  | "BANKER_STRATEGIC"
  | "MARKET_SIMULATION"
  | "SETTLEMENT_TRANSACTIONS"
  | "CREDIT_NOTES"
  | "PURCHASE_ORDER"
  | "STOCK_MOVEMENT"
  | "DISPUTE_GUARD";

function sanitize(str: string): string {
  return (str ?? "Unknown")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, 40);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function monthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function generateFilename(
  reportType: ReportType,
  meta: ReportMetadata,
  format: ReportFormat
): string {
  const biz = sanitize(meta.businessName);
  const contact = sanitize(meta.contactName ?? "");
  const inv = sanitize(meta.invoiceNumber ?? "");
  const cn = sanitize(meta.creditNoteNumber ?? "");
  const po = sanitize(meta.poNumber ?? "");
  const sup = sanitize(meta.supplierName ?? "");
  const scenario = sanitize(meta.scenarioName ?? "Simulation");
  const ext = format;

  const map: Record<ReportType, string> = {
    INVOICE_PDF:            `INV-${inv}_${contact}_${today()}.${ext}`,
    SALES_REPORT:           `Vyapari_Sales_Report_${biz}_${monthYear()}.${ext}`,
    INVENTORY_REPORT:       `Vyapari_Inventory_${biz}_${today()}.${ext}`,
    CUSTOMER_LEDGER:        `Ledger_${contact}_${biz}_${today()}.${ext}`,
    CASH_FLOW_FORECAST:     `Vyapari_CashFlow_Forecast_${today()}.${ext}`,
    RFM_SEGMENTS:           `Vyapari_RFM_Segments_${today()}.${ext}`,
    AUDIT_LOG:              `Vyapari_AuditLog_${biz}_${today()}.${ext}`,
    GST_ITC_REPORT:         `Vyapari_GST_ITC_${monthYear()}_${biz}.${ext}`,
    FRAUD_GUARD_REPORT:     `Vyapari_FraudGuard_${biz}_${today()}.${ext}`,
    DUNNING_REPORT:         `Vyapari_Dunning_${biz}_${today()}.${ext}`,
    PROCUREMENT_REORDER:    `Vyapari_Reorder_${biz}_${today()}.${ext}`,
    BANKER_STRATEGIC:       `Vyapari_BankerView_${biz}_${today()}.${ext}`,
    MARKET_SIMULATION:      `Vyapari_MarketSim_${scenario}_${today()}.${ext}`,
    SETTLEMENT_TRANSACTIONS:`Vyapari_Settlements_${biz}_${today()}.${ext}`,
    CREDIT_NOTES:           `CreditNote_${cn}_${contact}_${today()}.${ext}`,
    PURCHASE_ORDER:         `PO-${po}_${sup}_${today()}.${ext}`,
    STOCK_MOVEMENT:         `Vyapari_StockMovement_${biz}_${today()}.${ext}`,
    DISPUTE_GUARD:          `Vyapari_DisputeGuard_${contact}_${today()}.${ext}`,
  };

  return map[reportType] ?? `Vyapari_Report_${today()}.${ext}`;
}

export const DEFAULT_FORMAT: Record<ReportType, ReportFormat> = {
  INVOICE_PDF:            "pdf",
  SALES_REPORT:           "xlsx",
  INVENTORY_REPORT:       "xlsx",
  CUSTOMER_LEDGER:        "pdf",
  CASH_FLOW_FORECAST:     "pdf",
  RFM_SEGMENTS:           "xlsx",
  AUDIT_LOG:              "csv",
  GST_ITC_REPORT:         "xlsx",
  FRAUD_GUARD_REPORT:     "pdf",
  DUNNING_REPORT:         "csv",
  PROCUREMENT_REORDER:    "xlsx",
  BANKER_STRATEGIC:       "pdf",
  MARKET_SIMULATION:      "pdf",
  SETTLEMENT_TRANSACTIONS:"xlsx",
  CREDIT_NOTES:           "pdf",
  PURCHASE_ORDER:         "pdf",
  STOCK_MOVEMENT:         "csv",
  DISPUTE_GUARD:          "pdf",
};

export const MIME_TYPE: Record<ReportFormat, string> = {
  pdf:  "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv:  "text/csv;charset=utf-8;",
};

export function triggerDownload(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadFromSupabase(
  supabase: SupabaseClient,
  storagePath: string,
  reportType: ReportType,
  meta: ReportMetadata
): Promise<void> {
  const format = DEFAULT_FORMAT[reportType];
  const filename = generateFilename(reportType, meta, format);

  const { data, error } = await supabase.storage
    .from("reports")
    .download(storagePath);

  if (error || !data) {
    console.error("Supabase download error:", error);
    throw new Error(`Failed to download report: ${error?.message}`);
  }

  const blob = new Blob([data], { type: MIME_TYPE[format] });
  triggerDownload(blob, filename);
}
