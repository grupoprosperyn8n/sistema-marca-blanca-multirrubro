import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

const statusVariant = {
  CONFIRMADA: "success",
  EN_CURSO: "warning",
  PENDIENTE_CONFIRMACION: "warning",
  REPROGRAMADA: "warning",
  COMPLETADA: "success",
  CANCELADA: "error",
  NO_ASISTIO: "error",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function sortBySchedule(a, b) {
  return `${a.FECHA_CITA || "9999-99-99"} ${a.HORA_INICIO || "99:99"}`.localeCompare(
    `${b.FECHA_CITA || "9999-99-99"} ${b.HORA_INICIO || "99:99"}`,
  );
}

function canComplete(cita, completionState) {
  const status = String(cita.ESTADO_CITA || "").toUpperCase();
  const date = cita.FECHA_CITA || "";
  if (!date || date > todayISO()) return false;
  return !["CANCELADA", completionState || "COMPLETADA", "NO_ASISTIO"].includes(status);
}

function formatTime(cita) {
  if (!cita.HORA_INICIO) return "Sin horario";
  return `${cita.HORA_INICIO}${cita.HORA_FIN ? ` – ${cita.HORA_FIN}` : ""}`;
}

function normalizeError(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;
  if (data?.detail?.message) return data.detail.message;
  return fallback;
}

export default function Profesional() {
  const [perfil, setPerfil] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVAS");
  const [dateFilter, setDateFilter] = useState("TODAS");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const completionState = perfil?.completion_state || "COMPLETADA";

  async function loadProfessionalAgenda() {
    setLoading(true);
    setError("");
    try {
      const [meRes, citasRes] = await Promise.all([
        fetch(`${API}/api/profesional/me`, { credentials: "include" }),
        fetch(`${API}/api/profesional/citas`, { credentials: "include" }),
      ]);
      const [meData, citasData] = await Promise.all([meRes.json(), citasRes.json()]);
      if (!meRes.ok) throw new Error(normalizeError(meData, `HTTP ${meRes.status}`));
      if (!citasRes.ok) throw new Error(normalizeError(citasData, `HTTP ${citasRes.status}`));
      setPerfil(meData);
      setCitas((citasData.citas || []).sort(sortBySchedule));
    } catch (err) {
      setError(err.message || "No se pudo cargar la agenda profesional.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfessionalAgenda();
  }, []);

  const filteredCitas = useMemo(() => {
    const today = todayISO();
    return citas.filter((cita) => {
      const status = String(cita.ESTADO_CITA || "").toUpperCase();
      const date = cita.FECHA_CITA || "";
      if (statusFilter === "ACTIVAS" && ["CANCELADA", completionState].includes(status)) return false;
      if (statusFilter !== "TODAS" && statusFilter !== "ACTIVAS" && status !== statusFilter) return false;
      if (dateFilter === "HOY" && date !== today) return false;
      if (dateFilter === "PROXIMAS" && date < today) return false;
      if (dateFilter === "PASADAS" && date >= today) return false;
      return true;
    });
  }, [citas, statusFilter, dateFilter, completionState]);

  const todayAppointments = citas.filter((cita) => cita.FECHA_CITA === todayISO());
  const upcomingAppointments = citas.filter((cita) => (
    (cita.FECHA_CITA || "") >= todayISO()
    && !["CANCELADA", completionState].includes(String(cita.ESTADO_CITA || "").toUpperCase())
  ));
  const completedAppointments = citas.filter((cita) => String(cita.ESTADO_CITA || "").toUpperCase() === completionState);

  async function markAsCompleted(cita) {
    setSavingId(cita.id);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API}/api/profesional/citas/${cita.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: completionState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(normalizeError(data, `HTTP ${res.status}`));
      setMessage(data.already_completed ? "La cita ya estaba completada." : "Cita marcada como completada.");
      await loadProfessionalAgenda();
    } catch (err) {
      setError(err.message || "No se pudo completar la cita.");
    } finally {
      setSavingId("");
    }
  }

  if (loading) return (
    <div className="text-center py-16">
      <div
        className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
        style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }}
      />
      <p className="opacity-50" style={{ color: "var(--brand-text)" }}>Cargando agenda profesional...</p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] opacity-50" style={{ color: "var(--brand-text)" }}>
            Portal profesional
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading, Manrope)", color: "var(--brand-text)" }}
          >
            Mi agenda
          </h1>
          <p className="text-sm opacity-70 mt-1" style={{ color: "var(--brand-text)" }}>
            {perfil?.nombre || "Profesional"}{perfil?.puesto ? ` · ${perfil.puesto}` : ""}
          </p>
        </div>
        <Badge variant="info">{perfil?.scope || "Agenda propia"}</Badge>
      </div>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>Citas de hoy</p>
          <p className="text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>{todayAppointments.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>Próximas activas</p>
          <p className="text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>{upcomingAppointments.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>Completadas</p>
          <p className="text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>{completedAppointments.length}</p>
        </GlassCard>
      </div>

      <div className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="block text-xs opacity-60 mb-1">Estado</span>
          <select
            className="rounded-xl border border-white/20 bg-white/70 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ACTIVAS">Activas</option>
            <option value="TODAS">Todas</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="REPROGRAMADA">Reprogramadas</option>
            <option value={completionState}>Completadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs opacity-60 mb-1">Fecha</span>
          <select
            className="rounded-xl border border-white/20 bg-white/70 px-3 py-2 text-sm"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            <option value="TODAS">Todas</option>
            <option value="HOY">Hoy</option>
            <option value="PROXIMAS">Próximas</option>
            <option value="PASADAS">Pasadas</option>
          </select>
        </label>
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--brand-primary)" }}
          onClick={loadProfessionalAgenda}
        >
          Refrescar
        </button>
      </div>

      <div className="space-y-3">
        {filteredCitas.length === 0 ? (
          <GlassCard>
            <p className="text-sm opacity-60 text-center py-6" style={{ color: "var(--brand-text)" }}>
              No hay citas para los filtros seleccionados.
            </p>
          </GlassCard>
        ) : filteredCitas.map((cita) => (
          <GlassCard key={cita.id}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
              <div>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <Badge variant={statusVariant[cita.ESTADO_CITA] || "neutral"}>{cita.ESTADO_CITA || "Sin estado"}</Badge>
                  {cita.ESTADO_SLOT && <Badge variant="info">Slot: {cita.ESTADO_SLOT}</Badge>}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: "var(--brand-text)" }}>
                  {cita.NOMBRE_CLIENTE || "Cliente sin nombre"}
                </h3>
                <p className="text-sm opacity-70" style={{ color: "var(--brand-text)" }}>
                  {cita.NOMBRE_SERVICIO || "Servicio"} · {cita.NOMBRE_SUCURSAL || "Sucursal no indicada"}
                </p>
                {cita.OBSERVACIONES_CLIENTE && (
                  <p className="text-xs opacity-60 mt-2" style={{ color: "var(--brand-text)" }}>
                    Nota cliente: {cita.OBSERVACIONES_CLIENTE}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm text-right" style={{ color: "var(--brand-text)" }}>
                  <p className="font-semibold">{cita.FECHA_CITA || "Sin fecha"}</p>
                  <p className="opacity-60">{formatTime(cita)}</p>
                </div>
                {canComplete(cita, completionState) && (
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={savingId === cita.id}
                    onClick={() => markAsCompleted(cita)}
                  >
                    {savingId === cita.id ? "Guardando..." : "Marcar completada"}
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
