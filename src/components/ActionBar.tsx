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
    <div className="bg-white rounded-lg p-4 sm:p-6 flex items-center justify-between flex-wrap gap-4" style={{ border: '1px solid var(--os-border)', boxShadow: 'var(--os-shadow-sm)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--os-text-secondary)' }}>Review Decision</p>
        {isActioned ? (
          <p className="text-sm mt-1 flex items-center gap-1" style={{ color: 'var(--os-text-muted)' }}>
            This task has been
            <StatusBadge status={task.status} className="mx-1" />
          </p>
        ) : (
          <p className="text-sm mt-1" style={{ color: 'var(--os-text-muted)' }}>
            Review all document fields before approving or rejecting this task.
          </p>
        )}
      </div>
      {!isActioned && (
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="inline-flex items-center py-2 px-5 text-sm rounded-md transition-colors"
            style={{ border: '1px solid var(--os-error)', color: 'var(--os-error)' }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--os-error-light)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = ''; }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="inline-flex items-center py-2 px-5 text-sm rounded-md text-white transition-colors"
            style={{ backgroundColor: 'var(--os-primary)' }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--os-primary-hover)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--os-primary)'; }}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
