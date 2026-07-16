import { useState, useEffect } from "react";
import AppointmentGrid from "../components/ui/AppointmentGrid";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import { canViewField, filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const exportColumns = [
  { header: "Cliente", field: "NOMBRE_CLIENTE" },
  { header: "Servicio", field: "NOMBRE_SERVICIO" },
  { header: "Fecha", field: "FECHA_CITA" },
  { header: "Hora", field: "HORA_INICIO" },
  { header: "Estado", field: "ESTADO_CITA" },
];
const agendaDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function Agenda() {
  const { access } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const showClient = canViewField(access, "CITAS", ["CLIENTE", "NOMBRE_CLIENTE", "CLIENTE_NOMBRE"]);
  const showService = canViewField(access, "CITAS", ["SERVICIO", "NOMBRE_SERVICIO"]);
  const visibleExportColumns = filterColumnsByAccess(exportColumns, access, "CITAS");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    async function loadAgenda() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch(`${API}/api/citas`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const d = await response.json();
        const citas = Array.isArray(d) ? d : d.citas || [];
        if (!active) return;
        setCitas(citas);
        setAppointments(citas.map((c, i) => ({
          id: c.id || i,
          day: c.FECHA_CITA ? (new Date(`${c.FECHA_CITA}T12:00:00`).getDay() + 6) % 7 : 0,
          hour: c.HORA_INICIO || "09:00",
          clientName: showClient ? (c.NOMBRE_CLIENTE || "") : "Reservado",
          servicio: showService ? (c.NOMBRE_SERVICIO || "") : "",
        })));
      } catch (error) {
        if (!active) return;
        setLoadError(error.name === "AbortError"
          ? "La agenda tardó demasiado en responder. Reintentá la carga."
          : "No se pudo cargar la agenda. Reintentá la carga.");
      } finally {
        if (active) setLoading(false);
        window.clearTimeout(timeout);
      }
    }

    loadAgenda();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [showClient, showService, reloadKey]);

  if (loading) return <p className="py-12 text-center opacity-50">Cargando agenda…</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Agenda</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="info">{appointments.length} citas</Badge>
          <ModuleActionBar
            moduleKey="citas"
            count={citas.length}
            rows={citas}
            columns={visibleExportColumns}
            filename="agenda-citas.csv"
          />
        </div>
      </div>
      {loadError && (
        <div role="status" aria-live="polite" className="mb-4 flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="min-h-10 shrink-0 rounded-lg border border-rose-200 px-3 py-2 font-semibold transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">Reintentar</button>
        </div>
      )}
      <AppointmentGrid
        appointments={appointments}
        days={agendaDays}
      />
      {appointments.length === 0 && (
        <GlassCard className="text-center py-8 mt-4">
          <p className="opacity-50" style={{ color: 'var(--brand-text)' }}>Sin citas registradas.</p>
        </GlassCard>
      )}
    </div>
  );
}
