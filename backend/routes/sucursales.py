"""
Rutas FastAPI para SUCURSALES — /api/sucursales
Fase 1A: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["sucursales"])


@router.get("/sucursales")
async def listar_sucursales():
    """Lista todas las sucursales."""
    try:
        client = AirtableClient()
        records = client.list_records("SUCURSALES", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "sucursales": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
