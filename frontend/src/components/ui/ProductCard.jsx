import GlassCard from './GlassCard';
import Badge from './Badge';
import { formatCategoria, toPublicTitle } from '../../utils/displayFormatters';
import MediaCarousel from './MediaCarousel';
import { mediaSlidesFrom } from '../../utils/media';

/**
 * ProductCard — compact mobile-first card for the public product catalog.
 */
export default function ProductCard({ producto, onClick }) {
  const {
    nombre_visible,
    precio_visible,
    categoria_publica,
    imagen_principal,
    destacado,
    alt_text,
  } = producto || {};

  const categoriaHumana = formatCategoria(categoria_publica);
  const nombre = toPublicTitle(nombre_visible) || "Producto";
  const slides = mediaSlidesFrom({
    media: producto?.media,
    images: [imagen_principal],
    fallbackAlt: alt_text || nombre,
  });

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
        <div className="relative w-full overflow-hidden bg-white/80">
          <MediaCarousel
            items={slides}
            alt={alt_text || nombre}
            mediaClassName="aspect-[4/3]"
            imageClassName="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            showControls={false}
            fallbackIcon="inventory_2"
            className="rounded-none bg-white/80"
          />

          {destacado && (
            <div className="absolute left-2 top-2 scale-90 origin-top-left">
              <Badge variant="primary">Destacado</Badge>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
          {categoriaHumana && (
            <span className="mb-1.5 block truncate text-[10px] font-bold uppercase tracking-wide sm:text-[11px]" style={{ color: 'var(--brand-primary)', opacity: 0.8 }}>
              {categoriaHumana}
            </span>
          )}

          <h3 className="line-clamp-2 min-h-[2.1rem] break-words text-[13px] font-extrabold leading-tight sm:min-h-[2.25rem] sm:text-sm" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-heading, Manrope)' }}>
            {nombre}
          </h3>

          <div className="mt-auto grid gap-2 border-t border-white/30 pt-2.5">
            <div className="min-w-0 text-center">
              {precio_visible != null && (
                <span className="block truncate text-base font-extrabold tabular-nums" style={{ color: 'var(--brand-primary)' }}>
                  {formatearPrecio(precio_visible)}
                </span>
              )}
            </div>
            <span className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-white/75 px-2.5 py-1.5 text-[11px] font-bold transition-colors group-hover:bg-white sm:text-xs" style={{ color: 'var(--brand-text)' }}>
              Ver producto
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
            </span>
          </div>
        </div>
      </button>
    </GlassCard>
  );
}
