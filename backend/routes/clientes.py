"""
Rutas FastAPI para CLIENTES — /api/clientes
Fase 3B: perfil cliente autenticado + citas propias.
Fase 3C1: dry-run de reserva de turnos.
Fase 3C2: confirmacion real de cita (crea CITA + marca AGENDA_SLOT).
"""
import sys
from pathlib import Path
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, status

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_edit_field, can_module
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["clientes"])

_BACKOFFICE_CLIENTES_FIELDS = {
    "NOMBRE_CLIENTE",
    "EMAIL",
    "TELEFONO",
    "DOCUMENTO_IDENTIDAD",
    "FECHA_NACIMIENTO",
    "CALLE_Y_N°",
    "LOCALIDAD",
    "PROVINCIA/PAIS",
    "CODIGO POSTAL",
    "PREFERENCIAS_SERVICIOS",
    "ACEPTA_COMUNICACIONES",
    "ESTADO_COMERCIAL",
    "CALIFICACION",
    "FICHA_TECNICA",
    "ACTIVO",
}

_CAMPOS_EDITABLES_CLIENTE = {
    "NOMBRE_CLIENTE", "TELEFONO", "DOCUMENTO_IDENTIDAD",
    "CALLE_Y_N°", "LOCALIDAD", "PROVINCIA/PAIS", "CODIGO POSTAL", "CODIGO_POSTAL",
    "PREFERENCIAS_SERVICIOS", "ACEPTA_COMUNICACIONES", "FECHA_NACIMIENTO",
}

_ESTADOS_CITA_ACTIVA = {
    "CONFIRMADA",
    "PENDIENTE_CONFIRMACION",
    "EN_CURSO",
    "REPROGRAMADA",
}


def _as_list(value):
    """Normaliza valores simples/listas de Airtable a lista."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _as_id_list(value) -> list[str]:
    """Normaliza linked-record fields de Airtable a IDs string."""
    return [str(item).strip() for item in _as_list(value) if str(item).strip()]


def _record_links_to(fields: dict, field_name: str, record_id: str) -> bool:
    """True si un linked-record field contiene el record_id indicado."""
    return bool(record_id) and record_id in _as_id_list(fields.get(field_name))


def _has_active_cita_for_slot(
    at: AirtableClient,
    slot_id: str,
    exclude_cita_id: str | None = None,
) -> bool:
    """Busca CITAS activas vinculadas al AGENDA_SLOT indicado.

    Nota: Airtable REST devuelve linked records como IDs (`rec...`), no como
    nombres visibles. Por eso filtramos por ID real, no por display name.
    """
    if not slot_id:
        return False

    records = at.list_records(
        "CITAS",
        fields=["AGENDA_SLOT", "ESTADO_CITA"],
        by_name=True,
    )
    for record in records:
        if exclude_cita_id and record.get("id") == exclude_cita_id:
            continue
        fields = record.get("fields", {})
        estado = (fields.get("ESTADO_CITA") or "").upper()
        if estado in _ESTADOS_CITA_ACTIVA and _record_links_to(fields, "AGENDA_SLOT", slot_id):
            return True
    return False


def _rollback_payload(fields: dict, field_names: list[str]) -> dict:
    """Arma payload para restaurar campos; None limpia valores creados."""
    return {field_name: fields.get(field_name, None) for field_name in field_names}


def _require_clientes_action(user: dict, action: str):
    rol = user.get("rol") or ""
    if can_module(rol, "CLIENTES", action):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Sin permiso para {action} CLIENTES.",
    )


def _collect_clientes_patch(payload: dict, role_name: str, partial: bool = True) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    unknown = sorted(set(payload) - _BACKOFFICE_CLIENTES_FIELDS)
    if unknown:
        raise HTTPException(
            status_code=400,
            detail={"message": "Campos no permitidos para CLIENTES.", "fields": unknown},
        )

    patch = {}
    forbidden = []
    for field_name, value in payload.items():
        if not can_edit_field(role_name, "CLIENTES", field_name):
            forbidden.append(field_name)
            continue
        if isinstance(value, str):
            value = value.strip()
        if value == "":
            value = None
        patch[field_name] = value

    if forbidden:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Campos no editables para tu rol.", "fields": forbidden},
        )
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos editables.")
    if not partial and not str(patch.get("NOMBRE_CLIENTE") or "").strip():
        raise HTTPException(status_code=400, detail="NOMBRE_CLIENTE es obligatorio.")
    return patch


def _format_cliente_record(record: dict, extra: dict | None = None) -> dict:
    """Normaliza la respuesta backoffice; Airtable omite checkboxes false."""
    fields = dict(record.get("fields", {}))
    fields.setdefault("ACTIVO", False)
    data = {"id": record.get("id"), "createdTime": record.get("createdTime")}
    if extra:
        data.update(extra)
    data.update(fields)
    return data


def _first_link_id(value) -> str:
    ids = _as_id_list(value)
    return ids[0] if ids else ""


def _text(value, default="") -> str:
    return str(value or default).strip()


def _number(value, default=0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _time_to_minutes(raw) -> int | None:
    text = _text(raw)
    try:
        hour, minute = text.split(":")[:2]
        return int(hour) * 60 + int(minute)
    except Exception:
        return None


def _format_linked_name(table_name: str, fields: dict, fallback: str = "") -> str:
    if table_name == "CLIENTES":
        return _text(fields.get("NOMBRE_CLIENTE") or fields.get("EMAIL") or fallback)
    if table_name == "SERVICIOS":
        return _text(fields.get("NOMBRE_PUBLICO_SERVICIO") or fields.get("NOMBRE_SERVICIO") or fallback)
    if table_name == "SERVICIOS_WEB":
        return _text(fields.get("NOMBRE_PUBLICO_SERVICIO") or fields.get("NOMBRE_SERVICIO") or fallback)
    if table_name == "EMPLEADOS":
        return _text(
            fields.get("NOMBRE_EMPLEADO")
            or fields.get("NOMBRE_COMPLETO")
            or fields.get("NOMBRE")
            or fields.get("EMAIL")
            or fallback
        )
    if table_name == "SUCURSALES":
        return _text(fields.get("NOMBRE_SUCURSAL") or fields.get("NOMBRE") or fallback)
    if table_name == "AGENDA_SLOTS":
        return _text(fields.get("NOMBRE_SLOT") or fallback)
    return _text(fallback)


def _linked_fields(at: AirtableClient, table_name: str, record_id: str, cache: dict) -> dict:
    if not record_id:
        return {}
    if not str(record_id).startswith("rec"):
        return {"_display": str(record_id)}
    key = (table_name, record_id)
    if key not in cache:
        try:
            cache[key] = at.get_record(table_name, record_id).get("fields", {})
        except Exception:
            cache[key] = {}
    return cache[key]


def _linked_name(at: AirtableClient, table_name: str, value, cache: dict) -> str:
    record_id = _first_link_id(value)
    if not record_id:
        return ""
    fields = _linked_fields(at, table_name, record_id, cache)
    if fields.get("_display"):
        return fields["_display"]
    return _format_linked_name(table_name, fields, record_id)


def _format_cita_items_cliente(at: AirtableClient, item_ids: list[str], cache: dict) -> list[dict]:
    """DTO seguro de items de una cita compuesta para el portal cliente."""
    items = []
    for item_id in item_ids:
        item_fields = _linked_fields(at, "CITA_ITEMS", item_id, cache)
        if not item_fields:
            continue
        servicio_id = _first_link_id(item_fields.get("SERVICIO"))
        servicio_web_id = _first_link_id(item_fields.get("SERVICIO_WEB"))
        profesional_id = _first_link_id(item_fields.get("PROFESIONAL"))
        slot_id = _first_link_id(item_fields.get("AGENDA_SLOT"))
        slot_fields = _linked_fields(at, "AGENDA_SLOTS", slot_id, cache) if slot_id else {}
        service_name = (
            _linked_name(at, "SERVICIOS_WEB", item_fields.get("SERVICIO_WEB"), cache)
            or _linked_name(at, "SERVICIOS", item_fields.get("SERVICIO"), cache)
            or _text(item_fields.get("NOMBRE_ITEM_CITA"))
            or "Servicio"
        )
        items.append({
            "id": item_id,
            "orden": int(_number(item_fields.get("ORDEN_ITEM"), len(items) + 1)),
            "SERVICIO_ID": servicio_id,
            "SERVICIO_WEB_ID": servicio_web_id,
            "NOMBRE_SERVICIO": service_name,
            "PROFESIONAL_ID": profesional_id,
            "NOMBRE_PROFESIONAL": _linked_name(at, "EMPLEADOS", item_fields.get("PROFESIONAL"), cache),
            "AGENDA_SLOT_ID": slot_id,
            "FECHA": slot_fields.get("FECHA_SLOT") or "",
            "HORA_INICIO": slot_fields.get("HORA_INICIO") or "",
            "HORA_FIN": slot_fields.get("HORA_FIN") or "",
            "DURACION_MINUTOS": item_fields.get("DURACION_MINUTOS") or slot_fields.get("DURACION_MINUTOS") or "",
            "ESTADO_ITEM_CITA": item_fields.get("ESTADO_ITEM_CITA") or "",
            "PRECIO_REFERENCIA": item_fields.get("PRECIO_REFERENCIA") or 0,
        })
    return sorted(items, key=lambda item: item.get("orden") or 0)


def _format_cita_cliente(at: AirtableClient, record: dict, cache: dict) -> dict:
    fields = record.get("fields", {})
    campos_internos = {
        "OBSERVACIONES_INTERNAS", "DIAGNOSTICO_PREVIO", "REQUIERE_DIAGNOSTICO",
        "REQUIERE_CONSENTIMIENTO", "CONSENTIMIENTO_FIRMADO", "REQUIERE_PRUEBA_ALERGIA",
        "PRUEBA_ALERGIA_REALIZADA", "MOTIVO_CANCELACION", "FECHA_CANCELACION", "CANCELADO_POR",
    }
    safe_fields = {k: v for k, v in fields.items() if k not in campos_internos}

    servicio_id = _first_link_id(fields.get("SERVICIO"))
    profesional_id = _first_link_id(fields.get("PROFESIONAL"))
    sucursal_id = _first_link_id(fields.get("SUCURSAL_ATENCION"))
    slot_id = _first_link_id(fields.get("AGENDA_SLOT"))

    servicio_nombre = _linked_name(at, "SERVICIOS", fields.get("SERVICIO"), cache)
    profesional_nombre = _linked_name(at, "EMPLEADOS", fields.get("PROFESIONAL"), cache)
    sucursal_nombre = _linked_name(at, "SUCURSALES", fields.get("SUCURSAL_ATENCION"), cache)
    slot_fields = _linked_fields(at, "AGENDA_SLOTS", slot_id, cache) if slot_id else {}
    cita_items = _format_cita_items_cliente(at, _as_id_list(fields.get("CITA_ITEMS")), cache)
    service_names = [item["NOMBRE_SERVICIO"] for item in cita_items if item.get("NOMBRE_SERVICIO")]

    raw_title = _text(fields.get("NOMBRE_CITA"))
    visible_title = servicio_nombre or raw_title or "Turno"
    if len(service_names) > 1:
        visible_title = f"Turno con {len(service_names)} servicios"
        servicio_nombre = ", ".join(service_names)
    elif service_names:
        visible_title = f"Turno de {service_names[0]}"
        servicio_nombre = service_names[0]
    elif raw_title.upper().startswith("CITA_") and servicio_nombre:
        visible_title = f"Turno de {servicio_nombre}"

    return {
        "id": record["id"],
        "createdTime": record.get("createdTime"),
        **safe_fields,
        "TITULO_CITA": visible_title,
        "SERVICIO_ID": servicio_id,
        "PROFESIONAL_ID": profesional_id,
        "SUCURSAL_ID": sucursal_id,
        "AGENDA_SLOT_ID": slot_id,
        "NOMBRE_SERVICIO": servicio_nombre,
        "NOMBRE_PROFESIONAL": profesional_nombre,
        "NOMBRE_SUCURSAL": sucursal_nombre,
        "ESTADO_SLOT": slot_fields.get("ESTADO_SLOT") or "",
        "ITEMS_CITA": cita_items,
        "CANTIDAD_SERVICIOS": len(cita_items) or (1 if servicio_nombre else 0),
        "NOMBRE_SERVICIOS": service_names,
        "SERVICIO_WEB_ID": cita_items[0]["SERVICIO_WEB_ID"] if cita_items else "",
        "ES_MULTISERVICIO": len(cita_items) > 1,
    }


def _format_pago_cliente(record: dict) -> dict:
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "venta_id": _first_link_id(fields.get("VENTA")),
        "fecha": fields.get("FECHA_PAGO") or fields.get("FECHA_COBRO") or fields.get("FECHA_OPERACION") or "",
        "metodo": fields.get("METODO_PAGO") or fields.get("METODO_COBRO") or "",
        "estado": fields.get("ESTADO_PAGO") or fields.get("ESTADO_COBRO") or "",
        "monto": _number(fields.get("MONTO_PAGO") or fields.get("MONTO_COBRO") or fields.get("MONTO"), 0),
        "moneda": fields.get("MONEDA") or "ARS",
    }


def _format_venta_cliente(record: dict, pagos: list[dict]) -> dict:
    fields = record.get("fields", {})
    venta_id = record.get("id")
    venta_pagos = [p for p in pagos if p.get("venta_id") == venta_id]
    return {
        "id": venta_id,
        "fecha": fields.get("FECHA_VENTA") or fields.get("FECHA_OPERACION") or fields.get("FECHA_CREACION") or "",
        "numero": fields.get("NUMERO_VENTA") or fields.get("CODIGO_VENTA") or "",
        "canal": fields.get("CANAL_VENTA") or "",
        "origen": fields.get("ORIGEN_VENTA") or "",
        "tipo": fields.get("TIPO_VENTA") or "",
        "estado": fields.get("ESTADO_VENTA") or "",
        "total": _number(fields.get("TOTAL_VENTA") or fields.get("TOTAL") or fields.get("IMPORTE_TOTAL"), 0),
        "saldo": _number(fields.get("SALDO_PENDIENTE") or fields.get("MONTO_PENDIENTE"), 0),
        "moneda": fields.get("MONEDA") or "ARS",
        "items_count": len(_as_list(fields.get("ITEMS_VENTA"))),
        "pagos": venta_pagos,
        "monto_pagado": sum(_number(p.get("monto"), 0) for p in venta_pagos),
    }


@router.get("/clientes")
async def listar_clientes():
    """Lista todos los clientes (uso administrativo)."""
    try:
        client = AirtableClient()
        records = client.list_records("CLIENTES", by_name=True)
        items = []
        for r in records:
            items.append(_format_cliente_record(r))
        return {"total": len(items), "clientes": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/backoffice/clientes")
async def crear_cliente_backoffice(payload: dict, user: dict = Depends(get_current_user)):
    """Crea un CLIENTE desde backoffice con RBAC y campos seguros."""
    _require_clientes_action(user, "create")
    fields = _collect_clientes_patch(payload, user.get("rol") or "", partial=False)
    fields.setdefault("ACTIVO", True)
    try:
        at = AirtableClient()
        record = at.create_record("CLIENTES", fields)
        return _format_cliente_record(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear cliente: {str(e)}")


@router.patch("/backoffice/clientes/{cliente_id}")
async def actualizar_cliente_backoffice(cliente_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza campos permitidos de CLIENTES desde backoffice."""
    _require_clientes_action(user, "edit")
    fields = _collect_clientes_patch(payload, user.get("rol") or "", partial=True)
    try:
        at = AirtableClient()
        at.get_record("CLIENTES", cliente_id)
        at.patch_record("CLIENTES", cliente_id, fields)
        updated = at.get_record("CLIENTES", cliente_id)
        return _format_cliente_record(updated, {"actualizados": list(fields.keys())})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar cliente: {str(e)}")


@router.delete("/backoffice/clientes/{cliente_id}")
async def baja_logica_cliente_backoffice(cliente_id: str, user: dict = Depends(get_current_user)):
    """Baja lógica: nunca borra físico; marca ACTIVO=false."""
    _require_clientes_action(user, "delete")
    try:
        at = AirtableClient()
        at.get_record("CLIENTES", cliente_id)
        at.patch_record("CLIENTES", cliente_id, {"ACTIVO": False})
        updated = at.get_record("CLIENTES", cliente_id)
        return _format_cliente_record(
            updated,
            {"deleted": False, "baja_logica": True, "actualizados": ["ACTIVO"]},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al dar de baja cliente: {str(e)}")


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
        # Airtable REST retorna linked records como IDs (`rec...`), no nombres.
        records = at.list_records("CITAS", by_name=True)
        records = [
            r for r in records
            if _record_links_to(r.get("fields", {}), "CLIENTE", cliente_id)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")
    citas = []
    cache = {}
    for r in records:
        citas.append(_format_cita_cliente(at, r, cache))
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


@router.get("/clientes/me/compras")
async def get_my_compras(user: dict = Depends(get_current_user)):
    """Historial read-only de compras y pagos del CLIENTE autenticado.

    No crea ventas, pagos, cobros, checkout ni caja/POS. Solo resume registros
    existentes ya vinculados al cliente.
    """
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    try:
        at = AirtableClient()
        ventas_records = [
            record for record in at.list_records("VENTAS", by_name=True)
            if _record_links_to(record.get("fields", {}), "CLIENTE", cliente_id)
        ]
        venta_ids = {record.get("id") for record in ventas_records}
        try:
            pagos_records = [
                record for record in at.list_records("PAGOS_COBROS", by_name=True)
                if venta_ids.intersection(set(_as_id_list(record.get("fields", {}).get("VENTA"))))
            ]
        except Exception:
            pagos_records = []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial de compras: {str(e)}")

    pagos = [_format_pago_cliente(record) for record in pagos_records]
    ventas = [_format_venta_cliente(record, pagos) for record in ventas_records]
    ventas.sort(key=lambda item: item.get("fecha") or "", reverse=True)
    pagos.sort(key=lambda item: item.get("fecha") or "", reverse=True)

    return {
        "total_compras": len(ventas),
        "total_pagos": len(pagos),
        "compras": ventas,
        "pagos": pagos,
        "read_only": True,
        "checkout_enabled": False,
        "online_payments_enabled": False,
        "physical_pos_enabled": False,
        "message": "Historial de compras/pagos en solo lectura. No se crean pagos ni ventas desde el portal.",
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
        slot_ocupado = _has_active_cita_for_slot(at, slot_id)
    except Exception as e:
        errores.append(f"No se pudo validar conflicto de agenda: {str(e)}")
        slot_ocupado = False
    if slot_ocupado:
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
        slot_ocupado = _has_active_cita_for_slot(at, slot_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al validar conflicto de slot: {str(e)}")
    if slot_ocupado:
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


def _normalize_multi_items(payload: dict) -> list[dict]:
    raw_items = payload.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise HTTPException(status_code=400, detail="items debe ser una lista con al menos un servicio.")
    if len(raw_items) > 6:
        raise HTTPException(status_code=400, detail="Máximo 6 servicios por turno compuesto.")

    items = []
    seen_slots = set()
    for index, raw in enumerate(raw_items, start=1):
        if not isinstance(raw, dict):
            raise HTTPException(status_code=400, detail=f"Item {index} inválido.")
        raw_slot_ids = raw.get("slot_ids")
        if isinstance(raw_slot_ids, list):
            slot_ids = [_text(slot_id) for slot_id in raw_slot_ids if _text(slot_id)]
        else:
            slot_ids = [_text(raw.get("slot_id"))]
        slot_ids = [slot_id for slot_id in slot_ids if slot_id]
        servicio_web_id = _text(raw.get("servicio_web_id"))
        profesional_id = _text(raw.get("profesional_id"))
        if not slot_ids or not servicio_web_id:
            raise HTTPException(status_code=400, detail=f"Item {index}: slot_id/slot_ids y servicio_web_id son requeridos.")
        repeated = [slot_id for slot_id in slot_ids if slot_id in seen_slots]
        if repeated:
            raise HTTPException(status_code=409, detail=f"El slot {repeated[0]} está repetido en el turno.")
        seen_slots.update(slot_ids)
        items.append({
            "slot_id": slot_ids[0],
            "slot_ids": slot_ids,
            "servicio_web_id": servicio_web_id,
            "profesional_id": profesional_id,
            "orden": int(raw.get("orden") or index),
            "observaciones": _text(raw.get("observaciones")),
        })
    return items


def _validate_multi_booking(at: AirtableClient, payload: dict, cliente_id: str) -> dict:
    sucursal_id = _text(payload.get("sucursal_id"))
    if not sucursal_id:
        raise HTTPException(status_code=400, detail="sucursal_id es requerido.")

    try:
        suc_record = at.get_record("SUCURSALES", sucursal_id)
        suc_fields = suc_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Sucursal {sucursal_id} no encontrada.")

    errores = []
    if not suc_fields.get("ACTIVO", False):
        errores.append("La sucursal no esta activa.")

    validated_items = []
    fecha_turno = ""
    for item in _normalize_multi_items(payload):
        slot_ids = item["slot_ids"]
        servicio_web_id = item["servicio_web_id"]
        item_errors = []
        slot_fields_list = []
        slot_profesional_ids_base: list[str] | None = None
        fecha_slot = ""
        starts = []
        ends = []
        reserved_duration = 0

        for slot_id in slot_ids:
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
            slot_sucursal_ids = _as_id_list(sfields.get("SUCURSAL"))
            slot_profesional_ids = _as_id_list(sfields.get("PROFESIONAL"))
            requested_profesional = item.get("profesional_id")

            if estado_slot != "DISPONIBLE":
                item_errors.append(f"Slot {slot_id} no disponible (estado: {estado_slot}).")
            if disponible_auto != "SI":
                item_errors.append(f"Slot {slot_id} marcado como no disponible automaticamente.")
            if not permite_web:
                item_errors.append(f"Slot {slot_id} no permite reserva web.")
            if not activo:
                item_errors.append(f"Slot {slot_id} inactivo.")
            if capacidad is not None and capacidad <= 0:
                item_errors.append(f"Slot {slot_id} sin capacidad disponible.")
            if sucursal_id not in slot_sucursal_ids:
                item_errors.append(f"El slot {slot_id} no pertenece a la sucursal elegida.")
            if requested_profesional and requested_profesional not in slot_profesional_ids:
                item_errors.append(f"El profesional elegido no coincide con el slot {slot_id}.")
            if _has_active_cita_for_slot(at, slot_id):
                item_errors.append(f"El slot {slot_id} ya tiene una cita activa.")

            if slot_profesional_ids_base is None:
                slot_profesional_ids_base = slot_profesional_ids
            elif set(slot_profesional_ids_base) != set(slot_profesional_ids):
                item_errors.append("Los slots agrupados deben pertenecer al mismo profesional.")

            current_fecha = sfields.get("FECHA_SLOT", "")
            if not fecha_slot:
                fecha_slot = current_fecha
            elif current_fecha != fecha_slot:
                item_errors.append("Los slots agrupados deben estar en la misma fecha.")

            start_min = _time_to_minutes(sfields.get("HORA_INICIO"))
            end_min = _time_to_minutes(sfields.get("HORA_FIN"))
            duration = int(_number(sfields.get("DURACION_MINUTOS"), 0))
            if start_min is not None and end_min is None and duration:
                end_min = start_min + duration
            if start_min is None or end_min is None or end_min <= start_min:
                item_errors.append(f"Slot {slot_id} tiene horario invalido.")
            else:
                starts.append(start_min)
                ends.append(end_min)
                reserved_duration += end_min - start_min
            slot_fields_list.append(sfields)

        if len(slot_fields_list) > 1:
            ranges = sorted(zip(starts, ends))
            for prev, current in zip(ranges, ranges[1:]):
                if current[0] != prev[1]:
                    item_errors.append("Los slots agrupados deben ser consecutivos, sin huecos ni superposición.")
                    break

        try:
            sw_record = at.get_record("SERVICIOS_WEB", servicio_web_id)
            sw_fields = sw_record.get("fields", {})
        except Exception:
            raise HTTPException(status_code=404, detail=f"Servicio web {servicio_web_id} no encontrado.")

        if not sw_fields.get("RESERVA_ONLINE_HABILITADA", False):
            item_errors.append("El servicio no esta habilitado para reserva online.")
        if not sw_fields.get("ACTIVO_EN_WEB", False):
            item_errors.append("El servicio no esta activo en web.")

        svc_linked = sw_fields.get("SERVICIO")
        svc_canonico_id = svc_linked[0] if isinstance(svc_linked, list) and svc_linked else str(svc_linked) if svc_linked else ""
        service_duration = int(_number(sw_fields.get("DURACION_MINUTOS_WEB") or sw_fields.get("DURACION_MINUTOS"), 0))
        if not service_duration and svc_canonico_id:
            try:
                svc_fields = at.get_record("SERVICIOS", svc_canonico_id).get("fields", {})
                service_duration = int(_number(svc_fields.get("DURACION_MINUTOS"), 0))
            except Exception:
                service_duration = 0
        if service_duration and reserved_duration < service_duration:
            item_errors.append("Los slots seleccionados no cubren la duracion del servicio.")
        if not fecha_turno:
            fecha_turno = fecha_slot
        elif fecha_slot != fecha_turno:
            item_errors.append("Todos los servicios del turno compuesto deben estar en la misma fecha.")

        if item_errors:
            errores.append({"slot_ids": slot_ids, "servicio_web_id": servicio_web_id, "errores": item_errors})

        validated_items.append({
            **item,
            "slot_fields": slot_fields_list[0] if slot_fields_list else {},
            "slot_fields_list": slot_fields_list,
            "hora_inicio": f"{min(starts) // 60:02d}:{min(starts) % 60:02d}" if starts else "",
            "hora_fin": f"{max(ends) // 60:02d}:{max(ends) % 60:02d}" if ends else "",
            "duracion_servicio": service_duration,
            "duracion_reservada": reserved_duration,
            "service_web_fields": sw_fields,
            "servicio_canonico_id": svc_canonico_id,
            "profesional_ids": slot_profesional_ids_base or [],
        })

    return {
        "cliente_id": cliente_id,
        "sucursal_id": sucursal_id,
        "sucursal_nombre": suc_fields.get("NOMBRE_SUCURSAL", "Sin nombre"),
        "items": validated_items,
        "errores": errores,
        "disponible": not errores,
    }


@router.post("/clientes/citas/dry-run-multiple")
async def dry_run_reserva_multiple(payload: dict, user: dict = Depends(get_current_user)):
    """Valida un turno compuesto con varios servicios/profesionales sin escribir."""
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden reservar turnos.")
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    at = AirtableClient()
    result = _validate_multi_booking(at, payload, cliente_id)
    return {
        "dry_run": True,
        "multi_servicio": True,
        "disponible": result["disponible"],
        "errores": result["errores"] or None,
        "items": [
            {
                "orden": item["orden"],
                "slot_id": item["slot_id"],
                "slot_ids": item["slot_ids"],
                "servicio_web_id": item["servicio_web_id"],
                "nombre_servicio": item["service_web_fields"].get("NOMBRE_PUBLICO_SERVICIO") or item["service_web_fields"].get("NOMBRE_SERVICIO"),
                "profesional_id": (item["profesional_ids"] or [None])[0],
                "fecha": item["slot_fields"].get("FECHA_SLOT"),
                "hora_inicio": item["hora_inicio"],
                "hora_fin": item["hora_fin"],
            }
            for item in result["items"]
        ],
        "mensaje": "Turno compuesto disponible." if result["disponible"] else "No se puede reservar el turno compuesto.",
        "nota": "Ningun registro fue creado ni modificado. Esto es un dry-run.",
    }


@router.post("/clientes/citas/confirmar-multiple")
async def confirmar_reserva_multiple(payload: dict, user: dict = Depends(get_current_user)):
    """Confirma un turno con varios servicios. No usa RESERVAS ni borra datos."""
    rol = (user.get("rol") or "").upper()
    if rol != "CLIENTE":
        raise HTTPException(status_code=403, detail="Solo clientes pueden confirmar turnos.")
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    at = AirtableClient()
    result = _validate_multi_booking(at, payload, cliente_id)
    if not result["disponible"]:
        return {
            "confirmado": False,
            "multi_servicio": True,
            "errores": result["errores"],
            "mensaje": "No se puede confirmar el turno compuesto.",
        }

    items = sorted(result["items"], key=lambda item: item["orden"])
    first = items[0]
    hoy = date.today().isoformat()
    fecha_cita = first["slot_fields"].get("FECHA_SLOT", "")
    hora_inicio = min(_text(item["hora_inicio"]) for item in items)
    hora_fin = max(_text(item["hora_fin"]) for item in items)
    duracion_total = sum(_number(item.get("duracion_servicio") or item.get("duracion_reservada"), 0) for item in items)
    slot_ids = []
    for item in items:
        for slot_id in item["slot_ids"]:
            if slot_id not in slot_ids:
                slot_ids.append(slot_id)
    servicio_ids = [item["servicio_canonico_id"] for item in items if item["servicio_canonico_id"]]
    profesional_ids = []
    for item in items:
        for profesional_id in item["profesional_ids"]:
            if profesional_id and profesional_id not in profesional_ids:
                profesional_ids.append(profesional_id)

    try:
        cli_record = at.get_record("CLIENTES", cliente_id)
        nombre_cliente = cli_record.get("fields", {}).get("NOMBRE_CLIENTE", "CLIENTE")
    except Exception:
        nombre_cliente = "CLIENTE"

    nombre_cita = f"CITA_MULTI_{nombre_cliente[:18].upper().replace(' ','_')}_{fecha_cita}_{hora_inicio.replace(':','')}"
    cita_fields = {
        "NOMBRE_CITA": nombre_cita,
        "CLIENTE": [cliente_id],
        "SERVICIO": servicio_ids[:1],
        "AGENDA_SLOT": slot_ids,
        "PROFESIONAL": profesional_ids,
        "FECHA_CITA": fecha_cita,
        "HORA_INICIO": hora_inicio,
        "HORA_FIN": hora_fin,
        "DURACION_MINUTOS": duracion_total,
        "CANAL_ORIGEN": "WEB",
        "ESTADO_CITA": "CONFIRMADA",
        "CONFIRMADA_CLIENTE": True,
        "FECHA_CONFIRMACION": hoy,
        "SUCURSAL_ATENCION": [result["sucursal_id"]],
        "ACTIVO": True,
    }

    try:
        cita_creada = at.create_record("CITAS", cita_fields)
        cita_id = cita_creada["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear CITA compuesta: {str(e)}")

    created_items = []
    reserved_slots = []
    try:
        for item in items:
            service_name = item["service_web_fields"].get("NOMBRE_PUBLICO_SERVICIO") or item["service_web_fields"].get("NOMBRE_SERVICIO") or "Servicio"
            item_fields = {
                "NOMBRE_ITEM_CITA": f"{nombre_cita}_{item['orden']}_{service_name[:24]}",
                "CITA": [cita_id],
                "SERVICIO": [item["servicio_canonico_id"]] if item["servicio_canonico_id"] else [],
                "SERVICIO_WEB": [item["servicio_web_id"]],
                "PROFESIONAL": item["profesional_ids"][:1],
                "AGENDA_SLOT": item["slot_ids"],
                "ORDEN_ITEM": item["orden"],
                "DURACION_MINUTOS": _number(item.get("duracion_servicio") or item.get("duracion_reservada"), 0),
                "PRECIO_REFERENCIA": _number(item["service_web_fields"].get("PRECIO_WEB"), 0),
                "ESTADO_ITEM_CITA": "CONFIRMADO",
                "OBSERVACIONES_ITEM": item.get("observaciones") or None,
                "ACTIVO": True,
            }
            created = at.create_record("CITA_ITEMS", item_fields)
            created_items.append(created.get("id"))

            for slot_id, sfields in zip(item["slot_ids"], item["slot_fields_list"]):
                at.patch_record("AGENDA_SLOTS", slot_id, {
                    "ESTADO_SLOT": "RESERVADO",
                    "TIPO_SLOT": "RESERVA_WEB_PENDIENTE",
                    "CAPACIDAD_OCUPADA": (sfields.get("CAPACIDAD_OCUPADA", 0) or 0) + 1,
                    "CITAS": [cita_id],
                })
                reserved_slots.append(slot_id)
    except Exception as e:
        try:
            at.patch_record("CITAS", cita_id, {
                "ESTADO_CITA": "CANCELADA",
                "ACTIVO": False,
                "MOTIVO_CANCELACION": "Rollback por error al confirmar turno compuesto.",
                "FECHA_CANCELACION": hoy,
            })
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Error al confirmar items/slots del turno compuesto: {str(e)}")

    return {
        "confirmado": True,
        "multi_servicio": True,
        "mensaje": "Turno compuesto confirmado exitosamente.",
        "cita": {
            "id": cita_id,
            "nombre_cita": nombre_cita,
            "fecha_cita": fecha_cita,
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "estado_cita": "CONFIRMADA",
            "cantidad_servicios": len(items),
        },
        "items": created_items,
        "slots": reserved_slots,
        "sucursal": {"id": result["sucursal_id"], "nombre": result["sucursal_nombre"]},
    }

# ---- FASE_3C3: CANCELAR Y REPROGRAMAR ----

@router.post("/clientes/citas/{cita_id}/cancelar")
async def cancelar_cita(cita_id: str, payload: dict | None = None, user: dict = Depends(get_current_user)):
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
    if not _record_links_to(cita_fields, "CLIENTE", cliente_id):
        raise HTTPException(status_code=403, detail="No podes cancelar una cita que no te pertenece.")

    # 4. Verificar que no este ya cancelada/completada
    estado_actual = (cita_fields.get("ESTADO_CITA") or "").upper()
    if estado_actual in ("CANCELADA", "COMPLETADA", "NO_ASISTIO"):
        raise HTTPException(status_code=409, detail=f"La cita ya esta en estado {estado_actual}, no se puede cancelar.")

    # 5. Obtener AGENDA_SLOT(s) vinculados. Una cita compuesta puede tener varios.
    slot_ids = _as_id_list(cita_fields.get("AGENDA_SLOT"))
    slot_updates = []
    for slot_id in slot_ids:
        try:
            slot_record = at.get_record("AGENDA_SLOTS", slot_id)
            sfields = slot_record.get("fields", {})
            cap_ocupada = sfields.get("CAPACIDAD_OCUPADA", 0) or 0
            nueva_cap = max(0, cap_ocupada - 1)
            slot_updates.append((slot_id, {
                "ESTADO_SLOT": "DISPONIBLE",
                "CAPACIDAD_OCUPADA": nueva_cap,
            }))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"No se pudo validar el slot de la cita: {str(e)}")

    # 6. Cancelar CITA
    motivo = ((payload or {}).get("motivo") or "Cancelado por cliente desde portal").strip()
    cita_update = {
        "ESTADO_CITA": "CANCELADA",
        "MOTIVO_CANCELACION": motivo,
        "FECHA_CANCELACION": hoy,
        "CANCELADO_POR": "CLIENTE",
    }
    cita_rollback = _rollback_payload(cita_fields, [
        "ESTADO_CITA",
        "MOTIVO_CANCELACION",
        "FECHA_CANCELACION",
        "CANCELADO_POR",
    ])
    cita_actualizada = False
    try:
        at.patch_record("CITAS", cita_id, cita_update)
        cita_actualizada = True
        for slot_id, slot_update in slot_updates:
            at.patch_record("AGENDA_SLOTS", slot_id, slot_update)
    except Exception as e:
        if cita_actualizada:
            try:
                at.patch_record("CITAS", cita_id, cita_rollback)
            except Exception as rollback_error:
                logger.error("Rollback de cancelacion fallo para %s: %s", cita_id, rollback_error)
        raise HTTPException(status_code=500, detail=f"Error al cancelar turno de forma consistente: {str(e)}")

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
            "ids": slot_ids,
            "liberado": bool(slot_ids),
            "cantidad": len(slot_ids),
        } if slot_ids else None,
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
    # 2. Obtener CITA actual
    try:
        cita_record = at.get_record("CITAS", cita_id)
        cita_fields = cita_record.get("fields", {})
    except Exception:
        raise HTTPException(status_code=404, detail=f"Cita {cita_id} no encontrada.")

    # 3. Verificar pertenencia al CLIENTE
    if not _record_links_to(cita_fields, "CLIENTE", cliente_id):
        raise HTTPException(status_code=403, detail="No podes reprogramar una cita que no te pertenece.")

    # 4. Verificar que no este cancelada/completada
    estado_actual = (cita_fields.get("ESTADO_CITA") or "").upper()
    if estado_actual in ("CANCELADA", "COMPLETADA", "NO_ASISTIO"):
        raise HTTPException(status_code=409, detail=f"La cita esta en estado {estado_actual}, no se puede reprogramar.")

    # 5. Obtener slot actual
    slot_actual_link = _as_id_list(cita_fields.get("AGENDA_SLOT"))
    if len(slot_actual_link) > 1:
        raise HTTPException(
            status_code=409,
            detail="La reprogramacion automatica de turnos con varios servicios todavia no esta habilitada. Cancelá y creá un nuevo turno compuesto.",
        )
    slot_viejo_id = slot_actual_link[0] if slot_actual_link else None
    slot_viejo_update = None
    slot_viejo_rollback = None
    if slot_viejo_id:
        try:
            vs_record = at.get_record("AGENDA_SLOTS", slot_viejo_id)
            vs_fields = vs_record.get("fields", {})
            cap_vieja = vs_fields.get("CAPACIDAD_OCUPADA", 0) or 0
            slot_viejo_update = {
                "ESTADO_SLOT": "DISPONIBLE",
                "CAPACIDAD_OCUPADA": max(0, cap_vieja - 1),
            }
            slot_viejo_rollback = _rollback_payload(vs_fields, [
                "ESTADO_SLOT",
                "CAPACIDAD_OCUPADA",
            ])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"No se pudo validar el slot actual: {str(e)}")

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
        slot_ocupado = _has_active_cita_for_slot(at, nuevo_slot_id, exclude_cita_id=cita_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al validar conflicto de slot: {str(e)}")
    if slot_ocupado:
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
    cita_rollback = _rollback_payload(cita_fields, [
        "AGENDA_SLOT",
        "FECHA_CITA",
        "HORA_INICIO",
        "HORA_FIN",
        "DURACION_MINUTOS",
        "ESTADO_CITA",
    ])
    cap_nueva_ocupada = (ns_fields.get("CAPACIDAD_OCUPADA", 0) or 0) + 1
    slot_nuevo_update = {
        "ESTADO_SLOT": "RESERVADO",
        "CAPACIDAD_OCUPADA": cap_nueva_ocupada,
    }
    slot_nuevo_rollback = _rollback_payload(ns_fields, [
        "ESTADO_SLOT",
        "CAPACIDAD_OCUPADA",
    ])

    # 10-12. Swap con rollback compensatorio: Airtable no ofrece transacciones.
    cita_actualizada = False
    slot_viejo_liberado = False
    slot_nuevo_reservado = False
    try:
        at.patch_record("CITAS", cita_id, cita_update)
        cita_actualizada = True
        if slot_viejo_id and slot_viejo_update:
            at.patch_record("AGENDA_SLOTS", slot_viejo_id, slot_viejo_update)
            slot_viejo_liberado = True
        at.patch_record("AGENDA_SLOTS", nuevo_slot_id, slot_nuevo_update)
        slot_nuevo_reservado = True
    except Exception as e:
        if slot_nuevo_reservado:
            try:
                at.patch_record("AGENDA_SLOTS", nuevo_slot_id, slot_nuevo_rollback)
            except Exception as rollback_error:
                logger.error("Rollback de slot nuevo fallo para %s: %s", nuevo_slot_id, rollback_error)
        if slot_viejo_liberado and slot_viejo_id and slot_viejo_rollback:
            try:
                at.patch_record("AGENDA_SLOTS", slot_viejo_id, slot_viejo_rollback)
            except Exception as rollback_error:
                logger.error("Rollback de slot viejo fallo para %s: %s", slot_viejo_id, rollback_error)
        if cita_actualizada:
            try:
                at.patch_record("CITAS", cita_id, cita_rollback)
            except Exception as rollback_error:
                logger.error("Rollback de reprogramacion fallo para %s: %s", cita_id, rollback_error)
        raise HTTPException(status_code=500, detail=f"Error al reprogramar turno de forma consistente: {str(e)}")

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
