# Propuesta UX/UI + Plan Fase 2 — Gestión de Salones de Belleza

> **Fecha:** 2026-06-02  
> **Autor:** Lead Agent (Hermes)  
> **Modo:** SOLO REPORTE  

---

## 📐 Estado Actual del UX/UI

### ✅ Lo que ya funciona bien

| Componente | Estado | Detalle |
|-----------|--------|---------|
| **Mobile-first CSS** | ✅ Sólido | Base mobile 320px, `min-width` queries, sin `max-width` |
| **Paleta terracota/cobre** | ✅ Consistente | `--accent: #c97b5d`, sidebar `#1e1815`, variables CSS |
| **Tipografía fluida** | ✅ | `clamp()` en headings, Inter font, antialiased |
| **Bottom nav (móvil)** | ✅ | 5 íconos + "Más", `safe-area-inset-bottom` |
| **Sidebar (desktop)** | ✅ | 220px, íconos + labels, secciones "Principal" y "Gestión" |
| **Overlay "Más"** | ✅ | Slide-up con backdrop, 4 opciones extra |
| **KPI cards** | ✅ | Grid responsive, icono + label + valor + trend |
| **Skeleton loading** | ✅ | Animación pulse, clases `.skel-*` |
| **Toast system** | ✅ | Success/Error/Info con animaciones |
| **FAB button** | ✅ | Fixed bottom-right, sombra acento, ripple |
| **Modal** | ✅ | Responsive (full-screen en móvil), backdrop |
| **Status badges** | ✅ | Colores semánticos por estado |

### 🟡 Áreas a mejorar

| # | Problema | Impacto | Vista |
|---|---------|---------|-------|
| 1 | **Tablas y cards duplicadas en tablet** — a 768px+ ambas se muestran simultáneamente | UX confuso | Clientes, Citas, Caja |
| 2 | **Sin sidebar tablet (icon-only)** — tablets usan hamburger en esquina, menos profesional | Navegación | Global |
| 3 | **KPIs saltan de 2→4 columnas** — sin paso intermedio de 3 columnas en tablet | Layout brusco | Dashboard, Caja, Reportes |
| 4 | **Sin animaciones de transición entre vistas** — cambio brusco de página | Percepción | Global |
| 5 | **Cards sin borde de estado** — no hay indicador visual del estado en la card | Escaneabilidad | Citas, Clientes |
| 6 | **Listas largas sin paginación** — todas las citas/clientes cargan de una vez | Performance | Clientes, Citas, Caja |
| 7 | **Sin barra de búsqueda/filtro** — no hay forma de encontrar un cliente/producto rápido | Usabilidad | Clientes, Productos |
| 8 | **FAB sin label de contexto** — solo "+", no indica qué se va a crear | Descubribilidad | Global |
| 9 | **Sin confirmación al eliminar** — `deleteRecord` no pide confirmación | Seguridad | Global |
| 10 | **Tablas sin ordenamiento** — columnas no son clickeables para ordenar | Usabilidad | Desktop |

---

## 🎨 Propuesta de Mejoras UX/UI (Priorizadas)

### 🔴 Prioridad Alta — Correcciones inmediatas

#### 1. Resolver duplicación cards/tablas en tablet
**Problema:** A 768px+, `.mobile-section` (cards) y `.responsive-table` (tablas) se muestran juntas.  
**Solución:** Ocultar cards mobile en tablet+ con `display: none`:
```css
@media (min-width: 768px) {
  .mobile-section { display: none; }  /* ← era display: block */
  .responsive-table { display: block; }
}
```

#### 2. Agregar sidebar icon-only para tablet (768-1023px)
**Problema:** Tablets usan hamburger flotante — se ve amateur.  
**Solución:** Sidebar colapsada de 56px con solo íconos:
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar { display: flex; width: 56px; }
  .sidebar-btn span:last-child { display: none; }  /* ocultar labels */
  .sidebar-label { display: none; }                /* ocultar secciones */
  .sidebar-brand { font-size: 0; }                 /* ocultar texto */
  .sidebar-brand::after { content: "💇"; font-size: 24px; }
  .main { margin-left: 56px; }
  .hamburger { display: none; }
}
```

#### 3. Transición suave entre vistas
**Problema:** `page.active { display: block }` es cambio instantáneo.  
**Solución:** Agregar fade-in + slide-up en navegación:
```css
.page {
  display: none;
  opacity: 0;
  transform: translateY(8px);
}
.page.active {
  display: block;
  animation: pageIn 0.25s ease forwards;
}
@keyframes pageIn {
  to { opacity: 1; transform: translateY(0); }
}
```

#### 4. Barra de búsqueda para Clientes y Productos
**Problema:** Sin forma de buscar entre 50+ clientes o 100+ productos.  
**Solución:** Input de búsqueda con filtrado client-side:
```html
<div class="search-bar">
  <span class="search-icon">🔍</span>
  <input type="text" class="search-input" placeholder="Buscar cliente..." 
         oninput="filterCards(this.value, 'clientes-mobile')">
</div>
```
```css
.search-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 8px 12px; margin-bottom: 12px;
}
.search-input {
  border: none; background: none; font-size: 14px; width: 100%;
  font-family: var(--font); color: var(--text); outline: none;
}
```

#### 5. Diálogo de confirmación para eliminar
**Problema:** `deleteRecord` ejecuta sin confirmación — riesgo de borrado accidental.  
**Solución:** Interceptar con modal de confirmación antes de llamar a la API:
```javascript
async function deleteRecord(tableKey, id, name) {
  if (!confirm(`¿Eliminar "${name}"?\nEsta acción no se puede deshacer.`)) return;
  // ... lógica actual
}
```

### 🟡 Prioridad Media — Próxima iteración

#### 6. Cards con borde de color por estado
**Propuesta:** Cada card de cita/cliente tiene borde izquierdo de 3px con color semántico:
- Verde → Completada/Activo
- Ámbar → Programada/Pendiente  
- Rojo → Cancelada/Inactivo

```css
.card-item.status-completed { border-left: 3px solid var(--success); }
.card-item.status-pending { border-left: 3px solid var(--warning); }
.card-item.status-cancelled { border-left: 3px solid var(--danger); }
```

#### 7. FAB con tooltip contextual
**Propuesta:** El FAB muestra un pequeño label según la vista activa:
```javascript
const FAB_LABELS = {
  dashboard: 'Nueva Cita', clientes: 'Nuevo Cliente', citas: 'Nueva Cita',
  servicios: 'Nuevo Servicio', empleados: 'Nuevo Empleado',
  caja: 'Nueva Transacción', productos: 'Nuevo Producto'
};
fabBtn.setAttribute('aria-label', FAB_LABELS[currentPage] || 'Nuevo');
```

#### 8. Paginación "Cargar más" en listas largas
**Propuesta:** Botón "Cargar 20 más" al final de cada lista, usando `offset` en `getRecords`:
```javascript
let clientOffset = 0;
async function loadMoreClientes() {
  const data = await getRecords('clientes', { maxRecords: 20, offset: clientOffset });
  clientOffset += 20;
  // render additional cards
}
```

#### 9. Ordenamiento de columnas en tablas desktop
**Propuesta:** Cabeceras de tabla clickeables que ordenan ascendente/descendente:
```javascript
function sortTable(tableEl, colIndex) {
  const rows = [...tableEl.querySelectorAll('tbody tr')];
  const asc = tableEl.dataset.sortDir !== 'asc';
  rows.sort((a, b) => {
    const va = a.cells[colIndex].textContent.trim();
    const vb = b.cells[colIndex].textContent.trim();
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  tableEl.querySelector('tbody').append(...rows);
  tableEl.dataset.sortDir = asc ? 'asc' : 'desc';
}
```

#### 10. Skeleton loaders en navegación entre vistas
**Propuesta:** Al hacer clic en una pestaña, mostrar skeletons **inmediatamente** (antes de que lleguen los datos), no esperar a que `renderX()` se ejecute.

---

## 🗺️ Plan Fase 2 — Vistas Faltantes

Las 4 vistas del contrato que no tienen implementación actual:

| Vista | Tabla Airtable | Campos | Complejidad |
|-------|---------------|--------|-------------|
| **Agenda** | AGENDA (8 campos) | Hora inicio, Fecha, Hora fin, Empleado🔗, Estado, Cliente🔗, Servicio🔗, Notas | 🟡 Media |
| **Inventario** | INVENTARIO (10 campos) | Ubicación/Código Barra, Fecha, Producto🔗, Stock, Notas | 🟡 Media |
| **Promociones** | PROMOCIONES (9 campos) | Nombre, Descripción, Fechas inicio/fin, Descuento%, Servicios🔗, Productos🔗, Clientes🔗, Estado, Imagen | 🟠 Alta |
| **Proveedores** | PROVEEDORES (11 campos) | Nombre, Contacto, Teléfono, Email, Dirección, Términos, Productos🔗, Web, Foto | 🟢 Baja |

### F2.1 — AGENDA (vista de disponibilidad)

**Objetivo:** Mostrar slots de tiempo disponibles/reservados por empleado y día.

**Diseño mobile:**
- **Selector de fecha** en la parte superior (7 días, scroll horizontal tipo chips: Lun 3, Mar 4, Mié 5...)
- **Selector de empleado** debajo (chips con avatar/emoji: 👩 María, 👨 Carlos, 👩‍🦰 Ana)
- **Lista de slots** vertical con hora a la izquierda y badge de estado:
  ```
  ┌──────────────────────────────────┐
  │  09:00  │ Disponible           ✓ │
  │  09:30  │ Disponible           ✓ │
  │  10:00  │ María García      📋  │ ← Reservada
  │  10:30  │ Corte de Pelo      💇  │
  │  11:00  │ Disponible           ✓ │
  └──────────────────────────────────┘
  ```
- **Tap en slot disponible** → abre modal rápido para crear cita

**Diseño desktop:**
- **Vista de grilla semanal** (7 columnas × filas de 30 min)
- Cada empleado es una fila, cada celda coloreada por estado

**CSS clave:**
```css
.agenda-date-strip {
  display: flex; gap: 8px; overflow-x: auto;
  padding: 8px 0; scroll-snap-type: x mandatory;
}
.agenda-date-chip {
  flex-shrink: 0; padding: 8px 14px; border-radius: 20px;
  background: var(--surface); border: 1px solid var(--border);
  font-size: 12px; cursor: pointer; text-align: center;
}
.agenda-date-chip.selected { background: var(--accent); color: #fff; border-color: var(--accent); }
.agenda-date-chip.today { border-color: var(--accent); }
.agenda-slot {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border-radius: var(--radius-sm);
  margin-bottom: 4px;
}
.agenda-slot.free { background: var(--success-light); border: 1px dashed var(--success); }
.agenda-slot.booked { background: var(--warning-light); border: 1px solid var(--warning); }
```

**Campos a consumir:** `Hora de Inicio`, `Fecha`, `Hora de Fin`, `Estado de la Cita`, `Cliente`🔗, `Servicio Solicitado`🔗, `Empleado Asignado`🔗

---

### F2.2 — INVENTARIO (control de stock)

**Objetivo:** Mostrar niveles de stock por producto con alertas visuales de stock bajo.

**Diseño mobile:**
- **Barra de búsqueda** + filtro por categoría (chips horizontales)
- **Grid de cards 2 columnas** similar a Productos pero con:
  - Foto del producto (mini)
  - Nombre
  - Stock actual con barra de progreso
  - Badge de alerta si stock < 5
  - Última actualización

```
┌──────────────┐  ┌──────────────┐
│ 🧴           │  │ 💇           │
│ Shampoo Pro  │  │ Tinte #7     │
│ ████████░░ 8 │  │ ██░░░░░░░ 2 ⚠│
│ Stock: 12     │  │ Stock bajo!  │
│ Actualizado:  │  │ Act: 28 may  │
│ 1 jun         │  │              │
└──────────────┘  └──────────────┘
```

**Diseño desktop:**
- Tabla con columnas: Producto | Categoría | Stock | Stock Mín | Estado | Última Actualización | Acciones
- Filtro por categoría en thead

**Campos a consumir:** `Ubicación x Código de Barra`, `Fecha de Última Actualización`, `Producto`🔗, `Cantidad en Stock Copy`, `Notas de Inventario`

---

### F2.3 — PROMOCIONES (gestión de ofertas)

**Objetivo:** CRUD de promociones con fechas de vigencia y descuentos.

**Diseño mobile:**
- **Cards verticales** mostrando:
  - Nombre de la promoción
  - Badge de descuento (ej: "20% OFF")
  - Fechas: "1 jun → 15 jun"
  - Servicios/Productos incluidos (chips pequeños)
  - Estado: Activa 🟢 / Inactiva ⚪ / Expirada 🔴

```
┌──────────────────────────────┐
│ 🎉 20% OFF                    │
│ Verano Radiante              │
│ 📅 1 jun → 30 jun            │
│ 💇 Corte, 💅 Manicura        │
│ 🟢 Activa                    │
└──────────────────────────────┘
```

**Diseño desktop:**
- Tabla con columnas: Nombre | Descuento | Inicio | Fin | Servicios | Productos | Estado | Acciones

**Campos a consumir:** `Nombre de la Promoción`, `Descripción de la Promoción`, `Fecha de Inicio`, `Fecha de Fin`, `Descuento`, `Servicios Incluidos`🔗, `Productos Incluidos`🔗, `Clientes Objetivo`🔗, `Estado de la Promoción`

**Filtro automático:** Solo mostrar promociones con estado ≠ "Expirada" (o sección separada "Históricas")

---

### F2.4 — PROVEEDORES (directorio de proveedores)

**Objetivo:** CRUD simple de proveedores con datos de contacto y productos asociados.

**Diseño mobile:**
- **Lista de cards** con avatar y datos clave:
  - Nombre del proveedor (bold)
  - Contacto + teléfono
  - Badge con cantidad de productos
  - Link a web (si tiene)

```
┌──────────────────────────────┐
│ 🏢  TIGI Distribution         │
│ 👤 Carlos Mendoza            │
│ 📞 +54 11 4567-8900          │
│ 📦 12 productos              │
│ 🌐 tigi.com →                │
└──────────────────────────────┘
```

**Diseño desktop:**
- Tabla con columnas: Logo | Nombre | Contacto | Teléfono | Email | Productos | Web | Acciones

**Campos a consumir:** `Nombre del Proveedor`, `Contacto del Proveedor`, `Teléfono del Proveedor`, `Email del Proveedor`, `Dirección del Proveedor`, `Términos de Compra`, `Web`, `Foto del Proveedor`

---

## 📅 Cronograma Fase 2

### Semana 1: Vistas nuevas

| Día | Tarea | Complejidad |
|-----|-------|-------------|
| 1 | **Agenda** — HTML + CSS + renderAgenda() con selector de fecha y grid de slots | 🟡 4h |
| 2 | **Inventario** — HTML + CSS + renderInventario() con barra de progreso y alertas | 🟡 3h |
| 3 | **Promociones** — HTML + CSS + renderPromociones() con badges de descuento + filtro por estado | 🟠 5h |
| 4 | **Proveedores** — HTML + CSS + renderProveedores() con avatar y link a web | 🟢 3h |

### Semana 2: Mejoras UX/UI

| Día | Tarea | Prioridad |
|-----|-------|-----------|
| 5 | Fix duplicación cards/tablas en tablet + sidebar icon-only tablet | 🔴 |
| 6 | Transiciones entre vistas + skeleton en navegación | 🔴 |
| 7 | Búsqueda/filtro en Clientes y Productos + diálogo confirmación eliminar | 🔴 |
| 8 | Cards con borde de estado + FAB contextual | 🟡 |
| 9 | Paginación "Cargar más" + ordenamiento columnas | 🟡 |
| 10 | Testing cross-vista + deploy a Surge.sh | 🟢 |

---

## 🎯 Mockup del Sidebar Expandido (post-Fase 2)

```
┌─────────────────────┐
│ 💇 Salón Pro        │  ← brand
├─────────────────────┤
│ PRINCIPAL           │  ← sección
│ 📊 Dashboard        │
│ 👥 Clientes         │
│ 📅 Citas            │
│ 💅 Servicios        │
├─────────────────────┤
│ GESTIÓN             │
│ 👩 Empleados        │
│ 💰 Caja             │
│ 📦 Productos        │
│ 📈 Reportes         │
├─────────────────────┤
│ OPERACIONES    ✨NUEVO
│ 📋 Agenda           │  ← Fase 2
│ 🏷️ Promociones      │  ← Fase 2
├─────────────────────┤
│ ADMINISTRACIÓN ✨NUEVO
│ 📊 Inventario       │  ← Fase 2
│ 🏢 Proveedores       │  ← Fase 2
└─────────────────────┘
```

---

## 🚦 Prerrequisitos para Fase 2

### Antes de empezar, deben estar corregidos (Fase 1B):

1. ✅ **Linked records** — sin esto, Agenda no puede mostrar nombres de empleados/clientes
2. ✅ **Lookup maps** — necesarios para resolver IDs en todas las vistas nuevas
3. ✅ **FORM_CONFIGS completos** — las 4 vistas nuevas necesitarán formularios de creación
4. ✅ **Servicios: Valor Hora Hombre** — usar campo manual, no fórmula

### Dependencias técnicas:

- **Agenda** depende de: Clientes🔗, Servicios🔗, Empleados🔗 → necesita lookup maps
- **Promociones** depende de: Servicios🔗, Productos🔗, Clientes🔗 → necesita lookup maps
- **Inventario** depende de: Productos🔗 → ya tenemos renderProductos
- **Proveedores** es independiente (sin linked records complejos)

### Nuevos FORM_CONFIGS necesarios:

```javascript
FORM_CONFIGS.agenda = [
  { label: 'Hora de Inicio', field: 'Hora de Inicio', type: 'text', placeholder: '09:00' },
  { label: 'Fecha', field: 'Fecha', type: 'date' },
  { label: 'Hora de Fin', field: 'Hora de Fin', type: 'text', placeholder: '10:00' },
  { label: 'Estado', field: 'Estado de la Cita', type: 'select', options: ['Disponible','Reservada','Cancelada'] },
  // Faltan selects para Empleado Asignado🔗, Cliente🔗, Servicio Solicitado🔗
];

FORM_CONFIGS.promociones = [
  { label: 'Nombre', field: 'Nombre de la Promoción', type: 'text' },
  { label: 'Descripción', field: 'Descripción de la Promoción', type: 'textarea' },
  { label: 'Inicio', field: 'Fecha de Inicio', type: 'date' },
  { label: 'Fin', field: 'Fecha de Fin', type: 'date' },
  { label: 'Descuento %', field: 'Descuento', type: 'number' },
  { label: 'Estado', field: 'Estado de la Promoción', type: 'select', options: ['Activa','Inactiva','Expirada'] },
  // Faltan multi-select para Servicios🔗, Productos🔗, Clientes🔗
];
```

---

## 📊 Resumen de Cambios

| Categoría | Cambios | Archivos afectados |
|-----------|---------|-------------------|
| **Bugs Fase 1** | 16 bugs documentados | `index.html` (~20 líneas) |
| **Mejoras UX/UI** | 10 mejoras priorizadas | `index.html` (CSS + JS, ~200 líneas) |
| **Vistas Fase 2** | 4 vistas nuevas | `index.html` (~600 líneas HTML/CSS + ~400 líneas JS) |
| **FORM_CONFIGS** | 4 configuraciones nuevas + 3 ampliaciones | `index.html` (~150 líneas) |
| **PAGE_TO_TABLE** | 4 entradas nuevas | `index.html` (4 líneas) |
| **Sidebar** | +2 secciones, +4 botones | `index.html` (HTML + CSS, ~50 líneas) |
| **Bottom nav** | Cambiar "Más" overflow | `index.html` (reordenar) |

**Estimación total Fase 2:** ~1,424 líneas nuevas de código, 10 días de trabajo.

---

*Propuesta completada en modo SOLO REPORTE. Lista para revisión de Diego.*
*Próximo paso: aprobación para salir de modo reporte y comenzar implementación.*
