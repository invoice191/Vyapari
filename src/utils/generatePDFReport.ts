import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateFilename, triggerDownload, ReportType, ReportMetadata } from "./downloadReport";

// ── BRAND CONFIG ─────────────────────────────────────────────
const BRAND = {
  primary:   [79,  70,  229] as [number, number, number], // #4F46E5 indigo
  dark:      [15,  23,  42]  as [number, number, number], // #0F172A deep slate
  neon:      [159, 239,  0]  as [number, number, number], // #9FEF00 neon lime
  white:     [255, 255, 255] as [number, number, number],
  lightGray: [248, 250, 252] as [number, number, number],
  mutedText: [100, 116, 139] as [number, number, number],
};

interface PDFReportConfig {
  reportType: ReportType;
  title: string;
  subtitle?: string;
  meta: ReportMetadata;
  sections: PDFSection[];
  summaryStats?: SummaryStat[];
}

interface PDFSection {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
}

interface SummaryStat {
  label: string;
  value: string;
}

export function generatePDFReport(config: PDFReportConfig): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── HEADER BAND ───────────────────────────────────────────
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, pageW, 28, "F");

  // Logo text (replace with actual logo image if available)
  doc.setTextColor(...BRAND.neon);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VYAPARI", 10, 12);

  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Retail Intelligence Platform", 10, 18);

  // Report title (right aligned)
  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(config.title, pageW - 10, 12, { align: "right" });

  if (config.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 220);
    doc.text(config.subtitle, pageW - 10, 19, { align: "right" });
  }

  y = 34;

  // ── META INFO ROW ─────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.mutedText);
  doc.setFont("helvetica", "normal");
  const metaDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.text(`Business: ${config.meta.businessName}`, 10, y);
  doc.text(`Generated: ${metaDate}`, pageW - 10, y, { align: "right" });
  y += 5;

  if (config.meta.contactName) {
    doc.text(`Party: ${config.meta.contactName}`, 10, y);
    y += 5;
  }

  if (config.meta.dateRange) {
    doc.text(
      `Period: ${config.meta.dateRange.from} to ${config.meta.dateRange.to}`,
      10, y
    );
    y += 5;
  }

  // ── DIVIDER ───────────────────────────────────────────────
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.6);
  doc.line(10, y, pageW - 10, y);
  y += 6;

  // ── SUMMARY STATS ─────────────────────────────────────────
  if (config.summaryStats && config.summaryStats.length > 0) {
    const boxW = (pageW - 20 - (config.summaryStats.length - 1) * 4) / config.summaryStats.length;
    config.summaryStats.forEach((stat, i) => {
      const x = 10 + i * (boxW + 4);
      doc.setFillColor(...BRAND.lightGray);
      doc.roundedRect(x, y, boxW, 16, 2, 2, "F");
      doc.setTextColor(...BRAND.mutedText);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), x + boxW / 2, y + 5, { align: "center" });
      doc.setTextColor(...BRAND.dark);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, x + boxW / 2, y + 12, { align: "center" });
    });
    y += 22;
  }

  // ── DATA TABLES ───────────────────────────────────────────
  config.sections.forEach((section) => {
    doc.setTextColor(...BRAND.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(section.heading, 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [section.columns],
      body: section.rows,
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: BRAND.dark,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: BRAND.primary,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: BRAND.lightGray,
      },
      didDrawPage: (hookData) => {
        // Footer on every page
        const totalPages = doc.getNumberOfPages();
        const pageNum = hookData.pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(...BRAND.mutedText);
        doc.text(
          `Vyapari · ${config.meta.businessName} · Page ${pageNum} of ${totalPages}`,
          pageW / 2, pageH - 8, { align: "center" }
        );
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(10, pageH - 12, pageW - 10, pageH - 12);
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // ── DOWNLOAD ──────────────────────────────────────────────
  const filename = generateFilename(config.reportType, config.meta, "pdf");
  const blob = doc.output("blob");
  triggerDownload(blob, filename);
}
