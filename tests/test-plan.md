# Plan de Testing — Gestión de Salones de Belleza

**Base:** `app93Vhy56KrxNhwe` | **14 tablas** | **8 vistas frontend**  
**Fecha:** 2026-06-02 | **Autor:** QA / Verification Agent

---

## Índice

1. [Precondiciones Globales](#precondiciones-globales)
2. [Vista 1 — Dashboard](#vista-1--dashboard)
3. [Vista 2 — Clientes](#vista-2--clientes)
4. [Vista 3 — Citas](#vista-3--citas)
5. [Vista 4 — Servicios](#vista-4--servicios)
6. [Vista 5 — Empleados](#vista-5--empleados)
7. [Vista 6 — Caja (Ingresos/Egresos)](#vista-6--caja-ingresosegresos)
8. [Vista 7 — Productos](#vista-7--productos)
9. [Vista 8 — Reportes](#vista-8--reportes)
10. [Edge Cases Transversales](#edge-cases-transversales)
11. [Mobile First — Checklist Global](#mobile-first--checklist-global)
12. [Validación de Datos](#validacion-de-datos)

---

## Precondiciones Globales

- [ ] Token PAT válido con scopes `data.records:read` y `data.records:write`
- [ ] Base ID `app93Vhy56KrxNhwe` accesible desde el frontend
- [ ] Conexión a Internet estable (> 1 Mbps)
- [ ] Navegador compatible: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- [ ] `localStorage` habilitado (para cache)
- [ ] Sin extensiones bloqueadoras de CORS/fetch

---

## Vista 1 — Dashboard

**Ruta:** `#page-dashboard` | **Archivo:** `static/index.html` (línea 809) | **API:** `Dashboard.getKPIs()`

### Carga Inicial

- [ ] Al navegar a Dashboard, se muestra el estado de carga (loading spinner/skeleton)
- [ ] Los KPIs se renderizan correctamente: clientes totales, citas hoy, citas pendientes, facturado mes, cobrado mes, pendientes de cobro
- [ ] Las citas del día aparecen en la sección mobile (`#dashboard-citas-mobile`)
- [ ] La tabla de citas del día se renderiza en `#dashboard-table-wrapper`
- [ ] El placeholder del chart aparece (`#dashboard-chart`)

### KPIs

- [ ] Cada KPI muestra ícono, label, valor numérico
- [ ] Valores en cero se muestran como `$0` o `0` (no vacío ni `NaN`)
- [ ] El formato monetario usa separadores de miles (ej: `$12,500`)
- [ ] KPIs se actualizan al recargar la página
- [ ] Clientes frecuentes se listan correctamente (`#dashboard-frecuentes`)

### Edge Cases

- [ ] **Sin datos:** KPIs muestran 0/cero, sección citas muestra "Sin citas hoy"
- [ ] **API caída:** Se muestra mensaje de error descriptivo (no pantalla en blanco)
- [ ] **Muchos registros (>100):** La tabla se renderiza sin freeze del navegador
- [ ] **Citas sin cliente/servicio:** Se muestra "-" en lugar de undefined/null
- [ ] **Chart placeholder:** Visible aunque no tenga datos

---

## Vista 2 — Clientes

**Ruta:** `#page-clientes` | **API:** `Clientes.getAll()`, `Clientes.create()`, `Clientes.update()`, `Clientes.remove()`, `Clientes.search()`

### Lectura (GET)

- [ ] Lista de clientes se carga al entrar a la vista
- [ ] Badge muestra cantidad total (`"N clientes"`)
- [ ] Cada fila/tarjeta muestra: Nombre, Email, Teléfono, acciones
- [ ] Orden por defecto: `Creación` descendente

### Búsqueda

- [ ] Búsqueda por nombre funciona (debounce de 300ms)
- [ ] Búsqueda case-insensitive
- [ ] Sin resultados: mensaje "No se encontraron clientes"
- [ ] Búsqueda con string vacío muestra todos los clientes

### Creación (POST)

- [ ] Modal/formulario se abre con FAB (+)
- [ ] Campos requeridos marcados (Nombre obligatorio)
- [ ] Guardar correctamente dispara `Clientes.create()` con los fields correctos
- [ ] Después de guardar: cache se invalida, lista se refresca
- [ ] Toast de confirmación aparece ("Cliente creado")

### Edición (PATCH)

- [ ] Botón editar abre modal con datos precargados
- [ ] Modificar campos y guardar dispara `Clientes.update(recordId, fields)`
- [ ] Cancelar cierra modal sin cambios
- [ ] Cache se invalida tras editar

### Eliminación (DELETE)

- [ ] Botón eliminar muestra confirmación (¿Estás seguro?)
- [ ] Confirmar dispara `Clientes.remove(recordId)`
- [ ] Toast de confirmación ("Cliente eliminado")
- [ ] Cancelar NO elimina
- [ ] Lista se refresca después de eliminar

### Edge Cases

- [ ] **Sin clientes:** Mensaje "No hay clientes registrados"
- [ ] **Token inválido (401):** Error "Airtable 401: ..." mostrado al usuario
- [ ] **Rate limit (429):** Se maneja con retry, no crashea
- [ ] **Teléfono/Email vacíos:** Renderiza "-" en lugar de undefined
- [ ] **Campos linked records (Preferencias de Servicios):** Se muestran correctamente (no raw record IDs)

---

## Vista 3 — Citas

**Ruta:** `#page-citas` | **API:** `Citas.getAll()`, `Citas.create()`, `Citas.update()`, `Citas.remove()`

### Lectura (GET)

- [ ] Citas de hoy se cargan en vista mobile (`#citas-mobile`)
- [ ] Citas de los próximos 7 días se cargan en `#citas-semana-mobile` y `#citas-semana-table`
- [ ] Tabla de citas muestra: Hora, Cliente, Servicio, Empleado, Duración, Estado, Acciones
- [ ] Badge muestra contador
- [ ] Colores de estado correctos: Programada (warning), Confirmada (success), Cancelada (danger), Llegó (accent)

### Filtros (del PRODUCT_CONTRACT)

- [ ] **Citas del día:** `filterByFormula=IS_SAME({Fecha de la Cita}, TODAY(), "day")`
- [ ] **Citas programadas:** `filterByFormula={Estado de la Cita} = "Programada"`
- [ ] **Próximos 7 días:** `filterByFormula=AND({Fecha de la Cita} >= TODAY(), {Fecha de la Cita} <= DATEADD(TODAY(), 7, "days"))`

### Creación

- [ ] Modal con campos: Hora, Fecha, Estado, Cliente (linked record), Servicio (linked record), Profesional (linked record)
- [ ] Linked records se envían como array de record IDs `["recXXX"]`
- [ ] Guardar dispara `Citas.create()` con conversión `clienteRecId` → `Cliente`
- [ ] Cache se invalida

### Edición

- [ ] Modal con datos precargados
- [ ] `PATCH /Citas/{recordId}` con fields actualizados
- [ ] Linked records editables

### Eliminación

- [ ] Confirmación antes de borrar
- [ ] `DELETE /Citas/{recordId}`
- [ ] Lista se refresca

### Edge Cases

- [ ] **Sin citas hoy:** Mensaje "No hay citas para hoy"
- [ ] **Cita sin cliente:** Se muestra "-" en el campo Cliente
- [ ] **Hora vacía:** Se muestra "--:--"
- [ ] **Fechas en zona horaria incorrecta:** Verificar que ISO 8601 sea correcto
- [ ] **Estado desconocido:** No rompe el badge de color (fallback a color por defecto)

---

## Vista 4 — Servicios

**Ruta:** `#page-servicios` | **API:** `Servicios.getAll()`, `Servicios.create()`, `Servicios.update()`, `Servicios.remove()`

### Lectura

- [ ] Grid de servicios se carga en `#servicios-grid`
- [ ] Badge muestra cantidad
- [ ] Cada tarjeta: ícono, nombre, precio, duración, acciones
- [ ] Orden: `Nombre del Servicio` ascendente
- [ ] Máximo 50 registros

### CRUD

- [ ] **Crear:** Modal con Nombre, Duración, Valor Hora Hombre
- [ ] **Editar:** Modal precargado, actualiza servicio
- [ ] **Eliminar:** Confirmación + DELETE
- [ ] Cache se invalida en cada mutación

### Edge Cases

- [ ] **Sin servicios:** Mensaje "No hay servicios registrados"
- [ ] **Precio en 0:** Se muestra `$0.00`
- [ ] **Nombre duplicado:** Airtable permite duplicados (no es unique key)
- [ ] **Duración 0:** Muestra "0 min" (aceptable)

---

## Vista 5 — Empleados

**Ruta:** `#page-empleados` | **API:** `Empleados.getAll()`, `Empleados.create()`, `Empleados.update()`, `Empleados.remove()`

### Lectura

- [ ] Grid de empleados (`#empleados-grid`) se carga
- [ ] Badge: `"N activos"`
- [ ] Cada tarjeta: iniciales (avatar), nombre completo, especialidad, estado "Activo", acciones
- [ ] Orden: `Nombre` ascendente

### CRUD

- [ ] **Crear:** Modal con Nombre, Apellido, Teléfono, Correo Electrónico, Especialidad (multipleSelects)
- [ ] **Editar:** Modal precargado
- [ ] **Eliminar:** Confirmación + DELETE

### Edge Cases

- [ ] **Sin empleados:** "No hay empleados registrados"
- [ ] **Sin apellido:** Solo muestra nombre
- [ ] **Especialidad como array:** Se muestra el primer valor
- [ ] **Avatar fallback initials:** Se generan correctamente incluso con nombres cortos/largos

---

## Vista 6 — Caja (Ingresos/Egresos)

**Ruta:** `#page-caja` | **API:** `Caja.getAll()`, `Caja.create()`, `Caja.update()`, `Caja.remove()`

### Lectura

- [ ] KPIs se cargan: Ingresos Hoy, Egresos Hoy, Saldo Neto
- [ ] Badge muestra total de hoy
- [ ] Lista mobile de movimientos del día (`#caja-mobile`)
- [ ] Tabla de movimientos (`#caja-table-wrapper`): Fecha, Concepto, Cliente/Prov, Tipo, Monto
- [ ] Saldo neto = Ingresos - Egresos
- [ ] Colores: Ingresos (verde), Egresos (rojo)

### Filtros (del PRODUCT_CONTRACT)

- [ ] Ingresos del mes: `filterByFormula=IS_SAME({Fecha de Venta}, TODAY(), "month")`
- [ ] Cobros pendientes: `filterByFormula={Pagado?} = FALSE()`
- [ ] Pagos completos: `filterByFormula={Saldo Pendiente} = 0`

### CRUD

- [ ] **Crear:** Modal con Fecha, Medio de Pago (select: Efectivo/Transferencia/Tarjeta/Mercado Pago), Monto, Pagado? (checkbox), Ingresos/Egresos (multipleSelects)
- [ ] **Editar:** Modal precargado
- [ ] **Eliminar:** Confirmación + DELETE

### Edge Cases

- [ ] **Sin movimientos hoy:** "No hay movimientos hoy"
- [ ] **Saldo negativo:** Se muestra en rojo
- [ ] **Monto Cobrado > Total Venta:** Saldo Pendiente negativo (lo maneja Airtable)
- [ ] **Egresos sin descripción:** Se muestra "-"
- [ ] **Registros con {Pagado?}=false:** Aparecen en filtro pendientes

---

## Vista 7 — Productos

**Ruta:** `#page-productos` | **API:** `Productos.getAll()`, `Productos.create()`, `Productos.update()`, `Productos.remove()`

### Lectura

- [ ] Grid de productos (`#productos-grid`) se carga
- [ ] Badge: `"N productos"`
- [ ] Cada tarjeta: ícono, nombre, nivel de stock (con color), precio, acciones
- [ ] Stock ≤ 5: fondo rojo claro, texto rojo
- [ ] Stock > 5: fondo verde claro
- [ ] Orden: `Nivel de Stock` ascendente (bajo stock primero)

### Filtros (del PRODUCT_CONTRACT)

- [ ] Stock bajo: `filterByFormula={Nivel de Stock} < 5`
- [ ] Por categoría: `filterByFormula={Categoría del Producto} = "Coloracion"`

### CRUD

- [ ] **Crear:** Modal con Nombre, Stock, Precio, Costo Envío, Rendimiento, Categoría
- [ ] **Editar:** Modal precargado
- [ ] **Eliminar:** Confirmación + DELETE

### Edge Cases

- [ ] **Sin productos:** "No hay productos registrados"
- [ ] **Stock en 0:** Se muestra "Stock: 0" con color rojo
- [ ] **Precio sin decimales:** Se formatea correctamente (ej: 3200 → $3,200.00)
- [ ] **Rendimiento 0:** Muestra "0"

---

## Vista 8 — Reportes

**Ruta:** `#page-reportes` | **API:** `Reportes.getAll()`

### Lectura

- [ ] KPIs de reportes se cargan (`#reportes-kpis`)
- [ ] Chart placeholder visible (`#reportes-chart`)
- [ ] Servicios más vendidos (`#reportes-servicios-mobile`)
- [ ] Tabla de reportes (`#reportes-table-wrapper`)
- [ ] Empleados del mes (`#reportes-empleados-mobile`)
- [ ] Badge: "Este mes"

### Filtros

- [ ] Reportes del mes: `filterByFormula=IS_SAME({Fecha Creación}, TODAY(), "month")`

### Edge Cases

- [ ] **Sin reportes:** Mensaje "No hay reportes este mes"
- [ ] **Chart vacío:** Placeholder no rompe layout
- [ ] **Solo lectura:** No hay botones de crear/editar/eliminar en Reportes
- [ ] **Fechas incorrectas:** Verificar filtro IS_SAME con timezone

---

## Edge Cases Transversales

### Sin Conexión / API Caída

- [ ] Todas las vistas muestran mensaje de error cuando Airtable no responde
- [ ] El mensaje de error es legible (no un raw stack trace)
- [ ] La app no crashea — el usuario puede navegar entre vistas
- [ ] Los errores se loguean a `console.error`

### Token Inválido (401)

- [ ] Mensaje: "Airtable 401: ..." se muestra en cada vista
- [ ] El frontend no intenta reintentar infinitamente
- [ ] Se puede navegar entre vistas (no hay bloqueo global)

### Rate Limit (429)

- [ ] El rate limiter en `api.js` maneja 5 req/s (token bucket)
- [ ] Respuesta 429: espera `Retry-After` segundos, reintenta
- [ ] Máximo 3 reintentos antes de lanzar error
- [ ] Tras 3 fallos, se muestra error al usuario

### Cache

- [ ] Datos cacheados por 5 minutos (`cacheTTL`)
- [ ] Cache se invalida después de POST/PATCH/DELETE
- [ ] `localStorage` lleno: no crashea (catch en `cache.set`)
- [ ] Cache se limpia al hacer `cache.clearAll()`

### Fechas

- [ ] Fechas en formato ISO 8601 (`YYYY-MM-DD`)
- [ ] IS_SAME funciona correctamente con TODAY()
- [ ] No se envían fechas inválidas a Airtable

### Linked Records

- [ ] Se envían como array de strings: `["recXXXXXXXXXXXXXX"]`
- [ ] Los lookup/rollup son read-only — no se incluyen en POST/PATCH
- [ ] autoNumber (`Nº de Venta`) no se envía en POST (es auto-generado)
- [ ] Campos `createdTime` / `lastModifiedTime` no se incluyen en POST/PATCH
- [ ] `multipleSelects` envía array de strings exactos (case-sensitive)
- [ ] `checkbox` envía `true`/`false` (no `1`/`0`)

---

## Mobile First — Checklist Global

### Bottom Navigation

- [ ] 4 botones visibles en bottom nav: Dashboard, Clientes, Citas, Servicios + "Más"
- [ ] Botón activo resaltado con color accent
- [ ] Touch target ≥ 44px (altura) y ≥ 56px (ancho mínimo)
- [ ] Tap feedback visual al presionar
- [ ] Safe area inset en iOS (env(safe-area-inset-bottom))

### Menú "Más" (Overlay)

- [ ] Al tocar "⋯" se abre overlay desde abajo
- [ ] Opciones: Empleados, Caja, Productos, Reportes
- [ ] Tap en opción cierra overlay y navega a la vista
- [ ] Tap en backdrop cierra overlay
- [ ] Overlay no excede 50vh con scroll interno

### Sidebar (Desktop ≥ 1024px)

- [ ] Sidebar visible con todas las vistas
- [ ] Al hacer clic en sidebar-btn, se navega y se marca active
- [ ] Sidebar no se superpone con contenido
- [ ] "Salón Pro" como brand

### FAB (Floating Action Button)

- [ ] FAB visible en vistas que soportan creación
- [ ] Posición: abajo a la derecha (sobre bottom nav)
- [ ] Touch target ≥ 56px
- [ ] Al hacer tap, abre modal de creación para la vista actual

### Modal (Full-Screen Mobile)

- [ ] Modal ocupa toda la pantalla en mobile
- [ ] Header con título + botón cerrar (✕)
- [ ] Scroll si el formulario es largo
- [ ] Backdrop clickable: cierra modal
- [ ] Keyboard no rompe layout (viewport se ajusta)
- [ ] Inputs tienen `type` correcto (email, tel, number)

### Responsive

- [ ] 320px (iPhone SE): todo legible, sin overflow horizontal
- [ ] 375px (iPhone): layout correcto
- [ ] 768px (iPad): columnas de grid aumentan
- [ ] 1024px+: sidebar visible, bottom nav oculto
- [ ] Grids adaptativos (2 cols mobile → 3-4 cols desktop)

---

## Validación de Datos

### Campos Requeridos por Vista

| Vista | Campo Requerido | Tipo |
|-------|----------------|------|
| Clientes | Nombre | `singleLineText` |
| Citas | Fecha de la Cita | `date` |
| Citas | Hora de la Cita | `date` (hora) |
| Servicios | Nombre del Servicio | `singleLineText` |
| Empleados | Nombre | `singleLineText` |
| Caja | Fecha de Venta | `date` |
| Caja | Medio de Pago | `singleSelect` |
| Productos | Nombre del Producto | `singleLineText` |

### Formatos

- [ ] **Email:** Validación de formato `user@domain.com`
- [ ] **Teléfono:** Acepta `+54 11 5555-0101` (formato argentino)
- [ ] **Precios/Montos:** Números positivos, formato `$X,XXX.XX`
- [ ] **Fechas:** Solo formato `YYYY-MM-DD`
- [ ] **Stock:** Entero ≥ 0
- [ ] **Duración:** Entero positivo (minutos)
- [ ] **Rendimiento:** Entero positivo

### Prevención de Errores Comunes

- [ ] No se permiten envíos con campos vacíos requeridos
- [ ] Los campos numéricos rechazan texto no numérico
- [ ] maxRecords respeta el límite de Airtable (100 por request)
- [ ] Nombres de tablas URL-encoded correctamente: `INGRESOS%2FEGRESOS`, `Costos%20Fijos%20Peluquer%C3%ADa`
- [ ] `filterByFormula` usa nombres de campo (no field IDs) en el frontend

---

## Resumen de Pruebas

| Vista | # Checkboxes | CRUD | Filtros | Edge Cases |
|-------|:-----------:|:----:|:-------:|:----------:|
| Dashboard | 10 | — | — | 4 |
| Clientes | 16 | ✅ | Búsqueda | 5 |
| Citas | 18 | ✅ | 3 filtros | 5 |
| Servicios | 12 | ✅ | — | 4 |
| Empleados | 12 | ✅ | — | 4 |
| Caja | 18 | ✅ | 3 filtros | 5 |
| Productos | 15 | ✅ | 2 filtros | 4 |
| Reportes | 9 | Solo lectura | 1 filtro | 4 |
| **Transversales** | **18** | — | — | — |
| **Mobile First** | **19** | — | — | — |
| **Validación** | **22** | — | — | — |
| **Total** | **≈ 169** | | | |

---

*Documento generado desde `PRODUCT_CONTRACT.md` (field IDs reales, 15 tablas, filtros) y `api.js` (CRUD modules).*
