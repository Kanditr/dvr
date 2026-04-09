import type { Task } from '../data/mockData';
import StatusBadge from './StatusBadge';

interface ActionBarProps {
  task: Task;
  onApprove: () => void;
  onReject: () => void;
}

export default function ActionBar({ task, onApprove, onReject }: ActionBarProps) {
  const isActioned = task.status === 'Approved' || task.status === 'Rejected';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">Review Decision</p>
        {isActioned ? (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            This task has been
            <StatusBadge status={task.status} className="mx-1" />
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            Review all document fields before approving or rejecting this task.
          </p>
        )}
      </div>
      {!isActioned && (
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="px-6 py-2 border border-red-600 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-6 py-2 bg-[#0056b8] text-white text-sm rounded hover:bg-[#004a9f] transition-colors"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
