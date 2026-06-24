# FASE 1C — AUDITORÍA DE SEMILLAS EXISTENTES
## Reporte Final

**Fecha:** 15 Jun 2026
**Proyecto:** sistema-marca-blanca-multirrubro
**Base Airtable:** appuns6zIUKaJG7r0 (49 tablas)
**Fase:** FASE_1C_AUDITORIA_SEMILLAS_EXISTENTES

---

## 1. VEREDICTO

**FASE_1C_AUDITORIA_SEMILLAS_COMPLETA: SÍ** ✅

9 tablas auditadas. Solo GET, 0 escrituras. Las semillas de SERVICIOS y SERVICIOS_WEB son datos REALES de peluquería/belleza y están listas para conectar al frontend. Las semillas de SUCURSALES/CLIENTES/CITAS/SLOTS requieren limpieza porque tienen datos ficticios o fechas pasadas.

---

## 2. ESTADO DE SEMILLAS — TABLA POR TABLA

### 2.1. CONFIGURACION_PUBLICA — 90 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| ALTA (flags) / NULA (identidad) | ❌ Para marca blanca<br>✅ Para flags del sistema | 90 flags: MODULO_VISIBLE, MOSTRAR_REDES_SOCIALES, etc. Campos: CLAVE_CONFIGURACION, NOMBRE_CONFIGURACION, SI_NO_CONFIGURACION, CATEGORIA_CONFIGURACION, VISIBLE_EN_FRONTEND_PUBLICO | NO tiene NOMBRE_SISTEMA, NOMBRE_NEGOCIO, COLORES, LOGO, TEXTOS_PUBLICOS. `/api/marca-blanca` devuelve todo en None. |

### 2.2. MODULOS — 37 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| ALTA | ✅ **LISTO** | 37 módulos con NOMBRE_MODULO, ACTIVO=True, RUTA definida, ORDEN, ICONO, PERMISOS_MODULO | Nada. Completos y listos para usar. |

Nombres: CLIENTES, ITEMS_VENTA, RRHH_LIQUIDACIONES, STOCK_OPERATIVO, CARRITOS, MARCA_BLANCA, CAPACITACIONES, DASHBOARD, CONFIGURACION, CITAS, AGENDA, SERVICIOS, SERVICIOS_WEB, VENTAS, EMPLEADOS...

### 2.3. CATEGORIAS_MENU — 6 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| ALTA | ✅ **LISTO** | OPERACION, CLIENTES, CATALOGO, GESTION, FINANZAS, SISTEMA. Cada una con MODULOS vinculados, ORDEN, ICONO, DESCRIPCION. | Nada. Estructura completa. |

### 2.4. SUCURSALES — 7 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| BAJA (ficticias) | ❌ Para demo real<br>✅ Para probar estructura | 7 sucursales con direcciones ficticias: PAIS_FICTICIO, Narnia, Springfield, Wakanda, ONLINE. Campos muy completos (43-60 campos). | Datos reales de peluquería: nombre, dirección, ciudad, horarios comerciales, whatsapp real. |

Ejemplos:
- SUCURSAL_PRODUCTOS_ONLINE_FICTICIA
- SUCURSAL_SPA_MIXTA_FICTICIA
- Narnia, Springfield, Wakanda

### 2.5. SERVICIOS — 8 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| ALTA | ✅ **LISTO — JOYA** | 8 servicios reales de peluquería/belleza: MANICURÍA CLÁSICA ($2,500), COLORACIÓN, CORTE DE DAMA, PEINADO, etc. Precios en ARS. Campos: NOMBRE_SERVICIO, PRECIO_BASE, DURACION_MINUTOS, DESCRIPCION_COMERCIAL, CATEGORIA_SERVICIO, COMISION_PROFESIONAL_PORCENTAJE, PROFESIONALES_HABILITADOS. | Nada crítico. Se puede afinar descripciones comerciales para demo. |

Categorías: MANICURIA, COLORACION, CORTE, PEINADO, MAQUILLAJE, TRATAMIENTO_CAPILAR

### 2.6. SERVICIOS_WEB — 9 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| ALTA | ✅ **LISTO — JOYA** | 9 publicaciones web vinculadas a SERVICIOS: COLORACION GLOBAL ($8,000), CORTE MODERNO, PEINADO PROFESIONAL, etc. Campos: NOMBRE_PUBLICO_SERVICIO, PRECIO_WEB, PRECIO_PUBLICITADO_WEB, RESERVA_ONLINE_HABILITADA=True, PROMO_EN_DESTACADO, COMENTARIOS_RESEÑAS_HABILITADOS. | Nada. Listos para catálogo público. |

### 2.7. CLIENTES — 13 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| MEDIA (placeholders) | ⚠️ **PARCIAL** | 13 clientes: CLIENTE_NUEVO, nombres genéricos. Tienen FOTO_PERFIL, TESTIMONIOS, CALIFICACIONES_ATENCION. Algunos con dirección (CALLE_Y_N°), otros sin. | Nombres realistas de demo (María García, etc.). No mostrar datos reales — son placeholders. |

### 2.8. AGENDA_SLOTS — 12 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| BAJA (fechas pasadas) | ❌ | 12 slots vinculados a profesionales (Laura Fernández, etc.). Fechas: 2026-06-08/09 (¡YA PASÓ!). Campos completos: HORA_INICIO, HORA_FIN, DURACION_MINUTOS, CAPACIDAD_DISPONIBLE, ESTADO_SLOT=DISPONIBLE. | Fechas futuras (próxima semana). Misma estructura, solo cambiar FECHA_SLOT. |

Ejemplo: SLOT_LAURA_FERNANDEZ_2026_06_09, 09:00-10:30, disponible

### 2.9. CITAS — 8 registros
| Calidad | ¿Sirve para demo? | ¿Qué hay? | ¿Qué falta? |
|---------|-------------------|-----------|-------------|
| BAJA (fechas pasadas) | ❌ | 8 citas confirmadas: MAQUILLAJE PARA EVENTO SOCIAL, CITA_SOFIA_RAMIREZ_MAQUILLAJE..., fechas: 2026-06-08. Campos: CLIENTE, PROFESIONAL, SERVICIO, ESTADO_CITA=CONFIRMADA, HORA_INICIO, HORA_FIN. | Fechas futuras. Misma estructura, solo cambiar FECHA_CITA. |

---

## 3. DEMO ACTUAL DISPONIBLE — ¿QUÉ SE PUEDE MOSTRAR YA?

| Pantalla / Funcionalidad | Estado | Con qué datos |
|--------------------------|--------|---------------|
| Catálogo público de servicios | ✅ **YA** | SERVICIOS_WEB (9 servicios con precio, descripción, reserva habilitada) |
| Navegación por módulos | ✅ **YA** | MODULOS (37) + CATEGORIAS_MENU (6) |
| Backoffice (admin) | ✅ **YA** | SERVICIOS (8), SERVICIOS_WEB (9), MODULOS, CONFIGURACION (90 flags) |
| Portal público (marca blanca) | ❌ **NO** | Sin NOMBRE_SISTEMA, COLORES, LOGO, TEXTOS_PUBLICOS |
| Reservas / Agenda | ❌ **NO** | Slots y citas con fechas pasadas |
| Sucursales reales | ❌ **NO** | Datos ficticios (Narnia, Wakanda) |
| Clientes demo realistas | ⚠️ PARCIAL | Nombres genéricos (CLIENTE_NUEVO) |

**Conclusión:** El backoffice ya se puede navegar con datos reales de servicios. El portal público bloqueado por falta de identidad de marca. La agenda bloqueada por fechas pasadas.

---

## 4. BRECHAS DETECTADAS

| # | Brecha | Severidad | Tabla afectada | ¿Qué falta? |
|---|--------|-----------|----------------|-------------|
| 1 | Sin identidad de marca | **BLOQUEA_FRONTEND** | CONFIGURACION_PUBLICA | NOMBRE_SISTEMA, COLORES, LOGO, NOMBRE_NEGOCIO, TEXTOS_PUBLICOS |
| 2 | Sucursales ficticias | **BLOQUEA_FRONTEND** | SUCURSALES | 1-2 sucursales reales de demo (nombre, dirección realista) |
| 3 | Slots con fechas pasadas | **BLOQUEA_RESERVA** | AGENDA_SLOTS | Slots con FECHA_SLOT en la próxima semana |
| 4 | Citas con fechas pasadas | **BLOQUEA_RESERVA** | CITAS | Citas con FECHA_CITA en fechas recientes/futuras |
| 5 | Clientes genéricos | **NO_BLOQUEA** | CLIENTES | Nombres realistas (María García, Carlos López) |
| 6 | Sin datos de profesionales | **NO_BLOQUEA** (oculto en endpoints P0) | EMPLEADOS | Nombres de profesionales demo |
| 7 | Textos promocionales AI en error | **NO_BLOQUEA** | SERVICIOS_WEB | AGENTE_TEXTO_PROMOCIONAL_AI y AGENTE_CATEGORIZACION_WEB_AI con state=error |

---

## 5. DATOS QUE NO DEBEN TOCARSE

| Registro / Campo | Riesgo | Razón |
|-----------------|--------|-------|
| MODULOS (37) | ROMPER NAVEGACIÓN | Estructura base del sistema. Cambiar activo/inactivo podría romper menú. |
| CATEGORIAS_MENU (6) | ROMPER NAVEGACIÓN | Vinculadas a MODULOS. Cambiar MODULOS linked records podría desordenar menú. |
| SERVICIOS (8) | PERDER DATOS REALES | Son los únicos datos de peluquería reales. Modificar rompe la demo. |
| SERVICIOS_WEB (9) | PERDER CATÁLOGO | Vinculados a SERVICIOS. Modificar sin sincronizar rompe el catálogo. |
| CONFIGURACION_PUBLICA (90) | ROMPER SISTEMA | Los flags controlan visibilidad de módulos. Cambiar sin entender podría ocultar secciones. |
| FOTO_PERFIL en CLIENTES | DATOS PERSONALES | Imágenes reales subidas. No tocar. |
| IDs de registro (recXXXX) | ROMPER VÍNCULOS | Todos los linked records dependen de IDs. Cambiar rompe relaciones. |

---

## 6. PLAN DE USO DE SEMILLAS EXISTENTES

### Pantalla → Endpoint → Datos

| Pantalla Frontend | Endpoint | Tabla Airtable | Estado |
|-------------------|----------|----------------|--------|
| **Portal público** (`/`) | `/api/marca-blanca` | CONFIGURACION_PUBLICA | ❌ Sin identidad |
| **Catálogo de servicios** | `/api/servicios-web` | SERVICIOS_WEB | ✅ Listo |
| **Servicios (admin)** | `/api/servicios` | SERVICIOS | ✅ Listo |
| **Backoffice** | `/api/marca-blanca` (módulos) + `/api/categorias-menu` | MODULOS + CATEGORIAS_MENU | ✅ Listo |
| **Sucursales** | `/api/sucursales` | SUCURSALES | ❌ Datos ficticios |
| **Agenda** | `/api/agenda-slots` | AGENDA_SLOTS | ❌ Fechas pasadas |
| **Citas** | `/api/citas` | CITAS | ❌ Fechas pasadas |
| **Clientes** | `/api/clientes` | CLIENTES | ⚠️ Nombres genéricos |
| **Configuración** | `/api/configuracion-publica` | CONFIGURACION_PUBLICA | ✅ Flags listos |

---

## 7. PRÓXIMA FASE RECOMENDADA

**FASE_1D_CONECTAR_FRONTEND_A_SEMILLAS_EXISTENTES**

Alcance propuesto:
1. **Ya se puede:** conectar pantallas de catálogo de servicios y backoffice a `/api/servicios-web` y `/api/servicios`
2. **Requiere semilla nueva (NO en FASE 1D):** identidad de marca (NOMBRE_SISTEMA, COLORES, LOGO) → requiere seed futuro
3. **Requiere limpieza:** sucursales ficticias → decidir si limpiar o crear nuevas
4. **Requiere actualización:** fechas de slots y citas → cambiar a próximas fechas
5. **No bloquear:** catálogo de servicios YA funciona con datos reales

### FASE 1D propuesta:
- Conectar pantalla de catálogo público (`/`) a `/api/servicios-web`
- Conectar backoffice a datos reales de SERVICIOS, MODULOS, CATEGORIAS_MENU
- Dejar portal público (marca blanca) como "próximamente" hasta tener identidad
- Dejar agenda como "sin slots disponibles" hasta limpiar fechas
- **No crear datos nuevos. Solo conectar lo que YA funciona.**

---

## 8. AIRTABLE — CONFIRMACIÓN

| Operación | Cantidad |
|-----------|----------|
| GET (lectura) | 9 endpoints |
| POST/PATCH/PUT/DELETE | 0 |
| Registros creados | 0 |
| Registros modificados | 0 |
| Registros eliminados | 0 |
| Tablas creadas | 0 |
| Campos modificados | 0 |

---

## 9. VALIDACIONES FINALES

- [x] Solo GETs ejecutados — 0 POST/PATCH/PUT/DELETE
- [x] No se ejecutó seed
- [x] No se crearon datos demo nuevos
- [x] No se modificó Airtable
- [x] No se expusieron secretos
- [x] .env no fue impreso
- [x] CREDENCIALES.md intacto
- [x] static/api.js intacto
- [x] harness/ intacto
- [x] Semillas existentes auditadas (9 tablas)
- [x] PLAN_USO_SEMILLAS_EXISTENTES documentado
- [x] Brechas clasificadas por severidad
