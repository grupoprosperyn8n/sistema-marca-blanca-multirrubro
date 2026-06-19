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


# ── FASE_1H_F: /api/productos-web con fallback PRODUCTOS ──

PRECIO_ANOMALO_RATIO = 5.0  # ratio PRECIO_PUBLICITADO_WEB / PRECIO_WEB > 5 → anomalía


def _es_precio_confiable(fields: dict) -> tuple[bool, Optional[str]]:
    """Detecta precio anómalo comparando PRECIO_PUBLICITADO_WEB vs PRECIO_WEB.
    Retorna (confiable, motivo)."""
    pw = fields.get("PRECIO_WEB")
    ppw = fields.get("PRECIO_PUBLICITADO_WEB")
    if pw is None or ppw is None:
        return True, None  # sin ambos precios, no hay anomalía detectable
    try:
        pw_val = float(pw)
        ppw_val = float(ppw)
    except (ValueError, TypeError):
        return True, None
    if pw_val <= 0 or ppw_val <= 0:
        return True, None
    ratio = max(pw_val, ppw_val) / min(pw_val, ppw_val)
    if ratio >= PRECIO_ANOMALO_RATIO:
        return False, f"PRECIO_PUBLICITADO_WEB={ppw_val:.0f} vs PRECIO_WEB={pw_val:.0f} (ratio={ratio:.1f}x)"
    return True, None


def _resolver_productos_bulk(client: AirtableClient, pw_records: list[dict]) -> dict[str, dict]:
    """Carga en lote los registros PRODUCTOS vinculados desde PRODUCTOS_WEB.
    Retorna dict {producto_id: fields}."""
    ids_set = set()
    for r in pw_records:
        pid_list = r.get("fields", {}).get("PRODUCTO")
        if isinstance(pid_list, list):
            ids_set.update(pid_list)

    if not ids_set:
        return {}

    productos_map = {}
    # Cargar uno por uno (Airtable Meta API no soporta multi-id fetch nativamente)
    for pid in ids_set:
        try:
            rec = client.get_record("PRODUCTOS", pid)
            productos_map[pid] = rec.get("fields", {})
        except Exception:
            productos_map[pid] = {}
    return productos_map


def _build_producto_web_publico(
    pw_record: dict,
    prod_fields: Optional[dict],
) -> dict:
    """Construye el objeto público con fallback PRODUCTOS → PRODUCTOS_WEB."""
    fields = pw_record.get("fields", {})
    rid = pw_record["id"]
    prod = prod_fields or {}

    # ── nombre_visible ──
    nombre_web = fields.get("NOMBRE_PUBLICO_PRODUCTO") or ""
    nombre_prod = prod.get("NOMBRE_PRODUCTO") or ""
    nombre_visible = (nombre_web or nombre_prod or "Producto sin nombre").strip()
    # humanizar: reemplazar underscores, capitalizar
    nombre_visible = nombre_visible.replace("_", " ").strip()

    # ── descripcion_visible ──
    desc_aprobada = fields.get("TEXTO_PROMOCIONAL_APROBADO_WEB") or ""
    desc_web = fields.get("DESCRIPCION_WEB") or ""
    desc_prod = prod.get("DESCRIPCION_COMERCIAL") or ""
    descripcion_visible = (desc_aprobada or desc_web or desc_prod or "").strip()
    if not descripcion_visible:
        descripcion_visible = f"Conocé más sobre {nombre_visible}"

    # ── precio_visible (preferencia: oferta activa → precio web → precio PRODUCTOS) ──
    precio_oferta = _parse_decimal(fields.get("PRECIO_PUBLICITADO_WEB"))
    precio_web = _parse_decimal(fields.get("PRECIO_WEB"))
    precio_prod = _parse_decimal(prod.get("PRECIO_VENTA"))

    # Determinar si la oferta es un precio real (no una anomalía)
    confiable, _motivo = _es_precio_confiable(fields)
    precio_oferta_web = None

    if confiable and precio_oferta is not None and precio_web is not None and precio_oferta != precio_web:
        # Hay oferta diferenciada → usar precio_oferta como precio_visible, exponer precio_web como referencia
        precio_visible = precio_oferta
        precio_oferta_web = precio_oferta
    elif precio_web is not None:
        precio_visible = precio_web
    elif precio_prod is not None:
        precio_visible = precio_prod
    else:
        precio_visible = None

    # ── categoria_publica ──
    cat_aprobada = fields.get("CATEGORIA_WEB_APROBADA_MANUAL") or ""
    cat_ia = _parse_select(fields.get("AGENTE_CATEGORIZACION_WEB_AI")) or ""
    cat_prod = prod.get("CATEGORIA_PRODUCTO") or ""
    categoria_publica = (cat_aprobada or cat_ia or cat_prod or "").strip()

    # ── imagen_principal ──
    imagen_web = _parse_image(fields.get("IMAGEN_PORTADA_WEB"))
    imagen_prod = _parse_image(prod.get("FOTO_PRODUCTO"))
    imagen_principal = imagen_web or imagen_prod or None

    # ── alt_text ──
    alt_text = fields.get("SEO_TITULO") or nombre_visible

    # ── estado_web ──
    estado_web = _parse_select(fields.get("ESTADO_WEB")) or "BORRADOR"

    # ── destacado ──
    destacado = bool(fields.get("PROMO_EN_DESTACADO"))

    # ── cta ──
    cta = fields.get("CTA_TEXTO") or f"Ver {nombre_visible}"

    # ── slug ──
    slug = fields.get("SEO_SLUG_WEB") or ""

    return {
        "id": rid,
        "nombre_visible": nombre_visible,
        "descripcion_visible": descripcion_visible,
        "precio_visible": float(precio_visible) if precio_visible is not None else None,
        "precio_oferta_web": float(precio_oferta_web) if precio_oferta_web is not None else None,
        "categoria_publica": categoria_publica or None,
        "imagen_principal": imagen_principal,
        "alt_text": alt_text,
        "estado_web": estado_web,
        "destacado": destacado,
        "cta": cta,
        "slug": slug,
    }


def listar_productos_web_publico() -> dict:
    """Endpoint público /api/productos-web con fallback PRODUCTOS.

    Retorna:
        {
            "total": N,
            "total_leidos": M,
            "productos": [...],
            "excluidos": [...],
            "anomalias": [...]
        }
    """
    client = _get_client()
    pw_records = client.list_records(TABLE_NAME)
    total_leidos = len(pw_records)

    # Carga lote de PRODUCTOS vinculados
    productos_map = _resolver_productos_bulk(client, pw_records)

    productos = []
    excluidos = []
    anomalias = []

    for r in pw_records:
        fields = r.get("fields", {})
        rid = r["id"]
        nombre = fields.get("NOMBRE_PUBLICO_PRODUCTO") or rid

        # 1. Gate de publicación
        if not _pasa_gate(fields):
            excluidos.append({
                "id": rid,
                "nombre": nombre,
                "motivo": "no_pasa_gate_publicacion",
                "detalle": {
                    "APROBADO_USO_FRONTEND_IA": bool(fields.get("APROBADO_USO_FRONTEND_IA")),
                    "ESTADO_REVISION_IA_WEB": _parse_select(fields.get("ESTADO_REVISION_IA_WEB")),
                    "ESTADO_WEB": _parse_select(fields.get("ESTADO_WEB")),
                    "VISIBILIDAD_WEB": _parse_select(fields.get("VISIBILIDAD_WEB")),
                    "ACTIVO_EN_WEB": bool(fields.get("ACTIVO_EN_WEB")),
                },
            })
            continue

        # 2. Detección de precio anómalo
        confiable, motivo_precio = _es_precio_confiable(fields)
        if not confiable:
            anomalias.append({
                "id": rid,
                "nombre": nombre,
                "tipo": "precio_anomalo",
                "detalle": motivo_precio,
                "accion": "excluido_del_publico",
            })
            excluidos.append({
                "id": rid,
                "nombre": nombre,
                "motivo": "precio_anomalo",
                "detalle": motivo_precio,
            })
            continue

        # 3. Construir respuesta pública con fallback
        prod_ids = fields.get("PRODUCTO")
        prod_id = prod_ids[0] if isinstance(prod_ids, list) and prod_ids else None
        prod_fields = productos_map.get(prod_id) if prod_id else None

        try:
            item = _build_producto_web_publico(r, prod_fields)
            productos.append(item)
        except Exception as e:
            excluidos.append({
                "id": rid,
                "nombre": nombre,
                "motivo": "error_construccion",
                "detalle": str(e),
            })

    return {
        "total": len(productos),
        "total_leidos": total_leidos,
        "productos": productos,
        "excluidos": excluidos,
        "anomalias": anomalias,
    }
