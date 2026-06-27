import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatPublicName, getPublicServiceImage, isPublicService, normalizeServiceCategory, toPublicSlug } from "../utils/publicDataFilters";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function ServicioDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/servicios-web`, { cache: "no-store" });
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.servicios_web || [];
        const publicos = raw.filter(isPublicService);

        const match = publicos.find(sw => {
          const nombreSlug = toPublicSlug(sw.NOMBRE_PUBLICO_SERVICIO || sw.NOMBRE_SERVICIO || sw.SERVICIO_NOMBRE);
          return nombreSlug === slug || sw.id === slug;
        });

        if (!match) {
          setError("Servicio no encontrado");
          return;
        }

        setServicio({
          id: match.id,
          nombre: formatPublicName(match.NOMBRE_PUBLICO_SERVICIO || match.NOMBRE_SERVICIO || "Servicio"),
          descripcion: match.DESCRIPCION_WEB || match.DESCRIPCION || "",
          precio: match.PRECIO_WEB ?? match.PRECIO_PUBLICITADO_WEB ?? null,
          duracion: match.DURACION_MINUTOS_WEB ?? match.DURACION_MINUTOS ?? null,
          categoria: normalizeServiceCategory(match),
          reserva: match.RESERVA_ONLINE_HABILITADA !== false,
          anticipo: match.ANTICIPO_REQUERIDO_WEB || 0,
          beneficios: match.BENEFICIOS_WEB || match.BENEFICIOS || "",
          imagen: getPublicServiceImage(match),
        });
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
        <button onClick={() => navigate("/catalogo")} className="mt-4 text-sm underline" style={{ color: "var(--brand-primary)" }}>Volver al catálogo</button>
      </div>
    </div>
  );

  const s = servicio;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: "var(--brand-text)" }}>
        ← Volver
      </button>

      <div className="glass-panel overflow-hidden rounded-3xl" style={{ background: "rgba(255,255,255,0.85)" }}>
        {s.imagen?.url && (
          <div className="h-64 w-full bg-slate-100 sm:h-80">
            <img
              src={s.imagen.url}
              alt={s.nombre}
              width={s.imagen.width || 960}
              height={s.imagen.height || 540}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="p-8">
        {s.categoria && (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: "var(--brand-secondary)33", color: "var(--brand-primary)" }}>
            {s.categoria}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--brand-text)" }}>{s.nombre}</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          {s.precio != null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,102,134,0.08)" }}>
              <span className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
                ${Number(s.precio).toLocaleString("es-AR")}
              </span>
            </div>
          )}
          {s.duracion && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(125,211,252,0.15)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                ⏱ {s.duracion} min
              </span>
            </div>
          )}
          {s.reserva && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ background: "#dcfce7", color: "#166534" }}>
                Reserva online disponible
              </span>
            </div>
          )}
        </div>

        {s.descripcion && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--brand-text)" }}>Descripción</h3>
            <p className="text-sm leading-relaxed opacity-70" style={{ color: "var(--brand-text)" }}>{s.descripcion}</p>
          </div>
        )}

        {s.beneficios && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--brand-text)" }}>Beneficios</h3>
            <p className="text-sm leading-relaxed opacity-70" style={{ color: "var(--brand-text)" }}>{s.beneficios}</p>
          </div>
        )}

        {s.anticipo > 0 && (
          <div className="mb-8 p-4 rounded-xl" style={{ background: "rgba(125,211,252,0.12)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
              Anticipo requerido: ${Number(s.anticipo).toLocaleString("es-AR")}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {s.reserva && (
            <a
              href="/reserva"
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
            >
              Reservar este servicio
            </a>
          )}
          <button
            onClick={() => navigate("/catalogo")}
            className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/60"
            style={{ color: "var(--brand-text)", borderColor: "#d1d5db" }}
          >
            Ver más servicios
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
