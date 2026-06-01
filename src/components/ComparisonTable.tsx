import { useState, useRef, useEffect, useMemo } from 'react';
import { buildComparisonRows, getDocsForVerification } from '../utils/comparison';
import type { Task } from '../data/mockData';
import type { VerificationType } from '../App';

// ── Multi-select dropdown ──────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  minWidth?: string;
}

function MultiSelectDropdown({ label, options, selected, onChange, placeholder = 'All', minWidth = '160px' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  }

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-0.5" ref={ref}>
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="relative" style={{ minWidth }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between pl-3 pr-8 py-1.5 text-xs border rounded focus:outline-none bg-white text-left transition-colors ${open ? 'border-[#0056b8]' : 'border-gray-300'
            } ${selected.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
        >
          <span className="truncate">{displayText}</span>
        </button>
        <svg className="absolute right-2 top-2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 overflow-y-auto"
            style={{ minWidth, maxHeight: '260px' }}>
            <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
              <button type="button" onClick={() => onChange(options)} className="text-[10px] text-[#0056b8] hover:underline">Select all</button>
              <button type="button" onClick={() => onChange([])} className="text-[10px] text-gray-400 hover:text-gray-600 hover:underline">Clear</button>
            </div>
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-[#0056b8] w-3 h-3 shrink-0" />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field edit history (inline navigation) ────────────────────────────────


function HistoryCellContent({
  history,
  currentValue,
  isEdited,
  isReadOnly,
  isApplicable,
  originalFieldName,
  onSave,
  isMatch,
}: {
  history: Array<{ value: string; timestamp: string }>;
  currentValue: string;
  isEdited: boolean;
  isReadOnly?: boolean;
  isApplicable: boolean;
  originalFieldName: string;
  onSave: (val: string) => void;
  isMatch: boolean;
}) {
  // null = viewing current value; number = index into history (0 = system-original snapshot)
  const [viewIdx, setViewIdx] = useState<number | null>(null);

  const isAtCurrent = viewIdx === null;
  const isViewingSystemOriginal = viewIdx === 0; // v1 = pre-first-edit value from system
  const canGoOlder = isAtCurrent ? history.length > 0 : viewIdx > 0;
  const canGoNewer = !isAtCurrent;
  const total = history.length + 1;

  function goOlder() {
    if (isAtCurrent) setViewIdx(history.length - 1);
    else setViewIdx(i => Math.max(0, (i ?? 0) - 1));
  }

  function goNewer() {
    if (viewIdx === history.length - 1) setViewIdx(null);
    else setViewIdx(i => (i ?? 0) + 1);
  }

  // Purple only for manually-edited states; revert to green/yellow when viewing system original
  const cellBg = isEdited && !isViewingSystemOriginal
    ? 'bg-[#ede9fe]'
    : !isApplicable
      ? 'bg-gray-50'
      : isMatch
        ? 'bg-[#ebf7ed]'
        : 'bg-[#fef5e5]';

  const navCls = (enabled: boolean) =>
    `text-sm font-bold leading-none px-0.5 transition-colors ${enabled
      ? 'text-violet-500 hover:text-violet-700 cursor-pointer'
      : 'text-violet-300 cursor-not-allowed'}`;

  const versionNum = isAtCurrent ? total : viewIdx! + 1;

  return (
    <td className={`px-4 py-3 align-top ${cellBg}`}>
      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
        <span className="text-xs text-gray-500">{originalFieldName}</span>
        {isEdited && (
          <span className="inline-flex items-center gap-0.5 ml-1">
            <span className="text-[10px] font-medium text-violet-500">edited</span>
            <button type="button" onClick={goOlder} disabled={!canGoOlder} className={navCls(canGoOlder)}>&lt;</button>
            <span className="text-[10px] text-violet-400 tabular-nums">v{versionNum}/{total}</span>
            <button type="button" onClick={goNewer} disabled={!canGoNewer} className={navCls(canGoNewer)}>&gt;</button>
          </span>
        )}
      </div>

      {!isAtCurrent && history[viewIdx!] ? (
        <p className="text-sm font-medium text-gray-900 break-words">
          {history[viewIdx!].value || <span className="text-gray-300">—</span>}
        </p>
      ) : (
        <EditableValue
          value={currentValue}
          isApplicable={isApplicable}
          isReadOnly={isReadOnly}
          onSave={onSave}
        />
      )}
    </td>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface ComparisonTableProps {
  task: Task;
  verificationType: VerificationType;
  onUpdateTask: (task: Task) => void;
  isReadOnly?: boolean;
  activeRevision?: number;
}

const STATUS_OPTIONS = ['Match', 'Mismatch'];

function EditableValue({ value, onSave, isApplicable, isReadOnly }: { value: string, onSave: (v: string) => void, isApplicable: boolean, isReadOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const initialValueRef = useRef(value);
  const committedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setTempValue(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  if (!isApplicable && isReadOnly) return <span className="text-gray-300">—</span>;

  return (
    <input
      ref={inputRef}
      readOnly={isReadOnly || !editing}
      value={editing ? tempValue : value}
      placeholder={!isApplicable ? '—' : ''}
      onChange={e => setTempValue(e.target.value)}
      onClick={() => {
        if (isReadOnly || editing) return;
        committedRef.current = false;
        initialValueRef.current = value;
        setEditing(true);
      }}
      onBlur={() => {
        if (!editing) return;
        if (!committedRef.current) { setEditing(false); if (tempValue !== initialValueRef.current) onSave(tempValue); }
        committedRef.current = false;
      }}
      onKeyDown={e => {
        if (!editing) return;
        if (e.key === 'Enter') { committedRef.current = true; setEditing(false); if (tempValue !== initialValueRef.current) onSave(tempValue); }
        if (e.key === 'Escape') { setEditing(false); setTempValue(initialValueRef.current); }
      }}
      className={`block w-full text-sm font-medium rounded px-1 py-0.5 outline-none transition-colors placeholder:text-gray-300 ${
        editing
          ? 'border border-[#0056b8] bg-white text-gray-900 cursor-text'
          : isReadOnly
            ? 'border border-transparent bg-transparent text-gray-900 cursor-default'
            : 'border border-transparent bg-transparent text-gray-900 cursor-text hover:bg-black/5'
      }`}
    />
  );
}

function StatusToggle({ status, onChange, isReadOnly }: { status: 'match' | 'mismatch', onChange: (s: 'match' | 'mismatch') => void, isReadOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && !isReadOnly) {
    return (
      <select
        autoFocus
        value={status}
        onChange={(e) => { onChange(e.target.value as 'match' | 'mismatch'); setIsEditing(false); }}
        onBlur={() => setIsEditing(false)}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 cursor-pointer"
      >
        <option value="match">Match</option>
        <option value="mismatch">Mismatch</option>
      </select>
    );
  }

  if (status === 'match') {
    return (
      <button onClick={() => !isReadOnly && setIsEditing(true)} disabled={isReadOnly}
        className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#d4ecd8] cursor-pointer'}`}>
        Match
      </button>
    );
  }
  return (
    <button onClick={() => !isReadOnly && setIsEditing(true)} disabled={isReadOnly}
      className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#faeed6] cursor-pointer'}`}>
      Mismatch
    </button>
  );
}

export default function ComparisonTable({ task, verificationType, onUpdateTask, isReadOnly, activeRevision }: ComparisonTableProps) {
  const [fieldFilter, setFieldFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const docs = getDocsForVerification(task, verificationType);
  const allRows = buildComparisonRows({ ...task, documents: docs }, verificationType);

  const frozenMatches = useMemo(() => {
    const matches: Record<string, boolean> = {};
    allRows.forEach(row => {
      row.cells.forEach((cell, ci) => {
        const cDocId = docs[ci].id;
        const key = `${verificationType}:${row.canonicalField}:${cDocId}`;
        matches[key] = task.cellStatusOverrides?.[key] ?? cell.isMatch;
      });
    });
    return matches;
  }, [task.id, verificationType, docs.map(d => d.id).join(','), task.cellStatusOverrides, activeRevision]);

  const uniqueFields = [...new Set(allRows.map(r => r.canonicalField))];

  const rows = allRows.filter(row => {
    if (fieldFilter.length > 0 && !fieldFilter.includes(row.canonicalField)) return false;
    if (statusFilter.length > 0) {
      const label = row.rowStatus === 'match' ? 'Match' : 'Mismatch';
      if (!statusFilter.includes(label)) return false;
    }
    return true;
  });

  function handleSave(docId: string, docType: string, canonicalField: string, originalFieldNameRaw: string, newValue: string) {
    if (isReadOnly) return;
    const originalFieldName = originalFieldNameRaw || canonicalField;

    // Capture old value before update
    const oldRowIdx = allRows.findIndex(r => r.canonicalField === canonicalField);
    const oldCellIdx = docs.findIndex(d => d.id === docId);
    const oldValue = oldRowIdx >= 0 && oldCellIdx >= 0 ? (allRows[oldRowIdx].cells[oldCellIdx]?.value ?? '') : '';

    const editKey = `${verificationType}:${canonicalField}:${docId}`;
    const now = new Date().toISOString();

    const prevHistory = task.fieldEditHistory?.[editKey] ?? [];
    // The "original" value is whatever was in the cell before the very first edit
    const originalValue = prevHistory.length > 0 ? prevHistory[0].value : oldValue;

    const nextEditedCells: Record<string, true> = { ...(task.manuallyEditedCells ?? {}) };
    const nextFieldEditHistory: Record<string, Array<{ value: string; timestamp: string }>> = { ...(task.fieldEditHistory ?? {}) };

    if (newValue === originalValue) {
      // Restored back to original — clear edited marker and full history for this cell
      delete nextEditedCells[editKey];
      delete nextFieldEditHistory[editKey];
    } else {
      nextEditedCells[editKey] = true;
      nextFieldEditHistory[editKey] = [...prevHistory, { value: oldValue, timestamp: now }];
    }

    const currentOverride = task.fieldStatusOverrides?.[`${verificationType}:${canonicalField}`];
    let nextOverrides = task.fieldStatusOverrides ?? {};
    if (!currentOverride) {
      const row = rows.find(r => r.canonicalField === canonicalField);
      if (row) nextOverrides = { ...nextOverrides, [`${verificationType}:${canonicalField}`]: row.rowStatus };
    }

    let nextCellOverrides = task.cellStatusOverrides ?? {};
    const row = rows.find(r => r.canonicalField === canonicalField);
    if (row) {
      row.cells.forEach((cell, ci) => {
        const cDocId = docs[ci].id;
        const key = `${verificationType}:${canonicalField}:${cDocId}`;
        if (nextCellOverrides[key] === undefined) nextCellOverrides[key] = cell.isMatch;
      });
    }

    if (docType === 'DocXPort') {
      const nextCorrectValues = { ...task.correctValues, [`DOCXPORT_${canonicalField}`]: newValue };
      onUpdateTask({ ...task, correctValues: nextCorrectValues, fieldStatusOverrides: nextOverrides, cellStatusOverrides: nextCellOverrides, manuallyEditedCells: nextEditedCells, fieldEditHistory: nextFieldEditHistory });
    } else {
      const nextDocs = task.documents.map(d => {
        if (d.id !== docId) return d;
        return { ...d, values: { ...d.values, [originalFieldName]: newValue } };
      });
      onUpdateTask({ ...task, documents: nextDocs, fieldStatusOverrides: nextOverrides, cellStatusOverrides: nextCellOverrides, manuallyEditedCells: nextEditedCells, fieldEditHistory: nextFieldEditHistory });
    }
  }

  function handleToggleStatus(canonicalField: string, nextStatus: 'match' | 'mismatch') {
    const key = `${verificationType}:${canonicalField}`;
    const nextOverrides = { ...task.fieldStatusOverrides, [key]: nextStatus };
    onUpdateTask({ ...task, fieldStatusOverrides: nextOverrides });
  }

  const hasActiveFilter = fieldFilter.length > 0 || statusFilter.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap bg-white shrink-0">
        <MultiSelectDropdown label="Field" options={uniqueFields} selected={fieldFilter} onChange={setFieldFilter} placeholder="All" minWidth="180px" />
        <MultiSelectDropdown label="Status" options={STATUS_OPTIONS} selected={statusFilter} onChange={setStatusFilter} placeholder="All" minWidth="130px" />
        {hasActiveFilter && (
          <button onClick={() => { setFieldFilter([]); setStatusFilter([]); }} className="self-end text-xs text-[#0056b8] hover:underline pb-[3px]">Reset</button>
        )}
      </div>

      <div className="overflow-auto flex-1">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr className="bg-[#d9ecf3] border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36 sticky top-0 left-0 z-30 bg-[#d9ecf3]">Field</th>
              {docs.map((doc) => (
                <th key={doc.id} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-700 sticky top-0 z-10 bg-[#d9ecf3]">{doc.type}</th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28 sticky top-0 z-10 bg-[#d9ecf3]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white';
              return (
                <tr key={row.canonicalField} className={`border-b border-gray-200 ${rowBg}`}>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4 sticky left-0 z-10 bg-inherit">
                    {row.canonicalField}
                  </td>
                  {row.cells.map((cell, ci) => {
                    const doc = docs[ci];
                    const editKey = `${verificationType}:${row.canonicalField}:${doc.id}`;
                    const isEdited = !!task.manuallyEditedCells?.[editKey];
                    const history = task.fieldEditHistory?.[editKey] ?? [];
                    const isMatch = frozenMatches[`${verificationType}:${row.canonicalField}:${doc.id}`] ?? false;
                    return (
                      <HistoryCellContent
                        key={ci}
                        history={history}
                        currentValue={cell.value}
                        isEdited={isEdited}
                        isReadOnly={isReadOnly}
                        isApplicable={cell.isApplicable}
                        originalFieldName={cell.originalFieldName}
                        onSave={(val) => handleSave(doc.id, doc.type, row.canonicalField, cell.originalFieldName, val)}
                        isMatch={isMatch}
                      />
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                    <StatusToggle status={row.rowStatus} onChange={(next) => handleToggleStatus(row.canonicalField, next)} isReadOnly={isReadOnly} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={docs.length + 2} className="px-4 py-8 text-center text-sm text-gray-400">No rows match the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
