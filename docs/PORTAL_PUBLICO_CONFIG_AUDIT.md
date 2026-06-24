# Auditoría de Configuración del Portal Público

> Fecha: 2026-06-20  
> Rama: main  
> Build: ✅ limpio (69 módulos, 0 errores)  
> Deploy: `https://bellezapro-demo.surge.sh`

## Objetivo

Eliminar todos los textos, nombres de marca y colores hardcodeados del portal público, reemplazándolos por datos dinámicos desde `BrandConfigContext`, que a su vez consume el endpoint `/api/marca-blanca` del backend.

## Archivos modificados

### Componentes

| Archivo | Cambios | Línea(s) eliminadas |
|---------|---------|---------------------|
| `components/PublicNavbar.jsx` | Nombre de marca, teléfono, email, íconos de redes hardcodeados → `useBrandConfig()` | Nombre "BellezaPro", teléfono vacío, email vacío |
| `components/PublicFooter.jsx` | Enlaces de navegación, copyright, redes sociales hardcodeados → `useBrandConfig()` | "BellezaPro Demo", enlaces fijos |
| `components/AnnouncementBar.jsx` | Contenido del banner promocional hardcodeado → `useBrandConfig()` (banner activo, título, mensaje, CTA) | "Promo semana: 15% off..." |

### Páginas

| Archivo | Cambios | Línea(s) eliminadas |
|---------|---------|---------------------|
| `pages/Home.jsx` | Estado local `marca` eliminado, título héroe, subtítulo, CTA, secciones → `useBrandConfig()` | "BellezaPro", "Belleza, bienestar...", CTAs hardcodeados |
| `pages/Reserva.jsx` | Título/subtítulo de `SectionHeader` → `config.reservaTitle` / `config.reservaSubtitle` | "Reservá tu Turno", "Seleccioná servicio..." |
| `pages/Catalogo.jsx` | Título y subtítulo de catálogo → `config.catalogTitle` / `config.catalogSubtitle` | "Catálogo de Servicios" |
| `pages/Login.jsx` | Nombre de marca, iniciales "BD" → `config.brandName` + cálculo dinámico de iniciales. Footer de portal → dinámico | "BellezaPro Demo", "BD", "Portal interno..." |
| `pages/Productos.jsx` | Título y subtítulo de productos → `config.productsTitle` / `config.productsSubtitle` | "Productos", "Productos profesionales..." |
| `pages/SucursalesPublicas.jsx` | Título y subtítulo de sucursales → `config.sucursalesTitle` / `config.sucursalesSubtitle` | "Nuestras Sucursales", "Elegí la sucursal..." |

### Contexto

| Archivo | Cambios |
|---------|---------|
| `context/BrandConfigContext.jsx` | Agregados campos en `FALLBACK` y `transformMarcaBlanca()`: `reservaTitle`, `reservaSubtitle`, `catalogTitle`, `catalogSubtitle`, `productsTitle`, `productsSubtitle`, `sucursalesTitle`, `sucursalesSubtitle` |

## Campos expuestos por el contexto (nuevos)

| Campo | Propósito | Fallback |
|-------|-----------|----------|
| `reservaTitle` | Alias camelCase de `reservaTitulo` | "Reservá tu Turno" |
| `reservaSubtitle` | Alias camelCase de `reservaSubtitulo` | "Seleccioná servicio, sucursal y horario" |
| `catalogTitle` | Título página catálogo | "Catálogo de Servicios" |
| `catalogSubtitle` | Subtítulo página catálogo | "Conocé nuestros tratamientos profesionales" |
| `productsTitle` | Título página productos | "Productos" |
| `productsSubtitle` | Subtítulo página productos | "Productos profesionales..." |
| `sucursalesTitle` | Título sección sucursales | "Nuestras Sucursales" |
| `sucursalesSubtitle` | Subtítulo sección sucursales | "Elegí la sucursal más cercana..." |

## Hardcodes removidos (resumen)

1. ✅ **Nombre de marca** — Ya NO aparece "BellezaPro" / "BellezaPro Demo" en ningún componente. Todo se lee de `config.brandName`.
2. ✅ **Colores** — Todos los `#1a3a5c`, `#d4af37`, `#0b1c30` y similares reemplazados por CSS variables (`var(--brand-primary)`, etc.).
3. ✅ **Iniciales de marca** — Login ya no muestra "BD" hardcodeadas; calcula desde `config.brandName`.
4. ✅ **Títulos de página** — Catálogo, Productos, Sucursales, Reservas ya no tienen títulos hardcodeados.
5. ✅ **Footer legal** — Ya no hardcodea "BellezaPro Demo © 2026".
6. ✅ **Datos de contacto** — Teléfono, email, WhatsApp, dirección, redes sociales vienen del contexto.

## Textos que permanecen hardcodeados (por diseño)

Estos NO son datos de marca, sino texto funcional de la UI:

- Etiquetas de formularios ("Tu nombre", "Teléfono", "Perfil de acceso")
- Textos de modo demo ("Modo demostración", "Seleccioná un perfil...")
- ROLES y sus descripciones (Administrador, Gerente, etc.)
- Placeholders de inputs ("Ej: María", "tu@email.com")
- Textos de registro ("El registro de clientes estará disponible próximamente")
- Validaciones y errores

## Impacto futuro

Cuando se cree un nuevo tenant con datos en `MARCAS`:
1. Asignar `marca_id` al campo `SLUG_MARCA` de la sucursal/demo
2. El endpoint `/api/marca-blanca` devolverá los datos de esa marca
3. El frontend automáticamente renderizará esa marca (nombre, colores, textos) sin modificar código
4. Si se quieren personalizar los títulos de página por tenant, agregar los campos `catalogo_titulo`, `catalogo_subtitulo`, etc. en la tabla MARCAS (`textos_publicos`)
