import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './format';
import { downloadPDF } from './pdf/downloadPDF';

export const generateEnterpriseInvoicePDF = async (invoice: any, items: any[], business: any) => {
  const doc = new jsPDF() as any;

  // Expert Helper: Number to Words (Indian Style)
  const numberToWords = (num: number) => {
    const val = Math.floor(num || 0);
    if (val === 0) return "Zero Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const format = (n: number) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? format(n % 100) : '');
      return '';
    };
    let words = '';
    let n = val;
    if (Math.floor(n / 10000000) > 0) { words += format(Math.floor(n / 10000000)) + 'Crore '; n %= 10000000; }
    if (Math.floor(n / 100000) > 0) { words += format(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
    if (Math.floor(n / 1000) > 0) { words += format(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
    if (n > 0) words += format(n);
    return words.trim() + ' Only';
  };

  const safeStr = (val: any) => {
    if (!val) return "-";
    const s = String(val).trim();
    return s === "" ? "-" : s;
  };

  const formatNum = (num: number) => {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  };

  const businessName = safeStr(business?.name || "VYAPARI BUSINESS");

  // -- OUTER BORDER --
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);

  // -- HEADER (TAX INVOICE TITLE) --
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 18, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(10, 22, 200, 22);

  // -- BUSINESS DETAILS & INVOICE DETAILS --
  // Left side: Business Details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const splitBizName = doc.splitTextToSize(businessName.toUpperCase(), 100);
  doc.text(splitBizName, 15, 30);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let currentY = 30 + (splitBizName.length * 6);
  
  const headerAddr = doc.splitTextToSize(safeStr(business?.address), 100);
  doc.text(headerAddr, 15, currentY);
  currentY += (headerAddr.length * 4) + 2;
  
  doc.text(`Phone: ${safeStr(business?.phone)}`, 15, currentY);
  doc.text(`Email: ${safeStr(business?.email)}`, 15, currentY + 4);
  
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: ${safeStr(business?.gstin)}`, 15, currentY + 10);

  // Right side: Invoice Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", 120, 30);
  doc.setFont("helvetica", "normal");
  doc.text(safeStr(invoice.invoice_number), 150, 30);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", 120, 36);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-IN'), 150, 36);

  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", 120, 42);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoice.due_date).toLocaleDateString('en-IN'), 150, 42);

  doc.setFont("helvetica", "bold");
  doc.text("Place of Supply:", 120, 48);
  doc.setFont("helvetica", "normal");
  doc.text(safeStr(invoice.contacts?.state || 'Maharashtra'), 150, 48);

  currentY = Math.max(currentY + 15, 55);
  doc.line(10, currentY, 200, currentY); // Line before parties

  // -- PARTIES (BILL TO & SHIP TO) --
  const partyStartY = currentY;
  
  // Vertical separator for parties
  doc.line(105, partyStartY, 105, partyStartY + 40);

  // Bill To
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Billed To:", 15, partyStartY + 6);
  
  const customerName = safeStr(invoice.contacts?.name || invoice.customer_name || "Walk-in Customer");
  doc.text(customerName.toUpperCase(), 15, partyStartY + 12);
  
  doc.setFont("helvetica", "normal");
  const billingAddr = doc.splitTextToSize(safeStr(invoice.contacts?.address), 85);
  doc.text(billingAddr, 15, partyStartY + 17);
  
  const billGstinY = partyStartY + 17 + (billingAddr.length * 4) + 2;
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN/UIN: ${safeStr(invoice.contacts?.gstin)}`, 15, billGstinY);
  doc.setFont("helvetica", "normal");
  doc.text(`State: ${safeStr(invoice.contacts?.state || 'Maharashtra')}`, 15, billGstinY + 5);

  // Ship To
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Shipped To:", 110, partyStartY + 6);
  
  doc.text(customerName.toUpperCase(), 110, partyStartY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(billingAddr, 110, partyStartY + 17);
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN/UIN: ${safeStr(invoice.contacts?.gstin)}`, 110, billGstinY);
  doc.setFont("helvetica", "normal");
  doc.text(`State: ${safeStr(invoice.contacts?.state || 'Maharashtra')}`, 110, billGstinY + 5);

  currentY = partyStartY + 40;
  
  // -- ITEMS TABLE --
  const tableBody = (items || []).map((it, idx) => {
    const qty = Number(it.quantity || 0);
    const price = Number(it.unit_price || 0);
    const taxRate = Number(it.tax_rate || 18);
    const taxable = qty * price;
    const taxAmount = taxable * (taxRate / 100);
    return [
      idx + 1, 
      safeStr(it.products?.name || it.name), 
      safeStr(it.products?.hsn_code || it.hsn_code || '8471'), 
      qty, 
      formatNum(price), 
      formatNum(taxable), 
      `${(taxRate/2)}%`,
      formatNum(taxAmount / 2), 
      `${(taxRate/2)}%`,
      formatNum(taxAmount / 2), 
      formatNum(taxable + taxAmount)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      'S.No', 
      'Description of Goods', 
      'HSN/SAC', 
      'Qty', 
      'Rate\n(Rs)', 
      'Taxable\nValue', 
      'CGST\n%', 
      'CGST\nAmt', 
      'SGST\n%', 
      'SGST\nAmt', 
      'Total\n(Rs)'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', valign: 'middle' },
    columnStyles: { 
      0: { cellWidth: 10, halign: 'center' }, 
      1: { halign: 'left', cellWidth: 'auto' }, 
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 10, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'right' },
      8: { halign: 'center' },
      9: { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 10, right: 10 }
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // -- TOTALS CALCULATION --
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
  const totalQty = items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
  const totalTax = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0) * (Number(it.tax_rate || 18) / 100)), 0);
  const grandTotal = subtotal + totalTax - (invoice.discount_amt || 0);

  // -- TOTALS BLOCK (Under Table) --
  // Left side of totals box (empty or for notes)
  // Right side of totals box (stacked amounts)
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(10, finalY, 190, 40); // 40 height block
  doc.line(130, finalY, 130, finalY + 40); // vertical split

  // Left side: Qty & Amount in words
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Quantity: ${totalQty}`, 15, finalY + 8);
  doc.text(`Amount Chargeable (in words):`, 15, finalY + 16);
  doc.setFont("helvetica", "normal");
  const words = doc.splitTextToSize(`INR ${numberToWords(grandTotal)}`, 110);
  doc.text(words, 15, finalY + 22);

  // Right side: Breakdown
  doc.setFont("helvetica", "bold");
  let rightY = finalY + 8;
  doc.text("Taxable Amount:", 135, rightY);
  doc.text(formatNum(subtotal), 195, rightY, { align: 'right' });
  
  rightY += 8;
  doc.text("Total Tax (GST):", 135, rightY);
  doc.text(formatNum(totalTax), 195, rightY, { align: 'right' });

  if (invoice.discount_amt > 0) {
    rightY += 8;
    doc.text("Discount:", 135, rightY);
    doc.text(`-${formatNum(invoice.discount_amt)}`, 195, rightY, { align: 'right' });
  }

  rightY += 8;
  doc.setFontSize(11);
  doc.text("Grand Total:", 135, rightY);
  doc.text(formatNum(grandTotal), 195, rightY, { align: 'right' });

  finalY += 40;

  // -- PARTIAL PAYMENT BADGE --
  if (invoice.amount_paid > 0) {
    doc.setFillColor(240, 248, 255); // Alice Blue
    doc.rect(10, finalY, 190, 15, 'F');
    doc.rect(10, finalY, 190, 15, 'S');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Amount Paid: Rs. ${formatNum(invoice.amount_paid)}`, 15, finalY + 10);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Balance Due: Rs. ${formatNum(invoice.amount_remaining)}`, 135, finalY + 10);
    doc.setTextColor(0, 0, 0); // Reset
    finalY += 15;
  }

  // -- FOOTER: BANK & DECLARATION --
  // Box for Footer
  const footerHeight = 45;
  // Make sure we have space, if not add page (for simplicity, assuming it fits here. Typically a professional generator checks remaining height).
  if (finalY + footerHeight > 280) {
    doc.addPage();
    finalY = 10;
  }

  doc.rect(10, finalY, 190, footerHeight);
  doc.line(100, finalY, 100, finalY + footerHeight); // Split in half

  // Left Side: Bank Details & Declaration
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details:", 15, finalY + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`Bank Name: ${safeStr(business?.bank_name || 'HDFC Bank')}`, 15, finalY + 12);
  doc.text(`A/c No: ${safeStr(business?.bank_account || 'XXXXXXXXXXXX')}`, 15, finalY + 17);
  doc.text(`Branch & IFSC: ${safeStr(business?.ifsc_code || 'HDFC0001234')}`, 15, finalY + 22);

  doc.setFont("helvetica", "bold");
  doc.text("Declaration:", 15, finalY + 30);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const decText = doc.splitTextToSize("We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", 80);
  doc.text(decText, 15, finalY + 34);

  // Right Side: Signature
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`For ${businessName.toUpperCase()}`, 195, finalY + 8, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Authorized Signatory", 195, finalY + footerHeight - 5, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // -- WATERMARK (STATUS) --
  // Re-apply watermark on top just in case
  const status = invoice.status?.toUpperCase() || 'DRAFT';
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(80);
  doc.setFont("helvetica", "bold");
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.text(status, 105, 150, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();

  const safeFilename = String(invoice.invoice_number || `Enterprise_Invoice_${Date.now()}`).replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `${safeFilename}.pdf`;

  downloadPDF(doc, filename);
};
