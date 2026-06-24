# FASE 2A — Auth de Clientes y Reservas Reales

**Estado**: PLAN (no implementado)
**Precedencia**: FASE 1J (UX Comercial Read-Only)
**Autor**: Hermes Lead — 2026-06-20

---

## Objetivo

Implementar autenticación real para clientes finales y habilitar la creación de reservas con escritura controlada en Airtable.

---

## 1. Auth de Clientes

### 1.1 Modelo de usuarios/clientes

| Entidad | Descripción |
|---------|-------------|
| `CLIENTES` | Tabla Airtable con clientes finales (nombre, email, teléfono, contraseña hasheada, fecha_registro, estado) |
| `SESIONES` | Tokens JWT con expiración. No guardar sesiones en Airtable — usar memoria del backend o Supabase Auth. |

### 1.2 Flujo

1. Cliente completa formulario de registro (ya preparado visualmente en Login.jsx)
2. Backend valida email único
3. Hash de contraseña (bcrypt)
4. Crea registro en tabla CLIENTES (solo campos necesarios)
5. Retorna JWT

### 1.3 Endpoints necesarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Crear cliente nuevo |
| POST | `/api/auth/login` | Login con JWT |
| GET | `/api/auth/me` | Perfil del cliente logueado |

### 1.4 Seguridad

- No guardar contraseñas en texto plano (bcrypt)
- JWT con expiración (ej: 24h)
- HTTPS obligatorio (Surge + Railway ya lo tienen)
- Rate limiting en login/registro

---

## 2. Reservas Reales

### 2.1 Modelo de datos

Los datos Ya existen en Airtable:
- Tabla `CITAS`: Ya tiene campos ESTADO_CITA, FECHA_CITA, HORA_INICIO, SERVICIO, CLIENTE, SUCURSAL
- Tabla `AGENDA_SLOTS`: Ya existe con FECHA_SLOT, HORA_INICIO, HORA_FIN, ESTADO_SLOT, CAPACIDAD_DISPONIBLE

### 2.2 Flujo

1. Cliente logueado elige servicio, sucursal, fecha, horario (UI ya lista en /reserva)
2. Backend verifica que el slot siga DISPONIBLE
3. Crea cita en tabla CITAS
4. Actualiza CAPACIDAD_DISPONIBLE del slot (-1)
5. Si CAPACIDAD_DISPONIBLE llega a 0, cambia ESTADO_SLOT a "COMPLETO"

### 2.3 Reglas de negocio

- Un cliente no puede reservar el mismo slot dos veces
- No se puede reservar un slot con CAPACIDAD_DISPONIBLE = 0
- La reserva debe ser a futuro (no se permiten fechas pasadas)
- Rollback: si falla la creación de la cita, no se descuenta capacidad

### 2.4 Endpoints necesarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/reservas` | Crear reserva (requiere JWT) |
| GET | `/api/reservas/mis-turnos` | Listar turnos del cliente logueado |
| GET | `/api/agenda-slots?sucursal=X&fecha=Y` | Slots disponibles (ya existe) |

### 2.5 Validaciones

- JWT válido y no expirado
- Slot DISPONIBLE
- Fecha futura
- Sin conflicto de horario para el mismo cliente
- Transacción: crear cita + actualizar slot en secuencia con rollback

---

## 3. Qué campos Airtable se necesitan

| Tabla | Campo | Tipo | ¿Existe? |
|-------|-------|------|----------|
| CLIENTES | id | Autonumérico | ✅ |
| CLIENTES | NOMBRE_COMPLETO | Texto | ❌ (crear) |
| CLIENTES | EMAIL | Texto | ❌ (crear) |
| CLIENTES | PASSWORD_HASH | Texto | ❌ (crear) |
| CLIENTES | TELEFONO | Teléfono | ❌ (crear) |
| CLIENTES | FECHA_REGISTRO | Fecha | ❌ (crear) |
| CLIENTES | ESTADO | Select | ❌ (crear) |
| CITAS | CLIENTE | Link a CLIENTES | ❌ (crear link) |

---

## 4. Riesgos

- **Doble reserva**: Mitigar con verificación atómica en backend
- **JWT expuesto**: Usar httpOnly cookies (mejor que localStorage)
- **Airtable rate limit**: 5 req/s por base — cachear slots
- **Contraseñas**: No guardar en Airtable si es posible — considerar Supabase Auth

---

## 5. No autorizado en esta fase

- ❌ Pagos
- ❌ Carrito
- ❌ Checkout
- ❌ Integración MercadoPago/Stripe
- ❌ Guardar tarjetas
