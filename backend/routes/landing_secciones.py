"""
Rutas FastAPI para LANDING_SECCIONES.

La tabla controla contenido/orden/visibilidad de la landing pública sin crear
schema nuevo. Lectura pública; edición protegida para backoffice.
"""
import sys
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_edit_field
from auth.dependencies import get_current_user
from routes.modulos import _require_config_editor

router = APIRouter(prefix="/api", tags=["landing-secciones"])

PUBLIC_FIELDS = {
    "NOMBRE_SECCION",
    "CLAVE_SECCION",
    "TIPO_SECCION",
    "COMPONENTE_VISUAL",
    "FUENTE_CONTENIDO",
    "AMBITO_SECCION",
    "TITULO_PUBLICO",
    "SUBTITULO_PUBLICO",
    "CONTENIDO_PUBLICO",
    "TEXTO_BOTON_CTA",
    "URL_BOTON_CTA",
    "IMAGEN_PRINCIPAL",
    "IMAGENES_CARRUSEL",
    "COLOR_FONDO_HEX",
    "COLOR_TEXTO_HEX",
    "VISIBLE_MOBILE",
    "VISIBLE_TABLET",
    "VISIBLE_DESKTOP",
    "VISIBLE_EN_FRONTEND_PUBLICO",
    "REGISTRO_ACTIVO",
    "ORDEN_VISUAL",
}

EDITABLE_FIELDS = {
    "NOMBRE_SECCION",
    "TITULO_PUBLICO",
    "SUBTITULO_PUBLICO",
    "CONTENIDO_PUBLICO",
    "TEXTO_BOTON_CTA",
    "URL_BOTON_CTA",
    "IMAGEN_PRINCIPAL",
    "IMAGENES_CARRUSEL",
    "COLOR_FONDO_HEX",
    "COLOR_TEXTO_HEX",
    "VISIBLE_MOBILE",
    "VISIBLE_TABLET",
    "VISIBLE_DESKTOP",
    "VISIBLE_EN_FRONTEND_PUBLICO",
    "REGISTRO_ACTIVO",
    "ORDEN_VISUAL",
}

BOOLEAN_FIELDS = {
    "VISIBLE_MOBILE",
    "VISIBLE_TABLET",
    "VISIBLE_DESKTOP",
    "VISIBLE_EN_FRONTEND_PUBLICO",
    "REGISTRO_ACTIVO",
}
NUMBER_FIELDS = {"ORDEN_VISUAL"}
ATTACHMENT_FIELDS = {"IMAGEN_PRINCIPAL", "IMAGENES_CARRUSEL"}


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value or "").strip().lower()
    return text in {"true", "1", "si", "sí", "yes", "activo", "activa"}


def _normalize_value(field, value):
    if field in BOOLEAN_FIELDS:
        return _to_bool(value)
    if field in NUMBER_FIELDS:
        if value in (None, ""):
            return None
        return int(value)
    if field in ATTACHMENT_FIELDS:
        if value in (None, ""):
            return []
        raw_items = value if isinstance(value, list) else [value]
        attachments = []
        for item in raw_items:
            if isinstance(item, dict):
                url = str(item.get("url") or "").strip()
                filename = str(item.get("filename") or "").strip()
            else:
                url = str(item or "").strip()
                filename = ""
            if not url:
                continue
            attachment = {"url": url}
            if filename:
                attachment["filename"] = filename
            attachments.append(attachment)
        return attachments
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None
    return value


def _public_record(record):
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "createdTime": record.get("createdTime"),
        **{key: fields.get(key) for key in PUBLIC_FIELDS if key in fields},
    }


@router.get("/landing-secciones")
async def listar_landing_secciones(response: Response):
    """Lista secciones configurables de la landing."""
    try:
        response.headers["Cache-Control"] = "no-store, max-age=0"
        client = AirtableClient()
        records = client.list_records("LANDING_SECCIONES", by_name=True)
        items = [_public_record(record) for record in records]
        items.sort(key=lambda item: (item.get("ORDEN_VISUAL") is None, item.get("ORDEN_VISUAL") or 999, item.get("CLAVE_SECCION") or ""))
        return {"total": len(items), "landing_secciones": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.patch("/backoffice/landing-secciones/{record_id}")
async def actualizar_landing_seccion(record_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza campos seguros de LANDING_SECCIONES."""
    _require_config_editor(user)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    try:
        client = AirtableClient()
        table = client.get_table("LANDING_SECCIONES")
        if not table:
            raise HTTPException(status_code=404, detail="Tabla LANDING_SECCIONES no encontrada.")

        available_fields = set(table.field_names)
        role_name = user.get("rol") or ""
        safe_patch = {}
        ignored_fields = []
        forbidden_fields = []
        for field, value in payload.items():
            if field not in EDITABLE_FIELDS or field not in available_fields:
                ignored_fields.append(field)
                continue
            if not can_edit_field(role_name, "LANDING_SECCIONES", field):
                forbidden_fields.append(field)
                continue
            safe_patch[field] = _normalize_value(field, value)

        if forbidden_fields:
            raise HTTPException(
                status_code=403,
                detail={"message": "Campos no editables para tu rol.", "fields": sorted(forbidden_fields)},
            )
        if not safe_patch:
            raise HTTPException(
                status_code=400,
                detail={"message": "No hay campos editables compatibles.", "ignored_fields": sorted(ignored_fields)},
            )

        updated = client.patch_record("LANDING_SECCIONES", record_id, safe_patch)
        return {
            **_public_record(updated),
            "updated_fields": sorted(safe_patch.keys()),
            "ignored_fields": sorted(ignored_fields),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
