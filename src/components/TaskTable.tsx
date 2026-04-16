import { useState } from 'react';
import type React from 'react';
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


const STATUS_STYLE: Record<VerificationStatus, React.CSSProperties> = {
  'All Matches':          { backgroundColor: 'var(--os-success-light)', color: 'var(--os-success)' },
  'Approved':             { backgroundColor: 'var(--os-primary-light)',  color: 'var(--os-primary)' },
  'Needs Attention':      { backgroundColor: 'var(--os-warning-light)', color: 'var(--os-warning)' },
  'Rejected':             { backgroundColor: 'var(--os-error-light)',   color: 'var(--os-error)' },
  'Pending Verification': { backgroundColor: '#f1f3f5',                 color: 'var(--os-text-muted)' },
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
  return task.verifications[tabKey];
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

  const thStyle: React.CSSProperties = {
    color: 'var(--os-text-secondary)',
    backgroundColor: '#eef2f7',
    borderBottom: '1px solid var(--os-border)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  };

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm" style={{ minWidth: '640px' }}>
        <thead>
          <tr>
            <th className="px-4 sm:px-6 py-2.5 text-left cursor-pointer select-none whitespace-nowrap" style={thStyle} onClick={() => handleSort('id')}>
              <span className="flex items-center gap-1">CI No. <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-left cursor-pointer select-none whitespace-nowrap" style={thStyle} onClick={() => handleSort('assignedTo')}>
              <span className="flex items-center gap-1">Task Assignment <SortIcon col="assignedTo" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            {TAB_COLS.map(({ key, label }) => (
              <th key={key} className="px-4 py-2.5 text-left whitespace-nowrap" style={{ ...thStyle, minWidth: '130px' }}>
                {label}
              </th>
            ))}
            <th className="px-4 py-2.5 w-10" style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {paginated.map((task, idx) => (
            <tr
              key={task.id}
              style={{ borderBottom: '1px solid var(--os-border)', backgroundColor: idx % 2 !== 0 ? 'var(--os-surface-hover)' : 'var(--os-surface)' }}
            >
              <td className="px-4 sm:px-6 py-3.5 font-medium whitespace-nowrap" style={{ color: 'var(--os-text-primary)' }}>
                {task.id}
              </td>
              <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap" style={{ color: 'var(--os-text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: 'var(--os-primary)' }}>
                    {task.assignedTo.split(' ').map(n => n[0]).join('')}
                  </div>
                  {task.assignedTo}
                </div>
              </td>
              {TAB_COLS.map(({ key }) => {
                const status = getEffectiveTabStatus(task, key, uploadStates[task.id] ?? {});
                return (
                  <td
                    key={key}
                    className="px-4 py-3.5 cursor-pointer transition-colors"
                    style={{ ':hover': { backgroundColor: 'var(--os-primary-light)' } } as React.CSSProperties}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--os-primary-light)')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = '')}
                    onClick={() => onSelectTask(task.id, key)}
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={STATUS_STYLE[status]}>
                      {STATUS_SHORT[status]}
                    </span>
                  </td>
                );
              })}
              <td
                className="px-4 py-3.5 cursor-pointer transition-colors"
                onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--os-primary-light)')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '')}
                onClick={() => onSelectTask(task.id, 'customFormality')}
              >
                <svg className="w-4 h-4" style={{ color: 'var(--os-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </td>
            </tr>
          ))}
          {processed.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--os-text-muted)' }}>
                No tasks match your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 gap-2 text-xs" style={{ borderTop: '1px solid var(--os-border)', color: 'var(--os-text-muted)' }}>
        <span>
          Showing {processed.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, processed.length)} of {processed.length} tasks
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--os-border)', color: 'var(--os-text-secondary)' }}
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1" style={{ color: 'var(--os-text-muted)' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className="min-w-[28px] px-2 py-1 rounded transition-colors"
                style={p === safePage
                  ? { border: '1px solid var(--os-primary)', backgroundColor: 'var(--os-primary)', color: '#fff' }
                  : { border: '1px solid var(--os-border)', color: 'var(--os-text-secondary)' }
                }
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--os-border)', color: 'var(--os-text-secondary)' }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
