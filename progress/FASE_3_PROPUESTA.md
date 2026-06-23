# FASE_3 — Propuesta de Planificación

**Fecha**: 2026-06-23 | **Autor**: Hermes Lead | **Estado**: PENDIENTE APROBACIÓN

---

## 1. Objetivo Sugerido

**Habilitar reservas reales con clientes reales** — pasar del frontend read-only actual a un flujo completo donde un CLIENTE real (registrado y autenticado) pueda reservar servicios, ver su historial, y el backoffice gestione citas con datos reales de Airtable.

---

## 2. ¿Por qué FASE_3 primero?

| Orden | Razón |
|-------|-------|
| Registro clientes antes que multi-tenant | Sin clientes reales, multi-tenant es solo teoría |
| Reservas antes que pagos | El flujo de reserva es el core del negocio. Pagos es capa adicional |
| Escritura antes que media dinámica | Los datos reales validan el modelo. Media es cosmética |
| Backoffice operativo antes que portal avanzado | ADMIN/GERENTE/EMPLEADO necesitan gestionar citas reales |

---

## 3. Alcance Posible (dividido en subfases)

### FASE_3A — Registro Público de Clientes

| Item | Descripción |
|------|-------------|
| Endpoint | `POST /api/auth/register` — registro con email + password + nombre + teléfono |
| Validación | Email único, password ≥8 chars, rate-limiting |
| Tabla CLIENTES | Crear registro vinculado vía `CLIENTE` link en USUARIOS |
| Frontend | Página `/registro` pública con formulario |
| Post-registro | Auto-login + redirect a portal cliente |
| QA | Registro exitoso, duplicado rechazado, rate-limit 429 |

### FASE_3B — Perfil de Cliente Real

| Item | Descripción |
|------|-------------|
| GET | `/api/clientes/me` — datos reales desde Airtable (CLIENTES + USUARIOS) |
| PATCH | `/api/clientes/me` — editar nombre, teléfono, preferencias |
| Frontend | `/portal/perfil` con formulario de edición |
| Foto | Campo FOTO en CLIENTES (URL) → avatar dinámico |

### FASE_3C — Reservas con Escritura Real

| Item | Descripción |
|------|-------------|
| GET | `/api/reservas/disponibles` — slots por profesional/servicio/fecha |
| POST | `/api/reservas` — crear reserva (cliente, servicio, profesional, fecha, hora) |
| GET | `/api/reservas/mis-reservas` — historial del cliente autenticado |
| PATCH | `/api/reservas/{id}` — cancelar/reprogramar (solo propia) |
| Frontend | `/reserva` con formulario completo + selector de fecha/hora/profesional |
| Backoffice | `/backoffice/agenda` con citas reales por profesional y fecha |

### FASE_3D — Backoffice Operativo con Datos Reales

| Item | Descripción |
|------|-------------|
| Agenda | Vista semanal/mensual con citas reales de Airtable |
| Clientes | Buscar, ver perfil, ver historial de reservas |
| Servicios | CRUD real (ADMIN) — nombre, duración, precio, profesional asignado |
| Profesionales | Vista de agenda individual, disponibilidad |

---

## 4. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Schema Airtable no listo para reservas reales | Media | Alto | Auditar tabla RESERVAS y sus linked records antes de implementar |
| Campos faltantes en CLIENTES | Media | Medio | Mapear schema actual vs requerido; crear solo lo mínimo necesario |
| Rate-limit en memoria se pierde en cold-start | Alta | Bajo | Documentar; no bloquea registro |
| Sin refresh token (8h expiración) | Alta | Medio | Aceptar como limitación conocida; no implementar en FASE_3 |
| Conflictos de disponibilidad (doble booking) | Baja | Alto | Validación server-side: chequear solapamiento antes de INSERT |
| Rollback complejo si hay datos reales | Baja | Alto | Feature flag por rol: solo CLIENTES_QA_TEST pueden crear reservas hasta validar |

---

## 5. Dependencias

| Dependencia | Estado | Acción |
|-------------|--------|--------|
| Auth real (JWT + bcrypt + cookies) | ✅ Completado | — |
| Recovery password | ✅ Completado | — |
| Roles + guards frontend | ✅ Completado | — |
| Schema USUARIOS con campos auth | ✅ Completado | — |
| Schema CLIENTES | ⚠️ Parcial | Auditar campos necesarios para registro |
| Schema RESERVAS | ⚠️ No auditado | Verificar campos: cliente, servicio, profesional, fecha, hora, estado |
| Tabla SERVICIOS | ⚠️ No auditada | Verificar si existe y tiene datos demo |
| Backend Railway activo | ✅ Online | — |
| Frontend Surge activo | ✅ Online | — |

---

## 6. Orden Recomendado

```
FASE_3A (Registro) → FASE_3B (Perfil) → FASE_3C (Reservas) → FASE_3D (Backoffice)
```

**Regla**: no avanzar a la siguiente subfase sin QA completa de la anterior.

---

## 7. Qué NO Tocar Todavía

- ❌ Pagos / checkout / pasarelas
- ❌ Multi-tenant dinámico por dominio
- ❌ `/api/auth/refresh` (backlog)
- ❌ Banners / ofertas / media dinámica avanzada
- ❌ Carrito de compras
- ❌ Notificaciones push/email transaccionales
- ❌ PWA / Service Workers
- ❌ Menú hamburguesa mobile (mejora cosmética)
- ❌ Eliminación de campos DEPRECATED_* en Airtable

---

## 8. Validaciones Requeridas Antes de Arrancar

- [ ] Auditar schema RESERVAS (campos, linked records, datos demo)
- [ ] Auditar schema CLIENTES (campos necesarios para registro)
- [ ] Auditar schema SERVICIOS (existe? tiene datos?)
- [ ] Confirmar que el token Airtable tiene permisos `data:write` en las 3 tablas
- [ ] Definir credenciales CLIENTE_QA_TEST para no contaminar datos demo

---

## 9. Recomendación de Próximo Paso

1. **Aprobar esta propuesta** (o ajustar alcance).
2. **Ejecutar auditoría de schema** (RESERVAS, CLIENTES, SERVICIOS) como paso previo.
3. **Arrancar FASE_3A** con alcance mínimo controlado.

---

*Propuesta sujeta a revisión y aprobación de Diego.*
