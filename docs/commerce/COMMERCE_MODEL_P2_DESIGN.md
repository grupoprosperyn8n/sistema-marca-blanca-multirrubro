# COMMERCE_MODEL_P2_DESIGN_ONLY

**Fecha:** 2026-06-29  
**Estado:** P2 diseño + bootstrap read-only implementado  
**Dominio demo:** `https://bellezapro-demo.surge.sh`

## Objetivo

Preparar el modelo comercial marca blanca para venta online, upsell y cross-selling sin activar todavía carrito real, checkout, pagos, caja/POS ni escrituras en tablas de venta.

Este bloque es deliberadamente **read-only**: muestra oportunidades comerciales existentes desde Airtable, pero no crea `CARRITOS`, `CARRITO_ITEMS`, `VENTAS`, `ITEMS_VENTA`, `PAGOS_COBROS` ni cobros reales.

## Tablas existentes auditadas

| Dominio | Tablas | Estado |
|---|---|---|
| Catálogo | `PRODUCTOS`, `PRODUCTOS_WEB`, `SERVICIOS`, `SERVICIOS_WEB` | Ya alimentan frontend público |
| Bundles/upsell | `PACKS`, `PACK_ITEMS` | Datos presentes; se exponen como recomendaciones read-only |
| Promos | `PROMOCIONES`, `CUPONES` | Datos presentes; se exponen como beneficios read-only |
| Carrito | `CARRITOS`, `CARRITO_ITEMS` | No se escribe en esta fase |
| Ventas | `VENTAS`, `ITEMS_VENTA` | No se escribe en esta fase |
| Cobros | `PAGOS_COBROS`, `CUENTAS_COBRO` | No se expone cuenta/cobro real en esta fase |
| Inventario | `STOCK_OPERATIVO`, `MOVIMIENTOS_INVENTARIO` | Auditado como dependencia para fase real |

## Endpoint nuevo

### `GET /api/commerce/public`

Contrato público seguro para recomendaciones comerciales.

Devuelve:

- `packs[]`
- `promotions[]`
- `coupons[]`
- `counts`
- flags de seguridad:
  - `cart_enabled: false`
  - `checkout_enabled: false`
  - `online_payments_enabled: false`
  - `physical_pos_enabled: false`

También devuelve `blocked_operations` para dejar explícito que esta fase no habilita operaciones mutantes.

## Reglas de publicación read-only

### Packs

Se muestran solo si:

- `ESTADO_PACK = ACTIVO`
- `APLICA_WEB` o `MOSTRAR_EN_WEB`
- `PACK_VIGENTE_AUTO` no indica vencido
- `APROBADO` no es falso

Campos públicos seguros:

- título, descripción, categoría/tipo, modo de venta
- precio lista/promocional
- imagen, CTA
- si permite reserva/compra como información, no como operación real

### Promociones

Se muestran solo si:

- `ESTADO_PROMOCION = ACTIVA`
- `APLICA_WEB` o `MOSTRAR_EN_WEB`
- `PROMOCION_VIGENTE_AUTO` no indica vencida
- `APROBADO` no es falso

### Cupones

Se muestran solo si:

- `ESTADO_CUPON = ACTIVO`
- `APLICA_WEB = true`
- canal `WEB`, `MIXTO`, `TODAS` o equivalente
- `CUPON_VIGENTE_AUTO` no indica vencido
- `APROBADO` no es falso

## Frontend aplicado

`ProductoDetalle.jsx` ahora consulta `GET /api/commerce/public` y muestra una sección de:

> Packs, promos y beneficios relacionados

La sección aclara explícitamente:

> Sin carrito, checkout ni pago activo en esta fase.

Esto permite mostrar upsell/cross-selling desde Airtable sin fingir una venta online todavía no implementada.

## Por qué no se activa carrito/pagos todavía

Activar carrito real implica:

1. reservar stock o turnos;
2. convertir carrito a venta;
3. crear items de venta;
4. registrar pago/cobro;
5. manejar idempotencia;
6. manejar webhook de pasarela;
7. definir reversas/cancelaciones;
8. proteger claves de proveedor en backend.

Hacerlo sin ese contrato completo rompe datos comerciales. Por eso este bloque deja lista la capa de lectura y recomienda el siguiente bloque mutante por separado.

## Siguiente bloque recomendado

`COMMERCE_MUTATION_P3_CART_CHECKOUT_SANDBOX`

Alcance recomendado:

- carrito real con sesión/cliente;
- crear `CARRITOS` + `CARRITO_ITEMS` QA solamente;
- sin pagos reales;
- checkout sandbox o preferencia mock;
- stock/turnos en dry-run antes de reservar;
- conversión controlada a `VENTAS` + `ITEMS_VENTA` solo con aprobación explícita.

## Garantías de esta fase

- No pagos reales.
- No checkout real.
- No caja/POS.
- No escrituras en `CARRITOS`, `CARRITO_ITEMS`, `VENTAS`, `ITEMS_VENTA` ni `PAGOS_COBROS`.
- No schema changes Airtable.
- No secretos al frontend.
