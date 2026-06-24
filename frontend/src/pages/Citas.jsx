import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

const columns = [
  { header: "Cliente", field: "NOMBRE_CLIENTE", render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_CLIENTE || row.CLIENTE_NOMBRE || "—"}</span>
  )},
  { header: "Servicio", field: "NOMBRE_SERVICIO" },
  { header: "Fecha", field: "FECHA_CITA" },
  { header: "Hora", field: "HORA_CITA" },
  { header: "Estado", field: "ESTADO_CITA", render: (row) => {
    const variants = { CONFIRMADA: 'success', PENDIENTE: 'warning', CANCELADA: 'error' };
    return <Badge variant={variants[row.ESTADO_CITA] || 'neutral'}>{row.ESTADO_CITA || "—"}</Badge>;
  }},
];

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/citas`)
      .then(r => r.json())
      .then(d => { setCitas(Array.isArray(d) ? d : d.citas || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando citas...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Citas</h2>
        <Badge>{citas.length} registros</Badge>
      </div>
      <DataTable columns={columns} data={citas} />
    </div>
  );
}
