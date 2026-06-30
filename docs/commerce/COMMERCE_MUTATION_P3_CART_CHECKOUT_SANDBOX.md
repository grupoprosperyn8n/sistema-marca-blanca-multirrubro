# COMMERCE_MUTATION_P3_CART_CHECKOUT_SANDBOX

**Fecha:** 2026-06-29
**Estado:** cerrado con QA + deploy
**Dominio comercial:** `https://bellezapro-demo.surge.sh`

## Objetivo

Activar un primer carrito web de prueba para el portal cliente sin convertirlo en venta real.

La fase permite validar UX y persistencia mínima en Airtable, pero mantiene bloqueados:

- checkout real;
- pagos online;
- caja/POS;
- `VENTAS`;
- `ITEMS_VENTA`;
- `PAGOS_COBROS`;
- `RESERVAS`;
- reserva de stock real.

## Tablas Airtable usadas

| Tabla | Uso | Escritura |
|---|---|---|
| `CARRITOS` | cabecera del carrito sandbox del cliente | sí, mínima |
| `CARRITO_ITEMS` | items del carrito sandbox | sí, mínima |
| `PRODUCTOS_WEB` | validación de producto publicado y habilitado | solo lectura |
| `CLIENTES` | referencia segura del cliente vinculado | solo lectura |

No se crean campos ni tablas.

## Endpoints

### `GET /api/carrito`

Devuelve el carrito sandbox activo del cliente autenticado.

- requiere sesión;
- requiere rol `CLIENTE`;
- no crea registros;
- devuelve flags explícitos:
  - `sandbox: true`
  - `checkout_enabled: false`
  - `online_payments_enabled: false`
  - `physical_pos_enabled: false`

### `POST /api/carrito/items`

Agrega un `PRODUCTOS_WEB` al carrito sandbox.

Reglas:

- producto debe estar publicado en `/api/productos-web`;
- producto debe tener `CARRITO_HABILITADO` o `VENTA_HABILITADA_WEB`;
- producto no puede estar `SIN_STOCK`, `BAJA_TEMPORAL` o `SUSPENDIDO`;
- cantidad permitida: 1 a 20;
- si el producto ya existe activo en el carrito, se incrementa cantidad;
- no reserva stock;
- no crea venta;
- no crea pago;
- no crea reserva.

### `PATCH /api/carrito/items/{item_id}`

Actualiza cantidad de un item propio del cliente.

### `DELETE /api/carrito/items/{item_id}`

Baja lógica del item:

- `ESTADO_ITEM_CARRITO = CANCELADO`;
- `ACTIVO = false`;
- no borra físicamente el registro.

## Frontend

Archivos principales:

- `frontend/src/pages/ProductoDetalle.jsx`
  - muestra CTA `Agregar al carrito` solo si el producto está habilitado;
  - si el usuario no está logueado, muestra `Ingresar para comprar`;
  - éxito lleva a `/carrito`;
  - aclara que checkout/pagos/caja siguen desactivados.

- `frontend/src/pages/Carrito.jsx`
  - muestra items, cantidades, subtotal y total sandbox;
  - permite cambiar cantidad;
  - permite quitar item con baja lógica;
  - muestra botón `Checkout desactivado`.

- `frontend/src/components/PublicNavbar.jsx`
  - muestra link `Carrito` solo a usuario `CLIENTE`.

- `frontend/src/layouts/PortalLayout.jsx`
  - agrega navegación a `Carrito`.

## Garantías

- No DELETE físico.
- No `RESERVAS`.
- No pagos.
- No checkout real.
- No caja/POS.
- No `VENTAS`, `ITEMS_VENTA`, `PAGOS_COBROS`.
- No cambios de schema Airtable.
- No secretos al frontend.

## QA ejecutada

- Local y live: `GET /api/carrito` sin auth → `401`.
- Local y live: login cliente QA → `200`.
- `POST /api/carrito/items` → `201`.
- `PATCH /api/carrito/items/{id}` cantidad 2 → `200`.
- `DELETE /api/carrito/items/{id}` → `200`, baja lógica.
- `GET /api/carrito` posterior → `200`, `items=0`, `checkout=false`, `payments=false`.

Registros QA creados:

- `CARRITOS`: un carrito sandbox QA, `ESTADO_CARRITO=EN_CURSO`, `CANTIDAD_ITEMS_ESTIMADA=0`, `SUBTOTAL_CARRITO=0`, `MONTO_PAGADO=0`.
- `CARRITO_ITEMS`: un item sandbox QA, luego marcado `CANCELADO` por baja lógica.

## Deploy

- Backend Railway `earnest-comfort`: deploy `d4541ad` exitoso y corriendo.
- Frontend Surge: `https://bellezapro-demo.surge.sh` publicado.
