import React from 'react';
import { Link } from 'react-router-dom';
import { useBrandConfig } from '../context/BrandConfigContext';

export default function PublicFooter() {
  const { config } = useBrandConfig();

  return (
    <footer className="border-t border-white/10 mt-16" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>{config.brandName}</h3>
            <p className="text-sm opacity-60" style={{ color: 'var(--brand-text)' }}>{config.seoDescription || "Sistema de gestión para salones de belleza y centros de estética."}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-body, Manrope)', color: 'var(--brand-text)' }}>Navegación</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm opacity-60 hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>Inicio</Link>
              <Link to="/catalogo" className="text-sm opacity-60 hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>Catálogo</Link>
              <Link to="/reserva" className="text-sm opacity-60 hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>Reservar</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-body, Manrope)', color: 'var(--brand-text)' }}>Contacto</h4>
            <div className="flex flex-col gap-2 text-sm opacity-60" style={{ color: 'var(--brand-text)' }}>
              {config.phone && <span>📞 {config.phone}</span>}
              {config.email && <span>✉️ {config.email}</span>}
              {config.address && <span>📍 {config.address}</span>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-body, Manrope)', color: 'var(--brand-text)' }}>Legal</h4>
            <p className="text-xs opacity-40" style={{ color: 'var(--brand-text)' }}>{config.legalAviso}</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs opacity-40" style={{ color: 'var(--brand-text)' }}>
          © {new Date().getFullYear()} {config.brandName} · Powered by Sistema Marca Blanca
        </div>
      </div>
    </footer>
  );
}
