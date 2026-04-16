import { useRef, useState, useEffect } from 'react';
import type { Task, VerificationStatus } from '../data/mockData';
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

const STATUS_CONFIG: Record<VerificationStatus, { bg: string; color: string; dot: string }> = {
  'Pending Verification': { bg: '#f1f3f5',                    color: 'var(--os-text-muted)',      dot: 'var(--os-text-disabled)' },
  'Needs Attention':      { bg: 'var(--os-warning-light)',    color: 'var(--os-warning)',         dot: 'var(--os-warning)' },
  'Rejected':             { bg: 'var(--os-error-light)',      color: 'var(--os-error)',           dot: 'var(--os-error)' },
  'All Matches':          { bg: 'var(--os-success-light)',    color: 'var(--os-success)',         dot: 'var(--os-success)' },
  'Approved':             { bg: 'var(--os-primary-light)',    color: 'var(--os-primary)',         dot: 'var(--os-primary)' },
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { bg, color, dot } = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: bg, color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {status}
    </span>
  );
}

function PendingDocumentBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#f1f3f5', color: 'var(--os-text-muted)' }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--os-text-disabled)' }} />
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

  const activeTabDef = TABS.find(t => t.type === activeTab)!;

  return (
    <>
    <div className="max-w-screen-xl mx-auto w-full px-3 sm:px-6 py-4 flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>

      {/* ── Header: back + CI No. ── */}
      <div className="flex items-center gap-3 mb-4 shrink-0 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm hover:underline shrink-0"
          style={{ color: 'var(--os-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tasks
        </button>
        <h1 className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--os-text-primary)' }}>CI {task.id}</h1>
      </div>

      {/* ── Task info card ── */}
      <div className="bg-white rounded-lg p-4 mb-4 shrink-0" style={{ border: '1px solid var(--os-border)', boxShadow: 'var(--os-shadow-sm)' }}>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--os-text-muted)' }}>CI No.</p>
            <p className="text-sm font-medium" style={{ color: 'var(--os-text-primary)' }}>{task.id}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--os-text-muted)' }}>Assigned To</p>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: 'var(--os-primary)' }}>
                {task.assignedTo.split(' ').map(n => n[0]).join('')}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--os-text-primary)' }}>{task.assignedTo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-t-lg shrink-0" style={{ border: '1px solid var(--os-border)', borderBottom: 'none' }}>
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
                className="flex flex-col items-start gap-1.5 px-4 sm:px-5 py-3 transition-colors whitespace-nowrap min-w-0"
                style={{
                  borderBottom: isActive ? `2px solid var(--os-primary)` : '2px solid transparent',
                  backgroundColor: isActive ? 'var(--os-surface)' : 'transparent',
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--os-surface-hover)'; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="text-xs font-semibold" style={{ color: isActive ? 'var(--os-primary)' : 'var(--os-text-muted)' }}>
                  {tab.shortLabel}
                </span>
                {isPendingDocument ? <PendingDocumentBadge /> : <VerificationBadge status={status} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div className="bg-white rounded-b-lg overflow-hidden flex flex-col flex-1 min-h-0" style={{ border: '1px solid var(--os-border)', borderTop: 'none' }}>
        <div className="px-4 sm:px-6 py-3 shrink-0" style={{ borderBottom: '1px solid var(--os-border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--os-text-primary)' }}>{activeTabDef.label}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--os-text-muted)' }}>
                Green cells indicate matching values. Orange cells indicate mismatches.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isUploadTab && currentUploadState === 'done' && (
                <>
                  <input ref={reUploadRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleReUpload} />
                  <button
                    onClick={() => reUploadRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-colors shrink-0"
                    style={{ color: 'var(--os-primary)', border: '1px solid var(--os-primary)' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--os-primary-light)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = ''; }}
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
                className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border rounded-md transition-colors shrink-0 ${isTabPending ? 'cursor-not-allowed' : ''}`}
                style={isTabPending
                  ? { color: 'var(--os-text-disabled)', borderColor: 'var(--os-border)', backgroundColor: '#f1f3f5' }
                  : { color: 'var(--os-text-secondary)', borderColor: 'var(--os-border)' }}
                onMouseOver={e => { if (!isTabPending) e.currentTarget.style.backgroundColor = 'var(--os-surface-hover)'; }}
                onMouseOut={e => { if (!isTabPending) e.currentTarget.style.backgroundColor = ''; }}
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
                      className={`inline-flex items-center h-8 px-4 text-xs rounded-md transition-colors ${isTabPending ? 'cursor-not-allowed' : ''}`}
                      style={isTabPending
                        ? { border: '1px solid var(--os-border)', color: 'var(--os-text-disabled)', backgroundColor: '#f1f3f5' }
                        : { border: '1px solid var(--os-error)', color: 'var(--os-error)' }}
                      onMouseOver={e => { if (!isTabPending) e.currentTarget.style.backgroundColor = 'var(--os-error-light)'; }}
                      onMouseOut={e => { if (!isTabPending) e.currentTarget.style.backgroundColor = ''; }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => !isTabPending && !(autoApprove && tabStatus !== 'Needs Attention') && setConfirm({ action: 'approve', vt: activeTab })}
                      disabled={isTabPending || (autoApprove && tabStatus !== 'Needs Attention')}
                      title={autoApprove && tabStatus !== 'Needs Attention' ? 'Auto Approve is enabled in Settings' : undefined}
                      className={`inline-flex items-center h-8 px-4 text-xs rounded-md transition-colors ${isTabPending || (autoApprove && tabStatus !== 'Needs Attention') ? 'cursor-not-allowed' : ''}`}
                      style={
                        isTabPending || (autoApprove && tabStatus !== 'Needs Attention')
                          ? { backgroundColor: '#e9ecef', color: 'var(--os-text-disabled)' }
                          : { backgroundColor: 'var(--os-primary)', color: '#fff' }
                      }
                      onMouseOver={e => {
                        if (!(isTabPending || (autoApprove && tabStatus !== 'Needs Attention')))
                          e.currentTarget.style.backgroundColor = 'var(--os-primary-hover)';
                      }}
                      onMouseOut={e => {
                        if (!(isTabPending || (autoApprove && tabStatus !== 'Needs Attention')))
                          e.currentTarget.style.backgroundColor = 'var(--os-primary)';
                      }}
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
          <div className="px-4 sm:px-6 py-3 shrink-0 text-xs" style={{
            borderBottom: '1px solid var(--os-border)',
            backgroundColor: decisions[activeTab].action === 'approve' ? 'var(--os-success-light)' : 'var(--os-error-light)',
          }}>
            <span className="font-semibold" style={{ color: 'var(--os-text-secondary)' }}>Status: </span>
            <span className="font-medium" style={{ color: decisions[activeTab].action === 'approve' ? 'var(--os-success)' : 'var(--os-error)' }}>
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
