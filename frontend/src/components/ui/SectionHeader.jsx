import React from 'react';

export default function SectionHeader({ title, subtitle, align = 'center', className = '' }) {
  return (
    <div className={`mb-8 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-lg opacity-70" style={{ color: 'var(--brand-text)' }}>
          {subtitle}
        </p>
      )}
      <div className="mt-3 w-16 h-0.5 rounded mx-auto" style={{ background: 'var(--brand-primary)' }} />
    </div>
  );
}
