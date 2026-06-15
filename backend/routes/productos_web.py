"""
Rutas FastAPI para PRODUCTOS_WEB — /backoffice y /tienda.
Fase: FRONTEND_FASE_2B_FASTAPI_READONLY_PRODUCTOS_WEB
"""
import sys
from pathlib import Path
from fastapi import APIRouter, Header, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from services.productos_web_service import (
    listar_backoffice, obtener_backoffice,
    listar_tienda, obtener_tienda_por_slug,
)

router = APIRouter(prefix="/api", tags=["productos-web"])

ROLES_VALIDOS = {"ADMINISTRADOR", "GERENTE", "EMPLEADO_GESTION", "PROFESIONAL", "SOLO_LECTURA"}


# ── BACKOFFICE ──

@router.get("/backoffice/productos-web")
async def backoffice_lista(
    x_demo_role: str = Header(default="SOLO_LECTURA")
):
    """Lista todos los productos para backoffice. IA visible según rol."""
    role = x_demo_role.strip()
    if role not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol no válido: {role}. Válidos: {ROLES_VALIDOS}")
    productos = listar_backoffice(role=role)
    return {"total": len(productos), "productos": productos}


@router.get("/backoffice/productos-web/{record_id}")
async def backoffice_detalle(
    record_id: str,
    x_demo_role: str = Header(default="SOLO_LECTURA")
):
    """Detalle de un producto para backoffice."""
    role = x_demo_role.strip()
    if role not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol no válido: {role}")
    producto = obtener_backoffice(record_id, role=role)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


# ── TIENDA ──

@router.get("/tienda/productos-web")
async def tienda_lista():
    """Catálogo público — solo productos que pasan el gate de publicación."""
    productos = listar_tienda()
    return {"total": len(productos), "productos": productos}


@router.get("/tienda/productos-web/{slug}")
async def tienda_detalle_por_slug(slug: str):
    """Detalle público por slug SEO."""
    producto = obtener_tienda_por_slug(slug)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no disponible")
    return producto


# ── SCHEMA (debug) ──

@router.get("/schema/productos-web")
async def schema_productos_web():
    """Devuelve metadata del schema Airtable (debug)."""
    from airtable_adapter import AirtableClient
    client = AirtableClient()
    table = client.get_table("PRODUCTOS_WEB")
    if not table:
        raise HTTPException(status_code=404, detail="Tabla PRODUCTOS_WEB no encontrada")
    campos = [{"name": f.name, "type": f.type} for f in table.fields]
    return {
        "tabla": "PRODUCTOS_WEB",
        "id": table.id,
        "total_campos": len(campos),
        "campos": campos,
    }
