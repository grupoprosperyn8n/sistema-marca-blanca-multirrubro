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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{ background: "rgba(125,211,252,0.15)", color: "var(--brand-primary)", border: "1px solid rgba(125,211,252,0.3)" }}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">inventory_2</span>
          Catálogo
        </div>
        <h1 className="display-lg mb-3" style={{ color: "var(--brand-text)", fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>
          {config.productsTitle || "Productos"}
        </h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: "var(--brand-text-secondary)", lineHeight: 1.7 }}>
          {config.productsSubtitle || "Productos publicados por el negocio para consulta, promoción o venta según configuración."}
        </p>
      </div>

      <div className="mx-auto mb-6 max-w-xl">
        <label htmlFor="productos-busqueda" className="sr-only">Buscar productos</label>
        <input
          id="productos-busqueda"
          name="productos_busqueda"
          type="search"
          autoComplete="off"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por producto o categoría…"
          className="w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ color: "var(--brand-text)" }}
        />
      </div>

      {/* Filtros por categoría */}
      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categorias.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-[background-color,color,box-shadow] duration-300 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((p, i) => (
            <ProductCard key={p._slug || p.nombre_visible || i} producto={p} onClick={() => navigate(`/productos/${p._slug}`)} />
          ))}
        </div>
      )}

      {/* CTA no transaccional */}
      {filtrados.length > 0 && (
        <div className="text-center mt-12">
          <div className="glass-panel inline-block px-8 py-5 rounded-2xl">
            <p className="text-sm mb-1" style={{ color: "var(--brand-text-secondary)" }}>
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
    </div>
  );
}
