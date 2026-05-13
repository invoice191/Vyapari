import { EngineOutput, DSSInsight } from './types';
import rules from './rules.json';
import { supabase } from '../../lib/supabase';

export async function generateInsights(
  engineOutputs: EngineOutput[],
  businessContext: any,
  useAI = true
): Promise<DSSInsight[]> {
  // Phase 1: instant rule-based insights
  const ruleInsights = buildRuleInsights(engineOutputs);

  if (!useAI) return ruleInsights;

  try {
    // Phase 2: Invoke real Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('dss-ai', {
      body: {
        action: 'business-briefing',
        payload: {
          revenueTrends: {
            yesterday: engineOutputs.find(o => o.engine === 'finance')?.metrics?.find(m => m.label === 'Cash')?.value || 0,
            avg7Day: 45000, 
            projectedToday: engineOutputs.find(o => o.engine === 'forecast')?.metrics?.find(m => m.label === 'Expected Sales Today')?.value || 0
          },
          personas: [], // Would map from RFM engine
          replenishmentDrafts: engineOutputs.find(o => o.engine === 'inventory')?.recommendations || [],
          dunningRisks: engineOutputs.find(o => o.engine === 'finance')?.recommendations || [],
          anomalies: []
        }
      }
    });

    if (error) throw error;

    // Merge rule-based and AI-generated insights
    // The edge function returns an array of objects: { title, insight, impact, icon }
    // We map these to DSSInsight type
    const aiInsights: DSSInsight[] = Array.isArray(data)
      ? data.map((item: any, idx: number) => ({
          id: `ai-insight-${idx}`,
          type: 'ai_narrative',
          title: item.title,
          body: item.insight,
          relatedRecommendationIds: [],
          impact: item.impact,
          icon: item.icon,
          confidence: 0.8,
          source: 'gemini'
        }))
      : [];

    return [...ruleInsights, ...aiInsights];
  } catch (err) {
    console.error("[insightGenerator] AI Briefing failed:", err);
    return ruleInsights;
  }
}

function buildRuleInsights(outputs: EngineOutput[]): DSSInsight[] {
  const insights: DSSInsight[] = [];
  const criticals = outputs.flatMap(o => o.recommendations || []).filter(r => r?.priority === 'critical');
  const totalRisk = criticals.reduce((s, r) => s + (r.impactEstimate?.value ?? 0), 0);

  if (criticals.length > 0) {
    insights.push({
      id: 'rule-critical-summary',
      type: 'rule_summary',
      title: `${criticals.length} critical issues require immediate attention`,
      body: `Total revenue at risk: Rs.${totalRisk.toLocaleString('en-IN')}. Most urgent: ${criticals[0].title}.`,
      relatedRecommendationIds: criticals.map(r => r.id),
      confidence: 0.95,
      source: 'rules_engine',
    });
  }

  const nextMonth = new Date().getMonth() + 2;
  const isFestivalSoon = rules.forecast.festivalMonths.includes(nextMonth);
  if (isFestivalSoon) {
    insights.push({
      id: 'rule-festival-warning',
      type: 'festival_warning',
      title: `Festival season approaching - stock up now`,
      body: `Demand historically rises ${Math.round((rules.forecast.festivalBoostFactor - 1) * 100)}% in ${new Date(Date.now() + 30 * 86400000).toLocaleString('default', { month: 'long' })}. Review your fast-mover restock recommendations before stock runs out.`,
      relatedRecommendationIds: [],
      confidence: 0.85,
      source: 'rules_engine',
    });
  }

  const invOutput = outputs.find(o => o.engine === 'inventory');
  const stockOuts = (invOutput?.recommendations || []).filter(r => r?.priority === 'high' || r?.priority === 'critical');
  if (stockOuts.length > 0) {
    insights.push({
      id: 'rule-inventory-alert',
      type: 'trend_alert',
      title: `${stockOuts.length} critical stockouts projected`,
      body: `Items like ${stockOuts[0].affectedItemName || 'core inventory'} are below safety thresholds. Restock immediately to avoid lost revenue.`,
      relatedRecommendationIds: stockOuts.map(r => r.id),
      confidence: 0.9,
      source: 'rules_engine',
    });
  }

  return insights;
}
