"""Read-only booking options for the public reservation flow.

This route keeps the frontend generic:
- choose branch first;
- choose one or more services;
- choose a professional per service or let the backend recommend one;
- choose slots from the real AGENDA_SLOTS table.
"""

import hashlib
import sys
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api/reserva", tags=["reserva-opciones"])

ACTIVE_CITA_STATES = {"CONFIRMADA", "PENDIENTE_CONFIRMACION", "EN_CURSO", "REPROGRAMADA"}
INACTIVE_EMPLOYEE_STATES = {"INACTIVO", "INACTIVA", "BAJA", "ARCHIVADO"}


def _text(value: Any, default: str = "") -> str:
    return str(value or default).strip()


def _links(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).startswith("rec")]
    if isinstance(value, str) and value.startswith("rec"):
        return [value]
    return []


def _truthy(value: Any, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return _text(value).lower() in {"true", "1", "si", "sí", "yes", "activo", "activa"}


def _number(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _slot_available(fields: dict) -> bool:
    return (
        _text(fields.get("ESTADO_SLOT")).upper() == "DISPONIBLE"
        and _number(fields.get("CAPACIDAD_DISPONIBLE"), 0) > 0
        and _truthy(fields.get("PERMITE_RESERVA_WEB"), True)
        and _truthy(fields.get("ACTIVO"), True)
    )


def _service_data(client: AirtableClient, servicio_web_id: str) -> dict:
    try:
        record = client.get_record("SERVICIOS_WEB", servicio_web_id)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Servicio web {servicio_web_id} no encontrado.")
    fields = record.get("fields", {})
    canonical_id = (_links(fields.get("SERVICIO")) or [""])[0]
    duration = _number(fields.get("DURACION_MINUTOS_WEB") or fields.get("DURACION_MINUTOS"), 0)
    if not duration and canonical_id:
        try:
            service_record = client.get_record("SERVICIOS", canonical_id)
            duration = _number(service_record.get("fields", {}).get("DURACION_MINUTOS"), 0)
        except Exception:
            pass
    return {
        "id": servicio_web_id,
        "canonical_id": canonical_id,
        "name": fields.get("NOMBRE_PUBLICO_SERVICIO") or fields.get("NOMBRE_SERVICIO") or "Servicio",
        "duration": duration,
        "fields": fields,
    }


def _service_allowed_professionals(client: AirtableClient, service_id: str) -> set[str]:
    if not service_id:
        return set()
    try:
        record = client.get_record("SERVICIOS", service_id)
        return set(_links(record.get("fields", {}).get("PROFESIONALES_HABILITADOS")))
    except Exception:
        return set()


def _employee_branch_match(fields: dict, sucursal_id: str) -> bool:
    if _truthy(fields.get("TRABAJA_EN_TODAS_SUCURSALES"), False):
        return True
    linked = set()
    linked.update(_links(fields.get("SUCURSAL_BASE")))
    linked.update(_links(fields.get("SUCURSALES_HABILITADAS")))
    linked.update(_links(fields.get("SUCURSALES")))
    return sucursal_id in linked


def _eligible_professionals(client: AirtableClient, sucursal_id: str, service_id: str) -> list[dict]:
    service_allowed = _service_allowed_professionals(client, service_id)
    try:
        employees = client.list_records("EMPLEADOS", by_name=True)
    except Exception:
        return []
    result = []
    for record in employees:
        fields = record.get("fields", {})
        employee_id = record.get("id")
        if fields.get("ACTIVO") is False:
            continue
        if _text(fields.get("ESTADO_EMPLEADO")).upper() in INACTIVE_EMPLOYEE_STATES:
            continue
        employee_services = set(_links(fields.get("SERVICIOS")))
        service_match = (
            not service_id
            or service_id in employee_services
            or (employee_id in service_allowed)
        )
        if not service_match:
            continue
        if not _employee_branch_match(fields, sucursal_id):
            continue
        result.append({
            "id": employee_id,
            "nombre": fields.get("NOMBRE_EMPLEADO") or "Profesional",
            "especialidad": fields.get("ESPECIALIDAD") or "",
            "puesto": fields.get("PUESTO") or "",
        })
    return result


def _daily_load_counts(client: AirtableClient, fecha: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    if not fecha:
        return counts
    try:
        records = client.list_records("CITAS", fields=["PROFESIONAL", "FECHA_CITA", "ESTADO_CITA"], by_name=True)
    except Exception:
        return counts
    for record in records:
        fields = record.get("fields", {})
        if _text(fields.get("FECHA_CITA")) != fecha:
            continue
        if _text(fields.get("ESTADO_CITA")).upper() not in ACTIVE_CITA_STATES:
            continue
        for employee_id in _links(fields.get("PROFESIONAL")):
            counts[employee_id] = counts.get(employee_id, 0) + 1
    return counts


def _rotation_rank(fecha: str, sucursal_id: str, service_id: str, employee_id: str) -> int:
    seed = f"{fecha}|{sucursal_id}|{service_id}|{employee_id}".encode()
    return int(hashlib.sha1(seed).hexdigest()[:8], 16)


def _format_slot(record: dict, professional: dict, load_count: int, service: dict, sucursal_id: str) -> dict:
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "fecha": fields.get("FECHA_SLOT") or "",
        "horaInicio": fields.get("HORA_INICIO") or "",
        "horaFin": fields.get("HORA_FIN") or "",
        "duracion": fields.get("DURACION_MINUTOS") or service.get("duration") or "",
        "capacidad": fields.get("CAPACIDAD_DISPONIBLE") or 0,
        "sucursalId": sucursal_id,
        "servicioWebId": service["id"],
        "servicioId": service["canonical_id"],
        "servicioNombre": service["name"],
        "profesionalId": professional["id"],
        "profesionalNombre": professional["nombre"],
        "cargaDiaProfesional": load_count,
    }


@router.get("/profesionales")
async def listar_profesionales_reserva(
    response: Response,
    sucursal_id: str = Query(...),
    servicio_web_id: str = Query(...),
):
    """Eligible professionals for one branch + service."""
    response.headers["Cache-Control"] = "no-store, max-age=0"
    client = AirtableClient()
    service = _service_data(client, servicio_web_id)
    professionals = _eligible_professionals(client, sucursal_id, service["canonical_id"])
    return {
        "sucursal_id": sucursal_id,
        "servicio_web_id": servicio_web_id,
        "servicio_id": service["canonical_id"],
        "total": len(professionals),
        "profesionales": professionals,
        "auto_enabled": True,
        "auto_label": "Elegir automáticamente",
    }


@router.get("/agenda-opciones")
async def listar_agenda_opciones(
    response: Response,
    sucursal_id: str = Query(...),
    servicio_web_id: str = Query(...),
    fecha: str | None = Query(default=None),
    profesional_id: str | None = Query(default="AUTO"),
):
    """Available agenda options for a selected service/professional.

    If profesional_id=AUTO, the backend ranks eligible professionals by fewer
    active appointments for that date, then a deterministic daily rotation.
    """
    response.headers["Cache-Control"] = "no-store, max-age=0"
    client = AirtableClient()
    service = _service_data(client, servicio_web_id)
    target_date = fecha or date.today().isoformat()
    professionals = _eligible_professionals(client, sucursal_id, service["canonical_id"])
    professional_by_id = {item["id"]: item for item in professionals}
    if profesional_id and profesional_id != "AUTO":
        professionals = [item for item in professionals if item["id"] == profesional_id]

    load_counts = _daily_load_counts(client, target_date)
    try:
        slot_records = client.list_records("AGENDA_SLOTS", by_name=True)
    except Exception:
        slot_records = []

    slots = []
    min_duration = service.get("duration") or 0
    allowed_professional_ids = {item["id"] for item in professionals}
    for record in slot_records:
        fields = record.get("fields", {})
        slot_date = _text(fields.get("FECHA_SLOT"))
        if target_date and slot_date != target_date:
            continue
        if sucursal_id not in _links(fields.get("SUCURSAL")):
            continue
        if not _slot_available(fields):
            continue
        if min_duration and _number(fields.get("DURACION_MINUTOS"), 0) and _number(fields.get("DURACION_MINUTOS"), 0) < min_duration:
            continue
        slot_professionals = [pid for pid in _links(fields.get("PROFESIONAL")) if pid in allowed_professional_ids]
        for employee_id in slot_professionals:
            professional = professional_by_id.get(employee_id)
            if professional:
                slots.append(_format_slot(record, professional, load_counts.get(employee_id, 0), service, sucursal_id))

    slots.sort(key=lambda item: (
        item["cargaDiaProfesional"],
        _rotation_rank(target_date, sucursal_id, service["canonical_id"] or servicio_web_id, item["profesionalId"]),
        item["horaInicio"],
    ))
    recommended = slots[0] if slots else None
    return {
        "fecha": target_date,
        "sucursal_id": sucursal_id,
        "servicio_web_id": servicio_web_id,
        "profesional_id": profesional_id or "AUTO",
        "auto_enabled": True,
        "recommended_professional": {
            "id": recommended["profesionalId"],
            "nombre": recommended["profesionalNombre"],
            "cargaDia": recommended["cargaDiaProfesional"],
        } if recommended else None,
        "total": len(slots),
        "slots": slots,
        "algorithm": "least_daily_load_then_deterministic_rotation",
    }
