const steps = [
  { number: 1, label: 'Doc Set Verify', active: true },
  { number: 2, label: 'Validate Insurance & BL', active: false },
  { number: 3, label: 'Validate BL Date', active: false },
];

export default function StepMap() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-2.5 shadow-sm flex items-center justify-center gap-2 w-full">
      {steps.map((step, i) => (
        <>
          <div key={step.number} className="flex items-center gap-1.5 shrink-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              step.active ? 'bg-[#0056b8] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step.number}
            </span>
            <span className={`text-xs font-medium ${step.active ? 'text-[#0056b8]' : 'text-gray-500'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-gray-400 text-sm select-none">›</span>
          )}
        </>
      ))}
    </div>
  );
}
