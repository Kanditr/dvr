import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Navbar from './components/Navbar';
import TaskTable from './components/TaskTable';
import TaskFilterBar from './components/TaskFilterBar';
import CiOverviewPage from './components/CiOverviewPage';
import LlmComparePage from './components/LlmComparePage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { mockTasks, deriveOverallStatus, insDocs, dblDocs } from './data/mockData';
import type { Task, TaskStatus, VerificationStatus, Verifications } from './data/mockData';
import type { UploadState } from './components/DocumentUploadGate';
import { computeVerificationStatus } from './utils/comparison';
import { validateFileName, validateCFFileName } from './utils/validation';
import { saveFile, deleteFilesForTask } from './utils/fileStorage';

export type VerificationType = 'customFormality' | 'insurance' | 'draftBL' | 'blDate';
export type ActionLog = { action: 'verified' | 'approve' | 'reject'; timestamp: string; by: string; reason?: string; remark?: string };

const VALID_TABS: VerificationType[] = ['customFormality', 'insurance', 'draftBL', 'blDate'];

type View =
  | { page: 'home' }
  | { page: 'ci-overview'; taskId: string; tab: VerificationType }
  | { page: 'llm-compare' }
  | { page: 'settings' };

function parseHash(): View {
  const hash = window.location.hash.slice(1); // remove leading #
  if (hash.startsWith('/ci/')) {
    const parts = hash.slice(4).split('/');
    const taskId = parts[0];
    const tab = parts[1] as VerificationType;
    if (taskId) return { page: 'ci-overview', taskId, tab: VALID_TABS.includes(tab) ? tab : 'customFormality' };
  }
  if (hash === '/llm-compare') return { page: 'llm-compare' };
  return { page: 'home' };
}

function setHash(view: View) {
  if (view.page === 'ci-overview') window.location.hash = `/ci/${view.taskId}/${view.tab}`;
  else if (view.page === 'llm-compare') window.location.hash = '/llm-compare';
  else window.location.hash = '/';
}

function getEffectiveVerifications(task: Task, taskUploadStates: Record<string, UploadState>): Verifications {
  const getTabStatus = (tabKey: VerificationType): VerificationStatus => {
    if (tabKey === 'insurance' || tabKey === 'draftBL' || tabKey === 'blDate') {
      if ((taskUploadStates[tabKey] ?? 'idle') !== 'done') return 'Pending Verification';
    }
    const status = task.verifications[tabKey];
    if ((tabKey === 'customFormality' || tabKey === 'blDate') && status === 'Pending Verification') {
      return 'Attention';
    }
    return status;
  };

  return {
    customFormality: getTabStatus('customFormality'),
    insurance: getTabStatus('insurance'),
    draftBL: getTabStatus('draftBL'),
    blDate: getTabStatus('blDate'),
  };
}

// ─── Generate a fully-populated task from an uploaded CF document ─────────────
const CF_CLONE_TYPES = new Set(['Shipping Advice', 'Custom Invoice', 'Packing List', 'Letter of Credit', 'Shipping Instruction']);

function formatDateDMY(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function generateUploadedTask(allCurrentTasks: Task[], defaultAssignee: string, fileName?: string): Task {
  let newInvoiceNo: string;

  // Format: CustomsFormality_<CI no>_<yyyymmdd>.pdf
  const fileMatch = fileName?.match(/^CustomsFormality_(.+)_\d{8}\.pdf$/i);
  if (fileMatch) {
    newInvoiceNo = fileMatch[1];
  } else {
    const maxNum = allCurrentTasks
      .map(t => parseInt(t.correctValues['INVOICE NO.'] ?? '0', 10))
      .filter(n => n > 1000000000)
      .reduce((max, n) => Math.max(max, n), 1015050020);
    newInvoiceNo = String(maxNum + 1);
  }

  const newRefNo = `325201${newInvoiceNo.slice(-4)}`;

  // Fall back to any task if no Match ones exist
  const cfTasks = mockTasks.filter(t => t.verifications.customFormality === 'Match');
  const templatePool = cfTasks.length > 0 ? cfTasks : mockTasks;
  const template = templatePool[Math.floor(Math.random() * templatePool.length)];

  const oldInvoice = template.correctValues['INVOICE NO.'];
  const oldRef = template.correctValues['REF NO.'];
  const newId = `upload-${Date.now()}`;

  const todayDMY = formatDateDMY(new Date());
  const todayISO = new Date().toLocaleDateString('en-CA');

  const correctValues: Record<string, string> = { ...template.correctValues };
  for (const [key, val] of Object.entries(correctValues)) {
    if (typeof val === 'string') {
      correctValues[key] = val
        .replace(new RegExp(oldInvoice, 'g'), newInvoiceNo)
        .replace(new RegExp(oldRef, 'g'), newRefNo);
    }
  }
  correctValues['GI Date'] = todayDMY;
  correctValues['Manual Billing Date'] = todayDMY;
  correctValues['CF Receive Date'] = todayISO;
  delete correctValues['ETD Date'];

  const DATE_FIELD_KEYS = new Set(['etd_date', 'gi_date', 'billing_date', 'date', 'loading_date', 'issue_date', 'bl_date']);
  const documents = template.documents
    .filter(doc => CF_CLONE_TYPES.has(doc.type))
    .map(doc => {
      const values = { ...doc.values };
      for (const [key, val] of Object.entries(values)) {
        if (typeof val === 'string') {
          let v = val
            .replace(new RegExp(oldInvoice, 'g'), newInvoiceNo)
            .replace(new RegExp(oldRef, 'g'), newRefNo);
          if (DATE_FIELD_KEYS.has(key.toLowerCase())) v = todayDMY;
          values[key] = v;
        }
      }
      return {
        ...doc,
        id: `${newId}-${doc.type.toLowerCase().replace(/[\s/]+/g, '-')}`,
        values,
      };
    });

  // For CIs starting with "99", simulate missing documents (1–3 doc types removed)
  const finalDocuments = newInvoiceNo.startsWith('99')
    ? (() => {
        const allTypes = Array.from(CF_CLONE_TYPES);
        const numToRemove = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...allTypes].sort(() => Math.random() - 0.5);
        const toRemove = new Set(shuffled.slice(0, numToRemove));
        return documents.filter(d => !toRemove.has(d.type));
      })()
    : documents;

  return {
    ...template,
    id: newId,
    assignedTo: defaultAssignee,
    submittedDate: new Date().toISOString(),
    status: 'Pending',
    verifications: {
      customFormality: 'Match',
      insurance: 'Pending Verification',
      draftBL: 'Pending Verification',
      blDate: 'Pending Verification',
    },
    correctValues,
    documents: finalDocuments,
    lastUpdate: new Date().toISOString(),
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('dvr:currentUser', null);

  // Clear stale non-email values stored before the email migration
  const effectiveUser = currentUser && currentUser.includes('@') ? currentUser : null;
  // Derived early so it can be used as keys in per-user storage below
  const CURRENT_USER = effectiveUser ?? 'jane.doe@pttgcgroup.com';
  const isAdmin = CURRENT_USER === 'admin.admin@pttgcgroup.com';

  const [view, setView] = useState<View>(parseHash);
  const [prevView, setPrevView] = useState<View>({ page: 'home' });

  // Per-user auto-approve toggle — stored as {email: boolean} so the hook key stays stable
  const [autoApprovePerUser, setAutoApprovePerUser] = useLocalStorage<Record<string, boolean>>('dvr:autoApprovePerUser', {});
  const autoApprove = autoApprovePerUser[CURRENT_USER] ?? false;

  const [onlyMyTasks, setOnlyMyTasks] = useLocalStorage<boolean>('dvr:onlyMyTasks', false);

  // Persisted per-user excluded set — tasks already Match at toggle-ON time, must not be auto-approved
  const [autoApproveExcludedData, setAutoApproveExcludedData] = useLocalStorage<Record<string, string[]>>('dvr:autoApproveExcluded', {});
  const autoApproveExcluded = useMemo(() => new Set(autoApproveExcludedData[CURRENT_USER] ?? []), [autoApproveExcludedData, CURRENT_USER]);

  const [uploadStates, setUploadStates] = useLocalStorage<Record<string, Record<string, UploadState>>>(
    'dvr:uploadStates', {}
  );

  const [taskOverrides, setTaskOverrides] = useLocalStorage<{ id: string; status: TaskStatus; verifications: Verifications; assignedTo?: string; documents?: any[]; correctValues?: Record<string, string>; fieldStatusOverrides?: Record<string, 'match' | 'mismatch'>; cellStatusOverrides?: Record<string, boolean>; manuallyEditedCells?: Record<string, true>; fieldEditHistory?: Record<string, Array<{ value: string; timestamp: string }>> }>('dvr:taskOverrides', []);

  const [actionLogs, setActionLogs] = useLocalStorage<Record<string, Record<string, ActionLog>>>('dvr:actionLogs', {});

  const [revisionStates, setRevisionStates] = useLocalStorage<Record<string, Record<string, { count: number; date: string; receiveDate?: string }>>>('dvr:revisionStates', {});

  const [revisionHistory, setRevisionHistory] = useLocalStorage<Record<string, Record<string, Record<number, any>>>>('dvr:revisionHistory', {});
  const [fileUrlsHistory, setFileUrlsHistory] = useState<Record<string, Record<string, Record<number, Record<string, string>>>>>({});

  const [uploadedTaskDefs, setUploadedTaskDefs] = useLocalStorage<Task[]>('dvr:uploadedTasks', []);
  const [touchedUploadedIds, setTouchedUploadedIds] = useLocalStorage<string[]>('dvr:touchedUploads', []);

  const [deletedTaskIds, setDeletedTaskIds] = useLocalStorage<string[]>('dvr:deletedTasks', []);

  // Seed demo data for CI 1015055190
  useEffect(() => {
    const T = '2026050190';
    setRevisionStates(prev => {
      if (prev[T]?.['customFormality']) return prev;
      return { ...prev, [T]: { ...(prev[T] ?? {}), customFormality: { count: 0, date: '2026-01-15T08:00:00.000Z', receiveDate: '2026-01-15' } } };
    });
    setActionLogs(prev => {
      if (prev[T]?.['customFormality']) return prev;
      return { ...prev, [T]: { ...(prev[T] ?? {}), customFormality: { action: 'approve', timestamp: '2026-01-15T10:30:00.000Z', by: 'ice.ktpl@gmail.com', reason: 'Document fields matched correctly', remark: '' } } };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Temporary storage for ObjectURLs (not persistent across refreshes)
  const [fileUrls, setFileUrls] = useState<Record<string, Record<string, string>>>({});

  // baseTasks: only manually actioned states — never auto-approve mutations
  const tasks = useMemo(() => {
    const allBase = [...uploadedTaskDefs, ...mockTasks].filter(t => !deletedTaskIds.includes(t.id));
    const merged = allBase.map(t => {
      const o = taskOverrides.find(x => x.id === t.id);
      const overrides = {
        ...t,
        status: o?.status ?? t.status,
        assignedTo: o?.assignedTo ?? t.assignedTo,
        documents: o?.documents ?? t.documents,
        correctValues: o?.correctValues ?? t.correctValues,
        fieldStatusOverrides: o?.fieldStatusOverrides ?? t.fieldStatusOverrides,
        cellStatusOverrides: o?.cellStatusOverrides ?? t.cellStatusOverrides,
        manuallyEditedCells: o?.manuallyEditedCells ?? t.manuallyEditedCells,
        fieldEditHistory: o?.fieldEditHistory ?? t.fieldEditHistory,
        lastUpdate: o?.lastUpdate ?? t.lastUpdate
      };

      const baseVerifications = o?.verifications ?? t.verifications;
      const newVerifications: Verifications = { ...baseVerifications };
      const tabs: VerificationType[] = ['customFormality', 'insurance', 'draftBL', 'blDate'];
      for (const tab of tabs) {
        if (newVerifications[tab] !== 'Approved' && newVerifications[tab] !== 'Rejected') {
          const computed = computeVerificationStatus(overrides as Task, tab);
          if (computed) {
            newVerifications[tab] = computed;
          }
        }
      }

      overrides.verifications = newVerifications;
      overrides.status = deriveOverallStatus(newVerifications);
      return overrides as Task;
    });

    return merged;
  }, [uploadedTaskDefs, mockTasks, deletedTaskIds, taskOverrides, uploadStates]);

  // Pre-populate revisionStates so landing page dates are correct before clicking into each task
  useEffect(() => {
    setRevisionStates(prev => {
      let changed = false;
      const updated = { ...prev };
      for (const task of tasks) {
        if (!updated[task.id]?.['customFormality']) {
          changed = true;
          const receiveDate = task.correctValues['CF Receive Date'] ?? task.submittedDate?.slice(0, 10);
          updated[task.id] = {
            ...(updated[task.id] ?? {}),
            customFormality: { count: 0, date: task.submittedDate ?? new Date().toISOString(), receiveDate },
          };
        }
      }
      return changed ? updated : prev;
    });
  }, [tasks]);

  const pendingAutoApproveRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pendingAutoApproveRef.current.size === 0) return;
    if (!autoApprove) {
      pendingAutoApproveRef.current.clear();
      return;
    }

    pendingAutoApproveRef.current.forEach(item => {
      const [taskId, tab] = item.split('|') as [string, VerificationType];
      const t = tasks.find(x => x.id === taskId);
      if (!t || t.assignedTo !== CURRENT_USER) {
        pendingAutoApproveRef.current.delete(item);
        return;
      }

      let changed = false;
      const nextV = { ...t.verifications };
      if (nextV[tab] === 'Match') {
        nextV[tab] = 'Approved';
        changed = true;
      }

      if (changed) {
        updateTaskOverride(taskId, { verifications: nextV, status: deriveOverallStatus(nextV) });
      }
      pendingAutoApproveRef.current.delete(item);
    });
  }, [tasks, autoApprove, CURRENT_USER]);

  function applyAutoApprovePersistent(taskId: string, tab: VerificationType) {
    if (!autoApprove) return;
    pendingAutoApproveRef.current.add(`${taskId}|${tab}`);
  }

  function incrementRevision(taskId: string, tab: string, specificRev?: number, defaultToZero?: boolean, receiveDate?: string) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const current = revisionStates[taskId]?.[tab];
      let nextCount: number;
      if (specificRev !== undefined) {
        if (current !== undefined && specificRev < current.count) return;
        nextCount = specificRev;
      } else {
        nextCount = current === undefined ? 0 : (defaultToZero ? current.count : current.count + 1);
      }

      const currentRevNum = current?.count ?? 0;

      setRevisionHistory(h => ({
        ...h,
        [taskId]: {
          ...(h[taskId] ?? {}),
          [tab]: {
            ...(h[taskId]?.[tab] ?? {}),
            [currentRevNum]: {
              documents: task.documents,
              correctValues: task.correctValues,
              verifications: task.verifications,
              fieldStatusOverrides: task.fieldStatusOverrides,
              cellStatusOverrides: task.cellStatusOverrides,
              actionLog: actionLogs[taskId]?.[tab],
              receiveDate: current?.receiveDate,
              date: current?.date ?? new Date().toISOString()
            }
          }
        }
      }));

      if (fileUrls[taskId]) {
        setFileUrlsHistory(fh => ({
          ...fh,
          [taskId]: {
            ...(fh[taskId] ?? {}),
            [tab]: {
              ...(fh[taskId]?.[tab] ?? {}),
              [currentRevNum]: { ...fileUrls[taskId] }
            }
          }
        }));
      }

      setRevisionStates(prev => ({
        ...prev,
        [taskId]: {
          ...(prev[taskId] ?? {}),
          [tab]: { count: nextCount, date: new Date().toISOString(), receiveDate },
        },
      }));
    }
  }

  const [processingUpload, setProcessingUpload] = useState(false);
  const uploadCFRef = useRef<HTMLInputElement>(null);

  const availableUsers = useMemo(() => {
    const emails = new Set(mockTasks.map(t => t.assignedTo));
    emails.add('admin.admin@pttgcgroup.com');
    if (effectiveUser) emails.add(effectiveUser);
    return ['', ...Array.from(emails).sort()];
  }, [effectiveUser]);

  const uploadedTaskIds = useMemo(() => new Set(uploadedTaskDefs.map(t => t.id)), [uploadedTaskDefs]);

  const removableTaskIds = useMemo(() =>
    new Set(uploadedTaskDefs.map(t => t.id).filter(id => !touchedUploadedIds.includes(id))),
    [uploadedTaskDefs, touchedUploadedIds]
  );

  function markUploadedTouched(taskId: string) {
    if (uploadedTaskIds.has(taskId) && !touchedUploadedIds.includes(taskId)) {
      setTouchedUploadedIds(prev => [...prev, taskId]);
    }
  }

  function updateTaskOverride(taskId: string, partial: Partial<Task>) {
    setTaskOverrides(prev => {
      const idx = prev.findIndex(o => o.id === taskId);
      const existing = idx >= 0 ? prev[idx] : {};
      const nextOverride = {
        ...existing,
        id: taskId,
        ...partial,
        lastUpdate: new Date().toISOString()
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = nextOverride as any;
        return next;
      }
      return [...prev, nextOverride as any];
    });
  }

  function handleCFUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const { error, invoiceNo } = validateCFFileName(file.name);
    if (error) {
      alert(error);
      e.target.value = '';
      return;
    }

    if (invoiceNo) {
      const existingTask = tasks.find(t => (t.correctValues['INVOICE NO.'] || t.id) === invoiceNo);
      if (existingTask) {
        alert(`CI No. ${invoiceNo} already exists. Please upload the revised document in the Custom Formality page instead.`);
        e.target.value = '';
        return;
      }
    }

    e.target.value = '';
    const url = URL.createObjectURL(file);

    setProcessingUpload(true);
    setTimeout(() => {
      setProcessingUpload(false);
      const snapshot = [...uploadedTaskDefs, ...tasks];
      const newTask = generateUploadedTask(snapshot, CURRENT_USER, file.name);

      const rawMissing = Array.from(CF_CLONE_TYPES).filter(
        type => !newTask.documents.some((d: any) => d.type === type)
      );
      if (rawMissing.length > 0) {
        const lcMissing = rawMissing.includes('Letter of Credit');
        const siMissing = rawMissing.includes('Shipping Instruction');
        // LC and SI are mutually exclusive — only one is required per shipment
        const finalMissing = rawMissing
          .filter(t => t !== 'Letter of Credit' && t !== 'Shipping Instruction')
          .concat(lcMissing && siMissing ? ['Letter of Credit/Shipping Instruction'] : []);
        if (finalMissing.length > 0) {
          newTask.correctValues['CF_MISSING_DOCS'] = finalMissing.join(',');
        }
      }

      saveFile(`${newTask.id}:customFormality`, file);
      setFileUrls(prev => ({
        ...prev,
        [newTask.id]: { ...(prev[newTask.id] ?? {}), customFormality: url }
      }));
      setUploadedTaskDefs(prev => [newTask, ...prev]);
    }, 3000);
  }

  function handleAssignTask(taskId: string, email: string) {
    if (email) markUploadedTouched(taskId);
    updateTaskOverride(taskId, { assignedTo: email });
    if (uploadedTaskIds.has(taskId)) {
      setUploadedTaskDefs(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: email } : t));
    }
  }

  function handleRemoveTask(taskId: string) {
    deleteFilesForTask(taskId);
    setDeletedTaskIds(prev => [...prev, taskId]);
    setUploadedTaskDefs(prev => prev.filter(t => t.id !== taskId));
    setTaskOverrides(prev => prev.filter(o => o.id !== taskId));
    setUploadStates(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setActionLogs(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setRevisionStates(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setTouchedUploadedIds(prev => prev.filter(id => id !== taskId));
  }

  // taskOverrides is now the source of truth, handled by updateTaskOverride
  // (Removed redundant useEffect and baseTasks mapping)

  function handleCancelResetForUpload(taskId: string, verificationType: VerificationType) {
    const current = revisionStates[taskId]?.[verificationType];
    if (!current || current.count === 0) return;

    const prevRevNum = current.count - 1;
    const historyEntry = revisionHistory[taskId]?.[verificationType]?.[prevRevNum];
    if (!historyEntry) return;

    // Restore state from history
    updateTaskOverride(taskId, {
      verifications: historyEntry.verifications,
      documents: historyEntry.documents,
      correctValues: historyEntry.correctValues,
      fieldStatusOverrides: historyEntry.fieldStatusOverrides,
      cellStatusOverrides: historyEntry.cellStatusOverrides,
      status: deriveOverallStatus(historyEntry.verifications)
    });

    if (historyEntry.actionLog) {
      setActionLogs(prev => ({
        ...prev,
        [taskId]: { ...(prev[taskId] ?? {}), [verificationType]: historyEntry.actionLog }
      }));
    }

    // Revert revision count
    setRevisionStates(prev => {
      const taskRevs = { ...(prev[taskId] ?? {}) };
      taskRevs[verificationType] = { ...taskRevs[verificationType], count: prevRevNum };
      return { ...prev, [taskId]: taskRevs };
    });

    // Remove the history entry we just restored from
    setRevisionHistory(prev => {
      const taskHistory = { ...(prev[taskId] ?? {}) };
      const typeHistory = { ...(taskHistory[verificationType] ?? {}) };
      delete typeHistory[prevRevNum];
      taskHistory[verificationType] = typeHistory;
      return { ...prev, [taskId]: taskHistory };
    });

    // Restore upload states to 'done' without re-triggering completion logic
    setUploadStates(prev => {
      const taskStates = { ...(prev[taskId] ?? {}), [verificationType]: 'done' as UploadState };
      if (verificationType === 'insurance') {
        taskStates['insurance:detail'] = 'done';
        taskStates['insurance:draft'] = 'done';
      } else if (verificationType === 'draftBL') {
        taskStates['draftBL:shipping'] = 'done';
        taskStates['draftBL:draft'] = 'done';
      }
      return { ...prev, [taskId]: taskStates };
    });
  }

  const [search, setSearch] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const [showAllApproved, setShowAllApproved] = useState(false);
  const [tabFilters, setTabFilters] = useState<Record<VerificationType, VerificationStatus[] | 'All'>>({
    customFormality: 'All',
    insurance: 'All',
    draftBL: 'All',
    blDate: 'All',
  });

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    function onHashChange() { setView(parseHash()); }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigateToCiOverview(taskId: string, tab: VerificationType = 'customFormality') {
    markUploadedTouched(taskId);
    const next: View = { page: 'ci-overview', taskId, tab };
    setHash(next);
    setView(next);
    window.scrollTo(0, 0);
  }

  function handleTabChange(tab: VerificationType) {
    if (view.page !== 'ci-overview') return;
    const next: View = { ...view, tab };
    setHash(next);
    setView(next);
  }

  function navigateHome() {
    setHash({ page: 'home' });
    setView({ page: 'home' });
    window.scrollTo(0, 0);
  }

  function handleApprove(taskId: string) {
    updateTaskOverride(taskId, { status: 'Approved' });
    navigateHome();
  }

  function handleReject(taskId: string) {
    updateTaskOverride(taskId, { status: 'Rejected' });
    navigateHome();
  }

  function handleApproveVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const verifications = { ...t.verifications, [verificationType]: 'Approved' as VerificationStatus };
    const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
    updateTaskOverride(taskId, { verifications, status: deriveOverallStatus(effective) });

    setActionLogs(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [verificationType]: { action: 'approve', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }

  function handleUploadStateChange(taskId: string, tab: string, state: UploadState, revNum?: number) {
    setUploadStates(prev => {
      const taskStates = { ...(prev[taskId] ?? {}), [tab]: state };

      if (state === 'done') {
        // Insurance completion check
        if (tab === 'insurance:detail' || tab === 'insurance:draft') {
          if (taskStates['insurance:detail'] === 'done' && taskStates['insurance:draft'] === 'done' && taskStates['insurance'] !== 'done') {
            taskStates['insurance'] = 'done';
            setTimeout(() => finalizeInsuranceCompletion(taskId), 0);
          }
        }
        // Draft B/L completion check
        else if (tab === 'draftBL:shipping' || tab === 'draftBL:draft') {
          if (taskStates['draftBL:shipping'] === 'done' && taskStates['draftBL:draft'] === 'done' && taskStates['draftBL'] !== 'done') {
            taskStates['draftBL'] = 'done';
            setTimeout(() => finalizeDraftBLCompletion(taskId), 0);
          }
        }
        // B/L Date completion check
        else if (tab === 'blDate') {
          setTimeout(() => finalizeBLDateCompletion(taskId), 0);
        }
      }
      return { ...prev, [taskId]: taskStates };
    });
  }

  function finalizeInsuranceCompletion(taskId: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const currentRevCount = revisionStates[taskId]?.['insurance']?.count;
    const isRevision = currentRevCount !== undefined && currentRevCount > 0;

    const mismatch = !isRevision ? { 'AMOUNT INSURED HEREUNDER': `USD ${((Math.random() * 500000) + 100000).toFixed(2)}` } : undefined;
    const newInsDocs = insDocs(taskId, t.correctValues, mismatch);

    const filteredDocs = t.documents.filter(d => d.type !== 'Draft Insurance' && d.type !== 'Detail for Insurance Purpose');

    const newFieldOverrides = { ...(t.fieldStatusOverrides || {}) };
    const newCellOverrides = { ...(t.cellStatusOverrides || {}) };
    Object.keys(newFieldOverrides).forEach(k => { if (k.startsWith('insurance:')) delete newFieldOverrides[k]; });
    Object.keys(newCellOverrides).forEach(k => { if (k.startsWith('insurance:')) delete newCellOverrides[k]; });

    updateTaskOverride(taskId, {
      documents: [...filteredDocs, ...newInsDocs],
      fieldStatusOverrides: newFieldOverrides,
      cellStatusOverrides: newCellOverrides
    });
  }

  function finalizeDraftBLCompletion(taskId: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const currentRevCount = revisionStates[taskId]?.['draftBL']?.count;
    const isRevision = currentRevCount !== undefined && currentRevCount > 0;

    const mismatch = !isRevision ? { 'Gross Weight': '999,999 KG' } : undefined;
    const mismatch2 = !isRevision ? { 'Gross Weight': '888,888 KG' } : undefined;
    const newDblDocs = dblDocs(taskId, t.correctValues, mismatch, mismatch2);

    const filteredDocs = t.documents.filter(d => d.type !== 'Draft B/L' && d.type !== 'Shipping Particular');

    const newFieldOverrides = { ...(t.fieldStatusOverrides || {}) };
    const newCellOverrides = { ...(t.cellStatusOverrides || {}) };
    Object.keys(newFieldOverrides).forEach(k => { if (k.startsWith('draftBL:')) delete newFieldOverrides[k]; });
    Object.keys(newCellOverrides).forEach(k => { if (k.startsWith('draftBL:')) delete newCellOverrides[k]; });

    updateTaskOverride(taskId, {
      documents: [...filteredDocs, ...newDblDocs],
      fieldStatusOverrides: newFieldOverrides,
      cellStatusOverrides: newCellOverrides
    });
  }

  function finalizeBLDateCompletion(taskId: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    let nextDocs = t.documents;
    if (!t.documents.find(d => d.type === 'Original B/L')) {
      const newDoc = {
        id: `${taskId}-obl`,
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: t.correctValues['GI Date'] || '21 Mar 2026' }
      };
      nextDocs = [...t.documents, newDoc];
    }

    const newFieldOverrides = { ...(t.fieldStatusOverrides || {}) };
    const newCellOverrides = { ...(t.cellStatusOverrides || {}) };
    Object.keys(newFieldOverrides).forEach(k => { if (k.startsWith('blDate:')) delete newFieldOverrides[k]; });
    Object.keys(newCellOverrides).forEach(k => { if (k.startsWith('blDate:')) delete newCellOverrides[k]; });

    updateTaskOverride(taskId, {
      documents: nextDocs,
      fieldStatusOverrides: newFieldOverrides,
      cellStatusOverrides: newCellOverrides
    });
  }

  function handleRejectVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const verifications = { ...t.verifications, [verificationType]: 'Rejected' as VerificationStatus };
    const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
    updateTaskOverride(taskId, { verifications, status: deriveOverallStatus(effective) });

    setActionLogs(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [verificationType]: { action: 'reject', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }

  function handleLogVerified(taskId: string, verificationType: VerificationType) {
    setActionLogs(prev => {
      if (prev[taskId]?.[verificationType]) return prev; // already logged, don't overwrite
      return {
        ...prev,
        [taskId]: { ...prev[taskId], [verificationType]: { action: 'verified', timestamp: new Date().toISOString(), by: CURRENT_USER } },
      };
    });
    updateTaskOverride(taskId, {});
  }

  function handleResetVerificationForUpload(taskId: string, verificationType: VerificationType) {
    // Increment revision to capture current (approved/rejected) state in history
    incrementRevision(taskId, verificationType, undefined, false);

    const original = mockTasks.find(t => t.id === taskId) || uploadedTaskDefs.find(t => t.id === taskId);
    if (!original) return;
    const originalStatus = original.verifications[verificationType];
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const verifications = { ...t.verifications, [verificationType]: originalStatus };
    const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
    updateTaskOverride(taskId, { verifications, status: deriveOverallStatus(effective) });

    setActionLogs(prev => {
      const taskLogs = { ...prev[taskId] };
      delete taskLogs[verificationType];
      return { ...prev, [taskId]: taskLogs };
    });
  }

  function handleIncrementRevision(taskId: string, vt: VerificationType, revNum?: number, defaultToZero?: boolean, receiveDate?: string) {
    incrementRevision(taskId, vt, revNum, defaultToZero, receiveDate);
  }

  function handleUpdateTask(updatedTask: Task) {
    updateTaskOverride(updatedTask.id, {
      documents: updatedTask.documents,
      correctValues: updatedTask.correctValues,
      verifications: updatedTask.verifications,
      status: updatedTask.status,
      fieldStatusOverrides: updatedTask.fieldStatusOverrides,
      cellStatusOverrides: updatedTask.cellStatusOverrides,
      manuallyEditedCells: updatedTask.manuallyEditedCells,
      fieldEditHistory: updatedTask.fieldEditHistory,
    });
    if (uploadedTaskIds.has(updatedTask.id)) {
      setUploadedTaskDefs(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }

  }

  const currentTask =
    view.page === 'ci-overview'
      ? tasks.find(t => t.id === view.taskId) ?? null
      : null;

  // If we are in ci-overview but the task is missing (e.g. wiped by storage clear), go home
  useEffect(() => {
    if (view.page === 'ci-overview' && !currentTask && tasks.length > 0) {
      navigateHome();
    }
  }, [view.page, currentTask, tasks.length]);

  const baseFilteredTasks = tasks.filter(t => {
    const invoiceNo = t.correctValues['INVOICE NO.'] ?? t.id;
    const matchesSearch = (() => {
      if (search === '') return true;
      try {
        // Escape special characters except * and ?, then convert wildcards to regex
        const regexPattern = search
          .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape other regex chars
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(invoiceNo) || regex.test(t.assignedTo);
      } catch (e) {
        // Fallback to includes if regex is invalid
        return (
          invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          t.assignedTo.toLowerCase().includes(search.toLowerCase())
        );
      }
    })();
    const effectiveV = getEffectiveVerifications(t, uploadStates[t.id] ?? {});
    const matchesUser = !onlyMyTasks || t.assignedTo === CURRENT_USER;

    const matchesDate = (() => {
      if (!dateFrom && !dateTo) return true;
      const revState = revisionStates[t.id]?.['customFormality'];
      const rev0 = revisionHistory[t.id]?.['customFormality']?.[0];
      const firstDate = revState && revState.count > 0
        ? (rev0?.receiveDate ?? rev0?.date ?? t.correctValues['CF Receive Date'] ?? t.submittedDate)
        : (revState?.receiveDate ?? revState?.date ?? t.correctValues['CF Receive Date'] ?? t.submittedDate);
      const dateStr = (firstDate ?? '').slice(0, 10);
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      return true;
    })();

    return matchesSearch && matchesUser && matchesDate;
  });

  const allApprovedHidden = baseFilteredTasks.filter(t => {
    const ev = getEffectiveVerifications(t, uploadStates[t.id] ?? {});
    return VALID_TABS.every(tab => ev[tab] === 'Approved');
  });
  const filteredTasks = showAllApproved
    ? baseFilteredTasks
    : baseFilteredTasks.filter(t => !allApprovedHidden.includes(t));

  function handleAutoApproveChange(value: boolean) {
    setAutoApprovePerUser(prev => ({ ...prev, [CURRENT_USER]: value }));
    if (value) {
      // Snapshot every task+tab whose EFFECTIVE status is Match — these won't be auto-approved (Pt 5)
      const excluded: string[] = [];
      tasks.forEach(task => {
        const effectiveV = getEffectiveVerifications(task, uploadStates[task.id] ?? {});
        VALID_TABS.forEach(tab => {
          if (effectiveV[tab] === 'Match') excluded.push(`${task.id}:${tab}`);
        });
      });
      setAutoApproveExcludedData(prev => ({ ...prev, [CURRENT_USER]: excluded }));
    } else {
      setAutoApproveExcludedData(prev => ({ ...prev, [CURRENT_USER]: [] }));
    }
  }

  function navigateToLlmCompare() {
    const next: View = { page: 'llm-compare' };
    setHash(next);
    setView(next);
    window.scrollTo(0, 0);
  }

  function navigateToSettings() {
    setPrevView(view);
    setView({ page: 'settings' });
    window.scrollTo(0, 0);
  }

  function navigateBack() {
    setView(prevView);
    window.scrollTo(0, 0);
  }

  function handleLogin(displayName: string) {
    setCurrentUser(displayName);
  }

  function handleLogout() {
    setCurrentUser(null);
    setView({ page: 'home' });
    setHash({ page: 'home' });
  }

  if (!effectiveUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-[#f3f6f8] flex flex-col overflow-hidden">
      <Navbar currentUser={effectiveUser} autoApprove={autoApprove} onAutoApproveChange={handleAutoApproveChange} onlyMyTasks={onlyMyTasks} onOnlyMyTasksChange={v => {
            setOnlyMyTasks(v);
            setTaskPage(1);
            if (v && view.page === 'ci-overview') {
              const task = tasks.find(t => t.id === (view as any).taskId);
              if (!task || task.assignedTo !== CURRENT_USER) navigateHome();
            }
          }} onNavigateHome={navigateHome} onLogout={handleLogout} />

      <div className="flex-1 min-h-0 pt-14 flex flex-col overflow-hidden">
        {view.page === 'home' && (
          <div className="max-w-screen-xl mx-auto w-full px-6 py-6 flex flex-col min-h-0 flex-1">
            <div className="mb-6 shrink-0">
              <h1 className="text-xl font-bold text-gray-800">Document Verification Tasks</h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and verify shipping documents against system records.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
              <TaskFilterBar
                search={search}
                onSearchChange={v => { setSearch(v); setTaskPage(1); }}
                tabFilters={tabFilters}
                onTabFilterChange={(key, value) => { setTabFilters(prev => ({ ...prev, [key]: value })); setTaskPage(1); }}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={v => { setDateFrom(v); setTaskPage(1); }}
                onDateToChange={v => { setDateTo(v); setTaskPage(1); }}
                showAllApproved={showAllApproved}
                onToggleShowAllApproved={() => { setShowAllApproved(v => !v); setTaskPage(1); }}
                allApprovedCount={allApprovedHidden.length}
                onReset={() => { setSearch(''); setTabFilters({ customFormality: 'All', insurance: 'All', draftBL: 'All', blDate: 'All' }); setDateFrom(''); setDateTo(''); setShowAllApproved(false); setTaskPage(1); }}
                onUploadClick={() => uploadCFRef.current?.click()}
              />
              <input ref={uploadCFRef} type="file" accept="*" className="hidden" onChange={handleCFUploadChange} />
              <div className="flex-1 min-h-0 overflow-hidden">
                <TaskTable
                  tasks={filteredTasks}
                  uploadStates={uploadStates}
                  tabFilters={tabFilters}
                  onSelectTask={(id, tab) => navigateToCiOverview(id, tab)}
                  page={taskPage}
                  onPageChange={setTaskPage}
                  isAdmin={isAdmin}
                  uploadedTaskIds={uploadedTaskIds}
                  removableTaskIds={removableTaskIds}
                  availableUsers={availableUsers}
                  onAssignTask={handleAssignTask}
                  onRemoveTask={handleRemoveTask}
                  firstReceivedDates={Object.fromEntries(
                    filteredTasks.map(task => {
                      const revState = revisionStates[task.id]?.['customFormality'];
                      const rev0 = revisionHistory[task.id]?.['customFormality']?.[0];
                      const firstDate = revState && revState.count > 0
                        ? (rev0?.receiveDate ?? rev0?.date ?? task.correctValues['CF Receive Date'] ?? task.submittedDate)
                        : (revState?.receiveDate ?? revState?.date ?? task.correctValues['CF Receive Date'] ?? task.submittedDate);
                      return [task.id, firstDate ?? ''];
                    })
                  )}
                />
              </div>
            </div>

            {processingUpload && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
                  <svg className="w-10 h-10 text-[#0056b8] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-800">Processing document…</p>
                  <p className="text-xs text-gray-400">Extracting and verifying field data</p>
                </div>
              </div>
            )}
          </div>
        )}

        {view.page === 'llm-compare' && (
          <div className="flex-1 overflow-auto">
            <LlmComparePage />
          </div>
        )}

        {view.page === 'settings' && (
          <div className="flex-1 overflow-auto">
            <SettingsPage
              onlyMyTasks={onlyMyTasks}
              onOnlyMyTasksChange={setOnlyMyTasks}
              onBack={navigateBack}
            />
          </div>
        )}

        {view.page === 'ci-overview' && currentTask && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <CiOverviewPage
              task={currentTask}
              activeTab={view.tab}
              onTabChange={handleTabChange}
              onBack={navigateHome}
              onApproveVerification={(vt, reason, remark) => handleApproveVerification(currentTask.id, vt, reason, remark)}
              onRejectVerification={(vt, reason, remark) => handleRejectVerification(currentTask.id, vt, reason, remark)}
              uploadStates={uploadStates[currentTask.id] ?? {}}
              onUploadStateChange={(tab, state, revNum) => handleUploadStateChange(currentTask.id, tab, state, revNum)}
              autoApprove={autoApprove}
              autoApproveExcluded={autoApproveExcluded}
              currentUser={CURRENT_USER}
              actionLogs={actionLogs[currentTask.id] ?? {}}
              onLogVerified={(vt) => handleLogVerified(currentTask.id, vt)}
              onResetForUpload={(vt) => handleResetVerificationForUpload(currentTask.id, vt)}
              onCancelResetForUpload={(vt) => handleCancelResetForUpload(currentTask.id, vt)}
              revisionStates={revisionStates[currentTask.id] ?? {}}
              onIncrementRevision={(vt, revNum, defaultToZero, receiveDate) => handleIncrementRevision(currentTask.id, vt, revNum, defaultToZero, receiveDate)}
              onUpdateTask={handleUpdateTask}
              fileUrls={fileUrls[currentTask.id] ?? {}}
              onFileUrlChange={(tab, url) => setFileUrls(prev => ({
                ...prev,
                [currentTask.id]: { ...(prev[currentTask.id] ?? {}), [tab]: url }
              }))}
              revisionHistory={revisionHistory[currentTask.id] ?? {}}
              fileUrlsHistory={fileUrlsHistory[currentTask.id] ?? {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
