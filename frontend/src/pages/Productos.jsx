import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import { formatCategoria } from "../utils/displayFormatters";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Productos() {
  const { config } = useBrandConfig();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [anomalias, setAnomalias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/productos-web`, { cache: "no-store" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // El endpoint devuelve { productos, excluidos, anomalias, total }
        const items = data.productos || [];
        // Filtrar anomalías que hayan pasado (no debería, pero por si acaso)
        const anomalos = (data.anomalias || []).map(a => a.nombre || a.id);
        const seguros = items.filter(p => !anomalos.includes(p.nombre_visible));
        const conSlug = seguros.map(p => ({
          ...p,
          _slug: String(p.nombre_visible || "").toLowerCase().split(/\s+/).join("-").replace(/[^a-z0-9-]/g, "") || p.id,
        }));
        setProductos(conSlug);
        setAnomalias(data.anomalias || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Categorías únicas (humanizadas) para filtros
  const categorias = ["Todos", ...new Set(productos.map(p => formatCategoria(p.categoria_publica)).filter(Boolean))];

  const search = busqueda.trim().toLowerCase();
  const filtrados = productos.filter(p => {
    const categoria = formatCategoria(p.categoria_publica);
    const matchesCategory = categoriaActiva === "Todos" || categoria === categoriaActiva;
    const matchesSearch = !search ||
      [p.nombre_visible, p.descripcion_visible, categoria].some(value => String(value || "").toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });
  const business = config.business || {};
  const productChannelCopy = business.usesCheckout
    ? "Canal transaccional pendiente de activación para esta demo."
    : "Consultá disponibilidad por el canal de atención configurado.";

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto"
        style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
      <p className="mt-4 opacity-50" style={{ color: "var(--brand-text)" }}>Cargando productos…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="glass-panel inline-block px-8 py-6 rounded-2xl">
        <p className="text-rose-500">Error al cargar productos: {error}</p>
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:py-10">
      {/* Header */}
      <div className="mb-7 text-center sm:mb-9">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: "rgba(125,211,252,0.15)", color: "var(--brand-primary)", border: "1px solid rgba(125,211,252,0.3)" }}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">inventory_2</span>
          Catálogo
        </div>
        <h1 className="text-balance text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--brand-text)" }}>
          {config.productsTitle || "Productos"}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base" style={{ color: "var(--brand-text-secondary)", lineHeight: 1.7 }}>
          {config.productsSubtitle || "Productos publicados por el negocio para consulta, promoción o venta según configuración."}
        </p>
      </div>

      <div className="mx-auto mb-4 max-w-xl sm:mb-5">
        <label htmlFor="productos-busqueda" className="sr-only">Buscar productos</label>
        <input
          id="productos-busqueda"
          name="productos_busqueda"
          type="search"
          autoComplete="off"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por producto o categoría…"
          className="w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ color: "var(--brand-text)" }}
        />
      </div>

      {/* Filtros por categoría */}
      {categorias.length > 1 && (
        <div className="-mx-3 mb-6 flex gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0 lg:mb-8">
          {categorias.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                categoriaActiva === cat
                  ? "text-white shadow-md"
                  : "bg-white/60 text-gray-600 hover:bg-white/90 border border-gray-200"
              }`}
              style={categoriaActiva === cat ? { background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid de productos */}
      {filtrados.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-30" style={{ color: "var(--brand-primary)" }}>
            inventory_2
          </span>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--brand-text)" }}>
            {search || categoriaActiva !== "Todos" ? "Sin resultados" : "Productos en preparación"}
          </h3>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text-secondary)" }}>
            {search || categoriaActiva !== "Todos"
              ? "Probá con otro producto o categoría."
              : "Todavía no hay productos publicados para esta demo."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {filtrados.map((p, i) => (
            <ProductCard key={p._slug || p.nombre_visible || i} producto={p} onClick={() => navigate(`/productos/${p._slug}`)} />
          ))}
        </div>
      )}

      {/* CTA no transaccional */}
      {filtrados.length > 0 && (
        <div className="mt-8 text-center sm:mt-10">
          <div className="glass-panel inline-block rounded-2xl px-5 py-4 sm:px-7">
            <p className="mb-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
              ¿Te interesa algún producto?
            </p>
            <span className="text-sm font-medium inline-flex items-center gap-1" style={{ color: "var(--brand-primary)" }}>
              {productChannelCopy}
              <span className="material-symbols-outlined text-sm" aria-hidden="true">support_agent</span>
            </span>
          </div>
        </div>
      )}

      {/* Reporte de anomalías (silencioso, solo si hay) */}
      {anomalias.length > 0 && (
        <div className="mt-16 border-t border-white/10 pt-8">
          <details className="opacity-40 hover:opacity-70 transition-opacity">
            <summary className="text-xs cursor-pointer" style={{ color: "var(--brand-text-secondary)" }}>
              {anomalias.length} producto{anomalias.length > 1 ? "s" : ""} con precio pendiente de revisión
            </summary>
            <ul className="mt-2 text-xs space-y-1" style={{ color: "var(--brand-text-secondary)" }}>
              {anomalias.map((a, i) => (
                <li key={i}>· {a.nombre || a.id} — ratio {a.ratio}x (no publicado)</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </main>
  );
}
