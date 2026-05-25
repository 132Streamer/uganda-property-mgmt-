'use client';

const STEP_LABELS = ['Add Property', 'Add Unit', 'Invite Tenant'];

type Props = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <div className="w-full">
      {/* Step labels */}
      <div className="flex justify-between mb-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-1" style={{ width: `${100 / totalSteps}%` }}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                  isComplete
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                    : isActive
                    ? 'bg-white border-amber-500 text-amber-600 shadow-md'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-amber-600' : isComplete ? 'text-amber-500' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Track */}
      <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400 text-right">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
