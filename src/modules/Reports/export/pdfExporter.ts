import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type PDFFormat = 'standard' | 'accountant' | 'brutalist';

export async function exportToPDF(
  reportTitle: string,
  data: any[],
  columns: string[],
  format: PDFFormat
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (format === 'brutalist') {
    // --- Brutalist Neo-Brutalism Theme ---
    doc.setFillColor(26, 26, 26); // #1A1A1A (Ink)
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Large Title
    doc.setTextColor(255, 85, 0); // #FF5500 (Neon Orange)
    doc.setFont('Helvetica', 'bolditalic');
    doc.setFontSize(28);
    doc.text(reportTitle.toUpperCase(), 15, 30);

    // Decorative line
    doc.setDrawColor(255, 85, 0);
    doc.setLineWidth(1.5);
    doc.line(15, 35, pageWidth - 15, 35);

    // Metadata
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`SYSTEM_ID: VYAPARI_DSS_EXPORT`, 15, 45);
    doc.text(`EXPORT_DATE: ${new Date().toLocaleString().toUpperCase()}`, 15, 50);

    // Table Header
    let startY = 65;
    doc.setFillColor(255, 85, 0);
    doc.rect(15, startY, pageWidth - 30, 10, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(15, startY, pageWidth - 30, 10, 'S');

    doc.setTextColor(26, 26, 26);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    const colWidth = (pageWidth - 30) / columns.length;
    columns.forEach((col, i) => {
      doc.text(col.toUpperCase(), 18 + i * colWidth, startY + 6.5);
    });

    // Table Body
    startY += 10;
    doc.setFont('Helvetica', 'bold');
    data.slice(0, 15).forEach((row, rowIndex) => {
      // Row Background alternating
      if (rowIndex % 2 === 0) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(30, 30, 30);
      }
      doc.rect(15, startY, pageWidth - 30, 8, 'F');
      doc.setDrawColor(255, 85, 0);
      doc.rect(15, startY, pageWidth - 30, 8, 'S');

      doc.setTextColor(255, 255, 255);
      columns.forEach((col, colIndex) => {
        const val = getRowValue(row, col, colIndex);
        doc.text(String(val).toUpperCase(), 18 + colIndex * colWidth, startY + 5);
      });
      startY += 8;
    });

  } else if (format === 'accountant') {
    // --- Accountant Audit Format ---
    doc.setFont('Courier', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(reportTitle.toUpperCase(), 15, 25);

    doc.setFontSize(8);
    doc.setFont('Courier', 'normal');
    doc.text(`AUDIT COMPLIANCE REPORT | VYAPARI ERP`, 15, 32);
    doc.text(`GENERATED ON: ${new Date().toISOString()}`, 15, 36);

    // Heavy Double Lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);
    doc.line(15, 43.5, pageWidth - 15, 43.5);

    // Table Header
    let startY = 50;
    doc.setFont('Courier', 'bold');
    const colWidth = (pageWidth - 30) / columns.length;
    columns.forEach((col, i) => {
      doc.text(col.toUpperCase(), 15 + i * colWidth, startY);
    });

    doc.line(15, startY + 2.5, pageWidth - 15, startY + 2.5);

    // Table Body
    startY += 8;
    data.forEach((row, rowIndex) => {
      columns.forEach((col, colIndex) => {
        const val = getRowValue(row, col, colIndex);
        doc.text(String(val), 15 + colIndex * colWidth, startY);
      });
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(15, startY + 2, pageWidth - 15, startY + 2);
      startY += 6.5;
    });

    // Signature blocks
    startY += 20;
    doc.setFont('Courier', 'bold');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(15, startY, 70, startY);
    doc.text('AUDITOR SIGNATURE', 15, startY + 5);

    doc.line(pageWidth - 70, startY, pageWidth - 15, startY);
    doc.text('AUTHORIZED SIGN-OFF', pageWidth - 70, startY + 5);

  } else {
    // --- Standard Business Format ---
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text(reportTitle, 15, 25);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated automatically by Vyapari Business Suite`, 15, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 37);

    // Clean rule line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(15, 44, pageWidth - 15, 44);

    // Table Header
    let startY = 55;
    doc.setFillColor(248, 249, 250);
    doc.rect(15, startY, pageWidth - 30, 10, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const colWidth = (pageWidth - 30) / columns.length;
    columns.forEach((col, i) => {
      doc.text(col, 18 + i * colWidth, startY + 6.5);
    });

    // Table Body
    startY += 10;
    doc.setFont('Helvetica', 'normal');
    data.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        doc.setFillColor(252, 253, 254);
        doc.rect(15, startY, pageWidth - 30, 8, 'F');
      }
      doc.setTextColor(80, 80, 80);
      columns.forEach((col, colIndex) => {
        const val = getRowValue(row, col, colIndex);
        doc.text(String(val), 18 + colIndex * colWidth, startY + 5.5);
      });
      startY += 8;
    });
  }

  doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '_')}_export.pdf`);
}

function getRowValue(row: any, col: string, colIndex: number) {
  if (row[col.toLowerCase()]) return row[col.toLowerCase()];
  if (row[col.replace(/\s+/g, '_').toLowerCase()]) return row[col.replace(/\s+/g, '_').toLowerCase()];
  const keys = Object.keys(row);
  if (keys[colIndex]) return row[keys[colIndex]];
  return '—';
}
