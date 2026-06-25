import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import CrudFormModal from "../components/backoffice/CrudFormModal";
import { canEditField, filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Nombre", field: "NOMBRE_CLIENTE", fields: ["NOMBRE_CLIENTE"], render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_CLIENTE || row.nombre || "—"}</span>
  )},
  { header: "Email", field: "EMAIL", fields: ["EMAIL"] },
  { header: "Telefono", field: "TELEFONO", fields: ["TELEFONO"], render: (row) => row.TELEFONO || row.telefono || "—" },
  { header: "Estado", field: "ACTIVO", fields: ["ACTIVO"], render: (row) => (
    <Badge variant={row.ACTIVO !== false ? 'success' : 'neutral'}>
      {row.ACTIVO !== false ? "ACTIVO" : "INACTIVO"}
    </Badge>
  )},
];

const emptyForm = {
  NOMBRE_CLIENTE: "",
  EMAIL: "",
  TELEFONO: "",
  ACTIVO: true,
};

export default function Clientes() {
  const { access } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const columns = filterColumnsByAccess(allColumns, access, "CLIENTES");

  const editableFields = [
    { name: "NOMBRE_CLIENTE", label: "Nombre", disabled: !canEditField(access, "CLIENTES", "NOMBRE_CLIENTE") },
    { name: "EMAIL", label: "Email", type: "email", disabled: !canEditField(access, "CLIENTES", "EMAIL") },
    { name: "TELEFONO", label: "Teléfono", disabled: !canEditField(access, "CLIENTES", "TELEFONO") },
    { name: "ACTIVO", label: "Activo", type: "checkbox", disabled: !canEditField(access, "CLIENTES", "ACTIVO") },
  ];

  function editablePayload() {
    return editableFields
      .filter((field) => !field.disabled)
      .reduce((payload, field) => ({ ...payload, [field.name]: form[field.name] }), {});
  }

  async function loadClientes() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/clientes`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : data.clientes || []);
    } catch {
      setError("No se pudieron cargar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando clientes...</p>;

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
    setError("");
    setMessage("");
  }

  function openEdit() {
    if (!selected) { setError("Seleccioná un cliente de la tabla."); return; }
    setForm({
      NOMBRE_CLIENTE: selected.NOMBRE_CLIENTE || selected.nombre || "",
      EMAIL: selected.EMAIL || "",
      TELEFONO: selected.TELEFONO || selected.telefono || "",
      ACTIVO: selected.ACTIVO !== false,
    });
    setModalMode("edit");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = modalMode === "edit";
      const res = await fetch(`${API}/api/backoffice/clientes${isEdit ? `/${selected.id}` : ""}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editablePayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message || data?.detail || `HTTP ${res.status}`);
      setMessage(isEdit ? "Cliente actualizado." : "Cliente creado.");
      setModalMode("");
      setSelected(data);
      await loadClientes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) { setError("Seleccioná un cliente de la tabla."); return; }
    if (!window.confirm(`Dar de baja lógica a ${selected.NOMBRE_CLIENTE || selected.nombre || "este cliente"}?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/clientes/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage("Cliente dado de baja lógica.");
      setSelected(data);
      await loadClientes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>
      {selected && (
        <p className="mb-3 text-xs opacity-70" style={{ color: "var(--brand-text)" }}>
          Seleccionado: {selected.NOMBRE_CLIENTE || selected.nombre || selected.id}
        </p>
      )}
      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <DataTable
        columns={columns}
        data={clientes}
        selectedRowId={selected?.id}
        onRowClick={(row) => { setSelected(row); setError(""); }}
      />
      {modalMode && (
        <CrudFormModal
          title={modalMode === "edit" ? "Editar cliente" : "Crear cliente"}
          fields={editableFields}
          values={form}
          saving={saving}
          error={error}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmit}
          onClose={() => setModalMode("")}
        />
      )}
    </div>
  );
}
