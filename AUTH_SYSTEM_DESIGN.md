# 🔐 SISTEMA DE AUTENTICACIÓN, ROLES Y PERMISOS
## Gestión de Salones de Belleza

> **Versión:** 1.0 | **Fecha:** 2026-06-02 | **Autor:** Arquitecto de Auth
> **Base Airtable:** `app93Vhy56KrxNhwe` | **Backend:** Exclusivamente Airtable
> **Modo:** MVP Demo — Auth simulada con localStorage (sin tokens reales)

---

# ÍNDICE

1. [Login Simple](#1-login-simple)
2. [Tablas Backend en Airtable](#2-tablas-backend-en-airtable)
3. [Permisos por Rol (Configuración Inicial)](#3-permisos-por-rol-configuración-inicial)
4. [Capa JS de Permisos (Diseño de API)](#4-capa-js-de-permisos-diseño-de-api)
5. [Reglas de Protección](#5-reglas-de-protección)
6. [Integración con el Frontend Actual](#6-integración-con-el-frontend-actual)
7. [Plan de Migración a Producción](#7-plan-de-migración-a-producción)

---

# 1. LOGIN SIMPLE

## 1.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE LOGIN                              │
│                                                                 │
│  [Pantalla Login]                                               │
│       │                                                         │
│       │ Email ingresado                                         │
│       ▼                                                         │
│  [Validación Frontend]                                          │
│       │                                                         │
│       │ Formato email válido? ──── No ──► [Error: "Email       │
│       │                                    inválido"]           │
│       │ Sí                                                     │
│       ▼                                                         │
│  [API Airtable: GET Usuarios]                                   │
│  filterByFormula={Email}="{email}"                              │
│       │                                                         │
│       │ ¿Usuario encontrado? ──── No ──► [Error: "Usuario no   │
│       │                                    registrado"]         │
│       │ Sí                                                     │
│       ▼                                                         │
│  [API Airtable: GET Roles]                                      │
│  Obtener Rol vinculado (lookup por recordId)                    │
│       │                                                         │
│       ▼                                                         │
│  [Cargar Permisos]                                              │
│  GET Permisos_Módulo WHERE Rol = roleId                         │
│  GET Permisos_Campo WHERE Rol = roleId                          │
│       │                                                         │
│       ▼                                                         │
│  [Construir Sesión en localStorage]                             │
│  {                                                              │
│    user: { id, nombre, email, avatar, empleadoId },             │
│    role: { id, nombre, nivel, dashboard, color },               │
│    permissions: { modules: [...], fields: [...] },              │
│    menu: [ items visibles ],                                    │
│    expiresAt: Date.now() + 8h                                   │
│  }                                                              │
│       │                                                         │
│       ▼                                                         │
│  [Redirigir a Dashboard según Rol]                              │
│  Admin → #dashboard   Gerente → #dashboard                     │
│  Gestión → #citas     Profesional → #agenda                    │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Pantalla de Login (HTML/CSS)

```html
<!-- PANTALLA DE LOGIN — reemplaza todo el contenido hasta autenticación -->
<div id="login-screen" class="login-screen">
  <div class="login-card">
    <div class="login-brand">
      <span class="login-icon">💇</span>
      <h1>Salón Pro</h1>
      <p class="login-subtitle">Gestión de Salón de Belleza</p>
    </div>

    <!-- ESTADO: idle -->
    <form id="login-form" class="login-form">
      <div class="form-group">
        <label for="login-email">Correo Electrónico</label>
        <input
          type="email"
          id="login-email"
          placeholder="tu@email.com"
          autocomplete="email"
          required
          autofocus
        />
        <span class="form-error" id="email-error"></span>
      </div>

      <button type="submit" id="login-btn" class="login-btn-primary">
        <span class="btn-text">Ingresar</span>
        <span class="btn-spinner hidden">⏳</span>
      </button>
    </form>

    <!-- ESTADO: loading -->
    <div id="login-loading" class="login-state hidden">
      <div class="spinner"></div>
      <p>Verificando credenciales...</p>
    </div>

    <!-- ESTADO: error -->
    <div id="login-error" class="login-state hidden">
      <span class="error-icon">⚠️</span>
      <p id="login-error-msg"></p>
      <button onclick="showLoginForm()" class="login-btn-secondary">
        Intentar de nuevo
      </button>
    </div>

    <!-- ESTADO: success (breve, antes de redirect) -->
    <div id="login-success" class="login-state hidden">
      <span class="success-icon">✅</span>
      <p>¡Bienvenido/a, <span id="login-user-name"></span>!</p>
    </div>
  </div>

  <footer class="login-footer">
    <p>Salón Pro v1.0 — Modo Demo</p>
  </footer>
</div>
```

## 1.3 CSS — Pantalla de Login

```css
/* ===== LOGIN SCREEN ===== */
.login-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e1815 0%, #2d2420 50%, #1e1815 100%);
  font-family: var(--font);
}

.login-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 40px 32px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
}

.login-brand h1 {
  font-size: 1.5rem;
  color: var(--text);
  margin: 0 0 4px;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.login-form input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 0.9375rem;
  color: var(--text);
  background: var(--bg);
  transition: border-color 0.2s;
  outline: none;
}

.login-form input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.login-form input.input-error {
  border-color: var(--danger);
}

.form-error {
  display: block;
  font-size: 0.75rem;
  color: var(--danger);
  margin-top: 4px;
  min-height: 18px;
}

.login-btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.login-btn-primary:hover { background: #b86d52; }
.login-btn-primary:active { transform: scale(0.98); }
.login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.login-btn-secondary {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 12px;
}

.login-state {
  text-align: center;
  padding: 16px 0;
}

.login-state p {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 8px 0 0;
}

.login-state .error-icon,
.login-state .success-icon {
  font-size: 36px;
  display: block;
}

.btn-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.3);
}

.hidden { display: none !important; }
```

## 1.4 JavaScript — Lógica de Login

```javascript
/**
 * auth-login.js — Módulo de Autenticación
 * MVP: Auth simulada con Airtable (sin bcrypt, sin JWT real)
 */

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════

const AUTH_STORAGE_KEY = 'salonpro_auth_session';
const AUTH_SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

const LOGIN_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
};

// ═══════════════════════════════════════════
// ESTADO ACTUAL
// ═══════════════════════════════════════════

let authState = {
  isAuthenticated: false,
  currentUser: null,
  currentRole: null,
  permissions: { modules: [], fields: [] },
  menu: []
};

// ═══════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Intentar restaurar sesión existente
  const savedSession = loadSession();
  if (savedSession && !isSessionExpired(savedSession)) {
    restoreAuthState(savedSession);
    hideLoginScreen();
    initAppWithAuth();
  } else {
    // Mostrar login si no hay sesión válida
    clearSession();
    showLoginScreen();
  }

  // Event listener del form
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }

  // Event listener de logout
  document.addEventListener('click', (e) => {
    if (e.target.closest('#logout-btn')) {
      handleLogout();
    }
  });
});

// ═══════════════════════════════════════════
// MANEJO DE SESIÓN EN localStorage
// ═══════════════════════════════════════════

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(sessionData) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Error guardando sesión:', e);
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function isSessionExpired(session) {
  return !session.expiresAt || Date.now() > session.expiresAt;
}

function restoreAuthState(session) {
  authState.isAuthenticated = true;
  authState.currentUser = session.user;
  authState.currentRole = session.role;
  authState.permissions = session.permissions;
  authState.menu = session.menu;
}

// ═══════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════

async function handleLogin(e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const emailError = document.getElementById('email-error');
  const email = emailInput.value.trim().toLowerCase();

  // Validación local
  emailError.textContent = '';

  if (!email) {
    emailError.textContent = 'Ingresá tu correo electrónico';
    emailInput.classList.add('input-error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'El formato del email no es válido';
    emailInput.classList.add('input-error');
    return;
  }

  emailInput.classList.remove('input-error');

  // Cambiar a estado LOADING
  setLoginState(LOGIN_STATES.LOADING);

  try {
    // 1. Buscar usuario en Airtable por email
    const userResult = await fetchAirtable(
      `Usuarios?filterByFormula=LOWER({Email})="${encodeURIComponent(email)}"&maxRecords=1`
    );

    if (!userResult || !userResult.records || userResult.records.length === 0) {
      throw new Error('Usuario no registrado');
    }

    const userRecord = userResult.records[0];
    const userFields = userRecord.fields;

    // Verificar que el usuario esté activo
    if (userFields.Activo === false) {
      throw new Error('Tu cuenta está desactivada. Contactá al administrador.');
    }

    // 2. Obtener el rol del usuario (linked record → traer campos)
    const roleId = extractLinkedId(userFields.Rol);
    if (!roleId) {
      throw new Error('El usuario no tiene un rol asignado');
    }

    const roleRecord = await getAirtableRecord('Roles', roleId);
    if (!roleRecord || !roleRecord.fields) {
      throw new Error('Rol no encontrado');
    }

    // 3. Cargar permisos del rol
    const modulePermissions = await fetchAirtable(
      `Permisos_Modulo?filterByFormula={Rol}="${roleId}"&maxRecords=50`
    );

    const fieldPermissions = await fetchAirtable(
      `Permisos_Campo?filterByFormula={Rol}="${roleId}"&maxRecords=100`
    );

    // 4. Cargar categorías del menú visibles
    const visibleCategories = collectVisibleCategories(
      modulePermissions.records || []
    );
    const menuItems = buildMenu(visibleCategories);

    // 5. Construir objeto de sesión
    const sessionData = {
      user: {
        id: userRecord.id,
        nombre: userFields.Nombre || '',
        email: userFields.Email || email,
        avatar: extractAttachmentUrl(userFields.Avatar),
        empleadoId: extractLinkedId(userFields.Empleado_Vinculado),
      },
      role: {
        id: roleRecord.id,
        nombre: roleRecord.fields.Nombre || '',
        nivel: roleRecord.fields.Nivel_Jerarquico || 4,
        dashboard: roleRecord.fields.Dashboard_Inicial || 'dashboard',
        color: roleRecord.fields.Color_Badge || '#c97b5d',
      },
      permissions: {
        modules: parseModulePermissions(modulePermissions.records || []),
        fields: parseFieldPermissions(fieldPermissions.records || []),
      },
      menu: menuItems,
      expiresAt: Date.now() + AUTH_SESSION_TTL,
    };

    // 6. Guardar en localStorage y estado
    saveSession(sessionData);
    restoreAuthState(sessionData);

    // 7. Actualizar último acceso en Airtable (fire & forget)
    updateLastAccess(userRecord.id).catch(() => {});

    // 8. Mostrar success brevemente
    setLoginState(LOGIN_STATES.SUCCESS);
    document.getElementById('login-user-name').textContent =
      sessionData.user.nombre;

    // 9. Redirigir al dashboard correspondiente después de 1s
    setTimeout(() => {
      hideLoginScreen();
      initAppWithAuth();
      navigateTo(sessionData.role.dashboard);
    }, 1200);

  } catch (error) {
    console.error('Error de login:', error);
    setLoginState(LOGIN_STATES.ERROR);
    document.getElementById('login-error-msg').textContent =
      error.message || 'Error al iniciar sesión. Intentá de nuevo.';
  }
}

// ═══════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════

function handleLogout() {
  authState.isAuthenticated = false;
  authState.currentUser = null;
  authState.currentRole = null;
  authState.permissions = { modules: [], fields: [] };
  authState.menu = [];
  clearSession();
  showLoginScreen();
  // Resetear UI
  document.getElementById('login-email').value = '';
  setLoginState(LOGIN_STATES.IDLE);
}

// ═══════════════════════════════════════════
// UI STATES DEL LOGIN
// ═══════════════════════════════════════════

function setLoginState(state) {
  const form = document.getElementById('login-form');
  const loading = document.getElementById('login-loading');
  const error = document.getElementById('login-error');
  const success = document.getElementById('login-success');

  [form, loading, error, success].forEach(el => {
    if (el) el.classList.add('hidden');
  });

  switch (state) {
    case LOGIN_STATES.IDLE:
      form && form.classList.remove('hidden');
      break;
    case LOGIN_STATES.LOADING:
      loading && loading.classList.remove('hidden');
      break;
    case LOGIN_STATES.ERROR:
      error && error.classList.remove('hidden');
      break;
    case LOGIN_STATES.SUCCESS:
      success && success.classList.remove('hidden');
      break;
  }
}

function showLoginForm() {
  setLoginState(LOGIN_STATES.IDLE);
  document.getElementById('login-email').focus();
}

function showLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.classList.remove('hidden');
  const app = document.getElementById('app-container');
  if (app) app.classList.add('hidden');
}

function hideLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.classList.add('hidden');
  const app = document.getElementById('app-container');
  if (app) app.classList.remove('hidden');
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function extractLinkedId(linkedField) {
  if (!linkedField) return null;
  if (Array.isArray(linkedField) && linkedField.length > 0) {
    return typeof linkedField[0] === 'string' ? linkedField[0] : linkedField[0].id;
  }
  return typeof linkedField === 'string' ? linkedField : null;
}

function extractAttachmentUrl(attachmentsField) {
  if (!attachmentsField || !Array.isArray(attachmentsField) || !attachmentsField[0]) {
    return null;
  }
  return attachmentsField[0].url || null;
}

async function updateLastAccess(userId) {
  return fetchAirtable(`Usuarios/${userId}`, 'PATCH', {
    fields: { 'Ultimo_Acceso': new Date().toISOString() }
  });
}

async function getAirtableRecord(table, recordId) {
  const result = await fetchAirtable(`${table}/${recordId}`);
  return result || null;
}
```

## 1.5 Resumen del Flujo de Login

| Paso | Acción | Dónde ocurre |
|------|--------|-------------|
| 1 | Usuario ingresa email | `#login-screen` (frontend) |
| 2 | Validar formato email regex | `handleLogin()` (JS) |
| 3 | `GET Usuarios?filterByFormula=Email=` | Airtable API |
| 4 | Verificar `Activo === true` | JS |
| 5 | `GET Roles/{roleId}` | Airtable API |
| 6 | `GET Permisos_Modulo?Rol=` | Airtable API |
| 7 | `GET Permisos_Campo?Rol=` | Airtable API |
| 8 | Construir sesión → `localStorage` | JS |
| 9 | Redirigir a dashboard del rol | `navigateTo(role.dashboard)` |
| 🔁 | Restaurar sesión al recargar | `loadSession()` en DOMContentLoaded |
| 🚪 | Logout → limpiar localStorage + mostrar login | `handleLogout()` |

---

# 2. TABLAS BACKEND EN AIRTABLE

Se requieren **5 nuevas tablas** en la base Airtable `app93Vhy56KrxNhwe`.

> ⚠️ **IMPORTANTE:** Los IDs de tabla y campo mostrados abajo son **placeholders** para el diseño. Los IDs reales se obtienen al crear las tablas en Airtable vía API. Usar nombres de campo del frontend con `filterByFormula`.

## 2.1 TABLA: Usuarios

**Propósito:** Almacenar credenciales de acceso al sistema.

| # | Campo | Tipo Airtable | Descripción | Opciones / Notas |
|---|-------|--------------|-------------|------------------|
| 1 | **Nombre** | `singleLineText` | 🔑 Campo principal — Nombre completo | |
| 2 | **Email** | `singleLineText` | Correo electrónico (único, usado como identificador de login) | ⚠️ No es tipo `email`, es texto. La validación recae en el frontend |
| 3 | **Avatar** | `multipleAttachments` | Foto de perfil del usuario | |
| 4 | **Activo** | `checkbox` | `true` = puede ingresar, `false` = bloqueado | Default: `true` |
| 5 | **Rol** | `multipleRecordLinks` | → Roles | ⚠️ Un usuario tiene 1 solo rol. Usar `multipleRecordLinks` (Airtable no tiene singleRecordLink) pero el frontend valida que sea exactamente 1 |
| 6 | **Empleado Vinculado** | `multipleRecordLinks` | → Empleados (`tblxodPS9acp1kyoU`) | Opcional. Link al registro de empleado |
| 7 | **Último Acceso** | `dateTime` | Fecha/hora del último login exitoso | ⚠️ Airtable no tiene `dateTime` nativo — usar `date` con `includeTime: true` o `singleLineText` con ISO 8601 |
| 8 | **Creación** | `createdTime` | (Automático) | |
| 9 | **Última Modificación** | `lastModifiedTime` | (Automático) | |

**Datos de ejemplo:**

| Nombre | Email | Activo | Rol | Empleado Vinculado |
|--------|-------|--------|-----|--------------------|
| Diego López | admin@salonpro.com | ✅ | Administrador | — |
| María García | gerente@salonpro.com | ✅ | Gerente | María García (Empleado) |
| Carlos Rodríguez | carlos@salonpro.com | ✅ | Empleado Gestión | Carlos Rodríguez (Empleado) |
| Ana Martínez | ana@salonpro.com | ✅ | Profesional | Ana Martínez (Empleado) |

**Endpoint para login:**
```
GET /v0/app93Vhy56KrxNhwe/Usuarios
  ?filterByFormula=LOWER({Email})="admin@salonpro.com"
  &maxRecords=1
```

---

## 2.2 TABLA: Roles

**Propósito:** Definir los niveles de acceso del sistema.

| # | Campo | Tipo Airtable | Descripción | Opciones |
|---|-------|--------------|-------------|----------|
| 1 | **Nombre** | `singleLineText` | 🔑 Campo principal — Nombre del rol | Ej: "Administrador" |
| 2 | **Descripción** | `multilineText` | Descripción del propósito del rol | |
| 3 | **Nivel Jerárquico** | `number` (prec:0) | 1=Admin, 2=Gerente, 3=Gestión, 4=Profesional | Entero 1-4 |
| 4 | **Activo** | `checkbox` | `true` = rol en uso | Default: `true` |
| 5 | **Es Sistema** | `checkbox` | `true` = rol protegido, no se puede eliminar | Solo Admin es sistema |
| 6 | **Puede Administrar Roles** | `checkbox` | `true` = puede crear/editar/eliminar roles y usuarios | Solo Admin y Gerente |
| 7 | **Dashboard Inicial** | `singleSelect` | A qué vista va después de login | `choices: ['dashboard', 'citas', 'agenda', 'caja']` |
| 8 | **Color Badge** | `singleLineText` | Color CSS para el badge del rol en UI | Ej: `#c97b5d`, `#5b8c5a` |
| 9 | **Creación** | `createdTime` | (Automático) | |
| 10 | **Última Modificación** | `lastModifiedTime` | (Automático) | |

**Datos iniciales (4 roles):**

| Nombre | Nivel | Es Sistema | Dashboard | Color |
|--------|-------|------------|-----------|-------|
| Administrador | 1 | ✅ | dashboard | `#c97b5d` |
| Gerente | 2 | ❌ | dashboard | `#5b8c5a` |
| Empleado Gestión | 3 | ❌ | citas | `#5b8c5a` |
| Profesional | 4 | ❌ | agenda | `#d4954a` |

---

## 2.3 TABLA: Permisos_Módulo

**Propósito:** Controlar acceso CRUD y visibilidad a nivel de módulo/tabla por rol.

| # | Campo | Tipo Airtable | Descripción | Opciones |
|---|-------|--------------|-------------|----------|
| 1 | **Nombre** | `singleLineText` | 🔑 Campo principal — Identificador legible | Ej: "Admin — Clientes" |
| 2 | **Rol** | `multipleRecordLinks` | → Roles | ⚠️ 1 rol por permiso |
| 3 | **Módulo** | `singleSelect` | Tabla/módulo del sistema | `choices: ['clientes','citas','servicios','empleados','proveedores','productos','inventario','promociones','agenda','reportes','capacitaciones','ficha_servicios','costos_fijos','resumen_costos','ingresos_egresos','usuarios','roles','dashboard']` |
| 4 | **Categoría Menú** | `singleSelect` | Agrupación en sidebar | `choices: ['principal','gestion','operaciones','administracion','configuracion']` |
| 5 | **Visible** | `checkbox` | ¿El módulo aparece en el menú? | Default: `true` |
| 6 | **Crear** | `checkbox` | ¿Puede crear registros? | |
| 7 | **Leer** | `checkbox` | ¿Puede ver registros? | |
| 8 | **Editar** | `checkbox` | ¿Puede modificar registros? | |
| 9 | **Eliminar** | `checkbox` | ¿Puede borrar registros? | |
| 10 | **Alcance Datos** | `singleSelect` | ¿Qué registros ve? | `choices: ['todo', 'propio', 'asignado', 'sucursal']` |
| 11 | **Ver Financiero** | `checkbox` | ¿Ve montos, precios, costos? | |
| 12 | **Ver Costos** | `checkbox` | ¿Ve costos internos (costo variable, costo total)? | |
| 13 | **Ver Configuración** | `checkbox` | ¿Ve configuración del sistema? | |
| 14 | **Vista Default** | `singleLineText` | Vista por defecto para el módulo | Ej: `grid`, `calendar` |

---

## 2.4 TABLA: Permisos_Campo

**Propósito:** Control granular campo por campo (visibilidad, editabilidad, sensibilidad).

| # | Campo | Tipo Airtable | Descripción | Opciones |
|---|-------|--------------|-------------|----------|
| 1 | **Nombre** | `singleLineText` | 🔑 Campo principal — Identificador | Ej: "Admin — Clientes — Email" |
| 2 | **Rol** | `multipleRecordLinks` | → Roles | |
| 3 | **Módulo/Tabla** | `singleSelect` | Tabla del campo | Mismas choices que Permisos_Módulo |
| 4 | **Campo** | `singleLineText` | Nombre del campo (en español, como está en Airtable) | Ej: "Email", "Valor del Servicio" |
| 5 | **Visible** | `checkbox` | ¿El campo se muestra en UI? | |
| 6 | **Editable** | `checkbox` | ¿El campo se puede modificar en formularios? | Solo si Visible=true |
| 7 | **Solo Lectura** | `checkbox` | Visible pero no editable | |
| 8 | **Sensible** | `checkbox` | Campo con datos sensibles (ej: costos, márgenes) | Se puede ofuscar en UI compartida |

---

## 2.5 TABLA: Categorías_Menú

**Propósito:** Definir las secciones del menú lateral (sidebar).

| # | Campo | Tipo Airtable | Descripción | Opciones |
|---|-------|--------------|-------------|----------|
| 1 | **Nombre** | `singleLineText` | 🔑 Campo principal — Nombre de la categoría | Ej: "PRINCIPAL" |
| 2 | **Icono** | `singleLineText` | Emoji o clase CSS | Ej: `📊`, `👥` |
| 3 | **Orden** | `number` (prec:0) | Posición en el menú (1, 2, 3...) | |
| 4 | **Colapsada Default** | `checkbox` | ¿La sección aparece colapsada? | Default: `false` |

**Datos iniciales:**

| Nombre | Icono | Orden | Colapsada |
|--------|-------|-------|-----------|
| PRINCIPAL | 📊 | 1 | ❌ |
| GESTIÓN | 💰 | 2 | ❌ |
| OPERACIONES | 📋 | 3 | ❌ |
| ADMINISTRACIÓN | 🏢 | 4 | ❌ |
| CONFIGURACIÓN | ⚙️ | 5 | ✅ |

---

# 3. PERMISOS POR ROL (CONFIGURACIÓN INICIAL)

## 3.1 Módulos del Sistema (18 módulos)

| # | Módulo | Tabla Airtable | Tipo |
|---|--------|---------------|------|
| 1 | Dashboard | (vista compuesta) | Vista |
| 2 | Clientes | `tblzRwPeOVTdsvt5g` | CRUD |
| 3 | Citas | `tblZNB7HfD3OAGL9x` | CRUD |
| 4 | Servicios | `tblIDRFHpLoQpB9JH` | CRUD |
| 5 | Empleados | `tblxodPS9acp1kyoU` | CRUD |
| 6 | Proveedores | `tblVLjaYzT3kb1k4c` | CRUD |
| 7 | Productos | `tblkz2NvmwGBXHjpF` | CRUD |
| 8 | Inventario | `tblNz69ntR4zvHjH1` | CRUD |
| 9 | Promociones | `tblc8HGTbiXL5rsk8` | CRUD |
| 10 | Agenda | `tbltQl7ljsgTBpkr1` | CRUD |
| 11 | Reportes | `tblblfVCv2Wbn0v4u` | CRUD |
| 12 | Capacitaciones | `tblpDKylzRWU0QTuL` | CRUD |
| 13 | Ficha Servicios | `tblsCoMUqOmpI9bfc` | CRUD |
| 14 | Costos Fijos | `tbl3LmPm9B32hghHi` | CRUD |
| 15 | Resumen Costos | `tbl7MRYpZJI0kEet1` | CRUD |
| 16 | Ingresos/Egresos | `tblEoTMnKvkZzHDBf` | CRUD |
| 17 | Usuarios | (nueva tabla Usuarios) | Admin |
| 18 | Roles | (nueva tabla Roles) | Admin |

## 3.2 ADMINISTRADOR (Nivel 1) — Acceso Total

**Dashboard inicial:** `dashboard`

| Módulo | Visible | C | R | E | D | Alcance | Financiero | Costos | Config |
|--------|---------|---|---|---|---|---------|------------|--------|--------|
| Dashboard | ✅ | — | ✅ | — | — | todo | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Citas | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | — | — |
| Servicios | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Empleados | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Proveedores | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Productos | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Inventario | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Promociones | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | — | — |
| Agenda | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | — | — |
| Reportes | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Capacitaciones | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | — | — |
| Ficha Servicios | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Costos Fijos | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Resumen Costos | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Ingresos/Egresos | ✅ | ✅ | ✅ | ✅ | ✅ | todo | ✅ | ✅ | — |
| Usuarios | ✅ | ✅ | ✅ | ✅ | ✅ | todo | — | — | ✅ |
| Roles | ✅ | ✅ | ✅ | ✅ | ✅ | todo | — | — | ✅ |

**Campos sensibles visibles:** Todos.

---

## 3.3 GERENTE (Nivel 2) — Operación + Reportes

**Dashboard inicial:** `dashboard`

| Módulo | Visible | C | R | E | D | Alcance | Financiero | Costos | Config |
|--------|---------|---|---|---|---|---------|------------|--------|--------|
| Dashboard | ✅ | — | ✅ | — | — | todo | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Citas | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | — | — |
| Servicios | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Empleados | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Proveedores | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Productos | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Inventario | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Promociones | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | — | — |
| Agenda | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | — | — |
| Reportes | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ✅ | ✅ | — |
| Capacitaciones | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | — | — |
| Ficha Servicios | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ❌ | ❌ | — |
| Costos Fijos | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ✅ | ✅ | — |
| Resumen Costos | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ✅ | ✅ | — |
| Ingresos/Egresos | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ✅ | ❌ | — |
| Usuarios | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | ❌ |
| Roles | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | ❌ |

**Reglas especiales:**
- ❌ No puede eliminar registros (sin soft-delete)
- ❌ No ve costos internos de servicios/productos
- ❌ No accede a administración de usuarios/roles
- ✅ Ve Dashboard ejecutivo completo (KPIs financieros)
- ✅ Puede crear/editar en módulos operativos

---

## 3.4 EMPLEADO GESTIÓN (Nivel 3) — Operación Diaria

**Dashboard inicial:** `citas`

| Módulo | Visible | C | R | E | D | Alcance | Financiero | Costos | Config |
|--------|---------|---|---|---|---|---------|------------|--------|--------|
| Dashboard | ✅ | — | ✅ | — | — | asignado | ❌ | ❌ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ❌ | ❌ | — |
| Citas | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ❌ | — | — |
| Servicios | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ❌ | ❌ | — |
| Empleados | ✅ | ❌ | ✅ | ❌ | ❌ | sucursal | ❌ | ❌ | — |
| Proveedores | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Productos | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ❌ | ❌ | — |
| Inventario | ✅ | ❌ | ✅ | ✅ | ❌ | todo | ❌ | ❌ | — |
| Promociones | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ❌ | — | — |
| Agenda | ✅ | ✅ | ✅ | ✅ | ❌ | todo | ❌ | — | — |
| Reportes | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Capacitaciones | ✅ | ❌ | ✅ | ❌ | ❌ | asignado | ❌ | — | — |
| Ficha Servicios | ✅ | ✅ | ✅ | ✅ | ❌ | asignado | ❌ | ❌ | — |
| Costos Fijos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Resumen Costos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Ingresos/Egresos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Usuarios | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Roles | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |

**Reglas especiales:**
- ❌ Sin acceso a caja, costos, reportes, finanzas
- ❌ Sin administración de usuarios
- ❌ Sin acceso a proveedores
- ⚠️ Solo edita inventario (ajuste de stock)
- ⚠️ Dashboard muestra solo sus citas del día (no KPIs financieros)
- ⚠️ Ficha de servicios solo sus tareas asignadas

---

## 3.5 PROFESIONAL (Nivel 4) — Solo su Agenda

**Dashboard inicial:** `agenda`

| Módulo | Visible | C | R | E | D | Alcance | Financiero | Costos | Config |
|--------|---------|---|---|---|---|---------|------------|--------|--------|
| Dashboard | ✅ | — | ✅ | — | — | propio | ❌ | ❌ | ❌ |
| Clientes | ✅ | ❌ | ✅ | ❌ | ❌ | asignado | ❌ | ❌ | — |
| Citas | ✅ | ❌ | ✅ | ✅ | ❌ | propio | ❌ | — | — |
| Servicios | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ❌ | ❌ | — |
| Empleados | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Proveedores | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Productos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Inventario | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Promociones | ✅ | ❌ | ✅ | ❌ | ❌ | todo | ❌ | — | — |
| Agenda | ✅ | ❌ | ✅ | ❌ | ❌ | propio | ❌ | — | — |
| Reportes | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Capacitaciones | ✅ | ❌ | ✅ | ❌ | ❌ | asignado | ❌ | — | — |
| Ficha Servicios | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Costos Fijos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Resumen Costos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Ingresos/Egresos | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Usuarios | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |
| Roles | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — |

**Reglas especiales:**
- ✅ Solo ve sus propias citas (filtrar por `Profesional Asignado = currentUser.empleadoId`)
- ✅ Solo ve clientes que tienen citas con él/ella
- ✅ Solo ve su propia agenda
- ✅ Solo ve capacitaciones donde está asignado/a
- ❌ Sin acceso a ningún dato financiero, costos, caja, reportes
- ❌ No puede crear/editar/eliminar nada excepto cambiar estado de cita

---

# 4. CAPA JS DE PERMISOS (DISEÑO DE API)

## 4.1 Archivo: `static/auth-permissions.js`

```javascript
/**
 * auth-permissions.js — Capa de Permisos para Frontend
 * Depende de: auth-login.js (authState)
 */

// ═══════════════════════════════════════════
// API PÚBLICA — Funciones de consulta
// ═══════════════════════════════════════════

/**
 * Obtener el usuario actual (sesión activa)
 * @returns {Object|null} { id, nombre, email, avatar, empleadoId }
 */
function getCurrentUser() {
  return authState.currentUser;
}

/**
 * Obtener el rol del usuario actual
 * @returns {Object|null} { id, nombre, nivel, dashboard, color }
 */
function getCurrentRole() {
  return authState.currentRole;
}

/**
 * Verificar si el usuario puede ver un módulo
 * @param {string} module - Identificador del módulo (ej: 'clientes')
 * @returns {boolean}
 */
function canView(module) {
  const perm = getModulePermission(module);
  return !!perm && perm.Visible === true;
}

/**
 * Verificar si el usuario puede crear en un módulo
 * @param {string} module - Identificador del módulo
 * @returns {boolean}
 */
function canCreate(module) {
  const perm = getModulePermission(module);
  return !!perm && perm.Crear === true;
}

/**
 * Verificar si el usuario puede editar en un módulo
 * @param {string} module - Identificador del módulo
 * @returns {boolean}
 */
function canEdit(module) {
  const perm = getModulePermission(module);
  return !!perm && perm.Editar === true;
}

/**
 * Verificar si el usuario puede eliminar en un módulo
 * @param {string} module - Identificador del módulo
 * @returns {boolean}
 */
function canDelete(module) {
  const perm = getModulePermission(module);
  return !!perm && perm.Eliminar === true;
}

/**
 * Verificar visibilidad de un campo específico
 * @param {string} module - Módulo (ej: 'servicios')
 * @param {string} fieldName - Nombre del campo en español (ej: 'Costo Variable')
 * @returns {Object} { visible, editable, soloLectura, sensible }
 */
function canViewField(module, fieldName) {
  const fieldPerms = authState.permissions.fields || [];
  const fp = fieldPerms.find(
    f => f.Modulo === module && f.Campo === fieldName
  );

  if (!fp) {
    // Si no hay regla explícita → visible y editable por default
    return { visible: true, editable: true, soloLectura: false, sensible: false };
  }

  return {
    visible: fp.Visible !== false,
    editable: fp.Editable !== false && fp.Solo_Lectura !== true,
    soloLectura: fp.Solo_Lectura === true,
    sensible: fp.Sensible === true,
  };
}

/**
 * Obtener el alcance de datos para un módulo
 * @param {string} module
 * @returns {string} 'todo' | 'propio' | 'asignado' | 'sucursal'
 */
function getDataScope(module) {
  const perm = getModulePermission(module);
  return perm ? perm.Alcance_Datos || 'todo' : 'todo';
}

/**
 * Listar todos los módulos visibles para el rol actual
 * @returns {Array<Object>} Array de permisos de módulo con Visible=true
 */
function getVisibleModules() {
  return (authState.permissions.modules || []).filter(m => m.Visible === true);
}

/**
 * Obtener el menú de navegación para el rol actual
 * @returns {Array} Estructura de menú (categorías → items)
 */
function getMenuForRole() {
  return authState.menu || [];
}

/**
 * Filtrar registros según el alcance del rol
 * @param {Array} records - Array de registros de Airtable
 * @param {Object} user - Usuario actual
 * @param {Object} role - Rol actual
 * @param {string} module - Módulo
 * @returns {Array} Registros filtrados
 */
function filterRecordsByScope(records, user, role, module) {
  const scope = getDataScope(module);

  switch (scope) {
    case 'todo':
      // El usuario ve todos los registros
      return records;

    case 'propio':
      // Solo registros donde el profesional asignado es el empleado vinculado
      if (!user.empleadoId) return [];
      return records.filter(r => {
        const field = r.fields['Profesional Asignado'] ||
                      r.fields['Empleado Asignado'];
        return linkedIncludes(field, user.empleadoId);
      });

    case 'asignado':
      // Registros asignados al empleado o a su sucursal
      if (!user.empleadoId) return records; // fallback: ver todo
      return records.filter(r => {
        const profesional = r.fields['Profesional Asignado'] ||
                           r.fields['Empleado Asignado'];
        const empleados = r.fields['Empleados Participantes'] ||
                         r.fields['Empleado Vinculado'];
        return linkedIncludes(profesional, user.empleadoId) ||
               linkedIncludes(empleados, user.empleadoId);
      });

    case 'sucursal':
      // Todos los registros de la sucursal (MVP: mismo que 'todo')
      return records;

    default:
      return records;
  }
}

// ═══════════════════════════════════════════
// FUNCIONES DE UTILIDAD (privadas)
// ═══════════════════════════════════════════

function getModulePermission(module) {
  const modules = authState.permissions.modules || [];
  return modules.find(m => m.Modulo === module) || null;
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
// HELPERS DE UI — Mostrar/ocultar elementos
// ═══════════════════════════════════════════

/**
 * Aplicar visibilidad de campos en un formulario
 * @param {string} module - Módulo
 * @param {HTMLElement} formEl - Elemento del formulario
 */
function applyFieldVisibility(module, formEl) {
  const fieldPerms = authState.permissions.fields || [];
  const moduleFields = fieldPerms.filter(f => f.Modulo === module);

  moduleFields.forEach(fp => {
    const fieldEl = formEl.querySelector(`[data-field="${fp.Campo}"]`);
    if (!fieldEl) return;

    if (fp.Visible === false) {
      fieldEl.style.display = 'none';
    }

    if (fp.Solo_Lectura === true) {
      const input = fieldEl.querySelector('input, select, textarea');
      if (input) {
        input.readOnly = true;
        input.disabled = true;
        input.style.opacity = '0.6';
      }
    }

    if (fp.Sensible === true) {
      fieldEl.classList.add('field-sensitive');
    }
  });
}

/**
 * Ocultar columnas de tabla según permisos de campo
 * @param {string} module
 * @param {HTMLTableElement} tableEl
 */
function applyTableColumnVisibility(module, tableEl) {
  const fieldPerms = authState.permissions.fields || [];
  const moduleFields = fieldPerms.filter(f => f.Modulo === module);

  moduleFields.forEach(fp => {
    if (fp.Visible === false) {
      const th = tableEl.querySelector(`th[data-field="${fp.Campo}"]`);
      const tds = tableEl.querySelectorAll(`td[data-field="${fp.Campo}"]`);
      if (th) th.style.display = 'none';
      tds.forEach(td => td.style.display = 'none');
    }
  });
}

/**
 * Construir menú de navegación dinámico
 * @param {Array} visibleCategories - Categorías que tienen al menos 1 módulo visible
 * @returns {Array} Estructura de menú
 */
function buildMenu(visibleCategories) {
  const modules = authState.permissions.modules || [];
  const menu = [];

  visibleCategories.forEach(cat => {
    const catModules = modules.filter(
      m => m.Categoria_Menu === cat.id && m.Visible === true
    );

    if (catModules.length === 0) return;

    menu.push({
      category: cat.Nombre,
      icon: cat.Icono,
      collapsed: cat.Colapsada_Default,
      items: catModules.map(m => ({
        id: m.Modulo,
        label: MODULE_LABELS[m.Modulo] || m.Modulo,
        icon: MODULE_ICONS[m.Modulo] || '📄',
      })),
    });
  });

  return menu;
}

/**
 * Nombres legibles para módulos
 */
const MODULE_LABELS = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  citas: 'Citas',
  servicios: 'Servicios',
  empleados: 'Empleados',
  proveedores: 'Proveedores',
  productos: 'Productos',
  inventario: 'Inventario',
  promociones: 'Promociones',
  agenda: 'Agenda',
  reportes: 'Reportes',
  capacitaciones: 'Capacitaciones',
  ficha_servicios: 'Ficha Servicios',
  costos_fijos: 'Costos Fijos',
  resumen_costos: 'Resumen Costos',
  ingresos_egresos: 'Caja',
  usuarios: 'Usuarios',
  roles: 'Roles',
};

const MODULE_ICONS = {
  dashboard: '📊',
  clientes: '👥',
  citas: '📅',
  servicios: '💅',
  empleados: '👩‍💼',
  proveedores: '🏢',
  productos: '📦',
  inventario: '📋',
  promociones: '🏷️',
  agenda: '📆',
  reportes: '📈',
  capacitaciones: '🎓',
  ficha_servicios: '✅',
  costos_fijos: '💸',
  resumen_costos: '📉',
  ingresos_egresos: '💰',
  usuarios: '👤',
  roles: '🔑',
};

// ═══════════════════════════════════════════
// PARSEADORES DE RESPUESTAS DE AIRTABLE
// ═══════════════════════════════════════════

function parseModulePermissions(records) {
  return records.map(r => ({
    id: r.id,
    Modulo: r.fields.Modulo,
    Categoria_Menu: r.fields.Categoria_Menu,
    Visible: r.fields.Visible !== false,
    Crear: r.fields.Crear === true,
    Leer: r.fields.Leer === true,
    Editar: r.fields.Editar === true,
    Eliminar: r.fields.Eliminar === true,
    Alcance_Datos: r.fields.Alcance_Datos || 'todo',
    Ver_Financiero: r.fields.Ver_Financiero === true,
    Ver_Costos: r.fields.Ver_Costos === true,
    Ver_Configuracion: r.fields.Ver_Configuracion === true,
    Vista_Default: r.fields.Vista_Default || 'grid',
  }));
}

function parseFieldPermissions(records) {
  return records.map(r => ({
    id: r.id,
    Modulo: r.fields['Modulo/Tabla'],
    Campo: r.fields.Campo,
    Visible: r.fields.Visible !== false,
    Editable: r.fields.Editable !== false,
    Solo_Lectura: r.fields['Solo Lectura'] === true,
    Sensible: r.fields.Sensible === true,
  }));
}

function collectVisibleCategories(moduleRecords) {
  // Extraer categorías únicas de los módulos visibles
  const catIds = [...new Set(
    moduleRecords
      .filter(r => r.fields.Visible !== false)
      .map(r => r.fields.Categoria_Menu)
      .filter(Boolean)
  )];

  // En MVP, devolver IDs de categoría. En producción, cargar desde tabla Categorías_Menú.
  const CATEGORIES = [
    { id: 'principal', Nombre: 'PRINCIPAL', Icono: '📊', Colapsada_Default: false, Orden: 1 },
    { id: 'gestion', Nombre: 'GESTIÓN', Icono: '💰', Colapsada_Default: false, Orden: 2 },
    { id: 'operaciones', Nombre: 'OPERACIONES', Icono: '📋', Colapsada_Default: false, Orden: 3 },
    { id: 'administracion', Nombre: 'ADMINISTRACIÓN', Icono: '🏢', Colapsada_Default: false, Orden: 4 },
    { id: 'configuracion', Nombre: 'CONFIGURACIÓN', Icono: '⚙️', Colapsada_Default: true, Orden: 5 },
  ];

  return CATEGORIES.filter(c => catIds.includes(c.id));
}
```

## 4.2 Integración en el HTML

```html
<!-- Orden de carga de scripts en index.html -->
<script src="api.js"></script>
<script src="auth-login.js"></script>
<script src="auth-permissions.js"></script>

<!-- El resto del JS de la app usa las funciones de auth-permissions.js -->
<script>
// Ejemplo: Antes de mostrar botón "Crear Cliente"
function renderClientesToolbar() {
  let html = '';

  if (canCreate('clientes')) {
    html += `<button onclick="openModal('clientes')" class="btn-primary">+ Nuevo Cliente</button>`;
  }

  return html;
}

// Ejemplo: Filtrar registros por alcance antes de renderizar
async function loadClientes() {
  const allRecords = await getRecords('clientes');
  const visibleRecords = filterRecordsByScope(
    allRecords,
    getCurrentUser(),
    getCurrentRole(),
    'clientes'
  );
  renderClientesCards(visibleRecords);
}

// Ejemplo: Ocultar columnas de costo en tabla de servicios
function renderServiciosTable(records) {
  // ... generar tabla
  applyTableColumnVisibility('servicios', tableEl);
}
</script>
```

## 4.3 Resumen de la API JS

| Función | Parámetros | Retorna | Uso |
|---------|-----------|---------|-----|
| `getCurrentUser()` | — | `Object` | Mostrar nombre/avatar en header |
| `getCurrentRole()` | — | `Object` | Mostrar badge de rol |
| `canView(module)` | `string` | `boolean` | Condicionar renderizado de vistas |
| `canCreate(module)` | `string` | `boolean` | Mostrar/ocultar botón "+" |
| `canEdit(module)` | `string` | `boolean` | Mostrar/ocultar botón "Editar" |
| `canDelete(module)` | `string` | `boolean` | Mostrar/ocultar botón "Eliminar" |
| `canViewField(module, field)` | `string, string` | `Object` | Visibilidad/edición de campos en forms |
| `getDataScope(module)` | `string` | `string` | Alcance de datos ('todo','propio','asignado') |
| `getVisibleModules()` | — | `Array` | Lista de módulos accesibles |
| `getMenuForRole()` | — | `Array` | Construir sidebar dinámico |
| `filterRecordsByScope(records, user, role, module)` | `Array, Object, Object, string` | `Array` | Filtrar registros antes de renderizar |
| `applyFieldVisibility(module, formEl)` | `string, HTMLElement` | `void` | Ocultar/deshabilitar campos en formularios |
| `applyTableColumnVisibility(module, tableEl)` | `string, HTMLTableElement` | `void` | Ocultar columnas en tablas |

---

# 5. REGLAS DE PROTECCIÓN

## 5.1 Reglas de Seguridad en Frontend (JS)

```javascript
/**
 * auth-guards.js — Reglas de protección en frontend
 */

// ═══════════════════════════════════════════
// REGLA 1: No eliminar el último administrador
// ═══════════════════════════════════════════

async function guardDeleteUser(userId) {
  // 1. Obtener el usuario a eliminar
  const user = await getAirtableRecord('Usuarios', userId);
  const userRoleId = extractLinkedId(user.fields.Rol);

  // 2. Verificar si tiene rol Admin
  const role = await getAirtableRecord('Roles', userRoleId);
  if (role.fields.Nivel_Jerarquico !== 1) {
    // No es admin, se puede eliminar
    return { allowed: true };
  }

  // 3. Contar cuántos admins activos quedan
  const allUsers = await fetchAirtable('Usuarios?maxRecords=500');
  const adminRoleIds = await getAdminRoleIds();

  const activeAdmins = allUsers.records.filter(r => {
    const rid = extractLinkedId(r.fields.Rol);
    return adminRoleIds.includes(rid) &&
           r.fields.Activo !== false &&
           r.id !== userId;
  });

  if (activeAdmins.length === 0) {
    return {
      allowed: false,
      message: '⛔ No se puede eliminar el último administrador del sistema. ' +
               'Debe existir al menos un administrador activo.'
    };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════
// REGLA 2: No quitar permisos críticos al admin principal
// ═══════════════════════════════════════════

async function guardModifyAdminRole(roleId, changes) {
  const role = await getAirtableRecord('Roles', roleId);

  // Solo aplica a roles de sistema (Administrador)
  if (!role.fields.Es_Sistema) {
    return { allowed: true };
  }

  // Verificar cambios prohibidos
  const forbiddenChanges = [];

  if (changes.Activo === false) {
    forbiddenChanges.push('No se puede desactivar el rol Administrador');
  }
  if (changes.Nivel_Jerarquico && changes.Nivel_Jerarquico !== 1) {
    forbiddenChanges.push('No se puede cambiar el nivel jerárquico del Administrador');
  }

  // Verificar que no se quiten permisos críticos
  if (changes.permisos) {
    const criticalModules = ['usuarios', 'roles', 'dashboard'];
    const removed = criticalModules.filter(m => {
      const newPerm = changes.permisos.find(p => p.Modulo === m);
      return newPerm && newPerm.Visible === false;
    });
    if (removed.length > 0) {
      forbiddenChanges.push(
        `No se puede quitar acceso a: ${removed.join(', ')}`
      );
    }
  }

  if (forbiddenChanges.length > 0) {
    return {
      allowed: false,
      message: '⛔ Cambios no permitidos en el rol Administrador:\n' +
               forbiddenChanges.map(c => `• ${c}`).join('\n')
    };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════
// REGLA 3: No eliminar rol con usuarios activos
// ═══════════════════════════════════════════

async function guardDeleteRole(roleId) {
  // 1. Verificar si es rol de sistema
  const role = await getAirtableRecord('Roles', roleId);
  if (role.fields.Es_Sistema) {
    return {
      allowed: false,
      message: '⛔ No se puede eliminar un rol de sistema. ' +
               'Los roles de sistema están protegidos.'
    };
  }

  // 2. Contar usuarios activos con este rol
  const users = await fetchAirtable(
    `Usuarios?filterByFormula={Rol}="${roleId}"&maxRecords=100`
  );

  const activeUsers = (users.records || []).filter(
    r => r.fields.Activo !== false
  );

  if (activeUsers.length > 0) {
    const userNames = activeUsers.map(u => u.fields.Nombre).join(', ');
    return {
      allowed: false,
      message: `⛔ No se puede eliminar el rol porque tiene ${activeUsers.length} usuario(s) activo(s):\n` +
               `${userNames}\n\nReasigná los usuarios a otro rol antes de eliminar.`
    };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════
// REGLA 4: Confirmar cambios críticos
// ═══════════════════════════════════════════

/**
 * Diálogo de confirmación para acciones críticas.
 * @param {string} action - Descripción de la acción
 * @param {string} detail - Detalle adicional
 * @returns {Promise<boolean>} true si el usuario confirmó
 */
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

    modal.querySelector('#confirm-cancel').onclick = () => {
      modal.remove();
      resolve(false);
    };

    modal.querySelector('#confirm-ok').onclick = () => {
      modal.remove();
      resolve(true);
    };

    // Cerrar con Escape
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', onEsc);
        resolve(false);
      }
    };
    document.addEventListener('keydown', onEsc);
  });
}

// ═══════════════════════════════════════════
// REGLA 5: Timeout de sesión
// ═══════════════════════════════════════════

function startSessionTimeoutCheck() {
  // Verificar cada 60 segundos si la sesión expiró
  setInterval(() => {
    const session = loadSession();
    if (!session || isSessionExpired(session)) {
      clearSession();
      showLoginScreen();
      // Mostrar mensaje amigable
      alert('Tu sesión ha expirado. Por favor, ingresá de nuevo.');
    }
  }, 60000);
}

// ═══════════════════════════════════════════
// REGLA 6: Guard middleware para acciones
// ═══════════════════════════════════════════

/**
 * Ejecutar una acción con verificación de permisos.
 * Usar en TODOS los handlers de botones.
 *
 * @param {string} module - Módulo
 * @param {string} action - 'create' | 'edit' | 'delete'
 * @param {Function} fn - Función a ejecutar si está permitido
 */
async function guardAction(module, action, fn) {
  // Verificar autenticación
  if (!authState.isAuthenticated) {
    showLoginScreen();
    return;
  }

  // Verificar permiso
  const allowed = action === 'create' ? canCreate(module) :
                  action === 'edit'   ? canEdit(module) :
                  action === 'delete' ? canDelete(module) :
                  canView(module);

  if (!allowed) {
    window.showToast('⛔ No tenés permisos para realizar esta acción.', 'error');
    return;
  }

  // Para eliminación, pedir confirmación
  if (action === 'delete') {
    const confirmed = await confirmCriticalAction(
      `Vas a eliminar este registro de "${MODULE_LABELS[module] || module}".`,
      'Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;
  }

  // Ejecutar la acción
  try {
    await fn();
  } catch (error) {
    console.error(`Error en ${action} de ${module}:`, error);
    window.showToast(`Error: ${error.message}`, 'error');
  }
}
```

## 5.2 Resumen de Reglas de Protección

| # | Regla | Tipo | Implementación |
|---|-------|------|---------------|
| 1 | No eliminar el último admin | Bloqueo + validación | `guardDeleteUser()` — cuenta admins antes de borrar |
| 2 | No quitar permisos críticos al admin | Bloqueo | `guardModifyAdminRole()` — verifica cambios prohibidos |
| 3 | No eliminar rol con usuarios activos | Bloqueo + validación | `guardDeleteRole()` — cuenta usuarios con ese rol |
| 4 | Confirmar cambios críticos | UI | `confirmCriticalAction()` — modal de confirmación |
| 5 | Timeout de sesión (8h) | Automático | `startSessionTimeoutCheck()` — polling cada 60s |
| 6 | Guard middleware para acciones | Decorador | `guardAction(module, action, fn)` — wrapper universal |

---

# 6. INTEGRACIÓN CON EL FRONTEND ACTUAL

## 6.1 Cambios necesarios en `static/index.html`

### A. Agregar pantalla de login

Insertar el HTML de `#login-screen` **ANTES** del `#app-container` actual.

```html
<body>
  <!-- PANTALLA DE LOGIN — visible hasta autenticación -->
  <div id="login-screen" class="login-screen">
    <!-- ... (ver sección 1.2) -->
  </div>

  <!-- APP CONTAINER — oculto hasta autenticación -->
  <div id="app-container" class="hidden">
    <!-- Sidebar, main, bottom nav actuales -->
  </div>

  <!-- Scripts -->
  <script src="api.js"></script>
  <script src="auth-login.js"></script>
  <script src="auth-permissions.js"></script>
  <script src="auth-guards.js"></script>
  <!-- Resto del JS de la app -->
</body>
```

### B. Construir sidebar dinámicamente

Reemplazar el sidebar hardcodeado con generación basada en `getMenuForRole()`:

```javascript
function renderSidebar() {
  const menu = getMenuForRole();
  const sidebar = document.querySelector('.sidebar');
  let html = '<div class="sidebar-brand" onclick="navigateTo(\'dashboard\')">💇 Salón Pro</div>';

  menu.forEach(section => {
    html += `<div class="sidebar-label">${section.category}</div>`;
    section.items.forEach(item => {
      html += `
        <button class="sidebar-btn" onclick="navigateTo('${item.id}')" data-page="${item.id}">
          <span>${item.icon}</span>
          <span>${item.label}</span>
        </button>
      `;
    });
  });

  // Botón de logout al final
  html += `
    <div style="margin-top: auto; padding: 12px 18px;">
      <button id="logout-btn" class="sidebar-btn" style="color: var(--danger);">
        <span>🚪</span>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  `;

  sidebar.innerHTML = html;
}
```

### C. Header con info del usuario

```javascript
function renderUserHeader() {
  const user = getCurrentUser();
  const role = getCurrentRole();

  const header = document.querySelector('.header-user') ||
                 document.createElement('div');
  header.className = 'header-user';
  header.innerHTML = `
    <div class="user-avatar">
      ${user.avatar
        ? `<img src="${user.avatar}" alt="${user.nombre}" />`
        : `<span>${(user.nombre || 'U')[0].toUpperCase()}</span>`
      }
    </div>
    <div class="user-info">
      <span class="user-name">${user.nombre}</span>
      <span class="user-role-badge" style="background: ${role.color}20; color: ${role.color};">
        ${role.nombre}
      </span>
    </div>
  `;

  if (!header.parentNode) {
    document.querySelector('.header')?.appendChild(header);
  }
}
```

### D. Proteger todas las acciones CRUD existentes

```javascript
// Antes:
// <button onclick="deleteRecord('clientes', '${id}')">Eliminar</button>

// Después:
// <button onclick="guardAction('clientes', 'delete', () => deleteRecord('clientes', '${id}'))">Eliminar</button>

// Antes:
// function openCreateModal() { ... }

// Después:
// function openCreateModal() {
//   if (!canCreate(currentPageModule)) {
//     showToast('⛔ No tenés permisos para crear.', 'error');
//     return;
//   }
//   ...
// }
```

## 6.2 Orden de inicialización

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Intentar restaurar sesión
  const savedSession = loadSession();

  if (savedSession && !isSessionExpired(savedSession)) {
    // 2. Restaurar estado de auth
    restoreAuthState(savedSession);

    // 3. Ocultar login, mostrar app
    hideLoginScreen();

    // 4. Construir UI basada en permisos
    renderSidebar();
    renderUserHeader();

    // 5. Iniciar monitoreo de sesión
    startSessionTimeoutCheck();

    // 6. Navegar al dashboard del rol
    navigateTo(savedSession.role.dashboard);
  } else {
    // Mostrar login
    clearSession();
    showLoginScreen();
  }
});
```

---

# 7. PLAN DE MIGRACIÓN A PRODUCCIÓN

## 7.1 Alcance del MVP Actual

| Aspecto | MVP (AHORA) | Producción (FUTURO) |
|---------|-------------|---------------------|
| **Identidad** | Email como identificador único | Email + password (bcrypt) |
| **Autenticación** | Sin contraseña — solo email | Password hasheado con bcrypt |
| **Sesión** | localStorage (8h TTL) | JWT (access + refresh tokens) |
| **Validación** | Solo frontend (regex email) | Backend proxy con validación |
| **Autorización** | Capa JS client-side | Middleware server-side + client-side |
| **Token Airtable** | Expuesto en frontend | Proxy backend (nunca al cliente) |
| **Roles/Permisos** | En Airtable (tablas nuevas) | En BD propia (PostgreSQL/Supabase) |
| **Rate Limiting** | Cliente (token bucket en JS) | Servidor (IP-based, cuenta-based) |
| **CSRF** | No implementado | Token CSRF en formularios |
| **CORS** | Airtable maneja | Backend proxy configura |

## 7.2 Script de Seed para Tablas de Auth

```python
# scripts/seed_auth.py — Crear datos iniciales de Auth en Airtable
# Ejecutar: python3 scripts/seed_auth.py

import os, requests, json

AIRTABLE_TOKEN = os.environ.get('AIRTABLE_TOKEN')
BASE_ID = 'app93Vhy56KrxNhwe'
HEADERS = {
    'Authorization': f'Bearer {AIRTABLE_TOKEN}',
    'Content-Type': 'application/json'
}
BASE_URL = f'https://api.airtable.com/v0/{BASE_ID}'

def create_table(name, fields):
    """Crear tabla en Airtable vía API Metadata"""
    # Nota: La API Metadata de Airtable no permite crear tablas.
    # Las tablas deben crearse manualmente o vía UI.
    # Este script asume que las tablas YA existen.
    pass

def seed_roles():
    """Insertar los 4 roles iniciales"""
    roles = [
        {
            'Nombre': 'Administrador',
            'Descripcion': 'Acceso total al sistema. Puede administrar usuarios, roles y configuración.',
            'Nivel_Jerarquico': 1,
            'Activo': True,
            'Es_Sistema': True,
            'Puede_Administrar_Roles': True,
            'Dashboard_Inicial': 'dashboard',
            'Color_Badge': '#c97b5d'
        },
        {
            'Nombre': 'Gerente',
            'Descripcion': 'Gestión operativa y reportes. Sin acceso a configuración crítica.',
            'Nivel_Jerarquico': 2,
            'Activo': True,
            'Es_Sistema': False,
            'Puede_Administrar_Roles': True,
            'Dashboard_Inicial': 'dashboard',
            'Color_Badge': '#5b8c5a'
        },
        {
            'Nombre': 'Empleado Gestión',
            'Descripcion': 'Operación diaria: clientes, citas, agenda. Sin costos ni finanzas.',
            'Nivel_Jerarquico': 3,
            'Activo': True,
            'Es_Sistema': False,
            'Puede_Administrar_Roles': False,
            'Dashboard_Inicial': 'citas',
            'Color_Badge': '#5b8c5a'
        },
        {
            'Nombre': 'Profesional',
            'Descripcion': 'Solo ve su agenda, citas y clientes asignados. Sin acceso a caja ni costos.',
            'Nivel_Jerarquico': 4,
            'Activo': True,
            'Es_Sistema': False,
            'Puede_Administrar_Roles': False,
            'Dashboard_Inicial': 'agenda',
            'Color_Badge': '#d4954a'
        }
    ]

    created = []
    for role in roles:
        resp = requests.post(
            f'{BASE_URL}/Roles',
            headers=HEADERS,
            json={'fields': role}
        )
        if resp.status_code == 200:
            created.append(resp.json())
            print(f"  ✅ Rol creado: {role['Nombre']}")
        else:
            print(f"  ❌ Error creando {role['Nombre']}: {resp.text}")

    return created

def seed_usuarios(role_ids):
    """Crear usuarios demo vinculados a roles"""
    usuarios = [
        {
            'Nombre': 'Diego López',
            'Email': 'admin@salonpro.com',
            'Activo': True,
            'Rol': [role_ids['Administrador']]
        },
        {
            'Nombre': 'María García',
            'Email': 'gerente@salonpro.com',
            'Activo': True,
            'Rol': [role_ids['Gerente']]
        },
        {
            'Nombre': 'Carlos Rodríguez',
            'Email': 'carlos@salonpro.com',
            'Activo': True,
            'Rol': [role_ids['Empleado Gestión']]
        },
        {
            'Nombre': 'Ana Martínez',
            'Email': 'ana@salonpro.com',
            'Activo': True,
            'Rol': [role_ids['Profesional']]
        }
    ]

    for user in usuarios:
        resp = requests.post(
            f'{BASE_URL}/Usuarios',
            headers=HEADERS,
            json={'fields': user}
        )
        if resp.status_code == 200:
            print(f"  ✅ Usuario: {user['Nombre']} ({user['Email']})")
        else:
            print(f"  ❌ Error: {resp.text}")

# ... (continuar con seed de Permisos_Modulo, Permisos_Campo, Categorias_Menu)

if __name__ == '__main__':
    print('🌱 Sembrando datos de Auth...')
    print('\n📋 Creando Roles...')
    roles = seed_roles()
    # Mapear nombres → IDs
    role_map = {r['fields']['Nombre']: r['id'] for r in roles}

    print('\n👤 Creando Usuarios demo...')
    seed_usuarios(role_map)

    print('\n✅ Seed de Auth completado.')
```

## 7.3 Hoja de Ruta hacia Producción

| Fase | Tareas | Prioridad |
|------|--------|-----------|
| **Fase A (MVP)** — Actual | Login por email, 4 roles, sidebar dinámico, localStorage session | 🔴 AHORA |
| **Fase B** — Backend proxy | Servidor Node/Express que oculta token Airtable, valida sesiones | 🟡 Próximo |
| **Fase C** — Passwords | Agregar bcrypt, campo `PasswordHash`, formulario login con contraseña | 🟡 |
| **Fase D** — JWT | Reemplazar localStorage session por JWT (access 15min + refresh 7d) | 🟢 Futuro |
| **Fase E** — Supabase Auth | Migrar auth a Supabase Auth (email/password, magic link, OAuth) | 🟢 Futuro |

---

# APÉNDICE A: Resumen de Archivos a Crear

| Archivo | Contenido | Líneas estimadas |
|---------|-----------|-----------------|
| `static/auth-login.js` | Lógica de login/logout, manejo de sesión localStorage, UI states | ~200 |
| `static/auth-permissions.js` | Capa de permisos (canView, canCreate, etc.), parseo de permisos, filtrado por alcance | ~250 |
| `static/auth-guards.js` | Reglas de protección (no eliminar último admin, confirmaciones, timeout sesión) | ~150 |
| `scripts/seed_auth.py` | Script para crear tablas y datos iniciales de auth en Airtable | ~200 |
| Actualización `static/index.html` | Pantalla de login, sidebar dinámico, header de usuario, protección de acciones | ~300 |
| Actualización `static/api.js` | Endpoints para tablas de auth (Usuarios, Roles, Permisos) | ~50 |

---

# APÉNDICE B: Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA DE AUTH                          │
│                                                                   │
│  ┌─────────────┐     ┌─────────────────┐     ┌────────────────┐  │
│  │  Login UI   │────▶│  auth-login.js  │────▶│   Airtable API  │  │
│  │  (HTML/CSS) │     │  handleLogin()  │     │  GET Usuarios   │  │
│  └─────────────┘     └────────┬────────┘     │  GET Roles      │  │
│                               │               │  GET Permisos   │  │
│                               ▼               └────────┬───────┘  │
│                      ┌─────────────────┐              │          │
│                      │   localStorage  │◀─────────────┘          │
│                      │  session JSON   │                         │
│                      └────────┬────────┘                         │
│                               │                                   │
│         ┌─────────────────────┼─────────────────────┐            │
│         ▼                     ▼                     ▼            │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐    │
│  │ auth-guards  │   │ auth-permissions │   │  Sidebar     │    │
│  │ (protección) │   │ (canView/Create) │   │  dinámico    │    │
│  └──────────────┘   └────────┬─────────┘   └──────────────┘    │
│                               │                                   │
│                               ▼                                   │
│                      ┌──────────────────┐                        │
│                      │   App Frontend   │                        │
│                      │ (renderizado     │                        │
│                      │  condicional)    │                        │
│                      └──────────────────┘                        │
│                                                                   │
│  TABLAS AIRTABLE NUEVAS:                                          │
│  ┌───────────┐ ┌───────────┐ ┌──────────────┐ ┌─────────────┐   │
│  │ Usuarios  │ │  Roles    │ │ Permisos     │ │ Categorías  │   │
│  │           │ │           │ │ Módulo/Campo │ │ Menú        │   │
│  └───────────┘ └───────────┘ └──────────────┘ └─────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

*Documento de diseño completado el 2026-06-02.*
*Próximo paso: Revisión con Diego para aprobación e implementación.*
