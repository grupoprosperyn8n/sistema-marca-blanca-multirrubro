import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getNavLinks } from '../context/AuthContext';

// Mapa de iconos por ruta
const ICON_MAP = {
  '/backoffice': '\ud83d\udcca',
  '/backoffice/agenda': '\ud83d\udcc5',
  '/backoffice/clientes': '\ud83d\udc65',
  '/backoffice/servicios': '\ud83d\udc87',
  '/backoffice/sucursales': '\ud83d\udccd',
  '/backoffice/citas': '\ud83d\udccb',
  '/backoffice/configuracion': '\u2699\ufe0f',
};

export default function BackofficeLayout() {
  const { role, usuario, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Links filtrados por rol + iconos
  const navItems = getNavLinks(role).map(link => ({
    ...link,
    icon: ICON_MAP[link.to] || '\ud83d\udcc4',
    end: link.to === '/backoffice',
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = (usuario?.nombre || usuario?.nombre_usuario || '?').charAt(0).toUpperCase();
  const displayName = usuario?.nombre || usuario?.nombre_usuario || 'Usuario';

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col border-r border-white/10`}
        style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          {!collapsed && (
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
              Backoffice
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 opacity-50 hover:opacity-100">
            {collapsed ? '\u2192' : '\u2190'}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all ${isActive ? 'bg-white/60 font-semibold' : 'opacity-60 hover:opacity-100 hover:bg-white/30'}`}
              style={({ isActive }) => isActive ? { color: 'var(--brand-primary)' } : { color: 'var(--brand-text)' }}>
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 border-b border-white/10 shrink-0" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
            {navItems.find(i => {
              if (i.end) return location.pathname === i.to;
              return location.pathname.startsWith(i.to);
            })?.label || 'Backoffice'}
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(125,211,252,0.15)', color: 'var(--brand-primary)' }}>
              {role.replace(/_/g, ' ')}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--brand-primary)' }}>
              {initial}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
              {displayName}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              Salir
            </button>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
