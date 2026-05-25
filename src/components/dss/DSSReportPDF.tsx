import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Image, Font, PDFDownloadLink, 
  Canvas, Svg, Path, G, Rect, Circle 
} from '@react-pdf/renderer';

// Register fonts if needed
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#020617',
    color: '#ffffff',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderBottom: '1 solid #e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'black',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  healthScore: {
    fontSize: 48,
    fontWeight: 'black',
    color: '#6366f1',
    marginVertical: 20,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2 solid #6366f1',
    paddingBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  metricCard: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  impactText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  urgencyBadge: {
    padding: 2,
    fontSize: 8,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    textTransform: 'uppercase',
  }
});

interface DSSReportProps {
  business: any;
  aiResult: any;
  scope?: 'full' | 'summary' | 'banker' | 'engine';
  engineId?: string;
}

export const DSSReportPDF = ({ business, aiResult, scope = 'full', engineId }: DSSReportProps) => {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const isPageIncluded = (pageName: string) => {
    if (scope === 'full') return true;
    if (scope === 'summary') return ['cover', 'summary', 'health', 'action_plan'].includes(pageName);
    if (scope === 'banker') return ['cover', 'summary', 'cashflow', 'action_plan'].includes(pageName);
    if (scope === 'engine') return ['cover', engineId || ''].includes(pageName);
    return false;
  };

  return (
    <Document title={`Vyapari DSS Report - ${business.name}`}>
      {/* PAGE 1: COVER */}
      {isPageIncluded('cover') && (
        <Page size="A4" style={styles.coverPage}>
          <Text style={{ fontSize: 12, marginBottom: 40 }}>VYAPARI INTELLIGENCE SYSTEMS</Text>
          <Text style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 10 }}>DECISION SUPPORT REPORT</Text>
          <Text style={{ fontSize: 20, marginBottom: 30 }}>{business.name}</Text>
          <View style={{ width: 150, height: 150, borderRadius: 75, border: '5 solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold' }}>{aiResult?.business_health_score || 0}</Text>
            <Text style={{ fontSize: 10 }}>HEALTH SCORE</Text>
          </View>
          <Text style={{ marginTop: 40, fontSize: 12 }}>{date}</Text>
          <Text style={{ position: 'absolute', bottom: 40, fontSize: 8 }}>CONFIDENTIAL STRATEGIC ANALYSIS</Text>
        </Page>
      )}

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      {isPageIncluded('summary') && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text>EXECUTIVE SUMMARY</Text>
            <Text style={{ fontSize: 10 }}>{business.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subtitle}>VANI Smart Intelligence Briefing</Text>
            <Text style={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{aiResult?.vani_narrative || 'Initializing intelligence briefing...'}"
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Top 3 Urgent Strategic Actions</Text>
            {aiResult?.top_3_urgent_actions?.map((action: any, i: number) => (
              <View key={i} style={{ marginBottom: 15, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>RANK #{action.rank} - {action.engine.toUpperCase()}</Text>
                  <Text style={styles.urgencyBadge}>{action.urgency}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>{action.title}</Text>
                <Text style={{ fontSize: 10, color: '#475569' }}>{action.action}</Text>
                <Text style={{ fontSize: 10, color: '#059669', marginTop: 5, fontWeight: 'bold' }}>EST. IMPACT: Rs.{action.rupee_impact.toLocaleString()}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>Vyapari DSS - Confidential - Page 2</Text>
        </Page>
      )}

      {/* PAGE 3: HEALTH SCORE BREAKDOWN */}
      {isPageIncluded('health') && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text>BUSINESS HEALTH AUDIT</Text>
            <Text style={{ fontSize: 10 }}>Global Intelligence Matrix</Text>
          </View>

          <View style={styles.section}>
             <Text style={styles.subtitle}>Global Performance Gauge</Text>
             <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={styles.healthScore}>{aiResult?.business_health_score}/100</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6366f1' }}>{aiResult?.business_health_label}</Text>
             </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(aiResult?.health_score_breakdown || {}).map(([key, val]: any) => (
              <View key={key} style={styles.metricCard}>
                <Text style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 5 }}>{val}/20</Text>
                <View style={{ width: '100%', height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 }}>
                  <View style={{ width: `${(val/20)*100}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: 2 }} />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>Vyapari DSS - Confidential - Page 3</Text>
        </Page>
      )}

      {/* PRICING ENGINE (Example of an Engine Page) */}
      {isPageIncluded('pricing') && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text>PRICING INTELLIGENCE REPORT</Text>
            <Text style={{ fontSize: 10 }}>Margin & Elasticity Optimization</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Top Pricing Recommendations</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Product</Text>
                <Text style={styles.tableCell}>Current Price</Text>
                <Text style={styles.tableCell}>Target Price</Text>
                <Text style={styles.tableCell}>Profit Lift</Text>
                <Text style={styles.tableCell}>Action</Text>
              </View>
              {(aiResult?.engines?.pricing?.recommendations || []).slice(0, 10).map((r: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{r.product_name}</Text>
                  <Text style={styles.tableCell}>Rs.{r.current_price}</Text>
                  <Text style={styles.tableCell}>Rs.{r.recommended_price}</Text>
                  <Text style={[styles.tableCell, { color: '#059669' }]}>+Rs.{r.expected_monthly_profit_change}</Text>
                  <Text style={styles.tableCell}>{r.verdict}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>Vyapari DSS - Confidential - Page 4</Text>
        </Page>
      )}

      {/* CASH FLOW (Critical for Banker's View) */}
      {isPageIncluded('cashflow') && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text>CASH FLOW & LIQUIDITY ANALYSIS</Text>
            <Text style={{ fontSize: 10 }}>90-Day Financial Forecast</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Current Liquidity Ratios</Text>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={styles.metricCard}>
                <Text style={{ fontSize: 8 }}>CASH RUNWAY</Text>
                <Text style={{ fontSize: 14 }}>{aiResult?.engines?.cashflow?.summary?.cash_runway_months} Months</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={{ fontSize: 8 }}>CURRENT RATIO</Text>
                <Text style={{ fontSize: 14 }}>{aiResult?.engines?.cashflow?.summary?.current_ratio}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={{ fontSize: 8 }}>OVERDUE AR</Text>
                <Text style={{ fontSize: 14, color: '#e11d48' }}>Rs.{aiResult?.engines?.cashflow?.summary?.ar_overdue_total.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
             <Text style={styles.subtitle}>90-Day Waterfall Projection</Text>
             <View style={styles.table}>
               <View style={[styles.tableRow, styles.tableHeader]}>
                 <Text style={styles.tableCell}>Month</Text>
                 <Text style={styles.tableCell}>Collections</Text>
                 <Text style={styles.tableCell}>Expenses</Text>
                 <Text style={styles.tableCell}>Net Position</Text>
               </View>
               {(aiResult?.engines?.cashflow?.waterfall_forecast || []).map((f: any, i: number) => (
                 <View key={i} style={styles.tableRow}>
                   <Text style={styles.tableCell}>{f.month}</Text>
                   <Text style={styles.tableCell}>+Rs.{f.expected_collections.toLocaleString()}</Text>
                   <Text style={styles.tableCell}>-Rs.{f.estimated_fixed_costs.toLocaleString()}</Text>
                   <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Rs.{f.projected_closing_cash.toLocaleString()}</Text>
                 </View>
               ))}
             </View>
          </View>

          <Text style={styles.footer}>Vyapari DSS - Confidential</Text>
        </Page>
      )}

      {/* FINAL PAGE: CONSOLIDATED ACTION PLAN */}
      {isPageIncluded('action_plan') && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text>CONSOLIDATED STRATEGIC ACTION PLAN</Text>
            <Text style={{ fontSize: 10 }}>Priority Execution Matrix</Text>
          </View>

          <View style={styles.section}>
            <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>The following actions are ranked by Impact vs. Effort. Execution on these today will yield the highest Rupee return.</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>Prio</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>Strategic Initiative</Text>
                <Text style={styles.tableCell}>Engine</Text>
                <Text style={styles.tableCell}>Rs. Impact</Text>
              </View>
              {(aiResult?.consolidated_recommendations || []).map((rec: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.5 }]}>{i+1}</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    <Text style={{ fontWeight: 'bold' }}>{rec.title}</Text>
                    {"\n"}{rec.action}
                  </Text>
                  <Text style={styles.tableCell}>{rec.engine}</Text>
                  <Text style={[styles.tableCell, { color: '#059669', fontWeight: 'bold' }]}>Rs.{rec.rupee_impact.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 50, padding: 20, backgroundColor: '#020617', borderRadius: 12, color: '#fff' }}>
             <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Methodology & Disclosure</Text>
             <Text style={{ fontSize: 8, opacity: 0.7, lineHeight: 1.4 }}>
               This report is generated by the Vyapari Intelligence Engine using Gemini 2.5 Flash. Calculations are based on your uploaded invoice, product, and financial telemetry. Market benchmarks are derived from Indian SME retail data 2025. This is a decision support tool; final business execution rests with the owner.
             </Text>
          </View>

          <Text style={styles.footer}>- 2026 Vyapari - All Rights Reserved</Text>
        </Page>
      )}
    </Document>
  );
};
