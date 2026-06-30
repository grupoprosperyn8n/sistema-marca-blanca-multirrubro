import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrandConfig } from '../context/BrandConfigContext';
import PublicFooter from '../components/PublicFooter';

export default function PortalLayout() {
  const { usuario, logout } = useAuth();
  const { config } = useBrandConfig();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const brandInitials = (config.brandName || 'BP')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const nombre = usuario?.nombre || usuario?.email || 'Cliente';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      {/* Top bar — slim, client-friendly */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ background: 'var(--glass-surface, rgba(248,249,255,0.85))', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand + nav */}
          <div className="flex items-center gap-6">
            <Link to="/portal" className="flex items-center gap-2 no-underline">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
                {config.brandName}
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/portal"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/40"
                style={{ color: 'var(--brand-primary)' }}
              >
                Mi Portal
              </Link>
              <Link
                to="/carrito"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                style={{ color: 'var(--brand-text)' }}
              >
                Carrito
              </Link>
              <Link
                to="/catalogo"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                style={{ color: 'var(--brand-text)' }}
              >
                Servicios
              </Link>
              <Link
                to="/reserva"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                style={{ color: 'var(--brand-text)' }}
              >
                Reservar
              </Link>
            </nav>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}
              >
                {brandInitials}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                {nombre}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
};
