import { useState, useEffect, useRef } from 'react';
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
  onUpdateTask: (task: Task) => void;
  isReadOnly?: boolean;
}

function EditableValue({ value, onSave, isReadOnly, emptyDisplay = '' }: { value: string, onSave: (v: string) => void, isReadOnly?: boolean, emptyDisplay?: string }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const initialValueRef = useRef(value);
  const [originalValue] = useState(value);
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

  const isEdited = value !== originalValue;

  return (
    <div className="relative group/edit">
      <input
        ref={inputRef}
        readOnly={isReadOnly || !editing}
        value={editing ? tempValue : value}
        placeholder={emptyDisplay}
        onChange={e => setTempValue(e.target.value)}
        onClick={() => {
          if (isReadOnly || editing) return;
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
      {isEdited && !isReadOnly && !editing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setTempValue(originalValue); onSave(originalValue); }}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-[#0056b8] hover:bg-blue-50 transition-colors opacity-0 group-hover/edit:opacity-100"
          title="Undo edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

function DocXPortHistoryCell({
  history,
  currentValue,
  isEdited,
  isReadOnly,
  fieldName,
  onSave,
}: {
  history: Array<{ value: string; timestamp: string }>;
  currentValue: string;
  isEdited: boolean;
  isReadOnly?: boolean;
  fieldName: string;
  onSave: (val: string) => void;
}) {
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const isAtCurrent = viewIdx === null;
  const isViewingSystemOriginal = viewIdx === 0;
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

  const cellBg = isEdited && !isViewingSystemOriginal ? 'bg-[#ede9fe]' : 'bg-gray-50';
  const navCls = (enabled: boolean) =>
    `text-sm font-bold leading-none px-0.5 transition-colors ${enabled
      ? 'text-violet-500 hover:text-violet-700 cursor-pointer'
      : 'text-violet-300 cursor-not-allowed'}`;
  const versionNum = isAtCurrent ? total : viewIdx! + 1;

  return (
    <td className={`px-4 py-3 align-top ${cellBg}`}>
      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
        <span className="text-xs text-gray-500">{fieldName}</span>
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
        <EditableValue value={currentValue} isReadOnly={isReadOnly} onSave={onSave} emptyDisplay="—" />

      )}
    </td>
  );
}

function StatusToggle({ status, onChange, isReadOnly }: { status: 'match' | 'mismatch', onChange: (s: 'match' | 'mismatch') => void, isReadOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && !isReadOnly) {
    return (
      <select
        autoFocus
        value={status}
        onChange={(e) => {
          onChange(e.target.value as 'match' | 'mismatch');
          setIsEditing(false);
        }}
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
      <button
        onClick={() => !isReadOnly && setIsEditing(true)}
        disabled={isReadOnly}
        className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#d4ecd8] cursor-pointer'}`}
      >
        Match
      </button>
    );
  }
  return (
    <button
      onClick={() => !isReadOnly && setIsEditing(true)}
      disabled={isReadOnly}
      className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#faeed6] cursor-pointer'}`}
    >
      Mismatch
    </button>
  );
}

function DashStatusToggle({ override, onChange, isReadOnly }: { override: 'match' | 'mismatch' | undefined, onChange: (s: 'match' | 'mismatch') => void, isReadOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && !isReadOnly) {
    return (
      <select
        autoFocus
        value={override ?? ''}
        onChange={e => { onChange(e.target.value as 'match' | 'mismatch'); setIsEditing(false); }}
        onBlur={() => setIsEditing(false)}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 cursor-pointer"
      >
        <option value="" disabled>Select...</option>
        <option value="match">Match</option>
        <option value="mismatch">Mismatch</option>
      </select>
    );
  }

  if (override === 'match') return (
    <button onClick={() => !isReadOnly && setIsEditing(true)} disabled={isReadOnly}
      className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#d4ecd8] cursor-pointer'}`}>
      Match
    </button>
  );
  if (override === 'mismatch') return (
    <button onClick={() => !isReadOnly && setIsEditing(true)} disabled={isReadOnly}
      className={`inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00] focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:bg-[#faeed6] cursor-pointer'}`}>
      Mismatch
    </button>
  );
  return (
    <button onClick={() => !isReadOnly && setIsEditing(true)} disabled={isReadOnly}
      className={`text-gray-300 px-1 h-6 text-sm focus:outline-none ${isReadOnly ? 'cursor-default' : 'hover:text-gray-500 cursor-pointer'}`}>
      —
    </button>
  );
}

export default function BLDateTable({ task, onUpdateTask, isReadOnly }: BLDateTableProps) {
  const [fieldFilter, setFieldFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const obl = task.documents.find(d => d.type === 'Original B/L');
  const blDateRaw = obl ? (obl.values[obl.fieldMapping['B/L Date']] ?? '') : '';
  const hasData = blDateRaw !== '';

  const allRows = [
    { fieldName: 'GI Date', valueRaw: task.correctValues['GI Date'] ?? '' },
    { fieldName: 'ETD Date', valueRaw: task.correctValues['ETD Date'] ?? '' },
    { fieldName: 'Manual Billing Date', valueRaw: task.correctValues['Manual Billing Date'] ?? '' },
  ].map(row => {
    const computedStatus = blDateRaw === row.valueRaw ? 'match' : 'mismatch';
    const rawOverride = task.fieldStatusOverrides?.[`blDate:${row.fieldName}`] as 'match' | 'mismatch' | undefined;
    const isMatch = (rawOverride ?? computedStatus) === 'match';
    return { ...row, isMatch, computedStatus, overriddenStatus: rawOverride ?? computedStatus, rawOverride };
  });

  const uniqueFields = allRows.map(r => r.fieldName);

  const rows = allRows.filter(row => {
    if (fieldFilter && row.fieldName !== fieldFilter) return false;
    if (statusFilter) {
      const label = row.isMatch ? 'Match' : 'Mismatch';
      if (label !== statusFilter) return false;
    }
    return true;
  });

  function handleSaveBLDate(newValue: string) {
    if (isReadOnly || !obl) return;

    // Lock all current statuses before modifying the date
    let nextOverrides = task.fieldStatusOverrides ?? {};
    allRows.forEach(row => {
      const key = `blDate:${row.fieldName}`;
      if (!nextOverrides[key]) {
        nextOverrides[key] = row.overriddenStatus;
      }
    });

    const fieldName = obl.fieldMapping['B/L Date'];
    const nextDocs = task.documents.map(d => {
      if (d.id !== obl.id) return d;
      return {
        ...d,
        values: { ...d.values, [fieldName]: newValue }
      };
    });
    onUpdateTask({ ...task, documents: nextDocs, fieldStatusOverrides: nextOverrides });
  }

  function handleSaveCorrectValue(fieldName: string, newValue: string) {
    if (isReadOnly) return;

    const editKey = `blDate:${fieldName}`;
    const now = new Date().toISOString();
    const oldValue = task.correctValues[fieldName] ?? '';

    const prevHistory = task.fieldEditHistory?.[editKey] ?? [];
    const originalValue = prevHistory.length > 0 ? prevHistory[0].value : oldValue;

    const nextEditedCells: Record<string, true> = { ...(task.manuallyEditedCells ?? {}) };
    const nextFieldEditHistory: Record<string, Array<{ value: string; timestamp: string }>> = { ...(task.fieldEditHistory ?? {}) };

    if (newValue === originalValue) {
      delete nextEditedCells[editKey];
      delete nextFieldEditHistory[editKey];
    } else {
      nextEditedCells[editKey] = true;
      nextFieldEditHistory[editKey] = [...prevHistory, { value: oldValue, timestamp: now }];
    }

    let nextOverrides = { ...(task.fieldStatusOverrides ?? {}) };
    allRows.forEach(row => {
      const key = `blDate:${row.fieldName}`;
      if (!nextOverrides[key]) nextOverrides[key] = row.overriddenStatus;
    });

    const nextCorrectValues = { ...task.correctValues, [fieldName]: newValue };
    onUpdateTask({ ...task, correctValues: nextCorrectValues, fieldStatusOverrides: nextOverrides, manuallyEditedCells: nextEditedCells, fieldEditHistory: nextFieldEditHistory });
  }

  function handleSaveDocXPort(fieldName: string, newValue: string) {
    if (isReadOnly) return;
    const editKey = `blDate_docxport:${fieldName}`;
    const now = new Date().toISOString();
    const storageKey = `BLDXP_${fieldName}`;
    const oldValue = task.correctValues[storageKey] ?? '';
    const prevHistory = task.fieldEditHistory?.[editKey] ?? [];
    const originalValue = prevHistory.length > 0 ? prevHistory[0].value : oldValue;
    const nextEditedCells: Record<string, true> = { ...(task.manuallyEditedCells ?? {}) };
    const nextFieldEditHistory: Record<string, Array<{ value: string; timestamp: string }>> = { ...(task.fieldEditHistory ?? {}) };
    if (newValue === originalValue) {
      delete nextEditedCells[editKey];
      delete nextFieldEditHistory[editKey];
    } else {
      nextEditedCells[editKey] = true;
      nextFieldEditHistory[editKey] = [...prevHistory, { value: oldValue, timestamp: now }];
    }
    const nextCorrectValues = { ...task.correctValues, [storageKey]: newValue };
    onUpdateTask({ ...task, correctValues: nextCorrectValues, manuallyEditedCells: nextEditedCells, fieldEditHistory: nextFieldEditHistory });
  }

  function handleToggleStatus(fieldName: string, nextStatus: 'match' | 'mismatch') {
    const nextOverrides = { ...task.fieldStatusOverrides, [`blDate:${fieldName}`]: nextStatus };
    onUpdateTask({ ...task, fieldStatusOverrides: nextOverrides });
  }

  const hasActiveFilter = fieldFilter !== '' || statusFilter !== '';

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap bg-white">
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

      {/* Table */}
      <div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#d9ecf3] border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36">Field</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Original B/L</th>
              {<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">DocXPort</th>}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28">Status</th>
            </tr>
          </thead>
          <tbody>
            {!hasData && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-sm text-gray-400">
                  No transaction found. Original B/L information has not yet been received from the source.
                </td>
              </tr>
            )}
            {hasData && rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                  No rows match the current filter.
                </td>
              </tr>
            )}
            {hasData && rows.map((row, idx) => (
              <tr key={row.fieldName} className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4">
                  {row.fieldName}
                </td>
                <td className="px-4 py-3 align-top bg-[#ebf7ed]">
                  <span className="block text-xs text-gray-500 mb-0.5">B/L Date</span>
                  <EditableValue
                    value={blDateRaw}
                    isReadOnly={isReadOnly}
                    onSave={handleSaveBLDate}
                  />
                </td>

                <DocXPortHistoryCell
                  history={task.fieldEditHistory?.[`blDate_docxport:${row.fieldName}`] ?? []}
                  currentValue={task.correctValues[`BLDXP_${row.fieldName}`] ?? ''}
                  isEdited={!!task.manuallyEditedCells?.[`blDate_docxport:${row.fieldName}`]}
                  isReadOnly={isReadOnly}
                  fieldName={row.fieldName}
                  onSave={(val) => handleSaveDocXPort(row.fieldName, val)}
                />

                <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                  <DashStatusToggle
                    override={row.rawOverride}
                    onChange={(next) => handleToggleStatus(row.fieldName, next)}
                    isReadOnly={isReadOnly}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
