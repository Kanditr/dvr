import { useRef, useState, useEffect } from 'react';
import type { Task, VerificationStatus, Verifications } from '../data/mockData';
import { deriveOverallStatus } from '../data/mockData';
import type { VerificationType, ActionLog } from '../App';
import { exportVerificationTab } from '../utils/exportExcel';
import ComparisonTable from './ComparisonTable';
import BLDateTable from './BLDateTable';
import type { UploadState } from './DocumentUploadGate';
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

const STATUS_CONFIG: Record<VerificationStatus, { bg: string; text: string }> = {
  'Pending Verification': { bg: 'bg-gray-100',   text: 'text-gray-500'   },
  'Needs Attention':      { bg: 'bg-[#fef5e5]',  text: 'text-[#ac6f00]' },
  'Rejected':             { bg: 'bg-[#faeaea]',  text: 'text-[#8c1d1d]' },
  'All Matches':          { bg: 'bg-[#ebf7ed]',  text: 'text-[#267d36]' },
  'Approved':             { bg: 'bg-[#e8f0fb]',  text: 'text-[#0056b8]' },
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  'All Matches':          'All Match',
  'Approved':             'Approved',
  'Needs Attention':      'Needs Attention',
  'Rejected':             'Rejected',
  'Pending Verification': 'Pending',
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { bg, text } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function UploadSlot({ label, state, onUpload }: { label: string; state: UploadState; onUpload: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (state === 'done') {
    return (
      <div className="flex-1 border-2 border-dashed border-green-300 rounded-xl p-8 flex flex-col items-center gap-3 bg-green-50">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-green-700">{label}</p>
        <p className="text-xs text-green-500">Uploaded successfully</p>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex-1 border-2 border-dashed border-blue-200 rounded-xl p-8 flex flex-col items-center gap-3 bg-blue-50">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-[#0056b8] border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-600">Processing…</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 border-2 border-dashed border-gray-300 hover:border-[#0056b8] hover:bg-gray-50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) onUpload(); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.tiff"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) { onUpload(); e.target.value = ''; } }}
      />
      <div className="w-12 h-12 rounded-full bg-[#e8f0fb] flex items-center justify-center">
        <svg className="w-6 h-6 text-[#0056b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">Upload {label}</p>
        <p className="text-xs text-gray-500 mt-1">Drag & drop or <span className="text-[#0056b8] font-medium">browse file</span></p>
        <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, TIFF supported</p>
      </div>
    </div>
  );
}

function PendingDocumentBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      Pending
    </span>
  );
}

interface CiOverviewPageProps {
  task: Task;
  activeTab: VerificationType;
  onTabChange: (tab: VerificationType) => void;
  onBack: () => void;
  onApproveVerification: (vt: VerificationType, reason?: string, remark?: string) => void;
  onRejectVerification: (vt: VerificationType, reason?: string, remark?: string) => void;
  autoApprove: boolean;
  uploadStates: Record<string, UploadState>;
  onUploadStateChange: (tab: string, state: UploadState) => void;
  actionLogs: Record<string, ActionLog>;
  onLogVerified: (vt: VerificationType) => void;
  onResetForUpload: (vt: VerificationType) => void;
  revisionStates: Record<string, { count: number; date: string }>;
  onIncrementRevision: (vt: VerificationType) => void;
}

function formatActionTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatRevDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default function CiOverviewPage({ task, activeTab, onTabChange, onBack, onApproveVerification, onRejectVerification, uploadStates, onUploadStateChange, autoApprove, actionLogs, onLogVerified, onResetForUpload, revisionStates, onIncrementRevision }: CiOverviewPageProps) {
  const reUploadActionRef = useRef<HTMLInputElement>(null);
  const [reUploadPending, setReUploadPending] = useState(false);
  const [confirm, setConfirm] = useState<{ action: 'approve' | 'reject'; vt: VerificationType } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  function handleReUploadAfterAction(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    e.target.value = '';
    const wasActioned = task.verifications[activeTab] === 'Approved' || task.verifications[activeTab] === 'Rejected';
    setReUploadPending(true);
    setTimeout(() => {
      setReUploadPending(false);
      if (wasActioned) onResetForUpload(activeTab);
      onIncrementRevision(activeTab);
    }, 2500);
  }

  const isUploadTab = activeTab === 'insurance' || activeTab === 'draftBL';
  const isInsuranceDone = (uploadStates['insurance:detail'] ?? 'idle') === 'done' && (uploadStates['insurance:draft'] ?? 'idle') === 'done';
  const isDraftBLDone = (uploadStates['draftBL:shipping'] ?? 'idle') === 'done' && (uploadStates['draftBL:draft'] ?? 'idle') === 'done';
  const currentUploadState: UploadState = isUploadTab
    ? (activeTab === 'insurance' ? (isInsuranceDone ? 'done' : 'idle') : (isDraftBLDone ? 'done' : 'idle'))
    : 'done';

  const oblDoc = task.documents.find(d => d.type === 'Original B/L');
  const blDateHasData = !!(oblDoc && oblDoc.values[oblDoc.fieldMapping['B/L Date']]);

  const isTabPending =
    (activeTab === 'insurance' && !isInsuranceDone)
    || (activeTab === 'draftBL' && !isDraftBLDone)
    || (activeTab === 'blDate' && !blDateHasData);

  // Auto-log "verified" the first time a tab is viewed with a non-pending status
  useEffect(() => {
    if (!isTabPending && !actionLogs[activeTab]) {
      onLogVerified(activeTab);
    }
  }, [activeTab, task.id, isTabPending]);

  // Auto-set Rev. 00 the first time a tab has data (before any manual upload)
  useEffect(() => {
    if (!isTabPending && !revisionStates[activeTab]) {
      onIncrementRevision(activeTab);
    }
  }, [activeTab, task.id, isTabPending]);

  // Reset re-upload loading state when switching tabs
  useEffect(() => { setReUploadPending(false); }, [activeTab, task.id]);

  const effectiveVerifications: Verifications = {
    ...task.verifications,
    customFormality: task.verifications.customFormality === 'Pending Verification' ? 'Needs Attention' : task.verifications.customFormality,
    insurance: (uploadStates['insurance'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.insurance,
    draftBL:   (uploadStates['draftBL']   ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.draftBL,
    blDate:    !blDateHasData ? 'Pending Verification' : task.verifications.blDate === 'Pending Verification' ? 'Needs Attention' : task.verifications.blDate,
  };
  const effectiveStatus = deriveOverallStatus(effectiveVerifications);
  const activeTabDef = TABS.find(t => t.type === activeTab)!;

  const activeTabStatus: VerificationStatus = (() => {
    let s: VerificationStatus = task.verifications[activeTab];
    if (activeTab === 'blDate' && !blDateHasData) s = 'Pending Verification';
    else if ((activeTab === 'customFormality' || activeTab === 'blDate') && s === 'Pending Verification') s = 'Needs Attention';
    return s;
  })();
  const isTabActioned = activeTabStatus === 'Approved' || activeTabStatus === 'Rejected';

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
          <h1 className="text-base font-bold text-gray-800">CI {task.correctValues['INVOICE NO.'] ?? task.id}</h1>
        </div>

      </div>

      {/* ── Task info card: assigned user ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shrink-0">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Invoice No.</p>
            <p className="text-sm font-medium text-gray-800">{task.correctValues['INVOICE NO.'] ?? task.id}</p>
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
            const isActive = activeTab === tab.type;
            const isPendingDocument =
              ((tab.type === 'insurance' || tab.type === 'draftBL') && (uploadStates[tab.type] ?? 'idle') !== 'done')
              || (tab.type === 'blDate' && !blDateHasData);
            let tabStatus: VerificationStatus = task.verifications[tab.type];
            if (tab.type === 'blDate' && !blDateHasData) tabStatus = 'Pending Verification';
            else if ((tab.type === 'customFormality' || tab.type === 'blDate') && tabStatus === 'Pending Verification') tabStatus = 'Needs Attention';
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
                {isPendingDocument ? <PendingDocumentBadge /> : <VerificationBadge status={tabStatus} />}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-gray-900">{activeTabDef.label}</h2>
                {revisionStates[activeTab] && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e8f0fb] text-[#0056b8] border border-[#c5d9f5] whitespace-nowrap">
                    Rev. {String(revisionStates[activeTab].count).padStart(2, '0')} · {formatRevDate(revisionStates[activeTab].date)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Green cells indicate matching values. Orange cells indicate mismatches.
              </p>
              {actionLogs[activeTab] && (() => {
                const log = actionLogs[activeTab];
                const label = log.action === 'approve' ? 'Last approved' : log.action === 'reject' ? 'Last rejected' : 'Last verified';
                const color = log.action === 'approve' ? 'text-[#0056b8]' : log.action === 'reject' ? 'text-[#8c1d1d]' : 'text-gray-500';
                return (
                  <p className={`text-xs mt-1 font-medium ${color}`}>
                    {label}: {formatActionTimestamp(log.timestamp)} · by {log.by}
                  </p>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              {/* Re-upload for insurance / draftBL once both files are already loaded */}
              {isUploadTab && currentUploadState === 'done' && (
                <button
                  onClick={() => {
                    const wasActioned = task.verifications[activeTab] === 'Approved' || task.verifications[activeTab] === 'Rejected';
                    if (activeTab === 'insurance') {
                      onUploadStateChange('insurance:detail', 'idle');
                      onUploadStateChange('insurance:draft', 'idle');
                      onUploadStateChange('insurance', 'idle');
                    } else {
                      onUploadStateChange('draftBL:shipping', 'idle');
                      onUploadStateChange('draftBL:draft', 'idle');
                      onUploadStateChange('draftBL', 'idle');
                    }
                    if (wasActioned) onResetForUpload(activeTab);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#0056b8] border border-[#0056b8] rounded-md hover:bg-[#e8f0fb] transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Upload File
                </button>
              )}
              {/* Upload File always available for Custom Formality / B/L Date */}
              {!isUploadTab && (
                <>
                  <input ref={reUploadActionRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleReUploadAfterAction} />
                  <button
                    onClick={() => !reUploadPending && reUploadActionRef.current?.click()}
                    disabled={reUploadPending}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-md transition-colors shrink-0 ${reUploadPending ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed' : 'text-[#0056b8] border-[#0056b8] hover:bg-[#e8f0fb]'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {reUploadPending ? 'Uploading…' : 'Upload File'}
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
              {isTransitioning ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200 animate-pulse">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Auto-approving…
                </span>
              ) : (
                <>
                  <button
                    onClick={() => !isTabPending && !isTabActioned && setConfirm({ action: 'reject', vt: activeTab })}
                    disabled={isTabPending || isTabActioned}
                    className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending || isTabActioned ? 'border border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border border-red-600 text-red-600 hover:bg-red-50'}`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => !isTabPending && !isTabActioned && !(autoApprove && activeTabStatus !== 'Needs Attention') && setConfirm({ action: 'approve', vt: activeTab })}
                    disabled={isTabPending || isTabActioned || (autoApprove && activeTabStatus !== 'Needs Attention')}
                    title={!isTabActioned && autoApprove && activeTabStatus !== 'Needs Attention' ? 'Auto Approve is enabled in Settings' : undefined}
                    className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending || isTabActioned || (autoApprove && activeTabStatus !== 'Needs Attention') ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0056b8] text-white hover:bg-[#004a9f]'}`}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {actionLogs[activeTab]?.reason && (
          <div className={`px-6 py-3 border-b border-gray-200 shrink-0 text-xs ${actionLogs[activeTab].action === 'approve' ? 'bg-[#ebf7ed]' : 'bg-[#faeaea]'}`}>
            <span className="font-semibold text-gray-700">Status: </span>
            <span className={`font-medium ${actionLogs[activeTab].action === 'approve' ? 'text-[#267d36]' : 'text-[#8c1d1d]'}`}>
              {actionLogs[activeTab].reason}
            </span>
            {actionLogs[activeTab].remark && (
              <span className="text-gray-600">
                &nbsp;&nbsp;·&nbsp;&nbsp;<span className="font-semibold text-gray-700">Remark: </span>{actionLogs[activeTab].remark}
              </span>
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'insurance' ? (
            isInsuranceDone ? (
              <ComparisonTable task={task} verificationType={activeTab} />
            ) : (
              <div className="flex items-stretch gap-4 p-6">
                <UploadSlot
                  label="Detail for Insurance Purpose"
                  state={uploadStates['insurance:detail'] ?? 'idle'}
                  onUpload={() => handleUpload('insurance:detail')}
                />
                <UploadSlot
                  label="Draft Insurance"
                  state={uploadStates['insurance:draft'] ?? 'idle'}
                  onUpload={() => handleUpload('insurance:draft')}
                />
              </div>
            )
          ) : activeTab === 'draftBL' ? (
            isDraftBLDone ? (
              <ComparisonTable task={task} verificationType={activeTab} />
            ) : (
              <div className="flex items-stretch gap-4 p-6">
                <UploadSlot
                  label="Shipping Particular"
                  state={uploadStates['draftBL:shipping'] ?? 'idle'}
                  onUpload={() => handleUpload('draftBL:shipping')}
                />
                <UploadSlot
                  label="Draft B/L"
                  state={uploadStates['draftBL:draft'] ?? 'idle'}
                  onUpload={() => handleUpload('draftBL:draft')}
                />
              </div>
            )
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
          if (confirm.action === 'approve') onApproveVerification(confirm.vt, reason, remark);
          else onRejectVerification(confirm.vt, reason, remark);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    )}
    </>
  );
}
