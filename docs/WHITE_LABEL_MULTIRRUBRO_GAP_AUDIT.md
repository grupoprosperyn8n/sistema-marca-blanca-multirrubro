# White-label multirrubro — gap audit backend/frontend/backoffice

Fecha: 2026-06-24  
Demo activa auditada: `https://bellezapro-demo.surge.sh`
Base activa: `appuns6zIUKaJG7r0`

## Actualización live — 2026-06-26

Se auditó en navegador la demo comercial canónica `https://bellezapro-demo.surge.sh`.

### Correcciones P0 aplicadas

- `AnnouncementBar` ya no rompe la página si cambia la cantidad de banners configurados.
- Detalle de producto deja de enviar a `/reserva`; ahora usa canal de consulta configurado y explicita que la venta online todavía no está activa.
- `/sucursales` ya no queda en blanco cuando Airtable no tiene sucursales reales publicadas: muestra empty state claro.
- `/reserva` informa que no hay sucursales públicas para reserva online en vez de insinuar datos ficticios.
- Se mantienen filtradas las sucursales ficticias, históricas, no activas o no publicadas.

### Gaps comerciales pendientes

Las tablas de venta/e-commerce existen en Airtable (`VENTAS`, `ITEMS_VENTA`, `CARRITOS`, `CARRITO_ITEMS`, `PAGOS_COBROS`, `CUENTAS_COBRO`, `PACKS`, `PROMOCIONES`, `CUPONES`), pero todavía falta un bloque aprobado para:

- carrito unificado para productos, servicios y packs;
- checkout online y pasarela de pago;
- upsell/cross-selling desde packs, promociones y productos relacionados;
- conversión de carrito a venta/cobro;
- estado de stock y disponibilidad comercial;
- integración backoffice de configuración de landing/e-commerce.

No se implementó pago, checkout, caja/POS ni cambios de schema en esta corrección P0.

## Veredicto

La arquitectura correcta es **motor genérico de marca blanca + datos semilla de peluquería como primer tenant/demo**.

El backend/Airtable ya modela gran parte de un SaaS enlatado multirrubro. El gap principal no es de datos: es de **contratos API**, **configuración global de modelo de negocio**, **frontend público configurable** y **backoffice modular con RBAC real**.

## Principio de producto

El sistema debe venderse como software adaptable para negocios que pueden operar con distintas combinaciones:

| Dimensión | Opciones necesarias |
|---|---|
| Oferta | Solo productos, solo servicios, productos + servicios |
| Turnos | Con agenda/turnos, sin agenda/turnos |
| Canal | Solo online, local físico, online + local físico |
| Operación | Una sucursal, multi-sucursal |
| Cobro | Sin pago online, pago online, anticipo, pago total |
| Venta física | Sin POS, POS/caja por sucursal |
| Branding | Logo, nombre, colores, fondo sólido/imagen, CTAs, textos |
| Contenido | Landing, secciones, carruseles imagen/video, testimonios, promociones |
| Accesos | Admin, gerente, empleado, profesional, solo lectura, cliente, permisos por módulo/campo |

## Lo que Airtable ya tiene

| Dominio | Tablas existentes |
|---|---|
| Marca blanca/config | `MARCAS`, `CONFIGURACION_PUBLICA`, `LANDING_SECCIONES`, `REDES_SOCIALES`, `CATEGORIAS_MENU`, `MODULOS` |
| Auth/RBAC | `USUARIOS`, `ROLES`, `PERMISOS_MODULO`, `PERMISOS_CAMPO` |
| CRM | `CLIENTES`, `TESTIMONIOS`, `CALIFICACIONES_ATENCION`, `CAMPAÑAS_MARKETING` |
| Catálogo | `PRODUCTOS`, `PRODUCTOS_WEB`, `SERVICIOS`, `SERVICIOS_WEB`, `PACKS`, `PACK_ITEMS`, `PROMOCIONES`, `CUPONES` |
| Turnos | `AGENDA_SLOTS`, `CITAS`, `HORARIOS_ATENCION`, `EMPLEADOS` |
| Ventas/caja/pagos | `VENTAS`, `ITEMS_VENTA`, `CARRITOS`, `CARRITO_ITEMS`, `PAGOS_COBROS`, `CUENTAS_COBRO`, `EGRESOS` |
| Inventario | `STOCK_OPERATIVO`, `MOVIMIENTOS_INVENTARIO`, `PROVEEDORES`, `INSUMOS_SERVICIO` |
| Finanzas/reportes | `COSTOS_FIJOS`, `RESUMEN_COSTOS`, `REPORTES_CONFIGURADOS` |
| RRHH/operación | `PERFILES_LABORALES_EMPLEADO`, `REGLAS_LIQUIDACION_EMPLEADO`, `LIQUIDACIONES_EMPLEADOS`, `TAREAS_INTERNAS`, etc. |

## Lo que el backend expone hoy

| Área | Estado actual |
|---|---|
| Auth/login | Funciona con JWT/cookie y usuarios Airtable |
| Registro cliente | Existe |
| Reset password | Existe |
| Admin usuarios | Existe, solo para administrador |
| Portal cliente | Existe: perfil, citas, cancelar/reprogramar |
| Catálogo público | `servicios-web`, `productos-web` existen |
| Sucursales | Existe read-only |
| Agenda slots | Existe read-only |
| Citas | Existe read-only + mutaciones cliente |
| Marca blanca | Existe `/api/marca-blanca`, pero toma un solo registro `MARCAS` |
| RBAC dinámico | Modelado en Airtable, pero no aplicado como middleware genérico |
| Ventas/caja/pagos | Tablas existen; API/backoffice funcional todavía no |
| Pasarela de pago | Tablas preparadas (`CUENTAS_COBRO`, `PAGOS_COBROS`), integración real pendiente |

## Gaps críticos detectados

### 1. Falta configuración global de modelo de negocio

`MARCAS` ya tiene colores, textos, logo, secciones visibles y contacto. Pero para producto enlatado falta una capa explícita de “modo de negocio”.

Recomendado como campos/config, no necesariamente tabla nueva:

| Campo/config | Uso |
|---|---|
| `MODO_OFERTA` | `PRODUCTOS`, `SERVICIOS`, `PRODUCTOS_SERVICIOS` |
| `USA_TURNOS` | Mostrar/ocultar agenda y reserva |
| `USA_PAGO_ONLINE` | Activar checkout/pasarela |
| `TIPO_COBRO_ONLINE` | Anticipo, total, ambos |
| `CANAL_OPERACION` | Online, físico, mixto |
| `USA_MULTI_SUCURSAL` | Mostrar selector de sucursal/mapas |
| `USA_CAJA_FISICA` | Activar POS/backoffice caja |
| `MOSTRAR_DIRECCION_CONTACTO` | Ocultar dirección si es online-only |
| `FONDO_TIPO` | Sólido, gradiente, imagen, video |
| `FONDO_URL` | Imagen/video de fondo |
| `CONTRASTE_TEMA` | Auto/light/dark para ajustar texto sobre fondo |

### 2. Frontend público no consume todo lo configurable

Hoy usa parcialmente `MARCAS`, `SERVICIOS_WEB`, `PRODUCTOS_WEB`, `SUCURSALES` y `AGENDA_SLOTS`.

Debe incorporar:

- `LANDING_SECCIONES`: ordenar y prender/apagar secciones sin tocar código.
- `REDES_SOCIALES`: footer, contacto, WhatsApp, Instagram, TikTok, YouTube.
- `HORARIOS_ATENCION`: horarios públicos por negocio/sucursal.
- `TESTIMONIOS`: carrusel/reseñas.
- `PROMOCIONES`, `CUPONES`, `PACKS`: venta comercial real.
- Buscador y filtros por categoría en productos/servicios.
- Carruseles con imagen y video.
- Mapa/sucursales condicional: mostrar solo si el negocio físico/multi-sucursal lo requiere.
- Checkout/pago online según configuración.

### 3. Reserva pública necesita contrato serio

La demo actual muestra horarios duplicados, sin fecha visible y sin filtrar bien por sucursal/servicio/futuro.

Debe pasar a este contrato:

1. Servicio seleccionado.
2. Sucursal/profesional si aplica.
3. Slots futuros filtrados por servicio, sucursal, profesional, capacidad y estado.
4. Dry-run antes de confirmar.
5. Login/registro si el negocio exige cuenta.
6. Pago/anticipo si la configuración lo exige.
7. CITA + AGENDA_SLOT + PAGO/CARRITO/VENTA según el flujo.

### 4. Backoffice actual no representa los módulos reales

Airtable tiene 37 módulos activos; el backoffice actual solo muestra una fracción.

Módulos mínimos para marca blanca vendible:

| Módulo | Necesidad |
|---|---|
| Configuración marca blanca | Nombre, logo, colores, fondo, CTAs, secciones, modalidad de negocio |
| Landing builder | Editar `LANDING_SECCIONES` |
| Catálogo | Productos/servicios y publicación web |
| Agenda | Slots, horarios, profesionales, turnos |
| Clientes/CRM | Alta cliente, historial, preferencias |
| Ventas/POS | Caja física, nueva venta, registrar cliente, emitir venta |
| Pagos/cobros | Medios de pago, comprobantes, validación |
| Carritos/e-commerce | Carritos online y conversión a venta |
| Sucursales | Mapas, horarios, stock, caja por sucursal |
| Inventario | Stock, movimientos, proveedores |
| Promos/cupons/packs | Marketing comercial |
| Usuarios/RBAC | Roles, módulos, campos, grupos |
| Reportes | KPIs, IA, rentabilidad |

### 5. RBAC está modelado pero no completo en ejecución

Existe:

- `ROLES`
- `PERMISOS_MODULO`
- `PERMISOS_CAMPO`
- `USUARIOS`

Pero el backend todavía usa validaciones puntuales, por ejemplo admin hardcodeado para gestión de usuarios. Falta middleware genérico:

```text
usuario -> rol -> permisos_modulo -> permisos_campo -> acción permitida
```

Cada endpoint CRUD debe validar:

- módulo visible
- puede ver/crear/editar/eliminar/exportar
- alcance de datos
- campos visibles/editables
- sensibilidad del campo

### 6. Contratos de lectura deben resolver linked records

Muchas tablas devuelven IDs Airtable (`rec...`). Para frontend/backoffice hacen falta DTOs con nombres resueltos:

| Actual | Necesario |
|---|---|
| `CLIENTE: ["rec..."]` | `cliente_id`, `cliente_nombre` |
| `SERVICIO: ["rec..."]` | `servicio_id`, `servicio_nombre` |
| `PROFESIONAL: ["rec..."]` | `profesional_id`, `profesional_nombre` |
| `SUCURSAL_ATENCION: ["rec..."]` | `sucursal_id`, `sucursal_nombre` |

Sin esto, las tablas del backoffice quedan pobres o muestran datos técnicos.

## Plan recomendado

### Fase P0 — Convertir la demo en plantilla coherente

- [ ] Definir `business_config` desde `MARCAS`/`CONFIGURACION_PUBLICA`.
- [ ] Corregir branding hardcodeado.
- [ ] Arreglar reserva pública.
- [ ] Agregar DTOs para agenda/citas con nombres resueltos.
- [ ] Crear backoffice `/backoffice/configuracion`.
- [ ] Consumir `LANDING_SECCIONES`, `REDES_SOCIALES`, `HORARIOS_ATENCION`, `TESTIMONIOS`.

### Fase P1 — Venta real

- [ ] Implementar carrito unificado para productos/servicios/packs.
- [ ] Implementar caja/POS físico.
- [ ] Registrar venta física en `VENTAS` + `ITEMS_VENTA`.
- [ ] Registrar cobro en `PAGOS_COBROS`.
- [ ] Agregar medios de cobro desde `CUENTAS_COBRO`.
- [ ] Preparar integración pasarela de pago.

### Fase P2 — Backoffice modular

- [ ] CRUD genérico con RBAC para tablas/módulos.
- [ ] Gestión de productos/servicios web.
- [ ] Gestión de promociones, cupones, packs.
- [ ] Gestión de sucursales, stock e inventario.
- [ ] Dashboard con ventas, turnos, caja, clientes, rentabilidad.

### Fase P3 — Escala multirrubro

- [ ] Presets por rubro.
- [ ] Onboarding de nuevo negocio.
- [ ] Plantillas de landing por modalidad.
- [ ] Validaciones por tipo de negocio.
- [ ] Export/import de configuración de marca.

## Regla de implementación

No construir “pantallas de peluquería”. Construir **componentes genéricos controlados por configuración**, y usar peluquería solo como seed/demo.

Ejemplo correcto:

```text
MALO: Página fija “Servicios de peluquería”
BUENO: Catálogo genérico que muestra servicios si MODO_OFERTA incluye SERVICIOS
```

```text
MALO: Dirección siempre visible
BUENO: Dirección visible solo si CANAL_OPERACION incluye físico o sucursal
```

```text
MALO: Reserva siempre activa
BUENO: Reserva activa solo si USA_TURNOS=true y el ítem es reservable
```

## Siguiente paso técnico

Implementar primero el **contrato de configuración marca blanca** y después hacer que frontend/backoffice obedezcan ese contrato.

Sin ese contrato, cada pantalla nueva va a sumar hardcode y el producto deja de ser marca blanca.

## Implementación P0/P0.1 iniciada

Estado: contrato base implementado y backoffice convertido en editor seguro inicial.

| Pieza | Resultado |
|---|---|
| Backend | `/api/marca-blanca` agrega `business_config` derivado de `MARCAS` + `MODULOS` |
| Frontend público | Navbar, footer, home y sucursales empiezan a obedecer productos/servicios/turnos/sucursales/contacto |
| Backoffice | `/backoffice/configuracion` muestra contrato P0 y permite editar campos seguros de `MARCAS` |
| Seguridad | `PATCH /api/marca-blanca` exige sesión y rol administrador; las pruebas no escribieron Airtable |

El contrato P0 expone:

- `modo_oferta`
- `usa_productos`
- `usa_servicios`
- `usa_turnos`
- `usa_sucursales`
- `usa_multi_sucursal`
- `canal_operacion`
- `mostrar_direccion_contacto`
- `mostrar_mapa`
- `usa_carrito`
- `usa_checkout`
- `usa_pago_online`
- `usa_caja_fisica`
- `payment_gateway_status`
- `fondo_tipo`
- `fondo_url`
- `contraste_tema`
- `catalog_label`
- `primary_flow`

Pendiente inmediato: ampliar RBAC dinámico con `PERMISOS_MODULO`/`PERMISOS_CAMPO`, y crear campos Airtable explícitos para las opciones avanzadas del modelo de negocio (`USA_PAGO_ONLINE`, `CANAL_OPERACION`, `FONDO_TIPO`, etc.).

---

## Actualización comercio read-only — 2026-06-29

Se agregó el bloque `COMMERCE_MODEL_P2_DESIGN_ONLY` para empezar a mostrar venta inteligente sin activar operaciones reales.

### Aplicado

- Nuevo endpoint `GET /api/commerce/public`.
- Lee de forma segura `PACKS`, `PROMOCIONES` y `CUPONES`.
- Expone recomendaciones read-only para upsell/cross-selling.
- `ProductoDetalle.jsx` muestra packs/promos/beneficios relacionados.
- El frontend aclara que carrito, checkout y pagos no están activos.

### Sigue pendiente para fase mutante

- Crear carrito real.
- Crear/editar `CARRITOS` y `CARRITO_ITEMS`.
- Convertir carrito en `VENTAS` e `ITEMS_VENTA`.
- Registrar `PAGOS_COBROS`.
- Integrar pasarela de pago sandbox/real.
- Integrar stock/reserva real.

### Guardrails

No se activó checkout, no se tocó pasarela, no se registraron ventas ni pagos y no se modificó schema Airtable.
