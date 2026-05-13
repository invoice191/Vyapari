import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  downloadPDF,
  openPDFInTab,
  addVyapariHeader,
  addVyapariFooter,
  tableStyles
} from "./downloadPDF";

export interface SimulationData {
  horizon: number;
  marketCondition: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  aiSummary?: string;
  totalCurrentRevenue: number;
  totalProjectedRevenue: number;
  revenueChange: number;
  revenueChangePct: number;
  totalCurrentProfit: number;
  totalProjectedProfit: number;
  profitChange: number;
  profitChangePct: number;
  products: Array<{
    productName: string;
    currentPrice: number;
    newPrice: number;
    costPrice: number;
    revenueChange: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export const generateSimulationPDF = (
  data: SimulationData,
  businessName: string,
  action: 'download' | 'open' = 'download'
): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page 1  Cover
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Neural grid background effect
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.1);
  for (let i = 0; i < pageWidth; i += 10) {
    doc.line(i, 0, i, pageHeight);
  }
  for (let i = 0; i < pageHeight; i += 10) {
    doc.line(0, i, pageWidth, i);
  }

  // Cover content
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("VYAPARI", pageWidth / 2, 80, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(159, 239, 0);
  doc.text(
    "Business Intelligence Platform",
    pageWidth / 2,
    92,
    { align: "center" }
  );

  // Divider
  doc.setDrawColor(159, 239, 0);
  doc.setLineWidth(1);
  doc.line(50, 100, pageWidth - 50, 100);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SIMULATION REPORT", pageWidth / 2, 120, {
    align: "center",
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(businessName, pageWidth / 2, 140, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setTextColor(199, 210, 254);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    pageWidth / 2,
    152,
    { align: "center" }
  );
  doc.text(
    `Horizon: ${data.horizon} days | Market: ${data.marketCondition}`,
    pageWidth / 2,
    160,
    { align: "center" }
  );

  // Risk badge
  const riskColors: Record<string, number[]> = {
    LOW: [34, 197, 94],
    MEDIUM: [234, 179, 8],
    HIGH: [239, 68, 68],
  };
  const rc = riskColors[data.overallRisk] 
             || [148, 163, 184];
  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.roundedRect(
    pageWidth / 2 - 30, 170, 60, 14, 4, 4, "F"
  );
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Risk: ${data.overallRisk}`,
    pageWidth / 2,
    179,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 210, 254);
  doc.text(
    `Confidence: ${data.confidence}%`,
    pageWidth / 2,
    196,
    { align: "center" }
  );

  // Page 2  Executive Summary
  doc.addPage();
  let y = addVyapariHeader(
    doc,
    "Executive Summary",
    businessName,
    `Simulation Report  ${
      new Date().toLocaleDateString("en-IN")
    }`
  );

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(
    data.aiSummary || 
    "AI analysis of your simulation scenario.",
    180
  );
  doc.text(summaryLines, 14, y + 5);

  y += summaryLines.length * 6 + 15;

  // Key metrics table
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Current", 
            "Projected", "Change", "% Change"]],
    body: [
      [
        "Total Revenue",
        `Rs.${data.totalCurrentRevenue
              .toLocaleString("en-IN")}`,
        `Rs.${data.totalProjectedRevenue
              .toLocaleString("en-IN")}`,
        `+Rs.${data.revenueChange
               .toLocaleString("en-IN")}`,
        `+${data.revenueChangePct}%`,
      ],
      [
        "Total Profit",
        `Rs.${data.totalCurrentProfit
              .toLocaleString("en-IN")}`,
        `Rs.${data.totalProjectedProfit
              .toLocaleString("en-IN")}`,
        `+Rs.${data.profitChange
               .toLocaleString("en-IN")}`,
        `+${data.profitChangePct}%`,
      ],
    ],
    ...tableStyles,
  });

  // Page 3  Product Analysis
  doc.addPage();
  y = addVyapariHeader(
    doc,
    "Product Analysis",
    businessName
  );

  autoTable(doc, {
    startY: y,
    head: [
      ["Product", "Old Price", "New Price",
       "Cost", "Margin", "Rev Change", "Risk"],
    ],
    body: data.products.map((p) => [
      p.productName,
      `Rs.${p.currentPrice}`,
      `Rs.${p.newPrice}`,
      `Rs.${p.costPrice}`,
      `${(((p.newPrice - p.costPrice) / 
            p.newPrice) * 100).toFixed(1)}%`,
      `+Rs.${p.revenueChange
             .toLocaleString("en-IN")}`,
      p.risk,
    ]),
    ...tableStyles,
    didParseCell: (cellData) => {
      if (cellData.column.index === 6) {
        if (cellData.cell.raw === "LOW") {
          cellData.cell.styles.textColor = 
            [34, 197, 94];
        } else if (cellData.cell.raw === "HIGH") {
          cellData.cell.styles.textColor = 
            [239, 68, 68];
        } else {
          cellData.cell.styles.textColor = 
            [234, 179, 8];
        }
      }
    },
  });

  // Page 4  Recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    doc.addPage();
    y = addVyapariHeader(
      doc,
      "AI Recommendations",
      businessName
    );

    data.recommendations?.forEach((rec, i) => {
      const priorityColors: 
        Record<string, number[]> = {
        HIGH: [239, 68, 68],
        MEDIUM: [234, 179, 8],
        LOW: [34, 197, 94],
      };
      const pc = priorityColors[rec.priority] 
                 || [148, 163, 184];

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 28, "F");
      doc.setFillColor(pc[0], pc[1], pc[2]);
      doc.rect(14, y, 3, 28, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${rec.title}`, 22, y + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(
        rec.description, 160
      );
      doc.text(descLines, 22, y + 15);

      doc.setTextColor(pc[0], pc[1], pc[2]);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${rec.priority} PRIORITY`,
        pageWidth - 18,
        y + 8,
        { align: "right" }
      );

      y += 34;
    });
  }

  addVyapariFooter(doc);

  //  DOWNLOAD AS PDF 
  const filename = `Simulation_Report_${businessName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  if (action === 'open') {
    openPDFInTab(doc);
  } else {
    downloadPDF(doc, filename);
  }
};
