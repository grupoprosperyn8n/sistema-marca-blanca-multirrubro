"""
Rutas FastAPI para MODULOS y MARCA_BLANCA — /api/modulos, /api/marca-blanca
Lectura pública y edición controlada de MARCAS para administradores.
"""
import sys
import base64
import json
from pathlib import Path
from unicodedata import normalize
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from fastapi import APIRouter, Depends, HTTPException, status

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_module
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["modulos"])

ROOT_EDITABLE_FIELDS = {
    "nombre_sistema": "NOMBRE_MARCA",
    "nombre_negocio": "NOMBRE_COMERCIAL",
    "rubro": "RUBRO",
    "logo": "LOGO_URL",
    "favicon": "FAVICON_URL",
    "seo_title": "SEO_TITLE",
    "seo_description": "SEO_DESCRIPTION",
    "legal_aviso": "LEGAL_AVISO_PUBLICO",
    "privacy_url": "PRIVACY_URL",
    "terms_url": "TERMS_URL",
    "registro_activo": "REGISTRO_ACTIVO",
}

COLOR_EDITABLE_FIELDS = {
    "primario": "COLOR_PRIMARIO",
    "secundario": "COLOR_SECUNDARIO",
    "acento": "COLOR_ACENTO",
    "fondo": "COLOR_FONDO",
    "texto": "COLOR_TEXTO",
    "texto_secundario": "COLOR_TEXTO_SECUNDARIO",
    "tipografia_titulos": "TIPOGRAFIA_TITULOS",
    "tipografia_cuerpo": "TIPOGRAFIA_CUERPO",
    "preset": "THEME_PRESET",
}

TEXT_EDITABLE_FIELDS = {
    "hero_badge": "HERO_BADGE",
    "hero_titulo": "HERO_TITULO",
    "hero_subtitulo": "HERO_SUBTITULO",
    "hero_cta_primario": "HERO_CTA_PRIMARIO_TEXTO",
    "hero_cta_primario_url": "HERO_CTA_PRIMARIO_URL",
    "hero_cta_secundario": "HERO_CTA_SECUNDARIO_TEXTO",
    "hero_cta_secundario_url": "HERO_CTA_SECUNDARIO_URL",
    "hero_imagen_url": "HERO_IMAGEN_URL",
    "banner_activo": "BANNER_ACTIVO",
    "banner_titulo": "BANNER_TITULO",
    "banner_mensaje": "BANNER_MENSAJE",
    "banner_cta_texto": "BANNER_CTA_TEXTO",
    "banner_cta_url": "BANNER_CTA_URL",
    "reserva_titulo": "RESERVA_TITULO",
    "reserva_subtitulo": "RESERVA_SUBTITULO",
    "reserva_requiere_login": "RESERVA_REQUIERE_LOGIN",
    "reserva_sin_horarios": "RESERVA_MENSAJE_SIN_HORARIOS",
    "reserva_demo": "RESERVA_MENSAJE_DEMO",
    "reserva_cta_texto": "RESERVA_CTA_TEXTO",
    "contacto_telefono": "TELEFONO_PUBLICO",
    "contacto_whatsapp": "WHATSAPP_PUBLICO",
    "contacto_email": "EMAIL_PUBLICO",
    "contacto_direccion": "DIRECCION_PUBLICA",
    "redes_instagram": "INSTAGRAM_URL",
    "redes_facebook": "FACEBOOK_URL",
    "redes_tiktok": "TIKTOK_URL",
    "redes_maps": "GOOGLE_MAPS_URL",
}

SECTION_EDITABLE_FIELDS = {
    "mostrar_servicios": "MOSTRAR_SERVICIOS",
    "mostrar_productos": "MOSTRAR_PRODUCTOS",
    "mostrar_sucursales": "MOSTRAR_SUCURSALES",
    "mostrar_ofertas": "MOSTRAR_OFERTAS",
    "mostrar_testimonios": "MOSTRAR_TESTIMONIOS",
    "mostrar_como_funciona": "MOSTRAR_COMO_FUNCIONA",
    "orden_secciones": "ORDEN_SECCIONES",
}

BOOLEAN_MARCA_FIELDS = {
    "BANNER_ACTIVO",
    "RESERVA_REQUIERE_LOGIN",
    "MOSTRAR_SERVICIOS",
    "MOSTRAR_PRODUCTOS",
    "MOSTRAR_SUCURSALES",
    "MOSTRAR_OFERTAS",
    "MOSTRAR_TESTIMONIOS",
    "MOSTRAR_COMO_FUNCIONA",
    "REGISTRO_ACTIVO",
}

COLOR_MARCA_FIELDS = {
    "COLOR_PRIMARIO",
    "COLOR_SECUNDARIO",
    "COLOR_ACENTO",
    "COLOR_FONDO",
    "COLOR_TEXTO",
    "COLOR_TEXTO_SECUNDARIO",
}


def _to_bool(value, default=False):
    """Convierte valores Airtable/JSON a booleano sin romper ante nulos."""
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"true", "1", "si", "sí", "yes", "y", "activo", "activa", "habilitado", "habilitada"}:
        return True
    if text in {"false", "0", "no", "n", "inactivo", "inactiva", "deshabilitado", "deshabilitada"}:
        return False
    return default


def _require_config_editor(user: dict):
    rol = (user.get("rol") or "").upper()
    if rol in {"ADMINISTRADOR", "ADMIN_SISTEMA"}:
        return
    if can_module(rol, "MARCA_BLANCA", "edit") or can_module(rol, "CONFIGURACION", "edit"):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Acceso restringido por permisos de marca blanca.",
    )


def _normalize_edit_value(field_name, value):
    if field_name in BOOLEAN_MARCA_FIELDS:
        return _to_bool(value, default=False)
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned == "":
            return None
        if field_name in COLOR_MARCA_FIELDS:
            cleaned = cleaned.replace("#", "").strip()
        return cleaned
    return value


def _collect_editable_patch(payload: dict) -> dict:
    patch = {}
    sources = [
        (payload, ROOT_EDITABLE_FIELDS),
        (payload.get("colores") or {}, COLOR_EDITABLE_FIELDS),
        (payload.get("textos_publicos") or {}, TEXT_EDITABLE_FIELDS),
        (payload.get("secciones_visibles") or {}, SECTION_EDITABLE_FIELDS),
    ]
    for source, mapping in sources:
        if not isinstance(source, dict):
            continue
        for public_key, airtable_field in mapping.items():
            if public_key in source:
                patch[airtable_field] = _normalize_edit_value(airtable_field, source[public_key])
    return patch


def _clean_token(value):
    text = str(value or "").strip().upper()
    text = normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return text.replace("-", "_").replace(" ", "_")


def _active_module_names(modulos):
    return {
        _clean_token(modulo.get("nombre"))
        for modulo in modulos
        if _to_bool(modulo.get("activo"), True) and modulo.get("nombre")
    }


def _has_module(active_names, *needles):
    normalized_needles = [_clean_token(needle) for needle in needles]
    return any(
        any(needle in module_name for needle in normalized_needles)
        for module_name in active_names
    )


def _pick_text(fields, *keys, default=None):
    for key in keys:
        value = fields.get(key)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return default


def _offer_mode(uses_products, uses_services):
    if uses_products and uses_services:
        return "PRODUCTOS_SERVICIOS"
    if uses_products:
        return "SOLO_PRODUCTOS"
    if uses_services:
        return "SOLO_SERVICIOS"
    return "SIN_CATALOGO"




def _attachment_url(value) -> str:
    if not isinstance(value, list) or not value:
        return ""
    item = value[-1] or {}
    return str(item.get("url") or item.get("download_url") or "").strip()


LOGO_ATTACHMENT_FIELD_CANDIDATES = (
    "LOGO",
    "LOGO_MARCA",
    "LOGO_ARCHIVO",
    "LOGO_IMAGEN",
    "IMAGEN_LOGO",
    "ARCHIVO_LOGO",
    "MARCA_LOGO",
    "BRAND_LOGO",
)


def _safe_logo_attachment_field(table) -> str | None:
    attachment_fields = [
        str(getattr(field, "name", "") or "")
        for field in getattr(table, "fields", []) or []
        if str(getattr(field, "type", "") or "") == "multipleAttachments"
    ]
    by_clean_name = {_clean_token(name): name for name in attachment_fields}
    for candidate in LOGO_ATTACHMENT_FIELD_CANDIDATES:
        if candidate in by_clean_name:
            return by_clean_name[candidate]
    for name in attachment_fields:
        clean = _clean_token(name)
        if clean.endswith("_LOGO") or clean.startswith("LOGO_"):
            return name
    return None


def _safe_landing_logo_storage_record(client: AirtableClient) -> dict | None:
    table = client.get_table("LANDING_SECCIONES")
    if not table or "IMAGEN_PRINCIPAL" not in set(table.field_names):
        return None

    available_fields = set(table.field_names)
    read_fields = [
        field
        for field in [
            "CLAVE_SECCION",
            "NOMBRE_SECCION",
            "VISIBLE_EN_FRONTEND_PUBLICO",
            "REGISTRO_ACTIVO",
            "IMAGEN_PRINCIPAL",
        ]
        if field in available_fields
    ]
    records = client.list_records("LANDING_SECCIONES", fields=read_fields or None)
    candidates = []
    for record in records:
        fields = record.get("fields", {})
        label = _clean_token(f"{fields.get('CLAVE_SECCION', '')} {fields.get('NOMBRE_SECCION', '')}")
        is_logo_storage = any(token in label for token in ("LOGO", "BRAND_ASSET", "MEDIA_ASSET"))
        is_public = _to_bool(fields.get("VISIBLE_EN_FRONTEND_PUBLICO"), False)
        is_active = _to_bool(fields.get("REGISTRO_ACTIVO"), False)
        if is_logo_storage and not (is_public and is_active):
            candidates.append((0 if not is_public else 1, 0 if not is_active else 1, record))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[:2])
    return candidates[0][2]


def _field_type(table, field_name: str) -> str:
    for field in getattr(table, "fields", []) or []:
        if getattr(field, "name", "") == field_name:
            return str(getattr(field, "type", "") or "")
    return ""


def _safe_media_logo_storage_record(client: AirtableClient) -> dict | None:
    """Find or create a hidden MEDIA_PUBLICA record to store brand assets."""
    table = client.get_table("MEDIA_PUBLICA")
    if not table or "ARCHIVO_MEDIA" not in set(table.field_names):
        return None

    available_fields = set(table.field_names)
    read_fields = [
        field
        for field in [
            "NOMBRE_MEDIA",
            "TITULO_PUBLICO",
            "VISIBLE_EN_FRONTEND_PUBLICO",
            "ACTIVO",
            "ARCHIVO_MEDIA",
        ]
        if field in available_fields
    ]
    try:
        records = client.list_records("MEDIA_PUBLICA", fields=read_fields or None)
    except Exception:
        records = []

    candidates = []
    for record in records:
        fields = record.get("fields", {})
        label = _clean_token(f"{fields.get('NOMBRE_MEDIA', '')} {fields.get('TITULO_PUBLICO', '')}")
        is_logo_storage = any(token in label for token in ("LOGO", "BRAND_ASSET", "MARCA_ASSET"))
        is_public = _to_bool(fields.get("VISIBLE_EN_FRONTEND_PUBLICO"), False)
        is_active = _to_bool(fields.get("ACTIVO"), False)
        if is_logo_storage and not (is_public and is_active):
            candidates.append((0 if not is_public else 1, 0 if not is_active else 1, record))
    if candidates:
        candidates.sort(key=lambda item: item[:2])
        return candidates[0][2]

    create_fields = {}
    if "NOMBRE_MEDIA" in available_fields and _field_type(table, "NOMBRE_MEDIA") in {"singleLineText", "multilineText", "richText"}:
        create_fields["NOMBRE_MEDIA"] = "LOGO_MARCA_ASSET"
    if "TITULO_PUBLICO" in available_fields and _field_type(table, "TITULO_PUBLICO") in {"singleLineText", "multilineText", "richText"}:
        create_fields["TITULO_PUBLICO"] = "Logo marca"
    can_hide = False
    if "VISIBLE_EN_FRONTEND_PUBLICO" in available_fields and _field_type(table, "VISIBLE_EN_FRONTEND_PUBLICO") == "checkbox":
        create_fields["VISIBLE_EN_FRONTEND_PUBLICO"] = False
        can_hide = True
    if "ACTIVO" in available_fields and _field_type(table, "ACTIVO") == "checkbox":
        create_fields["ACTIVO"] = False
        can_hide = True
    if not can_hide:
        return None

    try:
        return client.create_record("MEDIA_PUBLICA", create_fields)
    except Exception:
        return None


def _upload_attachment_to_airtable(client: AirtableClient, record_id: str, field_name: str, payload: dict, *, images_only: bool = False) -> dict:
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
        raise HTTPException(status_code=413, detail="El upload directo a Airtable soporta hasta 5 MB.")
    if images_only and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes para el logo.")

    upload_url = (
        f"https://content.airtable.com/v0/{quote(client.config.base_id)}/"
        f"{quote(record_id, safe='')}/{quote(field_name, safe='')}/uploadAttachment"
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
    try:
        with urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=e.code, detail=f"Airtable uploadAttachment error: {detail}")

def _business_config_from_marca(marca_fields, modulos_activos):
    """
    Contrato P0 de marca blanca.

    Traduce MARCAS + MODULOS en comportamiento usable por frontend/backoffice,
    sin exigir todavía campos nuevos en Airtable.
    """
    active_names = _active_module_names(modulos_activos)

    uses_services = _to_bool(
        marca_fields.get("MOSTRAR_SERVICIOS"),
        default=_has_module(active_names, "SERVICIOS", "SERVICIOS_WEB"),
    )
    uses_products = _to_bool(
        marca_fields.get("MOSTRAR_PRODUCTOS"),
        default=_has_module(active_names, "PRODUCTOS", "PRODUCTOS_WEB"),
    )
    uses_branches = _to_bool(
        marca_fields.get("MOSTRAR_SUCURSALES"),
        default=_has_module(active_names, "SUCURSALES"),
    )
    uses_appointments = _to_bool(
        marca_fields.get("USA_TURNOS"),
        default=_has_module(active_names, "CITAS", "AGENDA", "AGENDA_SLOTS"),
    )
    uses_cart = _to_bool(
        marca_fields.get("USA_CARRITO"),
        default=_has_module(active_names, "CARRITOS", "CARRITO_ITEMS"),
    )
    uses_pos = _to_bool(
        marca_fields.get("USA_CAJA_FISICA"),
        default=_has_module(active_names, "VENTAS", "ITEMS_VENTA"),
    )
    uses_online_payments = _to_bool(marca_fields.get("USA_PAGO_ONLINE"), default=False)

    channel = _pick_text(marca_fields, "CANAL_OPERACION", default=None)
    if not channel:
        if uses_branches and uses_cart:
            channel = "MIXTO"
        elif uses_branches:
            channel = "FISICO"
        else:
            channel = "ONLINE"
    channel = _clean_token(channel)

    show_contact_address = _to_bool(
        marca_fields.get("MOSTRAR_DIRECCION_CONTACTO"),
        default=channel in {"FISICO", "MIXTO"} and bool(marca_fields.get("DIRECCION_PUBLICA")),
    )
    show_map = _to_bool(
        marca_fields.get("MOSTRAR_MAPA"),
        default=show_contact_address and bool(marca_fields.get("GOOGLE_MAPS_URL")),
    )

    offer_mode = _pick_text(marca_fields, "MODO_OFERTA", default=None)
    offer_mode = _clean_token(offer_mode) if offer_mode else _offer_mode(uses_products, uses_services)

    if offer_mode == "SOLO_PRODUCTOS":
        catalog_label = "Productos"
        primary_flow = "CATALOGO"
    elif offer_mode == "SOLO_SERVICIOS":
        catalog_label = "Servicios"
        primary_flow = "RESERVA" if uses_appointments else "CATALOGO"
    elif offer_mode == "PRODUCTOS_SERVICIOS":
        catalog_label = "Catálogo"
        primary_flow = "RESERVA" if uses_appointments else "CATALOGO"
    else:
        catalog_label = "Inicio"
        primary_flow = "CONTACTO"

    return {
        "contract_version": "P0.1",
        "modo_oferta": offer_mode,
        "usa_productos": uses_products,
        "usa_servicios": uses_services,
        "usa_turnos": uses_appointments,
        "usa_sucursales": uses_branches,
        "usa_multi_sucursal": _to_bool(marca_fields.get("USA_MULTI_SUCURSAL"), default=uses_branches),
        "canal_operacion": channel,
        "mostrar_direccion_contacto": show_contact_address,
        "mostrar_mapa": show_map,
        "usa_carrito": uses_cart,
        "usa_checkout": uses_cart and uses_online_payments,
        "usa_pago_online": uses_online_payments,
        "usa_caja_fisica": uses_pos and channel in {"FISICO", "MIXTO"},
        "payment_gateway_status": "PENDIENTE" if not uses_online_payments else "CONFIG_REQUERIDA",
        "fondo_tipo": _clean_token(_pick_text(marca_fields, "FONDO_TIPO", default="SOLIDO")),
        "fondo_url": _pick_text(marca_fields, "FONDO_URL", "HERO_IMAGEN_URL", default=None),
        "contraste_tema": _clean_token(_pick_text(marca_fields, "CONTRASTE_TEMA", default="AUTO")),
        "catalog_label": catalog_label,
        "primary_flow": primary_flow,
    }


@router.get("/modulos")
async def listar_modulos():
    """Lista todos los modulos del sistema."""
    try:
        client = AirtableClient()
        records = client.list_records("MODULOS", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "modulos": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/marca-blanca")
async def datos_marca_blanca():
    """Endpoint unificado de marca blanca: nombre, colores, logo, textos, modulos activos."""
    try:
        client = AirtableClient()
        result = {
            "nombre_sistema": None,
            "nombre_negocio": None,
            "colores": None,
            "logo": None,
            "textos_publicos": None,
            "secciones_visibles": None,
            "modulos_activos": [],
            "business_config": None,
            "faltantes": [],
        }
        marca_fields = {}
        # MARCAS (nueva tabla unificada de marca blanca)
        try:
            marca_records = client.list_records("MARCAS")
            if marca_records:
                mf = marca_records[0].get("fields", {})
                marca_fields = mf

                # Nombre
                result["nombre_sistema"] = mf.get("NOMBRE_MARCA")
                result["nombre_negocio"] = mf.get("NOMBRE_COMERCIAL")

                # Colores (objeto JSON)
                result["colores"] = {
                    "primario": mf.get("COLOR_PRIMARIO"),
                    "secundario": mf.get("COLOR_SECUNDARIO"),
                    "acento": mf.get("COLOR_ACENTO"),
                    "fondo": mf.get("COLOR_FONDO"),
                    "texto": mf.get("COLOR_TEXTO"),
                    "texto_secundario": mf.get("COLOR_TEXTO_SECUNDARIO"),
                    "tipografia_titulos": mf.get("TIPOGRAFIA_TITULOS"),
                    "tipografia_cuerpo": mf.get("TIPOGRAFIA_CUERPO"),
                    "preset": mf.get("THEME_PRESET"),
                }

                # Logo
                result["logo"] = mf.get("LOGO_URL")
                result["favicon"] = mf.get("FAVICON_URL")

                # Textos públicos (objeto JSON)
                result["textos_publicos"] = {
                    "hero_badge": mf.get("HERO_BADGE"),
                    "hero_titulo": mf.get("HERO_TITULO"),
                    "hero_subtitulo": mf.get("HERO_SUBTITULO"),
                    "hero_cta_primario": mf.get("HERO_CTA_PRIMARIO_TEXTO"),
                    "hero_cta_primario_url": mf.get("HERO_CTA_PRIMARIO_URL"),
                    "hero_cta_secundario": mf.get("HERO_CTA_SECUNDARIO_TEXTO"),
                    "hero_cta_secundario_url": mf.get("HERO_CTA_SECUNDARIO_URL"),
                    "hero_imagen_url": mf.get("HERO_IMAGEN_URL"),
                    "banner_activo": mf.get("BANNER_ACTIVO"),
                    "banner_titulo": mf.get("BANNER_TITULO"),
                    "banner_mensaje": mf.get("BANNER_MENSAJE"),
                    "banner_cta_texto": mf.get("BANNER_CTA_TEXTO"),
                    "banner_cta_url": mf.get("BANNER_CTA_URL"),
                    "reserva_titulo": mf.get("RESERVA_TITULO"),
                    "reserva_subtitulo": mf.get("RESERVA_SUBTITULO"),
                    "reserva_requiere_login": mf.get("RESERVA_REQUIERE_LOGIN"),
                    "reserva_sin_horarios": mf.get("RESERVA_MENSAJE_SIN_HORARIOS"),
                    "reserva_demo": mf.get("RESERVA_MENSAJE_DEMO"),
                    "reserva_cta_texto": mf.get("RESERVA_CTA_TEXTO"),
                    "contacto_telefono": mf.get("TELEFONO_PUBLICO"),
                    "contacto_whatsapp": mf.get("WHATSAPP_PUBLICO"),
                    "contacto_email": mf.get("EMAIL_PUBLICO"),
                    "contacto_direccion": mf.get("DIRECCION_PUBLICA"),
                    "redes_instagram": mf.get("INSTAGRAM_URL"),
                    "redes_facebook": mf.get("FACEBOOK_URL"),
                    "redes_tiktok": mf.get("TIKTOK_URL"),
                    "redes_maps": mf.get("GOOGLE_MAPS_URL"),
                }

                # Secciones visibles
                result["secciones_visibles"] = {
                    "mostrar_servicios": mf.get("MOSTRAR_SERVICIOS"),
                    "mostrar_productos": mf.get("MOSTRAR_PRODUCTOS"),
                    "mostrar_sucursales": mf.get("MOSTRAR_SUCURSALES"),
                    "mostrar_ofertas": mf.get("MOSTRAR_OFERTAS"),
                    "mostrar_testimonios": mf.get("MOSTRAR_TESTIMONIOS"),
                    "mostrar_como_funciona": mf.get("MOSTRAR_COMO_FUNCIONA"),
                    "orden_secciones": mf.get("ORDEN_SECCIONES"),
                }

                # SEO / Legal
                result["seo_title"] = mf.get("SEO_TITLE")
                result["seo_description"] = mf.get("SEO_DESCRIPTION")
                result["legal_aviso"] = mf.get("LEGAL_AVISO_PUBLICO")
                result["privacy_url"] = mf.get("PRIVACY_URL")
                result["terms_url"] = mf.get("TERMS_URL")

                # Extras
                result["marca_id"] = mf.get("MARCA_ID")
                result["rubro"] = mf.get("RUBRO")
                result["registro_activo"] = mf.get("REGISTRO_ACTIVO")
                result["version_config"] = mf.get("VERSION_CONFIG")

                # Faltantes: campos nulos en MARCAS
                for target_field, marca_key in [
                    ("COLOR_PRIMARIO", "COLOR_PRIMARIO"),
                    ("COLOR_SECUNDARIO", "COLOR_SECUNDARIO"),
                    ("COLOR_TEXTO", "COLOR_TEXTO"),
                    ("HERO_TITULO", "HERO_TITULO"),
                    ("HERO_CTA_PRIMARIO_TEXTO", "HERO_CTA_PRIMARIO_TEXTO"),
                    ("BANNER_ACTIVO", "BANNER_ACTIVO"),
                    ("RESERVA_TITULO", "RESERVA_TITULO"),
                    ("RESERVA_REQUIERE_LOGIN", "RESERVA_REQUIERE_LOGIN"),
                ]:
                    if mf.get(marca_key) is None:
                        result["faltantes"].append(f"MARCAS.{target_field}")

            else:
                result["faltantes"].append("MARCAS: sin registros")
        except Exception as e:
            result["faltantes"].append(f"MARCAS (error): {str(e)}")
        # MODULOS
        try:
            modulos_records = client.list_records("MODULOS", by_name=True)
            for r in modulos_records:
                mf = r.get("fields", {})
                result["modulos_activos"].append({
                    "id": r.get("id"),
                    "nombre": mf.get("NOMBRE_MODULO") or mf.get("NOMBRE") or mf.get("Nombre") or "sin_nombre",
                    "activo": mf.get("ACTIVO") if "ACTIVO" in mf else mf.get("Activo", True),
                    "marca_blanca": mf.get("MARCA_BLANCA") or mf.get("Marca_Blanca") or None,
                })
        except Exception as e:
            result["faltantes"].append(f"MODULOS (error): {str(e)}")

        result["business_config"] = _business_config_from_marca(
            marca_fields,
            result["modulos_activos"],
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")




@router.post("/backoffice/marca-blanca/logo/upload")
async def subir_logo_marca_blanca(payload: dict, user: dict = Depends(get_current_user)):
    """Sube logo a un attachment seguro de MARCAS y copia su URL a LOGO_URL."""
    _require_config_editor(user)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    try:
        client = AirtableClient()
        table = client.get_table("MARCAS")
        if not table:
            raise HTTPException(status_code=404, detail="Tabla MARCAS no encontrada.")
        available_fields = set(table.field_names)
        if "LOGO_URL" not in available_fields:
            raise HTTPException(status_code=404, detail="MARCAS no tiene LOGO_URL.")
        marca_records = client.list_records("MARCAS", max_records=1)
        if not marca_records:
            raise HTTPException(status_code=404, detail="MARCAS no tiene registros.")
        record_id = marca_records[0].get("id")

        attachment_field = _safe_logo_attachment_field(table)
        storage_table = "MARCAS"
        storage_record_id = record_id
        if not attachment_field:
            media_storage = _safe_media_logo_storage_record(client)
            landing_storage = None if media_storage else _safe_landing_logo_storage_record(client)
            if media_storage:
                storage_table = "MEDIA_PUBLICA"
                storage_record_id = media_storage.get("id")
                attachment_field = "ARCHIVO_MEDIA"
            elif landing_storage:
                storage_table = "LANDING_SECCIONES"
                storage_record_id = landing_storage.get("id")
                attachment_field = "IMAGEN_PRINCIPAL"
            else:
                raise HTTPException(
                    status_code=404,
                    detail="No hay attachment seguro en MARCAS, MEDIA_PUBLICA ni LANDING_SECCIONES para almacenar el logo sin afectar secciones públicas.",
                )

        upload_result = _upload_attachment_to_airtable(client, storage_record_id, attachment_field, payload, images_only=True)
        uploaded_record = client.get_record(storage_table, storage_record_id)
        logo_url = _attachment_url(uploaded_record.get("fields", {}).get(attachment_field))
        if not logo_url:
            raise HTTPException(status_code=502, detail="Airtable no devolvió URL de logo.")
        client.patch_record("MARCAS", record_id, {"LOGO_URL": logo_url})
        updated = await datos_marca_blanca()
        updated["updated_fields"] = ["LOGO_URL", attachment_field]
        return {
            "ok": True,
            "upload": upload_result,
            "logo_url": logo_url,
            "attachment_field": attachment_field,
            "storage_table": storage_table,
            "marca": updated,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.patch("/marca-blanca")
async def actualizar_marca_blanca(payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza campos seguros de MARCAS. Solo ADMINISTRADOR/ADMIN_SISTEMA."""
    _require_config_editor(user)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    try:
        client = AirtableClient()
        table = client.get_table("MARCAS")
        if not table:
            raise HTTPException(status_code=404, detail="Tabla MARCAS no encontrada.")

        available_fields = set(table.field_names)
        requested_patch = _collect_editable_patch(payload)
        safe_patch = {
            field: value
            for field, value in requested_patch.items()
            if field in available_fields
        }
        ignored_fields = sorted(set(requested_patch) - set(safe_patch))

        if not safe_patch:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "No hay campos editables compatibles con MARCAS.",
                    "ignored_fields": ignored_fields,
                },
            )

        marca_records = client.list_records("MARCAS", max_records=1)
        if not marca_records:
            raise HTTPException(status_code=404, detail="MARCAS no tiene registros.")

        record_id = marca_records[0].get("id")
        client.patch_record("MARCAS", record_id, safe_patch)

        updated = await datos_marca_blanca()
        updated["updated_fields"] = sorted(safe_patch.keys())
        updated["ignored_fields"] = ignored_fields
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
