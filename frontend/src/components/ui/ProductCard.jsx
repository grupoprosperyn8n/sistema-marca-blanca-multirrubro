import React from 'react';
import GlassCard from './GlassCard';
import Badge from './Badge';
import { formatCategoria } from '../../utils/displayFormatters';

/**
 * ProductCard — Tarjeta premium para catálogo público de productos
 * Estética Stitch Glacier: glassmorphism, bordes redondeados, sombras suaves.
 * 
 * Props:
 *   producto: { nombre_visible, descripcion_visible, precio_visible,
 *               categoria_publica, imagen_principal, destacado, cta, alt_text }
 */
export default function ProductCard({ producto, onClick }) {
  const {
    nombre_visible,
    descripcion_visible,
    precio_visible,
    categoria_publica,
    imagen_principal,
    destacado,
    cta,
    alt_text,
  } = producto || {};

  const categoriaHumana = formatCategoria(categoria_publica);
  const tieneImagen = imagen_principal?.url;

  const formatearPrecio = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
  };

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden cursor-pointer" hover onClick={onClick}>
      {/* Imagen o placeholder */}
      <div className="relative -mx-6 -mt-6 mb-4 aspect-square overflow-hidden bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-primary)]/10">
        {tieneImagen ? (
          <img
            src={imagen_principal.url}
            alt={alt_text || nombre_visible || "Producto"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl opacity-30"
              style={{ color: 'var(--brand-primary)' }}>
              inventory_2
            </span>
          </div>
        )}

        {/* Badge destacado */}
        {destacado && (
          <div className="absolute top-3 left-3">
            <Badge variant="primary">Destacado</Badge>
          </div>
        )}
      </div>

      {/* Categoría */}
      {categoriaHumana && (
        <span className="text-xs font-medium uppercase tracking-wider mb-2 block"
          style={{ color: 'var(--brand-primary)', opacity: 0.7 }}>
          {categoriaHumana}
        </span>
      )}

      {/* Nombre */}
      <h3 className="text-lg font-semibold mb-2 line-clamp-2"
        style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-heading, Manrope)' }}>
        {nombre_visible || "Producto"}
      </h3>

      {/* Descripción */}
      {descripcion_visible && (
        <p className="text-sm mb-4 flex-1 line-clamp-3"
          style={{ color: 'var(--brand-text-secondary)', lineHeight: 1.6 }}>
          {descripcion_visible}
        </p>
      )}

      {/* Footer: precio + CTA */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
        <div>
          {precio_visible != null && (
            <span className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              {formatearPrecio(precio_visible)}
            </span>
          )}
        </div>
        <span className="text-xs font-medium inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--brand-text)' }}>
          {cta || "Ver producto"}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </span>
      </div>
    </GlassCard>
  );
}
