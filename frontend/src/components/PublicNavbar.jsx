import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrandConfig } from '../context/BrandConfigContext';

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Servicios' },
  { to: '/productos', label: 'Productos' },
  { to: '/reserva', label: 'Reservar' },
];

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { usuario } = useAuth();
  const { config } = useBrandConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: 'var(--glass-surface, rgba(248,249,255,0.85))', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
            {config.brandName}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'}
              className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/50' : 'hover:bg-white/30'}`}
              style={({ isActive }) => ({ color: isActive ? 'var(--brand-primary)' : 'var(--brand-text)', fontFamily: 'var(--font-body, Manrope)' })}>
              {link.label}
            </NavLink>
          ))}
          {usuario ? (
            <Link to="/portal" className="ml-3 btn-primary text-sm px-4 py-2">
              Mi Portal
            </Link>
          ) : (
            <Link to="/login" className="ml-3 btn-primary text-sm px-4 py-2">
              Acceder
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 -mr-2" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 animate-slide-down" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {publicLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/30"
                style={({ isActive }) => ({ color: isActive ? 'var(--brand-primary)' : 'var(--brand-text)' })}>
                {link.label}
              </NavLink>
            ))}
            {usuario ? (
              <Link to="/portal" onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm text-center py-3 mt-2">
                Mi Portal
              </Link>
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
