import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import { filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Nombre", field: "NOMBRE_CLIENTE", fields: ["NOMBRE_CLIENTE"], render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_CLIENTE || row.nombre || "—"}</span>
  )},
  { header: "Email", field: "EMAIL", fields: ["EMAIL"] },
  { header: "Telefono", field: "TELEFONO", fields: ["TELEFONO"], render: (row) => row.TELEFONO || row.telefono || "—" },
  { header: "Estado", field: "ESTADO_CLIENTE", fields: ["ESTADO_CLIENTE"], render: (row) => (
    <Badge variant={row.ESTADO_CLIENTE === 'ACTIVO' ? 'success' : 'neutral'}>
      {row.ESTADO_CLIENTE || row.estado || "—"}
    </Badge>
  )},
];

export default function Clientes() {
  const { access } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const columns = filterColumnsByAccess(allColumns, access, "CLIENTES");

  useEffect(() => {
    fetch(`${API}/api/clientes`)
      .then(r => r.json())
      .then(d => { setClientes(Array.isArray(d) ? d : d.clientes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando clientes...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Clientes</h2>
        <ModuleActionBar
          moduleKey="clientes"
          count={clientes.length}
          rows={clientes}
          columns={columns}
          filename="clientes.csv"
        />
      </div>
      <DataTable columns={columns} data={clientes} />
    </div>
  );
}
