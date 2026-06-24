     1|# Skill: Database Security Auditor
     2|
     3|## 1. Proposito
     4|
     5|Auditar la seguridad de bases de datos Supabase/PostgreSQL en proyectos ERP y SaaS, verificando RLS, policies, exposicion de claves, multi-tenant, backups y separation de entornos. Bloquear o pedir aprobacion humana ante cambios inseguros.
     6|
     7|## 2. Cuando se activa
     8|
     9|- Antes de cada release o deploy a produccion
    10|- Cuando se crea una nueva tabla con datos sensibles
    11|- Cuando se modifica una policy RLS existente
    12|- Cuando se detecta una tabla sin RLS (alarma del sensor)
    13|- Cuando se expone una nueva tabla en la API de Supabase
    14|- Cuando se configura un nuevo storage bucket
    15|- Cuando se crea una edge function que accede a la BD
    16|- Periodicamente como auditoria de seguridad (revision mensual recomendada)
    17|
    18|## 3. Cuando NO se activa
    19|
    20|- Para diseno inicial de schema (ahi actua `supabase-architect`)
    21|- Para debugging de consultas SQL
    22|- Para tareas de frontend
    23|- Cuando no hay schema definido aun
    24|- Para cambios en tablas no sensibles sin RLS ni datos personales
    25|
    26|## 4. Responsabilidades
    27|
    28|1. Revisar RLS activado en todas las tablas sensibles.
    29|2. Revisar policies RLS por rol y por organization_id/tenant_id.
    30|3. Verificar que `service_role_key` NO esta expuesta en frontend ni codigo cliente.
    31|4. Verificar que `anon_key` solo se usa en frontend con RLS restrictivo.
    32|5. Revisar permisos por rol (admin, operador, cliente, publico).
    33|6. Revisar tablas que contienen datos sensibles (personales, financieros, auth).
    34|7. Revisar logs de auditoria de acciones criticas.
    35|8. Revisar configuracion de backups (frecuencia, retencion, restauracion).
    36|9. Revisar migraciones recientes en busca de operaciones destructivas.
    37|10. Revisar webhooks y edge functions que acceden a la BD.
    38|11. Verificar separacion de entornos dev/staging/prod.
    39|12. Generar reporte de auditoria en `docs/SECURITY.md`.
    40|
    41|## 5. Archivos que puede leer
    42|
    43|- `docs/SUPABASE_SETUP.md` — documentacion de setup de Supabase
    44|- `docs/DATABASE_MODEL.md` — modelo de datos actual
    45|- `docs/SECURITY.md` — reportes de seguridad previos
    46|- `supabase/migrations/` — migraciones SQL recientes
    47|- `supabase/seed.sql` — datos de prueba
    48|- `harness/sensors/CHECK_SUPABASE_SECURITY.md` — checklist de seguridad
    49|- `harness/contracts/SUPABASE_CONTRACT.md` — contrato de Supabase
    50|- `harness/contracts/` — contratos de modulos (para entender que datos hay)
    51|
    52|## 6. Archivos que puede modificar
    53|
    54|- `docs/SECURITY.md` — reporte de auditoria (hallazgos, riesgos, recomendaciones)
    55|- `progress/memory/decisions.md` — decisiones de seguridad registradas
    56|- `progress/tasks.json` — tareas de remediacion de hallazgos
    57|
    58|## 7. Archivos que NO puede tocar
    59|
    60|- `.env` o cualquier archivo con credenciales reales
    61|- Bases de datos reales en cualquier entorno
    62|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    63|- `harness/init.sh`
    64|- Codigo en `src/` o `app/`
    65|- Skills de otros agentes
    66|- El monolito legacy
    67|- Migraciones SQL (solo auditoria, no ejecucion)
    68|
    69|## 8. Herramientas / Stack relacionado
    70|
    71|- Supabase Dashboard (verificar RLS, policies, auth, storage)
    72|- Supabase CLI (revisar migraciones, policies locales)
    73|- PostgreSQL (consultar esquema, policies, grants)
    74|- `harness/sensors/CHECK_SUPABASE_SECURITY.md` — checklist estandar
    75|- `harness/contracts/SUPABASE_CONTRACT.md` — contrato de referencia
    76|- `supabase-architect` — contraparte para diseno y correccion
    77|
    78|## 9. Inputs minimos necesarios
    79|
    80|1. Que entorno se audita? (dev, staging, prod)
    81|2. Hace cuanto fue la ultima auditoria?
    82|3. Hubo cambios recientes en schema, RLS o auth?
    83|4. Hay datos sensibles en el sistema? (personales, financieros, auth)
    84|5. Es multi-tenant? (si si, organization_id es obligatorio)
    85|6. Hay webhooks o edge functions activas?
    86|7. Los backups estan configurados y funcionando?
    87|
    88|## 10. Flujo operativo paso a paso
    89|
    90|```
    91|Paso 1: Identificar entorno a auditar (dev/staging/prod)
    92|Paso 2: Revisar RLS tabla por tabla (buscar tablas sin RLS)
    93|Paso 3: Revisar policies por organization_id en tablas multi-tenant
    94|Paso 4: Verificar service_role_key no expuesta en frontend
    95|Paso 5: Verificar anon_key con permisos restrictivos
    96|Paso 6: Revisar roles de Supabase Auth
    97|Paso 7: Revisar migraciones recientes (buscar DROP/ALTER peligrosos)
    98|Paso 8: Revisar configuracion de backups
    99|Paso 9: Revisar webhooks y edge functions
   100|Paso 10: Generar reporte en docs/SECURITY.md
   101|Paso 11: Si hay hallazgos criticos, bloquear y pedir aprobacion
   102|Paso 12: Registrar en progres/memory/decisions.md
   103|Paso 13: Crear tareas de remediacion en progress/tasks.json
   104|```
   105|
   106|## 11. Output esperado
   107|
   108|- `docs/SECURITY.md` — reporte de auditoria completo
   109|- Checklist de seguridad verificado (10 puntos minimo)
   110|- Hallazgos clasificados por severidad (CRITICO/ALTO/MEDIO/BAJO)
   111|- Recomendaciones de remediacion por hallazgo
   112|- Tareas de remediacion en `progress/tasks.json`
   113|- Decisiones registradas en `progress/memory/`
   114|
   115|## 12. Checklist de salida
   116|
   117|- [ ] RLS revisado en todas las tablas?
   118|- [ ] Policies multi-tenant revisadas (organization_id)?
   119|- [ ] `service_role_key` NO expuesta en frontend?
   120|- [ ] `anon_key` configurada correctamente?
   121|- [ ] Roles de auth revisados?
   122|- [ ] Migraciones recientes revisadas?
   123|- [ ] Backups configurados y funcionales?
   124|- [ ] Webhooks y edge functions revisados?
   125|- [ ] Separacion dev/staging/prod verificada?
   126|- [ ] Reporte escrito en `docs/SECURITY.md`?
   127|- [ ] Hallazgos clasificados por severidad?
   128|- [ ] Tareas de remediacion creadas?
   129|
   130|## 13. Riesgos
   131|
   132|| Riesgo | Impacto | Mitigacion |
   133||--------|---------|------------|
   134|| Falso negativo (auditoria no detecta vulnerabilidad real) | Critico | Usar checklist estandar; si hay duda, marcar como hallazgo |
   135|| Auditoria sin acceso a produccion -> reporte incompleto | Alto | Auditar con la informacion disponible; marcar limitaciones en el reporte |
   136|| Recomendar cambios sin entender el contexto del negocio | Medio | Leer contratos de modulos antes de recomendar cambios |
   137|| No priorizar hallazgos -> todo parece urgente | Medio | Clasificar por severidad; CRITICO requiere accion inmediata, BAJO va a backlog |
   138|
   139|## 14. Cuando pedir aprobacion humana
   140|
   141|- **Siempre** ante hallazgos de severidad CRITICA (service_role_key expuesta, RLS ausente en datos sensibles)
   142|- **Siempre** antes de recomendar cambios en RLS de produccion
   143|- **Siempre** antes de recomendar migraciones destructivas
   144|- **Siempre** si la auditoria descubre datos personales sin proteccion (GDPR/LOPD)
   145|- En caso de duda, escalar
   146|
   147|## 15. Relacion con el Harness
   148|
   149|| Documento | Como se relaciona |
   150||-----------|-------------------|
   151|| `AGENTS.md` | Los agentes invocan esta skill como paso previo a release o deploy |
   152|| `FACTORY_HARNESS_MASTER.md` | La seguridad sigue los estandares definidos en el master |
   153|| `harness/AGENT_RUNBOOK.md` | La auditoria de seguridad es fase previa a release |
   154|| `harness/PERMISSIONS.md` | Bloquear acciones inseguras esta en las reglas anti-caos |
   155|| `harness/SENSORS.md` | Los sensores disparan esta skill cuando detectan tablas sin RLS |
   156|| `harness/contracts/` | El contrato SUPABASE_CONTRACT.md define estandares de seguridad |
   157|| `progress/tasks.json` | Crea tareas de remediacion de hallazgos |
   158|| `progress/memory/` | Registra hallazgos, decisiones y remediaciones |
   159|
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
- Bloquear acciones criticas: migraciones, cambios RLS, auth, pagos.
- Reportar uso indebido de service_role_key o secrets expuestos.
- Verificar RLS en tablas multi-tenant.
- No exponer datos sensibles en logs.
