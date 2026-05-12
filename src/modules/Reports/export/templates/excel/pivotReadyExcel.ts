import * as XLSX from 'xlsx';


interface PivotReadyExcelProps {
  reportTitle: string;
  tableData: any[];
  columns: string[];
}

export function generatePivotReadyExcel({
  reportTitle,
  tableData,
  columns
}: PivotReadyExcelProps) {
  // Map data to clean format
  const rows = tableData.map(row => {
    const cleanRow: any = {};
    columns.forEach(col => {
      const val = row[col.toLowerCase().replace(/\s+/g, '_')] ?? row[col];
      // Try to parse numbers
      const num = parseFloat(val);
      cleanRow[col.toUpperCase()] = (!isNaN(num) && isFinite(val)) ? num : val;
    });
    return cleanRow;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportTitle.replace(/\s+/g, '_')}_PivotReady.xlsx`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
