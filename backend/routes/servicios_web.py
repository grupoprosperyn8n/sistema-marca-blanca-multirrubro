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


@router.get("/servicios-web")
async def listar_servicios_web():
    """Lista todos los servicios web."""
    try:
        client = AirtableClient()
        records = client.list_records("SERVICIOS_WEB", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "servicios_web": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
