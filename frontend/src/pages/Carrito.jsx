import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { notifyCartUpdated } from "../hooks/useCartSummary";

const API = import.meta.env.VITE_API_BASE_URL || "";

function money(value, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function itemKindLabel(type) {
  if (type === "SERVICIO_WEB") return "Servicio";
  if (type === "PACK") return "Pack";
  return "Producto";
}

function itemRoute(item) {
  if (item.item_type === "SERVICIO_WEB") return `/servicios/${item.slug || item.service_web_id || item.item_id}`;
  if (item.item_type === "PACK") return "/catalogo";
  return `/productos/${item.slug || item.product_id || item.item_id}`;
}

function recommendationPayload(item) {
  if (item.item_type === "SERVICIO_WEB") return { item_type: "SERVICIO_WEB", service_web_id: item.item_id, quantity: 1 };
  if (item.item_type === "PACK") return { item_type: "PACK", pack_id: item.item_id, quantity: 1 };
  return { item_type: "PRODUCTO_WEB", product_id: item.item_id, quantity: 1 };
}

function imageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
}

export default function Carrito() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (res.status === 401) {
      await logout();
      throw new Error("Sesión expirada. Volvé a ingresar para ver tu carrito.");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail || `Error ${res.status}`);
    return body;
  }, [logout]);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithCookie("/api/carrito");
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithCookie]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const refreshCart = (data) => {
    setCart(data);
    notifyCartUpdated();
  };

  const updateQuantity = async (item, quantity) => {
    setSavingItem(item.id);
    try {
      const data = await fetchWithCookie(`/api/carrito/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      refreshCart(data);
      showToast("Carrito actualizado.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingItem(null);
    }
  };

  const removeItem = async (item) => {
    setSavingItem(item.id);
    try {
      const data = await fetchWithCookie(`/api/carrito/items/${item.id}`, { method: "DELETE" });
      refreshCart(data);
      showToast("Item quitado del carrito.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingItem(null);
    }
  };

  const addRecommendation = async (item) => {
    const key = `${item.item_type}-${item.item_id}`;
    setSavingItem(key);
    try {
      const data = await fetchWithCookie("/api/carrito/items", {
        method: "POST",
        body: JSON.stringify(recommendationPayload(item)),
      });
      refreshCart(data);
      showToast(`${itemKindLabel(item.item_type)} agregado al carrito.`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingItem(null);
    }
  };

  if (role !== ROLES.CLIENTE) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Carrito demo</p>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--brand-text)" }}>Disponible para clientes</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            El carrito sandbox está habilitado solo para usuarios CLIENTE para evitar ventas o pagos reales desde backoffice.
          </p>
          <Link to="/productos" className="btn-primary mt-6 inline-flex px-5 py-3 text-sm">Volver a productos</Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
        <p className="mt-3 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando carrito…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <p className="text-rose-600">{error}</p>
          <button type="button" onClick={loadCart} className="btn-primary mt-5 px-5 py-3 text-sm">Reintentar</button>
        </div>
      </section>
    );
  }

  const items = cart?.items || [];
  const currency = cart?.currency || "ARS";
  const marketing = cart?.marketing || {};
  const upsell = marketing.upsell || [];
  const crossSell = marketing.cross_sell || [];
  const promotions = marketing.promotions || [];
  const coupons = marketing.coupons || [];

  return (
    <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:py-10">
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Compra online sandbox</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--brand-text)" }}>Tu carrito</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            Probá productos, servicios y packs desde Airtable. Checkout, pagos, ventas y caja/POS siguen bloqueados.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link to="/productos" className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-center text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            Ver productos
          </Link>
          <Link to="/catalogo" className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-center text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            Ver servicios
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-3xl">🛒</div>
            <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>El carrito está vacío</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
              Agregá productos, servicios o packs para probar el flujo sandbox.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/productos" className="btn-primary inline-flex justify-center px-5 py-3 text-sm">Ver productos</Link>
              <Link to="/catalogo" className="rounded-xl border border-white/60 bg-white/70 px-5 py-3 text-center text-sm font-bold" style={{ color: "var(--brand-text)" }}>Ver servicios</Link>
            </div>
          </div>
          <MarketingSection title="Ideas para empezar" items={[...upsell, ...crossSell].slice(0, 4)} onAdd={addRecommendation} savingItem={savingItem} currency={currency} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <div className="space-y-4">
            {items.map((item) => {
              const busy = savingItem === item.id;
              return (
                <article key={item.id} className="glass-panel overflow-hidden rounded-3xl p-3 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button type="button" onClick={() => navigate(itemRoute(item))} className="h-28 w-full overflow-hidden rounded-2xl bg-white/70 sm:h-32 sm:w-32">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-3xl">✨</span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                              {itemKindLabel(item.item_type)}
                            </span>
                            {item.requires_turn && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">Requiere turno</span>}
                            {item.requires_stock && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Requiere stock</span>}
                          </div>
                          <h2 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>{item.name}</h2>
                          {item.description && <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>{item.description}</p>}
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                            {item.requires_turn ? item.turn_reservation_state : item.stock_reservation_state === "NO_APLICA" ? "Sin reserva de stock" : item.stock_reservation_state}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>{money(item.unit_price, currency)} c/u</p>
                          <p className="text-lg font-extrabold" style={{ color: "var(--brand-text)" }}>{money(item.subtotal, currency)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-xl border border-white/70 bg-white/60">
                          <button type="button" disabled={busy || item.quantity <= 1} onClick={() => updateQuantity(item, item.quantity - 1)} className="px-3 py-2 text-lg disabled:opacity-30">−</button>
                          <span className="min-w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <button type="button" disabled={busy || item.quantity >= 20} onClick={() => updateQuantity(item, item.quantity + 1)} className="px-3 py-2 text-lg disabled:opacity-30">+</button>
                        </div>
                        <button type="button" disabled={busy} onClick={() => removeItem(item)} className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                          {busy ? "Actualizando…" : "Quitar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <MarketingSection title="Mejorá tu compra" subtitle="Packs y upgrades sugeridos por las reglas comerciales cargadas en Airtable." items={upsell} onAdd={addRecommendation} savingItem={savingItem} currency={currency} />
            <MarketingSection title="También te puede servir" subtitle="Cross-sell de productos y servicios compatibles." items={crossSell} onAdd={addRecommendation} savingItem={savingItem} currency={currency} />
            <PromoSection promotions={promotions} coupons={coupons} currency={currency} />
          </div>

          <aside className="glass-panel h-fit rounded-3xl p-5 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Resumen sandbox</p>
            <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--brand-text)" }}>
              <div className="flex justify-between"><span>Items</span><strong>{cart.total_items}</strong></div>
              <div className="flex justify-between"><span>Subtotal</span><strong>{money(cart.subtotal, currency)}</strong></div>
              <div className="flex justify-between opacity-60"><span>Descuentos</span><span>{money(0, currency)}</span></div>
              <div className="border-t border-white/60 pt-3 flex justify-between text-lg"><span>Total</span><strong>{money(cart.total, currency)}</strong></div>
            </div>

            {(cart.requires_turn || cart.requires_stock) && (
              <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm" style={{ color: "var(--brand-text)" }}>
                <p className="font-bold">Requiere coordinación</p>
                {cart.requires_turn && <p className="mt-1 text-xs" style={{ color: "var(--brand-text-secondary)" }}>Hay servicios/packs que requieren turno. El checkout real todavía no agenda automáticamente.</p>}
                {cart.requires_stock && <p className="mt-1 text-xs" style={{ color: "var(--brand-text-secondary)" }}>Hay items con reserva de stock pendiente.</p>}
              </div>
            )}

            <button type="button" disabled className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 px-5 py-3 text-sm font-bold text-slate-600">
              Checkout desactivado
            </button>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--brand-text-secondary)" }}>
              No se crean pagos, ventas, reservas ni movimientos de caja. Este carrito solo valida UX y datos de Airtable.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

function MarketingSection({ title, subtitle, items = [], onAdd, savingItem, currency }) {
  if (!items.length) return null;
  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--brand-text)" }}>{title}</h2>
          {subtitle && <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--brand-text-secondary)" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const key = `${item.item_type}-${item.item_id}`;
          const img = imageUrl(item.image);
          return (
            <article key={key} className="flex gap-3 rounded-2xl border border-white/50 bg-white/75 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {img ? (
                  <img src={img} alt={item.title || itemKindLabel(item.item_type)} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl">✨</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                    {item.reason || itemKindLabel(item.item_type)}
                  </span>
                  {item.price != null && <strong className="shrink-0 text-xs sm:text-sm" style={{ color: "var(--brand-text)" }}>{money(item.price, currency)}</strong>}
                </div>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug break-words" style={{ color: "var(--brand-text)" }}>{item.title}</h3>
                {item.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--brand-text-secondary)" }}>{item.description}</p>}
                <button
                  type="button"
                  disabled={savingItem === key}
                  onClick={() => onAdd(item)}
                  className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                >
                  {savingItem === key ? "Agregando…" : item.cta || "Agregar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PromoSection({ promotions = [], coupons = [], currency }) {
  if (!promotions.length && !coupons.length) return null;
  const all = [...promotions, ...coupons];
  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5">
      <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--brand-text)" }}>Promos y cupones</h2>
      <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--brand-text-secondary)" }}>
        Visibles desde Airtable. En esta fase no aplican cobro ni checkout real.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {all.map((item) => {
          const discount = item.discount_percent
            ? `${item.discount_percent}% OFF`
            : item.discount_amount
              ? `${money(item.discount_amount, currency)} OFF`
              : item.minimum_purchase
                ? `Desde ${money(item.minimum_purchase, currency)}`
                : "Beneficio";
          return (
            <article key={`${item.type}-${item.id}`} className="rounded-2xl border border-white/50 bg-white/75 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>{item.type}</span>
                <strong className="text-xs sm:text-sm" style={{ color: "var(--brand-primary)" }}>{discount}</strong>
              </div>
              <h3 className="line-clamp-2 text-sm font-bold leading-snug break-words" style={{ color: "var(--brand-text)" }}>{item.title}</h3>
              {item.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--brand-text-secondary)" }}>{item.description}</p>}
              {item.code && <p className="mt-2 inline-flex max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px]" style={{ color: "var(--brand-text)" }}>Cupón: {item.code}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
