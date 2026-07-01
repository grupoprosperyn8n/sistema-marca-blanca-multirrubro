import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ROLES, useAuth } from '../context/AuthContext';
import { getPublicNavigation, useBrandConfig } from '../context/BrandConfigContext';
import useCartSummary from '../hooks/useCartSummary';

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, usuario } = useAuth();
  const { config } = useBrandConfig();
  const { count } = useCartSummary();
  const publicLinks = getPublicNavigation(config);
  const showDomainPill = config.domainRole && config.domainRole !== 'COMERCIAL_CANONICO';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: 'var(--glass-surface, rgba(248,249,255,0.85))', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0 min-w-0">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
            {config.brandName}
          </span>
          {showDomainPill && (
            <span className="hidden sm:inline-flex rounded-full border border-white/40 bg-white/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-primary)' }}>
              {config.domainRole === 'TECNICO_CANONICO' ? 'Técnico' : 'Legacy'}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'}
              className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/50' : 'hover:bg-white/30'}`}
              style={({ isActive }) => ({ color: isActive ? 'var(--brand-primary)' : 'var(--brand-text)', fontFamily: 'var(--font-body, Manrope)' })}>
              {link.label}
            </NavLink>
          ))}
          {usuario ? (
            <div className="ml-3 flex items-center gap-2">
              {role === ROLES.CLIENTE && (
                <Link to="/carrito" className="relative rounded-lg bg-white/50 px-3 py-2 text-sm font-semibold" style={{ color: 'var(--brand-text)' }} aria-label={`Carrito con ${count} items`}>
                  <span aria-hidden="true">🛒</span>
                  <span className="ml-1">Carrito</span>
                  {count > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold text-white" style={{ background: 'var(--brand-primary)' }}>
                      {count}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/portal" className="btn-primary text-sm px-4 py-2">
                Mi Portal
              </Link>
            </div>
          ) : (
            <Link to="/login" className="ml-3 btn-primary text-sm px-4 py-2">
              Acceder
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-lg hover:bg-white/30 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
        >
          <span className="text-xl" aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="public-mobile-menu" className="md:hidden border-t border-white/10 animate-slide-down" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {publicLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/30"
                style={({ isActive }) => ({ color: isActive ? 'var(--brand-primary)' : 'var(--brand-text)' })}>
                {link.label}
              </NavLink>
            ))}
            {usuario ? (
              <>
                {role === ROLES.CLIENTE && (
                  <Link to="/carrito" onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/30"
                    style={{ color: 'var(--brand-text)' }}>
                    🛒 Carrito {count > 0 ? `(${count})` : ''}
                  </Link>
                )}
                <Link to="/portal" onClick={() => setMenuOpen(false)}
                  className="btn-primary text-sm text-center py-3 mt-2">
                  Mi Portal
                </Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm text-center py-3 mt-2">
                Acceder
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
