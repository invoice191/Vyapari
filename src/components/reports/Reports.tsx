import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, AreaChart, Area
} from "recharts";
import { C, R } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader, Badge, OrangeBtn } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { 
  getDailySales, 
  getInventorySummary, 
  getInventoryValuation,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getItemLogs,
  getItemSalesLogs,
  InventoryItem,
  StockLog
} from "../../services/dataService";
import { Settings, Download, FileText, Table, FileSpreadsheet, Check, X, Plus, Trash2, History, TrendingUp, User } from "lucide-react";

const REPORT_TREE = [
  {
    cat: "📊 Sales Reports",
    items: [
      { key: "daily-sales", label: "Daily Sales Summary" },
      { key: "hourly-analysis", label: "Hourly Sales Analysis" },
      { key: "payment-modes", label: "Payment Mode Analysis" },
      { key: "tax-summary", label: "Tax / GST Summary" },
      { key: "promo-effectiveness", label: "Promo Effectiveness" },
    ]
  },
  {
    cat: "📦 Inventory Reports",
    items: [
      { key: "stock-movement", label: "Stock Movement Report" },
      { key: "low-stock", label: "Low Stock Alert" },
      { key: "dead-stock", label: "Dead Stock Analysis" },
      { key: "inventory-valuation", label: "Inventory Valuation" },
      { key: "supplier-performance", label: "Supplier Performance" },
    ]
  },
  {
    cat: "💰 Financial Reports",
    items: [
      { key: "pl-statement", label: "P&L Statement" },
      { key: "cash-flow", label: "Cash Flow Statement" },
      { key: "expense-breakdown", label: "Expense Breakdown" },
      { key: "cogs-analysis", label: "COGS Analysis" },
    ]
  },
  {
    cat: "👥 Customer Reports",
    items: [
      { key: "rfm-segmentation", label: "RFM Segmentation" },
      { key: "customer-acquisition", label: "Acquisition & Retention" },
      { key: "clv-analysis", label: "CLV Analysis" },
    ]
  },
  {
    cat: "👤 Staff Reports",
    items: [
      { key: "staff-sales", label: "Sales by Employee" },
    ]
  }
];

// ── Download helpers ─────────────────────────────────────────────────────────
function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const lines = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv"; a.click();
}
function downloadExcel(filename: string, headers: string[], rows: any[][]) {
  const html = `<table><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</table>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename + ".xls"; a.click();
}
function downloadPDF(reportTitle: string, subtitleText: string, tableHeaders: string[], tableRows: any[][], summaryCards?: any[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const cardHTML = summaryCards ? summaryCards.map(c =>
    `<div style="display:inline-block;margin:6px;padding:14px 20px;background:#FFF0E6;border-radius:10px;min-width:140px;text-align:center">
      <div style="font-size:12px;color:#636E72">${c.label}</div>
      <div style="font-size:22px;font-weight:800;color:#FF6B35">${c.value}</div>
      ${c.sub ? `<div style="font-size:11px;color:#636E72">${c.sub}</div>` : ""}
    </div>`).join("") : "";
  const rowsHTML = tableRows.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fa"}">${r.map(v => `<td style="padding:8px 12px;border-bottom:1px solid #eee">${v}</td>`).join("")}</tr>`).join("");
  win.document.write(`
    <html><head><title>${reportTitle}</title>
    <style>body{font-family:Arial,sans-serif;margin:32px;color:#2D3436}
    h1{color:#FF6B35;margin-bottom:4px}p{color:#636E72;margin:0 0 20px}
    table{width:100%;border-collapse:collapse}
    th{background:#FF6B35;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
    td{font-size:13px} .footer{margin-top:32px;font-size:12px;color:#B2BEC3;border-top:1px solid #eee;padding-top:12px}
    @media print{button{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>${reportTitle}</h1><p>${subtitleText}</p></div>
      <div style="text-align:right;font-size:12px;color:#636E72">
        Generated: ${new Date().toLocaleString("en-IN")}<br>Vyapari Intelligence Platform
      </div>
    </div>
    ${cardHTML ? `<div style="margin-bottom:20px">${cardHTML}</div>` : ""}
    <table><thead><tr>${tableHeaders.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rowsHTML}</tbody></table>
    <div class="footer">© Vyapari 2026 · Confidential · Auto-generated report</div>
    <br><button onclick="window.print()" style="background:#FF6B35;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600">🖨️ Print / Save as PDF</button>
    </body></html>`);
  win.document.close();
}

// ── Shared UI Components ─────────────────────────────────────────────────────
function InsightBox({ insights }: { insights: any[] }) {
  return (
    <div className="bg-neon/5 border border-neon/20 p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 text-[8px] font-black text-neon/30 uppercase tracking-[0.3em]">Neural_Insights_Engine</div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">💡</span>
        <span className="font-black text-neon text-xs uppercase tracking-[0.2em]">Strategic Intelligence Vectors</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((ins, i) => (
          <div key={i} className="flex gap-4 items-start bg-white p-4 border border-ink/5 hover:border-neon transition-colors">
            <span className="text-neon text-xl mt-1 flex-shrink-0">{ins.icon}</span>
            <span className="text-xs text-ink/70 leading-relaxed font-medium">{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ cards }: { cards: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((c, i) => (
        <div key={i} className="brutal-card bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform">
          <div className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2">{c.label}</div>
          <div className="text-3xl font-black tracking-tighter mb-1" style={{ color: c.color || '#0A0A0A' }}>{c.value}</div>
          {c.sub && <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.subColor || '#636E72' }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function DownloadBar({ title, subtitle, headers, rows, summaryCards }: any) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b-4 border-ink pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{title}</h2>
          <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCustomizerOpen(true)} 
            className="brutal-btn !py-2 !px-6 text-[10px] bg-neon text-ink flex items-center gap-2"
          >
            <Settings size={14} /> CUSTOMIZE & DOWNLOAD
          </button>
        </div>
      </div>

      <ReportCustomizer 
        isOpen={isCustomizerOpen} 
        onClose={() => setIsCustomizerOpen(false)}
        title={title}
        subtitle={subtitle}
        headers={headers}
        rows={rows}
        summaryCards={summaryCards}
      />
    </>
  );
}

function ReportCustomizer({ isOpen, onClose, title, subtitle, headers, rows, summaryCards }: any) {
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>(headers);
  const [customTitle, setCustomTitle] = useState(title);
  const [customSubtitle, setCustomSubtitle] = useState(subtitle);

  useEffect(() => {
    setSelectedHeaders(headers);
    setCustomTitle(title);
    setCustomSubtitle(subtitle);
  }, [headers, title, subtitle]);

  if (!isOpen) return null;

  const toggleHeader = (h: string) => {
    setSelectedHeaders((prev: string[]) => 
      prev.includes(h) ? prev.filter(item => item !== h) : [...prev, h]
    );
  };

  const getFilteredData = () => {
    const indices = headers.map((h: string, i: number) => selectedHeaders.includes(h) ? i : -1).filter((i: number) => i !== -1);
    const filteredHeaders = headers.filter((h: string) => selectedHeaders.includes(h));
    const filteredRows = rows.map((r: any[]) => indices.map(i => r[i]));
    return { filteredHeaders, filteredRows };
  };

  const handleDownload = (type: 'csv' | 'excel' | 'pdf') => {
    const { filteredHeaders, filteredRows } = getFilteredData();
    if (type === 'csv') downloadCSV(customTitle, filteredHeaders, filteredRows);
    if (type === 'excel') downloadExcel(customTitle, filteredHeaders, filteredRows);
    if (type === 'pdf') downloadPDF(customTitle, customSubtitle, filteredHeaders, filteredRows, summaryCards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-ink w-full max-w-2xl shadow-[16px_16px_0px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b-4 border-ink flex justify-between items-center bg-neon/10">
          <div className="flex items-center gap-3">
            <Settings className="text-ink" size={24} />
            <h3 className="text-xl font-black uppercase tracking-tighter">Report Customizer</h3>
          </div>
          <button onClick={onClose} className="text-2xl hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2 block">Report Title</label>
                <input 
                  value={customTitle} 
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2 block">Subtitle / Description</label>
                <textarea 
                  value={customSubtitle} 
                  onChange={e => setCustomSubtitle(e.target.value)}
                  rows={2}
                  className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 resize-none"
                />
              </div>
            </div>

            <div className="bg-ink/5 p-4 border-2 border-dashed border-ink/20">
              <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-3">Live Preview Stats</div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span>Columns Selected:</span>
                  <span className="text-neon">{selectedHeaders.length} / {headers.length}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span>Total Rows:</span>
                  <span>{rows.length}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span>Est. File Size:</span>
                  <span>~{(rows.length * selectedHeaders.length * 0.1).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">Select Columns to Include</label>
              <div className="flex gap-2">
                <button onClick={() => setSelectedHeaders(headers)} className="text-[8px] font-black uppercase tracking-widest text-blue-500 hover:underline">Select All</button>
                <button onClick={() => setSelectedHeaders([])} className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:underline">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {headers.map((h: string) => (
                <button
                  key={h}
                  onClick={() => toggleHeader(h)}
                  className={`px-4 py-3 border-2 border-ink text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-2 text-left ${selectedHeaders.includes(h) ? 'bg-ink text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-ink hover:bg-ink/5'}`}
                >
                  <span className="truncate">{h}</span>
                  {selectedHeaders.includes(h) ? <Check size={12} className="text-neon" /> : <div className="w-3 h-3 border border-ink/20" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t-4 border-ink bg-ink/5 flex flex-wrap gap-3 justify-end">
          <button onClick={() => handleDownload('csv')} className="brutal-btn bg-white text-green-700 border-green-700 flex items-center gap-2">
            <Table size={16} /> CSV
          </button>
          <button onClick={() => handleDownload('excel')} className="brutal-btn bg-white text-blue-700 border-blue-700 flex items-center gap-2">
            <FileSpreadsheet size={16} /> EXCEL
          </button>
          <button onClick={() => handleDownload('pdf')} className="brutal-btn bg-ink text-white border-ink flex items-center gap-2">
            <FileText size={16} /> PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DataTable({ headers, rows, colColors = {}, highlight = {} }: any) {
  return (
    <div className="overflow-x-auto border-2 border-ink shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead>
          <tr className="bg-ink text-white">
            {headers.map((h: string, i: number) => (
              <th key={i} className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map((row: any[], ri: number) => (
            <tr key={ri} className="border-b border-ink/5 hover:bg-neon/5 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`p-4 text-xs font-bold border-r border-ink/5 last:border-0 ${ci === 0 ? 'font-black' : ''}`} style={{ color: colColors[ci] || '#0A0A0A', ...((highlight[ci] && typeof cell === "string") ? { color: cell.includes("↑") || cell.includes("Critical") || cell.includes("▲") ? '#EF4444' : cell.includes("↓") || cell.includes("Normal") ? '#10B981' : '#0A0A0A' } : {}) }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Report Components ────────────────────────────────────────────────────────

function ReportDailySales() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getDailySales((data) => {
      setDailyData(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const headers = ["Date", "Transactions", "Gross Revenue", "Net Revenue", "Tax", "Net Profit", "Avg Ticket"];
  const rows = dailyData.map(r => [
    r.date, 
    r.txns, 
    `₹${Math.round(r.gross).toLocaleString("en-IN")}`, 
    `₹${Math.round(r.net).toLocaleString("en-IN")}`, 
    `₹${Math.round(r.tax).toLocaleString("en-IN")}`, 
    `₹${Math.round(r.profit).toLocaleString("en-IN")}`, 
    `₹${Math.round(r.gross / (r.txns || 1))}`
  ]);

  const totals = dailyData.reduce((a, r) => ({ 
    txns: a.txns + r.txns, 
    gross: a.gross + r.gross, 
    net: a.net + r.net, 
    profit: a.profit + r.profit 
  }), { txns: 0, gross: 0, net: 0, profit: 0 });

  const smCards = [
    { label: "Total Revenue", value: `₹${(totals.gross / 1000).toFixed(1)}K` }, 
    { label: "Net Profit", value: `₹${(totals.profit / 1000).toFixed(1)}K` }, 
    { label: "Transactions", value: totals.txns }, 
    { label: "Avg Daily", value: `₹${Math.round(totals.net / (dailyData.length || 1)).toLocaleString("en-IN")}` }
  ];

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading report data...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Daily Sales Summary" subtitle="Real-time sales tracking" headers={headers} rows={rows} summaryCards={smCards} />
      <SummaryRow cards={[
        { label: "Total Gross Revenue", value: `₹${(totals.gross / 1000).toFixed(2)}K`, color: C.orange },
        { label: "Total Net Revenue", value: `₹${(totals.net / 1000).toFixed(2)}K`, color: C.blue },
        { label: "Total Net Profit", value: `₹${(totals.profit / 1000).toFixed(2)}K`, color: C.green, sub: `Margin: ${((totals.profit / (totals.gross || 1)) * 100).toFixed(1)}%`, subColor: C.green },
        { label: "Total Transactions", value: totals.txns.toLocaleString("en-IN"), color: C.purple },
        { label: "Avg Ticket Size", value: `₹${Math.round(totals.net / (totals.txns || 1))}`, color: C.dark },
      ]} />
      <InsightBox insights={[
        { icon: "📈", text: `Highest revenue recorded on ${dailyData[0]?.date || 'N/A'}. Consider analyzing peak performance factors.` },
        { icon: "💰", text: `Current profit margin is ${((totals.profit / (totals.gross || 1)) * 100).toFixed(1)}%. Target is 30%.` },
        { icon: "🎯", text: "Discount rate is simulated at 8.0%. Review promotional strategy for next week." },
      ]} />
      <Card>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={dailyData.slice().reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}K`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any, n: string) => n === "Transactions" ? v : `₹${v.toLocaleString("en-IN")}`} />
            <Legend />
            <Bar yAxisId="left" dataKey="net" name="Net Revenue" fill={C.orange} opacity={0.85} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="profit" name="Net Profit" fill={C.green} opacity={0.7} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="txns" name="Transactions" stroke={C.blue} strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <DataTable headers={headers} rows={rows} />
      </Card>
    </motion.div>
  );
}

function ReportHourlyAnalysis() {
  const headers = ["Hour", "Orders", "Sales", "Avg Ticket", "Peak Status"];
  const rows = R.hourly.map(r => [r.hour, r.orders, `₹${r.sales.toLocaleString("en-IN")}`, `₹${r.avgTicket}`, r.peakFlag ? "🔥 Peak" : "Normal"]);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Hourly Sales Analysis" subtitle="Peak hour identification & staffing optimization" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Peak Hour", value: "7 PM", color: C.red, sub: "124 Orders", subColor: C.red },
        { label: "Avg Hourly Sales", value: "₹28.5K", color: C.blue },
        { label: "Busiest Window", value: "6 PM - 9 PM", color: C.orange },
      ]} />
      <Card>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={R.hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}K`} />
            <Tooltip formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} />
            <Bar dataKey="sales" name="Sales" fill={C.orange} radius={[4, 4, 0, 0]}>
              {R.hourly.map((e, i) => <Cell key={i} fill={e.peakFlag ? C.red : C.orange} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DataTable headers={headers} rows={rows} highlight={{ 4: true }} />
      </Card>
    </motion.div>
  );
}

function ReportPaymentModes() {
  const headers = ["Method", "Transactions", "Amount", "Share %", "Avg Ticket", "Growth"];
  const rows = R.paymentModes.map(r => [r.method, r.txns, `₹${r.amount.toLocaleString("en-IN")}`, `${r.pct}%`, `₹${r.avgTicket}`, `${r.growth > 0 ? "↑" : "↓"} ${Math.abs(r.growth)}%`]);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Payment Mode Analysis" subtitle="Transaction breakdown by payment channel" headers={headers} rows={rows} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={R.paymentModes} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80} label>
                {R.paymentModes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHeader title="Growth Trends" />
          {R.paymentModes.map(m => (
            <div key={m.method} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.gray50}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m.method}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: m.growth > 0 ? C.green : C.red }}>{m.growth > 0 ? "+" : ""}{m.growth}%</span>
            </div>
          ))}
        </Card>
      </div>
      <Card><DataTable headers={headers} rows={rows} highlight={{ 5: true }} /></Card>
    </motion.div>
  );
}

function ReportStockMovement() {
  const headers = ["SKU", "Product", "Opening", "Received", "Sold", "Closing", "Value", "Status"];
  const rows = R.stockMovement.map(r => [r.sku, r.product, r.openingStock, r.received, r.sold, r.closingStock, `₹${(r.value / 100000).toFixed(2)}L`, r.status]);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Stock Movement Report" subtitle="Inventory flow and valuation" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Total Inventory Value", value: "₹58.4L", color: C.blue },
        { label: "Critical Items", value: "2", color: C.red },
        { label: "Overstock Items", value: "5", color: C.yellow },
      ]} />
      <Card><DataTable headers={headers} rows={rows} highlight={{ 7: true }} /></Card>
    </motion.div>
  );
}

function ReportRFMSegmentation() {
  const headers = ["Segment", "Customers", "Recency", "Frequency", "Monetary", "Action"];
  const rows = R.rfmSegmentation.map(r => [r.segment, r.customers, r.recency, r.frequency, r.monetary, r.action]);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="RFM Segmentation" subtitle="Customer behavior clustering" headers={headers} rows={rows} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {R.rfmSegmentation.map(s => (
          <div key={s.segment} className="brutal-card bg-white p-4 group hover:bg-ink hover:text-white transition-colors">
            <div className="text-[10px] font-black text-ink/40 uppercase tracking-widest group-hover:text-white/60">{s.segment}</div>
            <div className="text-3xl font-black text-ink group-hover:text-white my-2 tracking-tighter">{s.customers}</div>
            <div className="text-[10px] font-bold text-ink/60 group-hover:text-white/40 uppercase tracking-tight">{s.action}</div>
          </div>
        ))}
      </div>
      <Card><DataTable headers={headers} rows={rows} /></Card>
    </motion.div>
  );
}

function ReportLowStock() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getInventorySummary((data) => {
      setItems(data.filter(i => i.stock <= i.minStock));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const headers = ["Product", "Category", "Current Stock", "Min Stock", "Shortfall", "Status"];
  const rows = items.map(r => [
    r.name, 
    r.category, 
    r.stock, 
    r.minStock, 
    r.minStock - r.stock, 
    r.stock === 0 ? "Out of Stock" : "Critical"
  ]);

  if (loading) return <div className="p-10 text-center font-black text-ink/40 uppercase tracking-widest">Loading low stock data...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Low Stock Alert" subtitle="Items requiring immediate replenishment" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Critical Items", value: items.length, color: "text-red-500" },
        { label: "Out of Stock", value: items.filter(i => i.stock === 0).length, color: "text-ink" },
      ]} />
      <Card>
        {items.length > 0 ? (
          <DataTable headers={headers} rows={rows} highlight={{ 2: true }} />
        ) : (
          <div className="p-10 text-center font-black text-emerald-500 uppercase tracking-widest">
            ✅ All stock levels are healthy!
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ReportInventoryValuation() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getInventoryValuation((val) => {
      setData(val);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-ink/40 uppercase tracking-widest">Calculating valuation...</div>;

  const headers = ["Category", "Valuation (₹)", "Share %"];
  const total = data.totalValue || 1;
  const rows = data.categoryBreakdown.map((c: any) => [
    c.name, 
    `₹${c.value.toLocaleString("en-IN")}`, 
    `${((c.value / total) * 100).toFixed(1)}%`
  ]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Inventory Valuation" subtitle="Financial breakdown of current stock" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Total Asset Value", value: `₹${(data.totalValue / 100000).toFixed(2)}L`, color: "text-blue-500" },
        { label: "Total Units", value: data.totalItems.toLocaleString(), color: "text-amber-500" },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <SectionHeader title="Category Distribution" />
          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.categoryBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: 'none', color: '#FFF', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                  formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} 
                />
                <Legend iconType="square" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <DataTable headers={headers} rows={rows} />
        </Card>
      </div>
    </motion.div>
  );
}

function ReportTaxSummary() {
  const headers = ["Tax Type", "Taxable Amount", "Tax Rate", "Tax Collected", "Status"];
  const rows = [
    ["CGST (9%)", "₹12,45,000", "9%", "₹1,12,050", "Filed"],
    ["SGST (9%)", "₹12,45,000", "9%", "₹1,12,050", "Filed"],
    ["IGST (18%)", "₹4,20,000", "18%", "₹75,600", "Pending"],
    ["Cess (1%)", "₹8,50,000", "1%", "₹8,500", "Filed"],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Tax / GST Summary" subtitle="Compliance and tax liability report" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Total Tax Liability", value: "₹3,08,200", color: C.red },
        { label: "Tax Paid", value: "₹2,32,600", color: C.green },
        { label: "Pending Dues", value: "₹75,600", color: C.orange },
      ]} />
      <Card>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[
            { name: "CGST", value: 112050 },
            { name: "SGST", value: 112050 },
            { name: "IGST", value: 75600 },
            { name: "Cess", value: 8500 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => `₹${v / 1000}K`} />
            <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
            <Bar dataKey="value" fill={C.blue} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <DataTable headers={headers} rows={rows} />
      </Card>
    </motion.div>
  );
}

function ReportDeadStock() {
  const headers = ["Product", "Last Sold", "Days Idle", "Stock Qty", "Value", "Action"];
  const rows = [
    ["Vintage Clock", "2023-11-12", "124", "12", "₹14,400", "Discount 30%"],
    ["Leather Wallet", "2023-12-05", "101", "45", "₹22,500", "Bundle Offer"],
    ["Ceramic Vase", "2024-01-10", "65", "8", "₹6,400", "Relocate"],
    ["Silk Scarf", "2023-10-20", "147", "22", "₹11,000", "Liquidation"],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Dead Stock Analysis" subtitle="Identifying non-moving inventory assets" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Dead Stock Value", value: "₹54,300", color: C.red },
        { label: "Items Affected", value: "4 SKUs", color: C.orange },
        { label: "Avg Days Idle", value: "109 Days", color: C.dark },
      ]} />
      <Card>
        <DataTable headers={headers} rows={rows} highlight={{ 5: true }} />
      </Card>
    </motion.div>
  );
}

function ReportPLStatement() {
  const headers = ["Category", "Current Month", "Previous Month", "Variance", "Status"];
  const rows = [
    ["Gross Revenue", "₹18,45,000", "₹16,20,000", "+13.8%", "▲"],
    ["COGS", "₹11,20,000", "₹9,80,000", "+14.2%", "▼"],
    ["Gross Profit", "₹7,25,000", "₹6,40,000", "+13.2%", "▲"],
    ["Operating Expenses", "₹2,45,000", "₹2,30,000", "+6.5%", "▼"],
    ["Net Profit", "₹4,80,000", "₹4,10,000", "+17.0%", "▲"],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="P&L Statement" subtitle="Monthly profit and loss performance" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Net Profit", value: "₹4.8L", color: C.green },
        { label: "Profit Margin", value: "26.0%", color: C.blue },
        { label: "Expense Ratio", value: "13.2%", color: C.orange },
      ]} />
      <Card>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[
            { month: "Jan", profit: 380000, revenue: 1450000 },
            { month: "Feb", profit: 410000, revenue: 1620000 },
            { month: "Mar", profit: 480000, revenue: 1845000 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={v => `₹${v / 1000}K`} />
            <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke={C.blue} fill={C.blue} fillOpacity={0.1} />
            <Area type="monotone" dataKey="profit" stackId="2" stroke={C.green} fill={C.green} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
        <DataTable headers={headers} rows={rows} highlight={{ 4: true }} />
      </Card>
    </motion.div>
  );
}

function ReportStaffSales() {
  const headers = ["Employee", "Role", "Total Sales", "Orders", "Avg Order", "Commission"];
  const rows = [
    ["Rahul Sharma", "Senior Cashier", "₹4,25,000", "142", "₹2,992", "₹8,500"],
    ["Priya Patel", "Sales Associate", "₹3,80,000", "115", "₹3,304", "₹7,600"],
    ["Amit Kumar", "Junior Cashier", "₹2,90,000", "98", "₹2,959", "₹5,800"],
    ["Sneha Reddy", "Sales Associate", "₹3,15,000", "104", "₹3,028", "₹6,300"],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DownloadBar title="Sales by Employee" subtitle="Staff performance and productivity metrics" headers={headers} rows={rows} />
      <SummaryRow cards={[
        { label: "Top Performer", value: "Rahul S.", color: C.blue, sub: "₹4.25L Sales" },
        { label: "Avg Sales/Staff", value: "₹3.52L", color: C.dark },
        { label: "Total Commission", value: "₹28,200", color: C.green },
      ]} />
      <Card>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[
            { name: "Rahul", sales: 425000 },
            { name: "Priya", sales: 380000 },
            { name: "Amit", sales: 290000 },
            { name: "Sneha", sales: 315000 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => `₹${v / 1000}K`} />
            <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
            <Bar dataKey="sales" fill={C.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <DataTable headers={headers} rows={rows} />
      </Card>
    </motion.div>
  );
}

function ReportPlaceholder({ title }: { title: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader title={title} subtitle="Detailed analytics for this module" />
      <div className="brutal-card bg-white p-10 text-center">
        <div className="text-xs font-black text-ink/40 uppercase tracking-widest">
          Detailed report for <strong className="text-ink">{title}</strong> is being generated based on latest data.
        </div>
      </div>
    </motion.div>
  );
}

const REPORT_COMPONENTS: Record<string, React.FC> = {
  "daily-sales": ReportDailySales,
  "hourly-analysis": ReportHourlyAnalysis,
  "payment-modes": ReportPaymentModes,
  "stock-movement": ReportStockMovement,
  "rfm-segmentation": ReportRFMSegmentation,
  "tax-summary": ReportTaxSummary,
  "promo-effectiveness": () => <ReportPlaceholder title="Promo Effectiveness" />,
  "low-stock": ReportLowStock,
  "dead-stock": ReportDeadStock,
  "inventory-valuation": ReportInventoryValuation,
  "supplier-performance": () => <ReportPlaceholder title="Supplier Performance" />,
  "pl-statement": ReportPLStatement,
  "cash-flow": () => <ReportPlaceholder title="Cash Flow Statement" />,
  "expense-breakdown": () => <ReportPlaceholder title="Expense Breakdown" />,
  "cogs-analysis": () => <ReportPlaceholder title="COGS Analysis" />,
  "customer-acquisition": () => <ReportPlaceholder title="Acquisition & Retention" />,
  "clv-analysis": () => <ReportPlaceholder title="CLV Analysis" />,
  "staff-sales": ReportStaffSales,
};

function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [salesLogs, setSalesLogs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "", category: "Groceries", stock: 0, minStock: 10, price: 0, margin: 15, description: ""
  });

  useEffect(() => {
    const unsub = getInventorySummary(setItems);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedItem?.id) {
      const unsubLogs = getItemLogs(selectedItem.id, setLogs);
      const unsubSales = getItemSalesLogs(selectedItem.id, setSalesLogs);
      return () => { unsubLogs(); unsubSales(); };
    }
  }, [selectedItem]);

  const handleAddItem = async () => {
    if (newItem.name && newItem.price !== undefined) {
      await addInventoryItem(newItem as Omit<InventoryItem, "id">);
      setShowAddModal(false);
      setNewItem({ name: "", category: "Groceries", stock: 0, minStock: 10, price: 0, margin: 15, description: "" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      await deleteInventoryItem(id);
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  return (
    <div className="mt-16 pt-16 border-t-8 border-ink">
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="text-[10px] font-black text-neon uppercase tracking-[0.3em] mb-2">System.Inventory_Core</div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Master Inventory Control</h2>
          <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mt-1">Manage stock levels, track history, and analyze item performance</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="brutal-btn bg-neon text-ink flex items-center gap-2"
        >
          <Plus size={18} /> ADD_NEW_ITEM
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2">
          {items.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`brutal-card cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-ink text-white translate-x-2' : 'bg-white hover:bg-ink/5'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedItem?.id === item.id ? 'text-neon' : 'text-ink/40'}`}>{item.category}</div>
                  <div className="font-black text-lg tracking-tight">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black">₹{item.price}</div>
                  <div className={`text-[10px] font-bold ${item.stock <= item.minStock ? 'text-red-500' : 'text-green-500'}`}>
                    STOCK: {item.stock}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Item Details & Logs */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="brutal-card bg-white border-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedItem.name}</h3>
                    <p className="text-xs font-bold text-ink/60 mt-1 uppercase tracking-widest">{selectedItem.description || "No description provided."}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(selectedItem.id!)}
                    className="p-2 text-red-500 hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-ink/5 border-2 border-ink">
                    <div className="text-[8px] font-black text-ink/40 uppercase mb-1">Current Stock</div>
                    <div className="text-2xl font-black">{selectedItem.stock}</div>
                  </div>
                  <div className="p-4 bg-ink/5 border-2 border-ink">
                    <div className="text-[8px] font-black text-ink/40 uppercase mb-1">Unit Price</div>
                    <div className="text-2xl font-black">₹{selectedItem.price}</div>
                  </div>
                  <div className="p-4 bg-ink/5 border-2 border-ink">
                    <div className="text-[8px] font-black text-ink/40 uppercase mb-1">Margin</div>
                    <div className="text-2xl font-black">{selectedItem.margin}%</div>
                  </div>
                  <div className="p-4 bg-ink/5 border-2 border-ink">
                    <div className="text-[8px] font-black text-ink/40 uppercase mb-1">Min Stock</div>
                    <div className="text-2xl font-black">{selectedItem.minStock}</div>
                  </div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-neon" />
                    <SectionHeader title="Sales Performance" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Best Selling Day</span>
                      <span className="font-black text-green-900">Monday</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Slowest Day</span>
                      <span className="font-black text-red-900">Sunday</span>
                    </div>
                    <div className="text-[10px] font-bold text-ink/40 uppercase text-center mt-4">
                      Based on last 30 days of transaction logs
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <User size={16} className="text-neon" />
                    <SectionHeader title="Top Customers" />
                  </div>
                  <div className="space-y-2">
                    {salesLogs.slice(0, 3).map((sale, i) => (
                      <div key={i} className="flex justify-between items-center p-2 border-b border-ink/5">
                        <span className="text-xs font-bold">{sale.customerName || "Walk-in Customer"}</span>
                        <span className="text-xs font-black">₹{sale.amount}</span>
                      </div>
                    ))}
                    {salesLogs.length === 0 && <div className="text-xs text-ink/40 italic text-center py-4">No sales recorded yet</div>}
                  </div>
                </Card>
              </div>

              {/* Stock History Logs */}
              <Card>
                <div className="flex items-center gap-2 mb-6">
                  <History size={16} className="text-neon" />
                  <SectionHeader title="Stock Movement History" />
                </div>
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 border-2 border-ink/5 hover:border-ink transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center font-black text-xs border-2 ${log.type === 'in' ? 'bg-green-500 text-white border-green-700' : 'bg-red-500 text-white border-red-700'}`}>
                          {log.type === 'in' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-tight">{log.reason || (log.type === 'in' ? 'Stock In' : 'Stock Out')}</div>
                          <div className="text-[8px] font-bold text-ink/40 uppercase">{log.timestamp?.toDate().toLocaleString() || 'Recent'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black">{log.quantity} Units</div>
                        <div className="text-[8px] font-bold text-ink/40 uppercase">Stock: {log.previousStock} → {log.newStock}</div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <div className="text-xs text-ink/40 italic text-center py-8">No stock logs found</div>}
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-4 border-dashed border-ink/10 rounded-2xl">
              <div className="text-6xl mb-6 grayscale opacity-20">📦</div>
              <h3 className="text-xl font-black text-ink/20 uppercase tracking-widest">Select an item to view detailed intelligence</h3>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-ink w-full max-w-md shadow-[16px_16px_0px_rgba(0,0,0,0.2)]"
            >
              <div className="p-6 border-b-4 border-ink flex justify-between items-center bg-neon/10">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Register New Asset</h3>
                <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Item Name</label>
                  <input 
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                    placeholder="E.G. PREMIUM BASMATI RICE"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Category</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                    >
                      <option>Groceries</option>
                      <option>Household</option>
                      <option>Dairy</option>
                      <option>Bakery</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Price (₹)</label>
                    <input 
                      type="number"
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                      className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Initial Stock</label>
                    <input 
                      type="number"
                      value={newItem.stock}
                      onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})}
                      className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Min Stock Alert</label>
                    <input 
                      type="number"
                      value={newItem.minStock}
                      onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})}
                      className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1 block">Description</label>
                  <textarea 
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 resize-none"
                    rows={3}
                    placeholder="ENTER ITEM SPECIFICATIONS..."
                  />
                </div>
                <button 
                  onClick={handleAddItem}
                  className="brutal-btn w-full !bg-ink !text-white hover:!bg-neon hover:!text-ink transition-all mt-4"
                >
                  CONFIRM_REGISTRATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Reports() {
  const bp = useBreakpoint();
  const [activeKey, setActiveKey] = useState("daily-sales");
  const [openCats, setOpenCats] = useState(["📊 Sales Reports"]);

  const toggleCat = (cat: string) => setOpenCats(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat]);
  const ActiveComp = REPORT_COMPONENTS[activeKey] || ReportDailySales;

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="brutal-card bg-white/50 backdrop-blur-xl">
        <div className="flex flex-wrap gap-4 items-center">
          {["📅 Last 30 Days", "🏪 All Shops", "📦 All Categories", "💳 All Payments"].map(f => (
            <select key={f} defaultValue={f} className="bg-white border-2 border-ink px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors cursor-pointer">
              <option>{f}</option>
            </select>
          ))}
          <button className="brutal-btn !py-2 !px-6 text-xs">APPLY_FILTERS</button>
          <button className="brutal-btn !py-2 !px-6 text-xs !bg-white !text-ink">RESET</button>
        </div>
      </div>

      {bp.isMobile && (
        <details className="group">
          <summary className="brutal-btn w-full flex justify-between items-center list-none cursor-pointer">
            <span className="font-black tracking-widest">SELECT_REPORT_MODULE</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-4 brutal-card bg-white p-4 space-y-4">
            {REPORT_TREE.map(group => (
              <div key={group.cat}>
                <div className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em] mb-2">{group.cat}</div>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <button 
                      key={item.key} 
                      onClick={() => setActiveKey(item.key)} 
                      className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activeKey === item.key ? 'bg-ink text-white translate-x-1' : 'hover:bg-ink/5'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar — hidden on mobile */}
        {!bp.isMobile && (
          <aside className="space-y-4 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="text-[10px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 px-4">Report_Index.v1</div>
            {REPORT_TREE.map(group => (
              <div key={group.cat} className="mb-4">
                <button 
                  onClick={() => toggleCat(group.cat)} 
                  className={`w-full flex justify-between items-center px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-2 ${openCats.includes(group.cat) ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-transparent hover:border-ink/10'}`}
                >
                  <span>{group.cat}</span>
                  <span className={`text-[8px] transition-transform ${openCats.includes(group.cat) ? 'rotate-90' : ''}`}>▶</span>
                </button>
                <AnimatePresence>
                  {openCats.includes(group.cat) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="py-2 pl-4 space-y-1">
                        {group.items.map(item => (
                          <button 
                            key={item.key} 
                            onClick={() => setActiveKey(item.key)} 
                            className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-l-2 ${activeKey === item.key ? 'border-neon text-ink bg-neon/5' : 'border-transparent text-ink/50 hover:text-ink hover:border-ink/20'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </aside>
        )}

        {/* Report Area */}
        <main className="min-w-0">
          <ActiveComp />
        </main>
      </div>

      {/* Inventory Management Section */}
      <InventoryManager />
    </div>
  );
}
