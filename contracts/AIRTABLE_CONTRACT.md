# AIRTABLE_CONTRACT — Gestión de Salones de Belleza

> **Versión:** 2.2 | **P0.1:** 2026-06-03 — Deprecación de campos duplicados + relación Inventario ↔ Movimientos | **Fecha:** 2026-06-02 | **Autor:** Docs / Progress Manager
> **Estado:** P0.1 COMPLETADO ✅ — 5 campos deprecados, relación Inventario ↔ Movimientos creada, Dashboard corregido. 4 acciones manuales pendientes en UI Airtable.
> **Backend:** Exclusivamente Airtable. Sin Supabase.
> **Última verificación:** 2026-06-02 — API Metadata de la base `app93Vhy56KrxNhwe`
> **Deploy:** https://gestion-desalones-de-belleza.surge.sh

---

## Resumen del Schema (VERIFICADO vía API)

| # | Tabla | ID Real (Airtable) | Campos Totales | Manual | Auto | Fórmulas | Rol |
|---|-------|-------------------|----------------|--------|------|----------|-----|
| 1 | Clientes | `tblzRwPeOVTdsvt5g` | 16 | 12 | 4 | 0 | Gestión de clientes |
| 2 | Citas | `tblZNB7HfD3OAGL9x` | 12 | 8 | 4 | 0 | Programación de citas |
| 3 | Servicios | `tblIDRFHpLoQpB9JH` | 26 | 18 | 4 | 4 | Catálogo de servicios + costos |
| 4 | Empleados | `tblxodPS9acp1kyoU` | 20 | 16 | 4 | 0 | Personal del salón |
| 5 | Proveedores | `tblVLjaYzT3kb1k4c` | 13 | 11 | 2 | 0 | Proveedores de productos |
| 6 | Productos | `tblkz2NvmwGBXHjpF` | 31 | 24 | 4 | 3 | Catálogo + costos unitarios |
| 7 | Inventario | `tblNz69ntR4zvHjH1` | 10 | 8 | 2 | 0 | Control de stock |
| 8 | Promociones | `tblc8HGTbiXL5rsk8` | 10 | 10 | 0 | 0 | Ofertas y descuentos |
| 9 | Agenda | `tbltQl7ljsgTBpkr1` | 8 | 8 | 0 | 0 | Disponibilidad horaria |
| 10 | Reportes | `tblblfVCv2Wbn0v4u` | 9 | 9 | 0 | 0 | Informes del negocio |
| 11 | Capacitaciones | `tblpDKylzRWU0QTuL` | 10 | 10 | 0 | 0 | Formación del personal |
| 12 | ficha de servicios | `tblsCoMUqOmpI9bfc` | 4 | 4 | 0 | 0 | Tareas auxiliares |
| 13 | Costos Fijos Peluquería | `tbl3LmPm9B32hghHi` | 6 | 6 | 0 | 0 | Gastos fijos mensuales |
| 14 | Resumen de Costos Fijos | `tbl7MRYpZJI0kEet1` | 6 | 5 | 0 | 1 | Distribución de costos |
| 15 | INGRESOS/EGRESOS | `tblEoTMnKvkZzHDBf` | 29 | 23 | 0 | 6 | Control financiero central |
| **TOTAL** | | | **210 campos** | **172 manual** | **24 auto** | **14 fórmulas** | |

> **⚠️ Campos DEPRECATED_ (P0.1):** Citas.Agenda 2, Agenda.Cita Asignada, Productos.Inventario copy, Productos.Ventas 2, Inventario.Cantidad en Stock copy → renombrados con prefijo `DEPRECATED_` (eliminación pendiente vía UI Airtable).

> **Nota:** Las tablas sin campos automáticos no tienen `createdTime`/`lastModifiedTime` porque pueden haber sido creadas desde plantilla o configuradas manualmente sin esos campos. Los IDs son los reales verificados vía `GET /meta/bases/app93Vhy56KrxNhwe/tables`.

---

## 1. CLIENTES — `tblzRwPeOVTdsvt5g` (16 campos: 12 manual + 4 auto)

| # | Campo | Field ID | Tipo Airtable | Descripción / Options |
|---|-------|----------|--------------|----------------------|
| 1 | Nombre | `fldV3oSp0rQG164P0` | `singleLineText` | 🔑 **Campo principal** — Nombre del cliente |
| 2 | Email | `fldvop4ccFLJ92hPg` | `singleLineText` ⚠️ | Correo electrónico *(NO es tipo `email`, es texto libre)* |
| 3 | Teléfono | `fld8Lh9IHwenxZjna` | `singleLineText` ⚠️ | Número telefónico *(NO es tipo `phone`, es texto libre)* |
| 4 | Dirección | `fld0pEr4DPwB9N8CN` | `singleLineText` | Dirección física |
| 5 | Historial de Citas | `fldeqOtsb5yeDs64C` | `multipleRecordLinks` | → Citas (`tblZNB7HfD3OAGL9x`) |
| 6 | Preferencias de Servicios | `fldy6H1LmkD13vFR9` | `multipleSelects` | `choices: ['Corte de pelo', 'Coloración', 'Manicura', 'Pedicura', 'Tratamiento facial']` |
| 7 | Foto de Perfil | `fldQ8yczUIlGffHUJ` | `multipleAttachments` | Imagen del cliente |
| 8 | Ventas | `fldMAIyn39YaRiOHL` | `singleLineText` | Info de ventas (texto libre) |
| 9 | Promociones | `fldFeKRWZz3yBbCZu` | `multipleRecordLinks` | → Promociones (`tblc8HGTbiXL5rsk8`) |
| 10 | Agenda | `fldRZ6DaWXYizJf6z` | `multipleRecordLinks` | → Agenda (`tbltQl7ljsgTBpkr1`) |
| 11 | Colaborador | `fld5NEn0PPAQk2Rqu` | `singleCollaborator` | Colaborador asignado |
| 12 | Ventas y Cobros | `flddkOmZLBpzGIqZh` | `multipleRecordLinks` | → INGRESOS/EGRESOS (`tblEoTMnKvkZzHDBf`) |

**Campos automáticos (verificados):**
| Campo | Field ID | Tipo |
|-------|----------|------|
| Ultima actualización | `fldN0PeTombZ183gc` | `lastModifiedTime` |
| Creación | `fldZbsF460kq9uhlu` | `createdTime` |
| Creado por | `fldlxYuGaEbG3F5gt` | `createdBy` |
| Última modificación | `fldqoK2Fj7hN1g45B` | `lastModifiedBy` |

> ⚠️ **Discrepancia de tipos:** Email y Teléfono son `singleLineText`, no `email`/`phone`. La validación de formato recae en el frontend.

---

## 2. CITAS — `tblZNB7HfD3OAGL9x` (12 campos: 8 manual + 4 auto)

| # | Campo | Field ID | Tipo Airtable | Descripción / Options |
|---|-------|----------|--------------|----------------------|
| 1 | Hora de la Cita | `fldG6YIGmwT9emkqF` | `singleLineText` | 🔑 **Campo principal** — Hora programada |
| 2 | Fecha de la Cita | `fldHKaoo3lNK7p5vq` | `date` | Día de la cita |
| 3 | Cliente | `fldQHCVDkYHlDdwor` | `multipleRecordLinks` | → Clientes (`tblzRwPeOVTdsvt5g`) |
| 4 | Servicio Solicitado | `fldNvyU70wMXQLX1U` | `multipleRecordLinks` | → Servicios (`tblIDRFHpLoQpB9JH`) |
| 5 | Profesional Asignado | `fldYkP2gZv60rQEKf` | `multipleRecordLinks` | → Empleados (`tblxodPS9acp1kyoU`) |
| 6 | Estado de la Cita | `fldweePEyhJd9cdec` | `singleSelect` | `choices: ['Programada', 'Completada', 'Cancelada']` |
| 7 | Notas de la Cita | `fldB7vWK5rHlEtunu` | `singleLineText` | Observaciones |
| 8 | Colaborador | `fldoD3FYsqsST26mh` | `singleCollaborator` | Colaborador asignado |

**Campos automáticos (verificados):**
| Campo | Field ID | Tipo |
|-------|----------|------|
| Ultima actualización | `fldh8uAqlsp2NTBzW` | `lastModifiedTime` |
| Creación | `fldQITsxBObLr4A7A` | `createdTime` |
| Creado por | `fldXtw13vp3a28v5H` | `createdBy` |
| Última modificación por | `fldRelJBnsOagVTpL` | `lastModifiedBy` |

---

## 3. SERVICIOS — `tblIDRFHpLoQpB9JH` (26 campos: 18 manual + 4 fórmulas + 4 auto)

| # | Campo | Field ID | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|----------|--------------|-------------|-------------------|
| 1 | Nombre del Servicio | `fldZsbrskognxGBD4` | `singleLineText` | 🔑 Campo principal | — |
| 2 | Foto del Servicio | `fldKU9ynf2SvKehDm` | `multipleAttachments` | Imagen | — |
| 3 | Descripción del Servicio | `fldZzJ0JzTwhHbAUy` | `richText` | Detalle del servicio | — |
| 4 | Eslogan de Venta | `fldxBYbrsCM9oVKFg` | `multilineText` | Frase promocional | — |
| 5 | Productos utilizados | `fldDjOaCOjY0Pd8yD` | `multipleRecordLinks` | → PRODUCTOS | `linkedTableId: tblPRODUCTOS` |
| 6 | Capacitaciones | `fldkFhLXcnTg7S46o` | `multipleRecordLinks` | → CAPACITACIONES | `linkedTableId: tblCAPACITACIONES` |
| 7 | Promociones | `fld9lt6JDzQ2wnr0N` | `multipleRecordLinks` | → PROMOCIONES | `linkedTableId: tblPROMOCIONES` |
| 8 | Citas | `fldz9WZnUNZb0P6kP` | `multipleRecordLinks` | → CITAS | `linkedTableId: tblCITAS` |
| 9 | Agenda | `fldjHIhOGh0MfBfTn` | `multipleRecordLinks` | → AGENDA | `linkedTableId: tblAGENDA` |
| 10 | Duración del Servicio | `fldS1W7KkL6S0WYnb` | `number` | Minutos | `precision: 0` |
| 11 | Valor Hora Hombre | `fld9AwhsU60IHcGek` | `currency` | Costo por hora | `precision: 2, symbol: "$"` |
| 12 | Colaborador | `fldP0Id2KKVgp0XgD` | `singleCollaborator` | Colaborador asignado | — |
| 13 | Costo unitario x servicio Compilación | `fldOJ6qKbvzqFzHUB` | `rollup` | Rollup de ficha de servicios | `linkedTableId: tblFICHA_SERVICIOS, fieldIdInLinkedTable: GASTO VARIABLE UNITARIO, formula: SUM(values)` |
| 14 | Empleados | `fldXhtQF8Tl0rmK3p` | `multipleRecordLinks` | → EMPLEADOS | `linkedTableId: tblEMPLEADOS` |
| 15 | Costo Fijo x Servicios | `fld2BjQnqCKh0U4Hc` | `lookup` | Lookup de Costos Fijos Peluquería | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA, fieldIdInLinkedTable: Costo Fijo x Empleado` |
| 16 | Total Costo Fijo General | `fldV7FFevtHeumNKl` | `singleLineText` | Info costos | — |
| 17 | Ventas y Cobros | `fldoXJljljiCRlk0S` | `multipleRecordLinks` | → INGRESOS/EGRESOS | `linkedTableId: tblINGRESOS_EGRESOS` |
| 18 | Maestra Contable | `fldxGGqI3QDDDEUrZ` | `singleLineText` | Código contable | — |

**Campos calculados (fórmula):**

| # | Campo | Field ID | Tipo | Fórmula |
|---|-------|----------|------|---------|
| 19 | Costo Variable | `fldTsQfvv2U42hNeD` | `formula` → `currency` | `({VALOR HORA HOMBRE} * {DURACION DEL SERVICIO}) + {COSTO UNITARIO X SERVICIO COMPILACION}` |
| 20 | Costo Total | `fldSLzhOmK5VHR8bV` | `formula` → `currency` | `SUM({COSTO FIJO X SERVICIOS}, {COSTO VARIABLE})` |
| 21 | Valor del Servicio | `fldFsz0XUbcAyHjNj` | `formula` → `currency` | `ROUND({COSTO TOTAL} * 2, 2)` ⚠️ |
| 22 | Precio a partir de | `fldBIv67pDU9t7H44` | `formula` → `date` | (fecha de activación del precio) |

**Campos automáticos (verificados):**
| Campo | Field ID | Tipo |
|-------|----------|------|
| Ultima actualización | `fldPquV6fTbgKB3KY` | `lastModifiedTime` |
| Creación | `fldJIgI9PrJ0mAN3q` | `createdTime` |
| Creado por | `fldU3cZ0JITeVMg8P` | `createdBy` |
| Última modificación por | `fldtXuFbCgp7vGvCM` | `lastModifiedBy` |

> ⚠️ **BUG CRÍTICO CRIT-2:** `Valor del Servicio = ROUND(Costo Total * 2, 2)`. Si `Valor Hora Hombre = 0` (mayoría de servicios) y `Costo Fijo x Servicios = 0` → `Costo Variable = 0` → `Costo Total = 0` → **Valor del Servicio = $0.00**. Ver `backend-fixes.md` CRIT-2.

---

## 4. EMPLEADOS

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NOMBRE | `singleLineText` | Campo principal — Nombre | — |
| 2 | APELLIDO | `singleLineText` | Apellido | — |
| 3 | CORREO ELECTRONICO | `email` | Email de contacto | — |
| 4 | TELEFONO | `phone` | Teléfono | — |
| 5 | DIRECCION | `singleLineText` | Dirección | — |
| 6 | FECHA DE CONTRATACION | `date` | Inicio laboral | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 7 | ESPECIALIDAD | `multipleSelect` | Áreas de especialización | `choices: [Corte de cabello, Coloración, Manicura, Pedicura, Maquillaje, Barbería, Tratamientos y Alisados, Asistente]` |
| 8 | HORARIO DE TRABAJO | `richText` | Detalles del horario | — |
| 9 | FOTO DE PERFIL | `multipleAttachments` | Imagen del empleado | — |
| 10 | CITAS ASIGNADAS | `multipleRecordLinks` | → CITAS | `linkedTableId: tblCITAS` |
| 11 | CAPACITACIONES COMPLETADAS | `multipleRecordLinks` | → CAPACITACIONES | `linkedTableId: tblCAPACITACIONES` |
| 12 | SERVICIOS | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 13 | VENTAS | `singleLineText` | Info de ventas | — |
| 14 | AGENDA | `multipleRecordLinks` | → AGENDA | `linkedTableId: tblAGENDA` |
| 15 | REPORTES | `multipleRecordLinks` | → REPORTES | `linkedTableId: tblREPORTES` |
| 16 | COLABORADOR | `collaborator` | Colaborador asignado | — |

**Campos automáticos:** `createdTime`, `lastModifiedTime`, `createdBy`, `lastModifiedBy`

---

## 5. PROVEEDORES — `tblVLjaYzT3kb1k4c` (13 campos: 11 manual + 2 auto)

| # | Campo | Field ID | Tipo Airtable | Descripción / Options |
|---|-------|----------|--------------|----------------------|
| 1 | Nombre del Proveedor | `fldBmxfetYEWXch52` | `singleLineText` | 🔑 Campo principal — Nombre comercial |
| 2 | Contacto del Proveedor | `fldTLQ6U0RbQyXm5a` | `singleLineText` | Persona de contacto |
| 3 | Teléfono del Proveedor | `fldgHPkLdF6olVMnn` | `singleLineText` ⚠️ | Número de contacto *(NO es tipo `phone`, es texto libre)* |
| 4 | Email del Proveedor | `fldmfIgGBpL7GP4W1` | `singleLineText` ⚠️ | Correo electrónico *(NO es tipo `email`, es texto libre)* |
| 5 | Dirección del Proveedor | `fldeA4F2zAnLL92tr` | `singleLineText` | Ubicación física |
| 6 | Términos de Compra | `fldqImoFKc2JV0lu2` | `singleLineText` | Condiciones comerciales |
| 7 | Inventario | `fld1VLPWfPj3nxLJY` | `singleLineText` | Info de inventario (texto) |
| 8 | Foto del Proveedor | `fldf6BPf4Tv3CrSjy` | `multipleAttachments` | Imagen o logo |
| 9 | WEB | `fldsqanlONV75Uywz` | `url` | Sitio web |
| 10 | Productos | `fld3XFKZiN9yaNfQu` | `multipleRecordLinks` | → Productos (`tblkz2NvmwGBXHjpF`) |
| 11 | Colaborador | `fldQnzn0IC5g8cniT` | `singleCollaborator` | Colaborador asignado |

**Campos automáticos (verificados):**
| Campo | Field ID | Tipo |
|-------|----------|------|
| Creación | `fldFO89U0QVpTI0tS` | `createdTime` |
| Ultima modificación | `fldzRM2JhqL7nTXNL` | `lastModifiedTime` |

> ⚠️ **Discrepancia de tipos:** Teléfono del Proveedor y Email del Proveedor son `singleLineText`, no `phone`/`email`.

---

## 6. PRODUCTOS

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NOMBRE DEL PRODUCTO | `singleLineText` | Campo principal | — |
| 2 | DESCRIPCION DEL PRODUCTO | `richText` | Detalles | — |
| 3 | PRECIO DEL PRODUCTO | `currency` | Costo de adquisición | `precision: 2, symbol: "$"` |
| 4 | NIVEL DE STOCK | `number` | Cantidad disponible | `precision: 0` |
| 5 | FOTO DEL PRODUCTO | `multipleAttachments` | Imagen | — |
| 6 | PROVEEDOR | `multipleRecordLinks` | → PROVEEDORES | `linkedTableId: tblPROVEEDORES` |
| 7 | Categoría del Producto | `flddYSvohc8IzQ2mS` | `singleSelect` | ⚠️ Clasificación | `choices: ['Cuidado del Cabello', 'Keratinas , Botox y Alisados', 'Herramientas', 'Coloración ', 'Almacen', 'Limpieza']` ⚠️ |
| 8 | INVENTARIO | `multipleRecordLinks` | → INVENTARIO | `linkedTableId: tblINVENTARIO` |
| 9 | VENTAS | `singleLineText` | Info de ventas | — |
| 10 | PROMOCIONES | `multipleRecordLinks` | → PROMOCIONES | `linkedTableId: tblPROMOCIONES` |
| 11 | COLABORADOR | `collaborator` | Colaborador asignado | — |
| 12 | SLOGAN DE VENTA | `richText` | Frase promocional | — |
| 13 | MODO DE USO | `richText` | Instrucciones de aplicación | — |
| 14 | TIPO DE USO | `multipleSelect` | Clasificación de uso | `choices: [CONSUMO INTERNO, VENTAS, CONSUMO EN SERVICIOS]` |
| 15 | COSTO DEL ENVIO | `currency` | Gasto de transporte | `precision: 2, symbol: "$"` |
| 16 | RENDIMIENTO | `number` | Cantidad de aplicaciones | `precision: 0` |
| 17 | CODIGO BARRA | `barcode` | Identificador único | — |
| 18 | INVENTARIO COPY | `number` | Lookup de Inventario | `precision: 0` |
| 19 | MARCA | `multipleSelect` | Fabricante | `choices: [Fidelitte, Tec Italy, Caviar, Kostume, Dompel, TIGI, Robso Peluquero, NovaLook, Framar, Mariela Alisados, Herramientas, Razor Line]` |
| 20 | NOMBRE DEL PROVEEDOR | `lookup` | Lookup del proveedor | `linkedTableId: tblPROVEEDORES, fieldIdInLinkedTable: NOMBRE DEL PROVEEDOR` |
| 21 | VENTAS 2 | `singleLineText` | Info adicional de ventas | — |
| 22 | SERVICIOS | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 23 | VENTAS Y COBROS | `multipleRecordLinks` | → INGRESOS/EGRESOS | `linkedTableId: tblINGRESOS_EGRESOS` |
| 24 | MAESTRA CONTABLE | `singleLineText` | Código contable | — |

**Campos calculados (fórmula):**

| # | Campo | Tipo | Fórmula |
|---|-------|------|---------|
| 25 | PRECIO DE VENTAS | `formula` → `currency` | `ROUND({PRECIO DEL PRODUCTO} + {COSTO DEL ENVIO}, 2) * 1.5` |
| 26 | TOTAL PRODUCTO + ENVIO | `formula` → `singleLineText` | `"$" & ({PRECIO DEL PRODUCTO} + {COSTO DEL ENVIO})` |
| 27 | COSTO UNITARIO X SERVICIO | `formula` → `currency` | `ROUND(({PRECIO DEL PRODUCTO} + {COSTO DEL ENVIO}) / {RENDIMIENTO}, 0)` |

**Campos automáticos:** `createdTime` → CREACION, `lastModifiedTime` → ULTIMA ACTUALIZACION, `createdBy`, `lastModifiedBy`

---

## 7. INVENTARIO

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | UBICACION X CODIGO DE BARRA | `barcode` | Campo principal — Identificador | — |
| 2 | FECHA DE ULTIMA ACTUALIZACION | `date` | Última modificación del stock | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 3 | PROVEEDOR ASOCIADO | `singleLineText` | Rollup de Productos (texto) | — |
| 4 | PRODUCTO | `multipleRecordLinks` | → PRODUCTOS | `linkedTableId: tblPRODUCTOS` |
| 5 | NOTAS DE INVENTARIO | `singleLineText` | Observaciones | — |
| 6 | REPORTES | `multipleRecordLinks` | → REPORTES | `linkedTableId: tblREPORTES` |
| 7 | CANTIDAD EN STOCK COPY | `number` | Lookup del nivel de stock | `precision: 0` |
| 8 | COLABORADOR | `collaborator` | Colaborador asignado | — |

**Campos automáticos:** `createdTime` → CREACION, `lastModifiedTime` → ULTIMA MODIFICACION

---

## 8. PROMOCIONES

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NOMBRE DE LA PROMOCION | `singleLineText` | Campo principal — Título | — |
| 2 | DESCRIPCION DE LA PROMOCION | `singleLineText` | Detalles de la oferta | — |
| 3 | FECHA DE INICIO | `date` | Inicio de vigencia | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 4 | FECHA DE FIN | `date` | Fin de vigencia | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 5 | DESCUENTO | `percent` | Porcentaje o valor | `precision: 1` |
| 6 | SERVICIOS INCLUIDOS | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 7 | PRODUCTOS INCLUIDOS | `multipleRecordLinks` | → PRODUCTOS | `linkedTableId: tblPRODUCTOS` |
| 8 | CLIENTES OBJETIVO | `multipleRecordLinks` | → CLIENTES | `linkedTableId: tblCLIENTES` |
| 9 | ESTADO DE LA PROMOCION | `singleSelect` | Estatus actual | `choices: [Activa, Inactiva, Expirada]` |
| 10 | IMAGEN DE LA PROMOCION | `multipleAttachments` | Material visual | — |

---

## 9. AGENDA

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | HORA DE INICIO | `singleLineText` | Campo principal | — |
| 2 | FECHA | `date` | Día programado | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 3 | HORA DE FIN | `singleLineText` | Hora de finalización | — |
| 4 | EMPLEADO ASIGNADO | `multipleRecordLinks` | → EMPLEADOS | `linkedTableId: tblEMPLEADOS` |
| 5 | ESTADO DE LA CITA | `singleSelect` | Disponibilidad | `choices: [Disponible, Reservada, Cancelada]` |
| 6 | CLIENTE | `multipleRecordLinks` | → CLIENTES | `linkedTableId: tblCLIENTES` |
| 7 | SERVICIO SOLICITADO | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 8 | NOTAS | `singleLineText` | Observaciones | — |

---

## 10. REPORTES

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | REPORTE ID | `singleLineText` | Campo principal — Identificador | — |
| 2 | FECHA CREACION | `date` | Fecha del reporte | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 3 | TIPO REPORTE | `singleSelect` | Categoría | `choices: [Rendimiento del Salón, Ventas, Inventario, Clientes, Empleados]` |
| 4 | DESCRIPCION | `singleLineText` | Detalle del reporte | — |
| 5 | DATOS VENTAS | `singleLineText` | Info de ventas | — |
| 6 | DATOS INVENTARIO | `multipleRecordLinks` | → INVENTARIO | `linkedTableId: tblINVENTARIO` |
| 7 | DATOS CLIENTES | `singleLineText` | Info de clientes | — |
| 8 | DATOS EMPLEADOS | `multipleRecordLinks` | → EMPLEADOS | `linkedTableId: tblEMPLEADOS` |
| 9 | ARCHIVO ADJUNTO | `multipleAttachments` | Documentos relacionados | — |

---

## 11. CAPACITACIONES

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NOMBRE DEL PROGRAMA | `singleLineText` | Campo principal — Título | — |
| 2 | DESCRIPCION DEL PROGRAMA | `singleLineText` | Detalles del contenido | — |
| 3 | FECHA DE INICIO | `date` | Inicio | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 4 | FECHA DE FINALIZACION | `date` | Fin | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 5 | DURACION (HORAS) | `number` | Tiempo total | `precision: 0` |
| 6 | COSTO | `currency` | Inversión requerida | `precision: 2, symbol: "$"` |
| 7 | EMPLEADOS PARTICIPANTES | `multipleRecordLinks` | → EMPLEADOS | `linkedTableId: tblEMPLEADOS` |
| 8 | SERVICIOS RELACIONADOS | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 9 | MATERIALES DE CAPACITACION | `multipleAttachments` | Documentos y recursos | — |
| 10 | INSTRUCTOR | `singleLineText` | Nombre del formador | — |

---

## 12. FICHA DE SERVICIOS

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NAME | `singleLineText` | Campo principal — Nombre de la tarea | — |
| 2 | NOTES | `richText` | Descripción detallada | — |
| 3 | ASSIGNEE | `collaborator` | Responsable asignado | — |
| 4 | STATUS | `singleSelect` | Estado de la tarea | `choices: [Todo, In progress, Done]` |

> **Nota:** Esta tabla es auxiliar tipo "project tracker" de Airtable. Mantiene los nombres originales del PDF.

---

## 13. COSTOS FIJOS PELUQUERIA

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | NOMBRE DEL GASTO | `singleLineText` | Campo principal — Descripción | — |
| 2 | CATEGORIA | `singleSelect` | Clasificación | `choices: [Alquiler, Servicios, Personal, Insumos, Otros]` |
| 3 | MONTO MENSUAL | `currency` | Valor mensual | `precision: 2, symbol: "$"` |
| 4 | NOTAS | `richText` | Observaciones adicionales | — |
| 5 | RESUMEN DE COSTOS FIJOS | `multipleRecordLinks` | → RESUMEN DE COSTOS FIJOS | `linkedTableId: tblRESUMEN_COSTOS_FIJOS` |
| 6 | VENTAS Y COBROS | `multipleRecordLinks` | → INGRESOS/EGRESOS | `linkedTableId: tblINGRESOS_EGRESOS` |

---

## 14. RESUMEN DE COSTOS FIJOS

| # | Campo | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|--------------|-------------|-------------------|
| 1 | FECHA | `date` | Campo principal — Período | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 2 | SERVICIOS PROMEDIO MENSUALES | `number` | Cantidad estimada | `precision: 0` |
| 3 | TOTAL COSTOS FIJOS | `currency` | Rollup de COSTOS FIJOS PELUQUERIA | `precision: 2, symbol: "$"` |
| 4 | COSTOS FIJOS PELUQUERIA | `multipleRecordLinks` | → COSTOS FIJOS PELUQUERIA | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA` |
| 5 | SERVICIOS | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |

**Fórmula:**

| # | Campo | Tipo | Fórmula |
|---|-------|------|---------|
| 6 | COSTO FIJO POR SERVICIO | `formula` → `currency` | `{TOTAL COSTOS FIJOS} / {SERVICIOS PROMEDIO MENSUALES}` |

---

## 15. INGRESOS/EGRESOS — `tblEoTMnKvkZzHDBf` (29 campos: 23 manual + 6 fórmulas)

| # | Campo | Field ID | Tipo Airtable | Descripción | Options / Fórmula |
|---|-------|----------|--------------|-------------|-------------------|
| 1 | Nº de Venta | `fldVMAe6hJxFBi6Xp` | `autoNumber` | 🔑 Campo principal — Número secuencial | — |
| 2 | Fecha de Venta | `fldrOkIwiFvbnh44A` | `date` | Día de la transacción | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 3 | Cliente | `fldIUfnFC5LEJTILT` | `multipleRecordLinks` | → CLIENTES | `linkedTableId: tblCLIENTES` |
| 4 | Servicio Realizado | `fldS2TRbLIIXwU6W9` | `multipleRecordLinks` | → SERVICIOS | `linkedTableId: tblSERVICIOS` |
| 5 | Medio de Pago | `fldOkodtnCWK454bp` | `singleSelect` | Forma de pago | `choices: ['Efectivo', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito', 'Mercado Pago']` |
| 6 | ¿Pagado? | `fldQ22TDuBP0aa5sT` | `checkbox` | Indicador de pago | — |
| 7 | Fecha de Cobro | `fldBjP10uVpy4xQAP` | `date` | Día del cobro | `dateFormat: {name: "iso", format: "YYYY-MM-DD"}` |
| 8 | Monto Cobrado | `fldYcPQfETpq13LZ1` | `currency` | Valor recibido | `precision: 2, symbol: "$"` |
| 9 | Notas | `fldx0K4gcrlAP9XU6` | `multilineText` | Observaciones | — |
| 10 | Valor del Servicio | `fldgkPmfBvRxbB4du` | `rollup` | Rollup de SERVICIOS | `linkedTableId: tblSERVICIOS, fieldIdInLinkedTable: VALOR DEL SERVICIO, formula: SUM(values)` |
| 11 | Productos | `fldJC2QdCVHk9EVkY` | `multipleRecordLinks` | → PRODUCTOS | `linkedTableId: tblPRODUCTOS` |
| 12 | Nombre del Producto | `fld7SpI4MkXPkBNbJ` | `lookup` | Lookup de Productos | `linkedTableId: tblPRODUCTOS, fieldIdInLinkedTable: NOMBRE DEL PRODUCTO` |
| 13 | Precio del Producto | `fldvXId1ImHMCwb0t` | `rollup` | Rollup de Productos | `linkedTableId: tblPRODUCTOS, fieldIdInLinkedTable: PRECIO DE VENTAS, formula: SUM(values)` |
| 14 | Ingresos | `fldcak5lgMUrwW9et` | `multipleSelects` | Clasificación | `choices: ['Ingresos', 'Egresos', 'Cobro Servicio', 'Cobro Deuda', 'Venta Productos']` |
| 15 | Ingresos Extras | `fldatiHvEGdK5tE14` | `currency` | Ingresos adicionales | `precision: 2, symbol: "$"` |
| 16 | Costos Fijos Peluquería | `fldigehx7eZst4cz9` | `singleLineText` | Info de costos (texto) | — |
| 17 | Costos Fijos Peluquería 2 | `fldbOE8gOAapxQbzO` | `multipleRecordLinks` | → COSTOS FIJOS PELUQUERIA | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA` |
| 18 | Egresos Fijos | `fldizgB79HOFIn7rD` | `lookup` | Lookup de Costos Fijos | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA, fieldIdInLinkedTable: MONTO MENSUAL` |
| 19 | Categoría | `fld9WKuj8zvUjEJld` | `lookup` | Lookup de categoría | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA, fieldIdInLinkedTable: CATEGORIA` |
| 20 | Nombre del Gasto | `fldIozrPFIrvjap0d` | `lookup` | Lookup del nombre | `linkedTableId: tblCOSTOS_FIJOS_PELUQUERIA, fieldIdInLinkedTable: NOMBRE DEL GASTO` |
| 21 | Descripcion de Egresos Variables | `fldv4ut2LfRWvPi8d` | `multilineText` | Detalle de gastos variables | — |
| 22 | Egresos variables | `fldhe3qi6vQlROnwi` | `currency` | Gastos no fijos | `precision: 2, symbol: "$"` |

**Campos calculados (fórmula):**

| # | Campo | Field ID | Tipo | Fórmula |
|---|-------|----------|------|---------|
| 23 | Total de la Venta | `fldRHpzMYfaHGSl7z` | `formula` → `currency` | `SUM({VALOR DEL SERVICIO}, {PRECIO DEL PRODUCTO})` |
| 24 | Estado de Cobro | `fldNC9wpS9tXZwdZU` | `formula` → `singleLineText` | `IF({¿PAGADO?}, "Cobrado", "Pendiente")` |
| 25 | Saldo Pendiente | `fldube2TTdCq1Z7pg` | `formula` → `currency` | `{TOTAL DE LA VENTA} - {MONTO COBRADO}` |
| 26 | Estado del Pago | `fldoGmJCZwnTtmeB8` | `formula` → `singleLineText` | `IF({SALDO PENDIENTE} = 0, "Pago Completo 🟢", IF({MONTO COBRADO} > 0, "Pago Parcial 🟡", "Impago 🔴"))` |
| 27 | Total Ingresos Gral | `fldlqLGrwI6X5uphk` | `formula` → `currency` | `SUM({MONTO COBRADO} + {INGRESOS EXTRAS})` |
| 28 | Total Egresos Gral | `fldJHkyWWILX3XmFu` | `formula` → `currency` | `SUM({EGRESOS FIJOS} + {EGRESOS VARIABLES})` |
| 29 | TOTAL NETO | `fldmlH6di5buKn2st` | `formula` → `currency` | `AVERAGE({TOTAL INGRESOS GRAL} - {TOTAL EGRESOS GRAL})` |

> ⚠️ **ERROR CONFIRMADO:** `TOTAL NETO` usa `AVERAGE()` en lugar de una resta directa. Matemáticamente es un no-op para un solo valor, pero indica error de diseño. Debería ser: `{TOTAL INGRESOS GRAL} - {TOTAL EGRESOS GRAL}`.

---

## Mapa de Relaciones

```
                         ┌─────────────┐
                         │   CLIENTES  │
                         └──────┬──────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
     ┌──────────┐        ┌──────────┐        ┌──────────────┐
     │  CITAS   │        │  AGENDA  │        │ PROMOCIONES  │
     └────┬─────┘        └────┬─────┘        └──────┬───────┘
          │                   │                      │
          └───────────────────┼──────────────────────┘
                              │
                              ▼
                       ┌────────────┐
                       │  SERVICIOS │ ◄────────────────┐
                       └──────┬─────┘                   │
                              │                         │
          ┌───────────────────┼───────────────────┐     │
          │                   │                   │     │
          ▼                   ▼                   ▼     │
    ┌───────────┐      ┌────────────┐     ┌──────────────────┐
    │ EMPLEADOS │      │ PRODUCTOS  │     │ CAPACITACIONES   │
    └─────┬─────┘      └──────┬─────┘     └──────────────────┘
          │                   │
          ▼                   ▼
    ┌───────────┐      ┌────────────┐
    │ REPORTES  │      │ INVENTARIO │
    └───────────┘      └──────┬─────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ PROVEEDORES │
                       └─────────────┘

    ┌─────────────────────────────────────────────┐
    │            INGRESOS/EGRESOS                  │
    │        (Tabla Central Financiera)            │
    └───────────────────┬─────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
┌───────────┐    ┌────────────┐    ┌──────────────────────┐
│ CLIENTES  │    │ SERVICIOS  │    │ COSTOS FIJOS         │
└───────────┘    └────────────┘    │ PELUQUERIA           │
                                   └──────────┬───────────┘
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │ RESUMEN COSTOS FIJOS │
                                   └──────────┬───────────┘
                                              │
                                              └──────────► SERVICIOS
```

---

## Vistas Recomendadas

| Vista | Tabla | Filtro / Agrupación | Propósito |
|-------|-------|---------------------|-----------|
| Citas del Día | CITAS | `FECHA DE LA CITA = TODAY()` | Operación diaria |
| Citas Pendientes | CITAS | `ESTADO DE LA CITA = "Programada"` | Seguimiento |
| Servicios Activos | SERVICIOS | Grid agrupado por categoría | Catálogo |
| Stock Bajo | PRODUCTOS | `NIVEL DE STOCK < 5` | Reabastecimiento |
| Promociones Vigentes | PROMOCIONES | `ESTADO = "Activa" AND FECHA_FIN >= TODAY()` | Marketing |
| Ingresos del Mes | INGRESOS/EGRESOS | `FECHA DE VENTA = THIS_MONTH()` | Finanzas |
| Cobros Pendientes | INGRESOS/EGRESOS | `¿PAGADO? = FALSE` | Cobranza |
| Próximas Capacitaciones | CAPACITACIONES | `FECHA DE INICIO >= TODAY()` | RRHH |
| Agenda Semanal | AGENDA | Calendar view | Planificación |
| Resumen Financiero | INGRESOS/EGRESOS | Gallery/Summary | Dashboard |

---

## Verificación Pre-Implementación

- [ ] Todas las tablas creadas con nombres exactos (MAYÚSCULAS, sin acentos)
- [ ] Campos `date` con `dateFormat: {name: "iso", format: "YYYY-MM-DD"}`
- [ ] Campos `currency` con `precision: 2, symbol: "$"`
- [ ] Campos `number` con `precision: 0` (enteros) o `precision: 2` (decimales)
- [ ] `multipleRecordLinks` solo con `linkedTableId` (sin `isReversed`, `prefersSingleRecordLink`)
- [ ] `singleSelect` / `multipleSelect` con choices exactos del PDF
- [ ] Fórmulas en Airtable usan nombres de campo en español con llaves `{}`
- [ ] `autoNumber` en Nº DE VENTA para secuencial automático
- [ ] `collaborator` en campos COLABORADOR y ASSIGNEE
- [ ] `multipleAttachments` en FOTO, ARCHIVO ADJUNTO, etc.
- [ ] `barcode` en CODIGO BARRA y UBICACION X CODIGO DE BARRA
- [ ] `createdTime` / `lastModifiedTime` NO incluidos en payload de creación (son automáticos)
- [ ] `createdBy` / `lastModifiedBy` NO incluidos en payload de creación (son automáticos)
- [ ] Rollups requieren que la tabla vinculada ya exista
- [ ] Lookups requieren `linkedTableId` + `fieldIdInLinkedTable` válidos

---

## Pitfalls Específicos de Este Schema

### 1. Dependencia circular SERVICIOS ↔ RESUMEN DE COSTOS FIJOS
- SERVICIOS → COSTO FIJO X SERVICIOS (lookup de RESUMEN DE COSTOS FIJOS)
- RESUMEN DE COSTOS FIJOS → SERVICIOS (linked record)
- **Solución:** Crear primero RESUMEN DE COSTOS FIJOS, luego el lookup en SERVICIOS

### 2. Fórmula AVERAGE en TOTAL NETO
- El PDF usa `AVERAGE({TOTAL INGRESOS GRAL} - {TOTAL EGRESOS GRAL})` — probablemente error
- **Recomendación:** Verificar con Diego antes de implementar

### 3. Campos de texto libre con "Información de ventas"
- `VENTAS` en CLIENTES, EMPLEADOS, PRODUCTOS y `VENTAS 2` son texto libre
- **Recomendación:** Evaluar si deberían ser linked records o rollups

### 4. FICHA DE SERVICIOS usa nombres en inglés
- `NAME`, `NOTES`, `ASSIGNEE`, `STATUS` — del PDF original
- Si se estandariza: `NOMBRE`, `NOTAS`, `ASIGNADO`, `ESTADO`

### 5. Límites del Meta API (plan gratuito)
- No se pueden modificar campos existentes por API
- No se pueden renombrar campos por API
- **Implicación:** Correcciones deben hacerse desde UI de Airtable

---

## Orden de Creación de Tablas

Para evitar errores de dependencia en linked records:

1. CLIENTES
2. EMPLEADOS
3. SERVICIOS (sin COSTO FIJO X SERVICIOS)
4. PROVEEDORES
5. PRODUCTOS (sin lookups a PROVEEDORES)
6. INVENTARIO
7. PROMOCIONES
8. AGENDA
9. CITAS
10. REPORTES
11. CAPACITACIONES
12. FICHA DE SERVICIOS
13. COSTOS FIJOS PELUQUERIA
14. RESUMEN DE COSTOS FIJOS
15. INGRESOS/EGRESOS

**Después de crear todas las tablas:**
- Agregar campos lookup/rollup con `POST /meta/bases/{baseId}/tables/{tableId}/fields`
- Las fórmulas se pueden incluir en la creación inicial

---

## Estado de Fase Maestra

| Dimensión | Estado | Detalle |
|-----------|--------|---------|
| Schema Airtable | ✅ COMPLETO | 15 tablas, 210 campos — verificado vía API REST |
| Frontend | ✅ IMPLEMENTADO | HTML/CSS/JS vanilla (2458 líneas) + api.js (758 líneas) |
| Deploy | ✅ DESPLEGADO | https://gestion-desalones-de-belleza.surge.sh |
| Token | ✅ FIXED (SALON-011) | Inyectado vía variable global `__AIRTABLE_TOKEN__`, no en código fuente |
| Cache | ✅ FIXED (SALON-010b) | localStorage + 5-min TTL + invalidación |
| Rate Limiting | ✅ IMPLEMENTADO | Token bucket (5 req/s) + retry con backoff |

**Vistas implementadas (8/16):** Dashboard, Clientes, Citas, Servicios, Empleados, Caja (Ingresos/Egresos), Productos, Reportes

**Vistas pendientes (8):** Proveedores, Promociones, Agenda, Capacitaciones, Inventario, FichaServicios, CostosFijos, ResumenCostos, IngresosEgresos *(render functions existentes en api.js, sin página dedicada en frontend)*

### Bugs Conocidos Post-Implementación

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| CRIT-1 | 🔴 Crítico | Linked records muestran IDs crudos — falta resolución | ⚠️ No corregido |
| CRIT-2 | 🔴 Crítico | Valor del Servicio = $0 si VHH y Costo Fijo = 0 | ⚠️ No corregido (dato Airtable) |
| CRIT-3 | 🔴 Crítico | Dashboard "Clientes Más Frecuentes" tiene placeholder | ⚠️ No corregido |
| MED-1 | 🟡 Medio | Email/Teléfono son `singleLineText`, no `email`/`phone` | ✅ Documentado (no requiere fix) |
| LOW-1 | 🟢 Bajo | `TOTAL NETO` usa `AVERAGE()` en vez de resta directa | ⚠️ No corregido (dato Airtable) |
| DE-001 | 🔵 Info | Surge false negative: "Error - Deployment did not succeed" pero deploy real funciona | ✅ Documentado |

---

## Historial de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 2.1 | 2026-06-02 | Docs / Progress Manager | Estado Fase Maestra Completa. Documentación post-implementación. |
| 2.0 | 2026-06-02 | Backend / Data Architect | Verificación vía API REST. Field IDs reales confirmados. |
| 1.0 | 2026-06-01 | Backend / Data Architect | Versión inicial del schema Airtable. |
