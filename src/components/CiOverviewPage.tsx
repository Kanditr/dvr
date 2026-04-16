import { useRef, useState, useEffect } from 'react';
import type { Task, VerificationStatus, Verifications } from '../data/mockData';
import { deriveOverallStatus } from '../data/mockData';
import type { VerificationType } from '../App';
import { exportVerificationTab } from '../utils/exportExcel';
import ComparisonTable from './ComparisonTable';
import BLDateTable from './BLDateTable';
import DocumentUploadGate, { type UploadState } from './DocumentUploadGate';
import ConfirmModal from './ConfirmModal';

interface TabDef {
  type: VerificationType;
  label: string;
  shortLabel: string;
  documents: string[];
}

const TABS: TabDef[] = [
  {
    type: 'customFormality',
    label: 'Custom Formality Verification',
    shortLabel: 'Custom Formality',
    documents: ['Shipping Advice', 'Custom Invoice', 'Packing List', 'SI or L/C', 'DocXPort'],
  },
  {
    type: 'insurance',
    label: 'Draft Insurance Verification',
    shortLabel: 'Draft Insurance',
    documents: ['Draft Insurance', 'Detail for Insurance Purpose'],
  },
  {
    type: 'draftBL',
    label: 'Draft B/L Verification',
    shortLabel: 'Draft B/L',
    documents: ['Draft B/L', 'Shipping Particular'],
  },
  {
    type: 'blDate',
    label: 'B/L Date Verification',
    shortLabel: 'B/L Date',
    documents: ['Original B/L', 'DocXPort → GI Date / ETD Date / Manual Billing Date'],
  },
];

const STATUS_CONFIG: Record<VerificationStatus, { bg: string; text: string; dot: string }> = {
  'Pending Verification': { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
  'Needs Attention':      { bg: 'bg-[#fef5e5]',  text: 'text-[#ac6f00]', dot: 'bg-[#f5a623]' },
  'Rejected':             { bg: 'bg-[#faeaea]',  text: 'text-[#8c1d1d]', dot: 'bg-[#d94040]' },
  'All Matches':          { bg: 'bg-[#ebf7ed]',  text: 'text-[#267d36]', dot: 'bg-[#34a853]' },
  'Approved':             { bg: 'bg-[#e8f0fb]',  text: 'text-[#0056b8]', dot: 'bg-[#0056b8]' },
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { bg, text, dot } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {status}
    </span>
  );
}

function PendingDocumentBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-400" />
      Pending Document
    </span>
  );
}

interface CiOverviewPageProps {
  task: Task;
  activeTab: VerificationType;
  onTabChange: (tab: VerificationType) => void;
  onBack: () => void;
  onApproveVerification: (vt: VerificationType) => void;
  onRejectVerification: (vt: VerificationType) => void;
  autoApprove: boolean;
  uploadStates: Record<string, UploadState>;
  onUploadStateChange: (tab: string, state: UploadState) => void;
}

export default function CiOverviewPage({ task, activeTab, onTabChange, onBack, onApproveVerification, onRejectVerification, uploadStates, onUploadStateChange, autoApprove }: CiOverviewPageProps) {
  const reUploadRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<{ action: 'approve' | 'reject'; vt: VerificationType } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, { action: 'approve' | 'reject'; reason: string; remark: string }>>({});
  const prevTabRef = useRef<{ tab: VerificationType; status: VerificationStatus }>({
    tab: activeTab,
    status: task.verifications[activeTab],
  });

  useEffect(() => {
    const prev = prevTabRef.current;
    const currStatus = task.verifications[activeTab];

    if (
      prev.tab === activeTab &&
      autoApprove &&
      prev.status === 'All Matches' &&
      currStatus === 'Approved'
    ) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 1500);
      prevTabRef.current = { tab: activeTab, status: currStatus };
      return () => clearTimeout(timer);
    }

    prevTabRef.current = { tab: activeTab, status: currStatus };
  }, [task.verifications[activeTab], activeTab]);

  function handleUpload(tab: string) {
    onUploadStateChange(tab, 'loading');
    setTimeout(() => onUploadStateChange(tab, 'done'), 2500);
  }

  function handleReUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    e.target.value = '';
    handleUpload(activeTab);
  }

  const isUploadTab = activeTab === 'insurance' || activeTab === 'draftBL';
  const currentUploadState: UploadState = isUploadTab ? (uploadStates[activeTab] ?? 'idle') : 'done';

  const oblDoc = task.documents.find(d => d.type === 'Original B/L');
  const blDateHasData = !!(oblDoc && oblDoc.values[oblDoc.fieldMapping['B/L Date']]);

  const isTabPending =
    ((activeTab === 'insurance' || activeTab === 'draftBL') && (uploadStates[activeTab] ?? 'idle') !== 'done')
    || (activeTab === 'blDate' && !blDateHasData);

  const effectiveVerifications: Verifications = {
    ...task.verifications,
    insurance: (uploadStates['insurance'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.insurance,
    draftBL:   (uploadStates['draftBL']   ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.draftBL,
    blDate:    !blDateHasData                                    ? 'Pending Verification' : task.verifications.blDate,
  };
  const effectiveStatus = deriveOverallStatus(effectiveVerifications);
  const activeTabDef = TABS.find(t => t.type === activeTab)!;

  // Resolve the actual SI or LC doc type present in this task
  return (
    <>
    <div className="max-w-screen-xl mx-auto w-full px-6 py-4 flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>

      {/* ── Header: back + CI No. + status + actions ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#0056b8] hover:underline shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tasks
          </button>
          <h1 className="text-base font-bold text-gray-800">CI {task.id}</h1>
        </div>

      </div>

      {/* ── Task info card: assigned user ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shrink-0">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">CI No.</p>
            <p className="text-sm font-medium text-gray-800">{task.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Assigned To</p>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {task.assignedTo.split(' ').map(n => n[0]).join('')}
              </div>
              <p className="text-sm font-medium text-gray-800">{task.assignedTo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 shrink-0">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const status = task.verifications[tab.type];
            const isActive = activeTab === tab.type;
            const isPendingDocument =
              ((tab.type === 'insurance' || tab.type === 'draftBL') && (uploadStates[tab.type] ?? 'idle') !== 'done')
              || (tab.type === 'blDate' && !blDateHasData);
            return (
              <button
                key={tab.type}
                onClick={() => onTabChange(tab.type)}
                className={`flex flex-col items-start gap-1.5 px-5 py-3 border-b-2 transition-colors whitespace-nowrap min-w-0 ${
                  isActive
                    ? 'border-[#0056b8] bg-white'
                    : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className={`text-xs font-semibold ${isActive ? 'text-[#0056b8]' : 'text-gray-500'}`}>
                  {tab.shortLabel}
                </span>
                {isPendingDocument ? <PendingDocumentBadge /> : <VerificationBadge status={status} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-6 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{activeTabDef.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Green cells indicate matching values. Orange cells indicate mismatches.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isUploadTab && currentUploadState === 'done' && (
                <>
                  <input ref={reUploadRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleReUpload} />
                  <button
                    onClick={() => reUploadRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#0056b8] border border-[#0056b8] rounded-md hover:bg-[#e8f0fb] transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Upload File
                  </button>
                </>
              )}
              <button
                onClick={() => !isTabPending && exportVerificationTab(task, activeTab)}
                disabled={isTabPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-md transition-colors shrink-0 ${isTabPending ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              {(() => {
                const tabStatus = task.verifications[activeTab];
                const isTabActioned = tabStatus === 'Approved' || tabStatus === 'Rejected';
                if (isTransitioning) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200 animate-pulse">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Auto-approving…
                    </span>
                  );
                }
                if (isTabActioned) {
                  return null;
                }
                return (
                  <>
                    <button
                      onClick={() => !isTabPending && setConfirm({ action: 'reject', vt: activeTab })}
                      disabled={isTabPending}
                      className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending ? 'border border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border border-red-600 text-red-600 hover:bg-red-50'}`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => !isTabPending && !(autoApprove && tabStatus !== 'Needs Attention') && setConfirm({ action: 'approve', vt: activeTab })}
                      disabled={isTabPending || (autoApprove && tabStatus !== 'Needs Attention')}
                      title={autoApprove && tabStatus !== 'Needs Attention' ? 'Auto Approve is enabled in Settings' : undefined}
                      className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending || (autoApprove && tabStatus !== 'Needs Attention') ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0056b8] text-white hover:bg-[#004a9f]'}`}
                    >
                      Approve
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        {decisions[activeTab] && (
          <div className={`px-6 py-3 border-b border-gray-200 shrink-0 text-xs ${decisions[activeTab].action === 'approve' ? 'bg-[#ebf7ed]' : 'bg-[#faeaea]'}`}>
            <span className="font-semibold text-gray-700">Status: </span>
            <span className={`font-medium ${decisions[activeTab].action === 'approve' ? 'text-[#267d36]' : 'text-[#8c1d1d]'}`}>
              {decisions[activeTab].reason}
            </span>
            {decisions[activeTab].remark && (
              <span className="text-gray-600">
                &nbsp;&nbsp;·&nbsp;&nbsp;<span className="font-semibold text-gray-700">Remark: </span>{decisions[activeTab].remark}
              </span>
            )}
          </div>
        )}
        <div className="overflow-auto flex-1">
          {activeTab === 'insurance' ? (
            <DocumentUploadGate
              docLabel="Draft Insurance"
              uploadState={uploadStates.insurance ?? 'idle'}
              onUpload={() => handleUpload('insurance')}
            >
              <ComparisonTable task={task} verificationType={activeTab} />
            </DocumentUploadGate>
          ) : activeTab === 'draftBL' ? (
            <DocumentUploadGate
              docLabel="Draft B/L"
              uploadState={uploadStates.draftBL ?? 'idle'}
              onUpload={() => handleUpload('draftBL')}
            >
              <ComparisonTable task={task} verificationType={activeTab} />
            </DocumentUploadGate>
          ) : activeTab === 'blDate' ? (
            <BLDateTable task={task} />
          ) : (
            <ComparisonTable task={task} verificationType={activeTab} />
          )}
        </div>
      </div>

    </div>

    {confirm && (
      <ConfirmModal
        action={confirm.action}
        tabLabel={TABS.find(t => t.type === confirm.vt)?.label ?? confirm.vt}
        onConfirm={(reason, remark) => {
          if (confirm.action === 'approve') onApproveVerification(confirm.vt);
          else onRejectVerification(confirm.vt);
          setDecisions(prev => ({ ...prev, [confirm.vt]: { action: confirm.action, reason, remark } }));
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    )}
    </>
  );
}
