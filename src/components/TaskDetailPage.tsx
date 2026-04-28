import type { Task } from '../data/mockData';
import type { VerificationType } from '../App';
import StatusBadge from './StatusBadge';
import ComparisonTable from './ComparisonTable';
import StepMap from './StepMap';

const VERIFICATION_LABELS: Record<VerificationType, string> = {
  customFormality: 'Custom Formality Verification',
  insurance:       'Insurance Verification',
  draftBL:         'Draft B/L Verification',
  blDate:          'Original B/L Verification',
};

interface TaskDetailPageProps {
  task: Task;
  verificationType: VerificationType;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export default function TaskDetailPage({ task, verificationType, onBack, onApprove, onReject }: TaskDetailPageProps) {
  const isActioned = task.status === 'Approved' || task.status === 'Rejected';

  return (
    // Fill viewport below navbar (navbar is h-14 = 3.5rem)
    <div className="max-w-screen-xl mx-auto w-full px-6 py-4 flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>

      {/* ── Header row: back + title + badge + action buttons ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#0056b8] hover:underline shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to CI Overview
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-gray-800">
              CI {task.id}
            </h1>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-sm font-medium text-[#0056b8]">{VERIFICATION_LABELS[verificationType]}</span>
            <StatusBadge status={task.status} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {isActioned ? (
            <p className="text-sm text-gray-500">
              This task has been <StatusBadge status={task.status} className="mx-1" />
            </p>
          ) : (
            <>
              <button
                onClick={onReject}
                className="px-5 py-1.5 border border-red-600 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="px-5 py-1.5 bg-[#0056b8] text-white text-sm rounded hover:bg-[#004a9f] transition-colors"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Step map row ── */}
      <div className="flex justify-center mb-3 shrink-0">
        <StepMap />
      </div>

      {/* ── Task info card ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shrink-0">
        {/* Fields */}
        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">CI No.</p>
            <p className="text-sm font-medium text-gray-800 font-mono">{task.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Submitted Date</p>
            <p className="text-sm font-medium text-gray-800">{formatDate(task.submittedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Documents ({task.documents.length})</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {task.documents.map(doc => (
                <span key={doc.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                  {doc.type}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Comparison table — fills remaining space with internal scroll ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-6 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Document Field Comparison</h2>
            <button className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Green cells indicate matching values. Orange cells indicate mismatches.
          </p>
        </div>
        <div className="overflow-auto flex-1">
          <ComparisonTable task={task} verificationType={verificationType} />
        </div>
      </div>

    </div>
  );
}
