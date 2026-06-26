import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isPublicBranch } from "../utils/publicDataFilters";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function SucursalesPublicas() {
  const { config } = useBrandConfig();
  const business = config.business || {};
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
  if (business.usesBranches === false && business.showContactAddress === false) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--brand-text)" }}>
          {config.sucursalesTitle || "Nuestras Sucursales"}
        </h2>
        <p className="text-sm sm:text-base opacity-60" style={{ color: "var(--brand-text)" }}>
          {config.sucursalesSubtitle || "Consultá sedes, puntos de atención o unidades operativas configuradas."}
        </p>
      </div>

      {branches.length === 0 ? (
        <div
          className="glass-panel mx-auto max-w-2xl rounded-3xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.78)" }}
        >
          <span className="material-symbols-outlined mb-3 text-5xl" aria-hidden="true" style={{ color: "var(--brand-primary)" }}>
            location_off
          </span>
          <h3 className="mb-3 text-xl font-bold" style={{ color: "var(--brand-text)" }}>
            No hay sucursales públicas configuradas
          </h3>
          <p className="mx-auto max-w-xl text-sm leading-relaxed opacity-65" style={{ color: "var(--brand-text)" }}>
            El sitio no muestra direcciones ficticias ni sedes no publicadas. Configurá una sucursal real como
            visible en el backoffice para habilitar reservas y contacto presencial.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/catalogo"
              className="rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
            >
              Ver Catálogo
            </Link>
            {business.usesAppointments !== false && (
              <Link
                to="/reserva"
                className="rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/70"
                style={{ borderColor: "rgba(0,0,0,0.12)", color: "var(--brand-text)" }}
              >
                Revisar Reservas
              </Link>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => {
          const address = b.DIRECCION_SUCURSAL || b["CALLE Y N°"];
          const phone = b.WHATSAPP_SUCURSAL || b.TELEFONO_CONTACTO;
          const hours = b.HORARIO_REFERENCIA || (b.HORARIO_APERTURA && b.HORARIO_CIERRE ? `${b.HORARIO_APERTURA} – ${b.HORARIO_CIERRE}` : "");
          return (
            <div
              key={b.id}
              className="glass-panel p-6 rounded-2xl flex flex-col"
              style={{ background: "rgba(255,255,255,0.75)" }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--brand-primary)" }}>
                {b.NOMBRE_SUCURSAL || b.NOMBRE_CORTO_SUCURSAL || "Sucursal"}
              </h3>
              {business.showContactAddress !== false && address && (
                <p className="text-sm mb-1 opacity-70" style={{ color: "var(--brand-text)" }}>
                  📍 {address}
                </p>
              )}
              {b.LOCALIDAD && (
                <p className="text-sm mb-1 opacity-60" style={{ color: "var(--brand-text)" }}>
                  {b.LOCALIDAD}{b.PROVINCIA ? `, ${b.PROVINCIA}` : ""}
                </p>
              )}
              {phone && phone !== "0000000005" && (
                <p className="text-sm mb-1 opacity-60" style={{ color: "var(--brand-text)" }}>
                  📱 {phone}
                </p>
              )}
              {hours && (
                <p className="text-sm mb-4 opacity-60" style={{ color: "var(--brand-text)" }}>
                  🕐 {hours}
                </p>
              )}
              {b.MAPA_UBICACION_URL && business.showContactAddress !== false && (
                <a
                  href={b.MAPA_UBICACION_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-4 text-sm font-semibold"
                  style={{ color: "var(--brand-primary)" }}
                >
                  Ver mapa
                </a>
              )}
              {business.usesAppointments !== false && (
                <div className="mt-auto pt-4">
                  <Link
                    to={b.SLUG_SUCURSAL ? `/reserva?sucursal=${b.SLUG_SUCURSAL}` : "/reserva"}
                    className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
                  >
                    Reservar en esta sucursal
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
