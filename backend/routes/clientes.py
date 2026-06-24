"""
Rutas FastAPI para CLIENTES — /api/clientes
Fase 3B: perfil cliente autenticado + citas propias.
Fase 3C1: dry-run de reserva de turnos.
Fase 3C2: confirmacion real de cita (crea CITA + marca AGENDA_SLOT).
"""
import sys
from pathlib import Path
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["clientes"])

_CAMPOS_EDITABLES_CLIENTE = {
    "NOMBRE_CLIENTE", "TELEFONO", "DOCUMENTO_IDENTIDAD",
    "CALLE_Y_N°", "LOCALIDAD", "PROVINCIA/PAIS", "CODIGO_POSTAL",
    "PREFERENCIAS_SERVICIOS", "ACEPTA_COMUNICACIONES", "FECHA_NACIMIENTO",
}


@router.get("/clientes")
async def listar_clientes():
    """Lista todos los clientes (uso administrativo)."""
    try:
        client = AirtableClient()
        records = client.list_records("CLIENTES", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "clientes": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/clientes/me")
async def get_my_cliente(user: dict = Depends(get_current_user)):
    """Devuelve el registro CLIENTES vinculado al usuario autenticado."""
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")
    try:
        at = AirtableClient()
        record = at.get_record("CLIENTES", cliente_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener perfil: {str(e)}")
    fields = record.get("fields", {})
    return {"id": record["id"], "email": fields.get("EMAIL", user.get("email", "")), **fields}


@router.patch("/clientes/me")
async def update_my_cliente(payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza solo campos seguros del perfil CLIENTES."""
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")
    update_fields = {}
    for k, v in payload.items():
        if k in _CAMPOS_EDITABLES_CLIENTE:
            update_fields[k] = v
    if not update_fields:
        raise HTTPException(status_code=400, detail="No se enviaron campos editables validos.")
    try:
        at = AirtableClient()
        at.patch_record("CLIENTES", cliente_id, update_fields)
        updated = at.get_record("CLIENTES", cliente_id)
        fields = updated.get("fields", {})
        return {
            "id": updated["id"],
            "email": fields.get("EMAIL", user.get("email", "")),
            "actualizados": list(update_fields.keys()),
            **fields,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar perfil: {str(e)}")


@router.get("/clientes/me/citas")
async def get_my_citas(user: dict = Depends(get_current_user)):
    """Devuelve las CITAS vinculadas al CLIENTE autenticado."""
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")
    try:
        at = AirtableClient()
        formula = "SEARCH('" + cliente_id + "', ARRAYJOIN({CLIENTE}))"
        records = at.list_records("CITAS", filter_formula=formula, by_name=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")
    citas = []
    _campos_internos = {
        "OBSERVACIONES_INTERNAS", "DIAGNOSTICO_PREVIO", "REQUIERE_DIAGNOSTICO",
        "REQUIERE_CONSENTIMIENTO", "CONSENTIMIENTO_FIRMADO", "REQUIERE_PRUEBA_ALERGIA",
        "PRUEBA_ALERGIA_REALIZADA", "MOTIVO_CANCELACION", "FECHA_CANCELACION", "CANCELADO_POR",
    }
    for r in records:
        fields = r.get("fields", {})
        safe_fields = {k: v for k, v in fields.items() if k not in _campos_internos}
        citas.append({"id": r["id"], "createdTime": r.get("createdTime"), **safe_fields})
    hoy = date.today().isoformat()
    proximas, historial = [], []
    for c in citas:
        estado = c.get("ESTADO_CITA", "")
        fecha = c.get("FECHA_CITA", "")
        if estado in ("COMPLETADA", "CANCELADA", "NO_ASISTIO"):
            historial.append(c)
        elif fecha and fecha >= hoy:
            proximas.append(c)
        else:
            historial.append(c)
    return {
        "total": len(citas),
        "proximas": sorted(proximas, key=lambda c: c.get("FECHA_CITA", "")),
        "historial": sorted(historial, key=lambda c: c.get("FECHA_CITA", ""), reverse=True),
    }


@router.post("/clientes/citas/dry-run")
async def dry_run_reserva(payload: dict, user: dict = Depends(get_current_user)):
    """Valida disponibilidad de turno SIN crear cita ni modificar slot.

    FASE_3C1: Dry-run de reserva. No escribe en Airtable.
    Payload: {slot_id, servicio_web_id, sucursal_id}
    """
    # 1. Validar rol CLIENTE
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden reservar turnos.")

    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    slot_id = (payload.get("slot_id") or "").strip()
    servicio_web_id = (payload.get("servicio_web_id") or "").strip()
    sucursal_id = (payload.get("sucursal_id") or "").strip()
    if not all([slot_id, servicio_web_id, sucursal_id]):
        raise HTTPException(status_code=400,
            detail="Faltan datos: slot_id, servicio_web_id y sucursal_id son requeridos.")

    at = AirtableClient()
    errores = []

    # 2. Validar AGENDA_SLOTS
    try:
        slot = at.get_record("AGENDA_SLOTS", slot_id)
        sfields = slot.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Slot {slot_id} no encontrado.")

    estado_slot = (sfields.get("ESTADO_SLOT") or "").upper()
    disponible_auto = (sfields.get("DISPONIBLE_AUTO") or "").upper()
    permite_web = sfields.get("PERMITE_RESERVA_WEB", False)
    activo = sfields.get("ACTIVO", False)
    capacidad = sfields.get("CAPACIDAD_DISPONIBLE", 0)

    if estado_slot != "DISPONIBLE":
        errores.append(f"Slot no disponible (estado: {estado_slot}).")
    if disponible_auto != "SI":
        errores.append("Slot marcado como no disponible automaticamente.")
    if not permite_web:
        errores.append("Slot no permite reserva web.")
    if not activo:
        errores.append("Slot inactivo.")
    if capacidad is not None and capacidad <= 0:
        errores.append("Slot sin capacidad disponible.")

    # 3. Validar SERVICIOS_WEB
    try:
        sw_record = at.get_record("SERVICIOS_WEB", servicio_web_id)
        sw_fields = sw_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Servicio web {servicio_web_id} no encontrado.")

    if not sw_fields.get("RESERVA_ONLINE_HABILITADA", False):
        errores.append("El servicio no esta habilitado para reserva online.")
    if not sw_fields.get("ACTIVO_EN_WEB", False):
        errores.append("El servicio no esta activo en web.")

    svc_name = sw_fields.get("NOMBRE_PUBLICO_SERVICIO", "Sin nombre")
    svc_linked = sw_fields.get("SERVICIO")
    svc_id = svc_linked[0] if isinstance(svc_linked, list) and svc_linked else str(svc_linked) if svc_linked else ""
    precio = sw_fields.get("PRECIO_WEB")

    # 4. Validar SUCURSALES
    try:
        suc_record = at.get_record("SUCURSALES", sucursal_id)
        suc_fields = suc_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Sucursal {sucursal_id} no encontrada.")

    if not suc_fields.get("ACTIVO", False):
        errores.append("La sucursal no esta activa.")
    suc_name = suc_fields.get("NOMBRE_SUCURSAL", "Sin nombre")

    # 5. Validar conflicto de slot
    try:
        formula = (
            f"AND({{AGENDA_SLOT}}='{slot_id}', "
            "OR({ESTADO_CITA}='CONFIRMADA', {ESTADO_CITA}='PENDIENTE_CONFIRMACION', "
            "{ESTADO_CITA}='EN_CURSO'))"
        )
        existing = at.list_records("CITAS", filter_formula=formula, by_name=True, page_size=1)
    except Exception:
        existing = []
    if existing:
        errores.append("El slot ya tiene una cita activa (CONFIRMADA/PENDIENTE/EN_CURSO).")

    # 6. Responder
    fecha = sfields.get("FECHA_SLOT", "")
    hora_ini = sfields.get("HORA_INICIO", "")
    hora_fin = sfields.get("HORA_FIN", "")
    duracion = sfields.get("DURACION_MINUTOS", "")
    disponible = len(errores) == 0

    return {
        "dry_run": True,
        "disponible": disponible,
        "errores": errores if errores else None,
        "detalle": {
            "cliente_id": cliente_id,
            "slot": {
                "id": slot_id,
                "fecha": fecha,
                "hora_inicio": hora_ini,
                "hora_fin": hora_fin,
                "duracion_minutos": duracion,
            },
            "servicio": {
                "id": servicio_web_id,
                "nombre": svc_name,
                "servicio_canonico_id": svc_id or None,
                "precio_web": precio,
            },
            "sucursal": {
                "id": sucursal_id,
                "nombre": suc_name,
            },
        },
        "mensaje": (
            "Turno disponible. Listo para confirmar en la proxima etapa."
            if disponible else
            "No se puede reservar: " + "; ".join(errores)
        ),
        "nota": "Ningun registro fue creado ni modificado. Esto es un dry-run.",
    }


@router.post("/clientes/citas/confirmar")
async def confirmar_reserva(payload: dict, user: dict = Depends(get_current_user)):
    """Confirma reserva de turno: crea CITA real y marca AGENDA_SLOT como RESERVADO.

    FASE_3C2: Confirmacion real. Escribe en Airtable (CITAS + AGENDA_SLOTS).
    No usa tabla RESERVAS.
    Payload: {slot_id, servicio_web_id, sucursal_id}
    """
    # 1. Auth: solo CLIENTE
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden confirmar turnos.")

    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    slot_id = (payload.get("slot_id") or "").strip()
    servicio_web_id = (payload.get("servicio_web_id") or "").strip()
    sucursal_id = (payload.get("sucursal_id") or "").strip()
    if not all([slot_id, servicio_web_id, sucursal_id]):
        raise HTTPException(status_code=400,
            detail="Faltan datos: slot_id, servicio_web_id y sucursal_id son requeridos.")

    at = AirtableClient()
    errores = []
    hoy = date.today().isoformat()

    # 2. Revalidar AGENDA_SLOTS (pudo cambiar desde dry-run)
    try:
        slot = at.get_record("AGENDA_SLOTS", slot_id)
        sfields = slot.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Slot {slot_id} no encontrado.")

    estado_slot = (sfields.get("ESTADO_SLOT") or "").upper()
    disponible_auto = (sfields.get("DISPONIBLE_AUTO") or "").upper()
    permite_web = sfields.get("PERMITE_RESERVA_WEB", False)
    activo = sfields.get("ACTIVO", False)
    capacidad = sfields.get("CAPACIDAD_DISPONIBLE", 0)

    if estado_slot != "DISPONIBLE":
        errores.append(f"Slot no disponible (estado: {estado_slot}).")
    if disponible_auto != "SI":
        errores.append("Slot marcado como no disponible automaticamente.")
    if not permite_web:
        errores.append("Slot no permite reserva web.")
    if not activo:
        errores.append("Slot inactivo.")
    if capacidad is not None and capacidad <= 0:
        errores.append("Slot sin capacidad disponible.")

    # 3. Revalidar SERVICIOS_WEB
    try:
        sw_record = at.get_record("SERVICIOS_WEB", servicio_web_id)
        sw_fields = sw_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Servicio web {servicio_web_id} no encontrado.")

    if not sw_fields.get("RESERVA_ONLINE_HABILITADA", False):
        errores.append("El servicio no esta habilitado para reserva online.")
    if not sw_fields.get("ACTIVO_EN_WEB", False):
        errores.append("El servicio no esta activo en web.")

    svc_name = sw_fields.get("NOMBRE_PUBLICO_SERVICIO", "Sin nombre")
    svc_linked = sw_fields.get("SERVICIO")
    svc_canonico_id = svc_linked[0] if isinstance(svc_linked, list) and svc_linked else str(svc_linked) if svc_linked else ""
    precio = sw_fields.get("PRECIO_WEB")

    # 4. Revalidar SUCURSALES
    try:
        suc_record = at.get_record("SUCURSALES", sucursal_id)
        suc_fields = suc_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Sucursal {sucursal_id} no encontrada.")

    if not suc_fields.get("ACTIVO", False):
        errores.append("La sucursal no esta activa.")
    suc_name = suc_fields.get("NOMBRE_SUCURSAL", "Sin nombre")

    # 5. Revalidar conflicto de slot (sin CITAS activas)
    try:
        formula = (
            f"AND({{AGENDA_SLOT}}='{slot_id}', "
            "OR({ESTADO_CITA}='CONFIRMADA', {ESTADO_CITA}='PENDIENTE_CONFIRMACION', "
            "{ESTADO_CITA}='EN_CURSO'))"
        )
        existing = at.list_records("CITAS", filter_formula=formula, by_name=True, page_size=1)
    except Exception:
        existing = []
    if existing:
        errores.append("El slot ya tiene una cita activa (CONFIRMADA/PENDIENTE/EN_CURSO).")

    # 6. Si hay errores, rechazar
    if errores:
        return {
            "confirmado": False,
            "errores": errores,
            "mensaje": "No se puede confirmar: " + "; ".join(errores),
        }

    # 7. Extraer datos del slot para CITAS
    fecha_cita = sfields.get("FECHA_SLOT", "")
    hora_inicio = sfields.get("HORA_INICIO", "")
    hora_fin = sfields.get("HORA_FIN", "")
    duracion = sfields.get("DURACION_MINUTOS", "")
    profesional_ids = sfields.get("PROFESIONAL", [])

    # 8. Obtener nombre del cliente para NOMBRE_CITA
    try:
        cli_record = at.get_record("CLIENTES", cliente_id)
        nombre_cliente = cli_record.get("fields", {}).get("NOMBRE_CLIENTE", "CLIENTE")
    except Exception:
        nombre_cliente = "CLIENTE"

    # 9. Crear CITA
    nombre_cita = f"CITA_{nombre_cliente[:20].upper().replace(' ','_')}_{svc_name[:20].upper().replace(' ','_')}_{fecha_cita}_{hora_inicio.replace(':','')}"
    cita_fields = {
        "NOMBRE_CITA": nombre_cita,
        "CLIENTE": [cliente_id],
        "SERVICIO": [svc_canonico_id] if svc_canonico_id else [],
        "AGENDA_SLOT": [slot_id],
        "PROFESIONAL": profesional_ids if profesional_ids else [],
        "FECHA_CITA": fecha_cita,
        "HORA_INICIO": hora_inicio,
        "HORA_FIN": hora_fin,
        "DURACION_MINUTOS": duracion,
        "CANAL_ORIGEN": "WEB",
        "ESTADO_CITA": "CONFIRMADA",
        "CONFIRMADA_CLIENTE": True,
        "FECHA_CONFIRMACION": hoy,
        "SUCURSAL_ATENCION": [sucursal_id],
        "ACTIVO": True,
    }
    try:
        cita_creada = at.create_record("CITAS", cita_fields)
        cita_id = cita_creada["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear CITA: {str(e)}")

    # 10. Marcar AGENDA_SLOT como RESERVADO
    capacidad_ocupada_actual = sfields.get("CAPACIDAD_OCUPADA", 0) or 0
    slot_update = {
        "ESTADO_SLOT": "RESERVADO",
        "TIPO_SLOT": "RESERVA_WEB_PENDIENTE",
        "CAPACIDAD_OCUPADA": capacidad_ocupada_actual + 1,
        "CITAS": [cita_id],
    }
    try:
        at.patch_record("AGENDA_SLOTS", slot_id, slot_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar AGENDA_SLOT: {str(e)}")

    # 11. Responder
    return {
        "confirmado": True,
        "mensaje": "Turno confirmado exitosamente.",
        "cita": {
            "id": cita_id,
            "nombre_cita": nombre_cita,
            "fecha_cita": fecha_cita,
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "estado_cita": "CONFIRMADA",
        },
        "slot": {
            "id": slot_id,
            "estado_anterior": "DISPONIBLE",
            "estado_nuevo": "RESERVADO",
        },
        "servicio": {
            "id": servicio_web_id,
            "nombre": svc_name,
            "precio_web": precio,
        },
        "sucursal": {
            "id": sucursal_id,
            "nombre": suc_name,
        },
    }