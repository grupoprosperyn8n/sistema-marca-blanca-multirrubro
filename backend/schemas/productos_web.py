"""
Schemas Pydantic para PRODUCTOS_WEB.
Basados en contract_productos_web.py — enums corregidos contra Airtable real.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal

from contract_productos_web import (
    TipoPublicacionWeb, EstadoDisponibilidadWeb, VisibilidadWeb,
    EstadoWeb, EstadoRevisionIA, NivelRiesgoPublicacion,
    AccionRecomendadaIA, ComportamientoSinDisponibilidad, CategoriaWebIA,
)

# ── Backoffice: schemas completos ──

class SeoProductoWebSchema(BaseModel):
    slug: Optional[str] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tags: list[str] = []

class ImagenProductoWebSchema(BaseModel):
    url: str
    filename: str = ""
    width: Optional[int] = None
    height: Optional[int] = None

class DatosIAGeneradosSchema(BaseModel):
    texto_promocional: Optional[str] = None
    categoria_web: Optional[CategoriaWebIA] = None
    riesgo_publicacion: Optional[str] = None
    nivel_riesgo: Optional[NivelRiesgoPublicacion] = None
    accion_recomendada: Optional[AccionRecomendadaIA] = None

class RevisionIAProductoWebSchema(BaseModel):
    estado: Optional[EstadoRevisionIA] = None
    texto_aprobado: Optional[str] = None
    categoria_aprobada: Optional[str] = None
    aprobado_frontend: bool = False
    fecha_revision: Optional[date] = None
    revisor: Optional[str] = None
    motivo: Optional[str] = None
    alerta: Optional[str] = None
    color_alerta: Optional[str] = None

class ProductoWebBackofficeSchema(BaseModel):
    """Backoffice completo: contenido + SEO + comercio + IA + revisión."""
    id: str
    nombre: str = Field(alias="NOMBRE_PUBLICO_PRODUCTO")
    precio: Optional[Decimal] = Field(default=None, alias="PRECIO_WEB")
    precio_publicitado: Optional[Decimal] = Field(default=None, alias="PRECIO_PUBLICITADO_WEB")
    imagen_portada: Optional[ImagenProductoWebSchema] = Field(default=None, alias="IMAGEN_PORTADA_WEB")
    tipo_publicacion: TipoPublicacionWeb = Field(default=TipoPublicacionWeb.NORMAL, alias="TIPO_PUBLICACION_WEB")
    estado_disponibilidad: Optional[EstadoDisponibilidadWeb] = Field(default=None, alias="ESTADO_DISPONIBILIDAD_WEB")
    mostrar_disponibilidad: bool = Field(default=False, alias="MOSTRAR_DISPONIBILIDAD_WEB")
    disponibilidad_visible: Optional[int] = Field(default=None, alias="DISPONIBILIDAD_VISIBLE_WEB")
    promo_destacado: bool = Field(default=False, alias="PROMO_EN_DESTACADO")
    activo_en_web: bool = Field(default=True, alias="ACTIVO_EN_WEB")
    estado_web: EstadoWeb = Field(default=EstadoWeb.BORRADOR, alias="ESTADO_WEB")
    orden: int = Field(default=0, alias="ORDEN_WEB")
    cta_texto: Optional[str] = Field(default=None, alias="CTA_TEXTO")
    envio_disponible: bool = Field(default=False, alias="ENVIO_DISPONIBLE")
    retiro_en_local: bool = Field(default=False, alias="RETIRO_EN_LOCAL")
    descripcion: Optional[str] = Field(default=None, alias="DESCRIPCION_WEB")
    url_detalle: Optional[str] = Field(default=None, alias="URL_DETALLE_WEB")
    url_compra: Optional[str] = Field(default=None, alias="URL_COMPRA_DIRECTA")
    venta_habilitada: bool = Field(default=False, alias="VENTA_HABILITADA_WEB")
    carrito_habilitado: bool = Field(default=False, alias="CARRITO_HABILITADO")
    tienda_web: bool = Field(default=False, alias="TIENDA_WEB")
    funnel_venta: bool = Field(default=False, alias="FUNNEL_VENTA")
    comentarios_habilitados: bool = Field(default=False, alias="COMENTARIOS_RESEÑAS_HABILITADOS")
    visibilidad: VisibilidadWeb = Field(default=VisibilidadWeb.OCULTO, alias="VISIBILIDAD_WEB")
    seo: SeoProductoWebSchema = Field(default_factory=SeoProductoWebSchema)
    fecha_creacion: Optional[date] = Field(default=None, alias="FECHA_CREACION")
    fecha_publicacion: Optional[date] = Field(default=None, alias="FECHA_PUBLICACION_WEB")
    fecha_despublicacion: Optional[date] = Field(default=None, alias="FECHA_DESPUBLICACION_WEB")
    ultima_actualizacion: Optional[date] = Field(default=None, alias="ULTIMA_ACTUALIZACION")
    comportamiento_sin_stock: Optional[ComportamientoSinDisponibilidad] = Field(default=None, alias="COMPORTAMIENTO_SIN_DISPONIBILIDAD")
    producto_fuente_id: Optional[str] = Field(default=None, alias="PRODUCTO")
    carrito_items: list[str] = Field(default_factory=list, alias="CARRITO_ITEMS")
    # IA (visible para roles autorizados)
    ia: Optional[DatosIAGeneradosSchema] = None
    # Revisión humana (visible para roles autorizados)
    revision: Optional[RevisionIAProductoWebSchema] = None

    class Config:
        populate_by_name = True


# ── Tienda: schema público filtrado ──

class ProductoWebTiendaCardSchema(BaseModel):
    """Tarjeta de producto en /tienda (listado)."""
    id: str
    nombre: str = Field(alias="NOMBRE_PUBLICO_PRODUCTO")
    precio: Optional[Decimal] = Field(default=None, alias="PRECIO_WEB")
    precio_publicitado: Optional[Decimal] = Field(default=None, alias="PRECIO_PUBLICITADO_WEB")
    imagen_portada: Optional[dict] = Field(default=None, alias="IMAGEN_PORTADA_WEB")
    tipo_publicacion: TipoPublicacionWeb = Field(default=TipoPublicacionWeb.NORMAL, alias="TIPO_PUBLICACION_WEB")
    estado_disponibilidad: Optional[EstadoDisponibilidadWeb] = Field(default=None, alias="ESTADO_DISPONIBILIDAD_WEB")
    mostrar_disponibilidad: bool = Field(default=False, alias="MOSTRAR_DISPONIBILIDAD_WEB")
    disponibilidad_visible: Optional[int] = Field(default=None, alias="DISPONIBILIDAD_VISIBLE_WEB")
    promo_destacado: bool = Field(default=False, alias="PROMO_EN_DESTACADO")
    cta_texto: Optional[str] = Field(default=None, alias="CTA_TEXTO")
    envio_disponible: bool = Field(default=False, alias="ENVIO_DISPONIBLE")
    retiro_en_local: bool = Field(default=False, alias="RETIRO_EN_LOCAL")
    venta_habilitada: bool = Field(default=False, alias="VENTA_HABILITADA_WEB")
    carrito_habilitado: bool = Field(default=False, alias="CARRITO_HABILITADO")
    tienda_web: bool = Field(default=False, alias="TIENDA_WEB")
    funnel_venta: bool = Field(default=False, alias="FUNNEL_VENTA")
    comentarios_habilitados: bool = Field(default=False, alias="COMENTARIOS_RESEÑAS_HABILITADOS")
    seo_slug: Optional[str] = Field(default=None, alias="SEO_SLUG_WEB")
    comportamiento_sin_stock: Optional[ComportamientoSinDisponibilidad] = Field(default=None, alias="COMPORTAMIENTO_SIN_DISPONIBILIDAD")

    class Config:
        populate_by_name = True


class ProductoWebTiendaDetalleSchema(ProductoWebTiendaCardSchema):
    """Detalle de producto en /tienda (vista individual)."""
    descripcion_publica: Optional[str] = None  # TEXTO_PROMOCIONAL_APROBADO_WEB (nunca IA cruda)
    categoria_publica: Optional[str] = None    # CATEGORIA_WEB_APROBADA_MANUAL (nunca IA cruda)
    url_detalle: Optional[str] = Field(default=None, alias="URL_DETALLE_WEB")
    url_compra: Optional[str] = Field(default=None, alias="URL_COMPRA_DIRECTA")
    seo_titulo: Optional[str] = Field(default=None, alias="SEO_TITULO")
    seo_descripcion: Optional[str] = Field(default=None, alias="SEO_DESCRIPCION")
    seo_tags: list[str] = Field(default_factory=list, alias="SEO_TAGS_KEYWORDS")

    class Config:
        populate_by_name = True


# ── Schema: usado en /api/schema/productos-web ──

class CampoInfo(BaseModel):
    name: str
    type: str

class SchemaProductosWebResponse(BaseModel):
    tabla: str
    id: str
    total_campos: int
    campos: list[CampoInfo]
