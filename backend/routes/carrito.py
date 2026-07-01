"""
Sandbox cart endpoints for the client portal.

PORTAL_CLIENTE_UX_COMMERCE_P4:
- Writes are limited to CARRITOS and CARRITO_ITEMS.
- Cart items can be PRODUCTO_WEB, SERVICIO_WEB or PACK.
- Marketing rules are exposed as recommendations/coupons/promotions only.
- No checkout sessions, payments, POS/caja, VENTAS, ITEMS_VENTA or RESERVAS.
- DELETE is logical: items are marked CANCELADO/ACTIVO=false.
"""
import sys
from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.dependencies import get_current_user
from services.productos_web_service import listar_productos_web_publico
from routes.commerce_public import (
    _coupon_is_public,
    _pack_is_public,
    _promotion_is_public,
    _public_coupon,
    _public_pack,
    _public_promotion,
)

router = APIRouter(prefix="/api", tags=["carrito-sandbox"])

_SANDBOX_NOTE = "QA/SANDBOX — carrito demo. No convertir a venta, pago, checkout ni caja/POS."
_ACTIVE_CART_STATES = {"NUEVO", "EN_CURSO", "ABIERTO", "EN_PROCESO", "PENDIENTE_CONTACTO"}
_ACTIVE_ITEM_STATES = {"ACTIVO", "PENDIENTE", "RESERVADO", "EN_PROCESO"}
_ALLOWED_ITEM_TYPES = {"PRODUCTO_WEB", "SERVICIO_WEB", "PACK"}
_BLOCKED_OPERATIONS = [
    "CHECKOUT",
    "ONLINE_PAYMENT",
    "POS_SALE",
    "CREATE_VENTA",
    "CREATE_ITEM_VENTA",
    "CREATE_PAGO_COBRO",
    "RESERVE_STOCK",
    "CREATE_RESERVAS",
]


class AddCartItemRequest(BaseModel):
    item_type: str = Field(default="PRODUCTO_WEB")
    item_id: str | None = Field(default=None)
    product_id: str | None = Field(default=None)
    service_web_id: str | None = Field(default=None)
    pack_id: str | None = Field(default=None)
    quantity: int = Field(default=1, ge=1, le=20)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=20)


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _first_id(value) -> str:
    ids = [str(item).strip() for item in _as_list(value) if str(item).strip()]
    return ids[0] if ids else ""


def _text(value, default="") -> str:
    return str(value or default).strip()


def _select(value, default="") -> str:
    if isinstance(value, list) and value:
        value = value[0]
    return _text(value, default).upper()


def _to_bool(value, default=False):
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"true", "1", "si", "sí", "yes", "activo", "activa", "publico", "público"}:
        return True
    if text in {"false", "0", "no", "inactivo", "inactiva", "oculto"}:
        return False
    return default


def _number(value, default=0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _image(value):
    if isinstance(value, list) and value:
        att = value[0] or {}
        if isinstance(att, dict):
            thumb = (att.get("thumbnails") or {}).get("large") or (att.get("thumbnails") or {}).get("full") or {}
            return {
                "url": thumb.get("url") or att.get("url", ""),
                "filename": att.get("filename", ""),
                "width": thumb.get("width") or att.get("width"),
                "height": thumb.get("height") or att.get("height"),
            }
    if isinstance(value, dict) and value.get("url"):
        return {"url": value.get("url", ""), "filename": value.get("filename", "")}
    if isinstance(value, str) and value.strip():
        return {"url": value.strip(), "filename": ""}
    return None


def _today() -> str:
    return date.today().isoformat()


def _normalize_item_type(value: str | None) -> str:
    item_type = _select(value or "PRODUCTO_WEB")
    aliases = {
        "PRODUCTO": "PRODUCTO_WEB",
        "PRODUCT": "PRODUCTO_WEB",
        "SERVICIO": "SERVICIO_WEB",
        "SERVICE": "SERVICIO_WEB",
        "PACKS": "PACK",
    }
    item_type = aliases.get(item_type, item_type)
    if item_type not in _ALLOWED_ITEM_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de item no permitido para carrito sandbox.")
    return item_type


def _payload_item_id(payload: AddCartItemRequest, item_type: str) -> str:
    candidates = {
        "PRODUCTO_WEB": payload.product_id or payload.item_id,
        "SERVICIO_WEB": payload.service_web_id or payload.item_id,
        "PACK": payload.pack_id or payload.item_id,
    }
    item_id = _text(candidates.get(item_type))
    if not item_id.startswith("rec"):
        raise HTTPException(status_code=400, detail="ID de item inválido.")
    return item_id


def _require_client_context(user: dict) -> str:
    role = str(user.get("rol") or "").upper()
    if role != "CLIENTE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El carrito web sandbox está habilitado solo para usuarios CLIENTE.",
        )
    cliente_id = str(user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="Usuario sin CLIENTE vinculado.")
    return cliente_id


def _safe_client_reference(at: AirtableClient, cliente_id: str, user: dict) -> dict:
    try:
        record = at.get_record("CLIENTES", cliente_id)
        fields = record.get("fields", {})
    except Exception:
        fields = {}
    return {
        "NOMBRE_CLIENTE_REFERENCIA": fields.get("NOMBRE_CLIENTE") or user.get("nombre") or "Cliente web",
        "EMAIL_CLIENTE_REFERENCIA": fields.get("EMAIL") or user.get("email") or "",
        "TELEFONO_CLIENTE_REFERENCIA": fields.get("TELEFONO") or "",
    }


def _public_products_by_id() -> dict[str, dict]:
    data = listar_productos_web_publico()
    return {item.get("id"): item for item in data.get("productos", []) if item.get("id")}


def _public_services_by_id(at: AirtableClient) -> dict[str, dict]:
    records = at.list_records("SERVICIOS_WEB", by_name=True)
    servicio_cache: dict[str, dict] = {}
    items: dict[str, dict] = {}
    for record in records:
        fields = dict(record.get("fields", {}))
        servicio_id = _first_id(fields.get("SERVICIO"))
        servicio_fields = {}
        if servicio_id:
            if servicio_id not in servicio_cache:
                try:
                    servicio_cache[servicio_id] = at.get_record("SERVICIOS", servicio_id).get("fields", {})
                except Exception:
                    servicio_cache[servicio_id] = {}
            servicio_fields = servicio_cache[servicio_id]
        nombre = fields.get("NOMBRE_PUBLICO_SERVICIO") or fields.get("NOMBRE_SERVICIO") or servicio_fields.get("NOMBRE_SERVICIO") or ""
        if not _text(nombre):
            continue
        if _select(fields.get("ESTADO_WEB"), "PUBLICADO") in {"BORRADOR", "RETIRADO", "PAUSADO"}:
            continue
        if _select(fields.get("VISIBILIDAD_WEB"), "PUBLICO") in {"PRIVADO", "OCULTO", "INTERNO"}:
            continue
        if fields.get("ACTIVO_EN_WEB") is False:
            continue
        imagen = _image(fields.get("IMAGEN_PRINCIPAL_SERVICIO")) or _image(servicio_fields.get("FOTO_SERVICIO"))
        price = _number(fields.get("PRECIO_PUBLICITADO_WEB"), None)
        if price is None or price <= 0:
            price = _number(fields.get("PRECIO_WEB"), None)
        if price is None or price <= 0:
            price = _number(servicio_fields.get("PRECIO_BASE"), None)
        items[record["id"]] = {
            "id": record["id"],
            "type": "SERVICIO_WEB",
            "name": nombre,
            "description": fields.get("DESCRIPCION_WEB") or fields.get("DESCRIPCION") or servicio_fields.get("DESCRIPCION_COMERCIAL") or "",
            "price": float(price) if price is not None else None,
            "image": imagen,
            "category": fields.get("CATEGORIA_WEB") or fields.get("CATEGORIA_SERVICIO") or servicio_fields.get("CATEGORIA_SERVICIO") or "",
            "slug": fields.get("SLUG_WEB") or record["id"],
            "cart_enabled": _to_bool(fields.get("CARRITO_HABILITADO")) or _to_bool(fields.get("VENTA_HABILITADA_WEB")),
            "reservable": _to_bool(fields.get("SERVICIO_RESERVABLE_WEB")) or _to_bool(fields.get("RESERVA_ONLINE_HABILITADA"), True),
            "availability": _select(fields.get("ESTADO_DISPONIBILIDAD_WEB"), "DISPONIBLE"),
        }
    return items


def _public_packs_by_id(at: AirtableClient) -> dict[str, dict]:
    records = at.list_records("PACKS", by_name=True)
    items: dict[str, dict] = {}
    for record in records:
        if not _pack_is_public(record):
            continue
        pack = _public_pack(record)
        price = pack.get("price_promo") or pack.get("price_list")
        items[record["id"]] = {
            "id": record["id"],
            "type": "PACK",
            "name": pack.get("title") or "Pack",
            "description": pack.get("description") or "",
            "price": float(price) if price is not None else None,
            "image": pack.get("image"),
            "category": pack.get("category") or "",
            "slug": pack.get("slug") or record["id"],
            "allows_purchase": bool(pack.get("allows_purchase")),
            "allows_reservation": bool(pack.get("allows_reservation")),
        }
    return items


def _get_public_cart_item(at: AirtableClient, item_type: str, item_id: str) -> dict:
    if item_type == "PRODUCTO_WEB":
        public = _public_products_by_id().get(item_id)
        if not public:
            raise HTTPException(status_code=404, detail="Producto no disponible en la tienda pública.")
        raw = at.get_record("PRODUCTOS_WEB", item_id)
        fields = raw.get("fields", {})
        if not (_to_bool(fields.get("CARRITO_HABILITADO")) or _to_bool(fields.get("VENTA_HABILITADA_WEB"))):
            raise HTTPException(status_code=409, detail="Este producto no tiene carrito habilitado.")
        disponibilidad = _select(fields.get("ESTADO_DISPONIBILIDAD_WEB") or public.get("availability_state") or public.get("disponibilidad_visible"))
        if disponibilidad in {"SIN_STOCK", "BAJA_TEMPORAL", "SUSPENDIDO"}:
            raise HTTPException(status_code=409, detail="Producto no disponible para agregar al carrito.")
        price = _number(public.get("precio_visible"), None)
        if price is None or price <= 0:
            price = _number(fields.get("PRECIO_PUBLICITADO_WEB") or fields.get("PRECIO_WEB"), None)
        if price is None or price <= 0:
            raise HTTPException(status_code=409, detail="Producto sin precio válido para carrito.")
        return {
            "id": item_id,
            "item_type": "PRODUCTO_WEB",
            "link_field": "PRODUCTO_WEB",
            "unit": "UNIDAD",
            "name": public.get("nombre_visible") or "Producto",
            "description": public.get("descripcion_visible") or "",
            "price": float(price),
            "requires_turn": False,
            "requires_stock": False,
        }

    if item_type == "SERVICIO_WEB":
        public = _public_services_by_id(at).get(item_id)
        if not public:
            raise HTTPException(status_code=404, detail="Servicio no disponible en el catálogo público.")
        if not public.get("cart_enabled"):
            raise HTTPException(status_code=409, detail="Este servicio no tiene carrito habilitado.")
        if public.get("availability") in {"AGOTADO", "PAUSADO", "NO_DISPONIBLE"}:
            raise HTTPException(status_code=409, detail="Servicio no disponible para agregar al carrito.")
        if public.get("price") is None or public.get("price") <= 0:
            raise HTTPException(status_code=409, detail="Servicio sin precio válido para carrito.")
        return {
            "id": item_id,
            "item_type": "SERVICIO_WEB",
            "link_field": "SERVICIO_WEB",
            "unit": "SERVICIO",
            "name": public.get("name") or "Servicio",
            "description": public.get("description") or "",
            "price": float(public["price"]),
            "requires_turn": bool(public.get("reservable")),
            "requires_stock": False,
        }

    public = _public_packs_by_id(at).get(item_id)
    if not public:
        raise HTTPException(status_code=404, detail="Pack no disponible para web.")
    if not (public.get("allows_purchase") or public.get("allows_reservation")):
        raise HTTPException(status_code=409, detail="Este pack no está habilitado para carrito.")
    if public.get("price") is None or public.get("price") <= 0:
        raise HTTPException(status_code=409, detail="Pack sin precio válido para carrito.")
    return {
        "id": item_id,
        "item_type": "PACK",
        "link_field": "PACK",
        "unit": "PACK",
        "name": public.get("name") or "Pack",
        "description": public.get("description") or "",
        "price": float(public["price"]),
        "requires_turn": bool(public.get("allows_reservation")),
        "requires_stock": False,
    }


def _cart_links_client(fields: dict, cliente_id: str) -> bool:
    return cliente_id in [str(item) for item in _as_list(fields.get("CLIENTE"))]


def _is_active_cart(fields: dict) -> bool:
    estado = str(fields.get("ESTADO_CARRITO") or "").upper()
    return _to_bool(fields.get("ACTIVO"), True) and estado in _ACTIVE_CART_STATES


def _find_active_cart(at: AirtableClient, cliente_id: str) -> dict | None:
    records = at.list_records("CARRITOS", by_name=True)
    candidates = [
        record for record in records
        if _cart_links_client(record.get("fields", {}), cliente_id)
        and _is_active_cart(record.get("fields", {}))
        and "SANDBOX" in str(record.get("fields", {}).get("OBSERVACIONES_INTERNAS") or "").upper()
    ]
    if not candidates:
        candidates = [
            record for record in records
            if _cart_links_client(record.get("fields", {}), cliente_id)
            and _is_active_cart(record.get("fields", {}))
            and str(record.get("fields", {}).get("ORIGEN_CARRITO") or "").upper() == "WEB"
        ]
    candidates.sort(key=lambda record: record.get("createdTime") or "", reverse=True)
    return candidates[0] if candidates else None


def _create_cart(at: AirtableClient, cliente_id: str, user: dict) -> dict:
    today = _today()
    code = f"WEB-SBX-{uuid4().hex[:10].upper()}"
    fields = {
        "NOMBRE_CARRITO": f"Carrito sandbox {user.get('nombre') or user.get('email') or cliente_id}",
        "CODIGO_CARRITO": code,
        "ORIGEN_CARRITO": "WEB",
        "TIPO_CARRITO": "MIXTO",
        "ESTADO_CARRITO": "EN_CURSO",
        "MONEDA": "ARS",
        "CLIENTE": [cliente_id],
        "CANTIDAD_ITEMS_ESTIMADA": 0,
        "SUBTOTAL_CARRITO": 0,
        "DESCUENTO_TOTAL": 0,
        "RECARGO_TOTAL": 0,
        "MONTO_PAGADO": 0,
        "REQUIERE_TURNO": False,
        "REQUIERE_STOCK": False,
        "ESTADO_RESERVA_STOCK": "NO_INICIADA",
        "ESTADO_RESERVA_TURNO": "NO_INICIADA",
        "CANAL_CONTACTO_PREFERIDO": "WHATSAPP",
        "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
        "ACTIVO": True,
        "FECHA_CREACION_CARRITO": today,
        "FECHA_ULTIMA_ACTIVIDAD": today,
        "FECHA_CREACION": today,
        "ULTIMA_ACTUALIZACION": today,
        **_safe_client_reference(at, cliente_id, user),
    }
    return at.create_record("CARRITOS", fields)


def _get_or_create_cart(at: AirtableClient, cliente_id: str, user: dict) -> dict:
    return _find_active_cart(at, cliente_id) or _create_cart(at, cliente_id, user)


def _item_is_active(fields: dict) -> bool:
    estado = str(fields.get("ESTADO_ITEM_CARRITO") or "").upper()
    return _to_bool(fields.get("ACTIVO"), True) and estado in _ACTIVE_ITEM_STATES


def _cart_items(at: AirtableClient, cart_id: str) -> list[dict]:
    records = at.list_records("CARRITO_ITEMS", by_name=True)
    return [record for record in records if cart_id == _first_id(record.get("fields", {}).get("CARRITO"))]


def _item_link_id(fields: dict, item_type: str) -> str:
    if item_type == "SERVICIO_WEB":
        return _first_id(fields.get("SERVICIO_WEB"))
    if item_type == "PACK":
        return _first_id(fields.get("PACK"))
    return _first_id(fields.get("PRODUCTO_WEB"))


def _find_active_cart_item(at: AirtableClient, cart_id: str, item_type: str, item_id: str) -> dict | None:
    for item in _cart_items(at, cart_id):
        fields = item.get("fields", {})
        current_type = _normalize_item_type(fields.get("TIPO_ITEM_CARRITO") or "PRODUCTO_WEB")
        if not _item_is_active(fields) or current_type != item_type:
            continue
        if _item_link_id(fields, current_type) == item_id:
            return item
    return None


def _format_item(record: dict, maps: dict[str, dict[str, dict]] | None = None) -> dict:
    fields = record.get("fields", {})
    item_type = _normalize_item_type(fields.get("TIPO_ITEM_CARRITO") or "PRODUCTO_WEB")
    item_id = _item_link_id(fields, item_type)
    maps = maps or {}
    source = (maps.get(item_type) or {}).get(item_id, {})
    name = fields.get("NOMBRE_ITEM_MANUAL") or source.get("nombre_visible") or source.get("name") or source.get("title") or fields.get("NOMBRE_CARRITO_ITEM") or "Item"
    description = fields.get("DESCRIPCION_ITEM") or source.get("descripcion_visible") or source.get("description") or ""
    image = None
    if item_type == "PRODUCTO_WEB":
        image = (source.get("imagen_principal") or {}).get("url") if isinstance(source.get("imagen_principal"), dict) else None
    else:
        image = (source.get("image") or {}).get("url") if isinstance(source.get("image"), dict) else None
    quantity = _number(fields.get("CANTIDAD"), 0)
    unit_price = _number(fields.get("PRECIO_UNITARIO_REFERENCIA"), 0)
    subtotal = quantity * unit_price
    return {
        "id": record.get("id"),
        "item_type": item_type,
        "item_id": item_id,
        "product_id": item_id if item_type == "PRODUCTO_WEB" else "",
        "service_web_id": item_id if item_type == "SERVICIO_WEB" else "",
        "pack_id": item_id if item_type == "PACK" else "",
        "type": item_type,
        "name": name,
        "description": description,
        "quantity": quantity,
        "unit_price": unit_price,
        "subtotal": subtotal,
        "state": fields.get("ESTADO_ITEM_CARRITO") or "ACTIVO",
        "active": _to_bool(fields.get("ACTIVO"), True),
        "image": image,
        "slug": source.get("slug") or item_id,
        "category": source.get("categoria_publica") or source.get("category") or "",
        "stock_reservation_state": fields.get("ESTADO_RESERVA_STOCK") or "NO_APLICA",
        "turn_reservation_state": fields.get("ESTADO_RESERVA_TURNO") or "NO_APLICA",
        "requires_turn": _to_bool(fields.get("REQUIERE_TURNO_ITEM"), False),
        "requires_stock": _to_bool(fields.get("REQUIERE_STOCK_ITEM"), False),
    }


def _marketing_records(at: AirtableClient) -> dict:
    try:
        promotions = [_public_promotion(record) for record in at.list_records("PROMOCIONES", by_name=True) if _promotion_is_public(record)]
    except Exception:
        promotions = []
    try:
        coupons = [_public_coupon(record) for record in at.list_records("CUPONES", by_name=True) if _coupon_is_public(record)]
    except Exception:
        coupons = []
    return {"promotions": promotions[:4], "coupons": coupons[:4]}


def _cart_recommendations(items: list[dict], maps: dict[str, dict[str, dict]], at: AirtableClient) -> dict:
    in_cart = {(item.get("item_type"), item.get("item_id")) for item in items}
    packs = [
        {
            "item_type": "PACK",
            "item_id": item["id"],
            "title": item.get("name"),
            "description": item.get("description"),
            "price": item.get("price"),
            "image": item.get("image"),
            "category": item.get("category") or "",
            "reason": "Upgrade",
            "cta": "Sumar pack",
        }
        for item in (maps.get("PACK") or {}).values()
        if ("PACK", item.get("id")) not in in_cart and (item.get("allows_purchase") or item.get("allows_reservation"))
    ][:3]
    services = [
        {
            "item_type": "SERVICIO_WEB",
            "item_id": item["id"],
            "title": item.get("name"),
            "description": item.get("description"),
            "price": item.get("price"),
            "image": item.get("image"),
            "category": item.get("category") or "",
            "reason": "Servicio",
            "cta": "Agregar",
        }
        for item in (maps.get("SERVICIO_WEB") or {}).values()
        if ("SERVICIO_WEB", item.get("id")) not in in_cart and item.get("cart_enabled") and item.get("price")
    ][:3]
    products = [
        {
            "item_type": "PRODUCTO_WEB",
            "item_id": item["id"],
            "title": item.get("nombre_visible"),
            "description": item.get("descripcion_visible"),
            "price": item.get("precio_visible"),
            "image": item.get("imagen_principal"),
            "category": item.get("categoria_publica") or "",
            "reason": "Producto",
            "cta": "Agregar",
        }
        for item in (maps.get("PRODUCTO_WEB") or {}).values()
        if ("PRODUCTO_WEB", item.get("id")) not in in_cart and item.get("cart_enabled") and item.get("precio_visible")
    ][:3]
    marketing = _marketing_records(at)
    return {
        "upsell": packs,
        "cross_sell": products + services,
        "promotions": marketing["promotions"],
        "coupons": marketing["coupons"],
        "rules_applied": [],
        "message": "Reglas de marketing visibles en modo sandbox. No se aplica cobro real ni checkout.",
    }


def _format_cart(cart: dict | None, at: AirtableClient | None = None) -> dict:
    at = at or AirtableClient()
    maps = {
        "PRODUCTO_WEB": _public_products_by_id(),
        "SERVICIO_WEB": _public_services_by_id(at),
        "PACK": _public_packs_by_id(at),
    }
    cart_fields = cart.get("fields", {}) if cart else {}
    cart_id = cart.get("id") if cart else None
    raw_items = _cart_items(at, cart_id) if cart_id else []
    items = [_format_item(item, maps) for item in raw_items if _item_is_active(item.get("fields", {}))]
    total_items = sum(int(item["quantity"]) for item in items)
    subtotal = sum(item["subtotal"] for item in items)
    requires_turn = any(item.get("requires_turn") for item in items)
    requires_stock = any(item.get("requires_stock") for item in items)
    return {
        "id": cart_id,
        "state": cart_fields.get("ESTADO_CARRITO") or "EMPTY",
        "code": cart_fields.get("CODIGO_CARRITO") or "",
        "currency": cart_fields.get("MONEDA") or "ARS",
        "items": items,
        "total_items": total_items,
        "subtotal": subtotal,
        "discount_total": 0,
        "surcharge_total": 0,
        "total": subtotal,
        "requires_turn": requires_turn,
        "requires_stock": requires_stock,
        "marketing": _cart_recommendations(items, maps, at),
        "sandbox": True,
        "cart_enabled": True,
        "checkout_enabled": False,
        "online_payments_enabled": False,
        "physical_pos_enabled": False,
        "message": "Carrito sandbox activo. Checkout, pagos y caja/POS siguen desactivados.",
        "blocked_operations": _BLOCKED_OPERATIONS,
    }


def _sync_cart_totals(at: AirtableClient, cart_id: str):
    cart = at.get_record("CARRITOS", cart_id)
    dto = _format_cart(cart, at)
    item_types = {item.get("item_type") for item in dto["items"] if item.get("item_type")}
    if not item_types:
        cart_type = "WEB"
    elif item_types == {"PRODUCTO_WEB"}:
        cart_type = "COMPRA_PRODUCTO"
    elif item_types == {"SERVICIO_WEB"}:
        cart_type = "RESERVA_SERVICIO"
    elif item_types == {"PACK"}:
        cart_type = "PACK"
    else:
        cart_type = "MIXTO"
    at.patch_record(
        "CARRITOS",
        cart_id,
        {
            "TIPO_CARRITO": cart_type,
            "CANTIDAD_ITEMS_ESTIMADA": dto["total_items"],
            "SUBTOTAL_CARRITO": dto["subtotal"],
            "FECHA_ULTIMA_ACTIVIDAD": _today(),
            "ULTIMA_ACTUALIZACION": _today(),
            "MONTO_PAGADO": 0,
            "REQUIERE_TURNO": dto["requires_turn"],
            "REQUIERE_STOCK": dto["requires_stock"],
        },
    )


@router.get("/carrito")
async def obtener_carrito(response: Response, user: dict = Depends(get_current_user)):
    """Return the active sandbox cart for the authenticated CLIENTE without creating records."""
    response.headers["Cache-Control"] = "no-store, max-age=0"
    cliente_id = _require_client_context(user)
    at = AirtableClient()
    cart = _find_active_cart(at, cliente_id)
    return _format_cart(cart, at)


@router.post("/carrito/items", status_code=status.HTTP_201_CREATED)
async def agregar_item_carrito(payload: AddCartItemRequest, user: dict = Depends(get_current_user)):
    """Add PRODUCTO_WEB, SERVICIO_WEB or PACK to the sandbox cart. No stock reservation and no checkout."""
    cliente_id = _require_client_context(user)
    item_type = _normalize_item_type(payload.item_type)
    item_id = _payload_item_id(payload, item_type)
    at = AirtableClient()
    item_data = _get_public_cart_item(at, item_type, item_id)
    cart = _get_or_create_cart(at, cliente_id, user)
    cart_id = cart["id"]
    current_item = _find_active_cart_item(at, cart_id, item_type, item_id)
    today = _today()

    if current_item:
        fields = current_item.get("fields", {})
        new_quantity = min(20, int(_number(fields.get("CANTIDAD"), 0)) + payload.quantity)
        at.patch_record(
            "CARRITO_ITEMS",
            current_item["id"],
            {
                "CANTIDAD": new_quantity,
                "ULTIMA_ACTUALIZACION": today,
                "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
            },
        )
    else:
        item_count = len([item for item in _cart_items(at, cart_id) if _item_is_active(item.get("fields", {}))])
        fields = {
            "NOMBRE_CARRITO_ITEM": f"{item_data['name']} x{payload.quantity}",
            "CARRITO": [cart_id],
            "TIPO_ITEM_CARRITO": item_type,
            item_data["link_field"]: [item_id],
            "NOMBRE_ITEM_MANUAL": item_data["name"],
            "DESCRIPCION_ITEM": item_data.get("description") or "",
            "CANTIDAD": payload.quantity,
            "UNIDAD_ITEM": item_data["unit"],
            "PRECIO_UNITARIO_REFERENCIA": item_data["price"],
            "REQUIERE_TURNO_ITEM": item_data["requires_turn"],
            "REQUIERE_STOCK_ITEM": item_data["requires_stock"],
            "RESERVA_STOCK_SOLICITADA": False,
            "ESTADO_RESERVA_STOCK": "NO_APLICA",
            "ESTADO_RESERVA_TURNO": "PENDIENTE" if item_data["requires_turn"] else "NO_APLICA",
            "ORDEN_ITEM": item_count + 1,
            "ESTADO_ITEM_CARRITO": "ACTIVO",
            "CONVERTIDO_A_ITEM_VENTA": False,
            "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
            "ACTIVO": True,
            "FECHA_CREACION": today,
            "ULTIMA_ACTUALIZACION": today,
        }
        at.create_record("CARRITO_ITEMS", fields)

    _sync_cart_totals(at, cart_id)
    updated = at.get_record("CARRITOS", cart_id)
    return _format_cart(updated, at)


@router.patch("/carrito/items/{item_id}")
async def actualizar_item_carrito(item_id: str, payload: UpdateCartItemRequest, user: dict = Depends(get_current_user)):
    """Update quantity for a cart item owned by the authenticated CLIENTE."""
    cliente_id = _require_client_context(user)
    at = AirtableClient()
    cart = _find_active_cart(at, cliente_id)
    if not cart:
        raise HTTPException(status_code=404, detail="No hay carrito activo.")

    item = at.get_record("CARRITO_ITEMS", item_id)
    fields = item.get("fields", {})
    if _first_id(fields.get("CARRITO")) != cart["id"] or not _item_is_active(fields):
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito activo.")

    at.patch_record(
        "CARRITO_ITEMS",
        item_id,
        {
            "CANTIDAD": payload.quantity,
            "ULTIMA_ACTUALIZACION": _today(),
            "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
        },
    )
    _sync_cart_totals(at, cart["id"])
    updated = at.get_record("CARRITOS", cart["id"])
    return _format_cart(updated, at)


@router.delete("/carrito/items/{item_id}")
async def baja_logica_item_carrito(item_id: str, user: dict = Depends(get_current_user)):
    """Logical delete for a cart item. Never physically deletes Airtable records."""
    cliente_id = _require_client_context(user)
    at = AirtableClient()
    cart = _find_active_cart(at, cliente_id)
    if not cart:
        raise HTTPException(status_code=404, detail="No hay carrito activo.")

    item = at.get_record("CARRITO_ITEMS", item_id)
    fields = item.get("fields", {})
    if _first_id(fields.get("CARRITO")) != cart["id"]:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito.")

    patch = {
        "ESTADO_ITEM_CARRITO": "CANCELADO",
        "ACTIVO": False,
        "ESTADO_RESERVA_STOCK": "LIBERADO",
        "ESTADO_RESERVA_TURNO": "CANCELADO",
        "ULTIMA_ACTUALIZACION": _today(),
        "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
    }
    at.patch_record("CARRITO_ITEMS", item_id, patch)
    _sync_cart_totals(at, cart["id"])
    updated = at.get_record("CARRITOS", cart["id"])
    return {**_format_cart(updated, at), "deleted": False, "baja_logica": True, "item_id": item_id}
