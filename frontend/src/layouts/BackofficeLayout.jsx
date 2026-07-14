import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getNavLinks } from '../context/AuthContext';

const ICON_MAP = {
  '/backoffice': '📊',
  '/backoffice/agenda': '📅',
  '/backoffice/agenda-config': '🗓️',
  '/backoffice/clientes': '👥',
  '/backoffice/servicios': '💇',
  '/backoffice/sucursales': '📍',
  '/backoffice/citas': '📋',
  '/backoffice/configuracion': '⚙️',
};

export default function BackofficeLayout() {
  const { role, usuario, logout, access } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false));
  const mobileMenuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseButtonRef = useRef(null);
  const wasDrawerOpenRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavLinks(role, access).map(link => ({
    ...link,
    icon: link.icon || ICON_MAP[link.to] || '📄',
    end: link.to === '/backoffice',
  }));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobile(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
      return;
    }
    setCollapsed(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;
    if (mobileMenuOpen) {
      wasDrawerOpenRef.current = true;
      requestAnimationFrame(() => drawerCloseButtonRef.current?.focus());
      return undefined;
    }
    if (wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = false;
      mobileMenuButtonRef.current?.focus();
    }
    return undefined;
  }, [isMobile, mobileMenuOpen]);

  function trapDrawerFocus(event) {
    if (!isMobile || !mobileMenuOpen || event.key !== 'Tab') return;
    const focusable = [...(drawerRef.current?.querySelectorAll('button:not([disabled]), a[href]') || [])]
      .filter((element) => element.getClientRects().length > 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = (usuario?.nombre || usuario?.nombre_usuario || '?').charAt(0).toUpperCase();
  const displayName = usuario?.nombre || usuario?.nombre_usuario || 'Usuario';
  const currentPage = navItems.find(i => (
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
  ))?.label || 'Backoffice';

  return (
    <div className="min-h-screen overflow-x-hidden md:flex" style={{ background: '#f1f5f9' }}>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de backoffice"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
        />
      )}

      <aside
        ref={drawerRef}
        id="backoffice-navigation"
        aria-label="Navegación del backoffice"
        aria-hidden={isMobile && !mobileMenuOpen}
        inert={isMobile && !mobileMenuOpen ? '' : undefined}
        onKeyDown={trapDrawerFocus}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 transition-[transform,width] duration-200 motion-reduce:transition-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto md:translate-x-0 ${collapsed ? 'md:w-16' : 'md:w-64'}`}
        style={{ background: 'var(--brand-surface, #f8f9ff)' }}
      >
        <div className="flex h-16 items-center px-4 border-b border-white/10">
          {!collapsed && (
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
              Backoffice
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden min-h-11 min-w-11 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:inline-flex"
          >
            {collapsed ? '→' : '←'}
          </button>
          <button
            ref={drawerCloseButtonRef}
            type="button"
            aria-label="Cerrar menú de backoffice"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:hidden"
          >
            ×
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-contain py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              aria-label={item.label}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 mx-2 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-white/60 font-semibold' : 'opacity-60 hover:opacity-100 hover:bg-white/30'}`}
              style={({ isActive }) => isActive ? { color: 'var(--brand-primary)' } : { color: 'var(--brand-text)' }}
            >
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-3 sm:px-6" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
          <button
            type="button"
            ref={mobileMenuButtonRef}
            aria-controls="backoffice-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menú de backoffice"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:hidden"
            style={{ color: 'var(--brand-text)' }}
          >
            ☰
          </button>
          <h2 className="min-w-0 truncate text-base font-semibold sm:text-lg" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
            {currentPage}
          </h2>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded bg-sky-100 px-2 py-0.5 text-xs sm:inline" style={{ color: 'var(--brand-primary)' }}>
              {role.replace(/_/g, ' ')}
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--brand-primary)' }}>
              {initial}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-medium lg:inline" style={{ color: 'var(--brand-text)' }}>
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
