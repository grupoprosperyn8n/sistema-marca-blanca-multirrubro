# PRODUCTOS_WEB Data Contract

> **Versión**: 1.0.0 — FASE_1H_F  
> **Endpoint**: `GET /api/productos-web` (público, read-only)  
> **Backend**: FastAPI en Railway  
> **Última actualización**: 2026-06-20

---

## 1. Arquitectura de datos

```
┌──────────────────────────────────────────────┐
│                  AIRTABLE                     │
│  ┌──────────────┐   ┌──────────────────────┐ │
│  │  PRODUCTOS   │──▶│   PRODUCTOS_WEB      │ │
│  │  (fuente     │   │   (capa de override) │ │
│  │   de verdad) │   │                      │ │
│  └──────────────┘   └──────────────────────┘ │
└──────────────────────┬───────────────────────┘
                       │ FastAPI (AirtableClient)
                       ▼
┌──────────────────────────────────────────────┐
│              FASTAPI BACKEND                  │
│  productos_web_service.py                    │
│  ┌─────────────────────────────────────────┐ │
│  │ 1. Lee PRODUCTOS_WEB (8 registros)      │ │
│  │ 2. Resuelve vínculos PRODUCTOS (bulk)   │ │
│  │ 3. Aplica gate de publicación (5 cond)  │ │
│  │ 4. Detecta precio anómalo (>5x)         │ │
│  │ 5. Construye entidad pública final      │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ GET /api/productos-web → JSON público   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Regla de oro**: `PRODUCTOS` es la fuente de verdad. `PRODUCTOS_WEB` es una capa de especialización para publicación web — hereda de `PRODUCTOS` y permite overrides controlados.

---

## 2. Contrato de respuesta

### 2.1 Estructura raíz

```json
{
  "total": 3,
  "total_leidos": 8,
  "productos": [ ... ],
  "excluidos": [ ... ],
  "anomalias": [ ... ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | int | Productos públicos devueltos |
| `total_leidos` | int | Registros leídos de PRODUCTOS_WEB |
| `productos` | array | Productos que pasaron el gate y sin anomalías |
| `excluidos` | array | Productos excluidos + motivo |
| `anomalias` | array | Anomalías detectadas (precio, etc.) |

### 2.2 Entidad producto público

```json
{
  "id": "recXXXX",
  "nombre_visible": "SHAMPOO NUTRITIVO",
  "descripcion_visible": "Shampoo de uso profesional...",
  "precio_visible": 135.0,
  "precio_oferta_web": 135.0,
  "categoria_publica": "CUIDADO_CAPILAR",
  "imagen_principal": {
    "url": "https://...",
    "filename": "147412_1-53b63079...",
    "width": 500,
    "height": 500
  },
  "alt_text": "SHAMPOO NUTRITIVO",
  "estado_web": "PUBLICADO",
  "destacado": false,
  "cta": "Conocé este producto",
  "slug": ""
}
```

| Campo | Origen (prioridad 1 → 2 → 3) |
|-------|-------------------------------|
| `nombre_visible` | `NOMBRE_PUBLICO_PRODUCTO` → `NOMBRE_PRODUCTO` |
| `descripcion_visible` | `TEXTO_PROMOCIONAL_APROBADO_WEB` → `DESCRIPCION_WEB` → `DESCRIPCION_COMERCIAL` |
| `precio_visible` | `PRECIO_PUBLICITADO_WEB` → `PRECIO_WEB` → `PRECIO_VENTA` |
| `precio_oferta_web` | `PRECIO_PUBLICITADO_WEB` (si oferta activa) o `null` |
| `categoria_publica` | `CATEGORIA_APROBADA` → `AGENTE_CATEGORIZACION_AI` → `CATEGORIA_PRODUCTO` |
| `imagen_principal` | `IMAGEN_PORTADA_WEB` → `FOTO_PRODUCTO` |
| `alt_text` | Igual que `nombre_visible` |
| `estado_web` | `ESTADO_WEB` (de PRODUCTOS_WEB) |
| `destacado` | `DESTACADO_WEB` (bool) |
| `cta` | `CTA_PERSONALIZADO_WEB` o default según categoría |
| `slug` | `SLUG_WEB` o vacío |

---

## 3. Gate de publicación (5 condiciones AND)

Un producto solo aparece en `productos[]` si **TODAS** se cumplen:

| # | Campo | Valor requerido |
|---|-------|-----------------|
| 1 | `APROBADO_USO_FRONTEND_IA` | `true` |
| 2 | `ESTADO_REVISION_IA_WEB` | `"APROBADO"` |
| 3 | `ESTADO_WEB` | `"PUBLICADO"` |
| 4 | `VISIBILIDAD_WEB` | `"PUBLICO"` |
| 5 | `ACTIVO_EN_WEB` | `true` |

Si alguna falla → va a `excluidos[]` con `motivo: "no_pasa_gate_publicacion"` y el detalle de qué campos fallaron.

---

## 4. Detección de precio anómalo

**Regla**: Si `PRECIO_PUBLICITADO_WEB / PRECIO_WEB > 5.0`, el producto se excluye del resultado público.

| Acción | Detalle |
|--------|---------|
| Excluir de `productos[]` | ✅ |
| Reportar en `excluidos[]` | ✅ con `motivo: "precio_anomalo"` |
| Reportar en `anomalias[]` | ✅ con tipo y ratio |
| Corregir en Airtable | ❌ NO automático |
| Corregir manualmente | ❌ Requiere aprobación |

---

## 5. Campos NO expuestos (lista negra)

Estos campos NUNCA aparecen en la respuesta pública:

- Costos: `COSTO_UNITARIO`, `COSTO_PROMEDIO`, `MARGEN`
- Proveedores: `PROVEEDOR`, `PROVEEDOR_ID`, `PROVEEDOR_CONTACTO`
- IA cruda: `AGENTE_CATEGORIZACION_AI` (solo se usa para fallback de categoría, pero el valor crudo no se expone)
- Internos: `SUCURSAL_ID`, `NOTAS_INTERNAS`, `CREADO_POR`, `MODIFICADO_POR`
- Estados IA: `ESTADO_REVISION_IA_WEB`, `APROBADO_USO_FRONTEND_IA` (solo se usan en el gate, no se exponen)

---

## 6. Seguridad

- **Método**: Solo GET (read-only).
- **Autenticación**: Público. Sin headers de rol ni tokens.
- **Token Airtable**: Solo en backend (`.env` de Railway). Nunca en frontend.
- **CORS**: Permitido para frontend en Surge.
- **Rate limit**: No implementado aún (bajo volumen).
