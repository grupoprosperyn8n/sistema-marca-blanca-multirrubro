# 🔐 FASE 2A — Auth Cliente Real Dry Run

> **Versión:** 1.0 | **Fecha:** 2026-06-21 | **Lead:** Hermes Agent (Diego López)  
> **Base activa:** `appuns6zIUKaJG7r0` (50 tablas) | **Backend:** Railway FastAPI  
> **Modo:** DISEÑO — sin implementación  
> **Fase autorizada:** FASE_2A_AUTH_CLIENTE_REAL_DRY_RUN

---

## ⚠️ DISCLAIMER

**Este documento es DISEÑO EXCLUSIVAMENTE.** Nada de lo aquí descrito debe implementarse sin aprobación explícita. No se crean tablas, no se instalan librerías, no se modifican schemas, no se añaden endpoints, no se toca Airtable.

---

# 1. AUDITORÍA DEL AUTH ACTUAL

## 1.1 Estado del Mock Auth

| Componente | Estado | Detalle |
|---|---|---|
| **Login** | Mock funcional | Selector de rol + campo nombre, sin email ni contraseña |
| **Registro** | Visual placeholder | Formulario sin backend, mensaje "Próximamente" |
| **Roles** | 5 internos + PUBLICO | ADMINISTRADOR, GERENTE, EMPLEADO_GESTION, PROFESIONAL, SOLO_LECTURA |
| **Permisos** | Hardcodeados estáticos | Objeto `PERMISOS` en `AuthContext.jsx`, 9 flags por rol |
| **Sesión** | `localStorage` | Claves: `mock_role`, `mock_usuario` — sin expiración, sin tokens |
| **Backend auth** | Inexistente | 0 rutas de auth; USUARIOS/ROLES existen en Airtable pero inaccesibles |
| **Clientes externos** | No implementado | Solo roles internos (staff); cliente público no tiene login |
| **Seguridad** | Ninguna | DevTools → `localStorage.setItem('mock_role','ADMINISTRADOR')` = admin total |

## 1.2 Guards por Rol

**Archivo:** `frontend/src/App.jsx`

```
ROLES_GESTION    = [ADMINISTRADOR, GERENTE, EMPLEADO_GESTION, SOLO_LECTURA]
ROLES_BACKOFFICE = [...ROLES_GESTION, PROFESIONAL]

Rutas protegidas:
  /backoffice              → ROLES_BACKOFFICE
  /backoffice/agenda       → ROLES_BACKOFFICE  
  /backoffice/citas        → ROLES_BACKOFFICE
  /backoffice/clientes     → ROLES_GESTION      (PROFESIONAL excluido)
  /backoffice/servicios    → ROLES_GESTION
  /backoffice/sucursales   → ROLES_GESTION
  /profesional             → [PROFESIONAL, ADMINISTRADOR, GERENTE]

Sin protección (públicas):
  /, /catalogo, /productos, /reserva, /servicios/:slug, /productos/:slug, /login
```

## 1.3 Tablas Airtable Relevantes

| Tabla | Existe | Backend la expone | Registros | Notas |
|---|---|---|---|---|
| **USUARIOS** | ✅ | ❌ | N/A | Tabla existe pero backend no la lee |
| **ROLES** | ✅ | ❌ | N/A | Tabla existe pero backend no la lee |
| **PERMISOS_MODULO** | ✅ | ❌ | N/A | Permisos por módulo y rol |
| **PERMISOS_CAMPO** | ✅ | ❌ | N/A | Permisos por campo y rol |
| **CLIENTES** | ✅ | ✅ `/api/clientes` | 13 | Público, sin auth |
| **EMPLEADOS** | ✅ | ❌ | N/A | Vincularía con USUARIOS |

**Conclusión:** 5 tablas de auth existen en Airtable pero el backend no las expone ni consume. El frontend usa sus propios roles mock sin conexión a datos reales.

---

# 2. COMPARATIVA DE OPCIONES

## 2.1 Opción A — Auth Propia en FastAPI

**Arquitectura:**
```
Cliente (React) → POST /api/auth/login → FastAPI
                                       → Hash bcrypt
                                       → JWT (access + refresh)
                                       → HttpOnly cookie
                                       → Validar contra Airtable USUARIOS
```

**Ventajas:**
- Control total sobre el flujo de auth
- Sin dependencia de servicios externos
- Airtable como simple almacén de datos (no como motor de auth)
- JWT puede incluir claims personalizados (marca_id, sucursal_id)
- Sesiones manejadas en backend, no en localStorage

**Desventajas:**
- Más código que mantener
- Responsabilidad de seguridad de passwords
- Necesidad de refresh tokens, revocación, rate limiting
- Railway + FastAPI debe manejar sesiones

**Librerías necesarias:**
- `python-jose[cryptography]` — JWT
- `passlib[bcrypt]` — hash de contraseñas
- `pydantic[email-validation]` — validación de emails

## 2.2 Opción B — Supabase Auth

**Arquitectura:**
```
Cliente (React) → Supabase Auth (managed)
                → Email + password + magic link + OAuth
                → JWT emitido por Supabase
FastAPI          → Verifica token JWT de Supabase
                → Extrae sub, email, role del JWT
Airtable         → CRM/operación (no auth)
```

**Ventajas:**
- Auth gestionada (registro, login, logout, email verification, password reset)
- Seguridad auditada por Supabase
- Row-Level Security (RLS) incluido
- SDK client-side maduro para React
- Menos responsabilidad de seguridad para el backend
- OAuth providers integrados (Google, Facebook, etc.)

**Desventajas:**
- Nueva dependencia de infraestructura (proyecto Supabase)
- Costo (free tier: 50K MAU, luego pago)
- Sincronización Supabase ↔ Airtable (doble fuente de verdad)
- Migración futura más compleja si se decide salir de Supabase
- Roles/comercial: los roles de Airtable deben sincronizarse con claims JWT

**Librerías necesarias:**
- `@supabase/supabase-js` (frontend)
- `supabase` (backend Python)
- `python-jose` (verificar JWT de Supabase en FastAPI)

## 2.3 Opción C — Híbrido (Supabase Auth + Airtable Operación)

**Arquitectura:**
```
Cliente (React) → Supabase Auth (identidad: login/registro)
                → JWT de Supabase con user_id
FastAPI          → Verifica JWT de Supabase
                → Busca perfil en Airtable (CLIENTES/USUARIOS por user_id)
                → Roles y permisos desde Airtable
```

**Ventajas:**
- Lo mejor de ambos mundos
- Auth delegada a expertos (Supabase)
- Datos operativos y perfil comercial en Airtable (sin migrar)
- Menos código de auth en FastAPI
- Escalable a futuro (si se migra todo a Supabase)

**Desventajas:**
- Complejidad de integración entre dos sistemas
- Latencia adicional (verificar JWT + consultar Airtable)
- Dos fuentes de verdad (Supabase para identidad, Airtable para perfil)
- Sincronización Supabase user_id ↔ Airtable CLIENTES.foreign_key
- Costo de Supabase adicional

---

# 3. RECOMENDACIÓN TÉCNICA

## ✅ OPCIÓN RECOMENDADA: **Opción A — Auth Propia en FastAPI**

### Justificación

1. **Stack actual unificado:** El proyecto ya usa FastAPI + Railway + Airtable. Agregar Supabase introduce una dependencia externa que no existe hoy y que requiere setup, costo y mantenimiento.

2. **Control total:** FastAPI permite definir exactamente cómo se validan credenciales, qué claims incluye el JWT, y cómo se integra con el modelo de datos existente.

3. **Sin costo adicional:** Railway ya está pagado; Airtable ya está configurado. Supabase free tier (50K MAU) es generoso pero agrega un punto de fallo externo.

4. **Simplicidad arquitectónica:** Un solo backend que maneja auth + datos. Sin sincronización entre sistemas.

5. **Roadmap futuro:** Si en FASE 3 se decide migrar a Supabase completo (auth + DB), la Opción A es más fácil de migrar que desacoplar la Opción C.

6. **Riesgo controlado:** Con bcrypt + JWT + HttpOnly cookies + CORS configurado, la seguridad es sólida sin depender de Airtable para validar contraseñas.

### ¿Cuándo reconsiderar Opción B/C?

- Si el proyecto escala a >10,000 clientes activos simultáneos
- Si se necesita OAuth social (Google, Facebook login)
- Si se requiere passwordless / magic links
- Si se necesita RLS a nivel de base de datos

---

# 4. MODELO DE DATOS PROPUESTO

## 4.1 Tablas Nuevas (NO crear todavía)

### 4.1.1 USUARIOS (ya existe — ampliar)

| Campo | Tipo | Descripción |
|---|---|---|
| `EMAIL` | Email (único) | Identificador de login |
| `PASSWORD_HASH` | Texto largo | bcrypt hash (nunca plaintext) |
| `ROL` | Link a ROLES | Rol asignado |
| `EMPLEADO` | Link a EMPLEADOS | Si es staff interno |
| `CLIENTE` | Link a CLIENTES | Si es cliente externo |
| `ACTIVO` | Checkbox | false = cuenta deshabilitada |
| `EMAIL_VERIFICADO` | Checkbox | true tras verificar email |
| `ULTIMO_LOGIN` | Fecha/Hora | Auditoría |
| `INTENTOS_FALLIDOS` | Número | Rate limiting |
| `BLOQUEADO_HASTA` | Fecha/Hora | Bloqueo temporal |

**Regla:** Un USUARIOS puede ser EMPLEADO (staff) O CLIENTE (externo), no ambos. Validar en backend.

### 4.1.2 SESIONES (tabla nueva)

| Campo | Tipo | Descripción |
|---|---|---|
| `USUARIO` | Link a USUARIOS | Dueño de la sesión |
| `REFRESH_TOKEN_HASH` | Texto largo | Hash del refresh token |
| `USER_AGENT` | Texto | Dispositivo/navegador |
| `IP` | Texto | IP del cliente |
| `CREADO` | Fecha/Hora | Inicio de sesión |
| `EXPIRA` | Fecha/Hora | Expiración absoluta |
| `REVOCADO` | Checkbox | true = sesión inválida |

**No guardar el access token — solo el refresh token (hasheado).**

### 4.1.3 TOKENS_RECUPERACION (tabla nueva)

| Campo | Tipo | Descripción |
|---|---|---|
| `USUARIO` | Link a USUARIOS | Usuario que solicitó |
| `TOKEN_HASH` | Texto largo | Hash del token enviado por email |
| `CREADO` | Fecha/Hora | Cuándo se generó |
| `EXPIRA` | Fecha/Hora | TTL del token (15 min) |
| `USADO` | Checkbox | true = ya fue consumido |

### 4.1.4 AUDITORIA_LOGIN (tabla nueva)

| Campo | Tipo | Descripción |
|---|---|---|
| `USUARIO` | Link a USUARIOS | O email si falló |
| `EXITO` | Checkbox | Login exitoso o fallido |
| `MOTIVO_FALLO` | Texto | "Password incorrecta", "Usuario no encontrado", etc. |
| `IP` | Texto | IP del intento |
| `USER_AGENT` | Texto | Navegador |
| `FECHA` | Fecha/Hora | Timestamp |

### 4.1.5 Tablas Existentes a Reutilizar

| Tabla | Modo actual | Rol en auth real |
|---|---|---|
| `CLIENTES` | CRM (13 registros) | Perfil comercial del cliente logueado |
| `ROLES` | Existe pero sin usar | Fuente de verdad de roles |
| `PERMISOS_MODULO` | Existe pero sin usar | Permisos granulares por rol |
| `PERMISOS_CAMPO` | Existe pero sin usar | Permisos a nivel de campo |
| `EMPLEADOS` | Existe pero sin usar | Vinculación staff ↔ USUARIOS |

---

# 5. ENDPOINTS PROPUESTOS

## 5.1 Contracto de API

### POST /api/auth/register

**Payload:**
```json
{
  "email": "cliente@email.com",
  "password": "MiPassword123!",
  "nombre": "María García",
  "telefono": "+541112345678"
}
```

**Response 201:**
```json
{
  "mensaje": "Cuenta creada. Revisá tu email para verificarla.",
  "user_id": "recXXXX"
}
```

**Validaciones:**
- Email único (consultar Airtable USUARIOS)
- Password ≥ 8 chars, 1 mayúscula, 1 número, 1 símbolo
- Email formato válido
- Rate limit: 3 registros por IP por hora

### POST /api/auth/login

**Payload:**
```json
{
  "email": "cliente@email.com",
  "password": "MiPassword123!"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900,
  "usuario": {
    "id": "recXXXX",
    "email": "cliente@email.com",
    "nombre": "María García",
    "rol": "CLIENTE"
  }
}
```

**Cookies:** Setear `refresh_token` como HttpOnly, Secure, SameSite=Lax, path=/api/auth

**Validaciones:**
- Usuario existe en USUARIOS
- Cuenta ACTIVA = true
- EMAIL_VERIFICADO = true
- Password coincide con bcrypt hash
- Rate limit: 5 intentos fallidos → bloqueo 15 min

### POST /api/auth/logout

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{
  "mensaje": "Sesión cerrada"
}
```

**Acción:**
- Marcar refresh token como REVOCADO en SESIONES
- Clear cookie `refresh_token`

### POST /api/auth/refresh

**Cookies:** Lee cookie `refresh_token`

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Validaciones:**
- Refresh token existe en SESIONES
- No está REVOCADO
- No expiró
- Rotar refresh token (emitir nuevo, invalidar viejo)

### GET /api/auth/me

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{
  "id": "recXXXX",
  "email": "cliente@email.com",
  "nombre": "María García",
  "rol": "CLIENTE",
  "permisos": {
    "backoffice": false,
    "agenda": true,
    "citas": true
  },
  "cliente_id": "recYYYY",
  "sucursal_preferida": "recZZZZ"
}
```

### POST /api/auth/forgot-password

**Payload:**
```json
{
  "email": "cliente@email.com"
}
```

**Response 200 (siempre):**
```json
{
  "mensaje": "Si el email existe, recibirás instrucciones para restablecer tu contraseña."
}
```

**Nota de seguridad:** Responder siempre 200 aunque el email no exista — evitar enumeración de usuarios.

### POST /api/auth/reset-password

**Payload:**
```json
{
  "token": "abc123...",
  "new_password": "NuevaPassword456!"
}
```

**Response 200:**
```json
{
  "mensaje": "Contraseña actualizada. Ya podés iniciar sesión."
}
```

**Validaciones:**
- Token de recuperación existe
- No expiró (15 min TTL)
- No fue usado antes (USADO = false)
- Nueva password cumple reglas

---

# 6. SEGURIDAD

## 6.1 Hashing de Contraseñas

- **Algoritmo:** bcrypt (via `passlib`)
- **Rondas:** 12 (estándar seguro, ~300ms en CPU moderna)
- **Nunca:** MD5, SHA1, SHA256 sin salt, AES reversible, plaintext

## 6.2 JWT (Access Token)

- **Algoritmo:** HS256 (simétrico, clave secreta en Railway)
- **Expiración:** 15 minutos (corto, rotar con refresh)
- **Payload:**
```json
{
  "sub": "recXXXX",
  "email": "cliente@email.com",
  "rol": "CLIENTE",
  "iat": 1624287600,
  "exp": 1624288500
}
```
- **No incluir:** password_hash, datos sensibles, registros completos

## 6.3 Refresh Token

- **Formato:** String aleatorio (secrets.token_urlsafe(64))
- **Almacenamiento:** Hasheado en SESIONES (bcrypt)
- **Transmisión:** Cookie HttpOnly, Secure, SameSite=Lax
- **Expiración:** 7 días (configurable por rol)
- **Rotación:** Cada refresh emite nuevo par (access + refresh)
- **Revocación:** Marcar REVOCADO=true en SESIONES al logout

## 6.4 Cookies/Sesión

```
Set-Cookie: refresh_token=<token>;
  HttpOnly;           ← No accesible desde JavaScript
  Secure;             ← Solo HTTPS (Railway ya es HTTPS)
  SameSite=Lax;       ← Protege contra CSRF
  Path=/api/auth;     ← Solo endpoints de auth
  Max-Age=604800      ← 7 días
```

## 6.5 CORS

Ya configurado en `main.py`:
```python
allow_origins=["https://bellezapro-demo.surge.sh", "http://localhost:5173"]
allow_credentials=True  # ← Necesario para cookies
```

Verificar que `allow_credentials=True` ya está activo ✅

## 6.6 Rate Limiting

| Endpoint | Límite | Ventana |
|---|---|---|
| `/api/auth/login` | 5 intentos | 15 min por IP |
| `/api/auth/register` | 3 registros | 1 hora por IP |
| `/api/auth/forgot-password` | 3 solicitudes | 1 hora por IP |

**Implementación:** Middleware simple en FastAPI (diccionario en memoria, o Redis si escala).

## 6.7 Reglas de Seguridad (NO NEGOCIABLES)

- ❌ Contraseñas en plaintext — NUNCA
- ❌ MD5, SHA1, SHA256 sin salt — NUNCA
- ❌ Guardar tokens reales en Airtable — NUNCA
- ❌ Refresh tokens sin hash — NUNCA
- ❌ JWT eternos (sin expiración) — NUNCA
- ❌ Service role en frontend — NUNCA
- ❌ Airtable token en frontend — NUNCA
- ❌ Login real solo con localStorage — NUNCA
- ❌ Roles confiados únicamente al frontend — NUNCA

---

# 7. PLAN DE MIGRACIÓN (Mock → Auth Real)

## FASE 2A (AHORA): Diseño ✅
- Este documento
- Aprobación de arquitectura
- No se implementa nada

## FASE 2A-B: Implementación Progresiva (FUTURO — no autorizado aún)

### Etapa 1: Backend Auth Core
- Instalar `passlib[bcrypt]`, `python-jose`
- Crear `POST /api/auth/register` (solo backend)
- Crear `POST /api/auth/login` (solo backend)
- Crear `POST /api/auth/refresh`
- Crear `GET /api/auth/me`
- Middleware de rate limiting
- Tests unitarios de auth

### Etapa 2: Usuarios Seed
- Crear registros en USUARIOS para roles staff
- Hashear contraseñas con bcrypt
- Vincular USUARIOS ↔ EMPLEADOS (si existen)
- No exponer contraseñas seed en código

### Etapa 3: Frontend Auth Adapter
- Refactorizar `AuthContext.jsx`: reemplazar `localStorage` mock por fetch a `/api/auth/*`
- Manejar tokens: access_token en memoria (variable JS, no localStorage)
- Refresh automático al expirar access_token
- Logout limpio (borrar token, llamar endpoint)
- Mantener compatibilidad con guards existentes

### Etapa 4: Registro Cliente
- Activar formulario de registro (`Login.jsx` tab "Soy cliente nuevo")
- Conectar a `POST /api/auth/register`
- Validaciones frontend + backend
- Email de verificación (opcional — futura fase)

### Etapa 5: Limpieza Mock
- Eliminar `mock_role`, `mock_usuario` de localStorage
- Eliminar selector de rol mock
- Mantener solo login real para staff + clientes

### Etapa 6: Auditoría y QA
- Verificar que ningún rol mock persista
- Probar todos los guards con auth real
- QA funcional completo con clientes reales

---

# 8. INTEGRACIÓN CON RESERVAS (Diseño)

## Flujo de Reserva con Cliente Autenticado

```
1. Cliente logueado (JWT válido)
   ↓
2. GET /api/servicios → catálogo de servicios
   ↓
3. Cliente elige servicio
   ↓
4. GET /api/sucursales → sucursales disponibles
   ↓
5. Cliente elige sucursal
   ↓
6. GET /api/agenda-slots?servicio_id=X&sucursal_id=Y&fecha=2026-06-25
   ↓
7. Backend valida disponibilidad (sin double booking)
   ↓
8. Cliente elige slot y confirma
   ↓
9. POST /api/citas (con JWT del cliente)
   {
     "servicio_id": "recAAA",
     "sucursal_id": "recBBB",
     "slot_id": "recCCC",
     "cliente_id": "extraído_del_JWT"
   }
   ↓
10. Backend:
    - Verifica que el slot siga libre (race condition)
    - Crea cita en AGENDA_SLOTS / CITAS
    - Asocia CLIENTES ↔ CITA
    - Registra origen: WEB
    - Retorna confirmación
```

**Validaciones del backend:**
- JWT válido y no expirado
- Rol CLIENTE (no permitir staff reservar como cliente)
- Slot libre (atomicidad: check + create en una sola operación lógica)
- No double booking: mismo cliente no reserva el mismo slot dos veces
- Rate limit: 10 reservas por cliente por día

---

# 9. RIESGOS IDENTIFICADOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Airtable rate limit (5 req/s) | Alta | Medio | Cache de sesiones en memoria Redis/memoria |
| Airtable downtime | Baja | Alto | Graceful degradation: login existente sigue válido con JWT |
| bcrypt latencia en Railway | Baja | Bajo | 12 rondas es ~300ms, aceptable en login |
| Robo de refresh token | Media | Alto | HttpOnly + Secure + SameSite + rotación + revocación |
| CSRF | Media | Alto | SameSite=Lax en cookie + CORS estricto |
| Timing attack en login | Baja | Medio | Comparación constant-time de hashes (bcrypt lo hace) |
| Enumeración de usuarios | Media | Medio | Mensajes genéricos en login/forgot-password |
| JWT secret expuesto | Baja | Crítico | Variable de entorno en Railway, rotación periódica |
| Double booking en reservas | Media | Alto | Atomicidad en backend: check+create en una transacción lógica |

---

# 10. DOCUMENTOS CREADOS

- ✅ `docs/auth/FASE_2A_AUTH_CLIENTE_REAL_DRY_RUN.md` — Este documento

---

# 11. PRÓXIMO PASO RECOMENDADO

**FASE_2A_B_AUTH_CLIENTE_REAL_IMPLEMENTACION_CONTROLADA**

- Implementar Etapa 1 (Backend Auth Core) de la migración
- Solo backend: instalar librerías, crear endpoints de auth
- Sin tocar frontend todavía
- Sin crear tablas nuevas en Airtable (usar USUARIOS existente)
- Sin registrar clientes reales

**No avanzar sin aprobación explícita de Diego.**

---

> **Documento generado por Hermes Agent — FASE_2A_AUTH_CLIENTE_REAL_DRY_RUN**  
> **Base Airtable activa:** `appuns6zIUKaJG7r0` (50 tablas, verificada vía Railway /health + /api/tablas)  
> **Próxima revisión:** Antes de FASE 2A-B
