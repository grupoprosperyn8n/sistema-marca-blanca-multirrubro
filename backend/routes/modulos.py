"""
Rutas FastAPI para MODULOS y MARCA_BLANCA — /api/modulos, /api/marca-blanca
Fase 1A: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["modulos"])


@router.get("/modulos")
async def listar_modulos():
    """Lista todos los modulos del sistema."""
    try:
        client = AirtableClient()
        records = client.list_records("MODULOS", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "modulos": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/marca-blanca")
async def datos_marca_blanca():
    """Endpoint unificado de marca blanca: nombre, colores, logo, textos, modulos activos."""
    try:
        client = AirtableClient()
        result = {
            "nombre_sistema": None,
            "nombre_negocio": None,
            "colores": None,
            "logo": None,
            "textos_publicos": None,
            "secciones_visibles": None,
            "modulos_activos": [],
            "faltantes": [],
        }
        # CONFIGURACION_PUBLICA
        try:
            config_records = client.list_records("CONFIGURACION_PUBLICA", by_name=True)
            if config_records:
                cf = config_records[0].get("fields", {})
                for buscado, keys in [
                    ("NOMBRE_SISTEMA", ["NOMBRE_SISTEMA", "Nombre_Sistema", "Name"]),
                    ("NOMBRE_NEGOCIO", ["NOMBRE_NEGOCIO", "Nombre_Negocio"]),
                    ("COLORES", ["COLORES", "Colores"]),
                    ("LOGO", ["LOGO", "Logo"]),
                    ("TEXTOS_PUBLICOS", ["TEXTOS_PUBLICOS", "Textos_Publicos"]),
                    ("SECCIONES_VISIBLES", ["SECCIONES_VISIBLES", "Secciones_Visibles"]),
                ]:
                    val = None
                    for k in keys:
                        if k in cf:
                            val = cf[k]
                            break
                    result[buscado.lower()] = val
                    if val is None:
                        result["faltantes"].append(f"CONFIGURACION_PUBLICA.{buscado}")
        except Exception as e:
            result["faltantes"].append(f"CONFIGURACION_PUBLICA (error): {str(e)}")
        # MODULOS
        try:
            modulos_records = client.list_records("MODULOS", by_name=True)
            for r in modulos_records:
                mf = r.get("fields", {})
                result["modulos_activos"].append({
                    "id": r.get("id"),
                    "nombre": mf.get("NOMBRE_MODULO") or mf.get("NOMBRE") or mf.get("Nombre") or "sin_nombre",
                    "activo": mf.get("ACTIVO") if "ACTIVO" in mf else mf.get("Activo", True),
                    "marca_blanca": mf.get("MARCA_BLANCA") or mf.get("Marca_Blanca") or None,
                })
        except Exception as e:
            result["faltantes"].append(f"MODULOS (error): {str(e)}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
