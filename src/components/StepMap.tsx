const steps = [
  { number: 1, label: 'Doc Set Verify', active: true },
  { number: 2, label: 'Validate Insurance & BL', active: false },
  { number: 3, label: 'Validate BL Date', active: false },
];

export default function StepMap() {
  return (
    <div className="bg-white rounded-xl px-4 sm:px-5 py-2.5 flex items-center justify-center gap-2 w-full" style={{ border: '1px solid var(--os-border)', boxShadow: 'var(--os-shadow-sm)' }}>
      {steps.map((step, i) => (
        <>
          <div key={step.number} className="flex items-center gap-1.5 shrink-0">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white"
              style={{ backgroundColor: step.active ? 'var(--os-primary)' : '#ced4da', color: step.active ? '#fff' : 'var(--os-text-muted)' }}
            >
              {step.number}
            </span>
            <span className="text-xs font-medium" style={{ color: step.active ? 'var(--os-primary)' : 'var(--os-text-muted)' }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-sm select-none" style={{ color: 'var(--os-text-muted)' }}>›</span>
          )}
        </>
      ))}
    </div>
  );
}
