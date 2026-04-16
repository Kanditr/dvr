import { useState } from 'react';
import { buildComparisonRows } from '../utils/comparison';
import type { Task, ShipDoc } from '../data/mockData';
import type { VerificationType } from '../App';

const CF_DOC_TYPES: ShipDoc['type'][] = [
  'Shipping Advice',
  'Custom Invoice',
  'Packing List',
  'Shipping Instruction',
  'Letter of Credit',
];

const INSURANCE_DOC_TYPES: ShipDoc['type'][] = [
  'Draft Insurance',
  'Detail for Insurance Purpose',
];

const DRAFT_BL_DOC_TYPES: ShipDoc['type'][] = [
  'Draft B/L',
  'Shipping Particular',
];

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

function buildDocXPortDoc(task: Task, fields: string[], fieldNameMap: Record<string, string> = {}): ShipDoc {
  const entries = fields.map(f => {
    const docFieldName = fieldNameMap[f] ?? f;
    return { canonical: f, docFieldName, value: task.correctValues[f] ?? '' };
  });
  return {
    id: 'docxport-synthetic',
    type: 'DocXPort',
    fieldMapping: Object.fromEntries(entries.map(e => [e.canonical, e.docFieldName])),
    values: Object.fromEntries(entries.map(e => [e.docFieldName, e.value])),
  };
}

function getDocsForVerification(task: Task, verificationType: VerificationType): ShipDoc[] {
  if (verificationType === 'customFormality') {
    const cfFields = [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
    ];
    const cfDocs = task.documents.filter(d => CF_DOC_TYPES.includes(d.type));
    return [...cfDocs, buildDocXPortDoc(task, cfFields, CF_DOCXPORT_FIELD_NAMES)];
  }
  if (verificationType === 'insurance') {
    return task.documents.filter(d => INSURANCE_DOC_TYPES.includes(d.type));
  }
  if (verificationType === 'draftBL') {
    return task.documents.filter(d => DRAFT_BL_DOC_TYPES.includes(d.type));
  }
  if (verificationType === 'blDate') {
    const oblDoc = task.documents.find(d => d.type === 'Original B/L');
    return oblDoc
      ? [oblDoc, buildDocXPortDoc(task, ['GI Date', 'ETD Date', 'Manual Billing Date'])]
      : [buildDocXPortDoc(task, ['GI Date', 'ETD Date', 'Manual Billing Date'])];
  }
  return task.documents;
}

interface ComparisonTableProps {
  task: Task;
  verificationType: VerificationType;
}

export default function ComparisonTable({ task, verificationType }: ComparisonTableProps) {
  const [fieldFilter, setFieldFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const docs = getDocsForVerification(task, verificationType);
  const allRows = buildComparisonRows({ ...task, documents: docs });

  const uniqueFields = [...new Set(allRows.map(r => r.canonicalField))];

  const rows = allRows.filter(row => {
    if (fieldFilter && row.canonicalField !== fieldFilter) return false;
    if (statusFilter) {
      const label = row.rowStatus === 'match' ? 'Match' : 'Mismatch';
      if (label !== statusFilter) return false;
    }
    return true;
  });

  const hasActiveFilter = fieldFilter !== '' || statusFilter !== '';

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap bg-white" style={{ borderBottom: '1px solid var(--os-border)' }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--os-text-muted)' }}>Field</label>
          <div className="relative">
            <select
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded bg-white min-w-[160px]"
              style={{ border: '1px solid var(--os-border)', color: 'var(--os-text-primary)', outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--os-primary)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--os-border)'; }}
            >
              <option value="">All</option>
              {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <svg className="absolute right-2 top-2 w-3 h-3 pointer-events-none" style={{ color: 'var(--os-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--os-text-muted)' }}>Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded bg-white min-w-[120px]"
              style={{ border: '1px solid var(--os-border)', color: 'var(--os-text-primary)', outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--os-primary)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--os-border)'; }}
            >
              <option value="">All</option>
              <option value="Match">Match</option>
              <option value="Mismatch">Mismatch</option>
            </select>
            <svg className="absolute right-2 top-2 w-3 h-3 pointer-events-none" style={{ color: 'var(--os-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hasActiveFilter && (
          <button
            onClick={() => { setFieldFilter(''); setStatusFilter(''); }}
            className="self-end text-xs hover:underline pb-[3px]"
            style={{ color: 'var(--os-primary)' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#eef2f7', borderBottom: '1px solid var(--os-border)' }}>
              <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap w-36" style={{ color: 'var(--os-text-secondary)' }}>Field</th>
              {docs.map((doc) => (
                <th key={doc.id} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--os-text-secondary)' }}>
                  {doc.type}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap w-28" style={{ color: 'var(--os-text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.canonicalField} style={{ borderBottom: '1px solid var(--os-border)', backgroundColor: idx % 2 !== 0 ? 'var(--os-surface-hover)' : '#fff' }}>
                <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap align-top pt-4" style={{ color: 'var(--os-text-secondary)' }}>
                  {row.canonicalField}
                </td>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 align-top" style={{ backgroundColor: cell.isMatch ? 'var(--os-success-light)' : 'var(--os-warning-light)' }}>
                    <span className="block text-xs mb-0.5" style={{ color: 'var(--os-text-muted)' }}>{cell.originalFieldName}</span>
                    <span className="block text-sm font-medium" style={{ color: 'var(--os-text-primary)' }}>{cell.value}</span>
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                  {row.rowStatus === 'match' ? (
                    <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--os-success-light)', color: 'var(--os-success)' }}>Match</span>
                  ) : (
                    <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--os-warning-light)', color: 'var(--os-warning)' }}>Mismatch</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={docs.length + 2} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--os-text-muted)' }}>
                  No rows match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
