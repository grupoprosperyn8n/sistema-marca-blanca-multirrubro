import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import { filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Nombre", field: "NOMBRE_SERVICIO", fields: ["NOMBRE_SERVICIO"], render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_SERVICIO || row.nombre || "—"}</span>
  )},
  { header: "Categoria", field: "NOMBRE_CATEGORIA", fields: ["NOMBRE_CATEGORIA"] },
  { header: "Precio", field: "PRECIO_BASE", fields: ["PRECIO_BASE"], render: (row) => (
    <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>${row.PRECIO_BASE ?? "—"}</span>
  )},
  { header: "Duracion", field: "DURACION_MINUTOS", fields: ["DURACION_MINUTOS"], render: (row) => row.DURACION_MINUTOS ? `${row.DURACION_MINUTOS} min` : "—" },
  { header: "Estado", field: "ESTADO_SERVICIO", fields: ["ESTADO_SERVICIO"], render: (row) => (
    <Badge variant={row.ESTADO_SERVICIO === 'ACTIVO' ? 'success' : 'neutral'}>
      {row.ESTADO_SERVICIO || "—"}
    </Badge>
  )},
];

export default function Servicios() {
  const { access } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const columns = filterColumnsByAccess(allColumns, access, "SERVICIOS");

  useEffect(() => {
    fetch(`${API}/api/servicios`)
      .then(r => r.json())
      .then(d => { setServicios(Array.isArray(d) ? d : d.servicios || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando servicios...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Servicios</h2>
        <ModuleActionBar
          moduleKey="servicios"
          count={servicios.length}
          rows={servicios}
          columns={columns}
          filename="servicios.csv"
        />
      </div>
      <DataTable columns={columns} data={servicios} />
    </div>
  );
}
