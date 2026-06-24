# PRODUCT_CONTRACT — Gestión de Salones de Belleza

> **Versión:** 2.1 | **P0.1:** 2026-06-03 | **Fecha:** 2026-06-02 | **Autor:** Docs / Progress Manager
> **Base Airtable:** `app93Vhy56KrxNhwe` | **Tablas:** 15 | **Campos:** 210
> **Backend:** Exclusivamente Airtable. Sin Supabase.
> **Estado:** P0.1 CORRECCIONES COMPLETADO ✅ — FIX-1 a FIX-8 aplicados, Dashboard corregido, 5 campos deprecados, Inventario ↔ Movimientos conectado — Frontend web implementado y desplegado
> **Deploy:** https://gestion-desalones-de-belleza.surge.sh

---

## ⚠️ Cambios P0.1 (2026-06-03)

### Campos Deprecados
- `Citas.Agenda 2` → `DEPRECATED_Agenda 2`
- `Agenda.Cita Asignada` → `DEPRECATED_Cita Asignada`
- `Productos.Inventario copy` → `DEPRECATED_Inventario copy`
- `Productos.Ventas 2` → `DEPRECATED_Ventas 2`
- `Inventario.Cantidad en Stock copy` → `DEPRECATED_Cantidad en Stock copy`

### Nuevos Campos
- `Movimientos de Inventario.Inventario` (`fld0Wcy7kASO5wZO1`) — linked → Inventario
- `Inventario.Movimientos` (`fldIKAngwdW4Anoby`) — linked → Movimientos de Inventario
- `Movimientos de Inventario.Cantidad Firmada` (`fldg8szjp9fy6uFI8`) — fórmula con signo

### Fuente de Verdad de Stock
- **Inventario** es la fuente canónica (vía `Stock Actual` rollup pendiente de crear manualmente en UI)
- `Productos.Nivel de Stock` es informativo (manual), no canónico

---

## Información General de la API

| Concepto | Valor |
|----------|-------|
| Base URL | `https://api.airtable.com/v0/app93Vhy56KrxNhwe` |
| Auth | `Authorization: Bearer {PAT}` |
| Content-Type | `application/json` |
| Rate Limit | 5 req/s por base (plan gratuito) |
| Paginación | `offset` en response (cursor-based) |
| Max page size | 100 registros por request |

---

## 1. Endpoints por Tabla

### Clientes

**Table ID:** `tblzRwPeOVTdsvt5g`  
**Primary Field:** `Nombre` (`fldV3oSp0rQG164P0`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldV3oSp0rQG164P0` | Nombre | `singleLineText` |
| `fldvop4ccFLJ92hPg` | Email | `singleLineText` |
| `fld8Lh9IHwenxZjna` | Teléfono | `singleLineText` |
| `fld0pEr4DPwB9N8CN` | Dirección | `singleLineText` |
| `fldeqOtsb5yeDs64C` | Historial de Citas | `multipleRecordLinks` → `tblZNB7HfD3OAGL9x` |
| `fldy6H1LmkD13vFR9` | Preferencias de Servicios | `multipleSelects` → `Corte de pelo`, `Coloración`, `Manicura`, `Pedicura`, `Tratamiento facial` |
| `fldQ8yczUIlGffHUJ` | Foto de Perfil | `multipleAttachments` |
| `fldMAIyn39YaRiOHL` | Ventas | `singleLineText` |
| `fldFeKRWZz3yBbCZu` | Promociones | `multipleRecordLinks` → `tblc8HGTbiXL5rsk8` |
| `fldRZ6DaWXYizJf6z` | Agenda | `multipleRecordLinks` → `tbltQl7ljsgTBpkr1` |
| `fldN0PeTombZ183gc` | Ultima actualización | `lastModifiedTime` |
| `fldZbsF460kq9uhlu` | Creación | `createdTime` |
| `fld5NEn0PPAQk2Rqu` | Colaborador | `singleCollaborator` |
| `fldlxYuGaEbG3F5gt` | Creado por | `createdBy` |
| `fldqoK2Fj7hN1g45B` | Última modificación | `lastModifiedBy` |
| `flddkOmZLBpzGIqZh` | Ventas y Cobros | `multipleRecordLinks` → `tblEoTMnKvkZzHDBf` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Clientes?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Clientes/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Clientes`
- `PATCH /v0/app93Vhy56KrxNhwe/Clientes/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Clientes/{recordId}`

**Vistas (2):**
- `Grid view` (grid)
- `Galería` (gallery)

---

### Citas

**Table ID:** `tblZNB7HfD3OAGL9x`  
**Primary Field:** `Hora de la Cita` (`fldG6YIGmwT9emkqF`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldG6YIGmwT9emkqF` | Hora de la Cita | `singleLineText` |
| `fldHKaoo3lNK7p5vq` | Fecha de la Cita | `date` |
| `fldQHCVDkYHlDdwor` | Cliente | `multipleRecordLinks` → `tblzRwPeOVTdsvt5g` |
| `fldNvyU70wMXQLX1U` | Servicio Solicitado | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldYkP2gZv60rQEKf` | Profesional Asignado | `multipleRecordLinks` → `tblxodPS9acp1kyoU` |
| `fldweePEyhJd9cdec` | Estado de la Cita | `singleSelect` → `Programada`, `Completada`, `Cancelada` |
| `fldB7vWK5rHlEtunu` | Notas de la Cita | `singleLineText` |
| `fldh8uAqlsp2NTBzW` | Ultima actualización | `lastModifiedTime` |
| `fldQITsxBObLr4A7A` | Creación | `createdTime` |
| `fldoD3FYsqsST26mh` | Colaborador | `singleCollaborator` |
| `fldXtw13vp3a28v5H` | Creado por | `createdBy` |
| `fldRelJBnsOagVTpL` | Última modificación por | `lastModifiedBy` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Citas?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Citas/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Citas`
- `PATCH /v0/app93Vhy56KrxNhwe/Citas/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Citas/{recordId}`

**Vistas (4):**
- `Grid view` (grid)
- `Calendar` (calendar)
- `Timeline` (timeline)
- `Kanban` (kanban)

---

### Servicios

**Table ID:** `tblIDRFHpLoQpB9JH`  
**Primary Field:** `Nombre del Servicio` (`fldZsbrskognxGBD4`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldZsbrskognxGBD4` | Nombre del Servicio | `singleLineText` |
| `fldKU9ynf2SvKehDm` | Foto del Servicio | `multipleAttachments` |
| `fldZzJ0JzTwhHbAUy` | Descripción del Servicio | `richText` |
| `fldxBYbrsCM9oVKFg` | Eslogan de Venta | `multilineText` |
| `fldDjOaCOjY0Pd8yD` | Productos utilizados | `multipleRecordLinks` → `tblkz2NvmwGBXHjpF` |
| `fldPnqR5wNGVye4VH` | Costo unitario x servicio Compilación (de Pro | `rollup` → ver options |
| `fldF3TvIOIfkivYJa` | Duración del Servicio | `number` → prec:0 |
| `fldRDJDRv38Dh7sPN` | Valor Hora Hombre | `currency` → $ (prec:2) |
| `fldRtObj9vsXu52YE` | Total Hora Hombre | `formula` → `{fldRDJDRv38Dh7sPN} * {fldF3TvIOIfkivYJa}...` |
| `fldrVUfMQYiueUmg6` | Costo Variable | `formula` → `({fldF3TvIOIfkivYJa} * {fldRDJDRv38Dh7sPN}) + {fldPnqR5wNGVy...` |
| `fldI385mvZ4GUMAGR` | Costo Fijo x Servicios | `multipleLookupValues` → ver options |
| `fldmliq7PR1hbFQQl` | Costo Total | `formula` → `SUM({fldI385mvZ4GUMAGR}, {fldrVUfMQYiueUmg6})...` |
| `fld7A4qW6MzhT5NYA` | Valor del Servicio | `formula` → `ROUND({fldmliq7PR1hbFQQl} * 2, 2)...` |
| `fldBDWD7kJ7VNKPzq` | Empleados Especializados | `multipleRecordLinks` → `tblxodPS9acp1kyoU` |
| `fldxM99GFrVIGzT5Z` | Promociones | `multipleRecordLinks` → `tblc8HGTbiXL5rsk8` |
| `fldt3zoyjwtLq4jYs` | Citas | `multipleRecordLinks` → `tblZNB7HfD3OAGL9x` |
| `fld0boUDfiUuP6TG5` | Agenda | `multipleRecordLinks` → `tbltQl7ljsgTBpkr1` |
| `fldOUsEA3eMVfoHZi` | Creado por | `createdBy` |
| `fldPklNtK283C7OGY` | Última modificación por | `lastModifiedBy` |
| `flda6uvnGvHUZKO7R` | Ultima modificación | `lastModifiedTime` |
| `fldGF7gPT3gUsHM6Y` | Creación | `createdTime` |
| `fldevuNAA1ebK8Yar` | Colaborador | `singleCollaborator` |
| `fldP43JK19fKyThdY` | Maestra Contable | `singleLineText` |
| `fldEQO4y0KPoU9GLR` | Capacitaciones | `multipleRecordLinks` → `tblpDKylzRWU0QTuL` |
| `fld01wlXKPUcBC4dr` | Resumen de Costos Fijos | `multipleRecordLinks` → `tbl7MRYpZJI0kEet1` |
| `fldj9c07I0s5yrKy1` | Ventas y Cobros | `multipleRecordLinks` → `tblEoTMnKvkZzHDBf` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Servicios?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Servicios/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Servicios`
- `PATCH /v0/app93Vhy56KrxNhwe/Servicios/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Servicios/{recordId}`

**Vistas (3):**
- `Grid view` (grid)
- `Gallery` (gallery)
- `List` (levels)

---

### Empleados

**Table ID:** `tblxodPS9acp1kyoU`  
**Primary Field:** `Nombre` (`fldGeBG3u6b7tg50g`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldGeBG3u6b7tg50g` | Nombre | `singleLineText` |
| `fldT1Fomf9JJA6pNw` | Apellido | `singleLineText` |
| `fldoL3JLvbmjKeszB` | Foto de Perfil | `multipleAttachments` |
| `fldXk7Eur3X5LYH5M` | Teléfono | `phoneNumber` |
| `fldPyYzjYLIzlaB4V` | Correo Electrónico | `email` |
| `fldDucGe1Qop9GGhq` | Dirección | `singleLineText` |
| `fldDqy6SXb3tXtKUw` | Fecha de Contratación | `date` |
| `fldzkWfuYGtsPIUQf` | Especialidad | `multipleSelects` → `Corte de cabello`, `Coloración`, `Manicura`, `Pedicura`, `Maquillaje`, `Barbería`, `Tratamientos y Alisados`, `Asistente` |
| `fldemKejDF0JiNlTY` | Horario de Trabajo | `richText` |
| `fldS5akvbG2hcj0dJ` | Citas Asignadas | `multipleRecordLinks` → `tblZNB7HfD3OAGL9x` |
| `flddK9sLuxCEUE6Qj` | Capacitaciones Completadas | `multipleRecordLinks` → `tblpDKylzRWU0QTuL` |
| `fldegUIpNZiR2iy6c` | Servicios | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldG2Tt5j2SDFGPQA` | Ventas | `singleLineText` |
| `fldpR4Rs6cpRak352` | Agenda | `multipleRecordLinks` → `tbltQl7ljsgTBpkr1` |
| `fldTlTY1QqSOTi7Qp` | Reportes | `multipleRecordLinks` → `tblblfVCv2Wbn0v4u` |
| `fldO79C8OyXXbhgzi` | Ultima modificación | `lastModifiedTime` |
| `fldvjjZUT1pB94LsF` | Creación | `createdTime` |
| `fldTen7NEozNID7Sj` | Colaborador | `singleCollaborator` |
| `fldxx3gNu5H8Ki5Hu` | Creado por | `createdBy` |
| `fldb3E45q6ondGMXc` | Última modificación por | `lastModifiedBy` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Empleados?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Empleados/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Empleados`
- `PATCH /v0/app93Vhy56KrxNhwe/Empleados/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Empleados/{recordId}`

**Vistas (3):**
- `Grid view` (grid)
- `Gallery` (gallery)
- `List` (levels)

---

### Proveedores

**Table ID:** `tblVLjaYzT3kb1k4c`  
**Primary Field:** `Nombre del Proveedor` (`fldBmxfetYEWXch52`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldBmxfetYEWXch52` | Nombre del Proveedor | `singleLineText` |
| `fldf6BPf4Tv3CrSjy` | Foto del Proovedor | `multipleAttachments` |
| `fldTLQ6U0RbQyXm5a` | Contacto del Proveedor | `singleLineText` |
| `fldgHPkLdF6olVMnn` | Teléfono del Proveedor | `singleLineText` |
| `fldmfIgGBpL7GP4W1` | Email del Proveedor | `singleLineText` |
| `fldsqanlONV75Uywz` | WEB | `url` |
| `fldeA4F2zAnLL92tr` | Dirección del Proveedor | `singleLineText` |
| `fldqImoFKc2JV0lu2` | Términos de Compra | `singleLineText` |
| `fldzRM2JhqL7nTXNL` | Ultima modificación | `lastModifiedTime` |
| `fldQnzn0IC5g8cniT` | Colaborador | `singleCollaborator` |
| `fldFO89U0QVpTI0tS` | Creación | `createdTime` |
| `fld1VLPWfPj3nxLJY` | Inventario | `singleLineText` |
| `fld3XFKZiN9yaNfQu` | Productos | `multipleRecordLinks` → `tblkz2NvmwGBXHjpF` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Proveedores?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Proveedores/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Proveedores`
- `PATCH /v0/app93Vhy56KrxNhwe/Proveedores/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Proveedores/{recordId}`

**Vistas (2):**
- `Grid view` (grid)
- `Gallery` (gallery)

---

### Productos

**Table ID:** `tblkz2NvmwGBXHjpF`  
**Primary Field:** `Nombre del Producto` (`fldRbagqaTubMYkfY`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldRbagqaTubMYkfY` | Nombre del Producto | `singleLineText` |
| `fldo50SOrWq88LGOW` | Codigo Barra | `barcode` |
| `fldTeyjU96EaakAFe` | Foto del Producto | `multipleAttachments` |
| `fldeY1C4fGpkITJFi` | Marca | `multipleSelects` → `Fidelitte`, `Tec Italy`, `Caviar`, `Kostume`, `Dompel`, `TIGI`, `Robso Peluquero`, `NovaLook` (+4) |
| `fld4lqtTmOWPoYqe5` | Proveedor | `multipleRecordLinks` → `tblVLjaYzT3kb1k4c` |
| `fldiZjqnzKkkIzxC2` | Descripción del Producto | `richText` |
| `fldM3s2DzJnKnicVc` | Modo de Uso | `richText` |
| `fld2I1bgyNmjnZPk4` | Rendimiento | `number` → prec:0 |
| `fldfiYAidXlkuHdM2` | Tipo de USO | `multipleSelects` → `CONSUMO INTERNO`, `VENTAS`, `CONSUMO EN SERVICIOS`, `` |
| `fldXy7B3iV1MV6vku` | Slogan de Venta | `richText` |
| `fldTJGZHvXupyilYy` | Nivel de Stock | `number` → prec:0 |
| `fldh6PW1oYMW40ibo` | Precio del Producto | `currency` → $ (prec:2) |
| `fldAMEkSTp2orMbkP` | Costo del Envio | `currency` → $ (prec:2) |
| `flda9yzAAlq8Yzfcy` | 💰 Total Producto + Envío | `formula` → `"$" & ({fldh6PW1oYMW40ibo} + {fldAMEkSTp2orMbkP})...` |
| `fld7NXguen3IEYdDK` | Costo unitario x servicio | `formula` → `ROUND(({fldh6PW1oYMW40ibo} + {fldAMEkSTp2orMbkP}) / {fld2I1b...` |
| `fldjKFqMLiTZa5Nno` | Precio de Ventas | `formula` → `ROUND({fldh6PW1oYMW40ibo} + {fldAMEkSTp2orMbkP}, 2) * 1.5...` |
| `fld6vOedAG2j66mhz` | Nombre del Proveedor (from Proveedor) | `multipleLookupValues` → ver options |
| `flddYSvohc8IzQ2mS` | Categoría del Producto | `singleSelect` → `Cuidado del Cabello`, `Keratinas , Botox y Alisados`, `Herramientas`, `Coloración `, `Almacen`, `Limpieza` |
| `fldsVLeAp9mr6YfnW` | Inventario copy | `multipleLookupValues` → ver options |
| `fldeMsyisB53qj4R0` | Ventas | `singleLineText` |
| `fld788BF9y3dmEB7M` | Promociones | `multipleRecordLinks` → `tblc8HGTbiXL5rsk8` |
| `fldtTEIRaMj8gE0TU` | Última Actualización | `lastModifiedTime` |
| `fldmozbLcV9nhTfPv` | Creación | `createdTime` |
| `fldo62jXpiGI031SW` | Colaborador | `singleCollaborator` |
| `fldzMYA2hEfRhpVeU` | Ventas 2 | `singleLineText` |
| `fldGTEITj1W2Z8cIp` | Servicios | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldRWnZzZdlXbpPct` | Ventas y Cobros | `multipleRecordLinks` → `tblEoTMnKvkZzHDBf` |
| `flddCGJQCm555zvuX` | Maestra Contable | `singleLineText` |
| `fldowByNJUHIezp1e` | Inventario | `multipleRecordLinks` → `tblNz69ntR4zvHjH1` |
| `fldBqC19bxzogCwLC` | Creado por | `createdBy` |
| `fldFfEmHykpuAmxfu` | Última modificación por | `lastModifiedBy` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Productos?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Productos/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Productos`
- `PATCH /v0/app93Vhy56KrxNhwe/Productos/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Productos/{recordId}`

**Vistas (4):**
- `Grid view` (grid)
- `Gallery` (gallery)
- `Kanban` (kanban)
- `List` (levels)

---

### Inventario

**Table ID:** `tblNz69ntR4zvHjH1`  
**Primary Field:** `Ubicación X codigo de barra` (`fldcCiDWsiVmwNKOs`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldcCiDWsiVmwNKOs` | Ubicación X codigo de barra | `barcode` |
| `fldowD9lID3N0EPAk` | Producto | `multipleRecordLinks` → `tblkz2NvmwGBXHjpF` |
| `fldVYFKv3nP8TTBLD` | Cantidad en Stock copy | `multipleLookupValues` → ver options |
| `fldVJmOxteJXoTYdR` | Fecha de Última Actualización | `date` |
| `fldZLYM5c93h6Dj1e` | Proveedor Asociado | `rollup` → ver options |
| `fldQa7RkEmlRpUYxr` | Notas de Inventario | `singleLineText` |
| `fldPUXAFivuF3JWxO` | Reportes | `multipleRecordLinks` → `tblblfVCv2Wbn0v4u` |
| `fldCLrbt5SelZsif3` | Ultima modificación | `lastModifiedTime` |
| `fldHHKOPTZUSyvQq1` | Creación | `createdTime` |
| `fldKvbBsSOaKPm9qn` | Colaborador | `singleCollaborator` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Inventario?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Inventario/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Inventario`
- `PATCH /v0/app93Vhy56KrxNhwe/Inventario/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Inventario/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---

### Promociones

**Table ID:** `tblc8HGTbiXL5rsk8`  
**Primary Field:** `Nombre de la Promoción` (`fld08fWoYWqYratNb`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fld08fWoYWqYratNb` | Nombre de la Promoción | `singleLineText` |
| `fldtFUzt0xdmmH2sl` | Descripción de la Promoción | `singleLineText` |
| `fldfgHIdwHE560JqC` | Fecha de Inicio | `date` |
| `fldGDOn0dwM4uU1gT` | Fecha de Fin | `date` |
| `fldu3MhZbkQNOOhCs` | Descuento | `number` → prec:2 |
| `fldScBUJxeM9SZWZi` | Servicios Incluidos | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldoqA5BuSnea2Pv3` | Productos Incluidos | `multipleRecordLinks` → `tblkz2NvmwGBXHjpF` |
| `fld2vVmpq5laXhCQo` | Clientes Objetivo | `multipleRecordLinks` → `tblzRwPeOVTdsvt5g` |
| `fldV57jhEq1r6cxKM` | Estado de la Promoción | `singleSelect` → `Activa`, `Inactiva`, `Expirada` |
| `fldwa3wOkrPqlY3Pj` | Imagen de la Promoción | `multipleAttachments` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Promociones?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Promociones/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Promociones`
- `PATCH /v0/app93Vhy56KrxNhwe/Promociones/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Promociones/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---

### Agenda

**Table ID:** `tbltQl7ljsgTBpkr1`  
**Primary Field:** `Hora de Inicio` (`fldNT90QG0XQJGakJ`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldNT90QG0XQJGakJ` | Hora de Inicio | `singleLineText` |
| `fld53mKk0oVfed2fd` | Fecha | `date` |
| `fldZncjH34WAWN9GQ` | Hora de Fin | `singleLineText` |
| `fldUWyFhOsDUlZUX0` | Empleado Asignado | `multipleRecordLinks` → `tblxodPS9acp1kyoU` |
| `fldFRNKbM9P7hQRC7` | Estado de la Cita | `singleSelect` → `Disponible`, `Reservada`, `Cancelada` |
| `fldESury121FEUtvZ` | Cliente | `multipleRecordLinks` → `tblzRwPeOVTdsvt5g` |
| `fldJ8hWhXBGX1Vs6t` | Servicio Solicitado | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldleCdJVFZiUFALH` | Notas | `singleLineText` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Agenda?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Agenda/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Agenda`
- `PATCH /v0/app93Vhy56KrxNhwe/Agenda/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Agenda/{recordId}`

**Vistas (3):**
- `Grid view` (grid)
- `Calendar` (calendar)
- `Timeline` (timeline)

---

### Reportes

**Table ID:** `tblblfVCv2Wbn0v4u`  
**Primary Field:** `ReporteID` (`fldpSOBrmzYK2sSIm`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldpSOBrmzYK2sSIm` | ReporteID | `singleLineText` |
| `fldXlnZdYpvlt1Puv` | FechaCreacion | `date` |
| `fldea5EAywXDUevGt` | TipoReporte | `singleSelect` → `Rendimiento del Salón`, `Ventas`, `Inventario`, `Clientes`, `Empleados` |
| `fldU5VM9NWI4Y4rzC` | Descripcion | `singleLineText` |
| `fld5wzaDY3deyv9nl` | DatosVentas | `singleLineText` |
| `fldbfxtuAc9wkO6t5` | DatosInventario | `multipleRecordLinks` → `tblNz69ntR4zvHjH1` |
| `fldFXtBrShD82UNGG` | DatosClientes | `singleLineText` |
| `fldqrueXU2ucBuC4w` | DatosEmpleados | `multipleRecordLinks` → `tblxodPS9acp1kyoU` |
| `fldi2mLfidV98QHNc` | ArchivoAdjunto | `multipleAttachments` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Reportes?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Reportes/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Reportes`
- `PATCH /v0/app93Vhy56KrxNhwe/Reportes/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Reportes/{recordId}`

**Vistas (2):**
- `Grid view` (grid)
- `Kanban` (kanban)

---

### Capacitaciones

**Table ID:** `tblpDKylzRWU0QTuL`  
**Primary Field:** `Nombre del Programa` (`fld7JwmUkSVcvVtlN`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fld7JwmUkSVcvVtlN` | Nombre del Programa | `singleLineText` |
| `fld1pIEBteacKDJnU` | Descripción del Programa | `singleLineText` |
| `fldDJRL1yMW1uBKVS` | Fecha de Inicio | `date` |
| `fldcZuqSsniefz9Ty` | Fecha de Finalización | `date` |
| `fldm0cLPaaxu1nrk8` | Duración (Horas) | `number` → prec:0 |
| `fld5Nfb8xH6mqfOBs` | Costo | `currency` → $ (prec:2) |
| `fldef7Ug0BYwAtS2W` | Empleados Participantes | `multipleRecordLinks` → `tblxodPS9acp1kyoU` |
| `fldq6rvRnBx2YHrbS` | Servicios Relacionados | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldciH7j6dJUMvPow` | Materiales de Capacitación | `multipleAttachments` |
| `fldCDRC5QkjyatCs7` | Instructor | `singleLineText` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Capacitaciones?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Capacitaciones/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Capacitaciones`
- `PATCH /v0/app93Vhy56KrxNhwe/Capacitaciones/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Capacitaciones/{recordId}`

**Vistas (2):**
- `Grid view` (grid)
- `Gallery` (gallery)

---

### ficha de servicios

**Table ID:** `tblsCoMUqOmpI9bfc`  
**Primary Field:** `Name` (`fldch22BOJAYHLzJi`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldch22BOJAYHLzJi` | Name | `singleLineText` |
| `fldsvXfqWHbhOH99I` | Notes | `multilineText` |
| `fldq8YEYEeNqfkhCO` | Assignee | `singleCollaborator` |
| `fld8Pk85iYHQ1fQx6` | Status | `singleSelect` → `Todo`, `In progress`, `Done` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/ficha%20de%20servicios?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/ficha%20de%20servicios/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/ficha%20de%20servicios`
- `PATCH /v0/app93Vhy56KrxNhwe/ficha%20de%20servicios/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/ficha%20de%20servicios/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---

### Costos Fijos Peluquería

**Table ID:** `tbl3LmPm9B32hghHi`  
**Primary Field:** `Nombre del Gasto` (`fldmdlxsaP7b2A9AR`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldmdlxsaP7b2A9AR` | Nombre del Gasto | `singleLineText` |
| `fldmMMJIlqLBvVNuJ` | Categoría | `singleSelect` → `Alquiler`, `Servicios`, `Personal`, `Insumos`, `Otros` |
| `fldjqDTkFMQrpUjEQ` | Monto Mensual | `currency` → $ (prec:0) |
| `fldJrI8xys6DH1dAS` | Notas | `multilineText` |
| `fld9ftVXJxpArXfxO` | Resumen de Costos Fijos | `multipleRecordLinks` → `tbl7MRYpZJI0kEet1` |
| `fldl5nWZi725cxDyo` | Ventas y Cobros | `multipleRecordLinks` → `tblEoTMnKvkZzHDBf` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Costos%20Fijos%20Peluquería?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Costos%20Fijos%20Peluquería/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Costos%20Fijos%20Peluquería`
- `PATCH /v0/app93Vhy56KrxNhwe/Costos%20Fijos%20Peluquería/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Costos%20Fijos%20Peluquería/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---

### Resumen de Costos Fijos

**Table ID:** `tbl7MRYpZJI0kEet1`  
**Primary Field:** `Fecha` (`fldWY5ZUYtRQI8I1L`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldWY5ZUYtRQI8I1L` | Fecha | `date` |
| `fldwu3VHos0cQ05x7` | Servicios Promedio Mensuales | `number` → prec:0 |
| `fldDTZx599h11JDzK` | Total Costos Fijos | `rollup` → ver options |
| `fldI7tKAJw7GRw1LA` | Costos Fijos Peluquería | `multipleRecordLinks` → `tbl3LmPm9B32hghHi` |
| `fldpwDgpqJ7efWuqC` | Costo Fijo por Servicio | `formula` → `{fldDTZx599h11JDzK} / {fldwu3VHos0cQ05x7}...` |
| `fld0FxAQ7nDhsLZRa` | Servicios | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/Resumen%20de%20Costos%20Fijos?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/Resumen%20de%20Costos%20Fijos/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/Resumen%20de%20Costos%20Fijos`
- `PATCH /v0/app93Vhy56KrxNhwe/Resumen%20de%20Costos%20Fijos/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/Resumen%20de%20Costos%20Fijos/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---

### INGRESOS/EGRESOS

**Table ID:** `tblEoTMnKvkZzHDBf`  
**Primary Field:** `Nº de Venta` (`fldVMAe6hJxFBi6Xp`)

| Field ID | Nombre | Tipo |
|----------|--------|------|
| `fldVMAe6hJxFBi6Xp` | Nº de Venta | `autoNumber` |
| `fldrOkIwiFvbnh44A` | Fecha de Venta | `date` |
| `fldIUfnFC5LEJTILT` | Cliente | `multipleRecordLinks` → `tblzRwPeOVTdsvt5g` |
| `fldS2TRbLIIXwU6W9` | Servicio Realizado | `multipleRecordLinks` → `tblIDRFHpLoQpB9JH` |
| `fldgkPmfBvRxbB4du` | Valor del Servicio (from Servicio Realizado) | `rollup` → ver options |
| `fldJC2QdCVHk9EVkY` | Productos | `multipleRecordLinks` → `tblkz2NvmwGBXHjpF` |
| `fldvXId1ImHMCwb0t` | Precio del Producto | `rollup` → ver options |
| `fldRHpzMYfaHGSl7z` | Total de la Venta | `formula` → `SUM({fldgkPmfBvRxbB4du}, {fldvXId1ImHMCwb0t})...` |
| `fldOkodtnCWK454bp` | Medio de Pago | `singleSelect` → `Efectivo`, `Transferencia`, `Tarjeta Débito`, `Tarjeta Crédito`, `Mercado Pago` |
| `fldQ22TDuBP0aa5sT` | ¿Pagado? | `checkbox` |
| `fldBjP10uVpy4xQAP` | Fecha de Cobro | `date` |
| `fldNC9wpS9tXZwdZU` | Estado de Cobro | `formula` → `IF({fldQ22TDuBP0aa5sT}, "Cobrado", "Pendiente")...` |
| `fldYcPQfETpq13LZ1` | Monto Cobrado | `currency` → $ (prec:2) |
| `fldube2TTdCq1Z7pg` | Saldo Pendiente | `formula` → `{fldRHpzMYfaHGSl7z} - {fldYcPQfETpq13LZ1}...` |
| `fldoGmJCZwnTtmeB8` | Estado del Pago | `formula` → `IF({fldube2TTdCq1Z7pg} = 0, "Pago Completo 🟢", IF({fldYcPQfE...` |
| `fldx0K4gcrlAP9XU6` | Notas | `multilineText` |
| `fldatiHvEGdK5tE14` | Ingresos Extras | `currency` → $ (prec:2) |
| `fldlqLGrwI6X5uphk` | Total Ingresos Gral | `formula` → `SUM({fldYcPQfETpq13LZ1}+{fldatiHvEGdK5tE14})...` |
| `fldcak5lgMUrwW9et` | Ingresos | `multipleSelects` → `Ingresos`, `Egresos`, `Cobro Servicio`, `Cobro Deuda`, `Venta Productos` |
| `fldbOE8gOAapxQbzO` | Costos Fijos Peluquería 2 | `multipleRecordLinks` → `tbl3LmPm9B32hghHi` |
| `fld9WKuj8zvUjEJld` | Categoría (from Costos Fijos Peluquería 2) | `multipleLookupValues` → ver options |
| `fldizgB79HOFIn7rD` | Egresos Fijos | `multipleLookupValues` → ver options |
| `fldv4ut2LfRWvPi8d` | Descripcion de Egresos Variables | `multilineText` |
| `fldhe3qi6vQlROnwi` | Egresos variables | `currency` → $ (prec:2) |
| `fldJHkyWWILX3XmFu` | Total Egresos Gral | `formula` → `SUM({fldizgB79HOFIn7rD}+{fldhe3qi6vQlROnwi})...` |
| `fldmlH6di5buKn2st` | TOTAL NETO | `formula` → `AVERAGE({fldlqLGrwI6X5uphk}-{fldJHkyWWILX3XmFu})...` |
| `fld7SpI4MkXPkBNbJ` | Nombre del Producto | `multipleLookupValues` → ver options |
| `fldigehx7eZst4cz9` | Costos Fijos Peluquería | `singleLineText` |
| `fldIozrPFIrvjap0d` | Nombre del Gasto (from Costos Fijos Peluquerí | `multipleLookupValues` → ver options |

**Endpoints:**
- `GET /v0/app93Vhy56KrxNhwe/INGRESOS%2FEGRESOS?maxRecords=100`
- `GET /v0/app93Vhy56KrxNhwe/INGRESOS%2FEGRESOS/{recordId}`
- `POST /v0/app93Vhy56KrxNhwe/INGRESOS%2FEGRESOS`
- `PATCH /v0/app93Vhy56KrxNhwe/INGRESOS%2FEGRESOS/{recordId}`
- `DELETE /v0/app93Vhy56KrxNhwe/INGRESOS%2FEGRESOS/{recordId}`

**Vistas (1):**
- `Grid view` (grid)

---
## 2. Filtros Recomendados por Vista

Estos filterByFormula estan listos para usar en el frontend:

### Clientes - Busqueda por nombre
```
GET /v0/app93Vhy56KrxNhwe/tblzRwPeOVTdsvt5g
  ?filterByFormula=SEARCH(LOWER("{query}"), LOWER({Nombre}))
  &maxRecords=50
```

### Citas - Citas del dia
```
GET /v0/app93Vhy56KrxNhwe/tblZNB7HfD3OAGL9x
  ?filterByFormula=IS_SAME({Fecha de la Cita}, TODAY(), "day")
  &maxRecords=50
```

### Citas - Citas programadas
```
GET /v0/app93Vhy56KrxNhwe/tblZNB7HfD3OAGL9x
  ?filterByFormula={Estado de la Cita} = "Programada"
  &maxRecords=50
```

### Citas - Proximas 7 dias
```
GET /v0/app93Vhy56KrxNhwe/tblZNB7HfD3OAGL9x
  ?filterByFormula=AND({Fecha de la Cita} >= TODAY(), {Fecha de la Cita} <= DATEADD(TODAY(), 7, "days"))
  &maxRecords=50
```

### Servicios - Servicios activos
```
GET /v0/app93Vhy56KrxNhwe/tblIDRFHpLoQpB9JH
  ?filterByFormula={Valor del Servicio} > 0
  &maxRecords=50
```

### Productos - Stock bajo (< 5)
```
GET /v0/app93Vhy56KrxNhwe/tblkz2NvmwGBXHjpF
  ?filterByFormula={Nivel de Stock} < 5
  &maxRecords=50
```

### Productos - Por categoria
```
GET /v0/app93Vhy56KrxNhwe/tblkz2NvmwGBXHjpF
  ?filterByFormula={Categoria del Producto} = "Coloracion"
  &maxRecords=50
```

### Promociones - Vigentes
```
GET /v0/app93Vhy56KrxNhwe/tblc8HGTbiXL5rsk8
  ?filterByFormula=AND({Estado de la Promocion} = "Activa", {Fecha de Fin} >= TODAY())
  &maxRecords=50
```

### Agenda - Disponible hoy
```
GET /v0/app93Vhy56KrxNhwe/tbltQl7ljsgTBpkr1
  ?filterByFormula=AND({Fecha} = TODAY(), {Estado de la Cita} = "Disponible")
  &maxRecords=50
```

### INGRESOS/EGRESOS - Ingresos del mes
```
GET /v0/app93Vhy56KrxNhwe/tblEoTMnKvkZzHDBf
  ?filterByFormula=IS_SAME({Fecha de Venta}, TODAY(), "month")
  &maxRecords=50
```

### INGRESOS/EGRESOS - Cobros pendientes
```
GET /v0/app93Vhy56KrxNhwe/tblEoTMnKvkZzHDBf
  ?filterByFormula={Pagado?} = FALSE()
  &maxRecords=50
```

### INGRESOS/EGRESOS - Pagos completos
```
GET /v0/app93Vhy56KrxNhwe/tblEoTMnKvkZzHDBf
  ?filterByFormula={Saldo Pendiente} = 0
  &maxRecords=50
```

### Capacitaciones - Proximas
```
GET /v0/app93Vhy56KrxNhwe/tblpDKylzRWU0QTuL
  ?filterByFormula={Fecha de Inicio} >= TODAY()
  &maxRecords=50
```

### Reportes - Este mes
```
GET /v0/app93Vhy56KrxNhwe/tblblfVCv2Wbn0v4u
  ?filterByFormula=IS_SAME({Fecha Creacion}, TODAY(), "month")
  &maxRecords=50
```

---

## 3. Sort Defaults por Tabla

| Tabla | Sort Field | Direccion |
|-------|------------|-----------|
| Clientes | Creacion | desc |
| Citas | Fecha de la Cita | desc |
| Servicios | Nombre del Servicio | asc |
| Empleados | Nombre | asc |
| Proveedores | Nombre del Proveedor | asc |
| Productos | Nivel de Stock | asc |
| Inventario | Fecha de Ultima Actualizacion | desc |
| Promociones | Fecha de Inicio | desc |
| Agenda | Fecha | asc |
| Reportes | Fecha Creacion | desc |
| Capacitaciones | Fecha de Inicio | desc |
| ficha de servicios | Status | asc |
| Costos Fijos Peluqueria | Monto Mensual | desc |
| Resumen de Costos Fijos | Fecha | desc |
| INGRESOS/EGRESOS | Fecha de Venta | desc |

Ejemplo API:
```
GET /v0/app93Vhy56KrxNhwe/tblZNB7HfD3OAGL9x
  ?sort[0][field]=Fecha de la Cita
  &sort[0][direction]=desc
  &maxRecords=100
```

---

## 4. Datos Mock de Ejemplo

Payloads de ejemplo para testing del frontend:

### Clientes (POST)
```json
{
  "fields": {
    "Nombre": "Maria Garcia",
    "Email": "maria@email.com",
    "Telefono": "+54 11 5555-0101",
    "Direccion": "Av. Corrientes 1234, CABA",
    "Preferencias de Servicios": [
      "Corte de pelo",
      "Coloracion"
    ]
  }
}
```

### Citas (POST)
```json
{
  "fields": {
    "Hora de la Cita": "14:00",
    "Fecha de la Cita": "2026-06-10",
    "Estado de la Cita": "Programada",
    "Cliente": [
      "recXXXXXXXXXXXXXX"
    ],
    "Servicio Solicitado": [
      "recXXXXXXXXXXXXXX"
    ],
    "Profesional Asignado": [
      "recXXXXXXXXXXXXXX"
    ]
  }
}
```

### Servicios (POST)
```json
{
  "fields": {
    "Nombre del Servicio": "Corte + Color",
    "Duracion del Servicio": 90,
    "Valor Hora Hombre": 2500.0
  }
}
```

### Productos (POST)
```json
{
  "fields": {
    "Nombre del Producto": "Tinte Profesional 7.1",
    "Nivel de Stock": 15,
    "Precio del Producto": 3200.5,
    "Costo del Envio": 450.0,
    "Rendimiento": 8,
    "Categoria del Producto": "Coloracion"
  }
}
```

### INGRESOS/EGRESOS (POST)
```json
{
  "fields": {
    "Fecha de Venta": "2026-06-03",
    "Medio de Pago": "Efectivo",
    "Monto Cobrado": 8500.0,
    "Pagado?": true,
    "Ingresos Extras": 0.0,
    "Egresos Variables": 0.0
  }
}
```

### Empleados (POST)
```json
{
  "fields": {
    "Nombre": "Carlos",
    "Apellido": "Rodriguez",
    "Telefono": "+54 11 5555-0202",
    "Correo Electronico": "carlos@salon.com",
    "Especialidad": [
      "Corte de cabello",
      "Barberia"
    ]
  }
}
```

### Promociones (POST)
```json
{
  "fields": {
    "Nombre de la Promocion": "2x1 en Cortes",
    "Fecha de Inicio": "2026-06-05",
    "Fecha de Fin": "2026-06-20",
    "Descuento": 0.5,
    "Estado de la Promocion": "Activa"
  }
}
```

---

## 5. Rate Limits y Mejores Practicas

| Limite | Valor |
|--------|-------|
| Requests por segundo | 5 req/s (burst) |
| Registros por base | 1,200 |
| Registros por request | 100 (max con maxRecords) |
| Tamano de attachment | 5 MB por archivo |

Headers de rate limit en cada respuesta:
```
X-Airtable-RateLimit-Limit: 5
X-Airtable-RateLimit-Remaining: 4
X-Airtable-RateLimit-Reset: 1623456789
```

### Estrategia de Frontend

1. Cache agresivo: React Query / SWR con staleTime: 30000 (30s)
2. Debounce en busquedas: esperar 300ms despues del ultimo keystroke
3. Paginacion cursor-based: usar offset del response, no pageSize+offset numerico
4. Batch writes: agrupar PATCH/POST cuando sea posible (Airtable no tiene batch endpoint)
5. Retry con backoff: si 429 Too Many Requests, esperar Retry-After segundos
6. No hacer polling: minimo 10s entre polls si es inevitable

### Ejemplo fetch con retry

```javascript
async function fetchAirtable(endpoint, retries = 3) {
  const url = `https://api.airtable.com/v0/app93Vhy56KrxNhwe/${endpoint}`;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
    });
    if (res.status === 429) {
      const wait = res.headers.get('Retry-After') || 2 ** i;
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    return res.json();
  }
  throw new Error('Max retries exceeded');
}
```

---

## 6. Formulas con Field IDs

| Tabla | Campo Formula | Field ID | Expresion |
|-------|--------------|----------|-----------|
| Servicios | Total Hora Hombre | fldRtObj9vsXu52YE | {Valor Hora Hombre} * {Duracion del Servicio} |
| Servicios | Costo Variable | fldrVUfMQYiueUmg6 | ({Duracion del Servicio} * {Valor Hora Hombre}) + {Costo unitario} |
| Servicios | Costo Total | fldmliq7PR1hbFQQl | SUM({Costo Fijo x Servicios}, {Costo Variable}) |
| Servicios | Valor del Servicio | fld7A4qW6MzhT5NYA | ROUND({Costo Total} * 2, 2) |
| Productos | Precio de Ventas | (formula field) | ROUND({Precio del Producto} + {Costo del Envio}, 2) * 1.5 |
| Productos | Costo Unitario x Servicio | (formula field) | ROUND(({Precio del Producto} + {Costo del Envio}) / {Rendimiento}, 0) |
| Resumen Costos Fijos | Costo Fijo por Servicio | (formula field) | {Total Costos Fijos} / {Servicios Promedio Mensuales} |
| INGRESOS/EGRESOS | Total de la Venta | (formula field) | SUM({Valor del Servicio}, {Precio del Producto}) |
| INGRESOS/EGRESOS | Estado de Cobro | (formula field) | IF({Pagado?}, "Cobrado", "Pendiente") |
| INGRESOS/EGRESOS | Saldo Pendiente | (formula field) | {Total de la Venta} - {Monto Cobrado} |
| INGRESOS/EGRESOS | Total Ingresos Gral | (formula field) | SUM({Monto Cobrado} + {Ingresos Extras}) |
| INGRESOS/EGRESOS | Total Egresos Gral | (formula field) | SUM({Egresos Fijos} + {Egresos Variables}) |
| INGRESOS/EGRESOS | Total Neto | (formula field) | AVERAGE({Total Ingresos Gral} - {Total Egresos Gral}) |

---

## 7. Verificacion Pre-Integracion

- [ ] PAT valido con scope data.records:read y data.records:write
- [ ] Base ID correcto: app93Vhy56KrxNhwe
- [ ] Nombres de tabla URL-encoded (espacios a %20, / a %2F)
- [ ] filterByFormula usa nombres de campo del frontend, no field IDs
- [ ] Fechas en formato ISO 8601 (YYYY-MM-DD)
- [ ] Campos lookup y rollup son READ-ONLY (no se pueden escribir)
- [ ] autoNumber (No de Venta) no se incluye en POST (es auto-generado)
- [ ] createdTime y lastModifiedTime no se incluyen en POST/PATCH
- [ ] Linked records requieren array de record IDs
- [ ] multipleSelects requiere array de strings exactos (case-sensitive)
- [ ] checkbox acepta true/false (no 1/0)

---

## Referencia Rapida - Tabla ID

| Nombre Tabla | Table ID |
|-------------|----------|
| Clientes | tblzRwPeOVTdsvt5g |
| Citas | tblZNB7HfD3OAGL9x |
| Servicios | tblIDRFHpLoQpB9JH |
| Empleados | tblxodPS9acp1kyoU |
| Proveedores | tblVLjaYzT3kb1k4c |
| Productos | tblkz2NvmwGBXHjpF |
| Inventario | tblNz69ntR4zvHjH1 |
| Promociones | tblc8HGTbiXL5rsk8 |
| Agenda | tbltQl7ljsgTBpkr1 |
| Reportes | tblblfVCv2Wbn0v4u |
| Capacitaciones | tblpDKylzRWU0QTuL |
| ficha de servicios | tblsCoMUqOmpI9bfc |
| Costos Fijos Peluquería | tbl3LmPm9B32hghHi |
| Resumen de Costos Fijos | tbl7MRYpZJI0kEet1 |
| INGRESOS/EGRESOS | tblEoTMnKvkZzHDBf |

---

## 8. Estado de Implementacion del Frontend

### Resumen

| Componente | Archivo | Estado |
|------------|---------|--------|
| Conexion Airtable (fetch + auth + rate-limit + retry + paginacion) | `api.js` | ✅ Completo |
| Cache (localStorage + 5-min TTL) | `api.js` | ✅ Completo |
| Frontend HTML/CSS | `index.html` | ✅ Completo (2458 lineas) |
| Dashboard | `index.html` (renderDashboard) | ✅ Implementado |
| Clientes | `index.html` (renderClientes) | ✅ Implementado |
| Citas | `index.html` (renderCitas) | ✅ Implementado |
| Servicios | `index.html` (renderServicios) | ✅ Implementado |
| Empleados | `index.html` (renderEmpleados) | ✅ Implementado |
| Caja (Ingresos/Egresos) | `index.html` (renderCaja) | ✅ Implementado |
| Productos | `index.html` (renderProductos) | ✅ Implementado |
| Reportes | `index.html` (renderReportes) | ✅ Implementado |
| Proveedores | `index.html` | ⬜ Pendiente |
| Promociones | `index.html` | ⬜ Pendiente |
| Agenda | `index.html` | ⬜ Pendiente |
| Capacitaciones | `index.html` | ⬜ Pendiente |
| Inventario | `index.html` | ⬜ Pendiente |
| Ficha de Servicios | `index.html` | ⬜ Pendiente |
| Costos Fijos | `index.html` | ⬜ Pendiente |
| Resumen Costos | `index.html` | ⬜ Pendiente |
| Ingresos/Egresos (pagina dedicada) | `index.html` | ⬜ Pendiente |

### Implementacion api.js

El modulo `api.js` implementa:

- **Auth:** Token Airtable inyectado via variable global `__AIRTABLE_TOKEN__` (no hardcodeado)
- **Rate Limiting:** Token bucket algorithm (5 req/s para plan gratuito)
- **Cache:** localStorage con TTL de 5 minutos, invalidacion por tabla
- **Retry:** Hasta 3 reintentos con backoff exponencial (2s, 4s, 8s)
- **Paginacion:** Soporte de `offset` de Airtable para paginacion cursor-based
- **Debounce:** 300ms en busquedas
- **Funciones CRUD** para las 15 tablas via operaciones genericas

### Correcciones Aplicadas

| Fix | Ref | Descripcion |
|-----|-----|-------------|
| Token fix | SALON-011 | Token movido de codigo fuente a variable global `__AIRTABLE_TOKEN__` |
| Cache fix | SALON-010b | Cache con localStorage + TTL de 5 minutos implementado |
| Rate limiter | — | Token bucket (5 req/s) + retry con backoff |

### Bugs Conocidos Post-Implementacion

| ID | Severidad | Descripcion | Estado |
|----|-----------|-------------|--------|
| CRIT-1 | 🔴 Critico | Linked records muestran IDs crudos (`recXXXXXXX`) en lugar de nombres legibles | ⚠️ No corregido |
| CRIT-2 | 🔴 Critico | `Valor del Servicio` = $0 si VHH y Costo Fijo estan en 0 (datos de Airtable) | ⚠️ Pendiente de datos reales |
| CRIT-3 | 🔴 Critico | Dashboard "Clientes Mas Frecuentes" usa placeholder estatico | ⚠️ No corregido |
| MED-1 | 🟡 Medio | Campos Email/Teléfono son `singleLineText` en schema, no `email`/`phone` | ✅ Documentado |
| LOW-1 | 🟢 Bajo | Formula `TOTAL NETO` usa `AVERAGE()` en vez de resta directa (bug en PDF original) | ⚠️ No corregido |
| DE-001 | 🔵 Info | Surge deploy muestra "Error - Deployment did not succeed" falso negativo | ✅ Documentado |

---

## 9. Historial de Versiones

| Version | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 2.0 | 2026-06-02 | Docs / Progress Manager | Estado Fase Maestra Completa. Seccion de implementacion frontend. |
| 1.0 | 2026-06-02 | Backend / Data Architect | Version inicial con endpoints, filtros, formulas, datos mock. |

*Documento generado desde la base viva app93Vhy56KrxNhwe el 2026-06-02.*