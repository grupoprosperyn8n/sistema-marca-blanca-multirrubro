# QA VISUAL — CIERRE FASE 1H
## BellezaPro Demo — bellezapro-demo.surge.sh

**Fecha**: 2026-06-15  
**Branch**: main  
**Deploy**: Surge.sh

---

## ✅ PROBLEMAS CORREGIDOS (8 de 8)

| # | Problema | Solución | Evidencia |
|---|----------|----------|-----------|
| 1 | **Íconos técnicos como texto** ("admin_panel_settings", "receipt_long") | Agregado link CSS Material Symbols a `index.html` | 16 íconos cargados en landing |
| 2 | **Colores marrón/dorado (#D4A574)** | Validación glaciar en `resolveBrandConfig.js` + fallback puro en `brandTheme.js` | `--brand-primary: #006686` (comprobado en consola) |
| 3 | **Colores púrpura (#674bb5, #A855F7)** | Eliminado lilac/copper del fallback, validación rechaza no-glaciar | `--brand-secondary: #7DD3FC`, `--brand-accent: #38BDF8` |
| 4 | **Servicios en ALL CAPS** ("COLORACION GLOBAL") | `displayFormatters.js` con `toPublicTitle()` + preposiciones minúsculas | "Coloracion Global", "Corte de Cabello Dama" |
| 5 | **"Corte De Cabello"** (preposiciones capitalizadas) | LOWERCASE_WORDS: de, del, la, en, con, sin... | "Corte de Cabello Dama" ✅ |
| 6 | **Reserva vacía (0 sucursales)** | `isPublicBranch()` ya no requiere dirección obligatoria | 8 servicios listados en /reserva |
| 7 | **Login sin sucursal backend** | `isPublicBranch()` fix | Login funciona con usuario "Diego" |
| 8 | **Gradiente púrpura en Home.jsx** | Cambiado `rgba(103,75,181,0.1)` a glaciar | Landing homogénea |

---

## 🟡 PENDIENTE (requiere escribir en Airtable — aprobación de Diego)

| # | Qué | Tabla | Prioridad |
|---|-----|-------|-----------|
| 1 | **Eliminar COLOR_PRIMARIO duplicado** (#D4A574) | CONFIGURACION_PUBLICA | 🔴 URGENTE |
| 2 | **Eliminar COLOR_SECUNDARIO duplicado** (#C084FC) | CONFIGURACION_PUBLICA | 🔴 URGENTE |
| 3 | Cambiar NOMBRE_MARCA_PUBLICA de "Marca Ficticia" | CONFIGURACION_PUBLICA | 🟠 ALTO |
| 4 | Cambiar DIRECCION_PUBLICA de "Av. Siempre Viva 123" | CONFIGURACION_PUBLICA | 🟠 ALTO |
| 5 | Cambiar 7 sucursales FICTICIAS a estado RETIRADO | SUCURSALES | 🟠 ALTO |
| 6 | Agregar DIRECCION a "Sucursal Centro" | SUCURSALES | 🟠 ALTO |
| 7 | Agregar DESCRIPCION_WEB, IMAGEN_WEB, DURACION_MINUTOS_WEB a servicios | SERVICIOS_WEB | 🟡 MEDIO |
| 8 | Colores login/backoffice glaciar (botón CTA, login, sidebar) | CONFIGURACION_PUBLICA | 🟡 MEDIO |

> 📄 **Plan detallado**: `docs/qa/fase-1h-fix/PLAN_DRY_RUN_AIRTABLE.md`

---

## 🟢 VERIFICACIONES

| Página | Estado | Observaciones |
|--------|--------|---------------|
| Landing | ✅ | Glaciar puro, servicios Title Case, iconos funcionan |
| Catálogo | ✅ | 8 servicios, filtros, "Corte de Cabello" con minúsculas |
| Reserva | ✅ | Servicios listados, precios visibles |
| Login | ✅ | Roles limpios, login mock funcional ("Diego" → backoffice) |
| Backoffice | ✅ | Dashboard con emojis, sin texto técnico |

---

## 📸 CAPTURAS (en disco)

- Landing: `~/.hermes/cache/screenshots/browser_screenshot_d21442c0...png`
- Catálogo: `~/.hermes/cache/screenshots/browser_screenshot_769bf7c8...png`
- Reserva: verificada en snapshot de accesibilidad
- Login: verificado funcional
- Backoffice: verificado post-login

---

## 🔜 PRÓXIMOS PASOS

1. **Diego aprueba/rechaza este cierre visual**
2. Si aprueba → ejecutar dry-run en Airtable (bloques G + I + D)
3. Luego → FASE 1I (Pixel Perfect Responsive)

---

*Reporte generado automáticamente — verificar visualmente en https://bellezapro-demo.surge.sh*
