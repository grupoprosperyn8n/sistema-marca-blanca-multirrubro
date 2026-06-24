# FASE_1K_B — Plan de Ejecución Controlada para Tabla MARCAS

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No ejecutar sin aprobación explícita | 📋 Versión 1.0
> ⚠️ Este documento describe CÓMO se ejecutaría. Nada se ejecuta todavía.

---

## 1. Precondiciones (verificar antes de ejecutar)

- [ ] Token Airtable presente en `.env` y válido
- [ ] Backend Railway responde 200 en `/health`
- [ ] Frontend Surge responde en `https://bellezapro-demo.surge.sh`
- [ ] Backups pre-creación generados (ver `MARCAS_BACKUP_Y_ROLLBACK_PLAN.md`)
- [ ] Este plan fue leído y aprobado por Diego
- [ ] El schema (`MARCAS_SCHEMA_DRY_RUN.md`) fue aprobado por Diego

---

## 2. Paso 1 — Snapshot pre-creación (READ-ONLY)

### 2.1 Listar tablas existentes

```bash
curl -s "https://earnest-comfort-production-3d75.up.railway.app/api/tablas" \
  | python3 -m json.tool \
  | tee docs/config/pre_backup_tablas_existentes_$(date +%Y%m%d_%H%M%S).json
```

### 2.2 Volcar CONFIGURACION_PUBLICA completa

```bash
curl -s "https://earnest-comfort-production-3d75.up.railway.app/api/configuracion-publica" \
  | python3 -m json.tool \
  | tee docs/config/pre_backup_configuracion_publica_$(date +%Y%m%d_%H%M%S).json
```

### 2.3 Verificar endpoint /api/marca-blanca actual (debe devolver nulls)

```bash
curl -s "https://earnest-comfort-production-3d75.up.railway.app/api/marca-blanca" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    assert d.get('nombre_sistema') is None, 'ESPERADO null, distinto'; \
    assert d.get('colores') is None, 'ESPERADO null'; \
    print('OK — estado pre-creación: nulls confirmados')"
```

---

## 3. Paso 2 — Crear tabla MARCAS en Airtable

### Método: Airtable REST API (POST /meta/bases/{baseId}/tables)

Se usa el token desde `.env`:

```bash
source .env
```

```bash
curl -s -X POST "https://api.airtable.com/v0/meta/bases/appuns6zIUKaJG7r0/tables" \
  -H "Authorization: Bearer $AIRTABLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MARCAS",
    "description": "Configuración de identidad visual y textual para portales marca blanca. Un registro por instancia.",
    "fields": [
      {"name": "MARCA_ID", "type": "singleLineText"},
      {"name": "NOMBRE_MARCA", "type": "singleLineText"},
      {"name": "NOMBRE_CORTO_MARCA", "type": "singleLineText"},
      {"name": "TAGLINE_MARCA", "type": "singleLineText"},
      {"name": "RUBRO", "type": "singleSelect", "options": {
        "choices": [
          {"name": "Salón de Belleza"},
          {"name": "Barbería"},
          {"name": "Spa"},
          {"name": "Centro de Estética"},
          {"name": "Clínica Dental"},
          {"name": "Veterinaria"},
          {"name": "Gimnasio"},
          {"name": "Consultorio Médico"}
        ]
      }},
      {"name": "ESTADO_MARCA", "type": "singleSelect", "options": {
        "choices": [
          {"name": "activo"},
          {"name": "demo"},
          {"name": "inactivo"},
          {"name": "mantenimiento"}
        ]
      }},
      {"name": "SLUG_PUBLICO", "type": "singleLineText"},
      {"name": "THEME_PRESET", "type": "singleSelect", "options": {
        "choices": [
          {"name": "glaciar"},
          {"name": "lilac"},
          {"name": "bosque"},
          {"name": "cálido"},
          {"name": "personalizado"}
        ]
      }},
      {"name": "COLOR_PRIMARIO", "type": "singleLineText"},
      {"name": "COLOR_SECUNDARIO", "type": "singleLineText"},
      {"name": "COLOR_ACENTO", "type": "singleLineText"},
      {"name": "COLOR_FONDO", "type": "singleLineText"},
      {"name": "COLOR_TEXTO", "type": "singleLineText"},
      {"name": "COLOR_TEXTO_SECUNDARIO", "type": "singleLineText"},
      {"name": "TIPOGRAFIA_TITULOS", "type": "singleLineText"},
      {"name": "TIPOGRAFIA_CUERPO", "type": "singleLineText"},
      {"name": "HERO_BADGE", "type": "singleLineText"},
      {"name": "HERO_TITULO", "type": "multilineText"},
      {"name": "HERO_SUBTITULO", "type": "multilineText"},
      {"name": "HERO_CTA_PRIMARIO_TEXTO", "type": "singleLineText"},
      {"name": "HERO_CTA_PRIMARIO_URL", "type": "singleLineText"},
      {"name": "HERO_CTA_SECUNDARIO_TEXTO", "type": "singleLineText"},
      {"name": "HERO_CTA_SECUNDARIO_URL", "type": "singleLineText"},
      {"name": "HERO_IMAGEN_URL", "type": "url"},
      {"name": "LOGO_URL", "type": "url"},
      {"name": "FAVICON_URL", "type": "url"},
      {"name": "BANNER_ACTIVO", "type": "checkbox"},
      {"name": "BANNER_TITULO", "type": "singleLineText"},
      {"name": "BANNER_MENSAJE", "type": "multilineText"},
      {"name": "BANNER_CTA_TEXTO", "type": "singleLineText"},
      {"name": "BANNER_CTA_URL", "type": "singleLineText"},
      {"name": "MOSTRAR_SERVICIOS", "type": "checkbox"},
      {"name": "MOSTRAR_PRODUCTOS", "type": "checkbox"},
      {"name": "MOSTRAR_SUCURSALES", "type": "checkbox"},
      {"name": "MOSTRAR_OFERTAS", "type": "checkbox"},
      {"name": "MOSTRAR_TESTIMONIOS", "type": "checkbox"},
      {"name": "MOSTRAR_COMO_FUNCIONA", "type": "checkbox"},
      {"name": "ORDEN_SECCIONES", "type": "multilineText"},
      {"name": "RESERVA_TITULO", "type": "singleLineText"},
      {"name": "RESERVA_SUBTITULO", "type": "singleLineText"},
      {"name": "RESERVA_REQUIERE_LOGIN", "type": "checkbox"},
      {"name": "RESERVA_MENSAJE_SIN_HORARIOS", "type": "multilineText"},
      {"name": "RESERVA_MENSAJE_DEMO", "type": "multilineText"},
      {"name": "RESERVA_CTA_TEXTO", "type": "singleLineText"},
      {"name": "TELEFONO_PUBLICO", "type": "phone"},
      {"name": "WHATSAPP_PUBLICO", "type": "phone"},
      {"name": "EMAIL_PUBLICO", "type": "email"},
      {"name": "DIRECCION_PUBLICA", "type": "singleLineText"},
      {"name": "INSTAGRAM_URL", "type": "url"},
      {"name": "FACEBOOK_URL", "type": "url"},
      {"name": "TIKTOK_URL", "type": "url"},
      {"name": "GOOGLE_MAPS_URL", "type": "url"},
      {"name": "SEO_TITLE", "type": "singleLineText"},
      {"name": "SEO_DESCRIPTION", "type": "multilineText"},
      {"name": "LEGAL_AVISO_PUBLICO", "type": "multilineText"},
      {"name": "PRIVACY_URL", "type": "singleLineText"},
      {"name": "TERMS_URL", "type": "singleLineText"},
      {"name": "REGISTRO_ACTIVO", "type": "checkbox"},
      {"name": "PRIORIDAD", "type": "number", "options": {"precision": 0}},
      {"name": "AMBIENTE", "type": "singleSelect", "options": {
        "choices": [
          {"name": "produccion"},
          {"name": "staging"},
          {"name": "demo"}
        ]
      }},
      {"name": "VERSION_CONFIG", "type": "singleLineText"}
    ]
  }' | python3 -m json.tool
```

### Verificar creación

```bash
curl -s "https://earnest-comfort-production-3d75.up.railway.app/api/tablas" \
  | python3 -c "import sys,json; \
    tables=[t.get('name','') for t in json.load(sys.stdin).get('tables',[])]; \
    assert 'MARCAS' in tables, 'FAIL: MARCAS no aparece en /api/tablas'; \
    print('OK — tabla MARCAS creada')"
```

---

## 4. Paso 3 — Insertar seed "BellezaPro Demo"

```bash
curl -s -X POST "https://api.airtable.com/v0/appuns6zIUKaJG7r0/MARCAS" \
  -H "Authorization: Bearer $AIRTABLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [{
      "fields": {
        "MARCA_ID": "bellezapro-demo",
        "NOMBRE_MARCA": "BellezaPro Demo",
        "NOMBRE_CORTO_MARCA": "BellezaPro",
        "TAGLINE_MARCA": "Belleza, bienestar y reservas simples en un solo lugar.",
        "RUBRO": "Salón de Belleza",
        "ESTADO_MARCA": "demo",
        "SLUG_PUBLICO": "bellezapro",
        "THEME_PRESET": "glaciar",
        "COLOR_PRIMARIO": "006686",
        "COLOR_SECUNDARIO": "7DD3FC",
        "COLOR_ACENTO": "38BDF8",
        "COLOR_FONDO": "F8F9FF",
        "COLOR_TEXTO": "0B1C30",
        "COLOR_TEXTO_SECUNDARIO": "3F484E",
        "TIPOGRAFIA_TITULOS": "Manrope",
        "TIPOGRAFIA_CUERPO": "Manrope",
        "HERO_BADGE": "Nuevo",
        "HERO_TITULO": "Belleza, bienestar y reservas simples en un solo lugar.",
        "HERO_SUBTITULO": "{marca} te conecta con servicios profesionales de salón. Reservá tu turno en segundos, sin llamadas ni mensajes.",
        "HERO_CTA_PRIMARIO_TEXTO": "Reservar turno",
        "HERO_CTA_PRIMARIO_URL": "/reserva",
        "HERO_CTA_SECUNDARIO_TEXTO": "Ver servicios",
        "HERO_CTA_SECUNDARIO_URL": "/catalogo",
        "HERO_IMAGEN_URL": null,
        "LOGO_URL": null,
        "FAVICON_URL": null,
        "BANNER_ACTIVO": true,
        "BANNER_TITULO": "🆕 ¡Nuevo sistema de turnos online!",
        "BANNER_MENSAJE": "Reservá desde cualquier dispositivo. Sin llamadas, sin esperas.",
        "BANNER_CTA_TEXTO": "Ver servicios",
        "BANNER_CTA_URL": "/catalogo",
        "MOSTRAR_SERVICIOS": true,
        "MOSTRAR_PRODUCTOS": true,
        "MOSTRAR_SUCURSALES": true,
        "MOSTRAR_OFERTAS": false,
        "MOSTRAR_TESTIMONIOS": false,
        "MOSTRAR_COMO_FUNCIONA": true,
        "ORDEN_SECCIONES": "hero,servicios,como_funciona,productos,visitanos,cta_final",
        "RESERVA_TITULO": "Reservá tu Turno",
        "RESERVA_SUBTITULO": "Seleccioná servicio, sucursal y horario",
        "RESERVA_REQUIERE_LOGIN": true,
        "RESERVA_MENSAJE_SIN_HORARIOS": "Próximamente publicaremos nuevos horarios. Mientras tanto, consultá disponibilidad por WhatsApp o acercate a la sucursal.",
        "RESERVA_MENSAJE_DEMO": "Para confirmar tu turno necesitás ingresar o registrarte",
        "RESERVA_CTA_TEXTO": "Ingresá para confirmar tu turno",
        "TELEFONO_PUBLICO": "+54 11 5555-0000",
        "WHATSAPP_PUBLICO": null,
        "EMAIL_PUBLICO": "contacto@bellezapro.com",
        "DIRECCION_PUBLICA": "Av. Corrientes 1234, CABA",
        "INSTAGRAM_URL": "https://instagram.com/bellezapro",
        "FACEBOOK_URL": "https://facebook.com/bellezapro",
        "TIKTOK_URL": null,
        "GOOGLE_MAPS_URL": null,
        "SEO_TITLE": "BellezaPro Demo",
        "SEO_DESCRIPTION": "Reservá turnos de belleza online. Servicios profesionales de salón en segundos.",
        "LEGAL_AVISO_PUBLICO": "BellezaPro Demo es un sistema de demostración. No se realizan reservas reales.",
        "PRIVACY_URL": "/privacidad",
        "TERMS_URL": "/terminos",
        "REGISTRO_ACTIVO": true,
        "PRIORIDAD": 1,
        "AMBIENTE": "demo",
        "VERSION_CONFIG": "1.0.0"
      }
    }]
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); \
    records=d.get('records',[]); \
    assert len(records)==1, f'FAIL: esperado 1 record, recibido {len(records)}'; \
    print(f'OK — seed creado. ID: {records[0].get("id","?")}')"
```

---

## 5. Paso 4 — Modificar endpoint `/api/marca-blanca`

### 5.1 Archivo a modificar

`backend/routes/modulos.py` — reemplazar la consulta a `CONFIGURACION_PUBLICA` por consulta a `MARCAS`.

### 5.2 Cambios necesarios

La función `datos_marca_blanca()` (línea 36-88) debe:

1. **Consultar `MARCAS`** en lugar de `CONFIGURACION_PUBLICA`
2. Filtrar por `AMBIENTE` (usar variable de entorno `DEPLOY_ENV` del backend → mapear a `demo`/`staging`/`produccion`)
3. Ordenar por `PRIORIDAD` ascendente, tomar el primero
4. Mapear campos planos a los objetos anidados (`colores`, `textos_publicos`, `secciones_visibles`)

### 5.3 Pseudocódigo del cambio

```python
# NUEVO (reemplaza líneas 51-72)
try:
    marcas_records = client.list_records("MARCAS", by_name=False)
    # Filtrar por AMBIENTE
    env_map = {"production": "produccion", "development": "demo", "railway": "demo"}
    current_env = env_map.get(os.getenv("DEPLOY_ENV", "development"), "demo")
    
    activas = [r for r in marcas_records 
               if r.get("fields",{}).get("AMBIENTE") == current_env
               and r.get("fields",{}).get("ESTADO_MARCA") != "inactivo"]
    activas.sort(key=lambda r: r.get("fields",{}).get("PRIORIDAD", 999))
    
    if activas:
        mf = activas[0].get("fields", {})
        result["nombre_sistema"] = mf.get("NOMBRE_MARCA")
        result["nombre_negocio"] = mf.get("NOMBRE_CORTO_MARCA")
        result["colores"] = {
            "primary": mf.get("COLOR_PRIMARIO"),
            "secondary": mf.get("COLOR_SECUNDARIO"),
            "accent": mf.get("COLOR_ACENTO"),
            "surface": mf.get("COLOR_FONDO"),
            "text": mf.get("COLOR_TEXTO"),
        }
        result["logo"] = mf.get("LOGO_URL")
        result["textos_publicos"] = {
            "cta_label": mf.get("HERO_CTA_PRIMARIO_TEXTO"),
            "phone": mf.get("TELEFONO_PUBLICO"),
            "email": mf.get("EMAIL_PUBLICO"),
            "whatsapp": mf.get("WHATSAPP_PUBLICO"),
            "hero_titulo": mf.get("HERO_TITULO"),
            "hero_subtitulo": mf.get("HERO_SUBTITULO"),
            "hero_badge": mf.get("HERO_BADGE"),
            "banner_titulo": mf.get("BANNER_TITULO"),
            "banner_mensaje": mf.get("BANNER_MENSAJE"),
            "reserva_titulo": mf.get("RESERVA_TITULO"),
            "footer_legal": mf.get("LEGAL_AVISO_PUBLICO"),
        }
        result["secciones_visibles"] = {
            "servicios": mf.get("MOSTRAR_SERVICIOS"),
            "productos": mf.get("MOSTRAR_PRODUCTOS"),
            "sucursales": mf.get("MOSTRAR_SUCURSALES"),
            "ofertas": mf.get("MOSTRAR_OFERTAS"),
            "testimonios": mf.get("MOSTRAR_TESTIMONIOS"),
            "como_funciona": mf.get("MOSTRAR_COMO_FUNCIONA"),
            "orden": mf.get("ORDEN_SECCIONES"),
        }
    else:
        result["faltantes"].append("MARCAS: sin registros activos para el ambiente actual")
except Exception as e:
    result["faltantes"].append(f"MARCAS (error): {str(e)}")
```

### 5.4 Deploy del cambio

```bash
cd backend
git add routes/modulos.py
git commit -m "FASE_1K_B: endpoint /api/marca-blanca lee de tabla MARCAS"
git push railway main
```

---

## 6. Paso 5 — Verificación post-deploy

```bash
# 6.1 Health
curl -s https://earnest-comfort-production-3d75.up.railway.app/health | python3 -m json.tool

# 6.2 /api/marca-blanca DEBE devolver datos reales
curl -s https://earnest-comfort-production-3d75.up.railway.app/api/marca-blanca \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    assert d['nombre_sistema'] == 'BellezaPro Demo', f'FAIL nombre: {d.get("nombre_sistema")}'; \
    assert d['colores']['primary'] == '006686', f'FAIL primary: {d["colores"]["primary"]}'; \
    assert len(d['modulos_activos']) > 0, 'FAIL: modulos vacíos'; \
    assert len(d.get('faltantes',[])) == 0, f'FAIL faltantes: {d.get("faltantes")}'; \
    print('OK — endpoint responde con datos reales')"

# 6.3 Frontend sigue funcionando
curl -sI https://bellezapro-demo.surge.sh | head -5
```

---

## 7. Qué queda fuera de alcance (NO se hace en esta fase)

| Fuera de alcance | Se hará en |
|-----------------|------------|
| ❌ Reemplazar hardcodes en componentes React | FASE_2C |
| ❌ Crear `BrandConfigContext` en frontend | FASE_2C |
| ❌ Reemplazar `brandTheme.js` por dinámico | FASE_2C |
| ❌ Auth real (login/registro) | FASE original 2A |
| ❌ Modificar `AnnouncementBar.jsx` | FASE_2C |
| ❌ Modificar `resolveBrandConfig.js` para consumir el nuevo formato | FASE_2C (o puente en 2B) |
| ❌ Tablas complementarias (BANNERS_PUBLICOS, OFERTAS_PUBLICAS) | Post-FASE_2C |

---

## 8. Orden de ejecución (resumen)

| Paso | Acción | Riesgo | Reversible |
|:----:|--------|:------:|:----------:|
| 1 | Snapshot pre-creación (2.1, 2.2, 2.3) | 🟢 | N/A (read-only) |
| 2 | Crear tabla MARCAS vía API (3) | 🟢 | ✅ (delete table) |
| 3 | Insertar seed (4) | 🟢 | ✅ (delete record) |
| 4 | Modificar `modulos.py` (5) | 🟡 | ✅ (git revert) |
| 5 | Deploy backend (5.4) | 🟡 | ✅ (git revert + push) |
| 6 | Verificación (6) | 🟢 | N/A |

---

> 📄 Documento generado en FASE_1K_B — Dry-run. Esperando aprobación de Diego.
