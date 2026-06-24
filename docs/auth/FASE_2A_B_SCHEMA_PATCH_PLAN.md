# 🔧 FASE 2A-B — Schema Patch Plan

> **Versión:** 1.0 | **Fecha:** 2026-06-21 | **Autor:** Hermes Agent  
> **Base canónica:** `appuns6zIUKaJG7r0`  
> **Precheck:** `FASE_2A_B_AUTH_SCHEMA_PRECHECK.md`  
> **Principio:** Mínima intervención. Solo lo bloqueante. Sin crear tablas nuevas (por ahora).

---

## Estrategia

**Opción elegida: Mapeo en código + 5 campos nuevos**

No renombrar campos existentes (rompería integraciones no descubiertas). En su lugar, mapear `EMAIL_LOGIN` ↔ `EMAIL`, `CONTRASENA_HASH` ↔ `PASSWORD_HASH` en el backend. Solo crear los campos que FALTAN.

---

## Cambio 1: USUARIOS — Nuevos campos de seguridad

### 1.1 `EMAIL_VERIFICADO`
| Propiedad | Valor |
|-----------|-------|
| Tabla | USUARIOS |
| Tipo | Checkbox |
| Default | `false` |
| Justificación | Sin este campo, cuentas no verificadas pueden hacer login. |

### 1.2 `ULTIMO_LOGIN`
| Propiedad | Valor |
|-----------|-------|
| Tabla | USUARIOS |
| Tipo | dateTime (ISO 8601) |
| Justificación | Auditoría de acceso. `ULTIMA_ACTUALIZACION` no distingue login de edición de perfil. |

### 1.3 `INTENTOS_FALLIDOS`
| Propiedad | Valor |
|-----------|-------|
| Tabla | USUARIOS |
| Tipo | Number (integer, default 0) |
| Justificación | Rate limiting server-side. Sin esto, brute-force ilimitado. |

### 1.4 `BLOQUEADO_HASTA`
| Propiedad | Valor |
|-----------|-------|
| Tabla | USUARIOS |
| Tipo | dateTime |
| Justificación | Bloqueo temporal tras 5 intentos fallidos. Sin esto, el rate limiting no puede persistir entre reinicios del backend. |

---

## Cambio 2: USUARIOS — Link a CLIENTES

### 2.1 `CLIENTE`
| Propiedad | Valor |
|-----------|-------|
| Tabla | USUARIOS |
| Tipo | Link to another record → CLIENTES |
| Justificación | Un USUARIO puede ser cliente externo (no empleado). Sin este link, el cliente logueado no puede ver su perfil CRM. |
| Regla | `EMPLEADO` o `CLIENTE` deben ser mutuamente excluyentes (validar en backend). |

---

## Cambio 3: Re-hash de contraseñas demo

**NO es cambio de schema, pero es precondición para auth real.**

| Campo | Valor actual | Valor requerido | Registros |
|-------|-------------|-----------------|:---------:|
| `CONTRASENA_HASH` | `HASH_DEMO_NO_PRODUCTIVO_*` (placeholders) | bcrypt hash de contraseña real | 5 registros |

**Registros a modificar:**

| Record ID | NOMBRE_USUARIO | CONTRASENA_HASH actual |
|-----------|----------------|------------------------|
| `recQaTARsswMjuDCx` | ADMIN_SISTEMA | HASH_DEMO_NO_PRODUCTIVO_ADMIN |
| `recTIv7CEIeQZGmRZ` | SOLO_LECTURA_DEMO | HASH_DEMO_NO_PRODUCTIVO_SOLOLECTURA |
| `recXOtFACVxreFdxm` | GERENTE_SALON | HASH_DEMO_NO_PRODUCTIVO_* |
| `reckUVPqI4z3WVLex` | RECEPCION | HASH_DEMO_NO_PRODUCTIVO_* |
| `recnug2DTR61XYszn` | PROFESIONAL_DEMO | HASH_DEMO_NO_PRODUCTIVO_* |

**Procedimiento:**
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generar hashes reales
admin_hash = pwd_context.hash("Admin123!")
lectura_hash = pwd_context.hash("Lectura123!")

# Actualizar vía API de Airtable
# PATCH /v0/{base_id}/USUARIOS/{record_id}
# fields: {"CONTRASENA_HASH": admin_hash}
```

---

## Mapeo de Nombres (Código)

Para no romper integraciones existentes, el backend mapeará:

| Nombre en Diseño | Nombre REAL en Airtable | Dirección |
|------------------|------------------------|-----------|
| `EMAIL` | `EMAIL_LOGIN` | Diseño → Real |
| `PASSWORD_HASH` | `CONTRASENA_HASH` | Diseño → Real |
| `USERNAME` | `NOMBRE_USUARIO` | Diseño → Real |
| `ULTIMO_LOGIN` | `ULTIMO_LOGIN` | Igual (nuevo campo) |

### Implementación en `airtable_adapter.py`:

```python
# Constantes de mapeo
USUARIO_FIELD_MAP = {
    "email": "EMAIL_LOGIN",
    "password_hash": "CONTRASENA_HASH",
    "username": "NOMBRE_USUARIO",
    "activo": "ACTIVO",
    "rol": "ROL",
    "empleado": "EMPLEADO",
    "cliente": "CLIENTE",           # Nuevo
    "email_verificado": "EMAIL_VERIFICADO",  # Nuevo
    "ultimo_login": "ULTIMO_LOGIN", # Nuevo
    "intentos_fallidos": "INTENTOS_FALLIDOS", # Nuevo
    "bloqueado_hasta": "BLOQUEADO_HASTA",     # Nuevo
}
```

---

## Resumen de Cambios

| # | Tabla | Acción | Campo | Tipo | Bloqueante |
|---|-------|--------|-------|------|:----------:|
| 1 | USUARIOS | CREAR | `EMAIL_VERIFICADO` | checkbox | ✅ |
| 2 | USUARIOS | CREAR | `ULTIMO_LOGIN` | dateTime | ✅ |
| 3 | USUARIOS | CREAR | `INTENTOS_FALLIDOS` | number | ✅ |
| 4 | USUARIOS | CREAR | `BLOQUEADO_HASTA` | dateTime | ✅ |
| 5 | USUARIOS | CREAR | `CLIENTE` | link → CLIENTES | ✅ |
| 6 | CLIENTES | CREAR | `EMAIL` | email | ✅ |
| 7 | USUARIOS | ACTUALIZAR | `CONTRASENA_HASH` (2 registros) | re-hash bcrypt | ✅ |
| — | USUARIOS | MAPEAR | `EMAIL_LOGIN` → `EMAIL` | en código | — |
| — | USUARIOS | MAPEAR | `CONTRASENA_HASH` → `PASSWORD_HASH` | en código | — |

**Total: 5 campos nuevos + 5 registros actualizados + 2 mapeos en código.**

---

## Lo que NO se crea (todavía)

### SESIONES — Diseño de referencia (FASE 3)

| # | Campo | Tipo | Uso |
|---|-------|------|-----|
| 1 | `ID_SESION` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Dueño de la sesión |
| 3 | `REFRESH_TOKEN_HASH` | singleLineText | SHA-256 del refresh token |
| 4 | `USER_AGENT` | singleLineText | Dispositivo/navegador |
| 5 | `IP_HASH` | singleLineText | SHA-256 de IP (privacidad) |
| 6 | `EXPIRA_EN` | dateTime | TTL (ej: 7 días) |
| 7 | `REVOCADO` | checkbox | Logout explícito |
| 8 | `CREADO_EN` | dateTime | Timestamp creación |
| 9 | `ULTIMO_USO_EN` | dateTime | Último refresh usado |

**Crear cuando:** Se implemente `POST /api/auth/refresh` y `POST /api/auth/logout`.

### TOKENS_RECUPERACION — Diseño de referencia (FASE 3)

| # | Campo | Tipo | Uso |
|---|-------|------|-----|
| 1 | `ID_TOKEN` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Usuario solicitante |
| 3 | `TOKEN_HASH` | singleLineText | SHA-256 del token de reset |
| 4 | `EXPIRA_EN` | dateTime | TTL corto (15 min) |
| 5 | `USADO` | checkbox | Token consumido |
| 6 | `CREADO_EN` | dateTime | Timestamp creación |

**Crear cuando:** Exista servicio de email (SendGrid/Resend).

### AUDITORIA_LOGIN — Diseño de referencia (FASE 3+)

| # | Campo | Tipo | Uso |
|---|-------|------|-----|
| 1 | `ID_LOG` | autoNumber | 🔑 PK |
| 2 | `USUARIO` | link → USUARIOS | Usuario (si existe) |
| 3 | `EMAIL_INTENTO` | email | Email del intento |
| 4 | `EXITO` | checkbox | Login exitoso/fallido |
| 5 | `MOTIVO_FALLO` | singleSelect | password_incorrecta, cuenta_bloqueada, cuenta_inactiva, email_no_encontrado |
| 6 | `IP_HASH` | singleLineText | Hash de IP |
| 7 | `USER_AGENT` | singleLineText | Dispositivo |
| 8 | `CREADO_EN` | createdTime | Timestamp automático |

**Crear cuando:** Se requieran logs detallados de seguridad. Para MVP, `INTENTOS_FALLIDOS` + `ULTIMO_LOGIN` bastan.

---

## Orden de Ejecución

1. **Crear 5 campos** en Airtable (UI o API)
2. **Re-hashear** contraseñas demo con bcrypt
3. **Actualizar** `airtable_adapter.py` con el mapeo de campos
4. **Verificar** que los campos nuevos son visibles vía API
5. **Proceder** a FASE_2A_C (implementación backend)

---

## Riesgos del Patch

| Riesgo | Mitigación |
|--------|-----------|
| Campos nuevos rompen integraciones existentes | No deberían — son campos adicionales, no modificaciones de campos existentes. |
| Mapeo de nombres causa confusión | Documentar en el adapter. Usar constantes, no strings mágicos. |
| Re-hash rompe login mock actual | El mock actual no usa `CONTRASENA_HASH` (usa `localStorage`). Sin impacto. |

---

> **Documento generado por Hermes Agent — FASE 2A-B schema patch plan**  
> **Depende de:** `FASE_2A_B_AUTH_SCHEMA_PRECHECK.md`  
> **Precede a:** `FASE_2A_C_BACKEND_AUTH_IMPLEMENTATION_PLAN.md`  
> **No se ejecutó ningún cambio.**
