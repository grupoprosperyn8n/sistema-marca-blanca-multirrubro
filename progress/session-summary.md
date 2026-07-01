# progress/session-summary.md — PORTAL_CLIENTE_UX_COMMERCE_P4

Fecha: 2026-06-30
Dominio comercial: https://bellezapro-demo.surge.sh
Backend: Railway `earnest-comfort`

## Estado

- Fase: PORTAL_CLIENTE_UX_COMMERCE_P4
- Estado: completado, commiteado, pusheado y desplegado.
- Dominio canónico comercial: `bellezapro-demo.surge.sh`.

## Implementado

- Carrito sandbox ampliado a productos, servicios y packs.
- Reglas comerciales visibles: upsell, cross-sell, promociones y cupones desde Airtable.
- Header público y portal con icono 🛒 y contador.
- Servicio detalle puede agregar servicios al carrito sandbox si Airtable lo habilita.
- Portal cliente rediseñado:
  - ficha cliente con un solo botón de edición;
  - modal de edición;
  - turnos con nombres humanos;
  - historial de compras/pagos read-only.
- ReservaTurnoModal mejorado:
  - filtros de sucursales públicas reales;
  - strings corregidos;
  - UX de selección más clara.
- Backend `/api/clientes/me/compras` agregado en modo solo lectura.

## Validación local

- `python3 -m py_compile backend/routes/carrito.py backend/routes/clientes.py backend/main.py`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- Secret scan archivos modificados: PASS.
- `/health` local: 200.
- `/api/carrito` sin auth: 401.
- `/api/clientes/me/compras` sin auth: 401.
- `/api/commerce/public`: carrito sandbox true; checkout/pagos/POS false.
- `/api/servicios-web`: 9 servicios, 9 con carrito habilitado, 8 con imágenes.

## Límites respetados

- No pagos reales.
- No checkout.
- No caja/POS.
- No `RESERVAS`.
- No DELETE físico.
- No cambios de schema Airtable.
- No escrituras en `VENTAS`, `ITEMS_VENTA` ni `PAGOS_COBROS`.
- No se tocaron `.env`, `backend/.env`, `frontend/.env` ni `CREDENCIALES.md`.

## Riesgo/dato pendiente

- Airtable no tiene sucursal pública real activa para mostrar en reserva. Hay sucursales ficticias/internas y una `Sucursal Centro` pública pero `ACTIVO=false`. No se modificó porque este bloque no autoriza cambios de datos reales/schema.

## Próximo paso recomendado

- Abrir contrato P5 para checkout/pagos/caja/POS antes de cualquier pago real.

## Deploy final

- Commit principal: `b07ab91`
- Railway: PASS online deployment `5546bd59-fd11-4898-947f-bd28c385c114`
- Surge: PASS `https://bellezapro-demo.surge.sh`
- Smoke live: health 200, carrito unauth 401, compras unauth 401, commerce public flags seguros, rutas Surge 200.
