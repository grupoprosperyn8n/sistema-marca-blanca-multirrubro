"""
Rutas FastAPI para MODULOS y MARCA_BLANCA — /api/modulos, /api/marca-blanca
Fase 1A: solo lectura. Sin escrituras.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient

router = APIRouter(prefix="/api", tags=["modulos"])


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
            "faltantes": [],
        }
        # MARCAS (nueva tabla unificada de marca blanca)
        try:
            marca_records = client.list_records("MARCAS")
            if marca_records:
                mf = marca_records[0].get("fields", {})

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
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
