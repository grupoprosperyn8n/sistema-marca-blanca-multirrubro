import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServiceCard from "../components/ui/ServiceCard";
import SectionHeader from "../components/ui/SectionHeader";
import { isPublicService, normalizeServiceCategory, formatPublicName, getPublicServiceImage, toPublicSlug } from "../utils/publicDataFilters";
import { useBrandConfig } from "../context/BrandConfigContext";
import { ROLES, useAuth } from "../context/AuthContext";
import { notifyCartUpdated } from "../hooks/useCartSummary";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Catalogo() {
  const { config } = useBrandConfig();
  const { role, usuario } = useAuth();
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingService, setSavingService] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/servicios-web`, { cache: "no-store" });
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.servicios_web || [];

        // Filtrar solo servicios públicos
        const publicos = raw.filter(isPublicService).map(s => ({
          ...s,
          _categoria: normalizeServiceCategory(s),
          _nombre: formatPublicName(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || ''),
          _precio: s.PRECIO_WEB ?? s.PRECIO_PUBLICITADO_WEB ?? null,
          _duracion: s.DURACION_MINUTOS_WEB ?? s.DURACION_MINUTOS ?? null,
          _descripcion: s.DESCRIPCION_WEB || s.DESCRIPCION || '',
          _reserva: s.RESERVA_ONLINE_HABILITADA !== false,
          _compra: Boolean(s.CARRITO_HABILITADO || s.VENTA_HABILITADA_WEB),
          _imagen: getPublicServiceImage(s),
          _slug: toPublicSlug(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || s.SERVICIO_NOMBRE) || s.id,
        }));

        setServicios(publicos);

        // Categorías únicas de servicios públicos
        const cats = [...new Set(publicos.map(s => s._categoria).filter(Boolean))];
        setCategoriasDisponibles(cats.sort());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const categorias = ["Todos", ...categoriasDisponibles];
  const search = busqueda.trim().toLowerCase();
  const filtrados = servicios.filter(s => {
    const matchesCategory = categoriaActiva === "Todos" || s._categoria === categoriaActiva;
    const matchesSearch = !search ||
      [s._nombre, s._categoria, s._descripcion].some(value => String(value || "").toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });
  const catalogLabel = config?.business?.catalogLabel || "catálogo";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const comprarServicio = async (service) => {
    if (!usuario || role !== ROLES.CLIENTE) {
      navigate("/login");
      return;
    }
    setSavingService(service.id);
    try {
      const res = await fetch(`${API}/api/carrito/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: "SERVICIO_WEB", service_web_id: service.id, quantity: 1 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || `Error ${res.status}`);
      notifyCartUpdated();
      showToast("Servicio agregado al carrito.");
    } catch (e) {
      showToast(e.message || "No se pudo agregar el servicio.", "error");
    } finally {
      setSavingService(null);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
      <p className="mt-4 opacity-50" style={{ color: 'var(--brand-text)' }}>Cargando catálogo…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="glass-panel inline-block px-8 py-6 rounded-2xl">
        <p className="text-rose-500">Error al cargar: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {toast.message}
        </div>
      )}

      <SectionHeader
        title={config.catalogTitle || `Catálogo de ${config.brandName}`}
        subtitle={config.catalogSubtitle || `Explorá ${String(catalogLabel).toLowerCase()} publicado por el negocio.`}
      />

      <div className="mx-auto mb-6 max-w-xl">
        <label htmlFor="catalogo-busqueda" className="sr-only">Buscar en catálogo</label>
        <input
          id="catalogo-busqueda"
          name="catalogo_busqueda"
          type="search"
          autoComplete="off"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre o categoría…"
          className="w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ color: "var(--brand-text)" }}
        />
      </div>

      {/* Filtros públicos */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        {categorias.map((filtro) => (
          <button
            type="button"
            key={filtro}
            onClick={() => setCategoriaActiva(filtro)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-[background-color,color,box-shadow] duration-300 ${
              categoriaActiva === filtro
                ? 'text-white shadow-md'
                : 'bg-white/60 text-gray-600 hover:bg-white/90 border border-gray-200'
            }`}
            style={categoriaActiva === filtro ? { background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' } : {}}
          >
            {filtro}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <span className="material-symbols-outlined mb-4 block text-5xl opacity-30" style={{ color: 'var(--brand-primary)' }}>category</span>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
            {search || categoriaActiva !== "Todos" ? "Sin resultados" : "Catálogo en preparación"}
          </h3>
          <p className="text-sm opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>
            {search || categoriaActiva !== "Todos"
              ? "Probá con otro nombre o categoría."
              : "Próximamente se publicarán las opciones disponibles."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((sw, i) => (
            <ServiceCard
              key={sw.id || i}
              service={{
                nombre: sw._nombre,
                descripcion: sw._descripcion || null,
                precio: sw._precio,
                duracion_minutos: sw._duracion,
                categoria: sw._categoria,
                reservaHabilitada: sw._reserva,
                compraHabilitada: sw._compra,
                imagen: sw._imagen,
                imagenAlt: sw._nombre,
                media: sw.MEDIA_PUBLICA || sw.media || [],
                id: sw.id,
              }}
              buying={savingService === sw.id}
              onComprar={sw._compra ? comprarServicio : null}
              onReservar={sw._reserva ? () => navigate('/reserva') : null}
              onClick={() => navigate(`/servicios/${sw._slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
