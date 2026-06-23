import { generateFilename, triggerDownload, MIME_TYPE, ReportType, ReportMetadata } from "./downloadReport";

export interface CSVReportConfig {
  reportType: ReportType;
  meta: ReportMetadata;
  columns: string[];
  rows: (string | number | null)[][];
}

function escapeCSV(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSVReport(config: CSVReportConfig): void {
  const lines: string[] = [];

  lines.push(`# Vyapari Report — ${config.reportType}`);
  lines.push(`# Business: ${config.meta.businessName}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  if (config.meta.contactName) lines.push(`# Party: ${config.meta.contactName}`);
  lines.push("");

  lines.push(config.columns.map(escapeCSV).join(","));

  config.rows.forEach((row) => {
    lines.push(row.map(escapeCSV).join(","));
  });

  const csvContent = lines.join("\n");
  const filename = generateFilename(config.reportType, config.meta, "csv");
  const blob = new Blob(["\uFEFF" + csvContent], { type: MIME_TYPE["csv"] });
  triggerDownload(blob, filename);
}
