import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ui/ImageCarousel";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function ProductoDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { config } = useBrandConfig();
  const [producto, setProducto] = useState(null);
  const [commerce, setCommerce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [productosRes, commerceRes] = await Promise.all([
          fetch(`${API}/api/productos-web`, { cache: "no-store" }),
          fetch(`${API}/api/commerce/public`, { cache: "no-store" }).catch(() => null),
        ]);
        if (!productosRes.ok) throw new Error(`HTTP ${productosRes.status}`);
        const data = await productosRes.json();
        const commerceData = commerceRes?.ok ? await commerceRes.json() : null;
        const raw = Array.isArray(data) ? data : data.productos || [];
        
        const match = raw.find(p => {
          const nombreSlug = slugify(p.nombre_visible);
          const apiSlug = slugify(p.slug);
          return nombreSlug === slug || apiSlug === slug || p.id === slug;
        });

        if (!match) {
          setError("Producto no encontrado");
          return;
        }

        setProducto({
          id: match.id,
          nombre: match.nombre_visible || "Producto",
          descripcion: match.descripcion_visible || "",
          precio: match.precio_visible ?? match.precio_oferta_web ?? null,
          precioOferta: match.precio_oferta_web || null,
          categoria: match.categoria_publica || null,
          imagen: match.imagen_principal?.url || null,
          imagenes: match.imagenes_secundarias || [],
          disponibilidad: match.disponibilidad_visible || null,
          cta: match.cta || null,
        });
        setCommerce(commerceData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [slug]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="glass-panel inline-block px-8 py-6 rounded-2xl">
        <p className="text-rose-500">{error}</p>
        <button onClick={() => navigate("/productos")} className="mt-4 text-sm underline" style={{ color: "var(--brand-primary)" }}>Volver a productos</button>
      </div>
    </div>
  );

  const p = producto;
  const todasImagenes = [p.imagen, ...(p.imagenes || [])].filter(Boolean);
  const whatsappDigits = String(config.whatsapp || "").replace(/\D/g, "");
  const contactMessage = `Hola, quiero consultar por el producto ${p.nombre}`;
  const contactHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(contactMessage)}`
    : config.email
      ? `mailto:${config.email}?subject=${encodeURIComponent(`Consulta por ${p.nombre}`)}`
      : null;
  const contactLabel = p.cta || (contactHref ? "Consultar Producto" : "Ver Más Productos");
  const suggestions = [
    ...(commerce?.packs || []),
    ...(commerce?.promotions || []),
    ...(commerce?.coupons || []),
  ].slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 text-sm opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: "var(--brand-text)" }}>
        ← Volver
      </button>

      <div className="glass-panel rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)" }}>
        {/* Image section */}
        {todasImagenes.length > 0 ? (
          <ImageCarousel images={todasImagenes} alt={p.nombre} />
        ) : (
          <div className="w-full h-64 sm:h-80 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e0f2fe, #bae6fd)" }}>
            <span className="text-6xl">💄</span>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {p.categoria && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: "var(--brand-secondary)33", color: "var(--brand-primary)" }}>
              {p.categoria.replace(/_/g, " ")}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--brand-text)" }}>{p.nombre}</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            {p.precio != null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,102,134,0.08)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
                  ${Number(p.precio).toLocaleString("es-AR", { minimumFractionDigits: p.precio % 1 !== 0 ? 2 : 0 })}
                </span>
              </div>
            )}
            {p.disponibilidad && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ background: "#dcfce7", color: "#166534" }}>
                  {p.disponibilidad === "EN_STOCK" ? "Disponible" : p.disponibilidad}
                </span>
              </div>
            )}
          </div>

          {p.descripcion && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--brand-text)" }}>Descripción</h3>
              <p className="text-sm leading-relaxed opacity-70" style={{ color: "var(--brand-text)" }}>{p.descripcion}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {contactHref ? (
              <a
                href={contactHref}
                target={whatsappDigits ? "_blank" : undefined}
                rel={whatsappDigits ? "noreferrer" : undefined}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-center transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
              >
                {contactLabel}
              </a>
            ) : (
              <Link
                to="/productos"
                className="px-6 py-3 rounded-xl font-semibold text-sm text-center transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
              >
                {contactLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={() => navigate("/productos")}
              className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/60"
              style={{ color: "var(--brand-text)", borderColor: "#d1d5db" }}
            >
              Ver más productos
            </button>
          </div>

          <p className="mt-6 text-xs opacity-40 text-center" style={{ color: "var(--brand-text)" }}>
            La venta online todavía no está activada. Este producto se consulta por el canal configurado del negocio.
          </p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-8 glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                Venta inteligente
              </p>
              <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>
                Packs, promos y beneficios relacionados
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
                Lectura comercial desde Airtable. Sin carrito, checkout ni pago activo en esta fase.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestions.map((item) => {
              const discount = item.discount_percent
                ? `${item.discount_percent}% OFF`
                : item.discount_amount
                  ? `$${Number(item.discount_amount).toLocaleString("es-AR")} OFF`
                  : item.price_promo
                    ? `$${Number(item.price_promo).toLocaleString("es-AR")}`
                    : "";
              return (
                <article key={`${item.type}-${item.id}`} className="rounded-2xl border border-white/50 bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                      {item.type}
                    </span>
                    {discount && (
                      <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                        {discount}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold leading-snug" style={{ color: "var(--brand-text)" }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
                      {item.description}
                    </p>
                  )}
                  {item.code && (
                    <p className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs" style={{ color: "var(--brand-text)" }}>
                      Cupón: {item.code}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
