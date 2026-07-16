import { useState, useEffect } from "react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import ModuleActionBar from "../components/backoffice/ModuleActionBar";
import CrudFormModal from "../components/backoffice/CrudFormModal";
import { canEditField, filterColumnsByAccess, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const allColumns = [
  { header: "Cliente", field: "NOMBRE_CLIENTE", fields: ["CLIENTE", "NOMBRE_CLIENTE"], mobilePriority: 1, render: (row) => (
    <span className="font-medium" style={{ color: "var(--brand-text)" }}>{row.NOMBRE_CLIENTE || "—"}</span>
  )},
  { header: "Servicio", field: "NOMBRE_SERVICIO", fields: ["SERVICIO", "NOMBRE_SERVICIO"], mobilePriority: 4 },
  { header: "Profesional", field: "NOMBRE_PROFESIONAL", fields: ["PROFESIONAL", "NOMBRE_PROFESIONAL"], mobilePriority: "hidden" },
  { header: "Sucursal", field: "NOMBRE_SUCURSAL", fields: ["SUCURSAL_ATENCION", "NOMBRE_SUCURSAL"], mobilePriority: "hidden" },
  { header: "Fecha", field: "FECHA_CITA", fields: ["FECHA_CITA"], mobilePriority: 2 },
  { header: "Hora", field: "HORA_INICIO", fields: ["HORA_INICIO", "HORA_FIN"], mobilePriority: 3, render: (row) => (
    row.HORA_INICIO ? `${row.HORA_INICIO}${row.HORA_FIN ? ` – ${row.HORA_FIN}` : ""}` : "—"
  )},
  { header: "Slot", field: "ESTADO_SLOT", fields: ["AGENDA_SLOT", "ESTADO_SLOT"], mobilePriority: "hidden", render: (row) => row.ESTADO_SLOT || "—" },
  { header: "Estado", field: "ESTADO_CITA", fields: ["ESTADO_CITA"], mobilePriority: 5, render: (row) => {
    const variants = { CONFIRMADA: "success", REPROGRAMADA: "warning", PENDIENTE_CONFIRMACION: "warning", CANCELADA: "error", COMPLETADA: "success" };
    return <Badge variant={variants[row.ESTADO_CITA] || "neutral"}>{row.ESTADO_CITA || "—"}</Badge>;
  }},
];

const emptyForm = {
  CLIENTE: "",
  SERVICIO: "",
  AGENDA_SLOT: "",
  ESTADO_CITA: "CONFIRMADA",
  OBSERVACIONES_CLIENTE: "",
  OBSERVACIONES_INTERNAS: "",
};

function addDaysISO(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function option(value, label) {
  return { value, label: label || value };
}

function slotOptionLabel(slot) {
  const dateTime = [slot.FECHA_SLOT || "s/f", slot.HORA_INICIO || ""].filter(Boolean).join(" ");
  const context = [slot.NOMBRE_SUCURSAL, slot.NOMBRE_PROFESIONAL].filter(Boolean).join(" · ");
  return context ? `${dateTime} · ${context}` : dateTime;
}

export default function Citas() {
  const { access } = useAuth();
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const columns = filterColumnsByAccess(allColumns, access, "CITAS");

  const slotOptions = slots.map((slot) => option(
    slot.id,
    slotOptionLabel(slot),
  ));
  if (selected?.AGENDA_SLOT_ID && !slotOptions.some((item) => item.value === selected.AGENDA_SLOT_ID)) {
    slotOptions.unshift(option(selected.AGENDA_SLOT_ID, `${slotOptionLabel({
      FECHA_SLOT: selected.FECHA_CITA || "Actual",
      HORA_INICIO: selected.HORA_INICIO,
      NOMBRE_SUCURSAL: selected.NOMBRE_SUCURSAL,
      NOMBRE_PROFESIONAL: selected.NOMBRE_PROFESIONAL,
    })} · slot actual`));
  }

  const editableFields = [
    { name: "CLIENTE", label: "Cliente", type: "select", options: clientes.map((c) => option(c.id, c.NOMBRE_CLIENTE || c.EMAIL || c.id)), disabled: !canEditField(access, "CITAS", "CLIENTE") || modalMode === "edit" },
    { name: "SERVICIO", label: "Servicio", type: "select", options: servicios.map((s) => option(s.id, s.NOMBRE_SERVICIO || s.id)), disabled: !canEditField(access, "CITAS", "SERVICIO") || modalMode === "edit" },
    { name: "AGENDA_SLOT", label: modalMode === "edit" ? "Nuevo slot / reprogramar" : "Slot disponible", type: "select", options: slotOptions, helper: modalMode === "edit" ? "El slot actual se conserva si no seleccionás otro." : "Elegí un slot disponible para reservar la cita.", disabled: !canEditField(access, "CITAS", "AGENDA_SLOT") },
    { name: "ESTADO_CITA", label: "Estado", type: "select", options: ["CONFIRMADA", "PENDIENTE_CONFIRMACION", "REPROGRAMADA"], disabled: !canEditField(access, "CITAS", "ESTADO_CITA") },
    { name: "OBSERVACIONES_CLIENTE", label: "Observaciones cliente", type: "textarea", disabled: !canEditField(access, "CITAS", "OBSERVACIONES_CLIENTE") },
    { name: "OBSERVACIONES_INTERNAS", label: "Observaciones internas", type: "textarea", disabled: !canEditField(access, "CITAS", "OBSERVACIONES_INTERNAS") },
  ];

  function editablePayload() {
    const payload = editableFields
      .filter((field) => !field.disabled)
      .reduce((next, field) => ({ ...next, [field.name]: form[field.name] }), {});
    if (modalMode === "edit" && payload.AGENDA_SLOT === selected?.AGENDA_SLOT_ID) {
      delete payload.AGENDA_SLOT;
    }
    return payload;
  }

  async function loadAll() {
    setLoading(true);
    try {
      const slotParams = new URLSearchParams({
        disponible: "true",
        future_only: "true",
        fecha_desde: addDaysISO(0),
        fecha_hasta: addDaysISO(45),
        max_records: "1000",
      });
      const [citasRes, clientesRes, serviciosRes, slotsRes] = await Promise.all([
        fetch(`${API}/api/citas`),
        fetch(`${API}/api/clientes`),
        fetch(`${API}/api/servicios`),
        fetch(`${API}/api/agenda-slots?${slotParams.toString()}`),
      ]);
      const [citasData, clientesData, serviciosData, slotsData] = await Promise.all([
        citasRes.json(),
        clientesRes.json(),
        serviciosRes.json(),
        slotsRes.json(),
      ]);
      setCitas(Array.isArray(citasData) ? citasData : citasData.citas || []);
      setClientes(Array.isArray(clientesData) ? clientesData : clientesData.clientes || []);
      setServicios(Array.isArray(serviciosData) ? serviciosData : serviciosData.servicios || []);
      setSlots(Array.isArray(slotsData) ? slotsData : slotsData.agenda_slots || []);
    } catch {
      setError("No se pudieron cargar citas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando citas...</p>;

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
    setError("");
    setMessage("");
  }

  function openEdit() {
    if (!selected) { setError("Seleccioná una cita de la tabla."); return; }
    setForm({
      CLIENTE: selected.CLIENTE_ID || "",
      SERVICIO: selected.SERVICIO_ID || "",
      AGENDA_SLOT: selected.AGENDA_SLOT_ID || "",
      ESTADO_CITA: selected.ESTADO_CITA || "CONFIRMADA",
      OBSERVACIONES_CLIENTE: selected.OBSERVACIONES_CLIENTE || "",
      OBSERVACIONES_INTERNAS: selected.OBSERVACIONES_INTERNAS || "",
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
      const res = await fetch(`${API}/api/backoffice/citas${isEdit ? `/${selected.id}` : ""}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editablePayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message || data?.detail || `HTTP ${res.status}`);
      setMessage(isEdit ? "Cita actualizada/reprogramada." : "Cita creada.");
      setModalMode("");
      setSelected(data);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) { setError("Seleccioná una cita de la tabla."); return; }
    if (!window.confirm(`Cancelar la cita de ${selected.NOMBRE_CLIENTE || "este cliente"}?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/backoffice/citas/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setMessage("Cita cancelada con baja lógica.");
      setSelected(data);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading, Manrope)", color: "var(--brand-text)" }}>Citas</h2>
        <ModuleActionBar
          moduleKey="citas"
          count={citas.length}
          rows={citas}
          columns={columns}
          filename="citas.csv"
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>
      {selected && (
        <p className="mb-3 text-xs opacity-70" style={{ color: "var(--brand-text)" }}>
          Seleccionada: {selected.NOMBRE_CLIENTE || selected.id} · {selected.FECHA_CITA || "sin fecha"} {selected.HORA_INICIO || ""}
        </p>
      )}
      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <DataTable
        columns={columns}
        data={citas}
        selectedRowId={selected?.id}
        onRowClick={(row) => { setSelected(row); setError(""); }}
      />
      {modalMode && (
        <CrudFormModal
          title={modalMode === "edit" ? "Editar / reprogramar cita" : "Crear cita"}
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
