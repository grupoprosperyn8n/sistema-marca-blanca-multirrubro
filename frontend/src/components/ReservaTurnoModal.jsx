import { useEffect, useMemo, useState } from "react";
import { ROLES, useAuth } from "../context/AuthContext";
import { isPublicBranch, formatPublicName } from "../utils/publicDataFilters";

const API = import.meta.env.VITE_API_BASE_URL || "";
const AUTO_PROFESSIONAL = "AUTO";

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

function money(value) {
  if (value == null || value === "") return "Consultar";
  const number = Number(value);
  if (Number.isNaN(number)) return "Consultar";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(number);
}

function serviceName(service) {
  return formatPublicName(service?.NOMBRE_PUBLICO_SERVICIO || service?.NOMBRE_SERVICIO || service?.SERVICIO_NOMBRE || "Servicio");
}

function servicePrice(service) {
  return service?.PRECIO_WEB ?? service?.PRECIO_PUBLICITADO_WEB ?? null;
}

function serviceDuration(service) {
  return service?.DURACION_MINUTOS_WEB ?? service?.DURACION_MINUTOS ?? null;
}

function branchName(branch) {
  return formatPublicName(branch?.NOMBRE_SUCURSAL || branch?.NOMBRE_CORTO_SUCURSAL || "Sucursal");
}

function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
}

function formatTime(raw) {
  return String(raw || "").slice(0, 5);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSlotIds(slot) {
  if (!slot) return [];
  if (Array.isArray(slot.slotIds) && slot.slotIds.length) return slot.slotIds;
  return slot.id ? [slot.id] : [];
}

const steps = [
  { id: 1, label: "Sucursal" },
  { id: 2, label: "Servicios" },
  { id: 3, label: "Agenda" },
  { id: 4, label: "Confirmar" },
];

export default function ReservaTurnoModal({ onClose }) {
  const { usuario, role, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState(AUTO_PROFESSIONAL);
  const [professionals, setProfessionals] = useState([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [fecha, setFecha] = useState(addDaysISO(1));
  const [slotOptions, setSlotOptions] = useState({});
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const selectedSucursal = useMemo(() => sucursales.find((branch) => branch.id === sucursalId), [sucursales, sucursalId]);
  const selectedService = useMemo(() => servicios.find((service) => service.id === serviceId), [servicios, serviceId]);
  const allItemsHaveSlot = items.length > 0 && items.every((item) => item.slot?.id);
  const selectedSlotIds = new Set(items.flatMap((item) => getSlotIds(item.slot)));
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const canConfirmOnline = usuario && role === ROLES.CLIENTE;

  async function fetchWithCookie(url, options = {}) {
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
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [servicesRes, branchesRes] = await Promise.all([
          fetch(`${API}/api/servicios-web`, { cache: "no-store" }),
          fetch(`${API}/api/sucursales`, { cache: "no-store" }),
        ]);
        if (!servicesRes.ok) throw new Error(`Servicios HTTP ${servicesRes.status}`);
        if (!branchesRes.ok) throw new Error(`Sucursales HTTP ${branchesRes.status}`);
        const servicesData = await servicesRes.json();
        const branchesData = await branchesRes.json();
        const rawServices = Array.isArray(servicesData) ? servicesData : servicesData.servicios_web || [];
        const rawBranches = Array.isArray(branchesData) ? branchesData : branchesData.sucursales || [];
        if (cancelled) return;
        setServicios(rawServices.filter((service) => {
          const name = serviceName(service);
          return name && name.toUpperCase() !== "SERVICIO" && service.RESERVA_ONLINE_HABILITADA !== false;
        }));
        setSucursales(rawBranches.filter((branch) => isPublicBranch(branch) && branch.PERMITE_RESERVAS_WEB !== false));
      } catch (err) {
        if (!cancelled) setError(err.message || "No se pudo cargar la reserva.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setProfessionals([]);
    setProfessionalId(AUTO_PROFESSIONAL);
    if (!sucursalId || !serviceId) return;
    let cancelled = false;
    async function loadProfessionals() {
      setProfessionalsLoading(true);
      try {
        const params = new URLSearchParams({ sucursal_id: sucursalId, servicio_web_id: serviceId });
        const res = await fetch(`${API}/api/reserva/profesionales?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProfessionals(data.profesionales || []);
      } catch {
        if (!cancelled) setProfessionals([]);
      } finally {
        if (!cancelled) setProfessionalsLoading(false);
      }
    }
    loadProfessionals();
    return () => { cancelled = true; };
  }, [sucursalId, serviceId]);

  useEffect(() => {
    if (step !== 3 || !sucursalId || items.length === 0 || !fecha) return;
    let cancelled = false;
    async function loadAgenda() {
      setAgendaLoading(true);
      const next = {};
      await Promise.all(items.map(async (item) => {
        const params = new URLSearchParams({
          sucursal_id: sucursalId,
          servicio_web_id: item.serviceId,
          fecha,
          profesional_id: item.professionalId || AUTO_PROFESSIONAL,
        });
        try {
          const res = await fetch(`${API}/api/reserva/agenda-opciones?${params.toString()}`, { cache: "no-store" });
          next[item.uid] = res.ok ? await res.json() : { slots: [], total: 0 };
        } catch {
          next[item.uid] = { slots: [], total: 0 };
        }
      }));
      if (!cancelled) {
        setSlotOptions(next);
        setAgendaLoading(false);
      }
    }
    loadAgenda();
    return () => { cancelled = true; };
  }, [step, sucursalId, items, fecha]);

  function goToStep(target) {
    if (target > 1 && !sucursalId) return;
    if (target > 2 && items.length === 0) return;
    if (target > 3 && !allItemsHaveSlot) return;
    setMessage("");
    setStep(target);
  }

  function handleBranchChange(value) {
    setSucursalId(value);
    setServiceId("");
    setItems([]);
    setSlotOptions({});
    setMessage("");
  }

  function addServiceItem() {
    if (!selectedService) {
      setMessage("Elegí un servicio para agregarlo al turno.");
      return;
    }
    const selectedProfessional = professionals.find((prof) => prof.id === professionalId);
    const item = {
      uid: uid(),
      serviceId: selectedService.id,
      serviceName: serviceName(selectedService),
      price: servicePrice(selectedService),
      duration: serviceDuration(selectedService),
      professionalId: professionalId || AUTO_PROFESSIONAL,
      professionalName: selectedProfessional?.nombre || "Automático",
      slot: null,
    };
    setItems((prev) => [...prev, item]);
    setServiceId("");
    setProfessionalId(AUTO_PROFESSIONAL);
    setProfessionals([]);
    setMessage("");
  }

  function removeItem(targetUid) {
    setItems((prev) => prev.filter((item) => item.uid !== targetUid));
    setSlotOptions((prev) => {
      const next = { ...prev };
      delete next[targetUid];
      return next;
    });
  }

  function selectSlot(targetUid, slot) {
    setItems((prev) => prev.map((item) => item.uid === targetUid ? {
      ...item,
      slot,
      professionalId: slot.profesionalId,
      professionalName: slot.profesionalNombre,
    } : item));
  }

  async function confirmBooking() {
    if (!allItemsHaveSlot || !canConfirmOnline) return;
    setConfirming(true);
    setMessage("");
    try {
      const data = await fetchWithCookie("/api/clientes/citas/confirmar-multiple", {
        method: "POST",
        body: JSON.stringify({
          sucursal_id: sucursalId,
          items: items.map((item, index) => ({
            orden: index + 1,
            servicio_web_id: item.serviceId,
            slot_id: item.slot.id,
            slot_ids: getSlotIds(item.slot),
            profesional_id: item.professionalId,
          })),
        }),
      });
      if (data.confirmado === false) throw new Error(data?.mensaje || "No se pudo confirmar el turno.");
      setConfirmed(data);
      setMessage("Turno confirmado. Ya aparece en tu portal.");
    } catch (err) {
      setMessage(err.message || "No se pudo confirmar el turno.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-2 sm:p-4" onClick={onClose}>
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Portal cliente</p>
            <h2 className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--brand-text)" }}>Reservar turno</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Mismo flujo que la web: sucursal, servicios, agenda y confirmación.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-xl leading-none text-slate-500 hover:bg-slate-200" aria-label="Cerrar">×</button>
        </header>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 overflow-x-auto pb-2">
            {steps.map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToStep(item.id)}
                  className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-xs font-bold transition-colors sm:px-3 sm:text-sm"
                  style={{
                    color: active || done ? "#fff" : "var(--brand-text-secondary)",
                    background: active || done ? "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" : "#f8fafc",
                  }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">{done ? "✓" : item.id}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando reserva…</div>
          ) : error ? (
            <div className="my-8 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div>
          ) : confirmed ? (
            <div className="mx-auto my-8 max-w-xl rounded-3xl bg-emerald-50 px-5 py-6 text-center text-emerald-800">
              <div className="text-4xl">✅</div>
              <h3 className="mt-3 text-xl font-extrabold">Turno confirmado</h3>
              <p className="mt-2 text-sm">Ya quedó guardado en tu portal. Podés verlo en “Mis turnos”.</p>
              <button type="button" onClick={onClose} className="mt-5 rounded-2xl px-5 py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                Ver mis turnos
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="space-y-4">
                {message && (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" role="status" style={{ color: message.includes("confirmado") ? "#047857" : "#be123c" }}>{message}</div>
                )}

                {step === 1 && (
                  <Panel title="1. Elegí la sucursal" subtitle="Primero definimos dónde se va a atender el turno.">
                    <Select label="Sucursal" value={sucursalId} onChange={handleBranchChange} placeholder="Seleccionar sucursal…" options={sucursales.map((branch) => ({ value: branch.id, label: branchName(branch) }))} />
                    {sucursales.length === 0 && <EmptyText>No hay sucursales públicas con reserva web habilitada.</EmptyText>}
                    <FooterActions nextLabel="Continuar a Servicios" nextDisabled={!sucursalId} onNext={() => goToStep(2)} />
                  </Panel>
                )}

                {step === 2 && (
                  <Panel title="2. Agregá servicios y profesional" subtitle="Podés sumar varios servicios. Si no sabés con quién atenderte, dejá Automático.">
                    <button type="button" onClick={() => goToStep(1)} className="mb-3 text-sm font-bold" style={{ color: "var(--brand-primary)" }}>← Cambiar sucursal</button>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <Select label="Servicio" value={serviceId} onChange={setServiceId} placeholder="Seleccionar servicio…" options={servicios.map((service) => ({ value: service.id, label: `${serviceName(service)} · ${money(servicePrice(service))}` }))} />
                      <Select label="Profesional" value={professionalId} onChange={setProfessionalId} disabled={!serviceId || professionalsLoading} options={[{ value: AUTO_PROFESSIONAL, label: professionalsLoading ? "Buscando…" : "Automático: menor carga" }, ...professionals.map((prof) => ({ value: prof.id, label: prof.nombre }))]} />
                      <div className="flex items-end"><button type="button" onClick={addServiceItem} className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>Agregar</button></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {items.length === 0 ? <EmptyText>Todavía no agregaste servicios al turno.</EmptyText> : items.map((item, index) => (
                        <div key={item.uid} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                          <div className="min-w-0"><p className="text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{index + 1}. {item.serviceName}</p><p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{item.professionalName} · {item.duration ? `${item.duration} min · ` : ""}{money(item.price)}</p></div>
                          <button type="button" onClick={() => removeItem(item.uid)} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Quitar</button>
                        </div>
                      ))}
                    </div>
                    <FooterActions backLabel="Volver" onBack={() => goToStep(1)} nextLabel="Elegir Agenda" nextDisabled={items.length === 0} onNext={() => goToStep(3)} />
                  </Panel>
                )}

                {step === 3 && (
                  <Panel title="3. Elegí agenda por servicio" subtitle="Cada servicio puede tener un profesional y horario propio.">
                    <button type="button" onClick={() => goToStep(2)} className="mb-3 text-sm font-bold" style={{ color: "var(--brand-primary)" }}>← Modificar servicios</button>
                    <label className="mb-4 block max-w-xs"><span className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Fecha</span><input type="date" value={fecha} min={todayISO()} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" /></label>
                    {agendaLoading ? <EmptyText>Buscando agenda…</EmptyText> : <div className="space-y-4">{items.map((item) => {
                      const options = slotOptions[item.uid]?.slots || [];
                      return <article key={item.uid} className="rounded-3xl border border-slate-100 bg-slate-50 p-3"><div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{item.serviceName}</h3><p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>Profesional: {item.professionalName}</p></div>{slotOptions[item.uid]?.recommended_professional && <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Sugerido: {slotOptions[item.uid].recommended_professional.nombre}</span>}</div>{options.length === 0 ? <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">Sin horarios publicados para {formatDate(fecha)}.</div> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{options.map((slot) => { const itemSlotIds = new Set(getSlotIds(item.slot)); const usedByOther = getSlotIds(slot).some((slotId) => selectedSlotIds.has(slotId) && !itemSlotIds.has(slotId)); const active = item.slot?.id === slot.id; return <button key={`${item.uid}-${slot.id}`} type="button" disabled={usedByOther} onClick={() => selectSlot(item.uid, slot)} className="min-h-[72px] rounded-2xl border px-2 py-2 text-left text-xs font-semibold disabled:opacity-40" style={{ borderColor: active ? "var(--brand-primary)" : "#e5e7eb", background: active ? "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" : "#fff", color: active ? "#fff" : "var(--brand-text)" }}><span className="block text-sm font-extrabold">{formatTime(slot.horaInicio)}–{formatTime(slot.horaFin)}</span><span className="mt-1 block truncate opacity-90">{slot.profesionalNombre}</span><span className="mt-1 block opacity-70">{slot.duracion} min</span></button>; })}</div>}</article>;
                    })}</div>}
                    <FooterActions backLabel="Volver" onBack={() => goToStep(2)} nextLabel="Revisar Turno" nextDisabled={!allItemsHaveSlot} onNext={() => goToStep(4)} />
                  </Panel>
                )}

                {step === 4 && (
                  <Panel title="4. Confirmá el turno" subtitle="Revisá servicios, profesionales y horarios antes de confirmar.">
                    <button type="button" onClick={() => goToStep(3)} className="mb-3 text-sm font-bold" style={{ color: "var(--brand-primary)" }}>← Modificar agenda</button>
                    <div className="space-y-2">{items.map((item, index) => <div key={item.uid} className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{index + 1}. {item.serviceName}</p><p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{formatDate(fecha)} · {formatTime(item.slot?.horaInicio)}–{formatTime(item.slot?.horaFin)} · {item.professionalName}</p></div>)}</div>
                    <button type="button" disabled={confirming || !allItemsHaveSlot || !canConfirmOnline} onClick={confirmBooking} className="mt-5 w-full rounded-2xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>{confirming ? "Confirmando…" : "Confirmar turno"}</button>
                    <p className="mt-2 text-center text-xs" style={{ color: "var(--brand-text-secondary)" }}>No se procesan pagos ni checkout en esta etapa.</p>
                  </Panel>
                )}
              </section>

              <aside className="lg:sticky lg:top-4 lg:self-start">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--brand-text)" }}>Resumen</h3>
                  <div className="mt-3 space-y-3 text-sm"><Summary label="Sucursal" value={selectedSucursal ? branchName(selectedSucursal) : "—"} /><Summary label="Servicios" value={items.length || "—"} />{items.map((item) => <div key={item.uid} className="rounded-2xl bg-white px-3 py-2"><p className="truncate text-xs font-bold" style={{ color: "var(--brand-text)" }}>{item.serviceName}</p><p className="text-[11px]" style={{ color: "var(--brand-text-secondary)" }}>{item.professionalName}{item.slot ? ` · ${formatTime(item.slot.horaInicio)}` : ""}</p></div>)}<Summary label="Total estimado" value={total ? money(total) : "—"} strong /></div>
                  <p className="mt-4 rounded-2xl bg-white px-3 py-3 text-xs" style={{ color: "var(--brand-text-secondary)" }}>Automático asigna profesional elegible priorizando menor carga del día y rotación por empate.</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"><h3 className="text-xl font-extrabold" style={{ color: "var(--brand-text)" }}>{title}</h3><p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>{subtitle}</p><div className="mt-4">{children}</div></div>;
}

function Select({ label, value, onChange, options, placeholder, disabled }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm disabled:opacity-60" style={{ color: "var(--brand-text)" }}>{placeholder && <option value="">{placeholder}</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function FooterActions({ backLabel, nextLabel, nextDisabled, onBack, onNext }) {
  return <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">{onBack ? <button type="button" onClick={onBack} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold" style={{ color: "var(--brand-text)" }}>{backLabel}</button> : <span />}{onNext && <button type="button" disabled={nextDisabled} onClick={onNext} className="rounded-2xl px-5 py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>{nextLabel}</button>}</div>;
}

function EmptyText({ children }) {
  return <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>{children}</div>;
}

function Summary({ label, value, strong = false }) {
  return <div><span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>{label}</span><p className={strong ? "text-2xl font-extrabold" : "font-semibold"} style={{ color: strong ? "var(--brand-primary)" : "var(--brand-text)" }}>{value}</p></div>;
}
