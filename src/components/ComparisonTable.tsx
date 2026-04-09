import { buildComparisonRows } from '../utils/comparison';
import type { Task } from '../data/mockData';

interface ComparisonTableProps {
  task: Task;
}

export default function ComparisonTable({ task }: ComparisonTableProps) {
  const rows = buildComparisonRows(task);
  const docs = task.documents;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#d9ecf3] border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-36">
              Field
            </th>
            {docs.map(doc => (
              <th key={doc.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                {doc.type}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.canonicalField} className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
              <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4">
                {row.canonicalField}
              </td>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 align-top ${cell.isMatch ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}
                >
                  <span className="block text-xs text-gray-500 mb-0.5">{cell.originalFieldName}</span>
                  <span className="block text-sm font-medium text-gray-900">{cell.value}</span>
                </td>
              ))}
              <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                {row.rowStatus === 'match' ? (
                  <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36]">
                    Match
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00]">
                    Mismatch
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
