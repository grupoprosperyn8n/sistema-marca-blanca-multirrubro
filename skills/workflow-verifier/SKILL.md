     1|# Skill: Workflow Verifier
     2|
     3|## 1. Proposito
     4|
     5|Verificar workflows n8n, sincronizaciones Airtable-Supabase y flujos automatizados antes de activarlos en produccion, asegurando que tengan manejo de errores, payloads de prueba, idempotencia y aprobacion humana.
     6|
     7|## 2. Cuando se activa
     8|
     9|- El `n8n-automation-builder` completa el diseno de un workflow y solicita verificacion
    10|- Antes de activar cualquier workflow en produccion (requisito obligatorio)
    11|- Cuando se modifica un workflow existente en staging
    12|- Cuando se detecta un error recurrente en un workflow activo
    13|- Cuando un sensor detecta un loop potencial (Airtable <-> Supabase <-> n8n)
    14|- Periodicamente como verificacion de salud de workflows activos
    15|
    16|## 3. Cuando NO se activa
    17|
    18|- Durante el diseno inicial del workflow (ahi actua `n8n-automation-builder`)
    19|- Para tareas que no involucran automatizaciones
    20|- Para workflows que solo leen datos (no modifican)
    21|- Cuando el workflow no tiene manejo de errores (debe tenerlo antes de verificar)
    22|- Cuando no hay documentacion del workflow
    23|
    24|## 4. Responsabilidades
    25|
    26|1. Revisar logica del workflow (el trigger produce el resultado esperado?).
    27|2. Verificar payloads de prueba (entrada realista, salida esperada).
    28|3. Revisar seguridad de webhooks (secret, validacion, rate limit).
    29|4. Revisar credenciales (usando variables de entorno, no hardcodeadas).
    30|5. Revisar manejo de errores (try/catch, retry, fallback, notificacion).
    31|6. Revisar loops (condiciones de guarda para evitar loops infinitos).
    32|7. Revisar duplicacion de datos (idempotencia del workflow).
    33|8. Revisar impacto en produccion (que pasa si falla a mitad de camino?).
    34|9. Ejecutar pruebas manuales en staging antes de aprobar.
    35|10. Generar reporte de verificacion con estado, riesgo y recomendacion.
    36|
    37|## 5. Archivos que puede leer
    38|
    39|- `n8n/workflow-docs/` — documentacion del workflow a verificar
    40|- `n8n/workflow-exports/` — JSON exportado del workflow
    41|- `docs/N8N_SETUP.md` — documentacion general de n8n
    42|- `harness/sensors/CHECK_WORKFLOW_SECURITY.md` — checklist de verificacion
    43|- `harness/contracts/N8N_CONTRACT.md` — contrato de n8n
    44|- `harness/contracts/` — contratos de modulos (para entender contexto del workflow)
    45|- `progress/tasks.json` — tareas asociadas al workflow
    46|
    47|## 6. Archivos que puede modificar
    48|
    49|- `docs/N8N_SETUP.md` — agregar estado de verificacion del workflow
    50|- `n8n/workflow-docs/` — agregar reporte de verificacion al workflow
    51|- `progress/memory/decisions.md` — decisiones de verificacion
    52|- `progress/tasks.json` — marcar tarea de verificacion como completada
    53|
    54|## 7. Archivos que NO puede tocar
    55|
    56|- `.env` o cualquier archivo con credenciales reales
    57|- Workflows n8n activos en produccion
    58|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    59|- `harness/init.sh`
    60|- Codigo en `src/` o `app/`
    61|- Skills de otros agentes
    62|- El monolito legacy
    63|- Bases de datos reales
    64|
    65|## 8. Herramientas / Stack relacionado
    66|
    67|- n8n Dashboard (ver ejecuciones, logs, test manual)
    68|- `n8n/workflow-exports/` — JSON exportado para revision offline
    69|- `harness/sensors/CHECK_WORKFLOW_SECURITY.md` — checklist estandar
    70|- `harness/contracts/N8N_CONTRACT.md` — contrato de referencia
    71|- `n8n-automation-builder` — contraparte que diseno el workflow
    72|- `airtable-operator` — para verificar sincronizacion con Airtable
    73|- `database-security-auditor` — para verificar impacto en BD
    74|
    75|## 9. Inputs minimos necesarios
    76|
    77|1. Que workflow se va a verificar? (nombre, ID, proposito)
    78|2. En que entorno se activara? (staging o produccion)
    79|3. Cual es el trigger del workflow?
    80|4. Que datos procesa y hacia donde los envia?
    81|5. Tiene manejo de errores? (si/no, cual?)
    82|6. Tiene payloads de prueba? (si/no)
    83|7. Es primera activacion o es una modificacion?
    84|
    85|## 10. Flujo operativo paso a paso
    86|
    87|```
    88|Paso 1: Recibir workflow del n8n-automation-builder para verificacion
    89|Paso 2: Leer documentacion del workflow
    90|Paso 3: Revisar logica (el trigger produce el resultado esperado?)
    91|Paso 4: Revisar payloads de prueba (entrada realista, salida esperada)
    92|Paso 5: Revisar webhooks (secret, validacion)
    93|Paso 6: Revisar credenciales (variables de entorno, no hardcodeadas)
    94|Paso 7: Revisar manejo de errores (try/catch, retry, notificacion)
    95|Paso 8: Revisar loops (condiciones de guarda)
    96|Paso 9: Revisar idempotencia (no duplica datos si se ejecuta 2 veces)
    97|Paso 10: Revisar impacto en produccion
    98|Paso 11: Ejecutar pruebas manuales en staging (si es posible)
    99|Paso 12: Generar reporte con estado/riesgo/recomendacion
   100|Paso 13: Si todo ok, aprobar; si hay riesgo, bloquear y pedir aprobacion humana
   101|```
   102|
   103|## 11. Output esperado
   104|
   105|- Reporte de verificacion del workflow (estado, riesgo, recomendacion)
   106|- Checklist de verificacion completado
   107|- Payloads de prueba verificados
   108|- Decision registrada en `progress/memory/decisions.md`
   109|- Tarea de verificacion marcada en `progress/tasks.json`
   110|
   111|## 12. Checklist de salida
   112|
   113|- [ ] Logica del workflow revisada?
   114|- [ ] Payloads de prueba creados y verificados?
   115|- [ ] Webhooks tienen secret o validacion?
   116|- [ ] Credenciales usan variables de entorno?
   117|- [ ] Manejo de errores presente (try/catch, retry, notificacion)?
   118|- [ ] Loop potencial identificado y mitigado?
   119|- [ ] Idempotencia verificada (no duplica datos)?
   120|- [ ] Impacto en produccion evaluado?
   121|- [ ] Pruebas manuales ejecutadas en staging?
   122|- [ ] Reporte de verificacion generado?
   123|- [ ] Aprobacion humana obtenida si workflow es critico?
   124|
   125|## 13. Riesgos
   126|
   127|| Riesgo | Impacto | Mitigacion |
   128||--------|---------|------------|
   129|| Aprobar workflow sin probar en staging | Alto | Siempre probar en staging antes de aprobar produccion |
   130|| No detectar loop infinito | Critico | Verificar condicion de guarda; el workflow debe detenerse si no hay cambios |
   131|| Aprobar con payloads de prueba irreales | Medio | Usar datos similares a produccion (sin datos reales) |
   132|| Perder trazabilidad de aprobacion | Medio | Registrar en progress/memory/decisions.md quien y cuando aprobo |
   133|
   134|## 14. Cuando pedir aprobacion humana
   135|
   136|- **Siempre** antes de activar un workflow en produccion
   137|- **Siempre** si el workflow modifica datos criticos (facturacion, clientes, stock)
   138|- **Siempre** si el workflow envia emails o notificaciones a clientes reales
   139|- **Siempre** si la verificacion encuentra riesgos de severidad ALTA o CRITICA
   140|- En caso de duda, no activar y preguntar
   141|
   142|## 15. Relacion con el Harness
   143|
   144|| Documento | Como se relaciona |
   145||-----------|-------------------|
   146|| `AGENTS.md` | Los agentes invocan esta skill antes de activar automatizaciones |
   147|| `FACTORY_HARNESS_MASTER.md` | La verificacion de flujos sigue los criterios del master |
   148|| `harness/AGENT_RUNBOOK.md` | La verificacion es fase obligatoria entre diseno y activacion |
   149|| `harness/PERMISSIONS.md` | Ningun workflow productivo se activa sin verificacion y aprobacion |
   150|| `harness/SENSORS.md` | Los sensores monitorean workflows activos y disparan reverificacion si detectan errores |
   151|| `harness/contracts/` | El contrato N8N_CONTRACT.md define que debe verificar esta skill |
   152|| `progress/tasks.json` | Marca tareas de verificacion como completadas |
   153|| `progress/memory/` | Registra verificaciones, aprobaciones y hallazgos |
   154|
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
- Verificar loops Airtable ↔ Supabase ↔ n8n.
- Verificar direccion de sincronizacion documentada.
- Verificar manejo de errores en automatizaciones.
- Verificar webhooks con secret.
