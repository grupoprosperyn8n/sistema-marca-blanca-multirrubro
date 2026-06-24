import { useState, useEffect } from "react";
import AppointmentGrid from "../components/ui/AppointmentGrid";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/citas`)
      .then(r => r.json())
      .then(d => {
        const citas = Array.isArray(d) ? d : d.citas || [];
        setAppointments(citas.map((c, i) => ({
          id: c.id || i,
          day: c.FECHA_CITA ? new Date(c.FECHA_CITA).getDay() : 1,
          hour: c.HORA_CITA || "09:00",
          clientName: c.NOMBRE_CLIENTE || c.CLIENTE_NOMBRE || "",
          servicio: c.NOMBRE_SERVICIO || c.SERVICIO || "",
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando agenda...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Agenda</h2>
        <Badge variant="info">{appointments.length} citas</Badge>
      </div>
      <AppointmentGrid
        appointments={appointments}
        days={['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']}
      />
      {appointments.length === 0 && (
        <GlassCard className="text-center py-8 mt-4">
          <p className="opacity-50" style={{ color: 'var(--brand-text)' }}>Sin citas registradas.</p>
        </GlassCard>
      )}
    </div>
  );
}
