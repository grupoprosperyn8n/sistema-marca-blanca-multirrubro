# progress/session-summary.md — COMMERCE_MUTATION_P3_CART_CHECKOUT_SANDBOX

## Sesión
- Fecha: 2026-06-29
- Fase: COMMERCE_MUTATION_P3_CART_CHECKOUT_SANDBOX
- Estado: CERRADA_QA_DEPLOY
- Commit feature: d4541ad

## Objetivo
Activar carrito web sandbox para cliente sin pagos reales, checkout real, caja/POS, ventas, cobros ni RESERVAS.

## Implementado
- Backend `backend/routes/carrito.py`:
  - `GET /api/carrito`
  - `POST /api/carrito/items`
  - `PATCH /api/carrito/items/{item_id}`
  - `DELETE /api/carrito/items/{item_id}` con baja lógica.
- `GET /api/commerce/public` ahora declara `cart_enabled=true`, `cart_mode=SANDBOX`, `checkout_enabled=false`, `online_payments_enabled=false`, `physical_pos_enabled=false`.
- `PRODUCTOS_WEB` expone flags públicos seguros `cart_enabled`, `purchase_enabled`, `availability_state`.
- Frontend:
  - `ProductoDetalle.jsx` agrega CTA `Agregar al carrito` para cliente.
  - Nueva página `/carrito` protegida para cliente.
  - Navbar público y portal agregan link `Carrito`.

## QA
- `py_compile`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- Secret scan estricto en diff: PASS.
- Local:
  - sin auth `/api/carrito` → 401.
  - login cliente QA → 200.
  - agregar item → 201.
  - editar cantidad → 200.
  - quitar item → 200, baja lógica.
- Live:
  - `/health` → 200 con `/api/carrito`.
  - `/api/commerce/public` → cart sandbox true, checkout/pagos false.
  - `/api/productos-web` → flags carrito presentes.
  - `/api/carrito` sin auth → 401.
  - login cliente QA + add/delete lógico → PASS.

## Garantías
- No se tocó `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.
- No se expusieron secretos, passwords, cookies, JWT ni hashes.
- No DELETE físico.
- No schema changes Airtable.
- No `RESERVAS`.
- No pagos, checkout, caja/POS, `VENTAS`, `ITEMS_VENTA` ni `PAGOS_COBROS`.
- Escrituras autorizadas solo en `CARRITOS` y `CARRITO_ITEMS` QA/sandbox.

## Deploy
- Railway `earnest-comfort`: SUCCESS/RUNNING en commit `d4541ad`.
- Surge comercial: https://bellezapro-demo.surge.sh

## Próximo bloque recomendado
COMMERCE_MUTATION_P4_CHECKOUT_SANDBOX_OR_POS_DESIGN: diseñar checkout/caja como contrato primero, sin pagos reales hasta aprobación explícita.
