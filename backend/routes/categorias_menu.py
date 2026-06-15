"""
Rutas FastAPI para CATEGORIAS_MENU — /api/categorias-menu
Fase 1A: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["categorias-menu"])


@router.get("/categorias-menu")
async def listar_categorias():
    """Lista todas las categorias de menu/servicios."""
    try:
        client = AirtableClient()
        records = client.list_records("CATEGORIAS_MENU", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "categorias": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
