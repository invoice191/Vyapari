export type CSVFormat = 'comma' | 'tab' | 'semicolon';

export function exportToCSV(
  reportTitle: string,
  data: any[],
  columns: string[],
  format: CSVFormat
) {
  let separator = ',';
  let fileExtension = 'csv';

  if (format === 'tab') {
    separator = '\t';
    fileExtension = 'txt';
  } else if (format === 'semicolon') {
    separator = ';';
  }

  // 1. Generate Header Row
  const headerRow = columns.map(col => `"${col.toUpperCase().replace(/"/g, '""')}"`).join(separator);

  // 2. Generate Data Rows
  const dataRows = data.map((row, rowIndex) => {
    return columns.map((col, colIndex) => {
      const val = getRowValue(row, col, colIndex);
      const cleanVal = String(val).replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(separator);
  });

  // 3. Assemble CSV Content
  const csvContent = [headerRow, ...dataRows].join('\n');

  // 4. Create and Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_export.${fileExtension}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getRowValue(row: any, col: string, colIndex: number) {
  if (row[col.toLowerCase()]) return row[col.toLowerCase()];
  if (row[col.replace(/\s+/g, '_').toLowerCase()]) return row[col.replace(/\s+/g, '_').toLowerCase()];
  const keys = Object.keys(row);
  if (keys[colIndex]) return row[keys[colIndex]];
  return '—';
}
