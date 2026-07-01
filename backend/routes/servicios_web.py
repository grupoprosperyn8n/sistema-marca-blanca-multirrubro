"""
Rutas FastAPI para SERVICIOS_WEB — /api/servicios-web
Fase 1B: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from services.public_media_service import build_media_index

router = APIRouter(prefix="/api", tags=["servicios-web"])


def _first_link_id(value):
    if isinstance(value, list) and value:
        return value[0]
    if isinstance(value, str) and value.startswith("rec"):
        return value
    return None


def _attachments(value):
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict) and item.get("url")]
    if isinstance(value, dict) and value.get("url"):
        return [value]
    return []


def _copy_if_missing(target, source, target_key, *source_keys):
    if target.get(target_key) not in (None, "", []):
        return
    for key in source_keys:
        value = source.get(key)
        if value not in (None, "", []):
            target[target_key] = value
            return


@router.get("/servicios-web")
async def listar_servicios_web(response: Response):
    """Lista todos los servicios web."""
    try:
        response.headers["Cache-Control"] = "no-store, max-age=0"
        client = AirtableClient()
        records = client.list_records("SERVICIOS_WEB", by_name=True)
        media_by_service = build_media_index(client).get("service_web", {})
        items = []
        servicio_cache = {}
        for r in records:
            fields = r.get("fields", {})
            fields["MEDIA_PUBLICA"] = media_by_service.get(r.get("id"), [])
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
                _copy_if_missing(fields, servicio_fields, "NOMBRE_SERVICIO", "NOMBRE_SERVICIO")
                _copy_if_missing(fields, servicio_fields, "DESCRIPCION_WEB", "DESCRIPCION_COMERCIAL")
                _copy_if_missing(fields, servicio_fields, "DESCRIPCION", "DESCRIPCION_COMERCIAL")
                _copy_if_missing(fields, servicio_fields, "CATEGORIA_SERVICIO", "CATEGORIA_SERVICIO")
                _copy_if_missing(fields, servicio_fields, "SUBCATEGORIA", "SUBCATEGORIA")
                _copy_if_missing(fields, servicio_fields, "DURACION_MINUTOS", "DURACION_MINUTOS")
                _copy_if_missing(fields, servicio_fields, "PRECIO_BASE", "PRECIO_BASE")
                _copy_if_missing(fields, servicio_fields, "PRECIO_WEB", "PRECIO_BASE")

                imagenes = _attachments(servicio_fields.get("FOTO_SERVICIO"))
                if imagenes:
                    fields["FOTO_SERVICIO"] = imagenes
                    fields["IMAGEN_PRINCIPAL_SERVICIO"] = imagenes[0]
                    fields["IMAGENES_SERVICIO"] = imagenes
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "servicios_web": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
