# FASE 1H — Rediseño Stitch con Tema Dinámico desde Backend

> **Para Hermes:** Usar subagent-driven-development — 3 subagentes en paralelo donde sea posible.

**Goal:** Rediseñar el frontend completo con estética Stitch (glassmorphism, tipografía Manrope/JetBrains, paleta Glacier) consumiendo tema dinámico desde backend Railway real.

**Tech Stack:** React 18 + React Router 6 + Tailwind CSS + Vite. Backend Railway con Airtable. Frontend Surge.

---

## Diagnóstico actual

| Componente | Estado | Problema |
|-----------|--------|---------|
| `theme/resolveBrandConfig.js` | ✅ Existe | No usa `VITE_API_BASE_URL` — hace fetch a `"/api/..."` (relativo) |
| `theme/brandTheme.js` | ✅ Existe | Fallbacks correctos (Stitch Glacier) |
| `theme/applyCssVariables.js` | ✅ Existe | Bien implementado |
| `main.jsx` | ❌ No integra tema | No llama a `resolveBrandConfig` ni `applyCssVariables` |
| `index.css` | ❌ Terra colors | `bg-[#fdf8f6] text-terra-950` — incompatible con Stitch |
| `App.jsx` | ❌ Single layout | Un solo `<Navbar />` para todo — sin separación de portales |
| `Navbar.jsx` | ❌ Terra + hardcoded | `bg-terra-800`, `text-cobre`, título "🏷️ Sistema" |
| `Home.jsx` | ❌ Landing técnica | "Sistema Marca Blanca Multirrubro", card Backoffice, colores terra |
| 18 páginas/componentes | ❌ Todo terra/cobre | Ningún componente usa CSS variables del tema |

---

## Plan de ejecución (9 cortes, 27 tareas)

### CORTE 1 — Tema dinámico desde backend (3 tareas)

#### T1.1: Conectar resolveBrandConfig a backend real
- **Archivo:** `frontend/src/theme/resolveBrandConfig.js`
- **Cambio:** Reemplazar `fetch("/api/..."` por `fetch(\`${VITE_API_BASE_URL}/api/...\`)` 
- **Verificación:** `curl` desde build confirme que llega a Railway

#### T1.2: Integrar tema en main.jsx
- **Archivo:** `frontend/src/main.jsx`
- **Cambio:** Llamar `resolveBrandConfig()` y `applyCssVariables(theme)` antes de ReactDOM.render
- **Verificación:** `console.log` en browser muestre variables CSS aplicadas

#### T1.3: Actualizar index.css a Stitch base
- **Archivo:** `frontend/src/index.css`
- **Cambio:** Fondo claro Stitch, tipografía Manrope, glass utilities, eliminar terra
- **Verificación:** Build no tenga referencias a `terra`

---

### CORTE 2 — Matriz backend ↔ Stitch (1 tarea)

#### T2.1: Crear STITCH_BACKEND_THEME_MATRIX.md
- **Archivo:** `docs/STITCH_BACKEND_THEME_MATRIX.md`
- **Contenido:** Tabla completa mapeando token Stitch → clave backend → fallback → uso → contraste
- **Verificación:** Documento existe y cubre 18+ claves

---

### CORTE 3 — Design System React (4 tareas)

#### T3.1: GlassCard.jsx
- **Archivo:** `frontend/src/components/ui/GlassCard.jsx`
- **Estética:** `backdrop-blur-[var(--glass-blur)]`, `bg-[var(--glass-surface)]`, border `var(--glass-border-color)`, rounded-xl, shadow-sm
- **Verificación:** Renderiza en Storybook-like test page

#### T3.2: GlassPanel.jsx + PrimaryButton.jsx + SecondaryButton.jsx
- **Archivos:** 3 componentes UI
- **GlassPanel:** Contenedor grande glass para modales/paneles
- **PrimaryButton:** `bg-[var(--brand-primary)]` con gradiente, hover saturación
- **SecondaryButton:** Outline glass con `border-[var(--glass-border-color)]`
- **Verificación:** Todos renderizan con CSS variables

#### T3.3: Badge.jsx + SectionHeader.jsx + ServiceCard.jsx
- **Archivos:** 3 componentes UI
- **Badge:** Pill shape, variantes (success/warning/error/info)
- **SectionHeader:** Heading Manrope con subrayado sutil
- **ServiceCard:** GlassCard + imagen + nombre + precio + duración + botón
- **Verificación:** Componentes usan CSS variables, no colores hardcodeados

#### T3.4: BookingStepper.jsx + DataTable.jsx + AppointmentGrid.jsx
- **Archivos:** 3 componentes UI
- **BookingStepper:** Pasos visuales (servicio → sucursal → horario → datos)
- **DataTable:** Zebra-glass (filas pares tint primary 5%), headers bold JetBrains
- **AppointmentGrid:** Grid semanal con slots horarios estilo agenda
- **Verificación:** Renderizan con datos mock local

---

### CORTE 4 — Separar portales (2 tareas)

#### T4.1: Crear layouts (PublicLayout, AuthLayout, BackofficeLayout, ProfessionalLayout)
- **Archivos:** 4 layouts nuevos
- **PublicLayout:** Sin sidebar, Navbar pública limpia, Footer
- **AuthLayout:** Centered card, sin navbar
- **BackofficeLayout:** Sidebar 260px + Topbar 64px + contenido
- **ProfessionalLayout:** Similar Backoffice pero simplificado
- **Verificación:** Cada layout renderiza con su estructura correcta

#### T4.2: Refactorizar App.jsx con layouts
- **Archivo:** `frontend/src/App.jsx`
- **Cambio:** Cada grupo de rutas usa su layout correspondiente
- **Regla:** Público nunca ve sidebar/roles/dashboard/backoffice
- **Verificación:** Navegar entre rutas confirma layout correcto

---

### CORTE 5 — Landing pública (3 tareas)

#### T5.1: Hero section premium con tema dinámico
- **Archivo:** `frontend/src/pages/Home.jsx` (reemplazo total)
- **Hero:** `brandHeroImage` como background con overlay glass, `brandName` como título, `brandCtaLabel` como botón
- **Verificación:** Hero muestra nombre real desde backend

#### T5.2: Bento grid + servicios destacados reales
- **Archivo:** `frontend/src/pages/Home.jsx` (continuación)
- **Bento:** 6 cards glass con categorías de servicios reales desde `/api/servicios-web`
- **Verificación:** Cards muestran servicios reales (no hardcodeados)

#### T5.3: Cómo funciona + sucursal + contacto + CTA final
- **Archivo:** `frontend/src/pages/Home.jsx` (final)
- **Secciones:** Stepper 3 pasos, sucursal principal, horarios, contacto (tel/email/whatsapp), CTA reserva
- **Verificación:** Datos de contacto vienen de backend; NO muestra "Sistema Marca Blanca Multirrubro"

---

### CORTE 6 — Catálogo público (2 tareas)

#### T6.1: Refactorizar catálogo con datos reales
- **Archivo:** `frontend/src/pages/Catalogo.jsx` (reemplazo total)
- **Datos:** `/api/servicios-web`
- **UI:** Grid de ServiceCards con filtro por categoría, glass aesthetic
- **Verificación:** No usa PRODUCTOS_WEB; muestra servicios reales

#### T6.2: Filtros y búsqueda en catálogo
- **Archivo:** `frontend/src/pages/Catalogo.jsx` (continuación)
- **UI:** Barra de búsqueda glass, filtros por categoría, ordenamiento
- **Verificación:** Búsqueda funcional sobre datos reales

---

### CORTE 7 — Reserva pública (3 tareas)

#### T7.1: Stepper de reserva completo
- **Archivo:** `frontend/src/pages/Reserva.jsx` (reemplazo total)
- **UI:** BookingStepper con 4 pasos: servicio → sucursal → horario → datos
- **Datos:** `/api/servicios-web`, `/api/sucursales`, `/api/agenda-slots`
- **Verificación:** Stepper avanza/retrocede visualmente

#### T7.2: Selección de slots reales futuros
- **Archivo:** `frontend/src/pages/Reserva.jsx` (continuación)
- **Datos:** Slots desde `/api/agenda-slots` filtrados futuros
- **Verificación:** Muestra slots reales, no hardcodeados

#### T7.3: Formulario + resumen lateral
- **Archivo:** `frontend/src/pages/Reserva.jsx` (final)
- **UI:** Formulario glass con campos nombre/teléfono/email, resumen lateral con servicio+sucursal+slot
- **Texto:** "Demo read-only: la reserva todavía no confirma el turno"
- **Verificación:** No crea registros; botón deshabilitado con tooltip

---

### CORTE 8 — Backoffice interno (5 tareas)

#### T8.1: Dashboard backoffice
- **Archivo:** `frontend/src/pages/Backoffice.jsx` (reemplazo)
- **UI:** Cards glass con KPIs (citas hoy, clientes, servicios activos), sidebar Stitch Admin
- **Datos:** `/api/citas`, `/api/clientes`, `/api/servicios`
- **Verificación:** KPIs con datos reales (sin métricas financieras falsas)

#### T8.2: Agenda operativa
- **Archivo:** `frontend/src/pages/Agenda.jsx` (reemplazo)
- **UI:** AppointmentGrid semanal, vista día/semana, filtros por profesional
- **Datos:** `/api/agenda-slots`, `/api/citas`
- **Verificación:** Grid muestra citas reales con estética Stitch Admin

#### T8.3: Gestión de clientes
- **Archivo:** `frontend/src/pages/Clientes.jsx` (reemplazo)
- **UI:** DataTable zebra-glass, buscador, panel detalle lateral
- **Datos:** `/api/clientes`
- **Verificación:** Tabla muestra clientes reales con badges

#### T8.4: Gestión de servicios y sucursales
- **Archivos:** `frontend/src/pages/Servicios.jsx`, `frontend/src/pages/Sucursales.jsx`
- **UI:** DataTable + GlassCards, estética Stitch Admin
- **Datos:** `/api/servicios`, `/api/sucursales`
- **Verificación:** Datos reales, tablas con zebra-glass

#### T8.5: Citas y configuración
- **Archivos:** `frontend/src/pages/Citas.jsx`, `frontend/src/pages/Configuracion.jsx`
- **UI:** DataTable + filtros, Panel glass para config
- **Datos:** `/api/citas`, `/api/configuracion-publica`
- **Verificación:** Read-only, sin escritura

---

### CORTE 9 — Portal profesional (2 tareas)

#### T9.1: Portal profesional placeholder premium
- **Archivo:** `frontend/src/pages/Profesional.jsx` (nuevo)
- **UI:** Glass cards con agenda demo, citas asignadas demo
- **Verificación:** Placeholder premium sin datos falsos

#### T9.2: Ruta y layout profesional
- **Archivo:** `frontend/src/App.jsx`
- **Cambio:** Agregar ruta `/profesional` con ProfessionalLayout + ProtectedRoute
- **Verificación:** Accesible solo con rol PROFESIONAL

---

## Validación final (1 tarea)

#### V.1: Build + deploy + checklist completo
- Ejecutar `npm run build` → sin errores
- Deploy a Surge `bellezapro-demo.surge.sh`
- Verificar checklist de 12 puntos:
  1. `/health` responde OK
  2. Surge consume Railway real
  3. 0 tokens en frontend
  4. 0 mocks
  5. 0 Airtable directo
  6. Landing parece comercial premium
  7. Catálogo muestra servicios reales
  8. Reserva muestra slots reales futuros
  9. `/login` no contamina navegación pública
  10. Backoffice usa layout separado
  11. Profesional existe
  12. static/api.js, CREDENCIALES.md, harness/ intactos

---

## Archivos a modificar/crear

| Tipo | Cantidad | Archivos clave |
|------|---------|---------------|
| Modificar | 8 | `main.jsx`, `index.css`, `App.jsx`, `resolveBrandConfig.js`, `Navbar.jsx`, `Footer.jsx`, `Home.jsx`, `Catalogo.jsx`, `Reserva.jsx`, `Backoffice.jsx`, `Agenda.jsx`, `Clientes.jsx`, `Servicios.jsx`, `Sucursales.jsx`, `Citas.jsx`, `Configuracion.jsx`, `Login.jsx` |
| Crear | 14 | 7 componentes UI, 4 layouts, 1 matriz doc, 1 Profesional.jsx, 1 ruta nueva |
| No tocar | — | `static/api.js`, `CREDENCIALES.md`, `harness/`, `backend/`, `.env` |

---

## Riesgos

1. **CORS**: Railway CORS configurado para `bellezapro-demo.surge.sh` ✅
2. **VITE_API_BASE_URL**: Debe ser absoluta en build (`https://earnest-comfort-production-3d75.up.railway.app`) ✅
3. **Glassmorphism en Tailwind**: Requiere `backdrop-blur` utilities — vienen con Tailwind 3 ✅
4. **Fuentes Manrope/Inter/JetBrains**: Se cargan de Google Fonts en `index.html`
5. **Datos reales**: Backend responde con 97 configs y 37 módulos ✅
6. **Tiempo**: Fase masiva — ejecutar con subagentes en paralelo donde sea posible
