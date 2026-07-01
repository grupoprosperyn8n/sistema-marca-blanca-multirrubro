import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MediaCarousel from "../components/ui/MediaCarousel";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

function displayValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value || "").trim();
}

export default function Personal() {
  const { config } = useBrandConfig();
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/personal-web`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setPersonal(Array.isArray(data) ? data : data.personal || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "No se pudo cargar el personal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
        <p className="mt-4 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando equipo…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="glass-panel rounded-3xl px-6 py-8">
          <p className="text-sm text-rose-600">No pudimos cargar el equipo: {error}</p>
          <Link to="/" className="mt-4 inline-flex text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-3 py-7 sm:px-6 sm:py-10">
      <section className="mb-8 text-center sm:mb-10">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
          style={{ background: "rgba(125,211,252,0.15)", color: "var(--brand-primary)", border: "1px solid rgba(125,211,252,0.3)" }}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">groups</span>
          Equipo
        </span>
        <h1 className="text-balance text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--brand-text)" }}>
          Conocé al personal de {config.brandName}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--brand-text-secondary)" }}>
          Perfiles, especialidades y servicios publicados desde Airtable. Cada ficha puede mostrar fotos o videos en carrusel con el mismo formato responsive.
        </p>
      </section>

      {personal.length === 0 ? (
        <div className="glass-panel mx-auto max-w-2xl rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined mb-3 block text-5xl opacity-40" style={{ color: "var(--brand-primary)" }}>person_off</span>
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Equipo en preparación</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            Todavía no hay perfiles públicos configurados para mostrar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {personal.map((persona) => (
            <article key={persona.id} className="glass-card flex h-full min-w-0 flex-col overflow-hidden rounded-3xl p-3 sm:p-4">
              <MediaCarousel
                items={persona.media || []}
                alt={persona.nombre}
                mediaClassName="aspect-[4/3]"
                imageClassName="h-full w-full object-cover"
                fallbackIcon="person"
                className="mb-4"
              />
              <div className="flex flex-1 flex-col min-w-0">
                <div className="mb-3">
                  <h2 className="line-clamp-2 text-lg font-extrabold leading-tight" style={{ color: "var(--brand-text)" }}>
                    {persona.nombre}
                  </h2>
                  {(persona.puesto || persona.especialidad) && (
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>
                      {[displayValue(persona.puesto), displayValue(persona.especialidad)].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                {persona.perfil && (
                  <p className="line-clamp-4 text-sm leading-relaxed" style={{ color: "var(--brand-text-secondary)" }}>
                    {persona.perfil}
                  </p>
                )}

                {persona.servicios?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {persona.servicios.slice(0, 4).map((servicio) => (
                      <span key={servicio} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold" style={{ color: "var(--brand-text)" }}>
                        {servicio}
                      </span>
                    ))}
                  </div>
                )}

                {persona.sucursales?.length > 0 && (
                  <p className="mt-auto pt-4 text-xs" style={{ color: "var(--brand-text-secondary)" }}>
                    📍 {persona.sucursales.join(", ")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/reserva"
          className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold sm:w-auto"
        >
          <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
          Reservar turno
        </Link>
      </div>
    </main>
  );
}
