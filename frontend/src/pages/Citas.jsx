import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import { filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Cliente", field: "NOMBRE_CLIENTE", fields: ["NOMBRE_CLIENTE", "CLIENTE", "CLIENTE_NOMBRE"], render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_CLIENTE || row.CLIENTE_NOMBRE || "—"}</span>
  )},
  { header: "Servicio", field: "NOMBRE_SERVICIO", fields: ["NOMBRE_SERVICIO", "SERVICIO"] },
  { header: "Fecha", field: "FECHA_CITA", fields: ["FECHA_CITA"] },
  { header: "Hora", field: "HORA_CITA", fields: ["HORA_CITA"] },
  { header: "Estado", field: "ESTADO_CITA", fields: ["ESTADO_CITA"], render: (row) => {
    const variants = { CONFIRMADA: 'success', PENDIENTE: 'warning', CANCELADA: 'error' };
    return <Badge variant={variants[row.ESTADO_CITA] || 'neutral'}>{row.ESTADO_CITA || "—"}</Badge>;
  }},
];

export default function Citas() {
  const { access } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const columns = filterColumnsByAccess(allColumns, access, "CITAS");

  useEffect(() => {
    fetch(`${API}/api/citas`)
      .then(r => r.json())
      .then(d => { setCitas(Array.isArray(d) ? d : d.citas || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando citas...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Citas</h2>
        <ModuleActionBar
          moduleKey="citas"
          count={citas.length}
          rows={citas}
          columns={columns}
          filename="citas.csv"
        />
      </div>
      <DataTable columns={columns} data={citas} />
    </div>
  );
}
