import ExcelJS from 'exceljs';
import type { Task, ShipDoc } from '../data/mockData';
import type { VerificationType } from '../App';
import { buildComparisonRows, getDocsForVerification } from './comparison';

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function formatDate(date: string): string {
  const parts = date.split(' ');
  if (parts.length !== 3) return date;
  const [day, mon, year] = parts;
  return `${day}/${MONTHS[mon] ?? mon}/${year}`;
}

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
  headerBg:   'FFD9ECF3',
  headerFg:   'FF1F4E6B',
  fieldBg:    'FFEFF6F9',
  altRowBg:   'FFF8FAFB',
  whiteBg:    'FFFFFFFF',
  bodyFg:     'FF374151',
  border:     'FFBFDBEA',
};

function thinBorder(color: string): Partial<ExcelJS.Border> {
  return { style: 'thin', color: { argb: color } };
}

const FULL_BORDER: Partial<ExcelJS.Borders> = {
  top: thinBorder(C.border), bottom: thinBorder(C.border),
  left: thinBorder(C.border), right: thinBorder(C.border),
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: C.headerFg }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
    cell.border = FULL_BORDER;
    cell.alignment = { vertical: 'top', wrapText: true };
  });
}

function styleDataRow(row: ExcelJS.Row, isAlt: boolean) {
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    const isFieldCol = colNum === 1;
    cell.font = { bold: isFieldCol, color: { argb: C.bodyFg }, size: 10 };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: isFieldCol ? C.fieldBg : isAlt ? C.altRowBg : C.whiteBg },
    };
    cell.border = FULL_BORDER;
    cell.alignment = { vertical: 'top', wrapText: true };
  });
}

async function writeAndDownload(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Verification');

  // freeze header row
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  rows.forEach((rowData, i) => {
    ws.addRow(rowData);
    styleDataRow(ws.getRow(i + 2), i % 2 !== 0);
  });

  // Auto column widths
  headers.forEach((_, ci) => {
    const col = ws.getColumn(ci + 1);
    const maxLen = Math.min(50, Math.max(14, ...[headers[ci], ...rows.map(r => String(r[ci] ?? ''))].map(v => v.length)));
    col.width = maxLen;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── BL Date tab ───────────────────────────────────────────────────────────────

function exportBlDateTab(task: Task, filename: string) {
  const obl = task.documents.find(d => d.type === 'Original B/L');
  const blDateRaw = obl ? (obl.values[obl.fieldMapping['B/L Date']] ?? '') : '';
  const blDate = formatDate(blDateRaw);

  const fieldRows = [
    { fieldName: 'GI Date',             valueRaw: task.correctValues['BLDXP_GI Date'] ?? '' },
    { fieldName: 'ETD Date',            valueRaw: task.correctValues['BLDXP_ETD Date'] ?? '' },
    { fieldName: 'Manual Billing Date', valueRaw: task.correctValues['BLDXP_Manual Billing Date'] ?? '' },
  ];

  const headers = ['Field', 'Original B/L (B/L Date)', 'DocXPort Field', 'DocXPort Value', 'Status'];
  const rows: (string | number)[][] = fieldRows.map(row => [
    'Date',
    blDate,
    row.fieldName,
    formatDate(row.valueRaw),
    blDateRaw === row.valueRaw ? 'Match' : 'Mismatch',
  ]);

  writeAndDownload(headers, rows, filename);
}

// ── Comparison tabs ───────────────────────────────────────────────────────────

function exportComparisonTab(task: Task, docs: ShipDoc[], filename: string) {
  const compRows = buildComparisonRows({ ...task, documents: docs });

  const headers = ['Field', ...docs.map(d => d.type), 'Status'];
  const rows: (string | number)[][] = compRows.map(row => [
    row.canonicalField,
    ...row.cells.map(cell => cell.isApplicable ? cell.value : '—'),
    row.rowStatus === 'match' ? 'Match' : 'Mismatch',
  ]);

  writeAndDownload(headers, rows, filename);
}


// ── Entry point ───────────────────────────────────────────────────────────────

export function exportVerificationTab(task: Task, verificationType: VerificationType) {
  const tabLabels: Record<VerificationType, string> = {
    customFormality: 'Custom_Formality',
    insurance: 'Draft_Insurance',
    draftBL: 'Draft_BL',
    blDate: 'BL_Date',
  };
  const filename = `${task.id}_${tabLabels[verificationType]}_Verification.xlsx`;

  if (verificationType === 'blDate') {
    exportBlDateTab(task, filename);
    return;
  }

  const docs = getDocsForVerification(task, verificationType);

  exportComparisonTab(task, docs, filename);
}
