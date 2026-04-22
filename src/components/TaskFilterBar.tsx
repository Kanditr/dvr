import type { TaskStatus, VerificationStatus } from '../data/mockData';
import type { VerificationType } from '../App';

const ALL_STATUSES: TaskStatus[] = ['Pending', 'Needs Attention', 'All Match', 'Approved', 'Rejected'];

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  'Pending':         'Pending',
  'Needs Attention': 'Needs Attention',
  'All Match':       'All Match',
  'Approved':        'Approved',
  'Rejected':        'Rejected',
};

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Pending Verification', 'Needs Attention', 'All Matches', 'Approved', 'Rejected',
];

const NO_PENDING_DOC_STATUSES: VerificationStatus[] = [
  'Needs Attention', 'All Matches', 'Approved', 'Rejected',
];

const TAB_STATUSES: Record<VerificationType, VerificationStatus[]> = {
  customFormality: NO_PENDING_DOC_STATUSES,
  insurance:       VERIFICATION_STATUSES,
  draftBL:         VERIFICATION_STATUSES,
  blDate:          VERIFICATION_STATUSES,
};

const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  'All Matches':          'All Matches',
  'Approved':             'Approved',
  'Needs Attention':      'Needs Attention',
  'Rejected':             'Rejected',
  'Pending Verification': 'Pending',
};

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
      <span className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${checked ? 'bg-[#0056b8]' : 'bg-gray-300'}`}>
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ml-0.5 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
      <span className={`text-sm ${checked ? 'text-[#0056b8]' : 'text-gray-500'} group-hover:text-gray-700`}>{label}</span>
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
  dateFrom: string;
  dateTo: string;
  minDate: string;
  maxDate: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onReset: () => void;
  onUploadCF?: () => void;
}

export default function TaskFilterBar({ search, onSearchChange, statusFilter, onStatusChange, tabFilters, onTabFilterChange, onlyMyTasks, onOnlyMyTasksChange, autoApprove, onAutoApproveChange, dateFrom, dateTo, minDate, maxDate, onDateFromChange, onDateToChange, onReset, onUploadCF }: TaskFilterBarProps) {
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
              placeholder="Search by CI No. or assigned user..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] w-full"
            />
          </div>
        </div>

        {/* Overall Status */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Overall Status</label>
          <select
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value as TaskStatus | 'All')}
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white min-w-[140px]"
          >
            <option value="All">All</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Tab status filters */}
        {TAB_FILTER_DEFS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <select
              value={tabFilters[key]}
              onChange={e => onTabFilterChange(key, e.target.value as VerificationStatus | 'All')}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white min-w-[140px]"
            >
              <option value="All">All</option>
              {TAB_STATUSES[key].map(s => (
                <option key={s} value={s}>{VERIFICATION_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Created Date range */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Created Date</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">From</span>
              <input
                type="date"
                value={dateFrom}
                min={minDate}
                max={dateTo || maxDate}
                onChange={e => onDateFromChange(e.target.value)}
                className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">To</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || minDate}
                max={maxDate}
                onChange={e => onDateToChange(e.target.value)}
                className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 pb-[2px]">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide invisible select-none">Options</label>
          <div className="flex items-center gap-4 py-2">
            <Toggle checked={onlyMyTasks} onChange={onOnlyMyTasksChange} label="Only My Tasks" />
            <Toggle checked={autoApprove} onChange={onAutoApproveChange} label="Auto Approve" />
          </div>
        </div>

        <button
          onClick={onReset}
          className="text-sm text-[#0056b8] hover:underline pb-[9px]"
        >
          Reset Filter
        </button>
        {onUploadCF && (
          <button
            onClick={onUploadCF}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#0056b8] px-3 py-1.5 rounded-md hover:bg-[#004a9f] transition-colors ml-auto pb-[9px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Upload Custom Formality
          </button>
        )}
      </div>
    </div>
  );
}
