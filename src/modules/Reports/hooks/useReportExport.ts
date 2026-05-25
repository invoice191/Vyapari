import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/common/Toast';
import { generateExecutivePDF } from '../export/templates/pdf/executivePDF';
import { generateDetailedPDF } from '../export/templates/pdf/detailedPDF';
import { generateSimplePDF } from '../export/templates/pdf/simplePDF';
import { generateFormattedExcel } from '../export/templates/excel/formattedExcel';
import { generatePivotReadyExcel } from '../export/templates/excel/pivotReadyExcel';
import { generateRawDataExcel } from '../export/templates/excel/rawDataExcel';
import { exportToCSV } from '../export/csvExporter';
import { printReport } from '../export/printExporter';
import { captureChartAsImage } from '../export/captureChart';

export type ExportFormat = 'pdf_executive' | 'pdf_detailed' | 'pdf_simple' | 'pdf_single_record' |
                          'excel_formatted' | 'excel_pivot' | 'excel_raw' | 
                          'csv' | 'print';

export function useReportExport() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchReportInsight = async (reportType: string, kpis: any, tableData: any[], period: string, businessId: string): Promise<string[]> => {
    try {
      const cacheKey = `advisory_${businessId}_${reportType}_${period.replace(/\s+/g, '_')}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      const { data, error } = await supabase.functions.invoke('report-insight', {
        body: { reportType, keyMetrics: kpis, tableData, period }
      });

      if (error) throw error;
      
      const advisory = data?.advisory || ["Monitor your trends closely for optimal growth."];
      localStorage.setItem(cacheKey, JSON.stringify(advisory));
      return advisory;
    } catch (err) {
      console.error('SMART INSIGHT failed:', err);
      return ["Data analysis completed. Review metrics below."];
    }
  };

  const handleExport = async ({
    format,
    reportTitle,
    period,
    businessId,
    businessName,
    gstin,
    kpis,
    tableData,
    columns,
    filtersApplied,
    chartRef,
    aiAdvisory: localAdvisory
  }: {
    format: ExportFormat;
    reportTitle: string;
    period: string;
    businessId: string;
    businessName: string;
    gstin: string;
    kpis: any[];
    tableData: any[];
    columns: string[];
    filtersApplied: string;
    chartRef?: React.RefObject<HTMLDivElement | null>;
    category?: string;
    description?: string;
    aiAdvisory?: string[];
  }) => {
    setExporting(true);
    try {
      let chartImage: string | undefined;
      if (chartRef?.current && (format.startsWith('pdf') || format === 'print')) {
        chartImage = await captureChartAsImage(chartRef.current);
      }

      switch (format) {
        case 'pdf_executive':
          const aiAdvisory = localAdvisory && localAdvisory.length > 0
            ? localAdvisory
            : await fetchReportInsight(reportTitle, kpis, tableData, period, businessId);
          const reportDef = (await import('../reportConfig')).REPORT_CONFIG.find(r => r.title === reportTitle);
          await generateExecutivePDF({
            businessName, 
            reportTitle, 
            period, 
            gstin, 
            kpis, 
            chartImage, 
            aiAdvisory, 
            tableData, 
            columns,
            category: reportDef?.category,
            description: reportDef?.description
          });
          break;
        case 'pdf_detailed':
          const aiAdvisoryDetailed = localAdvisory && localAdvisory.length > 0 
            ? localAdvisory 
            : await fetchReportInsight(reportTitle, kpis, tableData, period, businessId);
          const reportDefDetailed = (await import('../reportConfig')).REPORT_CONFIG.find(r => r.title === reportTitle);
          await generateDetailedPDF({
            businessName, 
            reportTitle, 
            period, 
            gstin, 
            kpis, 
            chartImage, 
            tableData, 
            columns, 
            filtersApplied,
            category: reportDefDetailed?.category,
            description: reportDefDetailed?.description,
            aiAdvisory: aiAdvisoryDetailed
          });
          break;
        case 'pdf_simple':
          // Convert KPIs and data into plain English points for Simple Summary
          const summaryPoints = kpis.map(k => `${k.label} was ${k.value}`);
          const actionItems = [
            "Review your top selling items to ensure stock availability.",
            "Monitor outstanding balances to maintain healthy cash flow."
          ];
          await generateSimplePDF({
            businessName, reportTitle, period, summaryPoints, actionItems, chartImage
          });
          break;
        case 'excel_formatted':
          generateFormattedExcel({
            businessName, reportTitle, period, gstin, kpis, tableData, columns
          });
          break;
        case 'excel_pivot':
          generatePivotReadyExcel({
            reportTitle, tableData, columns
          });
          break;
        case 'excel_raw':
          generateRawDataExcel({
            reportTitle, businessId, dateFrom: period.split(' to ')[0], dateTo: period.split(' to ')[1] || period,
            filtersApplied, kpis, tableData
          });
          break;
        case 'pdf_single_record':
          const { generateSingleRecordPDF } = await import('../export/templates/pdf/singleRecordPDF');
          await generateSingleRecordPDF({
            businessName,
            reportTitle: `Record Detail: ${reportTitle}`,
            record: tableData[0], // In this case, we pass just the single row
            columns
          });
          break;
        case 'csv':
          exportToCSV(reportTitle, tableData, columns);
          break;
        case 'print':
          const { openPrintPreview } = await import('../../../services/reportExporter');
          const mappedColumns = columns.map(c => ({
            key: c.toLowerCase().replace(/\s+/g, '_'),
            label: c,
            type: (c.toLowerCase().includes('amount') || c.toLowerCase().includes('total') || c.toLowerCase().includes('revenue') || c.toLowerCase().includes('val')) ? 'currency' as const : 'text' as const
          }));
          openPrintPreview(chartRef?.current || document.body, {
            type: 'sales', // fallback
            title: reportTitle,
            dateRange: { from: period.split(' to ')[0] || period, to: period.split(' to ')[1] || period },
            generatedBy: 'Vyapari ERP',
            businessName,
            gstin,
            columns: mappedColumns,
            rows: tableData.map(row => {
              const cleanRow: Record<string, unknown> = {};
              columns.forEach((col, idx) => {
                const key = col.toLowerCase().replace(/\s+/g, '_');
                const val = row[key] !== undefined ? row[key] : (row[col] !== undefined ? row[col] : Object.values(row || {})[idx]);
                cleanRow[key] = val ?? '';
              });
              return cleanRow;
            }),
            kpis: kpis.map(k => ({ label: k.label, value: k.value }))
          });
          break;
      }
    } catch (err) {
      console.error('Export Error:', err);
      toast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return { exporting, handleExport };
}
