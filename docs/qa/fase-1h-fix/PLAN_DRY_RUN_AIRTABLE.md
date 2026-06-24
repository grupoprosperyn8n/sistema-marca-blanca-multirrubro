# Plan Dry-Run Airtable — FASE 1H (CIERRE VISUAL)
## BellezaPro Demo — Salón de Belleza

> ⚠️ **ESTE DOCUMENTO ES SOLO LECTURA. NO ESCRIBIR EN AIRTABLE SIN APROBACIÓN DE DIEGO.**
> Cada bloque describe EXACTAMENTE qué campos modificar en qué tabla de Airtable.

---

## RESUMEN DE HALLAZGOS

| # | Problema | Impacto | Tabla Airtable |
|---|----------|---------|----------------|
| 1 | COLOR_PRIMARIO duplicado (#D4A574 y #A855F7) | Colores marrón/púrpura en vez de glaciar | CONFIGURACION_PUBLICA |
| 2 | COLOR_SECUNDARIO duplicado (#C084FC y #2D2D2D) | Colores púrpura/gris | CONFIGURACION_PUBLICA |
| 3 | NOMBRE_MARCA_PUBLICA = "Marca Ficticia" | Nombre falso en landing | CONFIGURACION_PUBLICA |
| 4 | DIRECCION_PUBLICA = "Av. Siempre Viva 123, Ciudad Ficticia" | Dirección falsa en footer | CONFIGURACION_PUBLICA |
| 5 | 7 de 8 sucursales son FICTICIAS | Reserva sin sede real | SUCURSALES |
| 6 | "Sucursal Centro" sin DIRECCION ni CIUDAD | No se puede mostrar al público | SUCURSALES |
| 7 | Servicios-web: sin DESCRIPCION_WEB, sin IMAGEN_WEB, sin CATEGORIA_WEB | Cards vacías | SERVICIOS_WEB |
| 8 | No existe tabla PRODUCTOS-WEB | Endpoint /api/productos-web → 404 | (crear tabla) |
| 9 | SEO_DESCRIPCION_HOME: "salón ficticio" | Texto falso para buscadores | CONFIGURACION_PUBLICA |
| 10 | COLOR_BOTON_CTA: #EC4899 (rosa fuerte) | Botón color no-glaciar | CONFIGURACION_PUBLICA |
| 11 | COLOR_LOGIN_BOTON: #A855F7 (púrpura) | Login con color no-glaciar | CONFIGURACION_PUBLICA |
| 12 | COLOR_BACKOFFICE_BOTON_PRIMARIO: #A855F7 (púrpura) | Backoffice púrpura | CONFIGURACION_PUBLICA |

---

## BLOQUE D — ENRIQUECER SERVICIOS (SERVICIOS_WEB)

### Tabla: `SERVICIOS_WEB`

**Objetivo**: Cada servicio visible al público debe tener descripción, imagen y duración.

### Registros actuales (ESTADO_WEB: VISIBLE)

Estos son los 8 servicios que aparecen en el catálogo:

| NOMBRE_PUBLICO_SERVICIO | PRECIO_WEB | Faltan estos campos |
|-------------------------|------------|---------------------|
| Coloración Global | $8.000 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Pedicuría SPA | $3.500 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Corte de Cabello Dama | $3.500 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Alisado Keratina Premium | $15.000 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Corte de Cabello Caballero | $3.000 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Manicuría Clásica | $2.500 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Maquillaje Social | $5.000 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |
| Tratamiento Capilar Hidratante | $6.000 | DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB, CATEGORIA_WEB |

### Acción requerida

Para cada registro, AGREGAR (no reemplazar) los campos:

```
DESCRIPCION_WEB:  (texto comercial, 1-2 frases)
DURACION_MINUTOS_WEB:  (número entero, ej: 45, 60, 90)
IMAGEN_WEB:       (URL de imagen de stock o attachment de Airtable)
CATEGORIA_WEB:    (texto: "Cabello" | "Manos y Pies" | "Rostro" | "Bienestar")
```

### Ejemplo concreto (Corte de Cabello Dama)

```
DESCRIPCION_WEB: "Corte personalizado con tijera y navaja. Incluye lavado, acondicionador y brushing."
DURACION_MINUTOS_WEB: 45
IMAGEN_WEB: "https://images.unsplash.com/photo-1560869713-7d0a294..."
CATEGORIA_WEB: "Cabello"
```

---

## BLOQUE E — PRODUCTOS (tabla no existe)

### Estado actual

- Endpoint `/api/productos-web` retorna **404**
- No existe tabla `PRODUCTOS_WEB` en Airtable
- El menú del frontend no muestra "Productos"

### Decisión

**Opción A (recomendada)**: No crear productos por ahora. El sistema es mínimo viable y no requiere e-commerce.

**Opción B**: Crear tabla `PRODUCTOS_WEB` con campos: 
- NOMBRE_PUBLICO_PRODUCTO (texto)
- DESCRIPCION_WEB (texto)
- PRECIO_WEB (número)
- IMAGEN_WEB (attachment/URL)
- ESTADO_WEB (texto: VISIBLE/OCULTO/RETIRADO)

---

## BLOQUE G — CONFIGURACIÓN PÚBLICA

### Tabla: `CONFIGURACION_PUBLICA`

**Estructura**: Tabla clave-valor con campos `CLAVE_CONFIGURACION` y `TEXTO_CONFIGURACION` / `COLOR_HEX_CONFIGURACION`.

### Registros a CORREGIR

| CLAVE_CONFIGURACION | Valor ACTUAL | Valor NUEVO | Motivo |
|---------------------|-------------|-------------|--------|
| COLOR_PRIMARIO | #D4A574 (REGISTRO DUPLICADO: BORRAR uno) | #006686 | Glaciar |
| COLOR_SECUNDARIO | #C084FC (REGISTRO DUPLICADO: BORRAR uno) | #7DD3FC | Glaciar |
| NOMBRE_MARCA_PUBLICA | "Marca Ficticia" | "BellezaPro" | Nombre real |
| DIRECCION_PUBLICA | "Av. Siempre Viva 123, Ciudad Ficticia" | Dirección real del salón | Datos reales |
| TELEFONO_PUBLICO | "(011) 1234-5678" | Teléfono real | Datos reales |
| WHATSAPP_PUBLICO | "+54 9 11 1234-5678" | WhatsApp real | Datos reales |
| EMAIL_PUBLICO | "contacto@salonficticio.com" | Email real | Datos reales |
| SEO_DESCRIPCION_HOME | "salón ficticio" | Sin "ficticio" | SEO real |
| COLOR_BOTON_CTA | #EC4899 | #006686 | Glaciar |
| COLOR_LOGIN_BOTON | #A855F7 | #006686 | Glaciar |
| COLOR_BACKOFFICE_BOTON_PRIMARIO | #A855F7 | #006686 | Glaciar |
| COLOR_BACKOFFICE_BOTON_SECUNDARIO | #C084FC | #7DD3FC | Glaciar |

### ⚠️ IMPORTANTE: COLOR_PRIMARIO y COLOR_SECUNDARIO

Hay **registros duplicados** para estas claves. Hay que:
1. Identificar los 2 registros con CLAVE_CONFIGURACION = "COLOR_PRIMARIO"
2. Borrar el que tiene valor #D4A574 (dorado)
3. Cambiar el restante a #006686
4. Mismo proceso para COLOR_SECUNDARIO

O alternativamente: borrar AMBOS y crear uno nuevo con el valor glaciar.

---

## BLOQUE I — SUCURSALES

### Tabla: `SUCURSALES`

### Estado actual (8 registros)

| NOMBRE | ESTADO | DIRECCION | Acción |
|--------|--------|-----------|--------|
| SUCURSAL_PRODUCTOS_ONLINE_FICTICIA | EN_APERTURA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_CENTRO_PELUQUERIA_FICTICIA | ACTIVA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_CERRADA_HISTORICA_FICTICIA | CERRADA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_CAPACITACION_FICTICIA | BORRADOR | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_NORTE_ESTETICA_FICTICIA | ACTIVA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_SPA_MIXTA_FICTICIA | ACTIVA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| SUCURSAL_BARBERIA_FICTICIA | ACTIVA | — | ❌ Borrar o cambiar ESTADO a RETIRADO |
| **Sucursal Centro** | ACTIVA | — | ✅ **Mantener**. Agregar DIRECCION real y CIUDAD |

### Acción mínima (conservadora)

1. Cambiar ESTADO de las 7 ficticias de ACTIVA/EN_APERTURA a `RETIRADO` (no borrar — los IDs pueden estar referenciados en CITAS)
2. Agregar a **Sucursal Centro**:
   ```
   DIRECCION: "Calle Real 1234"
   CIUDAD: "Buenos Aires"
   TELEFONO_SUCURSAL: "011-4567-8900"
   ```

### ⚠️ Verificación post-cambio

El frontend filtra por `isPublicBranch()` que excluye sucursales con palabras en la blacklist (`FICTICIA`, `HISTORICA`, `CAPACITACION`, etc.) Y sucursales sin dirección. 

---

## RESUMEN DE PRIORIDADES

| Prioridad | Bloque | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| 🔴 URGENTE | BLOQUE G: Duplicados COLOR_PRIMARIO/SECUNDARIO | 5 min | El más alto — rompe el tema glaciar |
| 🟠 ALTO | BLOQUE I: Borrar ficticias + dar dirección a Sucursal Centro | 5 min | Reserva sin sede → no se puede usar |
| 🟠 ALTO | BLOQUE G: NOMBRE_MARCA_PUBLICA, DIRECCION, colores login | 10 min | Marca falsa visible al público |
| 🟡 MEDIO | BLOQUE D: Enriquecer servicios con descripción/imagen | 20 min | Cards vacías en catálogo |
| 🟢 BAJO | BLOQUE E/F: Productos | — | No implementar aún |

---

*Generado: 2026-06-15 | FASE 1H — CIERRE VISUAL | No escribir en Airtable sin aprobación de Diego*
