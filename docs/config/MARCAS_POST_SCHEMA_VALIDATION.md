# MARCAS — Validación Post-Schema

> **Fase:** FASE_1K_C | **Fecha:** 2026-06-20 | **Estado:** VERIFICADO ✅

## 1. Endpoints verificados

| Endpoint | HTTP | Respuesta | Campos clave |
|----------|------|-----------|-------------|
| `/health` | 200 | OK | precondiciones OK, fase "fase-1kb", tablas_info presente |
| `/api/marca-blanca` | 200 | JSON | BellezaPro Demo, `006686`, 37 módulos activos, registro_activo: true |
| `/api/configuracion-publica` | 200 | JSON | total, configuracion (key-value) |
| `/api/servicios-web` | 200 | JSON | 9 servicios, todos con precios/NOMBRE_PUBLICO extraídos |
| `/api/productos-web` | 200 | JSON | total, total_leidos, productos[], anomalias[] |
| `/api/sucursales` | 200 | JSON | total, sucursales[] |

## 2. Validación de MARCAS (BellezaPro Demo)

### Identidad
- **nombre_sistema:** `"BellezaPro Demo"` ✅
- **nombre_negocio:** `"BellezaPro"` ✅
- **rubro:** `"Salon de Belleza"` ✅
- **registro_activo:** `true` ✅
- **version_config:** `"1.0.0"` ✅

### Colores
- **primario:** `"006686"` → `#006686` (glaciar profundo) ✅
- **secundario:** `"7DD3FC"` → `#7DD3FC` (glaciar claro) ✅
- **acento:** `"38BDF8"` → `#38BDF8` (glaciar brillante) ✅
- **texto:** `"0B1C30"` → `#0B1C30` (navy) ✅
- **fondo:** `"F8F9FF"` → `#F8F9FF` (hielo) ✅

### Textos públicos
- **hero_titulo:** `"Belleza, bienestar y reservas simples"` ✅
- **hero_subtitulo:** `"{marca} te conecta con servicios profesionales de salón. Reservá tu turno en segundos, sin llamadas ni mensajes."` ✅
- **hero_badge:** `"Nuevo"` ✅
- **hero_cta_primario:** `"Reservar turno"` ✅
- **hero_cta_secundario:** `"Ver servicios"` ✅
- **banner_titulo:** presente ✅
- **banner_mensaje:** presente ✅
- **banner_cta:** presente ✅
- **reserva_titulo:** `"Reservá tu Turno"` ✅
- **reserva_subtitulo:** `"Seleccioná servicio, sucursal y horario"` ✅
- **reserva_mensaje_demo:** presente ✅
- **reserva_mensaje_sin_horarios:** presente ✅
- **reserva_cta:** presente ✅

### Contacto
- **telefono:** presente ✅
- **email:** presente ✅
- **whatsapp:** presente ✅
- **direccion:** presente ✅
- **facebook, instagram, tiktok:** presentes ✅

### Secciones visibles
- Flags en `secciones_visibles` con claves snake_case ✅
- Estructura plana (no anidada por página) ✅

### Módulos activos
- **Total:** 37 módulos ✅
- Estructura: `{ "modulo_key": true, ... }` ✅

### SEO / Legal
- **seo_title:** presente ✅
- **seo_description:** presente ✅
- **terms_text:** presente ✅
- **privacy_text:** presente ✅

### Favicon / Logo
- **favicon:** URL presente ✅
- **logo:** pendiente (campo opcional) ⚠️

## 3. Verificaciones negativas (lo que NO debe pasar)

- ❌ Sin datos ficticios: no hay campos con "Ficticio"/"Ficticia" ✅
- ❌ Sin errores Railway: health 200, sin 500s en ningún endpoint ✅
- ❌ Sin campos MARCAS rotos: todos los 61 campos definidos en schema ✅
- ❌ Sin tokens expuestos: Railway proxy, zero Airtable directo desde frontend ✅

## 4. Notas

- **CONFIGURACION_PUBLICA** se mantiene como tabla key-value para banners rotativos y flags legacy (sin cambios).
- **MARCAS** es ahora la fuente principal de configuración de marca blanca.
- El backend fue redeployado vía GitHub auto-deploy (commit `8191461`).
- El endpoint `/api/servicios-web` devuelve 9 servicios con estructura completa (Airtable raw fields + mapeo).
- No se realizaron escrituras (POST/PATCH/DELETE) en esta verificación — solo lecturas.

## 5. Schema changes aplicados (documentados)

La tabla MARCAS (`tblAe0mMVfqZgRLkA`) fue creada con 61 campos en FASE_1K_B.  
Este es un cambio de schema aplicado. **No se crean más tablas ni campos hasta aprobación explícita de Diego.**

---

**Veredicto:** ✅ TODOS los endpoints responden correctamente.  
MARCAS devuelve 1 registro activo completo de BellezaPro Demo.  
No hay errores, datos ficticios ni exposiciones de token.
