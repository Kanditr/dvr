import type { TaskStatus } from '../data/mockData';

const STATUS_CONFIG: Record<TaskStatus, { bg: string; text: string }> = {
  'Pending': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'Attention': { bg: 'bg-[#fef5e5]', text: 'text-[#ac6f00]' },
  'Match': { bg: 'bg-[#ebf7ed]', text: 'text-[#267d36]' },
  'Approved': { bg: 'bg-[#e8f0fb]', text: 'text-[#0056b8]' },
  'Rejected': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { bg, text } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium ${bg} ${text} ${className}`}>
      {status}
    </span>
  );
}
