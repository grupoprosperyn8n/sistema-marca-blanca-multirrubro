import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, ROLES, canAccess } from "./context/AuthContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import BackofficeLayout from "./layouts/BackofficeLayout";
import ProfessionalLayout from "./layouts/ProfessionalLayout";

// Public pages
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Productos from "./pages/Productos";
import Reserva from "./pages/Reserva";
import SucursalesPublicas from "./pages/SucursalesPublicas";
import ServicioDetalle from "./pages/ServicioDetalle";
import ProductoDetalle from "./pages/ProductoDetalle";
import Carrito from "./pages/Carrito";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import UsersAdmin from "./pages/UsersAdmin";

// Backoffice
import Backoffice from "./pages/Backoffice";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Sucursales from "./pages/Sucursales";
import Citas from "./pages/Citas";
import Configuracion from "./pages/Configuracion";

// Professional
import Profesional from "./pages/Profesional";

// Portal Cliente
import PortalLayout from "./layouts/PortalLayout";
import PortalCliente from "./pages/PortalCliente";

// Roles con acceso a gestion
const ROLES_GESTION = [ROLES.ADMINISTRADOR, ROLES.GERENTE, ROLES.EMPLEADO_GESTION, ROLES.SOLO_LECTURA];
const ROLES_BACKOFFICE = [...ROLES_GESTION, ROLES.PROFESIONAL];

function ProtectedRoute({ children, roles, module, action = "view" }) {
  const { role, usuario, permisos, access, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--brand-surface,#f8f9ff)]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>;
  }
  if (!usuario) return <Navigate to="/login" replace />;
  if (!permisos?.backoffice && !permisos?.agenda && !permisos?.portal) return <Navigate to="/" replace />;
  if (roles && !roles.includes(role)) {
    if (role === ROLES.PROFESIONAL) return <Navigate to="/profesional" replace />;
    if (role === ROLES.CLIENTE) return <Navigate to="/portal" replace />;
    return <Navigate to="/" replace />;
  }
  if (module && !canAccess(role, module, access, action)) {
    return <Navigate to="/backoffice" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/reserva" element={<Reserva />} />
        <Route path="/sucursales" element={<SucursalesPublicas />} />
        <Route path="/servicios/:slug" element={<ServicioDetalle />} />
        <Route path="/productos/:slug" element={<ProductoDetalle />} />

        {/* Legacy redirects — URLs that users commonly try */}
        <Route path="/servicios" element={<Navigate to="/catalogo" replace />} />
        <Route path="/reservar" element={<Navigate to="/reserva" replace />} />
        <Route path="/acceder" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/force-password-change" element={<ForcePasswordChange />} />
      </Route>

      <Route element={<ProtectedRoute roles={ROLES_BACKOFFICE}><BackofficeLayout /></ProtectedRoute>}>
        <Route path="/backoffice" element={<Backoffice />} />
        <Route path="/backoffice/agenda" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="agenda"><Agenda /></ProtectedRoute>} />
        <Route path="/backoffice/citas" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="citas"><Citas /></ProtectedRoute>} />
      </Route>

      <Route element={<ProtectedRoute roles={ROLES_BACKOFFICE}><BackofficeLayout /></ProtectedRoute>}>
        <Route path="/backoffice/usuarios" element={<ProtectedRoute roles={[ROLES.ADMINISTRADOR]} module="usuarios"><UsersAdmin /></ProtectedRoute>} />
      </Route>

      <Route element={<ProtectedRoute roles={ROLES_BACKOFFICE}><BackofficeLayout /></ProtectedRoute>}>
        <Route path="/backoffice/clientes" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/backoffice/servicios" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="servicios"><Servicios /></ProtectedRoute>} />
      </Route>

      <Route element={<ProtectedRoute roles={ROLES_BACKOFFICE}><BackofficeLayout /></ProtectedRoute>}>
        <Route path="/backoffice/sucursales" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="sucursales"><Sucursales /></ProtectedRoute>} />
      </Route>

      <Route element={<ProtectedRoute roles={ROLES_BACKOFFICE}><BackofficeLayout /></ProtectedRoute>}>
        <Route path="/backoffice/configuracion" element={<ProtectedRoute roles={ROLES_BACKOFFICE} module="configuracion"><Configuracion /></ProtectedRoute>} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.PROFESIONAL, ROLES.ADMINISTRADOR, ROLES.GERENTE]}><ProfessionalLayout /></ProtectedRoute>}>
        <Route path="/profesional" element={<Profesional />} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.CLIENTE, ROLES.ADMINISTRADOR]}><PortalLayout /></ProtectedRoute>}>
        <Route path="/portal" element={<PortalCliente />} />
        <Route path="/carrito" element={<Carrito />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
