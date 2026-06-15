"""
Servicio PRODUCTOS_WEB — lógica de negocio read-only.
Fase: FRONTEND_FASE_2B_FASTAPI_READONLY_PRODUCTOS_WEB
"""
import sys, os
from pathlib import Path
from datetime import date
from typing import Optional
from decimal import Decimal

# Asegurar que backend/ está en sys.path
_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from contract_productos_web import (
    PUBLICACION_GATE, PUBLIC_FIELDS, BLOCKED_FIELDS_FOR_TIENDA, IA_SAFE_FIELDS,
    VISIBILIDAD_POR_ROL,
)

TABLE_NAME = "PRODUCTOS_WEB"

ROLES_IA_VISIBLE = {"ADMINISTRADOR", "GERENTE", "EMPLEADO_GESTION"}


def _get_client() -> AirtableClient:
    """Crea AirtableClient. main.py inyecta AIRTABLE_BASE_ID/AIRTABLE_API_TOKEN en os.environ."""
    return AirtableClient()


def _parse_image(url_raw) -> Optional[dict]:
    if isinstance(url_raw, list) and url_raw:
        att = url_raw[0]
        return {"url": att.get("url", ""), "filename": att.get("filename", ""),
                "width": att.get("width"), "height": att.get("height")}
    if isinstance(url_raw, str) and url_raw:
        return {"url": url_raw, "filename": ""}
    return None

def _parse_decimal(val) -> Optional[Decimal]:
    if val is None or val == "": return None
    try: return Decimal(str(val))
    except: return None

def _parse_date(val) -> Optional[date]:
    if val is None or val == "": return None
    if isinstance(val, date): return val
    try: return date.fromisoformat(str(val)[:10])
    except: return None

def _parse_select(val) -> Optional[str]:
    if isinstance(val, str): return val
    if isinstance(val, list) and val: return str(val[0]) if isinstance(val[0], str) else val[0].get("name", "")
    return None

def _parse_tags(val) -> list[str]:
    if isinstance(val, list): return [str(t) for t in val]
    if isinstance(val, str): return [t.strip() for t in val.split(",") if t.strip()]
    return []


def _build_backoffice(record: dict, role: str) -> dict:
    fields = record.get("fields", {})
    id_ = record["id"]

    base = {
        "id": id_,
        "NOMBRE_PUBLICO_PRODUCTO": fields.get("NOMBRE_PUBLICO_PRODUCTO", ""),
        "PRECIO_WEB": _parse_decimal(fields.get("PRECIO_WEB")),
        "PRECIO_PUBLICITADO_WEB": _parse_decimal(fields.get("PRECIO_PUBLICITADO_WEB")),
        "IMAGEN_PORTADA_WEB": _parse_image(fields.get("IMAGEN_PORTADA_WEB")),
        "TIPO_PUBLICACION_WEB": _parse_select(fields.get("TIPO_PUBLICACION_WEB")) or "NORMAL",
        "ESTADO_DISPONIBILIDAD_WEB": _parse_select(fields.get("ESTADO_DISPONIBILIDAD_WEB")),
        "MOSTRAR_DISPONIBILIDAD_WEB": bool(fields.get("MOSTRAR_DISPONIBILIDAD_WEB")),
        "DISPONIBILIDAD_VISIBLE_WEB": fields.get("DISPONIBILIDAD_VISIBLE_WEB"),
        "PROMO_EN_DESTACADO": bool(fields.get("PROMO_EN_DESTACADO")),
        "ACTIVO_EN_WEB": bool(fields.get("ACTIVO_EN_WEB", True)),
        "ESTADO_WEB": _parse_select(fields.get("ESTADO_WEB")) or "BORRADOR",
        "ORDEN_WEB": fields.get("ORDEN_WEB", 0) or 0,
        "CTA_TEXTO": fields.get("CTA_TEXTO"),
        "ENVIO_DISPONIBLE": bool(fields.get("ENVIO_DISPONIBLE")),
        "RETIRO_EN_LOCAL": bool(fields.get("RETIRO_EN_LOCAL")),
        "DESCRIPCION_WEB": fields.get("DESCRIPCION_WEB"),
        "URL_DETALLE_WEB": fields.get("URL_DETALLE_WEB"),
        "URL_COMPRA_DIRECTA": fields.get("URL_COMPRA_DIRECTA"),
        "VENTA_HABILITADA_WEB": bool(fields.get("VENTA_HABILITADA_WEB")),
        "CARRITO_HABILITADO": bool(fields.get("CARRITO_HABILITADO")),
        "TIENDA_WEB": bool(fields.get("TIENDA_WEB")),
        "FUNNEL_VENTA": bool(fields.get("FUNNEL_VENTA")),
        "COMENTARIOS_RESEÑAS_HABILITADOS": bool(fields.get("COMENTARIOS_RESEÑAS_HABILITADOS")),
        "VISIBILIDAD_WEB": _parse_select(fields.get("VISIBILIDAD_WEB")) or "OCULTO",
        "FECHA_CREACION": _parse_date(fields.get("FECHA_CREACION")),
        "FECHA_PUBLICACION_WEB": _parse_date(fields.get("FECHA_PUBLICACION_WEB")),
        "FECHA_DESPUBLICACION_WEB": _parse_date(fields.get("FECHA_DESPUBLICACION_WEB")),
        "ULTIMA_ACTUALIZACION": _parse_date(fields.get("ULTIMA_ACTUALIZACION")),
        "COMPORTAMIENTO_SIN_DISPONIBILIDAD": _parse_select(fields.get("COMPORTAMIENTO_SIN_DISPONIBILIDAD")),
        "PRODUCTO": _parse_select(fields.get("PRODUCTO")),
        "CARRITO_ITEMS": fields.get("CARRITO_ITEMS", []) or [],
        "SEO_SLUG_WEB": fields.get("SEO_SLUG_WEB"),
        "SEO_TITULO": fields.get("SEO_TITULO"),
        "SEO_DESCRIPCION": fields.get("SEO_DESCRIPCION"),
        "SEO_TAGS_KEYWORDS": _parse_tags(fields.get("SEO_TAGS_KEYWORDS")),
    }

    if role in ROLES_IA_VISIBLE:
        base["ia"] = {
            "texto_promocional": fields.get("AGENTE_TEXTO_PROMOCIONAL_AI"),
            "categoria_web": _parse_select(fields.get("AGENTE_CATEGORIZACION_WEB_AI")),
            "riesgo_publicacion": fields.get("RIESGO_PUBLICACION_PRODUCTO_WEB_AI"),
            "nivel_riesgo": _parse_select(fields.get("NIVEL_RIESGO_PUBLICACION_AI")),
            "accion_recomendada": _parse_select(fields.get("ACCION_RECOMENDADA_PUBLICACION_AI")),
        }
        base["revision"] = {
            "estado": _parse_select(fields.get("ESTADO_REVISION_IA_WEB")),
            "texto_aprobado": fields.get("TEXTO_PROMOCIONAL_APROBADO_WEB"),
            "categoria_aprobada": fields.get("CATEGORIA_WEB_APROBADA_MANUAL"),
            "aprobado_frontend": bool(fields.get("APROBADO_USO_FRONTEND_IA")),
            "fecha_revision": _parse_date(fields.get("FECHA_REVISION_IA_WEB")),
            "revisor": fields.get("REVISOR_IA_WEB"),
            "motivo": fields.get("MOTIVO_REVISION_IA_WEB"),
            "alerta": fields.get("ALERTA_REVISION_IA_WEB"),
            "color_alerta": fields.get("COLOR_ALERTA_REVISION_IA_WEB"),
        }
    else:
        base["ia"] = None
        base["revision"] = None

    base["seo"] = {
        "slug": base.pop("SEO_SLUG_WEB", None),
        "titulo": base.pop("SEO_TITULO", None),
        "descripcion": base.pop("SEO_DESCRIPCION", None),
        "tags": base.pop("SEO_TAGS_KEYWORDS", []),
    }

    return base


def _pasa_gate(fields: dict) -> bool:
    return (
        bool(fields.get("APROBADO_USO_FRONTEND_IA")) is True
        and _parse_select(fields.get("ESTADO_REVISION_IA_WEB")) == "APROBADO"
        and _parse_select(fields.get("ESTADO_WEB")) == "PUBLICADO"
        and _parse_select(fields.get("VISIBILIDAD_WEB")) == "PUBLICO"
        and bool(fields.get("ACTIVO_EN_WEB", False)) is True
    )


def _build_tienda_card(record: dict) -> dict:
    fields = record.get("fields", {})
    return {
        "id": record["id"],
        "NOMBRE_PUBLICO_PRODUCTO": fields.get("NOMBRE_PUBLICO_PRODUCTO", ""),
        "PRECIO_WEB": _parse_decimal(fields.get("PRECIO_WEB")),
        "PRECIO_PUBLICITADO_WEB": _parse_decimal(fields.get("PRECIO_PUBLICITADO_WEB")),
        "IMAGEN_PORTADA_WEB": _parse_image(fields.get("IMAGEN_PORTADA_WEB")),
        "TIPO_PUBLICACION_WEB": _parse_select(fields.get("TIPO_PUBLICACION_WEB")) or "NORMAL",
        "ESTADO_DISPONIBILIDAD_WEB": _parse_select(fields.get("ESTADO_DISPONIBILIDAD_WEB")),
        "MOSTRAR_DISPONIBILIDAD_WEB": bool(fields.get("MOSTRAR_DISPONIBILIDAD_WEB")),
        "DISPONIBILIDAD_VISIBLE_WEB": fields.get("DISPONIBILIDAD_VISIBLE_WEB"),
        "PROMO_EN_DESTACADO": bool(fields.get("PROMO_EN_DESTACADO")),
        "CTA_TEXTO": fields.get("CTA_TEXTO"),
        "ENVIO_DISPONIBLE": bool(fields.get("ENVIO_DISPONIBLE")),
        "RETIRO_EN_LOCAL": bool(fields.get("RETIRO_EN_LOCAL")),
        "VENTA_HABILITADA_WEB": bool(fields.get("VENTA_HABILITADA_WEB")),
        "CARRITO_HABILITADO": bool(fields.get("CARRITO_HABILITADO")),
        "TIENDA_WEB": bool(fields.get("TIENDA_WEB")),
        "FUNNEL_VENTA": bool(fields.get("FUNNEL_VENTA")),
        "COMENTARIOS_RESEÑAS_HABILITADOS": bool(fields.get("COMENTARIOS_RESEÑAS_HABILITADOS")),
        "SEO_SLUG_WEB": fields.get("SEO_SLUG_WEB"),
        "COMPORTAMIENTO_SIN_DISPONIBILIDAD": _parse_select(fields.get("COMPORTAMIENTO_SIN_DISPONIBILIDAD")),
    }


def _build_tienda_detalle(record: dict) -> dict:
    card = _build_tienda_card(record)
    fields = record.get("fields", {})
    descripcion_publica = fields.get("TEXTO_PROMOCIONAL_APROBADO_WEB") or None
    categoria_publica = fields.get("CATEGORIA_WEB_APROBADA_MANUAL") or None
    card["descripcion_publica"] = descripcion_publica
    card["categoria_publica"] = categoria_publica
    card["URL_DETALLE_WEB"] = fields.get("URL_DETALLE_WEB")
    card["URL_COMPRA_DIRECTA"] = fields.get("URL_COMPRA_DIRECTA")
    card["SEO_TITULO"] = fields.get("SEO_TITULO")
    card["SEO_DESCRIPCION"] = fields.get("SEO_DESCRIPCION")
    card["SEO_TAGS_KEYWORDS"] = _parse_tags(fields.get("SEO_TAGS_KEYWORDS"))
    return card


# ── Funciones públicas ──

def listar_backoffice(role: str = "SOLO_LECTURA") -> list[dict]:
    client = _get_client()
    records = client.list_records(TABLE_NAME)
    return [_build_backoffice(r, role) for r in records]


def obtener_backoffice(record_id: str, role: str = "SOLO_LECTURA") -> Optional[dict]:
    client = _get_client()
    record = client.get_record(TABLE_NAME, record_id)
    if not record: return None
    return _build_backoffice(record, role)


def listar_tienda() -> list[dict]:
    client = _get_client()
    records = client.list_records(TABLE_NAME)
    result = []
    for r in records:
        if _pasa_gate(r.get("fields", {})):
            result.append(_build_tienda_card(r))
    return result


def obtener_tienda_por_slug(slug: str) -> Optional[dict]:
    client = _get_client()
    records = client.list_records(TABLE_NAME)
    for r in records:
        fields = r.get("fields", {})
        if fields.get("SEO_SLUG_WEB") == slug and _pasa_gate(fields):
            return _build_tienda_detalle(r)
    return None
