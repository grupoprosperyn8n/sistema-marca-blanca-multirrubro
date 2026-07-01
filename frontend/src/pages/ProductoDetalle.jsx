import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ui/ImageCarousel";
import { useBrandConfig } from "../context/BrandConfigContext";
import { ROLES, useAuth } from "../context/AuthContext";
import { notifyCartUpdated } from "../hooks/useCartSummary";
import { formatPublicName } from "../utils/publicDataFilters";

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

function money(value, currency = "ARS") {
  if (value == null || value === "") return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value));
}

function imageUrl(image) {
  const attachment = Array.isArray(image) ? image[0] : image;
  if (!attachment) return "";
  if (typeof attachment === "string") return attachment;
  const thumb = attachment.thumbnails?.large || attachment.thumbnails?.full || attachment.thumbnails?.small;
  return thumb?.url || attachment.url || "";
}

function imageList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map(imageUrl).filter(Boolean);
}

function cleanLabel(value) {
  const clean = String(value || "").replace(/_/g, " ").trim();
  return formatPublicName(clean) || clean;
}

function benefitValue(item, currency = "ARS") {
  if (item.discount_percent) return `${Number(item.discount_percent).toLocaleString("es-AR")}% OFF`;
  if (item.discount_amount) return `${money(item.discount_amount, currency)} OFF`;
  if (item.price_promo) return money(item.price_promo, currency);
  if (item.minimum_purchase) return `Desde ${money(item.minimum_purchase, currency)}`;
  return "Beneficio";
}

function benefitIcon(type) {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("CUPON")) return "🏷️";
  if (normalized.includes("PROMO")) return "🎁";
  if (normalized.includes("PACK")) return "✨";
  return "💡";
}

export default function ProductoDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { config } = useBrandConfig();
  const { role, usuario } = useAuth();
  const [producto, setProducto] = useState(null);
  const [commerce, setCommerce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

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

        const productImages = [imageUrl(match.imagen_principal), ...imageList(match.imagenes_secundarias)].filter(Boolean);
        setProducto({
          id: match.id,
          nombre: cleanLabel(match.nombre_visible || "Producto"),
          descripcion: match.descripcion_visible || "",
          precio: match.precio_visible ?? match.precio_oferta_web ?? null,
          precioOferta: match.precio_oferta_web || null,
          categoria: cleanLabel(match.categoria_publica || ""),
          imagen: productImages[0] || null,
          imagenes: productImages.slice(1),
          disponibilidad: match.disponibilidad_visible || null,
          cta: match.cta || null,
          cartEnabled: Boolean(match.cart_enabled || match.purchase_enabled),
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
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
      <p className="mt-3 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando producto…</p>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <div className="glass-panel inline-block rounded-2xl px-8 py-6">
        <p className="text-rose-500">{error}</p>
        <button type="button" onClick={() => navigate("/productos")} className="mt-4 text-sm underline" style={{ color: "var(--brand-primary)" }}>Volver a productos</button>
      </div>
    </div>
  );

  const p = producto;
  const todasImagenes = [p.imagen, ...(p.imagenes || [])].filter(Boolean);
  const whatsappDigits = String(config.whatsapp || "").replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hola, quiero consultar por el producto ${p.nombre}`)}`
    : null;
  const relatedCtaLabel = p.cta || "Ver servicios relacionados";
  const canUseSandboxCart = usuario && role === ROLES.CLIENTE;
  const sandboxCartEnabled = commerce?.cart_enabled && p.cartEnabled;
  const suggestions = [
    ...(commerce?.packs || []),
    ...(commerce?.promotions || []),
    ...(commerce?.coupons || []),
  ].slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8 lg:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-2 text-sm font-semibold opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        style={{ color: "var(--brand-text)" }}
      >
        ← Volver
      </button>

      <section className="glass-panel overflow-hidden rounded-[2rem] bg-white/85 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="bg-gradient-to-br from-sky-50 via-white to-cyan-50">
            {todasImagenes.length > 0 ? (
              <ImageCarousel
                images={todasImagenes}
                alt={p.nombre}
                mediaClassName="h-72 sm:h-80 lg:h-[460px]"
                imageClassName="h-full w-full object-contain p-4 sm:p-6 lg:p-8"
              />
            ) : (
              <div className="flex h-72 items-center justify-center sm:h-80 lg:h-[460px]">
                <span className="text-6xl" aria-hidden="true">💄</span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:p-8">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {p.categoria && (
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ background: "var(--brand-secondary)33", color: "var(--brand-primary)" }}>
                    {p.categoria}
                  </span>
                )}
                {p.disponibilidad && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    {p.disponibilidad === "EN_STOCK" ? "Disponible" : cleanLabel(p.disponibilidad)}
                  </span>
                )}
              </div>

              <h1 className="text-balance text-2xl font-extrabold leading-tight break-words sm:text-3xl lg:text-4xl" style={{ color: "var(--brand-text)" }}>
                {p.nombre}
              </h1>

              {p.precio != null && (
                <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl px-4 py-2" style={{ background: "rgba(0,102,134,0.08)" }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Precio</span>
                  <strong className="text-2xl font-extrabold tabular-nums sm:text-3xl" style={{ color: "var(--brand-primary)" }}>
                    {money(p.precio)}
                  </strong>
                </div>
              )}

              {p.descripcion && (
                <div className="mt-5 rounded-2xl bg-white/70 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Descripción</h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--brand-text-secondary)" }}>{p.descripcion}</p>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-white/60 bg-white/70 p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sandboxCartEnabled && (
                  canUseSandboxCart ? (
                    <button
                      type="button"
                      disabled={cartLoading}
                      onClick={async () => {
                        setCartLoading(true);
                        setCartMessage(null);
                        try {
                          const res = await fetch(`${API}/api/carrito/items`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ product_id: p.id, quantity: 1 }),
                          });
                          const body = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(body.detail || `Error ${res.status}`);
                          notifyCartUpdated();
                          setCartMessage({ type: "success", text: "Producto agregado al carrito sandbox." });
                        } catch (e) {
                          setCartMessage({ type: "error", text: e.message || "No se pudo agregar al carrito." });
                        } finally {
                          setCartLoading(false);
                        }
                      }}
                      className="touch-manipulation rounded-2xl px-5 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:opacity-60 sm:col-span-2"
                      style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                    >
                      {cartLoading ? "Agregando…" : "Agregar al carrito"}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="touch-manipulation rounded-2xl px-5 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:col-span-2"
                      style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                    >
                      Ingresar para comprar
                    </Link>
                  )
                )}

                <Link
                  to="/catalogo"
                  className="touch-manipulation rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-center text-sm font-bold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  style={{ color: "var(--brand-text)" }}
                >
                  {relatedCtaLabel}
                </Link>

                <Link
                  to="/productos"
                  className="touch-manipulation rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-center text-sm font-bold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  style={{ color: "var(--brand-text)" }}
                >
                  Ver más productos
                </Link>

                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-manipulation rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:col-span-2"
                  >
                    Consultar por WhatsApp
                  </a>
                )}
              </div>

              {cartMessage && (
                <div
                  className="mt-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                  role={cartMessage.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                  style={{
                    background: cartMessage.type === "error" ? "#fff1f2" : "#ecfdf5",
                    color: cartMessage.type === "error" ? "#be123c" : "#047857",
                  }}
                >
                  {cartMessage.text}
                  {cartMessage.type === "success" && (
                    <Link to="/carrito" className="ml-2 underline">Ver carrito</Link>
                  )}
                </div>
              )}

              <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: "var(--brand-text-secondary)" }}>
                {p.cartEnabled
                  ? "Carrito sandbox activo. Checkout, pagos y caja/POS siguen desactivados."
                  : "Este producto se consulta por los canales configurados del negocio."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {suggestions.length > 0 && <BenefitsSection items={suggestions} />}
    </main>
  );
}

function BenefitsSection({ items }) {
  return (
    <section className="mt-5 glass-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Beneficios disponibles</p>
          <h2 className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--brand-text)" }}>Packs, promos y beneficios</h2>
        </div>
        <p className="max-w-md text-xs sm:text-right" style={{ color: "var(--brand-text-secondary)" }}>
          Reglas comerciales desde Airtable. Checkout y pagos reales siguen bloqueados.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => {
          const img = imageUrl(item.image);
          const label = cleanLabel(item.type || "Beneficio");
          const title = cleanLabel(item.title || item.name || "Beneficio disponible");
          return (
            <article key={`${item.type}-${item.id}`} className="flex h-full min-w-0 flex-col rounded-3xl border border-white/60 bg-white/75 p-3">
              <div className="mb-3 h-24 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-100 sm:h-28">
                {img ? (
                  <img src={img} alt={title} width="320" height="180" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-4xl" aria-hidden="true">{benefitIcon(item.type)}</span>
                )}
              </div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="max-w-[65%] truncate rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>{label}</span>
                <strong className="shrink-0 text-xs tabular-nums" style={{ color: "var(--brand-primary)" }}>{benefitValue(item)}</strong>
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="line-clamp-2 min-h-[2.45rem] break-words text-sm font-extrabold leading-snug" style={{ color: "var(--brand-text)" }}>{title}</h3>
                {item.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--brand-text-secondary)" }}>{cleanLabel(item.description)}</p>}
                {item.code && (
                  <p className="mt-2 inline-flex max-w-full truncate rounded-xl bg-slate-100 px-2 py-1 font-mono text-[11px]" style={{ color: "var(--brand-text)" }}>
                    Cupón: {item.code}
                  </p>
                )}
              </div>
              <Link
                to="/catalogo"
                className="mt-3 inline-flex w-full justify-center rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
              >
                {item.cta ? cleanLabel(item.cta) : "Ver beneficio"}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
