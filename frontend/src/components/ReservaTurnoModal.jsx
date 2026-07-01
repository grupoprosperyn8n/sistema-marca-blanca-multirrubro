import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { isPublicBranch, isPublicService } from "../utils/publicDataFilters";

const API = import.meta.env.VITE_API_BASE_URL || "";

const STEPS = [
  { key: "servicio", label: "Servicio", icon: "💇" },
  { key: "sucursal", label: "Sucursal", icon: "📍" },
  { key: "slot", label: "Horario", icon: "🕐" },
  { key: "confirmar", label: "Confirmar", icon: "✅" },
];

function getServiceDuration(servicio) {
  const raw = servicio?.DURACION_MINUTOS_WEB ?? servicio?.DURACION_MINUTOS;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function dedupeSlots(slots) {
  const map = new Map();
  slots.forEach((slot) => {
    const profesionalKey = slot.PROFESIONAL_ID || (slot.PROFESIONAL || []).join(",");
    const key = `${slot.FECHA_SLOT || ""}|${slot.HORA_INICIO || ""}|${slot.HORA_FIN || ""}|${(slot.SUCURSAL || []).join(",")}|${profesionalKey}`;
    const existing = map.get(key);
    if (existing) {
      existing.CAPACIDAD_DISPONIBLE = Number(existing.CAPACIDAD_DISPONIBLE || 0) + Number(slot.CAPACIDAD_DISPONIBLE || 0);
      return;
    }
    map.set(key, { ...slot });
  });
  return Array.from(map.values());
}

export default function ReservaTurnoModal({ onClose }) {
  const { logout } = useAuth();

  const [step, setStep] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errorFetch, setErrorFetch] = useState(null);

  // selected
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // dry-run result
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunError, setDryRunError] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const resp = await fetch(`${API}${url}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (resp.status === 401) { logout(); throw new Error("Sesión expirada"); }
    if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).detail || `Error ${resp.status}`);
    return resp.json();
  }, [logout]);

  // Load servicios on mount
  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const data = await fetchWithCookie("/api/servicios-web", { cache: "no-store" });
        const active = (data.servicios_web || data.servicios || []).filter(
          (s) => isPublicService(s) && s.ACTIVO_EN_WEB && s.RESERVA_ONLINE_HABILITADA
        );
        setServicios(active);
      } catch (e) {
        setErrorFetch("No se pudieron cargar los servicios");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [fetchWithCookie]);

  // Load sucursales when step changes
  useEffect(() => {
    if (step !== 1 || sucursales.length > 0) return;
    (async () => {
      setLoadingOptions(true);
      try {
        const data = await fetchWithCookie("/api/sucursales");
        const active = (data.sucursales || []).filter(
          (s) => isPublicBranch(s) && s.PERMITE_RESERVAS_WEB !== false
        );
        setSucursales(active);
      } catch (e) {
        setErrorFetch("No se pudieron cargar las sucursales");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [step, sucursales.length, fetchWithCookie]);

  // Load slots when step changes
  useEffect(() => {
    if (step !== 2 || !selectedSucursal) return;
    (async () => {
      setLoadingOptions(true);
      try {
        const params = new URLSearchParams({
          disponible: "true",
          future_only: "true",
          sucursal_id: selectedSucursal.id,
        });
        const duration = getServiceDuration(selectedServicio);
        if (duration) params.set("min_duration", String(duration));
        const data = await fetchWithCookie(`/api/agenda-slots?${params.toString()}`);
        const available = dedupeSlots(data.agenda_slots || data.slots || []);
        // Sort by date then time
        available.sort((a, b) => {
          const da = `${a.FECHA_SLOT || ""}${a.HORA_INICIO || ""}`;
          const db = `${b.FECHA_SLOT || ""}${b.HORA_INICIO || ""}`;
          return da.localeCompare(db);
        });
        setSlots(available);
      } catch (e) {
        setErrorFetch("No se pudieron cargar los horarios");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [step, selectedSucursal, selectedServicio, fetchWithCookie]);

  const handleNext = () => {
    if (step === 0 && !selectedServicio) return;
    if (step === 1 && !selectedSucursal) return;
    if (step === 2 && !selectedSlot) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setErrorFetch(null);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep(step - 1);
    setErrorFetch(null);
    setDryRunResult(null);
    setDryRunError(null);
  };

  const runDryRun = async () => {
    setDryRunLoading(true);
    setDryRunError(null);
    setDryRunResult(null);
    try {
      const result = await fetchWithCookie("/api/clientes/citas/dry-run", {
        method: "POST",
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          servicio_web_id: selectedServicio.id,
          sucursal_id: selectedSucursal.id,
        }),
      });
      setDryRunResult(result);
    } catch (e) {
      setDryRunError(e.message);
    } finally {
      setDryRunLoading(false);
    }
  };

  const runConfirm = async () => {
    setConfirmLoading(true);
    setConfirmError(null);
    setConfirmResult(null);
    try {
      const result = await fetchWithCookie("/api/clientes/citas/confirmar", {
        method: "POST",
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          servicio_web_id: selectedServicio.id,
          sucursal_id: selectedSucursal.id,
        }),
      });
      setConfirmResult(result);
      if (result.confirmado) {
        setDryRunResult({ ...dryRunResult, _confirmed: true });
      }
    } catch (e) {
      setConfirmError(e.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selectedServicio;
    if (step === 1) return !!selectedSucursal;
    if (step === 2) return !!selectedSlot;
    return true;
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return iso; }
  };

  const fmtTime = (t) => {
    if (!t) return "";
    try {
      const d = new Date(`1970-01-01T${t}`);
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>📞 Reservar turno</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Stepper */}
        <div style={stepperStyle}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={stepperItemStyle}>
              <div style={stepperCircleStyle(i, step)}>{s.icon}</div>
              <span style={stepperLabelStyle(i, step)}>{s.label}</span>
              {i < STEPS.length - 1 && <div style={stepperLineStyle(i, step)} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {loadingOptions && (
            <div style={centerMsgStyle}>
              Cargando opciones…
            </div>
          )}
          {errorFetch && !loadingOptions && (
            <div style={{ ...centerMsgStyle, color: "#ef4444" }}>
              ⚠️ {errorFetch}
            </div>
          )}

          {/* Step 0: Servicio */}
          {step === 0 && !loadingOptions && !errorFetch && (
            <div>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              Elegí el servicio que querés reservar:
              </p>
              {servicios.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
                  No hay servicios públicos con reserva online disponibles.
                </p>
              ) : (
                <div style={{ maxHeight: 250, overflowY: "auto" }}>
                  {servicios.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => {
                        setSelectedServicio(svc);
                        setSelectedSucursal(null);
                        setSelectedSlot(null);
                        setSlots([]);
                      }}
                      style={optionStyle(svc.id === selectedServicio?.id)}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {svc.NOMBRE_PUBLICO_SERVICIO || svc.NOMBRE}
                      </div>
                      {svc.DESCRIPCION_BREVE && (
                        <div style={{ fontSize: ".85rem", color: "#6b7280", marginTop: ".2rem" }}>
                          {svc.DESCRIPCION_BREVE}
                        </div>
                      )}
                      {svc.PRECIO_WEB && (
                        <div style={{ fontWeight: 600, color: "#10b981", marginTop: ".3rem" }}>
                          ${Number(svc.PRECIO_WEB).toLocaleString("es-AR")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Sucursal */}
          {step === 1 && !loadingOptions && !errorFetch && (
            <div>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Elegí dónde querés el turno:
              </p>
              {sucursales.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
                  No hay sucursales disponibles.
                </p>
              ) : (
                <div style={{ maxHeight: 250, overflowY: "auto" }}>
                  {sucursales.map((suc) => (
                    <div
                      key={suc.id}
                      onClick={() => {
                        setSelectedSucursal(suc);
                        setSelectedSlot(null);
                        setSlots([]);
                      }}
                      style={optionStyle(suc.id === selectedSucursal?.id)}
                    >
                      <div style={{ fontWeight: 600 }}>
                        📍 {suc.NOMBRE_SUCURSAL || suc.NOMBRE}
                      </div>
                      {(suc.DIRECCION || suc["CALLE Y N°"] || suc.LOCALIDAD) && (
                        <div style={{ fontSize: ".85rem", color: "#6b7280", marginTop: ".2rem" }}>
                          {[suc.DIRECCION || suc["CALLE Y N°"], suc.LOCALIDAD].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Slot */}
          {step === 2 && !loadingOptions && !errorFetch && (
            <div>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Elegí el día y horario:
              </p>
              {slots.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
                  No hay horarios disponibles por el momento.
                </p>
              ) : (
                <div style={{ maxHeight: 250, overflowY: "auto" }}>
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      style={optionStyle(slot.id === selectedSlot?.id)}
                    >
                      <div style={{ fontWeight: 600 }}>
                        🗓️ {fmtDate(slot.FECHA_SLOT)}
                        {" · "}
                        🕐 {fmtTime(slot.HORA_INICIO)} – {fmtTime(slot.HORA_FIN)}
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#6b7280", marginTop: ".2rem" }}>
                        {slot.DURACION_MINUTOS && `${slot.DURACION_MINUTOS} min`}
                        {slot.NOMBRE_PROFESIONAL && ` · Profesional: ${slot.NOMBRE_PROFESIONAL}`}
                        {slot.CAPACIDAD_DISPONIBLE > 0 &&
                          ` · ${slot.CAPACIDAD_DISPONIBLE} turno(s) disponible(s)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmar */}
          {step === 3 && (
            <div>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Revisá los datos de tu turno:
              </p>

              {/* Summary */}
              <div style={summaryStyle}>
                <div style={summaryRow}>
                  <span style={{ color: "#6b7280" }}>Servicio</span>
                  <strong>{selectedServicio?.NOMBRE_PUBLICO_SERVICIO || selectedServicio?.NOMBRE}</strong>
                </div>
                <div style={summaryRow}>
                  <span style={{ color: "#6b7280" }}>Sucursal</span>
                  <strong>{selectedSucursal?.NOMBRE_SUCURSAL || selectedSucursal?.NOMBRE}</strong>
                </div>
                <div style={summaryRow}>
                  <span style={{ color: "#6b7280" }}>Fecha</span>
                  <strong>{fmtDate(selectedSlot?.FECHA_SLOT)}</strong>
                </div>
                <div style={summaryRow}>
                  <span style={{ color: "#6b7280" }}>Horario</span>
                  <strong>
                    {fmtTime(selectedSlot?.HORA_INICIO)} – {fmtTime(selectedSlot?.HORA_FIN)}
                    {selectedSlot?.DURACION_MINUTOS && ` (${selectedSlot.DURACION_MINUTOS} min)`}
                  </strong>
                </div>
                {selectedSlot?.NOMBRE_PROFESIONAL && (
                  <div style={summaryRow}>
                    <span style={{ color: "#6b7280" }}>Profesional</span>
                    <strong>{selectedSlot.NOMBRE_PROFESIONAL}</strong>
                  </div>
                )}
                {selectedServicio?.PRECIO_WEB && (
                  <div style={summaryRow}>
                    <span style={{ color: "#6b7280" }}>Precio</span>
                    <strong style={{ color: "#10b981" }}>
                      ${Number(selectedServicio.PRECIO_WEB).toLocaleString("es-AR")}
                    </strong>
                  </div>
                )}
              </div>

              {/* Dry-run button */}
              {!dryRunResult && !dryRunLoading && (
                <button onClick={runDryRun} style={validateBtn}>
                  🔍 Verificar disponibilidad
                </button>
              )}

              {dryRunLoading && (
                <div style={centerMsgStyle}>
                  Verificando disponibilidad…
                </div>
              )}

              {dryRunError && (
                <div style={resultBox("#fef2f2", "#ef4444")}>
                  ⚠️ Error: {dryRunError}
                </div>
              )}

              {dryRunResult?.disponible && (
                <div style={resultBox("#ecfdf5", "#10b981")}>
                  <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    Turno disponible. Listo para confirmar.
                  </div>
                  <div style={{ fontSize: ".85rem", color: "#6b7280", marginTop: ".5rem" }}>
                    {dryRunResult.nota || dryRunResult.mensaje}
                  </div>
                </div>
              )}

              {/* Boton Confirmar — solo si dry-run fue exitoso y no se confirmo aun */}
              {dryRunResult?.disponible && !confirmResult?.confirmado && !confirmLoading && (
                <button onClick={runConfirm} style={{
                  width: "100%", background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: ".85rem", fontWeight: 700, cursor: "pointer",
                  fontSize: "1rem", marginTop: ".75rem",
                }}>
                  ✅ Confirmar Turno
                </button>
              )}

              {confirmLoading && (
                <div style={centerMsgStyle}>
                  Confirmando turno…
                </div>
              )}

              {confirmError && (
                <div style={resultBox("#fef2f2", "#ef4444")}>
                  ⚠️ Error: {confirmError}
                </div>
              )}

              {confirmResult?.confirmado && (
                <div style={resultBox("#ecfdf5", "#10b981")}>
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    ¡Turno confirmado!
                  </div>
                  <div style={{ fontSize: ".85rem", color: "#6b7280", marginTop: ".5rem" }}>
                    {confirmResult.mensaje}
                  </div>
                  {confirmResult.cita && (
                    <div style={{
                      marginTop: ".75rem", padding: ".75rem",
                      backgroundColor: "#d1fae5", borderRadius: 8,
                      fontSize: ".85rem", textAlign: "left",
                    }}>
                      <div>📋 <strong>{confirmResult.cita.nombre_cita}</strong></div>
                      <div>📅 {confirmResult.cita.fecha_cita} · 🕐 {confirmResult.cita.hora_inicio} – {confirmResult.cita.hora_fin}</div>
                      <div>📍 {confirmResult.sucursal.nombre}</div>
                      <div>💇 {confirmResult.servicio.nombre}</div>
                      {confirmResult.servicio.precio_web && (
                        <div style={{ fontWeight: 600, color: "#10b981", marginTop: ".25rem" }}>
                          ${Number(confirmResult.servicio.precio_web).toLocaleString("es-AR")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {confirmResult && !confirmResult.confirmado && !confirmError && (
                <div style={resultBox("#fef2f2", "#ef4444")}>
                  <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>❌</div>
                  <div style={{ fontWeight: 700 }}>{confirmResult.mensaje}</div>
                  {confirmResult.errores && (
                    <ul style={{ marginTop: ".5rem", paddingLeft: "1.25rem", fontSize: ".85rem", textAlign: "left" }}>
                      {confirmResult.errores.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {dryRunResult && !dryRunResult.disponible && (
                <div style={resultBox("#fef2f2", "#ef4444")}>
                  <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>❌</div>
                  <div style={{ fontWeight: 700 }}>{dryRunResult.mensaje}</div>
                  {dryRunResult.errores && (
                    <ul style={{ marginTop: ".5rem", paddingLeft: "1.25rem", fontSize: ".85rem", textAlign: "left" }}>
                      {dryRunResult.errores.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ fontSize: ".8rem", color: "#6b7280", marginTop: ".75rem" }}>
                    Probá con otra combinación de servicio, sucursal u horario.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div>
            {step > 0 && (
              <button onClick={handleBack} style={secondaryBtn}>
                ← Atrás
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canNext() || loadingOptions}
                style={canNext() && !loadingOptions ? primaryBtn : disabledBtn}
              >
                Siguiente →
              </button>
            ) : (
              !dryRunResult?.disponible && (
                <button onClick={onClose} style={secondaryBtn}>
                  Cerrar
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Inline styles — mobile-first
   =========================================================== */

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 9999,
  backgroundColor: "rgba(0,0,0,.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "1rem",
};

const modalStyle = {
  backgroundColor: "#fff", borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  width: "100%", maxWidth: 520, maxHeight: "90vh",
  display: "flex", flexDirection: "column",
  overflow: "hidden",
};

const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb",
};

const closeBtn = {
  background: "none", border: "none", fontSize: "1.5rem",
  cursor: "pointer", color: "#9ca3af", padding: 0, lineHeight: 1,
};

const stepperStyle = {
  display: "flex", justifyContent: "center", padding: "1rem 0.5rem",
  borderBottom: "1px solid #f3f4f6", gap: 0,
};

const stepperItemStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  position: "relative", flex: 1, maxWidth: 75,
};

const stepperCircleStyle = (i, step) => ({
  width: 32, height: 32, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.85rem",
  backgroundColor: i <= step ? "#10b981" : "#e5e7eb",
  color: i <= step ? "#fff" : "#9ca3af",
  fontWeight: 600, zIndex: 1,
});

const stepperLabelStyle = (i, step) => ({
  fontSize: ".6rem", fontWeight: i === step ? 700 : 400,
  color: i <= step ? "#10b981" : "#9ca3af",
  marginTop: ".25rem", textAlign: "center",
});

const stepperLineStyle = (i, step) => ({
  position: "absolute", top: 16, left: "55%", width: "90%", height: 2,
  backgroundColor: i < step ? "#10b981" : "#e5e7eb",
  zIndex: 0,
});

const contentStyle = {
  flex: 1, overflowY: "auto",
  padding: "1.25rem 1.5rem",
  minHeight: 200,
};

const centerMsgStyle = {
  textAlign: "center", padding: "2rem", color: "#6b7280",
};

const optionStyle = (selected) => ({
  padding: ".75rem 1rem", borderRadius: 10, marginBottom: ".4rem",
  cursor: "pointer", border: selected ? "2px solid #10b981" : "1px solid #e5e7eb",
  backgroundColor: selected ? "#ecfdf5" : "#f9fafb",
  transition: "all .15s",
});

const summaryStyle = {
  backgroundColor: "#f9fafb", borderRadius: 10,
  padding: "1rem", marginBottom: "1rem",
  border: "1px solid #e5e7eb",
};

const summaryRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: ".35rem 0",
  borderBottom: "1px solid #f3f4f6",
  fontSize: ".9rem", gap: "1rem",
};

const primaryBtn = {
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "#fff", border: "none", borderRadius: 8,
  padding: ".6rem 1.25rem", fontWeight: 600, cursor: "pointer",
  fontSize: ".9rem",
};

const secondaryBtn = {
  background: "#f3f4f6", color: "#374151", border: "none",
  borderRadius: 8, padding: ".6rem 1rem",
  fontWeight: 600, cursor: "pointer", fontSize: ".9rem",
};

const disabledBtn = {
  ...secondaryBtn, opacity: 0.5, cursor: "not-allowed",
};

const validateBtn = {
  width: "100%", background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "#fff", border: "none", borderRadius: 10,
  padding: ".85rem", fontWeight: 700, cursor: "pointer",
  fontSize: "1rem", marginTop: ".5rem",
};

const resultBox = (bg, color) => ({
  backgroundColor: bg, borderRadius: 10,
  padding: "1.25rem", marginTop: ".75rem",
  border: `1px solid ${color}`, color,
  textAlign: "center",
});

const footerStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb",
};
