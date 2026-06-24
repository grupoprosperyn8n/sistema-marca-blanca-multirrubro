# QA UX Comercial — FASE 1J
## BellezaPro Demo — Cierre Visual Read-Only

**Fecha**: 2026-06-20
**Veredicto**: ✅ QA_CIERRE_FASE_1J_COMPLETO: **SI**
**Dominio**: https://bellezapro-demo.surge.sh
**Build**: `index-PYkBxRPA.js`

---

## 1. ¿Qué se implementó?

| Componente | Ruta | Estado |
|---|---|---|
| Banner rotativo | Todo el sitio | ✅ `AnnouncementBar.jsx` — 3 promos demo rotativos |
| Detalle servicios | `/servicios/:slug` | ✅ `ServicioDetalle.jsx` — precio, duración, categoría, CTA |
| Detalle productos | `/productos/:slug` | ✅ `ProductoDetalle.jsx` — descripción, CTA consultar |
| Carrusel imágenes | Detalle producto | ✅ `ImageCarousel.jsx` — genérico con navegación |
| Sucursales públicas | Home | ✅ `SucursalesPublicas.jsx` — solo sucursales reales |
| Agenda con slots | `/reserva` | ✅ Fetch real `/api/agenda-slots`, estado vacío elegante |
| Login/Registro visual | `/login` | ✅ Tabs "Ya soy cliente" / "Soy cliente nuevo" |

## 2. ¿Qué está solo visual/read-only?

- 🚫 **Sin escritura**: 0 PATCH, 0 POST, 0 DELETE
- 🚫 **Sin auth real**: bcrypt, JWT, contraseñas — no implementados
- 🚫 **Sin pagos**: MercadoPago, Stripe — no implementados
- 🚫 **Sin carrito real**: checkout, carrito — no implementados
- 🚫 **Sin reservas reales**: confirmación deriva a `/login`, no crea citas
- 🚫 **Sin cambios de schema Airtable**

## 3. Rutas verificadas

| Ruta | HTTP | Contenido |
|---|---|---|
| `/` | 200 | Hero + servicios + productos + sucursales |
| `/catalogo` | 200 | 8 servicios con filtros x categoría |
| `/servicios/{slug}` | 200 | Detalle con precio, duración, anticipo, CTA |
| `/productos` | 200 | 4 productos con filtros |
| `/productos/{slug}` | 200 | Detalle con descripción, consultar disponibilidad |
| `/reserva` | 200 | Wizard 4 pasos (servicio → sucursal → horario → datos) |
| `/login` | 200 | Login roles demo + registro visual |
| `/backoffice` | 200 | Dashboard protegido (no es foco de esta fase) |
| `/profesional` | 200 | Vista profesional (no es foco de esta fase) |

## 4. Screenshots

Ver `docs/qa/fase-1j/screenshots/`:

| # | Archivo | Tamaño |
|---|---|---|
| 01 | `01-home-banner.png` | 790 KB |
| 02 | `02-servicios-lista.png` | 160 KB |
| 03 | `03-servicio-detalle.png` | 105 KB |
| 04 | `04-productos-lista.png` | 527 KB |
| 05 | `05-producto-detalle.png` | 278 KB |
| 06 | `06-sucursales-publicas.png` | 796 KB |
| 07 | `07-reserva-horarios.png` | 112 KB |
| 08 | `08-login-cliente.png` | 65 KB |
| 09 | `09-registro-cliente-visual.png` | 53 KB |

## 5. Funciones visuales verificadas

| Función | Estado | Detalle |
|---|---|---|
| Banner | ✅ | 3 mensajes rotativos, CTA "Ver servicios →" |
| Ofertas | ✅ | Banner visible en todas las páginas |
| Sucursales | ✅ | Solo "Sucursal Centro" (real), CTA por sucursal |
| Detalle servicios | ✅ | Precio, duración, anticipo, CTA "Reservar" |
| Detalle productos | ✅ | Descripción, "Consultar disponibilidad" |
| Carrusel/galería | ✅ | Componente creado (sin imágenes aún) |
| Agenda/horarios | ✅ | Fetch real, estado vacío elegante |
| Login/Registro visual | ✅ | Tabs claros, registro sin password |

---

## 6. MICROFIX_1J — Correcciones post-QA

**Fecha**: 2026-06-20 | **Build**: `index-PYkBxRPA.js` | **Deploy**: `bellezapro-demo.surge.sh`

### 6.1 Correcciones aplicadas

| # | Problema | Causa raíz | Fix | Archivo |
|---|----------|-----------|-----|---------|
| 1 | Click en card de producto no navegaba | Slug regex con `\\s+` (doble escape) → esbuild duplicaba backslashes → slug sin guiones (ej: `shampoonutritivo`) que no matcheaba con `ProductoDetalle.jsx` (`\s+`) | `.replace()` → `.split(/\s+/).join("-")` — evita duplicación de esbuild | `Productos.jsx` L30 |
| 2 | Detalle producto incompleto | Consecuencia del bug #1: slug incorrecto → no encontraba producto | Mismo fix que #1 | — |
| 3 | Slots sin sucursal no visibles | `data.slots` vs `data.agenda_slots` + slots sin sucursal se descartaban | Corregido `agenda_slots` + slots sin sucursal ahora se muestran como "Horarios disponibles — sucursal por confirmar" con disclaimer | `Reserva.jsx` |

### 6.2 Workaround técnico

**Problema**: esbuild (bundler de Vite) duplica backslashes en expresiones dentro de `.replace()` → `.replace(/\s+/g, "-")` se convierte en `.replace(/\\s+/g, "-")` en el bundle.

**Solución**: Usar `.split(/\s+/).join("-")` que preserva correctamente `\s+` en el bundle porque esbuild no duplica backslashes en `split()`.

### 6.3 Validación post-microfix

| Ruta | Estado | Contenido verificado |
|------|--------|---------------------|
| `/` | ✅ 200 | Hero + servicios + sucursales |
| `/catalogo` | ✅ 200 | 8 servicios con filtros |
| `/servicios/coloracion-global` | ✅ 200 | Nombre, categoría, $8.000, reserva online, anticipo, CTA |
| `/productos` | ✅ 200 | 4 productos: SHAMPOO ($135), MASCARA ($12.000), ACONDICIONADOR ($70), KIT MANICURA |
| `/productos/shampoo-nutritivo` | ✅ 200 | Nombre, categoría, $135, descripción, CTA "Consultar disponibilidad" |
| `/reserva` | ✅ 200 | Stepper 4 pasos, 8 servicios con precios, resumen lateral |
| `/login` | ✅ 200 | 5 roles demo + input nombre + tabs cliente nuevo/existente |

### 6.4 Problemas remanentes (no bloqueantes, para FASE 2)

1. **Slots sin sucursal**: Hay 5 slots DISPONIBLE sin sucursal asignada. Ahora se muestran como "Horarios disponibles — sucursal por confirmar" (mejora UX vs estado vacío). Para FASE 2: asignar sucursal real.
2. **Imágenes de producto**: Sin fotos reales aún — se muestra placeholder genérico.

---

## 7. Pendientes

### FASE 2
- [ ] FASE_2A: Auth cliente real (bcrypt + JWT + tabla CLIENTES)
- [ ] FASE_2B: Reserva real con escritura controlada
- [ ] FASE_2C: Carrito + pagos backend (MercadoPago)

## 8. Seguridad

| Check | Estado |
|---|---|
| 0 PATCH | ✅ |
| 0 POST | ✅ |
| 0 DELETE | ✅ |
| 0 cambios de schema | ✅ |
| 0 tokens en build | ✅ |
| 0 Airtable directo frontend | ✅ |
| 0 pagos | ✅ |
| 0 checkout | ✅ |
| 0 auth real | ✅ |
| 0 contraseñas guardadas | ✅ |
| `static/api.js` stub seguro | ✅ |
| `CREDENCIALES.md` intacto | ✅ |
| `harness/` intacto (41 archivos) | ✅ |

## 9. Veredicto

**QA_CIERRE_FASE_1J_COMPLETO: SI** ✅

El portal cumple con todos los requisitos visuales y de seguridad. El MICROFIX_1J corrigió los 3 problemas detectados en QA (navegación desde cards, detalle de producto incompleto, slots sin sucursal). Los 2 problemas remanentes (slots sin sucursal asignada, imágenes placeholder) son no bloqueantes y corresponden a FASE 2.

**Archivos modificados en microfix**:
- `frontend/src/pages/Productos.jsx` — slug con `.split().join()` (workaround esbuild)
- `frontend/src/pages/Reserva.jsx` — `data.agenda_slots` + display slots sin sucursal

**Sin modificar**: `harness/`, `static/api.js`, `CREDENCIALES.md`, fábrica madre.

### Próximo paso recomendado

**FASE_2A_AUTH_CLIENTE_REAL** — implementar autenticación real con:
- Tabla `CLIENTES` en Supabase
- bcrypt + JWT
- Endpoints `/api/auth/registro`, `/api/auth/login`
- Proteger rutas con middleware

*No avanzar sin aprobación de Diego.*

---

Generado por QA automatizado Hermes Agent. Revisar visualmente en https://bellezapro-demo.surge.sh
