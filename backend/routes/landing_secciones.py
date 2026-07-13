"""
Rutas FastAPI para LANDING_SECCIONES.

La tabla controla contenido/orden/visibilidad de la landing pública sin crear
schema nuevo. Lectura pública; edición protegida para backoffice.
"""
import sys
import base64
import json
import logging
import unicodedata
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from fastapi import APIRouter, Depends, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_edit_field
from auth.dependencies import get_current_user
from routes.modulos import _require_config_editor

router = APIRouter(prefix="/api", tags=["landing-secciones"])
logger = logging.getLogger(__name__)

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

CREATE_FIELDS = {
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
    "COLOR_FONDO_HEX",
    "COLOR_TEXTO_HEX",
    "VISIBLE_MOBILE",
    "VISIBLE_TABLET",
    "VISIBLE_DESKTOP",
    "VISIBLE_EN_FRONTEND_PUBLICO",
    "REGISTRO_ACTIVO",
}

SELECT_CHOICES = {
    "TIPO_SECCION": {
        "HERO", "RESERVAS", "SERVICIOS", "PRODUCTOS", "PROMOCIONES", "GALERIA",
        "PROFESIONALES", "SUCURSALES", "CONTACTO", "PORTAL_CLIENTES", "LOGIN_EQUIPO",
        "AGENDA_PUBLICA", "TESTIMONIOS", "FAQ", "CTA", "FOOTER",
    },
    "COMPONENTE_VISUAL": {
        "HERO_GLASS", "BENTO_GRID", "CARD_GRID", "PRODUCTOS_DESTACADOS",
        "SERVICIOS_DESTACADOS", "GALERIA_RESULTADOS", "PROFESIONALES_DESTACADOS",
        "SUCURSALES_CONTACTO", "CONTACTO_RAPIDO", "CTA_PROMOCIONAL", "PORTAL_CLIENTES",
        "LOGIN_EQUIPO", "AGENDA_PUBLICA", "TESTIMONIOS", "FAQ", "FOOTER",
    },
    "FUENTE_CONTENIDO": {
        "MANUAL", "CONFIGURACION_PUBLICA", "PRODUCTOS_WEB", "SERVICIOS_WEB",
        "PROMOCIONES", "EMPLEADOS", "SUCURSALES", "TESTIMONIOS", "MIXTA",
    },
    "AMBITO_SECCION": {"LANDING_PUBLICA"},
}


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
                url = str(item.get("url") or item.get("download_url") or "").strip()
            else:
                url = str(item or "").strip()
            if not url:
                continue
            attachments.append({"url": url})
        return attachments
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if field == "URL_BOTON_CTA":
            return _safe_public_url(cleaned)
        return cleaned or None
    return value


def _safe_public_url(value):
    cleaned = str(value or "").strip()
    if not cleaned:
        return None
    lowered = cleaned.lower()
    if cleaned.startswith("/") and not cleaned.startswith("//"):
        return cleaned
    if lowered.startswith("https://") or lowered.startswith("http://"):
        return cleaned
    raise HTTPException(status_code=400, detail="URL CTA inválida. Usá rutas internas /... o URLs http(s).")


def _normalize_choice(field, value, default=None):
    raw = str(value or default or "").strip().upper()
    allowed = SELECT_CHOICES.get(field)
    if allowed and raw not in allowed:
        raise HTTPException(status_code=400, detail=f"Valor inválido para {field}: {raw}")
    return raw or None


def _slug_key(value):
    text = unicodedata.normalize("NFKD", str(value or "").strip().upper())
    text = "".join(char for char in text if not unicodedata.combining(char))
    chars = []
    last_was_sep = False
    for char in text:
        if char.isascii() and char.isalnum():
            chars.append(char)
            last_was_sep = False
        elif not last_was_sep:
            chars.append("_")
            last_was_sep = True
    return "".join(chars).strip("_")[:48]


def _unique_custom_key(payload, existing_keys):
    requested = _slug_key(payload.get("CLAVE_SECCION"))
    base = requested if requested.startswith("CUSTOM_") else f"CUSTOM_{requested or _slug_key(payload.get('TITULO_PUBLICO') or payload.get('NOMBRE_SECCION')) or 'SECCION'}"
    key = base[:64]
    index = 2
    while key in existing_keys:
        suffix = f"_{index}"
        key = f"{base[:64 - len(suffix)]}{suffix}"
        index += 1
    return key


def _max_existing_order(records):
    values = []
    for record in records:
        raw = (record.get("fields") or {}).get("ORDEN_VISUAL")
        try:
            values.append(int(raw))
        except (TypeError, ValueError):
            continue
    return max(values) if values else 0

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


@router.post("/backoffice/landing-secciones")
async def crear_landing_seccion(payload: dict, user: dict = Depends(get_current_user)):
    """Crea una sección manual segura de LANDING_SECCIONES para la landing pública."""
    _require_config_editor(user)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    try:
        client = AirtableClient()
        table = client.get_table("LANDING_SECCIONES")
        if not table:
            raise HTTPException(status_code=404, detail="Tabla LANDING_SECCIONES no encontrada.")

        available_fields = set(table.field_names)
        existing = client.list_records("LANDING_SECCIONES", by_name=True)
        existing_keys = {str((record.get("fields") or {}).get("CLAVE_SECCION") or "").strip().upper() for record in existing}

        fields = {}
        role_name = user.get("rol") or ""
        forbidden_fields = []
        for field, value in payload.items():
            if field not in CREATE_FIELDS or field not in available_fields:
                continue
            if field in EDITABLE_FIELDS and not can_edit_field(role_name, "LANDING_SECCIONES", field):
                forbidden_fields.append(field)
                continue
            if field in SELECT_CHOICES:
                fields[field] = _normalize_choice(field, value)
            else:
                fields[field] = _normalize_value(field, value)

        if forbidden_fields:
            raise HTTPException(
                status_code=403,
                detail={"message": "Campos no editables para tu rol.", "fields": sorted(forbidden_fields)},
            )

        defaults = {
            "AMBITO_SECCION": "LANDING_PUBLICA",
            "FUENTE_CONTENIDO": "MANUAL",
            "VISIBLE_EN_FRONTEND_PUBLICO": True,
            "REGISTRO_ACTIVO": True,
            "VISIBLE_MOBILE": True,
            "VISIBLE_TABLET": True,
            "VISIBLE_DESKTOP": True,
        }
        for field, value in defaults.items():
            if field in available_fields and fields.get(field) in (None, ""):
                fields[field] = value

        if "ORDEN_VISUAL" in available_fields:
            fields["ORDEN_VISUAL"] = _max_existing_order(existing) + 10

        if "TIPO_SECCION" in available_fields:
            fields["TIPO_SECCION"] = _normalize_choice("TIPO_SECCION", fields.get("TIPO_SECCION"), "CTA")
        if "COMPONENTE_VISUAL" in available_fields:
            fields["COMPONENTE_VISUAL"] = _normalize_choice("COMPONENTE_VISUAL", fields.get("COMPONENTE_VISUAL"), "CTA_PROMOCIONAL")
        if "FUENTE_CONTENIDO" in fields:
            fields["FUENTE_CONTENIDO"] = _normalize_choice("FUENTE_CONTENIDO", fields.get("FUENTE_CONTENIDO"), "MANUAL")
        if "AMBITO_SECCION" in fields:
            fields["AMBITO_SECCION"] = _normalize_choice("AMBITO_SECCION", fields.get("AMBITO_SECCION"), "LANDING_PUBLICA")

        if "CLAVE_SECCION" in available_fields:
            fields["CLAVE_SECCION"] = _unique_custom_key({**payload, **fields}, existing_keys)
        if "NOMBRE_SECCION" in available_fields and not fields.get("NOMBRE_SECCION"):
            fields["NOMBRE_SECCION"] = fields.get("TITULO_PUBLICO") or "Sección personalizada"

        safe_fields = {field: value for field, value in fields.items() if field in available_fields and value is not None}
        if not safe_fields.get("TITULO_PUBLICO") and not safe_fields.get("NOMBRE_SECCION"):
            raise HTTPException(status_code=400, detail="Título o nombre requerido para crear la sección.")

        created = client.create_record("LANDING_SECCIONES", safe_fields)
        return _public_record(created)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.warning("Failed to create landing section: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo crear la sección.")


@router.post("/backoffice/landing-secciones/{record_id}/attachments/{field_name}/upload")
async def subir_attachment_landing(record_id: str, field_name: str, payload: dict, user: dict = Depends(get_current_user)):
    """Sube un archivo chico a un attachment field de LANDING_SECCIONES usando Airtable uploadAttachment."""
    _require_config_editor(user)
    field_name = str(field_name or "").strip().upper()
    if field_name not in ATTACHMENT_FIELDS:
        raise HTTPException(status_code=400, detail="Campo attachment no permitido.")
    if not can_edit_field(user.get("rol") or "", "LANDING_SECCIONES", field_name):
        raise HTTPException(status_code=403, detail="Campo no editable para tu rol.")

    filename = str(payload.get("filename") or "archivo").strip()
    content_type = str(payload.get("content_type") or payload.get("contentType") or "application/octet-stream").strip()
    file_base64 = str(payload.get("file_base64") or payload.get("file") or "").strip()
    if not file_base64:
        raise HTTPException(status_code=400, detail="Archivo base64 requerido.")
    if "," in file_base64 and file_base64.lower().startswith("data:"):
        file_base64 = file_base64.split(",", 1)[1]

    try:
        raw = base64.b64decode(file_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Archivo base64 inválido.")
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="El upload directo a Airtable soporta hasta 5 MB. Para videos grandes usá URL pública.")
    if not (content_type.startswith("image/") or content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes o videos para carruseles públicos.")

    try:
        client = AirtableClient()
        table = client.get_table("LANDING_SECCIONES")
        available_fields = set(table.field_names if table else [])
        if field_name not in available_fields:
            raise HTTPException(status_code=404, detail=f"Campo {field_name} no existe en LANDING_SECCIONES.")

        upload_url = (
            f"https://content.airtable.com/v0/{quote(client.config.base_id)}/"
            f"{quote(record_id)}/{quote(field_name)}/uploadAttachment"
        )
        body = json.dumps({
            "contentType": content_type,
            "file": file_base64,
            "filename": filename,
        }).encode("utf-8")
        req = Request(
            upload_url,
            data=body,
            headers={
                "Authorization": f"Bearer {client.config.api_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlopen(req, timeout=45) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        updated = client.get_record("LANDING_SECCIONES", record_id)
        return {
            "ok": True,
            "upload": result,
            "record": _public_record(updated),
        }
    except HTTPException:
        raise
    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=e.code, detail=f"Airtable uploadAttachment error: {detail}")
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
