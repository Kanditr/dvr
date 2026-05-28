import { useRef, useState, useEffect, useMemo } from 'react';
import type { Task, VerificationStatus, Verifications } from '../data/mockData';
import { deriveOverallStatus } from '../data/mockData';
import type { VerificationType, ActionLog } from '../App';
import { exportVerificationTab } from '../utils/exportExcel';
import ComparisonTable from './ComparisonTable';
import BLDateTable from './BLDateTable';
import type { UploadState } from './DocumentUploadGate';
import ConfirmModal from './ConfirmModal';
import { validateFileName } from '../utils/validation';
import { saveFile, getFileUrl } from '../utils/fileStorage';

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
    label: 'Original B/L Verification',
    shortLabel: 'Original B/L',
    documents: ['Original B/L', 'DocXPort → GI Date / ETD Date / Manual Billing Date'],
  },
];

const STATUS_CONFIG: Record<VerificationStatus, { bg: string; text: string }> = {
  'Pending Verification': { bg: 'bg-gray-100', text: 'text-gray-500' },
  'Attention': { bg: 'bg-[#fef5e5]', text: 'text-[#ac6f00]' },
  'Rejected': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
  'Match': { bg: 'bg-[#ebf7ed]', text: 'text-[#267d36]' },
  'Approved': { bg: 'bg-[#e8f0fb]', text: 'text-[#0056b8]' },
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
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

function UploadSlot({ label, state, onUpload }: { label: string; state: UploadState; onUpload: (file: File) => void }) {
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
      onDrop={e => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) { onUpload(file); e.target.value = ''; }
        }}
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
  currentUser: string;
  uploadStates: Record<string, UploadState>;
  onUploadStateChange: (tab: string, state: UploadState, revNum?: number) => void;
  actionLogs: Record<string, ActionLog>;
  onLogVerified: (vt: VerificationType) => void;
  onResetForUpload: (vt: VerificationType) => void;
  onCancelResetForUpload: (vt: VerificationType) => void;
  revisionStates: Record<string, { count: number; date: string; receiveDate?: string }>;
  onIncrementRevision: (vt: VerificationType, revNum?: number, defaultToZero?: boolean, receiveDate?: string) => void;
  onUpdateTask: (task: Task) => void;
  fileUrls: Record<string, string>;
  onFileUrlChange: (tab: string, url: string) => void;
  revisionHistory: Record<string, Record<number, any>>;
  fileUrlsHistory: Record<string, Record<number, Record<string, string>>>;
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

export default function CiOverviewPage({ task, activeTab, onTabChange, onBack, onApproveVerification, onRejectVerification, uploadStates, onUploadStateChange, autoApprove, currentUser, actionLogs, onLogVerified, onResetForUpload, onCancelResetForUpload, revisionStates, onIncrementRevision, onUpdateTask, fileUrls, onFileUrlChange, revisionHistory, fileUrlsHistory }: CiOverviewPageProps) {
  const reUploadActionRef = useRef<HTMLInputElement>(null);
  const [reUploadPending, setReUploadPending] = useState(false);
  const [confirm, setConfirm] = useState<{ action: 'approve' | 'reject'; vt: VerificationType } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [viewingRevision, setViewingRevision] = useState<Record<string, number>>({});
  const latestRevision = revisionStates[activeTab]?.count ?? 0;
  const activeRevision = viewingRevision[activeTab] ?? latestRevision;

  // Automatically shift to the latest revision when switching tabs or when a new revision is uploaded
  useEffect(() => {
    setViewingRevision(prev => {
      if (prev[activeTab] === undefined) return prev;
      const next = { ...prev };
      delete next[activeTab];
      return next;
    });
  }, [activeTab, latestRevision]);

  const availableRevisions = useMemo(() => {
    const history = revisionHistory[activeTab] ?? {};
    const keys = Object.keys(history).map(Number);
    const all = [...keys, latestRevision].sort((a, b) => a - b);
    return Array.from(new Set(all));
  }, [activeTab, revisionHistory, latestRevision]);

  const displayTask = useMemo(() => {
    if (activeRevision === latestRevision) return task;
    const historical = revisionHistory[activeTab]?.[activeRevision];
    if (!historical) return task;
    return {
      ...task,
      documents: historical.documents,
      correctValues: historical.correctValues,
      verifications: historical.verifications,
      fieldStatusOverrides: historical.fieldStatusOverrides,
      cellStatusOverrides: historical.cellStatusOverrides
    };
  }, [task, activeTab, activeRevision, latestRevision, revisionHistory]);

  const displayFileUrls = useMemo(() => {
    if (activeRevision === latestRevision) return fileUrls;
    const historical = fileUrlsHistory[activeTab]?.[activeRevision];
    return historical ?? fileUrls;
  }, [fileUrls, activeTab, activeRevision, latestRevision, fileUrlsHistory]);

  const displayActionLog = useMemo(() => {
    if (activeRevision === latestRevision) return actionLogs[activeTab];
    return revisionHistory[activeTab]?.[activeRevision]?.actionLog;
  }, [actionLogs, activeTab, activeRevision, latestRevision, revisionHistory]);

  // Load persisted file URLs from IndexedDB on task change
  useEffect(() => {
    const tabs = ['customFormality', 'insurance:detail', 'insurance:draft', 'draftBL:shipping', 'draftBL:draft', 'blDate'];
    tabs.forEach(tab => {
      getFileUrl(`${task.id}:${tab}`).then(url => {
        if (url) onFileUrlChange(tab, url);
      });
    });
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track the revision of the first file uploaded in a pair (insurance or draftBL)
  const [partialRevisionStates, setPartialRevisionStates] = useState<Record<string, number>>({});
  const [isReUploading, setIsReUploading] = useState(false);

  const prevTabRef = useRef<{ tab: VerificationType; status: VerificationStatus }>({
    tab: activeTab,
    status: task.verifications[activeTab],
  });

  // Reset states when switching tabs or tasks
  useEffect(() => {
    setPartialRevisionStates({});
    setIsReUploading(false);
  }, [activeTab, task.id]);

  useEffect(() => {
    const prev = prevTabRef.current;
    const currStatus = task.verifications[activeTab];

    if (
      prev.tab === activeTab &&
      autoApprove &&
      prev.status === 'Match' &&
      currStatus === 'Approved'
    ) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 1500);
      prevTabRef.current = { tab: activeTab, status: currStatus };
      return () => clearTimeout(timer);
    }

    prevTabRef.current = { tab: activeTab, status: currStatus };
  }, [task.verifications[activeTab], activeTab]);

  function handleUpload(tab: string, file: File) {
    const prefixMap: Record<string, string> = {
      'insurance:detail': 'DetailInsurance',
      'insurance:draft': 'DraftInsurance',
      'draftBL:shipping': 'ShippingParticular',
      'draftBL:draft': 'DraftBL',
      'blDate': 'OriginalBL'
    };
    const expectedPrefix = prefixMap[tab] || 'Document';
    const expectedInvoiceNo = task.correctValues['INVOICE NO.'] || task.id;
    const latestRevision = revisionStates[activeTab]?.count ?? 0;

    const { error, revNum } = validateFileName(file.name, expectedPrefix, expectedInvoiceNo, latestRevision);
    if (error) {
      alert(error);
      return;
    }

    // Check consistency for pairs (Insurance or Draft B/L)
    if (activeTab === 'insurance' || activeTab === 'draftBL') {
      const otherTab = tab.endsWith(':detail') ? tab.replace(':detail', ':draft')
        : tab.endsWith(':draft') ? tab.replace(':draft', tab.includes('insurance') ? ':detail' : ':shipping')
          : tab.endsWith(':shipping') ? tab.replace(':shipping', ':draft')
            : null;

      if (otherTab) {
        if (uploadStates[otherTab] === 'done') {
          // Second file: must match the first file's revision
          const firstFileRev = partialRevisionStates[`${activeTab}:first`];
          if (firstFileRev !== undefined && revNum !== firstFileRev) {
            // Non-blocking warning instead of error
            console.warn(`Revision number (${revNum}) is not the same as the first document (${firstFileRev}).`);
          }

        } else {
          // First file: set the expected revision for the second file
          setPartialRevisionStates(prev => ({ ...prev, [`${activeTab}:first`]: revNum! }));
        }
      }
    }

    onUploadStateChange(tab, 'loading');
    const url = URL.createObjectURL(file);
    setTimeout(() => {
      onUploadStateChange(tab, 'done', revNum);
      onFileUrlChange(tab, url);
      saveFile(`${task.id}:${tab}`, file);

      // Single-file tabs can close immediately; multi-file pairs are handled by useEffect
      if (!tab.includes(':')) {
        setIsReUploading(false);
      }
    }, 2500);
  }


  function handleCancelReUpload() {
    setIsReUploading(false);
    onCancelResetForUpload(activeTab);
  }

  function handleReUploadAfterAction(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const expectedInvoiceNo = task.correctValues['INVOICE NO.'] || task.id;
    const latestRevision = revisionStates[activeTab]?.count ?? 0;

    // handleReUploadAfterAction is currently only accessible for customFormality
    const { error, revNum } = validateFileName(file.name, 'CustomsFormality', expectedInvoiceNo, latestRevision);
    if (error) {
      alert(error);
      e.target.value = '';
      return;
    }

    e.target.value = '';
    const wasActioned = task.verifications[activeTab] === 'Approved' || task.verifications[activeTab] === 'Rejected';
    setReUploadPending(true);
    const url = URL.createObjectURL(file);
    setTimeout(() => {
      setReUploadPending(false);
      if (wasActioned) onResetForUpload(activeTab);
      const receiveDate = activeTab === 'customFormality'
        ? (task.correctValues['CF Receive Date'] ?? task.submittedDate?.slice(0, 10))
        : undefined;
      onIncrementRevision(activeTab, revNum, undefined, receiveDate);
      onFileUrlChange(activeTab, url);
      saveFile(`${task.id}:${activeTab}`, file);
    }, 2500);
  }

  const isUploadTab = activeTab === 'insurance' || activeTab === 'draftBL' || activeTab === 'blDate';
  const isInsuranceDone = (uploadStates['insurance:detail'] ?? 'idle') === 'done' && (uploadStates['insurance:draft'] ?? 'idle') === 'done';
  const isDraftBLDone = (uploadStates['draftBL:shipping'] ?? 'idle') === 'done' && (uploadStates['draftBL:draft'] ?? 'idle') === 'done';
  const isBLDateDone = (uploadStates['blDate'] ?? 'idle') === 'done';

  // Automatically close re-upload slots when multi-file sections are done
  useEffect(() => {
    if (isReUploading) {
      if (activeTab === 'insurance' && isInsuranceDone) {
        setIsReUploading(false);
      } else if (activeTab === 'draftBL' && isDraftBLDone) {
        setIsReUploading(false);
      }
    }
  }, [isInsuranceDone, isDraftBLDone, activeTab, isReUploading]);

  const currentUploadState: UploadState = isUploadTab
    ? (activeTab === 'insurance' ? (isInsuranceDone ? 'done' : 'idle')
      : activeTab === 'draftBL' ? (isDraftBLDone ? 'done' : 'idle')
        : (isBLDateDone ? 'done' : 'idle'))
    : 'done';

  const oblDoc = task.documents.find(d => d.type === 'Original B/L');
  const blDateHasData = !!(oblDoc && oblDoc.values[oblDoc.fieldMapping['B/L Date']]);

  const isTabPending =
    (activeTab === 'insurance' && !isInsuranceDone)
    || (activeTab === 'draftBL' && !isDraftBLDone)
    || (activeTab === 'blDate' && !isBLDateDone);

  // Auto-log "verified" the first time a tab is viewed with a non-pending status
  useEffect(() => {
    if (!isTabPending && !actionLogs[activeTab]) {
      onLogVerified(activeTab);
    }
  }, [activeTab, task.id, isTabPending]);

  // Auto-set Rev. 00 the first time a tab has data (before any manual upload)
  useEffect(() => {
    if (!isTabPending && !revisionStates[activeTab]) {
      const receiveDate = activeTab === 'customFormality'
        ? (task.correctValues['CF Receive Date'] ?? task.submittedDate?.slice(0, 10))
        : undefined;
      onIncrementRevision(activeTab, undefined, true, receiveDate);
    }
  }, [activeTab, task.id, isTabPending]);

  // Reset re-upload loading state when switching tabs
  useEffect(() => { setReUploadPending(false); }, [activeTab, task.id]);


  const effectiveVerifications: Verifications = {
    ...task.verifications,
    customFormality: task.verifications.customFormality === 'Pending Verification' ? 'Attention' : task.verifications.customFormality,
    insurance: (uploadStates['insurance'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.insurance,
    draftBL: (uploadStates['draftBL'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.draftBL,
    blDate: (uploadStates['blDate'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.blDate,
  };
  const effectiveStatus = deriveOverallStatus(effectiveVerifications);
  const activeTabDef = TABS.find(t => t.type === activeTab)!;

  const activeTabStatus: VerificationStatus = (() => {
    let s: VerificationStatus = displayTask.verifications[activeTab];
    if (activeTab === 'blDate' && (uploadStates['blDate'] ?? 'idle') !== 'done') s = 'Pending Verification';
    else if (activeTab === 'customFormality' && s === 'Pending Verification') s = 'Attention';
    return s;
  })();
  const isTabActioned = activeTabStatus === 'Approved' || activeTabStatus === 'Rejected';

  useEffect(() => {
    if (!autoApprove || (task.assignedTo && task.assignedTo !== currentUser)) return;
    if (activeTabStatus === 'Match') {
      onApproveVerification(activeTab, 'Auto Approved', 'Auto Approved is enabled in Settings');
    }
  }, [activeTab, activeTabStatus, autoApprove, task.assignedTo, currentUser, onApproveVerification]);

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
              let tabStatus: VerificationStatus = isActive ? displayTask.verifications[tab.type] : task.verifications[tab.type];
              if (tab.type === 'blDate' && !blDateHasData) tabStatus = 'Pending Verification';
              else if ((tab.type === 'customFormality' || tab.type === 'blDate') && tabStatus === 'Pending Verification') tabStatus = 'Attention';
              return (
                <button
                  key={tab.type}
                  onClick={() => onTabChange(tab.type)}
                  className={`flex flex-col items-start gap-1.5 px-5 py-3 border-b-2 transition-colors whitespace-nowrap min-w-0 ${isActive
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
                    <div className="flex items-center gap-1">
                      {latestRevision > 0 && (
                        <button
                          onClick={() => {
                            const idx = availableRevisions.indexOf(activeRevision);
                            if (idx > 0) setViewingRevision(prev => ({ ...prev, [activeTab]: availableRevisions[idx - 1] }));
                          }}
                          disabled={activeRevision <= availableRevisions[0]}
                          className={`p-0.5 rounded transition-colors ${activeRevision <= availableRevisions[0] ? 'text-gray-300 cursor-not-allowed' : 'text-[#0056b8] hover:bg-[#e8f0fb]'}`}
                          title="Previous Revision"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap transition-colors ${activeRevision !== latestRevision ? 'bg-[#fff2f0] text-[#c2410c] border-[#ffdfd6]' : 'bg-[#e8f0fb] text-[#0056b8] border-[#c5d9f5]'}`}>
                        {formatRevDate(activeRevision === latestRevision ? (revisionStates[activeTab]?.date ?? new Date().toISOString()) : (revisionHistory[activeTab]?.[activeRevision]?.date ?? revisionStates[activeTab]?.date ?? new Date().toISOString()))}
                        {activeRevision !== latestRevision && <span className="ml-1">(past revision)</span>}
                      </span>
                      {latestRevision > 0 && (
                        <button
                          onClick={() => {
                            const idx = availableRevisions.indexOf(activeRevision);
                            if (idx >= 0 && idx < availableRevisions.length - 1) setViewingRevision(prev => ({ ...prev, [activeTab]: availableRevisions[idx + 1] }));
                          }}
                          disabled={activeRevision >= latestRevision}
                          className={`p-0.5 rounded transition-colors ${activeRevision >= latestRevision ? 'text-gray-300 cursor-not-allowed' : 'text-[#0056b8] hover:bg-[#e8f0fb]'}`}
                          title="Next Revision"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* <p className="text-xs text-gray-500 mt-0.5">
                  Green cells indicate matching values. Orange cells indicate mismatches.
                </p> */}
                <div className="h-4 mt-0.5" />
                {displayActionLog && (() => {
                  const log = displayActionLog;
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
                  <>
                    {activeTab === 'insurance' ? (
                      <>
                        <button
                          onClick={() => window.open(displayFileUrls['insurance:detail'] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Detail Insurance
                        </button>
                        <button
                          onClick={() => window.open(displayFileUrls['insurance:draft'] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Draft Insurance
                        </button>
                      </>
                    ) : activeTab === 'draftBL' ? (
                      <>
                        <button
                          onClick={() => window.open(displayFileUrls['draftBL:shipping'] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Shipping Particular
                        </button>
                        <button
                          onClick={() => window.open(displayFileUrls['draftBL:draft'] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Draft B/L
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => window.open(displayFileUrls[activeTab] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Original B/L
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const isApproved = task.verifications[activeTab] === 'Approved';
                        const isRejected = task.verifications[activeTab] === 'Rejected';

                        setIsReUploading(true);
                        setViewingRevision(prev => ({ ...prev, [activeTab]: latestRevision })); // Jump back to latest on re-upload

                        if (activeTab === 'insurance') {
                          onUploadStateChange('insurance:detail', 'idle');
                          onUploadStateChange('insurance:draft', 'idle');
                          onUploadStateChange('insurance', 'idle');
                        } else if (activeTab === 'draftBL') {
                          onUploadStateChange('draftBL:shipping', 'idle');
                          onUploadStateChange('draftBL:draft', 'idle');
                          onUploadStateChange('draftBL', 'idle');
                        } else if (activeTab === 'blDate') {
                          onUploadStateChange('blDate', 'idle');
                        }
                        onResetForUpload(activeTab);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-md transition-colors shrink-0 text-[#0056b8] border-[#0056b8] hover:bg-[#e8f0fb]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 14v5h16v-5M12 3v12M7 8l5-5 5 5" />
                      </svg>
                      Upload File
                    </button>
                  </>
                )}
                {/* Upload File always available for Custom Formality / B/L Date */}
                {!isUploadTab && (
                  <>
                    {activeTab === 'customFormality' && (
                      <button
                        onClick={() => window.open(displayFileUrls[activeTab] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Custom Formality
                      </button>
                    )}
                    <input ref={reUploadActionRef} type="file" accept="*" className="hidden" onChange={handleReUploadAfterAction} />
                    <button
                      onClick={() => {
                        if (!reUploadPending) {
                          setViewingRevision(prev => ({ ...prev, [activeTab]: latestRevision })); // Jump back to latest
                          reUploadActionRef.current?.click();
                        }
                      }}
                      disabled={reUploadPending}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-md transition-colors shrink-0 ${reUploadPending ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed' : 'text-[#0056b8] border-[#0056b8] hover:bg-[#e8f0fb]'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 14v5h16v-5M12 3v12M7 8l5-5 5 5" />
                      </svg>
                      {reUploadPending ? 'Uploading…' : 'Upload File'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => !isTabPending && exportVerificationTab(displayTask, activeTab)}
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
                      disabled={isTabPending || isTabActioned || activeRevision !== latestRevision}
                      className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending || isTabActioned || activeRevision !== latestRevision ? 'border border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border border-red-600 text-red-600 hover:bg-red-50'}`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => !isTabPending && !isTabActioned && !(autoApprove && task.assignedTo === currentUser && activeTabStatus !== 'Attention') && setConfirm({ action: 'approve', vt: activeTab })}
                      disabled={isTabPending || isTabActioned || (autoApprove && task.assignedTo === currentUser && activeTabStatus !== 'Attention') || activeRevision !== latestRevision}
                      title={!isTabActioned && autoApprove && task.assignedTo === currentUser && activeTabStatus !== 'Attention' ? 'Auto Approve is enabled in Settings' : undefined}
                      className={`px-4 py-1.5 text-xs rounded transition-colors ${isTabPending || isTabActioned || (autoApprove && task.assignedTo === currentUser && activeTabStatus !== 'Attention') || activeRevision !== latestRevision ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0056b8] text-white hover:bg-[#004a9f]'}`}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {displayActionLog?.reason && (
            <div className={`px-6 py-3 border-b border-gray-200 shrink-0 text-xs ${displayActionLog.action === 'approve' ? 'bg-[#ebf7ed]' : 'bg-[#faeaea]'}`}>
              <span className="font-semibold text-gray-700">Status: </span>
              <span className={`font-medium ${displayActionLog.action === 'approve' ? 'text-[#267d36]' : 'text-[#8c1d1d]'}`}>
                {displayActionLog.reason}
              </span>
              {displayActionLog.remark && (
                <span className="text-gray-600">
                  &nbsp;&nbsp;·&nbsp;&nbsp;<span className="font-semibold text-gray-700">Remark: </span>{displayActionLog.remark}
                </span>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0 overflow-auto">
            {activeTab === 'insurance' ? (
              <>
                {(isReUploading || !isInsuranceDone) && (
                  <div className="border-b border-gray-100 shrink-0">
                    <div className="px-6 pt-4 flex justify-end items-center">

                      {isReUploading && (
                        <button
                          onClick={handleCancelReUpload}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Cancel upload"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                    </div>
                    <div className="flex items-stretch gap-4 p-6 pt-2">
                      <UploadSlot
                        label="Detail for Insurance Purpose"
                        state={uploadStates['insurance:detail'] ?? 'idle'}
                        onUpload={(file) => handleUpload('insurance:detail', file)}
                      />
                      <UploadSlot
                        label="Draft Insurance"
                        state={uploadStates['insurance:draft'] ?? 'idle'}
                        onUpload={(file) => handleUpload('insurance:draft', file)}
                      />
                    </div>
                  </div>
                )}

                {(isInsuranceDone || isReUploading) && (
                  <ComparisonTable task={displayTask} verificationType={activeTab} onUpdateTask={onUpdateTask} isReadOnly={isTabActioned || activeRevision !== latestRevision} activeRevision={activeRevision} />
                )}
              </>
            ) : activeTab === 'draftBL' ? (
              <>
                {(isReUploading || !isDraftBLDone) && (
                  <div className="border-b border-gray-100 shrink-0">
                    <div className="px-6 pt-4 flex justify-end items-center">

                      {isReUploading && (
                        <button
                          onClick={handleCancelReUpload}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Cancel upload"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                    </div>
                    <div className="flex items-stretch gap-4 p-6 pt-2">
                      <UploadSlot
                        label="Shipping Particular"
                        state={uploadStates['draftBL:shipping'] ?? 'idle'}
                        onUpload={(file) => handleUpload('draftBL:shipping', file)}
                      />
                      <UploadSlot
                        label="Draft B/L"
                        state={uploadStates['draftBL:draft'] ?? 'idle'}
                        onUpload={(file) => handleUpload('draftBL:draft', file)}
                      />
                    </div>
                  </div>
                )}

                {(isDraftBLDone || isReUploading) && (
                  <ComparisonTable task={displayTask} verificationType={activeTab} onUpdateTask={onUpdateTask} isReadOnly={isTabActioned || activeRevision !== latestRevision} activeRevision={activeRevision} />
                )}
              </>
            ) : activeTab === 'blDate' ? (
              isBLDateDone ? (
                <BLDateTable task={displayTask} onUpdateTask={onUpdateTask} isReadOnly={isTabActioned || activeRevision !== latestRevision} />
              ) : (
                <div className="flex items-stretch gap-4 p-6">
                  <UploadSlot
                    label="Original Bill of Lading"
                    state={uploadStates['blDate'] ?? 'idle'}
                    onUpload={(file) => handleUpload('blDate', file)}
                  />
                </div>
              )
            ) : (
              <ComparisonTable task={displayTask} verificationType={activeTab} onUpdateTask={onUpdateTask} isReadOnly={isTabActioned || activeRevision !== latestRevision} activeRevision={activeRevision} />
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
