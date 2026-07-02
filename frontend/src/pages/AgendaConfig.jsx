import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

const WEEKDAYS = [
  { value: 0, label: "Lun" },
  { value: 1, label: "Mar" },
  { value: 2, label: "Mié" },
  { value: 3, label: "Jue" },
  { value: 4, label: "Vie" },
  { value: 5, label: "Sáb" },
  { value: 6, label: "Dom" },
];

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date(`${todayISO()}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDateLines(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactSpecialty(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

export default function AgendaConfig() {
  const [bootstrap, setBootstrap] = useState({ sucursales: [], empleados: [], defaults: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sucursal_id: "",
    todos_empleados: true,
    empleado_ids: [],
    fecha_desde: todayISO(),
    fecha_hasta: addDaysISO(30),
    slot_minutos: 60,
    horario_tipo: "corrido",
    bloques: [{ inicio: "09:00", fin: "18:00" }],
    dias_semana: [0, 1, 2, 3, 4],
    feriados_text: "",
    cierres_text: "",
    permite_reserva_web: true,
    requiere_confirmacion: false,
  });

  const selectedBranchEmployees = useMemo(() => {
    if (!form.sucursal_id) return bootstrap.empleados;
    return bootstrap.empleados.filter((employee) => (
      employee.trabajaEnTodas
      || employee.sucursalBaseIds?.includes(form.sucursal_id)
      || employee.sucursalIds?.includes(form.sucursal_id)
    ));
  }, [bootstrap.empleados, form.sucursal_id]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/backoffice/agenda-config/bootstrap`, { credentials: "include", cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
        setBootstrap(data);
        setForm((prev) => ({
          ...prev,
          sucursal_id: data.sucursales?.[0]?.id || "",
          bloques: data.defaults?.bloques || prev.bloques,
          dias_semana: data.defaults?.diasSemana || prev.dias_semana,
          slot_minutos: data.defaults?.slotMinutos || prev.slot_minutos,
        }));
      } catch (err) {
        setError(err.message || "No se pudo cargar el configurador.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setScheduleType(type) {
    update("horario_tipo", type);
    update("bloques", type === "cortado"
      ? [{ inicio: "09:00", fin: "13:00" }, { inicio: "15:00", fin: "18:00" }]
      : [{ inicio: "09:00", fin: "18:00" }]);
  }

  function toggleWeekday(day) {
    setForm((prev) => {
      const set = new Set(prev.dias_semana);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, dias_semana: [...set].sort() };
    });
  }

  function toggleEmployee(employeeId) {
    setForm((prev) => {
      const set = new Set(prev.empleado_ids);
      if (set.has(employeeId)) set.delete(employeeId);
      else set.add(employeeId);
      return { ...prev, empleado_ids: [...set] };
    });
  }

  function payload(dryRun = true) {
    const closedDates = parseDateLines(form.cierres_text);
    return {
      sucursal_id: form.sucursal_id,
      todos_empleados: form.todos_empleados,
      empleado_ids: form.todos_empleados ? [] : form.empleado_ids,
      fecha_desde: form.fecha_desde,
      fecha_hasta: form.fecha_hasta,
      slot_minutos: Number(form.slot_minutos),
      bloques: form.bloques,
      dias_semana: form.dias_semana,
      feriados: parseDateLines(form.feriados_text),
      dias_cerrados: closedDates,
      permite_reserva_web: form.permite_reserva_web,
      requiere_confirmacion: form.requiere_confirmacion,
      dry_run: dryRun,
    };
  }

  async function callGenerator(dryRun) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/agenda-config/generar-slots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(dryRun)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage(dryRun
        ? `Simulación OK: ${data.slots_planificados} slots nuevos, ${data.omitidos_por_existentes} ya existían.`
        : `Agenda generada: ${data.slots_creados} slots creados.`);
    } catch (err) {
      setError(err.message || "No se pudo generar la agenda.");
    } finally {
      setSaving(false);
    }
  }

  async function blockSlots() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/agenda-config/bloquear-slots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursal_id: form.sucursal_id,
          empleado_ids: form.todos_empleados ? [] : form.empleado_ids,
          fecha_desde: form.fecha_desde,
          fecha_hasta: form.fecha_hasta,
          motivo: "Agenda cerrada desde configurador",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage(`Cierre aplicado: ${data.bloqueados} slots bloqueados. Reservados omitidos: ${data.omitidos_reservados}.`);
    } catch (err) {
      setError(err.message || "No se pudo bloquear la agenda.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-12 text-center opacity-60">Cargando configurador de agenda...</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Configurador de agenda</p>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--brand-text)" }}>Generar disponibilidad sin tocar Airtable</h2>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            Definí horario corrido o cortado, días laborables, feriados y cierres. El sistema crea slots disponibles y bloquea cierres de forma lógica.
          </p>
        </div>
        <Badge variant="info">Sin DELETE físico</Badge>
      </div>

      {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Sucursal
              <select value={form.sucursal_id} onChange={(event) => update("sucursal_id", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm">
                {bootstrap.sucursales.map((branch) => <option key={branch.id} value={branch.id}>{branch.nombre}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Tamaño del slot
              <select value={form.slot_minutos} onChange={(event) => update("slot_minutos", Number(event.target.value))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm">
                {[15, 30, 45, 60, 90, 120, 180].map((value) => <option key={value} value={value}>{value} minutos</option>)}
              </select>
            </label>
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Desde
              <input type="date" value={form.fecha_desde} onChange={(event) => update("fecha_desde", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
            </label>
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Hasta
              <input type="date" value={form.fecha_hasta} onChange={(event) => update("fecha_hasta", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold" style={{ color: "var(--brand-text)" }}>Tipo de horario</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["corrido", "cortado"].map((type) => (
                <button key={type} type="button" onClick={() => setScheduleType(type)} className="rounded-2xl border px-4 py-3 text-left text-sm font-bold" style={{ borderColor: form.horario_tipo === type ? "var(--brand-primary)" : "#e5e7eb", background: form.horario_tipo === type ? "rgba(14,165,233,.08)" : "#fff", color: "var(--brand-text)" }}>
                  Horario {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {form.bloques.map((block, index) => (
              <div key={index} className="rounded-2xl bg-white/75 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Bloque {index + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={block.inicio} onChange={(event) => setForm((prev) => ({ ...prev, bloques: prev.bloques.map((item, idx) => idx === index ? { ...item, inicio: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input type="time" value={block.fin} onChange={(event) => setForm((prev) => ({ ...prev, bloques: prev.bloques.map((item, idx) => idx === index ? { ...item, fin: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold" style={{ color: "var(--brand-text)" }}>Días laborables</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button key={day.value} type="button" onClick={() => toggleWeekday(day.value)} className="rounded-full border px-3 py-2 text-xs font-bold" style={{ borderColor: form.dias_semana.includes(day.value) ? "var(--brand-primary)" : "#e5e7eb", background: form.dias_semana.includes(day.value) ? "var(--brand-primary)" : "#fff", color: form.dias_semana.includes(day.value) ? "#fff" : "var(--brand-text)" }}>{day.label}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Feriados globales
              <textarea value={form.feriados_text} onChange={(event) => update("feriados_text", event.target.value)} placeholder="2026-12-25&#10;2027-01-01" className="mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
            </label>
            <label className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              Días cerrados individuales
              <textarea value={form.cierres_text} onChange={(event) => update("cierres_text", event.target.value)} placeholder="2026-08-15&#10;2026-08-16" className="mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={saving || !form.sucursal_id} onClick={() => callGenerator(true)} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-700 disabled:opacity-50">Simular generación</button>
            <button type="button" disabled={saving || !form.sucursal_id} onClick={() => callGenerator(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>Crear slots</button>
            <button type="button" disabled={saving || !form.sucursal_id} onClick={blockSlots} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 disabled:opacity-50 sm:col-span-2">Cerrar / bloquear rango seleccionado</button>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold" style={{ color: "var(--brand-text)" }}>Personal incluido</h3>
              <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>Global para todos o individual por empleado.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--brand-text)" }}>
              <input type="checkbox" checked={form.todos_empleados} onChange={(event) => update("todos_empleados", event.target.checked)} />
              Todos
            </label>
          </div>
          <div className="space-y-2">
            {selectedBranchEmployees.map((employee) => {
              const checked = form.todos_empleados || form.empleado_ids.includes(employee.id);
              return (
                <button key={employee.id} type="button" disabled={form.todos_empleados} onClick={() => toggleEmployee(employee.id)} className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left disabled:cursor-default" style={{ borderColor: checked ? "var(--brand-primary)" : "#e5e7eb" }}>
                  {employee.fotoUrl ? <img src={employee.fotoUrl} alt="" className="h-11 w-11 rounded-2xl object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">{employee.nombre?.charAt(0) || "P"}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{employee.nombre}</span>
                    <span className="line-clamp-2 block text-xs" style={{ color: "var(--brand-text-secondary)" }}>{employee.puesto || compactSpecialty(employee.especialidad) || employee.descripcion || "Profesional habilitado"}</span>
                  </span>
                  <span className={`h-3 w-3 rounded-full ${checked ? "bg-emerald-500" : "bg-slate-200"}`} />
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
