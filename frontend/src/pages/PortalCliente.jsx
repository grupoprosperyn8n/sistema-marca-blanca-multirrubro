import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

/* ── campos seguros editables por el cliente ── */
const EDITABLE_FIELDS = [
  { key: "NOMBRE_CLIENTE", label: "Nombre", type: "text" },
  { key: "TELEFONO",       label: "Teléfono", type: "tel" },
  { key: "DOCUMENTO_IDENTIDAD", label: "DNI", type: "text" },
  { key: "CALLE_Y_N°",     label: "Dirección", type: "text" },
  { key: "LOCALIDAD",      label: "Localidad", type: "text" },
  { key: "PROVINCIA/PAIS", label: "Provincia / País", type: "text" },
  { key: "CODIGO_POSTAL",  label: "Código Postal", type: "text" },
  { key: "FECHA_NACIMIENTO", label: "Fecha de Nacimiento", type: "date" },
  { key: "PREFERENCIAS_SERVICIOS", label: "Preferencias", type: "text" },
  { key: "ACEPTA_COMUNICACIONES", label: "Acepta comunicaciones", type: "checkbox" },
];

/* ── traducción de estados de cita ── */
const ESTADO_MAP = {
  PENDIENTE_CONFIRMACION: { label: "Pendiente de confirmación", color: "#f59e0b", bg: "#fffbeb" },
  CONFIRMADA:             { label: "Confirmada", color: "#10b981", bg: "#ecfdf5" },
  EN_CURSO:               { label: "En curso", color: "#3b82f6", bg: "#eff6ff" },
  COMPLETADA:             { label: "Completada", color: "#6b7280", bg: "#f3f4f6" },
  CANCELADA:              { label: "Cancelada", color: "#ef4444", bg: "#fef2f2" },
  NO_ASISTIO:             { label: "No asistió", color: "#9ca3af", bg: "#f9fafb" },
  REPROGRAMADA:           { label: "Reprogramada", color: "#8b5cf6", bg: "#f5f3ff" },
  BORRADOR:               { label: "Borrador", color: "#d1d5db", bg: "#ffffff" },
};

/* ── helpers ── */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(`1970-01-01T${iso}`);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/* ================================================================== */
export default function PortalCliente() {
  const { usuario, logout } = useAuth();

  /* ── state ── */
  const [perfil, setPerfil] = useState(null);
  const [citas, setCitas] = useState({ proximas: [], historial: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null); // key of field being edited
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  /* ── fetch helpers ── */
  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const resp = await fetch(`${API}${url}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (resp.status === 401) { logout(); throw new Error("Sesión expirada"); }
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `Error ${resp.status}`);
    }
    return resp.json();
  }, [logout]);

  /* ── load data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [perfilData, citasData] = await Promise.all([
        fetchWithCookie("/clientes/me"),
        fetchWithCookie("/clientes/me/citas"),
      ]);
      setPerfil(perfilData);
      setCitas(citasData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithCookie]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── toast auto-dismiss ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── inline edit ── */
  const startEdit = (field) => {
    setEditingField(field.key);
    setEditValue(perfil?.[field.key] ?? "");
  };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };

  const saveEdit = async (fieldKey) => {
    setSaving(true);
    try {
      const payload = { [fieldKey]: editValue };
      const updated = await fetchWithCookie("/clientes/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setPerfil(updated);
      setEditingField(null);
      showToast(`${fieldKey} actualizado`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="portal-loading" style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>Cargando tu portal…</p>
      </div>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <div className="portal-error" style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
        <p>⚠️ {error}</p>
        <button onClick={loadData} style={{ marginTop: "1rem" }}>Reintentar</button>
      </div>
    );
  }

  /* ================================================================ */
  return (
    <div className="portal-cliente" style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* ── Toast ────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toast.type}`} style={toastStyles(toast.type)}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: ".25rem" }}>
        Hola, {perfil?.NOMBRE_CLIENTE || usuario?.nombre || "Cliente"}
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Bienvenido a tu portal de {perfil?.ESTADO_COMERCIAL === "VIP" && "⭐ "}cliente
        {perfil?.ESTADO_COMERCIAL && ` · ${perfil.ESTADO_COMERCIAL}`}
      </p>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN: MI PERFIL
          ═══════════════════════════════════════════════════════ */}
      <section className="card" style={cardStyle}>
        <h2 style={h2Style}>📋 Mi Perfil</h2>

        {/* ── Email (read-only) ── */}
        <FieldRow label="Email" value={perfil?.EMAIL || usuario?.email || "—"} readonly />

        {/* ── Campos editables ── */}
        {EDITABLE_FIELDS.map((field) => {
          const isEditing = editingField === field.key;
          const value = isEditing ? editValue : (perfil?.[field.key]);
          const display = field.type === "checkbox"
            ? (perfil?.[field.key] ? "Sí" : "No")
            : (value || "—");

          return (
            <FieldRow
              key={field.key}
              label={field.label}
              value={display}
              editing={isEditing}
              editType={field.type}
              editValue={isEditing ? editValue : ""}
              onEdit={() => startEdit(field)}
              onSave={() => saveEdit(field.key)}
              onCancel={cancelEdit}
              onEditChange={setEditValue}
              saving={saving}
            />
          );
        })}

        {/* ── Fecha de registro (read-only) ── */}
        <FieldRow label="Cliente desde" value={fmtDate(perfil?.FECHA_CREACION)} readonly />
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN: MIS CITAS
          ═══════════════════════════════════════════════════════ */}
      <section className="card" style={{ ...cardStyle, marginTop: "1.5rem" }}>
        <h2 style={h2Style}>📅 Mis Citas</h2>

        {/* ── CTA Reservar Turno ── */}
        <button
          onClick={() => showToast("🛠️ Reserva de turnos — Próximamente", "info")}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: ".7rem 1.5rem",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "1rem",
          }}
        >
          📞 Reservar Turno
        </button>

        {citas.total === 0 ? (
          <EmptyState
            title="No tenés citas todavía"
            subtitle="Cuando reserves un turno, aparecerá acá."
            icon="📭"
          />
        ) : (
          <>
            {/* ── Próximas Citas ── */}
            <h3 style={{ ...h3Style, color: "#10b981" }}>🟢 Próximas ({citas.proximas.length})</h3>
            {citas.proximas.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: ".9rem", marginBottom: "1rem" }}>
                No tenés citas próximas.
              </p>
            ) : (
              citas.proximas.map((cita) => (
                <CitaCard key={cita.id} cita={cita} />
              ))
            )}

            {/* ── Historial ── */}
            <h3 style={{ ...h3Style, color: "#6b7280", marginTop: "1.5rem" }}>
              📜 Historial ({citas.historial.length})
            </h3>
            {citas.historial.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: ".9rem" }}>Sin historial.</p>
            ) : (
              citas.historial.map((cita) => (
                <CitaCard key={cita.id} cita={cita} />
              ))
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ==================================================================
   Subcomponentes
   ================================================================== */

function FieldRow({
  label, value, readonly, editing, editType, editValue,
  onEdit, onSave, onCancel, onEditChange, saving
}) {
  return (
    <div style={fieldRowStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            {editType === "checkbox" ? (
              <label style={{ display: "flex", alignItems: "center", gap: ".25rem" }}>
                <input
                  type="checkbox"
                  checked={editValue === true || editValue === "Sí"}
                  onChange={(e) => onEditChange(e.target.checked ? true : false)}
                />
                Sí, acepto
              </label>
            ) : (
              <input
                type={editType}
                value={editValue ?? ""}
                onChange={(e) => onEditChange(e.target.value)}
                style={inputStyle}
                autoFocus
              />
            )}
            <button onClick={onSave} disabled={saving} style={btnSave}>
              {saving ? "…" : "✓"}
            </button>
            <button onClick={onCancel} style={btnCancel}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            <span style={{ color: readonly ? "#6b7280" : "#111827" }}>
              {value}
            </span>
            {!readonly && (
              <button onClick={onEdit} style={btnEdit} title={`Editar ${label}`}>
                ✎
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CitaCard({ cita }) {
  const estado = ESTADO_MAP[cita.ESTADO_CITA] || {
    label: cita.ESTADO_CITA || "—",
    color: "#6b7280",
    bg: "#f9fafb",
  };

  return (
    <div style={citaCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
        <div>
          <strong style={{ fontSize: "1.05rem" }}>{cita.NOMBRE_CITA || "Cita"}</strong>
          <div style={{ color: "#6b7280", fontSize: ".85rem", marginTop: ".2rem" }}>
            {fmtDate(cita.FECHA_CITA)} {cita.HORA_INICIO ? `· ${fmtTime(cita.HORA_INICIO)}` : ""}
            {cita.SUCURSAL_ATENCION ? ` — ${cita.SUCURSAL_ATENCION}` : ""}
          </div>
          {cita.SERVICIO && (
            <div style={{ color: "#374151", fontSize: ".85rem" }}>
              Servicio:{" "}
              {Array.isArray(cita.SERVICIO) ? cita.SERVICIO.join(", ") : cita.SERVICIO}
            </div>
          )}
          {cita.PROFESIONAL && (
            <div style={{ color: "#374151", fontSize: ".85rem" }}>
              Profesional:{" "}
              {Array.isArray(cita.PROFESIONAL) ? cita.PROFESIONAL.join(", ") : cita.PROFESIONAL}
            </div>
          )}
        </div>
        <span style={{
          ...estadoBadge,
          backgroundColor: estado.bg,
          color: estado.color,
          border: `1px solid ${estado.color}`,
        }}>
          {estado.label}
        </span>
      </div>
      {cita.OBSERVACIONES_CLIENTE && (
        <p style={{ color: "#6b7280", fontSize: ".85rem", marginTop: ".5rem", fontStyle: "italic" }}>
          "{cita.OBSERVACIONES_CLIENTE}"
        </p>
      )}
    </div>
  );
}

function EmptyState({ title, subtitle, icon }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#9ca3af" }}>
      <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>{icon || "📋"}</div>
      <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: 0, color: "#6b7280" }}>{title}</p>
      {subtitle && <p style={{ margin: ".3rem 0 0", fontSize: ".9rem" }}>{subtitle}</p>}
    </div>
  );
}

/* ==================================================================
   Styles
   ================================================================== */
const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,.08)",
  padding: "1.5rem",
};

const h2Style = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" };
const h3Style = { fontSize: "1rem", fontWeight: 600, marginBottom: ".75rem" };

const fieldRowStyle = {
  display: "flex", gap: "1rem", alignItems: "center",
  padding: ".6rem 0", borderBottom: "1px solid #f3f4f6",
  flexWrap: "wrap",
};
const labelStyle = {
  fontWeight: 600, color: "#374151", minWidth: 140, fontSize: ".9rem",
};
const inputStyle = {
  border: "1px solid #d1d5db", borderRadius: 6, padding: ".35rem .6rem",
  fontSize: ".9rem", width: "100%", maxWidth: 300,
};
const btnEdit = {
  background: "none", border: "none", cursor: "pointer",
  color: "#6366f1", fontSize: "1rem", padding: "0 .25rem",
};
const btnSave = {
  background: "#10b981", color: "#fff", border: "none",
  borderRadius: 6, padding: ".35rem .7rem", cursor: "pointer",
  fontWeight: 600,
};
const btnCancel = {
  background: "none", border: "none", cursor: "pointer",
  color: "#ef4444", fontSize: "1rem",
};

const citaCardStyle = {
  backgroundColor: "#f9fafb", borderRadius: 10,
  padding: "1rem", marginBottom: ".75rem",
  border: "1px solid #e5e7eb",
};

const estadoBadge = {
  fontSize: ".75rem", fontWeight: 600,
  padding: ".15rem .6rem", borderRadius: 999,
  whiteSpace: "nowrap",
};

const toastStyles = (type) => {
  const bg = type === "error" ? "#fef2f2" : type === "info" ? "#eff6ff" : "#ecfdf5";
  const color = type === "error" ? "#ef4444" : type === "info" ? "#3b82f6" : "#10b981";
  return {
    position: "fixed", top: "1rem", right: "1rem", zIndex: 9999,
    backgroundColor: bg, color, fontWeight: 600,
    padding: ".75rem 1.5rem", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.1)",
    border: `1px solid ${color}`,
  };
};
