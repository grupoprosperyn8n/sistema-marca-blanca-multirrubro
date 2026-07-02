import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReservaTurnoModal from "../components/ReservaTurnoModal";

const API = import.meta.env.VITE_API_BASE_URL || "";

const EDITABLE_FIELDS = [
  { key: "NOMBRE_CLIENTE", label: "Nombre", type: "text" },
  { key: "TELEFONO", label: "Teléfono", type: "tel" },
  { key: "DOCUMENTO_IDENTIDAD", label: "DNI", type: "text" },
  { key: "CALLE_Y_N°", label: "Dirección", type: "text" },
  { key: "LOCALIDAD", label: "Localidad", type: "text" },
  { key: "PROVINCIA/PAIS", label: "Provincia / País", type: "text" },
  { key: "CODIGO POSTAL", label: "Código postal", type: "text" },
  { key: "FECHA_NACIMIENTO", label: "Fecha de nacimiento", type: "date" },
  { key: "PREFERENCIAS_SERVICIOS", label: "Preferencias", type: "text" },
  { key: "ACEPTA_COMUNICACIONES", label: "Acepta comunicaciones", type: "checkbox" },
];

const ESTADO_MAP = {
  PENDIENTE_CONFIRMACION: { label: "Pendiente", color: "#f59e0b", bg: "#fffbeb" },
  CONFIRMADA: { label: "Confirmada", color: "#10b981", bg: "#ecfdf5" },
  EN_CURSO: { label: "En curso", color: "#3b82f6", bg: "#eff6ff" },
  COMPLETADA: { label: "Completada", color: "#6b7280", bg: "#f3f4f6" },
  CANCELADA: { label: "Cancelada", color: "#ef4444", bg: "#fef2f2" },
  NO_ASISTIO: { label: "No asistió", color: "#9ca3af", bg: "#f9fafb" },
  REPROGRAMADA: { label: "Reprogramada", color: "#8b5cf6", bg: "#f5f3ff" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(value) {
  if (!value) return "";
  const d = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function money(value, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

function safeName(value, fallback = "—") {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.map(v => safeName(v, "")).filter(Boolean).join(", ") || fallback;
  const text = String(value).trim();
  return text.startsWith("rec") ? fallback : text;
}

export default function PortalCliente() {
  const { usuario, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [citas, setCitas] = useState({ proximas: [], historial: [], total: 0 });
  const [historial, setHistorial] = useState({ compras: [], pagos: [], total_compras: 0, total_pagos: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reprogTarget, setReprogTarget] = useState(null);
  const [reprogSlots, setReprogSlots] = useState([]);
  const [reprogSlotsLoading, setReprogSlotsLoading] = useState(false);
  const [reprogLoading, setReprogLoading] = useState(false);

  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const resp = await fetch(`${API}${url}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (resp.status === 401) {
      await logout();
      throw new Error("Sesión expirada");
    }
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(body.detail || `Error ${resp.status}`);
    return body;
  }, [logout]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [perfilData, citasData, comprasData] = await Promise.all([
        fetchWithCookie("/api/clientes/me"),
        fetchWithCookie("/api/clientes/me/citas"),
        fetchWithCookie("/api/clientes/me/compras").catch(() => ({ compras: [], pagos: [], total_compras: 0, total_pagos: 0 })),
      ]);
      setPerfil(perfilData);
      setCitas(citasData);
      setHistorial(comprasData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithCookie]);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const saveProfile = async (payload) => {
    setSaving(true);
    try {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          const original = perfil?.[key];
          if ((value === "" || value == null) && original == null) return false;
          return value !== original;
        })
      );
      if (Object.keys(cleanPayload).length === 0) {
        setShowProfileModal(false);
        return;
      }
      const updated = await fetchWithCookie("/api/clientes/me", {
        method: "PATCH",
        body: JSON.stringify(cleanPayload),
      });
      setPerfil(updated);
      setShowProfileModal(false);
      showToast("Perfil actualizado.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await fetchWithCookie(`/api/clientes/citas/${cancelTarget.id}/cancelar`, { method: "POST" });
      showToast("Turno cancelado.");
      setCancelTarget(null);
      loadData();
    } catch (e) {
      showToast(e.message || "Error al cancelar", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReprogramarCita = async (cita) => {
    if (cita.ES_MULTISERVICIO) {
      showToast("Para cambiar un turno con varios servicios, cancelalo y creá uno nuevo.", "error");
      return;
    }
    setReprogTarget(cita);
    setReprogSlotsLoading(true);
    try {
      const params = new URLSearchParams({
        disponible: "true",
        future_only: "true",
      });
      if (cita.SUCURSAL_ID) params.set("sucursal_id", cita.SUCURSAL_ID);
      if (cita.DURACION_MINUTOS) params.set("min_duration", String(cita.DURACION_MINUTOS));
      const data = await fetchWithCookie(`/api/agenda-slots?${params.toString()}`);
      const slots = data.agenda_slots || [];
      setReprogSlots(slots.filter(s => (
        s.id !== cita.AGENDA_SLOT_ID
        && s.ESTADO_SLOT === "DISPONIBLE"
        && s.PERMITE_RESERVA_WEB
        && (!cita.PROFESIONAL_ID || s.PROFESIONAL_ID === cita.PROFESIONAL_ID)
      )));
    } catch {
      showToast("No se pudieron cargar los horarios", "error");
      setReprogTarget(null);
    } finally {
      setReprogSlotsLoading(false);
    }
  };

  const confirmReprogramar = async (nuevoSlotId) => {
    if (!reprogTarget) return;
    setReprogLoading(true);
    try {
      await fetchWithCookie(`/api/clientes/citas/${reprogTarget.id}/reprogramar`, {
        method: "POST",
        body: JSON.stringify({ nuevo_slot_id: nuevoSlotId }),
      });
      showToast("Turno reprogramado.");
      setReprogTarget(null);
      loadData();
    } catch (e) {
      showToast(e.message || "Error al reprogramar", "error");
    } finally {
      setReprogLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
        <p className="mt-3 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando tu portal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="glass-panel rounded-3xl p-8">
          <p className="text-rose-600">⚠️ {error}</p>
          <button onClick={loadData} className="btn-primary mt-5 px-5 py-3 text-sm">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {toast.msg}
        </div>
      )}

      <section className="mb-5 overflow-hidden rounded-3xl p-5 sm:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.65))" }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Portal cliente</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--brand-text)" }}>
              Hola, {perfil?.NOMBRE_CLIENTE || usuario?.nombre || "Cliente"}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
              Gestioná tus turnos, tu carrito y tu historial desde un solo lugar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button onClick={() => setShowReservaModal(true)} className="btn-primary px-5 py-3 text-sm">Reservar turno</button>
            <Link to="/carrito" className="rounded-xl border border-white/60 bg-white/70 px-5 py-3 text-center text-sm font-bold" style={{ color: "var(--brand-text)" }}>🛒 Ver carrito</Link>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <InfoTile label="Próximas citas" value={citas.proximas?.length || 0} icon="📅" />
        <InfoTile label="Historial" value={citas.historial?.length || 0} icon="🧾" />
        <InfoTile label="Compras" value={historial.total_compras || 0} icon="🛍️" />
        <InfoTile label="Pagos" value={historial.total_pagos || 0} icon="💳" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr] lg:gap-6">
        <aside className="space-y-4">
          <section className="glass-panel rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Mi ficha</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Datos visibles del cliente.</p>
              </div>
              <button onClick={() => setShowProfileModal(true)} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                Editar perfil
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <InfoRow label="Email" value={perfil?.EMAIL || usuario?.email} />
              <InfoRow label="Teléfono" value={perfil?.TELEFONO} />
              <InfoRow label="DNI" value={perfil?.DOCUMENTO_IDENTIDAD} />
              <InfoRow label="Dirección" value={[perfil?.["CALLE_Y_N°"], perfil?.LOCALIDAD].filter(Boolean).join(", ")} />
              <InfoRow label="Estado" value={perfil?.ESTADO_COMERCIAL} />
            </dl>
          </section>

          <HistorySection compras={historial.compras || []} pagos={historial.pagos || []} />
        </aside>

        <main className="space-y-4">
          <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Mis turnos</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Próximas reservas e historial.</p>
              </div>
              <button onClick={() => setShowReservaModal(true)} className="rounded-xl bg-white/70 px-4 py-2 text-sm font-bold" style={{ color: "var(--brand-primary)" }}>+ Nuevo turno</button>
            </div>

            {citas.total === 0 ? (
              <EmptyState title="No tenés citas todavía" subtitle="Cuando reserves un turno, aparecerá acá." icon="📭" />
            ) : (
              <div className="mt-5 space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">Próximas ({citas.proximas.length})</h3>
                  {citas.proximas.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>No tenés citas próximas.</p>
                  ) : (
                    <div className="space-y-3">
                      {citas.proximas.map((cita) => (
                        <CitaCard key={cita.id} cita={cita} showActions onCancel={setCancelTarget} onReprogramar={handleReprogramarCita} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--brand-text-secondary)" }}>Historial ({citas.historial.length})</h3>
                  {citas.historial.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>Sin historial.</p>
                  ) : (
                    <div className="space-y-3">
                      {citas.historial.map((cita) => <CitaCard key={cita.id} cita={cita} />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {showProfileModal && (
        <EditProfileModal perfil={perfil} saving={saving} onSave={saveProfile} onClose={() => setShowProfileModal(false)} />
      )}
      {showReservaModal && (
        <ReservaTurnoModal onClose={() => { setShowReservaModal(false); loadData(); }} />
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancelar turno"
          message={`¿Querés cancelar el turno del ${fmtDate(cancelTarget.FECHA_CITA)} a las ${fmtTime(cancelTarget.HORA_INICIO)}?`}
          confirmLabel="Sí, cancelar"
          loading={cancelLoading}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {reprogTarget && (
        <ReprogramarModal
          cita={reprogTarget}
          slots={reprogSlots}
          loadingSlots={reprogSlotsLoading}
          loadingConfirm={reprogLoading}
          onConfirm={confirmReprogramar}
          onClose={() => setReprogTarget(null)}
        />
      )}
    </div>
  );
}

function InfoTile({ label, value, icon }) {
  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-4">
      <div className="text-xl sm:text-2xl">{icon}</div>
      <div className="mt-1 text-xl font-extrabold sm:text-2xl" style={{ color: "var(--brand-text)" }}>{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-text-secondary)" }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/50 pb-2">
      <dt className="font-semibold" style={{ color: "var(--brand-text-secondary)" }}>{label}</dt>
      <dd className="text-right" style={{ color: "var(--brand-text)" }}>{safeName(value)}</dd>
    </div>
  );
}

function EditProfileModal({ perfil, saving, onSave, onClose }) {
  const initial = Object.fromEntries(EDITABLE_FIELDS.map(field => [field.key, perfil?.[field.key] ?? (field.type === "checkbox" ? false : "")]));
  const [form, setForm] = useState(initial);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <ModalShell onClose={onClose} maxWidth={680}>
      <h3 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Editar perfil</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Un solo formulario para mantener la ficha prolija.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EDITABLE_FIELDS.map(field => (
          <label key={field.key} className={field.type === "checkbox" ? "flex items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2" : "block"}>
            {field.type === "checkbox" ? (
              <>
                <input type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => update(field.key, e.target.checked)} />
                <span className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>{field.label}</span>
              </>
            ) : (
              <>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-text-secondary)" }}>{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </>
            )}
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancelar</button>
        <button onClick={() => onSave(form)} disabled={saving} className="rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </ModalShell>
  );
}

function CitaCard({ cita, showActions = false, onCancel, onReprogramar }) {
  const estado = ESTADO_MAP[cita.ESTADO_CITA] || { label: cita.ESTADO_CITA || "—", color: "#6b7280", bg: "#f9fafb" };
  const activeState = ["CONFIRMADA", "PENDIENTE_CONFIRMACION", "REPROGRAMADA"].includes(cita.ESTADO_CITA);
  const cancelable = showActions && activeState;
  const reprogramable = showActions && activeState && !cita.ES_MULTISERVICIO;
  const title = safeName(cita.TITULO_CITA || cita.NOMBRE_SERVICIO || cita.NOMBRE_CITA, "Turno");
  const itemServices = Array.isArray(cita.ITEMS_CITA) ? cita.ITEMS_CITA : [];
  const servicesText = itemServices.length
    ? itemServices.map(item => safeName(item.NOMBRE_SERVICIO, "Servicio")).join(" + ")
    : safeName(cita.NOMBRE_SERVICIO, "A confirmar");

  if (!showActions) {
    return (
      <article className="rounded-2xl border border-white/60 bg-white/65 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{title}</h4>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: estado.bg, color: estado.color }}>
                {estado.label}
              </span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--brand-text-secondary)" }}>
              {fmtDate(cita.FECHA_CITA)} {cita.HORA_INICIO ? `· ${fmtTime(cita.HORA_INICIO)}` : ""} · {servicesText}
            </p>
          </div>
          {cita.CANTIDAD_SERVICIOS > 1 && (
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700">
              {cita.CANTIDAD_SERVICIOS} servicios
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/60 bg-white/70 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-base font-bold" style={{ color: "var(--brand-text)" }}>{title}</h4>
          <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
            {fmtDate(cita.FECHA_CITA)} {cita.HORA_INICIO ? `· ${fmtTime(cita.HORA_INICIO)}` : ""}
          </p>
          <div className="mt-2 grid gap-1 text-sm leading-snug" style={{ color: "var(--brand-text)" }}>
            <span>Servicio: {servicesText}</span>
            <span>Profesional: {safeName(cita.NOMBRE_PROFESIONAL, "A asignar")}</span>
            <span>Sucursal: {safeName(cita.NOMBRE_SUCURSAL, "A confirmar")}</span>
          </div>
        </div>
        <span className="w-fit rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: estado.bg, color: estado.color, border: `1px solid ${estado.color}` }}>
          {estado.label}
        </span>
      </div>
      {cita.OBSERVACIONES_CLIENTE && <p className="mt-3 text-sm italic" style={{ color: "var(--brand-text-secondary)" }}>“{cita.OBSERVACIONES_CLIENTE}”</p>}
      {(cancelable || reprogramable) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/60 pt-3">
          {reprogramable && <button onClick={() => onReprogramar(cita)} className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-bold text-violet-700">Cambiar horario</button>}
          {cancelable && <button onClick={() => onCancel(cita)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700">Cancelar</button>}
          {cita.ES_MULTISERVICIO && <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold" style={{ color: "var(--brand-text-secondary)" }}>Para cambiar varios servicios, cancelá y creá uno nuevo.</span>}
        </div>
      )}
    </article>
  );
}

function HistorySection({ compras, pagos }) {
  return (
    <section className="glass-panel rounded-3xl p-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Compras y pagos</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Solo lectura. No hay cobros online en esta fase.</p>
      {compras.length === 0 ? (
        <EmptyState title="Sin compras registradas" subtitle="Cuando haya ventas o pagos reales cargados en backend, se verán acá." icon="🧾" compact />
      ) : (
        <div className="mt-4 space-y-3">
          {compras.slice(0, 5).map(compra => (
            <article key={compra.id} className="rounded-2xl bg-white/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold" style={{ color: "var(--brand-text)" }}>{compra.numero || "Compra"}</p>
                  <p style={{ color: "var(--brand-text-secondary)" }}>{fmtDate(compra.fecha)} · {safeName(compra.estado, "Estado no informado")}</p>
                </div>
                <strong style={{ color: "var(--brand-primary)" }}>{money(compra.total, compra.moneda)}</strong>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--brand-text-secondary)" }}>{compra.items_count || 0} item(s) · Pagado {money(compra.monto_pagado, compra.moneda)}</p>
            </article>
          ))}
        </div>
      )}
      {pagos.length > 0 && (
        <div className="mt-5 border-t border-white/60 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--brand-text-secondary)" }}>Últimos pagos</h3>
          <div className="mt-3 space-y-2">
            {pagos.slice(0, 4).map(pago => (
              <div key={pago.id} className="flex justify-between gap-3 rounded-xl bg-white/60 px-3 py-2 text-sm">
                <span style={{ color: "var(--brand-text)" }}>{fmtDate(pago.fecha)} · {safeName(pago.metodo, "Pago")}</span>
                <strong style={{ color: "var(--brand-primary)" }}>{money(pago.monto, pago.moneda)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, subtitle, icon, compact = false }) {
  return (
    <div className={`text-center ${compact ? "py-5" : "py-10"}`} style={{ color: "var(--brand-text-secondary)" }}>
      <div className={compact ? "text-3xl" : "text-5xl"}>{icon || "📋"}</div>
      <p className="mt-2 font-bold" style={{ color: "var(--brand-text)" }}>{title}</p>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, loading, onConfirm, onClose }) {
  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>{title}</h3>
      <p className="mt-3 text-sm" style={{ color: "var(--brand-text-secondary)" }}>{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Volver</button>
        <button onClick={onConfirm} disabled={loading} className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {loading ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function ReprogramarModal({ cita, slots, loadingSlots, loadingConfirm, onConfirm, onClose }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const sorted = [...slots].sort((a, b) => `${a.FECHA_SLOT || ""}${a.HORA_INICIO || ""}`.localeCompare(`${b.FECHA_SLOT || ""}${b.HORA_INICIO || ""}`));

  return (
    <ModalShell onClose={onClose} maxWidth={540}>
      <h3 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Reprogramar turno</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>
        Turno actual: {fmtDate(cita.FECHA_CITA)} a las {fmtTime(cita.HORA_INICIO)}
      </p>
      {loadingSlots ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando horarios…</p>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>No hay horarios disponibles.</p>
      ) : (
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {sorted.map(slot => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className="w-full rounded-2xl border p-3 text-left text-sm"
              style={{ borderColor: selectedSlot === slot.id ? "var(--brand-primary)" : "#e5e7eb", background: selectedSlot === slot.id ? "#f0f9ff" : "#fff" }}
            >
              <strong>{fmtDate(slot.FECHA_SLOT)}</strong> · {fmtTime(slot.HORA_INICIO)} – {fmtTime(slot.HORA_FIN)}
              {slot.DURACION_MINUTOS && <span style={{ color: "var(--brand-text-secondary)" }}> · {slot.DURACION_MINUTOS} min</span>}
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={loadingConfirm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancelar</button>
        <button onClick={() => selectedSlot && onConfirm(selectedSlot)} disabled={!selectedSlot || loadingConfirm} className="rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
          {loadingConfirm ? "Reprogramando…" : "Confirmar"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose, maxWidth = 420 }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
