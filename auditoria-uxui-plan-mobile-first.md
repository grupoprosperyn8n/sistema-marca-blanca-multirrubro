# 🏪 Salón Pro — Auditoría UX/UI & Plan Mobile First Terracota

**Fecha:** 2026-06-02  
**Archivo analizado:** `static/index.html` (2,458 líneas, 116.7 KB)  
**Stack:** Vanilla HTML/CSS/JS + Airtable API + Emoji-based iconography

---

## 📊 RESUMEN EJECUTIVO

El frontend actual es funcional pero **eminentemente utilitario**. Tiene una arquitectura sólida de páginas, manejo de estados, y una base CSS mobile-first con variables. Sin embargo, carece de:

- Design system formal (solo 1 tono terracota definido como `--accent`)
- Librería de íconos (usa emojis nativos del SO — inconsistentes entre plataformas)
- Agenda visual con slots de tiempo (solo lista de cards)
- Bottom nav con solo 4 ítems + "Más" genérico
- Dark mode
- Animaciones de transición entre páginas
- Un sistema de espaciado tipográfico consistente

---

## 1. 🎨 DESIGN SYSTEM TERRACOTA/COBRE — ANÁLISIS

### 1.1 CSS Variables Existentes (auditadas línea 13-37)

```css
:root {
  --bg: #faf8f7;              /* Fondo general (beige cálido) ✅ */
  --surface: #ffffff;          /* Superficie de cards ✅ */
  --text: #2d2420;             /* Texto principal ✅ */
  --text-secondary: #6b5e58;   /* Texto secundario ✅ */
  --text-muted: #a3968b;       /* Texto muted ✅ */
  --accent: #c97b5d;           /* Terracota actual ✅ */
  --accent-light: #f5e8e2;     /* Terracota claro ✅ */
  --success: #5b8c5a;
  --success-light: #e8f5e9;
  --warning: #d4954a;
  --warning-light: #fff8e1;
  --danger: #c45b5b;
  --danger-light: #ffeaea;
  --sidebar-bg: #1e1815;
  --sidebar-text: #c4b5aa;
  --sidebar-active: #c97b5d;
  --sidebar-hover: #2a2420;
  --border: #e8e2de;
  --shadow: 0 2px 8px rgba(45,36,32,0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --font: 'Inter', ...;
  --transition: 0.2s ease;
}
```

### 1.2 Variables FALTANTES (Referenciadas pero no definidas)

| Variable | Donde se usa | Línea |
|---|---|---|
| `--accent-hover` | `.btn-primary:hover`, `.empty-cta-btn:hover` | 689, 744 |
| `--bg-secondary` | `tr` en resumen costos | 1979 |

### 1.3 Variables PROPUESTAS para Design System Terracota Completo

```css
:root {
  /* ===== PALETA TERRACOTA/COBRE (NUEVA) ===== */
  --primary:        #C67B5C;   /* Terracota principal */
  --primary-dark:   #A85D3F;   /* Terracota oscuro (hover, active) */
  --primary-light:  #F5E8E2;   /* Terracota muy claro (fondos) */
  --primary-surface:#FAF2EE;   /* Superficie con tint terracota */

  /* ===== NEUTRALES (refinados) ===== */
  --bg:             #FAF8F7;   /* Fondo principal (conservado) */
  --surface:        #FFFFFF;   /* Cards, modales */
  --surface-hover:  #F5F2F0;   /* Hover en superficies */
  --border:         #E8E2DE;   /* Bordes */
  --border-light:   #F0EBE7;   /* Bordes sutiles */

  /* ===== TEXTO (escala refinada) ===== */
  --text:           #2D2420;   /* Texto principal */
  --text-secondary: #6B5E58;   /* Texto secundario */
  --text-muted:     #A3968B;   /* Texto muted/placeholder */
  --text-inverse:   #FCFAF8;   /* Texto sobre fondos oscuros */

  /* ===== SEMÁNTICOS (conservados + nuevos) ===== */
  --success:        #5B8C5A;
  --success-light:  #E8F5E9;
  --warning:        #D4954A;
  --warning-light:  #FFF8E1;
  --danger:         #C45B5B;
  --danger-light:   #FFEAEA;
  --info:           #5B7B8C;
  --info-light:     #E3F2FD;

  /* ===== SIDEBAR (oscuro) ===== */
  --sidebar-bg:      #1E1815;
  --sidebar-surface: #2A2420;
  --sidebar-text:    #C4B5AA;
  --sidebar-active:  #C67B5C;  /* Alineado con --primary */
  --sidebar-hover:   #2A2420;

  /* ===== TIPOGRAFÍA (escala con clamp) ===== */
  --font:           'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace;
  --text-xs:        clamp(0.625rem, 1.5vw, 0.6875rem);  /* 10-11px */
  --text-sm:        clamp(0.75rem, 1.8vw, 0.8125rem);   /* 12-13px */
  --text-base:      clamp(0.8125rem, 2vw, 0.9375rem);   /* 13-15px */
  --text-lg:        clamp(0.9375rem, 2.5vw, 1.125rem);  /* 15-18px */
  --text-xl:        clamp(1.125rem, 3vw, 1.5rem);       /* 18-24px */
  --text-2xl:       clamp(1.375rem, 4vw, 2rem);         /* 22-32px */
  --text-3xl:       clamp(1.75rem, 5vw, 2.5rem);        /* 28-40px */

  /* ===== ESPACIADO ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* ===== BORDES Y SOMBRAS ===== */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius:    12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 3px rgba(45,36,32,0.04);
  --shadow:    0 2px 8px rgba(45,36,32,0.06);
  --shadow-md: 0 4px 16px rgba(45,36,32,0.08);
  --shadow-lg: 0 8px 32px rgba(45,36,32,0.12);
  --shadow-xl: 0 12px 48px rgba(45,36,32,0.16);

  /* ===== TRANSICIONES ===== */
  --transition-fast:   0.15s ease;
  --transition:        0.2s ease;
  --transition-slow:   0.35s ease;
  --transition-spring: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 1.4 Correspondencia: Variables Actuales → Nuevo Sistema

| Actual | Nueva | Nota |
|---|---|---|
| `--accent` (#c97b5d) | `--primary` (#C67B5C) | Ligero ajuste de tono |
| `--accent-light` | `--primary-light` | Mismo color |
| No existe | `--primary-dark` | Nuevo: #A85D3F |
| `--transition` | `--transition` | Conservado, añadir fast/slow/spring |

---

## 2. 📱 MOBILE FIRST — ANÁLISIS POR BREAKPOINT

### 2.1 Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```
✅ **CORRECTO.** Incluye `viewport-fit=cover` para notch/isla dinámica.

### 2.2 Media Queries Existentes (6 total)

| Breakpoint | Tipo | Línea | Propósito |
|---|---|---|---|
| `min-width: 768px` | Tablet | 656 | Grids 4-col, oculta bottom nav, muestra hamburger, muestra tablas |
| `min-width: 1024px` | Desktop | 670 | Sidebar visible, margen izquierdo, grids 4-col |
| `min-width: 768px` | Toast | 705 | Toast se mueve a esquina derecha |
| `min-width: 768px` | Skeleton | 733 | Skeleton grid 2 cols |
| `min-width: 1024px` | Skeleton | 734 | Skeleton grid 4 cols |
| `max-width: 767px` | Modal mobile | 753 | Modal full-screen bottom sheet |

### 2.3 Comportamiento Mobile — Hallazgos

| Aspecto | Estado | Detalle |
|---|---|---|
| Sidebar en mobile | ✅ Oculto | Hidden < 1024px |
| Bottom nav | ✅ Visible | 4 tabs + "Más" overlay |
| Tablas en mobile | ⚠️ Parcial | Se muestran cards, pero las tablas desktop también existen ocultas en el DOM |
| Touch targets | ⚠️ Mejorable | Hamburger: 44×44 ✅, nav-btn: min-height 44px ✅, pero action-btn (edit/delete) son 32×32 ❌ |
| Formularios | ✅ Adaptados | Modal se convierte en bottom sheet en mobile (animación slideUp) |
| Cards | ✅ Bien | `.card-list`, `.svc-card`, `.prod-card`, `.emp-card`, `.upcoming-item` |
| FAB | ✅ Corregido | `bottom: 80px` (mobile) → `bottom: 24px` (tablet) para no pisar bottom nav |

### 2.4 Breakpoints RECOMENDADOS

```css
/* Actual: 768px, 1024px */
/* Propuesto: Mobile-first con 4 breakpoints */

/* Base: 0-639px (mobile, portrait) */
/* sm: 640px — tablets pequeños / landscape phones */
/* md: 768px — tablets */
/* lg: 1024px — desktop */
/* xl: 1280px — desktop wide */
/* 2xl: 1440px — monitores grandes */
```

**Breakpoints propuestos con Media Queries:**
```css
/* ESTILOS BASE: Mobile (0-639px) — sin media query */

/* sm ≥ 640px */
@media screen and (min-width: 640px) { }

/* md ≥ 768px */
@media screen and (min-width: 768px) { }

/* lg ≥ 1024px */
@media screen and (min-width: 1024px) { }

/* xl ≥ 1280px */
@media screen and (min-width: 1280px) { }

/* 2xl ≥ 1440px */
@media screen and (min-width: 1440px) { }
```

### 2.5 Propuesta: Grid de Cards Mobile (375px base)

```css
/* Ejemplo: KPI grid actual es 2 columnas, debe ser 2 hasta 640px */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

@media screen and (min-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Servicios: 2 cols en mobile → 3 en tablet → 4 en desktop */
.svc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

@media screen and (min-width: 768px) {
  .svc-grid { grid-template-columns: repeat(3, 1fr); }
}

@media screen and (min-width: 1024px) {
  .svc-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### 2.6 Touch Targets — Correcciones Necesarias

```css
/* ❌ ACTUAL: 32x32 — NO cumple WCAG (mín 44px) */
.action-btn { width: 2rem; height: 2rem; min-width: 32px; min-height: 32px; }

/* ✅ PROPUESTO: 44x44 — cumple WCAG 2.5.5 */
.action-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
}

/* ❌ ACTUAL: modal-close 32x32 */
.modal-close { width: 32px; height: 32px; }

/* ✅ PROPUESTO: 44x44 */
.modal-close { width: 44px; height: 44px; }
```

---

## 3. 🎯 ICONOGRAFÍA LUCIDE — PROPUESTA POR MÓDULO

### 3.1 Estado Actual
- Se usan **emojis nativos** (`📊`, `👥`, `📅`, etc.) en sidebar, bottom nav, headers, cards
- **Problema:** emojis varían visualmente entre SO (iOS, Android, Windows, Linux)
- **Problema:** no son escalables, no se pueden colorear con CSS, no tienen consistencia de peso visual

### 3.2 Propuesta: Lucide Icons vía CDN

```html
<!-- Agregar en <head>: -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<!-- O para mejor perf: -->
<script src="https://cdn.jsdelivr.net/npm/lucide@0.453.0/dist/umd/lucide.min.js"></script>
```

```html
<!-- Uso: -->
<i data-lucide="scissors" class="icon"></i>
<i data-lucide="calendar-days" class="icon icon--lg"></i>

<!-- Inicializar al cargar: -->
<script>lucide.createIcons();</script>
<!-- Re-inicializar después de renderizado dinámico -->
```

### 3.3 Estilos para íconos Lucide

```css
.icon {
  width: 20px; height: 20px;
  stroke-width: 1.75;
  flex-shrink: 0;
  color: inherit;
}

.icon--sm  { width: 16px; height: 16px; }
.icon--md  { width: 24px; height: 24px; }
.icon--lg  { width: 32px; height: 32px; }
.icon--xl  { width: 40px; height: 40px; }

/* Sidebar íconos */
.sidebar-btn .icon { color: var(--sidebar-text); }
.sidebar-btn.active .icon { color: var(--sidebar-active); }

/* Bottom nav íconos */
.nav-btn .icon { color: var(--text-muted); }
.nav-btn.active .icon { color: var(--primary); }

/* KPI cards íconos */
.kpi-icon .icon { width: 24px; height: 24px; }
```

### 3.4 LISTA COMPLETA: Íconos Lucide por Módulo

| # | Módulo | Ícono Lucide | Nombre Lucide | Alternativa |
|---|---|---|---|---|
| 1 | **Dashboard** | 📊 → | `layout-dashboard` | `gauge` |
| 2 | **Clientes** | 👥 → | `users` | `contact-round` |
| 3 | **Citas** | 📅 → | `calendar-days` | `calendar-check` |
| 4 | **Servicios** | 💅 → | `scissors` | `sparkles` |
| 5 | **Empleados** | 👩 → | `user-round-pen` | `briefcase` |
| 6 | **Caja** | 💰 → | `wallet` | `banknote` |
| 7 | **Productos** | 📦 → | `package` | `shopping-bag` |
| 8 | **Reportes** | 📈 → | `bar-chart-3` | `trending-up` |
| 9 | **Proveedores** | 🏭 → | `truck` | `factory` |
| 10 | **Inventario** | 📋 → | `clipboard-list` | `clipboard-check` |
| 11 | **Promociones** | 🎁 → | `gift` | `tag` |
| 12 | **Agenda** | 🗓️ → | `calendar-range` | `clock` |
| 13 | **Capacitaciones** | 🎓 → | `graduation-cap` | `book-open` |
| 14 | **Ficha Servicios** | 📝 → | `file-text` | `sticky-note` |
| 15 | **Costos Fijos** | 💸 → | `receipt` | `dollar-sign` |
| 16 | **Resumen Costos** | 📊 → | `pie-chart` | `calculator` |
| 17 | **Ingresos/Egresos** | 💵 → | `arrow-right-left` | `banknote` |

### 3.5 Íconos Específicos para KPIs del Dashboard

| KPI | Ícono Lucide |
|---|---|
| Ingresos Hoy | `dollar-sign` en círculo verde |
| Clientes Hoy | `users` en círculo primary |
| Citas Hoy | `calendar-check` en círculo warning |
| Ticket Promedio | `star` en círculo primary |
| Productos Bajos | `package-search` en círculo danger |
| Empleados Activos | `user-check` en círculo success |

### 3.6 Íconos para Acciones (Edit, Delete, etc.)

| Acción | Ícono Lucide |
|---|---|
| Editar | `pencil` |
| Eliminar | `trash-2` |
| Crear/Nuevo (FAB) | `plus` |
| Buscar | `search` |
| Filtrar | `filter` |
| Guardar | `save` o `check` |
| Cancelar/Cerrar | `x` |
| Notificaciones | `bell` |
| Más opciones | `more-horizontal` |
| Recargar | `refresh-cw` |
| Hamburger menú | `menu` |
| Check/Confirmar | `check-circle` |
| Warning | `alert-triangle` |
| Error | `x-circle` |

---

## 4. 🧩 COMPONENTES UI — PROPUESTAS

### 4.1 System de Skeleton Loading

**Estado actual:** Tiene `.skel`, `.skel-card`, `.skel-kpi`, `.skel-line` con animación pulse — ✅ Funcional pero básico.

**Propuesta de mejora:**

```css
/* Skeleton con shimmer effect (más profesional) */
@keyframes shimmer {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skel {
  background: linear-gradient(
    90deg,
    var(--border) 0%,
    var(--border-light) 40%,
    var(--border) 80%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

/* Skeleton específicos */
.skel-avatar { width: 40px; height: 40px; border-radius: var(--radius-full); }
.skel-title { height: 16px; width: 60%; margin-bottom: 8px; }
.skel-text  { height: 12px; width: 90%; margin-bottom: 6px; }
.skel-text--short { width: 40%; }
.skel-kpi { height: 80px; border-radius: var(--radius); }
.skel-card { height: 72px; border-radius: var(--radius); margin-bottom: 8px; }
```

### 4.2 Cards de Resumen/KPI — Dashboard

**Propuesta de Card KPI Mejorada:**

```html
<div class="kpi-card kpi-card--success">
  <div class="kpi-header">
    <div class="kpi-icon-wrap" style="background: var(--success-light);">
      <i data-lucide="dollar-sign" class="icon icon--md" style="color: var(--success);"></i>
    </div>
    <span class="kpi-trend up">+12%</span>
  </div>
  <div class="kpi-value">$1,250,000</div>
  <div class="kpi-label">Ingresos Hoy</div>
</div>
```

```css
.kpi-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}

/* Acento de color lateral */
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  background: var(--primary);
  border-radius: var(--radius) 0 0 var(--radius);
}

.kpi-card--success::before { background: var(--success); }
.kpi-card--warning::before { background: var(--warning); }
.kpi-card--danger::before  { background: var(--danger); }

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.kpi-icon-wrap {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-value {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: var(--space-1);
  color: var(--text);
}

.kpi-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.kpi-trend {
  font-size: var(--text-xs);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}

.kpi-trend.up { color: var(--success); }
.kpi-trend.down { color: var(--danger); }
```

### 4.3 AGENDA VISUAL CON SLOTS DE TIEMPO

**Estado actual:** La agenda muestra una simple `card-list` con fecha, hora inicio, hora fin y estado. No es visual.

**Propuesta: Vista de agenda tipo calendario con slots coloreados por estado:**

```html
<div class="agenda-visual">
  <!-- Cabecera de día -->
  <div class="agenda-day-header">
    <button class="agenda-nav"><i data-lucide="chevron-left"></i></button>
    <div class="agenda-date">
      <span class="agenda-day-name">Martes</span>
      <span class="agenda-day-num">2 de Junio, 2026</span>
    </div>
    <button class="agenda-nav"><i data-lucide="chevron-right"></i></button>
  </div>

  <!-- Slots de tiempo -->
  <div class="agenda-slots">
    <div class="agenda-slot agenda-slot--available">
      <span class="slot-time">08:00</span>
      <div class="slot-content">
        <span class="slot-label">Disponible</span>
      </div>
    </div>
    <div class="agenda-slot agenda-slot--booked">
      <span class="slot-time">09:00</span>
      <div class="slot-content">
        <span class="slot-client">María García</span>
        <span class="slot-service">Corte + Coloración</span>
        <span class="slot-employee">👩 Laura Pérez</span>
      </div>
      <span class="slot-duration">60 min</span>
    </div>
    <div class="agenda-slot agenda-slot--blocked">
      <span class="slot-time">10:00</span>
      <div class="slot-content">
        <span class="slot-label">🔒 Bloqueado</span>
      </div>
    </div>
    <!-- ... más slots ... -->
  </div>
</div>
```

```css
.agenda-visual {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
}

.agenda-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--primary-light);
  border-bottom: 1px solid var(--border);
}

.agenda-day-name {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
  display: block;
}

.agenda-day-num {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.agenda-slots {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow-y: auto;
}

.agenda-slot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition-fast);
  cursor: pointer;
  min-height: 56px;
}

.agenda-slot:active {
  background: var(--bg);
}

.slot-time {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 48px;
}

.slot-content {
  flex: 1;
  min-width: 0;
}

.slot-client {
  font-weight: 600;
  font-size: var(--text-base);
  display: block;
}

.slot-service {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.slot-employee {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.slot-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}

.slot-duration {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
}

/* Estados de slot */
.agenda-slot--available {
  border-left: 3px solid var(--success);
  background: var(--success-light);
}

.agenda-slot--booked {
  border-left: 3px solid var(--primary);
  background: var(--surface);
}

.agenda-slot--blocked {
  border-left: 3px solid var(--danger);
  background: var(--danger-light);
}

.agenda-slot--pending {
  border-left: 3px solid var(--warning);
  background: var(--warning-light);
}
```

### 4.4 MODALES CRUD Mejorados

**Estado actual:** Modal funcional con form builder dinámico. Funciona bien pero es espartano.

**Propuestas de mejora:**

```css
/* Animación de entrada/salida mejorada */
.modal-backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 200;
  opacity: 0;
  transition: opacity var(--transition);
}

.modal-backdrop.open {
  display: block;
  opacity: 1;
}

.modal {
  display: none;
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  width: 92%;
  max-width: 480px;
  max-height: 85vh;
  background: var(--surface);
  border-radius: var(--radius-lg);
  z-index: 210;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  opacity: 0;
  transition: opacity var(--transition), transform var(--transition-spring);
  display: flex;
  flex-direction: column;
}

.modal.open {
  display: flex;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  background: var(--primary-light);
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--border);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

/* Mobile: Bottom sheet mejorado */
@media (max-width: 639px) {
  .modal {
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    transform: translateY(100%) !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .modal.open {
    transform: translateY(0) !important;
  }

  /* Handle visual para indicar que es arrastrable */
  .modal::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 8px auto;
  }
}
```

### 4.5 TOASTS Mejorados

```css
/* Toasts con íconos Lucide */
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: var(--text-base);
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  animation: toastIn var(--transition);
  cursor: default;
  border: 1px solid transparent;
}

.toast-success {
  background: var(--success-light);
  color: var(--success);
  border-color: var(--success);
}

.toast-error {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
}

.toast-info {
  background: var(--info-light);
  color: var(--info);
  border-color: var(--info);
}

.toast-warning {
  background: var(--warning-light);
  color: var(--warning);
  border-color: var(--warning);
}

@keyframes toastIn {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

@keyframes toastOut {
  from { transform: translateY(0); opacity: 1; }
  to   { transform: translateY(-16px); opacity: 0; }
}
```

### 4.6 ESTADOS: Empty, Error, Loading (Mejoras)

```html
<!-- Empty State con ilustración -->
<div class="state-container">
  <div class="state-icon-wrap">
    <i data-lucide="inbox" class="icon icon--xl" style="color: var(--text-muted);"></i>
  </div>
  <div class="state-title">No hay citas programadas</div>
  <div class="state-text">Las citas que reserves aparecerán aquí.</div>
  <button class="empty-cta-btn">
    <i data-lucide="plus" class="icon icon--sm"></i>
    Nueva Cita
  </button>
</div>

<!-- Error State -->
<div class="state-container">
  <div class="state-icon-wrap" style="background: var(--danger-light);">
    <i data-lucide="alert-triangle" class="icon icon--xl" style="color: var(--danger);"></i>
  </div>
  <div class="state-title">Error al cargar</div>
  <div class="state-text">No se pudieron obtener los datos. Verifica tu conexión.</div>
  <button class="retry-btn">
    <i data-lucide="refresh-cw" class="icon icon--sm"></i>
    Reintentar
  </button>
</div>
```

```css
.state-icon-wrap {
  width: 72px; height: 72px;
  border-radius: var(--radius-full);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-3);
}
```

---

## 5. 🧭 NAVEGACIÓN — PROPUESTAS

### 5.1 Bottom Nav (Mobile) — ACTUAL vs PROPUESTO

**Actual:** 4 tabs (Dashboard, Clientes, Citas, Servicios) + "⋯ Más" overlay

**Propuesto:** 5 tabs fijos con íconos Lucide

```html
<nav class="bottom-nav">
  <button class="nav-btn active" data-page="dashboard">
    <i data-lucide="layout-dashboard" class="icon icon--md"></i>
    <span>Inicio</span>
  </button>
  <button class="nav-btn" data-page="citas">
    <i data-lucide="calendar-days" class="icon icon--md"></i>
    <span>Citas</span>
  </button>
  <button class="nav-btn nav-btn--fab" data-page="new">
    <div class="nav-fab">
      <i data-lucide="plus" class="icon icon--lg"></i>
    </div>
  </button>
  <button class="nav-btn" data-page="caja">
    <i data-lucide="wallet" class="icon icon--md"></i>
    <span>Caja</span>
  </button>
  <button class="nav-btn" data-page="mas">
    <i data-lucide="menu" class="icon icon--md"></i>
    <span>Más</span>
  </button>
</nav>
```

```css
/* FAB central en bottom nav */
.nav-fab {
  width: 48px; height: 48px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(198, 123, 92, 0.4);
  margin-top: -20px;
  transition: var(--transition);
}

.nav-fab:active {
  transform: scale(0.93);
  box-shadow: 0 2px 6px rgba(198, 123, 92, 0.3);
}
```

### 5.2 Sidebar (Desktop) — Mejoras

```html
<aside class="sidebar">
  <div class="sidebar-brand">
    <i data-lucide="scissors" class="icon icon--md" style="color: var(--primary);"></i>
    <span>Salón Pro</span>
  </div>

  <!-- Categorías colapsables -->
  <nav class="sidebar-nav">
    <div class="sidebar-category">
      <button class="sidebar-cat-toggle" aria-expanded="true">
        <span>Principal</span>
        <i data-lucide="chevron-down" class="icon icon--sm"></i>
      </button>
      <div class="sidebar-cat-items">
        <button class="sidebar-btn active" data-page="dashboard">
          <i data-lucide="layout-dashboard" class="icon"></i>
          Dashboard
        </button>
        <button class="sidebar-btn" data-page="clientes">
          <i data-lucide="users" class="icon"></i>
          Clientes
        </button>
        <button class="sidebar-btn" data-page="citas">
          <i data-lucide="calendar-days" class="icon"></i>
          Citas
        </button>
        <button class="sidebar-btn" data-page="servicios">
          <i data-lucide="scissors" class="icon"></i>
          Servicios
        </button>
      </div>
    </div>

    <div class="sidebar-category">
      <button class="sidebar-cat-toggle" aria-expanded="false">
        <span>Gestión</span>
        <i data-lucide="chevron-down" class="icon icon--sm"></i>
      </button>
      <div class="sidebar-cat-items" hidden>
        <!-- ... resto de módulos ... -->
      </div>
    </div>

    <div class="sidebar-category">
      <button class="sidebar-cat-toggle" aria-expanded="false">
        <span>Finanzas</span>
        <i data-lucide="chevron-down" class="icon icon--sm"></i>
      </button>
      <div class="sidebar-cat-items" hidden>
        <!-- Caja, Costos Fijos, Resumen, Ingresos/Egresos -->
      </div>
    </div>
  </nav>
</aside>
```

```css
.sidebar-category {
  margin-bottom: var(--space-1);
}

.sidebar-cat-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--sidebar-text);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  font-weight: 600;
}

.sidebar-cat-toggle .icon {
  transition: transform var(--transition);
}

.sidebar-cat-toggle[aria-expanded="true"] .icon {
  transform: rotate(180deg);
}

.sidebar-cat-items[hidden] {
  display: none;
}
```

### 5.3 Breadcrumbs / Header de Sección

```html
<div class="page-header">
  <div class="breadcrumbs">
    <span>Principal</span>
    <i data-lucide="chevron-right" class="icon icon--sm"></i>
    <span class="current">Citas</span>
  </div>
  <div class="page-actions">
    <button class="btn-icon">
      <i data-lucide="search" class="icon"></i>
    </button>
    <button class="btn-icon">
      <i data-lucide="filter" class="icon"></i>
    </button>
    <button class="btn-primary btn--sm">
      <i data-lucide="plus" class="icon icon--sm"></i>
      Nueva Cita
    </button>
  </div>
</div>
```

---

## 6. 📐 MÉTRICAS DETALLADAS

### 6.1 Media Queries

| **Total** | **6** |
|---|---|
| `min-width: 768px` | 3 (tablet + toast + skeleton) |
| `min-width: 1024px` | 2 (desktop + skeleton) |
| `max-width: 767px` | 1 (modal mobile) |
| **Faltan:** `prefers-color-scheme`, `min-width: 1280px`, `min-width: 1440px` |

### 6.2 Tamaños de Fuente (auditados)

| Tamaño | Uso | Líneas |
|---|---|---|
| **10px** | Sidebar labels, nav buttons | 75, 200 |
| **11px** | KPI labels, badges, status, tags, table headers | 251, 253, 268, 309, 382, 413, 421, 448 |
| **12px** | Form labels, card subtitles, service info | 306, 340, 361, 411, 591 |
| **13px** | Chart placeholder, retry buttons, overlay titles | 146, 294, 379, 440, 470, 488, 508 |
| **14px** | Card titles, list items, form inputs, buttons | 305, 410, 606, 636, 649 |
| **15px** | Overlay buttons, emp names, empty titles, prod price | 160, 360, 388, 487 |
| **16px** | Modal titles | 571 |
| **18px** | Modal close | 578 |
| **20px** | Nav icons, hamburger | 115, 214 |
| **22px** | KPI icons | 250 |
| **26px** | FAB | 524 |
| **28px** | Product icons | 378 |
| **32px** | Service icons | 332 |
| **40px** | State icons | 486 |
| **clamp()** | 7 usos (responsive headings/values) | 65, 88, 221, 228, 252, 333, 335 |

**Problemas:**
- Escala poco consistente (10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 26, 28, 32, 40 — saltos irregulares)
- No hay sistema de tipos (heading-1, body, caption, etc.)
- Los 10px son difíciles de leer en mobile

### 6.3 Dark Mode

| Estado | ❌ NO IMPLEMENTADO |
|---|---|
| `prefers-color-scheme` | No existe en el código |
| Toggle manual | No existe |
| Variables dark | No existen |
| **Recomendación:** Implementar con media query + toggle JS |

### 6.4 Performance & CDN

| Aspecto | Estado |
|---|---|
| Google Fonts (Inter) | ✅ Cargado con `preconnect` + `display=swap` |
| Lucide CDN | ❌ No se usa (emojis nativos) |
| JS bundle size | ~55KB de JS inline, +28KB api.js |
| CSS inline | ~8KB en `<style>` |
| Caché API | ✅ 5 min TTL en api.js |
| Debounce | ✅ 300ms en api.js |
| Rate limiting | ✅ 5 req/s en api.js |

**Propuesta CDN óptima:**
```html
<!-- Lucide desde jsDelivr (con SRI para seguridad) -->
<script 
  src="https://cdn.jsdelivr.net/npm/lucide@0.453.0/dist/umd/lucide.min.js"
  integrity="sha256-..."
  crossorigin="anonymous">
</script>
```

---

## 7. 📊 PLAN DE IMPLEMENTACIÓN POR PRIORIDAD

### FASE 1 — FUNDACIÓN (Alta Prioridad) ⚡

| Tarea | Esfuerzo | Impacto |
|---|---|---|
| **1.1** Agregar variables CSS faltantes (`--primary`, `--primary-dark`, spacing, tipografía) | 30 min | 🔴 Crítico |
| **1.2** Reemplazar emojis con Lucide (CDN + 17 íconos de módulo) | 1h | 🔴 Crítico |
| **1.3** Corregir touch targets (action-btn 32→44px, modal-close 32→44px) | 15 min | 🟠 Alto |
| **1.4** Migrar `--accent` → `--primary`, `--accent-light` → `--primary-light` en todo el CSS | 45 min | 🔴 Crítico |
| **1.5** Agregar `--accent-hover` y `--bg-secondary` (variables referenciadas no definidas) | 5 min | 🟡 Medio |

### FASE 2 — COMPONENTES CORE (Alta Prioridad)

| Tarea | Esfuerzo | Impacto |
|---|---|---|
| **2.1** Rediseñar KPI Cards con acentos de color, íconos Lucide, tendencias | 1h | 🟠 Alto |
| **2.2** Implementar Agenda Visual con slots de tiempo coloreados | 2h | 🟠 Alto |
| **2.3** Mejorar Modal con animaciones de escala + backdrop blur | 30 min | 🟡 Medio |
| **2.4** Mejorar Skeleton Loading con shimmer effect | 30 min | 🟡 Medio |
| **2.5** Mejorar Toasts con colores semánticos + íconos Lucide | 30 min | 🟡 Medio |

### FASE 3 — NAVEGACIÓN (Media Prioridad)

| Tarea | Esfuerzo | Impacto |
|---|---|---|
| **3.1** Rediseñar Bottom Nav con 5 tabs + FAB central | 1.5h | 🟠 Alto |
| **3.2** Sidebar con categorías colapsables + íconos Lucide | 1.5h | 🟡 Medio |
| **3.3** Agregar breadcrumbs / header de sección con acciones | 1h | 🟢 Bajo |
| **3.4** Transición suave entre páginas (fade + slide) | 30 min | 🟢 Bajo |

### FASE 4 — EXPERIENCIA (Media/Baja Prioridad)

| Tarea | Esfuerzo | Impacto |
|---|---|---|
| **4.1** Implementar Dark Mode (prefers-color-scheme + toggle) | 2h | 🟡 Medio |
| **4.2** Mejorar Empty States con ilustraciones + CTAs | 1h | 🟢 Bajo |
| **4.3** Animaciones de micro-interacción (hover, active, focus) | 1h | 🟢 Bajo |
| **4.4** Sistema de búsqueda/filtro en tablas | 2h | 🟢 Bajo |

---

## 8. 🔧 SNIPPETS LISTOS PARA IMPLEMENTAR

### 8.1 Lucide Setup (reemplazar emojis en JS)

```javascript
// En renderDashboard(), reemplazar emojis por data-lucide:
// ❌ Actual: '<div class="kpi-icon">💰</div>'
// ✅ Nuevo:   '<div class="kpi-icon"><i data-lucide="dollar-sign"></i></div>'

// Después de cada render:
lucide.createIcons();
```

### 8.2 Helper para íconos en JS

```javascript
function lucideIcon(name, className = '') {
  return `<i data-lucide="${name}" class="icon ${className}"></i>`;
}

// Uso:
// lucideIcon('calendar-days', 'icon--lg')  →  <i data-lucide="calendar-days" class="icon icon--lg"></i>
```

### 8.3 Corrección de action-btn touch targets

```css
/* REEMPLAZAR líneas 694-697 */
.card-actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
.action-btn {
  width: 44px; height: 44px;
  min-width: 44px; min-height: 44px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all var(--transition-fast);
  padding: 0;
}
.action-btn:active { transform: scale(0.93); }
.edit-btn:hover { background: var(--success-light); border-color: var(--success); color: var(--success); }
.delete-btn:hover { background: var(--danger-light); border-color: var(--danger); color: var(--danger); }
```

### 8.4 Página Agenda Visual (reemplazar `renderAgenda()`)

```javascript
async function renderAgenda() {
  const mobileEl = document.getElementById('agenda-mobile');
  const tableWrapper = document.getElementById('agenda-table-wrapper');
  const badge = document.getElementById('agenda-badge');
  showLoading(mobileEl);

  try {
    const data = await getRecords('agenda', { maxRecords: 100,
      fields: ['Fecha', 'Hora de Inicio', 'Hora de Fin', 'Estado de la Cita', 'Notas', 'Cliente', 'Servicio']
    });
    const records = data.records || [];
    badge.textContent = records.length + ' slots';

    if (records.length === 0) {
      showEmpty(mobileEl, 'No hay slots en la agenda.', 'Crear Slot', '() => openCreateForm("agenda")');
      return;
    }

    // Agrupar slots por hora
    const sorted = [...records].sort((a, b) =>
      (a.fields['Hora de Inicio'] || '').localeCompare(b.fields['Hora de Inicio'] || '')
    );

    const slots = sorted.map(r => {
      const hora = r.fields['Hora de Inicio'] || '--:--';
      const fin = r.fields['Hora de Fin'] || '';
      const estado = (r.fields['Estado de la Cita'] || 'Disponible').toLowerCase();
      const estadoClass =
        estado === 'disponible' ? 'available' :
        estado === 'reservada' || estado === 'ocupada' ? 'booked' :
        estado === 'bloqueada' ? 'blocked' : 'pending';
      const cliente = r.fields['Cliente'] || '';
      const servicio = r.fields['Servicio'] || '';

      return `<div class="agenda-slot agenda-slot--${escHtml(estadoClass)}" onclick="openEditForm('agenda', ${JSON.stringify(r).replace(/"/g, '&quot;')})">
        <span class="slot-time">${escHtml(hora)}</span>
        <div class="slot-content">
          ${cliente
            ? `<span class="slot-client">${escHtml(cliente)}</span><span class="slot-service">${escHtml(servicio)}</span>`
            : `<span class="slot-label">${escHtml(r.fields['Estado de la Cita'] || 'Disponible')}</span>`
          }
        </div>
        ${fin ? `<span class="slot-duration">${escHtml(fin)}</span>` : ''}
      </div>`;
    }).join('');

    mobileEl.innerHTML = `<div class="agenda-visual"><div class="agenda-day-header">
      <div class="agenda-date"><span class="agenda-day-name">Agenda del Día</span></div>
    </div><div class="agenda-slots">${slots}</div></div>`;

    // Desktop table (conservar)
    const rows = sorted.map(r => {
      const fecha = r.fields['Fecha'] || '-';
      const ini = r.fields['Hora de Inicio'] || '-';
      const fin = r.fields['Hora de Fin'] || '-';
      const estado = r.fields['Estado de la Cita'] || '-';
      const sc = statusBadgeClass(estado);
      return `<tr><td>${escHtml(fecha)}</td><td>${escHtml(ini)}</td><td>${escHtml(fin)}</td>
        <td><span class="status-badge ${sc}">${escHtml(estado)}</span></td>
        <td>${escHtml(r.fields['Notas'] || '-')}</td>
        <td>${actionButtons('agenda', r, fecha + ' ' + ini)}</td></tr>`;
    }).join('');
    tableWrapper.innerHTML = `<table class="data-table"><thead><tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Notas</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;

  } catch (err) {
    console.error('[Agenda]', err);
    showError(mobileEl, err.message);
  }
}
```

---

## 9. 📋 CHECKLIST FINAL

- [x] Viewport meta tag correcto
- [x] Sidebar oculta en mobile (< 1024px)
- [x] Bottom nav funcional (4 tabs + overlay)
- [x] Sistema de páginas con data-loading
- [x] Toast system implementado
- [x] Skeleton loading implementado
- [x] Modal CRUD con form builder dinámico
- [x] Estados: loading, empty, error
- [x] FAB para creación rápida
- [x] Validación cliente-side
- [x] Caché de nombres resueltos
- [ ] **Design system terracota formal** (variables `--primary`, spacing, tipografía)
- [ ] **Íconos Lucide** (reemplazar emojis)
- [ ] **Touch targets ≥ 44px** (action-btns, modal-close)
- [ ] **Agenda visual con slots de tiempo**
- [ ] **Dark mode** (`prefers-color-scheme`)
- [ ] **Sidebar con categorías colapsables**
- [ ] **Bottom nav con 5 tabs + FAB central**
- [ ] **Transiciones de página**
- [ ] **`--accent-hover` y `--bg-secondary` definidos**

---

## 10. 🎯 RESUMEN DE HALLAZGOS CLAVE

| # | Hallazgo | Severidad |
|---|---|---|
| 1 | `--accent-hover` y `--bg-secondary` referenciados pero NO definidos en `:root` | 🔴 Crítico |
| 2 | Solo hay 1 tono terracota (`--accent: #c97b5d`), falta hover (`--primary-dark`) | 🟠 Alto |
| 3 | Emojis como íconos — inconsistencia cross-platform, no coloreables con CSS | 🟠 Alto |
| 4 | Action buttons (edit/delete) miden 32×32px — no cumplen WCAG 2.5.5 (mín 44px) | 🟠 Alto |
| 5 | No existe dark mode — sin `prefers-color-scheme` ni toggle | 🟡 Medio |
| 6 | Escala tipográfica irregular (10px–40px con saltos no sistemáticos) | 🟡 Medio |
| 7 | Agenda es solo una card-list — sin representación visual de slots de tiempo | 🟡 Medio |
| 8 | Sidebar muestra 17 botones planos sin categorización colapsable | 🟢 Bajo |
| 9 | Bottom nav solo tiene 4 tabs directos + overlay genérico "Más" | 🟢 Bajo |
| 10 | Sin animaciones de transición entre páginas | 🟢 Bajo |

---

> **Documento generado por Hermes Agent** — Archivo fuente: `static/index.html` (2,458 líneas, 116.7 KB)  
> **Workspace:** `/home/diegol/Descargas/PROYECTOS AIONUI/sistema-marca-blanca-multirrubro/`
