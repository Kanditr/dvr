import { useState, useRef, useEffect } from 'react';
import { buildComparisonRows } from '../utils/comparison';
import type { Task, ShipDoc } from '../data/mockData';
import type { VerificationType } from '../App';

// Doc types that belong to Custom Formality (SI and LC are mutually exclusive per task)
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

// DocXPort field name mapping for the CF tab
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

// Synthesise a DocXPort column from the task's correctValues (source-of-truth reference)
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

// ── Column filter dropdown ──────────────────────────────────────────────────
interface ColumnFilterProps {
  colKey: string;
  label: string;
  allValues: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function ColumnFilter({ label, allValues, selected, onChange }: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const isFiltered = selected.length > 0 && selected.length < allValues.length;
  const allChecked = selected.length === 0 || selected.length === allValues.length;

  function toggle(val: string) {
    const current = selected.length === 0 ? [...allValues] : [...selected];
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    onChange(next.length === allValues.length ? [] : next);
  }

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-1 cursor-pointer select-none w-full"
      >
        <span>{label}</span>
        <svg
          className={`w-3 h-3 shrink-0 transition-opacity ${isFiltered ? 'opacity-100 text-[#0056b8]' : 'opacity-0 group-hover:opacity-100 text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[10rem] max-h-60 overflow-y-auto">
          <div className="p-1">
            <label className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => onChange(allChecked ? [] : allValues)}
                className="accent-[#0056b8]"
              />
              <span className="font-medium">(Select All)</span>
            </label>
            <div className="my-1 border-t border-gray-100" />
            {allValues.map(val => (
              <label key={val} className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.length === 0 || selected.includes(val)}
                  onChange={() => toggle(val)}
                  className="accent-[#0056b8]"
                />
                <span className="truncate max-w-[12rem]">{val || '—'}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface ComparisonTableProps {
  task: Task;
  verificationType: VerificationType;
}

export default function ComparisonTable({ task, verificationType }: ComparisonTableProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const docs = getDocsForVerification(task, verificationType);
  const allRows = buildComparisonRows({ ...task, documents: docs });

  function setFilter(key: string, values: string[]) {
    setColumnFilters(prev => ({ ...prev, [key]: values }));
  }

  function getUniqueValues(key: string): string[] {
    if (key === 'field') return [...new Set(allRows.map(r => r.canonicalField))];
    if (key === 'status') return ['Match', 'Mismatch'];
    const ci = parseInt(key.replace('doc-', ''));
    return [...new Set(allRows.map(r => r.cells[ci]?.value || '—'))];
  }

  const rows = allRows.filter(row => {
    const fieldFilter = columnFilters['field'];
    if (fieldFilter?.length && !fieldFilter.includes(row.canonicalField)) return false;

    for (let ci = 0; ci < row.cells.length; ci++) {
      const f = columnFilters[`doc-${ci}`];
      if (f?.length && !f.includes(row.cells[ci].value || '—')) return false;
    }

    const statusFilter = columnFilters['status'];
    const statusLabel = row.rowStatus === 'match' ? 'Match' : 'Mismatch';
    if (statusFilter?.length && !statusFilter.includes(statusLabel)) return false;

    return true;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36 group cursor-pointer">
              <ColumnFilter colKey="field" label="Field"
                allValues={getUniqueValues('field')}
                selected={columnFilters['field'] ?? []}
                onChange={v => setFilter('field', v)}
              />
            </th>
            {docs.map((doc, ci) => (
              <th key={doc.id} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-700 group cursor-pointer">
                <ColumnFilter colKey={`doc-${ci}`} label={doc.type}
                  allValues={getUniqueValues(`doc-${ci}`)}
                  selected={columnFilters[`doc-${ci}`] ?? []}
                  onChange={v => setFilter(`doc-${ci}`, v)}
                />
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28 group cursor-pointer">
              <ColumnFilter colKey="status" label="Status"
                allValues={getUniqueValues('status')}
                selected={columnFilters['status'] ?? []}
                onChange={v => setFilter('status', v)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.canonicalField} className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
              <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4">
                {row.canonicalField}
              </td>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 align-top ${cell.isMatch ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}
                >
                  <span className="block text-xs text-gray-500 mb-0.5">{cell.originalFieldName}</span>
                  <span className="block text-sm font-medium text-gray-900">{cell.value}</span>
                </td>
              ))}
              <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                {row.rowStatus === 'match' ? (
                  <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36]">
                    Match
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00]">
                    Mismatch
                  </span>
                )}
              </td>
            </tr>
          ))}
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
  );
}
