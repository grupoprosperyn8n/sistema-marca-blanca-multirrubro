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

export default function Agenda() {
  const { access } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const showClient = canViewField(access, "CITAS", ["CLIENTE", "NOMBRE_CLIENTE", "CLIENTE_NOMBRE"]);
  const showService = canViewField(access, "CITAS", ["SERVICIO", "NOMBRE_SERVICIO"]);
  const visibleExportColumns = filterColumnsByAccess(exportColumns, access, "CITAS");

  useEffect(() => {
    fetch(`${API}/api/citas`)
      .then(r => r.json())
      .then(d => {
        const citas = Array.isArray(d) ? d : d.citas || [];
        setCitas(citas);
        setAppointments(citas.map((c, i) => ({
          id: c.id || i,
          day: c.FECHA_CITA ? new Date(c.FECHA_CITA).getDay() : 1,
          hour: c.HORA_INICIO || "09:00",
          clientName: showClient ? (c.NOMBRE_CLIENTE || "") : "Reservado",
          servicio: showService ? (c.NOMBRE_SERVICIO || "") : "",
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [showClient, showService]);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando agenda...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
