     1|# Skill: Agent Safety Reviewer
     2|
     3|## Propósito
     4|
     5|Revisar que los agentes no ejecuten acciones peligrosas en producción, base de datos, credenciales, permisos, pagos o infraestructura crítica. Bloquear o pedir aprobación humana antes de permitir operaciones de alto riesgo.
     6|
     7|## Cuándo se activa
     8|
     9|- Antes de ejecutar cualquier operación que modifique producción.
    10|- Antes de ejecutar migraciones de base de datos.
    11|- Antes de cambiar RLS policies, roles o permisos.
    12|- Antes de activar workflows n8n productivos.
    13|- Antes de exponer o modificar credenciales, secrets o tokens.
    14|- Antes de modificar autenticación, pagos o datos de usuarios.
    15|- Antes de ejecutar comandos destructivos (DELETE, DROP, TRUNCATE).
    16|- Cada vez que un agente propone una acción en `harness/PERMISSIONS.md` como "requiere aprobación".
    17|
    18|## Cuándo NO se activa
    19|
    20|- Durante desarrollo local (non-prod, datos de prueba).
    21|- Durante tareas de solo lectura (consultas SELECT, reportes).
    22|- Durante creación de documentos, contratos o especificaciones.
    23|- Cuando la acción ya fue aprobada explícitamente por el usuario en esta sesión.
    24|
    25|## Responsabilidades
    26|
    27|1. Revisar cada acción propuesta contra la lista de operaciones de alto riesgo.
    28|2. Clasificar el riesgo: CRÍTICO / ALTO / MEDIO / BAJO.
    29|3. Bloquear automáticamente acciones CRÍTICAS (borrar datos productivos, migraciones sin backup).
    30|4. Pedir aprobación humana para acciones de ALTO riesgo.
    31|5. Permitir acciones de MEDIO/BAJO riesgo pero documentarlas.
    32|6. Generar reporte de seguridad con hallazgos.
    33|7. Registrar incidentes de seguridad bloqueados en `harness/FAILURE_LOG.md`.
    34|8. No modificar ningún archivo directamente — solo revisar y reportar.
    35|
    36|## Archivos que puede leer
    37|
    38|- Cualquier plan, contrato, tarea o PRD antes de su ejecución.
    39|- `harness/PERMISSIONS.md` (lista de operaciones permitidas/bloqueadas).
    40|- `harness/SENSORS.md` (sensores activos que ya monitorean riesgos).
    41|- `harness/FAILURE_LOG.md` (historial de incidentes previos).
    42|- `harness/contracts/*` (para verificar permisos definidos en el contrato).
    43|- `harness/AGENT_RUNBOOK.md` (para entender el flujo de trabajo).
    44|
    45|## Archivos que puede modificar
    46|
    47|- **NINGUNO directamente.** Solo genera reportes para el usuario. Si hay incidentes, el usuario decide registrar en `harness/FAILURE_LOG.md`.
    48|
    49|## Archivos que NO puede tocar
    50|
    51|- TODOS los archivos del proyecto. Esta skill solo revisa y reporta. No ejecuta cambios.
    52|
    53|## Herramientas / Stack relacionado
    54|
    55|- `harness/PERMISSIONS.md` — operaciones permitidas, bloqueadas, condicionales.
    56|- `harness/SENSORS.md` — sensores que ya monitorean la seguridad.
    57|- `harness/FAILURE_LOG.md` — registro de incidentes.
    58|- `harness/AGENT_RUNBOOK.md` — flujo de seguridad en el runbook.
    59|- `harness/contracts/AI_AGENT_CONTRACT.md` — límites y prohibiciones para agentes.
    60|
    61|## Inputs mínimos necesarios
    62|
    63|- Descripción de la operación propuesta (qué va a hacer el agente).
    64|- Contexto: entorno (producción/staging/desarrollo).
    65|- Archivos o recursos que va a modificar.
    66|
    67|## Flujo operativo paso a paso
    68|
    69|1. **Recibir operación** — el agente describe qué va a hacer.
    70|2. **Identificar tipo de riesgo** — clasificar contra la lista del checklist.
    71|3. **Verificar en PERMISSIONS.md** — ¿la operación está permitida, bloqueada o requiere aprobación?
    72|4. **Clasificar severidad** — CRÍTICO / ALTO / MEDIO / BAJO.
    73|5. **Tomar acción** — bloquear (CRÍTICO), pedir aprobación (ALTO), documentar (MEDIO), permitir (BAJO).
    74|6. **Generar reporte** — riesgo, motivo, acción permitida, acción bloqueada, aprobación requerida.
    75|7. **Entregar al usuario** — presentar el reporte y esperar decisión si aplica.
    76|
    77|## Output esperado
    78|
    79|Reporte de seguridad con:
    80|
    81|- **Operación evaluada:** descripción de lo que el agente quiere hacer.
    82|- **Clasificación de riesgo:** CRÍTICO / ALTO / MEDIO / BAJO.
    83|- **Riesgo detectado:** qué peligro específico se identificó.
    84|- **Acción bloqueada:** qué no se permite hacer.
    85|- **Acción permitida:** alternativa segura (si existe).
    86|- **Aprobación requerida:** ¿humana? ¿automática? ¿ninguna?
    87|
    88|## Checklist de salida
    89|
    90|- [ ] Operación evaluada contra PERMISSIONS.md.
    91|- [ ] Riesgo clasificado (CRÍTICO/ALTO/MEDIO/BAJO).
    92|- [ ] Acción bloqueada si corresponde.
    93|- [ ] Aprobación humana solicitada si corresponde.
    94|- [ ] Reporte de seguridad entregado al usuario.
    95|- [ ] (Opcional) Incidente registrado en FAILURE_LOG.md por el usuario.
    96|
    97|## Riesgos
    98|
    99|- **Falso positivo:** bloquear una operación segura. Mitigación: tener ruta de escalamiento "permitir esta vez" con aprobación.
   100|- **Falso negativo:** permitir una operación peligrosa. Mitigación: lista de reglas exhaustiva en PERMISSIONS.md, no confiar solo en la skill.
   101|- **Omisión de revisión:** el agente ejecuta sin pasar por esta skill. Mitigación: los sensores del harness deben detectar operaciones sin revisión.
   102|- **Dependencia exclusiva de la skill:** el agente confía solo en esta skill para seguridad. Mitigación: la seguridad es responsabilidad compartida con PERMISSIONS.md, SENSORS.md y revisión humana.
   103|
   104|## Cuándo pedir aprobación humana
   105|
   106|- SIEMPRE para operaciones clasificadas como CRÍTICO o ALTO riesgo.
   107|- SIEMPRE para borrar datos productivos.
   108|- SIEMPRE para migraciones sin backup verificado.
   109|- SIEMPRE para cambiar RLS policies en producción.
   110|- SIEMPRE para activar workflows n8n productivos nuevos.
   111|- SIEMPRE para exponer o cambiar credenciales.
   112|
   113|## Relación con el harness
   114|
   115|| Documento | Relación |
   116||-----------|----------|
   117|| `AGENTS.md` | Define cómo opera este skill dentro de la fábrica |
   118|| `FACTORY_HARNESS_MASTER.md` | Alinea la revisión de seguridad con la filosofía del harness |
   119|| `harness/AGENT_RUNBOOK.md` | El runbook detalla el flujo de seguridad |
   120|| `harness/PERMISSIONS.md` | Lista maestra de operaciones permitidas/bloqueadas |
   121|| `harness/SENSORS.md` | Sensores que ya monitorean la seguridad activamente |
   122|| `harness/contracts/` | Los contratos definen permisos y límites de features |
   123|| `progress/tasks.json` | Las tareas pueden requerir revisión de seguridad |
   124|| `progress/memory/` | Decisiones de seguridad bloqueadas/aprobadas se registran aquí |
   125|
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
- Bloquear acciones criticas: migraciones, cambios RLS, auth, pagos, secrets.
- Verificar compliance con las 8 reglas CRITICO del CHECK_ANTI_CAOS.
- No permitir exposicion de secrets ni service_role_key.
