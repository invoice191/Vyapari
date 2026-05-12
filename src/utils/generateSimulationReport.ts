import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SimResult } from "./simulationCalculations";

export interface SimulationData extends SimResult {
  businessName: string;
  scenarioName: string;
  aiSummary: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export async function generateSimulationReport(
  data: SimulationData
): Promise<void> {
  const doc = new jsPDF();
  
  // Cover page
  doc.setFillColor(79, 70, 229); // brand color
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("VYAPARI", 105, 80, { align: "center" });
  doc.setFontSize(14);
  doc.text("Business Intelligence Platform", 
           105, 95, { align: "center" });
  
  // Divider line
  doc.setDrawColor(159, 239, 0); // neon color
  doc.setLineWidth(0.5);
  doc.line(40, 110, 170, 110);
  
  doc.setFontSize(24);
  doc.text("SIMULATION REPORT", 
           105, 130, { align: "center" });
  
  doc.setFontSize(14);
  doc.text(data.businessName, 
           105, 160, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`,
           105, 175, { align: "center" });
  doc.text(`Horizon: ${data.horizon} days | Market: ${data.marketCondition}`,
           105, 185, { align: "center" });
  
  // Risk badge
  const riskColor = data.risk === "LOW" 
    ? [34, 197, 94]    // green
    : data.risk === "MEDIUM" 
    ? [234, 179, 8]    // yellow
    : [239, 68, 68];   // red
  
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(75, 200, 60, 20, 5, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`Risk: ${data.risk}`, 
           105, 213, { align: "center" });

  // Add new page for executive summary
  doc.addPage();
  
  // Header on each page
  const addHeader = (d: jsPDF, bizName: string) => {
    d.setFillColor(79, 70, 229);
    d.rect(0, 0, 210, 20, "F");
    d.setTextColor(255, 255, 255);
    d.setFontSize(10);
    d.text("VYAPARI — Simulation Report", 15, 13);
    d.text(bizName, 195, 13, { align: "right" });
  };

  addHeader(doc, data.businessName);

  // Executive Summary content
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 15, 35);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const splitSummary = doc.splitTextToSize(data.aiSummary, 180);
  doc.text(splitSummary, 15, 50);

  // Key metrics table
  autoTable(doc, {
    startY: 90,
    head: [["Metric", "Current", "Projected", "Change", "% Change"]],
    body: [
      ["Total Revenue", 
       `₹${data.totalCurrentRevenue.toLocaleString("en-IN")}`,
       `₹${data.totalProjectedRevenue.toLocaleString("en-IN")}`,
       `${data.revenueChange >= 0 ? '+' : ''}₹${data.revenueChange.toLocaleString("en-IN")}`,
       `${data.revenueChangePct}%`],
      ["Total Profit",
       `₹${data.totalCurrentProfit.toLocaleString("en-IN")}`,
       `₹${data.totalProjectedProfit.toLocaleString("en-IN")}`,
       `${data.profitChange >= 0 ? '+' : ''}₹${data.profitChange.toLocaleString("en-IN")}`,
       `${data.profitChangePct}%`],
    ],
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    styles: { fontSize: 10 }
  });

  // PAGE 3 - Financial Projections
  doc.addPage();
  addHeader(doc, data.businessName);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Projections", 15, 35);

  autoTable(doc, {
    startY: 50,
    head: [["Metric", "Current", "Projected", "Change", "% Change"]],
    body: [
      ["Total Revenue", `₹${data.totalCurrentRevenue.toLocaleString("en-IN")}`, `₹${data.totalProjectedRevenue.toLocaleString("en-IN")}`, `${data.revenueChange >= 0 ? '+' : ''}₹${data.revenueChange.toLocaleString("en-IN")}`, `${data.revenueChangePct}%`],
      ["Total Profit", `₹${data.totalCurrentProfit.toLocaleString("en-IN")}`, `₹${data.totalProjectedProfit.toLocaleString("en-IN")}`, `${data.profitChange >= 0 ? '+' : ''}₹${data.profitChange.toLocaleString("en-IN")}`, `${data.profitChangePct}%`],
      ["Profit Margin", `${((data.totalCurrentProfit / (data.totalCurrentRevenue || 1)) * 100).toFixed(1)}%`, `${((data.totalProjectedProfit / (data.totalProjectedRevenue || 1)) * 100).toFixed(1)}%`, `${(((data.totalProjectedProfit / (data.totalProjectedRevenue || 1)) - (data.totalCurrentProfit / (data.totalCurrentRevenue || 1))) * 100).toFixed(1)}%`, "-"],
    ],
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10 }
  });

  // PAGE 4 - Product Analysis
  doc.addPage();
  addHeader(doc, data.businessName);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Product Breakdown", 15, 35);

  autoTable(doc, {
    startY: 50,
    head: [["Product", "Old Price", "New Price", "Rev Change", "Units Change"]],
    body: data.products.map(p => [
      p.productName,
      `₹${p.currentPrice}`,
      `₹${p.newPrice}`,
      `${p.revenueChange >= 0 ? '+' : ''}₹${p.revenueChange}`,
      `${p.adjustedQuantity - (p.currentRevenue/p.currentPrice || 0)}`
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10 }
  });

  // PAGE 5 - Break-even Analysis
  doc.addPage();
  addHeader(doc, data.businessName);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Break-even Analysis", 15, 35);

  autoTable(doc, {
    startY: 50,
    head: [["Product", "Break-even Units", "Break-even Days", "Status"]],
    body: data.products.map(p => [
      p.productName,
      `${p.breakEvenUnits} units`,
      `${p.breakEvenDays} days`,
      p.breakEvenDays <= data.horizon ? "✅ Achievable" : "⚠️ High Risk"
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10 }
  });

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} | Confidential`,
      105, 290,
      { align: "center" }
    );
  }

  // Save
  doc.save(
    `Vyapari_Simulation_${data.businessName.replace(/\s+/g, '_')}_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}
