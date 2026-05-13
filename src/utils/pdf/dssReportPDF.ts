import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  downloadPDF,
  openPDFInTab,
  addVyapariHeader,
  addVyapariFooter,
  tableStyles
} from "./downloadPDF";

export const generateDSSReport = (
  engineName: string,
  data: any,
  businessName: string,
  action: 'download' | 'open' = 'download'
): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const y = addVyapariHeader(
    doc,
    `${engineName} Report`,
    businessName,
    `Generated: ${new Date()
      .toLocaleDateString("en-IN")}`
  );

  // EST. IMPACT KPI
  if (data.estImpact) {
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(14, y, 85, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("EST. IMPACT", 20, y + 7);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Rs.${data.estImpact.toLocaleString("en-IN")}`,
      20,
      y + 15
    );

    doc.setFillColor(99, 102, 241);
    doc.roundedRect(104, y, 85, 20, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("AI CONFIDENCE", 110, y + 7);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${data.confidence || 87}%`,
      110,
      y + 15
    );
  }

  // AI Summary
  const summaryY = y + 28;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, summaryY, 182, 20, "F");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("AI INSIGHT", 18, summaryY + 6);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const aiLines = doc.splitTextToSize(
    data.aiSummary || "Analysis complete.", 170
  );
  doc.text(aiLines, 18, summaryY + 13);

  // Data table
  if (data.tableData && data.tableHeaders) {
    autoTable(doc, {
      startY: summaryY + 28,
      head: [data.tableHeaders],
      body: data.tableData,
      ...tableStyles,
    });
  }

  addVyapariFooter(doc);

  const filename = `${engineName.replace(/\s+/g, "_")}_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  if (action === 'open') {
    openPDFInTab(doc);
  } else {
    downloadPDF(doc, filename);
  }
};
