# backend-fixes.md — Correcciones Necesarias del Backend Airtable

> **Proyecto:** Gestión de Salones de Belleza
> **Fecha:** 2026-06-02
> **Base:** `app93Vhy56KrxNhwe` | 15 tablas | 210 campos
> **Fuente de verdad:** API Metadata de Airtable (verificado vía REST)

---

## 🔍 Resumen Ejecutivo

Se verificó la metadata real de Airtable contra:
- `contracts/AIRTABLE_CONTRACT.md` (contrato de diseño)
- `static/index.html` FORM_CONFIGS (formularios frontend)
- `static/api.js` TABLES (IDs de tablas)

**Resultado:** api.js tiene los IDs correctos ✅. El contrato está mayormente alineado pero tiene discrepancias de tipos de campo. Los FORM_CONFIGS del frontend tienen **discrepancias críticas** en opciones de singleSelect que rompen la creación de registros.

---

## 📊 Tabla de IDs Reales (Verificados vía API)

| # | Tabla | ID Real | api.js | Estado |
|---|-------|---------|--------|--------|
| 1 | Clientes | `tblzRwPeOVTdsvt5g` | ✅ Match | OK |
| 2 | Citas | `tblZNB7HfD3OAGL9x` | ✅ Match | OK |
| 3 | Servicios | `tblIDRFHpLoQpB9JH` | ✅ Match | OK |
| 4 | Empleados | `tblxodPS9acp1kyoU` | ✅ Match | OK |
| 5 | Proveedores | `tblVLjaYzT3kb1k4c` | ✅ Match | OK |
| 6 | Productos | `tblkz2NvmwGBXHjpF` | ✅ Match | OK |
| 7 | Inventario | `tblNz69ntR4zvHjH1` | ✅ Match | OK |
| 8 | Promociones | `tblc8HGTbiXL5rsk8` | ✅ Match | OK |
| 9 | Agenda | `tbltQl7ljsgTBpkr1` | ✅ Match | OK |
| 10 | Reportes | `tblblfVCv2Wbn0v4u` | ✅ Match | OK |
| 11 | Capacitaciones | `tblpDKylzRWU0QTuL` | ✅ Match | OK |
| 12 | ficha de servicios | `tblsCoMUqOmpI9bfc` | ✅ Match | OK |
| 13 | Costos Fijos Peluquería | `tbl3LmPm9B32hghHi` | ✅ Match | OK |
| 14 | Resumen de Costos Fijos | `tbl7MRYpZJI0kEet1` | ✅ Match | OK |
| 15 | INGRESOS/EGRESOS | `tblEoTMnKvkZzHDBf` | ✅ Match | OK |

> **Conclusión:** Los IDs en `api.js` y `index.html:_T` son correctos. No se requiere modificar ninguna referencia de tabla.

---

## 🔴 CORRECCIONES CRÍTICAS (3)

### CRIT-1: Servicios — Valor del Servicio = $0 por fórmula dependiente de campos vacíos

**Archivos afectados:** `static/index.html:1258,1271` | **Vista:** Servicios

**Causa raíz confirmada:**
```
Valor del Servicio = ROUND(Costo Total * 2, 2)          [fld7A4qW6MzhT5NYA]
Costo Total        = SUM(Costo Fijo x Servicios, Costo Variable)  [fldmliq7PR1hbFQQl]
Costo Variable     = (Duración * Valor Hora Hombre) + Costo unitario x servicio Compilación  [fldrVUfMQYiueUmg6]
```

Si `Valor Hora Hombre = 0` (campo no configurado en la mayoría de servicios) Y `Costo Fijo x Servicios = 0` (sin datos en Resumen de Costos Fijos), entonces `Costo Total = 0` y `Valor del Servicio = $0`.

**Solución propuesta:**
1. **Inmediata (frontend):** En `renderServicios()`, cambiar `Valor del Servicio` por `Valor Hora Hombre` como campo de precio mostrado al usuario, con fallback a `Valor del Servicio` si este es > 0:
   ```javascript
   const precio = (r.fields['Valor del Servicio'] > 0) 
     ? r.fields['Valor del Servicio'] 
     : r.fields['Valor Hora Hombre'] || 0;
   ```
2. **Backend (Airtable):** Poblar `Valor Hora Hombre` en todos los servicios (campo `fldRDJDRv38Dh7sPN`).
3. **Backend (Airtable):** Configurar al menos un registro en `Resumen de Costos Fijos` para que el lookup `Costo Fijo x Servicios` retorne valores > 0.
4. **Backend (Airtable):** Vincular servicios a `ficha de servicios` para que el rollup `Costo unitario x servicio Compilación` tenga valores.

**IDs de campos involucrados:**
| Campo | ID | Tipo |
|-------|-----|------|
| Valor del Servicio | `fld7A4qW6MzhT5NYA` | formula |
| Costo Total | `fldmliq7PR1hbFQQl` | formula |
| Costo Variable | `fldrVUfMQYiueUmg6` | formula |
| Costo Fijo x Servicios | `fldI385mvZ4GUMAGR` | multipleLookupValues |
| Valor Hora Hombre | `fldRDJDRv38Dh7sPN` | currency |
| Duración del Servicio | `fldF3TvIOIfkivYJa` | number |
| Costo unitario x servicio Compilación | `fldPnqR5wNGVye4VH` | rollup |

---

### CRIT-2: Productos — Categoría del Producto en FORM_CONFIGS totalmente incompatible con Airtable

**Archivo:** `static/index.html:1525` | **Línea:** 1525

**FORM_CONFIGS (lo que envía el frontend):**
```javascript
options: ['Coloración','Cuidado capilar','Manicura','Pedicura','Barbería','Tratamientos','General']
```

**Opciones reales en Airtable** (campo `flddYSvohc8IzQ2mS`, singleSelect):
```
['Cuidado del Cabello', 'Keratinas , Botox y Alisados', 'Herramientas', 'Coloración ', 'Almacen', 'Limpieza']
```

**Impacto:** NINGUNA opción coincide. Cualquier producto creado desde el frontend tendrá categoría vacía o error silencioso de Airtable (singleSelect rechaza valores no válidos).

**Solución:**
```javascript
// Línea 1525, reemplazar options por:
options: ['Cuidado del Cabello','Keratinas , Botox y Alisados','Herramientas','Coloración ','Almacen','Limpieza']
```

> ⚠️ **Nota importante:** Las opciones reales tienen errores de escritura: `'Keratinas , Botox y Alisados'` (espacio+coma extra) y `'Coloración '` (espacio al final). Estos deben coincidir EXACTAMENTE con lo que tiene Airtable. Si se corrigen en Airtable, actualizar también aquí.

---

### CRIT-3: Citas — Linked Records sin resolver (IDs crudos en UI)

**Archivo:** `static/index.html:1121-1135` | **Vista:** Dashboard, Citas

**Síntoma:** Las citas muestran `recXXXX…` en lugar de nombres de cliente y servicio.

**Causa:** La API devuelve arrays de IDs para `multipleRecordLinks` y el frontend los muestra directamente.

**Solución (ya documentada en bugs.md CRIT-1):** Implementar pre-carga de lookup maps al iniciar la app.

---

## 🟠 CORRECCIONES ALTAS (4)

### ALT-1: Medio de Pago — FORM_CONFIGS desincronizado con Airtable

**Archivo:** `static/index.html:1532` | **Línea:** 1532

**FORM_CONFIGS:**
```javascript
options: ['Efectivo','Tarjeta','Transferencia','Nequi','Daviplata']
```

**Opciones reales en Airtable** (campo `fldOkodtnCWK454bp`, singleSelect):
```
['Efectivo', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito', 'Mercado Pago']
```

**Solo coinciden 2 de 5 opciones.** `'Tarjeta'` no existe (es `'Tarjeta Débito'` o `'Tarjeta Crédito'`). `'Nequi'` y `'Daviplata'` no existen en Airtable.

**Solución:**
```javascript
// Línea 1532, reemplazar options por:
options: ['Efectivo','Transferencia','Tarjeta Débito','Tarjeta Crédito','Mercado Pago']
```

**Campos de INGRESOS/EGRESOS verificados (29 campos):**
| # | Campo | ID | Tipo |
|---|-------|-----|------|
| 1 | Nº de Venta | `fldVMAe6hJxFBi6Xp` | autoNumber |
| 2 | Fecha de Venta | `fldrOkIwiFvbnh44A` | date |
| 3 | Cliente | `fldIUfnFC5LEJTILT` | multipleRecordLinks → Clientes |
| 4 | Servicio Realizado | `fldS2TRbLIIXwU6W9` | multipleRecordLinks → Servicios |
| 5 | Medio de Pago | `fldOkodtnCWK454bp` | singleSelect |
| 6 | ¿Pagado? | `fldQ22TDuBP0aa5sT` | checkbox |
| 7 | Monto Cobrado | `fldYcPQfETpq13LZ1` | currency |
| 8 | Fecha de Cobro | `fldBjP10uVpy4xQAP` | date |
| 9 | Notas | `fldx0K4gcrlAP9XU6` | multilineText |
| 10 | Ingresos | `fldcak5lgMUrwW9et` | multipleSelects |

---

### ALT-2: Promociones — Estado de la Promoción desincronizado

**Archivo:** `static/index.html:1545` | **Línea:** 1545

**FORM_CONFIGS:**
```javascript
options: ['Activa','Inactiva','Programada']
```

**Opciones reales en Airtable** (campo `fldV57jhEq1r6cxKM`):
```
['Activa', 'Inactiva', 'Expirada']
```

**`'Programada'` no existe en Airtable → es `'Expirada'`.**

**Solución:**
```javascript
options: ['Activa','Inactiva','Expirada']
```

---

### ALT-3: FORM_CONFIGS — Campos críticos faltantes en formularios de creación

**Archivo:** `static/index.html:1477-1548`

| Vista | FORM_CONFIG key | Campos faltantes (existen en Airtable, no en form) |
|-------|-----------------|-----------------------------------------------------|
| **Citas** | `citas` | `Cliente` (linked), `Servicio Solicitado` (linked), `Profesional Asignado` (linked) — solo tiene Hora, Fecha, Estado, Notas |
| **Productos** | `productos` | `Proveedor` (linked), `Marca` (multiSelect), `Código Barra`, `Descripción`, `Modo de Uso`, `Tipo de USO`, `Foto` |
| **Caja** | `ingresosEgresos` | `Cliente` (linked), `Servicio Realizado` (linked), `Ingresos` (tipo multiSelect), `Notas`, `Productos` (linked) |

**Solución:** Agregar campos linked como `<select>` poblados vía API con nombres de la tabla relacionada. Para multiSelect, usar checkboxes con las opciones reales.

---

### ALT-4: Ingresos (multiSelect) — Filtro de Caja no captura todos los tipos de ingreso

**Archivo:** `static/index.html:1338-1339` | **Vista:** Caja, Reportes

**Opciones reales del campo `Ingresos`** (`fldcak5lgMUrwW9et`):
```
['Ingresos', 'Egresos', 'Cobro Servicio', 'Cobro Deuda', 'Venta Productos']
```

**Filtro actual:** Solo captura `'Ingresos'`. `'Cobro Servicio'`, `'Cobro Deuda'`, `'Venta Productos'` son ignorados.

**Solución:**
```javascript
const INCOME_TYPES = ['Ingresos', 'Cobro Servicio', 'Cobro Deuda', 'Venta Productos'];
const esIngreso = (r) => (r.fields['Ingresos'] || []).some(opt => INCOME_TYPES.includes(opt));
```

---

## 🟡 CORRECCIONES MEDIAS (3)

### MED-1: Tipos de campo incorrectos en contrato (sin impacto funcional inmediato)

| Tabla | Campo | Tipo en Contrato | Tipo Real en Airtable |
|-------|-------|-----------------|----------------------|
| Clientes | Email | `email` | `singleLineText` |
| Clientes | Teléfono | `phone` | `singleLineText` |
| Empleados | Correo Electrónico | `email` | `email` ✅ (correcto) |
| Empleados | Teléfono | `phone` | `phoneNumber` ✅ |
| Proveedores | Teléfono del Proveedor | `phone` | `singleLineText` |
| Proveedores | Email del Proveedor | `email` | `singleLineText` |

**Impacto:** La validación de formato depende del frontend, no de Airtable. Los campos `singleLineText` aceptan cualquier string.

**Recomendación:** Si se requiere validación estricta, cambiar los tipos en Airtable a `email`/`phone` desde la UI de Airtable (no se puede por API en plan gratuito).

---

### MED-2: Categoría del Producto — Errores de escritura en opciones de Airtable

**Campo:** `flddYSvohc8IzQ2mS` (Categoría del Producto, singleSelect)

**Opciones con errores:**
| Opción en Airtable | Debería ser | Problema |
|-------------------|-------------|----------|
| `'Keratinas , Botox y Alisados'` | `'Keratinas, Botox y Alisados'` | Espacio antes de coma |
| `'Coloración '` | `'Coloración'` | Espacio al final |

**Impacto:** Si alguien crea registros desde la UI de Airtable con estas opciones, cualquier filtro o búsqueda que use la versión corregida fallará.

**Solución:** Corregir desde la UI de Airtable (Manage Fields → Edit field → Edit options).

---

### MED-3: Servicios — Sin campo "Categoría del Servicio" explícito

**Contexto:** El task context menciona un campo `Categoría del Servicio` (singleSelect con 12 opciones) pero este campo **no existe** en la metadata real de Airtable. La tabla Servicios tiene 26 campos y ninguno es un singleSelect de categoría.

**Verificación:** La metadata API confirma que no hay campo `Categoría del Servicio` en la tabla Servicios (id: `tblIDRFHpLoQpB9JH`).

**Recomendación:** Crear el campo si es necesario para el negocio, con las opciones estándar:
```
Corte de cabello | Coloración | Manicura | Pedicura | Maquillaje | Barbería | 
Tratamientos y Alisados | Peinados y Recogidos | Extensiones y Postizos | 
Cejas y Pestañas | Depilación | Uñas Acrílicas
```

---

## 🟢 CORRECCIONES BAJAS (2)

### BAJ-1: total_neto en INGRESOS/EGRESOS usa AVERAGE incorrectamente

**Campo:** `fldmlH6di5buKn2st` (TOTAL NETO, formula)
**Fórmula real en Airtable:** `AVERAGE({Total Ingresos Gral} - {Total Egresos Gral})`

La fórmula usa `AVERAGE()` sobre un solo valor escalar, lo cual es un no-op matemático pero sugiere un error de diseño. Debería ser: `{Total Ingresos Gral} - {Total Egresos Gral}`.

**Solución:** Cambiar desde la UI de Airtable.

---

### BAJ-2: Consola expone ID de base Airtable

**Archivo:** `static/index.html:1809`
```javascript
console.log('🏪 Salón Pro — Conectado a Airtable (app93Vhy56KrxNhwe)');
```

**Solución:** Usar nombre genérico: `'🏪 Salón Pro — Conectado'`

---

## 📋 Plan de Corrección Recomendado

### Fase 1: Inmediata (rompe funcionalidad)
1. **CRIT-2:** Corregir `options` de Categoría del Producto en FORM_CONFIGS (línea 1525)
2. **ALT-1:** Corregir `options` de Medio de Pago en FORM_CONFIGS (línea 1532)
3. **ALT-2:** Corregir `options` de Estado de Promoción (línea 1545)
4. **CRIT-1:** Agregar fallback de `Valor Hora Hombre` en `renderServicios()`

### Fase 2: Funcionalidad incompleta
5. **ALT-3:** Completar FORM_CONFIGS con campos faltantes
6. **CRIT-3:** Implementar lookup maps para linked records
7. **ALT-4:** Corregir filtro de Ingresos en Caja/Reportes

### Fase 3: Datos y calidad
8. **CRIT-1 (backend):** Poblar `Valor Hora Hombre`, `Resumen de Costos Fijos`, y `ficha de servicios`
9. **MED-2:** Corregir errores de escritura en opciones de Airtable
10. **BAJ-1:** Corregir fórmula TOTAL NETO

---

*Metadata verificada vía API REST de Airtable el 2026-06-02.*
*Total: 15 tablas, 210 campos confirmados.*
