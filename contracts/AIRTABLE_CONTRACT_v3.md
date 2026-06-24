# AIRTABLE_CONTRACT — Gestión de Salones de Belleza

> **Versión:** 3.0 | **Fecha:** 2026-06-03 | **Autor:** Backend Airtable Architect
> **Estado:** Diseño — No implementado en base real todavía
> **Backend:** Exclusivamente Airtable. Sin Supabase.
> **Base:** `app93Vhy56KrxNhwe`

---

## 📋 Changelog v3.0

| Cambio | Tipo | Detalle |
|--------|------|---------|
| EMPLEADOS +7 campos | Nuevos campos | USUARIO, CONTRASENA, SALT, ROL, ULTIMO_ACCESO, ACTIVO, NOTAS_AUTH |
| Tabla ROLES | Nueva tabla | Roles del sistema (admin, gerente, supervisor, estilista, recepcionista) |
| Tabla CATEGORIAS_MENU | Nueva tabla | Navegación dinámica con íconos Lucide |
| Campos IA | Nuevos campos | ia_notas, ia_duracion_estimada, ia_reorden, ia_frecuencia |
| Login + Auth | Nuevo sistema | SHA-256 + salt, sesión localStorage, permisos client-side |
| Matriz permisos | Nueva sección | 18 vistas × 5 roles con full/read/own/none |

---

## Schema Actual (15 tablas — sin cambios)

| # | Tabla | ID | Campos | Rol |
|---|-------|----|--------|-----|
| 1 | Clientes | `tblzRwPeOVTdsvt5g` | 16 | CRM |
| 2 | Citas | `tblZNB7HfD3OAGL9x` | 12 | Agenda |
| 3 | Servicios | `tblIDRFHpLoQpB9JH` | 26 | Catálogo |
| 4 | Empleados | `tblxodPS9acp1kyoU` | 20 → **27** | Personal + Auth |
| 5 | Proveedores | `tblVLjaYzT3kb1k4c` | 13 | Compras |
| 6 | Productos | `tblkz2NvmwGBXHjpF` | 31 → **32** | Stock |
| 7 | Inventario | `tblNz69ntR4zvHjH1` | 10 | Stock |
| 8 | Promociones | `tblc8HGTbiXL5rsk8` | 10 | Marketing |
| 9 | Agenda | `tbltQl7ljsgTBpkr1` | 8 | Horarios |
| 10 | Reportes | `tblblfVCv2Wbn0v4u` | 9 | Informes |
| 11 | Capacitaciones | `tblpDKylzRWU0QTuL` | 10 | RRHH |
| 12 | ficha de servicios | `tblsCoMUqOmpI9bfc` | 4 | Tareas |
| 13 | Costos Fijos Peluquería | `tbl3LmPm9B32hghHi` | 6 | Finanzas |
| 14 | Resumen de Costos Fijos | `tbl7MRYpZJI0kEet1` | 6 | Finanzas |
| 15 | INGRESOS/EGRESOS | `tblEoTMnKvkZzHDBf` | 29 | Finanzas |
| **16** | **ROLES** | **NUEVA** | **5** | Auth |
| **17** | **CATEGORIAS_MENU** | **NUEVA** | **6** | Navegación |
| **TOTAL** | | | **210 → 250** | |
---

## 🔐 4. EMPLEADOS — Extensión Auth (7 campos nuevos)

> **Tabla:** `tblxodPS9acp1kyoU` | **Campos actuales:** 20 | **Nuevos:** 7 | **Total:** 27

### Nuevos Campos

| # | Campo | Field ID | Tipo | Descripción | Requerido |
|---|-------|----------|------|-------------|:--------:|
| 21 | `USUARIO` | `fld_NEW_01` 🔵 | `email` | Email único para login | ✅ |
| 22 | `CONTRASENA` | `fld_NEW_02` 🔵 | `singleLineText` | Hash SHA-256 (64 chars hex) | ✅ |
| 23 | `SALT` | `fld_NEW_03` 🔵 | `singleLineText` | Salt aleatorio 16 bytes → 32 chars hex | ✅ |
| 24 | `ROL` | `fld_NEW_04` 🔵 | `singleSelect` | Rol del empleado (5 opciones) | ✅ |
| 25 | `ULTIMO_ACCESO` | `fld_NEW_05` 🔵 | `dateTime` | Fecha/hora último login | |
| 26 | `ACTIVO` | `fld_NEW_06` 🔵 | `checkbox` | ¿Puede acceder al sistema? | ✅ |
| 27 | `NOTAS_AUTH` | `fld_NEW_07` 🔵 | `longText` | Notas internas de seguridad | |

> 🔵 **Pendiente de crear** — Los Field IDs `fld_NEW_XX` son placeholders. Se reemplazarán con los IDs reales después de crear los campos vía API.

### ROL — SingleSelect Options

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

### Algoritmo de Hash

```
salt = crypto.getRandomValues(16 bytes)  → 32 chars hex
hash = SHA-256(password + salt)           → 64 chars hex
```

### Fórmula propuesta: `ESTADO_SESION`

```javascript
// Fórmula Airtable (NO implementada — es para referencia del frontend)
IF(
  AND({ACTIVO}, {USUARIO} != BLANK(), {CONTRASENA} != BLANK()),
  "✅ Activo",
  "⛔ Inactivo"
)
```
---

## 🏷️ 16. ROLES (Nueva Tabla — Fase 2)

> **ID:** `tbl_NEW_ROLES` 🔵 | **Campos:** 5 | **Uso:** Personalización avanzada de roles

| # | Campo | Field ID | Tipo | Descripción |
|---|-------|----------|------|-------------|
| 1 | `NOMBRE` | `fld_NEW_R1` 🔵 | `singleLineText` | Nombre del rol (ej: "Administrador") |
| 2 | `CODIGO` | `fld_NEW_R2` 🔵 | `singleLineText` | Código interno (ej: "admin") |
| 3 | `NIVEL` | `fld_NEW_R3` 🔵 | `number` | Jerarquía numérica (1 = máximo poder) |
| 4 | `DESCRIPCION` | `fld_NEW_R4` 🔵 | `longText` | Qué puede hacer este rol |
| 5 | `EMPLEADOS` | `fld_NEW_R5` 🔵 | `multipleRecordLinks` | → EMPLEADOS (`tblxodPS9acp1kyoU`) |

### Carga inicial (seed data)

| NOMBRE | CODIGO | NIVEL |
|--------|--------|:-----:|
| Administrador | admin | 1 |
| Gerente | gerente | 2 |
| Supervisor | supervisor | 3 |
| Estilista | estilista | 4 |
| Recepcionista | recepcionista | 5 |

> **Nota MVP:** En Fase 1 (actual) se usa `ROL` como `singleSelect` en EMPLEADOS sin tabla separada. Esta tabla ROLES se crea en Fase 2 si se requiere personalización avanzada de roles.

---

## 🧭 17. CATEGORIAS_MENU (Nueva Tabla)

> **ID:** `tbl_NEW_MENU` 🔵 | **Campos:** 6 | **Uso:** Navegación dinámica basada en rol

| # | Campo | Field ID | Tipo | Descripción |
|---|-------|----------|------|-------------|
| 1 | `NOMBRE` | `fld_NEW_M1` 🔵 | `singleLineText` | Etiqueta visible (ej: "Clientes") |
| 2 | `ICONO` | `fld_NEW_M2` 🔵 | `singleLineText` | Nombre del ícono Lucide (ej: "users") |
| 3 | `ORDEN` | `fld_NEW_M3` 🔵 | `number` | Posición en sidebar/nav (integer) |
| 4 | `ROL_MINIMO` | `fld_NEW_M4` 🔵 | `singleSelect` | Rol mínimo requerido (choices: admin, gerente, supervisor, estilista, recepcionista) |
| 5 | `VISTA` | `fld_NEW_M5` 🔵 | `singleLineText` | ID de la vista frontend (ej: "clientes") |
| 6 | `ACTIVO` | `fld_NEW_M6` 🔵 | `checkbox` | ¿Visible en navegación? |

### Carga inicial (seed data — 18 items)

| NOMBRE | ICONO | ORDEN | ROL_MINIMO | VISTA |
|--------|-------|:-----:|:----------:|-------|
| Dashboard | layout-dashboard | 1 | recepcionista | dashboard |
| Clientes | users | 2 | recepcionista | clientes |
| Citas | calendar | 3 | recepcionista | citas |
| Servicios | scissors | 4 | recepcionista | servicios |
| Empleados | user-cog | 5 | supervisor | empleados |
| Caja | cash-register | 6 | recepcionista | caja |
| Productos | package | 7 | recepcionista | productos |
| Inventario | boxes | 8 | recepcionista | inventario |
| Proveedores | truck | 9 | supervisor | proveedores |
| Promociones | ticket-percent | 10 | recepcionista | promociones |
| Agenda | calendar-clock | 11 | recepcionista | agenda |
| Capacitaciones | graduation-cap | 12 | supervisor | capacitaciones |
| Ficha Servicios | clipboard-list | 13 | recepcionista | fichaServicios |
| Costos Fijos | receipt | 14 | gerente | costosFijos |
| Resumen Costos | pie-chart | 15 | gerente | resumenCostos |
| Ingresos/Egresos | banknote | 16 | gerente | ingresosEgresos |
| Reportes | bar-chart-3 | 17 | supervisor | reportes |
| Perfil | user-circle | 99 | recepcionista | perfil |
---

## 🔒 Matriz de Permisos por Rol (18 vistas × 5 roles)

| Vista | Admin | Gerente | Supervisor | Estilista | Recepcionista |
|-------|:-----:|:-------:|:----------:|:---------:|:-------------:|
| Dashboard | ✅ | ✅ | ✅ | ⚡ | 👁️ |
| Clientes | ✅ | ✅ | ✅ | 👁️ | ✅ |
| Citas | ✅ | ✅ | ✅ | ⚡ | ✅ |
| Servicios | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| Empleados | ✅ | ✅ | 👁️ | 🔒 | 🔒 |
| Caja | ✅ | ✅ | ✅ | 🔒 | ✅ |
| Productos | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Reportes | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Proveedores | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Inventario | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Promociones | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Agenda | ✅ | ✅ | ✅ | ⚡ | ✅ |
| Capacitaciones | ✅ | ✅ | 👁️ | 👁️ | 🔒 |
| Ficha Servicios | ✅ | ✅ | ✅ | ⚡ | 👁️ |
| Costos Fijos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Resumen Costos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ingresos/Egresos | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Login / Perfil | ✅ | ✅ | ✅ | ✅ | ✅ |

**Leyenda:**
- ✅ Acceso completo (CRUD)
- 👁️ Solo lectura
- ⚡ Registros propios (Estilista ve solo sus citas/clientes)
- 🔒 Sin acceso (vista oculta en nav)

### Implementación de permisos

```javascript
// Niveles de acceso
const ACCESS = {
  full:  { view: true,  create: true,  edit: true,  delete: true,  filter: 'all' },
  read:  { view: true,  create: false, edit: false, delete: false, filter: 'all' },
  own:   { view: true,  create: true,  edit: true,  delete: false, filter: 'own' },
  none:  { view: false, create: false, edit: false, delete: false, filter: null }
};
```

---

## 🤖 Campos IA (Apéndice — Futuro)

| Tabla | Campo Nuevo | Tipo | Propósito | Prioridad |
|-------|------------|------|-----------|:---------:|
| Clientes | `ia_notas` | `longText` | Notas/insights generados por IA sobre el cliente | Fase 3 |
| Clientes | `ia_frecuencia` | `formula` | Predicción de frecuencia de visita (días promedio entre citas) | Fase 3 |
| Citas | `ia_duracion_estimada` | `formula` | Duración estimada basada en tipo de servicio + historial | Fase 3 |
| Productos | `ia_reorden` | `formula` | Punto de reorden sugerido (promedio ventas semanales × 2) | Fase 3 |
| Empleados | `ia_rendimiento` | `formula` | Score de rendimiento (citas completadas / puntualidad / ventas) | Fase 3 |

---

## 🔗 Relaciones Actualizadas

```
EMPLEADOS (27 campos)
  ├─ USUARIO (email) ──► Login del sistema
  ├─ ROL (singleSelect) ──► Control de permisos
  ├─ ← ROLES.EMPLEADOS (Fase 2)
  └─ ↔ CITAS (asignación de estilista)

CLIENTES (16 campos)
  ├─ Historial de Citas ↔ CITAS
  ├─ Promociones ↔ PROMOCIONES
  ├─ Agenda ↔ AGENDA
  ├─ Ventas y Cobros ↔ INGRESOS/EGRESOS
  └─ ia_notas, ia_frecuencia (Fase 3)

CATEGORIAS_MENU → ROL_MINIMO (singleSelect)
  └─ Define qué items de navegación ve cada rol
```

---

## 📐 Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas Airtable | MAYÚSCULAS sin acentos | EMPLEADOS, CATEGORIAS_MENU |
| Campos | MAYÚSCULAS sin acentos | USUARIO, CONTRASENA, ROL |
| Roles (código) | minúsculas | admin, gerente, supervisor |
| Vistas frontend | camelCase | clientes, fichaServicios |
| Íconos | Lucide kebab-case | user-cog, calendar-clock |
| Field IDs (placeholders) | fld_NEW_XX | fld_NEW_01, fld_NEW_R1 |

---

## ⚠️ Consideraciones de Seguridad

| Riesgo | Nivel | Mitigación |
|--------|:-----:|-----------|
| Token Airtable en frontend | 🔴 Crítico | Aceptado por arquitectura. No agregar más exposición. |
| Contraseñas en Airtable | 🟠 Medio | Solo hash SHA-256 + salt. Campo con permisos de colaborador restringidos. |
| Sin RLS nativa | 🟠 Medio | Restricción client-side. Suficiente para uso interno de salón. |
| Sesión localStorage | 🟡 Bajo | Sanitizar inputs + CSP headers en Surge.sh. |
| Sin 2FA | 🟡 Bajo | MVP. Fase 2: verificación por email/código. |

---

## 📅 Plan de Implementación

### Fase 1: Schema (Backend Architect — pendiente aprobación)
1. Agregar 7 campos a EMPLEADOS vía API Airtable
2. Crear singleSelect ROL con 5 valores
3. Crear tabla CATEGORIAS_MENU con seed data
4. Verificar integridad de relaciones

### Fase 2: Auth Module (Frontend Engineer)
1. `static/auth.js` — login, logout, hash, session
2. `static/permissions.js` — matriz, filtrado nav, CRUD guards

### Fase 3: Login UI (Product Designer)
1. Pantalla de login en index.html
2. Botón logout + perfil en sidebar
3. Restricción de vistas por rol en nav

### Fase 4: IA Fields (Futuro)
1. Agregar campos ia_* a tablas existentes
2. Fórmulas de predicción/recomendación

> ⚠️ **NO EJECUTAR cambios en Airtable sin aprobación explícita del Lead.**

---

## 📚 Referencias

- `contracts/AIRTABLE_CONTRACT.md` v2.0 — Schema actual (15 tablas)
- `contracts/PRODUCT_CONTRACT.md` — API mapping + field IDs reales
- `docs/auth/AUTH_DESIGN.md` v1.0 — Diseño de autenticación y permisos
- `static/api.js` — Módulo AirtableAPI (fetch wrapper)
- `static/index.html` — Frontend (18 vistas, sidebar/bottom nav)