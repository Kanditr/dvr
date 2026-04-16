import type { TaskStatus, VerificationStatus } from '../data/mockData';
import type { VerificationType } from '../App';

const ALL_STATUSES: TaskStatus[] = ['Pending', 'Needs Attention', 'All Match', 'Approved', 'Rejected'];

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'All Matches', 'Approved', 'Needs Attention', 'Rejected', 'Pending Verification',
];

const TAB_FILTER_DEFS: { key: VerificationType; label: string }[] = [
  { key: 'customFormality', label: 'Custom Formality' },
  { key: 'insurance',       label: 'Draft Insurance' },
  { key: 'draftBL',         label: 'Draft B/L' },
  { key: 'blDate',          label: 'B/L Date' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 group"
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200`} style={{ backgroundColor: checked ? 'var(--os-primary)' : '#cbd5e1' }}>
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ml-0.5 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
      <span className="text-sm" style={{ color: checked ? 'var(--os-primary)' : 'var(--os-text-muted)' }}>{label}</span>
    </button>
  );
}

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: TaskStatus | 'All';
  onStatusChange: (v: TaskStatus | 'All') => void;
  tabFilters: Record<VerificationType, VerificationStatus | 'All'>;
  onTabFilterChange: (key: VerificationType, value: VerificationStatus | 'All') => void;
  onlyMyTasks: boolean;
  onOnlyMyTasksChange: (v: boolean) => void;
  autoApprove: boolean;
  onAutoApproveChange: (v: boolean) => void;
  onReset: () => void;
}

export default function TaskFilterBar({ search, onSearchChange, statusFilter, onStatusChange, tabFilters, onTabFilterChange, onlyMyTasks, onOnlyMyTasksChange, autoApprove, onAutoApproveChange, onReset }: TaskFilterBarProps) {
  const selectStyle = {
    border: '1px solid var(--os-border-input)',
    outline: 'none',
    color: 'var(--os-text-primary)',
    backgroundColor: 'var(--os-surface)',
  };

  return (
    <div className="px-3 sm:px-6 py-4" style={{ borderBottom: '1px solid var(--os-border)' }}>
      {/* Row 1: Search + Overall Status (always visible side by side on md+) */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        {/* Search */}
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--os-text-muted)' }}>Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--os-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by CI No. or assigned user..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded w-full"
              style={selectStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--os-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,104,235,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--os-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Overall Status */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--os-text-muted)' }}>Overall Status</label>
          <select
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value as TaskStatus | 'All')}
            className="px-3 py-2 text-sm rounded w-full sm:min-w-[140px]"
            style={selectStyle}
          >
            <option value="All">All</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Tab status filters — 2-col on mobile, wrap on larger */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-3">
        {TAB_FILTER_DEFS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--os-text-muted)' }}>{label}</label>
            <select
              value={tabFilters[key]}
              onChange={e => onTabFilterChange(key, e.target.value as VerificationStatus | 'All')}
              className="px-3 py-2 text-sm rounded w-full sm:min-w-[140px]"
              style={selectStyle}
            >
              <option value="All">All</option>
              {VERIFICATION_STATUSES.map(s => (
                <option key={s} value={s}>{s === 'Pending Verification' ? 'Pending Documents' : s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Row 3: Toggles + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={onlyMyTasks} onChange={onOnlyMyTasksChange} label="Only My Tasks" />
          <Toggle checked={autoApprove} onChange={onAutoApproveChange} label="Auto Approve" />
        </div>
        <button
          onClick={onReset}
          className="text-sm hover:underline"
          style={{ color: 'var(--os-primary)' }}
        >
          Reset Filter
        </button>
      </div>
    </div>
  );
}
