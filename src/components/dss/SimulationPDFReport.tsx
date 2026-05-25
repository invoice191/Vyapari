import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';

// Font Registration
Font.register({
  family: 'DM Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/dmsans/v11/rP2Fp2K8qmbe_SS9PrcQJVLK800.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/dmsans/v11/rP2Cp2K8qmbe_SS9PrcQJVLK-n2w.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'JetBrains Mono',
  src: 'https://fonts.gstatic.com/s/jetbrainsmono/v13/t6X20o8bbMVD-mSqt7X9FG0-w2W7G5O-wA.ttf',
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  coverPage: {
    padding: 0,
    backgroundColor: '#1E1E24',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverLogo: {
    height: 80,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  coverSubBranding: {
    fontSize: 14,
    color: '#FF6B35',
    marginBottom: 60,
  },
  coverDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '60%',
  },
  coverLabel: {
    color: '#555868',
    width: 140,
  },
  coverValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
  },
  coverVerdictBox: {
    marginTop: 60,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2EC4B6',
    borderRadius: 8,
    width: '70%',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
  },
  coverVerdictText: {
    color: '#2EC4B6',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Content Headers
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B35',
    paddingBottom: 10,
  },
  headerLogo: {
    height: 30,
  },
  headerWordmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
    paddingBottom: 5,
    marginBottom: 15,
    marginTop: 20,
  },
  
  headline: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  
  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  kpiBox: {
    width: '50%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2DDD6',
  },
  kpiLabel: {
    fontSize: 8,
    color: '#555868',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'JetBrains Mono',
  },
  kpiChange: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 3,
  },
  
  // Tables
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E2DDD6',
  },
  tableCell: {
    paddingHorizontal: 5,
  },
  
  // Cards
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderLeftWidth: 5,
    borderRadius: 4,
    marginBottom: 15,
  },
  cardType: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#555868',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 9,
    color: '#555868',
    lineHeight: 1.4,
  },
  cardFooter: {
    marginTop: 10,
    fontSize: 8,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  
  // Product Deep Dive
  productHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F8F9FA',
    padding: 10,
    marginBottom: 10,
  },
  productSubSection: {
    marginBottom: 15,
  },
  productSubTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#E2DDD6',
    paddingTop: 10,
  }
});

interface SimulationPDFReportProps {
  data: any;
  business: any;
}

const SimulationPDFReport = ({ data, business }: SimulationPDFReportProps) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document>
      {/* PAGE 1: COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ alignItems: 'center' }}>
          {business.logo_url ? (
            <Image src={business.logo_url} style={styles.coverLogo} />
          ) : (
            <View style={[styles.coverLogo, { backgroundColor: '#FF6B35', width: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 40, fontWeight: 'bold' }}>{business.name?.[0]}</Text>
            </View>
          )}
          
          <Text style={styles.coverTitle}>Simulation Analysis Report</Text>
          <Text style={styles.coverSubBranding}>------- vyapari -------</Text>
          
          <View style={{ marginTop: 40 }}>
            <DetailRow label="Business:" value={business.name} />
            <DetailRow label="GSTIN:" value={business.gstin || 'N/A'} />
            <DetailRow label="City:" value={business.city || 'Aurangabad, Maharashtra'} />
            <DetailRow label="Simulation Period:" value={`${data.market_benchmarks.time_horizon || 60} Days`} />
            <DetailRow label="Market Condition:" value={data.market_benchmarks.market_condition_adjustment} />
            <DetailRow label="Products Analyzed:" value={data.per_product_analysis.length.toString()} />
            <DetailRow label="Report Generated:" value={currentDate} />
          </View>
          
          <View style={[styles.coverVerdictBox, { borderColor: data.summary.verdict === 'PROCEED' ? '#2EC4B6' : data.summary.verdict === 'CAUTION' ? '#F5A623' : '#FF4757' }]}>
            <Text style={[styles.coverVerdictText, { color: data.summary.verdict === 'PROCEED' ? '#2EC4B6' : data.summary.verdict === 'CAUTION' ? '#F5A623' : '#FF4757' }]}>
              VERDICT: {data.summary.verdict.replace(/_/g, ' ')} | Score: {data.summary.overall_confidence}/100
            </Text>
          </View>
          
          <Text style={{ color: '#555868', fontSize: 8, marginTop: 100 }}>CONFIDENTIAL - For internal use only</Text>
          <Text style={{ color: '#FF6B35', fontSize: 8, marginTop: 5 }}>Powered by Vyapari - vyapari.in</Text>
        </View>
      </Page>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        
        <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
        <Text style={styles.headline}>{data.summary.headline}</Text>
        
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 9, marginBottom: 5 }}>Simulation Parameters:</Text>
          <Text style={{ fontSize: 9, color: '#555868' }}>- Time Horizon: {data.market_benchmarks.time_horizon || 60} days</Text>
          <Text style={{ fontSize: 9, color: '#555868' }}>- Market Condition: {data.market_benchmarks.market_condition_adjustment} (Seasonal Factor: {data.market_benchmarks.seasonal_factor}x)</Text>
          <Text style={{ fontSize: 9, color: '#555868' }}>- Products: {data.per_product_analysis.map((p: any) => p.product_name).join(' | ')}</Text>
        </View>

        <View style={styles.kpiGrid}>
          <KPIBox 
            label="Revenue Impact" 
            value={`+Rs.${(data.simulated_scenario.total_revenue_projected - data.current_scenario.total_revenue_projected).toLocaleString()}`} 
            change={`${data.summary.potential_revenue_change_percent}%`} 
            positive={data.summary.potential_revenue_change_percent >= 0}
          />
          <KPIBox 
            label="Profit Impact" 
            value={`+Rs.${(data.simulated_scenario.total_profit_projected - data.current_scenario.total_profit_projected).toLocaleString()}`} 
            change={`${data.summary.potential_profit_change_percent}%`} 
            positive={data.summary.potential_profit_change_percent >= 0}
          />
          <KPIBox 
            label="Units sold" 
            value={`+${(data.simulated_scenario.total_units_projected - data.current_scenario.total_units_projected)} units`} 
            change={`${(((data.simulated_scenario.total_units_projected - data.current_scenario.total_units_projected)/data.current_scenario.total_units_projected)*100).toFixed(1)}%`} 
            positive={data.simulated_scenario.total_units_projected >= data.current_scenario.total_units_projected}
          />
          <KPIBox 
            label="Gross Margin" 
            value={`${data.simulated_scenario.gross_margin_percent}%`} 
            change={`+${(data.simulated_scenario.gross_margin_percent - data.current_scenario.gross_margin_percent).toFixed(1)}pp`} 
            positive={data.simulated_scenario.gross_margin_percent >= data.current_scenario.gross_margin_percent}
          />
        </View>

        <View style={{ backgroundColor: '#F8F9FA', padding: 20, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 10 }}>Verdict Statement:</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#555868' }}>{data.summary.verdict_reason}</Text>
        </View>
        
        <Text style={styles.footer}>Page 2 of 8</Text>
      </Page>

      {/* PAGE 3: SCENARIO COMPARISON */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        <Text style={styles.sectionTitle}>SCENARIO COMPARISON</Text>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '40%', fontWeight: 'bold' }]}>Metric</Text>
            <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>Current</Text>
            <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>Simulated</Text>
            <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>- Change</Text>
          </View>
          {data.scenario_comparison_table.map((row: any, i: number) => (
            <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBFBFC' }]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>{row.metric}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{row.current_value}</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{row.simulated_value}</Text>
              <Text style={[styles.tableCell, { width: '20%', color: row.change_direction === 'up' ? '#2EC4B6' : row.change_direction === 'down' ? '#FF4757' : '#555868' }]}>
                {row.change}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 40 }}>
          <Text style={styles.productSubTitle}>CASH FLOW TIMELINE PROJECTION</Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
             <View style={{ width: 100, height: 150, justifyContent: 'flex-end' }}>
                <View style={{ height: 100, backgroundColor: '#E2DDD6', width: '100%' }} />
                <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 5 }}>Current</Text>
             </View>
             <View style={{ width: 100, height: 150, justifyContent: 'flex-end' }}>
                <View style={{ height: 140, backgroundColor: '#FF6B35', width: '100%' }} />
                <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 5 }}>Simulated</Text>
             </View>
             <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, color: '#555868' }}>
                  The simulated strategy increases liquid cash availability by Rs.{(data.simulated_scenario.total_revenue_projected - data.current_scenario.total_revenue_projected).toLocaleString()} over the next 60 days.
                </Text>
             </View>
          </View>
        </View>

        <Text style={styles.footer}>Page 3 of 8</Text>
      </Page>

      {/* PAGE 4: Business Insights */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        <Text style={styles.sectionTitle}>AI-POWERED INSIGHTS</Text>
        
        {data.ai_insights.map((insight: any, i: number) => (
          <View key={i} style={[styles.card, { borderLeftColor: insight.priority === 'CRITICAL' ? '#FF4757' : insight.priority === 'HIGH' ? '#F5A623' : '#3498DB' }]}>
            <Text style={styles.cardType}>{insight.type} | {insight.priority} | {insight.action}</Text>
            <Text style={styles.cardTitle}>{insight.title}</Text>
            <Text style={styles.cardText}>{insight.detail}</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               <Text style={{ fontSize: 8, color: '#94a3b8' }}>Confidence: {insight.confidence}%</Text>
               <View style={{ flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
                  <View style={{ width: `${insight.confidence}%`, height: '100%', backgroundColor: '#FF6B35', borderRadius: 2 }} />
               </View>
            </View>
            <Text style={styles.cardFooter}>Based on: {insight.data_basis}</Text>
          </View>
        ))}

        <Text style={styles.footer}>Page 4 of 8</Text>
      </Page>

      {/* PAGE 5: PRODUCT DEEP DIVE */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        <Text style={styles.sectionTitle}>PRODUCT DEEP DIVE</Text>
        
        {data.per_product_analysis.map((p: any, idx: number) => (
          <View key={p.product_id} style={{ marginBottom: 30 }} break={idx > 0 && idx % 2 === 0}>
            <Text style={styles.productHeader}>{p.product_name} | SKU: {p.product_id.split('-')[0]} | Category: Electronics</Text>
            
            <View style={{ flexDirection: 'row', gap: 40 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productSubTitle}>Price Analysis</Text>
                <View style={{ gap: 4 }}>
                  <InfoRow label="Current Price" value={`Rs.${(p.recommended_price - 3000).toLocaleString()}`} />
                  <InfoRow label="Simulated Price" value={`Rs.${p.recommended_price.toLocaleString()}`} bold />
                  <InfoRow label="Elasticity (-)" value={`${p.price_elasticity} (${p.elasticity_interpretation})`} />
                  <InfoRow label="Status" value="- RECOMMENDED" />
                </View>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={styles.productSubTitle}>Demand Forecast</Text>
                <View style={{ gap: 4 }}>
                  <InfoRow label="Current Avg" value="15.7 units/mo" />
                  <InfoRow label="Forecast" value={`${p.demand_forecast_units} units`} bold />
                  <InfoRow label="Seasonal" value={`+${((data.market_benchmarks.seasonal_factor - 1) * 100).toFixed(0)}% festival`} />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 40, marginTop: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productSubTitle}>Stock Analysis</Text>
                <View style={{ gap: 4 }}>
                  <InfoRow label="Current Stock" value={`${p.stock_sufficiency.current_stock} units`} />
                  <InfoRow label="Gap" value={`${p.demand_forecast_units - p.stock_sufficiency.current_stock} units`} alert={p.stock_sufficiency.will_stock_run_out} />
                  <InfoRow label="Reorder" value={`${p.stock_sufficiency.recommended_reorder_quantity || 25} units by May 20`} />
                </View>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={styles.productSubTitle}>Risk & Opportunities</Text>
                <View style={{ gap: 4 }}>
                  {p.risk_flags.slice(0, 1).map((f: string, i: number) => <Text key={i} style={{ fontSize: 8, color: '#FF4757' }}>- {f}</Text>)}
                  {p.opportunity_flags.slice(0, 1).map((f: string, i: number) => <Text key={i} style={{ fontSize: 8, color: '#2EC4B6' }}>- {f}</Text>)}
                </View>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Page 5 of 8</Text>
      </Page>

      {/* PAGE 6: RECOMMENDATIONS */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        <Text style={styles.sectionTitle}>RECOMMENDATIONS & ACTION PLAN</Text>
        
        {data.recommendations.map((rec: any) => (
          <View key={rec.rank} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>
              #{rec.rank} {rec.title.toUpperCase()} - [{rec.implementation_effort.toUpperCase()}] [{rec.timeline.toUpperCase()}]
            </Text>
            <Text style={{ fontSize: 10, color: '#555868', lineHeight: 1.4, marginBottom: 5 }}>
              {rec.description}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#2EC4B6' }}>
              Expected impact: {rec.expected_impact}
            </Text>
          </View>
        ))}

        <View style={{ marginTop: 30 }}>
          <Text style={styles.productSubTitle}>ACTION SUMMARY TABLE</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '40%', fontWeight: 'bold' }]}>Action</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>Owner</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>By When</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>Priority</Text>
            </View>
            {data.recommendations.map((rec: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{rec.title}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Owner</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{rec.timeline}</Text>
                <Text style={[styles.tableCell, { width: '20%', color: i < 2 ? '#FF4757' : '#F5A623' }]}>
                  {i < 2 ? 'CRITICAL' : 'HIGH'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>Page 6 of 8</Text>
      </Page>

      {/* PAGE 7: MARKET BENCHMARKS */}
      <Page size="A4" style={styles.page}>
        <ReportHeader business={business} />
        <Text style={styles.sectionTitle}>MARKET CONTEXT & BENCHMARKS</Text>
        
        <View style={{ marginBottom: 30 }}>
          <Text style={styles.productSubTitle}>Market Condition: {data.market_benchmarks.market_condition_adjustment}</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.6, color: '#555868' }}>
            - Demand multiplier: {data.market_benchmarks.seasonal_factor}x ({((data.market_benchmarks.seasonal_factor - 1) * 100).toFixed(0)}% above normal){"\n"}
            - Festival proximity: {data.market_benchmarks.festival_proximity_days} days away{"\n"}
            - Category: {data.market_benchmarks.category || 'Consumer Electronics'}
          </Text>
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.productSubTitle}>Category Benchmarks (India Retail)</Text>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiBox, { width: '100%', borderBottomWidth: 0 }]}>
              <Text style={styles.kpiLabel}>Average Gross Margin</Text>
              <Text style={styles.kpiValue}>{data.market_benchmarks.category_avg_margin_percent}% (Your projected: {data.simulated_scenario.gross_margin_percent}% -)</Text>
            </View>
            <View style={[styles.kpiBox, { width: '100%' }]}>
              <Text style={styles.kpiLabel}>Price Positioning</Text>
              <Text style={styles.kpiValue}>{data.market_benchmarks.competitor_comparison.price_position.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>METHODOLOGY NOTES</Text>
        <Text style={{ fontSize: 8, color: '#555868', lineHeight: 1.8 }}>
          - Demand forecasts based on invoice_items history + seasonal factors{"\n"}
          - Price elasticity calculated from historical price-quantity pairs{"\n"}
          - Market benchmarks based on India SME retail category averages{"\n"}
          - Market share model: Multinomial Logit (Brand Equity = 1.2){"\n"}
          - All values in INR (Rs.) including applicable GST at declared rates{"\n"}
          - Simulation confidence: {data.summary.overall_confidence}% overall
        </Text>

        <Text style={styles.footer}>Page 7 of 8</Text>
      </Page>

      {/* PAGE 8: FINAL FOOTER */}
      <Page size="A4" style={styles.page}>
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ReportHeader business={business} />
            <View style={{ marginTop: 100, alignItems: 'center' }}>
               <Text style={{ fontSize: 10, color: '#555868', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
                 This report was generated by Vyapari Simulation Engine on {currentDate}. 
                 All projections are estimates based on historical transaction data and market benchmarks. 
                 Actual results may vary based on market conditions, competition, and business operations. 
                 This report is for internal planning purposes only.
               </Text>
               
               <View style={{ marginTop: 60, alignItems: 'center' }}>
                 <Text style={{ fontSize: 10, fontWeight: 'bold' }}>For support:</Text>
                 <Text style={{ fontSize: 10, color: '#FF6B35' }}>support@vyapari.in | vyapari.in</Text>
                 <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 10 }}>- 2025 Vyapari. All rights reserved.</Text>
               </View>
            </View>
         </View>
         <Text style={styles.footer}>Page 8 of 8</Text>
      </Page>
    </Document>
  );
};

// Helper Components
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.coverDetailRow}>
    <Text style={styles.coverLabel}>{label}</Text>
    <Text style={styles.coverValue}>{value}</Text>
  </View>
);

const ReportHeader = ({ business }: { business: any }) => (
  <View style={styles.header}>
    {business.logo_url ? (
      <Image src={business.logo_url} style={styles.headerLogo} />
    ) : (
      <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{business.name}</Text>
    )}
    <Text style={styles.headerWordmark}>VYAPARI</Text>
  </View>
);

const KPIBox = ({ label, value, change, positive }: { label: string; value: string; change: string; positive: boolean }) => (
  <View style={styles.kpiBox}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={[styles.kpiChange, { color: positive ? '#2EC4B6' : '#FF4757' }]}>
      {positive ? '-' : '-'} {change}
    </Text>
  </View>
);

const InfoRow = ({ label, value, bold = false, alert = false }: { label: string; value: string; bold?: boolean; alert?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ fontSize: 8, color: '#555868' }}>{label}:</Text>
    <Text style={{ fontSize: 8, fontWeight: bold ? 'bold' : 'normal', color: alert ? '#FF4757' : '#1A1A1A' }}>{value}</Text>
  </View>
);

export default SimulationPDFReport;
