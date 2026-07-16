import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import CrudFormModal from "../components/backoffice/CrudFormModal";
import { canEditField, filterColumnsByAccess, useAuth } from "../context/AuthContext";
import { getPublicServiceImage } from "../utils/publicDataFilters";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Foto", field: "FOTO_SERVICIO", fields: ["FOTO_SERVICIO"], mobilePriority: "hidden", render: (row) => {
    const image = getPublicServiceImage(row);
    return image?.url ? (
      <img src={image.url} alt={row.NOMBRE_SERVICIO || "Servicio"} className="h-10 w-14 rounded-lg object-cover" loading="lazy" />
    ) : "—";
  }},
  { header: "Nombre", field: "NOMBRE_SERVICIO", fields: ["NOMBRE_SERVICIO"], mobilePriority: 1, render: (row) => (
    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{row.NOMBRE_SERVICIO || row.nombre || "—"}</span>
  )},
  { header: "Categoria", field: "CATEGORIA_SERVICIO", fields: ["CATEGORIA_SERVICIO"], mobilePriority: 4 },
  { header: "Precio", field: "PRECIO_BASE", fields: ["PRECIO_BASE"], mobilePriority: 2, render: (row) => (
    <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>${row.PRECIO_BASE ?? "—"}</span>
  )},
  { header: "Duracion", field: "DURACION_MINUTOS", fields: ["DURACION_MINUTOS"], mobilePriority: 3, render: (row) => row.DURACION_MINUTOS ? `${row.DURACION_MINUTOS} min` : "—" },
  { header: "Estado", field: "ESTADO_SERVICIO", fields: ["ESTADO_SERVICIO"], mobilePriority: 5, render: (row) => (
    <Badge variant={row.ESTADO_SERVICIO === 'ACTIVO' ? 'success' : 'neutral'}>
      {row.ESTADO_SERVICIO || "—"}
    </Badge>
  )},
];

const emptyForm = {
  NOMBRE_SERVICIO: "",
  CATEGORIA_SERVICIO: "",
  DESCRIPCION_COMERCIAL: "",
  DURACION_MINUTOS: 60,
  PRECIO_BASE: 0,
  ESTADO_SERVICIO: "ACTIVO",
  ACTIVO: true,
};

export default function Servicios() {
  const { access } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const columns = filterColumnsByAccess(allColumns, access, "SERVICIOS");

  const editableFields = [
    { name: "NOMBRE_SERVICIO", label: "Nombre", disabled: !canEditField(access, "SERVICIOS", "NOMBRE_SERVICIO") },
    { name: "CATEGORIA_SERVICIO", label: "Categoría", disabled: !canEditField(access, "SERVICIOS", "CATEGORIA_SERVICIO") },
    { name: "DESCRIPCION_COMERCIAL", label: "Descripción comercial", type: "textarea", disabled: !canEditField(access, "SERVICIOS", "DESCRIPCION_COMERCIAL") },
    { name: "DURACION_MINUTOS", label: "Duración minutos", type: "number", disabled: !canEditField(access, "SERVICIOS", "DURACION_MINUTOS") },
    { name: "PRECIO_BASE", label: "Precio base", type: "number", disabled: !canEditField(access, "SERVICIOS", "PRECIO_BASE") },
    { name: "ESTADO_SERVICIO", label: "Estado", type: "select", options: ["ACTIVO", "INACTIVO", "PAUSADO", "DISCONTINUADO"], disabled: !canEditField(access, "SERVICIOS", "ESTADO_SERVICIO") },
    { name: "ACTIVO", label: "Activo", type: "checkbox", disabled: !canEditField(access, "SERVICIOS", "ACTIVO") },
  ];

  function editablePayload() {
    return editableFields
      .filter((field) => !field.disabled)
      .reduce((payload, field) => ({ ...payload, [field.name]: form[field.name] }), {});
  }

  async function loadServicios() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/servicios`);
      const data = await res.json();
      setServicios(Array.isArray(data) ? data : data.servicios || []);
    } catch {
      setError("No se pudieron cargar servicios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServicios();
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando servicios...</p>;

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
    setError("");
    setMessage("");
  }

  function openEdit() {
    if (!selected) { setError("Seleccioná un servicio de la tabla."); return; }
    setForm({
      NOMBRE_SERVICIO: selected.NOMBRE_SERVICIO || selected.nombre || "",
      CATEGORIA_SERVICIO: selected.CATEGORIA_SERVICIO || "",
      DESCRIPCION_COMERCIAL: selected.DESCRIPCION_COMERCIAL || "",
      DURACION_MINUTOS: selected.DURACION_MINUTOS ?? "",
      PRECIO_BASE: selected.PRECIO_BASE ?? "",
      ESTADO_SERVICIO: selected.ESTADO_SERVICIO || "ACTIVO",
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
      const res = await fetch(`${API}/api/backoffice/servicios${isEdit ? `/${selected.id}` : ""}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editablePayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message || data?.detail || `HTTP ${res.status}`);
      setMessage(isEdit ? "Servicio actualizado." : "Servicio creado.");
      setModalMode("");
      setSelected(data);
      await loadServicios();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) { setError("Seleccioná un servicio de la tabla."); return; }
    if (!window.confirm(`Dar de baja lógica a ${selected.NOMBRE_SERVICIO || selected.nombre || "este servicio"}?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/servicios/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage("Servicio dado de baja lógica.");
      setSelected(data);
      await loadServicios();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>Servicios</h2>
        <ModuleActionBar
          moduleKey="servicios"
          count={servicios.length}
          rows={servicios}
          columns={columns}
          filename="servicios.csv"
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>
      {selected && (
        <p className="mb-3 text-xs opacity-70" style={{ color: "var(--brand-text)" }}>
          Seleccionado: {selected.NOMBRE_SERVICIO || selected.nombre || selected.id}
        </p>
      )}
      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <DataTable
        columns={columns}
        data={servicios}
        selectedRowId={selected?.id}
        onRowClick={(row) => { setSelected(row); setError(""); }}
      />
      {modalMode && (
        <CrudFormModal
          title={modalMode === "edit" ? "Editar servicio" : "Crear servicio"}
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
