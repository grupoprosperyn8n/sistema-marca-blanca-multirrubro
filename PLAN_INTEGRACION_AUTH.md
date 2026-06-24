# PLAN DE INTEGRACIÓN — Sistema de Autenticación en static/index.html

> **Proyecto:** Gestión de Salones de Belleza  
> **Archivo destino:** `static/index.html` (2458 líneas, monolítico)  
> **Diseño de referencia:** `AUTH_SYSTEM_DESIGN.md` (1993 líneas)  
> **Fecha:** 2026-06-02  
> **Modo:** MVP Demo — autenticación simulada con localStorage (sin tokens reales)

---

## 1. CAMBIOS A `static/index.html`

### 1.1 Pantalla de Login (HTML + CSS + JS)

#### 1.1.1 HTML — Insertar bloque `#login-screen`

Insertar **DESPUÉS** de `<body>` y **ANTES** del `<aside class="sidebar">` actual:

```html
<!-- ====== LOGIN SCREEN ====== -->
<div id="login-screen" class="login-screen">
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">💇</div>
      <h1 class="login-title">Salón Pro</h1>
      <p class="login-subtitle">Gestión integral de salones de belleza</p>
      <form id="login-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input type="email" id="login-email" class="form-input" placeholder="tu@email.com" required autocomplete="email">
          <div class="form-error-msg" id="login-email-error"></div>
        </div>
        <button type="submit" id="login-btn" class="btn-primary" style="width:100%; margin-top:8px;">
          <span id="login-btn-text">🚪 Ingresar</span>
          <span id="login-btn-spinner" class="hidden">⏳ Verificando...</span>
        </button>
      </form>
      <div id="login-error" class="login-error hidden"></div>
      <div id="login-demo-hint" class="login-demo-hint">
        <p><strong>Demo:</strong> Usá uno de estos emails:</p>
        <ul>
          <li>admin@salonpro.com (Administrador)</li>
          <li>gerente@salonpro.com (Gerente)</li>
          <li>carlos@salonpro.com (Empleado Gestión)</li>
          <li>ana@salonpro.com (Profesional)</li>
        </ul>
      </div>
    </div>
    <div class="login-footer">🏪 Salón Pro v2.0 · MVP Demo</div>
  </div>
</div>
```

#### 1.1.2 CSS — Agregar bloque de estilos para login

Insertar **ANTES** de `</style>` (dentro del `<style>` existente):

```css
/* ===== LOGIN SCREEN ===== */
.login-screen {
  position: fixed; inset: 0; z-index: 5000;
  background: linear-gradient(135deg, #1e1815 0%, #2a2220 100%);
  display: flex; align-items: center; justify-content: center;
}
.login-screen.hidden { display: none; }

.login-container {
  text-align: center; width: 100%; max-width: 380px; padding: 24px;
}
.login-card {
  background: var(--surface); border-radius: var(--radius);
  padding: 32px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.login-logo { font-size: 48px; margin-bottom: 8px; }
.login-title { font-size: 24px; font-weight: 800; color: var(--text); margin: 0; }
.login-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 24px; }

.login-error {
  margin-top: 12px; padding: 10px 14px;
  background: #fce4ec; border-radius: var(--radius-sm);
  color: var(--danger); font-size: 13px; font-weight: 500;
}
.login-error.hidden { display: none; }

.login-demo-hint {
  margin-top: 20px; padding: 14px; border: 1px dashed var(--border);
  border-radius: var(--radius-sm); text-align: left; font-size: 12px;
  color: var(--text-secondary); background: var(--bg);
}
.login-demo-hint p { margin: 0 0 6px; font-weight: 600; }
.login-demo-hint ul { margin: 0; padding-left: 18px; }
.login-demo-hint li { margin-bottom: 3px; }

.login-footer {
  margin-top: 24px; font-size: 11px; color: rgba(255,255,255,0.35);
}

/* ===== APP CONTAINER ===== */
#app-container.hidden { display: none; }

/* ===== HEADER WITH USER ===== */
.header-user {
  display: flex; align-items: center; gap: 10px;
  position: fixed; top: 0; right: 0; z-index: 100;
  padding: 8px 16px; background: var(--surface);
  border-bottom: 1px solid var(--border);
  border-left: 1px solid var(--border);
  border-radius: 0 0 0 var(--radius);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
@media (max-width: 1023px) {
  .header-user {
    top: auto; bottom: 0; left: 0; right: 0;
    border-radius: var(--radius) var(--radius) 0 0;
    border-left: none; border-right: none;
    border-bottom: none; border-top: 1px solid var(--border);
    z-index: 86; padding: 6px 14px;
  }
}

.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--accent-light); display: flex;
  align-items: center; justify-content: center;
  font-weight: 700; color: var(--accent); font-size: 14px;
  overflow: hidden; flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.user-info { display: flex; flex-direction: column; min-width: 0; }
.user-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role-badge {
  font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 10px;
  white-space: nowrap; margin-top: 1px; display: inline-block; width: fit-content;
}

/* Logout button in header */
.header-user .logout-header-btn {
  background: none; border: none; font-size: 18px; cursor: pointer;
  padding: 4px 6px; border-radius: 50%; color: var(--text-secondary);
  transition: background 0.15s; margin-left: 4px;
}
.header-user .logout-header-btn:hover { background: var(--danger-light, #fce4ec); color: var(--danger); }

/* ===== CONFIRM MODAL ===== */
.confirm-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.confirm-modal {
  background: var(--surface); border-radius: var(--radius);
  padding: 28px 24px; max-width: 360px; width: 90%;
  text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.confirm-icon { font-size: 40px; margin-bottom: 12px; }
.confirm-modal h3 { margin: 0 0 8px; font-size: 17px; }
.confirm-modal p { color: var(--text-secondary); font-size: 14px; margin: 0 0 16px; }
.confirm-detail { font-size: 12px; color: var(--text-muted); font-style: italic; }
.confirm-actions { display: flex; gap: 8px; }
.confirm-actions .btn-cancel {
  flex: 1; padding: 10px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--bg);
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: var(--font);
}
.confirm-actions .btn-danger {
  flex: 1; padding: 10px; border: none;
  border-radius: var(--radius-sm); background: var(--danger);
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: var(--font);
}
```

#### 1.1.3 JS — Funciones de autenticación

Agregar dentro del bloque `<script>` que contiene `(function(){ ... })()`, **ANTES** de las funciones existentes (como `showLoading`, `showError`, etc.):

```javascript
// ═══════════════════════════════════════════
// AUTH SYSTEM — Estado Global
// ═══════════════════════════════════════════
const AUTH_SESSION_TTL = 8 * 3600 * 1000; // 8 horas

let authState = {
  isAuthenticated: false,
  user: null,         // { id, nombre, email, avatar, empleadoId }
  role: null,         // { id, nombre, nivel, color, dashboard }
  permissions: {
    modules: [],      // Array de permisos de módulo
    fields: []        // Array de permisos de campo
  },
  menu: [],           // Estructura de menú [ { category, icon, items } ]
  sessionStarted: null
};

// ═══════════════════════════════════════════
// HELPERS DE SESIÓN (localStorage)
// ═══════════════════════════════════════════
function loadSession() {
  try {
    const raw = localStorage.getItem('salonpro_session');
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function saveSession() {
  const sess = {
    user: authState.user,
    role: authState.role,
    permissions: authState.permissions,
    menu: authState.menu,
    sessionStarted: authState.sessionStarted || Date.now()
  };
  localStorage.setItem('salonpro_session', JSON.stringify(sess));
}

function clearSession() {
  localStorage.removeItem('salonpro_session');
  authState = {
    isAuthenticated: false,
    user: null, role: null,
    permissions: { modules: [], fields: [] },
    menu: [],
    sessionStarted: null
  };
}

function isSessionExpired(session) {
  if (!session || !session.sessionStarted) return true;
  return (Date.now() - session.sessionStarted) > AUTH_SESSION_TTL;
}

function restoreAuthState(session) {
  authState.isAuthenticated = true;
  authState.user = session.user;
  authState.role = session.role;
  authState.permissions = session.permissions;
  authState.menu = session.menu;
  authState.sessionStarted = session.sessionStarted;
}

// ═══════════════════════════════════════════
// HELPERS DE PARSEO (Airtable Linked Records)
// ═══════════════════════════════════════════
function extractLinkedId(field) {
  if (!field) return null;
  if (Array.isArray(field) && field.length > 0) {
    return typeof field[0] === 'string' ? field[0] : field[0].id;
  }
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field.id) return field.id;
  return null;
}

function linkedIncludes(linkedField, targetId) {
  if (!linkedField || !targetId) return false;
  if (Array.isArray(linkedField)) {
    return linkedField.some(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id === targetId;
    });
  }
  return typeof linkedField === 'string' && linkedField === targetId;
}

// ═══════════════════════════════════════════
// API DE AIRTABLE — Autenticación (Modo MVP)
// ═══════════════════════════════════════════

// Datos de usuarios DEMO hardcodeados (MVP, sin tablas Airtable reales de auth)
const DEMO_USERS = [
  { id: 'usr_admin',  nombre: 'Diego López',     email: 'admin@salonpro.com',    avatar: null, empleadoId: null, rolId: 'rol_admin' },
  { id: 'usr_gerente', nombre: 'María García',   email: 'gerente@salonpro.com',   avatar: null, empleadoId: null, rolId: 'rol_gerente' },
  { id: 'usr_emp_gest', nombre: 'Carlos Rodríguez', email: 'carlos@salonpro.com',   avatar: null, empleadoId: null, rolId: 'rol_emp_gest' },
  { id: 'usr_prof',    nombre: 'Ana Martínez',   email: 'ana@salonpro.com',       avatar: null, empleadoId: null, rolId: 'rol_prof' }
];

const DEMO_ROLES = {
  'rol_admin':     { id: 'rol_admin',     nombre: 'Administrador',    nivel: 1, color: '#c97b5d', dashboard: 'dashboard' },
  'rol_gerente':   { id: 'rol_gerente',   nombre: 'Gerente',          nivel: 2, color: '#5b8c5a', dashboard: 'dashboard' },
  'rol_emp_gest':  { id: 'rol_emp_gest',  nombre: 'Empleado Gestión', nivel: 3, color: '#5b8c5a', dashboard: 'citas' },
  'rol_prof':      { id: 'rol_prof',      nombre: 'Profesional',      nivel: 4, color: '#d4954a', dashboard: 'agenda' }
};

// Permisos DEMO por módulo
const DEMO_MODULE_PERMISSIONS = {
  'rol_admin': [
    { Modulo: 'dashboard',      Visible: true, Crear: false, Leer: true, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'clientes',       Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'citas',          Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'servicios',      Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'empleados',      Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'proveedores',    Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'productos',      Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'inventario',     Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'promociones',    Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'agenda',         Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'reportes',       Visible: true, Crear: false, Leer: true, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'capacitaciones', Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'ficha_servicios',Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'costos_fijos',   Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'resumen_costos', Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'ingresos_egresos',Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'usuarios',       Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' },
    { Modulo: 'roles',          Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: true,  Alcance_Datos: 'todo' }
  ],
  'rol_gerente': [
    { Modulo: 'dashboard',      Visible: true, Crear: false, Leer: true, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'clientes',       Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'citas',          Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'servicios',      Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'empleados',      Visible: true, Crear: false, Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'proveedores',    Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'productos',      Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'inventario',     Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'promociones',    Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'agenda',         Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'reportes',       Visible: true, Crear: false, Leer: true, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'capacitaciones', Visible: true, Crear: true,  Leer: true, Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ficha_servicios',Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'costos_fijos',   Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'resumen_costos', Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ingresos_egresos',Visible: true, Crear: false, Leer: true, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'usuarios',       Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'roles',          Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' }
  ],
  'rol_emp_gest': [
    { Modulo: 'dashboard',      Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'clientes',       Visible: true,  Crear: true,  Leer: true,  Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'citas',          Visible: true,  Crear: true,  Leer: true,  Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'servicios',      Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'empleados',      Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'proveedores',    Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'productos',      Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'inventario',     Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'promociones',    Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'agenda',         Visible: true,  Crear: true,  Leer: true,  Editar: true,  Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'reportes',       Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'capacitaciones', Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ficha_servicios',Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'costos_fijos',   Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'resumen_costos', Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ingresos_egresos',Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'usuarios',       Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'roles',          Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' }
  ],
  'rol_prof': [
    { Modulo: 'dashboard',      Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'propio' },
    { Modulo: 'clientes',       Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'propio' },
    { Modulo: 'citas',          Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'propio' },
    { Modulo: 'servicios',      Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'empleados',      Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'proveedores',    Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'productos',      Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'inventario',     Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'promociones',    Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'agenda',         Visible: true,  Crear: false, Leer: true,  Editar: false, Eliminar: false, Alcance_Datos: 'propio' },
    { Modulo: 'reportes',       Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'capacitaciones', Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ficha_servicios',Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'costos_fijos',   Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'resumen_costos', Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'ingresos_egresos',Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'usuarios',       Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' },
    { Modulo: 'roles',          Visible: false, Crear: false, Leer: false, Editar: false, Eliminar: false, Alcance_Datos: 'todo' }
  ]
};

// ═══════════════════════════════════════════
// MÓDULO LABELS E ÍCONOS
// ═══════════════════════════════════════════
const MODULE_LABELS = {
  dashboard: 'Dashboard', clientes: 'Clientes', citas: 'Citas',
  servicios: 'Servicios', empleados: 'Empleados', proveedores: 'Proveedores',
  productos: 'Productos', inventario: 'Inventario', promociones: 'Promociones',
  agenda: 'Agenda', reportes: 'Reportes', capacitaciones: 'Capacitaciones',
  ficha_servicios: 'Ficha Servicios', costos_fijos: 'Costos Fijos',
  resumen_costos: 'Resumen Costos', ingresos_egresos: 'Caja',
  usuarios: 'Usuarios', roles: 'Roles'
};

const MODULE_ICONS = {
  dashboard: '📊', clientes: '👥', citas: '📅', servicios: '💅',
  empleados: '👩‍💼', proveedores: '🏢', productos: '📦', inventario: '📋',
  promociones: '🏷️', agenda: '📆', reportes: '📈', capacitaciones: '🎓',
  ficha_servicios: '✅', costos_fijos: '💸', resumen_costos: '📉',
  ingresos_egresos: '💰', usuarios: '👤', roles: '🔑'
};

// ═══════════════════════════════════════════
// FUNCIONES DE PERMISO
// ═══════════════════════════════════════════
function getCurrentUser() { return authState.user; }
function getCurrentRole() { return authState.role; }

function getModulePermission(module) {
  return (authState.permissions.modules || []).find(m => m.Modulo === module) || null;
}

function canView(module)  { const p = getModulePermission(module); return p ? p.Visible : false; }
function canCreate(module) { const p = getModulePermission(module); return p ? p.Crear : false; }
function canEdit(module)   { const p = getModulePermission(module); return p ? p.Editar : false; }
function canDelete(module) { const p = getModulePermission(module); return p ? p.Eliminar : false; }

function getDataScope(module) {
  const p = getModulePermission(module);
  return p ? (p.Alcance_Datos || 'todo') : 'todo';
}

function getVisibleModules() {
  return (authState.permissions.modules || []).filter(m => m.Visible === true);
}

function getMenuForRole() { return authState.menu || []; }

function buildMenu() {
  const visibleModules = getVisibleModules();
  const categories = [
    { id: 'principal', Nombre: 'PRINCIPAL', Icono: '📊', Orden: 1 },
    { id: 'gestion', Nombre: 'GESTIÓN', Icono: '💰', Orden: 2 },
    { id: 'operaciones', Nombre: 'OPERACIONES', Icono: '📋', Orden: 3 },
    { id: 'administracion', Nombre: 'ADMINISTRACIÓN', Icono: '🏢', Orden: 4 },
    { id: 'configuracion', Nombre: 'CONFIGURACIÓN', Icono: '⚙️', Orden: 5 }
  ];

  // Mapeo de módulo → categoría
  const CATEGORY_MAP = {
    dashboard: 'principal', citas: 'principal', clientes: 'principal',
    agenda: 'principal', servicios: 'principal',
    ingresos_egresos: 'gestion', costos_fijos: 'gestion', resumen_costos: 'gestion',
    reportes: 'gestion', inventario: 'gestion',
    empleados: 'operaciones', productos: 'operaciones', proveedores: 'operaciones',
    promociones: 'operaciones', capacitaciones: 'operaciones',
    ficha_servicios: 'administracion',
    usuarios: 'configuracion', roles: 'configuracion'
  };

  const menu = [];
  categories.forEach(cat => {
    const catModules = visibleModules.filter(m =>
      (CATEGORY_MAP[m.Modulo] || 'principal') === cat.id
    );
    if (catModules.length === 0) return;
    menu.push({
      category: cat.Nombre,
      icon: cat.Icono,
      items: catModules.map(m => ({
        id: m.Modulo,
        label: MODULE_LABELS[m.Modulo] || m.Modulo,
        icon: MODULE_ICONS[m.Modulo] || '📄'
      }))
    });
  });
  return menu;
}

// ═══════════════════════════════════════════
// HANDLERS DE LOGIN / LOGOUT
// ═══════════════════════════════════════════
async function handleLogin(email) {
  // Buscar usuario demo
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('Email no encontrado. Verificá que esté bien escrito.');
  }
  const role = DEMO_ROLES[user.rolId];
  if (!role) {
    throw new Error('Rol no encontrado para este usuario.');
  }

  // Construir estado de auth
  authState.isAuthenticated = true;
  authState.user = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    avatar: user.avatar,
    empleadoId: user.empleadoId
  };
  authState.role = {
    id: role.id,
    nombre: role.nombre,
    nivel: role.nivel,
    color: role.color,
    dashboard: role.dashboard
  };
  authState.permissions.modules = DEMO_MODULE_PERMISSIONS[user.rolId] || [];
  authState.permissions.fields = []; // Sin permisos de campo en MVP
  authState.sessionStarted = Date.now();

  // Construir menú
  authState.menu = buildMenu();

  // Guardar sesión
  saveSession();
}

function handleLogout() {
  clearSession();
  showLoginScreen();
  // Limpiar UI
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (document.getElementById('page-dashboard')) {
    document.getElementById('page-dashboard').classList.add('active');
  }
}

// ═══════════════════════════════════════════
// UI: Mostrar/Ocultar Login
// ═══════════════════════════════════════════
function showLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (appContainer) appContainer.classList.add('hidden');
  document.getElementById('login-email').focus();
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (appContainer) appContainer.classList.remove('hidden');
}

function setLoginState(state, message) {
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');
  const btnSpinner = document.getElementById('login-btn-spinner');
  const errorEl = document.getElementById('login-error');

  if (!btn || !btnText || !btnSpinner || !errorEl) return;

  switch(state) {
    case 'loading':
      btn.disabled = true;
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
      errorEl.classList.add('hidden');
      break;
    case 'error':
      btn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      errorEl.textContent = message || 'Error al iniciar sesión';
      errorEl.classList.remove('hidden');
      break;
    case 'idle':
    default:
      btn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      errorEl.classList.add('hidden');
      break;
  }
}

// ═══════════════════════════════════════════
// GUARDS
// ═══════════════════════════════════════════
function confirmCriticalAction(action, detail) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal-overlay';
    modal.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-icon">⚠️</div>
        <h3>¿Estás seguro?</h3>
        <p>${action}</p>
        ${detail ? `<p class="confirm-detail">${detail}</p>` : ''}
        <div class="confirm-actions">
          <button class="btn-cancel" id="confirm-cancel">Cancelar</button>
          <button class="btn-danger" id="confirm-ok">Sí, continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#confirm-cancel').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('#confirm-ok').onclick = () => { modal.remove(); resolve(true); };
    const onEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', onEsc); resolve(false); } };
    document.addEventListener('keydown', onEsc);
  });
}

async function guardAction(module, action, fn) {
  if (!authState.isAuthenticated) { showLoginScreen(); return; }
  const allowed = action === 'create' ? canCreate(module) :
                  action === 'edit'   ? canEdit(module) :
                  action === 'delete' ? canDelete(module) : canView(module);
  if (!allowed) {
    window.showToast('⛔ No tenés permisos para realizar esta acción.', 'error');
    return;
  }
  if (action === 'delete') {
    const confirmed = await confirmCriticalAction(
      `Vas a eliminar este registro de "${MODULE_LABELS[module] || module}".`,
      'Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;
  }
  try { await fn(); } catch (error) {
    console.error(`Error en ${action} de ${module}:`, error);
    window.showToast(`Error: ${error.message}`, 'error');
  }
}

function startSessionTimeoutCheck() {
  setInterval(() => {
    if (!authState.isAuthenticated) return;
    const sess = loadSession();
    if (!sess || isSessionExpired(sess)) {
      clearSession();
      showLoginScreen();
    }
  }, 60000);
}
```

### 1.2 Sidebar Dinámico por Rol (`getMenuForRole`)

#### 1.2.1 Reemplazar sidebar hardcodeado

El `<aside class="sidebar">` (líneas 768-790) se reemplaza completamente con un contenedor vacío que se llena en JS **después del login**:

```html
<!-- ====== SIDEBAR (desktop >= 1024px) — renderizado dinámico ====== -->
<aside class="sidebar" id="sidebar-dynamic">
  <!-- Se llena con renderSidebar() después del login -->
</aside>
```

#### 1.2.2 Función `renderSidebar()` (JS)

```javascript
function renderSidebar() {
  const sidebar = document.getElementById('sidebar-dynamic');
  if (!sidebar) return;
  const menu = getMenuForRole();
  let html = `<div class="sidebar-brand" style="cursor:pointer;" onclick="navigateTo('dashboard')">💇 Salón Pro</div>`;

  menu.forEach(section => {
    html += `<div class="sidebar-label">${section.category}</div>`;
    section.items.forEach(item => {
      html += `<button class="sidebar-btn" onclick="navigateTo('${item.id}')" data-page="${item.id}"><span>${item.icon}</span>${item.label}</button>`;
    });
  });

  // Logout al final
  html += `<div style="margin-top:auto;padding:12px 18px;">
    <button class="sidebar-btn" style="color:var(--danger);" onclick="handleLogout()"><span>🚪</span>Cerrar Sesión</button>
  </div>`;

  sidebar.innerHTML = html;

  // Re-bindear eventos de navegación para los botones dinámicos del sidebar
  sidebar.querySelectorAll('.sidebar-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}
```

### 1.3 Header con Nombre de Usuario + Avatar + Logout

#### 1.3.1 HTML — Contenedor vacío

Insertar **DENTRO** de `#app-container`, después del sidebar:

```html
<!-- ====== HEADER USER (top-right en desktop, bottom en mobile) ====== -->
<div class="header-user" id="header-user"></div>
```

#### 1.3.2 Función `renderUserHeader()` (JS)

```javascript
function renderUserHeader() {
  const header = document.getElementById('header-user');
  if (!header) return;
  const user = getCurrentUser();
  const role = getCurrentRole();
  if (!user || !role) return;

  header.innerHTML = `
    <div class="user-avatar">${user.avatar ? `<img src="${user.avatar}" alt="${user.nombre}">` : (user.nombre || 'U')[0].toUpperCase()}</div>
    <div class="user-info">
      <span class="user-name">${user.nombre}</span>
      <span class="user-role-badge" style="background:${role.color}20;color:${role.color};">${role.nombre}</span>
    </div>
    <button class="logout-header-btn" onclick="handleLogout()" title="Cerrar sesión">🚪</button>
  `;
}
```

### 1.4 Protección de Vistas (sin login → redirigir a login)

#### 1.4.1 Modificar `navigateTo()`

Agregar check al inicio de `navigateTo`:

```javascript
async function navigateTo(pageId) {
  // PROTECCIÓN: Si no está autenticado → redirigir a login
  if (!authState.isAuthenticated) {
    showLoginScreen();
    return;
  }
  // PROTECCIÓN: Si no tiene permiso de ver este módulo
  if (!canView(pageId)) {
    window.showToast('⛔ No tenés acceso a esta sección.', 'error');
    return;
  }

  if (currentPage === pageId) return;
  currentPage = pageId;
  // ... resto del código existente (limpiar active, render, etc.)
}
```

#### 1.4.2 Proteger renderizado inicial

Reemplazar la línea de init:
```javascript
// ANTES: renderDashboard().catch(err => console.error('[Init]', err));
// DESPUÉS:
// El init se maneja en DOMContentLoaded (ver sección 2 de este plan)
```

### 1.5 Permisos en Botones CRUD (`canCreate`, `canEdit`, `canDelete`)

#### 1.5.1 Modificar `actionButtons()`

```javascript
function actionButtons(tableKey, record, displayName) {
  // Ocultar botones según permisos
  if (!canEdit(tableKey) && !canDelete(tableKey)) return '';

  var jsonSafe = JSON.stringify(record).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  var idSafe = String(record.id || '').replace(/'/g, "\\'");
  if (!idSafe) return '';
  var nameSafe = (displayName || 'registro').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, "\\'");

  var html = '<div class="card-actions">';
  if (canEdit(tableKey)) {
    html += '<button class="action-btn edit-btn" title="Editar" onclick="event.stopPropagation();(function(){var r=' + jsonSafe + ';openEditForm(\'' + tableKey + '\',r)})()">✏️</button>';
  }
  if (canDelete(tableKey)) {
    html += '<button class="action-btn delete-btn" title="Eliminar" onclick="event.stopPropagation();guardAction(\'' + tableKey + '\',\'delete\',function(){deleteRecord(\'' + tableKey + '\',\'' + idSafe + '\',\'' + nameSafe + '\')})">🗑️</button>';
  }
  html += '</div>';
  return html;
}
```

#### 1.5.2 Modificar `deleteRecord()` — usar guardAction internamente

La llamada en `actionButtons` ya usa `guardAction` (arriba). Pero `deleteRecord` seguirá existiendo para uso directo:

```javascript
async function deleteRecord(tableKey, recordId, name) {
  // Verificar permiso antes de eliminar
  if (!canDelete(tableKey)) {
    window.showToast('⛔ No tenés permisos para eliminar.', 'error');
    return;
  }
  if (!confirm('¿Eliminar "' + (name || 'este registro') + '"?')) return;
  try {
    await airtableDelete(tableKey, recordId);
    window.showToast('🗑️ Registro eliminado');
    refreshCurrentPage();
  } catch (err) {
    console.error('[DELETE]', err);
    window.showToast('Error al eliminar: ' + err.message, 'error');
  }
}
```

#### 1.5.3 Modificar `openCreateForm()` — verificar canCreate

```javascript
function openCreateForm(tableKey) {
  if (!canCreate(tableKey)) {
    window.showToast('⛔ No tenés permisos para crear en esta sección.', 'error');
    return;
  }
  // ... resto del código existente
}
```

#### 1.5.4 Modificar `openEditForm()` — verificar canEdit

```javascript
function openEditForm(tableKey, record) {
  if (!canEdit(tableKey)) {
    window.showToast('⛔ No tenés permisos para editar en esta sección.', 'error');
    return;
  }
  // ... resto del código existente
}
```

### 1.6 FAB Button — Verificar `canCreate`

```javascript
document.getElementById('fabBtn').addEventListener('click', function() {
  var tableKey = PAGE_TO_TABLE[currentPage];
  if (tableKey && FORM_CONFIGS[tableKey]) {
    if (canCreate(tableKey)) {
      openCreateForm(tableKey);
    } else {
      window.showToast('⛔ No tenés permisos para crear.', 'error');
    }
  }
});
```

### 1.7 Colormas de Tabla Filtradas por Permisos de Campo

En modo MVP, no hay tabla `Permisos_Campo`, así que todas las columnas son visibles. Se deja preparado `applyTableColumnVisibility(module, tableEl)` como no-op hasta que se implemente esa tabla en Airtable.

### 1.8 Data Scope: Filtrar Registros por Rol

Modificar cada función `render*` para filtrar por scope si el rol es restringido:

```javascript
function filterRecordsByScope(records, module) {
  const scope = getDataScope(module);
  const user = getCurrentUser();

  if (scope === 'todo') return records;

  // scope 'propio' o 'asignado' — solo el profesional puede usar esto en MVP
  if (!user || !user.empleadoId) return records; // fallback

  return records.filter(r => {
    const profesional = r.fields['Profesional Asignado'] ||
                        r.fields['Empleado Asignado'];
    return linkedIncludes(profesional, user.empleadoId);
  });
}
```

Para MVP, el `dataScope` solo aplica al rol `Profesional` (scope `propio`). Como no hay `empleadoId` vinculado real en los datos DEMO, el filtro retorna todos en modo fallback.

---

## 2. ORDEN DE IMPLEMENTACIÓN (6 Pasos)

### Paso 1: Agregar CSS de login + sidebar dinámico + header

**Qué modificar:**
- Bloque `<style>` existente (líneas ~1 a ~764)

**Qué agregar (antes de `</style>`):**
1. Estilos completos de `.login-screen`, `.login-container`, `.login-card`, `.login-logo`, `.login-title`, `.login-subtitle`, `.login-error`, `.login-demo-hint`, `.login-footer`
2. Estilos de `.header-user`, `.user-avatar`, `.user-info`, `.user-name`, `.user-role-badge`, `.logout-header-btn`
3. Estilos de `.confirm-modal-overlay`, `.confirm-modal`, `.confirm-actions`
4. Regla `#app-container.hidden { display: none; }`

**Verificación:** Sin errores de sintaxis CSS.

---

### Paso 2: Agregar HTML del login panel + wrappers

**Qué modificar:**
- Inmediatamente después de `<body>` (antes del `<aside class="sidebar">` actual en línea 769)

**Qué agregar:**
1. `#login-screen` con todo el HTML del login (formulario, logo, demo hints)
2. Envolver TODO el contenido actual (sidebar, hamburger, overlay, bottom nav, main, fab, modal, toast) en un `<div id="app-container">`
3. Agregar `<div class="header-user" id="header-user"></div>` dentro de `#app-container`
4. Reemplazar el `<aside class="sidebar">` existente por uno vacío: `<aside class="sidebar" id="sidebar-dynamic"></aside>`

**Código del wrapper:**
```html
<body>

<!-- LOGIN SCREEN (visible hasta autenticación) -->
<div id="login-screen" class="login-screen">
  ... (HTML del login)
</div>

<!-- APP CONTAINER (oculto hasta autenticación) -->
<div id="app-container" class="hidden">

  <!-- SIDEBAR dinámico -->
  <aside class="sidebar" id="sidebar-dynamic"></aside>

  <!-- HEADER USER -->
  <div class="header-user" id="header-user"></div>

  <!-- HAMBURGER -->
  <button class="hamburger" id="mobileHamburger" aria-label="Menú">☰</button>

  <!-- OVERLAY MENU -->
  <div class="overlay-backdrop" id="overlayBackdrop"></div>
  <div class="overlay-menu" id="overlayMenu">
    <!-- Se llena dinámicamente igual que el sidebar -->
  </div>

  <!-- BOTTOM NAV -->
  <nav class="bottom-nav">...</nav>

  <!-- MAIN CONTENT -->
  <main class="main">...</main>

  <!-- FAB -->
  <button class="fab" id="fabBtn" title="Nuevo">+</button>

  <!-- MODAL -->
  <div class="modal-backdrop" id="modalBackdrop"></div>
  <div class="modal" id="modal">...</div>

  <!-- TOAST -->
  <div class="toast-container" id="toastContainer"></div>

</div><!-- /#app-container -->

<!-- Scripts -->
...
```

**Verificación:** El login debe verse al cargar la página (app-container oculto por CSS `.hidden`).

---

### Paso 3: Agregar JS de autenticación

**Qué modificar:**
- Bloque `<script>(function(){ ... })()</script>` (líneas 977-2455)

**Qué agregar (ANTES de las variables existentes como `_T`, `_entity`, etc.):**
1. `authState` con estructura inicial
2. Datos DEMO: `DEMO_USERS`, `DEMO_ROLES`, `DEMO_MODULE_PERMISSIONS`
3. `MODULE_LABELS`, `MODULE_ICONS`
4. `loadSession()`, `saveSession()`, `clearSession()`, `isSessionExpired()`, `restoreAuthState()`
5. Funciones de permiso: `canView`, `canCreate`, `canEdit`, `canDelete`, `getDataScope`, `getVisibleModules`, `getMenuForRole`, `buildMenu`
6. `handleLogin(email)`, `handleLogout()`
7. `showLoginScreen()`, `hideLoginScreen()`, `setLoginState()`
8. `renderSidebar()`, `renderUserHeader()`
9. `confirmCriticalAction()`, `guardAction()`, `startSessionTimeoutCheck()`
10. `extractLinkedId()`, `linkedIncludes()`, `filterRecordsByScope()`

**Además, AL FINAL del IIFE (antes de `})()`):**
- Agregar el handler del evento `DOMContentLoaded` con la lógica de init
- Bindear el evento submit del login form

```javascript
// ═══════════════════════════════════════════
// INIT: Orquestador de arranque
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Bindear login form
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  if (loginForm && loginEmail) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setLoginState('error', 'Ingresá un email válido.');
        return;
      }
      setLoginState('loading');
      // Simular delay de red
      await new Promise(r => setTimeout(r, 600));
      try {
        await handleLogin(email);
        setLoginState('idle');
        hideLoginScreen();
        renderSidebar();
        renderUserHeader();
        startSessionTimeoutCheck();
        // Navegar al dashboard del rol
        navigateTo(authState.role.dashboard || 'dashboard');
      } catch(err) {
        setLoginState('error', err.message);
      }
    });
  }

  // 2. Intentar restaurar sesión guardada
  const savedSession = loadSession();
  if (savedSession && !isSessionExpired(savedSession)) {
    restoreAuthState(savedSession);
    hideLoginScreen();
    renderSidebar();
    renderUserHeader();
    startSessionTimeoutCheck();
    navigateTo(authState.role.dashboard || 'dashboard');
  } else {
    clearSession();
    showLoginScreen();
  }

  console.log('🏪 Salón Pro — Conectado a Airtable (app93Vhy56KrxNhwe)');
});
```

**ELIMINAR la línea existente:**
```javascript
// renderDashboard().catch(err => console.error('[Init]', err));  ← ELIMINAR
```

**Verificación:** Al cargar, mostrar login. Ingresar email demo → sidebar dinámico + header usuario + navegación al dashboard del rol.

---

### Paso 4: Conectar sidebar y overlay menu a `getMenuForRole`

El sidebar ya se construye con `renderSidebar()`. Falta:

#### 4.1 Llenar el overlay menu dinámicamente

```javascript
function renderOverlayMenu() {
  const overlay = document.getElementById('overlayMenu');
  if (!overlay) return;
  const menu = getMenuForRole();
  let html = '<div class="overlay-title">Navegación</div>';

  menu.forEach(section => {
    section.items.forEach(item => {
      html += `<button class="overlay-btn" data-page="${item.id}"><span class="oicon">${item.icon}</span>${item.label}</button>`;
    });
  });

  overlay.innerHTML = html;

  // Re-bindear navegación
  overlay.querySelectorAll('.overlay-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}
```

Llamar `renderOverlayMenu()` en el `DOMContentLoaded` junto con `renderSidebar()`.

#### 4.2 Llenar bottom nav con las primeras 5 secciones visibles

```javascript
function renderBottomNav() {
  const bottomNav = document.querySelector('.bottom-nav');
  if (!bottomNav) return;
  const visibles = getVisibleModules();
  const top5 = visibles.slice(0, 4); // 4 ítems + "Más"
  let html = '';
  top5.forEach(m => {
    html += `<button class="nav-btn" data-page="${m.Modulo}"><span class="nav-icon">${MODULE_ICONS[m.Modulo] || '📄'}</span>${MODULE_LABELS[m.Modulo]}</button>`;
  });
  // Siempre agregar el botón "Más" para acceder al overlay
  html += '<button class="nav-btn" id="moreBtn">⋯<span>Más</span></button>';
  bottomNav.innerHTML = html;

  // Re-bindear navegación
  bottomNav.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Re-bindear "Más"
  const moreBtn = document.getElementById('moreBtn');
  const overlay = document.getElementById('overlayMenu');
  const backdrop = document.getElementById('overlayBackdrop');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = overlay.classList.contains('open');
      overlay.classList.toggle('open', !open);
      backdrop.classList.toggle('open', !open);
    });
  }
}
```

Llamar en `DOMContentLoaded` después de `renderSidebar()`.

**Verificación:** Navegar como Profesional → solo 2-3 módulos en sidebar, bottom nav limitado.

---

### Paso 5: Proteger cada render con permisos

Modificaciones concretas (ver sección 1.5 para el código):

| Función existente | Línea actual | Cambio |
|---|---|---|
| `navigateTo(pageId)` | 2385 | Agregar `if (!canView(pageId))` al inicio |
| `actionButtons(...)` | 2344 | Condicionar edit/delete a `canEdit`/`canDelete` |
| `deleteRecord(...)` | 2292 | Agregar `if (!canDelete(...))` al inicio |
| `openCreateForm(...)` | 2211 | Agregar `if (!canCreate(...))` al inicio |
| `openEditForm(...)` | 2221 | Agregar `if (!canEdit(...))` al inicio |
| `fabBtn` click handler | 2336 | Agregar `if (canCreate(tableKey))` |
| `moreBtn` click handler | 2412 | Mantener funcionalidad existente |

---

### Paso 6: Data Scope y Filtrado de Columnas

#### 6.1 Data scope (preparado, no activo en MVP)

La función `filterRecordsByScope` ya está definida. Para activarla cuando se vinculen empleados reales:
- En funciones `renderCitas`, `renderClientes`, etc., después de obtener `records`, aplicar:
  ```javascript
  const visibleRecords = filterRecordsByScope(records, 'citas');
  ```
- Esto no se activa en MVP porque los empleados DEMO no tienen `empleadoId`.

#### 6.2 applyTableColumnVisibility (preparado, no activo)

Función definida como no-op hasta que exista `Permisos_Campo` en Airtable. Se llamará en cada `render*Table`:
```javascript
// En renderClientes:
applyTableColumnVisibility('clientes', tableEl);
```

---

## 3. DEPENDENCIAS

### 3.1 Funciones JS NUEVAS que hay que agregar

| # | Función | Tipo | Líneas estimadas |
|---|---------|------|-----------------|
| 1 | `loadSession()` | Nueva | 5 |
| 2 | `saveSession()` | Nueva | 10 |
| 3 | `clearSession()` | Nueva | 10 |
| 4 | `isSessionExpired(session)` | Nueva | 4 |
| 5 | `restoreAuthState(session)` | Nueva | 7 |
| 6 | `extractLinkedId(field)` | Nueva | 8 |
| 7 | `linkedIncludes(linkedField, targetId)` | Nueva | 8 |
| 8 | `getCurrentUser()` | Nueva | 1 |
| 9 | `getCurrentRole()` | Nueva | 1 |
| 10 | `getModulePermission(module)` | Nueva | 4 |
| 11 | `canView(module)` | Nueva | 2 |
| 12 | `canCreate(module)` | Nueva | 2 |
| 13 | `canEdit(module)` | Nueva | 2 |
| 14 | `canDelete(module)` | Nueva | 2 |
| 15 | `getDataScope(module)` | Nueva | 4 |
| 16 | `getVisibleModules()` | Nueva | 3 |
| 17 | `getMenuForRole()` | Nueva | 2 |
| 18 | `buildMenu()` | Nueva | 35 |
| 19 | `handleLogin(email)` | Nueva | 30 |
| 20 | `handleLogout()` | Nueva | 10 |
| 21 | `showLoginScreen()` | Nueva | 6 |
| 22 | `hideLoginScreen()` | Nueva | 6 |
| 23 | `setLoginState(state, message)` | Nueva | 25 |
| 24 | `renderSidebar()` | Nueva | 20 |
| 25 | `renderUserHeader()` | Nueva | 15 |
| 26 | `renderOverlayMenu()` | Nueva | 15 |
| 27 | `renderBottomNav()` | Nueva | 30 |
| 28 | `confirmCriticalAction(action, detail)` | Nueva | 30 |
| 29 | `guardAction(module, action, fn)` | Nueva | 20 |
| 30 | `startSessionTimeoutCheck()` | Nueva | 10 |
| 31 | `filterRecordsByScope(records, module)` | Nueva | 15 |
| **TOTAL** | | | **~320** |

### 3.2 Funciones EXISTENTES que hay que modificar

| # | Función | Cambio requerido | Riesgo |
|---|---------|-----------------|--------|
| 1 | `navigateTo(pageId)` | Agregar check `authState.isAuthenticated` + `canView(pageId)` | MEDIO — puede romper navegación si no se inicializa auth |
| 2 | `actionButtons(tableKey, record, displayName)` | Condicionar botones edit/delete a permisos | BAJO — solo afecta acciones en cards |
| 3 | `deleteRecord(tableKey, recordId, name)` | Agregar check `canDelete()` | BAJO |
| 4 | `openCreateForm(tableKey)` | Agregar check `canCreate()` | BAJO |
| 5 | `openEditForm(tableKey, record)` | Agregar check `canEdit()` | BAJO |
| 6 | `fabBtn` click handler | Agregar check `canCreate()` | BAJO |
| 7 | Init: `renderDashboard()` | Reemplazar por `DOMContentLoaded` orchestrator | MEDIO — puede romper carga inicial |
| 8 | `allBtns.forEach` (línea 2404) | Mover binding a después de `renderSidebar/renderOverlay/renderBottomNav` | MEDIO — eventos existentes en sidebar hardcodeado |
| 9 | `moreBtn` click handler | Re-bindear después de `renderBottomNav` | BAJO |

### 3.3 CSS que hay que agregar

| Bloque CSS | Líneas | Descripción |
|-----------|--------|-------------|
| `.login-screen` | ~30 líneas | Pantalla de login con gradiente oscuro |
| `.login-header` + `.login-card` | ~40 líneas | Tarjeta de login centrada |
| `.login-error` | ~10 líneas | Mensaje de error en login |
| `.login-demo-hint` | ~15 líneas | Hint de usuarios demo |
| `.header-user` | ~30 líneas | Header con avatar + nombre + badge rol + logout |
| `.user-avatar`, `.user-info` | ~15 líneas | Avatar circular e info de usuario |
| `#app-container.hidden` | 1 línea | Ocultar app antes del login |
| `.confirm-modal-*` | ~25 líneas | Modal de confirmación para eliminar |
| **TOTAL** | **~160 líneas** | |

### 3.4 HTML que hay que agregar

| Bloque HTML | Líneas | Descripción |
|------------|--------|-------------|
| `#login-screen` | ~25 líneas | Pantalla completa de login |
| `#app-container` wrapper | 2 líneas | Envolver todo el contenido existente |
| `#header-user` | 1 línea | Contenedor del header de usuario |
| `#sidebar-dynamic` | 1 línea (reemplazo) | Sidebar vacío para llenar dinámicamente |
| **TOTAL** | **~29 líneas** | |

---

## 4. RIESGOS

### 4.1 Conflictos con código existente

| Riesgo | Severidad | Descripción | Mitigación |
|--------|-----------|-------------|------------|
| **R1: `allBtns.forEach` (línea 2404) sobre sidebar hardcodeado** | 🔴 ALTO | El código actual hace `document.querySelectorAll('[data-page]')` y bindea click a todos. Después del reemplazo dinámico del sidebar, los botones viejos ya no existen y los nuevos no tienen handlers. | Mover este binding a `renderSidebar()` / `renderOverlayMenu()` / `renderBottomNav()`, donde se re-bindean los elementos recién creados. |
| **R2: El overlay menu también es hardcodeado** | 🔴 ALTO | Si el overlay menu no se llena dinámicamente, mostrará módulos incorrectos para el rol. | Implementar `renderOverlayMenu()` en paso 4. |
| **R3: Bottom nav hardcodeado** | 🟠 MEDIO | Los 4 botones fijos del bottom nav no respetan el rol. | Implementar `renderBottomNav()` con los primeros 4 módulos visibles. |
| **R4: `currentPage` inicializado como `'dashboard'`** | 🟠 MEDIO | Si el rol no tiene acceso a dashboard (ej. Profesional tiene `dashboard.Visible: false`), la navegación inicial falla. | En el orchestrator de init, navegar a `authState.role.dashboard` en lugar de dashboard hardcodeado. |
| **R5: `PAGE_TO_TABLE` mapping puede no coincidir con módulos permitidos** | 🟡 BAJO | Si un módulo no tiene acceso a su tabla CRUD asociada, el FAB no debería mostrarse. | El check `canCreate(tableKey)` en el FAB handler resuelve esto. |

### 4.2 Funciones que podrían romperse

| Función | Motivo | Cómo verificar |
|---------|--------|---------------|
| `navigateTo('dashboard')` al cargar | Si `dashboard.Visible: false`, el guard bloqueará | Login como Profesional → debe redirigir a `agenda`, no a dashboard |
| `actionButtons` retorna HTML vacío | Si el rol no tiene edit ni delete, los botones desaparecen | Login como Profesional → solo ve datos, sin botones ✏️🗑️ |
| `openCreateForm` / `openEditForm` bloqueados | El guard impide abrir el modal | Login como Profesional → hacer click en FAB debe mostrar toast de error |
| `deleteRecord` con confirmación | Se agregó un guard de permiso extra | Login como Gerente → intentar eliminar cliente muestra error (gerente no puede eliminar) |
| `allBtns.forEach` sobre elementos inexistentes | Si no se re-bindea después del render dinámico | Hacer click en sidebar → debe navegar correctamente |
| `renderDashboard()` en línea 2442 | Se elimina esta línea, el init ahora es por `DOMContentLoaded` | Recargar página → login debe aparecer, no debe intentar cargar dashboard |

### 4.3 Cómo verificar cada paso

| Paso | Verificación |
|------|-------------|
| **Paso 1 (CSS)** | Abrir `index.html` en navegador → sin errores de consola. El login (si se muestra) debe verse bien estilizado. |
| **Paso 2 (HTML)** | Abrir página → ver pantalla de login completa con formulario, logo, demo hints. El contenido de la app NO debe verse. |
| **Paso 3 (JS auth)** | Ingresar `admin@salonpro.com` → debe autenticar, ocultar login, mostrar sidebar con TODOS los módulos (18 ítems), header con "Diego López", navegar a dashboard. Cerrar sesión → volver a login. |
| **Paso 4 (sidebar/overlay dinámico)** | Ingresar como `ana@salonpro.com` (Profesional) → sidebar solo muestra 4 módulos: Clientes, Citas, Servicios, Agenda. Bottom nav muestra los primeros 4. Overlay menu igual. |
| **Paso 5 (protección CRUD)** | Como Profesional → no ver botones ✏️🗑️ en cards. FAB no funciona (toast de error). Como Gerente → puede editar pero no eliminar. Como Admin → todo funciona. |
| **Paso 6 (data scope)** | Preparado para futuro. En MVP todos los roles ven todos los datos (fallback `todo`). Cuando se vinculen `empleadoId`, el Profesional filtrará solo sus citas. |

---

## 5. RESUMEN DEL PLAN

### Archivos afectados

| Archivo | Tipo de cambio | Líneas agregadas | Líneas modificadas | Líneas eliminadas |
|---------|---------------|-----------------|-------------------|------------------|
| `static/index.html` | Monolítico (todo en 1 archivo) | ~510 | ~40 | ~17 |

### Tiempo estimado de implementación

| Paso | Tiempo |
|------|--------|
| Paso 1: CSS | 15 min |
| Paso 2: HTML login + wrappers | 20 min |
| Paso 3: JS auth completo | 45 min |
| Paso 4: Sidebar/overlay/bottom nav dinámico | 20 min |
| Paso 5: Protección CRUD | 15 min |
| Paso 6: Data scope (preparación) | 10 min |
| **TOTAL** | **~2 horas** |

### Nota final

Este plan asume **MVP Demo** — sin tablas reales de auth en Airtable. Los datos de usuarios, roles y permisos están hardcodeados en `DEMO_USERS`, `DEMO_ROLES` y `DEMO_MODULE_PERMISSIONS`. La migración a producción (con tablas reales de Airtable) requerirá reemplazar estas estructuras con llamadas a la API, según las secciones 6 y 7 de `AUTH_SYSTEM_DESIGN.md`.

---

*Plan completado el 2026-06-02. Próximo paso: implementación.*
