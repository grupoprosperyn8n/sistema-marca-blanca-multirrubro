import React from 'react';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import Badge from './Badge';

export default function ServiceCard({ service, onReservar, onClick }) {
  const { nombre, descripcion, precio, duracion_minutos, categoria } = service || {};

  return (
    <GlassCard className="flex flex-col h-full" hover onClick={onClick}>
      {categoria && (
        <Badge variant="primary" className="mb-3 self-start">{categoria}</Badge>
      )}
      <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading, Manrope)' }}>
        {nombre || 'Servicio'}
      </h3>
      {descripcion && (
        <p className="text-sm opacity-70 mb-4 flex-1" style={{ color: 'var(--brand-text)' }}>
          {descripcion.length > 120 ? descripcion.slice(0, 120) + '...' : descripcion}
        </p>
      )}
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
      </div>
    </GlassCard>
  );
}
