"""
Rutas FastAPI para MODULOS y MARCA_BLANCA — /api/modulos, /api/marca-blanca
Solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from unicodedata import normalize
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["modulos"])


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
