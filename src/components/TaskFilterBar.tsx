import { useState, useRef, useEffect } from 'react';
import type { VerificationStatus } from '../data/mockData';
import type { VerificationType } from '../App';

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Pending Verification', 'Attention', 'Match', 'Approved', 'Rejected',
];

const NO_PENDING_DOC_STATUSES: VerificationStatus[] = [
  'Attention', 'Match', 'Match with condition', 'Approved', 'Rejected', 'Incomplete',
];

const TAB_STATUSES: Record<VerificationType, VerificationStatus[]> = {
  customFormality: NO_PENDING_DOC_STATUSES,
  insurance: VERIFICATION_STATUSES,
  draftBL: VERIFICATION_STATUSES,
  blDate: VERIFICATION_STATUSES,
};

const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};

const TAB_FILTER_DEFS: { key: VerificationType; label: string }[] = [
  { key: 'customFormality', label: 'Custom Formality' },
  { key: 'insurance', label: 'Draft Insurance' },
  { key: 'draftBL', label: 'Draft B/L' },
  { key: 'blDate', label: 'Original B/L' },
];

function MultiSelectDropdown({
  options,
  value,
  onChange,
  labelMap,
}: {
  options: VerificationStatus[];
  value: VerificationStatus[] | 'All';
  onChange: (v: VerificationStatus[] | 'All') => void;
  labelMap: Record<VerificationStatus, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const selected = value === 'All' ? [] : value;
  const isAll = value === 'All' || selected.length === 0;
  const label = isAll
    ? 'All'
    : selected.length === 1
    ? labelMap[selected[0]]
    : `${selected.length} selected`;

  function toggle(status: VerificationStatus) {
    const next = selected.includes(status)
      ? selected.filter(s => s !== status)
      : [...selected, status];
    onChange(next.length === 0 ? 'All' : next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`px-3 py-2 text-sm border rounded focus:outline-none bg-white min-w-[140px] flex items-center justify-between gap-2 transition-colors ${
          !isAll ? 'border-[#0056b8] text-[#0056b8]' : 'border-gray-300 text-gray-700'
        }`}
      >
        <span className="truncate text-left">{label}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1">
          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={isAll}
              onChange={() => onChange('All')}
              className="w-3.5 h-3.5 rounded accent-[#0056b8]"
            />
            All
          </label>
          <div className="border-t border-gray-100 my-1" />
          {options.map(status => (
            <label
              key={status}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 select-none"
            >
              <input
                type="checkbox"
                checked={!isAll && selected.includes(status)}
                onChange={() => toggle(status)}
                className="w-3.5 h-3.5 rounded accent-[#0056b8]"
              />
              {labelMap[status]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  tabFilters: Record<VerificationType, VerificationStatus[] | 'All'>;
  onTabFilterChange: (key: VerificationType, value: VerificationStatus[] | 'All') => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onReset: () => void;
  showAllApproved: boolean;
  onToggleShowAllApproved: () => void;
  allApprovedCount: number;
  onUploadClick?: () => void;
}

export default function TaskFilterBar({ search, onSearchChange, tabFilters, onTabFilterChange, dateFrom, dateTo, onDateFromChange, onDateToChange, onReset, showAllApproved, onToggleShowAllApproved, allApprovedCount, onUploadClick }: TaskFilterBarProps) {
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
      <div className="flex items-end gap-4 flex-wrap">
        {/* Search */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[240px]">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by CI No. or assignee..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] w-full"
            />
          </div>
        </div>

        {/* Tab status filters — multi-select */}
        {TAB_FILTER_DEFS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <MultiSelectDropdown
              options={TAB_STATUSES[key]}
              value={tabFilters[key]}
              onChange={v => onTabFilterChange(key, v)}
              labelMap={VERIFICATION_STATUS_LABEL}
            />
          </div>
        ))}

        {/* All Approved toggle */}
        <button
          type="button"
          onClick={onToggleShowAllApproved}
          className={`flex items-center gap-1.5 h-[38px] px-2 text-sm rounded focus:outline-none transition-colors whitespace-nowrap ${
            showAllApproved
              ? 'text-[#0056b8] hover:bg-blue-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          {showAllApproved ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
          <span>{showAllApproved ? 'Show Approved' : 'Hide Approved'}</span>
        </button>

      </div>

      {/* Loading Date range + Reset — second row */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Loading Date</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">From</span>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    try { dateFromRef.current?.showPicker(); } catch { dateFromRef.current?.focus(); }
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={dateFrom ? dateFrom.split('-').reverse().join('/') : ''}
                    placeholder="dd/mm/yyyy"
                    className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white w-[110px] cursor-pointer"
                  />
                  <input
                    ref={dateFromRef}
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={e => onDateFromChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">To</span>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    try { dateToRef.current?.showPicker(); } catch { dateToRef.current?.focus(); }
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={dateTo ? dateTo.split('-').reverse().join('/') : ''}
                    placeholder="dd/mm/yyyy"
                    className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white w-[110px] cursor-pointer"
                  />
                  <input
                    ref={dateToRef}
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={e => onDateToChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          <button onClick={onReset} className="text-sm text-[#0056b8] hover:underline pb-[9px]">
            Reset Filter
          </button>
        </div>

        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="flex items-center gap-1.5 h-[38px] px-4 text-sm font-medium bg-[#0056b8] text-white rounded hover:bg-[#004a9f] transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 14v5h16v-5M12 3v12M7 8l5-5 5 5" />
            </svg>
            Upload Custom Formality
          </button>
        )}
      </div>
    </div>
  );
}
