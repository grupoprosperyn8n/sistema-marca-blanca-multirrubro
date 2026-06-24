import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServiceCard from "../components/ui/ServiceCard";
import SectionHeader from "../components/ui/SectionHeader";
import Badge from "../components/ui/Badge";
import { isPublicService, normalizeServiceCategory, formatPublicName } from "../utils/publicDataFilters";

const API = import.meta.env.VITE_API_BASE_URL || "";

const PUBLIC_FILTERS = ["Todos", "Cabello", "Manos y Pies", "Facial", "Maquillaje", "Spa / Bienestar"];

export default function Catalogo() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/servicios-web`);
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
          _slug: String(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || s.id,
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

  const filtrados = categoriaActiva === "Todos"
    ? servicios
    : servicios.filter(s => s._categoria === categoriaActiva);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
      <p className="mt-4 opacity-50" style={{ color: 'var(--brand-text)' }}>Cargando catálogo...</p>
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
      <SectionHeader
        title="Catálogo de Servicios"
        subtitle="Servicios profesionales de belleza y bienestar"
      />

      {/* Filtros públicos */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        {PUBLIC_FILTERS.filter(f => f === "Todos" || categoriasDisponibles.includes(f)).map((filtro) => (
          <button
            key={filtro}
            onClick={() => setCategoriaActiva(filtro)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
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
          <span className="text-5xl mb-4 block">💇</span>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Catálogo en preparación</h3>
          <p className="text-sm opacity-50">Próximamente publicaremos todos los servicios disponibles.</p>
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
              }}
              onReservar={sw._reserva ? () => window.location.href = '/reserva' : null}
              onClick={() => navigate(`/servicios/${sw._slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
