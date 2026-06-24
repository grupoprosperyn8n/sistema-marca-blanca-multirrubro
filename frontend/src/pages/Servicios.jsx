import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";

const API = import.meta.env.VITE_API_BASE_URL || "";

const columns = [
  { header: "Nombre", field: "NOMBRE_SERVICIO", render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_SERVICIO || row.nombre || "—"}</span>
  )},
  { header: "Categoria", field: "NOMBRE_CATEGORIA" },
  { header: "Precio", field: "PRECIO_BASE", render: (row) => (
    <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>${row.PRECIO_BASE ?? "—"}</span>
  )},
  { header: "Duracion", field: "DURACION_MINUTOS", render: (row) => row.DURACION_MINUTOS ? `${row.DURACION_MINUTOS} min` : "—" },
  { header: "Estado", field: "ESTADO_SERVICIO", render: (row) => (
    <Badge variant={row.ESTADO_SERVICIO === 'ACTIVO' ? 'success' : 'neutral'}>
      {row.ESTADO_SERVICIO || "—"}
    </Badge>
  )},
];

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/servicios`)
      .then(r => r.json())
      .then(d => { setServicios(Array.isArray(d) ? d : d.servicios || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando servicios...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Servicios</h2>
        <Badge>{servicios.length} registros</Badge>
      </div>
      <DataTable columns={columns} data={servicios} />
    </div>
  );
}
