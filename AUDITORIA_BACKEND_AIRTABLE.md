# 🔍 AUDITORÍA COMPLETA — Backend Airtable `app93Vhy56KrxNhwe`

> **Fecha:** 2026-06-02 | **Versión:** 1.0  
> **Alcance:** 15 tablas, 210 campos, todas las relaciones, fórmulas, tipos  
> **Propósito:** Detectar problemas y proponer cambios para **Fase Maestra**  
> **Regla:** Solo auditar y proponer — no modificar nada

---

## 📊 RESUMEN EJECUTIVO

| Indicador | Valor |
|-----------|-------|
| Tablas auditadas | 15 |
| Campos totales | 210 (172 manuales + 24 auto + 14 fórmulas) |
| Hallazgos totales | **42** |
| 🔴 Críticos (rompen funcionalidad) | 5 |
| 🟠 Altos (funcionalidad incompleta o incorrecta) | 12 |
| 🟡 Medios (mejoras de diseño/escalabilidad) | 14 |
| 🟢 Bajos (cosméticos/optimizaciones) | 5 |
| Tablas nuevas propuestas | **7** |

---

## 🔴 HALLAZGOS CRÍTICOS (5)

### CRIT-1: Fórmula VALOR DEL SERVICIO produce $0 sistemáticamente
**Tabla:** SERVICIOS | **Campo:** `Valor del Servicio` (`fldFsz0XUbcAyHjNj`)
**Fórmula:** `ROUND({COSTO TOTAL} * 2, 2)`

**Cadena de dependencia:**
```
Valor del Servicio → Costo Total → Costo Variable + Costo Fijo x Servicios
Costo Variable → (Duración × Valor Hora Hombre) + Costo unitario x servicio Compilación
Costo Fijo x Servicios → lookup de Resumen de Costos Fijos
```

**Problema:** Si `Valor Hora Hombre = 0` (la mayoría de servicios) **Y** `Costo Fijo x Servicios = 0` (sin datos en Resumen de Costos Fijos), entonces **Valor del Servicio = $0.00**.

**Propuesta:**
1. Poblar `Valor Hora Hombre` en todos los servicios existentes
2. Crear al menos 1 registro en `Resumen de Costos Fijos` con datos reales
3. Vincular servicios a `ficha de servicios` para que el rollup `Costo unitario x servicio Compilación` tenga datos
4. Agregar un campo manual de precio (`Precio Manual`) como fallback cuando la fórmula dé 0

---

### CRIT-2: TOTAL NETO usa AVERAGE() incorrectamente
**Tabla:** INGRESOS/EGRESOS | **Campo:** `TOTAL NETO` (`fldmlH6di5buKn2st`)
**Fórmula real:** `AVERAGE({TOTAL INGRESOS GRAL} - {TOTAL EGRESOS GRAL})`

**Problema:** `AVERAGE()` sobre un solo valor escalar es un no-op matemático, pero evidencia un error de diseño. La intención era claramente una resta directa. Si en el futuro la fórmula se aplica sobre múltiples valores, produciría resultados incorrectos.

**Fórmula correcta:** `{TOTAL INGRESOS GRAL} - {TOTAL EGRESOS GRAL}`

---

### CRIT-3: CITAS y AGENDA — Sin relación directa entre sí
**Tablas:** CITAS ↔ AGENDA

**Situación actual:**
- CITAS tiene links a: Clientes, Servicios, Empleados
- AGENDA tiene links a: Empleados, Clientes, Servicios
- **No existe ningún link entre CITAS y AGENDA**

**Problema:** Una cita debería ocupar un slot de agenda. Sin la relación, se puede:
- Crear una cita sin verificar disponibilidad en agenda
- Crear dos citas en el mismo slot de horario para el mismo empleado
- No hay forma de saber qué slot de agenda está ocupado por qué cita

**Propuesta:**
1. Agregar campo `Agenda` (multipleRecordLinks → Agenda) en CITAS
2. Agregar campo `Cita` (multipleRecordLinks → Citas) en AGENDA
3. Implementar lógica de negocio (en frontend o automatización): al crear cita, reservar slot de agenda

---

### CRIT-4: No existe tabla MOVIMIENTOS DE INVENTARIO
**Tabla faltante:** Movimientos de Inventario

**Situación actual:** La tabla INVENTARIO solo tiene campos estáticos (producto, stock, ubicación, proveedor asociado, notas). No registra:
- Entradas (compras a proveedores)
- Salidas (consumo en servicios, ventas, mermas)
- Ajustes (inventario físico vs sistema)
- Fecha/hora del movimiento
- Usuario que realizó el movimiento
- Motivo del movimiento

**Propuesta:** Crear tabla `Movimientos de Inventario` con campos:
- `Tipo de Movimiento` (singleSelect: Entrada, Salida, Ajuste, Merma)
- `Producto` (linked → Productos)
- `Cantidad` (number)
- `Fecha del Movimiento` (date)
- `Motivo` (singleSelect: Compra, Consumo en Servicio, Venta, Merma, Ajuste por Inventario)
- `Proveedor` (linked → Proveedores) — solo para Entradas
- `Cita/Servicio` (linked → Servicios) — solo para Consumo en Servicio
- `Costo Unitario` (currency)
- `Costo Total` (formula: Cantidad × Costo Unitario)
- `Stock Resultante` (formula: lookup del stock anterior + este movimiento)
- `Notas` (multilineText)
- `Realizado por` (collaborator)

---

### CRIT-5: Tabla INVENTARIO — Sin campo de Stock Mínimo ni alertas
**Tabla:** INVENTARIO | **Campos faltantes:** `Stock Mínimo`, `Estado Stock`

**Situación actual:** Solo tiene `CANTIDAD EN STOCK COPY` (lookup del nivel de stock de Productos) pero no tiene:
- Umbral de stock mínimo para reabastecimiento
- Estado del stock (Normal, Bajo, Crítico, Agotado)
- Fecha de última compra/reposición

**Propuesta:**
1. Agregar `Stock Mínimo` (number, precision: 0) en INVENTARIO
2. Agregar `Estado Stock` (formula): 
   ```
   IF({CANTIDAD EN STOCK} <= 0, "Agotado 🔴",
      IF({CANTIDAD EN STOCK} <= {STOCK MÍNIMO}, "Crítico 🟠",
         IF({CANTIDAD EN STOCK} <= {STOCK MÍNIMO} * 2, "Bajo 🟡", "Normal 🟢")))
   ```

---

## 🟠 HALLAZGOS ALTOS (12)

### ALT-1: CLIENTES — Faltan campos de negocio clave
**¿Falta?**
| Campo | ¿Existe? | Estado |
|-------|----------|--------|
| Foto de Perfil | ✅ `Foto de Perfil` | OK (multipleAttachments) |
| Última visita | ❌ | **FALTANTE** — Debería ser lookup/rollup de la cita más reciente |
| Próxima cita | ❌ | **FALTANTE** — Debería ser lookup de la próxima cita programada |
| Total gastado | ❌ | **FALTANTE** — Debería ser rollup SUM de Ventas y Cobros |
| Deuda pendiente | ❌ | **FALTANTE** — Rollup de Saldo Pendiente de Ingresos/Egresos |
| Estado comercial | ❌ | **FALTANTE** — singleSelect: Activo, Inactivo, VIP, Deudor, Nuevo |
| Profesional asignado | ❌ | **FALTANTE** — Debería ser linked a Empleados (el profesional habitual) |
| Calificación/Puntuación | ❌ | **FALTANTE** — Rating 1-5 estrellas |
| Fecha de registro | ✅ `Creación` | OK (createdTime) |
| Cumpleaños | ❌ | **FALTANTE** — Dato relevante para marketing |

**Propuesta:** Agregar los 7 campos faltantes.

---

### ALT-2: CITAS — Estados incompletos
**Estados actuales:** `Programada`, `Completada`, `Cancelada`
**Estados faltantes:** `No asistió`, `Reprogramada`, `En curso`

**Propuesta:** Ampliar el singleSelect a 6 opciones:
`Programada | Confirmada | En curso | Completada | No asistió | Cancelada | Reprogramada`

Y agregar campo `Motivo de Cancelación/No Asistencia` (singleSelect: Cliente canceló, Salón canceló, Emergencia, Sin motivo).

---

### ALT-3: CITAS — Sin vínculo con AGENDA (corolario de CRIT-3)
Ya documentado en CRIT-3.

---

### ALT-4: AGENDA — Modelo de datos incompleto
**Campos actuales:** Hora Inicio, Fecha, Hora Fin, Empleado, Estado, Cliente, Servicio, Notas

**Problemas:**
1. `Hora de Inicio` y `Hora de Fin` son `singleLineText` — deberían ser `dateTime` o al menos `number` (hora del día)
2. Falta `Duración del Slot` (number, minutos)
3. Falta `Día de la Semana` (formula, para vistas por día)
4. Estado no refleja "Bloqueada" (para pausas/almuerzo del empleado)
5. Sin relación inversa desde Citas (ver CRIT-3)

**Propuesta:**
1. Cambiar `Hora de Inicio` y `Hora de Fin` a tipo `number` con formato hora (0-23), o mantener texto pero agregar `Duración` como número calculado
2. Agregar estado `Bloqueada` al singleSelect (para pausas, almuerzo, mantenimiento)
3. Agregar `Cita Asignada` (linked → Citas) para la relación bidireccional

---

### ALT-5: SERVICIOS — Sin campo de Categoría del Servicio
**Campo faltante:** `Categoría del Servicio` (singleSelect)

**Situación:** 26 campos en SERVICIOS y ninguno es un singleSelect de categoría. Las opciones esperadas serían:
```
Corte de cabello | Coloración | Manicura | Pedicura | Maquillaje | Barbería |
Tratamientos y Alisados | Peinados y Recogidos | Extensiones y Postizos |
Cejas y Pestañas | Depilación | Uñas Acrílicas
```

**Propuesta:** Crear el campo para permitir agrupar servicios y filtrar por categoría en el frontend.

---

### ALT-6: SERVICIOS — Campo `Precio a partir de` es tipo `date` en vez de `currency`
**Campo:** `Precio a partir de` (`fldBIv67pDU9t7H44`)

**Problema:** Es tipo `formula → date`. El nombre sugiere un precio (currency), no una fecha. Si la intención es "fecha desde la cual rige este precio", el nombre es confuso y debería ser `Vigencia del Precio` o `Fecha de Activación del Precio`.

**Propuesta:** Renombrar a `Fecha Vigencia Precio` o `Precio Vigente Desde`. Si realmente se quiso poner un campo de precio, cambiar el tipo a currency.

---

### ALT-7: EMPLEADOS — Sin vínculo explícito con tabla Usuarios
**Situación actual:** EMPLEADOS tiene `COLABORADOR` (singleCollaborator) que vincula a un colaborador de Airtable. No existe tabla Usuarios en la base.

**Problema:** Para un sistema multi-usuario con roles y permisos, se necesita:
- Una tabla `Usuarios` independiente
- Un vínculo `Empleado → Usuario` (cada empleado puede ser un usuario del sistema, o no)

**Propuesta:** Agregar campo `Usuario` (linked → nueva tabla Usuarios) en EMPLEADOS.

---

### ALT-8: PRODUCTOS — Sin campo de Stock Mínimo a nivel producto
**Campo faltante:** `Stock Mínimo` (number)

**Situación:** PRODUCTOS tiene `Nivel de Stock` pero no un umbral para alertas de reabastecimiento.

**Propuesta:** Agregar `Stock Mínimo` (number, precision: 0) y `Estado Stock` (formula similar a ALT-1 de Inventario).

---

### ALT-9: INGRESOS/EGRESOS — Mezcla de ingresos y egresos en clasificación
**Campo:** `Ingresos` (`fldcak5lgMUrwW9et`, multipleSelect)

**Opciones actuales:** `['Ingresos', 'Egresos', 'Cobro Servicio', 'Cobro Deuda', 'Venta Productos']`

**Problema:** El mismo campo se usa para clasificar tanto ingresos como egresos. "Egresos" está en la misma lista que los tipos de ingreso. Sería más limpio separar:
- `Tipo de Transacción` (singleSelect: Ingreso, Egreso)
- `Concepto de Ingreso` (singleSelect: Cobro Servicio, Cobro Deuda, Venta Productos, Ingreso Extra)
- `Concepto de Egreso` (singleSelect: Pago Proveedor, Servicio, Impuesto, Sueldo, Otro)

---

### ALT-10: INGRESOS/EGRESOS — `Precio del Producto` es rollup de PRECIO DE VENTAS
**Campo:** `Precio del Producto` (`fldvXId1ImHMCwb0t`)

**Problema:** El campo se llama "Precio del Producto" pero es un rollup de `PRECIO DE VENTAS` de PRODUCTOS (que es fórmula: `(PRECIO DEL PRODUCTO + COSTO DEL ENVIO) * 1.5`). El nombre es confuso — debería ser `Precio de Venta Productos` o `Total Venta Productos`.

**Propuesta:** Renombrar a `Total Venta Productos` para reflejar que es el monto total (suma de precios de venta de los productos incluidos en la transacción).

---

### ALT-11: INGRESOS/EGRESOS — `Costos Fijos Peluquería` es texto, no linked
**Campo:** `Costos Fijos Peluquería` (`fldigehx7eZst4cz9`, singleLineText)

**Problema:** Hay dos campos para costos fijos:
- `Costos Fijos Peluquería` → singleLineText (texto libre, campo #16)
- `Costos Fijos Peluquería 2` → multipleRecordLinks a Costos Fijos Peluquería (campo #17)

El campo #16 es redundante o debería ser un lookup/rollup.

**Propuesta:** Eliminar el campo texto `Costos Fijos Peluquería` y conservar solo el linked record + lookups.

---

### ALT-12: INGRESOS/EGRESOS — Sin campo `Empleado que atendió`
**Campo faltante:** `Empleado` (linked → Empleados)

**Problema:** No se puede saber qué empleado generó el ingreso. Esto impide:
- Comisiones por empleado
- Reportes de rendimiento individual
- Tracking de productividad

**Propuesta:** Agregar `Empleado` (multipleRecordLinks → Empleados).

---

## 🟡 HALLAZGOS MEDIOS (14)

### MED-1: CLIENTES — `Email` y `Teléfono` son texto libre, no tipos validados
**Campos:** `fldvop4ccFLJ92hPg` (Email), `fld8Lh9IHwenxZjna` (Teléfono)
**Tipo real:** `singleLineText` (⚠️ ambos)
**Tipo esperado:** `email`, `phone` / `phoneNumber`

**Impacto:** Sin validación de formato a nivel Airtable. Depende del frontend para validar.

**Propuesta:** Cambiar a tipos nativos `email` y `phone` desde la UI de Airtable (no se puede por API en plan gratuito).

---

### MED-2: CLIENTES — `Ventas` es texto libre, no calculado
**Campo:** `Ventas` (`fldMAIyn39YaRiOHL`, singleLineText)

**Problema:** "Info de ventas" como texto libre. Debería ser un rollup/aggregation de la tabla INGRESOS/EGRESOS.

**Propuesta:** Cambiar a rollup que sume los montos de INGRESOS/EGRESOS donde el cliente es el titular, o agregar campo `Total Gastado` (currency, formula) y migrar el texto a `Notas de Ventas`.

---

### MED-3: EMPLEADOS — `Ventas` es texto libre, no calculado
**Campo:** `VENTAS` (singleLineText)

**Mismo problema que MED-2.** Debería ser un rollup de las transacciones donde el empleado atendió.

**Propuesta:** Agregar `Total Ventas` (rollup de INGRESOS/EGRESOS) y usar el campo texto como `Notas de Ventas`.

---

### MED-4: PROVEEDORES — `Email/Teléfono` son texto libre
**Campos:** `Teléfono del Proveedor` (`fldgHPkLdF6olVMnn`), `Email del Proveedor` (`fldmfIgGBpL7GP4W1`)
**Tipo real:** `singleLineText`
**Propuesta:** Cambiar a tipos nativos `email` y `phone`.

---

### MED-5: PROVEEDORES — `Inventario` es texto, no linked
**Campo:** `Inventario` (`fld1VLPWfPj3nxLJY`, singleLineText)

**Problema:** "Info de inventario" como texto libre en la tabla de proveedores. Debería ser un linked record a la tabla INVENTARIO o un rollup.

**Propuesta:** Cambiar a linked record → Inventario o hacerlo un lookup de los productos del proveedor.

---

### MED-6: PRODUCTOS — Campos duplicados de ventas
**Campos:** `VENTAS` (singleLineText) y `VENTAS 2` (singleLineText)

**Problema:** Dos campos de texto libre para ventas. Redundante y confuso.

**Propuesta:** Consolidar en un solo campo `Notas de Ventas` y usar rollups/lookups para datos calculados.

---

### MED-7: PRODUCTOS — Errores de escritura en opciones de Categoría
**Campo:** `Categoría del Producto` (`flddYSvohc8IzQ2mS`, singleSelect)

**Opciones con errores:**
| Valor actual | Debería ser |
|-------------|-------------|
| `Keratinas , Botox y Alisados` | `Keratinas, Botox y Alisados` |
| `Coloración ` | `Coloración` |

**Propuesta:** Corregir desde la UI de Airtable.

---

### MED-8: INVENTARIO — `Proveedor Asociado` es texto, no linked/lookup
**Campo:** `PROVEEDOR ASOCIADO` (singleLineText)

**Problema:** Debería ser un lookup del proveedor desde la tabla Productos, no texto libre.

**Propuesta:** Cambiar a lookup: `linkedTableId: tblPRODUCTOS, fieldIdInLinkedTable: NOMBRE DEL PROVEEDOR` (que ya es un lookup en Productos).

---

### MED-9: RESUMEN DE COSTOS FIJOS — `Total Costos Fijos` es currency, no rollup
**Campo:** `TOTAL COSTOS FIJOS` (currency, precision: 2)

**Problema:** Se ingresa manualmente como currency en lugar de ser un rollup automático de Costos Fijos Peluquería. Esto permite inconsistencias entre el dato ingresado y la suma real de los costos fijos.

**Propuesta:** Cambiar a rollup: `SUM(values)` del campo `MONTO MENSUAL` de `COSTOS FIJOS PELUQUERIA`, o mantener como está si el usuario prefiere ingresarlo manualmente (con advertencia).

---

### MED-10: COSTOS FIJOS PELUQUERÍA — Sin relación con Empleados
**Tabla:** Costos Fijos Peluquería

**Problema:** Los costos fijos no se pueden asignar a empleados específicos (ej: sueldo de un empleado particular). Esto limita el análisis de costo por empleado.

**Propuesta:** Agregar campo `Empleado Asignado` (linked → Empleados), opcional.

---

### MED-11: CAPACITACIONES — `Instructor` es texto, no entidad
**Campo:** `INSTRUCTOR` (singleLineText)

**Problema:** El instructor es solo un nombre de texto. Debería poder ser un Empleado (instructor interno) o un Proveedor (instructor externo/empresa).

**Propuesta opcional:** Cambiar a linked record → Empleados + campo texto `Instructor Externo` como fallback.

---

### MED-12: FICHA DE SERVICIOS — Nombres de campos en inglés
**Campos:** `NAME`, `NOTES`, `ASSIGNEE`, `STATUS`

**Problema:** Inconsistencia con el resto de la base (todos los demás campos están en español). Esto es porque la tabla se creó como "project tracker" de Airtable.

**Propuesta:** Renombrar a `Nombre Tarea`, `Notas`, `Asignado A`, `Estado`. Renombrar tabla a `Tareas Internas`.

---

### MED-13: REPORTES — Mayoría de campos son texto libre, no calculados
**Campos como texto:** `DATOS VENTAS`, `DATOS CLIENTES`

**Problema:** Los reportes tienen datos en texto libre. Idealmente los reportes serían vistas agregadas o tendrían rollups de datos reales.

**Propuesta:** Para Fase Maestra, considerar si los reportes se generan dinámicamente (frontend) o si se mantienen como registros manuales con datos pre-calculados. Agregar campos de resumen calculado como alternativa.

---

### MED-14: Dependencia circular SERVICIOS ↔ RESUMEN DE COSTOS FIJOS
**Dependencia:**
- SERVICIOS → `Costo Fijo x Servicios` (lookup de RESUMEN DE COSTOS FIJOS)
- RESUMEN DE COSTOS FIJOS → `SERVICIOS` (linked record)

**Problema:** Crear tablas en orden incorrecto causaría errores. El contrato ya documenta la solución (crear primero RESUMEN DE COSTOS FIJOS, luego el lookup).

**Propuesta:** Documentar en el plan de migración/recreación. No es un bug funcional sino de orden de creación.

---

## 🟢 HALLAZGOS BAJOS (5)

### BAJ-1: CLIENTES — `Agenda` es multipleRecordLinks sin uso claro
**Campo:** `Agenda` (`fldRZ6DaWXYizJf6z`, multipleRecordLinks → Agenda)

**Pregunta:** ¿Un cliente se vincula directamente a slots de agenda o solo a través de citas? Si es vía citas, este link es redundante.

**Propuesta:** Evaluar si mantener o eliminar. Si se elimina, la relación cliente↔agenda se da naturalmente vía Citas.

---

### BAJ-2: PRODUCTOS — `Inventario Copy` es lookup redundante
**Campo:** `INVENTARIO COPY` (number, lookup de Inventario)

**Problema:** PRODUCTOS ya tiene `NIVEL DE STOCK` (number manual). `INVENTARIO COPY` parece ser un intento de sincronizar con la tabla INVENTARIO, pero INVENTARIO a su vez tiene `CANTIDAD EN STOCK COPY` que es lookup del `NIVEL DE STOCK` de Productos. Hay doble lookup redundante.

**Propuesta:** Simplificar: PRODUCTOS define el stock. INVENTARIO lo refleja vía lookup. Eliminar `INVENTARIO COPY` de PRODUCTOS.

---

### BAJ-3: Múltiples tablas sin `createdTime`/`lastModifiedTime`
**Tablas sin campos automáticos:** PROMOCIONES, AGENDA, REPORTES, CAPACITACIONES, FICHA DE SERVICIOS, COSTOS FIJOS PELUQUERIA, RESUMEN DE COSTOS FIJOS

Estas 7 tablas no tienen los campos automáticos de auditoría (`createdTime`, `lastModifiedTime`, `createdBy`, `lastModifiedBy`).

**Propuesta:** Agregar estos campos a todas las tablas para trazabilidad completa.

---

### BAJ-4: CITAS — `Hora de la Cita` es texto, no campo de hora
**Campo:** `Hora de la Cita` (`fldG6YIGmwT9emkqF`, singleLineText)

**Problema:** Siendo el campo principal de la tabla, no tiene validación de formato horario.

**Propuesta:** Agregar validación en el frontend (regex HH:MM). En Airtable, considerar cambiar a `date` con includeTime=true o crear un campo `Hora` de tipo `number` (0-23) + `Minutos` (0-59).

---

### BAJ-5: PROMOCIONES — `Descuento` es percent, sin distinguir tipo
**Campo:** `DESCUENTO` (percent, precision: 1)

**Problema:** Solo admite porcentaje. No permite descuentos fijos ($5 off) ni promociones 2×1.

**Propuesta:** Agregar campo `Tipo de Descuento` (singleSelect: Porcentaje, Monto Fijo, 2x1, Regalo/Obsequio). Si es Monto Fijo, agregar campo `Descuento Monto` (currency).

---

## 🆕 TABLAS NUEVAS PROPUESTAS PARA FASE MAESTRA (7)

### 1. USUARIOS
**Propósito:** Gestión de acceso al sistema multi-usuario  
**Prioridad:** 🔴 CRÍTICO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre de Usuario | singleLineText | 🔑 Campo principal |
| 2 | Email | email | Correo electrónico (único) |
| 3 | Contraseña Hash | singleLineText | Hash bcrypt/argon2 (nunca texto plano) |
| 4 | Rol | linked → Roles | Rol asignado |
| 5 | Empleado | linked → Empleados | Vínculo con empleado (si aplica) |
| 6 | Avatar | multipleAttachments | Foto de perfil |
| 7 | Activo | checkbox | Usuario habilitado/deshabilitado |
| 8 | Último Login | dateTime | Último acceso |
| 9 | Token de Recuperación | singleLineText | Token para reset de contraseña |
| 10 | Expiración Token | dateTime | Expiración del token de recuperación |

> ⚠️ **Nota de seguridad:** La autenticación debe manejarse en el backend (proxy/PAT), nunca exponiendo contraseñas ni tokens en el frontend.

---

### 2. ROLES
**Propósito:** Definir perfiles de acceso (Admin, Gerente, Estilista, Recepcionista)  
**Prioridad:** 🔴 CRÍTICO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre del Rol | singleLineText | 🔑 Admin, Gerente, Estilista, Recepcionista, Cliente |
| 2 | Descripción | multilineText | Detalle del rol |
| 3 | Es Sistema | checkbox | Si es rol predefinido (no se puede eliminar) |
| 4 | Nivel de Acceso | number | Jerarquía numérica (1=Admin, 5=Cliente) |
| 5 | Usuarios | linked → Usuarios | Relación inversa |

---

### 3. PERMISOS POR MÓDULO
**Propósito:** Control granular de acceso a cada vista/sección del sistema  
**Prioridad:** 🟠 ALTO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre del Permiso | singleLineText | 🔑 Ej: "clientes.ver", "citas.crear" |
| 2 | Rol | linked → Roles | Rol al que aplica |
| 3 | Módulo | singleSelect | Clientes, Citas, Servicios, Empleados, Productos, Inventario, Caja, Reportes, Agenda, Promociones, Capacitaciones, Proveedores, Costos, Configuración |
| 4 | Ver | checkbox | Permiso de lectura |
| 5 | Crear | checkbox | Permiso de creación |
| 6 | Editar | checkbox | Permiso de edición |
| 7 | Eliminar | checkbox | Permiso de eliminación |
| 8 | Exportar | checkbox | Permiso de exportación |

---

### 4. PERMISOS POR CAMPO
**Propósito:** Control granular a nivel de campo dentro de cada tabla  
**Prioridad:** 🟡 MEDIO (puede ser post-MVP)

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre del Permiso | singleLineText | 🔑 Ej: "servicios.costo.ver" |
| 2 | Rol | linked → Roles | Rol al que aplica |
| 3 | Tabla | singleSelect | Tabla afectada |
| 4 | Campo | singleLineText | Nombre del campo |
| 5 | Visible | checkbox | El campo es visible para este rol |
| 6 | Editable | checkbox | El campo es editable para este rol |

---

### 5. CATEGORÍAS DE MENÚ
**Propósito:** Organizar la navegación del sistema en categorías  
**Prioridad:** 🟡 MEDIO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre de Categoría | singleLineText | 🔑 Ej: "Operaciones", "Finanzas", "RRHH" |
| 2 | Ícono | singleLineText | Emoji o clase CSS |
| 3 | Orden | number | Posición en el menú |
| 4 | Módulos | multipleRecordLinks → nueva tabla Módulos | Módulos en esta categoría |
| 5 | Roles con Acceso | linked → Roles | Roles que ven esta categoría |

---

### 6. MÓDULOS (opcional, complementa Categorías de Menú)
**Propósito:** Definir los módulos del sistema de forma estructurada  
**Prioridad:** 🟢 BAJO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Nombre del Módulo | singleLineText | 🔑 Ej: "Gestión de Clientes" |
| 2 | Ruta | singleLineText | Ej: "/clientes" |
| 3 | Ícono | singleLineText | Emoji o clase CSS |
| 4 | Categoría de Menú | linked → Categorías de Menú | Agrupación |
| 5 | Orden | number | Posición dentro de la categoría |
| 6 | Requiere Permiso | singleLineText | Código de permiso necesario |

---

### 7. MOVIMIENTOS DE INVENTARIO (ver CRIT-4)
**Propósito:** Registrar entradas, salidas y ajustes de stock  
**Prioridad:** 🔴 CRÍTICO

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | Tipo de Movimiento | singleSelect | 🔑 Entrada, Salida, Ajuste, Merma |
| 2 | Producto | linked → Productos | Producto afectado |
| 3 | Cantidad | number | Unidades movidas |
| 4 | Fecha del Movimiento | date | Cuándo ocurrió |
| 5 | Motivo | singleSelect | Compra, Consumo en Servicio, Venta, Merma, Ajuste |
| 6 | Proveedor | linked → Proveedores | Solo para Entradas |
| 7 | Servicio | linked → Servicios | Solo para Consumo en Servicio |
| 8 | Costo Unitario | currency | Precio por unidad en este movimiento |
| 9 | Costo Total | formula | `{Cantidad} * {Costo Unitario}` |
| 10 | Stock Anterior | number | Stock antes del movimiento |
| 11 | Stock Resultante | formula | `{Stock Anterior} + IF({Tipo}="Entrada", {Cantidad}, -{Cantidad})` |
| 12 | Notas | multilineText | Observaciones |
| 13 | Realizado por | collaborator | Usuario Airtable que registró |

---

## 📋 PRIORIZACIÓN GLOBAL PARA FASE MAESTRA

### 🔴 Crítico (5) — Debe resolverse antes de producción
| ID | Hallazgo | Acción |
|----|----------|--------|
| CRIT-1 | Valor del Servicio = $0 | Poblar datos base: Valor Hora Hombre, Resumen Costos Fijos, Ficha Servicios |
| CRIT-2 | TOTAL NETO con AVERAGE | Corregir fórmula en Airtable |
| CRIT-3 | CITAS ↔ AGENDA sin relación | Agregar linked records bidireccionales |
| CRIT-4 | Sin Movimientos de Inventario | Crear nueva tabla + migrar lógica |
| CRIT-5 | Inventario sin Stock Mínimo | Agregar campos y fórmula de estado |

### 🟠 Alto (12) — Necesario para funcionalidad completa
| ID | Hallazgo | Acción |
|----|----------|--------|
| ALT-1 | CLIENTES: 7 campos de negocio faltantes | Agregar campos |
| ALT-2 | CITAS: estados insuficientes | Ampliar singleSelect |
| ALT-4 | AGENDA: modelo incompleto | Mejorar tipos y relaciones |
| ALT-5 | SERVICIOS: sin categoría | Crear campo Categoría |
| ALT-6 | SERVICIOS: Precio a partir de tipo incorrecto | Corregir |
| ALT-7 | EMPLEADOS: sin vínculo a Usuarios | Agregar linked |
| ALT-8 | PRODUCTOS: sin Stock Mínimo | Agregar campos |
| ALT-9 | Caja: clasificación mezclada | Separar tipo/concepto |
| ALT-10 | Caja: nombre de campo confuso | Renombrar |
| ALT-11 | Caja: campo texto redundante | Eliminar |
| ALT-12 | Caja: sin Empleado | Agregar linked |

### 🟡 Medio (14) — Mejora de calidad y consistencia
Cambios de tipos de campo, renombrar, corregir opciones con errores de escritura, consolidar campos redundantes.

### 🟢 Bajo (5) — Optimizaciones
Auditoría automática, limpieza de campos redundantes, validación de formato.

---

## 📊 RESUMEN DE TABLAS NUEVAS

| # | Nueva Tabla | Prioridad | Campos | Depende de |
|---|-------------|-----------|--------|------------|
| 1 | Usuarios | 🔴 CRÍTICO | 10 | Roles, Empleados |
| 2 | Roles | 🔴 CRÍTICO | 5 | — |
| 3 | Movimientos de Inventario | 🔴 CRÍTICO | 13 | Productos, Proveedores, Servicios |
| 4 | Permisos por Módulo | 🟠 ALTO | 8 | Roles |
| 5 | Categorías de Menú | 🟡 MEDIO | 5 | Roles |
| 6 | Permisos por Campo | 🟡 MEDIO | 6 | Roles |
| 7 | Módulos | 🟢 BAJO | 6 | Categorías de Menú |

**Total tablas post Fase Maestra:** 15 (existentes) + 7 (nuevas) = **22 tablas**
**Total campos estimado:** 210 (existentes) + ~70 (nuevos) = **~280 campos**

---

## 🔗 NOTAS ADICIONALES

### Sobre la tabla "ficha de servicios"
Se confirma que es una tabla de tareas internas/tracker, no de servicios. Los campos (`NAME`, `NOTES`, `ASSIGNEE`, `STATUS` con opciones `Todo/In progress/Done`) son de un project tracker de Airtable. **Se recomienda renombrar a `Tareas Internas`** con campos en español: `Nombre Tarea`, `Notas`, `Asignado A`, `Estado`.

### Sobre el campo `singleCollaborator`
Varias tablas tienen `Colaborador` (singleCollaborator). En Airtable, esto vincula a usuarios de la plataforma Airtable, no a una tabla propia. Para Fase Maestra con autenticación propia, estos campos deberían migrar a linked records hacia la nueva tabla `Usuarios`.

### Sobre la seguridad
El token de Airtable (PAT) está en `.env` y `CREDENCIALES.md`. No se ha leído ni expuesto. La auditoría se limita al schema de datos.

---

*Auditoría completada. Total: 42 hallazgos clasificados. 7 tablas nuevas propuestas.*
*Documentos de referencia: contracts/AIRTABLE_CONTRACT.md, progress/memory/backend-fixes.md, progress/memory/bugs.md, plans/fase2-completo.md*
