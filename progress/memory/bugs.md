# REPORTE DE BUGS — Fase 1: Auditoría Frontend

> **Proyecto:** Gestión de Salones de Belleza
> **Fecha:** 2026-06-02
> **Modo:** SOLO REPORTE — sin modificar archivos
> **Base Airtable:** `app93Vhy56KrxNhwe`

---

## 🔍 Resumen Ejecutivo

Se analizaron **3 archivos fuente** (`static/index.html`, `static/api.js`, `contracts/AIRTABLE_CONTRACT.md`) y **8 vistas del frontend** desplegado en Surge.sh. Se identificaron **16 bugs**, clasificados:

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🔴 CRÍTICO | 3 | Datos incorrectos o faltantes — afectan uso real |
| 🟠 ALTO | 5 | Funcionalidad rota o incompleta |
| 🟡 MEDIO | 5 | Funcionalidad parcial o UX degradada |
| 🟢 BAJO | 3 | Mejoras cosméticas |

---

## 🔴 CRÍTICOS (3)

### CRIT-1: Citas — Linked Records sin Resolver (IDs crudos)

**Archivo:** `index.html:1121-1122, 1133-1134, 1223-1224, 1234-1235`
**Vistas afectadas:** Dashboard, Citas

**Síntoma:** Las citas muestran IDs de Airtable (`recMB7MOzw1xSaWvX`) en lugar de nombres reales de cliente y servicio.

**Causa raíz:** La API de Airtable devuelve campos `multipleRecordLinks` como array de IDs (`["recXXXX"]`). El frontend usa `r.fields['Cliente'][0]` directamente, mostrando el ID crudo. No hay pre-carga de lookup maps.

**Campos afectados:**
- `Cliente` → muestra `recXXXX…` en vez de "María García"
- `Servicio Solicitado` → muestra `recXXXX…` en vez de "Corte de pelo"
- `Profesional Asignado` → no se renderiza en ninguna vista

**Solución propuesta:**
```javascript
// Paso 1: Pre-cargar todas las tablas relacionadas al inicio
const [clientesData, serviciosData, empleadosData] = await Promise.all([
  getRecords('clientes', { maxRecords: 200 }),
  getRecords('servicios', { maxRecords: 100 }),
  getRecords('empleados', { maxRecords: 50 })
]);

// Paso 2: Construir lookup maps
const clienteMap = {};
clientesData.records.forEach(r => { clienteMap[r.id] = r.fields['Nombre'] || 'Sin nombre'; });
const servicioMap = {};
serviciosData.records.forEach(r => { servicioMap[r.id] = r.fields['Nombre del Servicio'] || 'Sin nombre'; });
const empleadoMap = {};
empleadosData.records.forEach(r => { empleadoMap[r.id] = (r.fields['Nombre'] || '') + ' ' + (r.fields['Apellido'] || ''); });

// Paso 3: Resolver IDs a nombres
function resolveLinked(arr, map) {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr.map(id => map[id] || id).join(', ');
}
```

---

### CRIT-2: Servicios — Valor del Servicio muestra $0

**Archivo:** `index.html:1258, 1271`
**Vista afectada:** Servicios

**Síntoma:** Todas las cards de servicios muestran `$0` como precio.

**Causa raíz:** `renderServicios()` pide el campo `'Valor del Servicio'`, pero este es un campo **fórmula** (calculado por Airtable). Si la fórmula no se ha ejecutado o el campo está vacío, devuelve `undefined` → `|| 0` → muestra $0.

El campo manual correcto es `'Valor Hora Hombre'` (campo #11 del contrato), que contiene el costo por hora ingresado manualmente.

**Solución:** Cambiar el `fields` array de `'Valor del Servicio'` a `'Valor Hora Hombre'` y actualizar `r.fields['Valor Hora Hombre']` en la card. Alternativamente, mantener `Valor del Servicio` como fallback y agregar `Valor Hora Hombre` si el primero es 0.

---

### CRIT-3: Dashboard — "Clientes Más Frecuentes" Placeholder Fijo

**Archivo:** `index.html:1145`
**Vista afectada:** Dashboard

**Síntoma:** La sección "🏆 Clientes Más Frecuentes" siempre muestra "Cargando datos históricos..." sin reemplazarse nunca con datos reales.

**Causa raíz:** Línea 1145 asigna el placeholder directamente y **nunca lo reemplaza** — no hay ninguna llamada asíncrona ni lógica posterior.

**Solución:** Contar frecuencia de clientes desde los datos de citas:
```javascript
// Después de obtener citasData en renderDashboard()
const clienteFrecuencia = {};
citas.forEach(r => {
  const cid = Array.isArray(r.fields['Cliente']) ? r.fields['Cliente'][0] : r.fields['Cliente'];
  if (cid) clienteFrecuencia[cid] = (clienteFrecuencia[cid] || 0) + 1;
});
const topClientes = Object.entries(clienteFrecuencia)
  .sort((a,b) => b[1]-a[1])
  .slice(0, 5);
// Renderizar con lookup del mapa de clientes
```

---

## 🟠 ALTOS (5)

### ALT-1: Clientes — Columnas Huérfanas en Tabla Desktop

**Archivo:** `index.html:1190, 1192`
**Vista afectada:** Clientes (desktop)

**Síntoma:** La tabla desktop de clientes tiene 11 `<th>` pero solo 8 `<td>` por fila. Las columnas "Última", "Total Gastado" y "Estado" aparecen duplicadas.

**Causa raíz:**
- `<thead>` (línea 1192): `Cliente | Teléfono | Email | Visitas | Última | Gasto | Estado | Acciones | Última | Total Gastado | Estado` = 11 columnas
- `<tr>` (línea 1190): `Nombre | Teléfono | Email | - | - | - | Estado | Acciones` = 8 columnas

**Solución:** Reducir `<thead>` a las columnas que realmente tienen datos:
```html
<th>Cliente</th><th>Teléfono</th><th>Email</th><th>Visitas</th><th>Última</th><th>Gasto</th><th>Estado</th><th>Acciones</th>
```
Y cargar los datos reales de visitas/última/gasto desde `Historial de Citas` y `Ventas y Cobros`.

---

### ALT-2: Caja — Filtro de Ingresos No Captura Todos los Tipos

**Archivo:** `index.html:1338-1339, 1439`
**Vistas afectadas:** Caja, Reportes

**Síntoma:** Los totales de ingresos en Caja y Reportes solo cuentan transacciones marcadas explícitamente como `'Ingresos'`. Se pierden los marcados como `'Cobro Servicio'`, `'Cobro Deuda'`, `'Venta Productos'`.

**Causa raíz:** El filtro `(r.fields['Ingresos'] || []).includes('Ingresos')` solo captura una de las 5 opciones del campo multiSelect. Las otras 3 opciones de ingreso quedan fuera del total.

**Opciones del campo `Ingresos` (contrato, campo #14):**
- `Ingresos` ✅ capturado
- `Cobro Servicio` ❌ no capturado
- `Cobro Deuda` ❌ no capturado
- `Venta Productos` ❌ no capturado
- `Egresos` → correctamente excluido

**Solución:** Cambiar el filtro para capturar todas las opciones de ingreso:
```javascript
const INCOME_TYPES = ['Ingresos', 'Cobro Servicio', 'Cobro Deuda', 'Venta Productos'];
const esIngreso = (r) => (r.fields['Ingresos'] || []).some(opt => INCOME_TYPES.includes(opt));
// O más simple: es ingreso todo lo que NO sea 'Egresos'
const esIngreso = (r) => !(r.fields['Ingresos'] || []).includes('Egresos');
```

---

### ALT-3: Caja — Solo Muestra Movimientos de Hoy

**Archivo:** `index.html:1333`

**Síntoma:** La vista Caja solo muestra transacciones del día actual. No hay forma de ver movimientos de días anteriores.

**Causa raíz:** `filterHoy = IS_SAME({Fecha de Venta}, TODAY(), "day")` — filtro duro que limita a hoy. No hay selector de fecha ni opción "ver todos".

**Solución:**
1. Agregar un selector de fecha o rango de fechas en la vista Caja
2. Por defecto mostrar "últimos 7 días" en lugar de solo hoy
3. Agregar botones "Hoy | Semana | Mes | Todo"

---

### ALT-4: FORM_CONFIGS — Campos Faltantes en Formularios de Creación

**Archivo:** `index.html:1477-1538`

**Síntoma:** Al presionar el botón "+" en varias vistas, el formulario modal no incluye todos los campos necesarios.

| Vista | FORM_CONFIG Key | Campos faltantes |
|-------|-----------------|------------------|
| **Citas** | `citas` | Cliente, Servicio Solicitado, Profesional Asignado (solo tiene Hora, Fecha, Estado, Notas) |
| **Productos** | `productos` | Foto del Producto, Proveedor, Marca, Descripción, Modo de Uso, Tipo de Uso, Código Barra |
| **Caja** | `ingresosEgresos` | Cliente, Servicio Realizado, Notas, Ingresos (tipo), Descripción de Egresos Variables |

**Impacto:** El usuario no puede crear una cita completa desde el frontend (no puede elegir cliente ni servicio). Similar para productos y transacciones.

**Solución:** Completar FORM_CONFIGS con todos los campos del contrato. Para linked records, usar `<select>` poblados vía API con los nombres de la tabla relacionada.

---

### ALT-5: Citas — Columna "Acciones" Duplicada

**Archivo:** `index.html:1240`

**Síntoma:** La tabla desktop de Citas tiene dos columnas "Acciones" idénticas.

**Causa raíz:** El `<thead>` termina con `<th>Acciones</th><th>Acciones</th>` en vez de solo un `<th>Acciones</th>`.

**Solución:** Eliminar el `<th>Acciones</th>` duplicado.

---

## 🟡 MEDIOS (5)

### MED-1: Productos — Categoría No Renderizada en la Card

**Archivo:** `index.html:1395, 1406-1413`

**Síntoma:** Aunque `renderProductos()` solicita `'Categoría del Producto'` en el array `fields`, este dato NO se muestra en la card del producto. Solo se ven: nombre, stock, precio.

**Causa raíz:** El campo se pide a la API pero no se usa en el template HTML de la card (línea 1413).

**Solución:** Agregar la categoría en la card:
```javascript
const cat = r.fields['Categoría del Producto'] || '';
return `...<div class="prod-cat">${escHtml(cat)}</div>...`;
```

---

### MED-2: Productos — Foto No Solicitada ni Renderizada

**Archivo:** `index.html:1395, 1413`

**Síntoma:** Los productos no muestran fotos, solo íconos genéricos (🧴💧✨...).

**Causa raíz:** `'Foto del Producto'` no está en el array `fields`. Tampoco hay lógica para renderizar `multipleAttachments` en la card.

**Solución:**
1. Agregar `'Foto del Producto'` al array `fields`
2. Procesar el attachment en la card:
```javascript
const foto = r.fields['Foto del Producto'];
const imgUrl = (foto && foto.length > 0) ? foto[0].url : null;
const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="${name}" class="prod-img">` : `<div class="prod-icon">${icon}</div>`;
```

---

### MED-3: Dashboard — No Distingue Vacío vs Error

**Archivo:** `index.html:1076-1151`

**Síntoma:** Cuando la API de Airtable devuelve 0 registros, los KPIs muestran `$0 | 0 | 0 | $0`. No hay forma de saber si es porque realmente no hay datos o porque la API falló silenciosamente.

**Causa raíz:** `renderDashboard()` no hace distinción entre "API exitosa con 0 registros" (negocio nuevo/sin datos hoy) y "API falló" (el catch captura el error pero ya se renderizaron los KPIs vacíos).

**Solución:**
1. Agregar un flag `dataLoaded` que solo se pone `true` si las llamadas API fueron exitosas
2. Si `dataLoaded && totalRecords === 0`, mostrar mensaje "Sin actividad hoy — ¡comienza agregando tu primera cita!"
3. Si `!dataLoaded`, mantener el estado de loading/error

---

### MED-4: Caja — Tabla Desktop con Columnas Sin Datos

**Archivo:** `index.html:1375, 1377`

**Síntoma:** La tabla desktop de Caja tiene columnas "Concepto" y "Cliente/Prov." que siempre muestran `-` (sin datos).

**Causa raíz:** Las celdas están hardcodeadas como `<td>-</td><td>-</td>` (línea 1375). Los datos existen en Airtable pero no se mapean.

**Solución:** Mapear campos del contrato a las columnas:
- Concepto → `r.fields['Servicio Realizado']` (nombre del servicio) o `r.fields['Notas']`
- Cliente/Prov. → `r.fields['Cliente']` (nombre del cliente)

---

### MED-5: Reportes — Gráfico Placeholder, Sin Datos Reales

**Archivo:** `index.html:1453, 1460`

**Síntoma:** La vista Reportes muestra KPIs del mes (correctos si el filtro funciona) pero el gráfico y "Servicios Más Vendidos" son placeholders fijos:
- "Calculando desde datos del mes..." (línea 1453)
- "📊 Ingresos vs Gastos — Últimos 30 días" (línea 1460)

**Solución:**
1. Calcular servicios más frecuentes desde los datos de citas del mes
2. Renderizar un chart simple con canvas o SVG inline para ingresos vs gastos

---

## 🟢 BAJOS (3)

### BAJ-1: Productos — Stock Muestra "0" en Lugar de Dato Real

**Archivo:** `index.html:1408`

**Síntoma:** Se observó en el frontend desplegado que stock muestra "1" para todos los productos (posiblemente correcto si es el dato real en Airtable).

**Nota:** Si los datos en Airtable tienen `Nivel de Stock = 1`, el frontend los muestra correctamente. Si hay productos con stock diferente, se mostrarían correctamente. Posible falso positivo — verificar los datos en Airtable.

---

### BAJ-2: Navegación — Sin Indicador de Carga de Datos

**Archivo:** `index.html:1751-1768`

**Síntoma:** Al cambiar entre pestañas, no hay feedback visual de que se están cargando datos. Solo se muestra la vista anterior hasta que la nueva carga termina.

**Sugerencia:** Mostrar un skeleton loader al inicio de `navigateTo()` antes de llamar al renderer, en lugar de dentro de cada render function individual.

---

### BAJ-3: Mensaje en Consola con Dato Hardcodeado

**Archivo:** `index.html:1809`

```javascript
console.log('🏪 Salón Pro — Conectado a Airtable (app93Vhy56KrxNhwe)');
```

**Riesgo:** Expone el ID de la base Airtable en la consola del navegador (visible para cualquier usuario). Riesgo bajo pero evitable.

**Sugerencia:** Usar un nombre genérico: `'🏪 Salón Pro — Conectado'`.

---

## 📊 Matriz Backend ↔ Frontend

| Tabla Airtable | Campos en Contrato | Campos en Frontend | Función Render | Estado |
|---------------|-------------------|-------------------|----------------|--------|
| **CLIENTES** (13) | Nombre, Email, Teléfono, Dirección, Preferencias… | Nombre, Teléfono, Email, Dirección, Preferencias | `renderClientes` | 🟡 Parcial (columnas desktop rotas) |
| **CITAS** (11) | Hora, Fecha, Cliente🔗, Servicio🔗, Profesional🔗, Estado, Notas… | Hora, Fecha, Cliente, Servicio, Estado | `renderCitas` | 🔴 IDs crudos |
| **SERVICIOS** (22) | Nombre, Valor Hora Hombre, Duración, Descripción… | Nombre, Valor del Servicio❌, Duración | `renderServicios` | 🔴 Precio $0 |
| **EMPLEADOS** (16) | Nombre, Apellido, Teléfono, Email, Especialidad… | Nombre, Apellido, Teléfono, Email, Especialidad | `renderEmpleados` | ✅ Funcional |
| **PRODUCTOS** (26) | Nombre, Precio, Stock, Foto, Categoría, Marca, Proveedor… | Nombre, Precio, Stock, (Categoría no renderizada) | `renderProductos` | 🟡 Falta Categoría y Foto |
| **INGRESOS/EGRESOS** (26) | Fecha, Cliente🔗, Servicio🔗, Medio Pago, Monto Cobrado, Ingresos(select), Egresos Variables… | Fecha, Monto Cobrado, Ingresos, Egresos Variables | `renderCaja` | 🟠 Filtro incompleto |
| **DASHBOARD** (KPIs) | — (vista compuesta) | Ingresos Hoy, Clientes Hoy, Citas Hoy, Ticket Promedio | `renderDashboard` | 🟡 Placeholder fijo |
| **REPORTES** | — (vista compuesta) | Ingresos Mes, Gastos Mes, Margen, Clientes Activos | `renderReportes` | 🟡 Gráficos placeholder |
| **PROVEEDORES** | Nombre, Contacto, Teléfono, Email, Dirección… | ❌ Sin render | ❌ No implementado | ⬜ Pendiente |
| **PROMOCIONES** | Nombre, Descripción, Fechas, Descuento… | ❌ Sin render | ❌ No implementado | ⬜ Pendiente |
| **AGENDA** | Hora, Fecha, Empleado🔗, Servicio🔗, Estado… | ❌ Sin render | ❌ No implementado | ⬜ Pendiente |
| **INVENTARIO** | Ubicación, Producto🔗, Stock… | ❌ Sin render | ❌ No implementado | ⬜ Pendiente |

---

## 🛠️ Plan de Corrección Recomendado

### Fase 1A: Correcciones Inmediatas (CRIT + ALT)
1. **Linked records** → Implementar pre-carga de lookup maps al iniciar la app
2. **Servicios precio** → Cambiar `Valor del Servicio` → `Valor Hora Hombre`
3. **Clientes columnas** → Corregir `<thead>` a 8 columnas
4. **Caja filtro ingresos** → Usar exclusión de 'Egresos' en vez de inclusión de 'Ingresos'
5. **FORM_CONFIGS** → Completar campos faltantes (linked records como selects)
6. **Dashboard frecuentes** → Calcular desde datos de citas
7. **Caja solo hoy** → Cambiar a últimos 7 días + selector de fecha

### Fase 1B: Mejoras (MED + BAJ)
8. Productos: renderizar Categoría y Foto
9. Dashboard: distinguir vacío vs error
10. Caja: mapear columnas Concepto/Cliente
11. Reportes: gráficos reales
12. Stock: verificar nombres de campo correctos
13. Consola: limpiar datos sensibles

---

## 📋 Apéndice: Estado Post-Correcciones (Fase Maestra Completa)

> Actualizado: 2026-06-02 — Después de SALON-010 (correcciones post-QA), SALON-010b (cache fix) y SALON-011 (token fix).

### Correcciones Aplicadas

| ID | Bug Original | Fix | Estado |
|----|-------------|-----|--------|
| — | Token Airtable hardcodeado en `api.js` | SALON-011: Token movido a variable global `__AIRTABLE_TOKEN__` | ✅ Corregido |
| — | Cache inexistente (cada navegación llamaba API) | SALON-010b: localStorage cache + 5-min TTL + invalidación por tabla | ✅ Corregido |

### Bugs No Corregidos del Reporte Original

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| CRIT-1 | 🔴 Crítico | Linked records muestran IDs crudos | ⚠️ Sin corregir |
| CRIT-2 | 🔴 Crítico | Valor del Servicio = $0 | ⚠️ Sin corregir |
| CRIT-3 | 🔴 Crítico | Dashboard "Clientes Más Frecuentes" placeholder | ⚠️ Sin corregir |
| ALT-1 | 🟠 Alto | Clientes columnas desktop huérfanas | ⚠️ Sin corregir |
| ALT-2 | 🟠 Alto | Caja filtro ingresos incompleto | ⚠️ Sin corregir |
| ALT-3 | 🟠 Alto | Caja solo muestra hoy | ⚠️ Sin corregir |
| ALT-4 | 🟠 Alto | FORM_CONFIGS campos faltantes | ⚠️ Sin corregir |
| ALT-5 | 🟠 Alto | Citas columna Acciones duplicada | ⚠️ Sin corregir |
| MED-1 | 🟡 Medio | Productos categoría no renderizada | ⚠️ Sin corregir |
| MED-2 | 🟡 Medio | Productos foto no solicitada | ⚠️ Sin corregir |
| MED-3 | 🟡 Medio | Dashboard no distingue vacío vs error | ⚠️ Sin corregir |
| MED-4 | 🟡 Medio | Caja columnas sin datos | ⚠️ Sin corregir |
| MED-5 | 🟡 Medio | Reportes gráfico placeholder | ⚠️ Sin corregir |
| BAJ-1 | 🟢 Bajo | Stock muestra valor fijo | ⚠️ Sin corregir |
| BAJ-2 | 🟢 Bajo | Sin indicador de carga | ⚠️ Sin corregir |
| BAJ-3 | 🟢 Bajo | Mensaje consola con dato base ID | ⚠️ Sin corregir |

### Bugs Adicionales Identificados en Fase Maestra

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| CRIT-2a | 🔴 Crítico | `Valor del Servicio` = $0 en Airtable (fórmula requiere datos poblados) | ⚠️ Pendiente de datos |
| BACK-1 | 🟠 Alto | Rate limit (5 req/s) puede causar 429 en vistas que hacen múltiples fetches | ⚠️ Mitigado con cache |
| BACK-2 | 🟡 Medio | Fórmula `TOTAL NETO` usa `AVERAGE()` (error conceptual, no matemático) | ⚠️ Sin corregir |

### Notas de Implementación

- El **cache fix (SALON-010b)** reduce significativamente los 429s, pero no los elimina — el dashboard carga 3 tablas simultáneamente.
- El **token fix (SALON-011)** mejora la seguridad del código fuente, pero el deploy a Surge sigue exponiendo el token en el HTML final.
- Los bugs **CRIT-1, CRIT-2, CRIT-3** son los de mayor impacto para la UX. Los bugs **ALT-1 a ALT-5** afectan funcionalidad pero no bloquean el uso básico del sistema.
- El deploy real funciona a pesar del falso negativo de Surge (DE-001).

---

*Reporte generado por Docs / Progress Manager — Fase Maestra Completa.*

---

## 2026-06-24 — FIXED: `/api/clientes/me/citas` retornaba `total: 0`

**Estado:** Cerrado en commit `2678c30`.

**Causa raíz:** Airtable REST devuelve linked records como IDs (`rec...`). El backend comparaba el nombre visible del cliente contra el campo `CLIENTE` de CITAS, que en realidad venía como `['recE9NNLvCgpOFxZU']`.

**Fix:** `backend/routes/clientes.py` ahora normaliza linked-record fields y filtra por el CLIENTE record ID real. También se reemplazaron chequeos de conflicto dependientes de `page_size`/fórmulas frágiles por validación contra CITAS activas.

**QA:** Railway `/api/clientes/me/citas` responde `200` con `total=6`, `proximas=3`, `historial=3` para el usuario QA. Cancelar/reprogramar pasó QA mutante con fixtures restaurados.
