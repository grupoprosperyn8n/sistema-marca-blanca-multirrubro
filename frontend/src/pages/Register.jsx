import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function Register() {
  const navigate = useNavigate();
  const { config } = useBrandConfig();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const brandInitials = config.brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!email.trim()) {
      setError("El email es obligatorio.");
      return;
    }
    if (!password) {
      setError("La contraseña es obligatoria.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
          telefono: telefono.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status >= 400 && res.status !== 500) {
          setError(data.detail || "Error al crear la cuenta.");
        } else {
          setError("Error interno del servidor. Intenta de nuevo.");
        }
        return;
      }

      navigate("/login?registered=1");
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
          <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>Crear cuenta de cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Nombre completo *</label>
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(""); }}
              placeholder="Tu nombre y apellido" autoComplete="name"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Email *</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="tu@email.com" autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Contraseña *</label>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Minimo 7 caracteres, 1 letra y 1 numero" autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Confirmar contraseña *</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Repeti tu contrasena" autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Telefono</label>
            <input type="tel" value={telefono} onChange={(e) => { setTelefono(e.target.value); setError(""); }}
              placeholder="+54 11 1234-5678" autoComplete="tel"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
          )}

          <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </PrimaryButton>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-primary)" }}>
            Ya tenes cuenta? Inicia sesion
          </Link>
        </div>

        <p className="text-xs text-center mt-6 opacity-30" style={{ color: "var(--brand-text)" }}>
          {config.brandName} · Registro de cliente
        </p>
      </GlassCard>
    </div>
  );
}
