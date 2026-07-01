import GlassCard from './GlassCard';
import Badge from './Badge';
import { formatCategoria, toPublicTitle } from '../../utils/displayFormatters';

/**
 * ProductCard — compact mobile-first card for the public product catalog.
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
  const nombre = toPublicTitle(nombre_visible) || "Producto";
  const tieneImagen = imagen_principal?.url;

  const formatearPrecio = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (Number.isNaN(n)) return "";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <GlassCard className="group h-full overflow-hidden rounded-3xl" hover padding={false}>
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full touch-manipulation flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/80">
          {tieneImagen ? (
            <img
              src={imagen_principal.url}
              alt={alt_text || nombre}
              width="420"
              height="315"
              className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 sm:p-3"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="material-symbols-outlined text-4xl opacity-30" style={{ color: 'var(--brand-primary)' }} aria-hidden="true">
                inventory_2
              </span>
            </div>
          )}

          {destacado && (
            <div className="absolute left-2 top-2 scale-90 origin-top-left">
              <Badge variant="primary">Destacado</Badge>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          {categoriaHumana && (
            <span className="mb-1.5 block truncate text-[10px] font-bold uppercase tracking-wide sm:text-[11px]" style={{ color: 'var(--brand-primary)', opacity: 0.8 }}>
              {categoriaHumana}
            </span>
          )}

          <h3 className="line-clamp-2 min-h-[2.25rem] break-words text-sm font-extrabold leading-tight sm:min-h-[2.5rem] sm:text-base" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-heading, Manrope)' }}>
            {nombre}
          </h3>

          {descripcion_visible && (
            <p className="mt-2 hidden line-clamp-2 text-xs sm:block" style={{ color: 'var(--brand-text-secondary)', lineHeight: 1.5 }}>
              {descripcion_visible}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/30 pt-3">
            <div className="min-w-0">
              {precio_visible != null && (
                <span className="block truncate text-base font-extrabold tabular-nums sm:text-lg" style={{ color: 'var(--brand-primary)' }}>
                  {formatearPrecio(precio_visible)}
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold transition-opacity group-hover:opacity-100 sm:text-xs" style={{ color: 'var(--brand-text)' }}>
              <span className="hidden max-w-24 truncate sm:inline">{cta || "Ver"}</span>
              <span className="sm:hidden">Ver</span>
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
            </span>
          </div>
        </div>
      </button>
    </GlassCard>
  );
}
