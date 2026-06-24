# FASE 3B — Portal Cliente (Perfil + Historial de Citas)

**Fecha cierre:** 2026-06-23
**Commits:** `9cfdcc5` (backend + frontend inicial), `6a24163` (fix SameSite cookie), `215a7a2` (fix API paths)
**QA browser:** completado y aprobado

---

## Alcance

| Feature | Estado |
|---------|--------|
| GET /api/clientes/me — perfil del cliente autenticado | OK |
| GET /api/clientes/me/citas — historial de citas propias | OK |
| PATCH /api/clientes/me — editar campos seguros | OK |
| PortalCliente.jsx — SPA con perfil editable e historial | OK |
| CTA Reservar Turno → toast Proximamente | OK |
| Login cliente → redirect a /portal | OK |
| Logout → redirect a landing | OK |
| Guard ruta: sin auth → login | OK |
| Cookie cross-origen (Surge → Railway) con SameSite=None | OK |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| backend/routes/clientes.py | 3 endpoints: GET /me, PATCH /me, GET /me/citas |
| backend/auth/security.py | Cookie defaults: SameSite=none, Secure=true |
| frontend/src/pages/PortalCliente.jsx | SPA completa (434 lineas) |

---

## Bugs corregidos durante QA

| Bug | Archivo | Fix |
|-----|---------|-----|
| credentials: "same-origin" no envia cookie cross-origen | PortalCliente.jsx:63 | → credentials: "include" |
| VITE_API_URL no definida en prod | PortalCliente.jsx:4 | → VITE_API_BASE_URL |
| Paths sin prefijo /api (404) | PortalCliente.jsx:80,81,111 | → /api/clientes/me, /api/clientes/me/citas |
| Cookie SameSite=Lax bloqueada cross-origen | auth/security.py:26 | → SameSite=none + Secure=true |

---

## Seguridad verificada

- Autenticacion por cookie JWT (no parametro manipulable)
- Campos admin bloqueados en PATCH
- Filtrado por usuario autenticado
- Cookie HttpOnly (no accesible desde JS)
- CORS allow_credentials configurado

---

## Deploys activos

| Servicio | URL |
|----------|-----|
| Backend (Railway) | earnest-comfort-production-3d75.up.railway.app |
| Frontend (Surge) | sistema-multirrubro-demo.surge.sh |

---

## QA user de prueba

Email: qaportal3b@bellezapro.test
Password: Test1234
Nombre: QA Portal 3B (restaurado tras QA)
Citas: 0 (cliente nuevo)

---

## No incluido (excluido por scope)

- Creacion de reservas reales (no modificar CITAS/AGENDA_SLOTS)
- Tabla RESERVAS (modelo canonico: CITAS + AGENDA_SLOTS)
- Pagos / checkout / FASE_3C
- Modificaciones a Airtable
- Exposicion de .env / CREDENCIALES.md
