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
  { key: 'blDate', label: 'Original B/L' },
];


const STATUS_STYLE: Record<VerificationStatus, string> = {
  'Match': 'bg-[#ebf7ed] text-[#267d36]',
  'Match with condition': 'bg-[#e0f5f5] text-[#0e7c7c]',
  'Approved': 'bg-[#e8f0fb] text-[#0056b8]',
  'Attention': 'bg-[#fef5e5] text-[#ac6f00]',
  'Rejected': 'bg-[#faeaea] text-[#8c1d1d]',
  'Pending Verification': 'bg-gray-100 text-gray-500',
  'Incomplete': 'bg-[#faeaea] text-[#8c1d1d]',
};


const STATUS_SHORT: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};

function getEffectiveTabStatus(
  task: Task,
  tabKey: VerificationType,
  taskUploadStates: Record<string, UploadState>
): VerificationStatus {
  if (tabKey === 'customFormality' && task.correctValues['CF_MISSING_DOCS']) return 'Incomplete';
  if (tabKey === 'insurance' || tabKey === 'draftBL' || tabKey === 'blDate') {
    if ((taskUploadStates[tabKey] ?? 'idle') !== 'done') return 'Pending Verification';
  }
  const status = task.verifications[tabKey];
  if ((tabKey === 'customFormality' || tabKey === 'blDate') && status === 'Pending Verification') {
    return 'Attention';
  }
  return status;
}

interface TaskTableProps {
  tasks: Task[];
  uploadStates: Record<string, Record<string, UploadState>>;
  tabFilters: Record<VerificationType, VerificationStatus[] | 'All'>;
  onSelectTask: (taskId: string, tab: VerificationType) => void;
  page: number;
  onPageChange: (page: number) => void;
  isAdmin?: boolean;
  uploadedTaskIds?: Set<string>;
  removableTaskIds?: Set<string>;
  availableUsers?: string[];
  onAssignTask?: (taskId: string, email: string) => void;
  onRemoveTask?: (taskId: string) => void;
  firstReceivedDates?: Record<string, string>;
}

const PAGE_SIZE = 20;

export default function TaskTable({ tasks, uploadStates, tabFilters, onSelectTask, page, onPageChange, isAdmin, uploadedTaskIds = new Set(), removableTaskIds = new Set(), availableUsers = [], onAssignTask, onRemoveTask, firstReceivedDates = {} }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  function formatLastModified(raw: string | undefined): string {
    if (!raw) return '—';
    if (raw.includes('T')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const time = d.toTimeString().slice(0, 5);  // HH:MM
        return `${date} ${time}`;
      }
    }
    return raw;
  }

  function formatFirstReceivedDate(raw: string | undefined): string {
    if (!raw) return '—';
    return raw.slice(0, 10); // YYYY-MM-DD
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
        if (f === 'All' || f.length === 0) return true;
        return f.includes(getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {}));
      })
    )
    .sort((a, b) => {
      // Uploaded tasks always appear at the top
      const aNew = uploadedTaskIds.has(a.id);
      const bNew = uploadedTaskIds.has(b.id);
      if (aNew !== bNew) return aNew ? -1 : 1;
      // Among new uploads, sort by lastUpdate descending
      if (aNew && bNew) {
        const ad = new Date(a.lastUpdate || a.submittedDate).getTime();
        const bd = new Date(b.lastUpdate || b.submittedDate).getTime();
        return bd - ad;
      }
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

  const thBase = 'px-4 py-2 text-left text-xs font-semibold text-gray-700 sticky top-0 z-20 bg-[#d9ecf3] shadow-[0_1px_0_rgba(0,0,0,0.05)]';

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#d9ecf3]">
              <th className={`${thBase} px-6 cursor-pointer select-none whitespace-nowrap`} onClick={() => handleSort('id')}>
                <span className="flex items-center">CI No. <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} /></span>
              </th>
              <th className={`${thBase} px-6 cursor-pointer select-none`} onClick={() => handleSort('assignedTo')}>
                <span className="flex items-center">Assignee <SortIcon col="assignedTo" sortKey={sortKey} sortDir={sortDir} /></span>
              </th>
              {TAB_COLS.map(({ key, label }) => (
                <th key={key} className={`${thBase} min-w-[140px] whitespace-nowrap`}>
                  {label}
                </th>
              ))}
              <th className={`${thBase} px-4 select-none whitespace-nowrap`}>
                Loading Date
              </th>
              <th className={`${thBase} px-4 select-none whitespace-nowrap`}>
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((task, idx) => (
              <tr
                key={task.id}
                className={`group hover:bg-blue-50/30 transition-colors ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
              >
                <td className="px-6 py-4 text-gray-800 font-medium whitespace-nowrap">
                  {task.correctValues['INVOICE NO.'] ?? task.id}
                </td>
                <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                  {task.assignedTo || '— unassigned —'}
                </td>
                {TAB_COLS.map(({ key }) => {
                  const status = getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {});
                  return (
                    <td key={key} className="px-4 py-4 cursor-pointer" onClick={() => onSelectTask(task.id, key)}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[status]}`}>
                        {STATUS_SHORT[status]}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                  {formatFirstReceivedDate(firstReceivedDates[task.id])}
                </td>
                <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                  {formatLastModified(task.lastUpdate)}
                </td>
              </tr>
            ))}
            {processed.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center text-gray-400 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>No tasks match your filter.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 text-xs text-gray-500 bg-gray-50/50 shrink-0">
        <span>
          Showing {processed.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, processed.length)} of {processed.length} tasks
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-2.5 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[32px] px-2.5 py-1.5 rounded border font-medium transition-all shadow-sm ${p === safePage
                  ? 'border-[#0056b8] bg-[#0056b8] text-white'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-[#0056b8] hover:text-[#0056b8]'
                  }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2.5 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            ›
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTaskToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveTask?.(taskToDelete);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
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
