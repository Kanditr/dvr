import { useState, useRef, useEffect } from 'react';
import type { Task } from '../data/mockData';

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

interface BLDateTableProps {
  task: Task;
}

// ── Column filter dropdown ──────────────────────────────────────────────────
interface ColumnFilterProps {
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
export default function BLDateTable({ task }: BLDateTableProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const obl = task.documents.find(d => d.type === 'Original B/L');
  const blDateRaw = obl ? (obl.values[obl.fieldMapping['B/L Date']] ?? '') : '';
  const blDate = formatDate(blDateRaw);
  const hasData = blDateRaw !== '';

  const allRows = [
    { fieldName: 'GI Date',             valueRaw: task.correctValues['GI Date'] ?? '' },
    { fieldName: 'ETD Date',            valueRaw: task.correctValues['ETD Date'] ?? '' },
    { fieldName: 'Manual Billing Date', valueRaw: task.correctValues['Manual Billing Date'] ?? '' },
  ].map(row => ({ ...row, isMatch: blDateRaw === row.valueRaw, formatted: formatDate(row.valueRaw) }));

  function setFilter(key: string, values: string[]) {
    setColumnFilters(prev => ({ ...prev, [key]: values }));
  }

  function getUniqueValues(key: string): string[] {
    if (key === 'docxport') return [...new Set(allRows.map(r => r.fieldName))];
    if (key === 'obl') return [...new Set(allRows.map(() => blDate || '—'))];
    if (key === 'status') return ['Match', 'Mismatch'];
    return [];
  }

  const rows = allRows.filter(row => {
    const oblFilter = columnFilters['obl'];
    if (oblFilter?.length && !oblFilter.includes(blDate || '—')) return false;

    const dxFilter = columnFilters['docxport'];
    if (dxFilter?.length && !dxFilter.includes(row.fieldName)) return false;

    const statusFilter = columnFilters['status'];
    if (statusFilter?.length && !statusFilter.includes(row.isMatch ? 'Match' : 'Mismatch')) return false;

    return true;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36">
              Field
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap group cursor-pointer">
              <ColumnFilter label="Original B/L"
                allValues={getUniqueValues('obl')}
                selected={columnFilters['obl'] ?? []}
                onChange={v => setFilter('obl', v)}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap group cursor-pointer">
              <ColumnFilter label="DocXPort"
                allValues={getUniqueValues('docxport')}
                selected={columnFilters['docxport'] ?? []}
                onChange={v => setFilter('docxport', v)}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28 group cursor-pointer">
              <ColumnFilter label="Status"
                allValues={getUniqueValues('status')}
                selected={columnFilters['status'] ?? []}
                onChange={v => setFilter('status', v)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {!hasData && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-sm text-gray-400">
                No transaction found. B/L Date information has not yet been received from the source.
              </td>
            </tr>
          )}
          {hasData && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                No rows match the current filter.
              </td>
            </tr>
          )}
          {hasData && rows.map((row, idx) => (
            <tr
              key={row.fieldName}
              className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
            >
              <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4">
                Date
              </td>
              <td className={`px-4 py-3 align-top ${row.isMatch ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}>
                <span className="block text-xs text-gray-500 mb-0.5">B/L Date</span>
                <span className="block text-sm font-medium text-gray-900">{blDate || '—'}</span>
              </td>
              <td className={`px-4 py-3 align-top ${row.isMatch ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}>
                <span className="block text-xs text-gray-500 mb-0.5">{row.fieldName}</span>
                <span className="block text-sm font-medium text-gray-900">{row.formatted || '—'}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                {row.isMatch ? (
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
        </tbody>
      </table>
    </div>
  );
}
