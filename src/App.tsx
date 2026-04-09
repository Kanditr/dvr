import { useState } from 'react';
import Navbar from './components/Navbar';
import TaskTable from './components/TaskTable';
import TaskFilterBar from './components/TaskFilterBar';
import TaskDetailPage from './components/TaskDetailPage';
import LlmComparePage from './components/LlmComparePage';
import { mockTasks } from './data/mockData';
import type { Task, TaskStatus } from './data/mockData';

type View = { page: 'home' } | { page: 'detail'; taskId: string } | { page: 'llm-compare' };

export default function App() {
  const [view, setView] = useState<View>({ page: 'home' });
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');

  function navigateTo(taskId: string) {
    setView({ page: 'detail', taskId });
    window.scrollTo(0, 0);
  }

  function navigateHome() {
    setView({ page: 'home' });
    window.scrollTo(0, 0);
  }

  function handleApprove(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Approved' as TaskStatus } : t));
    navigateHome();
  }

  function handleReject(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Rejected' as TaskStatus } : t));
    navigateHome();
  }

  const currentTask = view.page === 'detail'
    ? tasks.find(t => t.id === view.taskId) ?? null
    : null;

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      search === '' ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.shipmentRef.toLowerCase().includes(search.toLowerCase()) ||
      t.shipper.toLowerCase().includes(search.toLowerCase()) ||
      t.consignee.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function navigateToLlmCompare() {
    setView({ page: 'llm-compare' });
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen bg-[#f3f6f8]">
      <Navbar currentView={view.page} onNavigateHome={navigateHome} onNavigateToLlmCompare={navigateToLlmCompare} />

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
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onReset={() => { setSearch(''); setStatusFilter('All'); }}
            />
            <TaskTable tasks={filteredTasks} onSelectTask={navigateTo} />
            <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </div>
      )}

      {view.page === 'llm-compare' && (
        <LlmComparePage />
      )}

      {view.page === 'detail' && currentTask && (
        <TaskDetailPage
          task={currentTask}
          onBack={navigateHome}
          onApprove={() => handleApprove(currentTask.id)}
          onReject={() => handleReject(currentTask.id)}
        />
      )}
    </div>
  );
}
