import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import MediaCarousel from "../components/ui/MediaCarousel";
import { formatPublicName, getPublicServiceImage, isPublicService, normalizeServiceCategory, toPublicSlug } from "../utils/publicDataFilters";
import { ROLES, useAuth } from "../context/AuthContext";
import { notifyCartUpdated } from "../hooks/useCartSummary";
import { mediaSlidesFrom } from "../utils/media";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function ServicioDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { role, usuario } = useAuth();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

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
          cartEnabled: Boolean(match.CARRITO_HABILITADO || match.VENTA_HABILITADA_WEB),
          anticipo: match.ANTICIPO_REQUERIDO_WEB || 0,
          beneficios: match.BENEFICIOS_WEB || match.BENEFICIOS || "",
          imagen: getPublicServiceImage(match),
          media: match.MEDIA_PUBLICA || match.media || [],
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
  const mediaSlides = mediaSlidesFrom({ media: s.media, images: [s.imagen], fallbackAlt: s.nombre });
  const canUseSandboxCart = usuario && role === ROLES.CLIENTE;
  const sandboxCartEnabled = s.cartEnabled && s.precio != null;

  const addServiceToCart = async () => {
    setCartLoading(true);
    setCartMessage(null);
    try {
      const res = await fetch(`${API}/api/carrito/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: "SERVICIO_WEB", service_web_id: s.id, quantity: 1 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || `Error ${res.status}`);
      notifyCartUpdated();
      setCartMessage({ type: "success", text: "Servicio agregado al carrito sandbox." });
    } catch (e) {
      setCartMessage({ type: "error", text: e.message || "No se pudo agregar el servicio al carrito." });
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: "var(--brand-text)" }}>
        ← Volver
      </button>

      <div className="glass-panel overflow-hidden rounded-3xl" style={{ background: "rgba(255,255,255,0.85)" }}>
        <MediaCarousel
          items={mediaSlides}
          alt={s.nombre}
          mediaClassName="h-64 sm:h-80"
          imageClassName="h-full w-full object-cover"
          fallbackIcon="spa"
          className="rounded-none"
        />
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
          {sandboxCartEnabled && (
            canUseSandboxCart ? (
              <button
                type="button"
                disabled={cartLoading}
                onClick={addServiceToCart}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
              >
                {cartLoading ? "Agregando…" : "Agregar servicio al carrito"}
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
              >
                Ingresar para comprar
              </Link>
            )
          )}
          {s.reserva && (
            <a
              href="/reserva"
              className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/60"
              style={{ color: "var(--brand-text)", borderColor: "#d1d5db" }}
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

        {cartMessage && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{
              background: cartMessage.type === "error" ? "#fff1f2" : "#ecfdf5",
              color: cartMessage.type === "error" ? "#be123c" : "#047857",
            }}
          >
            {cartMessage.text}
            {cartMessage.type === "success" && <Link to="/carrito" className="ml-2 underline">Ver carrito</Link>}
          </div>
        )}

        <p className="mt-6 text-xs opacity-50 text-center" style={{ color: "var(--brand-text)" }}>
          {sandboxCartEnabled
            ? "Carrito sandbox activo para servicios. Si el servicio requiere turno, se informa en el resumen."
            : "Este servicio se reserva o consulta por los canales configurados del negocio."}
        </p>
        </div>
      </div>
    </div>
  );
}
