"""
Sandbox cart endpoints for the client portal.

COMMERCE_MUTATION_P3_CART_CHECKOUT_SANDBOX:
- Writes are limited to CARRITOS and CARRITO_ITEMS.
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

router = APIRouter(prefix="/api", tags=["carrito-sandbox"])

_SANDBOX_NOTE = "QA/SANDBOX — carrito demo. No convertir a venta, pago, checkout ni caja/POS."
_ACTIVE_CART_STATES = {"NUEVO", "EN_CURSO", "ABIERTO", "EN_PROCESO", "PENDIENTE_CONTACTO"}
_ACTIVE_ITEM_STATES = {"ACTIVO", "PENDIENTE", "RESERVADO", "EN_PROCESO"}
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
    product_id: str = Field(..., min_length=3)
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


def _to_bool(value, default=False):
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"true", "1", "si", "sí", "yes", "activo", "activa"}:
        return True
    if text in {"false", "0", "no", "inactivo", "inactiva"}:
        return False
    return default


def _number(value, default=0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _today() -> str:
    return date.today().isoformat()


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


def _get_public_cart_product(at: AirtableClient, product_id: str) -> dict:
    public = _public_products_by_id().get(product_id)
    if not public:
        raise HTTPException(status_code=404, detail="Producto no disponible en la tienda pública.")

    raw = at.get_record("PRODUCTOS_WEB", product_id)
    fields = raw.get("fields", {})
    if not (_to_bool(fields.get("CARRITO_HABILITADO")) or _to_bool(fields.get("VENTA_HABILITADA_WEB"))):
        raise HTTPException(status_code=409, detail="Este producto no tiene carrito habilitado.")

    disponibilidad = str(fields.get("ESTADO_DISPONIBILIDAD_WEB") or public.get("disponibilidad_visible") or "").upper()
    if disponibilidad in {"SIN_STOCK", "BAJA_TEMPORAL", "SUSPENDIDO"}:
        raise HTTPException(status_code=409, detail="Producto no disponible para agregar al carrito.")

    price = _number(public.get("precio_visible"), None)
    if price is None or price <= 0:
        price = _number(fields.get("PRECIO_PUBLICITADO_WEB") or fields.get("PRECIO_WEB"), None)
    if price is None or price <= 0:
        raise HTTPException(status_code=409, detail="Producto sin precio válido para carrito.")

    return {
        **public,
        "price": float(price),
        "raw_fields": fields,
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
        "TIPO_CARRITO": "COMPRA_PRODUCTO",
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


def _find_active_product_item(at: AirtableClient, cart_id: str, product_id: str) -> dict | None:
    for item in _cart_items(at, cart_id):
        fields = item.get("fields", {})
        if not _item_is_active(fields):
            continue
        if _first_id(fields.get("PRODUCTO_WEB")) == product_id:
            return item
    return None


def _format_item(record: dict, product_map: dict[str, dict] | None = None) -> dict:
    fields = record.get("fields", {})
    product_id = _first_id(fields.get("PRODUCTO_WEB"))
    product = (product_map or {}).get(product_id, {})
    quantity = _number(fields.get("CANTIDAD"), 0)
    unit_price = _number(fields.get("PRECIO_UNITARIO_REFERENCIA"), 0)
    subtotal = quantity * unit_price
    return {
        "id": record.get("id"),
        "product_id": product_id,
        "type": fields.get("TIPO_ITEM_CARRITO") or "PRODUCTO_WEB",
        "name": fields.get("NOMBRE_ITEM_MANUAL") or product.get("nombre_visible") or fields.get("NOMBRE_CARRITO_ITEM") or "Producto",
        "description": fields.get("DESCRIPCION_ITEM") or product.get("descripcion_visible") or "",
        "quantity": quantity,
        "unit_price": unit_price,
        "subtotal": subtotal,
        "state": fields.get("ESTADO_ITEM_CARRITO") or "ACTIVO",
        "active": _to_bool(fields.get("ACTIVO"), True),
        "image": (product.get("imagen_principal") or {}).get("url") if isinstance(product.get("imagen_principal"), dict) else None,
        "slug": product.get("slug") or product_id,
        "stock_reservation_state": fields.get("ESTADO_RESERVA_STOCK") or "NO_APLICA",
        "turn_reservation_state": fields.get("ESTADO_RESERVA_TURNO") or "NO_APLICA",
    }


def _format_cart(cart: dict | None, at: AirtableClient | None = None) -> dict:
    at = at or AirtableClient()
    product_map = _public_products_by_id()
    cart_fields = cart.get("fields", {}) if cart else {}
    cart_id = cart.get("id") if cart else None
    raw_items = _cart_items(at, cart_id) if cart_id else []
    items = [_format_item(item, product_map) for item in raw_items if _item_is_active(item.get("fields", {}))]
    total_items = sum(int(item["quantity"]) for item in items)
    subtotal = sum(item["subtotal"] for item in items)
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
    at.patch_record(
        "CARRITOS",
        cart_id,
        {
            "CANTIDAD_ITEMS_ESTIMADA": dto["total_items"],
            "SUBTOTAL_CARRITO": dto["subtotal"],
            "FECHA_ULTIMA_ACTIVIDAD": _today(),
            "ULTIMA_ACTUALIZACION": _today(),
            "MONTO_PAGADO": 0,
            "REQUIERE_TURNO": False,
            "REQUIERE_STOCK": False,
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
    """Add a PRODUCTOS_WEB item to the sandbox cart. No stock reservation and no checkout."""
    cliente_id = _require_client_context(user)
    at = AirtableClient()
    product = _get_public_cart_product(at, payload.product_id)
    cart = _get_or_create_cart(at, cliente_id, user)
    cart_id = cart["id"]
    current_item = _find_active_product_item(at, cart_id, payload.product_id)
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
        at.create_record(
            "CARRITO_ITEMS",
            {
                "NOMBRE_CARRITO_ITEM": f"{product.get('nombre_visible') or 'Producto'} x{payload.quantity}",
                "CARRITO": [cart_id],
                "TIPO_ITEM_CARRITO": "PRODUCTO_WEB",
                "PRODUCTO_WEB": [payload.product_id],
                "NOMBRE_ITEM_MANUAL": product.get("nombre_visible") or "Producto",
                "DESCRIPCION_ITEM": product.get("descripcion_visible") or "",
                "CANTIDAD": payload.quantity,
                "UNIDAD_ITEM": "UNIDAD",
                "PRECIO_UNITARIO_REFERENCIA": product["price"],
                "REQUIERE_TURNO_ITEM": False,
                "REQUIERE_STOCK_ITEM": False,
                "RESERVA_STOCK_SOLICITADA": False,
                "ESTADO_RESERVA_STOCK": "NO_APLICA",
                "ESTADO_RESERVA_TURNO": "NO_APLICA",
                "ORDEN_ITEM": item_count + 1,
                "ESTADO_ITEM_CARRITO": "ACTIVO",
                "CONVERTIDO_A_ITEM_VENTA": False,
                "OBSERVACIONES_INTERNAS": _SANDBOX_NOTE,
                "ACTIVO": True,
                "FECHA_CREACION": today,
                "ULTIMA_ACTUALIZACION": today,
            },
        )

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
