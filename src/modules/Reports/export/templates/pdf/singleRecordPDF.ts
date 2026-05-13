import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from '../../../../../utils/pdf/downloadPDF';

interface RecordParams {
  businessName: string;
  reportTitle: string;
  record: any;
  columns: string[];
}

const normalizeValue = (val: any) => {
  if (typeof val !== 'string') return val;
  return val.replace(/Rs./g, 'INR');
};

export const generateSingleRecordPDF = async ({
  businessName,
  reportTitle,
  record,
  columns
}: RecordParams) => {
  const doc = new jsPDF();
  const NAVY = [30, 42, 94]; // #1e2a5e

  // Header
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(businessName, 15, 32);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 195, 32, { align: 'right' });

  // Form Body
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.text("OFFICIAL TRANSACTION VOUCHER", 15, 55);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 58, 195, 58);

  // Table-like Form
  const tableRows = Object.entries(record).map(([key, value]) => [
    key.replace(/_/g, ' ').toUpperCase(),
    normalizeValue(String(value))
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['FIELD NAME', 'VALUE']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: NAVY as any, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 246, 248], cellWidth: 60 }
    }
  });

  // Footer / Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  doc.setFontSize(10);
  doc.text("__________________________", 15, finalY);
  doc.text("PREPARED BY", 15, finalY + 7);
  
  doc.text("__________________________", 130, finalY);
  doc.text("AUTHORIZED SIGNATORY", 130, finalY + 7);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This document is a computer-generated record for internal audit purposes.", 105, 285, { align: 'center' });

  // Safe Blob PDF download trigger to prevent file corruption
  const filename = `${reportTitle.replace(/\s+/g, '_')}_voucher.pdf`;
  downloadPDF(doc, filename);
};
