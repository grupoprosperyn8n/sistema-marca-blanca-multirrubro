import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import CrudFormModal from "../components/backoffice/CrudFormModal";
import { canEditField, filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Nombre", field: "NOMBRE_SUCURSAL", fields: ["NOMBRE_SUCURSAL"], render: (row) => (
    <span className="font-medium" style={{ color: "var(--brand-text)" }}>{row.NOMBRE_SUCURSAL || "—"}</span>
  )},
  { header: "Dirección", field: "CALLE Y N°", fields: ["CALLE Y N°", "LOCALIDAD", "PROVINCIA"], render: (row) => (
    [row["CALLE Y N°"], row.LOCALIDAD, row.PROVINCIA].filter(Boolean).join(", ") || "—"
  )},
  { header: "Teléfono", field: "TELEFONO_CONTACTO", fields: ["TELEFONO_CONTACTO"], render: (row) => row.TELEFONO_CONTACTO || "—" },
  { header: "Visibilidad", field: "VISIBILIDAD_WEB", fields: ["VISIBILIDAD_WEB"], render: (row) => row.VISIBILIDAD_WEB || "—" },
  { header: "Estado", field: "ESTADO_SUCURSAL", fields: ["ESTADO_SUCURSAL", "ACTIVO"], render: (row) => {
    const active = row.ACTIVO !== false && row.ESTADO_SUCURSAL !== "INACTIVA" && row.ESTADO_SUCURSAL !== "CERRADA";
    return (
      <Badge variant={active ? "success" : "neutral"}>
        {active ? (row.ESTADO_SUCURSAL || "ACTIVA") : (row.ESTADO_SUCURSAL || "INACTIVA")}
      </Badge>
    );
  }},
];

const emptyForm = {
  NOMBRE_SUCURSAL: "",
  "CALLE Y N°": "",
  LOCALIDAD: "",
  PROVINCIA: "",
  PAIS: "Argentina",
  CODIGO_POSTAL: "",
  TELEFONO_CONTACTO: "",
  EMAIL_CONTACTO: "",
  WHATSAPP_SUCURSAL: "",
  MAPA_UBICACION_URL: "",
  HORARIO_REFERENCIA: "",
  PUBLICAR_WEB: false,
  VISIBILIDAD_WEB: "INTERNA",
  ORDEN: 99,
  ACTIVO: true,
  ESTADO_SUCURSAL: "ACTIVA",
};

export default function Sucursales() {
  const { access } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const columns = filterColumnsByAccess(allColumns, access, "SUCURSALES");

  const editableFields = [
    { name: "NOMBRE_SUCURSAL", label: "Nombre", disabled: !canEditField(access, "SUCURSALES", "NOMBRE_SUCURSAL") },
    { name: "CALLE Y N°", label: "Calle y número", disabled: !canEditField(access, "SUCURSALES", "CALLE Y N°") },
    { name: "LOCALIDAD", label: "Localidad", disabled: !canEditField(access, "SUCURSALES", "LOCALIDAD") },
    { name: "PROVINCIA", label: "Provincia", disabled: !canEditField(access, "SUCURSALES", "PROVINCIA") },
    { name: "PAIS", label: "País", disabled: !canEditField(access, "SUCURSALES", "PAIS") },
    { name: "CODIGO_POSTAL", label: "Código postal", disabled: !canEditField(access, "SUCURSALES", "CODIGO_POSTAL") },
    { name: "TELEFONO_CONTACTO", label: "Teléfono", disabled: !canEditField(access, "SUCURSALES", "TELEFONO_CONTACTO") },
    { name: "EMAIL_CONTACTO", label: "Email", type: "email", disabled: !canEditField(access, "SUCURSALES", "EMAIL_CONTACTO") },
    { name: "WHATSAPP_SUCURSAL", label: "WhatsApp", disabled: !canEditField(access, "SUCURSALES", "WHATSAPP_SUCURSAL") },
    { name: "MAPA_UBICACION_URL", label: "Google Maps / mapa", type: "url", disabled: !canEditField(access, "SUCURSALES", "MAPA_UBICACION_URL") },
    { name: "HORARIO_REFERENCIA", label: "Horarios", type: "textarea", disabled: !canEditField(access, "SUCURSALES", "HORARIO_REFERENCIA") },
    { name: "VISIBILIDAD_WEB", label: "Visibilidad web", type: "select", options: ["PUBLICA", "INTERNA", "OCULTA", "SOLO_INTERNA", "BORRADOR"], disabled: !canEditField(access, "SUCURSALES", "VISIBILIDAD_WEB") },
    { name: "ESTADO_SUCURSAL", label: "Estado", type: "select", options: ["ACTIVA", "BORRADOR", "EN_APERTURA", "PAUSADA", "INACTIVA", "CERRADA"], disabled: !canEditField(access, "SUCURSALES", "ESTADO_SUCURSAL") },
    { name: "ORDEN", label: "Orden", type: "number", disabled: !canEditField(access, "SUCURSALES", "ORDEN") },
    { name: "PUBLICAR_WEB", label: "Publicar en web", type: "checkbox", disabled: !canEditField(access, "SUCURSALES", "PUBLICAR_WEB") },
    { name: "ACTIVO", label: "Activo", type: "checkbox", disabled: !canEditField(access, "SUCURSALES", "ACTIVO") },
  ];

  function editablePayload() {
    return editableFields
      .filter((field) => !field.disabled)
      .reduce((payload, field) => ({ ...payload, [field.name]: form[field.name] }), {});
  }

  async function loadSucursales() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sucursales`);
      const data = await res.json();
      setSucursales(Array.isArray(data) ? data : data.sucursales || []);
    } catch {
      setError("No se pudieron cargar sucursales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSucursales();
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando sucursales...</p>;

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
    setError("");
    setMessage("");
  }

  function openEdit() {
    if (!selected) { setError("Seleccioná una sucursal de la tabla."); return; }
    setForm({
      NOMBRE_SUCURSAL: selected.NOMBRE_SUCURSAL || "",
      "CALLE Y N°": selected["CALLE Y N°"] || "",
      LOCALIDAD: selected.LOCALIDAD || "",
      PROVINCIA: selected.PROVINCIA || "",
      PAIS: selected.PAIS || "Argentina",
      CODIGO_POSTAL: selected.CODIGO_POSTAL || "",
      TELEFONO_CONTACTO: selected.TELEFONO_CONTACTO || "",
      EMAIL_CONTACTO: selected.EMAIL_CONTACTO || "",
      WHATSAPP_SUCURSAL: selected.WHATSAPP_SUCURSAL || "",
      MAPA_UBICACION_URL: selected.MAPA_UBICACION_URL || "",
      HORARIO_REFERENCIA: selected.HORARIO_REFERENCIA || "",
      PUBLICAR_WEB: selected.PUBLICAR_WEB === true,
      VISIBILIDAD_WEB: selected.VISIBILIDAD_WEB || "INTERNA",
      ORDEN: selected.ORDEN ?? 99,
      ACTIVO: selected.ACTIVO !== false,
      ESTADO_SUCURSAL: selected.ESTADO_SUCURSAL || "ACTIVA",
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
      const res = await fetch(`${API}/api/backoffice/sucursales${isEdit ? `/${selected.id}` : ""}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editablePayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message || data?.detail || `HTTP ${res.status}`);
      setMessage(isEdit ? "Sucursal actualizada." : "Sucursal creada.");
      setModalMode("");
      setSelected(data);
      await loadSucursales();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) { setError("Seleccioná una sucursal de la tabla."); return; }
    if (!window.confirm(`Dar de baja lógica a ${selected.NOMBRE_SUCURSAL || "esta sucursal"}?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/sucursales/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage("Sucursal dada de baja lógica.");
      setSelected(data);
      await loadSucursales();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading, Manrope)", color: "var(--brand-text)" }}>Sucursales</h2>
        <ModuleActionBar
          moduleKey="sucursales"
          count={sucursales.length}
          rows={sucursales}
          columns={columns}
          filename="sucursales.csv"
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>
      {selected && (
        <p className="mb-3 text-xs opacity-70" style={{ color: "var(--brand-text)" }}>
          Seleccionada: {selected.NOMBRE_SUCURSAL || selected.id}
        </p>
      )}
      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <DataTable
        columns={columns}
        data={sucursales}
        selectedRowId={selected?.id}
        onRowClick={(row) => { setSelected(row); setError(""); }}
      />
      {modalMode && (
        <CrudFormModal
          title={modalMode === "edit" ? "Editar sucursal" : "Crear sucursal"}
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
