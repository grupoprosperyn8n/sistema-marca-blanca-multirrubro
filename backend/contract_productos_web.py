"""
PRODUCTOS_WEB — Contrato de datos para frontend (Vertical Slice Inicial)
Fase: FRONTEND_FASE_2A_FIX_CONTRACT_PRODUCTOS_WEB
Tabla: PRODUCTOS_WEB (tblKEEJGq536smJuQ — 53 campos)
Base: SISTEMA_MARCA_BLANCA_MULTIRRUBRO (appuns6zIUKaJG7r0)
Enums corregidos contra Airtable real. Gate de publicación definido.
"""
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

class TipoPublicacionWeb(str, Enum):
    NORMAL="NORMAL"; DESTACADO="DESTACADO"; HOME_FAVORITO="HOME_FAVORITO"
    NUEVO_ARRIBO="NUEVO_ARRIBO"; LIQUIDACION="LIQUIDACION"
    KIT="KIT"; PROMO="PROMO"; SOLO_INFORMATIVO="SOLO_INFORMATIVO"
    PRODUCTO="PRODUCTO"; SERVICIO="SERVICIO"

class EstadoDisponibilidadWeb(str, Enum):
    DISPONIBLE="DISPONIBLE"; STOCK_LIMITADO="STOCK_LIMITADO"
    SIN_STOCK="SIN_STOCK"; PREVENTA="PREVENTA"; PROXIMAMENTE="PROXIMAMENTE"
    BAJA_TEMPORAL="BAJA_TEMPORAL"; SUSPENDIDO="SUSPENDIDO"

class VisibilidadWeb(str, Enum):
    PUBLICO="PUBLICO"; LOGUEADO="LOGUEADO"; PRIVADO="PRIVADO"; OCULTO="OCULTO"

class EstadoWeb(str, Enum):
    PUBLICADO="PUBLICADO"; OCULTO="OCULTO"; PAUSADO="PAUSADO"
    BORRADOR="BORRADOR"; NO_LISTADO="NO_LISTADO"

class EstadoRevisionIA(str, Enum):
    PENDIENTE="PENDIENTE"; EN_REVISION="EN_REVISION"
    APROBADO="APROBADO"; RECHAZADO="RECHAZADO"; REVISAR="REVISAR"

class NivelRiesgoPublicacion(str, Enum):
    BAJO="BAJO"; MEDIO="MEDIO"; ALTO="ALTO"
    BLOQUEAR="BLOQUEAR"; REVISAR="REVISAR"

class AccionRecomendadaIA(str, Enum):
    PUBLICAR_SOLO_TRAS_REVISION="PUBLICAR_SOLO_TRAS_REVISION"
    MEJORAR_TEXTO="MEJORAR_TEXTO"; CORREGIR_CATEGORIA="CORREGIR_CATEGORIA"
    CORREGIR_DATOS_FUENTE="CORREGIR_DATOS_FUENTE"; BLOQUEAR_PUBLICACION="BLOQUEAR_PUBLICACION"
    REVISAR_MANUALMENTE="REVISAR_MANUALMENTE"

class ComportamientoSinDisponibilidad(str, Enum):
    OCULTAR="OCULTAR"; MOSTRAR_CONSULTA="MOSTRAR_CONSULTA"
    PERMITIR_RESERVA="PERMITIR_RESERVA"; MOSTRAR_AGOTADO="MOSTRAR_AGOTADO"

class CategoriaWebIA(str, Enum):
    CUIDADO_CAPILAR="CUIDADO_CAPILAR"; TRATAMIENTO_CAPILAR="TRATAMIENTO_CAPILAR"
    COLORACION="COLORACION"; MANICURA_PEDICURA="MANICURA_PEDICURA"
    HERRAMIENTA_PROFESIONAL="HERRAMIENTA_PROFESIONAL"
    ACCESORIOS="ACCESORIOS"; KIT_PRODUCTOS="KIT_PRODUCTOS"
    SERVICIO="SERVICIO"; PROMOCION="PROMOCION"
    OTRO="OTRO"; REVISAR="REVISAR"

@dataclass
class ImagenProductoWeb:
    url: str
    filename: str
    width: Optional[int]=None
    height: Optional[int]=None

@dataclass
class SeoProductoWeb:
    slug: Optional[str]=None; titulo: Optional[str]=None
    descripcion: Optional[str]=None; tags: list[str]=field(default_factory=list)

@dataclass
class ProductoWebCard:
    """Tarjeta para listado/catalogo (frontend publico)."""
    id: str; nombre: str
    precio: Optional[Decimal]=None; precio_publicitado: Optional[Decimal]=None
    imagen_portada: Optional[ImagenProductoWeb]=None
    tipo_publicacion: TipoPublicacionWeb=TipoPublicacionWeb.NORMAL
    estado_disponibilidad: Optional[EstadoDisponibilidadWeb]=None
    mostrar_disponibilidad: bool=False; disponible_cantidad: Optional[int]=None
    promo_destacado: bool=False; activo_en_web: bool=True
    estado_web: EstadoWeb=EstadoWeb.BORRADOR
    orden: int=0; cta_texto: Optional[str]=None
    envio_disponible: bool=False; retiro_en_local: bool=False

@dataclass
class ProductoWebDetalle(ProductoWebCard):
    """Vista detalle producto (frontend publico)."""
    descripcion: Optional[str]=None; url_detalle: Optional[str]=None
    url_compra: Optional[str]=None; venta_habilitada: bool=False
    carrito_habilitado: bool=False; tienda_web: bool=False
    funnel_venta: bool=False; comentarios_habilitados: bool=False
    visibilidad: VisibilidadWeb=VisibilidadWeb.OCULTO
    imagenes_extra: list[ImagenProductoWeb]=field(default_factory=list)
    seo: SeoProductoWeb=field(default_factory=SeoProductoWeb)
    fecha_creacion: Optional[date]=None; fecha_publicacion: Optional[date]=None
    fecha_despublicacion: Optional[date]=None; ultima_actualizacion: Optional[date]=None
    sucursales_aplica: list[str]=field(default_factory=list)
    aplica_todas_sucursales: bool=False
    comportamiento_sin_stock: Optional[ComportamientoSinDisponibilidad]=None
    producto_fuente_id: Optional[str]=None
    carrito_items: list[str]=field(default_factory=list)

@dataclass
class DatosIAGenerados:
    """Contenido IA — NO visible para PROFESIONAL ni SOLO_LECTURA."""
    texto_promocional: Optional[str]=None
    categoria_web: Optional[CategoriaWebIA]=None
    riesgo_publicacion: Optional[str]=None
    nivel_riesgo: Optional[NivelRiesgoPublicacion]=None
    accion_recomendada: Optional[AccionRecomendadaIA]=None

@dataclass
class RevisionIAProductoWeb:
    """Revision humana del contenido IA."""
    estado: Optional[EstadoRevisionIA]=None; texto_aprobado: Optional[str]=None
    categoria_aprobada: Optional[str]=None; aprobado_frontend: bool=False
    fecha_revision: Optional[date]=None; revisor: Optional[str]=None
    motivo: Optional[str]=None; alerta: Optional[str]=None; color_alerta: Optional[str]=None

@dataclass
class ProductoWebBackoffice(ProductoWebDetalle):
    """Backoffice con IA+revision. VISIBLE: ADMIN, GERENTE, EMPLEADO_GESTION."""
    ia: DatosIAGenerados=field(default_factory=DatosIAGenerados)
    revision: RevisionIAProductoWeb=field(default_factory=RevisionIAProductoWeb)

VISIBILIDAD_POR_ROL = {
    "ADMINISTRADOR": {"puede_ver_ia": True, "puede_aprobar_frontend": True, "puede_regenerar_ia": True},
    "GERENTE": {"puede_ver_ia": True, "puede_aprobar_frontend": True, "puede_regenerar_ia": True},
    "EMPLEADO_GESTION": {"puede_ver_ia": True, "puede_aprobar_frontend": False, "puede_regenerar_ia": False},
    "PROFESIONAL": {"puede_ver_ia": False, "puede_aprobar_frontend": False, "puede_regenerar_ia": False},
    "SOLO_LECTURA": {"puede_ver_ia": False, "puede_aprobar_frontend": False, "puede_regenerar_ia": False},
}

# ── PUBLICACION_GATE: condiciones obligatorias para /tienda ──
# Un registro solo se expone en la tienda pública si TODAS son True.
PUBLICACION_GATE = {
    "APROBADO_USO_FRONTEND_IA": True,
    "ESTADO_REVISION_IA_WEB": "APROBADO",       # EstadoRevisionIA.APROBADO
    "ESTADO_WEB": "PUBLICADO",                   # EstadoWeb.PUBLICADO
    "VISIBILIDAD_WEB": "PUBLICO",                # VisibilidadWeb.PUBLICO
    "ACTIVO_EN_WEB": True,
}

# ── PUBLIC_FIELDS: campos permitidos en /tienda (24) ──
PUBLIC_FIELDS = {
    # Contenido
    "NOMBRE_PUBLICO_PRODUCTO",
    "IMAGEN_PORTADA_WEB",
    "PRECIO_WEB",
    "PRECIO_PUBLICITADO_WEB",
    "URL_DETALLE_WEB",
    "URL_COMPRA_DIRECTA",
    "CTA_TEXTO",
    "DISPONIBILIDAD_VISIBLE_WEB",
    # SEO
    "SEO_SLUG_WEB",
    "SEO_TITULO",
    "SEO_DESCRIPCION",
    "SEO_TAGS_KEYWORDS",
    # Metadata/flags visibles
    "TIPO_PUBLICACION_WEB",
    "ESTADO_DISPONIBILIDAD_WEB",
    "COMPORTAMIENTO_SIN_DISPONIBILIDAD",
    "VENTA_HABILITADA_WEB",
    "CARRITO_HABILITADO",
    "TIENDA_WEB",
    "FUNNEL_VENTA",
    "COMENTARIOS_RESEÑAS_HABILITADOS",
    "ENVIO_DISPONIBLE",
    "RETIRO_EN_LOCAL",
    "MOSTRAR_DISPONIBILIDAD_WEB",
    "PROMO_EN_DESTACADO",
}

# ── IA_SAFE_RULES: textos IA crudos NUNCA se exponen ──
# Si TEXTO_PROMOCIONAL_APROBADO_WEB no está vacío, se usa ese.
# Si está vacío, NO se usa AGENTE_TEXTO_PROMOCIONAL_AI como fallback.
# Si CATEGORIA_WEB_APROBADA_MANUAL no está vacía, se usa esa.
# Si está vacía, NO se usa AGENTE_CATEGORIZACION_WEB_AI como fallback.
IA_SAFE_FIELDS = {
    "descripcion_publica": "TEXTO_PROMOCIONAL_APROBADO_WEB",      # preferencia
    "descripcion_ia_cruda": "AGENTE_TEXTO_PROMOCIONAL_AI",         # bloqueado
    "categoria_publica": "CATEGORIA_WEB_APROBADA_MANUAL",          # preferencia
    "categoria_ia_cruda": "AGENTE_CATEGORIZACION_WEB_AI",          # bloqueado
}

# ── BLOCKED_FIELDS_FOR_TIENDA: nunca expuestos en /tienda (21) ──
BLOCKED_FIELDS_FOR_TIENDA = {
    # IA cruda
    "AGENTE_TEXTO_PROMOCIONAL_AI",
    "RIESGO_PUBLICACION_PRODUCTO_WEB_AI",
    "AGENTE_CATEGORIZACION_WEB_AI",
    "NIVEL_RIESGO_PUBLICACION_AI",
    "ACCION_RECOMENDADA_PUBLICACION_AI",
    # Revisión humana
    "ESTADO_REVISION_IA_WEB",
    "ALERTA_REVISION_IA_WEB",
    "COLOR_ALERTA_REVISION_IA_WEB",
    "APROBADO_USO_FRONTEND_IA",
    "FECHA_REVISION_IA_WEB",
    "REVISOR_IA_WEB",
    "MOTIVO_REVISION_IA_WEB",
    "TEXTO_PROMOCIONAL_APROBADO_WEB",
    "CATEGORIA_WEB_APROBADA_MANUAL",
    # Relaciones internas
    "PRODUCTO",
    "CARRITO_ITEMS",
    "SUCURSALES_APLICA",
    "SUCURSALES_APLICA_REFERENCIA",
    "ALERTA_SUCURSALES_APLICA_AUTO",
    # Interno / auditoría
    "ORDEN_WEB",
    "VISIBILIDAD_WEB",
    "FECHA_CREACION",
    "ULTIMA_ACTUALIZACION",
}
