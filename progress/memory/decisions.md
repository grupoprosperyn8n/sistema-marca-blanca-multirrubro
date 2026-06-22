# 🧠 Decisiones del proyecto — Gestión de Salones de Belleza

> Se actualiza después de cada sesión o decisión relevante.

## 2026-06-03 — P0.1: Correcciones quirúrgicas ejecutadas

**Decisión:** Aplicar FIX-1 a FIX-8 detectados en Auditoría Quirúrgica Etapa 1.
**Contexto:** El token Airtable (PAT `patPQG...`) permite crear campos pero NO eliminarlos (falta scope `schema.bases:delete`). Los 5 campos duplicados se renombraron a `DEPRECATED_` en vez de eliminarlos. Eliminación definitiva requiere hacerla manualmente en la UI de Airtable.
**Estado:** Activa

---

## 2026-06-03 — API Airtable Meta no soporta crear rollups ni lookups

**Decisión:** Los campos rollup (`Stock Actual`) y lookup (`lookups en Agenda desde Citas`) deben crearse manualmente en la UI de Airtable. La API Meta solo permite crear `singleLineText`, `number`, `date`, `linkedRecord`, `formula`, y pocos tipos más.
**Estado:** Activa

---

## 2026-06-03 — Fuente de verdad de stock

**Decisión:** Inventario es la fuente de verdad del stock actual. Productos.Nivel de Stock es informativo (lo que puso el usuario manualmente). El cálculo real debe venir de Inventario → Movimientos con `Cantidad Firmada` (fórmula con signo: +Entrada, −Salida, −Merma). Pendiente crear rollup `Stock Actual` en Inventario.
**Estado:** Activa

---

## 2026-06-03 — Agenda ↔ Citas: modelo corregido

**Decisión:** Agenda representa slots de disponibilidad. Citas representa reservas reales (cliente, servicio, profesional). La relación es: Cita → linked a Agenda (un slot). Los lookups (Cliente, Servicio, Estado) deben venir de la Cita vinculada, no duplicarse manualmente en Agenda. Pendiente crear lookups en UI Airtable.
**Estado:** Activa

---

## 2026-06-21 — MICROFIX: registroActivo usa fallback seguro

**Decisión:** `registroActivo` en `BrandConfigContext.jsx` ahora evalúa `data.registro_activo !== undefined && data.registro_activo !== null` antes de aplicar `normalizeBool`. Si el valor no viene de Airtable, usa `base.registroActivo` (del fallback, `true` en modo demo).
**Contexto:** La línea original `normalizeBool(data.registro_activo)` devolvía `false` cuando `data.registro_activo` era `undefined` o `null`, rompiendo el registro en modo demo.
**Estado:** Activa

---

## 2026-06-21 — MICROFIX: googleMaps mapeado desde textos.redes_maps

**Decisión:** Agregar `googleMaps: normalizeText(textos.redes_maps) || base.googleMaps` al `transformMarcaBlanca()` en `BrandConfigContext.jsx`. El backend ya expone `textos_publicos.redes_maps` desde la tabla MARCAS. Fallback a `""` (cadena vacía segura).
**Contexto:** El campo `googleMaps` estaba documentado como huérfano en la auditoría. Ahora queda disponible en el contexto para que `SucursalesPublicas.jsx` u otras páginas lo consuman.
**Estado:** Activa

---

## 2026-06-21 — CONFIGURACION_PUBLICA no se toca ni se depreca

**Decisión:** Reafirmado durante MICROFIX_FRONTEND_BRANDCONFIG_SAFE: el endpoint `/api/configuracion-publica` y la tabla CONFIGURACION_PUBLICA **no se eliminan ni se deprecan**. Quedan como fuente secundaria key-value para flags, overrides y compatibilidad histórica.
**Contexto:** La auditoría de consistencia MARCAS/CONFIGURACION_PUBLICA/LANDING_SECCIONES confirmó que MARCAS es la fuente principal de identidad de marca, pero CONFIGURACION_PUBLICA tiene valor como almacén key-value secundario.
**Estado:** Activa

---

## Convenciones
- Formato: `YYYY-MM-DD | Decisión | Quién | Estado`
- Estados: Activa / Reemplazada / Obsoleta / En revisión

---

## 2026-06-02 — Arranque del proyecto

**Decisión:** Backend exclusivamente Airtable. Sin Supabase.
**Contexto:** Diego instruyó: "SOLO AIRTABLE, NO SUPABASE". El PDF de BD (15 tablas, 223 campos) está diseñado para Airtable.
**Estado:** Activa

---

## 2026-06-02 — Sistema completo (15 tablas), no MVP subset

**Decisión:** Implementar las 15 tablas completas del schema Airtable, no un subconjunto MVP.
**Contexto:** Originalmente se planteó Q-001 (MVP de 5 tablas vs sistema completo). Se optó por sistema completo porque el schema ya estaba diseñado para 15 tablas.
**Estado:** Activa
**Resuelve:** Q-001

---

## 2026-06-02 — Frontend web HTML/CSS/JS vanilla

**Decisión:** Frontend web con HTML, CSS y JavaScript vanilla (sin framework). Conectado a Airtable vía API REST.
**Contexto:** Originalmente se planteó Q-002 (frontend web vs vistas nativas de Airtable). Se optó por frontend web independiente para mejor UX personalizada.
**Estado:** Activa
**Resuelve:** Q-002

---

## 2026-06-02 — Roles 8 agentes para Fase Maestra

**Decisión:** Asignar 8 roles de agente para la Fase Maestra: UI/UX Designer, Backend Data Architect, Security Controller, Docs/Progress Manager, QA/Verification, Deploy Manager, Frontend Developer.
**Contexto:** El equipo multidisciplinario permite cubrir todas las áreas del proyecto simultáneamente.
**Estado:** Activa

---

## 2026-06-02 — Surge.sh como plataforma de deploy

**Decisión:** Desplegar el frontend en Surge.sh con dominio: gestion-desalones-de-belleza.surge.sh.
**Contexto:** Deploy estático simple, sin backend server. Compatible con el stack Airtable-only. Se usó deploy.sh con opciones --preview y --custom.
**Estado:** Activa
**Nota:** Surge tiene un falso negativo conocido: muestra "Error - Deployment did not succeed" pero el deploy real funciona. Verificado con curl 200.

---

## 2026-06-02 — Token Airtable inyectado vía variable global

**Decisión:** El PAT (Personal Access Token) de Airtable se inyecta en el frontend mediante la variable global `__AIRTABLE_TOKEN__`, no hardcodeado en el código fuente.
**Contexto:** Originalmente el token estaba expuesto en api.js. SALON-011 lo movió a una variable global inyectada por el build/deploy step.
**Estado:** Activa
**Riesgo:** En el deploy actual a Surge, el token sigue estando visible en el HTML compilado (frontend estático). Para producción real, se necesita un proxy backend (Cloudflare Workers, etc.).

---

## 2026-06-02 — Cache con localStorage + 5-min TTL

**Decisión:** Implementar cache en localStorage con TTL de 5 minutos para reducir llamadas a la API de Airtable.
**Contexto:** SALON-010b — El plan gratuito de Airtable tiene límite de 5 req/s. El cache reduce la presión sobre el rate limit y mejora la UX.
**Estado:** Activa
**Implementación:** api.js módulo cache con prefijo `airtable_cache_`, invalidación por tabla, TTL configurable.

---

## 2026-06-02 — 8 vistas principales implementadas, 8 pendientes

**Decisión:** Implementar primero las 8 vistas core (Dashboard, Clientes, Citas, Servicios, Empleados, Caja, Productos, Reportes). Las otras 8 (Proveedores, Promociones, Agenda, Capacitaciones, Inventario, FichaServicios, CostosFijos, ResumenCostos, IngresosEgresos) quedan pendientes.
**Contexto:** Priorización por uso operativo. Las vistas implementadas cubren las operaciones diarias del salón.
**Estado:** Activa
**Próximo paso:** Las render functions existen en api.js pero no tienen página dedicada en index.html.

---

## 2026-06-02 — Linked records sin resolver (IDs crudos)

**Decisión:** Aceptar temporalmente que los linked records se muestren como IDs crudos (`recXXXXXXX`) en el frontend.
**Contexto:** CRIT-1 — Resolver linked records requiere fetch adicional por cada relación o expand en la query. No se implementó por limitaciones de rate limit.
**Estado:** Activa, con riesgo
**Plan:** Resolver en iteración futura cuando se implemente server-side expand o backend proxy.

---

## 2026-06-02 — Fórmula AVERAGE en TOTAL NETO documentada, no corregida

**Decisión:** Documentar que la fórmula `TOTAL NETO` usa `AVERAGE()` en lugar de resta directa, pero no modificar la fórmula en Airtable (limitaciones del Meta API free plan).
**Contexto:** LOW-1 — El PDF original usa `AVERAGE({Total Ingresos Gral} - {Total Egresos Gral})`. Matemáticamente es un no-op para un solo valor, pero es incorrecto conceptualmente.
**Estado:** Activa

---

## 2026-06-02 — Type discrepancies documentadas

**Decisión:** Aceptar las discrepancias de tipo entre el schema diseñado y el real (Email/Teléfono como singleLineText, campos faltantes que se crearon inline). No se corrigen porque el Meta API no permite modificar tipos de campo existentes en plan gratuito.
**Contexto:** MED-1 — Durante la creación de la base, algunos campos se crearon con tipos por defecto.
**Estado:** Activa, no requiere acción

---
> Las decisiones viejas no se borran, se marcan como [OBSOLETA].

## 2026-06-21 — DEPLOY_FRONTEND_SURGE_MICROFIX_BRANDCONFIG

**Decisión:** Aprobar y ejecutar deploy del microfix a Surge tras corregir 200.html.

**Contexto:** El dry-run pre-deploy había detectado un único blocker: dist/200.html referenciaba /src/main.jsx (dev) en lugar de los assets hasheados de producción. Surge usa 200.html como SPA fallback para subruteo — si un usuario refresca en /productos, Surge sirve 200.html y si este referencia /src/main.jsx, la página queda en blanco.

**Acción tomada:** `cp dist/index.html dist/200.html` → diff confirma que son idénticos. Deploy a Surge exitoso (bellezapro-demo.surge.sh). 5 rutas validadas con HTTP 200.

**Resultado:** Frontend desplegado con microfix de BrandConfig. Todas las subrutas sirven HTML de producción. 0 secretos en bundle.

**Registro:** tasks.json actualizado con nueva fase completada. session-summary.md actualizado.


---
## 2026-06-21 — CIERRE_FASE_2A: Auth real publicada

**Decisión:** FASE_2A cerrada formalmente. Auth real JWT/bcrypt/cookie HttpOnly cross-site desplegada en producción (Railway + Surge).
**Contexto:** POST /api/auth/login → 200 + Set-Cookie HttpOnly/Secure/SameSite=None. GET /api/auth/me → 200 con datos de usuario desde Airtable. POST /api/auth/logout → 200 + clear cookie.
**Estado:** Activa

---
## 2026-06-21 — Cookie cross-site requiere SameSite=None + Secure

**Decisión:** Para que las cookies HttpOnly funcionen cross-site (Surge → Railway), se requiere SameSite=None y Secure=True. SameSite=lax (correcto para dev local) bloquea cookies en producción cross-site.
**Contexto:** Validado en producción. Cookie configurada vía variables de entorno Railway: AUTH_COOKIE_SAMESITE=none, AUTH_COOKIE_SECURE=true.
**Estado:** Activa

---
## 2026-06-21 — JWT nunca va en localStorage

**Decisión:** El JWT se almacena exclusivamente en cookie HttpOnly, nunca en localStorage ni sessionStorage. AuthContext usa fetch con credentials:'include' para enviar la cookie automáticamente.
**Contexto:** Implementado en AuthContext.jsx. /api/auth/me devuelve datos de sesión sin exponer el token.
**Estado:** Activa

---
## 2026-06-21 — ProtectedRoute debe esperar loading

**Decisión:** ProtectedRoute (y AuthGuard) deben esperar a que el estado loading sea false antes de decidir redirección. Si loading=true, mostrar spinner/placeholder — no redirigir a /login.
**Contexto:** Race condition detectada en refresh de página: /me aún no respondía y el guard redirigía a /login aunque la cookie era válida.
**Estado:** Activa
**Registro:** progress/memory/protectedroute-loading-guard.md

---
## 2026-06-21 — Backend Railway debe tener JWT_SECRET configurado

**Decisión:** JWT_SECRET se configura vía variable de entorno en Railway (`railway variables set JWT_SECRET=...`). Sin esta variable, JWT no se puede firmar/verificar y auth falla con 500.
**Contexto:** Configurado exitosamente en Railway. Mismo valor que .env local (48 chars).
**Estado:** Activa

---
## 2026-06-21 — No inventar tabla RESERVAS; usar CITAS / AGENDA_SLOTS

**Decisión:** El modelo actual tiene tabla CITAS (reservas reales) y AGENDA_SLOTS (disponibilidad). CITAS → linked a AGENDA_SLOTS. No se debe crear una nueva tabla RESERVAS salvo decisión explícita del director.
**Contexto:** Reafirmado durante cierre FASE_2A. La arquitectura actual cubre el flujo de reservas con CITAS + AGENDA_SLOTS.
**Estado:** Activa
