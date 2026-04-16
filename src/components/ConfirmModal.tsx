import { useState } from 'react';

const REJECT_REASONS = [
  'Field value does not match',
  'Document extraction failed',
  'Document validation failed',
];

const APPROVE_REASONS = [
  'Document fields matched correctly',
  'Field context similarity confirmed',
];

interface ConfirmModalProps {
  action: 'approve' | 'reject';
  tabLabel: string;
  onConfirm: (reason: string, remark: string) => void;
  onCancel: () => void;
}

export default function ConfirmModal({ action, tabLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const isApprove = action === 'approve';
  const reasons = isApprove ? APPROVE_REASONS : REJECT_REASONS;
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');

  const canSubmit = reason !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">

        {/* Icon */}
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
        <p className="text-xs text-gray-500 mb-5">
          {isApprove
            ? `Select a reason and optionally add a remark before approving the ${tabLabel} verification.`
            : `Select a reason and optionally add a remark before rejecting the ${tabLabel} verification.`}
        </p>

        {/* Reason dropdown (required) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full appearance-none px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#0056b8] bg-white text-gray-700 pr-8"
            >
              <option value="">— Select a reason —</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Remark textarea (optional) */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Remark <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={remark}
            onChange={e => setRemark(e.target.value)}
            rows={3}
            placeholder="Add any additional notes..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#0056b8] resize-none text-gray-700 placeholder:text-gray-300"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(reason, remark)}
            disabled={!canSubmit}
            className={`px-4 py-1.5 text-sm text-white rounded transition-colors ${
              canSubmit
                ? isApprove ? 'bg-[#0056b8] hover:bg-[#004a9f]' : 'bg-[#d94040] hover:bg-[#b83232]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
