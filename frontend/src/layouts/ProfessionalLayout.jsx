import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ProfessionalLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <header className="h-16 flex items-center px-6 border-b border-white/10" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
          Portal Profesional
        </h1>
        <span className="ml-auto text-xs px-3 py-1 rounded-full" style={{ background: 'var(--brand-primary)', color: 'white' }}>Demo</span>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
