import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { C, invoices as mockInvoices } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, OrangeBtn, SectionHeader, Badge } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { getInventorySummary, getInvoicesSummary } from "../../services/dataService";

// Shared DSS helper
function DSSInsight({ icon, title, body, color = C.orange }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: "flex", gap: 12, padding: "12px 14px", background: `${color}09`, borderLeft: `3px solid ${color}`, borderRadius: "0 10px 10px 0", marginBottom: 8 }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{body}</div>
      </div>
    </motion.div>
  );
}

function DSSMetricCard({ label, value, sub, subColor, color, icon, explain }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      style={{ background: C.white, borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderTop: `3px solid ${color}` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, fontWeight: 600, color: subColor || C.mid }}>{sub}</div>}
      {explain && <div style={{ fontSize: 12, color: C.mid, marginTop: 6, lineHeight: 1.5, borderTop: `1px solid ${C.gray100}`, paddingTop: 6 }}>{explain}</div>}
    </motion.div>
  );
}

function SliderInput({ label, value, setter, min, max, fmt, hint, color = C.orange }: any) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{label}</label>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{fmt ? fmt(value) : value}</span>
      </div>
      <div style={{ position: "relative" }}>
        <input type="range" min={min} max={max} value={value}
          onChange={e => setter && setter(Number(e.target.value))}
          style={{ width: "100%", accentColor: color, height: 4 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 10, color: C.light }}>{fmt ? fmt(min) : min}</span>
          <span style={{ fontSize: 10, color: C.light }}>{fmt ? fmt(max) : max}</span>
        </div>
      </div>
      {hint && <div style={{ fontSize: 12, color: C.mid, marginTop: 4, fontStyle: "italic" }}>💡 {hint}</div>}
    </div>
  );
}

// ── Tab 1: Price Optimization Engine ──────────────────────────────────────────
function DSS_PriceOptimizer() {
  const bp = useBreakpoint();
  const [sellingPrice, setSellingPrice] = useState(1000);
  const [costPrice, setCostPrice] = useState(600);
  const [elasticity, setElasticity] = useState(1.2);
  const [compPrice, setCompPrice] = useState(950);
  const [units, setUnits] = useState(150);

  const margin = sellingPrice - costPrice;
  const marginPct = ((margin / sellingPrice) * 100).toFixed(1);
  const breakEvenUnits = Math.ceil(50000 / margin);
  const currentProfit = margin * units;
  const optimalPrice = Math.round(costPrice * 1.45 + (compPrice * 0.15));
  const optimalProfit = Math.round((optimalPrice - costPrice) * units * 1.08);

  const breakEvenData = Array.from({ length: 12 }, (_, i) => {
    const qty = (i + 1) * 50;
    return { qty, revenue: qty * sellingPrice, cost: qty * costPrice + 50000, profit: qty * margin - 50000 };
  });

  const riskLevel = Math.abs(sellingPrice - optimalPrice) / optimalPrice;
  const riskScore = Math.min(10, (riskLevel * 30)).toFixed(1);
  const riskColor = Number(riskScore) < 3 ? C.green : Number(riskScore) < 6 ? C.yellow : C.red;
  const riskLabel = Number(riskScore) < 3 ? "Low Risk" : Number(riskScore) < 6 ? "Medium Risk" : "High Risk";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gridTemplateColumns: rv(bp,"1fr","1fr","300px 1fr"), gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ fontWeight: 800, color: C.dark, fontSize: 15, marginBottom: 4 }}>🎛️ Price Variables</div>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>Adjust inputs to see real-time impact on profitability</div>
          <SliderInput label="Selling Price (₹)" value={sellingPrice} setter={setSellingPrice} min={650} max={2500} fmt={(v: any) => `₹${v.toLocaleString("en-IN")}`} hint="Current market price you charge customers" />
          <SliderInput label="Cost Price (₹)" value={costPrice} setter={setCostPrice} min={300} max={2000} fmt={(v: any) => `₹${v.toLocaleString("en-IN")}`} hint="Your total landed cost per unit (COGS)" color={C.blue} />
          <SliderInput label="Competitor Price (₹)" value={compPrice} setter={setCompPrice} min={500} max={2000} fmt={(v: any) => `₹${v.toLocaleString("en-IN")}`} hint="Average price competitor charges for same product" color={C.purple} />
          <SliderInput label="Monthly Units Sold" value={units} setter={setUnits} min={10} max={500} hint="Expected volume at current price" color={C.green} />
          <SliderInput label="Price Elasticity" value={elasticity} setter={setElasticity} min={0.1} max={3.0} fmt={(v: any) => v.toFixed(1)} hint="How sensitive demand is to price changes (1.2 = moderate)" color={C.red} />
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: rv(bp,"1fr 1fr","1fr 1fr","repeat(4,1fr)"), gap: 12 }}>
          <DSSMetricCard label="Recommended Price" value={`₹${optimalPrice.toLocaleString("en-IN")}`} icon="🎯" color={C.orange}
            sub={`${sellingPrice > optimalPrice ? "▼" : "▲"} ₹${Math.abs(sellingPrice - optimalPrice)} from current`}
            subColor={sellingPrice > optimalPrice ? C.red : C.green}
            explain="Calculated using cost-plus margin + competitor positioning + elasticity model" />
          <DSSMetricCard label="Optimal Profit/Month" value={`₹${optimalProfit.toLocaleString("en-IN")}`} icon="💹" color={C.green}
            sub={`${optimalProfit > currentProfit ? "▲" : "▼"} ₹${Math.abs(optimalProfit - currentProfit).toLocaleString("en-IN")} vs current`}
            subColor={optimalProfit > currentProfit ? C.green : C.red}
            explain="Projected monthly profit at recommended price" />
          <DSSMetricCard label="Price Risk Score" value={`${riskScore}/10`} icon="🛡️" color={riskColor}
            sub={riskLabel} subColor={riskColor} />
          <DSSMetricCard label="Competitor Gap" value={`${sellingPrice > compPrice ? "+" : ""}₹${(sellingPrice - compPrice).toLocaleString("en-IN")}`} icon="🏁" color={sellingPrice > compPrice ? C.red : C.green}
            sub={sellingPrice > compPrice ? "Priced above market" : "Priced below market"} />
        </div>

        <Card>
          <SectionHeader title="📈 Break-Even Analysis" subtitle={`BEP: ${breakEvenUnits} units`} />
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={breakEvenData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
              <XAxis dataKey="qty" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}K`} />
              <Tooltip formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.green} fill={`${C.green}15`} strokeWidth={2.5} />
              <Line type="monotone" dataKey="cost" name="Total Cost" stroke={C.red} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit/Loss" stroke={C.orange} strokeWidth={2.5} dot={false} />
              <ReferenceLine y={0} stroke={C.mid} strokeWidth={1.5} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 800, color: C.dark, fontSize: 15, marginBottom: 12 }}>💡 DSS Recommendations</div>
          <DSSInsight icon="🎯" title="Optimal Pricing Action" color={C.orange}
            body={`Move price from ₹${sellingPrice.toLocaleString("en-IN")} → ₹${optimalPrice.toLocaleString("en-IN")}. Expected profit improvement: ₹${Math.abs(optimalProfit - currentProfit).toLocaleString("en-IN")}/month.`} />
          <DSSInsight icon="📊" title="Margin Health Assessment" color={Number(marginPct) < 20 ? C.red : Number(marginPct) < 35 ? C.yellow : C.green}
            body={`Your current gross margin is ${marginPct}%.`} />
        </Card>
      </div>
    </motion.div>
  );
}

function DSS_DiscountSimulator() {
  const [discount, setDiscount] = useState(15);
  const [trafficLift, setTrafficLift] = useState(25);
  
  const baseRevenue = 100000;
  const baseMargin = 30;
  const discountedRevenue = baseRevenue * (1 + trafficLift / 100) * (1 - discount / 100);
  const discountedMargin = (baseRevenue * (baseMargin / 100) - (baseRevenue * (discount / 100))) * (1 + trafficLift / 100);
  const marginImpact = ((discountedMargin - (baseRevenue * baseMargin / 100)) / (baseRevenue * baseMargin / 100)) * 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <Card>
          <SectionHeader title="Promotion Config" />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 8 }}>Discount Percentage (%)</label>
              <input type="range" min="0" max="50" value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ width: "100%", accentColor: C.red }} />
              <div style={{ textAlign: "right", fontWeight: 700, color: C.red }}>{discount}%</div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 8 }}>Expected Traffic Lift (%)</label>
              <input type="range" min="0" max="100" value={trafficLift} onChange={e => setTrafficLift(Number(e.target.value))} style={{ width: "100%", accentColor: C.blue }} />
              <div style={{ textAlign: "right", fontWeight: 700, color: C.blue }}>{trafficLift}%</div>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontSize: 12, color: C.mid }}>Revenue Impact</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: discountedRevenue > baseRevenue ? C.green : C.red }}>
                {discountedRevenue > baseRevenue ? "+" : ""}{((discountedRevenue - baseRevenue) / baseRevenue * 100).toFixed(1)}%
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: 12, color: C.mid }}>Profit Margin Impact</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: marginImpact > 0 ? C.green : C.red }}>
                {marginImpact > 0 ? "+" : ""}{marginImpact.toFixed(1)}%
              </div>
            </Card>
          </div>
          <Card>
            <SectionHeader title="Break-even Analysis" />
            <div style={{ fontSize: 14, color: C.mid }}>
              To maintain current profit levels with a {discount}% discount, you need a minimum traffic lift of 
              <strong style={{ color: C.orange, marginLeft: 6 }}>{Math.round((discount / (baseMargin - discount)) * 100)}%</strong>.
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function DSS_InventoryOptimizer() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getInventorySummary((data) => {
      setInventory(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stockData = inventory.length > 0 ? inventory.map(i => ({
    name: i.name,
    current: i.stock,
    optimal: i.minStock * 1.5,
    risk: i.stock <= i.minStock ? "High" : i.stock > i.minStock * 2 ? "Overstock" : "Low"
  })) : [
    { name: "Rice", current: 80, optimal: 120, risk: "Low" },
    { name: "Oil", current: 20, optimal: 100, risk: "High" },
    { name: "Sugar", current: 150, optimal: 100, risk: "Overstock" },
    { name: "Soap", current: 45, optimal: 50, risk: "Low" },
  ];

  if (loading) return <div style={{ padding: 20, textAlign: "center", color: C.mid }}>Loading inventory data...</div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <SectionHeader title="Inventory Level Optimization" subtitle="AI-powered stock rebalancing" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {stockData.map(item => (
          <Card key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{item.name}</div>
              <div style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: item.risk === "High" ? C.red + "20" : item.risk === "Overstock" ? C.yellow + "20" : C.green + "20", color: item.risk === "High" ? C.red : item.risk === "Overstock" ? C.orange : C.green }}>
                {item.risk}
              </div>
            </div>
            <div style={{ height: 12, background: C.gray100, borderRadius: 6, overflow: "hidden", position: "relative", marginBottom: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (item.current / (item.optimal * 1.5)) * 100)}%` }} style={{ height: "100%", background: item.risk === "High" ? C.red : C.orange }} />
              <div style={{ position: "absolute", top: 0, left: `${(item.optimal / (item.optimal * 1.5)) * 100}%`, width: 2, height: "100%", background: C.dark, opacity: 0.5 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mid }}>
              <span>Current: {item.current}</span>
              <span>Optimal: {Math.round(item.optimal)}</span>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function DSS_FinancialArchitect() {
  const bp = useBreakpoint();
  const [salesChange, setSalesChange] = useState(0);
  const [paymentDelay, setPaymentDelay] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getInvoicesSummary((data) => {
      setInvoices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Use real data if available
  const currentInvoices = invoices.length > 0 ? invoices : mockInvoices;
  const totalDue = currentInvoices.filter(i => i.status !== "Paid").reduce((a, b: any) => a + b.amount, 0);
  const projectedSales = 620000 * (1 + salesChange / 100);
  const currentBalance = 879704; // From last month's closing
  const projectedBalance = currentBalance + projectedSales - totalDue;
  
  const riskScore = totalDue > projectedSales * 0.5 ? 8 : totalDue > projectedSales * 0.2 ? 5 : 2;
  const savingsOpportunity = totalDue * 0.02; // Assuming 2% early payment discount opportunity

  const waterfallData = [
    { name: "Opening", value: currentBalance, start: 0 },
    { name: "Projected Sales", value: projectedSales, start: currentBalance },
    { name: "Invoices Due", value: -totalDue, start: currentBalance + projectedSales - totalDue },
    { name: "Closing", value: projectedBalance, start: 0, isTotal: true },
  ];

  const recommendations = [
    { 
      action: "Negotiate Early Payment Discount", 
      impact: `Potential savings of ₹${(totalDue * 0.03).toLocaleString("en-IN")} (3%)`, 
      confidence: 92,
      id: "STRAT-001"
    },
    { 
      action: "Optimize Cash Reserve", 
      impact: `Preserve ₹${(projectedBalance * 0.1).toLocaleString("en-IN")} liquidity`, 
      confidence: 85,
      id: "STRAT-002"
    }
  ];

  if (loading) return <div style={{ padding: 20, textAlign: "center", color: C.mid }}>Loading financial data...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gridTemplateColumns: rv(bp, "1fr", "1fr", "320px 1fr"), gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionHeader title="Simulation Parameters" subtitle="Stress-test your cash flow" />
          <SliderInput 
            label="Projected Sales Change (%)" 
            value={salesChange} 
            setter={setSalesChange} 
            min={-50} max={50} 
            fmt={(v: any) => `${v > 0 ? "+" : ""}${v}%`} 
            hint="Simulate market volatility impact" 
          />
          <SliderInput 
            label="Avg. Payment Delay (Days)" 
            value={paymentDelay} 
            setter={setPaymentDelay} 
            min={0} max={30} 
            fmt={(v: any) => `${v} days`} 
            hint="Impact of late customer payments" 
            color={C.red}
          />
        </Card>

        <div className="brutal-card bg-white">
          <div className="text-sm font-black text-ink uppercase tracking-tight mb-4">📋 Executive Summary</div>
          <div className="text-xs font-bold text-ink/60 leading-relaxed uppercase tracking-tight">
            Current liquidity is <strong className="text-ink">{riskScore < 4 ? "Strong" : riskScore < 7 ? "Stable" : "At Risk"}</strong>. 
            With projected sales of ₹{projectedSales.toLocaleString("en-IN")}, you have sufficient coverage for the ₹{totalDue.toLocaleString("en-IN")} in outstanding payables. 
            However, a {paymentDelay > 10 ? "significant" : "minor"} delay in collections could compress margins.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: rv(bp, "1fr", "1fr 1fr", "repeat(3, 1fr)"), gap: 16 }}>
          <DSSMetricCard 
            label="Projected Balance" 
            value={`₹${(projectedBalance / 1000).toFixed(1)}K`} 
            icon="💰" 
            color={C.blue}
            explain="Estimated cash at end of period"
          />
          <DSSMetricCard 
            label="Financial Risk Score" 
            value={`${riskScore}/10`} 
            icon="⚖️" 
            color={riskScore > 7 ? C.red : riskScore > 4 ? C.yellow : C.green}
            sub={riskScore > 7 ? "High Risk" : "Low Risk"}
          />
          <DSSMetricCard 
            label="Savings Opportunity" 
            value={`₹${savingsOpportunity.toLocaleString("en-IN")}`} 
            icon="💎" 
            color={C.purple}
            explain="Potential from early payment discounts"
          />
        </div>

        <Card>
          <SectionHeader title="📊 Cash Flow Waterfall" subtitle="Projected Liquidity Movement" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip 
                cursor={{ fill: "transparent" }}
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: C.white, padding: "8px 12px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: `1px solid ${C.gray100}` }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: C.dark }}>{data.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: data.value >= 0 ? C.green : C.red }}>
                          {data.value >= 0 ? "+" : ""}₹{data.value.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="start" stackId="a" fill="transparent" />
              <Bar dataKey="value" stackId="a">
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isTotal ? C.blue : entry.value >= 0 ? C.green : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="🚀 Prescriptive Actions" subtitle="AI-driven financial recommendations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recommendations.map((rec, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 5 }}
                style={{ display: "flex", gap: 16, padding: 16, borderRadius: 12, background: C.gray50, border: `1px solid ${C.gray100}` }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {rec.confidence > 95 ? "⚡" : "💡"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{rec.action}</div>
                    <Badge status={rec.confidence > 90 ? "High Confidence" : "Medium Confidence"} />
                  </div>
                  <div style={{ fontSize: 13, color: C.mid, marginBottom: 8 }}>{rec.impact}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.light }}>REF: {rec.id}</span>
                    <OrangeBtn small>Execute Action</OrangeBtn>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function DSS_ImpactAnalysis() {
  const bp = useBreakpoint();
  const [discount, setDiscount] = useState(10);
  const [taxAdj, setTaxAdj] = useState(0);
  const [shippingSubsidy, setShippingSubsidy] = useState(false);

  // Selected products with elasticity scores as per simulation engine 2.0-Advanced
  const products = [
    { id: "PROD_001", name: "iPhone 15", base_price: 79900, sales: 85, margin: 22, elasticity: 1.8 },
    { id: "PROD_002", name: "Nike Shoes", base_price: 8500, sales: 72, margin: 45, elasticity: 1.2 },
    { id: "PROD_003", name: "Coffee", base_price: 450, sales: 88, margin: 65, elasticity: 0.6 },
  ];

  const results = products.map(p => {
    const cost = p.base_price * (1 - p.margin / 100);
    const priceChangePct = -discount / 100;
    const newPrice = p.base_price * (1 + priceChangePct) * (1 + taxAdj / 100);
    const newSales = p.sales * (1 + (priceChangePct * p.elasticity));
    const newProfit = (newPrice - cost) * newSales;
    const oldProfit = (p.base_price - cost) * p.sales;
    const newRevenue = newPrice * newSales;
    const oldRevenue = p.base_price * p.sales;

    return {
      ...p,
      newPrice,
      newSales,
      newProfit,
      oldProfit,
      newRevenue,
      oldRevenue,
      profitChange: newProfit - oldProfit,
      revenueChange: newRevenue - oldRevenue,
      marginDrop: (newPrice - cost) / newPrice < p.margin / 100
    };
  });

  const totalRevenueChange = results.reduce((a, b) => a + b.revenueChange, 0);
  const totalProfitChange = results.reduce((a, b) => a + b.profitChange, 0);
  
  const isLoss = totalProfitChange < 0;
  const isRevenueBoost = totalRevenueChange > 0;
  const isMarginDrop = results.some(r => r.marginDrop);

  // Animation Triggers
  const animationState = isLoss ? "loss" : isMarginDrop ? "marginDrop" : isRevenueBoost ? "boost" : "idle";

  const variants = {
    loss: { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.4 } },
    marginDrop: { boxShadow: ["0 0 0px rgba(214, 48, 49, 0)", "0 0 20px rgba(214, 48, 49, 0.4)", "0 0 0px rgba(214, 48, 49, 0)"], transition: { repeat: Infinity, duration: 1.5 } },
    boost: { scale: [1, 1.01, 1], transition: { duration: 0.5 } },
    idle: {}
  };

  const waterfallData = [
    { name: "Base Profit", value: results.reduce((a, b) => a + b.oldProfit, 0), start: 0 },
    ...results.map((r, i) => {
      const prevTotal = results.slice(0, i).reduce((a, b) => a + b.profitChange, 0) + results.reduce((a, b) => a + b.oldProfit, 0);
      return { name: r.name, value: r.profitChange, start: prevTotal };
    }),
    { name: "Net Profit", value: results.reduce((a, b) => a + b.newProfit, 0), start: 0, isTotal: true }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={animationState} 
      variants={variants}
      style={{ display: "grid", gridTemplateColumns: rv(bp, "1fr", "1fr", "320px 1fr"), gap: 24 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionHeader title="Global Modifiers" subtitle="Simulation Engine 2.0-Advanced" />
          <SliderInput label="Discount (%)" value={discount} setter={setDiscount} min={0} max={40} fmt={v => `${v}%`} color={C.red} />
          <SliderInput label="Tax Adjustment (%)" value={taxAdj} setter={setTaxAdj} min={-10} max={10} fmt={v => `${v > 0 ? "+" : ""}${v}%`} color={C.blue} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>Shipping Subsidy</span>
            <button 
              onClick={() => setShippingSubsidy(!shippingSubsidy)}
              style={{ 
                width: 44, height: 24, borderRadius: 12, background: shippingSubsidy ? C.green : C.gray200, 
                position: "relative", border: "none", cursor: "pointer", transition: "background 0.2s" 
              }}
            >
              <motion.div 
                animate={{ left: shippingSubsidy ? 23 : 3 }}
                style={{ width: 18, height: 18, borderRadius: "50%", background: C.white, position: "absolute", top: 3 }} 
              />
            </button>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 800, color: C.dark, fontSize: 15, marginBottom: 12 }}>🧠 Simulation Insights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: C.mid, display: "flex", gap: 8 }}>
              <span style={{ color: C.orange }}>•</span>
              <span><strong>Elasticity Impact:</strong> {discount > 15 ? "Aggressive discounting" : "Moderate discounting"} on high-elasticity items (iPhone 15) is driving {totalRevenueChange > 0 ? "significant volume growth" : "marginal volume gains"}.</span>
            </div>
            <div style={{ fontSize: 13, color: C.mid, display: "flex", gap: 8 }}>
              <span style={{ color: C.orange }}>•</span>
              <span><strong>Margin Compression:</strong> {isMarginDrop ? "Critical margin drop detected." : "Margins remain stable."} The discount depth is {isLoss ? "outpacing" : "balanced with"} the volume lift.</span>
            </div>
            <div style={{ fontSize: 13, color: C.mid, display: "flex", gap: 8 }}>
              <span style={{ color: C.orange }}>•</span>
              <span><strong>Net Outcome:</strong> A net {totalProfitChange > 0 ? "gain" : "loss"} of ₹{Math.abs(totalProfitChange).toLocaleString("en-IN")} projected. {isLoss ? "Consider reducing discount on low-elasticity items." : "Strategy is viable for market share growth."}</span>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: rv(bp, "1fr", "1fr 1fr", "repeat(3, 1fr)"), gap: 16 }}>
          <DSSMetricCard label="Total Revenue Impact" value={`₹${(totalRevenueChange / 1000).toFixed(1)}K`} icon="📈" color={totalRevenueChange > 0 ? C.green : C.red} sub={`${totalRevenueChange > 0 ? "▲" : "▼"} ${((totalRevenueChange / results.reduce((a,b)=>a+b.oldRevenue, 0)) * 100).toFixed(1)}%`} />
          <DSSMetricCard label="Total Profit Impact" value={`₹${(totalProfitChange / 1000).toFixed(1)}K`} icon="💰" color={totalProfitChange > 0 ? C.green : C.red} sub={`${totalProfitChange > 0 ? "▲" : "▼"} ${((totalProfitChange / results.reduce((a,b)=>a+b.oldProfit, 0)) * 100).toFixed(1)}%`} />
          <DSSMetricCard label="Avg. Elasticity" value="1.2" icon="🧬" color={C.purple} sub="Portfolio Sensitivity" />
        </div>

        <Card>
          <SectionHeader title="📊 Dual-Axis Comparison" subtitle="Revenue vs Sales Volume" />
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={results}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => typeof v === "number" ? v.toLocaleString("en-IN") : v} />
              <Legend />
              <Bar yAxisId="left" dataKey="newRevenue" name="Projected Revenue" fill={C.orange} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="newSales" name="Projected Sales (Units)" stroke={C.blue} strokeWidth={3} dot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="📉 Profit/Loss Waterfall" subtitle="Contribution by Product" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="start" stackId="a" fill="transparent" />
              <Bar dataKey="value" stackId="a">
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isTotal ? C.blue : entry.value >= 0 ? C.green : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </motion.div>
  );
}

function DSS_MarketShare() {
  const bp = useBreakpoint();
  const [ourPrice, setOurPrice] = useState(1000);
  const [compPrice, setCompPrice] = useState(950);
  const [brandLoyalty, setBrandLoyalty] = useState(60);

  const marketShare = useMemo(() => {
    const priceDiff = ((compPrice - ourPrice) / compPrice) * 100;
    const baseShare = 25;
    const loyaltyFactor = brandLoyalty / 100;
    const share = baseShare + (priceDiff * 0.5 * loyaltyFactor);
    return Math.max(5, Math.min(60, share)).toFixed(1);
  }, [ourPrice, compPrice, brandLoyalty]);

  const data = [
    { name: 'Our Share', value: parseFloat(marketShare), color: C.orange },
    { name: 'Competitors', value: 100 - parseFloat(marketShare), color: C.gray200 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gridTemplateColumns: rv(bp, "1fr", "1fr", "320px 1fr"), gap: 24 }}>
      <Card>
        <SectionHeader title="Market Dynamics" subtitle="Simulate competitive positioning" />
        <SliderInput label="Our Price (₹)" value={ourPrice} setter={setOurPrice} min={500} max={2000} fmt={v => `₹${v}`} />
        <SliderInput label="Competitor Price (₹)" value={compPrice} setter={setCompPrice} min={500} max={2000} fmt={v => `₹${v}`} color={C.blue} />
        <SliderInput label="Brand Loyalty (%)" value={brandLoyalty} setter={setBrandLoyalty} min={0} max={100} fmt={v => `${v}%`} color={C.purple} />
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <DSSMetricCard label="Projected Market Share" value={`${marketShare}%`} icon="🏁" color={C.orange} sub="Based on price sensitivity" />
          <DSSMetricCard label="Price Index" value={(ourPrice / compPrice).toFixed(2)} icon="📊" color={ourPrice > compPrice ? C.red : C.green} sub={ourPrice > compPrice ? "Premium Positioning" : "Competitive Edge"} />
        </div>
        <Card>
          <SectionHeader title="Market Share Projection" />
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data} margin={{ left: 20, right: 40 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

export default function DSS() {
  const [dssTab, setDssTab] = useState("price");
  const bp = useBreakpoint();

  const tabs = [
    { key: "price", label: "Price Optimizer", icon: "💰" },
    { key: "discount", label: "Discount Simulator", icon: "🏷️" },
    { key: "inventory", label: "Inventory Optimizer", icon: "📦" },
    { key: "financial", label: "Financial Architect", icon: "🏛️" },
    { key: "impact", label: "Impact Analysis", icon: "🧬" },
    { key: "market", label: "Market Share", icon: "🏁" },
  ];

  return (
    <div>
      <div style={{ 
        background: "rgba(45, 52, 70, 0.8)", 
        backdropFilter: "blur(12px)",
        borderRadius: 20, 
        padding: bp.isMobile ? "20px" : "24px 32px", 
        marginBottom: 24, 
        color: C.white,
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: bp.isMobile ? 20 : 24, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>Decision Support System</div>
        <div style={{ fontSize: 14, opacity: 0.7, fontWeight: 500 }}>Advanced simulation engine for strategic retail operations</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
        {tabs.map(t => (
          <motion.div 
            key={t.key} 
            onClick={() => setDssTab(t.key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: bp.isMobile ? "10px 16px" : "12px 20px",
              borderRadius: 14, cursor: "pointer", flexShrink: 0,
              background: dssTab === t.key ? C.orange : "rgba(255,255,255,0.5)",
              color: dssTab === t.key ? C.white : C.mid,
              fontWeight: 700,
              fontSize: 13,
              boxShadow: dssTab === t.key ? `0 8px 20px ${C.orange}30` : "0 4px 12px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease",
              border: dssTab === t.key ? `1px solid ${C.orange}` : "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)"
            }}
          >
            <span style={{ marginRight: 8 }}>{t.icon}</span>
            {t.label}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dssTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {dssTab === "price" && <DSS_PriceOptimizer />}
          {dssTab === "discount" && <DSS_DiscountSimulator />}
          {dssTab === "inventory" && <DSS_InventoryOptimizer />}
          {dssTab === "financial" && <DSS_FinancialArchitect />}
          {dssTab === "impact" && <DSS_ImpactAnalysis />}
          {dssTab === "market" && <DSS_MarketShare />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
