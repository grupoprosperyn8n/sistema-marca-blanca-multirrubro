import React from 'react';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import Badge from './Badge';

export default function ServiceCard({ service, onReservar, onClick }) {
  const { nombre, descripcion, precio, duracion_minutos, categoria, imagen, imagenAlt } = service || {};
  const ContentWrapper = onClick ? 'button' : 'div';

  return (
    <GlassCard className="flex flex-col h-full" hover>
      <ContentWrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={onClick ? 'mb-4 flex-1 text-left focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg' : 'mb-4 flex-1'}
      >
        {imagen?.url && (
          <div className="mb-4 h-44 overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={imagen.url}
              alt={imagenAlt || nombre || 'Servicio'}
              width={imagen.width || 640}
              height={imagen.height || 360}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        {categoria && (
          <Badge variant="primary" className="mb-3 self-start">{categoria}</Badge>
        )}
        <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading, Manrope)' }}>
          {nombre || 'Servicio'}
        </h3>
        {descripcion && (
          <p className="text-sm opacity-70" style={{ color: 'var(--brand-text)' }}>
            {descripcion.length > 120 ? `${descripcion.slice(0, 120)}…` : descripcion}
          </p>
        )}
      </ContentWrapper>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
        <div>
          {precio && <span className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>${precio}</span>}
          {duracion_minutos && (
            <span className="text-sm opacity-60 ml-2">· {duracion_minutos} min</span>
          )}
        </div>
        {onReservar && (
          <PrimaryButton size="sm" onClick={() => onReservar(service)}>
            Reservar
          </PrimaryButton>
        )}
        {!onReservar && onClick && (
          <button type="button" onClick={onClick} className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
            Ver detalle
          </button>
        )}
      </div>
    </GlassCard>
  );
}
