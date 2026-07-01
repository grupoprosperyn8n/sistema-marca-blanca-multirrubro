# PORTAL_CLIENTE_UX_COMMERCE_P4

Fecha: 2026-06-30
Dominio comercial: https://bellezapro-demo.surge.sh
Backend: Railway `earnest-comfort`

## Objetivo

Mejorar el portal cliente y el carrito sandbox para que la demo marca blanca muestre un flujo comercial más realista: productos, servicios, packs, recomendaciones de marketing, icono de carrito, ficha cliente editable y historial read-only.

## Cambios aplicados

### Backend

- `backend/routes/carrito.py`
  - El carrito sandbox acepta `PRODUCTO_WEB`, `SERVICIO_WEB` y `PACK`.
  - `POST /api/carrito/items` mantiene compatibilidad con `product_id` y agrega `item_type`, `service_web_id`, `pack_id`.
  - Devuelve `marketing.upsell`, `marketing.cross_sell`, `marketing.promotions` y `marketing.coupons` desde tablas Airtable existentes.
  - `TIPO_CARRITO` se sincroniza como `COMPRA_PRODUCTO`, `RESERVA_SERVICIO`, `PACK` o `MIXTO` según composición.
  - No crea checkout, pagos, ventas, caja/POS ni `RESERVAS`.

- `backend/routes/clientes.py`
  - `/api/clientes/me/citas` devuelve DTO humano con `NOMBRE_SERVICIO`, `NOMBRE_PROFESIONAL`, `NOMBRE_SUCURSAL`, `TITULO_CITA` y `ESTADO_SLOT`.
  - Nuevo `GET /api/clientes/me/compras` read-only para historial de `VENTAS` y `PAGOS_COBROS` ya existentes.
  - No escribe en `VENTAS`, `ITEMS_VENTA` ni `PAGOS_COBROS`.

### Frontend

- Header público y layout portal muestran icono de carrito con contador.
- `/carrito` soporta items mixtos, muestra servicios/packs, upsell/cross-sell, promociones y cupones.
- `/servicios/:slug` permite agregar servicios al carrito sandbox cuando Airtable lo habilita.
- `/portal` rediseñado:
  - ficha cliente con un solo botón “Editar perfil”;
  - modal de edición;
  - métricas rápidas;
  - turnos con nombres humanos en vez de IDs;
  - historial de compras/pagos en solo lectura.
- `ReservaTurnoModal` filtra sucursales públicas reales y mejora textos/UX del stepper.

## Límites mantenidos

- Sin pagos reales.
- Sin checkout.
- Sin caja/POS.
- Sin creación de `RESERVAS`.
- Sin DELETE físico.
- Sin cambios de schema Airtable.
- Sin tocar `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- Escrituras de comercio permitidas solo en `CARRITOS` y `CARRITO_ITEMS` sandbox.

## QA local

- `python3 -m py_compile backend/routes/carrito.py backend/routes/clientes.py backend/main.py`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- Secret scan en archivos modificados: PASS.
- `/health` local: 200.
- `/api/carrito` sin auth: 401.
- `/api/clientes/me/compras` sin auth: 401.
- `/api/commerce/public` local: cart sandbox activo; checkout/pagos/POS false.
- `/api/servicios-web` local: 9 servicios, 9 reservables, 9 con carrito habilitado, 8 con imágenes.
- `/api/sucursales` local: no hay sucursales públicas activas reales; las ficticias/internas siguen filtradas.

## Observación de datos

Airtable todavía no tiene una sucursal pública real activa para mostrar en reserva: existen sucursales ficticias/internas y una `Sucursal Centro` pública pero `ACTIVO=false`. No se modificó ese dato porque el bloque no autoriza cambios de datos reales/schema.
