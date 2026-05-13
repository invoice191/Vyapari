export function exportToCSV(reportTitle: string, data: any[], columns: string[]) {
  // UTF-8 BOM required for Excel to show symbols like Rs. correctly
  const BOM = '\uFEFF';
  
  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const val = row[col.toLowerCase().replace(/\s+/g, '_')] ?? row[col] ?? '';
      // Escape quotes and wrap in quotes
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = BOM + headers + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
