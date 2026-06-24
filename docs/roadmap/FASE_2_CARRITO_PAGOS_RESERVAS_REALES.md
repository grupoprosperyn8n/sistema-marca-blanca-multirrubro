# FASE 2C — Carrito y Pagos Online

**Estado**: PLAN (no implementado)
**Precedencia**: FASE 2B (Reservas reales)
**Autor**: Hermes Lead — 2026-06-20

---

## Objetivo

Implementar carrito de compras y procesamiento de pagos online para productos y servicios, sin guardar datos de tarjetas.

---

## 1. Modelo de Carrito

### 1.1 Estructura

```
CARRITO {
  id: string (UUID)
  cliente_id: string
  estado: "ACTIVO" | "CONVERTIDO" | "ABANDONADO"
  items: [
    {
      tipo: "PRODUCTO" | "SERVICIO"
      id_referencia: string
      nombre: string
      cantidad: number
      precio_unitario: number
      subtotal: number
    }
  ]
  total: number
  fecha_creacion: datetime
  fecha_modificacion: datetime
}
```

### 1.2 ¿Dónde se guarda?

**Opción recomendada**: Supabase (tabla `carritos`)
- Soporta transacciones reales
- Sin rate limit de Airtable
- Webhooks para eventos (carrito abandonado, etc.)

**Opción mínima**: Airtable (tabla `CARRITOS`)
- Rate limit 5 req/s
- Sin transacciones reales
- Solo para MVP

### 1.3 Flujo

1. Cliente logueado agrega producto/servicio al carrito (POST /api/carrito/items)
2. Puede modificar cantidades (PATCH)
3. Al hacer checkout, el carrito se "convierte" en una orden

---

## 2. Órdenes

### 2.1 Modelo

```
ORDEN {
  id: string
  cliente_id: string
  carrito_id: string
  estado: "PENDIENTE" | "PAGADA" | "EN_PREPARACION" | "ENTREGADA" | "CANCELADA"
  total: number
  metodo_pago: string
  fecha_creacion: datetime
  fecha_pago: datetime?
}
```

### 2.2 Estados

| Estado | Significado |
|--------|-------------|
| PENDIENTE | Orden creada, esperando pago |
| PAGADA | Pago confirmado por proveedor |
| EN_PREPARACION | Producto en preparación |
| LISTA_PARA_RETIRAR | Producto listo en sucursal |
| ENTREGADA | Cliente retiró |
| CANCELADA | Cancelada por cliente o sistema |

---

## 3. Pagos

### 3.1 Proveedor recomendado

**MercadoPago** (LATAM, Argentina):
- Checkout Pro (redirección)
- Checkout API (integrado en el frontend)
- Webhooks para notificaciones de pago
- No se guardan tarjetas en nuestros servidores

### 3.2 Flujo seguro

1. Cliente inicia checkout desde el carrito
2. Backend crea preferencia de pago en MercadoPago
3. Cliente es redirigido al checkout de MercadoPago (o usa modal)
4. MercadoPago notifica al backend vía webhook con el resultado
5. Backend actualiza estado de la orden
6. Cliente ve confirmación en la app

### 3.3 Qué NO hacer

- ❌ Guardar números de tarjeta
- ❌ Guardar CVV
- ❌ Procesar pagos sin HTTPS
- ❌ Poner API keys de MercadoPago en el frontend
- ❌ Usar access token de producción en desarrollo

---

## 4. Endpoints necesarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/carrito/items` | Agregar item al carrito |
| PATCH | `/api/carrito/items/:id` | Modificar cantidad |
| DELETE | `/api/carrito/items/:id` | Quitar item |
| GET | `/api/carrito` | Ver carrito activo |
| POST | `/api/checkout` | Iniciar checkout |
| POST | `/api/webhooks/mercadopago` | Recibir notificación de pago |
| GET | `/api/ordenes/:id` | Ver estado de orden |

---

## 5. Seguridad

- JWT obligatorio para todas las operaciones de carrito/checkout
- API keys de MercadoPago solo en backend (Railway secrets)
- Webhooks con firma verificada (MercadoPago envía x-signature)
- Idempotencia en webhooks (mismo payment_id no se procesa dos veces)
- Rate limiting en checkout

---

## 6. Tablas Airtable/Supabase necesarias

### Supabase (recomendado)

| Tabla | Campos clave |
|-------|-------------|
| `carritos` | id, cliente_id, estado, total, created_at |
| `carrito_items` | id, carrito_id, tipo, referencia_id, nombre, cantidad, precio |
| `ordenes` | id, cliente_id, carrito_id, estado, total, metodo_pago, mercadopago_id |
| `pagos` | id, orden_id, estado, monto, metodo, fecha |

### Airtable (alternativa mínima)

| Tabla | Campos clave |
|-------|-------------|
| `CARRITOS` | Cliente, Estado, Items (JSON), Total |
| `ORDENES` | Cliente, Carrito, Estado, Total, Método de pago |

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Pago procesado pero orden no actualizada | Webhook idempotente + reintentos |
| Stock insuficiente al momento del pago | Verificar stock antes de crear preferencia |
| Carrito abandonado | Recordatorio por email (futuro) |
| Contracargos | Política clara de cancelación |
| Airtable rate limit en alta demanda | Migrar carrito a Supabase |

---

## 8. Pruebas necesarias

- [ ] Crear carrito con 1 producto
- [ ] Crear carrito con múltiples productos
- [ ] Modificar cantidad
- [ ] Eliminar item
- [ ] Checkout → preferencia MercadoPago
- [ ] Pago exitoso → orden PAGADA
- [ ] Pago rechazado → orden PENDIENTE
- [ ] Webhook duplicado → idempotencia
- [ ] Cliente sin sesión → 401
- [ ] Producto con stock 0 → error claro
