# 🔐 FASE 2A-B — Auth Schema Precheck

> **Versión:** 1.0 | **Fecha:** 2026-06-21 | **Autor:** Hermes Agent  
> **Base auditada:** `appuns6zIUKaJG7r0` (50 tablas)  
> **Método:** Lectura directa de records vía Airtable API (token `data.records:read`)  
> **Propósito:** Comparar schema REAL vs diseño FASE_2A dry-run ANTES de implementar

---

## Resumen Ejecutivo

| ¿Se puede implementar auth real YA? | ❌ NO |
|---|---|
| Razón principal | Esquema real ≠ esquema diseñado. Faltan campos críticos, nombres difieren, contraseñas son placeholders en texto plano. |
| Riesgo de seguir con diseño actual | Alto — el dry-run asume campos que NO existen. Implementar sin precheck = bugs en producción. |
| Cambios mínimos necesarios | 5 campos nuevos en USUARIOS, 1 en CLIENTES, renombrar 2 campos existentes |

---

## 1. USUARIOS — Auditoría

### 1.1 Schema REAL (11 campos)

| # | Campo | Tipo | Valor de ejemplo | Notas |
|---|-------|------|-----------------|-------|
| 1 | `NOMBRE_USUARIO` | singleLineText | `ADMIN_SISTEMA` | 🔑 Campo principal |
| 2 | `EMAIL_LOGIN` | email | `admin@salon.com` | Email para login |
| 3 | `CONTRASENA_HASH` | singleLineText | `HASH_DEMO_NO_PRODUCTIVO_ADMIN` | ⚠️ **PLAINTEXT**, no bcrypt |
| 4 | `ROL` | link → ROLES | `recQGfLLvXUB4buX2` | Link a tabla ROLES |
| 5 | `EMPLEADO` | link → EMPLEADOS | `recKdnQfGkfCBRU9U` | Staff vinculado |
| 6 | `ACTIVO` | checkbox | `true` | Cuenta habilitada |
| 7 | `ESTADO_USUARIO` | singleSelect | `ACTIVO` | Redundante con ACTIVO |
| 8 | `FECHA_CREACION` | dateTime | `2026-06-03T17:45:08.000Z` | Auditoría |
| 9 | `REQUIERE_CAMBIO_CLAVE` | checkbox | `true` | Flag de primer login |
| 10 | `TAREAS_INTERNAS` | link → TAREAS_INTERNAS | `["rec39fAHZ5tjAwD8c", ...]` | Vínculo operativo |
### 6.1 USUARIOS — ⚠️ Requiere 5 campos nuevos

**Registros:** 5 (ADMIN_SISTEMA, SOLO_LECTURA_DEMO, GERENTE_SALON, RECEPCION, PROFESIONAL_DEMO)

### 1.2 Diseño FASE 2A Dry-Run

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `EMAIL` | Email (único) | Identificador de login |
| `PASSWORD_HASH` | Texto largo | bcrypt hash |
| `ROL` | Link a ROLES | Rol asignado |
| `EMPLEADO` | Link a EMPLEADOS | Si es staff |
| `CLIENTE` | Link a CLIENTES | Si es externo |
| `ACTIVO` | Checkbox | Cuenta deshabilitada |
| `EMAIL_VERIFICADO` | Checkbox | Verificación de email |
| `ULTIMO_LOGIN` | Fecha/Hora | Auditoría de acceso |
| `INTENTOS_FALLIDOS` | Número | Rate limiting |
| `BLOQUEADO_HASTA` | Fecha/Hora | Bloqueo temporal |

### 1.3 Gaps: REAL vs DISEÑO

#### ❌ Campos que el diseño espera pero NO existen

| Campo Diseño | ¿Existe en real? | Acción necesaria |
|---|---|---|
| `EMAIL` | Parcial — existe como `EMAIL_LOGIN` | **Renombrar** a `EMAIL` O mapear en código |
| `PASSWORD_HASH` | Parcial — existe como `CONTRASENA_HASH` | **Renombrar** a `PASSWORD_HASH` O mapear |
| `CLIENTE` (link) | ❌ No existe | **Crear campo** link → CLIENTES |
| `EMAIL_VERIFICADO` | ❌ No existe | **Crear campo** checkbox |
| `ULTIMO_LOGIN` | ❌ No existe (hay `ULTIMA_ACTUALIZACION`) | **Crear campo** dateTime |
| `INTENTOS_FALLIDOS` | ❌ No existe | **Crear campo** number |
| `BLOQUEADO_HASTA` | ❌ No existe | **Crear campo** dateTime |

#### ✅ Campos que existen pero el diseño NO contempla

| Campo Real | Utilidad en auth | Recomendación |
|---|---|---|
| `NOMBRE_USUARIO` | Display name | Mantener — útil para UI |
| `ESTADO_USUARIO` | Redundante con `ACTIVO` | ⚠️ Posible conflicto — unificar lógica |
| `FECHA_CREACION` | Auditoría | Mantener |
| `REQUIERE_CAMBIO_CLAVE` | Forzar cambio en primer login | **Conservar** — útil para seguridad |
| `TAREAS_INTERNAS` | Vínculo operativo | Mantener — no interfiere con auth |
| `ULTIMA_ACTUALIZACION` | ≠ ULTIMO_LOGIN | No duplicar — mantener si es útil para CRM |

#### ⚠️ CRÍTICO: Contraseñas en texto plano

```
CONTRASENA_HASH: "HASH_DEMO_NO_PRODUCTIVO_ADMIN"
CONTRASENA_HASH: "HASH_DEMO_NO_PRODUCTIVO_SOLOLECTURA"
```

**Esto NO es un hash.** Son strings placeholder que ni siquiera son SHA-256. Si se implementa login contra estos valores, cualquier persona que vea Airtable puede leer las "contraseñas".

**Acción requerida:** Reemplazar por bcrypt hashes reales ANTES de exponer cualquier endpoint de login.

---

## 2. ROLES — Auditoría

### 2.1 Schema REAL (11 campos)

| # | Campo | Tipo | Ejemplo |
|---|-------|------|---------|
| 1 | `NOMBRE_ROL` | singleLineText | `EMPLEADO_GESTION`, `GERENTE` |
| 2 | `DESCRIPCION` | longText | Descripción del rol |
| 3 | `NIVEL_ACCESO` | number | `50`, `80` |
| 4 | `COLOR_ROL` | singleSelect | `VERDE`, `AZUL` |
| 5 | `ES_SISTEMA` | checkbox | `true` |
| 6 | `ACTIVO` | checkbox | `true` |
| 7 | `NOTAS` | longText | Notas internas |
| 8 | `DASHBOARD_INICIAL` | link → MODULOS | Módulo por defecto |
| 9 | `PERMISOS_MODULO` | link → PERMISOS_MODULO | Permisos de módulo |
| 10 | `PERMISOS_CAMPO` | link → PERMISOS_CAMPO | Permisos de campo |
| 11 | `USUARIOS` | link → USUARIOS | Relación inversa |

**Registros:** 2 (EMPLEADO_GESTION nivel 50, GERENTE nivel 80)

### 2.2 Diseño FASE 2A

El dry-run dice: *"ROLES: Existe pero sin usar → Fuente de verdad de roles"*

### 2.3 Verdicto: ✅ APTO para auth real

ROLES tiene una estructura completa y bien diseñada:
- `NIVEL_ACCESO` numérico → validación jerárquica fácil
- `ES_SISTEMA` → protege roles core de eliminación
- `PERMISOS_MODULO` + `PERMISOS_CAMPO` → permisos granulares ya vinculados
- `DASHBOARD_INICIAL` → ruta post-login por rol

**Sin cambios necesarios.**

⚠️ **Nota:** Solo hay 2 roles poblados. Faltan ADMINISTRADOR, PROFESIONAL, SOLO_LECTURA, CLIENTE. Pero el schema soporta crearlos.

---

## 3. CLIENTES — Auditoría

### 3.1 Schema REAL (7-10 campos, variable)

| # | Campo | Tipo | Notas |
|---|-------|------|-------|
| 1 | `NOMBRE_CLIENTE` | singleLineText | 🔑 Campo principal |
| 2 | `ULTIMA_ACTUALIZACION` | dateTime | Auditoría |
| 3 | `FECHA_CREACION` | dateTime | Auditoría |
| 4 | `CALIFICACIONES_ATENCION` | link → CALIFICACIONES_ATENCION | CRM |
| 5 | `FOTO_PERFIL` | attachments | Imagen |
| 6 | `GOOGLE_MAP` | formula/computed | Geolocalización |
| 7 | `TESTIMONIOS` | link → TESTIMONIOS | CRM |
| 8 | `CALLE_Y_N°` | singleLineText | Var — no todos tienen |
| 9 | `LOCALIDAD` | singleLineText | Var — no todos tienen |
| 10 | `PROVINCIA/PAIS` | singleLineText | Var — no todos tienen |

### 3.2 Diseño FASE 2A

El dry-run dice: *"CLIENTES: CRM (13 registros) → Perfil comercial del cliente logueado"*

### 3.3 ✅ CAMPO EMAIL YA EXISTE

**EMAIL existe en CLIENTES** como campo tipo `email`. 8 de 13 registros lo tienen poblado; 5 registros no lo tienen (son registros demo genéricos: CLIENTE_NUEVO, CLIENTE_FRECUENTE, CLIENTE, ANONIMO, CLIENTE_VIP).

**Acción requerida:** NINGUNA a nivel schema. El campo existe y está disponible. Los registros sin email se poblarán cuando se registren clientes reales vía la app.

---

## 4. PERMISOS_MODULO — Auditoría

### 4.1 Schema REAL (7-9 campos, variable por registro)

| # | Campo | Tipo |
|---|-------|------|
| 1 | `NOMBRE_PERMISO` | singleLineText |
| 2 | `MODULO` | link → MODULOS |
| 3 | `ROL` | link → ROLES |
| 4 | `ALCANCE_DATOS` | singleSelect |
| 5 | `VISTA_DEFECTO` | singleLineText/number |
| 6 | `VER` | checkbox |
| 7 | `VISIBLE` | checkbox |
| 8 | `ACTIVO` | checkbox (no en todos) |
| 9 | `NOTAS` | longText (no en todos) |

### 4.2 Verdicto: ✅ APTO — requiere mapeo

La tabla existe, tiene registros y está vinculada a ROLES y MODULOS. El backend ya expone MODULOS, que incluye links a PERMISOS_MODULO y PERMISOS_CAMPO.

**Lo que falta:** Endpoint que devuelva permisos por rol (para que el frontend sepa qué mostrar/ocultar). Los datos YA están — solo falta exponerlos.

---

## 5. PERMISOS_CAMPO — Auditoría

### 5.1 Schema REAL (7-11 campos, variable)

| # | Campo | Tipo |
|---|-------|------|
| 1 | `NOMBRE_PERMISO_CAMPO` | singleLineText |
| 2 | `CAMPO` | singleLineText |
| 3 | `TABLA` | singleLineText |
| 4 | `MODULO` | link → MODULOS |
| 5 | `ROL` | link → ROLES |
| 6 | `VISIBLE` | checkbox |
| 7 | `SENSIBLE` | checkbox |
| 8 | `EDITABLE` | checkbox (no en todos) |
| 9 | `NIVEL_SENSIBILIDAD` | singleSelect (no en todos) |
| 10 | `MOTIVO` | longText (no en todos) |
| 11 | `ACTIVO` | checkbox (no en todos) |

### 5.2 Verdicto: ✅ APTO — requiere mapeo

Misma situación que PERMISOS_MODULO. Datos existen, falta exponerlos vía API.

---

## 6. EMPLEADOS — Auditoría

### 6.1 Schema REAL (36-37 campos)

Tabla MASSIVA con datos operativos ricos. Campos auth-relevantes:

| Campo | Tipo | Relevancia |
|-------|------|------------|
| `NOMBRE_EMPLEADO` | singleLineText | Identificación |
| `EMAIL` | email | ⚠️ Ya existe — ¿se usa para login? |
| `ACTIVO` | checkbox | Elegibilidad de acceso |
| `USUARIOS` | link → USUARIOS | 🔗 Relación inversa (1 empleado tiene este link) |
| `PUESTO` | singleSelect | Rol laboral (≠ ROL de sistema) |

**Campos NO auth que existen:** 33 campos operativos (especialidad, comisión, horario, sucursal, capacitaciones, etc.)

### 6.2 Diseño FASE 2A

El dry-run dice: *"EMPLEADOS: Existe pero sin usar → Vinculación staff ↔ USUARIOS"*

### 6.3 Verdicto: ✅ APTO

EMPLEADOS ya tiene `EMAIL` (que podría usarse para login) y link `USUARIOS` (relación inversa). La tabla es robusta y no requiere cambios de schema para auth.

⚠️ **Precaución:** EMPLEADOS NO debe tener `CONTRASENA` ni `SALT`. Esos campos pertenecen a USUARIOS. El diseño original (AIRTABLE_CONTRACT_v3.md) proponía poner auth en EMPLEADOS, pero el schema real los puso en USUARIOS — **decisión correcta**.

---

## 7. GAPS Y PRIORIDADES

### 7.1 Campos faltantes en USUARIOS (5 campos)

| Campo | Tipo Airtable | Prioridad | Necesario para | Acción |
|-------|:------------:|:---------:|----------------|--------|
| `INTENTOS_FALLIDOS` | number (integer) | **P0** | Rate limiting anti fuerza bruta | Crear en USUARIOS |
| `BLOQUEADO_HASTA` | dateTime | **P0** | Bloqueo temporal por intentos fallidos | Crear en USUARIOS |
| `ULTIMO_LOGIN` | dateTime | **P0** | Auditoría, UX ("último acceso") | Crear en USUARIOS |
| `EMAIL_VERIFICADO` | checkbox | **P0** | Registro seguro, evitar cuentas falsas | Crear en USUARIOS |
| `CLIENTE` | link → CLIENTES | **P1** | Autenticación de clientes externos | Crear en USUARIOS |

### 7.2 ¿Falta EMAIL en CLIENTES? NO — ya existe

El campo `EMAIL` (tipo `email`) ya está creado en la tabla CLIENTES. 8 registros lo tienen. No es un campo faltante. No se requiere ninguna acción de schema en CLIENTES para auth.

### 7.3 Tablas Nuevas Requeridas

| Tabla | Prioridad | Necesaria para | ¿Crear ahora? |
|-------|:---------:|----------------|:------------:|
| `SESIONES` | **P1** | refresh tokens, logout, multi-dispositivo | ❌ Diseñar, crear en FASE 3 |
| `TOKENS_RECUPERACION` | **P2** | Forgot/reset password | ❌ Diseñar, crear en FASE 3 |
| `AUDITORIA_LOGIN` | **P2** | Logs de seguridad, detección de anomalías | ❌ Diseñar, crear en FASE 3 |

### 7.4 Mapeo de Nombres Divergentes

| Diseño (dry-run) | Real (Airtable) | Tipo real | Prioridad |
|------------------|-----------------|-----------|:---------:|
| `EMAIL` | `EMAIL_LOGIN` | email | **P1** — Mapear en código |
| `PASSWORD_HASH` | `CONTRASENA_HASH` | singleLineText | **P1** — Mapear en código + re-hash |
| `LAST_LOGIN` | `ULTIMA_ACTUALIZACION` | dateTime | **P3** — No se usa para auth |

> **Decisión:** No renombrar campos en Airtable. Usar `USUARIO_FIELD_MAP` en el adapter.

---

## 8. DISEÑO DE TABLAS NUEVAS (SOLO DISEÑO — NO CREAR AHORA)

### 8.1 `SESIONES` — Refresh Tokens y Multi-Dispositivo

| # | Campo | Tipo Airtable | Descripción |
|---|-------|:------------:|-------------|
| 1 | `ID_SESION` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Usuario dueño de la sesión |
| 3 | `REFRESH_TOKEN_HASH` | singleLineText | Hash SHA-256 del refresh token |
| 4 | `USER_AGENT` | singleLineText | Dispositivo/navegador |
| 5 | `IP_HASH` | singleLineText | Hash SHA-256 de la IP (privacidad) |
| 6 | `EXPIRA_EN` | dateTime | TTL del refresh token (ej: 7 días) |
| 7 | `REVOCADO` | checkbox | Revocación explícita (logout) |
| 8 | `CREADO_EN` | dateTime | Fecha de creación |
| 9 | `ULTIMO_USO_EN` | dateTime | Último refresh usado |

**Cuándo crear:** FASE 3 (cuando se implemente POST /api/auth/refresh y POST /api/auth/logout).

### 8.2 `TOKENS_RECUPERACION` — Forgot/Reset Password

| # | Campo | Tipo Airtable | Descripción |
|---|-------|:------------:|-------------|
| 1 | `ID_TOKEN` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Usuario que solicita reset |
| 3 | `TOKEN_HASH` | singleLineText | Hash SHA-256 del token enviado por email |
| 4 | `EXPIRA_EN` | dateTime | TTL corto (ej: 15 minutos) |
| 5 | `USADO` | checkbox | Token ya consumido |
| 6 | `CREADO_EN` | dateTime | Fecha de creación |

**Cuándo crear:** FASE 3 (cuando exista servicio de email para enviar links de recuperación).

### 8.3 `AUDITORIA_LOGIN` — Logs de Seguridad

| # | Campo | Tipo Airtable | Descripción |
|---|-------|:------------:|-------------|
| 1 | `ID_LOG` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Usuario (si existe) |
| 3 | `EMAIL_INTENTO` | email | Email usado en el intento |
| 4 | `EXITO` | checkbox | Login exitoso o fallido |
| 5 | `MOTIVO_FALLO` | singleSelect | password_incorrecta, cuenta_bloqueada, cuenta_inactiva, email_no_encontrado |
| 6 | `IP_HASH` | singleLineText | Hash de IP (privacidad) |
| 7 | `USER_AGENT` | singleLineText | Dispositivo |
| 8 | `CREADO_EN` | createdTime | Timestamp automático |

**Cuándo crear:** FASE 3 o posterior. Para MVP, `INTENTOS_FALLIDOS` + `ULTIMO_LOGIN` en USUARIOS bastan.

---

## 9. ANÁLISIS DE RIESGOS DEL SCHEMA ACTUAL

| Riesgo | Severidad | Prioridad | Detalle |
|--------|:---------:|:---------:|---------|
| Contraseñas plaintext en Airtable | 🔴 CRÍTICO | **P0** | `CONTRASENA_HASH` contiene strings legibles. Cualquier colaborador ve las contraseñas. |
| Sin email único en CLIENTES | 🔴 CRÍTICO | **P0** | No se puede autenticar clientes externos. |
| Sin campos de seguridad en USUARIOS | 🔴 CRÍTICO | **P0** | Sin INTENTOS_FALLIDOS ni BLOQUEADO_HASTA → vulnerable a fuerza bruta. |
| Sin campo CLIENTE en USUARIOS | 🟠 ALTO | **P1** | No se puede vincular cuenta auth con perfil comercial. |
| `ESTADO_USUARIO` vs `ACTIVO` | 🟡 MEDIO | **P2** | Dos fuentes de verdad para estado de cuenta. Usar solo `ACTIVO`. |
| Sin tabla SESIONES | 🟡 MEDIO | **P1** | Sin refresh tokens ni logout remoto. JWT stateless como MVP. |
| Sin EMAIL_VERIFICADO | 🟡 MEDIO | **P2** | Cuentas sin verificar pueden registrarse. P0 cuando haya registro público. |
| Nombres de campo divergentes | 🟡 MEDIO | **P1** | `EMAIL_LOGIN` vs `EMAIL`, `CONTRASENA_HASH` vs `PASSWORD_HASH`. Mapear en código. |
| PASSWORD_HASH en Airtable (no DB cifrada) | 🟡 MEDIO | **P3** | Aceptable con bcrypt + Airtable acceso controlado. Eventualmente migrar a DB cifrada. |

---

## 10. VEREDICTO

### ❌ NO IMPLEMENTAR auth real sin antes resolver (P0):

1. **Mapear** `EMAIL_LOGIN`/`CONTRASENA_HASH` en código (`USUARIO_FIELD_MAP`)
2. **Hashear contraseñas** con bcrypt (reemplazar placeholders actuales en 5 registros)
3. **Crear 5 campos** en USUARIOS: `INTENTOS_FALLIDOS` (number), `BLOQUEADO_HASTA` (dateTime), `ULTIMO_LOGIN` (dateTime), `EMAIL_VERIFICADO` (checkbox), `CLIENTE` (link→CLIENTES)

### ✅ Listo para usar SIN cambios:

- ROLES (schema completo, 2 roles poblados, vínculos a PERMISOS_MODULO/CAMPO)
- PERMISOS_MODULO (registros vinculados a MODULOS y ROLES)
- PERMISOS_CAMPO (registros vinculados a MODULOS y ROLES)
- EMPLEADOS (datos ricos, EMAIL presente, vínculo a USUARIOS existente)
- CLIENTES (EMAIL ya existe, 8 registros lo tienen poblado)

### 🟡 Diseñado, NO crear ahora:

- `SESIONES` — Necesaria para refresh tokens y logout (FASE 3)
- `TOKENS_RECUPERACION` — Necesaria para forgot/reset password (FASE 3)
- `AUDITORIA_LOGIN` — Necesaria para logs de seguridad (FASE 3 o posterior)

---

## 11. PRÓXIMO PASO

→ `FASE_2A_B_SCHEMA_PATCH_PLAN.md` — Plan detallado de cambios mínimos (5 campos + re-hash de 5 registros)
→ `FASE_2A_C_BACKEND_AUTH_IMPLEMENTATION_PLAN.md` — Plan de implementación backend (login + /me)

---

> **Documento generado por Hermes Agent — FASE 2A-B precheck**  
> **Base canónica:** `appuns6zIUKaJG7r0` | **Registros leídos:** USUARIOS(5), ROLES(2), CLIENTES(13), PERMISOS_MODULO(múltiples), PERMISOS_CAMPO(múltiples), EMPLEADOS(2)  
> **No se modificó nada en Airtable.**
