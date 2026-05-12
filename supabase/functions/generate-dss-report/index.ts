
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { business, aiResult, reportType = 'full' } = await req.json();

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ── PAGE 1: COVER ──
    const page1 = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page1.getSize();

    // Background
    page1.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.01, 0.03, 0.1), // Dark blue
    });

    page1.drawText("VYAPARI INTELLIGENCE", { x: 50, y: height - 100, size: 14, color: rgb(0.4, 0.4, 1), font });
    page1.drawText("BUSINESS STRATEGY REPORT", { x: 50, y: height - 150, size: 36, font: boldFont, color: rgb(1, 1, 1) });
    page1.drawText(business.name.toUpperCase(), { x: 50, y: height - 200, size: 24, font, color: rgb(0.8, 0.8, 1) });

    // Health Score Circle
    const score = aiResult?.business_health_score || 0;
    const scoreColor = score > 80 ? rgb(0.1, 0.8, 0.5) : score > 50 ? rgb(0.2, 0.5, 1) : rgb(1, 0.3, 0.3);
    
    page1.drawCircle({
      x: width / 2,
      y: height / 2,
      size: 80,
      borderColor: scoreColor,
      borderWidth: 10,
    });
    
    page1.drawText(`${score}`, { x: width / 2 - 25, y: height / 2 - 15, size: 40, font: boldFont, color: rgb(1, 1, 1) });
    page1.drawText("HEALTH SCORE", { x: width / 2 - 40, y: height / 2 - 40, size: 10, font, color: rgb(0.6, 0.6, 0.6) });

    page1.drawText(`Generated on: ${new Date().toLocaleDateString()}`, { x: 50, y: 100, size: 10, color: rgb(0.5, 0.5, 0.5), font });
    page1.drawText("CONFIDENTIAL - FOR BUSINESS OWNER ONLY", { x: 50, y: 80, size: 8, color: rgb(0.3, 0.3, 0.3), font });

    // ── PAGE 2: VANI BRIEFING ──
    const page2 = pdfDoc.addPage([595, 842]);
    page2.drawText("EXECUTIVE BRIEFING", { x: 50, y: height - 50, size: 18, font: boldFont });
    
    const narrative = aiResult?.vani_narrative || "Scanning business telemetry...";
    const lines = wrapText(narrative, 80);
    lines.forEach((line, i) => {
      page2.drawText(line, { x: 50, y: height - 100 - (i * 20), size: 12, font, lineHeight: 1.5 });
    });

    // Top Actions
    let yPos = height - 250;
    page2.drawText("TOP PRIORITY ACTIONS", { x: 50, y: yPos, size: 14, font: boldFont, color: rgb(0.4, 0.4, 1) });
    yPos -= 30;

    (aiResult?.top_3_urgent_actions || []).forEach((action: any, i: number) => {
      page2.drawRectangle({ x: 50, y: yPos - 70, width: 500, height: 60, color: rgb(0.97, 0.98, 1) });
      page2.drawText(`${i + 1}. ${action.title}`, { x: 60, y: yPos - 25, size: 12, font: boldFont });
      page2.drawText(action.action, { x: 60, y: yPos - 45, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
      page2.drawText(`Impact: ₹${action.rupee_impact.toLocaleString()}`, { x: 420, y: yPos - 25, size: 10, font: boldFont, color: rgb(0, 0.6, 0.3) });
      yPos -= 80;
    });

    // ── PAGE 3: ENGINE DETAILS ──
    const page3 = pdfDoc.addPage([595, 842]);
    page3.drawText("PRICING STRATEGY", { x: 50, y: height - 50, size: 18, font: boldFont });
    
    const pricing = aiResult?.engines?.pricing?.recommendations || [];
    yPos = height - 100;
    
    // Table Header
    page3.drawRectangle({ x: 50, y: yPos - 20, width: 500, height: 20, color: rgb(0.9, 0.9, 0.9) });
    page3.drawText("Product", { x: 60, y: yPos - 15, size: 10, font: boldFont });
    page3.drawText("Current", { x: 250, y: yPos - 15, size: 10, font: boldFont });
    page3.drawText("Target", { x: 320, y: yPos - 15, size: 10, font: boldFont });
    page3.drawText("Monthly Lift", { x: 420, y: yPos - 15, size: 10, font: boldFont });
    yPos -= 30;

    pricing.slice(0, 15).forEach((r: any) => {
      page3.drawText(r.product_name.substring(0, 25), { x: 60, y: yPos, size: 9, font });
      page3.drawText(`₹${r.current_price}`, { x: 250, y: yPos, size: 9, font });
      page3.drawText(`₹${r.recommended_price}`, { x: 320, y: yPos, size: 9, font });
      page3.drawText(`+₹${r.expected_monthly_profit_change.toLocaleString()}`, { x: 420, y: yPos, size: 9, font, color: rgb(0, 0.5, 0) });
      yPos -= 20;
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="Vyapari_DSS_Report.pdf"`
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

function wrapText(text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length < maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  lines.push(currentLine);
  return lines;
}
