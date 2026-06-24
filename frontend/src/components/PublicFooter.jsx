import React from 'react';
import { Link } from 'react-router-dom';
import { getPublicNavigation, useBrandConfig } from '../context/BrandConfigContext';

export default function PublicFooter() {
  const { config } = useBrandConfig();
  const publicLinks = getPublicNavigation(config);
  const business = config.business || {};
  const hasContact =
    config.phone ||
    config.email ||
    config.whatsapp ||
    (business.showContactAddress && config.address) ||
    config.googleMaps;

  return (
    <footer className="border-t border-white/10 mt-16" style={{ background: 'var(--brand-surface, #f8f9ff)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className={`grid grid-cols-1 ${hasContact ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8`}>
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>{config.brandName}</h3>
            <p className="text-sm opacity-60" style={{ color: 'var(--brand-text)' }}>{config.seoDescription || "Sistema de gestión para salones de belleza y centros de estética."}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-body, Manrope)', color: 'var(--brand-text)' }}>Navegación</h4>
            <div className="flex flex-col gap-2">
              {publicLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm opacity-60 hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {hasContact && (
            <div>
              <h4 className="font-semibold mb-3 text-sm" style={{ fontFamily: 'var(--font-body, Manrope)', color: 'var(--brand-text)' }}>Contacto</h4>
              <div className="flex flex-col gap-2 text-sm opacity-60" style={{ color: 'var(--brand-text)' }}>
                {config.phone && <span>📞 {config.phone}</span>}
                {config.whatsapp && <a href={`https://wa.me/${String(config.whatsapp).replace(/\D/g, '')}`} className="hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>WhatsApp</a>}
                {config.email && <span>✉️ {config.email}</span>}
                {business.showContactAddress && config.address && <span>📍 {config.address}</span>}
                {config.googleMaps && <a href={config.googleMaps} target="_blank" rel="noreferrer" className="hover:opacity-100" style={{ color: 'var(--brand-primary)' }}>Ver mapa</a>}
              </div>
            </div>
          )}
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
