import React from 'react';

const variants = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-rose-100 text-rose-800 border-rose-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20',
};

export default function Badge({ children, variant = 'neutral', className = '', ...props }) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  return (
    <span className={`${base} ${variants[variant] || variants.neutral} ${className}`} {...props}>
      {children}
    </span>
  );
}
