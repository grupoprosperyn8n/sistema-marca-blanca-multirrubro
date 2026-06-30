# progress/session-summary.md — CIERRE FASE 3B

## Sesión: CHECKPOINT_CIERRE_FASE_3B_PORTAL_CLIENTE
**Fecha:** 2026-06-23
**Fase:** FASE_3B — Portal Cliente
**Estado:** CERRADA

---

## Git status

| Indicador | Valor |
|-----------|-------|
| Rama | main |
| Commit HEAD | 215a7a2 |
| Push al remote | ✅ |
| Untracked pendientes | progress/ (documentación), otros assets de proyecto |
| Secretos en diff | NINGUNO |

---

## Archivos FASE_3B commiteados

| Archivo | Commit |
|---------|--------|
| backend/routes/clientes.py | 3a2ccfe |
| backend/auth/security.py | 6a24163 |
| frontend/src/pages/PortalCliente.jsx | 3a2ccfe, 215a7a2 |

---

## Smoke test

| Prueba | Resultado |
|--------|-----------|
| Railway health | 200 ✅ |
| Login QA | 200 + cookie auth_token ✅ |
| /api/clientes/me | 200 — QA Portal 3B ✅ |
| Surge landing | carga sin errores ✅ |
| Surge login | 3 tabs, formulario funcional ✅ |
| Surge portal | perfil + citas cargados ✅ |
| Surge logout | redirect a landing ✅ |
| Consola JS | 0 errores, 0 warnings ✅ |

---

## Secretos auditados en diff

- JWT_SECRET: no expuesto
- AIRTABLE_TOKEN: no en diff
- Passwords: no en diff
- Cookies completas: no en diff
- .env: no commiteado
- CREDENCIALES.md: no commiteado

---

## Recomendación para FASE_3C

- FASE_3B cerrada con verificaciones completas
- Backend + frontend sincronizados, deployados y testeados
- Portal Cliente base funciona correctamente
- FASE_3C puede avanzar con:
  - Reserva de turnos reales (CITAS + AGENDA_SLOTS)
  - Vista de citas por sucursal/profesional
  - Confirmación y cancelación de citas

---

# CIERRE FASE 3C2 — Confirmación Real de Turno

**Fecha:** 2026-06-24
**Fase:** FASE_3C2 — Confirmación de turno (backend + frontend + QA)
**Estado:** CERRADA

---

## Resumen

Implementado endpoint `POST /api/clientes/citas/confirmar` y botón "Confirmar Turno" en `ReservaTurnoModal.jsx`.
El endpoint crea una CITA real en Airtable, marca el AGENDA_SLOT como RESERVADO y valida:
autenticación (JWT), rol CLIENTE, disponibilidad del slot, servicio web activo, sucursal activa,
y previene doble confirmación.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/routes/clientes.py` | +130 líneas: endpoint `POST /api/clientes/citas/confirmar` |
| `frontend/src/components/ReservaTurnoModal.jsx` | +45 líneas: estados (`confirmando`, `confirmado`, `errorConfirmacion`), handler `runConfirm()`, botón "Confirmar Turno" con estados loading/error/éxito |

---

## QA Funcional

| Prueba | Resultado |
|--------|-----------|
| Confirmación real (slot DISPONIBLE) | ✅ CITA creada `recNs56fLrTNwUapu`, slot → RESERVADO |
| Confirmación adicional (otro slot) | ✅ CITA creada `recntUAKMplMksSOz`, slot → RESERVADO |
| Slot marcado RESERVADO en Airtable | ✅ ESTADO_SLOT=RESERVADO, CAPACIDAD_OCUPADA=1, CITAS linkeada |
| CITA con datos completos | ✅ ESTADO_CITA=CONFIRMADA, CLIENTE/SERVICIO/SLOT vinculados |

## QA Seguridad

| Prueba | HTTP | Resultado |
|--------|------|-----------|
| Sin auth (sin cookie) | **401** | ✅ "No autenticado: cookie auth_token ausente" |
| Rol no CLIENTE (ADMIN) | **403** | ✅ "Solo clientes pueden confirmar turnos" |
| Doble confirmación mismo slot | 200, `confirmado:false` | ✅ Rechazada: slot RESERVADO + sin capacidad |

---

## Build & Deploy

| Artefacto | Estado |
|-----------|--------|
| Backend Railway | ✅ Deployado (`215a7a2`) |
| Frontend Surge | ✅ `sistema-multirrubro-demo.surge.sh` — build limpio (312KB JS) |

---

## Usuarios QA

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| QA Cliente | `qaportal3b@bellezapro.test` | `qatest99` | CLIENTE |
| Admin | `admin@salon.com` | `admintest99` | ADMINISTRADOR |

---

## Recomendaciones para FASE_3C3/3D

- FASE_3C2 cerrada con todas las verificaciones
- Endpoint confirmar listo para producción
- Próximo: cancelación/reprogramación de citas, o portal de profesional

---

# CIERRE FASE 3C3 — Cancelación/Reprogramación de Turnos

**Fecha:** 2026-06-24
**Fase:** FASE_3C3 — Cancelar/Reprogramar desde Portal Cliente
**Estado:** CERRADA

## Resumen

Corregido el bloqueo de `GET /api/clientes/me/citas`: Airtable REST devuelve linked records como IDs (`rec...`), no como nombres visibles. El endpoint ahora filtra CITAS por el `CLIENTE` linked-record ID real y retorna correctamente las citas del cliente QA.

También se endurecieron `cancelar` y `reprogramar` para validar pertenencia por linked ID, detectar slots ocupados por CITAS activas y aplicar rollback compensatorio si falla un PATCH intermedio entre CITA y AGENDA_SLOT.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/routes/clientes.py` | Helpers de linked-record IDs, `/me/citas` por CLIENTE ID, chequeo de slots activos, rollback compensatorio en cancelar/reprogramar |

## Causa raíz

- `by_name=True` en `AirtableClient.list_records()` solo usa el nombre de tabla en la URL.
- NO convierte linked records a nombres.
- `CLIENTE` llegaba como `['recE9NNLvCgpOFxZU']`, pero el backend comparaba contra `QA Portal 3B`.
- Resultado anterior: `total: 0` aunque la CITA existía.

## QA Backend

| Prueba | Resultado |
|--------|-----------|
| `/api/clientes/me/citas` local | ✅ 200 — `total=6`, `proximas=3`, `historial=3` |
| `/api/clientes/me/citas` Railway | ✅ 200 — `total=6`, `proximas=3`, `historial=3` |
| Cancelar sin auth | ✅ 401 |
| Cancelar cita ajena | ✅ 403 |
| Reprogramar a slot ocupado | ✅ 409 |
| Cancelar cita propia QA | ✅ 200 + slot liberado |
| Reprogramar a slot válido QA | ✅ 200 + swap CITA/slots verificado |
| Fixtures QA | ✅ Restaurados luego de QA mutante |
| Build frontend | ✅ Vite build limpio |

## Build & Deploy

| Artefacto | Estado |
|-----------|--------|
| Backend Railway | ✅ Deployado desde `main` — commit `2678c30` |
| Frontend Surge | ✅ `https://belleza-demo.surge.sh` |
| Frontend Surge | ✅ `https://sistema-multirrubro-demo.surge.sh` |
| Frontend Surge | ✅ `https://bellezapro-demo.surge.sh` |

## Descubrimientos

- Hay slots marcados `DISPONIBLE` que igualmente tienen CITAS activas vinculadas. Para QA o lógica crítica, no alcanza con mirar `ESTADO_SLOT`; hay que cruzar contra CITAS activas.
- `AirtableClient.list_records()` no acepta `page_size`; usar `max_records` o filtrado local según corresponda.
- Airtable no ofrece transacciones multi-record en este flujo; se implementó rollback compensatorio.

## Recomendaciones para siguiente fase

- Avanzar con Portal Profesional: agenda diaria, clientes del día y marcar cita como COMPLETADA.
- Evaluar una limpieza de datos para slots `DISPONIBLE` con CITAS activas vinculadas.
- Agregar tests persistentes para helpers de linked-record IDs y rollback 3C3.

---

# HOTFIX — Branding por dominio en Surge

**Fecha:** 2026-06-24
**Estado:** CERRADO

## Problema

Los tres dominios Surge (`belleza-demo`, `sistema-multirrubro-demo`, `bellezapro-demo`) renderizaban la misma home con el mismo branding.

## Causa raíz

Se estaba publicando el mismo build en los tres dominios y el frontend consumía una única marca desde `/api/marca-blanca`, que devuelve `BellezaPro Demo` para todos. No existía resolución por hostname.

## Fix

`frontend/src/context/BrandConfigContext.jsx` ahora aplica variantes runtime por `window.location.hostname`:

- `belleza-demo.surge.sh` → Belleza Demo
- `sistema-multirrubro-demo.surge.sh` → Sistema Multirrubro
- `bellezapro-demo.surge.sh` → BellezaPro

## Verificación

Chrome headless confirmó DOM renderizado distinto:

| Dominio | Marker verificado |
|---------|-------------------|
| `belleza-demo.surge.sh` | `Belleza Demo`, `Gestión de salones` |
| `sistema-multirrubro-demo.surge.sh` | `Sistema Multirrubro`, `Un sistema base` |
| `bellezapro-demo.surge.sh` | `BellezaPro`, `experiencia premium` |

Commit: `1a0d602 fix(frontend): diferenciar branding por dominio`

---

# CHECKPOINT — BACKOFFICE CRUD P0 Clientes + Servicios

**Fecha:** 2026-06-25
**Estado:** CERRADO
**Commit:** `5e7b5b8 feat(backoffice): add clientes servicios CRUD P0`

## Alcance cerrado

- CRUD backoffice real para `CLIENTES` y `SERVICIOS`.
- RBAC por `PERMISOS_MODULO`.
- Permisos por campo con helper `can_edit_field` y allowlist segura por tabla.
- Baja lógica, sin DELETE físico:
  - `CLIENTES`: `ACTIVO=false`.
  - `SERVICIOS`: `ACTIVO=false` + `ESTADO_SERVICIO=INACTIVO`.
- Frontend conectado con modal Crear/Editar, selección de fila y baja lógica.

## QA

| Rol | Resultado |
|-----|-----------|
| Sin auth | ✅ 401 |
| ADMINISTRADOR | ✅ crear/editar/baja lógica |
| GERENTE | ✅ crear/editar; delete 403 |
| EMPLEADO_GESTION | ✅ crear/editar; delete 403; campo restringido 403 |
| PROFESIONAL | ✅ mutaciones 403 |
| SOLO_LECTURA | ✅ mutaciones 403 |


## Deploy

- Commit implementación: `c6e2015 feat(backoffice): add landing configuration editor`.
- Push `origin/main`: ✅ PASS.
- Railway `earnest-comfort`: ✅ Online después del auto-deploy.
- Surge producción: ✅ `https://bellezapro-demo.surge.sh`.
- Smoke live: `/health`, `/api/landing-secciones`, `/api/configuracion-publica`, `/`, `/catalogo`, `/productos`, `/reserva`, `/login`, `/backoffice/configuracion` ✅ PASS.

## Garantías

- No se modificó schema Airtable.
- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se tocaron `CITAS`, `AGENDA_SLOTS` ni `SUCURSALES` en P0.
- No hubo delete físico.
- Build frontend OK.

---

# CIERRE — BACKOFFICE CRUD P1 Sucursales

**Fecha:** 2026-06-25
**Estado:** CERRADO

## Alcance cerrado

- Configuración Airtable autorizada:
  - `MODULOS`: creado `SUCURSALES`.
  - `PERMISOS_MODULO`: configurado para `ADMINISTRADOR`, `GERENTE`, `EMPLEADO_GESTION`, `PROFESIONAL`, `SOLO_LECTURA`.
- CRUD backoffice real para `SUCURSALES`.
- Baja lógica, sin DELETE físico:
  - `ACTIVO=false`.
  - `ESTADO_SUCURSAL=INACTIVA`.
  - `PUBLICAR_WEB=false`.
  - `VISIBILIDAD_WEB=OCULTA`.
- Frontend backoffice conectado con modal Crear/Editar, selección de fila y baja lógica.
- Filtro público actualizado para no mostrar sucursales inactivas/ocultas.

## RBAC

| Rol | Resultado |
|-----|-----------|
| ADMINISTRADOR | crear/editar/baja lógica |
| GERENTE | crear/editar; delete bloqueado |
| EMPLEADO_GESTION | sin acceso/mutaciones 403 |
| PROFESIONAL | sin acceso/mutaciones 403 |
| SOLO_LECTURA | lectura; mutaciones 403 |

## PERMISOS_CAMPO

No se crearon `PERMISOS_CAMPO` para `SUCURSALES` porque `PERMISOS_CAMPO.TABLA` no contiene la opción `SUCURSALES`. Agregar esa opción sería modificar schema Airtable. La protección P1 queda aplicada por:

- RBAC de módulo con `PERMISOS_MODULO`.
- Allowlist segura en backend.
- Payload frontend filtrado por campos editables.

## QA

| Prueba | Resultado |
|--------|-----------|
| Backend local /health | ✅ 200 |
| Sin auth create | ✅ 401 |
| ADMINISTRADOR create/edit/delete lógico | ✅ |
| GERENTE create/edit/delete 403 | ✅ |
| EMPLEADO_GESTION mutaciones 403 | ✅ |
| PROFESIONAL mutaciones 403 | ✅ |
| SOLO_LECTURA mutaciones 403 | ✅ |
| Registros QA sucursales | ✅ 2 creados y baja lógica |
| Build frontend | ✅ Vite build OK |
| DELETE físico | ✅ No usado |

## Garantías

- No se modificó schema Airtable.
- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se tocaron `CITAS` ni `AGENDA_SLOTS`.
- No se creó tabla `RESERVAS`.
- No se implementaron pagos, checkout ni caja/POS.

---

# CIERRE — BACKOFFICE OPERATIVO P2 Citas + Agenda

**Fecha:** 2026-06-25
**Estado:** CERRADO LOCAL QA

## Alcance cerrado

- Push normal de commits pendientes P0/P1 y Railway auto-deploy verificado OK.
- CRUD backoffice real para `CITAS`:
  - `POST /api/backoffice/citas`.
  - `PATCH /api/backoffice/citas/{id}`.
  - `DELETE /api/backoffice/citas/{id}` como cancelación/baja lógica.
- Integración con `AGENDA_SLOTS`:
  - crear cita reserva slot.
  - reprogramar libera slot anterior y reserva slot nuevo.
  - cancelar libera slot.
  - doble reserva rechazada con 409.
- DTO backend enriquecido para backoffice: nombres humanos de cliente, servicio, profesional, sucursal y estado del slot.
- Frontend backoffice de Citas conectado con modal Crear/Editar-Reprogramar/Cancelar.
- Agenda actualizada para usar `HORA_INICIO` y nombres DTO.

## Baja lógica

- `CITAS`: `ESTADO_CITA=CANCELADA`, `ACTIVO=false`, `FECHA_CANCELACION`, `CANCELADO_POR=SALON`.
- `AGENDA_SLOTS`: se libera con `ESTADO_SLOT=DISPONIBLE`, `TIPO_SLOT=DISPONIBLE`, `CAPACIDAD_OCUPADA=0` si no quedan citas activas.

## QA local

| Prueba | Resultado |
|--------|-----------|
| Sin auth create | ✅ 401 |
| ADMINISTRADOR create/edit/reprogram/cancel | ✅ |
| GERENTE create/edit/delete 403 | ✅ |
| EMPLEADO_GESTION create/edit/delete 403 | ✅ |
| PROFESIONAL mutaciones 403 | ✅ |
| SOLO_LECTURA mutaciones 403 | ✅ |
| Doble reserva mismo slot | ✅ 409 |
| Reprogramación libera slot anterior | ✅ |
| Reprogramación reserva slot nuevo | ✅ |
| Cancelación libera slot | ✅ |
| Registros QA CITAS | ✅ 3 creados y cancelados lógico |
| Build frontend | ✅ Vite build OK |
| Backend py_compile | ✅ OK |
| DELETE físico | ✅ No usado |
| RESERVAS | ✅ No usada/no creada |

## Garantías

- No se modificó schema Airtable.
- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se creó ni usó tabla `RESERVAS`.
- No pagos, no checkout, no caja/POS.
- No cambios auth/JWT/cookies.

---

# CIERRE — BACKOFFICE OPERATIVO P3 Profesional + Completar Cita

**Fecha:** 2026-06-25
**Estado:** CERRADO LOCAL QA

## Alcance cerrado

- Portal profesional conectado a backend real.
- Agenda propia resuelta desde `USUARIOS.EMPLEADO` → `EMPLEADOS` → `CITAS.PROFESIONAL`.
- Endpoints protegidos:
  - `GET /api/profesional/me`.
  - `GET /api/profesional/citas`.
  - `PATCH /api/profesional/citas/{id}/estado`.
- Acción profesional para marcar cita propia como `COMPLETADA`.
- Frontend `/profesional` con resumen, filtros por estado/fecha, citas de hoy, próximas, completadas y acción de completar.
- Optimización del DTO de Citas para evitar N+1 de Airtable con resolver bulk.

## Reglas de negocio confirmadas

- `CITAS.PROFESIONAL` linkea contra `EMPLEADOS`, no contra tabla `PROFESIONALES`.
- Completar/atender usa el estado real existente `COMPLETADA`.
- Completar NO libera `AGENDA_SLOTS`.
- Cita cancelada no puede completarse.
- Cita futura no puede completarse.
- Profesional no puede ver ni operar citas ajenas.

## QA local

| Prueba | Resultado |
|--------|-----------|
| Sin auth profesional/citas | ✅ 401 |
| Profesional /me | ✅ 200 + empleado resuelto |
| Profesional agenda propia | ✅ total=2, sin citas ajenas |
| SOLO_LECTURA portal profesional | ✅ 403 |
| EMPLEADO_GESTION portal profesional | ✅ 403 |
| Profesional completa cita ajena | ✅ 403 |
| Cita cancelada no completa | ✅ 409 |
| Cita futura no completa | ✅ 409 |
| Profesional completa propia | ✅ 200 |
| Completar no libera slot | ✅ PASS |
| Completar idempotente | ✅ PASS |
| Fixture QA restaurado | ✅ PASS |
| Backoffice citas sigue OK | ✅ 200 |

## Garantías

- No DELETE físico.
- No `RESERVAS`.
- No pagos, checkout, caja/POS, ventas/cobros ni liquidaciones.
- No schema Airtable.
- No cambios auth/JWT/cookies.
- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.

---

# CIERRE — WHITE_LABEL_CANONICAL_DOMAIN_UX

**Fecha:** 2026-06-26
**Estado:** CERRADO QA + DEPLOY

## Alcance cerrado

- Dominio comercial canónico definido y aplicado: `https://bellezapro-demo.surge.sh`.
- Dominio técnico/canónico interno documentado: `https://sistema-multirrubro-demo.surge.sh`.
- Dominio `https://belleza-demo.surge.sh` mantenido como legacy/secundario, sin eliminarlo.
- Branding público reforzado desde `BrandConfigContext`:
  - role de dominio;
  - canonical por ruta;
  - meta description;
  - theme color;
  - fallback CSS variables antes de cargar `/api/marca-blanca`.
- Landing pública mejorada sin reescritura total:
  - loading/error/empty states;
  - cards navegables semánticas;
  - CTAs mobile full-width;
  - copy menos hardcodeado a peluquería fuera del seed/demo.
- Catálogo y productos:
  - buscador;
  - categorías dinámicas;
  - CTA de productos no transaccional, sin checkout/pagos/caja.
- Reserva pública:
  - stepper mobile más robusto;
  - inputs con labels, name, autocomplete/inputMode y focus visible;
  - CTA de disponibilidad sin loop a `/reserva`.
- Accesibilidad/UX:
  - skip link;
  - `prefers-reduced-motion`;
  - `transition-all` removido del alcance tocado;
  - botones/links semánticos en cards públicas.

## QA

| Prueba | Resultado |
|--------|-----------|
| `npm run build` | ✅ PASS |
| `git diff --check` | ✅ PASS |
| Mobile 360/390/430 local con Playwright | ✅ sin overflow horizontal |
| Rutas live BellezaPro `/`, `/catalogo`, `/productos`, `/reserva`, `/login` | ✅ PASS |
| Redirects legacy `/servicios`, `/reservar`, `/acceder`, `/admin` | ✅ PASS |
| Rutas protegidas sin auth `/portal`, `/profesional`, `/backoffice/citas` | ✅ redirigen a `/login` |
| `bellezapro-demo.surge.sh` | ✅ PASS |
| `sistema-multirrubro-demo.surge.sh` | ✅ PASS tras reintento por 504 transitorio inicial |
| `belleza-demo.surge.sh` | ✅ PASS |
| Backend `/health` | ✅ 200 |
| Backend `/api/citas` | ✅ 200 |
| Backend `/api/agenda-slots` | ✅ 200 |
| Railway auto-deploy commit `9ac34bc` | ✅ SUCCESS |

## Deploy

- Surge actualizado en:
  - `https://bellezapro-demo.surge.sh`
  - `https://sistema-multirrubro-demo.surge.sh`
  - `https://belleza-demo.surge.sh`
- Railway auto-deployó el commit `9ac34bc` por push a `main`; no hubo cambios backend y smoke posterior siguió OK.

## Garantías

- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se expusieron secretos.
- No se modificó schema Airtable.
- No DELETE físico.
- No `RESERVAS`.
- No pagos, checkout, caja/POS, ventas/cobros ni liquidaciones.
- No cambios auth/JWT/cookies.

---

# CIERRE — SURGE SINGLE COMMERCIAL DOMAIN

**Fecha:** 2026-06-26
**Estado:** CERRADO QA + DEPLOY

## Decisión

Por pedido explícito de Diego, se eliminaron de Surge los dominios no comerciales y queda como única web pública:

- `https://bellezapro-demo.surge.sh`

## Dominios eliminados de Surge

- `sistema-multirrubro-demo.surge.sh`
- `belleza-demo.surge.sh`

## Cambios de código/documentación

- `BrandConfigContext` conserva solo la variante comercial `bellezapro-demo.surge.sh`.
- `PublicFooter` ya no muestra links hacia dominios técnicos/legacy eliminados.
- `docs/WHITE_LABEL_CANONICAL_DOMAIN_UX.md` y `progress/tasks.json` actualizados con la decisión vigente.

## Garantías

- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se tocaron secretos.
- No se modificó schema Airtable.
- No pagos, checkout, caja/POS ni `RESERVAS`.

---

# CIERRE — LIVE PUBLIC UX COMMERCE P0

**Fecha:** 2026-06-26
**Estado:** CERRADO QA + DEPLOY

## Contexto

Se auditó en navegador `https://bellezapro-demo.surge.sh` por inconsistencias del flujo público:

- producto derivaba a reserva;
- sucursales no mostraba sedes;
- reserva no podía avanzar por falta de sucursales públicas;
- landing debía seguir usando configuración marca blanca;
- no debía mostrarse data ficticia como real.

## Cambios aplicados

- `AnnouncementBar` ahora valida índice/mensaje antes de renderizar y evita pantalla en blanco por crash.
- Detalle de producto ya no manda a `/reserva`; usa consulta por canal configurado y aclara que la venta online no está activada.
- `/sucursales` muestra empty state explícito si no hay sedes reales publicadas.
- `/reserva` muestra empty state claro cuando no existen sucursales públicas para reserva online.
- `docs/WHITE_LABEL_MULTIRRUBRO_GAP_AUDIT.md` actualizado con gaps de carrito, pago, upsell/cross-selling y configuración landing/e-commerce.

## QA

| Prueba | Resultado |
|--------|-----------|
| `npm run build` | ✅ PASS |
| `git diff --check` | ✅ PASS |
| Deploy Surge `bellezapro-demo.surge.sh` | ✅ PASS |
| Browser smoke `/` | ✅ contenido visible, sin page errors |
| Browser smoke `/productos` | ✅ productos reales visibles |
| Browser smoke producto detalle | ✅ producto visible, sin CTA transaccional a reserva |
| Browser smoke `/sucursales` | ✅ empty state claro |
| Browser smoke `/reserva` + selección de servicio | ✅ empty state claro de sucursal |
| Dominios eliminados | ✅ `sistema-multirrubro-demo` 404, `belleza-demo` 404 |

## Garantías

- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se expusieron secretos.
- No se modificó schema Airtable.
- No DELETE físico.
- No `RESERVAS`.
- No pagos, checkout, caja/POS, ventas/cobros ni liquidaciones.

---

# CIERRE — WHITE_LABEL_CONFIGURADOR_LANDING_P1

**Fecha:** 2026-06-27
**Estado:** CERRADO QA + DEPLOY

## Objetivo

Conectar la landing pública y el backoffice de configuración con las tablas existentes `MARCAS`, `CONFIGURACION_PUBLICA` y `LANDING_SECCIONES`, sin crear schema nuevo ni hardcodear peluquería como arquitectura.

## Cambios aplicados

- Nuevo endpoint público `GET /api/landing-secciones` con DTO seguro y `Cache-Control: no-store`.
- Nuevos endpoints protegidos de edición:
  - `PATCH /api/backoffice/configuracion-publica/{record_id}`
  - `PATCH /api/backoffice/landing-secciones/{record_id}`
- `CONFIGURACION_PUBLICA` pública deja de exponer campos no necesarios como notas internas.
- `Home.jsx` consume `LANDING_SECCIONES` para textos/visibilidad/CTAs de hero, servicios, productos, cómo funciona, contacto y CTA final.
- `/backoffice/configuracion` suma constructor de landing y editor rápido de configuración pública.
- `AnnouncementBar`, `BrandConfigContext`, `resolveBrandConfig` y Home usan fetch `no-store` para reflejar cambios de Airtable/backend sin cache visible.
- CORS default del backend queda alineado al único dominio comercial activo: `https://bellezapro-demo.surge.sh` + localhost.

## QA local

| Prueba | Resultado |
|--------|-----------|
| `python3 -m py_compile backend/routes/configuracion_publica.py backend/routes/landing_secciones.py backend/main.py` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `git diff --check` | ✅ PASS |
| Backend local `/health` | ✅ PASS 200 |
| Backend local `/api/landing-secciones` | ✅ PASS 15 registros, sin `NOTAS_INTERNAS` |
| Backend local `/api/configuracion-publica` | ✅ PASS 97 registros, sin `NOTAS_INTERNAS` |

## Garantías

- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se expusieron secretos.
- No se modificó schema Airtable.
- No DELETE físico.
- No `RESERVAS`.
- No pagos, checkout, carrito real, caja/POS, ventas/cobros ni liquidaciones.

---

# CIERRE — COMMERCE_MODEL_P2_DESIGN_ONLY

**Fecha:** 2026-06-29
**Estado:** CERRADO QA + DEPLOY

## Objetivo

Preparar el modelo de venta online marca blanca sin activar carrito real, checkout, pagos, caja/POS ni escrituras comerciales.

## Cambios aplicados

- Nuevo endpoint read-only `GET /api/commerce/public`.
- El endpoint lee de forma segura `PACKS`, `PROMOCIONES` y `CUPONES`.
- Devuelve flags explícitos en falso para carrito, checkout, pagos online y POS físico.
- `ProductoDetalle.jsx` muestra packs/promos/cupones como upsell/cross-selling read-only.
- `Productos.jsx` y `ProductoDetalle.jsx` usan fetch `no-store` para reflejar cambios backend/Airtable.
- Documentado contrato en `docs/commerce/COMMERCE_MODEL_P2_DESIGN.md`.

## QA local

| Prueba | Resultado |
|--------|-----------|
| `python3 -m py_compile backend/routes/commerce_public.py backend/main.py` | ✅ PASS |
| `git diff --check` | ✅ PASS |
| `npm run build` | ✅ PASS |
| Backend local `/api/commerce/public` | ✅ PASS |
| Flags mutantes desactivados | ✅ `cart/checkout/payments/pos=false` |
| Operaciones bloqueadas declaradas | ✅ `PAYMENT`, `CREATE_VENTA` |


## Deploy

- Commit implementación: `06d8ade feat(commerce): add read-only public bootstrap`.
- Push `origin/main`: ✅ PASS.
- Railway `earnest-comfort`: ✅ Online.
- Surge producción: ✅ `https://bellezapro-demo.surge.sh`.
- Smoke live: `/health`, `/api/commerce/public`, `/api/productos-web`, `/`, `/productos`, producto detalle y `/login` ✅ PASS.
- Nota: un fetch de `/` devolvió 504 transitorio de Surge justo post-deploy; reintento inmediato PASS 200.

## Garantías

- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se expusieron secretos.
- No se modificó schema Airtable.
- No se escribieron `CARRITOS`, `CARRITO_ITEMS`, `VENTAS`, `ITEMS_VENTA` ni `PAGOS_COBROS`.
- No pagos reales, checkout, caja/POS ni pasarela.
