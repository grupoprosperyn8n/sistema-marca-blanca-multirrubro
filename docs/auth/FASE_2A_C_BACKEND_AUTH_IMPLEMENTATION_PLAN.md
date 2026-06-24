# FASE 2A-C -- Backend Auth Implementation Plan

> **Version:** 1.0 | **Fecha:** 2026-06-21 | **Autor:** Hermes Agent
> **Base:** `appuns6zIUKaJG7r0` | **Backend:** Railway FastAPI
> **Precede a:** FASE 2A-D (Frontend Auth Adapter)
> **Depende de:** `FASE_2A_B_SCHEMA_PATCH_PLAN.md` (campos nuevos + re-hash)
> **Regla:** Solo backend. No tocar frontend. No crear tablas Airtable nuevas.

---

## Resumen

| Alcance | Solo backend (FastAPI en Railway) |
|---------|----------------------------------|
| Toca frontend? | NO |
| Crea tablas Airtable? | NO, solo campos (ver PATCH_PLAN) |
| Registra clientes reales? | NO, solo seed de usuarios demo |
| Endpoints expuestos? | POST /api/auth/login + GET /api/auth/me (MVP minimo) |
| Tiempo estimado | ~1.5 horas de desarrollo + 30 min verificacion |

---

## 1. Prerrequisitos

### 1.1 Campos de Airtable (ejecutar ANTES)

Ejecutar `FASE_2A_B_SCHEMA_PATCH_PLAN.md`:
- [ ] `EMAIL_VERIFICADO` (checkbox) en USUARIOS
- [ ] `ULTIMO_LOGIN` (dateTime) en USUARIOS
- [ ] `INTENTOS_FALLIDOS` (number) en USUARIOS
- [ ] `BLOQUEADO_HASTA` (dateTime) en USUARIOS
- [ ] `CLIENTE` (link->CLIENTES) en USUARIOS
- [ ] Re-hash de `CONTRASENA_HASH` en 5 registros demo (bcrypt)

### 1.2 Dependencias Python

Agregar a `requirements.txt`:
```
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
```

### 1.3 Variables de Entorno (Railway)

| Variable | Valor | Uso |
|----------|-------|-----|
| `JWT_SECRET` | `openssl rand -hex 32` | Firma de JWT |
| `JWT_ALGORITHM` | `HS256` | Algoritmo |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | TTL del access token |

**No agregar al `.env` local**, solo en Railway dashboard.

---

## 2. Archivos a Crear

```
backend/
  auth/
    __init__.py
    security.py      # Hashing + JWT
    schemas.py       # Pydantic models
    router.py        # Endpoints
```

### 2.1 `backend/auth/security.py`

Core de seguridad: bcrypt hashing via passlib, JWT via python-jose.

- `hash_password(password)` -> bcrypt hash
- `verify_password(plain, hashed)` -> bool
- `create_access_token(data, expires_delta)` -> JWT string
- `decode_access_token(token)` -> payload dict or None

JWT payload: `{"sub": user_id, "email": "...", "rol": "...", "iat": ..., "exp": ...}`
Algoritmo: HS256. Secret: `os.getenv("JWT_SECRET")` con fallback solo para dev.

### 2.2 `backend/auth/schemas.py`

Pydantic models: `LoginRequest`, `LoginResponse`, `UserProfile`.
Campos minimos para MVP.

### 2.3 `backend/auth/router.py`

#### POST /api/auth/login

Flujo:
1. Buscar USUARIOS por `EMAIL_LOGIN`
2. Verificar `ACTIVO = true`
3. Verificar `BLOQUEADO_HASTA` no haya expirado
4. Verificar `CONTRASENA_HASH` con bcrypt
5. Si falla: incrementar `INTENTOS_FALLIDOS`. Si >= 5, setear `BLOQUEADO_HASTA` (+15 min)
6. Si exito: resetear `INTENTOS_FALLIDOS`, setear `ULTIMO_LOGIN`
7. Retornar JWT + perfil basico

#### GET /api/auth/me

Requiere header `Authorization: Bearer <JWT>`.
Retorna perfil completo: id, email, nombre, rol, permisos, empleado_id, cliente_id.

#### GET /api/auth/health

Health check: `{"status": "ok", "auth": "active"}`.

---

## 3. Archivo a Modificar: `backend/main.py`

Agregar:
```python
from auth.router import router as auth_router
app.include_router(auth_router)
```

---

## 4. Archivo a Revisar: `backend/airtable_adapter.py`

### 4.1 Agregar constante de mapeo

```python
USUARIO_FIELD_MAP = {
    "email": "EMAIL_LOGIN",
    "password_hash": "CONTRASENA_HASH",
    "username": "NOMBRE_USUARIO",
    "activo": "ACTIVO",
    "rol": "ROL",
    "empleado": "EMPLEADO",
    "cliente": "CLIENTE",              # Nuevo
    "email_verificado": "EMAIL_VERIFICADO",   # Nuevo
    "ultimo_login": "ULTIMO_LOGIN",     # Nuevo
    "intentos_fallidos": "INTENTOS_FALLIDOS", # Nuevo
    "bloqueado_hasta": "BLOQUEADO_HASTA",     # Nuevo
}
```

### 4.2 Verificar filtros

El adapter expone `list_records(table, filter_by_formula)`.
Verificar que pueda filtrar por `EMAIL_LOGIN`.

---

## 5. Plan de Testing

### 5.1 Health Check
```bash
curl https://earnest-comfort-production-3d75.up.railway.app/api/auth/health
# -> {"status":"ok","auth":"active"}
```

### 5.2 Login Exitoso (ADMIN)
```bash
curl -X POST <URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salon.com","password":"Admin123!"}'
# -> 200 + access_token + usuario
```

### 5.3 Login Fallido
```bash
curl -X POST <URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salon.com","password":"wrong"}'
# -> 401 "Email o contrasena incorrectos"
```

### 5.4 GET /me con token
```bash
curl <URL>/api/auth/me -H "Authorization: Bearer *** -> 200 + perfil completo
```

### 5.5 Rate Limiting (6 intentos fallidos)
Los primeros 5 intentos devuelven 401.
El sexto devuelve 429 "Cuenta bloqueada temporalmente".

---

## 6. Lo que NO se implementa (MVP)

| Endpoint / Feature | Motivo |
|--------------------|--------|
| POST /api/auth/register | Sin email service. FASE 3. |
| POST /api/auth/logout | Sin tabla SESIONES. FASE 3. |
| POST /api/auth/refresh | Sin refresh tokens. JWT 15 min con re-login. |
| POST /api/auth/forgot-password | Sin email service. FASE 3. |
| Tabla SESIONES | JWT stateless para MVP. |
| Tabla TOKENS_RECUPERACION | Sin email service. |
| Tabla AUDITORIA_LOGIN | ULTIMO_LOGIN + INTENTOS_FALLIDOS bastan. |

---

## 7. Orden de Ejecucion

| Paso | Responsable | Duracion |
|------|------------|----------|
| 1. Crear campos en Airtable (UI) | Manual / Hermes | 15 min |
| 2. Re-hash contrasenas (script) | Hermes | 10 min |
| 3. Agregar passlib + python-jose a requirements.txt | Hermes + git push | 5 min |
| 4. Crear backend/auth/ con 3 archivos | Hermes (execute_code) | 20 min |
| 5. Modificar backend/main.py | Hermes (execute_code) | 5 min |
| 6. Modificar airtable_adapter.py con mapeo | Hermes (execute_code) | 5 min |
| 7. Configurar JWT_SECRET en Railway | Manual en dashboard | 5 min |
| 8. Push + deploy en Railway | git push | 5 min |
| 9. Verificar health + login + me + rate limit | Hermes (curl) | 15 min |
| 10. Documentar resultados | Hermes | 10 min |

**Total estimado: ~1.5 horas**

---

## 8. Riesgos

| Riesgo | Mitigacion |
|--------|-----------|
| AirtableClient.get_records no soporta filtros | Implementar filter_by_formula. El adapter ya tiene list_records. |
| Railway no instala bcrypt | passlib[bcrypt] incluye wheel Linux. Si falla: bcrypt==4.0.1. |
| JWT_SECRET debil en dev | Fallback solo para dev. Railway debe sobrescribir. |
| Airtable rate limit (5 req/s) | Login hace 2-3 llamadas. Bajo trafico MVP no es problema. |

---

> **Documento generado por Hermes Agent - FASE 2A-C implementation plan**
> **Depende de:** `FASE_2A_B_SCHEMA_PATCH_PLAN.md` y `FASE_2A_B_AUTH_SCHEMA_PRECHECK.md`
> **Precede a:** FASE 2A-D (Frontend Auth Adapter - FUTURO)
> **No se implemento nada. Solo plan.**
