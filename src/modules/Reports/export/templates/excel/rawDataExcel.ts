import * as XLSX from 'xlsx';


interface RawDataExcelProps {
  reportTitle: string;
  businessId: string;
  dateFrom: string;
  dateTo: string;
  filtersApplied: string;
  kpis: { label: string; value: string }[];
  tableData: any[];
}

export function generateRawDataExcel({
  reportTitle,
  businessId,
  dateFrom,
  dateTo,
  filtersApplied,
  kpis,
  tableData
}: RawDataExcelProps) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = kpis.map(k => [k.label, k.value]);
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Full Data
  const wsData = XLSX.utils.json_to_sheet(tableData);
  XLSX.utils.book_append_sheet(wb, wsData, 'Full Data');

  // Sheet 3: Metadata
  const metadata = [
    ['report_title', reportTitle],
    ['business_id', businessId],
    ['date_from', dateFrom],
    ['date_to', dateTo],
    ['filters_applied', filtersApplied],
    ['total_rows', tableData.length],
    ['generated_at', new Date().toISOString()],
    ['generated_by', 'Vyapari ERP']
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportTitle.replace(/\s+/g, '_')}_RawData.xlsx`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
