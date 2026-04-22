import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Navbar from './components/Navbar';
import TaskTable from './components/TaskTable';
import TaskFilterBar from './components/TaskFilterBar';
import CiOverviewPage from './components/CiOverviewPage';
import LlmComparePage from './components/LlmComparePage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { mockTasks, deriveOverallStatus } from './data/mockData';
import type { Task, TaskStatus, VerificationStatus, Verifications } from './data/mockData';
import type { UploadState } from './components/DocumentUploadGate';

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
  const oblDoc = task.documents.find(d => d.type === 'Original B/L');
  const blDateHasData = !!(oblDoc && oblDoc.values[oblDoc.fieldMapping['B/L Date']]);
  const customFormality = task.verifications.customFormality === 'Pending Verification'
    ? 'Needs Attention' as VerificationStatus
    : task.verifications.customFormality;
  const blDate = !blDateHasData
    ? 'Pending Verification' as VerificationStatus
    : task.verifications.blDate === 'Pending Verification'
      ? 'Needs Attention' as VerificationStatus
      : task.verifications.blDate;
  return {
    ...task.verifications,
    customFormality,
    insurance: (taskUploadStates['insurance'] ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.insurance,
    draftBL:   (taskUploadStates['draftBL']   ?? 'idle') !== 'done' ? 'Pending Verification' : task.verifications.draftBL,
    blDate,
  };
}

function applyAutoApprove(
  tasks: Task[],
  uploadStates: Record<string, Record<string, UploadState>>,
  actionLogs: Record<string, Record<string, ActionLog>>
): Task[] {
  return tasks.map(task => {
    const taskUploadStates = uploadStates[task.id] ?? {};
    const taskLogs = actionLogs[task.id] ?? {};
    const effective = getEffectiveVerifications(task, taskUploadStates);
    const verifications = { ...task.verifications };
    let changed = false;
    (['customFormality', 'insurance', 'draftBL', 'blDate'] as VerificationType[]).forEach(key => {
      // Skip tabs that were manually approved or rejected — never overwrite them
      const wasManuallyActioned = taskLogs[key]?.action === 'approve' || taskLogs[key]?.action === 'reject';
      const isAlreadyApprovedOrRejected = task.verifications[key] === 'Approved' || task.verifications[key] === 'Rejected';
      if (wasManuallyActioned || isAlreadyApprovedOrRejected) return;
      if (effective[key] === 'All Matches') {
        verifications[key] = 'Approved' as VerificationStatus;
        changed = true;
      }
    });
    if (!changed) return task;
    const newEffective = getEffectiveVerifications({ ...task, verifications }, taskUploadStates);
    return { ...task, verifications, status: deriveOverallStatus(newEffective) };
  });
}

const DATA_VERSION = 'v2026-04h';

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

function generateUploadedTask(allCurrentTasks: Task[], defaultAssignee: string): Task {
  // Find the next invoice number following the 1015050XXX pattern
  const maxNum = allCurrentTasks
    .map(t => parseInt(t.correctValues['INVOICE NO.'] ?? '0', 10))
    .filter(n => n > 1000000000)
    .reduce((max, n) => Math.max(max, n), 1015050020);
  const newNum = maxNum + 1;
  const newInvoiceNo = String(newNum);
  const newRefNo = `325201${String(newNum).slice(-4)}`;

  // Pick a random CF-all-matches task as the data template
  const cfTasks = mockTasks.filter(t => t.verifications.customFormality === 'All Matches');
  const template = cfTasks[Math.floor(Math.random() * cfTasks.length)];

  const oldInvoice = template.correctValues['INVOICE NO.'];
  const oldRef    = template.correctValues['REF NO.'];
  const newId = `upload-${Date.now()}`;

  // Clone correctValues, replacing invoice / ref numbers
  const correctValues: Record<string, string> = {
    ...template.correctValues,
    'INVOICE NO.': newInvoiceNo,
    'REF NO.': newRefNo,
    "BUYER'S ORDER NO.": newRefNo,
  };

  // Clone only CF documents, replacing invoice / ref wherever they appear
  const documents = template.documents
    .filter(d => CF_CLONE_TYPES.has(d.type))
    .map(doc => {
      const values = { ...doc.values };
      const fm = doc.fieldMapping;
      if (fm['INVOICE NO.']       && values[fm['INVOICE NO.']]       === oldInvoice) values[fm['INVOICE NO.']]       = newInvoiceNo;
      if (fm['REF NO.']           && values[fm['REF NO.']]           === oldRef)     values[fm['REF NO.']]           = newRefNo;
      if (fm["BUYER'S ORDER NO."] && values[fm["BUYER'S ORDER NO."]] === oldRef)     values[fm["BUYER'S ORDER NO."]] = newRefNo;
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
    submittedDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    verifications: {
      customFormality: 'All Matches',
      insurance: 'Pending Verification',
      draftBL: 'Pending Verification',
      blDate: 'Pending Verification',
    },
    correctValues,
    documents,
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

  const [taskOverrides, setTaskOverrides] = useLocalStorage<{ id: string; status: TaskStatus; verifications: Verifications; assignedTo?: string }[]>('dvr:taskOverrides', []);

  const [actionLogs, setActionLogs] = useLocalStorage<Record<string, Record<string, ActionLog>>>('dvr:actionLogs', {});

  const [revisionStates, setRevisionStates] = useLocalStorage<Record<string, Record<string, { count: number; date: string }>>>('dvr:revisionStates', {});

  function incrementRevision(taskId: string, tab: string) {
    setRevisionStates(prev => {
      const current = prev[taskId]?.[tab];
      return {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [tab]: { count: (current?.count ?? -1) + 1, date: new Date().toISOString() },
        },
      };
    });
  }

  const [uploadedTaskDefs, setUploadedTaskDefs] = useLocalStorage<Task[]>('dvr:uploadedTasks', []);
  const [touchedUploadedIds, setTouchedUploadedIds] = useLocalStorage<string[]>('dvr:touchedUploads', []);

  const [deletedTaskIds, setDeletedTaskIds] = useLocalStorage<string[]>('dvr:deletedTasks', []);

  // baseTasks: only manually actioned states — never auto-approve mutations
  const [baseTasks, setBaseTasks] = useState<Task[]>(() => {
    const allTasks = [...uploadedTaskDefs, ...mockTasks].filter(t => !deletedTaskIds.includes(t.id));
    return allTasks.map(t => {
      const o = taskOverrides.find(x => x.id === t.id);
      if (!o) return t;
      return { ...t, status: o.status, verifications: o.verifications, ...(o.assignedTo !== undefined ? { assignedTo: o.assignedTo } : {}) };
    });
  });

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

  function handleCFUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file naming convention: <numbers>_rev<numbers>.pdf
    const nameRegex = /^\d+_rev\d+\.pdf$/i;
    if (!nameRegex.test(file.name)) {
      alert('Invalid file name. Please ensure the file follows the naming convention: <numbers>_rev<numbers>.pdf');
      e.target.value = '';
      return;
    }

    e.target.value = '';
    // Capture current task list before async delay
    const snapshot = [...uploadedTaskDefs, ...baseTasks];
    setProcessingUpload(true);
    setTimeout(() => {
      setProcessingUpload(false);
      const newTask = generateUploadedTask(snapshot, CURRENT_USER);
      setUploadedTaskDefs(prev => [newTask, ...prev]);
      setBaseTasks(prev => [newTask, ...prev]);
    }, 3000);
  }

  function handleAssignTask(taskId: string, email: string) {
    if (email) markUploadedTouched(taskId);
    setUploadedTaskDefs(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: email } : t));
    setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: email } : t));
  }

  function handleRemoveTask(taskId: string) {
    setDeletedTaskIds(prev => [...prev, taskId]);
    setUploadedTaskDefs(prev => prev.filter(t => t.id !== taskId));
    setBaseTasks(prev => prev.filter(t => t.id !== taskId));
    setUploadStates(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setActionLogs(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setRevisionStates(prev => { const next = { ...prev }; delete next[taskId]; return next; });
    setTouchedUploadedIds(prev => prev.filter(id => id !== taskId));
  }

  // Keep taskOverrides in sync with manual actions only
  useEffect(() => {
    setTaskOverrides(baseTasks.map(t => ({ id: t.id, status: t.status, verifications: t.verifications, assignedTo: t.assignedTo })));
  }, [baseTasks]);

  const tasks = useMemo(() => {
    if (autoApprove) {
      return applyAutoApprove(baseTasks, uploadStates, actionLogs);
    }
    return baseTasks;
  }, [baseTasks, autoApprove, uploadStates, actionLogs]);

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
      .map(t => t.createdDate ?? t.submittedDate)
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
    setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Approved' as TaskStatus } : t));
    navigateHome();
  }

  function handleReject(taskId: string) {
    setBaseTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Rejected' as TaskStatus } : t));
    navigateHome();
  }

  function handleApproveVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    setBaseTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const verifications = { ...t.verifications, [verificationType]: 'Approved' as VerificationStatus };
      const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
      return { ...t, verifications, status: deriveOverallStatus(effective) };
    }));
    setActionLogs(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [verificationType]: { action: 'approve', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }

  function handleUploadStateChange(taskId: string, tab: string, state: UploadState) {
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
    if (state === 'done') {
      if (tab === 'insurance:detail' || tab === 'insurance:draft') {
        const cur = uploadStates[taskId] ?? {};
        const otherDone = tab === 'insurance:detail' ? cur['insurance:draft'] === 'done' : cur['insurance:detail'] === 'done';
        if (otherDone) incrementRevision(taskId, 'insurance');
      } else if (tab === 'draftBL:shipping' || tab === 'draftBL:draft') {
        const cur = uploadStates[taskId] ?? {};
        const otherDone = tab === 'draftBL:shipping' ? cur['draftBL:draft'] === 'done' : cur['draftBL:shipping'] === 'done';
        if (otherDone) incrementRevision(taskId, 'draftBL');
      } else {
        incrementRevision(taskId, tab);
      }
    }
  }

  function handleRejectVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    setBaseTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const verifications = { ...t.verifications, [verificationType]: 'Rejected' as VerificationStatus };
      const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
      return { ...t, verifications, status: deriveOverallStatus(effective) };
    }));
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
  }

  function handleResetVerificationForUpload(taskId: string, verificationType: VerificationType) {
    const original = mockTasks.find(t => t.id === taskId);
    if (!original) return;
    const originalStatus = original.verifications[verificationType];
    setBaseTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const verifications = { ...t.verifications, [verificationType]: originalStatus };
      const effective = getEffectiveVerifications({ ...t, verifications }, uploadStates[taskId] ?? {});
      return { ...t, verifications, status: deriveOverallStatus(effective) };
    }));
    setActionLogs(prev => {
      const taskLogs = { ...prev[taskId] };
      delete taskLogs[verificationType];
      return { ...prev, [taskId]: taskLogs };
    });
  }

  function handleIncrementRevision(taskId: string, vt: VerificationType) {
    incrementRevision(taskId, vt);
  }

  const currentTask =
    view.page === 'ci-overview'
      ? tasks.find(t => t.id === view.taskId) ?? null
      : null;

  const filteredTasks = tasks.filter(t => {
    const invoiceNo = t.correctValues['INVOICE NO.'] ?? t.id;
    const matchesSearch =
      search === '' ||
      invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(search.toLowerCase());
    const overallStatus = deriveOverallStatus(getEffectiveVerifications(t, uploadStates[t.id] ?? {}));
    const matchesStatus = statusFilter === 'All' || overallStatus === statusFilter;
    
    // Everyone sees all tasks by default.
    // "Only My Tasks" toggle narrows to the current user for all roles.
    const matchesUser = isAdmin
      ? (!onlyMyTasks || t.assignedTo === CURRENT_USER)
      : (!onlyMyTasks || t.assignedTo === CURRENT_USER);

    // Date range filter on createdDate (falls back to submittedDate)
    const taskDate = t.createdDate ?? t.submittedDate ?? '';
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
    <div className="min-h-screen bg-[#f3f6f8]">
      <Navbar currentUser={effectiveUser} onNavigateHome={navigateHome} onLogout={handleLogout} />

      {view.page === 'home' && (
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Document Verification Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and verify shipping documents against system records.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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

          {processingUpload && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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

      {view.page === 'llm-compare' && <LlmComparePage />}

      {view.page === 'settings' && (
        <SettingsPage
          autoApprove={autoApprove}
          onAutoApproveChange={handleAutoApproveChange}
          onlyMyTasks={onlyMyTasks}
          onOnlyMyTasksChange={setOnlyMyTasks}
          onBack={navigateBack}
        />
      )}

      {view.page === 'ci-overview' && currentTask && (
        <CiOverviewPage
          task={currentTask}
          activeTab={view.tab}
          onTabChange={handleTabChange}
          onBack={navigateHome}
          onApproveVerification={(vt, reason, remark) => handleApproveVerification(currentTask.id, vt, reason, remark)}
          onRejectVerification={(vt, reason, remark) => handleRejectVerification(currentTask.id, vt, reason, remark)}
          uploadStates={uploadStates[currentTask.id] ?? {}}
          onUploadStateChange={(tab, state) => handleUploadStateChange(currentTask.id, tab, state)}
          autoApprove={autoApprove}
          actionLogs={actionLogs[currentTask.id] ?? {}}
          onLogVerified={(vt) => handleLogVerified(currentTask.id, vt)}
          onResetForUpload={(vt) => handleResetVerificationForUpload(currentTask.id, vt)}
          revisionStates={revisionStates[currentTask.id] ?? {}}
          onIncrementRevision={(vt) => handleIncrementRevision(currentTask.id, vt)}
        />
      )}
    </div>
  );
}
