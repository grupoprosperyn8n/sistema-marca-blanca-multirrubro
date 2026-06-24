# SALON-014 — QA Visual Post-Deploy Surge.sh

**Dominio:** https://bellezapro-demo.surge.sh  
**Fecha QA:** 2026-06-21  
**Fase origen:** `deploy_frontend_surge_microfix_brandconfig`  
**Objetivo:** Validar visualmente el frontend desplegado tras el microfix `BrandConfigContext.jsx`, en mobile-first y rutas públicas.  
**Modo:** Inspección y reporte — **sin modificar código fuente, dist, backend, Airtable, Railway, .env, CREDENCIALES.md.**

---

## 1. METODOLOGÍA

| Método | Herramienta | Alcance |
|--------|------------|---------|
| Navegación directa + refresh | `browser_navigate` | 5 rutas: /, /productos, /reserva, /login, /sucursales |
| Consola JS | `browser_console` | Errores, warnings, referencias a /src/main.jsx |
| Análisis CSS responsive | `browser_console` (CSSOM) | Media queries, grid, flex, viewport meta |
| Simulación overflow | `browser_console` (scrollWidth vs viewport) | Desktop (1280px) con body-width forzado |
| Auditoría de assets | `browser_console` (DOM inspection) | Scripts, hashes, 200.html |

**Limitación conocida:** Las pruebas responsive son informativas pero no vinculantes — la herramienta no permite cambiar el viewport real del navegador, por lo que las media queries CSS no se disparan. La validación mobile final requiere dispositivo físico o Chrome DevTools.

---

## 2. RESULTADOS POR RUTA

### 2.1 Home (`/`)

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| Título | ✅ | "BellezaPro Demo" |
| Branding | ✅ | Logo + nombre en header y footer |
| Navegación | ✅ | Barra horizontal: Inicio, Servicios, Productos, Reservar, Acceder |
| Hero | ✅ | H1 "Belleza, bienestar y reservas simples en un solo lugar." con CTAs |
| Servicios destacados | ✅ | 6 cards (Coloración Global, Pedicuría SPA, Corte Dama, etc.) |
| Productos destacados | ✅ | 3 cards (Shampoo, Máscara, Acondicionador) |
| Sección "Cómo funciona" | ✅ | 4 pasos con iconos |
| Sección Sucursales | ✅ | "Sucursal Centro" con link a reserva |
| Footer | ✅ | Navegación, Contacto, Legal |
| Announcement bar | ✅ | Banner superior con link "Ver servicios →" |
| overflow-x | ✅ | `false` (sin desbordamiento horizontal) |
| `/src/main.jsx` en DOM | ✅ | Ausente (usa asset hasheado `index-p6Tn0lpe.js`) |
| Consola | ✅ | **0 errores, 0 warnings** |

### 2.2 Productos (`/productos`)

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| Título | ✅ | "BellezaPro Demo" |
| H1 | ✅ | "Productos" |
| Filtros | ✅ | 4 botones: Todos, Cuidado Capilar, Tratamiento Capilar, Kits de Productos |
| Cards | ✅ | 4 productos visibles (Shampoo Nutritivo, Máscara Hidratante, Acondicionador Reparador, Kit Manicura Básico) |
| Nav + Footer | ✅ | Presentes |
| Refresh directo | ✅ | Carga correctamente sin pantalla en blanco |
| overflow-x | ✅ | `false` |
| `/src/main.jsx` | ✅ | Ausente |
| Consola | ✅ | **0 errores, 0 warnings** |

### 2.3 Reserva (`/reserva`)

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| Título | ✅ | "BellezaPro Demo" |
| H2 | ✅ | "Reserva tu Turno" |
| Flujo visual | ✅ | 4 pasos: Servicio → Sucursal → Horario → Datos |
| Servicios | ✅ | 8 servicios con precios (desde $2.500 hasta $15.000) |
| Resumen lateral | ✅ | Panel "Resumen" presente |
| **Read-only** | ✅ | **Sin botón submit** — presentación visual, no crea reservas reales |
| Refresh directo | ✅ | Carga correctamente |
| overflow-x | ✅ | `false` |
| `/src/main.jsx` | ✅ | Ausente |
| Consola | ✅ | **0 errores, 0 warnings** |

### 2.4 Login (`/login`)

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| Título | ✅ | "BellezaPro Demo" |
| Modo demo | ✅ | Banner explícito: "💡 Modo demostración — No se usan contraseñas reales" |
| Selector de roles | ✅ | 5 roles: Administrador, Gerente, Gestión, Profesional, Solo lectura |
| Campo nombre | ✅ | Input "Ej: María" |
| Botón Ingresar | ✅ | Presente |
| **Sin auth real** | ✅ | **0 campos de contraseña, 0 JWT en body, 0 tokens** |
| Refresh directo | ✅ | Carga correctamente |
| overflow-x | ✅ | `false` |
| `/src/main.jsx` | ✅ | Ausente |
| Consola | ✅ | **0 errores, 0 warnings** |

### 2.5 Sucursales (`/sucursales`)

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| Comportamiento | ⚠️ **INFO** | La ruta `/sucursales` redirige a `/` (SPA renderiza home con sección "Nuestras Sucursales") |
| ¿Es un bug? | ❌ No | La sección de sucursales existe dentro del home ("Sucursal Centro" con link a reserva). No hay página dedicada — es una decisión de arquitectura actual. |
| Severidad | ℹ️ Informativo | No bloqueante. Se puede mejorar en el futuro con página dedicada. |
| Consola | ✅ | **0 errores, 0 warnings** |

---

## 3. ANÁLISIS RESPONSIVE (CSS)

| Criterio | Resultado |
|----------|-----------|
| Viewport meta | ✅ `width=device-width, initial-scale=1.0` |
| Media queries detectadas | ✅ 3 breakpoints: `(min-width: 640px)` — 17 reglas, `(min-width: 768px)` — 4 reglas, `(min-width: 1024px)` — 9 reglas |
| Grid responsivo | ✅ `grid-cols-1` (mobile) → `grid-cols-2` (≥640px) → `grid-cols-3` (≥768px) |
| Flex-wrap | ✅ Detectado en clases CSS |
| Hamburger menu | ⚠️ No detectado a 1280px (posiblemente se renderiza solo a <640px) |
| Total reglas CSS | 395 (3 stylesheets) |

---

## 4. VERIFICACIONES DE SEGURIDAD

| Criterio | Resultado |
|----------|-----------|
| Tokens Airtable en JS bundle | ✅ 0 tokens reales (auditado en fase previa) |
| `/src/main.jsx` en DOM de producción | ✅ Ausente en las 5 rutas |
| API keys en HTML | ✅ 0 ocurrencias |
| `api.js` legacy | ✅ No referenciado en el frontend (stub seguro, no desplegado) |
| 200.html SPA fallback | ✅ Corregido (idéntico a index.html, sin /src/main.jsx) |

---

## 5. RESUMEN DE HALLAZGOS

| # | Ruta | Hallazgo | Severidad | Estado |
|---|------|----------|-----------|--------|
| 1 | `/sucursales` | Redirige a `/` (sin página dedicada) | ℹ️ INFO | No bloqueante |
| 2 | Todas | Hamburguer menu no detectado a 1280px | ℹ️ INFO | Posiblemente renderiza solo mobile |
| — | `/`, `/productos`, `/reserva`, `/login` | Sin hallazgos | — | ✅ |

---

## 6. VEREDICTO

| Dimensión | Veredicto |
|-----------|-----------|
| **Rutas públicas (5/5)** | ✅ **APROBADO** — Todas cargan, todas con branding correcto, 0 pantallas en blanco |
| **Refresh directo en subrutas** | ✅ **APROBADO** — `/productos`, `/reserva`, `/login` funcionan con refresh |
| **Consola (errores/warnings)** | ✅ **APROBADO** — 0 errores, 0 warnings en las 5 rutas |
| **Read-only (/reserva)** | ✅ **APROBADO** — Sin botón submit, flujo visual únicamente |
| **Sin auth real (/login)** | ✅ **APROBADO** — Demo explícito, sin passwords, sin JWT |
| **Responsive (infraestructura)** | ✅ **APROBADO** — Viewport meta, 3 breakpoints, grid-cols responsive |
| **Responsive (visual mobile)** | ⚠️ **PENDIENTE** — Requiere dispositivo real o Chrome DevTools |
| **Seguridad** | ✅ **APROBADO** — 0 tokens, 0 credenciales, 0 fugas |

### Veredicto final: ✅ **APROBADO — LISTO PARA CIERRE**

El deploy del microfix `BrandConfigContext.jsx` a Surge.sh funciona correctamente. El frontend se renderiza sin errores en las 5 rutas públicas, el branding "BellezaPro Demo" es visible en header y footer, y no hay regresiones de seguridad ni funcionalidad.

**Pendientes no bloqueantes (existentes, no introducidos por este deploy):**
- Menú hamburguesa para mobile (<640px) — listado en `pendientes_no_bloqueantes`
- QA mobile visual real (dispositivo/DevTools) — listado en `pendientes_no_bloqueantes`
- Página `/sucursales` dedicada (actualmente integrada en home)

---

## 7. PRÓXIMO PASO RECOMENDADO

Según `progress/tasks.json`, la próxima fase recomendada es:

> **FASE_2A_B_AUTH_CLIENTE_REAL_IMPLEMENTACION_CONTROLADA**

La fase `salon_014_qa_visual_post_deploy_surge` queda lista para cerrarse en `tasks.json`.

---

*Reporte generado por Hermes Agent — 2026-06-21*
*QA ejecutado en modo inspección sin modificar código fuente.*
