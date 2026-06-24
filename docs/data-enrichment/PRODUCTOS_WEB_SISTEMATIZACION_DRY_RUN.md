# PRODUCTOS_WEB — Sistematización Dry Run

> **Versión**: 1.0.0 — FASE_1H_F  
> **Propósito**: Documentar el plan de sistematización de PRODUCTOS_WEB sin ejecutar cambios en Airtable.  
> **Última actualización**: 2026-06-20

---

## ⚠️ ESTADO: DRY RUN — NO EJECUTAR

Este documento describe acciones **planeadas pero NO autorizadas**. Cada acción requiere aprobación explícita y se lista como PATCH potencial. Ninguna de estas acciones se ha ejecutado sobre Airtable.

---

## 1. Relación PRODUCTOS ↔ PRODUCTOS_WEB

```
PRODUCTOS (fuente de verdad)
    │
    │  1:N — un producto puede tener 0 o 1 registro en PRODUCTOS_WEB
    ▼
PRODUCTOS_WEB (capa de override + metadatos web)
```

### Campos heredados de PRODUCTOS (no duplicados en PRODUCTOS_WEB)

| Campo en PRODUCTOS | Se usa como fallback en |
|---------------------|------------------------|
| `NOMBRE_PRODUCTO` | `nombre_visible` |
| `DESCRIPCION_COMERCIAL` | `descripcion_visible` |
| `PRECIO_VENTA` | `precio_visible` |
| `CATEGORIA_PRODUCTO` | `categoria_publica` |
| `FOTO_PRODUCTO` | `imagen_principal` |

### Campos override en PRODUCTOS_WEB (reemplazan al de PRODUCTOS si existen)

| Campo en PRODUCTOS_WEB | Override de |
|--------------------------|-------------|
| `NOMBRE_PUBLICO_PRODUCTO` | `NOMBRE_PRODUCTO` |
| `TEXTO_PROMOCIONAL_APROBADO_WEB` | `DESCRIPCION_COMERCIAL` |
| `PRECIO_PUBLICITADO_WEB` | `PRECIO_VENTA` |
| `CATEGORIA_APROBADA` | `CATEGORIA_PRODUCTO` |
| `IMAGEN_PORTADA_WEB` | `FOTO_PRODUCTO` |

---

## 2. Sistematización planeada (DRY RUN)

### 2.1 Pipeline de revisión IA → Publicación

```
[REGISTRO CREADO] → [IA revisa] → [ESTADO_REVISION_IA_WEB]
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                   APROBADO         RECHAZADO        REVISAR
                        │               │               │
                        ▼               ▼               ▼
              [IA genera textos]  [Reportar motivo]  [Notificar humano]
                        │
                        ▼
              [Humano revisa/ajusta]
                        │
                        ▼
              [Marcar APROBADO_USO_FRONTEND_IA=true]
                        │
                        ▼
              [Set ESTADO_WEB=PUBLICADO]
                        │
                        ▼
              [Set ACTIVO_EN_WEB=true]
                        │
                        ▼
              [Visible en GET /api/productos-web]
```

### 2.2 Validaciones automáticas planeadas

| Validación | Regla | Acción si falla |
|------------|-------|-----------------|
| Precio anómalo | `PUBLICITADO / WEB > 5.0` | Excluir + reportar en anomalías |
| Sin imagen | `IMAGEN_PORTADA_WEB` y `FOTO_PRODUCTO` vacíos | Excluir + log warning |
| Sin categoría | `CATEGORIA_APROBADA`, `AGENTE_CATEGORIZACION_AI` y `CATEGORIA_PRODUCTO` vacíos | Asignar `"SIN_CATEGORIA"` |
| Descripción vacía | `descripcion_visible` resulta `""` | Devolver placeholder |
| Precio cero | `precio_visible == 0` | Excluir (producto sin precio) |

---

## 3. PATCH potenciales (NO autorizados aún)

### 3.1 PATCH-001: Corregir precio MASCARA HIDRATANTE

```
Endpoint: PATCH /api/productos-web/{id}
Body: {
  "PRECIO_PUBLICITADO_WEB": 12000
}
Riesgo: Bajo — es una corrección de typo evidente (10x)
Aprobación requerida: ✅ Sí
```

### 3.2 PATCH-002: Revisar TOALLAS rechazadas

```
Acción: Revisar motivo de rechazo IA y decidir si corregir o mantener excluido
Riesgo: Bajo — no afecta datos en producción
Aprobación requerida: ✅ Sí
```

### 3.3 PATCH-003: Completar pipeline de SECADOR

```
Acción: Ejecutar revisión IA → aprobar → publicar
Riesgo: Bajo si la IA ya tiene datos del producto
Aprobación requerida: ✅ Sí
```

### 3.4 PATCH-004: Normalizar nombres de categoría

```
Acción: Reemplazar CATEGORIA_APROBADA con nombres display-friendly
Ejemplo: "CUIDADO_CAPILAR" → "Cuidado Capilar"
Riesgo: Muy bajo — solo cambia display, no datos
Aprobación requerida: ✅ Sí
```

---

## 4. Siguiente fase: FASE_1H_G

**FASE_1H_G_FRONTEND_CATALOGO_PRODUCTOS**: Integrar `GET /api/productos-web` en el frontend Surge (`static/index.html`), mostrando catálogo público de productos con:

- Grid de productos con imagen, nombre, precio, categoría
- Filtros por categoría
- Vista detalle de producto
- Diseño responsive (mobile-first)

**Endpoint**: `https://earnest-comfort-production-3d75.up.railway.app/api/productos-web`

**No incluye**: carrito, checkout, pagos, login de cliente, gestión de inventario.

---

## 5. Check de seguridad

| Verificación | Estado |
|-------------|--------|
| Sin PATCH ejecutado | ✅ |
| Sin POST ejecutado | ✅ |
| Sin DELETE ejecutado | ✅ |
| Sin cambio de schema | ✅ |
| Sin tokens expuestos | ✅ |
| Sin IA cruda publicada | ✅ |
| Sin costos/proveedores/márgenes | ✅ |
| Documentación creada | ✅ (este archivo + 3 más) |
