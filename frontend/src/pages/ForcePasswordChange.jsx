import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useBrandConfig();
  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API = import.meta.env.VITE_API_BASE_URL || "";
  const [checking, setChecking] = useState(true);

  // Guard: verificar que realmente DEBE cambiar contraseña
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setChecking(false);
        if (!data) {
          navigate("/login", { replace: true });
        } else if (!data.debe_cambiar_password) {
          const rol = data.rol || "";
          if (rol === "CLIENTE") navigate("/portal", { replace: true });
          else if (rol === "PROFESIONAL") navigate("/profesional", { replace: true });
          else navigate("/backoffice", { replace: true });
        }
      })
      .catch(() => { setChecking(false); navigate("/login", { replace: true }); });
  }, []);

  if (checking) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
        style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) { setError("Ingresa tu nueva contraseña"); return; }
    if (newPassword.length < 7) { setError("La contraseña debe tener al menos 7 caracteres"); return; }
    if (!/[a-zA-Z]/.test(newPassword)) { setError("Debe contener al menos 1 letra"); return; }
    if (!/[0-9]/.test(newPassword)) { setError("Debe contener al menos 1 número"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: "", new_password: newPassword, confirm_password: confirmPassword }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al cambiar la contraseña");

      setSuccess("Contraseña actualizada. Redirigiendo...");
      setTimeout(() => {
        // Full reload: AuthContext re-fetches /me y setea usuario correctamente
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--brand-text)" }}>Cambio de contraseña obligatorio</h1>
          <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>
            Por razones de seguridad, debés cambiar tu contraseña antes de continuar.
          </p>
          {email && <p className="text-sm font-medium mt-2" style={{ color: "var(--brand-primary)" }}>{email}</p>}
        </div>

        {success ? (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Nueva contraseña</label>
              <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Mínimo 7 caracteres, letras y números" autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Confirmar contraseña</label>
              <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repetí la contraseña" autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
            </div>

            <div className="text-xs space-y-1" style={{ color: "var(--brand-text-secondary)" }}>
              <p>• Mínimo 7 caracteres</p>
              <p>• Al menos 1 letra y 1 número</p>
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
            )}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
              {submitting ? "Cambiando..." : "Cambiar contraseña"}
            </PrimaryButton>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-primary)" }}>
            Volver al login
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
