import * as XLSX from 'xlsx';
import type { Task, ShipDoc } from '../data/mockData';
import type { VerificationType } from '../App';
import { buildComparisonRows } from './comparison';

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

function exportBlDateTab(task: Task, filename: string) {
  const obl = task.documents.find(d => d.type === 'Original B/L');
  const blDateRaw = obl ? (obl.values[obl.fieldMapping['B/L Date']] ?? '') : '';
  const blDate = formatDate(blDateRaw);

  const rows = [
    { fieldName: 'GI Date',             valueRaw: task.correctValues['GI Date'] ?? '' },
    { fieldName: 'ETD Date',            valueRaw: task.correctValues['ETD Date'] ?? '' },
    { fieldName: 'Manual Billing Date', valueRaw: task.correctValues['Manual Billing Date'] ?? '' },
  ];

  const header = ['Field', 'Original B/L (B/L Date)', 'DocXPort Field', 'DocXPort Value', 'Status'];
  const data = [header, ...rows.map(row => [
    'Date',
    blDate || '—',
    row.fieldName,
    formatDate(row.valueRaw) || '—',
    blDateRaw === row.valueRaw ? 'Match' : 'Mismatch',
  ])];

  writeAndDownload(data, filename);
}

function exportComparisonTab(task: Task, docs: ShipDoc[], filename: string) {
  const rows = buildComparisonRows({ ...task, documents: docs });

  const docHeaders = docs.map(d => d.type);
  const header = ['Field', ...docHeaders, 'Status'];

  const data = [
    header,
    ...rows.map(row => [
      row.canonicalField,
      ...row.cells.map(cell => cell.originalFieldName ? `${cell.originalFieldName}: ${cell.value || '—'}` : '—'),
      row.rowStatus === 'match' ? 'Match' : 'Mismatch',
    ]),
  ];

  writeAndDownload(data, filename);
}

function writeAndDownload(data: (string | number)[][], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Bold the header row
  const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddr]) ws[cellAddr].s = { font: { bold: true } };
  }

  // Auto column widths
  const colWidths = data[0].map((_, ci) =>
    Math.min(50, Math.max(12, ...data.map(row => String(row[ci] ?? '').length)))
  );
  ws['!cols'] = colWidths.map(w => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Verification');
  XLSX.writeFile(wb, filename);
}

const CF_DOC_TYPES: ShipDoc['type'][] = ['Shipping Advice', 'Custom Invoice', 'Packing List', 'Shipping Instruction', 'Letter of Credit'];
const CF_DOCXPORT_FIELD_NAMES: Record<string, string> = {
  'PROFORMA INVOICE NO.': 'Reference Number',
  'Invoice no.': 'Commercial Invoice No',
  "Buyer's order No.": "Buyer's order No.",
  'etd <port>': 'Port of Loading (From)',
  'eta <port>': 'Port of Discharge / Port of Destination (To)',
  'product (line item)': 'Description of Goods',
  'quantity (line item)': 'quantity',
  'Quantity (Total)': 'Quantity (Sum of line item)',
};
const CF_FIELDS = Object.keys(CF_DOCXPORT_FIELD_NAMES);
const INSURANCE_DOC_TYPES: ShipDoc['type'][] = ['Draft Insurance', 'Detail for Insurance Purpose'];
const DRAFT_BL_DOC_TYPES: ShipDoc['type'][] = ['Draft B/L', 'Shipping Particular'];

function buildSyntheticDocXPort(task: Task, fields: string[], fieldNameMap: Record<string, string> = {}): ShipDoc {
  const entries = fields.map(f => ({ canonical: f, docFieldName: fieldNameMap[f] ?? f, value: task.correctValues[f] ?? '' }));
  return {
    id: 'docxport-synthetic',
    type: 'DocXPort',
    fieldMapping: Object.fromEntries(entries.map(e => [e.canonical, e.docFieldName])),
    values: Object.fromEntries(entries.map(e => [e.docFieldName, e.value])),
  };
}

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

  let docs: ShipDoc[];
  if (verificationType === 'customFormality') {
    docs = [...task.documents.filter(d => CF_DOC_TYPES.includes(d.type)), buildSyntheticDocXPort(task, CF_FIELDS, CF_DOCXPORT_FIELD_NAMES)];
  } else if (verificationType === 'insurance') {
    docs = task.documents.filter(d => INSURANCE_DOC_TYPES.includes(d.type));
  } else {
    docs = task.documents.filter(d => DRAFT_BL_DOC_TYPES.includes(d.type));
  }

  exportComparisonTab(task, docs, filename);
}
