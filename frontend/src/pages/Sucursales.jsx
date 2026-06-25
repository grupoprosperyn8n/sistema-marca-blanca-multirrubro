import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import { filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Nombre", field: "NOMBRE_SUCURSAL", fields: ["NOMBRE_SUCURSAL"], render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_SUCURSAL || row.nombre || "—"}</span>
  )},
  { header: "Direccion", field: "DIRECCION", fields: ["DIRECCION"] },
  { header: "Telefono", field: "TELEFONO_SUCURSAL", fields: ["TELEFONO_SUCURSAL"], render: (row) => row.TELEFONO_SUCURSAL || row.telefono || "—" },
  { header: "Estado", field: "ACTIVA", fields: ["ACTIVA"], render: (row) => (
    <Badge variant={row.ACTIVA !== false ? 'success' : 'error'}>
      {row.ACTIVA !== false ? 'Activa' : 'Inactiva'}
    </Badge>
  )},
];

export default function Sucursales() {
  const { access } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const columns = filterColumnsByAccess(allColumns, access, "SUCURSALES");

  useEffect(() => {
    fetch(`${API}/api/sucursales`)
      .then(r => r.json())
      .then(d => { setSucursales(Array.isArray(d) ? d : d.sucursales || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando sucursales...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Sucursales</h2>
        <ModuleActionBar
          moduleKey="sucursales"
          count={sucursales.length}
          rows={sucursales}
          columns={columns}
          filename="sucursales.csv"
        />
      </div>
      <DataTable columns={columns} data={sucursales} />
    </div>
  );
}
