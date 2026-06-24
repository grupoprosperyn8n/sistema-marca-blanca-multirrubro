"""
Rutas FastAPI para SERVICIOS_WEB — /api/servicios-web
Fase 1B: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["servicios-web"])


def _first_link_id(value):
    if isinstance(value, list) and value:
        return value[0]
    if isinstance(value, str) and value.startswith("rec"):
        return value
    return None


@router.get("/servicios-web")
async def listar_servicios_web():
    """Lista todos los servicios web."""
    try:
        client = AirtableClient()
        records = client.list_records("SERVICIOS_WEB", by_name=True)
        items = []
        servicio_cache = {}
        for r in records:
            fields = r.get("fields", {})
            servicio_id = _first_link_id(fields.get("SERVICIO"))
            if servicio_id:
                fields["SERVICIO_ID"] = servicio_id
                if servicio_id not in servicio_cache:
                    try:
                        servicio_cache[servicio_id] = client.get_record("SERVICIOS", servicio_id).get("fields", {})
                    except Exception:
                        servicio_cache[servicio_id] = {}
                servicio_fields = servicio_cache.get(servicio_id) or {}
                fields["SERVICIO_NOMBRE"] = servicio_fields.get("NOMBRE_SERVICIO")
                fields["DURACION_MINUTOS"] = servicio_fields.get("DURACION_MINUTOS")
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "servicios_web": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
