---
document: AUTH_DESIGN.md
project: gestion-desalones-de-belleza
version: 1.0
authors: [Auth & Permissions Designer]
date: 2026-06-02
phase: design
dependencies: [AIRTABLE_CONTRACT.md, PRODUCT_CONTRACT.md]
status: draft — requiere aprobación del Lead y de Diego
---

# 🔐 Sistema de Autenticación y Permisos — Gestión de Salones de Belleza

## 1. Visión general

El sistema de autenticación permite que **empleados del salón** accedan al frontend web con credenciales personales. Cada empleado tiene un **rol** que define qué vistas y acciones puede realizar. El backend de datos es **Airtable** — no hay servidor de autenticación tradicional.

### Arquitectura

```
Usuario → Login Form (HTML/CSS/JS vanilla)
           │
           ├─ 1. Ingresa Email + Contraseña
           ├─ 2. JS hashea la contraseña (SHA-256 + salt)
           ├─ 3. fetch() a EMPLEADOS filtrando por Email
           ├─ 4. Compara hash local vs hash almacenado
           ├─ 5. Si ok → guarda sesión en localStorage
           │              (id, nombre, rol, token JWT-like*)
           └─ 6. Renderiza vistas según el rol
```

> ⚠️ **Limitación de seguridad:** Este es un sistema de **seguridad de interfaz** (UI-level), no de backend. La API de Airtable no tiene Row-Level Security nativa. Las protecciones son: (a) no exponer el token en el frontend fuera del login, (b) restricción de vistas por rol en el cliente, (c) ocultar botones/acciones no autorizados. **No es un sistema bancario**, es suficiente para uso interno de un salón de belleza.

---

## 2. Cambios necesarios en el schema Airtable

### 2.1 Tabla EMPLEADOS — Nuevos campos

Actualmente EMPLEADOS tiene 16 campos (12 manuales + 4 automáticos). Se proponen **7 campos nuevos**:

| # | Campo | Tipo Airtable | Descripción | Options |
|---|-------|--------------|-------------|---------|
| 13 | `USUARIO` | `email` | Email para login. Debe ser único | Requerido |
| 14 | `CONTRASENA` | `singleLineText` | Hash SHA-256 de la contraseña (NO texto plano) | Requerido. Mínimo 64 chars (hash hex) |
| 15 | `SALT` | `singleLineText` | Salt aleatorio único por empleado (16 bytes hex) | Requerido |
| 16 | `ROL` | `singleSelect` | Rol del empleado en el sistema | Choices: ver sección 3 |
| 17 | `ULTIMO_ACCESO` | `dateTime` | Fecha/hora del último login exitoso | `dateFormat: {name: "iso", format: "YYYY-MM-DDTHH:mm:ss"}` |
| 18 | `ACTIVO` | `checkbox` | Si el empleado puede acceder al sistema | Default: true |
| 19 | `NOTAS_AUTH` | `longText` | Notas internas de seguridad (no visibles en frontend) | Opcional |

### 2.2 Tabla ROLES (nueva tabla)

Se recomienda crear una tabla auxiliar `ROLES` para que el dueño/Admin pueda personalizar roles futuros sin tocar código:

| # | Campo | Tipo Airtable | Descripción |
|---|-------|--------------|-------------|
| 1 | `NOMBRE` | `singleLineText` | Nombre del rol (ej: "Administrador") |
| 2 | `CODIGO` | `singleLineText` | Código interno (ej: "admin") |
| 3 | `NIVEL` | `number` | Jerarquía numérica (1 = máximo poder) |
| 4 | `DESCRIPCION` | `longText` | Qué puede hacer este rol |
| 5 | `EMPLEADOS` | `multipleRecordLinks` → EMPLEADOS | Vincular empleados con este rol |

**Alternativa simplificada (recomendada para MVP):**
Usar solo `ROL` como `singleSelect` en EMPLEADOS sin tabla separada. Los roles se definen en código. La tabla ROLES se crea en Fase 2 si se requiere personalización avanzada.

---

## 3. Jerarquía de roles

| # | Rol | Código | Nivel | Quién lo usa |
|---|-----|--------|-------|-------------|
| 1 | **Administrador** | `admin` | 1 | Dueño del salón. Acceso total. |
| 2 | **Gerente** | `gerente` | 2 | Encargado de sucursal. Casi total menos config. |
| 3 | **Supervisor** | `supervisor` | 3 | Supervisa estilistas, ve reportes, maneja caja. |
| 4 | **Estilista** | `estilista` | 4 | Ve sus citas, clientes asignados, servicios. |
| 5 | **Recepcionista** | `recepcionista` | 5 | Agenda citas, registra clientes, cobra. |

### 3.1 SingleSelect en Airtable

```json
{
  "field": "ROL",
  "type": "singleSelect",
  "options": {
    "choices": [
      { "name": "Administrador", "color": "red" },
      { "name": "Gerente", "color": "orange" },
      { "name": "Supervisor", "color": "yellow" },
      { "name": "Estilista", "color": "green" },
      { "name": "Recepcionista", "color": "blue" }
    ]
  }
}
```

---

## 4. Matriz de permisos por rol

### 4.1 Leyenda

| Símbolo | Significado |
|---------|------------|
| ✅ | Acceso completo: ver, crear, editar, eliminar |
| 👁️ | Solo lectura: ver, no modificar |
| 🔒 | Sin acceso: vista oculta |
| ⚡ | Acceso limitado: solo registros propios |

### 4.2 Matriz completa (18 vistas)

| Vista | Admin | Gerente | Supervisor | Estilista | Recepcionista |
|-------|:-----:|:-------:|:----------:|:---------:|:-------------:|
| **Dashboard** | ✅ | ✅ | ✅ | ⚡ | 👁️ |
| **Clientes** | ✅ | ✅ | ✅ | 👁️ | ✅ |
| **Citas** | ✅ | ✅ | ✅ | ⚡ | ✅ |
| **Servicios** | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| **Empleados** | ✅ | ✅ | 👁️ | 🔒 | 🔒 |
| **Caja** | ✅ | ✅ | ✅ | 🔒 | ✅ |
| **Productos** | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Reportes** | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| **Proveedores** | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| **Inventario** | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Promociones** | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Agenda** | ✅ | ✅ | ✅ | ⚡ | ✅ |
| **Capacitaciones** | ✅ | ✅ | 👁️ | 👁️ | 🔒 |
| **Ficha Servicios** | ✅ | ✅ | ✅ | ⚡ | 👁️ |
| **Costos Fijos** | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Resumen Costos** | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Ingresos/Egresos** | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| **Login** | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4.3 Notas por rol

**⚡ Estilista — Acceso limitado a registros propios:**
- Dashboard: solo ve sus KPIs (citas del día, comisiones, clientes frecuentes)
- Citas: solo ve y edita sus propias citas
- Agenda: solo su propio calendario
- Ficha Servicios: solo servicios que él/ella realizó

**🔒 Vistas bloqueadas:** La vista no aparece en el sidebar/bottom nav. Si el usuario intenta acceder por URL directa, se redirige al Dashboard con un toast "No tienes permiso para acceder a esta sección".

**👁️ Solo lectura:** El usuario ve los datos pero los botones de crear/editar/eliminar están ocultos o deshabilitados.

---

## 5. Flujo de Login

### 5.1 Pantalla de login

```
┌──────────────────────────────┐
│                              │
│       💇 Salón Pro         │
│                              │
│   ┌──────────────────────┐  │
│   │ ✉️ Email             │  │
│   └──────────────────────┘  │
│                              │
│   ┌──────────────────────┐  │
│   │ 🔒 Contraseña        │  │
│   └──────────────────────┘  │
│                              │
│   [  Iniciar Sesión  ]     │
│                              │
│   ¿Olvidaste tu contraseña? │
│   Contactá al administrador │
│                              │
└──────────────────────────────┘
```

### 5.2 Proceso de login (JavaScript)

```javascript
// Pseudocódigo del flujo real
async function login(email, password) {
  // 1. Buscar empleado por email en Airtable
  const empleados = await AirtableAPI.getEmpleados({
    filterByFormula: `{USUARIO} = "${email}"`
  });
  
  if (!empleados.length) {
    return { success: false, error: "Email no encontrado" };
  }
  
  const empleado = empleados[0];
  
  // 2. Verificar que está activo
  if (!empleado.ACTIVO) {
    return { success: false, error: "Cuenta desactivada" };
  }
  
  // 3. Hashear la contraseña ingresada con el SALT del empleado
  const hash = await sha256(password + empleado.SALT);
  
  // 4. Comparar con el hash almacenado
  if (hash !== empleado.CONTRASENA) {
    return { success: false, error: "Contraseña incorrecta" };
  }
  
  // 5. Login exitoso — guardar sesión
  localStorage.setItem('session', JSON.stringify({
    id: empleado.id,
    nombre: empleado.NOMBRE,
    rol: empleado.ROL,
    exp: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
  }));
  
  // 6. Actualizar último acceso
  await AirtableAPI.updateEmpleado(empleado.id, {
    ULTIMO_ACCESO: new Date().toISOString()
  });
  
  return { success: true, empleado };
}
```

### 5.3 Protección de rutas

```javascript
// Al cargar cada página, verificar sesión
function checkAuth() {
  const session = JSON.parse(localStorage.getItem('session'));
  
  if (!session || Date.now() > session.exp) {
    // Sesión expirada o no existe → mostrar login
    localStorage.removeItem('session');
    showLoginScreen();
    return null;
  }
  
  // Renovar expiración en cada interacción
  session.exp = Date.now() + (8 * 60 * 60 * 1000);
  localStorage.setItem('session', JSON.stringify(session));
  
  return session;
}
```

### 5.4 Logout

```javascript
function logout() {
  localStorage.removeItem('session');
  window.location.reload(); // Vuelve al login
}
```

---

## 6. Restricción de vistas por rol (implementación)

### 6.1 Configuración de permisos por vista

```javascript
// PERMISSIONS_CONFIG — fuente de verdad
const VIEW_PERMISSIONS = {
  dashboard:       { admin:'full', gerente:'full', supervisor:'full', estilista:'own', recepcionista:'read' },
  clientes:        { admin:'full', gerente:'full', supervisor:'full', estilista:'read', recepcionista:'full' },
  citas:           { admin:'full', gerente:'full', supervisor:'full', estilista:'own', recepcionista:'full' },
  servicios:       { admin:'full', gerente:'full', supervisor:'read', estilista:'read', recepcionista:'read' },
  empleados:       { admin:'full', gerente:'full', supervisor:'read', estilista:'none', recepcionista:'none' },
  caja:            { admin:'full', gerente:'full', supervisor:'full', estilista:'none', recepcionista:'full' },
  productos:       { admin:'full', gerente:'full', supervisor:'full', estilista:'read', recepcionista:'read' },
  reportes:        { admin:'full', gerente:'full', supervisor:'full', estilista:'none', recepcionista:'none' },
  proveedores:     { admin:'full', gerente:'full', supervisor:'full', estilista:'none', recepcionista:'none' },
  inventario:      { admin:'full', gerente:'full', supervisor:'full', estilista:'read', recepcionista:'read' },
  promociones:     { admin:'full', gerente:'full', supervisor:'full', estilista:'read', recepcionista:'read' },
  agenda:          { admin:'full', gerente:'full', supervisor:'full', estilista:'own', recepcionista:'full' },
  capacitaciones:  { admin:'full', gerente:'full', supervisor:'read', estilista:'read', recepcionista:'none' },
  fichaServicios:  { admin:'full', gerente:'full', supervisor:'full', estilista:'own', recepcionista:'read' },
  costosFijos:     { admin:'full', gerente:'full', supervisor:'none', estilista:'none', recepcionista:'none' },
  resumenCostos:   { admin:'full', gerente:'full', supervisor:'none', estilista:'none', recepcionista:'none' },
  ingresosEgresos: { admin:'full', gerente:'full', supervisor:'full', estilista:'none', recepcionista:'none' }
};
```

### 6.2 Filtrado del sidebar/nav por rol

Al cargar la app, después del login:

```javascript
function filterNavigationByRole(rol) {
  const allNavButtons = document.querySelectorAll('[data-page]');
  
  allNavButtons.forEach(btn => {
    const page = btn.dataset.page;
    const perm = VIEW_PERMISSIONS[page]?.[rol];
    
    if (perm === 'none') {
      btn.style.display = 'none'; // Ocultar vista prohibida
    } else if (perm === 'read') {
      btn.style.display = ''; // Mostrar pero sin botón de crear
      btn.classList.add('readonly');
    } else {
      btn.style.display = ''; // Acceso completo
    }
  });
}
```

### 6.3 Protección de acciones CRUD

```javascript
function canEdit(page) {
  const { rol } = getSession();
  const perm = VIEW_PERMISSIONS[page]?.[rol];
  return perm === 'full' || perm === 'own';
}

function canCreate(page) {
  return canEdit(page); // Crear = mismo permiso que editar
}

function canDelete(page) {
  const { rol } = getSession();
  const perm = VIEW_PERMISSIONS[page]?.[rol];
  return perm === 'full'; // Solo roles con acceso completo pueden eliminar
}
```

### 6.4 Registros propios (modo 'own')

Para Estilista, las vistas con ⚡ muestran solo registros vinculados a ese empleado:

```javascript
async function getOwnRecords(tabla, empleadoId) {
  // Filtrar registros donde el empleado esté en el campo de colaborador/vínculo
  const records = await AirtableAPI.getRecords(tabla, {
    filterByFormula: `OR(
      FIND("${empleadoId}", {EMPLEADO}),
      {COLABORADOR} = "${empleadoId}"
    )`
  });
  return records;
}
```

---

## 7. Seguridad del hash de contraseña

### 7.1 Algoritmo

- **SHA-256** con salt único por empleado
- El salt se genera con `crypto.getRandomValues()` (16 bytes → 32 chars hex)
- El hash se calcula: `SHA-256(contraseña + salt)` → 64 chars hex
- **NUNCA** almacenar contraseñas en texto plano en Airtable

### 7.2 Implementación en JS (Web Crypto API)

```javascript
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 7.3 Procedimiento para crear/actualizar contraseña de empleado

Solo el **Administrador** puede crear empleados o resetear contraseñas. La contraseña inicial se genera automáticamente y se muestra una sola vez (como en sistemas bancarios). El empleado puede cambiarla desde su perfil.

```javascript
// Solo ADMIN puede ejecutar esto
async function createEmployeeWithPassword(email, nombre, rol) {
  const salt = generateSalt();
  const tempPassword = generateTempPassword(); // 8 chars aleatorios
  const hash = await hashPassword(tempPassword, salt);
  
  const record = await AirtableAPI.createEmpleado({
    USUARIO: email,
    NOMBRE: nombre,
    ROL: rol,
    SALT: salt,
    CONTRASENA: hash,
    ACTIVO: true
  });
  
  // Mostrar contraseña temporal UNA SOLA VEZ al Admin
  return { record, tempPassword }; // El Admin se la da al empleado en persona
}
```

---

## 8. Plan de implementación

### Fase 1: Schema (Backend Data Architect)
1. Agregar los 7 campos nuevos a la tabla EMPLEADOS (vía Airtable UI o API)
2. Crear el singleSelect `ROL` con los 5 valores
3. Crear las fórmulas necesarias

### Fase 2: Módulo de auth (Frontend Engineer)
1. Crear `static/auth.js` con:
   - `login(email, password)` — flujo completo
   - `logout()` — limpiar sesión
   - `checkAuth()` — verificar sesión activa
   - `hashPassword(password, salt)` — hashing
   - `generateSalt()` — generación de salt
   - `getSession()` — leer sesión de localStorage
2. Crear `static/permissions.js` con:
   - `VIEW_PERMISSIONS` — matriz completa
   - `filterNavigationByRole(rol)` — ocultar/mostrar vistas
   - `canEdit(page)`, `canCreate(page)`, `canDelete(page)`
   - `getOwnRecords(tabla, empleadoId)` — filtro para estilistas

### Fase 3: Login UI (Frontend Engineer/Product Designer)
1. Crear pantalla de login en `index.html`:
   - Formulario con email + contraseña
   - Validación client-side
   - Estados: loading, error ("Email no encontrado", "Contraseña incorrecta")
   - Animación de transición login → dashboard
2. Agregar botón de logout en sidebar/nav (ícono 👤 con dropdown)
3. Mostrar nombre y rol del usuario logueado

### Fase 4: Restricción de vistas
1. Al cargar `index.html`, ejecutar `checkAuth()` → si no hay sesión, mostrar login
2. Después del login, ejecutar `filterNavigationByRole(rol)`
3. Ocultar botones CRUD según permisos
4. Filtrar datos para modo 'own' (Estilista)

### Fase 5: Administración de empleados (solo Admin)
1. En vista Empleados, formulario CRUD con campos de auth
2. Botón "Resetear contraseña" que genera nueva temp password
3. Campo de búsqueda/filtro de empleados

---

## 9. Consideraciones y riesgos

| Riesgo | Impacto | Mitigación |
|--------|:-------:|-----------|
| Token Airtable expuesto en frontend | 🔴 Crítico | El token ya está en `window.__AIRTABLE_TOKEN__` (decisión de arquitectura previa). La autenticación es UI-level. No agregar más exposición. |
| Contraseñas visibles en Airtable | 🟠 Medio | Almacenar SOLO hash SHA-256 + salt. Campo `CONTRASENA` con permisos de colaborador restringidos. |
| Airtable no tiene RLS nativa | 🟠 Medio | La restricción es client-side (UI). Un usuario técnico podría bypasearla. Aceptable para uso interno de salón de belleza — no es banca. |
| Sesión en localStorage vulnerable a XSS | 🟡 Bajo | No hay entrada de usuario sin sanitizar. Pero si se inyecta XSS, el atacante podría robar la sesión. Mitigación: sanitizar inputs + CSP headers en Surge.sh. |
| Empleado comparte credenciales | 🟡 Bajo | No hay 2FA en MVP. En Fase 2 se puede agregar verificación por email/código. |

---

## 10. Alternativas consideradas y rechazadas

| Alternativa | Motivo de rechazo |
|------------|------------------|
| Supabase Auth | El proyecto usa Airtable como único backend. Agregar Supabase duplica la infraestructura. |
| JWT con servidor propio | No hay servidor. Todo es frontend estático + Airtable. |
| OAuth (Google/Facebook) | Complejidad innecesaria para uso interno de salón. |
| Sin autenticación (acceso público) | Rechazado por seguridad. Los datos del salón (clientes, finanzas) no deben ser públicos. |

---

## 11. Próximos pasos

1. **Lead aprueba** este diseño → se crean tareas en el taskboard
2. **Backend Data Architect** agrega los campos en Airtable (tarea SALON-AUTH-01)
3. **Frontend Engineer** implementa `auth.js` + `permissions.js` (tarea SALON-AUTH-02)
4. **Product Designer** crea UI del login + integración (tarea SALON-AUTH-03)
5. **QA Agent** prueba login para cada rol + restricción de vistas (tarea SALON-AUTH-04)

---

## 12. Referencias

- `contracts/AIRTABLE_CONTRACT.md` — Schema EMPLEADOS (líneas 100-199)
- `contracts/PRODUCT_CONTRACT.md` — API mapping
- `static/index.html` — 18 vistas, sidebar/bottom nav (líneas 768-850)
- `static/api.js` — Módulo AirtableAPI (fetch wrapper)
