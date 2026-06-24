     1|# Skill: Supabase Architect
     2|
     3|## 1. Proposito
     4|
     5|Disenar, revisar y mantener arquitectura Supabase segura y escalable para proyectos ERP y SaaS, con enfasis en separacion dev/staging/prod, RLS obligatorio en datos sensibles, y prohibicion absoluta de exponer `service_role_key` en frontend.
     6|
     7|## 2. Cuando se activa
     8|
     9|- El `erp-module-designer` entrega un contrato de modulo que requiere tablas Supabase
    10|- Se necesita crear una migracion de base de datos
    11|- Una tarea en `progress/tasks.json` tiene status `ready` y fase `database` o `architecture`
    12|- Se detecta una vulnerabilidad RLS o una policy insegura
    13|- Se necesita disenar multi-tenant para un nuevo proyecto
    14|- Se requiere crear seeds de prueba, edge functions o storage buckets
    15|- Un sensor de seguridad detecta una tabla sin RLS
    16|
    17|## 3. Cuando NO se activa
    18|
    19|- Para datos no criticos que viven en Airtable (ahi actua `airtable-operator`)
    20|- Para debugging de consultas SQL simples
    21|- Para tareas de frontend o UI
    22|- Cuando no hay contrato de modulo aprobado
    23|- Para migraciones destructivas sin backup y aprobacion humana previa
    24|
    25|## 4. Responsabilidades
    26|
    27|1. Disenar schemas PostgreSQL con tablas, relaciones, constraints e indices.
    28|2. Crear y documentar migraciones SQL (siempre con rollback).
    29|3. Disenar Row Level Security (RLS) con policies por rol.
    30|4. Disenar roles y permisos de Supabase Auth.
    31|5. Crear views para reportes y consultas frecuentes.
    32|6. Crear triggers y funciones SQL para logica de base de datos.
    33|7. Disenar estructura multi-tenant (una base por tenant o RLS por tenant_id).
    34|8. Crear seeds de prueba para desarrollo local.
    35|9. Configurar storage buckets con policies de acceso.
    36|10. Crear edge functions si es necesario.
    37|11. Documentar todo en `docs/SUPABASE_SETUP.md` y `docs/DATABASE_MODEL.md`.
    38|12. Separar ambientes local (local Supabase), staging y produccion.
    39|
    40|## 5. Archivos que puede leer
    41|
    42|- `harness/contracts/` -- contratos de modulos para entender necesidades de datos
    43|- `docs/SUPABASE_SETUP.md` -- documentacion actual de Supabase
    44|- `docs/DATABASE_MODEL.md` -- modelo de datos actual
    45|- `docs/MODULES.md` -- modulos existentes que usan Supabase
    46|- `harness/sensors/CHECK_SUPABASE_SECURITY.md` -- checklist de seguridad
    47|- `config/supabase.env.example` -- variables de entorno de ejemplo
    48|- `harness/templates/MODULE_CONTRACT_TEMPLATE.md`
    49|
    50|## 6. Archivos que puede modificar
    51|
    52|- `docs/SUPABASE_SETUP.md` -- documentacion de setup y migraciones
    53|- `docs/DATABASE_MODEL.md` -- modelo de datos actualizado
    54|- `progress/memory/decisions.md` -- decisiones de diseno de BD
    55|- `progress/tasks.json` -- tareas tecnicas de base de datos
    56|- `supabase/migrations/` -- archivos de migracion SQL (solo con aprobacion)
    57|- `supabase/seed.sql` -- datos de prueba
    58|
    59|## 7. Archivos que NO puede tocar
    60|
    61|- `.env` o cualquier archivo con credenciales reales
    62|- Produccion (bases reales de Supabase)
    63|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    64|- `harness/init.sh`
    65|- Codigo frontend en `src/` o `app/`
    66|- Skills de otros agentes
    67|- El monolito legacy
    68|- Bases de datos que no tengan backup reciente (antes de migrar)
    69|
    70|## 8. Herramientas / Stack relacionado
    71|
    72|- Supabase CLI (local dev, migration push/pull)
    73|- PostgreSQL (pg_dump, pg_restore para backups)
    74|- Supabase Dashboard (para verificar RLS, policies, auth)
    75|- `harness/sensors/CHECK_SUPABASE_SECURITY.md` -- checklist post-diseno
    76|- `harness/contracts/SUPABASE_CONTRACT.md` -- contrato especifico de Supabase
    77|- n8n (para sync Airtable <-> Supabase disenada por `airtable-operator`)
    78|
    79|## 9. Inputs minimos necesarios
    80|
    81|1. Que modulo o feature necesita base de datos? (referencia al contrato)
    82|2. Que entidades se necesitan? (tablas principales)
    83|3. Que relaciones hay entre ellas? (1:1, 1:N, N:N)
    84|4. Quienes son los roles de usuario? (admin, operador, cliente, etc.)
    85|5. Que datos son sensibles? (requieren RLS obligatorio)
    86|6. Es multi-tenant? (si si, definir tenant_id como policy estandar)
    87|7. Hay integraciones externas? (API keys, webhooks, edge functions)
    88|
    89|## 10. Flujo operativo paso a paso
    90|
    91|```
    92|Paso 1: Leer contrato del modulo o feature
    93|Paso 2: Identificar entidades, relaciones y constraints
    94|Paso 3: Disenar schema PostgreSQL (tablas + indices + FKs)
    95|Paso 4: Definir roles de Supabase Auth
    96|Paso 5: Disenar RLS policies por tabla y por rol
    97|Paso 6: Crear migracion SQL (con rollback)
    98|Paso 7: Crear seeds de prueba
    99|Paso 8: Si aplica, disenar storage buckets y edge functions
   100|Paso 9: Documentar en docs/SUPABASE_SETUP.md y docs/DATABASE_MODEL.md
   101|Paso 10: Verificar con CHECK_SUPABASE_SECURITY.md
   102|Paso 11: Registrar decisiones en progress/memory/decisions.md
   103|Paso 12: Solicitar aprobacion humana antes de migrar a prod o staging
   104|```
   105|
   106|## 11. Output esperado
   107|
   108|- Schema PostgreSQL completo (tablas, relaciones, indices, constraints)
   109|- Migraciones SQL (up + down/rollback)
   110|- Policies RLS por tabla y por rol
   111|- Seeds de prueba
   112|- Documentacion actualizada (`docs/SUPABASE_SETUP.md`, `docs/DATABASE_MODEL.md`)
   113|- Checklist de seguridad verificado
   114|- Decisiones registradas en `progress/memory/`
   115|
   116|## 12. Checklist de salida
   117|
   118|- [ ] Schema disenado completo (tablas + relaciones + indices)?
   119|- [ ] Roles de Supabase Auth definidos?
   120|- [ ] RLS policies creadas para tablas sensibles?
   121|- [ ] Migracion SQL lista con rollback?
   122|- [ ] Seeds de prueba creados?
   123|- [ ] Documentacion actualizada?
   124|- [ ] Checklist de seguridad verificado?
   125|- [ ] Ninguna `service_role_key` expuesta?
   126|- [ ] Aprobacion humana obtenida si hay migracion destructiva?
   127|- [ ] Decisiones registradas en `progress/memory/`?
   128|
   129|## 13. Riesgos
   130|
   131|| Riesgo | Impacto | Mitigacion |
   132||--------|---------|------------|
   133|| Exponer `service_role_key` en frontend | Critico | Regla absoluta: nunca en frontend, solo en edge functions o backend |
   134|| RLS mal disenado (datos visibles entre tenants) | Critico | Policy por tenant_id obligatoria en multi-tenant; verificar con sensor |
   135|| Migracion destructiva sin backup | Alto | Backup antes de migrar; migracion DOWN siempre presente |
   136|| Cambiar schema en produccion sin pruebas | Alto | Siempre probar en local/staging antes; aprobacion humana requerida |
   137|| Usar datos reales en desarrollo | Medio | Seeds sinteticos, nunca datos reales de produccion |
   138|
   139|## 14. Cuando pedir aprobacion humana
   140|
   141|- **Siempre** antes de migraciones destructivas (DROP TABLE, ALTER COLUMN que pierde datos)
   142|- **Siempre** antes de cambios en RLS policies que afectan datos existentes
   143|- **Siempre** antes de exponer nuevas tablas en la API de Supabase
   144|- **Siempre** antes de cambiar estructura multi-tenant
   145|- **Siempre** antes de ejecutar migraciones en staging o produccion
   146|- En caso de duda, preguntar
   147|
   148|## 15. Relacion con el Harness
   149|
   150|| Documento | Como se relaciona |
   151||-----------|-------------------|
   152|| `AGENTS.md` | Los agentes invocan esta skill cuando una tarea requiere base de datos |
   153|| `FACTORY_HARNESS_MASTER.md` | La arquitectura de datos sigue los patrones del master |
   154|| `harness/AGENT_RUNBOOK.md` | El diseno de BD es fase posterior a definicion y contrato |
   155|| `harness/PERMISSIONS.md` | Prohibicion de exponer service_role_key esta en permissions |
   156|| `harness/SENSORS.md` | CHECK_SUPABASE_SECURITY.md valida RLS y policies post-diseno |
   157|| `harness/contracts/` | El contrato del modulo define que datos se necesitan |
   158|| `progress/tasks.json` | Crea tareas de migracion, seeds y documentacion |
   159|| `progress/memory/` | Registra decisiones de schema, RLS y multi-tenant |
   160|
## Reglas anti-caos aplicables

Esta skill debe respetar siempre `harness/sensors/CHECK_ANTI_CAOS.md`.

Antes de entregar, verificar especialmente:

- No crear estructuras paralelas.
- No duplicar fuentes de verdad.
- No tocar produccion sin aprobacion humana.
- No modificar `.env` ni credenciales reales.
- No exponer secrets ni service role keys.
- No dar por terminada tarea sin actualizar `progress/tasks.json`.
- No dejar decisiones importantes fuera de `progress/memory/`.
- No entregar sin resumen entendible para Diego.

**Reglas especificas:**
- RLS obligatorio en datos sensibles.
- `SUPABASE_SERVICE_ROLE_KEY` prohibida en frontend.
- Migraciones siempre con backup y aprobacion humana previa.
- Separar ambientes dev/staging/prod.
- No ejecutar migraciones destructivas en produccion.
