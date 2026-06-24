# PLAN: Fase 2 — Frontend Completo + Seed Data

> **Versión:** 1.0 | **Fecha:** 2026-06-02 | **Autor:** Hermes Lead  
> **Objetivo:** Llevar el frontend al mismo nivel que el backend (15 tablas, 210 campos)  
> **Preview:** https://gestion-desalones-de-belleza-preview.surge.sh

---

## Diagnóstico

| | Backend (api.js) | Frontend actual (index.html) | Gap |
|---|---|---|---|
| Tablas cubiertas | 15 | 6 | -9 |
| Campos mostrados | 210 disponibles | ~15 efectivos | -93% |
| Vistas con datos reales | N/A | 4 (clientes, citas, servicios, dashboard) | |
| Vistas con placeholders | N/A | 2 (empleados, productos) | |
| Vistas inexistentes | N/A | 9 (proveedores, inventario, promociones, agenda, reportes, capacitaciones, ficha servicios, costos fijos, resumen costos) | |
| CRUD forms | API lista | Solo botones de acción | |
| Búsqueda/filtro | API lista | No implementado | |
| Datos de prueba | Tablas vacías | — | Necesita seed |

---

## Fase 2.1: Seed Data (5 registros por tabla)

### Script: `scripts/seed_data.py`

Ejecuta via `python3 scripts/seed_data.py` usando el token Airtable del proyecto.

### Estrategia de seed

1. **Orden de dependencia** — Las tablas se siembran en orden jerárquico:
   - Primero las tablas sin dependencias (Empleados, Proveedores, Costos Fijos, Ficha Servicios)
   - Luego las que dependen de las anteriores (Productos → Servicios → Clientes...)
   - Finalmente las tablas centrales (Citas, Ingresos/Egresos, Reportes)

2. **Campos a sembrar** — Solo campos manuales:
   - ✅ `singleLineText`, `multilineText`, `richText`, `number`, `currency`, `date`, `email`, `phone`, `url`, `percent`, `checkbox`, `barcode`, `singleSelect`, `multipleSelect`
   - ✅ `multipleRecordLinks` — cargados con IDs de registros creados previamente
   - ✅ `multipleAttachments` — se saltea (no hay archivos reales), se pone `null`
   - ❌ `autoNumber` — Airtable lo genera automáticamente
   - ❌ `createdTime`, `lastModifiedTime`, `createdBy`, `lastModifiedBy` — automáticos
   - ❌ `formula`, `rollup`, `lookup`, `count` — se calculan automáticamente cuando los datos fuente existen
   - ❌ `singleCollaborator` — se saltea (requiere usuarios reales de Airtable)

3. **Lógica de relaciones** — Cada registro linked se conecta con datos reales:
   - Ej: Una Cita → linked a un Cliente, un Servicio, un Empleado (por sus IDs)
   - Ej: Un Producto → linked a un Proveedor (por ID)
   - Se usan los IDs retornados por Airtable al crear los registros padre

4. **Datos realistas** — Salón de belleza en Buenos Aires:
   - Nombres de clientes argentinos
   - Servicios reales: Corte, Color, Alisado, Manicura, etc.
   - Productos reales: marcas (Fidelitte, Tec Italy, Caviar, etc.)
   - Montos en pesos argentinos (ARS)
   - Fechas recientes (últimos 30 días)

### Tablas y orden de seed

| Orden | Tabla | Depende de | 5 registros |
|-------|-------|-----------|-------------|
| 1 | EMPLEADOS | — | 5 empleados (estilistas, manicurista, recepcionista) |
| 2 | PROVEEDORES | — | 5 proveedores de productos de peluquería |
| 3 | COSTOS FIJOS PELUQUERIA | — | 5 gastos fijos (alquiler, luz, internet, sueldos, insumos) |
| 4 | FICHA DE SERVICIOS | — | 5 tareas (lavado, preparación, aplicación, enjuague, secado) |
| 5 | PRODUCTOS | Proveedores | 5 productos (shampoo, tintura, keratina, guantes, toallas) |
| 6 | SERVICIOS | Productos, Empleados, Ficha | 5 servicios (corte, color, alisado, manicura, tratamiento) |
| 7 | CLIENTES | — | 5 clientes |
| 8 | CITAS | Clientes, Servicios, Empleados | 5 citas (hoy + próximas) |
| 9 | AGENDA | Empleados, Clientes, Servicios | 5 slots horarios |
| 10 | PROMOCIONES | Servicios, Productos, Clientes | 5 promociones activas |
| 11 | CAPACITACIONES | Empleados, Servicios | 5 capacitaciones |
| 12 | INVENTARIO | Productos | 5 registros de inventario |
| 13 | RESUMEN DE COSTOS FIJOS | Costos Fijos, Servicios | 5 resúmenes mensuales |
| 14 | INGRESOS/EGRESOS | Clientes, Servicios, Productos, Costos Fijos | 5 transacciones |
| 15 | REPORTES | Inventario, Empleados | 5 reportes |

---

## Fase 2.2: Enriquecer 6 vistas existentes

Cada vista existente se mejora con:
- Todos los campos del contrato (no solo 3-5)
- Formulario modal de creación/edición
- Búsqueda/filtro inline
- Mobile cards + desktop table
- Estados visuales: loading, empty, error

### 2.2.1 — Clientes (16 campos → mostrar 12)

| Campo | Actual | Nuevo |
|-------|--------|-------|
| Nombre | ✅ | ✅ |
| Email | ✅ | ✅ + validación |
| Teléfono | ✅ | ✅ + validación |
| Dirección | ❌ | ✅ |
| Preferencias de Servicios | ❌ | ✅ (tags) |
| Historial de Citas | ❌ | ✅ (count) |
| Promociones | ❌ | ✅ (badges) |
| Ventas | ❌ | ✅ (monto) |
| Ventas y Cobros | ❌ | ✅ (estado) |

### 2.2.2 — Citas (12 campos → mostrar 8)

| Campo | Actual | Nuevo |
|-------|--------|-------|
| Hora de la Cita | ✅ | ✅ |
| Fecha de la Cita | ❌ | ✅ |
| Cliente | ✅ (nombre) | ✅ (nombre + tel) |
| Servicio Solicitado | ✅ (nombre) | ✅ (nombre + duración) |
| Profesional Asignado | ❌ | ✅ |
| Estado de la Cita | ❌ | ✅ (badge color) |
| Notas | ❌ | ✅ |

### 2.2.3 — Servicios (26 campos → mostrar 14)

Actualmente solo muestra nombre. Agregar: descripción, duración, valor, productos utilizados, costo variable, costo total, precio.

### 2.2.4 — Empleados (20 campos → mostrar 12)

Actualmente con datos mock. Mostrar: nombre, apellido, especialidad, teléfono, email, fecha contratación, citas asignadas, capacitaciones.

### 2.2.5 — Productos (31 campos → mostrar 16)

Actualmente con datos mock. Mostrar: nombre, precio, stock, proveedor, categoría, marca, código barra, costo envío, rendimiento, precio venta.

### 2.2.6 — Dashboard / Caja (Ingresos/Egresos)

Actualmente: 4 KPIs básicos + citas del día.

**Nuevo:**
- KPIs: Ingresos hoy, Egresos hoy, Neto hoy, Pendientes cobro
- Gráfico de barras: últimos 7 días (JS simple, sin librerías)
- Tabla: últimas 10 transacciones con todos los campos visibles
- Filtro: por fecha, por tipo (ingreso/egreso), por medio de pago

---

## Fase 2.3: Construir 9 vistas nuevas

Cada vista nueva incluye:
1. **Nav item** en sidebar
2. **Sección completa** en `#main-content`
3. **renderXxx()** — mobile cards + desktop table + badge
4. **Modal de creación** — form con todos los campos manuales
5. **Modal de edición** — precargado con datos existentes
6. **Búsqueda/filtro** — input de texto + filtro por estado/fecha
7. **Estados**: loading (skeleton), empty, error

### 2.3.1 — Proveedores (13 campos)

- Vista: tabla con Nombre, Contacto, Teléfono, Email, Web, Productos (count)
- Modal CRUD con todos los campos
- Link a productos del proveedor

### 2.3.2 — Inventario (10 campos)

- Vista: tabla con Producto, Stock, Ubicación, Proveedor, Última actualización
- Alerta visual si stock < mínimo (5 unidades)
- Modal CRUD

### 2.3.3 — Promociones (10 campos)

- Vista: tabla con Nombre, Descuento, Fechas, Estado, Servicios/Productos incluidos
- Badge de estado: Activa 🟢, Inactiva 🟡, Expirada 🔴
- Filtro: solo activas / todas
- Modal CRUD

### 2.3.4 — Agenda (8 campos) ⭐ Vista calendario

- Vista principal: cards agrupadas por fecha
- Vista alternativa: tabla con Hora, Fecha, Empleado, Cliente, Servicio, Estado
- Filtro por empleado, por fecha
- Modal CRUD

### 2.3.5 — Reportes (9 campos)

- Vista: cards de reporte con tipo, fecha, descripción
- Estados visuales por tipo (íconos)
- Modal CRUD

### 2.3.6 — Capacitaciones (10 campos)

- Vista: tabla con Programa, Fechas, Duración, Costo, Instructor, Empleados
- Estados: Próxima, En curso, Finalizada (según fechas)
- Modal CRUD

### 2.3.7 — Ficha de Servicios (4 campos)

- Vista: Kanban-like con 3 columnas (Todo, In Progress, Done)
- Cards con Name, Notes, Assignee
- Drag & drop simulado (click para cambiar estado)
- Modal CRUD

### 2.3.8 — Costos Fijos Peluquería (6 campos)

- Vista: tabla con Nombre, Categoría, Monto, Notas
- Gráfico de torta simple por categoría (CSS)
- Total mensual en KPI
- Modal CRUD

### 2.3.9 — Resumen de Costos Fijos (6 campos)

- Vista: tabla con Fecha, Servicios promedio, Total costos, Costo por servicio
- KPI destacado: Costo Fijo por Servicio
- Modal CRUD

---

## Fase 2.4: Mejoras globales de UI

### 2.4.1 — Sistema de modales unificado
- `openModal(title, fields, onSubmit)` → reutilizable para todas las vistas
- Soporta: text, number, date, select, textarea, currency, linked-record
- Validación client-side antes de enviar a Airtable

### 2.4.2 — Sistema de notificaciones (toasts)
- Ya implementado en api.js
- Conectar acciones CRUD a toasts: "Cliente creado ✅", "Error al guardar ❌"

### 2.4.3 — Búsqueda global
- Input en header que busca en la tabla activa
- Debounce 300ms (ya implementado en api.js)

### 2.4.4 — Responsive completo
- Mobile: cards con acción swipe (editar/eliminar)
- Tablet: 2 columnas de cards
- Desktop: tabla completa con todas las columnas

---

## Estimación de esfuerzo

| Fase | Tareas | Complejidad |
|------|--------|-------------|
| 2.1 — Seed data | 1 script Python | Media |
| 2.2 — Enriquecer 6 vistas | 6 × (tabla + modal + filtro) | Alta |
| 2.3 — 9 vistas nuevas | 9 × (nav + sección + render + modal) | Muy alta |
| 2.4 — UI global | 4 mejoras transversales | Media |

---

## Validación post-implementación

- [ ] Las 15 tablas tienen datos visibles en el frontend
- [ ] Cada tabla muestra los campos del contrato (no placeholders)
- [ ] CRUD funciona en las 15 vistas (crear, editar, eliminar)
- [ ] Los campos calculados muestran valores reales (no ceros)
- [ ] Las relaciones entre tablas se navegan correctamente
- [ ] Mobile responsive en todas las vistas
- [ ] Preview deploy actualizado con todos los cambios
