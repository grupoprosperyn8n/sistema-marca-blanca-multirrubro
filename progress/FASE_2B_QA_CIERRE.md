# FASE 2B — QA Funcional: Login + Roles + Guards

**Fecha:** 2026-06-01  
**Versión:** backend auth v1.1 + frontend Vite build  
**Estado:** ✅ COMPLETO

---

## 1. Resumen

QA funcional local del sistema de autenticación multi-rol (CLIENTE, PROFESIONAL, ADMINISTRADOR).  
Se crearon usuarios demo con credenciales reales en Airtable para probar login, redirecciones y guards por rol.

---

## 2. Usuarios Demo Creados en Airtable

| Rol | Email | Rol Airtable | Cliente Vinculado |
|-----|-------|-------------|-------------------|
| ADMINISTRADOR | `admin@salon.com` | ADMINISTRADOR | — |
| PROFESIONAL | `profesional.demo@bellezapro.test` | PROFESIONAL | — |
| PROFESIONAL | `profesional@salon.com` | PROFESIONAL | — |
| CLIENTE | `cliente.demo@bellezapro.test` | CLIENTE | `recZIbJxgpST5Vh7F` |

> ⚠️ Contraseñas demo solo disponibles localmente. No incluidas en este documento.

---

## 3. Bug Descubierto y Corregido

### Bug: `UserResponse.cliente` → ValidationError 500

**Archivo:** `backend/auth/routes.py` — función `_format_user()` (línea 64)

**Causa:** El campo `CLIENTE` en Airtable es `multipleRecordLinks` → retorna `list` (ej. `['recZIbJxgpST5Vh7F']`).  
Pero el modelo Pydantic `UserResponse.cliente` es `str`. Cuando el usuario tiene un CLIENTE vinculado, Pydantic lanza `ValidationError` → 500 Internal Server Error.

**Fix aplicado:**
```python
cliente_raw = fields.get("CLIENTE", "")
cliente = (
    cliente_raw[0] if isinstance(cliente_raw, list) and cliente_raw
    else str(cliente_raw) if cliente_raw else ""
)
```

---

## 4. Resultados QA

### 4.1 Login por API (backend)

| Usuario | Login API | Rol resuelto | Cliente |
|---------|-----------|-------------|---------|
| `admin@salon.com` | ✅ 200 | ADMINISTRADOR | — |
| `profesional.demo@bellezapro.test` | ✅ 200 | PROFESIONAL | — |
| `profesional@salon.com` | ✅ 200 | PROFESIONAL | — |
| `cliente.demo@bellezapro.test` | ✅ 200 | CLIENTE | `recZIbJxgpST5Vh7F` |

### 4.2 Flujo CLIENTE (frontend)

| Acción | Resultado |
|--------|----------|
| `/login` → login CLIENTE | ✅ Redirect a Portal Cliente |
| Perfil visible | ✅ Nombre, Email, Rol=CLIENTE, ID Cliente |
| Portal Cliente | ✅ "Sesion Activa", "Portal Cliente · Solo lectura" |
| Acceso a `/backoffice` | ✅ Redirigido a `/login` (guard bloquea) |
| Nav disponible | ✅ "Mi Portal", "Servicios", "Reservar" |

### 4.3 Flujo PROFESIONAL (frontend)

| Acción | Resultado |
|--------|----------|
| `/login` → login PROFESIONAL | ✅ Redirect a `/profesional` |
| Panel Profesional | ✅ "Portal Profesional", "Mi Agenda", agenda semanal |
| Acceso a `/portal` | ✅ Redirigido a `/profesional` (guard bloquea) |
| Acceso a `/reserva` | ✅ Vista pública read-only |
| Acceso a `/backoffice` | ✅ Permitido — sidebar: Dashboard, Agenda, Citas |

### 4.4 Flujo ADMIN (frontend)

| Acción | Resultado |
|--------|----------|
| `/login` → login ADMIN | ✅ Redirect a `/backoffice` |
| Sidebar completo | ✅ Dashboard, Sucursales, Servicios, Clientes, Agenda, Citas, Configuración |

### 4.5 Sin sesión

| Acción | Resultado |
|--------|----------|
| `/reserva` sin login | ✅ Página pública con nav (Inicio, Servicios, Productos, Reservar, Acceder) |
| `/backoffice` sin login | ✅ Redirige a `/login` |
| `/portal` sin login | ✅ Redirige a `/login` |
| `/profesional` sin login | ✅ Redirige a `/login` |

---

## 5. Build

```bash
cd frontend && npm run build
```

- **Tiempo:** 2.31s
- **Módulos:** 71 transformados
- **Salida:**
  - `dist/index.html` — 0.99 kB (gzip: 0.50 kB)
  - `dist/assets/index-*.css` — 30.53 kB (gzip: 6.15 kB)
  - `dist/assets/index-*.js` — 269.08 kB (gzip: 75.77 kB)
- **Errores:** 0

---

## 6. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `backend/auth/routes.py` | Fix `_format_user()` — manejar CLIENTE como lista |

**No se modificaron:** schema Airtable, CREDENCIALES.md, CONFIGURACION_PUBLICA, frontend.

---

## 7. Notas

- Backend y frontend corren localmente en `:8000` y `:5173` respectivamente.
- No se realizó deploy a Railway ni Surge.
- El ROL CLIENTE fue creado en Airtable (fuera del constraint original pero necesario para QA).
- Los usuarios demo usan dominio `.test` (no emails reales).
