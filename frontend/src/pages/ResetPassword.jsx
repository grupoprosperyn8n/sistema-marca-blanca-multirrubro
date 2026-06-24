import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { config } = useBrandConfig();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const brandInitials = config.brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperacion no encontrado. Usa el enlace de tu email.");
      return;
    }
    if (!password) {
      setError("La contrasena es obligatoria.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    if (password.length < 7) {
      setError("La contrasena debe tener al menos 7 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Error al restablecer la contrasena.");
        return;
      }

      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("Error de conexion. Verifica que el servidor este disponible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
          >
            {brandInitials}
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--brand-text)" }}>{config.brandName}</h1>
          <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>
            {done ? "Contrasena actualizada" : "Nueva contrasena"}
          </p>
        </div>

        {!token && !done ? (
          <div className="text-center py-4">
            <p className="text-sm text-rose-500 bg-rose-50 px-4 py-3 rounded-lg border border-rose-200">
              Enlace de recuperacion invalido. Solicita uno nuevo desde la pagina de inicio de sesion.
            </p>
          </div>
        ) : done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm mb-2" style={{ color: "var(--brand-text)" }}>
              Contrasena actualizada exitosamente.
            </p>
            <p className="text-xs opacity-60" style={{ color: "var(--brand-text-secondary)" }}>
              Seras redirigido al inicio de sesion...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Nueva contrasena</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Minimo 7 caracteres" autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Confirmar contrasena</label>
              <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repeti tu contrasena" autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
            )}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
              {submitting ? "Actualizando..." : "Cambiar contrasena"}
            </PrimaryButton>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-primary)" }}>
            Volver al inicio de sesion
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
