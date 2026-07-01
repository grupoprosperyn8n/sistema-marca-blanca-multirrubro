"""Public staff/personnel endpoint for the white-label landing.

Source of truth is EMPLEADOS. The endpoint exposes only public-safe profile
fields and never returns private contact, identity, payroll, or internal notes.
"""

import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from services.public_media_service import build_media_index

router = APIRouter(prefix="/api", tags=["personal-web"])


PRIVATE_STATE_WORDS = {"INACTIVO", "INACTIVA", "BAJA", "BAJA_TEMPORAL", "DESPEDIDO", "ARCHIVADO"}
BRANCH_BLACKLIST = {"FICTICIA", "HISTORICA", "CAPACITACION", "PRODUCTOS_ONLINE", "INTERNA", "PRUEBA", "TEST"}


def _text(value: Any, default: str = "") -> str:
    return str(value or default).strip()


def _select(value: Any, default: str = "") -> str:
    if isinstance(value, list) and value:
        value = value[0]
    return _text(value, default)


def _number(value: Any, default: float = 0) -> float:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _links(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).startswith("rec")]
    if isinstance(value, str) and value.startswith("rec"):
        return [value]
    return []


def _attachment(value: Any) -> dict | None:
    if isinstance(value, str) and value.strip():
        return {"url": value.strip(), "download_url": value.strip(), "filename": "", "type": "", "width": None, "height": None}
    att = value[0] if isinstance(value, list) and value else value
    if not isinstance(att, dict):
        return None
    thumb = (
        att.get("thumbnails", {}).get("large")
        or att.get("thumbnails", {}).get("full")
        or att.get("thumbnails", {}).get("small")
        or {}
    )
    url = thumb.get("url") or att.get("url")
    if not url:
        return None
    return {
        "url": url,
        "download_url": att.get("url"),
        "filename": att.get("filename") or "",
        "type": att.get("type") or "",
        "width": thumb.get("width") or att.get("width"),
        "height": thumb.get("height") or att.get("height"),
    }


def _safe_get_name(client: AirtableClient, table: str, record_id: str, field_names: list[str], cache: dict) -> str:
    key = f"{table}:{record_id}"
    if key in cache:
        return cache[key]
    try:
        record = client.get_record(table, record_id)
        fields = record.get("fields", {})
        for field_name in field_names:
            value = fields.get(field_name)
            if value:
                cache[key] = _text(value)
                return cache[key]
    except Exception:
        pass
    cache[key] = ""
    return ""


def _safe_get_public_branch_name(client: AirtableClient, record_id: str, cache: dict) -> str:
    key = f"SUCURSALES:{record_id}:public"
    if key in cache:
        return cache[key]
    try:
        record = client.get_record("SUCURSALES", record_id)
        fields = record.get("fields", {})
        name = _text(fields.get("NOMBRE_SUCURSAL") or fields.get("NOMBRE_CORTO_SUCURSAL"))
        upper_name = name.upper()
        state = _select(fields.get("ESTADO_SUCURSAL")).upper()
        visibility = _select(fields.get("VISIBILIDAD_WEB")).upper()
        if not name:
            cache[key] = ""
        elif fields.get("ACTIVO") is False or fields.get("PUBLICAR_WEB") is False:
            cache[key] = ""
        elif state in {"INACTIVA", "CERRADA", "BORRADOR"}:
            cache[key] = ""
        elif visibility in {"OCULTA", "INTERNA", "SOLO_INTERNA", "BORRADOR"}:
            cache[key] = ""
        elif any(word in upper_name for word in BRANCH_BLACKLIST):
            cache[key] = ""
        else:
            cache[key] = name
    except Exception:
        cache[key] = ""
    return cache[key]


def _branch_is_public(fields: dict) -> bool:
    name = _text(fields.get("NOMBRE_SUCURSAL") or fields.get("NOMBRE_CORTO_SUCURSAL"))
    upper_name = name.upper()
    state = _select(fields.get("ESTADO_SUCURSAL")).upper()
    visibility = _select(fields.get("VISIBILIDAD_WEB")).upper()
    if not name:
        return False
    if fields.get("ACTIVO") is False or fields.get("PUBLICAR_WEB") is False:
        return False
    if state in {"INACTIVA", "CERRADA", "BORRADOR"}:
        return False
    if visibility in {"OCULTA", "INTERNA", "SOLO_INTERNA", "BORRADOR"}:
        return False
    if any(word in upper_name for word in BRANCH_BLACKLIST):
        return False
    return True


def _safe_records_by_id(client: AirtableClient, table_name: str) -> dict[str, dict]:
    try:
        return {record.get("id"): record.get("fields", {}) for record in client.list_records(table_name, by_name=True)}
    except Exception:
        return {}


def _is_public_employee(fields: dict) -> bool:
    if not _text(fields.get("NOMBRE_EMPLEADO")):
        return False
    if fields.get("ACTIVO") is False:
        return False
    state = _select(fields.get("ESTADO_EMPLEADO")).upper()
    if state in PRIVATE_STATE_WORDS:
        return False
    return True


@router.get("/personal-web")
async def listar_personal_web(response: Response):
    """List public-safe staff profiles for the landing/personnel page."""
    try:
        response.headers["Cache-Control"] = "no-store, max-age=0"
        client = AirtableClient()
        records = client.list_records("EMPLEADOS", by_name=True)
        media_index = build_media_index(client).get("employee", {})
        services_map = {
            record_id: _text(fields.get("NOMBRE_SERVICIO"))
            for record_id, fields in _safe_records_by_id(client, "SERVICIOS").items()
            if _text(fields.get("NOMBRE_SERVICIO"))
        }
        branches_map = {
            record_id: _text(fields.get("NOMBRE_SUCURSAL") or fields.get("NOMBRE_CORTO_SUCURSAL"))
            for record_id, fields in _safe_records_by_id(client, "SUCURSALES").items()
            if _branch_is_public(fields)
        }
        items = []

        for record in records:
            fields = record.get("fields", {})
            if not _is_public_employee(fields):
                continue

            employee_id = record.get("id")
            service_ids = _links(fields.get("SERVICIOS"))
            branch_ids = _links(fields.get("SUCURSALES_HABILITADAS")) or _links(fields.get("SUCURSALES")) or _links(fields.get("SUCURSAL_BASE"))

            servicios = [services_map[service_id] for service_id in service_ids if service_id in services_map]
            sucursales = [branches_map[branch_id] for branch_id in branch_ids if branch_id in branches_map]

            foto = _attachment(fields.get("FOTO_PERFIL"))
            media = list(media_index.get(employee_id, []))
            if foto and not media:
                media = [{
                    "id": f"{employee_id}-foto-perfil",
                    "type": "IMAGEN",
                    "role": "PORTADA",
                    "title": fields.get("NOMBRE_EMPLEADO") or "",
                    "alt": fields.get("NOMBRE_EMPLEADO") or "Personal",
                    "url": foto.get("url"),
                    "attachment": foto,
                    "order": 0,
                }]

            items.append({
                "id": employee_id,
                "nombre": fields.get("NOMBRE_EMPLEADO") or "Profesional",
                "puesto": fields.get("PUESTO") or "",
                "especialidad": fields.get("ESPECIALIDAD") or "",
                "nivelExperiencia": fields.get("NIVEL_EXPERIENCIA") or "",
                "perfil": fields.get("PERFIL_PROFESIONAL") or "",
                "servicios": servicios[:8],
                "sucursales": sucursales[:5],
                "colorAgenda": fields.get("COLOR_AGENDA") or "",
                "media": media,
                "orden": _number(fields.get("ORDEN_VISUAL"), 0),
            })

        items.sort(key=lambda item: (item.get("orden", 0), item.get("nombre", "")))
        return {"total": len(items), "personal": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
