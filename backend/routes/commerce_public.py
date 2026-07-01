"""
Read-only public commerce bootstrap.

This route exposes safe commerce recommendations from existing Airtable tables
without creating carts, checkout sessions, payments, sales, or POS records.
"""
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from services.public_media_service import build_media_index

router = APIRouter(prefix="/api", tags=["commerce-public"])


def _text(value, default=""):
    return str(value or default).strip()


def _select(value, default=""):
    if isinstance(value, list) and value:
        value = value[0]
    return _text(value, default).upper()


def _truthy(value, default=False):
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return _text(value).lower() in {"true", "1", "si", "sí", "yes", "activo", "activa", "aprobado", "aprobada"}


def _yes(value, default=True):
    if value is None or value == "":
        return default
    return _text(value).upper() in {"SI", "SÍ", "TRUE", "1", "YES", "ACTIVO", "ACTIVA"}


def _number(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _image(value):
    if isinstance(value, list) and value:
        att = value[0] or {}
        return {
            "url": att.get("url", ""),
            "filename": att.get("filename", ""),
            "width": att.get("width"),
            "height": att.get("height"),
        }
    if isinstance(value, str) and value.strip():
        return {"url": value.strip(), "filename": ""}
    return None


def _public_pack(record):
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "type": "PACK",
        "title": fields.get("TITULO_WEB") or fields.get("NOMBRE_PACK") or "Pack",
        "description": fields.get("DESCRIPCION_WEB") or "",
        "slug": fields.get("SLUG_WEB") or "",
        "category": fields.get("CATEGORIA_PACK") or fields.get("TIPO_PACK") or "",
        "sale_mode": fields.get("MODALIDAD_VENTA_APLICA") or "",
        "price_list": _number(fields.get("PRECIO_LISTA_PACK")),
        "price_promo": _number(fields.get("PRECIO_PROMOCIONAL_PACK")),
        "image": _image(fields.get("IMAGEN_PACK")),
        "cta": fields.get("CTA_PACK") or "Consultar pack",
        "allows_reservation": _truthy(fields.get("PERMITE_RESERVA_WEB")),
        "allows_purchase": _truthy(fields.get("PERMITE_COMPRA_WEB")),
    }


def _public_promotion(record):
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "type": "PROMOCION",
        "title": fields.get("TITULO_WEB") or fields.get("NOMBRE_PROMOCION") or "Promoción",
        "description": fields.get("DESCRIPCION_WEB") or "",
        "scope": fields.get("ALCANCE_PROMOCION") or "",
        "sale_mode": fields.get("MODALIDAD_VENTA_APLICA") or "",
        "discount_percent": _number(fields.get("DESCUENTO_PORCENTAJE")),
        "discount_amount": _number(fields.get("DESCUENTO_MONTO")),
        "image": _image(fields.get("IMAGEN_PROMOCION")),
        "legal_text": fields.get("TEXTO_LEGAL_PROMOCION") or "",
        "requires_coupon": _truthy(fields.get("REQUIERE_CUPON")),
    }


def _public_coupon(record):
    fields = record.get("fields", {})
    return {
        "id": record.get("id"),
        "type": "CUPON",
        "title": fields.get("NOMBRE_CUPON") or "Cupón",
        "code": fields.get("CODIGO_CUPON") or "",
        "channel": fields.get("CANAL_USO") or "",
        "discount_percent": _number(fields.get("DESCUENTO_PORCENTAJE")),
        "discount_amount": _number(fields.get("DESCUENTO_MONTO")),
        "minimum_purchase": _number(fields.get("COMPRA_MINIMA")),
        "conditions": fields.get("CONDICIONES_USO") or "",
    }


def _pack_is_public(record):
    fields = record.get("fields", {})
    if _select(fields.get("ESTADO_PACK")) != "ACTIVO":
        return False
    if not (_truthy(fields.get("APLICA_WEB")) or _truthy(fields.get("MOSTRAR_EN_WEB"))):
        return False
    if not _yes(fields.get("PACK_VIGENTE_AUTO"), default=True):
        return False
    if fields.get("APROBADO") is False:
        return False
    return True


def _promotion_is_public(record):
    fields = record.get("fields", {})
    if _select(fields.get("ESTADO_PROMOCION")) != "ACTIVA":
        return False
    if not (_truthy(fields.get("APLICA_WEB")) or _truthy(fields.get("MOSTRAR_EN_WEB"))):
        return False
    if not _yes(fields.get("PROMOCION_VIGENTE_AUTO"), default=True):
        return False
    if fields.get("APROBADO") is False:
        return False
    return True


def _coupon_is_public(record):
    fields = record.get("fields", {})
    if _select(fields.get("ESTADO_CUPON")) != "ACTIVO":
        return False
    if not _truthy(fields.get("APLICA_WEB")):
        return False
    channel = _select(fields.get("CANAL_USO"), "WEB")
    if channel not in {"WEB", "MIXTO", "TODAS", "TODOS"}:
        return False
    if not _yes(fields.get("CUPON_VIGENTE_AUTO"), default=True):
        return False
    if fields.get("APROBADO") is False:
        return False
    return True


def _safe_list(client, table_name, predicate, mapper, limit):
    try:
        records = client.list_records(table_name, by_name=True)
    except Exception:
        return [], 0
    items = [mapper(record) for record in records if predicate(record)]
    return items[:limit], len(records)


@router.get("/commerce/public")
async def commerce_public_bootstrap(response: Response):
    """Safe public commerce bootstrap for read-only upsell/cross-sell UX."""
    try:
        response.headers["Cache-Control"] = "no-store, max-age=0"
        client = AirtableClient()
        media_index = build_media_index(client)
        packs, packs_total = _safe_list(client, "PACKS", _pack_is_public, _public_pack, 6)
        promotions, promos_total = _safe_list(client, "PROMOCIONES", _promotion_is_public, _public_promotion, 6)
        coupons, coupons_total = _safe_list(client, "CUPONES", _coupon_is_public, _public_coupon, 6)
        for item in packs:
            item["media"] = media_index.get("pack", {}).get(item.get("id"), [])
        for item in promotions:
            item["media"] = media_index.get("promotion", {}).get(item.get("id"), [])
        for item in coupons:
            item["media"] = media_index.get("coupon", {}).get(item.get("id"), [])
        return {
            "status": "SANDBOX_COMMERCE_BOOTSTRAP",
            "cart_enabled": True,
            "cart_mode": "SANDBOX",
            "checkout_enabled": False,
            "online_payments_enabled": False,
            "physical_pos_enabled": False,
            "message": "Carrito sandbox activo. Checkout, pagos y caja/POS no están activos en esta fase.",
            "packs": packs,
            "promotions": promotions,
            "coupons": coupons,
            "counts": {
                "packs_public": len(packs),
                "promotions_public": len(promotions),
                "coupons_public": len(coupons),
                "packs_total": packs_total,
                "promotions_total": promos_total,
                "coupons_total": coupons_total,
            },
            "blocked_operations": [
                "CHECKOUT",
                "PAYMENT",
                "POS_SALE",
                "CREATE_VENTA",
                "CREATE_ITEM_VENTA",
                "CREATE_PAGO_COBRO",
                "CREATE_RESERVAS",
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
