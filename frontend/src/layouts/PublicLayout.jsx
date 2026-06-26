import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import AnnouncementBar from '../components/AnnouncementBar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Saltar al contenido principal
      </a>
      <AnnouncementBar />
      <PublicNavbar />
      <main id="contenido-principal" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
