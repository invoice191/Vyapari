import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  downloadPDF, 
  openPDFInTab,
  addVyapariFooter 
} from "./downloadPDF";

export interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date?: string;
  status: string;
  business: {
    name: string;
    address?: string;
    gst_number?: string;
    phone?: string;
    upi_id?: string;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
    gst_number?: string;
  };
  items: {
    name: string;
    hsn?: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    gst_rate?: number;
    total: number;
  }[];
  subtotal: number;
  discount_total?: number;
  gst_total?: number;
  cgst?: number;
  sgst?: number;
  grand_total: number;
  amount_paid?: number;
  amount_remaining?: number;
  notes?: string;
}

export const generateInvoicePDF = (
  data: InvoiceData,
  action: 'download' | 'open' = 'download'
): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;

  //  HEADER 
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Business name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.business.name, 14, 14);

  // Business details
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.business.address) {
    doc.text(data.business.address, 14, 20);
  }
  if (data.business.gst_number) {
    doc.text(
      `GST: ${data.business.gst_number}`, 
      14, 25
    );
  }

  // INVOICE label
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(159, 239, 0); // neon
  doc.text("INVOICE", pageWidth - 14, 16, {
    align: "right",
  });

  // Invoice number
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `#${data.invoice_number}`,
    pageWidth - 14,
    24,
    { align: "right" }
  );

  //  STATUS WATERMARK 
  if (data.status === "paid") {
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setGState(new (doc as any).GState({
      opacity: 0.15
    }));
    doc.text("PAID", pageWidth / 2, 140, {
      align: "center",
      angle: 45,
    });
    doc.setGState(new (doc as any).GState({
      opacity: 1
    }));
  } else if (data.status === "overdue") {
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setGState(new (doc as any).GState({
      opacity: 0.15
    }));
    doc.text("OVERDUE", pageWidth / 2, 140, {
      align: "center",
      angle: 45,
    });
    doc.setGState(new (doc as any).GState({
      opacity: 1
    }));
  }

  //  INVOICE META 
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");

  // Left: Bill To
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("BILL TO", 14, 44);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, 14, 51);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.customer.phone) {
    doc.text(` ${data.customer.phone}`, 14, 57);
  }
  if (data.customer.address) {
    doc.text(data.customer.address, 14, 63);
  }
  if (data.customer.gst_number) {
    doc.text(
      `GST: ${data.customer.gst_number}`, 
      14, 69
    );
  }

  // Right: Invoice details
  const rightX = pageWidth - 14;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("INVOICE DATE", rightX - 45, 44);
  doc.text("DUE DATE", rightX - 45, 52);
  doc.text("STATUS", rightX - 45, 60);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(
    new Date(data.created_at)
      .toLocaleDateString("en-IN"),
    rightX,
    44,
    { align: "right" }
  );
  doc.text(
    data.due_date
      ? new Date(data.due_date)
          .toLocaleDateString("en-IN")
      : "On Receipt",
    rightX,
    52,
    { align: "right" }
  );

  // Status badge
  const statusColors: Record<string, number[]> = {
    paid: [34, 197, 94],
    unpaid: [239, 68, 68],
    partial: [234, 179, 8],
    overdue: [239, 68, 68],
    draft: [148, 163, 184],
  };
  const statusColor = 
    statusColors[data.status] || [148, 163, 184];
  doc.setFillColor(
    statusColor[0], 
    statusColor[1], 
    statusColor[2]
  );
  doc.roundedRect(rightX - 28, 56, 28, 7, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    data.status.toUpperCase(),
    rightX - 14,
    61,
    { align: "center" }
  );

  //  ITEMS TABLE 
  const tableColumns = data.items.some(
    i => i.gst_rate
  )
    ? ["#", "Item", "HSN", "Qty", 
       "Rate", "Disc%", "GST%", "Amount"]
    : ["#", "Item", "Qty", "Rate", "Amount"];

  const tableRows = data.items.map((item, i) =>
    data.items.some(i => i.gst_rate)
      ? [
          i + 1,
          item.name,
          item.hsn || "-",
          `${item.quantity} ${item.unit || ""}`,
          `Rs.${item.rate.toLocaleString("en-IN")}`,
          item.discount ? `${item.discount}%` : "-",
          item.gst_rate ? `${item.gst_rate}%` : "-",
          `Rs.${item.total.toLocaleString("en-IN")}`,
        ]
      : [
          i + 1,
          item.name,
          `${item.quantity} ${item.unit || ""}`,
          `Rs.${item.rate.toLocaleString("en-IN")}`,
          `Rs.${item.total.toLocaleString("en-IN")}`,
        ]
  );

  autoTable(doc, {
    startY: 76,
    head: [tableColumns],
    body: tableRows,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8 },
    },
  });

  //  TOTALS 
  const finalY = (doc as any).lastAutoTable.finalY 
                 + 6;
  const totalsX = pageWidth - 70;

  // Check for page break before totals
  const totalsHeight = 60; // Approximate height of totals box + padding
  const pageHeight = doc.internal.pageSize.height;
  
  if (finalY + totalsHeight > pageHeight - 20) {
    doc.addPage();
    // Reset Y for the new page
    doc.setFillColor(248, 250, 252);
    doc.rect(totalsX - 4, 14, 68, 52, "F");
    var ty = 20;
  } else {
    // Totals box
    doc.setFillColor(248, 250, 252);
    doc.rect(totalsX - 4, finalY - 4, 
             68, 52, "F");
    var ty = finalY + 2;
  }

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");

  doc.text("Subtotal:", totalsX, ty);
  doc.text(
    `Rs.${data.subtotal.toLocaleString("en-IN")}`,
    pageWidth - 14,
    ty,
    { align: "right" }
  );

  if (data.discount_total && 
      data.discount_total > 0) {
    ty += 7;
    doc.setTextColor(34, 197, 94);
    doc.text("Discount:", totalsX, ty);
    doc.text(
      `-Rs.${data.discount_total
            .toLocaleString("en-IN")}`,
      pageWidth - 14,
      ty,
      { align: "right" }
    );
  }

  if (data.cgst && data.cgst > 0) {
    ty += 7;
    doc.setTextColor(71, 85, 105);
    doc.text(
      `CGST:`,
      totalsX,
      ty
    );
    doc.text(
      `Rs.${data.cgst.toLocaleString("en-IN")}`,
      pageWidth - 14,
      ty,
      { align: "right" }
    );

    ty += 7;
    doc.text(`SGST:`, totalsX, ty);
    doc.text(
      `Rs.${(data.sgst || 0)
            .toLocaleString("en-IN")}`,
      pageWidth - 14,
      ty,
      { align: "right" }
    );
  }

  // Grand Total
  ty += 8;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.3);
  doc.line(totalsX, ty - 3, pageWidth - 14, ty - 3);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("TOTAL:", totalsX, ty + 2);
  doc.text(
    `Rs.${data.grand_total.toLocaleString("en-IN")}`,
    pageWidth - 14,
    ty + 2,
    { align: "right" }
  );

  // Amount in words
  ty += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${numberToWords(data.grand_total)} Only`,
    14,
    ty
  );

  //  PAYMENT SECTION 
  if (data.business.upi_id) {
    ty += 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("PAYMENT DETAILS", 14, ty);

    ty += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `UPI: ${data.business.upi_id}`, 
      14, ty
    );
  }

  //  NOTES 
  if (data.notes) {
    // Check if notes fit on current page
    const notesLines = doc.splitTextToSize(data.notes, 180);
    const notesHeight = (notesLines.length * 5) + 10;
    
    if (ty + notesHeight > pageHeight - 25) {
      doc.addPage();
      ty = 20;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("NOTES:", 14, ty);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(notesLines, 14, ty + 5);
    ty += notesHeight;
  }

  //  THANK YOU 
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Thank you for your business! ",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  addVyapariFooter(doc);

  const filename = `Invoice_${data.invoice_number}_${data.customer.name.replace(/\s+/g, "_")}.pdf`;
  if (action === 'open') {
    openPDFInTab(doc);
  } else {
    downloadPDF(doc, filename);
  }
};

// Number to words helper
const numberToWords = (num: number): string => {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  if (num === 0) return "Zero";

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] +
        (n % 10 ? " " + ones[n % 10] : "")
      );
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 
          ? " " + convert(n % 100000) 
          : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 
        ? " " + convert(n % 10000000) 
        : "")
    );
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = convert(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  return result;
};
