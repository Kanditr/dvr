import type { TaskStatus } from '../data/mockData';

const ALL_STATUSES: TaskStatus[] = ['Pending', 'Needs Attention', 'All Match', 'Approved', 'Rejected'];

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: TaskStatus | 'All';
  onStatusChange: (v: TaskStatus | 'All') => void;
  onReset: () => void;
}

export default function TaskFilterBar({ search, onSearchChange, statusFilter, onStatusChange, onReset }: TaskFilterBarProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 flex-wrap">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by CI No. or assigned user..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] w-80"
        />
      </div>
      <select
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value as TaskStatus | 'All')}
        className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0056b8] bg-white"
      >
        <option value="All">All Status</option>
        {ALL_STATUSES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button
        onClick={onReset}
        className="text-sm text-[#0056b8] hover:underline"
      >
        Reset Filter
      </button>
    </div>
  );
}
