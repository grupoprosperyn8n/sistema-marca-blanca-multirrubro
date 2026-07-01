import React from 'react';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import Badge from './Badge';
import MediaCarousel from './MediaCarousel';
import { mediaSlidesFrom } from '../../utils/media';

export default function ServiceCard({ service, onReservar, onComprar, onClick, buying = false }) {
  const { nombre, descripcion, precio, duracion_minutos, categoria, imagen, imagenAlt, media } = service || {};
  const ContentWrapper = onClick ? 'button' : 'div';
  const slides = mediaSlidesFrom({ media, images: [imagen], fallbackAlt: imagenAlt || nombre || 'Servicio' });

  return (
    <GlassCard className="flex flex-col h-full" hover>
      <ContentWrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={onClick ? 'mb-4 flex-1 text-left focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg' : 'mb-4 flex-1'}
      >
        <MediaCarousel
          items={slides}
          alt={imagenAlt || nombre || 'Servicio'}
          mediaClassName="h-36 sm:h-40"
          imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          showControls={false}
          fallbackIcon="spa"
          className="mb-4"
        />
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
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            {precio && <span className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>${precio}</span>}
            {duracion_minutos && (
              <span className="text-sm opacity-60 ml-2">· {duracion_minutos} min</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {onComprar && (
            <button
              type="button"
              disabled={buying}
              onClick={(event) => {
                event.stopPropagation();
                onComprar(service);
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #c77df3, var(--brand-primary))' }}
            >
              {buying ? 'Agregando…' : 'Comprar'}
            </button>
          )}
          {onReservar && (
            <PrimaryButton
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onReservar(service);
              }}
            >
              Reservar
            </PrimaryButton>
          )}
          {!onReservar && !onComprar && onClick && (
            <button type="button" onClick={onClick} className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Ver detalle
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
