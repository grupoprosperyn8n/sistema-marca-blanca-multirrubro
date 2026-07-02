"""
Rutas FastAPI para AGENDA_SLOTS — /api/agenda-slots
Fase 1B: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from datetime import date, datetime, timedelta
from fastapi import APIRouter, HTTPException, Query

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["agenda-slots"])


def _to_bool(value, default=False):
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"true", "1", "si", "sí", "yes"}:
        return True
    if text in {"false", "0", "no"}:
        return False
    return default


def _slot_available(fields: dict) -> bool:
    estado = str(fields.get("ESTADO_SLOT") or "").upper()
    capacidad = int(fields.get("CAPACIDAD_DISPONIBLE") or 0)
    return (
        estado == "DISPONIBLE"
        and capacidad > 0
        and _to_bool(fields.get("PERMITE_RESERVA_WEB"), True)
        and _to_bool(fields.get("ACTIVO"), True)
    )


def _formula_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _date_range_formula(fecha_desde: str | None, fecha_hasta: str | None, field_name: str = "FECHA_SLOT") -> str | None:
    clauses = []
    if fecha_desde:
        try:
            start = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
            clauses.append(f"IS_AFTER({{{field_name}}}, DATETIME_PARSE('{_formula_text((start - timedelta(days=1)).isoformat())}'))")
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_desde debe tener formato YYYY-MM-DD.")
    if fecha_hasta:
        try:
            end = datetime.strptime(fecha_hasta, "%Y-%m-%d").date()
            clauses.append(f"IS_BEFORE({{{field_name}}}, DATETIME_PARSE('{_formula_text((end + timedelta(days=1)).isoformat())}'))")
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_hasta debe tener formato YYYY-MM-DD.")
    if not clauses:
        return None
    return clauses[0] if len(clauses) == 1 else f"AND({','.join(clauses)})"


def _active_cita_filter(fecha_desde: str | None, fecha_hasta: str | None) -> str | None:
    states = "OR({ESTADO_CITA}='CONFIRMADA',{ESTADO_CITA}='PENDIENTE_CONFIRMACION',{ESTADO_CITA}='EN_CURSO',{ESTADO_CITA}='REPROGRAMADA')"
    date_filter = _date_range_formula(fecha_desde, fecha_hasta, "FECHA_CITA")
    return f"AND({states},{date_filter})" if date_filter else states


def _occupied_slot_ids(client: AirtableClient, fecha_desde: str | None, fecha_hasta: str | None) -> set[str]:
    try:
        records = client.list_records(
            "CITAS",
            fields=["AGENDA_SLOT", "ESTADO_CITA", "ACTIVO", "FECHA_CITA"],
            filter_formula=_active_cita_filter(fecha_desde, fecha_hasta),
            by_name=True,
        )
    except Exception:
        return set()
    occupied = set()
    for record in records:
        fields = record.get("fields", {})
        if fields.get("ACTIVO") is False:
            continue
        for slot_id in fields.get("AGENDA_SLOT") or []:
            if str(slot_id).startswith("rec"):
                occupied.add(str(slot_id))
    return occupied


def _time_to_minutes(value) -> int | None:
    text = str(value or "").strip()
    try:
        hour, minute = text.split(":")[:2]
        return int(hour) * 60 + int(minute)
    except Exception:
        return None


def _ranges_overlap(start_a: int, end_a: int, start_b: int, end_b: int) -> bool:
    return start_a < end_b and start_b < end_a


def _occupied_ranges_by_professional(client: AirtableClient, fecha_desde: str | None, fecha_hasta: str | None) -> dict[str, list[tuple[int, int]]]:
    try:
        records = client.list_records(
            "CITAS",
            fields=["PROFESIONAL", "ESTADO_CITA", "ACTIVO", "FECHA_CITA", "HORA_INICIO", "HORA_FIN", "DURACION_MINUTOS"],
            filter_formula=_active_cita_filter(fecha_desde, fecha_hasta),
            by_name=True,
        )
    except Exception:
        return {}
    ranges: dict[str, list[tuple[int, int]]] = {}
    for record in records:
        fields = record.get("fields", {})
        if fields.get("ACTIVO") is False:
            continue
        start = _time_to_minutes(fields.get("HORA_INICIO"))
        end = _time_to_minutes(fields.get("HORA_FIN"))
        duration = int(fields.get("DURACION_MINUTOS") or 0)
        if start is not None and end is None and duration:
            end = start + duration
        if start is None or end is None or end <= start:
            continue
        for professional_id in fields.get("PROFESIONAL") or []:
            if str(professional_id).startswith("rec"):
                ranges.setdefault(str(professional_id), []).append((start, end))
    return ranges


def _slot_overlaps_busy_professional(fields: dict, occupied_ranges: dict[str, list[tuple[int, int]]]) -> bool:
    start = _time_to_minutes(fields.get("HORA_INICIO"))
    end = _time_to_minutes(fields.get("HORA_FIN"))
    duration = int(fields.get("DURACION_MINUTOS") or 0)
    if start is not None and end is None and duration:
        end = start + duration
    if start is None or end is None or end <= start:
        return True
    for professional_id in fields.get("PROFESIONAL") or []:
        if any(_ranges_overlap(start, end, busy_start, busy_end) for busy_start, busy_end in occupied_ranges.get(str(professional_id), [])):
            return True
    return False


def _slot_matches_filters(fields: dict, sucursal_id: str | None, future_only: bool, min_duration: int | None) -> bool:
    if sucursal_id:
        sucursales = fields.get("SUCURSAL") or []
        if not isinstance(sucursales, list) or sucursal_id not in sucursales:
            return False

    if future_only:
        fecha_slot = str(fields.get("FECHA_SLOT") or "")
        if not fecha_slot or fecha_slot < date.today().isoformat():
            return False

    if min_duration:
        duracion = int(fields.get("DURACION_MINUTOS") or 0)
        if duracion and duracion < min_duration:
            return False

    return True


class _Resolver:
    def __init__(self, client: AirtableClient):
        self.client = client
        self.cache: dict[tuple[str, str], dict] = {}

    def fields(self, table: str, record_id: str) -> dict:
        if not record_id:
            return {}
        key = (table, record_id)
        if key not in self.cache:
            try:
                self.cache[key] = self.client.get_record(table, record_id).get("fields", {})
            except Exception:
                self.cache[key] = {}
        return self.cache[key]


def _first_id(value) -> str:
    if isinstance(value, list) and value:
        return str(value[0])
    return str(value or "")


def _format_slot_record(record: dict, resolver: _Resolver) -> dict:
    fields = dict(record.get("fields", {}))
    profesional_id = _first_id(fields.get("PROFESIONAL"))
    sucursal_id = _first_id(fields.get("SUCURSAL"))
    profesional = resolver.fields("EMPLEADOS", profesional_id)
    sucursal = resolver.fields("SUCURSALES", sucursal_id)
    return {
        "id": record.get("id"),
        "createdTime": record.get("createdTime"),
        **fields,
        "PROFESIONAL_ID": profesional_id,
        "SUCURSAL_ID": sucursal_id,
        "NOMBRE_PROFESIONAL": profesional.get("NOMBRE_EMPLEADO") or "",
        "NOMBRE_SUCURSAL": sucursal.get("NOMBRE_SUCURSAL") or "",
    }


@router.get("/agenda-slots")
async def listar_agenda_slots(
    sucursal_id: str | None = Query(default=None),
    disponible: bool = Query(default=False),
    future_only: bool = Query(default=False),
    min_duration: int | None = Query(default=None, ge=1),
    fecha_desde: str | None = Query(default=None),
    fecha_hasta: str | None = Query(default=None),
    max_records: int | None = Query(default=500, ge=1, le=5000),
):
    """Lista todos los slots de agenda."""
    try:
        client = AirtableClient()
        if future_only and not fecha_desde:
            fecha_desde = date.today().isoformat()
        records = client.list_records(
            "AGENDA_SLOTS",
            filter_formula=_date_range_formula(fecha_desde, fecha_hasta),
            max_records=max_records,
            by_name=True,
        )
        occupied = _occupied_slot_ids(client, fecha_desde, fecha_hasta) if disponible else set()
        occupied_ranges = _occupied_ranges_by_professional(client, fecha_desde, fecha_hasta) if disponible else {}
        resolver = _Resolver(client)
        items = []
        for r in records:
            if disponible and r.get("id") in occupied:
                continue
            fields = r.get("fields", {})
            if disponible and _slot_overlaps_busy_professional(fields, occupied_ranges):
                continue
            if disponible and not _slot_available(fields):
                continue
            if not _slot_matches_filters(fields, sucursal_id, future_only, min_duration):
                continue
            items.append(_format_slot_record(r, resolver))
        return {
            "total": len(items),
            "filters": {
                "sucursal_id": sucursal_id,
                "disponible": disponible,
                "future_only": future_only,
                "min_duration": min_duration,
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "max_records": max_records,
            },
            "agenda_slots": items,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
