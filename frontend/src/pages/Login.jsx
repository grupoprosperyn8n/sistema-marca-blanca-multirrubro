import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBrandConfig } from "../context/BrandConfigContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const TABS = {
  CLIENTE: "cliente",
  REGISTER: "register",
  STAFF: "staff",
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, debeCambiar } = useAuth();
  const { config } = useBrandConfig();

  // Determinar tab inicial
  const initialTab = searchParams.get("tab") === "register"
    ? TABS.REGISTER
    : searchParams.get("tab") === "staff"
      ? TABS.STAFF
      : TABS.CLIENTE;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Si ya tiene cookie y debe cambiar, redirigir directo sin mostrar login
  useEffect(() => {
    if (!loading && debeCambiar) {
      navigate("/force-password-change", { replace: true });
    }
  }, [loading, debeCambiar, navigate]);

  // ── Login shared (tabs Soy cliente + Acceso autorizado) ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Registro (tab Cliente nuevo) ──
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regError, setRegError] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const registered = searchParams.get("registered") === "1";

  const brandInitials = config.brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }
    if (!password) {
      setError("Ingresa tu contrasena");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      const user = result.user || result;
      const debeCambiarPwd = result.debeCambiar || false;

      if (debeCambiarPwd) {
        navigate("/force-password-change", { state: { email: email.trim() } });
        return;
      }

      const userRole = user?.rol || "";
      if (userRole === "CLIENTE") {
        navigate("/portal");
      } else if (userRole === "PROFESIONAL") {
        navigate("/profesional");
      } else {
        navigate("/backoffice");
      }
    } catch (err) {
      if (err.status === 401) {
        setError(err.detail || "Credenciales invalidas. Verifica tu email y contrasena.");
      } else if (err.status === 403) {
        setError(err.detail || "Acceso denegado. Contacta al administrador.");
      } else if (err.status === 423) {
        setError(err.detail || "Cuenta bloqueada. Contacta al administrador.");
      } else if (err.status === 0 || !err.status) {
        setError("Error de conexion. Verifica que el servidor este disponible.");
      } else if (err.status === 500) {
        setError("Error interno del servidor. Intenta de nuevo mas tarde.");
      } else {
        setError(err.detail || "Error al iniciar sesion. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");

    if (!regNombre.trim()) {
      setRegError("El nombre es obligatorio.");
      return;
    }
    if (!regEmail.trim()) {
      setRegError("El email es obligatorio.");
      return;
    }
    if (!regPassword) {
      setRegError("La contraseña es obligatoria.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Las contraseñas no coinciden.");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: regNombre.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          confirm_password: regConfirm,
          telefono: regTelefono.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status >= 400 && res.status !== 500) {
          setRegError(data.detail || "Error al crear la cuenta.");
        } else {
          setRegError("Error interno del servidor. Intenta de nuevo.");
        }
        return;
      }

      // Éxito: mostrar mensaje, pre-llenar email y ofrecer ir a login
      setRegSuccess(true);
      setEmail(regEmail.trim().toLowerCase());
    } catch (err) {
      setRegError("Error de conexion. Verifica que el servidor este disponible.");
    } finally {
      setRegSubmitting(false);
    }
  };

  const switchToClientLogin = () => {
    setActiveTab(TABS.CLIENTE);
    setRegSuccess(false);
    setError("");
  };

  const tabs = [
    { key: TABS.CLIENTE, label: "Soy cliente" },
    { key: TABS.REGISTER, label: "Cliente nuevo" },
    { key: TABS.STAFF, label: "Acceso autorizado" },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        {/* Header común */}
        <div className="text-center mb-5">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
          >
            {brandInitials}
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--brand-text)" }}>{config.brandName}</h1>
        </div>

        {/* ── 3 Tabs ── */}
        <div className="flex rounded-lg p-0.5 mb-5" style={{ background: "rgba(var(--brand-primary-rgb, 59 130 246), 0.06)" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setError(""); setRegError(""); setRegSuccess(false); }}
                className={`flex-1 text-[11px] sm:text-xs font-medium py-2.5 px-1 rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-white shadow-sm"
                    : "hover:bg-white/40"
                }`}
                style={{
                  color: isActive ? "var(--brand-primary)" : "var(--brand-text-secondary)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: Soy cliente ── */}
        {activeTab === TABS.CLIENTE && (
          <>
            <p className="text-xs text-center mb-4 opacity-60" style={{ color: "var(--brand-text-secondary)" }}>
              Ingresá a tu portal de cliente
            </p>

            {registered && (
              <div className="mb-4 px-4 py-3 rounded-lg text-xs font-medium" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                Cuenta creada exitosamente. Inicia sesion con tu email y contrasena.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@email.com" autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Contrasena</label>
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
              </div>

              {error && (
                <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
              )}

              <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
                {submitting ? "Ingresando..." : "Ingresar"}
              </PrimaryButton>

              <div className="text-center">
                <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-primary)" }}>
                  Olvidaste tu contrasena?
                </Link>
              </div>
            </form>

            <p className="text-xs text-center mt-5 opacity-30" style={{ color: "var(--brand-text)" }}>
              {config.brandName} · Portal de cliente
            </p>
          </>
        )}

        {/* ── TAB: Cliente nuevo ── */}
        {activeTab === TABS.REGISTER && (
          <>
            <p className="text-xs text-center mb-4 opacity-60" style={{ color: "var(--brand-text-secondary)" }}>
              Creá tu cuenta de cliente
            </p>

            {regSuccess ? (
              <div className="space-y-4">
                <div className="px-4 py-4 rounded-lg text-xs font-medium text-center" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                  ¡Cuenta creada exitosamente! 🎉
                  <br />
                  <span className="opacity-75">Ya podés iniciar sesión con tu email y contraseña.</span>
                </div>

                <PrimaryButton type="button" onClick={switchToClientLogin} className="w-full justify-center text-base">
                  Ir al login de cliente
                </PrimaryButton>

                <p className="text-xs text-center opacity-20" style={{ color: "var(--brand-text)" }}>
                  Tu email <strong>{email}</strong> ya está listo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Nombre completo *</label>
                  <input type="text" value={regNombre} onChange={(e) => { setRegNombre(e.target.value); setRegError(""); }}
                    placeholder="Tu nombre y apellido" autoComplete="name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Email *</label>
                  <input type="email" value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegError(""); }}
                    placeholder="tu@email.com" autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Contraseña *</label>
                  <input type="password" value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setRegError(""); }}
                    placeholder="Minimo 7 caracteres, 1 letra y 1 numero" autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Confirmar contraseña *</label>
                  <input type="password" value={regConfirm} onChange={(e) => { setRegConfirm(e.target.value); setRegError(""); }}
                    placeholder="Repeti tu contrasena" autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Telefono</label>
                  <input type="tel" value={regTelefono} onChange={(e) => { setRegTelefono(e.target.value); setRegError(""); }}
                    placeholder="+54 11 1234-5678" autoComplete="tel"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
                </div>

                {regError && (
                  <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{regError}</p>
                )}

                <PrimaryButton type="submit" disabled={regSubmitting} className="w-full justify-center text-base">
                  {regSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                </PrimaryButton>
              </form>
            )}

            <p className="text-xs text-center mt-5 opacity-30" style={{ color: "var(--brand-text)" }}>
              {config.brandName} · Registro de cliente
            </p>
          </>
        )}

        {/* ── TAB: Acceso autorizado ── */}
        {activeTab === TABS.STAFF && (
          <>
            <p className="text-xs text-center mb-4 opacity-60" style={{ color: "var(--brand-text-secondary)" }}>
              Acceso para equipo autorizado
            </p>

            <div className="mb-4 px-4 py-2.5 rounded-lg text-[10px] text-center" style={{ background: "rgba(var(--brand-primary-rgb, 59 130 246), 0.05)", border: "1px solid rgba(var(--brand-primary-rgb, 59 130 246), 0.12)" }}>
              <span style={{ color: "var(--brand-text-secondary)" }}>
                Administrador · Gerente · Recepción · Profesional · Solo lectura
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@email.com" autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-text)" }}>Contrasena</label>
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur text-sm" />
              </div>

              {error && (
                <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">{error}</p>
              )}

              <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center text-base">
                {submitting ? "Ingresando..." : "Ingresar"}
              </PrimaryButton>

              <div className="text-center">
                <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-primary)" }}>
                  Olvidaste tu contrasena?
                </Link>
              </div>
            </form>

            <p className="text-xs text-center mt-5 opacity-30" style={{ color: "var(--brand-text)" }}>
              {config.brandName} · Acceso equipo autorizado
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}
