# AUTOMATION_CONTRACT — Automatizaciones para Gestión de Salones de Belleza

> **Version:** 1.0 | **Fecha:** 2026-06-02 | **Autor:** Automation / n8n Architect
> **Estado:** DRAFT — Pendiente de aprobacion por Lead
> **Base Airtable:** app93Vhy56KrxNhwe
> **n8n:** No instalado en sistema
> **Backend:** Exclusivamente Airtable + n8n (cuando se instale)

---

## Resumen Ejecutivo

Se identificaron **7 puntos de automatizacion** en el schema actual (15 tablas, 210 campos).
Se propone un enfoque en **2 fases**:

| Fase | Herramienta | Automatizaciones | Esfuerzo |
|------|-------------|-----------------|----------|
| Fase 1 | Airtable Automations | Recordatorios, Stock Bajo, Alertas Promos | Sin instalacion |
| Fase 2 | n8n | Cierre Caja, Reportes, WhatsApp, Webhook | Requiere instalacion |

---

## AUT-01: Recordatorio de Citas (Fase 1 - Alta)

**Tabla:** Citas (tblZNB7HfD3OAGL9x)
**Condicion:** Fecha = TOMORROW() AND Estado = Programada
**Frecuencia:** Diario 8:00 AM

**Accion:**
1. Buscar citas programadas para manana
2. Obtener Cliente vinculado (Nombre, Email)
3. Obtener Servicio (Nombre) y Profesional (Nombre)
4. Enviar notificacion

**Canales:** Email (Airtable nativo) - Fase 1 | WhatsApp/SMS/Telegram (n8n) - Fase 2

**Setup Airtable:**
1. Automation > Schedule > Daily 8:00 AM
2. Find records: Citas where Fecha=TOMORROW() AND Estado=Programada
3. For each > Send email to Cliente.Email

**Plantilla:** Hola [Nombre], tienes cita manana [Fecha] a las [Hora] - [Servicio] con [Profesional]

---

## AUT-02: Alerta Stock Bajo (Fase 1 - Alta)

**Tabla:** Productos (tblkz2NvmwGBXHjpF)
**Condicion:** Nivel de Stock < 5
**Frecuencia:** On update + barrido diario

**Canales:** Email (Airtable) - F1 | Dashboard frontend (ya existe filtro stockBajo) - F1 | WhatsApp - F2

**Setup Airtable:**
1. Automation > When record matches conditions
2. Condition: Nivel de Stock < 5
3. Action: Send email to Colaborador.Email

---

## AUT-03: Promociones por Vencer (Fase 1 - Media)

**Tabla:** Promociones (tblc8HGTbiXL5rsk8)
**Condicion:** Fecha Fin = TOMORROW() AND Estado = Activa
**Frecuencia:** Diario 9:00 AM
**Accion:** Notificar admin para renovar o expirar promocion

---

## AUT-04: Cierre Caja Diario (Fase 2 - Alta)

**Tabla:** INGRESOS/EGRESOS (tblEoTMnKvkZzHDBf)
**Frecuencia:** Diario 22:00
**Requiere:** n8n

**Flujo n8n:**
1. Schedule 22:00 daily
2. GET ingresos/egresos del dia
3. Calcular totales por medio de pago (Efectivo, Transf, Tarjeta, MP)
4. Crear Reporte con resumen
5. Enviar Email/WhatsApp

**Datos:** totalIngresos, totalEgresos, totalNeto, cantidadVentas, desglose medios pago, pendientes

---

## AUT-05: Reporte Semanal (Fase 2 - Media)

**Frecuencia:** Cada lunes 7:00 AM | **Requiere:** n8n
**Metricas:** Citas, clientes nuevos, ingresos, productos vendidos, top 5 servicios, stock critico

---

## AUT-06: Dashboard KPIs (Fase 1)

**Ya implementados:** clientes, citasHoy, citasPendientes, facturadoMes, cobradoMes, pendientesCobro

**Propuestos:**
| KPI | Fuente | Prioridad |
|-----|--------|-----------|
| Stock Bajo <5 | Productos | Alta |
| Crecimiento Mensual % | INGRESOS/EGRESOS | Media |
| Ticket Promedio | INGRESOS/EGRESOS | Media |
| Tasa Cancelacion | Citas | Media |

---

## AUT-07: Webhook Confirmacion Cita (Fase 2 - Media)

**Requiere:** n8n
**Flujo:** Nueva cita > n8n > Confirmacion cliente > Agenda > Notificar profesional

---

## Plan Implementacion

### Fase 1 - Inmediato
1. Configurar AUT-01 (Recordatorio citas) en Airtable
2. Configurar AUT-02 (Alerta stock bajo) en Airtable
3. Configurar AUT-03 (Promos vencimiento) en Airtable
4. Anadir KPIs adicionales al frontend (api.js)

### Fase 2 - Pendiente aprobacion
1. Instalar n8n (Docker)
2. Configurar credenciales
3. AUT-04: Workflow Cierre Caja
4. AUT-05: Workflow Reporte Semanal
5. AUT-07: Webhook Confirmacion

---

## Costo Airtable Automations
- **Free** (actual): 100/mes | Suficiente para Fase 1
- **Team:** 25,000/mes | $20/mes
- **Business:** 50,000/mes | $45/mes

---

## Checklist
- [ ] AUT-01: Recordatorio configurado
- [ ] AUT-02: Alerta stock bajo configurada
- [ ] AUT-03: Promos monitoreadas
- [ ] AUT-06: KPIs frontend ampliados
- [ ] n8n: Instalado (Fase 2)
- [ ] AUT-04: Cierre caja operativo (F2)
- [ ] AUT-05: Reporte semanal operativo (F2)
- [ ] AUT-07: Webhook confirmacion operativo (F2)
