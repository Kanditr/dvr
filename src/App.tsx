import { useState, useEffect, useMemo } from 'react';
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
  uploadStates: Record<string, Record<string, UploadState>>
): Task[] {
  return tasks.map(task => {
    const taskUploadStates = uploadStates[task.id] ?? {};
    const effective = getEffectiveVerifications(task, taskUploadStates);
    const verifications = { ...task.verifications };
    let changed = false;
    (['customFormality', 'insurance', 'draftBL', 'blDate'] as VerificationType[]).forEach(key => {
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

const DATA_VERSION = 'v2026-04c';

function clearStaleStorage() {
  const stored = localStorage.getItem('dvr:dataVersion');
  if (stored !== DATA_VERSION) {
    ['dvr:taskOverrides', 'dvr:uploadStates', 'dvr:actionLogs'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('dvr:dataVersion', DATA_VERSION);
  }
}
clearStaleStorage();

export default function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('dvr:currentUser', null);

  // Clear stale non-email values stored before the email migration
  const effectiveUser = currentUser && currentUser.includes('@') ? currentUser : null;

  const [view, setView] = useState<View>(parseHash);
  const [prevView, setPrevView] = useState<View>({ page: 'home' });

  const [autoApprove, setAutoApprove] = useLocalStorage<boolean>('dvr:autoApprove', false);
  const [onlyMyTasks, setOnlyMyTasks] = useLocalStorage<boolean>('dvr:onlyMyTasks', false);

  const CURRENT_USER = effectiveUser ?? 'jane.doe@pttgcgroup.com';

  const [uploadStates, setUploadStates] = useLocalStorage<Record<string, Record<string, UploadState>>>(
    'dvr:uploadStates', {}
  );

  const [taskOverrides, setTaskOverrides] = useLocalStorage<{ id: string; status: TaskStatus; verifications: Verifications }[]>('dvr:taskOverrides', []);

  const [actionLogs, setActionLogs] = useLocalStorage<Record<string, Record<string, ActionLog>>>('dvr:actionLogs', {});

  // baseTasks: only manually actioned states — never auto-approve mutations
  const [baseTasks, setBaseTasks] = useState<Task[]>(() =>
    mockTasks.map(t => {
      const o = taskOverrides.find(x => x.id === t.id);
      return o ? { ...t, status: o.status, verifications: o.verifications } : t;
    })
  );

  // Keep taskOverrides in sync with manual actions only
  useEffect(() => {
    setTaskOverrides(baseTasks.map(t => ({ id: t.id, status: t.status, verifications: t.verifications })));
  }, [baseTasks]);

  // Derived: apply auto-approve on top at render time — never persisted
  const tasks = useMemo(
    () => autoApprove ? applyAutoApprove(baseTasks, uploadStates) : baseTasks,
    [baseTasks, autoApprove, uploadStates]
  );

  const [search, setSearch] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [tabFilters, setTabFilters] = useState<Record<VerificationType, VerificationStatus | 'All'>>({
    customFormality: 'All',
    insurance: 'All',
    draftBL: 'All',
    blDate: 'All',
  });

  useEffect(() => {
    function onHashChange() { setView(parseHash()); }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigateToCiOverview(taskId: string, tab: VerificationType = 'customFormality') {
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
    const next = { ...uploadStates, [taskId]: { ...uploadStates[taskId], [tab]: state } };
    setUploadStates(next);
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

  const currentTask =
    view.page === 'ci-overview'
      ? tasks.find(t => t.id === view.taskId) ?? null
      : null;

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      search === '' ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(search.toLowerCase());
    const overallStatus = deriveOverallStatus(getEffectiveVerifications(t, uploadStates[t.id] ?? {}));
    const matchesStatus = statusFilter === 'All' || overallStatus === statusFilter;
    const matchesUser = !onlyMyTasks || t.assignedTo === CURRENT_USER;
    return matchesSearch && matchesStatus && matchesUser;
  });

  function handleAutoApproveChange(value: boolean) {
    setAutoApprove(value);
    if (value) setOnlyMyTasks(true);
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
              onReset={() => { setSearch(''); setStatusFilter('All'); setTabFilters({ customFormality: 'All', insurance: 'All', draftBL: 'All', blDate: 'All' }); setTaskPage(1); }}
            />
            <TaskTable tasks={filteredTasks} uploadStates={uploadStates} tabFilters={tabFilters} onSelectTask={(id, tab) => navigateToCiOverview(id, tab)} page={taskPage} onPageChange={setTaskPage} />
          </div>
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
        />
      )}
    </div>
  );
}
