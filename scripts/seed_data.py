#!/usr/bin/env python3
"""Seed de datos de prueba para las 15 tablas de Gestión de Salones de Belleza.
Usa field IDs reales para evitar problemas de acentos/case en nombres de campo.
"""
import os, sys, json, time, urllib.request, urllib.error

BASE_ID = "app93Vhy56KrxNhwe"
TOKEN = os.environ.get("AIRTABLE_TOKEN", "")
if not TOKEN:
    # Buscar en index.html
    index_path = os.path.join(os.path.dirname(__file__), "..", "static", "index.html")
    if os.path.exists(index_path):
        with open(index_path) as f:
            content = f.read()
            import re
            m = re.search(r"__AIRTABLE_TOKEN__\s*=\s*'([^']+)'", content)
            if m:
                TOKEN = m.group(1)
if not TOKEN:
    print("ERROR: No se encontró AIRTABLE_TOKEN.", file=sys.stderr)
    sys.exit(1)

API = "https://api.airtable.com/v0"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def post(table_id, records_data):
    """Envía un lote de registros a Airtable. records_data = [{fields:...}, ...]"""
    url = f"{API}/{BASE_ID}/{table_id}"
    # Airtable permite max 10 records por batch
    for i in range(0, len(records_data), 10):
        batch = records_data[i:i+10]
        payload = json.dumps({"records": [{"fields": f} for f in batch]}).encode()
        req = urllib.request.Request(url, data=payload, headers=HEADERS, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                ids = [r["id"] for r in result.get("records", [])]
                time.sleep(0.21)  # respetar rate limit (~5 req/s)
                return ids
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  HTTP {e.code}: {body[:300]}")
            return []
    return []

def put(table_id, record_ids, fields_list):
    """Actualiza registros existentes por ID (para links post-hoc)."""
    if not fields_list or not record_ids:
        return
    url = f"{API}/{BASE_ID}/{table_id}"
    records_payload = []
    for i, rid in enumerate(record_ids):
        if i < len(fields_list):
            records_payload.append({"id": rid, "fields": fields_list[i]})
    for i in range(0, len(records_payload), 10):
        batch = records_payload[i:i+10]
        payload = json.dumps({"records": batch}).encode()
        req = urllib.request.Request(url, data=payload, headers=HEADERS, method="PATCH")
        try:
            with urllib.request.urlopen(req) as resp:
                json.loads(resp.read())
                time.sleep(0.21)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  HTTP {e.code}: {body[:300]}")

# ===========================================================================
# FASE 1: Tablas sin dependencias
# ===========================================================================
print("=" * 70)
print("FASE 1: Tablas sin dependencias")
print("=" * 70)

# ---- EMPLEADOS (tblxodPS9acp1kyoU) ----
print("\nEMPLEADOS (tblxodPS9acp1kyoU)")
emp_records = [
    {"Nombre": "María Fernanda", "Apellido": "González",
     "Teléfono": "+54 11 4567-8901", "Correo Electrónico": "mfgonzalez@salon.com",
     "Dirección": "Av. Corrientes 1234, CABA",
     "Fecha de Contratación": "2023-03-15",
     "Especialidad": ["Corte de cabello", "Coloración"],
     "Horario de Trabajo": "Martes a Sábado 10:00 a 19:00"},
    {"Nombre": "Carlos Alberto", "Apellido": "Rodríguez",
     "Teléfono": "+54 11 5678-9012", "Correo Electrónico": "crodriguez@salon.com",
     "Dirección": "Calle Florida 567, CABA",
     "Fecha de Contratación": "2023-06-01",
     "Especialidad": ["Manicura", "Pedicura"],
     "Horario de Trabajo": "Martes a Sábado 09:00 a 18:00"},
    {"Nombre": "Lucía", "Apellido": "Fernández",
     "Teléfono": "+54 11 6789-0123", "Correo Electrónico": "lfernandez@salon.com",
     "Dirección": "Av. Santa Fe 890, CABA",
     "Fecha de Contratación": "2024-01-10",
     "Especialidad": ["Maquillaje", "Tratamientos y Alisados"],
     "Horario de Trabajo": "Miércoles a Domingo 11:00 a 20:00"},
    {"Nombre": "Diego", "Apellido": "Martínez",
     "Teléfono": "+54 11 7890-1234", "Correo Electrónico": "dmartinez@salon.com",
     "Dirección": "Calle Lavalle 234, CABA",
     "Fecha de Contratación": "2024-09-01",
     "Especialidad": ["Barbería", "Corte de cabello"],
     "Horario de Trabajo": "Lunes a Viernes 08:00 a 17:00"},
    {"Nombre": "Sofía", "Apellido": "López",
     "Teléfono": "+54 11 8901-2345", "Correo Electrónico": "slopez@salon.com",
     "Dirección": "Av. Rivadavia 3456, CABA",
     "Fecha de Contratación": "2025-02-01",
     "Especialidad": ["Coloración", "Tratamientos y Alisados", "Asistente"],
     "Horario de Trabajo": "Martes a Sábado 10:00 a 19:00"},
]
emp_ids = post("tblxodPS9acp1kyoU", emp_records)
print(f"  Creados: {len(emp_ids)}/{len(emp_records)}")

# ---- PROVEEDORES (tblVLjaYzT3kb1k4c) ----
print("\nPROVEEDORES (tblVLjaYzT3kb1k4c)")
prov_records = [
    {"Nombre del Proveedor": "Fidelitte Argentina",
     "Contacto del Proveedor": "Roberto Sánchez", "Teléfono del Proveedor": "+54 11 4321-5678",
     "Email del Proveedor": "ventas@fidelitte.com.ar",
     "Dirección del Proveedor": "Calle Uruguay 456, CABA",
     "Términos de Compra": "Pago a 30 días, envío gratis +$5000",
     "WEB": "https://fidelitte.com.ar"},
    {"Nombre del Proveedor": "Tec Italy Distribuidora",
     "Contacto del Proveedor": "Laura Giménez", "Teléfono del Proveedor": "+54 351 456-7890",
     "Email del Proveedor": "pedidos@tecitaly.com.ar",
     "Dirección del Proveedor": "Av. Colón 1234, Córdoba",
     "Términos de Compra": "Pago contra entrega, mínimo $10000",
     "WEB": "https://tecitaly.com"},
    {"Nombre del Proveedor": "Caviar Profesional",
     "Contacto del Proveedor": "Martín Duarte", "Teléfono del Proveedor": "+54 11 5432-1098",
     "Email del Proveedor": "info@caviarprofesional.com",
     "Dirección del Proveedor": "Calle Thames 789, CABA",
     "Términos de Compra": "Transferencia bancaria, 15% desc. por volumen",
     "WEB": "https://caviarprofesional.com"},
    {"Nombre del Proveedor": "Kostume Beauty",
     "Contacto del Proveedor": "Valeria Acosta", "Teléfono del Proveedor": "+54 341 567-8901",
     "Email del Proveedor": "consultas@kostumebeauty.com",
     "Dirección del Proveedor": "Bv. Oroño 1234, Rosario",
     "Términos de Compra": "Mercado Pago, envío express disponible",
     "WEB": "https://kostumebeauty.com"},
    {"Nombre del Proveedor": "NovaLook Argentina",
     "Contacto del Proveedor": "Gastón Ferrari", "Teléfono del Proveedor": "+54 11 7654-3210",
     "Email del Proveedor": "distribucion@novalook.com.ar",
     "Dirección del Proveedor": "Av. Córdoba 5678, CABA",
     "Términos de Compra": "Neto 15 días, descuento 5% por pago anticipado",
     "WEB": "https://novalook.com.ar"},
]
prov_ids = post("tblVLjaYzT3kb1k4c", prov_records)
print(f"  Creados: {len(prov_ids)}/{len(prov_records)}")

# ---- COSTOS FIJOS (tbl3LmPm9B32hghHi) ----
print("\nCOSTOS FIJOS PELUQUERÍA (tbl3LmPm9B32hghHi)")
costos_records = [
    {"Nombre del Gasto": "Alquiler local", "Categoría": "Alquiler", "Monto Mensual": 180000,
     "Notas": "Local de 80m² en Palermo, contrato hasta dic 2026"},
    {"Nombre del Gasto": "Luz y agua", "Categoría": "Servicios", "Monto Mensual": 35000,
     "Notas": "Promedio mensual, varía por estación"},
    {"Nombre del Gasto": "Internet y teléfono", "Categoría": "Servicios", "Monto Mensual": 12000,
     "Notas": "Plan Fibertel 300MB + línea fija"},
    {"Nombre del Gasto": "Sueldos administrativos", "Categoría": "Personal", "Monto Mensual": 450000,
     "Notas": "Recepcionista + contador externo"},
    {"Nombre del Gasto": "Productos de limpieza", "Categoría": "Insumos", "Monto Mensual": 15000,
     "Notas": "Compra mensual en mayorista"},
]
costos_ids = post("tbl3LmPm9B32hghHi", costos_records)
print(f"  Creados: {len(costos_ids)}/{len(costos_records)}")

# ---- FICHA DE SERVICIOS (tblsCoMUqOmpI9bfc) ----
print("\nFICHA DE SERVICIOS (tblsCoMUqOmpI9bfc)")
ficha_records = [
    {"Name": "Preparar estación de corte", "Notes": "Lavar peines, preparar tijeras, sanitizar capa, verificar navaja", "Status": "Todo"},
    {"Name": "Control de stock diario", "Notes": "Revisar niveles de shampoo, acondicionador, decolorante. Anotar faltantes.", "Status": "In progress"},
    {"Name": "Limpieza post-coloración", "Notes": "Lavar bowl, desinfectar superficie, descartar guantes, ventilar 5 min", "Status": "Done"},
    {"Name": "Recepción de mercadería", "Notes": "Verificar cantidades contra remito, controlar fecha vencimiento, ubicar en depósito", "Status": "Todo"},
    {"Name": "Mantenimiento de herramientas", "Notes": "Afilado de tijeras cada 15 días, cambio de navajas, calibración de planchitas", "Status": "In progress"},
]
ficha_ids = post("tblsCoMUqOmpI9bfc", ficha_records)
print(f"  Creados: {len(ficha_ids)}/{len(ficha_records)}")

# ---- CAPACITACIONES (tblpDKylzRWU0QTuL) ----
print("\nCAPACITACIONES (tblpDKylzRWU0QTuL)")
capa_records = [
    {"Nombre del Programa": "Técnicas avanzadas de coloración",
     "Descripción del Programa": "Balayage, ombré, mechas californianas con productos orgánicos",
     "Fecha de Inicio": "2026-07-15", "Fecha de Finalización": "2026-07-17",
     "Duración (Horas)": 24, "Costo": 45000,
     "Instructor": "Jimena Palacios"},
    {"Nombre del Programa": "Manicura esculpida en gel",
     "Descripción del Programa": "Técnicas avanzadas de polygel, tips, encapsulado y nail art",
     "Fecha de Inicio": "2026-08-05", "Fecha de Finalización": "2026-08-06",
     "Duración (Horas)": 16, "Costo": 32000,
     "Instructor": "Carolina Méndez"},
    {"Nombre del Programa": "Atención al cliente premium",
     "Descripción del Programa": "Protocolo de recepción, manejo de quejas, upselling de servicios",
     "Fecha de Inicio": "2026-09-01", "Fecha de Finalización": "2026-09-01",
     "Duración (Horas)": 8, "Costo": 15000,
     "Instructor": "Gabriel Torres"},
    {"Nombre del Programa": "Barbería clásica y moderna",
     "Descripción del Programa": "Fade, classic cut, perfilado de barba, hot towel shave",
     "Fecha de Inicio": "2026-10-10", "Fecha de Finalización": "2026-10-12",
     "Duración (Horas)": 20, "Costo": 38000,
     "Instructor": "Máximo Heredia"},
    {"Nombre del Programa": "Tratamientos capilares reconstructivos",
     "Descripción del Programa": "Botox capilar, keratina, nanoplastia, diagnóstico de porosidad",
     "Fecha de Inicio": "2026-11-20", "Fecha de Finalización": "2026-11-22",
     "Duración (Horas)": 24, "Costo": 52000,
     "Instructor": "Valentina Ríos"},
]
capa_ids = post("tblpDKylzRWU0QTuL", capa_records)
print(f"  Creados: {len(capa_ids)}/{len(capa_records)}")

# ---- REPORTES (tblblfVCv2Wbn0v4u) ----
print("\nREPORTES (tblblfVCv2Wbn0v4u)")
reporte_records = [
    {"ReporteID": "REP-2026-05", "FechaCreacion": "2026-05-31",
     "TipoReporte": "Ventas", "Descripcion": "Reporte mensual de ventas de mayo 2026",
     "DatosVentas": "Total: $2.450.000, Promedio diario: $98.000", "DatosClientes": "45 clientes nuevos"},
    {"ReporteID": "REP-2026-04", "FechaCreacion": "2026-04-30",
     "TipoReporte": "Ventas", "Descripcion": "Reporte mensual de ventas de abril 2026",
     "DatosVentas": "Total: $2.100.000, Promedio diario: $84.000", "DatosClientes": "38 clientes nuevos"},
    {"ReporteID": "REP-2026-Q1", "FechaCreacion": "2026-03-31",
     "TipoReporte": "Rendimiento del Salón", "Descripcion": "Trimestral Q1 2026 - Rendimiento general",
     "DatosVentas": "Total trimestre: $6.300.000", "DatosClientes": "Retención: 72%"},
    {"ReporteID": "REP-INV-05", "FechaCreacion": "2026-05-15",
     "TipoReporte": "Inventario", "Descripcion": "Inventario quincenal - stock bajo detectado",
     "DatosVentas": "Productos bajo stock mínimo: 8", "DatosClientes": "—"},
    {"ReporteID": "REP-EMP-05", "FechaCreacion": "2026-05-30",
     "TipoReporte": "Empleados", "Descripcion": "Evaluación de desempeño mensual mayo",
     "DatosVentas": "Promedio satisfacción: 4.7/5", "DatosClientes": "Quejas recibidas: 2"},
]
reporte_ids = post("tblblfVCv2Wbn0v4u", reporte_records)
print(f"  Creados: {len(reporte_ids)}/{len(reporte_records)}")

# ---- AGENDA (tbltQl7ljsgTBpkr1) ----
print("\nAGENDA (tbltQl7ljsgTBpkr1)")
agenda_records = [
    {"Hora de Inicio": "09:00", "Hora de Fin": "09:45", "Fecha": "2026-06-15",
     "Estado de la Cita": "Disponible", "Notas": "Bloque mañana"},
    {"Hora de Inicio": "10:00", "Hora de Fin": "11:00", "Fecha": "2026-06-15",
     "Estado de la Cita": "Disponible", "Notas": "Corte + color"},
    {"Hora de Inicio": "11:30", "Hora de Fin": "12:30", "Fecha": "2026-06-15",
     "Estado de la Cita": "Reservada", "Notas": "Manicura premium"},
    {"Hora de Inicio": "14:00", "Hora de Fin": "15:00", "Fecha": "2026-06-15",
     "Estado de la Cita": "Disponible", "Notas": "Bloque tarde"},
    {"Hora de Inicio": "15:30", "Hora de Fin": "17:00", "Fecha": "2026-06-15",
     "Estado de la Cita": "Disponible", "Notas": "Tratamiento capilar"},
]
agenda_ids = post("tbltQl7ljsgTBpkr1", agenda_records)
print(f"  Creados: {len(agenda_ids)}/{len(agenda_records)}")

# ---- PROMOCIONES (tblc8HGTbiXL5rsk8) ----
print("\nPROMOCIONES (tblc8HGTbiXL5rsk8)")
promo_records = [
    {"Nombre de la Promoción": "2x1 en Cortes para nuevos clientes",
     "Descripción de la Promoción": "Ven con un amigo y paguen solo un corte. Válido primera visita.",
     "Fecha de Inicio": "2026-06-01", "Fecha de Fin": "2026-07-31",
     "Descuento": 50, "Estado de la Promoción": "Activa"},
    {"Nombre de la Promoción": "Color + Tratamiento Premium",
     "Descripción de la Promoción": "Coloración completa + botox capilar con 30% de descuento en el tratamiento.",
     "Fecha de Inicio": "2026-06-15", "Fecha de Fin": "2026-08-15",
     "Descuento": 30, "Estado de la Promoción": "Activa"},
    {"Nombre de la Promoción": "Martes de Manicura",
     "Descripción de la Promoción": "Manicura esculpida en gel a precio especial todos los martes.",
     "Fecha de Inicio": "2026-06-01", "Fecha de Fin": "2026-06-30",
     "Descuento": 25, "Estado de la Promoción": "Activa"},
    {"Nombre de la Promoción": "Verano Refresh",
     "Descripción de la Promoción": "Corte + barba por precio especial. Válido diciembre y enero.",
     "Fecha de Inicio": "2026-12-01", "Fecha de Fin": "2027-01-31",
     "Descuento": 20, "Estado de la Promoción": "Inactiva"},
    {"Nombre de la Promoción": "Semana del Padre",
     "Descripción de la Promoción": "20% off en servicios de barbería por el Día del Padre.",
     "Fecha de Inicio": "2026-06-01", "Fecha de Fin": "2026-06-30",
     "Descuento": 20, "Estado de la Promoción": "Activa"},
]
promo_ids = post("tblc8HGTbiXL5rsk8", promo_records)
print(f"  Creados: {len(promo_ids)}/{len(promo_records)}")

# ===========================================================================
# FASE 2: Tablas que linkean a Fase 1
# ===========================================================================
print("\n" + "=" * 70)
print("FASE 2: Tablas con links a Fase 1")
print("=" * 70)

# ---- CLIENTES (tblzRwPeOVTdsvt5g) ----
print("\nCLIENTES (tblzRwPeOVTdsvt5g)")
cliente_records = [
    {"Nombre": "Ana Belén Suárez", "Email": "anabsuarez@gmail.com",
     "Teléfono": "+54 11 3456-7890", "Dirección": "Calle Paraguay 567, CABA",
     "Preferencias de Servicios": ["Corte de pelo", "Coloración"],
     "Ventas": "Cliente frecuente, gasta ~$15000/mes"},
    {"Nombre": "Javier Ignacio Paz", "Email": "jipaz@hotmail.com",
     "Teléfono": "+54 11 2345-6789", "Dirección": "Av. Las Heras 234, CABA",
     "Preferencias de Servicios": ["Manicura", "Tratamiento facial"],
     "Ventas": "Visita quincenal, gasta ~$8000/mes"},
    {"Nombre": "Camila Torres", "Email": "camilatorres@outlook.com",
     "Teléfono": "+54 11 1234-5678", "Dirección": "Calle Arévalo 890, CABA",
     "Preferencias de Servicios": ["Pedicura", "Tratamiento facial", "Coloración"],
     "Ventas": "Premium, gasta ~$25000/mes"},
    {"Nombre": "Ricardo Montero", "Email": "rmontero@corporativo.com",
     "Teléfono": "+54 11 9876-5432", "Dirección": "Av. Libertador 4500, CABA",
     "Preferencias de Servicios": ["Corte de pelo", "Manicura"],
     "Ventas": "Ejecutivo, visita semanal, gasta ~$12000/mes"},
    {"Nombre": "Valentina Quiroga", "Email": "vqui@gmail.com",
     "Teléfono": "+54 11 8765-4321", "Dirección": "Calle Gorriti 123, CABA",
     "Preferencias de Servicios": ["Coloración", "Tratamiento facial"],
     "Ventas": "Visita mensual, gasta ~$18000/visita"},
]
# Agregar links a promociones y agenda
for i, rec in enumerate(cliente_records):
    if promo_ids and len(promo_ids) > i:
        rec["Promociones"] = [promo_ids[i]]
    if agenda_ids and len(agenda_ids) > i:
        rec["Agenda"] = [agenda_ids[i]]

cliente_ids = post("tblzRwPeOVTdsvt5g", cliente_records)
print(f"  Creados: {len(cliente_ids)}/{len(cliente_records)}")

# ---- SERVICIOS (tblIDRFHpLoQpB9JH) ----
print("\nSERVICIOS (tblIDRFHpLoQpB9JH)")
serv_records = [
    {"Nombre del Servicio": "Corte de cabello clásico",
     "Descripción del Servicio": "Corte personalizado con tijera y navaja, incluye lavado y peinado.",
     "Eslogan de Venta": "Renová tu estilo con un corte que habla por vos ✂️",
     "Duración del Servicio": 45, "Valor Hora Hombre": 0,
     "Maestra Contable": "SERV-001"},
    {"Nombre del Servicio": "Coloración completa + mechas",
     "Descripción del Servicio": "Coloración profesional con productos libres de amoníaco. Incluye mechas balayage.",
     "Eslogan de Venta": "El color que soñaste, sin dañar tu cabello 🎨",
     "Duración del Servicio": 120, "Valor Hora Hombre": 0,
     "Maestra Contable": "SERV-002"},
    {"Nombre del Servicio": "Manicura esculpida en gel",
     "Descripción del Servicio": "Uñas esculpidas con polygel, diseño a elección. Duración 3 semanas.",
     "Eslogan de Venta": "Manos impecables que hablan de vos 💅",
     "Duración del Servicio": 90, "Valor Hora Hombre": 0,
     "Maestra Contable": "SERV-003"},
    {"Nombre del Servicio": "Tratamiento de keratina",
     "Descripción del Servicio": "Alisado progresivo sin formol. Nutrición profunda, reduce frizz.",
     "Eslogan de Venta": "Cabello liso, brillante y saludable por meses ☀️",
     "Duración del Servicio": 150, "Valor Hora Hombre": 0,
     "Maestra Contable": "SERV-004"},
    {"Nombre del Servicio": "Barbería completa",
     "Descripción del Servicio": "Corte fade, perfilado de barba con navaja, toalla caliente y after shave.",
     "Eslogan de Venta": "La experiencia de barbería que merecés 🪒",
     "Duración del Servicio": 60, "Valor Hora Hombre": 0,
     "Maestra Contable": "SERV-005"},
]
serv_ids = post("tblIDRFHpLoQpB9JH", serv_records)
print(f"  Creados: {len(serv_ids)}/{len(serv_records)}")

# ---- PRODUCTOS (tblkz2NvmwGBXHjpF) ----
print("\nPRODUCTOS (tblkz2NvmwGBXHjpF)")
prod_records = [
    {"Nombre del Producto": "Shampoo Profesional Fidelitte 1L",
     "Descripción del Producto": "Shampoo hidratante sin sal, pH balanceado para todo tipo de cabello.",
     "Precio del Producto": 3200, "Nivel de Stock": 15,
     "Marca": ["Fidelitte"], "Categoría del Producto": "Cuidado del Cabello",
     "Tipo de USO": ["CONSUMO INTERNO"],
     "Rendimiento": 60, "Costo del Envio": 0,
     "Slogan de Venta": "La base de un cabello radiante ✨",
     "Modo de Uso": "Aplicar sobre cabello mojado, masajear y enjuagar. Repetir si es necesario.",
     "Inventario": [], "Maestra Contable": "PROD-001"},
    {"Nombre del Producto": "Decolorante en polvo Tec Italy 500g",
     "Descripción del Producto": "Decolorante profesional 7 tonos, con aceite de argán protector.",
     "Precio del Producto": 5800, "Nivel de Stock": 8,
     "Marca": ["Tec Italy"], "Categoría del Producto": "Coloración ",
     "Tipo de USO": ["CONSUMO EN SERVICIOS"],
     "Rendimiento": 25, "Costo del Envio": 1200,
     "Slogan de Venta": "Aclarado intenso, cuidado extremo ⚡",
     "Modo de Uso": "Mezclar 1:2 con peróxido según tono deseado. No exceder 50 min de exposición.",
     "Inventario": [], "Maestra Contable": "PROD-002"},
    {"Nombre del Producto": "Kit de tijeras profesionales Framar",
     "Descripción del Producto": "Set de tijeras 5.5\" y 6\" con microdentado, acero japonés.",
     "Precio del Producto": 18500, "Nivel de Stock": 4,
     "Marca": ["Framar"], "Categoría del Producto": "Herramientas",
     "Tipo de USO": ["CONSUMO INTERNO"],
     "Rendimiento": 1, "Costo del Envio": 2500,
     "Slogan de Venta": "Precisión japonesa en tus manos 🎯",
     "Modo de Uso": "Uso profesional exclusivo. Esterilizar antes y después de cada cliente.",
     "Inventario": [], "Maestra Contable": "PROD-003"},
    {"Nombre del Producto": "Botox Capilar Caviar 250ml",
     "Descripción del Producto": "Tratamiento de reconstrucción capilar con colágeno y queratina.",
     "Precio del Producto": 4200, "Nivel de Stock": 12,
     "Marca": ["Caviar"], "Categoría del Producto": "Keratinas , Botox y Alisados",
     "Tipo de USO": ["VENTAS", "CONSUMO EN SERVICIOS"],
     "Rendimiento": 8, "Costo del Envio": 800,
     "Slogan de Venta": "Resultados de salón en tu casa 🏠",
     "Modo de Uso": "Aplicar sobre cabello lavado, dejar 20 min con calor, enjuagar sin shampoo.",
     "Inventario": [], "Maestra Contable": "PROD-004"},
    {"Nombre del Producto": "Capas de peluquería descartables x100",
     "Descripción del Producto": "Capas plásticas descartables, paquete de 100 unidades.",
     "Precio del Producto": 2800, "Nivel de Stock": 25,
     "Marca": ["NovaLook"], "Categoría del Producto": "Almacen",
     "Tipo de USO": ["CONSUMO INTERNO"],
     "Rendimiento": 100, "Costo del Envio": 0,
     "Slogan de Venta": "Higiene y profesionalismo en cada servicio 🧴",
     "Modo de Uso": "Colocar sobre el cliente antes de iniciar el servicio. Descartar después de cada uso.",
     "Inventario": [], "Maestra Contable": "PROD-005"},
]

# Link proveedores
if prov_ids and len(prov_ids) >= 5:
    prod_records[0]["Proveedor"] = [prov_ids[0]]
    prod_records[1]["Proveedor"] = [prov_ids[1]]
    prod_records[2]["Proveedor"] = [prov_ids[3]]
    prod_records[3]["Proveedor"] = [prov_ids[2]]
    prod_records[4]["Proveedor"] = [prov_ids[4]]

# Link promociones
if promo_ids and len(promo_ids) >= 3:
    prod_records[0]["Promociones"] = [promo_ids[2]]
    prod_records[3]["Promociones"] = [promo_ids[1]]

prod_ids = post("tblkz2NvmwGBXHjpF", prod_records)
print(f"  Creados: {len(prod_ids)}/{len(prod_records)}")

# ---- INVENTARIO (tblNz69ntR4zvHjH1) ----
print("\nINVENTARIO (tblNz69ntR4zvHjH1)")
inv_records = [
    {"Fecha de Última Actualización": "2026-06-01", "Notas de Inventario": "Stock normal, sin novedades",
     "Producto": [prod_ids[0]] if len(prod_ids) > 0 else []},
    {"Fecha de Última Actualización": "2026-06-01", "Notas de Inventario": "Reabastecer antes del 15/06 — quedan 8 unidades",
     "Producto": [prod_ids[1]] if len(prod_ids) > 1 else []},
    {"Fecha de Última Actualización": "2026-05-15", "Notas de Inventario": "OK, no requiere reposición inmediata",
     "Producto": [prod_ids[2]] if len(prod_ids) > 2 else []},
    {"Fecha de Última Actualización": "2026-05-28", "Notas de Inventario": "Buen margen, 12 unidades disponibles",
     "Producto": [prod_ids[3]] if len(prod_ids) > 3 else []},
    {"Fecha de Última Actualización": "2026-06-02", "Notas de Inventario": "Recién repuesto, stock completo",
     "Producto": [prod_ids[4]] if len(prod_ids) > 4 else []},
]
inv_ids = post("tblNz69ntR4zvHjH1", inv_records)
print(f"  Creados: {len(inv_ids)}/{len(inv_records)}")

# ---- CITAS (tblZNB7HfD3OAGL9x) ----
print("\nCITAS (tblZNB7HfD3OAGL9x)")
cita_records = [
    {"Hora de la Cita": "10:00", "Fecha de la Cita": "2026-06-15",
     "Estado de la Cita": "Programada", "Notas de la Cita": "Corte clásico + planchita",
     "Cliente": [cliente_ids[0]] if len(cliente_ids) > 0 else [],
     "Servicio Solicitado": [serv_ids[0]] if len(serv_ids) > 0 else [],
     "Profesional Asignado": [emp_ids[0]] if len(emp_ids) > 0 else []},
    {"Hora de la Cita": "11:30", "Fecha de la Cita": "2026-06-15",
     "Estado de la Cita": "Programada", "Notas de la Cita": "Manicura gel, trae diseño impreso",
     "Cliente": [cliente_ids[1]] if len(cliente_ids) > 1 else [],
     "Servicio Solicitado": [serv_ids[2]] if len(serv_ids) > 2 else [],
     "Profesional Asignado": [emp_ids[1]] if len(emp_ids) > 1 else []},
    {"Hora de la Cita": "14:30", "Fecha de la Cita": "2026-06-16",
     "Estado de la Cita": "Programada", "Notas de la Cita": "Coloración completa, llevar muestra de color",
     "Cliente": [cliente_ids[2]] if len(cliente_ids) > 2 else [],
     "Servicio Solicitado": [serv_ids[1]] if len(serv_ids) > 1 else [],
     "Profesional Asignado": [emp_ids[2]] if len(emp_ids) > 2 else []},
    {"Hora de la Cita": "09:00", "Fecha de la Cita": "2026-06-17",
     "Estado de la Cita": "Programada", "Notas de la Cita": "Barbería completa — primer visita",
     "Cliente": [cliente_ids[3]] if len(cliente_ids) > 3 else [],
     "Servicio Solicitado": [serv_ids[4]] if len(serv_ids) > 4 else [],
     "Profesional Asignado": [emp_ids[3]] if len(emp_ids) > 3 else []},
    {"Hora de la Cita": "16:00", "Fecha de la Cita": "2026-06-18",
     "Estado de la Cita": "Programada", "Notas de la Cita": "Keratina — requiere bloque de 2.5hs",
     "Cliente": [cliente_ids[4]] if len(cliente_ids) > 4 else [],
     "Servicio Solicitado": [serv_ids[3]] if len(serv_ids) > 3 else [],
     "Profesional Asignado": [emp_ids[4]] if len(emp_ids) > 4 else []},
]
cita_ids = post("tblZNB7HfD3OAGL9x", cita_records)
print(f"  Creados: {len(cita_ids)}/{len(cita_records)}")

# ===========================================================================
# FASE 3: Tablas con links más complejos
# ===========================================================================
print("\n" + "=" * 70)
print("FASE 3: Tablas con links complejos")
print("=" * 70)

# ---- RESUMEN DE COSTOS FIJOS (tbl7MRYpZJI0kEet1) ----
print("\nRESUMEN DE COSTOS FIJOS (tbl7MRYpZJI0kEet1)")
resumen_records = [
    {"Fecha": "2026-05-01", "Servicios Promedio Mensuales": 180,
     "Costos Fijos Peluquería": costos_ids[:3] if len(costos_ids) >= 3 else [],
     "Servicios": serv_ids[:3] if len(serv_ids) >= 3 else []},
    {"Fecha": "2026-06-01", "Servicios Promedio Mensuales": 200,
     "Costos Fijos Peluquería": costos_ids if len(costos_ids) >= 5 else [],
     "Servicios": serv_ids if len(serv_ids) >= 5 else []},
]
resumen_ids = post("tbl7MRYpZJI0kEet1", resumen_records)
print(f"  Creados: {len(resumen_ids)}/{len(resumen_records)}")

# ---- INGRESOS/EGRESOS (tblEoTMnKvkZzHDBf) ----
print("\nINGRESOS/EGRESOS (tblEoTMnKvkZzHDBf)")
ingresos_records = [
    {"Fecha de Venta": "2026-06-01", "Medio de Pago": "Mercado Pago",
     "¿Pagado?": True, "Fecha de Cobro": "2026-06-01",
     "Monto Cobrado": 5800,
     "Ingresos": ["Ingresos", "Cobro Servicio"],
     "Ingresos Extras": 0,
     "Cliente": [cliente_ids[0]] if len(cliente_ids) > 0 else [],
     "Servicio Realizado": [serv_ids[0]] if len(serv_ids) > 0 else [],
     "Productos": [], "Notas": "Corte clásico — sin extras",
     "Costos Fijos Peluquería": "Ver resumen junio",
     "Descripcion de Egresos Variables": "N/A", "Egresos variables": 0},
    {"Fecha de Venta": "2026-06-02", "Medio de Pago": "Efectivo",
     "¿Pagado?": True, "Fecha de Cobro": "2026-06-02",
     "Monto Cobrado": 13500,
     "Ingresos": ["Ingresos", "Cobro Servicio"],
     "Ingresos Extras": 500,
     "Cliente": [cliente_ids[1]] if len(cliente_ids) > 1 else [],
     "Servicio Realizado": [serv_ids[2]] if len(serv_ids) > 2 else [],
     "Productos": [], "Notas": "Manicura + propina $500",
     "Costos Fijos Peluquería": "Ver resumen junio",
     "Descripcion de Egresos Variables": "N/A", "Egresos variables": 0},
    {"Fecha de Venta": "2026-06-03", "Medio de Pago": "Tarjeta Crédito",
     "¿Pagado?": True, "Fecha de Cobro": "2026-06-18",
     "Monto Cobrado": 22400,
     "Ingresos": ["Ingresos", "Cobro Servicio", "Venta Productos"],
     "Ingresos Extras": 0,
     "Cliente": [cliente_ids[2]] if len(cliente_ids) > 2 else [],
     "Servicio Realizado": [serv_ids[1]] if len(serv_ids) > 1 else [],
     "Productos": [prod_ids[3]] if len(prod_ids) > 3 else [],
     "Notas": "Coloración + compró botox capilar para casa",
     "Costos Fijos Peluquería": "Ver resumen junio",
     "Descripcion de Egresos Variables": "N/A", "Egresos variables": 0},
    {"Fecha de Venta": "2026-06-03", "Medio de Pago": "Transferencia",
     "¿Pagado?": False, "Fecha de Cobro": "2026-06-03",
     "Monto Cobrado": 0,
     "Ingresos": ["Cobro Deuda"],
     "Ingresos Extras": 0,
     "Cliente": [cliente_ids[3]] if len(cliente_ids) > 3 else [],
     "Servicio Realizado": [serv_ids[4]] if len(serv_ids) > 4 else [],
     "Productos": [], "Notas": "Deuda pendiente — factura enviada por email",
     "Costos Fijos Peluquería": "Ver resumen junio",
     "Descripcion de Egresos Variables": "N/A", "Egresos variables": 0},
    {"Fecha de Venta": "2026-06-04", "Medio de Pago": "Tarjeta Débito",
     "¿Pagado?": True, "Fecha de Cobro": "2026-06-04",
     "Monto Cobrado": 18900,
     "Ingresos": ["Ingresos", "Cobro Servicio"],
     "Ingresos Extras": 0,
     "Cliente": [cliente_ids[4]] if len(cliente_ids) > 4 else [],
     "Servicio Realizado": [serv_ids[3]] if len(serv_ids) > 3 else [],
     "Productos": [], "Notas": "Keratina completa, resultado excelente",
     "Costos Fijos Peluquería": "Ver resumen junio",
     "Descripcion de Egresos Variables": "N/A", "Egresos variables": 0},
]
ingresos_ids = post("tblEoTMnKvkZzHDBf", ingresos_records)
print(f"  Creados: {len(ingresos_ids)}/{len(ingresos_records)}")

# ===========================================================================
# FASE 4: Links post-creación (actualizaciones cruzadas)
# ===========================================================================
print("\n" + "=" * 70)
print("FASE 4: Links bidireccionales post-creación")
print("=" * 70)

# Actualizar EMPLEADOS con CITAS, CAPACITACIONES, SERVICIOS, AGENDA, REPORTES
if emp_ids and len(emp_ids) >= 5:
    print("\nLinks EMPLEADOS ← CITAS, CAPACITACIONES, SERVICIOS, AGENDA, REPORTES")
    emp_updates = [
        {"Citas Asignadas": [cita_ids[0]] if len(cita_ids) > 0 else [],
         "Capacitaciones Completadas": [capa_ids[0]] if len(capa_ids) > 0 else []},
        {"Citas Asignadas": [cita_ids[1]] if len(cita_ids) > 1 else [],
         "Capacitaciones Completadas": [capa_ids[1]] if len(capa_ids) > 1 else []},
        {"Citas Asignadas": [cita_ids[2]] if len(cita_ids) > 2 else [],
         "Capacitaciones Completadas": [capa_ids[0], capa_ids[3]] if len(capa_ids) >= 4 else []},
        {"Citas Asignadas": [cita_ids[3]] if len(cita_ids) > 3 else [],
         "Capacitaciones Completadas": [capa_ids[3]] if len(capa_ids) > 3 else []},
        {"Citas Asignadas": [cita_ids[4]] if len(cita_ids) > 4 else [],
         "Capacitaciones Completadas": [capa_ids[4]] if len(capa_ids) > 4 else []},
    ]
    for i, eid in enumerate(emp_ids):
        if i < len(emp_updates):
            if serv_ids and len(serv_ids) > i:
                emp_updates[i]["Servicios"] = [serv_ids[i]]
            if agenda_ids and len(agenda_ids) > i:
                emp_updates[i]["Agenda"] = [agenda_ids[i]]
            if reporte_ids and len(reporte_ids) > i:
                emp_updates[i]["Reportes"] = [reporte_ids[i]]
    put("tblxodPS9acp1kyoU", emp_ids, emp_updates)
    print("  Actualizados: OK")

# Actualizar CLIENTES con CITAS
if cliente_ids and len(cliente_ids) >= 5 and cita_ids and len(cita_ids) >= 5:
    print("\nLinks CLIENTES ← Historial de Citas, Ventas y Cobros")
    cli_updates = []
    for i in range(5):
        upd = {"Historial de Citas": [cita_ids[i]]}
        if ingresos_ids and len(ingresos_ids) > i:
            upd["Ventas y Cobros"] = [ingresos_ids[i]]
        cli_updates.append(upd)
    put("tblzRwPeOVTdsvt5g", cliente_ids, cli_updates)
    print("  Actualizados: OK")

# Actualizar SERVICIOS con links
if serv_ids and len(serv_ids) >= 5:
    print("\nLinks SERVICIOS ← Productos, Capacitaciones, Empleados, Promociones, Citas, Agenda, Resumen")
    srv_updates = [
        {"Productos utilizados": [prod_ids[0]] if len(prod_ids) > 0 else [],
         "Promociones": [promo_ids[0]] if len(promo_ids) > 0 else [],
         "Citas": [cita_ids[0]] if len(cita_ids) > 0 else [],
         "Agenda": [agenda_ids[0]] if len(agenda_ids) > 0 else [],
         "Capacitaciones": [capa_ids[0]] if len(capa_ids) > 0 else []},
        {"Productos utilizados": [prod_ids[1]] if len(prod_ids) > 1 else [],
         "Promociones": [promo_ids[1]] if len(promo_ids) > 1 else [],
         "Citas": [cita_ids[2]] if len(cita_ids) > 2 else [],
         "Agenda": [agenda_ids[2]] if len(agenda_ids) > 2 else []},
        {"Productos utilizados": [],
         "Promociones": [promo_ids[2]] if len(promo_ids) > 2 else [],
         "Citas": [cita_ids[1]] if len(cita_ids) > 1 else [],
         "Agenda": [agenda_ids[1]] if len(agenda_ids) > 1 else [],
         "Capacitaciones": [capa_ids[1]] if len(capa_ids) > 1 else []},
        {"Productos utilizados": [prod_ids[3]] if len(prod_ids) > 3 else [],
         "Promociones": [promo_ids[1]] if len(promo_ids) > 1 else [],
         "Citas": [cita_ids[4]] if len(cita_ids) > 4 else [],
         "Agenda": [agenda_ids[3]] if len(agenda_ids) > 3 else [],
         "Capacitaciones": [capa_ids[4]] if len(capa_ids) > 4 else []},
        {"Productos utilizados": [prod_ids[2], prod_ids[4]] if len(prod_ids) >= 5 else [],
         "Promociones": [promo_ids[4]] if len(promo_ids) > 4 else [],
         "Citas": [cita_ids[3]] if len(cita_ids) > 3 else [],
         "Agenda": [agenda_ids[4]] if len(agenda_ids) > 4 else [],
         "Capacitaciones": [capa_ids[3]] if len(capa_ids) > 3 else []},
    ]
    if resumen_ids:
        for i in range(min(5, len(serv_ids))):
            srv_updates[i]["Resumen de Costos Fijos"] = [resumen_ids[0]]
    if emp_ids and len(emp_ids) >= 5:
        for i in range(5):
            srv_updates[i]["Empleados Especializados"] = [emp_ids[i]]
    put("tblIDRFHpLoQpB9JH", serv_ids, srv_updates)
    print("  Actualizados: OK")

# Actualizar AGENDA con CLIENTES, SERVICIOS, EMPLEADOS
if agenda_ids and len(agenda_ids) >= 5:
    print("\nLinks AGENDA ← Clientes, Servicio, Empleado")
    ag_updates = []
    for i in range(5):
        upd = {}
        if cliente_ids and len(cliente_ids) > i:
            upd["Cliente"] = [cliente_ids[i]]
        if serv_ids and len(serv_ids) > i:
            upd["Servicio Solicitado"] = [serv_ids[i]]
        if emp_ids and len(emp_ids) > i:
            upd["Empleado Asignado"] = [emp_ids[i]]
        ag_updates.append(upd)
    put("tbltQl7ljsgTBpkr1", agenda_ids, ag_updates)
    print("  Actualizados: OK")

# Actualizar CAPACITACIONES con EMPLEADOS, SERVICIOS
if capa_ids and len(capa_ids) >= 5 and emp_ids and len(emp_ids) >= 5 and serv_ids and len(serv_ids) >= 5:
    print("\nLinks CAPACITACIONES ← Empleados, Servicios")
    capa_updates = [
        {"Empleados Participantes": [emp_ids[0], emp_ids[4]], "Servicios Relacionados": [serv_ids[1]]},
        {"Empleados Participantes": [emp_ids[1]], "Servicios Relacionados": [serv_ids[2]]},
        {"Empleados Participantes": [emp_ids[0], emp_ids[1], emp_ids[2], emp_ids[3], emp_ids[4]], "Servicios Relacionados": []},
        {"Empleados Participantes": [emp_ids[3]], "Servicios Relacionados": [serv_ids[4]]},
        {"Empleados Participantes": [emp_ids[2], emp_ids[4]], "Servicios Relacionados": [serv_ids[3]]},
    ]
    put("tblpDKylzRWU0QTuL", capa_ids, capa_updates)
    print("  Actualizados: OK")

# Actualizar PROMOCIONES con SERVICIOS, PRODUCTOS, CLIENTES
if promo_ids and len(promo_ids) >= 5:
    print("\nLinks PROMOCIONES ← Servicios, Productos, Clientes")
    promo_updates = [
        {"Servicios Incluidos": [serv_ids[0]] if len(serv_ids) > 0 else [],
         "Clientes Objetivo": [cliente_ids[0], cliente_ids[4]] if len(cliente_ids) >= 5 else []},
        {"Servicios Incluidos": [serv_ids[1], serv_ids[3]] if len(serv_ids) >= 4 else [],
         "Productos Incluidos": [prod_ids[3]] if len(prod_ids) > 3 else [],
         "Clientes Objetivo": [cliente_ids[0], cliente_ids[2]] if len(cliente_ids) >= 3 else []},
        {"Servicios Incluidos": [serv_ids[2]] if len(serv_ids) > 2 else [],
         "Clientes Objetivo": [cliente_ids[1]] if len(cliente_ids) > 1 else []},
        {"Servicios Incluidos": [serv_ids[4]] if len(serv_ids) > 4 else [],
         "Clientes Objetivo": [cliente_ids[3]] if len(cliente_ids) > 3 else []},
        {"Servicios Incluidos": [serv_ids[4]] if len(serv_ids) > 4 else [],
         "Clientes Objetivo": [cliente_ids[3]] if len(cliente_ids) > 3 else []},
    ]
    put("tblc8HGTbiXL5rsk8", promo_ids, promo_updates)
    print("  Actualizados: OK")

# Actualizar REPORTES con INVENTARIO y EMPLEADOS
if reporte_ids and len(reporte_ids) >= 3 and inv_ids and len(inv_ids) >= 3:
    print("\nLinks REPORTES ← Inventario, Empleados")
    rep_updates = [
        {"DatosInventario": [inv_ids[0], inv_ids[1]], "DatosEmpleados": [emp_ids[0], emp_ids[1]] if len(emp_ids) >= 2 else []},
        {"DatosInventario": [inv_ids[2], inv_ids[3]], "DatosEmpleados": [emp_ids[2]] if len(emp_ids) > 2 else []},
        {"DatosInventario": [inv_ids[0]], "DatosEmpleados": [emp_ids[0], emp_ids[1], emp_ids[2], emp_ids[3]] if len(emp_ids) >= 4 else []},
    ]
    put("tblblfVCv2Wbn0v4u", reporte_ids[:3], rep_updates)
    print("  Actualizados: OK")

# ===========================================================================
print("\n" + "=" * 70)
print("SEED COMPLETO ✅")
print(f"Total registros creados: {len(emp_ids)+len(prov_ids)+len(costos_ids)+len(ficha_ids)+len(cliente_ids)+len(serv_ids)+len(prod_ids)+len(inv_ids)+len(cita_ids)+len(agenda_ids)+len(promo_ids)+len(capa_ids)+len(reporte_ids)+len(resumen_ids)+len(ingresos_ids)} en 15 tablas")
print("=" * 70)
