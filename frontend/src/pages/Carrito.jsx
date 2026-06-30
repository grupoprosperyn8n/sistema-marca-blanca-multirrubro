import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

function money(value, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

  const updateQuantity = async (item, quantity) => {
    setSavingItem(item.id);
    try {
      const data = await fetchWithCookie(`/api/carrito/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
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
      setCart(data);
      showToast("Producto quitado del carrito.");
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Compra online sandbox</p>
          <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "var(--brand-text)" }}>Tu carrito</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            Esta fase permite probar carrito contra Airtable. Checkout, pagos, ventas y caja/POS siguen bloqueados.
          </p>
        </div>
        <Link to="/productos" className="rounded-xl border border-white/60 bg-white/60 px-4 py-2 text-center text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
          Seguir comprando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-3xl">🛒</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>El carrito está vacío</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            Agregá productos desde la tienda para probar el flujo sandbox.
          </p>
          <Link to="/productos" className="btn-primary mt-6 inline-flex px-5 py-3 text-sm">Ver productos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const busy = savingItem === item.id;
              return (
                <article key={item.id} className="glass-panel overflow-hidden rounded-3xl p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button type="button" onClick={() => navigate(`/productos/${item.slug || item.product_id}`)} className="h-28 w-full overflow-hidden rounded-2xl bg-white/70 sm:w-32">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-3xl">✨</span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>{item.name}</h2>
                          {item.description && <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>{item.description}</p>}
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                            {item.stock_reservation_state === "NO_APLICA" ? "Sin reserva de stock" : item.stock_reservation_state}
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
          </div>

          <aside className="glass-panel h-fit rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Resumen sandbox</p>
            <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--brand-text)" }}>
              <div className="flex justify-between"><span>Items</span><strong>{cart.total_items}</strong></div>
              <div className="flex justify-between"><span>Subtotal</span><strong>{money(cart.subtotal, currency)}</strong></div>
              <div className="flex justify-between opacity-60"><span>Descuentos</span><span>{money(0, currency)}</span></div>
              <div className="border-t border-white/60 pt-3 flex justify-between text-lg"><span>Total</span><strong>{money(cart.total, currency)}</strong></div>
            </div>

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
