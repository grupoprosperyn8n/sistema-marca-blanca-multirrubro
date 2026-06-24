# automations-spec.md — Especificaciones de Automatizaciones

> **Proyecto:** Gestión de Salones de Belleza
> **Fecha:** 2026-06-02
> **Base Airtable:** `app93Vhy56KrxNhwe`
> **Backend:** Exclusivamente Airtable (sin Supabase)
> **Motor de automatizaciones recomendado:** n8n + Airtable API + Webhooks

---

## 🎯 Resumen de Automatizaciones

| # | Automatización | Trigger | Acción | Prioridad |
|---|---------------|---------|--------|-----------|
| 1 | Recordatorio de citas (24h antes) | Schedule (diario) | Email/SMS al cliente | 🔴 Crítica |
| 2 | Actualización de inventario al vender | Webhook (nueva venta) | Reducir stock del producto | 🔴 Crítica |
| 3 | Notificación de stock bajo | Schedule (diario) | Alerta al admin | 🟠 Alta |
| 4 | Cálculo de comisiones al cerrar cita | Webhook (cita completada) | Registrar comisión | 🟠 Alta |
| 5 | Resumen diario de caja | Schedule (diario, 20:00) | Email al admin | 🟡 Media |
| 6 | Felicitación de cumpleaños a clientes | Schedule (diario, 08:00) | Email/SMS al cliente | 🟢 Baja |

---

## 1. Recordatorio de Citas (24h antes)

### Descripción
Notificar a los clientes por SMS y/o email que tienen una cita programada para el día siguiente, incluyendo hora, servicio y profesional asignado.

### Trigger
- **Tipo:** Schedule (cron: `0 8 * * *` — todos los días a las 8:00 AM)
- **Frecuencia:** Diaria

### Datos necesarios
| Dato | Tabla Airtable | Campo | ID |
|------|---------------|-------|-----|
| Fecha de la cita | Citas | Fecha de la Cita | `fldHKaoo3lNK7p5vq` |
| Hora de la cita | Citas | Hora de la Cita | `fldG6YIGmwT9emkqF` |
| Cliente (ID) | Citas | Cliente | `fldQHCVDkYHlDdwor` (linked → Clientes) |
| Servicio (ID) | Citas | Servicio Solicitado | `fldNvyU70wMXQLX1U` (linked → Servicios) |
| Profesional (ID) | Citas | Profesional Asignado | `fldYkP2gZv60rQEKf` (linked → Empleados) |
| Estado de la cita | Citas | Estado de la Cita | `fldweePEyhJd9cdec` |
| Nombre del cliente | Clientes | Nombre | `fldV3oSp0rQG164P0` |
| Teléfono del cliente | Clientes | Teléfono | `fld8Lh9IHwenxZjna` |
| Email del cliente | Clientes | Email | `fldvop4ccFLJ92hPg` |
| Nombre del servicio | Servicios | Nombre del Servicio | `fldZsbrskognxGBD4` |
| Nombre del empleado | Empleados | Nombre | `fldGeBG3u6b7tg50g` |

### Flujo lógico

```
1. SCHEDULE: 8:00 AM diario
2. GET /Citas?filterByFormula=AND(
     IS_SAME({Fecha de la Cita}, DATEADD(TODAY(), 1, 'days'), 'day'),
     {Estado de la Cita} = 'Programada'
   )
3. FOR EACH cita:
   a. GET /Clientes/{clienteId} → obtener Nombre, Teléfono, Email
   b. GET /Servicios/{servicioId} → obtener Nombre del Servicio
   c. GET /Empleados/{profesionalId} → obtener Nombre
   d. IF teléfono existe → enviar SMS (Twilio/WhatsApp API)
   e. IF email existe → enviar Email (SendGrid/Resend)
   f. Log: actualizar campo Notas de la Cita con "Recordatorio enviado {timestamp}"
```

### Mensaje plantilla
```
📋 Recordatorio de Cita

Hola {nombreCliente}, te recordamos tu cita mañana:

📅 Fecha: {fechaCita}
🕐 Hora: {horaCita}
💇 Servicio: {nombreServicio}
👩‍🎨 Profesional: {nombreProfesional}

📍 {nombreSalon} — {direccionSalon}
📞 ¿Necesitas reagendar? Llámanos al {telefonoSalon}
```

### Consideraciones técnicas
- **API de SMS:** Twilio (recomendado para Colombia) o WhatsApp Business API
- **API de Email:** SendGrid, Resend, o Amazon SES
- **Airtable rate limit:** 5 req/s. Con 50 citas diarias ≈ 50 + 50 + 50 = 150 requests (~30s)
- **Manejo de errores:** Si falla el envío a un cliente, continuar con el siguiente. Registrar fallos.
- **Deduplicación:** Agregar campo `fld_NOTIF_24H` (checkbox) para marcar citas ya notificadas

---

## 2. Actualización de Inventario al Vender Productos

### Descripción
Cuando se registra una venta en INGRESOS/EGRESOS que incluye productos, reducir automáticamente el `Nivel de Stock` del producto vendido.

### Trigger
- **Tipo:** Airtable Webhook (o n8n Airtable Trigger en modo polling)
- **Evento:** Nuevo registro creado en INGRESOS/EGRESOS
- **Frecuencia:** En tiempo real (webhook) o cada 1 minuto (polling)

### Datos necesarios
| Dato | Tabla | Campo | ID |
|------|-------|-------|-----|
| Productos vendidos (IDs) | INGRESOS/EGRESOS | Productos | `fldJC2QdCVHk9EVkY` |
| Stock actual | Productos | Nivel de Stock | `fldTJGZHvXupyilYy` |
| Stock mínimo | Productos | (no existe campo) | — |

### Flujo lógico

```
1. TRIGGER: Nuevo registro en INGRESOS/EGRESOS
2. Extraer array de Productos (IDs)
3. FOR EACH productoID:
   a. GET /Productos/{productoID} → obtener Nivel de Stock actual
   b. Calcular nuevoStock = stockActual - 1
   c. IF nuevoStock < 0:
      - Log warning: "Stock negativo detectado para {producto}"
      - nuevoStock = 0
   d. PATCH /Productos/{productoID} → { "Nivel de Stock": nuevoStock }
   e. Log: "Stock {producto}: {stockActual} → {nuevoStock}"
```

### Consideraciones técnicas
- **Cantidad de productos:** Si el cliente compra múltiples unidades del mismo producto, se necesita un campo adicional (`Cantidad Vendida`). Actualmente INGRESOS/EGRESOS solo vincula productos (linked records) sin cantidad.
  - **Solución propuesta:** Agregar campo `Cantidad de Productos` (number) en INGRESOS/EGRESOS, o crear una tabla intermedia `Detalle de Venta`.
- **Productos de consumo interno:** La tabla Productos tiene campo `Tipo de USO` con opciones `['CONSUMO INTERNO', 'VENTAS', 'CONSUMO EN SERVICIOS']`. Solo reducir stock si `Tipo de USO` incluye `'VENTAS'`.
- **Revertir:** Si se elimina una venta, restaurar el stock.

---

## 3. Notificación de Stock Bajo

### Descripción
Alertar al administrador cuando algún producto tiene `Nivel de Stock` por debajo de un umbral mínimo, para facilitar el reabastecimiento.

### Trigger
- **Tipo:** Schedule (cron: `0 9 * * 1` — lunes a las 9:00 AM)
- **Frecuencia:** Semanal (lunes por la mañana)
- **Alternativa:** Diario si el negocio tiene alta rotación

### Datos necesarios
| Dato | Tabla | Campo | ID |
|------|-------|-------|-----|
| Stock actual | Productos | Nivel de Stock | `fldTJGZHvXupyilYy` |
| Nombre del producto | Productos | Nombre del Producto | `fldRbagqaTubMYkfY` |
| Categoría | Productos | Categoría del Producto | `flddYSvohc8IzQ2mS` |
| Proveedor | Productos | Proveedor | `fld4lqtTmOWPoYqe5` (linked) |

### Flujo lógico

```
1. SCHEDULE: Lunes 9:00 AM
2. GET /Productos?filterByFormula={Nivel de Stock} < 5
3. IF resultados.length === 0:
   - Log: "✅ Todos los productos con stock suficiente"
   - FIN
4. Agrupar productos por Proveedor (resolver linked records)
5. Enviar email al admin con tabla:
   | Producto | Stock Actual | Stock Mínimo | Proveedor | Acción |
6. Opcionalmente: enviar email al proveedor con lista de productos a reabastecer
```

### Plantilla de email
```
📊 Reporte de Stock Bajo — {fecha}

Los siguientes productos necesitan reabastecimiento:

| # | Producto | Stock | Mínimo | Proveedor |
|---|----------|-------|--------|-----------|
{filas}

🔴 Acción requerida: Contactar proveedores para realizar pedidos.
```

### Consideraciones técnicas
- **Stock Mínimo:** Crear campo `Stock Mínimo` (number, `fld_NEW_STOCK_MIN`) en Productos para parametrizar el umbral por producto
- **Umbral por defecto:** Si no tiene Stock Mínimo configurado, usar 5 como default
- **Delivery a proveedores:** Vincular con Proveedores para sugerir contacto

---

## 4. Cálculo de Comisiones de Empleados al Cerrar Cita

### Descripción
Cuando una cita se marca como "Completada", calcular la comisión del empleado basada en el valor del servicio y el porcentaje de comisión configurado, y registrarla.

### Trigger
- **Tipo:** Airtable Webhook (o polling)
- **Evento:** Campo `Estado de la Cita` cambia a `"Completada"`

### Datos necesarios
| Dato | Tabla | Campo | ID |
|------|-------|-------|-----|
| Estado de la cita | Citas | Estado de la Cita | `fldweePEyhJd9cdec` |
| Profesional asignado | Citas | Profesional Asignado | `fldYkP2gZv60rQEKf` |
| Servicio solicitado | Citas | Servicio Solicitado | `fldNvyU70wMXQLX1U` |
| Valor del servicio | Servicios | Valor del Servicio | `fld7A4qW6MzhT5NYA` |
| Comisión (%) | Empleados | (NO EXISTE) | — |
| Salario base | Empleados | (NO EXISTE) | — |

### Flujo lógico

```
1. TRIGGER: Cita actualizada → Estado = "Completada"
2. GET /Citas/{citaId} → obtener Profesional Asignado, Servicio Solicitado
3. GET /Servicios/{servicioId} → obtener Valor del Servicio
4. GET /Empleados/{empleadoId} → obtener Comisión (%)
5. Calcular:
   comision = Valor del Servicio * (Comisión / 100)
6. Registrar comisión:
   - Opción A: Agregar registro en tabla "Comisiones" (crear tabla nueva)
   - Opción B: Agregar campo "Comisión Generada" en la tabla Citas
7. Notificar al empleado (opcional)
```

### Consideraciones técnicas
- **Campo faltante:** La tabla Empleados NO tiene campo `Comisión (%)` ni `Salario Base` en el schema actual. Se deben crear:
  - `Comisión` (percent, `fld_NEW_COMISION_PCT`) 
  - `Comisión por Producto` (percent)
  - `Meta Mensual` (currency)
- **Tabla de comisiones:** Crear tabla `Comisiones` con campos:
  - Empleado (linked → Empleados)
  - Cita (linked → Citas)
  - Fecha (date)
  - Monto del Servicio (currency)
  - Porcentaje Comisión (percent)
  - Comisión Calculada (formula: Monto * Porcentaje)
  - Estado (singleSelect: Pendiente|Pagada)
- **Múltiples profesionales:** Una cita puede tener un solo Profesional Asignado (linked record). Si en el futuro se requieren múltiples, cambiar a multipleRecordLinks.
- **Comisiones por producto:** Si la cita incluye venta de productos, agregar comisión adicional por producto vendido.

---

## 5. Resumen Diario de Caja

### Descripción
Enviar al administrador un resumen diario con totales de ingresos, egresos, citas completadas, y balance neto.

### Trigger
- **Tipo:** Schedule (cron: `0 20 * * *` — todos los días a las 8:00 PM)
- **Frecuencia:** Diaria

### Datos necesarios
| Dato | Tabla | Campo | ID |
|------|-------|-------|-----|
| Fecha de venta | INGRESOS/EGRESOS | Fecha de Venta | `fldrOkIwiFvbnh44A` |
| Monto cobrado | INGRESOS/EGRESOS | Monto Cobrado | `fldYcPQfETpq13LZ1` |
| Ingresos extras | INGRESOS/EGRESOS | Ingresos Extras | `fldatiHvEGdK5tE14` |
| Egresos variables | INGRESOS/EGRESOS | Egresos variables | `fldhe3qi6vQlROnwi` |
| Ingresos (tipo) | INGRESOS/EGRESOS | Ingresos | `fldcak5lgMUrwW9et` |
| Total de la venta | INGRESOS/EGRESOS | Total de la Venta | `fldRHpzMYfaHGSl7z` |
| Estado del pago | INGRESOS/EGRESOS | Estado del Pago | `fldoGmJCZwnTtmeB8` |
| Saldo pendiente | INGRESOS/EGRESOS | Saldo Pendiente | `fldube2TTdCq1Z7pg` |
| Fecha de cita | Citas | Fecha de la Cita | `fldHKaoo3lNK7p5vq` |
| Estado de cita | Citas | Estado de la Cita | `fldweePEyhJd9cdec` |

### Flujo lógico

```
1. SCHEDULE: 8:00 PM diario
2. GET /INGRESOS_EGRESOS?filterByFormula=IS_SAME({Fecha de Venta}, TODAY(), 'day')
3. GET /Citas?filterByFormula=IS_SAME({Fecha de la Cita}, TODAY(), 'day')
4. Calcular métricas:
   a. Total Ingresos = SUM(Monto Cobrado donde Ingresos incluye tipo ingreso)
   b. Total Ingresos Extras = SUM(Ingresos Extras)
   c. Total Egresos = SUM(Egresos variables)
   d. Ventas del día = COUNT(registros)
   e. Citas completadas = COUNT(citas con Estado = 'Completada')
   f. Citas canceladas = COUNT(citas con Estado = 'Cancelada')
   g. Cobros pendientes = SUM(Saldo Pendiente)
   h. Ticket promedio = Total Ingresos / Ventas del día
   i. Balance neto = Total Ingresos + Ingresos Extras - Total Egresos
5. Enviar email al admin con resumen formateado
```

### Plantilla de email
```
📊 Resumen de Caja — {fecha_formato_largo}

┌─────────────────────────────────────┐
│ 💰 Total Ingresos:     $XX,XXX      │
│ 🎁 Ingresos Extras:    $X,XXX       │
│ 💸 Total Egresos:      $X,XXX       │
│ ──────────────────────              │
│ 📈 Balance Neto:       $XX,XXX      │
└─────────────────────────────────────┘

📋 Actividad del Día:
• Citas completadas: X
• Citas canceladas: X
• Ticket promedio: $XX,XXX
• Cobros pendientes: $X,XXX

📝 Transacciones:
| # | Hora | Concepto | Medio de Pago | Monto | Estado |
|---|------|----------|---------------|-------|--------|
{filas}

💡 Recomendación: {sugerencia basada en métricas}
```

### Consideraciones técnicas
- **Días sin actividad:** Si no hay registros, enviar email con mensaje "Sin actividad hoy"
- **Formato:** Incluir versión HTML y texto plano
- **Adjuntos:** Opcionalmente adjuntar CSV con detalle de transacciones

---

## 6. Felicitación de Cumpleaños a Clientes

### Descripción
Enviar un mensaje de felicitación automático a los clientes en su cumpleaños, fortaleciendo la relación comercial.

### Trigger
- **Tipo:** Schedule (cron: `0 8 * * *` — todos los días a las 8:00 AM)
- **Frecuencia:** Diaria

### Datos necesarios
| Dato | Tabla | Campo | ID |
|------|-------|-------|-----|
| Nombre del cliente | Clientes | Nombre | `fldV3oSp0rQG164P0` |
| Teléfono | Clientes | Teléfono | `fld8Lh9IHwenxZjna` |
| Email | Clientes | Email | `fldvop4ccFLJ92hPg` |
| Fecha de nacimiento | Clientes | (⚠️ NO EXISTE) | — |

### Flujo lógico

```
1. SCHEDULE: 8:00 AM diario
2. GET /Clientes?filterByFormula=AND(
     {Fecha de Nacimiento} != BLANK(),
     DAY({Fecha de Nacimiento}) = DAY(TODAY()),
     MONTH({Fecha de Nacimiento}) = MONTH(TODAY())
   )
3. FOR EACH cliente:
   a. Enviar SMS/WhatsApp con mensaje personalizado
   b. Enviar Email con cupón de descuento (opcional)
   c. Log: "Felicitación enviada a {cliente} por cumpleaños"
```

### Plantilla de mensaje
```
🎂 ¡Feliz Cumpleaños, {nombre}!

De parte de todo el equipo de {nombreSalon}, te deseamos un día maravilloso lleno de alegría.

🎁 Como regalo, te ofrecemos un 15% de descuento en tu próximo servicio. Válido por 7 días.

📅 ¿Agendamos tu cita? Responde a este mensaje o llámanos al {telefonoSalon}.
```

### Consideraciones técnicas
- **⚠️ CAMPO FALTANTE:** La tabla Clientes NO tiene campo `Fecha de Nacimiento`. Se debe crear (date) para que esta automatización funcione.
  - Campo sugerido: `fld_NEW_FECHA_NACIMIENTO` (date, sin año obligatorio para mayor privacidad)
- **Opt-out:** Agregar campo `No contactar` (checkbox) para clientes que no deseen recibir mensajes
- **Cupón de descuento:** Si se implementa, crear promoción automática en la tabla Promociones con `Fecha de Inicio = TODAY()` y `Fecha de Fin = DATEADD(TODAY(), 7, 'days')`

---

## 🏗️ Arquitectura de Implementación Recomendada

### Motor: n8n (self-hosted o cloud)

```
┌──────────────────────────────────────────────────────────┐
│                        n8n                               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Cron     │  │ Webhook  │  │ Airtable │               │
│  │ Trigger  │  │ Trigger  │  │ Trigger  │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                      │
│       └─────────────┼─────────────┘                      │
│                     │                                    │
│              ┌──────▼──────┐                             │
│              │  Airtable   │                             │
│              │  Read/Write │                             │
│              └──────┬──────┘                             │
│                     │                                    │
│         ┌───────────┼───────────┐                        │
│         │           │           │                        │
│    ┌────▼────┐ ┌────▼────┐ ┌───▼────┐                    │
│    │ Twilio  │ │ SendGrid│ │ Email  │                    │
│    │ (SMS)   │ │ (Email) │ │ Admin  │                    │
│    └─────────┘ └─────────┘ └────────┘                    │
└──────────────────────────────────────────────────────────┘
```

### Credenciales necesarias en n8n
1. **Airtable API:** Token `patcWb...` con scope `data.records:read`, `data.records:write`
2. **Twilio:** Account SID, Auth Token, phone number (para SMS)
3. **SendGrid/Resend:** API Key (para emails transaccionales)

### Variables de entorno (n8n)
```json
{
  "AIRTABLE_BASE_ID": "app93Vhy56KrxNhwe",
  "AIRTABLE_TOKEN": "patcWb...",
  "SALON_NOMBRE": "Salón Pro",
  "SALON_TELEFONO": "+57 300 000 0000",
  "SALON_DIRECCION": "Calle 123 #45-67, Bogotá",
  "ADMIN_EMAIL": "admin@salonpro.com"
}
```

### Monitoreo
- Cada workflow debe tener un nodo final de logging
- Errores deben notificarse al admin por email
- Dashboard de n8n para monitorear ejecuciones fallidas

---

## 📋 Dependencias y Orden de Implementación

| Orden | Automatización | Dependencias | Esfuerzo |
|-------|---------------|-------------|----------|
| 1 | Recordatorio de citas | Ninguna | Medio (4-6h) |
| 2 | Stock bajo | Ninguna | Bajo (2-3h) |
| 3 | Resumen diario | Ninguna | Bajo (2-3h) |
| 4 | Actualización inventario | Requiere campo Cantidad en ventas | Alto (6-8h) |
| 5 | Comisiones | Requiere crear campos en Empleados | Alto (8-12h) |
| 6 | Cumpleaños | Requiere crear campo Fecha de Nacimiento | Bajo (2-3h) |

---

## ⚠️ Campos Nuevos Requeridos en Airtable

| Tabla | Campo | Tipo | Propósito | Automatización |
|-------|-------|------|-----------|----------------|
| Clientes | `Fecha de Nacimiento` | date | Identificar cumpleaños | #6 |
| Clientes | `No Contactar` | checkbox | Opt-out de notificaciones | #1, #6 |
| Empleados | `Comisión` | percent | Cálculo de comisiones | #4 |
| Empleados | `Comisión por Producto` | percent | Comisión por venta | #4 |
| Empleados | `Meta Mensual` | currency | Tracking de metas | #4 |
| Productos | `Stock Mínimo` | number | Umbral de alerta | #3 |
| Citas | `Notificación 24h Enviada` | checkbox | Deduplicación | #1 |
| INGRESOS/EGRESOS | `Cantidad de Productos` | number | Unidades vendidas por producto | #2 |

---

*Especificaciones generadas el 2026-06-02.*
*Próximo paso: implementar en n8n siguiendo el orden recomendado.*
