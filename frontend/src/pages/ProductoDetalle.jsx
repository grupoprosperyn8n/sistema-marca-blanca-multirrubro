import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ui/ImageCarousel";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function ProductoDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/productos-web`);
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.productos || [];
        
        const match = raw.find(p => {
          const nombreSlug = String(p.nombre_visible || "")
            .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          return nombreSlug === slug || p.id === slug;
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
        <button onClick={() => navigate("/productos")} className="mt-4 text-sm underline" style={{ color: "var(--brand-primary)" }}>Volver a productos</button>
      </div>
    </div>
  );

  const p = producto;
  const todasImagenes = [p.imagen, ...(p.imagenes || [])].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: "var(--brand-text)" }}>
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
            <a
              href="/reserva"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-center transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
            >
              Consultar disponibilidad
            </a>
            <button
              onClick={() => navigate("/productos")}
              className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/60"
              style={{ color: "var(--brand-text)", borderColor: "#d1d5db" }}
            >
              Ver más productos
            </button>
          </div>

          <p className="mt-6 text-xs opacity-40 text-center" style={{ color: "var(--brand-text)" }}>
            Próximamente compra online · Actualmente consultá disponibilidad en sucursal
          </p>
        </div>
      </div>
    </div>
  );
}
