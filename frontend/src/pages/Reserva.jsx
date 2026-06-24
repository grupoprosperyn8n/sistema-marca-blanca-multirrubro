import { useState, useEffect } from "react";
import { isPublicBranch, formatPublicName } from "../utils/publicDataFilters";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";
import SectionHeader from "../components/ui/SectionHeader";

const API = import.meta.env.VITE_API_BASE_URL || "";

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
          fetch(`${API}/api/servicios-web`),
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

  const cargarHorarios = async (sucursal) => {
    try {
      const res = await fetch(`${API}/api/agenda-slots`);
      const data = await res.json();
      const slotsRaw = Array.isArray(data) ? data : data.agenda_slots || [];
      // Filtrar solo slots DISPONIBLE, mapear a formato usable
      const slots = slotsRaw
        .filter(s => s.ESTADO_SLOT === "DISPONIBLE" && s.CAPACIDAD_DISPONIBLE > 0)
        .map(s => {
          const fecha = s.FECHA_SLOT ? new Date(s.FECHA_SLOT).toLocaleDateString("es-AR", { weekday: 'short', day: 'numeric', month: 'short' }) : '';
          const tieneSucursal = Array.isArray(s.SUCURSAL) && s.SUCURSAL.length > 0;
          const horaInfo = `${s.HORA_INICIO || ""} — ${s.HORA_FIN || ""}`;
          return {
            id: s.id,
            fecha: s.FECHA_SLOT,
            horaInicio: s.HORA_INICIO,
            horaFin: s.HORA_FIN,
            capacidad: s.CAPACIDAD_DISPONIBLE,
            tieneSucursal,
            label: `${horaInfo}${fecha ? ' · ' + fecha : ''} (${s.CAPACIDAD_DISPONIBLE || 0} cupos)${!tieneSucursal ? ' · A confirmar' : ''}`,
          };
        });
      setHorarios(slots);
    } catch {
      setHorarios([]);
    }
  };

  const handleSucursalSelect = (suc) => {
    setSucursalSel(suc);
    setHorarioSel(null);
    cargarHorarios(suc);
  };

  const formatearMoneda = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
      <p className="mt-4" style={{ color: 'var(--brand-text)' }}>Cargando...</p>
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
          <div className="flex items-center gap-3 mb-8">
            {["Servicio", "Sucursal", "Horario", "Datos"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > i + 1 ? 'text-white' : step === i + 1 ? 'text-white shadow-lg' : 'text-gray-400 bg-gray-100'
                  }`}
                  style={step >= i + 1 ? { background: step === i + 1 ? 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' : 'var(--brand-primary)' } : {}}
                >
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= i + 1 ? '' : 'text-gray-400'}`} style={step >= i + 1 ? { color: 'var(--brand-text)' } : {}}>
                  {label}
                </span>
                {i < 3 && <div className={`w-8 h-px ${step > i + 1 ? '' : 'bg-gray-200'}`} style={step > i + 1 ? { background: 'var(--brand-secondary)' } : {}} />}
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
                        key={i}
                        onClick={() => { setServicioSel(s); setStep(2); }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${
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
              <button onClick={() => setStep(1)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                ← Volver
              </button>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>2. ¿Dónde querés el turno?</h3>
              {sucursales.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <span className="text-4xl block mb-3">📍</span>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Próximamente</h3>
                  <p className="text-sm opacity-50">Publicaremos las sedes disponibles para reserva online.</p>
                </GlassCard>
              ) : (
                <div className="grid gap-3">
                  {sucursales.map((suc, i) => {
                    const nombre = formatPublicName(suc.NOMBRE_SUCURSAL || suc.NOMBRE_CORTO_SUCURSAL || "");
                    const dir = suc.DIRECCION_SUCURSAL || "";
                    const ciudad = suc.CIUDAD_SUCURSAL || "";
                    return (
                      <button
                        key={i}
                        onClick={() => { handleSucursalSelect(suc); setStep(3); }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${
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
              <button onClick={() => setStep(2)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
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
                    <a
                      href="/reserva"
                      className="inline-flex items-center gap-1 text-sm font-medium underline"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      Consultar disponibilidad
                    </a>
                  </div>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {horarios.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setHorarioSel(h); setStep(4); }}
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                        horarioSel === h ? 'text-white shadow-md' : 'hover:bg-white/80 border border-gray-200'
                      }`}
                      style={horarioSel === h ? { background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' } : { background: 'rgba(255,255,255,0.5)' }}
                    >
                      <span className="block">{h.horaInicio || h.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Datos */}
          {step === 4 && (
            <div className="space-y-4">
              <button onClick={() => setStep(3)} className="text-sm opacity-60 hover:opacity-100 mb-2 inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                ← Volver
              </button>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>4. Tus datos</h3>
              <GlassCard className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur"
                    placeholder="Tu nombre completo"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Teléfono</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur"
                    placeholder="+54 11 1234-5678"
                    style={{ outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 backdrop-blur resize-none"
                    placeholder="¿Algo que debamos saber?"
                    rows={2}
                    style={{ outline: 'none' }}
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
              <span className="material-symbols-outlined text-lg">receipt_long</span>
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
                  {horarioSel ? (horarioSel.label || horarioSel.horaInicio || 'Seleccionado') : '—'}
                </p>
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
                <a
                  href="/login"
                  className="block w-full text-center px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                >
                  Ingresá para confirmar tu turno
                </a>
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
