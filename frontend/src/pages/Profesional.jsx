import { useState, useEffect } from "react";
import GlassCard from "../components/ui/GlassCard";
import AppointmentGrid from "../components/ui/AppointmentGrid";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Profesional() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/citas`)
      .then(r => r.json())
      .then(d => {
        const data = Array.isArray(d) ? d : d.citas || [];
        setCitas(data.map((c, i) => ({
          id: c.id || i,
          day: c.FECHA_CITA ? new Date(c.FECHA_CITA).getDay() : 1,
          hour: c.HORA_CITA || "09:00",
          clientName: c.NOMBRE_CLIENTE || c.CLIENTE_NOMBRE || "",
          servicio: c.NOMBRE_SERVICIO || c.SERVICIO || "",
        })).slice(0, 12));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-16">
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
        style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
      <p className="opacity-50" style={{ color: 'var(--brand-text)' }}>Cargando agenda profesional...</p>
    </div>
  );

  const hoy = citas.filter(c => c.day === 1);
  const semana = citas;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
          Mi Agenda
        </h1>
        <div className="flex gap-2">
          <Badge variant="info">Demo read-only</Badge>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--brand-primary)' }}>
            P
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>
            Agenda semanal
          </h3>
          <AppointmentGrid
            appointments={semana}
            days={['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']}
          />
        </div>

        <div className="space-y-4">
          <GlassCard>
            <h4 className="font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>
              Citas de hoy
            </h4>
            {hoy.length > 0 ? hoy.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{c.clientName || 'Cliente'}</p>
                  <p className="text-xs opacity-50" style={{ color: 'var(--brand-text)' }}>{c.servicio}</p>
                </div>
                <Badge variant="success">{c.hour}</Badge>
              </div>
            )) : (
              <p className="text-sm opacity-50 text-center py-4" style={{ color: 'var(--brand-text)' }}>
                Sin citas para hoy
              </p>
            )}
          </GlassCard>

          <GlassCard>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Resumen</h4>
            <div className="flex justify-between text-sm">
              <span className="opacity-50" style={{ color: 'var(--brand-text)' }}>Total citas</span>
              <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>{citas.length}</span>
            </div>
          </GlassCard>

          <div className="glass-panel px-4 py-3 text-xs opacity-50 text-center" style={{ color: 'var(--brand-text)' }}>
            Portal profesional demo — funcionalidad completa en fase posterior.
          </div>
        </div>
      </div>
    </div>
  );
}
