import { useState } from "react";
import { Link } from "react-router-dom";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ForgotPassword() {
  const { config } = useBrandConfig();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const brandInitials = config.brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status >= 400 && res.status !== 500) {
          setError(data.detail || "Error al procesar la solicitud.");
        } else {
          setError("Error interno del servidor.");
        }
        return;
      }

      setSent(true);
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
            {sent ? "Solicitud enviada" : "Recuperar contrasena"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Email</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="tu@email.com" autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
            )}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
              {submitting ? "Enviando..." : "Enviar instrucciones"}
            </PrimaryButton>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <span className="text-2xl">✉</span>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--brand-text)" }}>
              Si el email esta registrado, recibiras instrucciones para recuperar tu contrasena.
            </p>
            <p className="text-xs mb-6 opacity-60" style={{ color: "var(--brand-text-secondary)" }}>
              Revisa tu bandeja de entrada y carpeta de spam.
            </p>
          </div>
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
