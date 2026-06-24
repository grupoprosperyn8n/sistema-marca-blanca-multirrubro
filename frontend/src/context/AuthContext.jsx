import { createContext, useContext, useState, useCallback, useEffect } from "react";

// Roles mapeados 1:1 con backend ROLES table (NOMBRE_ROL)
export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  GERENTE: "GERENTE",
  EMPLEADO_GESTION: "EMPLEADO_GESTION",
  PROFESIONAL: "PROFESIONAL",
  SOLO_LECTURA: "SOLO_LECTURA",
  CLIENTE: "CLIENTE",
  PUBLICO: "PUBLICO",
};

// Permisos por rol (sin cambios)
const PERMISOS = {
  [ROLES.ADMINISTRADOR]: {
    backoffice: true, configuracion: true, sucursales: true,
    servicios: true, clientes: true, agenda: true, citas: true,
    editar: true, verAdministrativo: true, usuarios: true,
  },
  [ROLES.GERENTE]: {
    backoffice: true, configuracion: false, sucursales: true,
    servicios: true, clientes: true, agenda: true, citas: true,
    editar: true, verAdministrativo: false,
  },
  [ROLES.EMPLEADO_GESTION]: {
    backoffice: true, configuracion: false, sucursales: false,
    servicios: true, clientes: true, agenda: true, citas: true,
    editar: false, verAdministrativo: false,
  },
  [ROLES.PROFESIONAL]: {
    backoffice: true, configuracion: false, sucursales: false,
    servicios: false, clientes: false, agenda: true, citas: true,
    editar: false, verAdministrativo: false,
  },
  [ROLES.SOLO_LECTURA]: {
    backoffice: true, configuracion: true, sucursales: true,
    servicios: true, clientes: true, agenda: true, citas: true,
    editar: false, verAdministrativo: true,
  },
  [ROLES.CLIENTE]: {
    backoffice: false, configuracion: false, sucursales: false,
    servicios: false, clientes: false, agenda: false, citas: false,
    editar: false, verAdministrativo: false, portal: true,
  },
  [ROLES.PUBLICO]: {
    backoffice: false, configuracion: false, sucursales: false,
    servicios: false, clientes: false, agenda: false, citas: false,
    editar: false, verAdministrativo: false,
  },
};

// Links de navegacion por rol (sin cambios)
export function getNavLinks(role) {
  if (role === ROLES.CLIENTE) {
    return [
      { to: "/portal", label: "Mi Portal" },
      { to: "/catalogo", label: "Catalogo" },
      { to: "/reserva", label: "Reserva" },
    ];
  }
  if (role === ROLES.PUBLICO) {
    return [
      { to: "/", label: "Inicio" },
      { to: "/catalogo", label: "Catalogo" },
      { to: "/reserva", label: "Reserva" },
    ];
  }
  const p = PERMISOS[role] || PERMISOS[ROLES.PUBLICO];
  const links = [{ to: "/backoffice", label: "Dashboard" }];
  if (p.sucursales) links.push({ to: "/backoffice/sucursales", label: "Sucursales" });
  if (p.servicios) links.push({ to: "/backoffice/servicios", label: "Servicios" });
  if (p.clientes) links.push({ to: "/backoffice/clientes", label: "Clientes" });
  if (p.agenda) links.push({ to: "/backoffice/agenda", label: "Agenda" });
  if (p.citas) links.push({ to: "/backoffice/citas", label: "Citas" });
  if (p.configuracion) links.push({ to: "/backoffice/configuracion", label: "Configuracion" });
  if (role === ROLES.ADMINISTRADOR) links.push({ to: "/backoffice/usuarios", label: "Usuarios" });
  return links;
}

export function getDashboardCards(role) {
  const p = PERMISOS[role] || PERMISOS[ROLES.PUBLICO];
  const cards = [];
  if (p.sucursales) cards.push({ title: "Sucursales", desc: "Unidades operativas activas", to: "/backoffice/sucursales" });
  if (p.servicios) cards.push({ title: "Servicios", desc: "Catalogo de servicios activos", to: "/backoffice/servicios" });
  if (p.clientes) cards.push({ title: "Clientes", desc: "Base de clientes registrados", to: "/backoffice/clientes" });
  if (p.agenda) cards.push({ title: "Agenda", desc: "Slots y disponibilidad", to: "/backoffice/agenda" });
  if (p.citas) cards.push({ title: "Citas", desc: "Citas programadas", to: "/backoffice/citas" });
  if (p.configuracion) cards.push({ title: "Configuracion", desc: "Parametros del sistema", to: "/backoffice/configuracion" });
  if (role === ROLES.ADMINISTRADOR) cards.push({ title: "Usuarios", desc: "Gestion de cuentas y accesos", to: "/backoffice/usuarios" });
  return cards;
}

export function canAccess(role, permiso) {
  const p = PERMISOS[role] || PERMISOS[ROLES.PUBLICO];
  return !!p[permiso];
}

// Contexto
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const API = import.meta.env.VITE_API_BASE_URL || "";
  const [usuario, setUsuario] = useState(null);
  const [debeCambiar, setDebeCambiar] = useState(false);
  const [role, setRole] = useState(ROLES.PUBLICO);
  const [loading, setLoading] = useState(true);

  // Verificar sesion existente al montar (cookie HttpOnly via /me)
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          // FASE_2D: si debe_cambiar_password, no setear usuario (forzar al flow de cambio)
          if (data.debe_cambiar_password) {
            setUsuario(null);
            setRole(ROLES.PUBLICO);
            setDebeCambiar(true);
          } else {
            setDebeCambiar(false);
            setUsuario(data);
            setRole(data.rol || ROLES.PUBLICO);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!res.ok) {
      let detail = "Error de autenticacion";
      try {
        const errData = await res.json();
        detail = errData.detail || detail;
      } catch (_) {}
      const error = new Error(detail);
      error.status = res.status;
      error.detail = detail;
      throw error;
    }

    const data = await res.json();
    const user = data.user || data.usuario || data;
    const debeCambiar = data.debe_cambiar_password || false;
    // Solo setear usuario si NO debe cambiar (no esta autenticado hasta cambiar)
    if (!debeCambiar) {
      setUsuario(user);
      setRole(user.rol || ROLES.PUBLICO);
    }
    return { user, debeCambiar, estado_acceso: data.estado_acceso || "" };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    setUsuario(null);
    setRole(ROLES.PUBLICO);
  }, []);

  const permisos = PERMISOS[role] || PERMISOS[ROLES.PUBLICO];

  return (
    <AuthContext.Provider value={{ role, usuario, permisos, login, logout, loading, ROLES, debeCambiar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
