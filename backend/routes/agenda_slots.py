"""
Rutas FastAPI para AGENDA_SLOTS — /api/agenda-slots
Fase 1B: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from datetime import date
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


@router.get("/agenda-slots")
async def listar_agenda_slots(
    sucursal_id: str | None = Query(default=None),
    disponible: bool = Query(default=False),
    future_only: bool = Query(default=False),
    min_duration: int | None = Query(default=None, ge=1),
):
    """Lista todos los slots de agenda."""
    try:
        client = AirtableClient()
        records = client.list_records("AGENDA_SLOTS", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            if disponible and not _slot_available(fields):
                continue
            if not _slot_matches_filters(fields, sucursal_id, future_only, min_duration):
                continue
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {
            "total": len(items),
            "filters": {
                "sucursal_id": sucursal_id,
                "disponible": disponible,
                "future_only": future_only,
                "min_duration": min_duration,
            },
            "agenda_slots": items,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
