"""Public media normalization for white-label frontend carousels.

MEDIA_PUBLICA is the generic media layer. It can attach images, videos,
embeds, or URLs to public products, services, employees, promotions, packs,
and coupons without changing frontend code per rubro.
"""

from __future__ import annotations

from typing import Any

from airtable_adapter import AirtableClient


ENTITY_FIELDS = {
    "product_web": "PRODUCTO_WEB",
    "service_web": "SERVICIO_WEB",
    "employee": "EMPLEADO",
    "promotion": "PROMOCION",
    "pack": "PACK",
    "coupon": "CUPON",
}


def _text(value: Any, default: str = "") -> str:
    return str(value or default).strip()


def _select(value: Any, default: str = "") -> str:
    if isinstance(value, list) and value:
        value = value[0]
    return _text(value, default).upper()


def _truthy(value: Any, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return _text(value).lower() in {
        "true",
        "1",
        "si",
        "sí",
        "yes",
        "activo",
        "activa",
        "visible",
        "publico",
        "público",
    }


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


def _attachment(att: Any) -> dict | None:
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


def _attachments(value: Any) -> list[dict]:
    if isinstance(value, list):
        return [item for item in (_attachment(att) for att in value) if item]
    item = _attachment(value)
    return [item] if item else []


def _is_public(fields: dict) -> bool:
    if fields.get("ACTIVO") is False:
        return False
    if fields.get("VISIBLE_EN_FRONTEND_PUBLICO") is False:
        return False
    return True


def build_media_item(record: dict) -> dict:
    fields = record.get("fields", {})
    attachments = _attachments(fields.get("ARCHIVO_MEDIA"))
    primary_attachment = attachments[0] if attachments else None
    media_type = _select(fields.get("TIPO_MEDIA"), "IMAGEN") or "IMAGEN"
    if primary_attachment and primary_attachment.get("type", "").startswith("video/"):
        media_type = "VIDEO"
    url = _text(fields.get("URL_MEDIA")) or (primary_attachment or {}).get("url", "")
    return {
        "id": record.get("id"),
        "name": fields.get("NOMBRE_MEDIA") or fields.get("TITULO_PUBLICO") or "",
        "type": media_type,
        "role": _select(fields.get("ROL_MEDIA"), "CARRUSEL") or "CARRUSEL",
        "title": fields.get("TITULO_PUBLICO") or "",
        "description": fields.get("DESCRIPCION_PUBLICA") or "",
        "alt": fields.get("ALT_TEXT") or fields.get("TITULO_PUBLICO") or fields.get("NOMBRE_MEDIA") or "",
        "order": _number(fields.get("ORDEN_VISUAL"), 0),
        "url": url,
        "attachment": primary_attachment,
        "attachments": attachments,
        "links": {key: _links(fields.get(field)) for key, field in ENTITY_FIELDS.items()},
    }


def list_public_media(client: AirtableClient | None = None) -> list[dict]:
    """Return safe public media records. Missing/empty table is non-blocking."""
    at = client or AirtableClient()
    try:
        records = at.list_records("MEDIA_PUBLICA", by_name=True)
    except Exception:
        return []
    items = [build_media_item(record) for record in records if _is_public(record.get("fields", {}))]
    return sorted(items, key=lambda item: (item.get("order", 0), item.get("name") or item.get("id") or ""))


def build_media_index(client: AirtableClient | None = None) -> dict[str, dict[str, list[dict]]]:
    """Group public media by entity type and linked Airtable record ID."""
    index: dict[str, dict[str, list[dict]]] = {key: {} for key in ENTITY_FIELDS}
    for item in list_public_media(client):
        links = item.get("links") or {}
        clean_item = {key: value for key, value in item.items() if key != "links"}
        for entity, ids in links.items():
            for record_id in ids:
                index.setdefault(entity, {}).setdefault(record_id, []).append(clean_item)
    for entity_index in index.values():
        for items in entity_index.values():
            items.sort(key=lambda item: (item.get("order", 0), item.get("name") or item.get("id") or ""))
    return index
