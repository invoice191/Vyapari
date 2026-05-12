import type { RefObject } from 'react';

export type ReportType =
  | 'sales'
  | 'inventory'
  | 'purchase'
  | 'ledger'
  | 'customer'
  | 'audit'
  | 'dss_simulation';

export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'currency' | 'number' | 'date' | 'percent' | 'badge';
  align?: 'left' | 'right' | 'center';
  width?: number; // PDF column width in mm
}

export interface ReportPayload {
  type: ReportType;
  title: string;
  category?: string;
  description?: string;
  dateRange: { from: string; to: string };
  generatedBy: string;
  businessName: string;
  gstin: string;
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
  kpis?: { label: string; value: string | number; delta?: number }[];
  advisory?: string[];
  chartRef?: RefObject<HTMLDivElement | null>;
  isDraft?: boolean;
  phone?: string;
  email?: string;
  summary?: string;
}

export interface SheetConfig {
  sheetName: string;
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
}
