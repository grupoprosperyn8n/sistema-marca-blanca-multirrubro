import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
            BellezaPro Demo
          </h1>
          <p className="text-sm opacity-60 mt-1" style={{ color: 'var(--brand-text)' }}>Portal de acceso</p>
        </div>
        <div className="glass-panel p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
