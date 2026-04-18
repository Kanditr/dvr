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
  'INVOICE NO.':          'COMMERCIAL INVOICE NO.',
  'REF NO.':              'REFERENCE NO.',
  "BUYER'S ORDER NO.":    "BUYER'S ORDER NO.",
  'ETD PORT':             'PORT OF LOADING (FROM)',
  'ETA PORT':             'PORT OF DISCHARGE / PORT OF DESTINATION (TO)',
  'PAYMENT TERM':         'PAYMENT TERM',
  'PRODUCT LINE ITEM#1':  'DESCRIPTION OF GOODS',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'AMOUNT LINE ITEM#1':   'AMOUNT',
  'PRODUCT LINE ITEM#2':  'DESCRIPTION OF GOODS 2',
  'QUANTITY LINE ITEM#2': 'QUANTITY 2',
  'AMOUNT LINE ITEM#2':   'AMOUNT 2',
  'PRODUCT LINE ITEM#3':  'DESCRIPTION OF GOODS 3',
  'QUANTITY LINE ITEM#3': 'QUANTITY 3',
  'AMOUNT LINE ITEM#3':   'AMOUNT 3',
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
      'INVOICE NO.', 'REF NO.', "BUYER'S ORDER NO.", 'ETD PORT', 'ETA PORT',
      'PAYMENT TERM', 'PRODUCT LINE ITEM#1', 'QUANTITY LINE ITEM#1', 'AMOUNT LINE ITEM#1',
    ];
    for (let n = 2; task.correctValues[`PRODUCT LINE ITEM#${n}`]; n++) {
      cfFields.push(`PRODUCT LINE ITEM#${n}`, `QUANTITY LINE ITEM#${n}`, `AMOUNT LINE ITEM#${n}`);
    }
    cfFields.push(
      'TOTAL QUANTITY', 'TOTAL AMOUNT', 'FREIGHT', 'INCOTERMS',
      'TOTAL NET WEIGHT', 'TOTAL GROSS WEIGHT', 'MARKS & NOS',
    );
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
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar — fixed, never scrolls */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap bg-white shrink-0">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Field</label>
          <div className="relative">
            <select
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 min-w-[160px]"
            >
              <option value="">All</option>
              {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <svg className="absolute right-2 top-2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 min-w-[120px]"
            >
              <option value="">All</option>
              <option value="Match">Match</option>
              <option value="Mismatch">Mismatch</option>
            </select>
            <svg className="absolute right-2 top-2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hasActiveFilter && (
          <button
            onClick={() => { setFieldFilter(''); setStatusFilter(''); }}
            className="self-end text-xs text-[#0056b8] hover:underline pb-[3px]"
          >
            Reset
          </button>
        )}
      </div>

      {/* Scrollable table container — only this area scrolls */}
      <div className="overflow-auto flex-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36 sticky top-0 left-0 z-30 bg-[#d9ecf3]">Field</th>
            {docs.map((doc) => (
              <th key={doc.id} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-700 sticky top-0 z-10 bg-[#d9ecf3]">
                {doc.type}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28 sticky top-0 z-10 bg-[#d9ecf3]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowBg = idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white';
            return (
              <tr key={row.canonicalField} className={`border-b border-gray-200 ${rowBg}`}>
                <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4 sticky left-0 z-10 bg-white">
                  {row.canonicalField}
                </td>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-3 align-top ${!cell.isApplicable ? 'bg-gray-50' : cell.isMatch ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}>
                    <span className="block text-xs text-gray-500 mb-0.5">{cell.originalFieldName}</span>
                    <span className={`block text-sm font-medium ${!cell.isApplicable ? 'text-gray-300' : 'text-gray-900'}`}>
                      {cell.isApplicable ? cell.value : '—'}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                  {row.rowStatus === 'match' ? (
                    <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36]">Match</span>
                  ) : (
                    <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00]">Mismatch</span>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={docs.length + 2} className="px-4 py-8 text-center text-sm text-gray-400">
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
