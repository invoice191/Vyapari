import * as XLSX from 'xlsx';

interface FormattedExcelProps {
  businessName: string;
  reportTitle: string;
  period: string;
  gstin: string;
  kpis: { label: string; value: string }[];
  tableData: any[];
  columns: string[];
}

export function generateFormattedExcel({
  businessName, reportTitle, period, gstin, kpis, tableData, columns
}: FormattedExcelProps) {
  const wsData: any[][] = [];
  wsData.push([businessName.toUpperCase()]);
  wsData.push([`${reportTitle.toUpperCase()} | ${period}`]);
  wsData.push([`GSTIN: ${gstin}`]);
  wsData.push([]);
  kpis.forEach(k => wsData.push([`${k.label}:`, k.value]));
  wsData.push([]);
  wsData.push(columns.map(c => c.toUpperCase()));
  tableData.forEach(row => {
    wsData.push(columns.map(col => row[col.toLowerCase().replace(/\s+/g, '_')] ?? row[col] ?? ''));
  });
  const totalsRow = columns.map((col, idx) => {
    if (idx === 0) return 'TOTALS';
    const vals = tableData.map(r => parseFloat(r[col.toLowerCase().replace(/\s+/g, '_')] ?? r[col])).filter(v => !isNaN(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : '';
  });
  wsData.push(totalsRow);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // FIX: correct MIME type
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportTitle.replace(/\s+/g, '_')}_Formatted.xlsx`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
