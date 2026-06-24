import { useState, useEffect } from "react";
import { isPublicBranch } from "../utils/publicDataFilters";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function SucursalesPublicas() {
  const { config } = useBrandConfig();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/sucursales`);
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.sucursales || [];
        const publicas = raw.filter(isPublicBranch);
        setBranches(publicas);
      } catch (e) {
        console.warn("Error cargando sucursales:", e);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) return null;
  if (branches.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--brand-text)" }}>
          {config.sucursalesTitle || "Nuestras Sucursales"}
        </h2>
        <p className="text-sm sm:text-base opacity-60" style={{ color: "var(--brand-text)" }}>
          {config.sucursalesSubtitle || "Elegí la sucursal más cercana para tu próxima visita"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div
            key={b.id}
            className="glass-panel p-6 rounded-2xl flex flex-col"
            style={{ background: "rgba(255,255,255,0.75)" }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--brand-primary)" }}>
              {b.NOMBRE_SUCURSAL || b.NOMBRE_CORTO_SUCURSAL || "Sucursal"}
            </h3>
            {b.DIRECCION_SUCURSAL && (
              <p className="text-sm mb-1 opacity-70" style={{ color: "var(--brand-text)" }}>
                📍 {b.DIRECCION_SUCURSAL}
              </p>
            )}
            {b.LOCALIDAD && (
              <p className="text-sm mb-1 opacity-60" style={{ color: "var(--brand-text)" }}>
                {b.LOCALIDAD}{b.PROVINCIA ? `, ${b.PROVINCIA}` : ""}
              </p>
            )}
            {b.WHATSAPP_SUCURSAL && b.WHATSAPP_SUCURSAL !== "0000000005" && (
              <p className="text-sm mb-1 opacity-60" style={{ color: "var(--brand-text)" }}>
                📱 {b.WHATSAPP_SUCURSAL}
              </p>
            )}
            {b.HORARIO_APERTURA && b.HORARIO_CIERRE && (
              <p className="text-sm mb-4 opacity-60" style={{ color: "var(--brand-text)" }}>
                🕐 {b.HORARIO_APERTURA} – {b.HORARIO_CIERRE}
              </p>
            )}
            <div className="mt-auto pt-4">
              <a
                href={b.SLUG_SUCURSAL ? `/reserva?sucursal=${b.SLUG_SUCURSAL}` : "/reserva"}
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
              >
                Reservar en esta sucursal
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
