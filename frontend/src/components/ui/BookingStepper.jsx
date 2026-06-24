import React from 'react';

const steps = [
  { id: 1, label: 'Servicio', icon: '💇' },
  { id: 2, label: 'Sucursal', icon: '📍' },
  { id: 3, label: 'Horario', icon: '🕐' },
  { id: 4, label: 'Tus datos', icon: '📋' },
];

export default function BookingStepper({ currentStep = 1, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-0 ${className}`}>
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
              ${currentStep === step.id ? 'text-white shadow-lg scale-110' : currentStep > step.id ? 'bg-emerald-100 text-emerald-700' : 'bg-white/60 text-slate-400 border border-white/30'}
            `} style={currentStep === step.id ? { background: 'var(--brand-primary)' } : {}}>
              {currentStep > step.id ? '✓' : step.icon}
            </div>
            <span className={`hidden sm:inline text-sm font-medium ${currentStep === step.id ? 'opacity-100' : 'opacity-50'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 rounded transition-all ${currentStep > step.id ? 'opacity-100' : 'opacity-20'}`}
              style={{ background: currentStep > step.id ? 'var(--brand-primary)' : '#cbd5e1' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
