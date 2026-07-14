interface SettingsPageProps {
  onlyMyTasks: boolean;
  onOnlyMyTasksChange: (value: boolean) => void;
  onBack: () => void;
  onResetDemoData: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 mt-0.5 ${
        checked ? 'bg-[#0056b8]' : 'bg-gray-300'
      }`}
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
  onlyMyTasks, onOnlyMyTasksChange,
  onBack, onResetDemoData,
}: SettingsPageProps) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#0056b8] hover:underline mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-xl font-bold text-gray-800 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your application preferences.</p>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 max-w-xl">

        {/* Show only my tasks */}
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-800">Show Only My Tasks</p>
            <p className="text-xs text-gray-500 mt-0.5">
              When enabled, the task list will only show tasks assigned to you.
            </p>
          </div>
          <Toggle checked={onlyMyTasks} onChange={onOnlyMyTasksChange} />
        </div>

        {/* Reset demo data */}
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-800">Reset Demo Data</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Clears every local edit, upload, approval, and revision, restoring the original 20 mock transactions. This cannot be undone.
            </p>
          </div>
          <button
            onClick={onResetDemoData}
            className="shrink-0 px-3 py-1.5 text-xs font-medium border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
        </div>

      </div>
    </div>
  );
}
