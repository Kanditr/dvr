import { useState, useRef, useEffect } from 'react';
import type { Task, VerificationStatus } from '../data/mockData';
import { deriveOverallStatus } from '../data/mockData';
import type { UploadState } from './DocumentUploadGate';
import type { VerificationType } from '../App';

type SortKey = 'id' | 'assignedTo' | 'status';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-px">
      <svg className={`w-2 h-2 ${sortKey === col && sortDir === 'asc' ? 'text-gray-700' : 'text-gray-400'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg className={`w-2 h-2 ${sortKey === col && sortDir === 'desc' ? 'text-gray-700' : 'text-gray-400'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0H10z" />
      </svg>
    </span>
  );
}

const TAB_COLS: { key: VerificationType; label: string }[] = [
  { key: 'customFormality', label: 'Custom Formality' },
  { key: 'insurance', label: 'Draft Insurance' },
  { key: 'draftBL', label: 'Draft B/L' },
  { key: 'blDate', label: 'B/L Date' },
];


const STATUS_STYLE: Record<VerificationStatus, string> = {
  'All Matches': 'bg-[#ebf7ed] text-[#267d36]',
  'Approved': 'bg-[#e8f0fb] text-[#0056b8]',
  'Needs Attention': 'bg-[#fef5e5] text-[#ac6f00]',
  'Rejected': 'bg-[#faeaea] text-[#8c1d1d]',
  'Pending Verification': 'bg-gray-100 text-gray-500',
};


const STATUS_SHORT: Record<VerificationStatus, string> = {
  'All Matches': 'All Match',
  'Approved': 'Approved',
  'Needs Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
};

function getEffectiveTabStatus(
  task: Task,
  tabKey: VerificationType,
  taskUploadStates: Record<string, UploadState>
): VerificationStatus {
  if (tabKey === 'insurance' || tabKey === 'draftBL') {
    if ((taskUploadStates[tabKey] ?? 'idle') !== 'done') return 'Pending Verification';
  }
  if (tabKey === 'blDate') {
    const oblDoc = task.documents.find(d => d.type === 'Original B/L');
    const hasData = !!(oblDoc && oblDoc.values[oblDoc.fieldMapping['B/L Date']]);
    if (!hasData) return 'Pending Verification';
  }
  const status = task.verifications[tabKey];
  if ((tabKey === 'customFormality' || tabKey === 'blDate') && status === 'Pending Verification') {
    return 'Needs Attention';
  }
  return status;
}

interface TaskTableProps {
  tasks: Task[];
  uploadStates: Record<string, Record<string, UploadState>>;
  tabFilters: Record<VerificationType, VerificationStatus | 'All'>;
  onSelectTask: (taskId: string, tab: VerificationType) => void;
  page: number;
  onPageChange: (page: number) => void;
  isAdmin?: boolean;
  uploadedTaskIds?: Set<string>;
  removableTaskIds?: Set<string>;
  availableUsers?: string[];
  onAssignTask?: (taskId: string, email: string) => void;
  onRemoveTask?: (taskId: string) => void;
}

const PAGE_SIZE = 10;

export default function TaskTable({ tasks, uploadStates, tabFilters, onSelectTask, page, onPageChange, isAdmin, uploadedTaskIds = new Set(), removableTaskIds = new Set(), availableUsers = [], onAssignTask, onRemoveTask }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  function formatLastUpdate(raw: string | undefined): string {
    if (!raw) return '—';
    // If it's an ISO datetime (e.g. from new Date().toISOString()), extract date + HH:MM:SS
    if (raw.includes('T')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const time = d.toTimeString().slice(0, 8);  // HH:MM:SS
        return `${date} ${time}`;
      }
    }
    return raw; // plain date string — return as-is
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    onPageChange(1);
  }

  const processed = [...tasks]
    .filter(task =>
      TAB_COLS.every(({ key }) => {
        const f = tabFilters[key];
        return f === 'All' || getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {}) === f;
      })
    )
    .sort((a, b) => {
      // Uploaded tasks always appear at the top
      const aNew = uploadedTaskIds.has(a.id);
      const bNew = uploadedTaskIds.has(b.id);
      if (aNew !== bNew) return aNew ? -1 : 1;
      const av = sortKey === 'status' ? deriveOverallStatus(a.verifications)
        : sortKey === 'assignedTo' ? a.assignedTo : (a.correctValues['INVOICE NO.'] ?? a.id);
      const bv = sortKey === 'status' ? deriveOverallStatus(b.verifications)
        : sortKey === 'assignedTo' ? b.assignedTo : (b.correctValues['INVOICE NO.'] ?? b.id);
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginated = processed.slice(pageStart, pageStart + PAGE_SIZE);

  function getPageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (safePage >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages];
  }

  const thBase = 'px-4 py-2 text-left text-xs font-semibold text-gray-700';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className={`${thBase} px-6 cursor-pointer select-none whitespace-nowrap`} onClick={() => handleSort('id')}>
              <span className="flex items-center">Invoice No. <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className={`${thBase} px-6 cursor-pointer select-none whitespace-nowrap`} onClick={() => handleSort('assignedTo')}>
              <span className="flex items-center">Assignee <SortIcon col="assignedTo" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className={`${thBase} px-4 select-none whitespace-nowrap`}>
              Created Date
            </th>
            {TAB_COLS.map(({ key, label }) => (
              <th key={key} className={`${thBase} min-w-[140px] whitespace-nowrap`}>
                {label}
              </th>
            ))}
            <th className={`${thBase} px-4 select-none whitespace-nowrap`}>
              Last Update
            </th>
            {isAdmin && (
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 w-10">Delete</th>
            )}
            <th className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {paginated.map((task, idx) => (
            <tr
              key={task.id}
              className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
            >
              <td className="px-6 py-4 text-gray-800 font-medium whitespace-nowrap">
                {task.correctValues['INVOICE NO.'] ?? task.id}
              </td>
              <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                <select
                  value={task.assignedTo}
                  onChange={e => {
                    onAssignTask?.(task.id, e.target.value);
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 w-full max-w-[180px] cursor-pointer"
                >
                  {availableUsers.map(u => (
                    <option key={u || '__blank__'} value={u}>{u || '— unassigned —'}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                {task.createdDate || task.submittedDate}
              </td>
              {TAB_COLS.map(({ key }) => {
                const status = getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {});
                return (
                  <td
                    key={key}
                    className="px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => onSelectTask(task.id, key)}
                  >
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[status]}`}>
                      {STATUS_SHORT[status]}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                {formatLastUpdate(task.lastUpdate ?? task.submittedDate)}
              </td>
              {isAdmin && (
                <td
                  className="px-4 py-4 text-center cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }}
                  title="Delete this record"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </td>
              )}
              {removableTaskIds.has(task.id) && !isAdmin ? (
                <td
                  className="px-4 py-4 cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => onRemoveTask?.(task.id)}
                  title="Remove this task"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
              ) : (
                <td
                  className="px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => onSelectTask(task.id, 'customFormality')}
                >
                  <svg className="w-4 h-4 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </td>
              )}
            </tr>
          ))}
          {processed.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                No tasks match your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
        <span>
          Showing {processed.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, processed.length)} of {processed.length} tasks
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] px-2 py-1 rounded border transition-colors ${p === safePage
                  ? 'border-[#0056b8] bg-[#0056b8] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTaskToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Confirm Deletion</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveTask?.(taskToDelete);
                  setTaskToDelete(null);
                }}
                className="px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
