import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isPublicBranch, formatPublicName } from "../utils/publicDataFilters";
import { ROLES, useAuth } from "../context/AuthContext";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import SectionHeader from "../components/ui/SectionHeader";

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

const steps = [
  { id: 1, label: "Sucursal" },
  { id: 2, label: "Servicios" },
  { id: 3, label: "Agenda" },
  { id: 4, label: "Confirmar" },
];

export default function Reserva() {
  const { config } = useBrandConfig();
  const { usuario, role } = useAuth();
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

  const selectedSucursal = useMemo(() => sucursales.find((branch) => branch.id === sucursalId), [sucursales, sucursalId]);
  const selectedService = useMemo(() => servicios.find((service) => service.id === serviceId), [servicios, serviceId]);
  const allItemsHaveSlot = items.length > 0 && items.every((item) => item.slot?.id);
  const selectedSlotIds = new Set(items.map((item) => item.slot?.id).filter(Boolean));
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const canConfirmOnline = usuario && role === ROLES.CLIENTE;

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
    if (!allItemsHaveSlot) return;
    setConfirming(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/api/clientes/citas/confirmar-multiple`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursal_id: sucursalId,
          items: items.map((item, index) => ({
            orden: index + 1,
            servicio_web_id: item.serviceId,
            slot_id: item.slot.id,
            profesional_id: item.professionalId,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.confirmado === false) throw new Error(data?.detail || data?.mensaje || `HTTP ${res.status}`);
      setMessage("Turno compuesto confirmado. Podés verlo desde tu portal.");
      setItems([]);
      setStep(1);
    } catch (err) {
      setMessage(err.message || "No se pudo confirmar el turno.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
        <p className="mt-4 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cargando reserva…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <GlassCard className="inline-block px-8 py-6">
          <p className="text-rose-600">No pudimos cargar reservas: {error}</p>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-10">
      <SectionHeader
        title={config.reservaTitle || "Reservá tu Turno"}
        subtitle="Elegí sucursal, agregá uno o varios servicios y seleccioná agenda por profesional."
      />

      <div className="mx-auto mt-5 flex max-w-3xl items-center justify-center gap-2 overflow-x-auto pb-2">
        {steps.map((item, index) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToStep(item.id)}
              className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:px-3 sm:text-sm"
              style={{
                color: active || done ? "#fff" : "var(--brand-text-secondary)",
                background: active || done ? "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" : "rgba(255,255,255,0.7)",
              }}
              aria-current={active ? "step" : undefined}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">{done ? "✓" : item.id}</span>
              {item.label}
              {index < steps.length - 1 && <span className="hidden text-white/60 sm:inline">→</span>}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mx-auto mt-4 max-w-3xl rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold" role="status" aria-live="polite" style={{ color: message.includes("confirmado") ? "#047857" : "#be123c" }}>
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {step === 1 && (
            <GlassCard className="p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold" style={{ color: "var(--brand-text)" }}>1. Elegí la sucursal</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Primero definimos dónde se va a atender el turno.</p>
              </div>
              <label htmlFor="reserva-sucursal" className="mb-2 block text-sm font-bold" style={{ color: "var(--brand-text)" }}>Sucursal</label>
              <select
                id="reserva-sucursal"
                name="sucursal_id"
                value={sucursalId}
                onChange={(event) => handleBranchChange(event.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                style={{ color: "var(--brand-text)" }}
              >
                <option value="">Seleccionar sucursal…</option>
                {sucursales.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branchName(branch)}</option>
                ))}
              </select>
              {sucursales.length === 0 && (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No hay sucursales públicas con reserva web habilitada.</p>
              )}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={!sucursalId}
                  onClick={() => goToStep(2)}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                >
                  Continuar a Servicios
                </button>
              </div>
            </GlassCard>
          )}

          {step === 2 && (
            <GlassCard className="p-4 sm:p-6">
              <button type="button" onClick={() => goToStep(1)} className="mb-4 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>← Cambiar sucursal</button>
              <div className="mb-4">
                <h2 className="text-xl font-extrabold" style={{ color: "var(--brand-text)" }}>2. Agregá servicios y profesional</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Podés sumar varios servicios. Si no sabés con quién atenderte, dejá “Automático”.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label htmlFor="reserva-servicio" className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Servicio</label>
                  <select
                    id="reserva-servicio"
                    name="servicio_web_id"
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    className="w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    style={{ color: "var(--brand-text)" }}
                  >
                    <option value="">Seleccionar servicio…</option>
                    {servicios.map((service) => (
                      <option key={service.id} value={service.id}>{serviceName(service)} · {money(servicePrice(service))}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reserva-profesional" className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Profesional</label>
                  <select
                    id="reserva-profesional"
                    name="profesional_id"
                    value={professionalId}
                    onChange={(event) => setProfessionalId(event.target.value)}
                    disabled={!serviceId || professionalsLoading}
                    className="w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
                    style={{ color: "var(--brand-text)" }}
                  >
                    <option value={AUTO_PROFESSIONAL}>{professionalsLoading ? "Buscando…" : "Automático: menor carga del día"}</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>{professional.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={addServiceItem} className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                    Agregar
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-2xl bg-white/65 px-4 py-5 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>Todavía no agregaste servicios al turno.</div>
                ) : items.map((item, index) => (
                  <div key={item.uid} className="flex items-start justify-between gap-3 rounded-2xl bg-white/75 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{index + 1}. {item.serviceName}</p>
                      <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{item.professionalName} · {item.duration ? `${item.duration} min · ` : ""}{money(item.price)}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.uid)} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Quitar</button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => goToStep(1)} className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 text-sm font-bold" style={{ color: "var(--brand-text)" }}>Volver</button>
                <button type="button" disabled={items.length === 0} onClick={() => goToStep(3)} className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>Elegir Agenda</button>
              </div>
            </GlassCard>
          )}

          {step === 3 && (
            <GlassCard className="p-4 sm:p-6">
              <button type="button" onClick={() => goToStep(2)} className="mb-4 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>← Modificar servicios</button>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold" style={{ color: "var(--brand-text)" }}>3. Elegí agenda por servicio</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Cada servicio puede tener un profesional y horario propio.</p>
                </div>
                <div>
                  <label htmlFor="reserva-fecha" className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Fecha</label>
                  <input
                    id="reserva-fecha"
                    name="fecha"
                    type="date"
                    value={fecha}
                    min={todayISO()}
                    onChange={(event) => setFecha(event.target.value)}
                    className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    style={{ color: "var(--brand-text)" }}
                  />
                </div>
              </div>

              {agendaLoading ? (
                <div className="rounded-2xl bg-white/70 p-8 text-center text-sm" style={{ color: "var(--brand-text-secondary)" }}>Buscando agenda…</div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const options = slotOptions[item.uid]?.slots || [];
                    return (
                      <article key={item.uid} className="rounded-3xl border border-white/60 bg-white/70 p-3 sm:p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{item.serviceName}</h3>
                            <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>Profesional: {item.professionalName}</p>
                          </div>
                          {slotOptions[item.uid]?.recommended_professional && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                              Sugerido: {slotOptions[item.uid].recommended_professional.nombre}
                            </span>
                          )}
                        </div>
                        {options.length === 0 ? (
                          <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                            Sin horarios publicados para {formatDate(fecha)}. La agenda necesita slots activos para esta sucursal/profesional.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {options.map((slot) => {
                              const usedByOther = selectedSlotIds.has(slot.id) && item.slot?.id !== slot.id;
                              const active = item.slot?.id === slot.id;
                              return (
                                <button
                                  key={`${item.uid}-${slot.id}`}
                                  type="button"
                                  disabled={usedByOther}
                                  onClick={() => selectSlot(item.uid, slot)}
                                  className="min-h-[76px] rounded-2xl border px-2 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  style={{
                                    borderColor: active ? "var(--brand-primary)" : "rgba(255,255,255,0.8)",
                                    background: active ? "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" : "rgba(255,255,255,0.8)",
                                    color: active ? "#fff" : "var(--brand-text)",
                                  }}
                                >
                                  <span className="block text-sm font-extrabold">{formatTime(slot.horaInicio)}–{formatTime(slot.horaFin)}</span>
                                  <span className="mt-1 block truncate opacity-90">{slot.profesionalNombre}</span>
                                  <span className="mt-1 block opacity-70">Carga día: {slot.cargaDiaProfesional}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => goToStep(2)} className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 text-sm font-bold" style={{ color: "var(--brand-text)" }}>Volver</button>
                <button type="button" disabled={!allItemsHaveSlot} onClick={() => goToStep(4)} className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>Revisar Turno</button>
              </div>
            </GlassCard>
          )}

          {step === 4 && (
            <GlassCard className="p-4 sm:p-6">
              <button type="button" onClick={() => goToStep(3)} className="mb-4 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>← Modificar agenda</button>
              <h2 className="text-xl font-extrabold" style={{ color: "var(--brand-text)" }}>4. Confirmá el turno</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--brand-text-secondary)" }}>Revisá servicios, profesionales y horarios antes de confirmar.</p>
              <div className="mt-5 space-y-2">
                {items.map((item, index) => (
                  <div key={item.uid} className="rounded-2xl bg-white/75 px-4 py-3">
                    <p className="text-sm font-extrabold" style={{ color: "var(--brand-text)" }}>{index + 1}. {item.serviceName}</p>
                    <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{formatDate(fecha)} · {formatTime(item.slot?.horaInicio)}–{formatTime(item.slot?.horaFin)} · {item.professionalName}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                {canConfirmOnline ? (
                  <button
                    type="button"
                    disabled={confirming || !allItemsHaveSlot}
                    onClick={confirmBooking}
                    className="w-full rounded-2xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                  >
                    {confirming ? "Confirmando…" : "Confirmar turno"}
                  </button>
                ) : (
                  <Link to="/login" className="block w-full rounded-2xl px-6 py-3 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                    Ingresar para confirmar
                  </Link>
                )}
                <p className="mt-2 text-center text-xs" style={{ color: "var(--brand-text-secondary)" }}>
                  No se procesan pagos ni checkout en esta etapa.
                </p>
              </div>
            </GlassCard>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <GlassCard className="p-4 sm:p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--brand-text)" }}>
              <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
              Resumen
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Sucursal</span>
                <p className="font-semibold" style={{ color: "var(--brand-text)" }}>{selectedSucursal ? branchName(selectedSucursal) : "—"}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Servicios</span>
                <p className="font-semibold" style={{ color: "var(--brand-text)" }}>{items.length || "—"}</p>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.uid} className="rounded-2xl bg-white/60 px-3 py-2">
                      <p className="truncate text-xs font-bold" style={{ color: "var(--brand-text)" }}>{item.serviceName}</p>
                      <p className="text-[11px]" style={{ color: "var(--brand-text-secondary)" }}>{item.professionalName}{item.slot ? ` · ${formatTime(item.slot.horaInicio)}` : ""}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-white/60 pt-3">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Total estimado</span>
                <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--brand-primary)" }}>{total ? money(total) : "—"}</p>
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-white/55 px-3 py-3 text-xs leading-relaxed" style={{ color: "var(--brand-text-secondary)" }}>
              Automático asigna profesional elegible por sucursal/servicio, priorizando menor cantidad de turnos del día y rotación por empate.
            </p>
          </GlassCard>
        </aside>
      </div>
    </main>
  );
}
