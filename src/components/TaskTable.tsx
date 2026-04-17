import { useState } from 'react';
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
  { key: 'insurance',       label: 'Draft Insurance' },
  { key: 'draftBL',         label: 'Draft B/L' },
  { key: 'blDate',          label: 'B/L Date' },
];


const STATUS_STYLE: Record<VerificationStatus, string> = {
  'All Matches':          'bg-[#ebf7ed] text-[#267d36]',
  'Approved':             'bg-[#e8f0fb] text-[#0056b8]',
  'Needs Attention':      'bg-[#fef5e5] text-[#ac6f00]',
  'Rejected':             'bg-[#faeaea] text-[#8c1d1d]',
  'Pending Verification': 'bg-gray-100 text-gray-500',
};

const STATUS_DOT: Record<VerificationStatus, string> = {
  'All Matches':          'bg-[#34a853]',
  'Approved':             'bg-[#0056b8]',
  'Needs Attention':      'bg-[#f5a623]',
  'Rejected':             'bg-[#d94040]',
  'Pending Verification': 'bg-gray-400',
};

const STATUS_SHORT: Record<VerificationStatus, string> = {
  'All Matches':          'All Match',
  'Approved':             'Approved',
  'Needs Attention':      'Attention',
  'Rejected':             'Rejected',
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
}

const PAGE_SIZE = 10;

export default function TaskTable({ tasks, uploadStates, tabFilters, onSelectTask }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  const processed = [...tasks]
    .filter(task =>
      TAB_COLS.every(({ key }) => {
        const f = tabFilters[key];
        return f === 'All' || getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {}) === f;
      })
    )
    .sort((a, b) => {
      const av = sortKey === 'status' ? deriveOverallStatus(a.verifications)
        : sortKey === 'assignedTo' ? a.assignedTo : a.id;
      const bv = sortKey === 'status' ? deriveOverallStatus(b.verifications)
        : sortKey === 'assignedTo' ? b.assignedTo : b.id;
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
              <span className="flex items-center">CI No. <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className={`${thBase} px-6 cursor-pointer select-none whitespace-nowrap`} onClick={() => handleSort('assignedTo')}>
              <span className="flex items-center">Task Assignment <SortIcon col="assignedTo" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            {TAB_COLS.map(({ key, label }) => (
              <th key={key} className={`${thBase} min-w-[140px] whitespace-nowrap`}>
                {label}
              </th>
            ))}
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
                {task.id}
              </td>
              <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {task.assignedTo.split('@')[0].split('.').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {task.assignedTo}
                </div>
              </td>
              {TAB_COLS.map(({ key }) => {
                const status = getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {});
                return (
                  <td
                    key={key}
                    className="px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => onSelectTask(task.id, key)}
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                      {STATUS_SHORT[status]}
                    </span>
                  </td>
                );
              })}
              <td
                className="px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => onSelectTask(task.id, 'customFormality')}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </td>
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
                onClick={() => setPage(p as number)}
                className={`min-w-[28px] px-2 py-1 rounded border transition-colors ${
                  p === safePage
                    ? 'border-[#0056b8] bg-[#0056b8] text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
