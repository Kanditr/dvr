interface SettingsPageProps {
  autoApprove: boolean;
  onAutoApproveChange: (value: boolean) => void;
  onlyMyTasks: boolean;
  onOnlyMyTasksChange: (value: boolean) => void;
  onBack: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 mt-0.5"
      style={{ backgroundColor: checked ? 'var(--os-primary)' : '#ced4da' }}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 mt-0.5 ${
          checked ? 'translate-x-5 ml-0.5' : 'translate-x-0 ml-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage({
  autoApprove, onAutoApproveChange,
  onlyMyTasks, onOnlyMyTasksChange,
  onBack,
}: SettingsPageProps) {
  return (
    <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm hover:underline mb-6"
        style={{ color: 'var(--os-primary)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--os-text-primary)' }}>Settings</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--os-text-muted)' }}>Manage your application preferences.</p>

      <div className="bg-white rounded-lg max-w-xl" style={{ border: '1px solid var(--os-border)' }}>

        {/* Show only my tasks */}
        <div className="px-4 sm:px-6 py-5 flex items-start justify-between gap-6" style={{ borderBottom: '1px solid var(--os-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--os-text-primary)' }}>Show Only My Tasks</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--os-text-muted)' }}>
              When enabled, the task list will only show tasks assigned to you.
            </p>
          </div>
          <Toggle checked={onlyMyTasks} onChange={onOnlyMyTasksChange} />
        </div>

        {/* Auto Approve */}
        <div className="px-4 sm:px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--os-text-primary)' }}>Auto Approve</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--os-text-muted)' }}>
              When enabled, all document verifications are automatically approved. The Approve button will be disabled on individual tasks.
            </p>
          </div>
          <Toggle checked={autoApprove} onChange={onAutoApproveChange} />
        </div>

      </div>
    </div>
  );
}
