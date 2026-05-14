import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { downloadPDF as coreDownloadPDF } from '../utils/pdf/downloadPDF';
import type { ReportPayload, SheetConfig, ColumnDef } from '../types/reports';

// --- Helpers -----------------------------------------------------------------

const INDIGO: [number, number, number] = [79, 70, 229];
const INDIGO_LIGHT: [number, number, number] = [238, 242, 255];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_50: [number, number, number] = [248, 250, 252];
const EMERALD: [number, number, number] = [16, 185, 129];
const ROSE: [number, number, number] = [244, 63, 94];
const AMBER: [number, number, number] = [245, 158, 11];

const formatDate = (d: string | Date): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (v: number): string => {
  if (v === 0) return '-';
  return 'Rs.' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatValue = (val: unknown, col: ColumnDef): string => {
  if (val === null || val === undefined || val === '' || val === 0 && col.type === 'currency') return '-';
  switch (col.type) {
    case 'currency': return formatCurrency(Number(val));
    case 'number': return Number(val) === 0 ? '-' : Number(val).toLocaleString('en-IN');
    case 'date': return formatDate(String(val));
    case 'percent': return Number(val).toFixed(2) + '%';
    default: return String(val);
  }
};

const generateFilename = (type: string, ext: string): string => {
  const now = new Date();
  const d = now.toISOString().slice(0, 10);
  const safeType = type.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `vyapari-${safeType}-${d}.${ext}`;
};

/** Trigger browser download safely across all browsers */
const triggerDownload = (blob: Blob, filename: string): void => {
  import('file-saver').then(({ saveAs }) => {
    saveAs(blob, filename);
  }).catch(() => {
    // Minimal fallback if dynamic import fails
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
};

/** Capture a DOM element as PNG - strips dark-mode before capture */
const captureElement = async (el: HTMLElement): Promise<string> => {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    background: #ffffff; color: #1e293b;
    width: ${el.offsetWidth}px;
  `;
  // Strip dark-mode classes
  clone.querySelectorAll<HTMLElement>('*').forEach(n => {
    n.classList.remove('dark', 'bg-slate-900', 'bg-slate-800', 'text-white', 'glass-card');
    n.style.background = '';
    n.style.color = '';
  });
  document.body.appendChild(clone);
  const canvas = await html2canvas(clone, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  document.body.removeChild(clone);
  return canvas.toDataURL('image/png');
};

// --- PDF Header / Footer helpers ---------------------------------------------

const drawPDFHeader = (doc: any, payload: ReportPayload, pageNumber: number, totalPages: number) => {
  const w = doc.internal.pageSize.getWidth();
  const themeColor = payload.type === 'inventory' ? INDIGO : payload.type === 'sales' ? EMERALD : SLATE_900;

  // Premium Side Accent
  doc.setFillColor(...themeColor);
  doc.rect(0, 0, 5, 297, 'F');

  // Logo placeholder (Circular for premium feel)
  doc.setFillColor(...SLATE_900);
  doc.circle(25, 20, 10, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const initials = payload.businessName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  doc.text(initials, 25, 21, { align: 'center' });

  // Business name & Branding
  doc.setFontSize(18);
  doc.setTextColor(...SLATE_900);
  doc.setFont('helvetica', 'bold');
  doc.text(payload.businessName.toUpperCase(), 42, 18);
  
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL BUSINESS INTELLIGENCE SYSTEM', 42, 23);

  // Contact Info Row
  const meta = [payload.gstin && `GSTIN: ${payload.gstin}`, payload.phone, payload.email].filter(Boolean).join('  |  ');
  if (meta) doc.text(meta, 42, 28);

  // Report title (Stylized right-aligned)
  doc.setFontSize(10);
  doc.setTextColor(...themeColor);
  doc.setFont('helvetica', 'bold');
  doc.text(payload.title.toUpperCase(), w - 15, 15, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_500);
  doc.setFont('helvetica', 'normal');
  const dateStr = `PERIOD: ${formatDate(payload.dateRange.from)} - ${formatDate(payload.dateRange.to)}`;
  doc.text(dateStr, w - 15, 20, { align: 'right' });
  doc.text(`DOC_ID: VY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, w - 15, 24, { align: 'right' });

  // Elegant Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(15, 35, w - 15, 35);

  if (payload.isDraft) {
    doc.setFontSize(60);
    doc.setTextColor(245, 245, 245);
    doc.setFont('helvetica', 'bold');
    doc.text('DRAFT_COPY', w / 2, 180, { align: 'center', angle: 45 });
  }
};

const drawPDFFooter = (doc: any, payload: ReportPayload, pageNumber: number, totalPages: number) => {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(240, 240, 240);
  doc.line(15, h - 15, w - 15, h - 15);

  doc.setFontSize(7);
  doc.setTextColor(160, 170, 190);
  doc.setFont('helvetica', 'normal');
  doc.text(`© ${new Date().getFullYear()} Vyapari ERP - Confidential Business Document`, 15, h - 8);
  
  const ts = new Date().toLocaleString('en-IN');
  doc.text(`PAGE ${pageNumber} OF ${totalPages}  |  ISSUED: ${ts}`, w - 15, h - 8, { align: 'right' });
};

const drawKPIRow = (doc: any, kpis: ReportPayload['kpis'], startY: number, themeColor: [number, number, number]): number => {
  if (!kpis || kpis.length === 0) return startY;
  const w = doc.internal.pageSize.getWidth();
  const boxW = (w - 30 - (kpis.length - 1) * 4) / Math.min(kpis.length, 4);
  
  kpis.slice(0, 4).forEach((kpi, i) => {
    const x = 15 + i * (boxW + 4);
    
    // Minimalist Card
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(240, 242, 245);
    doc.roundedRect(x, startY, boxW, 22, 1, 1, 'FD');
    
    // Indicator Accent
    doc.setFillColor(...themeColor);
    doc.rect(x, startY, 2, 22, 'F');

    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE_500);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.label.toUpperCase(), x + 6, startY + 7);
    
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_900);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), x + 6, startY + 16);
  });
  return startY + 30;
};

// --- PDF DOWNLOAD -------------------------------------------------------------

export async function downloadPDF(
  payload: ReportPayload,
  template: 'executive' | 'detailed' | 'simple' = 'detailed'
): Promise<void> {
  const isWide = payload.columns.length > 7;
  const doc: any = new jsPDF({
    orientation: isWide ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margins = { top: 35, bottom: 18, left: 15, right: 15 };

  // Build autoTable body
  const head = [payload.columns.map(c => c.label.toUpperCase())];
  const body = payload.rows.map(row =>
    payload.columns.map(col => {
      const val = row[col.key];
      const str = formatValue(val, col);
      return { content: str, styles: { halign: col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left') } };
    })
  );

  // Totals row
  const foot: any[][] = [];
  if (payload.totals) {
    const totalsRow = payload.columns.map(col => {
      if (payload.totals![col.key] !== undefined) {
        return { content: formatValue(payload.totals![col.key], col), styles: { fontStyle: 'bold', halign: col.align || 'right' } };
      }
      return { content: '', styles: {} };
    });
    totalsRow[0] = { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'left' } };
    foot.push(totalsRow);
  }

  // Capture chart if executive template
  let chartImage: string | undefined;
  if (template === 'executive' && payload.chartRef?.current) {
    try { chartImage = await captureElement(payload.chartRef.current); } catch { /* skip */ }
  }

  const themeColor = payload.type === 'inventory' ? INDIGO : payload.type === 'sales' ? EMERALD : SLATE_900;
  const headerFill = payload.type === 'inventory' ? [235, 238, 255] : payload.type === 'sales' ? [230, 255, 240] : [245, 245, 245];

  // First pass: render to get total pages
  let pageCount = 0;
  doc.autoTable({
    head,
    body: template === 'executive' ? body.slice(0, 10) : body,
    foot,
    startY: margins.top + (payload.kpis?.length ? 32 : 2) + (chartImage ? 70 : 0) + (template === 'simple' ? 0 : 4),
    margin: { top: margins.top, bottom: margins.bottom, left: margins.left, right: margins.right },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, overflow: 'linebreak', textColor: [30, 41, 59] },
    headStyles: { fillColor: headerFill, textColor: themeColor, fontStyle: 'bold', fontSize: 8, lineWidth: 0.1, drawColor: [220, 225, 235] },
    alternateRowStyles: { fillColor: [251, 252, 254] },
    footStyles: { fillColor: [241, 245, 249], textColor: SLATE_900, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      payload.columns.map((col, i) => [i, {
        halign: col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left'),
        cellWidth: col.width || 'auto',
        textColor: col.type === 'currency' ? undefined : undefined,
      }])
    ),
    didDrawPage: (data: any) => {
      pageCount = data.pageCount;
      drawPDFHeader(doc, payload, data.pageNumber, data.pageCount);
      // KPIs only on first page
      if (data.pageNumber === 1 && payload.kpis?.length && template !== 'simple') {
        drawKPIRow(doc, payload.kpis, margins.top + 2, themeColor);
      }
      // Chart image only on first page (executive)
      if (data.pageNumber === 1 && chartImage && template === 'executive') {
        const kpiOffset = payload.kpis?.length ? 28 : 0;
        doc.addImage(chartImage, 'PNG', 15, margins.top + kpiOffset + 2, 180, 65);
      }
      drawPDFFooter(doc, payload, data.pageNumber, data.pageCount);
    },
  });

  // --- Post-Table Summary & Insights (The "Last" Part) -----------------------
  if (payload.advisory?.length || payload.summary?.length) {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a new page for the summary
    if (finalY > pageHeight - 50) {
      doc.addPage();
      drawPDFHeader(doc, payload, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
      drawPDFFooter(doc, payload, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
    }

    const currentY = finalY > pageHeight - 50 ? 40 : finalY;
    const w = doc.internal.pageSize.getWidth();

    // Summary Header
    doc.setFontSize(10);
    doc.setTextColor(...INDIGO);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY & STRATEGIC INSIGHTS', 15, currentY);

    // Summary Box
    doc.setFillColor(...SLATE_50);
    doc.setDrawColor(200, 210, 230);
    const summaryText = (payload.advisory?.[0] || payload.summary?.[0] || '').trim();
    
    // Highlight Logic: Bold the first sentence or the part before the first period
    const firstPeriodIndex = summaryText.indexOf('.');
    const mainPart = firstPeriodIndex !== -1 ? summaryText.slice(0, firstPeriodIndex + 1) : summaryText;
    const restPart = firstPeriodIndex !== -1 ? summaryText.slice(firstPeriodIndex + 1) : '';

    const lines = doc.splitTextToSize(summaryText, w - 40);
    const boxHeight = (lines.length * 5) + 15;

    doc.roundedRect(15, currentY + 4, w - 30, boxHeight, 1, 1, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_900);
    
    // Render with highlight
    doc.setFont('helvetica', 'bold');
    const mainLines = doc.splitTextToSize(mainPart, w - 40);
    doc.text(mainLines, 20, currentY + 12);
    
    doc.setFont('helvetica', 'normal');
    const restLines = doc.splitTextToSize(restPart, w - 40);
    doc.text(restLines, 20, currentY + 12 + (mainLines.length * 5));
  }

  const filename = generateFilename(payload.title, 'pdf');
  coreDownloadPDF(doc, filename);
}

// --- EXCEL DOWNLOAD -----------------------------------------------------------

export function downloadExcel(payload: ReportPayload, extraSheets?: SheetConfig[]): void {
  const wb = XLSX.utils.book_new();

  const buildSheet = (cfg: { sheetName: string; columns: ColumnDef[]; rows: Record<string, unknown>[]; totals?: Record<string, number> }) => {
    const wsData: any[][] = [];

    // Row 1: Business Name
    wsData.push([payload.businessName]);
    // Row 2: Title + date range
    wsData.push([`${payload.title} | ${formatDate(payload.dateRange.from)} - ${formatDate(payload.dateRange.to)}`]);
    // Row 3: GSTIN / meta
    wsData.push([`GSTIN: ${payload.gstin || 'N/A'}  |  Generated by: ${payload.generatedBy}`]);
    // Row 4: blank
    wsData.push([]);
    // Row 5: Column Headers
    wsData.push(cfg.columns.map(c => c.label.toUpperCase()));
    // Data rows
    cfg.rows.forEach(row => {
      wsData.push(cfg.columns.map(col => {
        const raw = row[col.key];
        if (raw === null || raw === undefined) return '';
        return raw;
      }));
    });
    // Totals row
    if (cfg.totals) {
      const totalsRow: any[] = cfg.columns.map(col => cfg.totals![col.key] ?? '');
      totalsRow[0] = 'TOTAL';
      wsData.push(totalsRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for header rows
    const mergeEnd = Math.max(cfg.columns.length - 1, 5);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: mergeEnd } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: mergeEnd } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: mergeEnd } },
    ];

    // Auto column widths
    ws['!cols'] = cfg.columns.map(col => {
      const maxLen = Math.max(
        col.label.length,
        ...cfg.rows.map(r => String(r[col.key] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
    });

    // Number formats
    cfg.columns.forEach((col, i) => {
      const colLetter = XLSX.utils.encode_col(i);
      const startRow = 5; // 0-indexed row 5
      cfg.rows.forEach((_, ri) => {
        const cellRef = `${colLetter}${startRow + ri + 1}`;
        if (!ws[cellRef]) return;
        if (col.type === 'currency') ws[cellRef].z = '"Rs."#,##0.00';
        else if (col.type === 'number') ws[cellRef].z = '#,##0';
        else if (col.type === 'percent') ws[cellRef].z = '0.00%';
        else if (col.type === 'date' && ws[cellRef].v) {
          ws[cellRef].t = 'd';
          ws[cellRef].z = 'DD-MMM-YYYY';
        }
      });
    });

    return ws;
  };

  // Sheet 1: Main data
  XLSX.utils.book_append_sheet(wb, buildSheet({
    sheetName: 'Report Data',
    columns: payload.columns,
    rows: payload.rows,
    totals: payload.totals,
  }), 'Report Data');

  // Sheet 2: KPI Summary
  if (payload.kpis?.length) {
    const kpiData: any[][] = [
      ['Metric', 'Value', 'Delta'],
      ...payload.kpis.map(k => [k.label, k.value, k.delta !== undefined ? `${k.delta > 0 ? '+' : ''}${k.delta}%` : 'N/A'])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), 'KPI Summary');
  }

  // Extra sheets (customer, vendor, etc.)
  extraSheets?.forEach(s => {
    XLSX.utils.book_append_sheet(wb, buildSheet(s), s.sheetName.slice(0, 31));
  });

  // Sheet: Audit Metadata
  const auditData = [
    ['Field', 'Value'],
    ['Report Type', payload.type],
    ['Report Title', payload.title],
    ['Generated By', payload.generatedBy],
    ['Generated At', new Date().toISOString()],
    ['Date From', payload.dateRange.from],
    ['Date To', payload.dateRange.to],
    ['Business', payload.businessName],
    ['GSTIN', payload.gstin || 'N/A'],
    ['Total Records', payload.rows.length],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(auditData), 'Audit Metadata');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const filename = generateFilename(payload.title, 'xlsx');
  triggerDownload(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename
  );
}

// --- CSV DOWNLOAD -------------------------------------------------------------

export function downloadCSV(payload: ReportPayload): void {
  const quoteCSV = (v: unknown): string => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const BOM = '\uFEFF';
  const headers = payload.columns.map(c => quoteCSV(c.label));
  const dataRows = payload.rows.map(row =>
    payload.columns.map(col => quoteCSV(formatValue(row[col.key], col)))
  );

  const csv = BOM + [headers, ...dataRows].map(r => r.join(',')).join('\n');
  const filename = generateFilename(payload.title, 'csv');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

// --- PRINT PREVIEW ------------------------------------------------------------

export function printReport(containerEl: HTMLElement, payload: ReportPayload): void {
  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) return;

  const tableRows = payload.rows.map(row => `
    <tr>${payload.columns.map(col => `<td>${formatValue(row[col.key], col)}</td>`).join('')}</tr>
  `).join('');

  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${payload.title} - Vyapari ERP</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background: #fff; color: #0f172a; font-size: 9pt; line-height: 1.5; }
        .official-badge { font-size: 7pt; font-weight: 900; color: #4f46e5; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 4px; }
        .header { border-bottom: 4px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .biz-info { display: flex; flex-direction: column; }
        .category { font-size: 8pt; font-weight: 900; color: #94a3b8; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 4px; }
        .biz-name { font-size: 10pt; font-weight: 900; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; }
        .title { font-size: 24pt; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; font-style: italic; color: #0f172a; margin-top: 4px; }
        .description { font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase; max-width: 500px; margin-top: 10px; }
        
        .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); border: 1px solid #f1f5f9; background: #f8fafc; margin-bottom: 25px; }
        .meta-item { padding: 12px; border-right: 1px solid #f1f5f9; }
        .meta-item:last-child { border-right: none; }
        .meta-label { font-size: 6pt; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .meta-value { font-size: 8pt; font-weight: 900; color: #0f172a; text-transform: uppercase; }

        .section-title { font-size: 9pt; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; margin-top: 25px; }
        
        .kpi-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
        .kpi-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; text-align: center; }
        .kpi-label { font-size: 7pt; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .kpi-value { font-size: 12pt; font-weight: 900; color: #0f172a; }

        table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 30px; }
        thead tr { background: #0f172a; color: #fff; }
        th { padding: 10px; text-align: left; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #f8fafc; }
        
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 40px; font-size: 8.5pt; color: #334155; }

        .signatures { display: grid; grid-template-cols: repeat(3, 1fr); gap: 40px; margin-top: 50px; page-break-inside: avoid; }
        .sig-box { border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .sig-label { font-size: 8pt; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .sig-sub { font-size: 7pt; color: #94a3b8; font-style: italic; }

        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #cbd5e1; padding: 10px; border-top: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.2em; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="biz-info">
          <div class="category">${(payload.category || 'GENERAL').toUpperCase()} REPORTS</div>
          <div class="biz-name">${payload.businessName}</div>
          <div class="title">${payload.title}</div>
          <div class="description">${payload.description || ''}</div>
        </div>
        <div style="text-align: right">
          <div class="official-badge">OFFICIAL DOCUMENT</div>
          <div style="font-size: 7pt; color: #94a3b8;">GEN: ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Period</div>
          <div class="meta-value">${payload.dateRange.from} - ${payload.dateRange.to}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Branch</div>
          <div class="meta-value">Main HQ</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Prepared By</div>
          <div class="meta-value">${payload.generatedBy}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">GSTIN</div>
          <div class="meta-value">${payload.gstin || 'N/A'}</div>
        </div>
      </div>

      ${payload.kpis?.length ? `
        <div class="section-title">Key Performance Highlights</div>
        <div class="kpi-grid">
          ${payload.kpis.slice(0, 4).map(k => `
            <div class="kpi-card">
              <div class="kpi-label">${k.label}</div>
              <div class="kpi-value">${k.value}</div>
            </div>
          `).join('')}
        </div>` : ''}

      <div class="section-title">Detailed Analysis Records</div>
      <table>
        <thead>
          <tr>${payload.columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      ${payload.advisory?.length || payload.summary?.length ? `
        <div class="section-title">Executive Summary & Strategic Insights</div>
        <div class="summary-box">
          <strong style="color: #1e2a5e; font-size: 10pt; display: block; margin-bottom: 8px;">
            ${(payload.advisory?.[0] || payload.summary?.[0] || '').split('.')[0]}.
          </strong>
          ${(payload.advisory?.[0] || payload.summary?.[0] || '').split('.').slice(1).join('.')}
        </div>` : ''}

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-label">Prepared By</div>
          <div class="sig-sub">Name & Signature</div>
        </div>
        <div class="sig-box">
          <div class="sig-label">Reviewed By</div>
          <div class="sig-sub">Name & Signature</div>
        </div>
        <div class="sig-box">
          <div class="sig-label">Approved By</div>
          <div class="sig-sub">Name & Signature</div>
        </div>
      </div>

      <div class="footer">Confidential - System Generated Document - Vyapari ERP v4.0</div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  popup.document.close();
}

export const reportExporter = {
  downloadPDF,
  downloadExcel,
  downloadCSV,
  printReport
};

/** @deprecated Use reportExporter.printReport instead */
export const openPrintPreview = printReport;
