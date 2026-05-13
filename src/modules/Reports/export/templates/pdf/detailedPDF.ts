import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from '../../../../../utils/pdf/downloadPDF';

interface DetailedPDFProps {
  businessName: string;
  reportTitle: string;
  period: string;
  gstin: string;
  kpis: { label: string; value: string; color?: string }[];
  chartImage?: string;
  tableData: any[];
  columns: string[];
  filtersApplied?: string;
  category?: string;
  description?: string;
  aiAdvisory?: string[];
}

// Helper to normalize currency symbols for jsPDF compatibility
const normalizeValue = (val: any) => {
  if (typeof val !== 'string') return val;
  return val.replace(/Rs./g, 'INR');
};

export async function generateDetailedPDF({
  businessName, reportTitle, period, gstin, kpis, chartImage, tableData, columns, filtersApplied, category, description, aiAdvisory
}: DetailedPDFProps) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // UI Color Palette (Mirrored from ReportViewer.tsx)
  const NAVY: [number, number, number] = [30, 42, 94];      // #1e2a5e
  const GRAY_BG: [number, number, number] = [245, 246, 248]; // #f5f6f8
  const BORDER: [number, number, number] = [209, 213, 219]; // #d1d5db
  const SLATE_500: [number, number, number] = [100, 116, 139];
  const INDIGO_LIGHT: [number, number, number] = [240, 242, 248]; // #f0f2f8
  
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 15;

  const drawHeader = () => {
    // Top Watermark (Mirrored from UI)
    doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
    doc.text(`${businessName.toUpperCase()}  OFFICIAL BUSINESS INTELLIGENCE`, w - margin, 12, { align: 'right' });

    // Main Navy Header Box
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, 18, w - (margin * 2), 35, 1, 1, 'F');
    
    doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`${(category || 'BUSINESS ANALYTICS').toUpperCase()}  ${reportTitle.toUpperCase()}`, margin + 8, 28);
    
    doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(reportTitle.toUpperCase(), margin + 8, 40);
    
    doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(description || 'Comprehensive transaction audit and performance analytics.', w - 50);
    doc.text(descLines, margin + 8, 47);
  };

  const drawFooter = (page: number, total: number) => {
    doc.setFontSize(7); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'normal');
    doc.text(`Vyapari Intelligence Core  Official Registry`, margin, h - 8);
    doc.text(`Page ${page} of ${total} | Generated: ${new Date().toLocaleString()}`, w - margin, h - 8, { align: 'right' });
  };

  drawHeader();

  // Meta Information Matrix
  let nextY = 60;
  const metaHeaders = ["PERIOD", "BRANCH / OUTLET", "PREPARED BY", "REPORT DATE"];
  const metaValues = [period.toUpperCase(), "MAIN_BRANCH_HQ", "ADMINISTRATOR", new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()];
  
  autoTable(doc, {
    startY: nextY,
    head: [metaHeaders],
    body: [metaValues.map(normalizeValue)],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3, fontStyle: 'bold', halign: 'left', textColor: [26, 26, 46] as any },
    headStyles: { fillColor: GRAY_BG as any, textColor: SLATE_500 as any, lineWidth: 0.1, lineColor: BORDER as any },
    bodyStyles: { fillColor: [255, 255, 255] as any, lineWidth: 0.1, lineColor: BORDER as any },
    margin: { left: margin, right: margin }
  });
  
  nextY = (doc as any).lastAutoTable.finalY + 12;

  // Highlights Grid (Structure Step 2 - UPGRADED TO 4 COLUMNS)
  if (kpis && kpis.length > 0) {
    doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
    doc.text('KEY HIGHLIGHTS', margin, nextY - 4);

    const boxW = (w - (margin * 2)) / 4;
    kpis.slice(0, 4).forEach((kpi, i) => {
      const x = margin + i * boxW;
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.1);
      doc.rect(x, nextY, boxW, 20);
      doc.setFontSize(7); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
      doc.text(kpi.label.toUpperCase(), x + 4, nextY + 6);
      doc.setFontSize(11); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
      doc.text(normalizeValue(kpi.value), x + 4, nextY + 15);
    });
    nextY += 32;
  }


  // Detailed Data Label
  doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
  doc.text('DETAILED DATA REGISTRY', margin, nextY - 4);

  // Main Data Table (Structure Step 4)
  autoTable(doc, {
    startY: nextY,
    head: [columns.map(c => c.toUpperCase())],
    body: (tableData || []).map(row => (columns || []).map(col => {
      try {
        if (!row || !col) return '-';
        const colIndex = columns.indexOf(col);
        const key1 = String(col).toLowerCase().replace(/\s+/g, '_');
        
        // Multi-layer fallback logic to ensure absolute parity with visual screen rendering
        let val = row[key1] !== undefined ? row[key1] : 
                 (row[col] !== undefined ? row[col] : 
                 Object.values(row || {})[colIndex]);

        const formatted = typeof val === 'number' ? val.toLocaleString('en-IN') : String(val ?? '');
        return normalizeValue(formatted);
      } catch (err) {
        console.warn('[PDF] Cell render error:', err);
        return '';
      }
    })),
    theme: 'grid',
    styles: { 
      fontSize: 7.5, 
      cellPadding: 2.5, 
      textColor: [55, 65, 81] as any, 
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: { fillColor: GRAY_BG as any, textColor: SLATE_500 as any, fontStyle: 'bold', lineWidth: 0.1, lineColor: BORDER as any },
    alternateRowStyles: { fillColor: [249, 250, 251] as any },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader();
      drawFooter(data.pageNumber, (doc as any).internal.getNumberOfPages());
    }
  });

  //  Executive Summary & Insights (FINAL SECTION) 
  nextY = (doc as any).lastAutoTable.finalY + 12;
  const summaryText = (aiAdvisory?.[0] || description || "Strategic analysis complete.").trim();
  const summaryLines = doc.splitTextToSize(summaryText, w - 50);
  const boxHeight = (summaryLines.length * 5) + 12;

  // Check if summary fits on page
  if (nextY + boxHeight > h - 45) {
    doc.addPage();
    drawHeader();
    nextY = 65;
  }

  doc.setFillColor(...INDIGO_LIGHT);
  doc.rect(margin, nextY, w - (margin * 2), boxHeight, 'F');
  doc.setFillColor(...NAVY);
  doc.rect(margin, nextY, 1.5, boxHeight, 'F'); // Left blue border
  
  doc.setFontSize(8); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY & STRATEGIC INSIGHTS', margin + 5, nextY + 6);
  
  // Highlight Logic: Bold the main part
  const firstPeriodIndex = summaryText.indexOf('.');
  const mainPart = firstPeriodIndex !== -1 ? summaryText.slice(0, firstPeriodIndex + 1) : summaryText;
  const restPart = firstPeriodIndex !== -1 ? summaryText.slice(firstPeriodIndex + 1) : '';

  doc.setFontSize(9.5); 
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  const mainLines = doc.splitTextToSize(mainPart, w - 40);
  doc.text(mainLines, margin + 5, nextY + 13);
  
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  const restLines = doc.splitTextToSize(restPart, w - 40);
  doc.text(restLines, margin + 5, nextY + 13 + (mainLines.length * 5));

  // Final Signatures (Structure Step 5)
  const signY = h - 35;
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.1);
  const signBoxW = (w - (margin * 2)) / 3;
  
  ["PREPARED BY", "REVIEWED BY", "APPROVED BY"].forEach((label, i) => {
    const x = margin + i * signBoxW;
    doc.setFontSize(8); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
    doc.text(label, x + 5, signY);
    doc.line(x + 5, signY + 15, x + signBoxW - 5, signY + 15);
    doc.setFontSize(7); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'normal');
    doc.text('Name & Signature', x + 5, signY + 19);
  });

  // Save the PDF
  // Safe Blob PDF download trigger to prevent extension corruption
  const filename = `${reportTitle.replace(/\s+/g, '_')}_Detailed.pdf`;
  downloadPDF(doc, filename);
}
