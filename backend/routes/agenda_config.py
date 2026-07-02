"""Backoffice agenda configuration and slot generation.

This module keeps the tenant owner away from manual Airtable work:
- configure continuous or split business hours;
- skip weekends/holidays/closed dates;
- generate logical AGENDA_SLOTS without deleting existing data;
- block existing slots logically for closures.
"""

from __future__ import annotations

import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_module
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/backoffice/agenda-config", tags=["agenda-config"])

ACTIVE_EMPLOYEE_STATES = {"ACTIVO", "ACTIVA", ""}
MAX_GENERATE_RECORDS = 2000
MAX_BLOCK_RECORDS = 2000


def _text(value: Any, default: str = "") -> str:
    return str(value or default).strip()


def _bool(value: Any, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return _text(value).lower() in {"true", "1", "si", "sí", "yes", "activo", "activa"}


def _as_ids(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip().startswith("rec")]
    if isinstance(value, str) and value.startswith("rec"):
        return [value]
    return []


def _date(value: Any, field: str) -> date:
    try:
        return datetime.strptime(_text(value), "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail=f"{field} debe tener formato YYYY-MM-DD.")


def _time_to_minutes(value: Any, field: str = "hora") -> int:
    text = _text(value)
    try:
        hour, minute = text.split(":")[:2]
        result = int(hour) * 60 + int(minute)
        if result < 0 or result > 24 * 60:
            raise ValueError
        return result
    except Exception:
        raise HTTPException(status_code=400, detail=f"{field} debe tener formato HH:MM.")


def _minutes_to_time(value: int) -> str:
    return f"{value // 60:02d}:{value % 60:02d}"


def _formula_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _date_range_formula(start: date, end: date) -> str:
    safe_start = _formula_text((start - timedelta(days=1)).isoformat())
    safe_end_next = _formula_text((end + timedelta(days=1)).isoformat())
    return (
        "AND("
        f"IS_AFTER({{FECHA_SLOT}}, DATETIME_PARSE('{safe_start}')),"
        f"IS_BEFORE({{FECHA_SLOT}}, DATETIME_PARSE('{safe_end_next}'))"
        ")"
    )


def _attachment_url(value: Any) -> str:
    if not isinstance(value, list) or not value:
        return ""
    first = value[0] if isinstance(value[0], dict) else {}
    thumbnails = first.get("thumbnails") or {}
    return (
        ((thumbnails.get("small") or {}).get("url"))
        or ((thumbnails.get("large") or {}).get("url"))
        or first.get("url")
        or ""
    )


def _require_agenda_action(user: dict, action: str):
    role = user.get("rol") or ""
    if can_module(role, "CITAS", action):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Sin permiso para {action} agenda.",
    )


def _employee_branch_match(fields: dict, sucursal_id: str) -> bool:
    if _bool(fields.get("TRABAJA_EN_TODAS_SUCURSALES"), False):
        return True
    linked = set()
    linked.update(_as_ids(fields.get("SUCURSAL_BASE")))
    linked.update(_as_ids(fields.get("SUCURSALES_HABILITADAS")))
    linked.update(_as_ids(fields.get("SUCURSALES")))
    return sucursal_id in linked


def _employee_dto(record: dict) -> dict:
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "nombre": fields.get("NOMBRE_EMPLEADO") or "Profesional",
        "puesto": fields.get("PUESTO") or "",
        "especialidad": fields.get("ESPECIALIDAD") or [],
        "descripcion": fields.get("PERFIL_PROFESIONAL") or fields.get("HORARIO_TRABAJO") or "",
        "fotoUrl": _attachment_url(fields.get("FOTO_PERFIL")),
        "sucursalBaseIds": _as_ids(fields.get("SUCURSAL_BASE")),
        "sucursalIds": _as_ids(fields.get("SUCURSALES_HABILITADAS")) + _as_ids(fields.get("SUCURSALES")),
        "trabajaEnTodas": _bool(fields.get("TRABAJA_EN_TODAS_SUCURSALES"), False),
    }


def _active_employees_for_branch(client: AirtableClient, sucursal_id: str) -> list[dict]:
    employees = client.list_records(
        "EMPLEADOS",
        fields=[
            "NOMBRE_EMPLEADO",
            "PUESTO",
            "ESPECIALIDAD",
            "PERFIL_PROFESIONAL",
            "HORARIO_TRABAJO",
            "FOTO_PERFIL",
            "ACTIVO",
            "ESTADO_EMPLEADO",
            "TRABAJA_EN_TODAS_SUCURSALES",
            "SUCURSAL_BASE",
            "SUCURSALES_HABILITADAS",
            "SUCURSALES",
        ],
        by_name=True,
    )
    result = []
    for record in employees:
        fields = record.get("fields", {})
        if fields.get("ACTIVO") is False:
            continue
        if _text(fields.get("ESTADO_EMPLEADO")).upper() not in ACTIVE_EMPLOYEE_STATES:
            continue
        if not _employee_branch_match(fields, sucursal_id):
            continue
        result.append(record)
    return result


def _parse_blocks(payload: dict) -> list[tuple[int, int]]:
    raw_blocks = payload.get("bloques")
    if not isinstance(raw_blocks, list) or not raw_blocks:
        raw_blocks = [{"inicio": payload.get("hora_inicio", "09:00"), "fin": payload.get("hora_fin", "18:00")}]

    blocks = []
    for index, block in enumerate(raw_blocks, start=1):
        start = _time_to_minutes(block.get("inicio"), f"bloques[{index}].inicio")
        end = _time_to_minutes(block.get("fin"), f"bloques[{index}].fin")
        if end <= start:
            raise HTTPException(status_code=400, detail=f"Bloque {index}: la hora fin debe ser mayor a inicio.")
        blocks.append((start, end))
    return sorted(blocks)


def _closed_dates(payload: dict) -> set[str]:
    dates = {_text(item) for item in payload.get("feriados", []) if _text(item)}
    dates.update(_text(item) for item in payload.get("dias_cerrados", []) if _text(item))
    for item in payload.get("cierres", []) or []:
        if not isinstance(item, dict):
            continue
        start = _date(item.get("desde"), "cierres.desde")
        end = _date(item.get("hasta") or item.get("desde"), "cierres.hasta")
        if end < start:
            start, end = end, start
        current = start
        while current <= end:
            dates.add(current.isoformat())
            current += timedelta(days=1)
    return dates


def _existing_slot_keys(client: AirtableClient, start: date, end: date) -> set[tuple[str, str, str, str, str]]:
    records = client.list_records(
        "AGENDA_SLOTS",
        fields=["PROFESIONAL", "SUCURSAL", "FECHA_SLOT", "HORA_INICIO", "HORA_FIN"],
        filter_formula=_date_range_formula(start, end),
        by_name=True,
    )
    keys = set()
    for record in records:
        fields = record.get("fields", {})
        for professional_id in _as_ids(fields.get("PROFESIONAL")):
            for branch_id in _as_ids(fields.get("SUCURSAL")):
                keys.add((
                    professional_id,
                    branch_id,
                    _text(fields.get("FECHA_SLOT")),
                    _text(fields.get("HORA_INICIO")),
                    _text(fields.get("HORA_FIN")),
                ))
    return keys


def _ranges_overlap(start_a: int, end_a: int, start_b: int, end_b: int) -> bool:
    return start_a < end_b and start_b < end_a


def _existing_slot_ranges(client: AirtableClient, start: date, end: date) -> dict[tuple[str, str, str], list[tuple[int, int]]]:
    records = client.list_records(
        "AGENDA_SLOTS",
        fields=["PROFESIONAL", "SUCURSAL", "FECHA_SLOT", "HORA_INICIO", "HORA_FIN", "DURACION_MINUTOS"],
        filter_formula=_date_range_formula(start, end),
        by_name=True,
    )
    ranges: dict[tuple[str, str, str], list[tuple[int, int]]] = {}
    for record in records:
        fields = record.get("fields", {})
        try:
            slot_start = _time_to_minutes(fields.get("HORA_INICIO"), "HORA_INICIO")
            slot_end = _time_to_minutes(fields.get("HORA_FIN"), "HORA_FIN")
        except HTTPException:
            continue
        duration = int(fields.get("DURACION_MINUTOS") or 0)
        if slot_start is not None and slot_end is None and duration:
            slot_end = slot_start + duration
        if slot_start is None or slot_end is None or slot_end <= slot_start:
            continue
        for professional_id in _as_ids(fields.get("PROFESIONAL")):
            for branch_id in _as_ids(fields.get("SUCURSAL")):
                key = (professional_id, branch_id, _text(fields.get("FECHA_SLOT")))
                ranges.setdefault(key, []).append((slot_start, slot_end))
    return ranges


def _slot_fields(
    *,
    sucursal_id: str,
    employee_id: str,
    slot_date: date,
    start: int,
    end: int,
    slot_minutes: int,
    permite_reserva_web: bool,
    requiere_confirmacion: bool,
) -> dict:
    start_text = _minutes_to_time(start)
    end_text = _minutes_to_time(end)
    name = f"CFG_{sucursal_id[-6:]}_{employee_id[-6:]}_{slot_date:%Y%m%d}_{start_text.replace(':', '')}_{slot_minutes}"
    return {
        "NOMBRE_SLOT": name,
        "PROFESIONAL": [employee_id],
        "SUCURSAL": [sucursal_id],
        "FECHA_SLOT": slot_date.isoformat(),
        "HORA_INICIO": start_text,
        "HORA_FIN": end_text,
        "DURACION_MINUTOS": slot_minutes,
        "TIPO_SLOT": "DISPONIBLE",
        "ESTADO_SLOT": "DISPONIBLE",
        "CANAL_ORIGEN": "INTERNO",
        "CAPACIDAD_TOTAL": 1,
        "CAPACIDAD_OCUPADA": 0,
        "PERMITE_RESERVA_WEB": permite_reserva_web,
        "BLOQUEO_MANUAL": False,
        "REQUIERE_CONFIRMACION": requiere_confirmacion,
        "ACTIVO": True,
        "OBSERVACIONES": "Generado desde configurador de agenda.",
    }


@router.get("/bootstrap")
async def agenda_config_bootstrap(user: dict = Depends(get_current_user)):
    """Initial data for the agenda configurator."""
    _require_agenda_action(user, "view")
    client = AirtableClient()
    branches = client.list_records(
        "SUCURSALES",
        fields=["NOMBRE_SUCURSAL", "ACTIVO", "ESTADO_SUCURSAL", "PERMITE_RESERVAS_WEB", "PUBLICAR_WEB", "HORARIO_REFERENCIA"],
        by_name=True,
    )
    active_branches = [
        {
            "id": record.get("id"),
            "nombre": record.get("fields", {}).get("NOMBRE_SUCURSAL") or "Sucursal",
            "permiteReservasWeb": _bool(record.get("fields", {}).get("PERMITE_RESERVAS_WEB"), True),
            "horarioReferencia": record.get("fields", {}).get("HORARIO_REFERENCIA") or "",
        }
        for record in branches
        if record.get("fields", {}).get("ACTIVO") is not False
        and _text(record.get("fields", {}).get("ESTADO_SUCURSAL")).upper() not in {"INACTIVA", "CERRADA", "ARCHIVADA"}
    ]
    employees = client.list_records(
        "EMPLEADOS",
        fields=[
            "NOMBRE_EMPLEADO",
            "PUESTO",
            "ESPECIALIDAD",
            "PERFIL_PROFESIONAL",
            "HORARIO_TRABAJO",
            "FOTO_PERFIL",
            "ACTIVO",
            "ESTADO_EMPLEADO",
            "TRABAJA_EN_TODAS_SUCURSALES",
            "SUCURSAL_BASE",
            "SUCURSALES_HABILITADAS",
            "SUCURSALES",
        ],
        by_name=True,
    )
    return {
        "sucursales": active_branches,
        "empleados": [
            _employee_dto(record)
            for record in employees
            if record.get("fields", {}).get("ACTIVO") is not False
            and _text(record.get("fields", {}).get("ESTADO_EMPLEADO")).upper() in ACTIVE_EMPLOYEE_STATES
        ],
        "defaults": {
            "slotMinutos": 60,
            "bloques": [{"inicio": "09:00", "fin": "13:00"}, {"inicio": "15:00", "fin": "18:00"}],
            "diasSemana": [0, 1, 2, 3, 4],
            "permiteReservaWeb": True,
            "requiereConfirmacion": False,
        },
    }


@router.post("/generar-slots")
async def generar_slots(payload: dict, user: dict = Depends(get_current_user)):
    """Generate available AGENDA_SLOTS from business rules. No physical deletes."""
    _require_agenda_action(user, "create")
    sucursal_id = _text(payload.get("sucursal_id"))
    if not sucursal_id.startswith("rec"):
        raise HTTPException(status_code=400, detail="sucursal_id es requerido.")

    start_date = _date(payload.get("fecha_desde"), "fecha_desde")
    end_date = _date(payload.get("fecha_hasta"), "fecha_hasta")
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="fecha_hasta debe ser mayor o igual a fecha_desde.")
    if (end_date - start_date).days > 366:
        raise HTTPException(status_code=400, detail="El rango máximo permitido es 366 días.")

    slot_minutes = int(payload.get("slot_minutos") or 60)
    if slot_minutes not in {15, 30, 45, 60, 90, 120, 180}:
        raise HTTPException(status_code=400, detail="slot_minutos debe ser 15, 30, 45, 60, 90, 120 o 180.")

    weekday_set = set(int(day) for day in (payload.get("dias_semana") or [0, 1, 2, 3, 4]) if str(day).isdigit())
    blocks = _parse_blocks(payload)
    closed = _closed_dates(payload)
    dry_run = _bool(payload.get("dry_run"), True)
    all_employees = _bool(payload.get("todos_empleados"), True)
    requested_employee_ids = set(_as_ids(payload.get("empleado_ids")))

    client = AirtableClient()
    branch_employees = _active_employees_for_branch(client, sucursal_id)
    employees = [
        record
        for record in branch_employees
        if all_employees or record.get("id") in requested_employee_ids
    ]
    if not employees:
        raise HTTPException(status_code=400, detail="No hay empleados activos para esa sucursal/selección.")

    existing = _existing_slot_keys(client, start_date, end_date)
    existing_ranges = _existing_slot_ranges(client, start_date, end_date)
    generated = []
    skipped_closed = 0
    skipped_existing = 0
    current = start_date
    while current <= end_date:
        if current.weekday() not in weekday_set or current.isoformat() in closed:
            skipped_closed += len(employees)
            current += timedelta(days=1)
            continue
        for employee in employees:
            employee_id = employee["id"]
            for block_start, block_end in blocks:
                cursor = block_start
                while cursor + slot_minutes <= block_end:
                    start_text = _minutes_to_time(cursor)
                    end_text = _minutes_to_time(cursor + slot_minutes)
                    key = (employee_id, sucursal_id, current.isoformat(), start_text, end_text)
                    range_key = (employee_id, sucursal_id, current.isoformat())
                    overlaps_existing = any(
                        _ranges_overlap(cursor, cursor + slot_minutes, busy_start, busy_end)
                        for busy_start, busy_end in existing_ranges.get(range_key, [])
                    )
                    if key in existing or overlaps_existing:
                        skipped_existing += 1
                    else:
                        generated.append(_slot_fields(
                            sucursal_id=sucursal_id,
                            employee_id=employee_id,
                            slot_date=current,
                            start=cursor,
                            end=cursor + slot_minutes,
                            slot_minutes=slot_minutes,
                            permite_reserva_web=_bool(payload.get("permite_reserva_web"), True),
                            requiere_confirmacion=_bool(payload.get("requiere_confirmacion"), False),
                        ))
                        existing.add(key)
                        existing_ranges.setdefault(range_key, []).append((cursor, cursor + slot_minutes))
                    cursor += slot_minutes
        current += timedelta(days=1)

    if not dry_run and len(generated) > MAX_GENERATE_RECORDS:
        raise HTTPException(
            status_code=400,
            detail=f"El plan genera {len(generated)} slots. Para evitar timeouts, generá por tramos de hasta {MAX_GENERATE_RECORDS} slots.",
        )
    created = [] if dry_run else client.create_records("AGENDA_SLOTS", generated)
    return {
        "dry_run": dry_run,
        "sucursal_id": sucursal_id,
        "empleados": len(employees),
        "fecha_desde": start_date.isoformat(),
        "fecha_hasta": end_date.isoformat(),
        "slot_minutos": slot_minutes,
        "bloques": [{"inicio": _minutes_to_time(start), "fin": _minutes_to_time(end)} for start, end in blocks],
        "slots_planificados": len(generated),
        "slots_creados": len(created),
        "omitidos_por_existentes": skipped_existing,
        "dias_empleado_omitidos_por_cierre": skipped_closed,
        "limite_creacion_por_request": MAX_GENERATE_RECORDS,
    }


@router.post("/bloquear-slots")
async def bloquear_slots(payload: dict, user: dict = Depends(get_current_user)):
    """Logically block existing slots for closed days/holidays. No physical deletes."""
    _require_agenda_action(user, "edit")
    sucursal_id = _text(payload.get("sucursal_id"))
    if not sucursal_id.startswith("rec"):
        raise HTTPException(status_code=400, detail="sucursal_id es requerido.")
    start_date = _date(payload.get("fecha_desde"), "fecha_desde")
    end_date = _date(payload.get("fecha_hasta") or payload.get("fecha_desde"), "fecha_hasta")
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    employee_filter = set(_as_ids(payload.get("empleado_ids")))
    motivo = _text(payload.get("motivo"), "Cierre configurado desde backoffice")
    client = AirtableClient()
    records = client.list_records(
        "AGENDA_SLOTS",
        fields=["PROFESIONAL", "SUCURSAL", "FECHA_SLOT", "ESTADO_SLOT"],
        filter_formula=_date_range_formula(start_date, end_date),
        by_name=True,
    )
    patches = []
    skipped_reserved = 0
    for record in records:
        fields = record.get("fields", {})
        if sucursal_id not in _as_ids(fields.get("SUCURSAL")):
            continue
        if employee_filter and not (employee_filter & set(_as_ids(fields.get("PROFESIONAL")))):
            continue
        if _text(fields.get("ESTADO_SLOT")).upper() == "RESERVADO":
            skipped_reserved += 1
            continue
        patches.append({
            "id": record["id"],
            "fields": {
                "ESTADO_SLOT": "BLOQUEADO",
                "TIPO_SLOT": "BLOQUEADO",
                "BLOQUEO_MANUAL": True,
                "MOTIVO_BLOQUEO": motivo,
                "PERMITE_RESERVA_WEB": False,
            },
        })

    if len(patches) > MAX_BLOCK_RECORDS:
        raise HTTPException(
            status_code=400,
            detail=f"El bloqueo afecta {len(patches)} slots. Dividí el cierre en tramos de hasta {MAX_BLOCK_RECORDS}.",
        )
    patched = client.patch_records("AGENDA_SLOTS", patches)
    return {
        "bloqueados": len(patched),
        "omitidos_reservados": skipped_reserved,
        "fecha_desde": start_date.isoformat(),
        "fecha_hasta": end_date.isoformat(),
        "delete_fisico": False,
    }
