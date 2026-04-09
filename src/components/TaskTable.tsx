import { useState } from 'react';
import type { Task } from '../data/mockData';
import StatusBadge from './StatusBadge';

type SortKey = 'id' | 'consignee' | 'submittedDate' | 'status';
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

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

interface TaskTableProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
}

export default function TaskTable({ tasks, onSelectTask }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('submittedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    const av = String(a[sortKey]);
    const bv = String(b[sortKey]);
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const thClass = 'px-6 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className={thClass} onClick={() => handleSort('id')}>
              <span className="flex items-center">CI No. <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('submittedDate')}>
              <span className="flex items-center">Submitted Date <SortIcon col="submittedDate" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
              Documents
            </th>
            <th className={thClass} onClick={() => handleSort('status')}>
              <span className="flex items-center">Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></span>
            </th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, idx) => (
            <tr
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
            >
              <td className="px-6 py-4 text-gray-800 font-medium whitespace-nowrap font-mono">{task.id}</td>
              <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{formatDate(task.submittedDate)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {task.documents.map(doc => (
                    <span key={doc.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded whitespace-nowrap">
                      {doc.type}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                No tasks match your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

