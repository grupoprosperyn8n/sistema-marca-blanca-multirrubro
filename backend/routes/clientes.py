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
        # Obtener el nombre del cliente para filtrar (by_name=True usa nombres)
        cliente_record = at.get_record("CLIENTES", cliente_id)
        cliente_nombre = cliente_record.get("fields", {}).get("NOMBRE_CLIENTE", "")
        # by_name=True: linked fields retornan nombres, no IDs
        records = at.list_records("CITAS", by_name=True)
        records = [
            r for r in records
            if cliente_nombre in (r.get("fields", {}).get("CLIENTE") or [])
        ]
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

# ---- FASE_3C3: CANCELAR Y REPROGRAMAR ----

@router.post("/clientes/citas/{cita_id}/cancelar")
async def cancelar_cita(cita_id: str, payload: dict = {}, user: dict = Depends(get_current_user)):
    """Cancela una CITA propia del cliente. No borra datos.
    
    FASE_3C3: Cancela CITA y libera AGENDA_SLOT. No usa RESERVAS.
    Payload opcional: {motivo: str}
    """
    import logging
    logger = logging.getLogger("cancelar_cita")
    
    # 1. Auth: solo CLIENTE
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden cancelar turnos.")
    
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")
    
    at = AirtableClient()
    hoy = date.today().isoformat()
    
    # 2. Obtener CITA
    try:
        cita_record = at.get_record("CITAS", cita_id)
        cita_fields = cita_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Cita {cita_id} no encontrada.")
    
    # 3. Verificar pertenencia al CLIENTE
    cliente_en_cita = cita_fields.get("CLIENTE", [])
    if isinstance(cliente_en_cita, str):
        cliente_en_cita = [cliente_en_cita]
    if cliente_id not in cliente_en_cita:
        raise HTTPException(status_code=403, detail="No podes cancelar una cita que no te pertenece.")
    
    # 4. Verificar que no este ya cancelada/completada
    estado_actual = (cita_fields.get("ESTADO_CITA") or "").upper()
    if estado_actual in ("CANCELADA", "COMPLETADA", "NO_ASISTIO"):
        raise HTTPException(status_code=409, detail=f"La cita ya esta en estado {estado_actual}, no se puede cancelar.")
    
    # 5. Obtener AGENDA_SLOT vinculado
    slot_link = cita_fields.get("AGENDA_SLOT", [])
    if isinstance(slot_link, str):
        slot_link = [slot_link]
    slot_id = slot_link[0] if slot_link else None
    
    # 6. Cancelar CITA
    motivo = (payload.get("motivo") or "Cancelado por cliente desde portal").strip()
    cita_update = {
        "ESTADO_CITA": "CANCELADA",
        "MOTIVO_CANCELACION": motivo,
        "FECHA_CANCELACION": hoy,
        "CANCELADO_POR": "CLIENTE",
    }
    try:
        at.patch_record("CITAS", cita_id, cita_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cancelar CITA: {str(e)}")
    
    # 7. Liberar AGENDA_SLOT si existe
    slot_liberado = False
    if slot_id:
        try:
            slot_record = at.get_record("AGENDA_SLOTS", slot_id)
            sfields = slot_record.get("fields", {})
            cap_ocupada = sfields.get("CAPACIDAD_OCUPADA", 0) or 0
            nueva_cap = max(0, cap_ocupada - 1)
            slot_update = {
                "ESTADO_SLOT": "DISPONIBLE",
                "CAPACIDAD_OCUPADA": nueva_cap,
            }
            at.patch_record("AGENDA_SLOTS", slot_id, slot_update)
            slot_liberado = True
        except Exception as e:
            logger.warning(f"Slot {slot_id} no pudo liberarse: {e}")
            # No fallar — la cancelacion de la cita ya fue exitosa
    
    return {
        "cancelado": True,
        "mensaje": "Turno cancelado exitosamente.",
        "cita": {
            "id": cita_id,
            "estado_anterior": estado_actual,
            "estado_nuevo": "CANCELADA",
            "fecha_cancelacion": hoy,
        },
        "slot": {
            "id": slot_id,
            "liberado": slot_liberado,
        } if slot_id else None,
    }


@router.post("/clientes/citas/{cita_id}/reprogramar")
async def reprogramar_cita(cita_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Reprograma una CITA propia a un nuevo AGENDA_SLOT. No borra datos.
    
    FASE_3C3: Mueve reserva del slot actual al nuevo. No usa RESERVAS.
    Payload: {nuevo_slot_id: str}
    """
    import logging
    logger = logging.getLogger("reprogramar_cita")
    
    # 1. Auth: solo CLIENTE
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden reprogramar turnos.")
    
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")
    
    nuevo_slot_id = (payload.get("nuevo_slot_id") or "").strip()
    if not nuevo_slot_id:
        raise HTTPException(status_code=400, detail="Falta nuevo_slot_id.")
    
    at = AirtableClient()
    hoy = date.today().isoformat()
    
    # 2. Obtener CITA actual
    try:
        cita_record = at.get_record("CITAS", cita_id)
        cita_fields = cita_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Cita {cita_id} no encontrada.")
    
    # 3. Verificar pertenencia al CLIENTE
    cliente_en_cita = cita_fields.get("CLIENTE", [])
    if isinstance(cliente_en_cita, str):
        cliente_en_cita = [cliente_en_cita]
    if cliente_id not in cliente_en_cita:
        raise HTTPException(status_code=403, detail="No podes reprogramar una cita que no te pertenece.")
    
    # 4. Verificar que no este cancelada/completada
    estado_actual = (cita_fields.get("ESTADO_CITA") or "").upper()
    if estado_actual in ("CANCELADA", "COMPLETADA", "NO_ASISTIO"):
        raise HTTPException(status_code=409, detail=f"La cita esta en estado {estado_actual}, no se puede reprogramar.")
    
    # 5. Obtener slot actual
    slot_actual_link = cita_fields.get("AGENDA_SLOT", [])
    if isinstance(slot_actual_link, str):
        slot_actual_link = [slot_actual_link]
    slot_viejo_id = slot_actual_link[0] if slot_actual_link else None
    
    # 6. Validar que el nuevo slot sea diferente
    if nuevo_slot_id == slot_viejo_id:
        raise HTTPException(status_code=400, detail="El nuevo slot es el mismo que el actual.")
    
    # 7. Obtener y validar NUEVO slot
    try:
        nuevo_slot = at.get_record("AGENDA_SLOTS", nuevo_slot_id)
        ns_fields = nuevo_slot.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Nuevo slot {nuevo_slot_id} no encontrado.")
    
    estado_ns = (ns_fields.get("ESTADO_SLOT") or "").upper()
    permite_web = ns_fields.get("PERMITE_RESERVA_WEB", False)
    activo_ns = ns_fields.get("ACTIVO", False)
    cap_ns = ns_fields.get("CAPACIDAD_DISPONIBLE", 0)
    
    if estado_ns != "DISPONIBLE":
        raise HTTPException(status_code=409, detail=f"El nuevo slot no esta disponible (estado: {estado_ns}).")
    if not permite_web:
        raise HTTPException(status_code=409, detail="El nuevo slot no permite reserva web.")
    if not activo_ns:
        raise HTTPException(status_code=409, detail="El nuevo slot esta inactivo.")
    if cap_ns is not None and cap_ns <= 0:
        raise HTTPException(status_code=409, detail="El nuevo slot no tiene capacidad disponible.")
    
    # 8. Verificar que el nuevo slot no tenga ya una cita activa
    try:
        formula = (
            f"AND({{AGENDA_SLOT}}='{nuevo_slot_id}', "
            "OR({ESTADO_CITA}='CONFIRMADA', {ESTADO_CITA}='PENDIENTE_CONFIRMACION', "
            "{ESTADO_CITA}='EN_CURSO'))"
        )
        existing = at.list_records("CITAS", filter_formula=formula, by_name=True, page_size=1)
    except Exception:
        existing = []
    if existing:
        raise HTTPException(status_code=409, detail="El nuevo slot ya tiene una cita activa.")
    
    # 9. Extraer datos del nuevo slot para actualizar CITA
    nueva_fecha = ns_fields.get("FECHA_SLOT", cita_fields.get("FECHA_CITA", ""))
    nueva_hora_ini = ns_fields.get("HORA_INICIO", cita_fields.get("HORA_INICIO", ""))
    nueva_hora_fin = ns_fields.get("HORA_FIN", cita_fields.get("HORA_FIN", ""))
    nueva_duracion = ns_fields.get("DURACION_MINUTOS", cita_fields.get("DURACION_MINUTOS", ""))
    
    # 10. Actualizar CITA con nuevo slot
    cita_update = {
        "AGENDA_SLOT": [nuevo_slot_id],
        "FECHA_CITA": nueva_fecha,
        "HORA_INICIO": nueva_hora_ini,
        "HORA_FIN": nueva_hora_fin,
        "DURACION_MINUTOS": nueva_duracion,
        "ESTADO_CITA": "REPROGRAMADA",
    }
    try:
        at.patch_record("CITAS", cita_id, cita_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al reprogramar CITA: {str(e)}")
    
    # 11. Liberar slot VIEJO
    slot_viejo_liberado = False
    if slot_viejo_id:
        try:
            vs_record = at.get_record("AGENDA_SLOTS", slot_viejo_id)
            vs_fields = vs_record.get("fields", {})
            cap_vieja = vs_fields.get("CAPACIDAD_OCUPADA", 0) or 0
            nueva_cap_vieja = max(0, cap_vieja - 1)
            at.patch_record("AGENDA_SLOTS", slot_viejo_id, {
                "ESTADO_SLOT": "DISPONIBLE",
                "CAPACIDAD_OCUPADA": nueva_cap_vieja,
            })
            slot_viejo_liberado = True
        except Exception as e:
            logger.warning(f"Slot viejo {slot_viejo_id} no pudo liberarse: {e}")
    
    # 12. Marcar NUEVO slot como RESERVADO
    cap_nueva_ocupada = (ns_fields.get("CAPACIDAD_OCUPADA", 0) or 0) + 1
    try:
        at.patch_record("AGENDA_SLOTS", nuevo_slot_id, {
            "ESTADO_SLOT": "RESERVADO",
            "CAPACIDAD_OCUPADA": cap_nueva_ocupada,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al reservar nuevo slot: {str(e)}. CITA actualizada pero slot nuevo puede no estar marcado.")
    
    return {
        "reprogramado": True,
        "mensaje": "Turno reprogramado exitosamente.",
        "cita": {
            "id": cita_id,
            "slot_anterior": slot_viejo_id,
            "slot_nuevo": nuevo_slot_id,
            "fecha_nueva": nueva_fecha,
            "hora_nueva": nueva_hora_ini,
            "estado_anterior": estado_actual,
            "estado_nuevo": "REPROGRAMADA",
        },
        "slot_viejo": {
            "id": slot_viejo_id,
            "liberado": slot_viejo_liberado,
        } if slot_viejo_id else None,
        "slot_nuevo": {
            "id": nuevo_slot_id,
            "reservado": True,
        },
    }
