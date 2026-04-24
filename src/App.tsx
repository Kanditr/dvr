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
import { validateFileName } from './utils/validation';

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
  const customFormality = task.verifications.customFormality === 'Pending Verification'
    ? 'Attention' as VerificationStatus
    : task.verifications.customFormality;
  return {
    ...task.verifications,
    customFormality,
    insurance: (taskUploadStates['insurance'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.insurance,
    draftBL: (taskUploadStates['draftBL'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.draftBL,
    blDate: (taskUploadStates['blDate'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.blDate,
  };
}

// Auto Approve logic moved to useEffect to ensure permanence

const DATA_VERSION = 'v2026-04i';

function clearStaleStorage() {
  const stored = localStorage.getItem('dvr:dataVersion');
  if (stored !== DATA_VERSION) {
    ['dvr:taskOverrides', 'dvr:uploadStates', 'dvr:actionLogs', 'dvr:uploadedTasks', 'dvr:revisionStates', 'dvr:touchedUploads', 'dvr:deletedTasks'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('dvr:dataVersion', DATA_VERSION);
  }
}
clearStaleStorage();

// ─── Generate a fully-populated task from an uploaded CF document ─────────────
const CF_CLONE_TYPES = new Set(['Shipping Advice', 'Custom Invoice', 'Packing List', 'Letter of Credit', 'Shipping Instruction']);

function generateUploadedTask(allCurrentTasks: Task[], defaultAssignee: string, fileName?: string): Task {
  let newInvoiceNo: string;
  
  // New format: PREFIX_INVOICENORevREVISION.pdf
  const fileMatch = fileName?.match(/^[A-Z_]+_(.+)Rev\d+\.pdf$/i);
  if (fileMatch) {
    newInvoiceNo = fileMatch[1];
  } else {
    // Fallback
    const maxNum = allCurrentTasks
      .map(t => parseInt(t.correctValues['INVOICE NO.'] ?? '0', 10))
      .filter(n => n > 1000000000)
      .reduce((max, n) => Math.max(max, n), 1015050020);
    newInvoiceNo = String(maxNum + 1);
  }

  const newRefNo = `325201${newInvoiceNo.slice(-4)}`;

  // Pick a random CF-all-matches task as the data template
  const cfTasks = mockTasks.filter(t => t.verifications.customFormality === 'Match');
  const template = cfTasks[Math.floor(Math.random() * cfTasks.length)];

  const oldInvoice = template.correctValues['INVOICE NO.'];
  const oldRef = template.correctValues['REF NO.'];
  const newId = `upload-${Date.now()}`;

  // Clone correctValues, replacing invoice / ref numbers globally
  const correctValues: Record<string, string> = { ...template.correctValues };
  for (const [key, val] of Object.entries(correctValues)) {
    if (typeof val === 'string') {
      correctValues[key] = val
        .replace(new RegExp(oldInvoice, 'g'), newInvoiceNo)
        .replace(new RegExp(oldRef, 'g'), newRefNo);
    }
  }

  // Clone ONLY Custom Formality documents, replacing invoice / ref wherever they appear
  const documents = template.documents
    .filter(doc => CF_CLONE_TYPES.has(doc.type))
    .map(doc => {
      const values = { ...doc.values };
      for (const [key, val] of Object.entries(values)) {
        if (typeof val === 'string') {
          values[key] = val
            .replace(new RegExp(oldInvoice, 'g'), newInvoiceNo)
            .replace(new RegExp(oldRef, 'g'), newRefNo);
        }
      }
      return {
        ...doc,
        id: `${newId}-${doc.type.toLowerCase().replace(/[\s/]+/g, '-')}`,
        values,
      };
    });

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
    documents,
    lastUpdate: new Date().toISOString(),
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('dvr:currentUser', null);

  // Clear stale non-email values stored before the email migration
  const effectiveUser = currentUser && currentUser.includes('@') ? currentUser : null;

  const [view, setView] = useState<View>(parseHash);
  const [prevView, setPrevView] = useState<View>({ page: 'home' });

  const [autoApprove, setAutoApprove] = useLocalStorage<boolean>('dvr:autoApprove', false);
  const [onlyMyTasks, setOnlyMyTasks] = useLocalStorage<boolean>('dvr:onlyMyTasks', false);

  const CURRENT_USER = effectiveUser ?? 'jane.doe@pttgcgroup.com';
  const isAdmin = CURRENT_USER === 'admin.admin@pttgcgroup.com';

  const [uploadStates, setUploadStates] = useLocalStorage<Record<string, Record<string, UploadState>>>(
    'dvr:uploadStates', {}
  );

  const [taskOverrides, setTaskOverrides] = useLocalStorage<{ id: string; status: TaskStatus; verifications: Verifications; assignedTo?: string; documents?: any[]; correctValues?: Record<string, string> }[]>('dvr:taskOverrides', []);

  const [actionLogs, setActionLogs] = useLocalStorage<Record<string, Record<string, ActionLog>>>('dvr:actionLogs', {});

  const [revisionStates, setRevisionStates] = useLocalStorage<Record<string, Record<string, { count: number; date: string }>>>('dvr:revisionStates', {});

  function incrementRevision(taskId: string, tab: string, specificRev?: number, defaultToZero?: boolean) {
    setRevisionStates(prev => {
      const current = prev[taskId]?.[tab];
      let nextCount: number;
      if (specificRev !== undefined) {
        // Prevent setting a lower revision if it already exists
        if (current !== undefined && specificRev < current.count) {
          return prev;
        }
        nextCount = specificRev;
      } else {
        // If defaultToZero is true and it doesn't exist, we start at 0.
        // If it exists, we increment it.
        if (current === undefined) {
          nextCount = 0;
        } else {
          // If defaultToZero is true, we might NOT want to increment? 
          // Usually auto-set means "ensure it has a value".
          nextCount = defaultToZero ? current.count : current.count + 1;
        }
      }
      return {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [tab]: { count: nextCount, date: new Date().toISOString() },
        },
      };
    });
  }

  const [uploadedTaskDefs, setUploadedTaskDefs] = useLocalStorage<Task[]>('dvr:uploadedTasks', []);
  const [touchedUploadedIds, setTouchedUploadedIds] = useLocalStorage<string[]>('dvr:touchedUploads', []);

  const [deletedTaskIds, setDeletedTaskIds] = useLocalStorage<string[]>('dvr:deletedTasks', []);

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

  // Handle Auto-Approve permanently
  useEffect(() => {
    if (!autoApprove) return;

    const toUpdate: any[] = [];
    tasks.forEach(t => {
      // Only auto-approve tasks assigned to the CURRENT_USER
      if (t.assignedTo !== CURRENT_USER) return;

      let changed = false;
      const nextV = { ...t.verifications };
      (['customFormality', 'insurance', 'draftBL', 'blDate'] as VerificationType[]).forEach(k => {
        // If it's currently a Match, auto-approve it permanently
        if (nextV[k] === 'Match') {
          nextV[k] = 'Approved';
          changed = true;
        }
      });

      if (changed) {
        toUpdate.push({
          id: t.id,
          verifications: nextV,
          status: deriveOverallStatus(nextV),
          lastUpdate: new Date().toISOString()
        });
      }
    });

    if (toUpdate.length > 0) {
      setTaskOverrides(prev => {
        const next = [...prev];
        toUpdate.forEach(upd => {
          const idx = next.findIndex(o => o.id === upd.id);
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...upd };
          } else {
            next.push(upd);
          }
        });
        return next;
      });
    }
  }, [tasks, autoApprove, setTaskOverrides, CURRENT_USER]);

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

    const { error, invoiceNo, revNum } = validateFileName(file.name, 'CustomsFormality');
    if (error) {
      alert(error);
      e.target.value = '';
      return;
    }

    if (revNum !== 0) {
      alert('Only the first version (Rev0) can be uploaded from the main page. For revised versions, please upload them directly within the specific task page.');
      e.target.value = '';
      return;
    }

    if (invoiceNo) {
      const existingTask = tasks.find(t => (t.correctValues['INVOICE NO.'] || t.id) === invoiceNo);
      if (existingTask) {
        alert(`Invoice No. ${invoiceNo} already exists. Please upload the revised document in the Custom Formality page instead.`);
        e.target.value = '';
        return;
      }
    }

    e.target.value = '';
    const url = URL.createObjectURL(file);
    
    // Capture current task list before async delay
    const snapshot = [...uploadedTaskDefs, ...tasks];
    setProcessingUpload(true);
    setTimeout(() => {
      setProcessingUpload(false);
      const snapshot = [...uploadedTaskDefs, ...tasks]; // tasks is already derived
      const newTask = generateUploadedTask(snapshot, '', file.name);
      
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

  const [search, setSearch] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [tabFilters, setTabFilters] = useState<Record<VerificationType, VerificationStatus | 'All'>>({
    customFormality: 'All',
    insurance: 'All',
    draftBL: 'All',
    blDate: 'All',
  });

  // Compute min/max dates across all tasks for date range defaults
  const { minDate, maxDate } = useMemo(() => {
    const dates = tasks
      .map(t => t.submittedDate.split('T')[0])
      .filter(Boolean)
      .sort();
    return {
      minDate: dates[0] ?? '',
      maxDate: dates[dates.length - 1] ?? '',
    };
  }, [tasks]);

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
      [taskId]: { ...prev[taskId], [verificationType]: { action: 'approve', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }

  function handleUploadStateChange(taskId: string, tab: string, state: UploadState, revNum?: number) {
    setUploadStates(prev => {
      const taskStates = { ...(prev[taskId] ?? {}), [tab]: state };
      if (state === 'done') {
        if (tab === 'insurance:detail' || tab === 'insurance:draft') {
          if (taskStates['insurance:detail'] === 'done' && taskStates['insurance:draft'] === 'done') {
            taskStates['insurance'] = 'done';
          }
        } else if (tab === 'draftBL:shipping' || tab === 'draftBL:draft') {
          if (taskStates['draftBL:shipping'] === 'done' && taskStates['draftBL:draft'] === 'done') {
            taskStates['draftBL'] = 'done';
          }
        }
      }
      return { ...prev, [taskId]: taskStates };
    });

    if (tab === 'blDate' && state === 'done') {
      const t = tasks.find(x => x.id === taskId);
      if (t && !t.documents.find(d => d.type === 'Original B/L')) {
        const newDoc = {
          id: `${taskId}-obl`,
          type: 'Original B/L',
          fieldMapping: { 'B/L Date': 'bl_date' },
          values: { bl_date: t.correctValues['GI Date'] || '21 Mar 2026' }
        };
        updateTaskOverride(taskId, { documents: [...t.documents, newDoc] });
      }
    }

    if (state === 'done') {
      const t = tasks.find(x => x.id === taskId);
      if (t) {
        if (tab === 'insurance:detail' || tab === 'insurance:draft') {
          const cur = uploadStates[taskId] ?? {};
          const otherTab = tab === 'insurance:detail' ? 'insurance:draft' : 'insurance:detail';
          const otherDone = cur[otherTab] === 'done';
          if (otherDone) {
            incrementRevision(taskId, 'insurance', revNum, false);
            // Generate mock documents for insurance if not already present
            if (!t.documents.some(d => d.type === 'Draft Insurance')) {
               const mockIns = insDocs(taskId, t.correctValues);
               updateTaskOverride(taskId, { documents: [...t.documents, ...mockIns] });
            }
          }
        } else if (tab === 'draftBL:shipping' || tab === 'draftBL:draft') {
          const cur = uploadStates[taskId] ?? {};
          const otherTab = tab === 'draftBL:shipping' ? 'draftBL:draft' : 'draftBL:shipping';
          const otherDone = cur[otherTab] === 'done';
          if (otherDone) {
            incrementRevision(taskId, 'draftBL', revNum, false);
            // Generate mock documents for draftBL if not already present
            if (!t.documents.some(d => d.type === 'Draft B/L')) {
               const mockDbl = dblDocs(taskId, t.correctValues);
               updateTaskOverride(taskId, { documents: [...t.documents, ...mockDbl] });
            }
          }
        } else if (tab === 'blDate') {
           incrementRevision(taskId, tab, revNum, false);
        } else {
           incrementRevision(taskId, tab, revNum, false);
        }
      }
    }
    updateTaskOverride(taskId, {});
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
    const original = mockTasks.find(t => t.id === taskId);
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

  function handleIncrementRevision(taskId: string, vt: VerificationType, revNum?: number, defaultToZero?: boolean) {
    incrementRevision(taskId, vt, revNum, defaultToZero);
  }

  function handleUpdateTask(updatedTask: Task) {
    updateTaskOverride(updatedTask.id, {
      documents: updatedTask.documents,
      correctValues: updatedTask.correctValues,
      verifications: updatedTask.verifications,
      status: updatedTask.status,
      fieldStatusOverrides: updatedTask.fieldStatusOverrides
    });
    if (uploadedTaskIds.has(updatedTask.id)) {
      setUploadedTaskDefs(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  }

  const currentTask =
    view.page === 'ci-overview'
      ? tasks.find(t => t.id === view.taskId) ?? null
      : null;

  const filteredTasks = tasks.filter(t => {
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
    const overallStatus = deriveOverallStatus(getEffectiveVerifications(t, uploadStates[t.id] ?? {}));
    const matchesStatus = statusFilter === 'All' || overallStatus === statusFilter;

    // Everyone sees all tasks by default.
    // "Only My Tasks" toggle narrows to the current user for all roles.
    const matchesUser = isAdmin
      ? (!onlyMyTasks || t.assignedTo === CURRENT_USER)
      : (!onlyMyTasks || t.assignedTo === CURRENT_USER);

    // Date range filter on submittedDate (extracting date part for comparison)
    const taskDate = (t.submittedDate ?? '').split('T')[0];
    const effectiveFrom = dateFrom || minDate;
    const effectiveTo = dateTo || maxDate;
    const matchesDate = (!effectiveFrom || taskDate >= effectiveFrom) && (!effectiveTo || taskDate <= effectiveTo);

    return matchesSearch && matchesStatus && matchesUser && matchesDate;
  });

  function handleAutoApproveChange(value: boolean) {
    setAutoApprove(value);
    if (value) {
      setOnlyMyTasks(true);
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
      <Navbar currentUser={effectiveUser} onNavigateHome={navigateHome} onLogout={handleLogout} />

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
                statusFilter={statusFilter}
                onStatusChange={v => { setStatusFilter(v); setTaskPage(1); }}
                tabFilters={tabFilters}
                onTabFilterChange={(key, value) => { setTabFilters(prev => ({ ...prev, [key]: value })); setTaskPage(1); }}
                onlyMyTasks={onlyMyTasks}
                onOnlyMyTasksChange={v => { setOnlyMyTasks(v); setTaskPage(1); }}
                autoApprove={autoApprove}
                onAutoApproveChange={handleAutoApproveChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                minDate={minDate}
                maxDate={maxDate}
                onDateFromChange={v => { setDateFrom(v); setTaskPage(1); }}
                onDateToChange={v => { setDateTo(v); setTaskPage(1); }}
                onReset={() => { setSearch(''); setStatusFilter('All'); setTabFilters({ customFormality: 'All', insurance: 'All', draftBL: 'All', blDate: 'All' }); setDateFrom(''); setDateTo(''); setTaskPage(1); }}
                onUploadCF={() => uploadCFRef.current?.click()}
              />
              <input ref={uploadCFRef} type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleCFUploadChange} />
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
              autoApprove={autoApprove}
              onAutoApproveChange={handleAutoApproveChange}
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
              currentUser={CURRENT_USER}
              actionLogs={actionLogs[currentTask.id] ?? {}}
              onLogVerified={(vt) => handleLogVerified(currentTask.id, vt)}
              onResetForUpload={(vt) => handleResetVerificationForUpload(currentTask.id, vt)}
              revisionStates={revisionStates[currentTask.id] ?? {}}
              onIncrementRevision={(vt, revNum, defaultToZero) => handleIncrementRevision(currentTask.id, vt, revNum, defaultToZero)}
              onUpdateTask={handleUpdateTask}
              fileUrls={fileUrls[currentTask.id] ?? {}}
              onFileUrlChange={(tab, url) => setFileUrls(prev => ({
                ...prev,
                [currentTask.id]: { ...(prev[currentTask.id] ?? {}), [tab]: url }
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
