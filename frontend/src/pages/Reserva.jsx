import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isPublicBranch, formatPublicName } from "../utils/publicDataFilters";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";
import SectionHeader from "../components/ui/SectionHeader";

const API = import.meta.env.VITE_API_BASE_URL || "";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDateLabel(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

function formatShortDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

function getLinkedIds(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTime(raw) {
  return String(raw || "").slice(0, 5);
}

function getServiceDuration(servicio) {
  const raw = servicio?.DURACION_MINUTOS_WEB ?? servicio?.DURACION_MINUTOS ?? servicio?.duracion_minutos;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeAvailableSlots(slotsRaw, sucursal, servicio) {
  const selectedSucursalId = sucursal?.id;
  const minDuration = getServiceDuration(servicio);
  const today = todayISO();
  const byVisibleSlot = new Map();

  slotsRaw
    .filter((slot) => {
      const estado = String(slot.ESTADO_SLOT || "").toUpperCase();
      const capacidad = Number(slot.CAPACIDAD_DISPONIBLE || 0);
      const fecha = String(slot.FECHA_SLOT || "");
      const sucursales = getLinkedIds(slot.SUCURSAL);
      const duracion = Number(slot.DURACION_MINUTOS || 0);

      if (estado !== "DISPONIBLE") return false;
      if (capacidad <= 0) return false;
      if (slot.PERMITE_RESERVA_WEB === false || slot.ACTIVO === false) return false;
      if (!fecha || fecha < today) return false;
      if (selectedSucursalId && !sucursales.includes(selectedSucursalId)) return false;
      if (minDuration && duracion && duracion < minDuration) return false;
      return true;
    })
    .forEach((slot) => {
      const fecha = String(slot.FECHA_SLOT || "");
      const horaInicio = normalizeTime(slot.HORA_INICIO);
      const horaFin = normalizeTime(slot.HORA_FIN);
      const profesionalId = slot.PROFESIONAL_ID || getLinkedIds(slot.PROFESIONAL).join(",");
      const key = `${fecha}|${horaInicio}|${horaFin}|${selectedSucursalId || getLinkedIds(slot.SUCURSAL).join(",")}|${profesionalId}`;
      const capacidad = Number(slot.CAPACIDAD_DISPONIBLE || 0);
      const existing = byVisibleSlot.get(key);
      if (existing) {
        existing.capacidad += capacidad;
        existing.slotIds.push(slot.id);
        return;
      }
      byVisibleSlot.set(key, {
        id: slot.id,
        slotIds: [slot.id],
        fecha,
        fechaLabel: formatDateLabel(fecha),
        fechaCorta: formatShortDate(fecha),
        horaInicio,
        horaFin,
        capacidad,
        duracion: slot.DURACION_MINUTOS,
        profesionalId,
        profesionalNombre: slot.NOMBRE_PROFESIONAL || "",
        label: `${horaInicio} — ${horaFin}`,
      });
    });

  return Array.from(byVisibleSlot.values()).sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));
}

export default function Reserva() {
  const { config } = useBrandConfig();
  const [step, setStep] = useState(1);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [servicioSel, setServicioSel] = useState(null);
  const [sucursalSel, setSucursalSel] = useState(null);
  const [horarioSel, setHorarioSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [srvRes, sucRes] = await Promise.all([
          fetch(`${API}/api/servicios-web`, { cache: "no-store" }),
          fetch(`${API}/api/sucursales`),
        ]);
        const srvData = await srvRes.json();
        const sucData = await sucRes.json();

        const srvRaw = Array.isArray(srvData) ? srvData : srvData.servicios_web || [];
        setServicios(srvRaw.filter(s => {
          const nombre = (s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "").trim();
          return nombre && nombre.toUpperCase() !== "SERVICIO" && s.RESERVA_ONLINE_HABILITADA !== false;
        }));

        const sucRaw = Array.isArray(sucData) ? sucData : sucData.sucursales || [];
        setSucursales(sucRaw.filter(isPublicBranch));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const cargarHorarios = async (sucursal, servicio = servicioSel) => {
    try {
      const params = new URLSearchParams({
        disponible: "true",
        future_only: "true",
      });
      if (sucursal?.id) params.set("sucursal_id", sucursal.id);
      const duracion = getServiceDuration(servicio);
      if (duracion) params.set("min_duration", String(duracion));

      const res = await fetch(`${API}/api/agenda-slots?${params.toString()}`);
      const data = await res.json();
      const slotsRaw = Array.isArray(data) ? data : data.agenda_slots || [];
      const slots = normalizeAvailableSlots(slotsRaw, sucursal, servicio);
      setHorarios(slots);
    } catch {
      setHorarios([]);
    }
  };

  const handleSucursalSelect = (suc) => {
    setSucursalSel(suc);
    setHorarioSel(null);
    cargarHorarios(suc, servicioSel);
  };

  const formatearMoneda = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  };

  const horariosPorFecha = horarios.reduce((acc, horario) => {
    const key = horario.fecha || "sin_fecha";
    if (!acc[key]) acc[key] = [];
    acc[key].push(horario);
    return acc;
  }, {});
  const whatsappUrl = config.whatsapp
    ? `https://wa.me/${String(config.whatsapp).replace(/\D/g, "")}`
    : null;

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
      <p className="mt-4" style={{ color: 'var(--brand-text)' }}>Cargando reserva…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <GlassCard className="inline-block px-8 py-6">
        <p className="text-rose-500">Error al cargar: {error}</p>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
      <SectionHeader title={config.reservaTitle || "Reservá tu Turno"} subtitle={config.reservaSubtitle || "Seleccioná servicio, sucursal y horario"} />

      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* Stepper principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 sm:gap-3 mb-8 overflow-x-auto pb-2">
            {["Servicio", "Sucursal", "Horario", "Datos"].map((label, i) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-[background-color,color,box-shadow] ${
                    step > i + 1 ? 'text-white' : step === i + 1 ? 'text-white shadow-lg' : 'text-gray-400 bg-gray-100'
                  }`}
                  style={step >= i + 1 ? { background: step === i + 1 ? 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' : 'var(--brand-primary)' } : {}}
                >
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= i + 1 ? '' : 'text-gray-400'}`} style={step >= i + 1 ? { color: 'var(--brand-text)' } : {}}>
                  {label}
                </span>
                {i < 3 && <div className={`w-4 sm:w-8 h-px ${step > i + 1 ? '' : 'bg-gray-200'}`} style={step > i + 1 ? { background: 'var(--brand-secondary)' } : {}} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Servicio */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>1. ¿Qué servicio querés reservar?</h3>
              {servicios.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="opacity-50">No hay servicios disponibles para reserva online en este momento.</p>
                </GlassCard>
              ) : (
                <div className="grid gap-3">
                  {servicios.map((s, i) => {
                    const nombre = formatPublicName(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "");
                    const precio = s.PRECIO_WEB ?? s.PRECIO_PUBLICITADO_WEB;
                    const duracion = s.DURACION_MINUTOS_WEB ?? s.DURACION_MINUTOS;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setServicioSel(s);
                          setSucursalSel(null);
                          setHorarioSel(null);
                          setHorarios([]);
                          setStep(2);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-[background-color,border-color,box-shadow,transform] duration-300 border ${
                          servicioSel === s ? 'border-primary shadow-md' : 'border-white/40 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        style={{
                          background: servicioSel === s ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.5)',
                          backdropFilter: 'blur(12px)',
                          borderColor: servicioSel === s ? 'var(--brand-primary)' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-base" style={{ color: 'var(--brand-text)' }}>{nombre}</p>
                            {duracion && <p className="text-sm opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>{duracion} min</p>}
                          </div>
                          <div className="text-right">
                            {precio && <p className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>{formatearMoneda(precio)}</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Sucursal */}
          {step === 2 && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                ← Volver
              </button>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>2. ¿Dónde querés el turno?</h3>
              {sucursales.length === 0 ? (
                <GlassCard className="p-8 text-center space-y-4">
                  <span className="text-4xl block mb-3">📍</span>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
                      No hay sucursales publicadas para reserva online
                    </h3>
                    <p className="text-sm opacity-60" style={{ color: 'var(--brand-text-secondary)' }}>
                      No mostramos sedes ficticias ni no publicadas. Configurá una sucursal real como visible
                      para habilitar este paso.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      to="/catalogo"
                      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))", color: "#fff" }}
                    >
                      Ver Catálogo
                    </Link>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/70"
                        style={{ borderColor: "rgba(0,0,0,0.12)", color: "var(--brand-text)" }}
                      >
                        Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </GlassCard>
              ) : (
                <div className="grid gap-3">
                  {sucursales.map((suc, i) => {
                    const nombre = formatPublicName(suc.NOMBRE_SUCURSAL || suc.NOMBRE_CORTO_SUCURSAL || "");
                    const dir = suc.DIRECCION_SUCURSAL || suc["CALLE Y N°"] || "";
                    const ciudad = suc.CIUDAD_SUCURSAL || suc.LOCALIDAD || "";
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => { handleSucursalSelect(suc); setStep(3); }}
                        className={`w-full text-left p-4 rounded-xl transition-[background-color,border-color,box-shadow,transform] duration-300 border ${
                          sucursalSel === suc ? 'border-primary shadow-md' : 'border-white/40 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        style={{
                          background: sucursalSel === suc ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.5)',
                          backdropFilter: 'blur(12px)',
                          borderColor: sucursalSel === suc ? 'var(--brand-primary)' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <p className="font-semibold" style={{ color: 'var(--brand-text)' }}>{nombre}</p>
                        {(dir || ciudad) && <p className="text-sm opacity-50 mt-1" style={{ color: 'var(--brand-text-secondary)' }}>{[dir, ciudad].filter(Boolean).join(' — ')}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Horario */}
          {step === 3 && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(2)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                ← Volver
              </button>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>3. Elegí el horario</h3>
              {horarios.length === 0 ? (
                <GlassCard className="p-8 text-center space-y-4">
                  <span className="text-5xl block">📅</span>
                  <div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
                      Sin horarios confirmados para esta sucursal
                    </h4>
                    <p className="text-sm opacity-50 mb-3" style={{ color: 'var(--brand-text-secondary)' }}>
                      Próximamente publicaremos nuevos horarios. Mientras tanto, consultá disponibilidad
                      por WhatsApp o acercate a la sucursal.
                    </p>
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium underline"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">support_agent</span>
                        Consultar disponibilidad
                      </a>
                    ) : (
                      <Link
                        to="/catalogo"
                        className="inline-flex items-center gap-1 text-sm font-medium underline"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">category</span>
                        Volver al catálogo
                      </Link>
                    )}
                  </div>
                </GlassCard>
              ) : (
                <div className="space-y-5">
                  {Object.entries(horariosPorFecha).map(([fecha, items]) => (
                    <div key={fecha} className="rounded-2xl border border-white/40 bg-white/40 p-4">
                      <h4 className="mb-3 text-sm font-semibold capitalize" style={{ color: 'var(--brand-text)' }}>
                        {items[0]?.fechaLabel || fecha}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {items.map((h) => (
                          <button
                            type="button"
                            key={`${h.fecha}-${h.horaInicio}-${h.horaFin}-${h.id}`}
                            onClick={() => { setHorarioSel(h); setStep(4); }}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] ${
                              horarioSel?.id === h.id ? 'text-white shadow-md' : 'hover:bg-white/80 border border-gray-200'
                            }`}
                            style={horarioSel?.id === h.id ? { background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' } : { background: 'rgba(255,255,255,0.5)' }}
                          >
                            <span className="block">{h.label}</span>
                            {h.profesionalNombre && <span className="block truncate text-[11px] opacity-80">{h.profesionalNombre}</span>}
                            <span className="block text-[11px] opacity-70">{h.capacidad} cupo{h.capacidad === 1 ? "" : "s"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Datos */}
          {step === 4 && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(3)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                ← Volver
              </button>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>4. Tus datos</h3>
              <GlassCard className="p-6 space-y-4">
                <div>
                  <label htmlFor="reserva-nombre" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Nombre</label>
                  <input
                    id="reserva-nombre"
                    name="nombre"
                    type="text"
                    autoComplete="name"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur focus-visible:ring-2 focus-visible:ring-sky-500"
                    placeholder="Ej. Ana Pérez…"
                  />
                </div>
                <div>
                  <label htmlFor="reserva-telefono" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Teléfono</label>
                  <input
                    id="reserva-telefono"
                    name="telefono"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur focus-visible:ring-2 focus-visible:ring-sky-500"
                    placeholder="Ej. +54 11 1234-5678…"
                  />
                </div>
                <div>
                  <label htmlFor="reserva-notas" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Notas (opcional)</label>
                  <textarea
                    id="reserva-notas"
                    name="notas"
                    autoComplete="off"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur resize-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    placeholder="Ej. Preferencia de horario…"
                    rows={2}
                  />
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        <div className="space-y-4">
          <GlassCard className="p-5 sticky top-8">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
                <span className="material-symbols-outlined text-lg" aria-hidden="true">receipt_long</span>
              Resumen
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>Servicio</span>
                <p className="font-medium" style={{ color: 'var(--brand-text)' }}>
                  {servicioSel ? formatPublicName(servicioSel.NOMBRE_PUBLICO_SERVICIO || servicioSel.NOMBRE_SERVICIO || "") : '—'}
                </p>
              </div>
              <div>
                <span className="opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>Sucursal</span>
                <p className="font-medium" style={{ color: 'var(--brand-text)' }}>
                  {sucursalSel ? formatPublicName(sucursalSel.NOMBRE_SUCURSAL || sucursalSel.NOMBRE_CORTO_SUCURSAL || "") : '—'}
                </p>
              </div>
              <div>
                <span className="opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>Horario</span>
                <p className="font-medium" style={{ color: 'var(--brand-text)' }}>
                  {horarioSel ? `${horarioSel.fechaCorta || ""} · ${horarioSel.label || horarioSel.horaInicio}` : '—'}
                </p>
                {horarioSel?.profesionalNombre && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                    Profesional: {horarioSel.profesionalNombre}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <span className="opacity-50 text-xs" style={{ color: 'var(--brand-text-secondary)' }}>Total estimado</span>
                <p className="font-bold text-xl" style={{ color: 'var(--brand-primary)' }}>
                  {servicioSel ? formatearMoneda(servicioSel.PRECIO_WEB ?? servicioSel.PRECIO_PUBLICITADO_WEB) || 'Consultar' : '—'}
                </p>
              </div>
            </div>

            {step === 4 && nombre && telefono && (
              <div className="mt-6">
                <Link
                  to="/login"
                  className="block w-full text-center px-6 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                >
                  Ingresá para confirmar tu turno
                </Link>
                <p className="text-xs text-center mt-2 opacity-50" style={{ color: "var(--brand-text)" }}>
                  Necesitás crear una cuenta para confirmar la reserva
                </p>
              </div>
            )}
          </GlassCard>

          {/* Demo banner sutil */}
          <div className="text-center text-xs opacity-30" style={{ color: 'var(--brand-text)' }}>
            Para confirmar tu turno necesitás ingresar o registrarte
          </div>
        </div>
      </div>
    </div>
  );
}
