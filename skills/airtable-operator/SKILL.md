     1|# Skill: Airtable Operator
     2|
     3|## 1. Proposito
     4|
     5|Usar Airtable como capa no-code operativa para prototipos, CRM liviano, backoffice, staging de datos y sincronizacion con Supabase, dejando claro que Airtable NO es la fuente principal de verdad para datos criticos cuando Supabase ya existe.
     6|
     7|## 2. Cuando se activa
     8|
     9|- Un modulo necesita backoffice no-code para personal no tecnico
    10|- Se necesita un CRM rapido o panel administrativo liviano
    11|- El `erp-module-designer` disena un modulo que requiere sincronizacion Airtable <-> Supabase
    12|- Se necesita cargar datos por personal que no usa SQL
    13|- Un MVP necesita interfaz de administracion sin desarrollar frontend
    14|- Se necesita un staging operativo antes de migrar a Supabase
    15|
    16|## 3. Cuando NO se activa
    17|
    18|- Para datos criticos, transaccionales o sensibles (deben ir a Supabase)
    19|- Para alto volumen (>50K registros, Airtable no escala bien)
    20|- Para datos que requieren RLS, auth complejo o multi-tenant avanzado
    21|- Cuando el modulo ya tiene frontend desarrollado
    22|- Para almacenar claves, tokens, passwords o datos personales sensibles
    23|- Cuando no hay un mapa de sincronizacion definido con Supabase
    24|
    25|## 4. Responsabilidades
    26|
    27|1. Disenar bases Airtable (tablas, campos, tipos, relaciones).
    28|2. Crear vistas necesarias (Grid, Kanban, Calendar, Gallery segun el caso).
    29|3. Disenar interfaces Airtable para backoffice liviano.
    30|4. Definir que datos viven en Airtable y cuales en Supabase (mapeo).
    31|5. Disenar sincronizacion Airtable <-> Supabase via n8n.
    32|6. Crear automatizaciones simples dentro de Airtable cuando convenga.
    33|7. Documentar en `docs/AIRTABLE_SETUP.md`.
    34|8. Definir reglas de sincronizacion (unidireccional, bidireccional, frecuencia).
    35|9. Validar que Airtable no duplique la fuente de verdad de Supabase.
    36|
    37|## 5. Archivos que puede leer
    38|
    39|- `harness/contracts/` -- contratos de modulos para entender necesidades de datos
    40|- `docs/AIRTABLE_SETUP.md` -- documentacion actual de Airtable
    41|- `docs/SUPABASE_SETUP.md` -- esquema actual de Supabase para mapeo
    42|- `docs/MODULES.md` -- modulos existentes
    43|- `harness/sensors/CHECK_AIRTABLE_SYNC.md` -- checklist de sincronizacion
    44|- `config/airtable.env.example` -- variables de entorno de ejemplo
    45|- `harness/templates/MODULE_CONTRACT_TEMPLATE.md`
    46|
    47|## 6. Archivos que puede modificar
    48|
    49|- `docs/AIRTABLE_SETUP.md` -- documentacion de setup y mapeo
    50|- `progress/memory/decisions.md` -- decisiones de diseno
    51|- `progress/tasks.json` -- tareas de sincronizacion y diseno
    52|
    53|## 7. Archivos que NO puede tocar
    54|
    55|- `.env` o cualquier archivo con credenciales reales
    56|- Bases de datos Supabase (las toca `supabase-architect`)
    57|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    58|- `harness/init.sh`
    59|- Codigo en `src/` o `app/`
    60|- Skills de otros agentes
    61|- El monolito legacy
    62|- Datos reales de produccion sin aprobacion
    63|
    64|## 8. Herramientas / Stack relacionado
    65|
    66|- Airtable UI (diseno de bases, vistas, interfaces)
    67|- Airtable API (via n8n o scripts)
    68|- n8n (sincronizacion Airtable <-> Supabase)
    69|- `harness/sensors/CHECK_AIRTABLE_SYNC.md` -- checklist post-diseno
    70|- `harness/contracts/AIRTABLE_CONTRACT.md` -- contrato especifico de Airtable
    71|- `supabase-architect` (contraparte para mapeo de datos)
    72|
    73|## 9. Inputs minimos necesarios
    74|
    75|1. Que modulo o proceso necesita Airtable?
    76|2. Quien va a usar la base? (perfil tecnico o no tecnico)
    77|3. Que datos va a contener? (lista de campos, tipos)
    78|4. Se sincroniza con Supabase? (si/no, y en que direccion)
    79|5. Es temporario o permanente?
    80|6. Cuantos registros estimados? (si >50K, reconsiderar)
    81|7. Hay datos sensibles? (si si, reconsiderar -> Supabase)
    82|
    83|## 10. Flujo operativo paso a paso
    84|
    85|```
    86|Paso 1: Leer contrato del modulo
    87|Paso 2: Identificar necesidad: es backoffice, CRM, staging o temporal?
    88|Paso 3: Definir que datos van a Airtable vs Supabase
    89|Paso 4: Disenar tablas, campos y tipos en Airtable
    90|Paso 5: Crear vistas segun necesidad (Grid, Kanban, etc.)
    91|Paso 6: Disenar interfaces si aplica
    92|Paso 7: Definir sincronizacion con Supabase (via n8n)
    93|Paso 8: Documentar en docs/AIRTABLE_SETUP.md
    94|Paso 9: Verificar con CHECK_AIRTABLE_SYNC.md
    95|Paso 10: Registrar en progress/memory/decisions.md
    96|Paso 11: Solicitar aprobacion si la sincronizacion es bidireccional
    97|```
    98|
    99|## 11. Output esperado
   100|
   101|- Diseno de base Airtable (tablas, campos, vistas, interfaces)
   102|- Mapa Airtable <-> Supabase (que dato vive donde)
   103|- Reglas de sincronizacion (unidireccional o bidireccional, frecuencia)
   104|- Documentacion actualizada (`docs/AIRTABLE_SETUP.md`)
   105|- Checklist de sincronizacion verificado
   106|- Decisiones registradas en `progress/memory/`
   107|
   108|## 12. Checklist de salida
   109|
   110|- [ ] Necesidad identificada correctamente (backoffice / CRM / staging / temporal)?
   111|- [ ] Datos en Airtable son no criticos?
   112|- [ ] Mapa Airtable <-> Supabase definido?
   113|- [ ] Reglas de sincronizacion documentadas?
   114|- [ ] Vistas necesarias creadas?
   115|- [ ] Interfaces disenadas (si aplica)?
   116|- [ ] Documentacion actualizada en `docs/AIRTABLE_SETUP.md`?
   117|- [ ] No hay datos sensibles en Airtable?
   118|- [ ] Sincronizacion no es bidireccional sin aprobacion?
   119|
   120|## 13. Riesgos
   121|
   122|| Riesgo | Impacto | Mitigacion |
   123||--------|---------|------------|
   124|| Airtable como fuente de verdad unica para datos criticos | Alto | Regla: si ya existe Supabase para ese dato, Airtable es copia, no origen |
   125|| Duplicacion de datos sin sincronizacion clara | Alto | Mapa Airtable <-> Supabase obligatorio antes de crear tablas |
   126|| Sincronizacion bidireccional causa conflictos | Medio | por defecto unidireccional; bidireccional solo con aprobacion y reglas de resolucion |
   127|| Exponer datos sensibles en Airtable (sin RLS) | Alto | Airtable no tiene RLS como Supabase; nunca poner datos sensibles |
   128|| Crecimiento >50K registros afecta rendimiento | Medio | Monitorear volumen; planear migracion a Supabase cuando se acerque al limite |
   129|
   130|## 14. Cuando pedir aprobacion humana
   131|
   132|- **Siempre** antes de sincronizacion bidireccional Airtable <-> Supabase
   133|- **Siempre** si se propone migrar datos de Supabase a Airtable
   134|- **Siempre** si la base Airtable contiene datos que parecen sensibles
   135|- **Siempre** antes de borrado masivo de registros en Airtable
   136|- En caso de duda, preguntar
   137|
   138|## 15. Relacion con el Harness
   139|
   140|| Documento | Como se relaciona |
   141||-----------|-------------------|
   142|| `AGENTS.md` | Los agentes invocan esta skill para diseno de capa no-code |
   143|| `FACTORY_HARNESS_MASTER.md` | La capa Airtable sigue los patrones de no-code del master |
   144|| `harness/AGENT_RUNBOOK.md` | El diseno de Airtable es fase posterior a definicion y contrato |
   145|| `harness/PERMISSIONS.md` | Reglas anti-caos sobre no duplicar fuente de verdad |
   146|| `harness/SENSORS.md` | CHECK_AIRTABLE_SYNC.md valida sincronizacion post-diseno |
   147|| `harness/contracts/` | El contrato del modulo define si necesita capa no-code |
   148|| `progress/tasks.json` | Crea tareas de diseno y sincronizacion |
   149|| `progress/memory/` | Registra decisiones sobre que datos van a Airtable vs Supabase |
   150|
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
- Sincronizacion Airtable ↔ Supabase debe tener direccion clara documentada.
- No duplicar fuente de verdad: si Supabase es la fuente, Airtable es temporal o viceversa.
- No crear loops con n8n o Supabase.
- No guardar datos criticos si Supabase es la fuente de verdad.
