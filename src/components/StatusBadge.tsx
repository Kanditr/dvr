import type { TaskStatus } from '../data/mockData';

const STATUS_CONFIG: Record<TaskStatus, { bg: string; color: string }> = {
  'Pending':         { bg: '#f1f3f5',                    color: 'var(--os-text-muted)' },
  'Needs Attention': { bg: 'var(--os-warning-light)',    color: 'var(--os-warning)' },
  'All Match':       { bg: 'var(--os-success-light)',    color: 'var(--os-success)' },
  'Approved':        { bg: 'var(--os-primary-light)',    color: 'var(--os-primary)' },
  'Rejected':        { bg: 'var(--os-error-light)',      color: 'var(--os-error)' },
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { bg, color } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
