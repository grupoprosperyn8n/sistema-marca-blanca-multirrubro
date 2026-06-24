# PRODUCTOS_WEB Field Matrix

> **Versión**: 1.0.0 — FASE_1H_F  
> **Propósito**: Documentar cada campo expuesto: origen, fallback, transformación.  
> **Última actualización**: 2026-06-20

---

## Matriz de campos

### Leyenda

- **P**: `PRODUCTOS` (tabla fuente de verdad)
- **W**: `PRODUCTOS_WEB` (capa de override web)
- **→**: fallback (si el primero es null/ausente, usar el siguiente)
- **⚠**: campo con validación o transformación adicional

---

### Campos expuestos en `GET /api/productos-web`

| # | Campo JSON | Origen 1 | Origen 2 | Origen 3 | Default | Notas |
|---|-----------|----------|----------|----------|---------|-------|
| 1 | `id` | W: `id` (record_id) | — | — | — | ID del registro en PRODUCTOS_WEB |
| 2 | `nombre_visible` | W: `NOMBRE_PUBLICO_PRODUCTO` | P: `NOMBRE_PRODUCTO` | — | — | Nombres humanos, sin underscores técnicos |
| 3 | `descripcion_visible` | W: `TEXTO_PROMOCIONAL_APROBADO_WEB` | W: `DESCRIPCION_WEB` | P: `DESCRIPCION_COMERCIAL` | `""` | Texto aprobado por IA, revisado |
| 4 | `precio_visible` ⚠ | W: `PRECIO_PUBLICITADO_WEB` | W: `PRECIO_WEB` | P: `PRECIO_VENTA` | `0` | Si ratio >5x con PRECIO_WEB → excluido |
| 5 | `precio_oferta_web` | W: `PRECIO_PUBLICITADO_WEB` | — | — | `null` | Solo si es oferta válida y distinta del precio regular |
| 6 | `categoria_publica` | W: `CATEGORIA_APROBADA` | W: `AGENTE_CATEGORIZACION_AI` ⚠ | P: `CATEGORIA_PRODUCTO` | `"SIN_CATEGORIA"` | ⚠ AGENTE_CATEGORIZACION_AI es fallback interno, no se expone su valor crudo |
| 7 | `imagen_principal.url` | W: `IMAGEN_PORTADA_WEB[0].url` | P: `FOTO_PRODUCTO[0].url` | — | `null` | URL firmada de Airtable |
| 8 | `imagen_principal.filename` | W: `IMAGEN_PORTADA_WEB[0].filename` | P: `FOTO_PRODUCTO[0].filename` | — | `null` | Nombre original del archivo |
| 9 | `imagen_principal.width` | W: `IMAGEN_PORTADA_WEB[0].width` | P: `FOTO_PRODUCTO[0].width` | — | `null` | Ancho en px |
| 10 | `imagen_principal.height` | W: `IMAGEN_PORTADA_WEB[0].height` | P: `FOTO_PRODUCTO[0].height` | — | `null` | Alto en px |
| 11 | `alt_text` | Campo #2 (nombre_visible) | — | — | — | Texto alternativo para accesibilidad |
| 12 | `estado_web` | W: `ESTADO_WEB` | — | — | — | Solo expuesto si `"PUBLICADO"` |
| 13 | `destacado` | W: `DESTACADO_WEB` | — | — | `false` | Flag para destacar en catálogo |
| 14 | `cta` | W: `CTA_PERSONALIZADO_WEB` | — | — | Default por categoría | Call-to-action visible en botón |
| 15 | `slug` | W: `SLUG_WEB` | — | — | `""` | Slug para URLs amigables |

---

### Campos del gate (NO expuestos, solo filtrado interno)

| Campo | Tabla | Uso |
|-------|-------|-----|
| `APROBADO_USO_FRONTEND_IA` | PRODUCTOS_WEB | Gate: debe ser `true` |
| `ESTADO_REVISION_IA_WEB` | PRODUCTOS_WEB | Gate: debe ser `"APROBADO"` |
| `ESTADO_WEB` | PRODUCTOS_WEB | Gate: debe ser `"PUBLICADO"` |
| `VISIBILIDAD_WEB` | PRODUCTOS_WEB | Gate: debe ser `"PUBLICO"` |
| `ACTIVO_EN_WEB` | PRODUCTOS_WEB | Gate: debe ser `true` |

---

### Campos bloqueados (NUNCA expuestos)

| Campo | Tabla | Razón |
|-------|-------|-------|
| `COSTO_UNITARIO` | PRODUCTOS | Información sensible de negocio |
| `COSTO_PROMEDIO` | PRODUCTOS | Márgenes internos |
| `MARGEN` | PRODUCTOS | Estrategia comercial confidencial |
| `PROVEEDOR` / `PROVEEDOR_ID` / `PROVEEDOR_CONTACTO` | PRODUCTOS | Relación con proveedores |
| `AGENTE_CATEGORIZACION_AI` | PRODUCTOS_WEB | IA cruda no revisada (solo fallback interno) |
| `SUCURSAL_ID` | PRODUCTOS_WEB | Datos de sucursal ocultos en producto |
| `NOTAS_INTERNAS` | PRODUCTOS_WEB | Información operativa privada |
| `MODIFICADO_POR` / `CREADO_POR` | Ambas | Metadatos de auditoría interna |

---

## Resumen de transformaciones

| Transformación | Lógica |
|----------------|--------|
| Precio anómalo | `PRECIO_PUBLICITADO_WEB / PRECIO_WEB > 5.0` → excluir + reportar |
| Oferta válida | Si `PRECIO_PUBLICITADO_WEB < PRECIO_WEB` y ambos > 0 |
| Categoría humana | `AGENTE_CATEGORIZACION_AI` → limpiar underscores → capitalizar |
| Imagen fallback | Si `IMAGEN_PORTADA_WEB` existe → usar; si no → `FOTO_PRODUCTO` |
| Descripción merge | Priorizar texto aprobado por IA, luego descripción web, luego comercial |
