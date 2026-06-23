import * as XLSX from "xlsx";
import { generateFilename, triggerDownload, MIME_TYPE, ReportType, ReportMetadata } from "./downloadReport";

interface XLSXReportConfig {
  reportType: ReportType;
  meta: ReportMetadata;
  sheets: XLSXSheet[];
}

interface XLSXSheet {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
  summaryRows?: [string, string | number][];  // label-value pairs for summary
}

export function generateXLSXReport(config: XLSXReportConfig): void {
  const wb = XLSX.utils.book_new();

  config.sheets.forEach((sheet) => {
    const wsData: (string | number | null)[][] = [];

    // ── HEADER BLOCK ──────────────────────────────────────
    wsData.push(["VYAPARI — " + sheet.name.toUpperCase()]);
    wsData.push([`Business: ${config.meta.businessName}`]);
    wsData.push([`Generated: ${new Date().toLocaleDateString("en-IN")}`]);
    if (config.meta.contactName) wsData.push([`Party: ${config.meta.contactName}`]);
    if (config.meta.dateRange) {
      wsData.push([`Period: ${config.meta.dateRange.from} to ${config.meta.dateRange.to}`]);
    }
    wsData.push([]); // blank row

    // ── SUMMARY STATS ──────────────────────────────────────
    if (sheet.summaryRows && sheet.summaryRows.length > 0) {
      wsData.push(["SUMMARY"]);
      sheet.summaryRows.forEach(([label, value]) => wsData.push([label, value]));
      wsData.push([]);
    }

    // ── COLUMN HEADERS ─────────────────────────────────────
    wsData.push(sheet.columns);

    // ── DATA ROWS ──────────────────────────────────────────
    sheet.rows.forEach((row) => wsData.push(row));

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── COLUMN WIDTHS ──────────────────────────────────────
    ws["!cols"] = sheet.columns.map((col) => ({
      wch: Math.max(col.length + 4, 18),
    }));

    // ── FREEZE HEADER ROW ──────────────────────────────────
    const headerRowIndex = (config.meta.dateRange ? 6 : 5) + (sheet.summaryRows?.length ? sheet.summaryRows.length + 2 : 0);
    ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex };

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });

  // ── DOWNLOAD ───────────────────────────────────────────────
  const filename = generateFilename(config.reportType, config.meta, "xlsx");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: MIME_TYPE["xlsx"] });
  triggerDownload(blob, filename);
}
