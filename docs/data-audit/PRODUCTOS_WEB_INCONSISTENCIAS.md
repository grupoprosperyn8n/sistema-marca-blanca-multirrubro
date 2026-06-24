# PRODUCTOS_WEB — Auditoría de Inconsistencias

> **Versión**: 1.0.0 — FASE_1H_F  
> **Fecha de auditoría**: 2026-06-20  
> **Endpoint validado**: `GET /api/productos-web` (Railway)  
> **Total registros PRODUCTOS_WEB**: 8  
> **Estado**: Read-only validation ✅

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Registros totales leídos | 8 |
| Productos públicos (pasaron gate) | 3 (37.5%) |
| Excluidos por gate | 4 (50%) |
| Excluidos por anomalía de precio | 1 (12.5%) |
| Anomalías detectadas | 1 |
| % datos limpios para frontend | 37.5% |

---

## 2. Anomalía de precio — MASCARA HIDRATANTE 🔴

| Campo | Valor |
|-------|-------|
| **ID** | `recMgJGluxUzTqpQU` |
| **Producto** | MASCARA HIDRATANTE |
| **PRECIO_PUBLICITADO_WEB** | $120,000 |
| **PRECIO_WEB** | $12,000 |
| **Ratio** | **10.0x** |
| **Acción tomada** | Excluido de resultados públicos |
| **Acción pendiente** | Corregir precio en PRODUCTOS_WEB (requiere aprobación) |

**Diagnóstico**: El precio publicitado es 10 veces el precio web. Probable error de tipeo (un cero extra: ¿debía ser $12,000?). No se corrige automáticamente — requiere PATCH manual con autorización.

**Riesgo**: Si se publicara sin filtrar, el catálogo mostraría un producto a $120,000 cuando su precio real es $12,000. Esto dañaría la confianza del cliente.

---

## 3. Excluidos por gate de publicación 🟡

### 3.1 TOALLAS DE ALGODON X12 — RECHAZADO

| Campo | Valor real | Requerido |
|-------|-----------|-----------|
| `APROBADO_USO_FRONTEND_IA` | `false` | `true` |
| `ESTADO_REVISION_IA_WEB` | `"RECHAZADO"` | `"APROBADO"` |
| `ACTIVO_EN_WEB` | `false` | `true` |

**Diagnóstico**: La IA rechazó este producto para uso en frontend. Revisar motivo del rechazo.

### 3.2 SECADOR PROFESIONAL 2000W — PENDIENTE

| Campo | Valor real | Requerido |
|-------|-----------|-----------|
| `APROBADO_USO_FRONTEND_IA` | `false` | `true` |
| `ESTADO_REVISION_IA_WEB` | `"PENDIENTE"` | `"APROBADO"` |
| `ACTIVO_EN_WEB` | `false` | `true` |

**Diagnóstico**: Pendiente de revisión IA. Una vez aprobado, pasará el gate automáticamente.

### 3.3 SERVICIO ASESORIA ESTETICA — REVISAR

| Campo | Valor real | Requerido |
|-------|-----------|-----------|
| `APROBADO_USO_FRONTEND_IA` | `false` | `true` |
| `ESTADO_REVISION_IA_WEB` | `"REVISAR"` | `"APROBADO"` |
| `ACTIVO_EN_WEB` | `false` | `true` |

**Diagnóstico**: La IA marcó este ítem para revisión manual. Posiblemente porque es un servicio (no un producto físico) y requiere tratamiento distinto.

### 3.4 ALISADO KERATINA PREMIUM — Sin revisión

| Campo | Valor real | Requerido |
|-------|-----------|-----------|
| `APROBADO_USO_FRONTEND_IA` | `false` | `true` |
| `ESTADO_REVISION_IA_WEB` | `null` | `"APROBADO"` |
| `ESTADO_WEB` | `null` | `"PUBLICADO"` |
| `ACTIVO_EN_WEB` | `false` | `true` |

**Diagnóstico**: Sin revisión IA, sin estado web. Producto sin procesar — necesita pasar por el pipeline de revisión.

---

## 4. Productos públicos (pasaron gate) 🟢

| # | Producto | Precio | Categoría | Imagen |
|---|----------|--------|-----------|--------|
| 1 | SHAMPOO NUTRITIVO | $135 | CUIDADO_CAPILAR | ✅ |
| 2 | ACONDICIONADOR REPARADOR | $70 | CUIDADO_CAPILAR | ✅ |
| 3 | KIT MANICURA BASICO | $4,560 | KIT_PRODUCTOS | ✅ |

Los 3 productos tienen todos los campos correctos: nombres humanos, descripciones aprobadas, imágenes funcionales, sin datos sensibles expuestos.

---

## 5. Sucursal oculta en producto

**Hallazgo**: El campo `SUCURSAL_ID` existe en PRODUCTOS_WEB pero está en la lista negra de campos no expuestos. Es correcto: la sucursal es metadata operativa que no debe aparecer en el catálogo público.

---

## 6. Campos IA no publicados

**Confirmado**: `AGENTE_CATEGORIZACION_AI` se usa solo como fallback interno para `categoria_publica`, pero su valor crudo NUNCA se expone en la respuesta. Esto protege al frontend de categorizaciones no revisadas.

---

## 7. Próximos pasos (NO ejecutar sin aprobación)

| Acción | Prioridad | Requiere |
|--------|-----------|----------|
| Corregir PRECIO_PUBLICITADO_WEB de MASCARA | Alta | Aprobación + PATCH manual |
| Revisar TOALLAS (RECHAZADO) | Media | Decisión de negocio |
| Aprobar SECADOR (PENDIENTE) | Media | Pipeline IA |
| Revisar SERVICIO ASESORIA | Baja | Tratamiento de servicios |
| Procesar ALISADO KERATINA | Baja | Pipeline IA |
