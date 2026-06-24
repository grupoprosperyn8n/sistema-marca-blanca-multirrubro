import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import AnnouncementBar from '../components/AnnouncementBar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      <AnnouncementBar />
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
