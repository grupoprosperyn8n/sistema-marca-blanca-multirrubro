# QA Functional Report — Gestión de Salón de Belleza

**Fecha:** 2026-06-02
**QA Agent:** Vision Analyst (OpenAI) — Rol: 7-QA Functional Agent
**URL:** https://gestion-desalones-de-belleza.surge.sh
**Browser:** Headless Chromium

---

## Resumen

| Metrica | Resultado |
|---|---|
| Vistas funcionales | 18/18 OK |
| Errores JS en consola | 0 |
| Diseno responsive | OK Mobile First (320px+), breakpoints 768px/1024px |
| CRUD operativo | OK Crear, Editar, Eliminar disponibles en todas las vistas |
| Bugs encontrados | 5 (2 criticos, 1 mayor, 2 menores) |

---

## Vistas Verificadas

| # | Vista | Estado | Observaciones |
|---|---|---|---|
| 1 | Dashboard | OK | KPIs cargan, proximas citas, clientes frecuentes |
| 2 | Clientes | OK | Modal creacion, cards, tabla |
| 3 | Citas | OK | CRUD visible |
| 4 | Servicios | OK | 19 servicios con editar/eliminar |
| 5 | Empleados | OK | Datos cargan |
| 6 | Caja | OK | Transacciones OK |
| 7 | Productos | OK | 8 productos |
| 8 | Reportes | OK | Sin reportes este mes (esperado) |
| 9 | Proveedores | OK | CRUD OK |
| 10 | Inventario | OK | 13 items con editar/eliminar |
| 11 | Promociones | OK | 10 promos con estados Activa/Inactiva |
| 12 | Agenda | OK | 11 slots con estados |
| 13 | Capacitaciones | OK | 11 programas |
| 14 | Ficha Servicios | OK | 8 fichas |
| 15 | Costos Fijos | OK | 7 costos, total $1.292.000 |
| 16 | Resumen Costos | OK | Margen: -$1.231.400 |
| 17 | Ingresos/Egresos | OK | 5 transacciones, saldo $60.600 |

---

## Bugs Encontrados

### CRITICO 1 - Porcentajes de descuento incorrectos en Promociones
**Severidad:** Critica
**Vista:** Promociones
**Descripcion:** Las promociones recientes muestran descuentos con valores inflados (2000%, 3000%, 2500%, 5000%) en lugar de valores razonables (20%, 30%, 25%, 50%).
**Causa probable:** El campo Descuento en Airtable almacenado como entero pero interpretado directamente. Datos recientes podrian tener el valor multiplicado por 100.
**Ejemplos:** Verano Refresh=2000% (deberia ~20%), Color+Tratamiento=3000% (deberia ~30%), 2x1 Cortes=5000% (deberia ~50%), Navidad Glam=30% (correcto)

### CRITICO 2 - Registro vacio en tabla de Agenda
**Severidad:** Critica
**Vista:** Agenda
**Descripcion:** Primera fila de la tabla con valores "-" en todos los campos pero con botones de editar/eliminar.
**Causa probable:** Registro en Airtable con campos vacios o nulos.

### MAYOR 3 - Duplicacion de Proximas Citas en Dashboard
**Severidad:** Mayor
**Vista:** Dashboard
**Descripcion:** Dos secciones con el mismo heading "Proximas Citas" - una en cards y otra en tabla, ambas mostrando "No hay citas para hoy".
**Causa probable:** Dos componentes renderizando la misma seccion.

### MENOR 4 - Nota de ALQUILER truncada
**Severidad:** Menor
**Vista:** Costos Fijos
**Descripcion:** Registro "ALQUILER" con nota "P" (truncada). Existe "Alquiler local" similar.
**Causa probable:** Campo de notas truncado en Airtable.

### MENOR 5 - Registro sin nombre en Inventario
**Severidad:** Menor
**Vista:** Inventario
**Descripcion:** Quinta fila con nombre vacio "-" y datos vacios.
**Causa probable:** Registro en Airtable sin nombre.

---

## Consola JS

**Estado:** OK - sin errores, sin warnings, sin 404s

---

## Diseno Responsive

**Breakpoints en CSS:** 320px-767px (mobile, hamburger+bottom-nav), 768px-1023px (tablet, grid 2 cols), 1024px+ (desktop, sidebar visible, grid 4 cols)

---

## Recomendaciones

1. **CRITICO:** Revisar parsing de Descuento en Promociones - dividir entre 100 los valores recientes.
2. **CRITICO:** Eliminar registro vacio en Agenda (fila 1 con guiones).
3. **MAYOR:** Unificar seccion "Proximas Citas" en Dashboard.
4. **MENOR:** Completar nota truncada de ALQUILER en Costos Fijos.
5. **MENOR:** Eliminar producto sin nombre en Inventario.
