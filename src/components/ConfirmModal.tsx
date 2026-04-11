interface ConfirmModalProps {
  action: 'approve' | 'reject';
  tabLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ action, tabLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isApprove ? 'bg-[#e8f0fb]' : 'bg-[#faeaea]'}`}>
          {isApprove ? (
            <svg className="w-5 h-5 text-[#0056b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#d94040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {isApprove ? 'Approve' : 'Reject'} {tabLabel}?
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          {isApprove
            ? `Are you sure you want to approve the ${tabLabel} verification? This action will mark it as verified.`
            : `Are you sure you want to reject the ${tabLabel} verification? This action will flag it for review.`}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-sm text-white rounded transition-colors ${
              isApprove ? 'bg-[#0056b8] hover:bg-[#004a9f]' : 'bg-[#d94040] hover:bg-[#b83232]'
            }`}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
