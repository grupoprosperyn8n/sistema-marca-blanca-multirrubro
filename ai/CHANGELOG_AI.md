     1|     1|## v2.9.1 — Fase 8.4+5: Auditoria y correccion de reglas anti-caos — 2026-05-31
     2|     2|
     3|     3|### Archivos modificados (6)
     4|     4|- AGENTS.md — reglas universales expandidas de 9 a 19 items con 8 nuevas
     5|     5|- FACTORY_HARNESS_MASTER.md — seccion 13 expandida de 14 a 20 reglas
     6|     6|- SENSORS.md — Sensor 13 Anti-Caos agregado; Sensor 2 y 4 con checks de direccion y loops
     7|     7|- RELEASE_CHECKLIST.md — apunta a progress/ en vez de ai/ + check features inexistentes
     8|     8|- VERIFICATION.md — checks de backup, secrets, direccion de sync, anti-loop
     9|     9|- CONTEXT.md — referencia a AGENTS.md como fuente de reglas anti-caos
    10|    10|
    11|    11|### Reglas agregadas (10 nuevas)
    12|    12|- R06: no modificar `.env` ni credenciales
    13|    13|- R10: no cambiar RLS/auth/pagos sin aprobacion
    14|    14|- R14: sincronizacion Airtable/Supabase con direccion clara
    15|    15|- R15: no crear loops Airtable ↔ Supabase ↔ n8n
    16|    16|- R17: no borrar datos reales
    17|    17|- R19: no construir UI sin UX brief
    18|    18|- R23: no documentar features inexistentes
    19|    19|- R24: no usar ai/TASKBOARD.md ni ai/DECISIONS.md como fuente principal
    20|    20|- R25: no copiar fabrica con cp -r
    21|    21|- R22 reforzada: resumen entendible para no-programador
    22|    22|
    23|    23|---
    24|    24|     1|     1|     1|     1|     1|# Changelog del Sistema IA
    25|    25|     2|     2|     2|     2|     2|
    26|    26|     3|     3|     3|     3|     3|## [0.1.0] — 2026-05-28
    27|    27|     4|     4|     4|     4|     4|
    28|    28|     5|     5|     5|     5|     5|### Añadido
    29|    29|     6|     6|     6|     6|     6|- Configuración inicial del workspace `erp-saas-aionui-workspace`
    30|    30|     7|     7|     7|     7|     7|- Creación de estructura de carpetas base
    31|    31|     8|     8|     8|     8|     8|- Archivos de equipo IA:
    32|    32|     9|     9|     9|     9|     9|  - `ai/TEAM_ROLES.md` — Roles y responsabilidades de agentes
    33|    33|    10|    10|    10|    10|    10|  - `ai/TASKBOARD.md` — Taskboard inicial con backlog, ready, blocked y done
    34|    34|    11|    11|    11|    11|    11|  - `ai/DECISIONS.md` — Registro de decisiones del proyecto
    35|    35|    12|    12|    12|    12|    12|  - `ai/CHANGELOG_AI.md` — Este archivo
    36|    36|    13|    13|    13|    13|    13|  - `ai/REVIEW_CHECKLIST.md` — Checklist de revisión de entregables
    37|    37|    14|    14|    14|    14|    14|- Contratos del Harness:
    38|    38|    15|    15|    15|    15|    15|  - `harness/contracts/PRODUCT_CONTRACT.md`
    39|    39|    16|    16|    16|    16|    16|  - `harness/contracts/MODULE_CONTRACT_TEMPLATE.md`
    40|    40|    17|    17|    17|    17|    17|  - `harness/contracts/SUPABASE_CONTRACT.md`
    41|    41|    18|    18|    18|    18|    18|  - `harness/contracts/AIRTABLE_CONTRACT.md`
    42|    42|    19|    19|    19|    19|    19|  - `harness/contracts/N8N_CONTRACT.md`
    43|    43|    20|    20|    20|    20|    20|  - `harness/contracts/UI_CONTRACT.md`
    44|    44|    21|    21|    21|    21|    21|- Guías del Harness:
    45|    45|    22|    22|    22|    22|    22|  - `harness/guides/HOW_TO_CREATE_PRD.md`
    46|    46|    23|    23|    23|    23|    23|  - `harness/guides/HOW_TO_DESIGN_MODULE.md`
    47|    47|    24|    24|    24|    24|    24|  - `harness/guides/HOW_TO_USE_SUPABASE.md`
    48|    48|    25|    25|    25|    25|    25|  - `harness/guides/HOW_TO_USE_AIRTABLE.md`
    49|    49|    26|    26|    26|    26|    26|  - `harness/guides/HOW_TO_USE_N8N.md`
    50|    50|    27|    27|    27|    27|    27|  - `harness/guides/HOW_TO_REVIEW_AGENT_OUTPUT.md`
    51|    51|    28|    28|    28|    28|    28|  - `harness/guides/HOW_TO_RELEASE_FEATURE.md`
    52|    52|    29|    29|    29|    29|    29|- Sensores del Harness:
    53|    53|    30|    30|    30|    30|    30|  - `harness/sensors/CHECK_SUPABASE_SECURITY.md`
    54|    54|    31|    31|    31|    31|    31|  - `harness/sensors/CHECK_AIRTABLE_SYNC.md`
    55|    55|    32|    32|    32|    32|    32|  - `harness/sensors/CHECK_N8N_WORKFLOW.md`
    56|    56|    33|    33|    33|    33|    33|  - `harness/sensors/CHECK_UI_FLOW.md`
    57|    57|    34|    34|    34|    34|    34|  - `harness/sensors/CHECK_BUSINESS_LOGIC.md`
    58|    58|    35|    35|    35|    35|    35|  - `harness/sensors/CHECK_DOCUMENTATION.md`
    59|    59|    36|    36|    36|    36|    36|- Templates del Harness:
    60|    60|    37|    37|    37|    37|    37|  - `harness/templates/FEATURE_BRIEF_TEMPLATE.md`
    61|    61|    38|    38|    38|    38|    38|  - `harness/templates/HUMAN_APPROVAL_TEMPLATE.md`
    62|    62|    39|    39|    39|    39|    39|  - `harness/templates/BUG_REPORT_TEMPLATE.md`
    63|    63|    40|    40|    40|    40|    40|  - `harness/templates/AGENT_TASK_TEMPLATE.md`
    64|    64|    41|    41|    41|    41|    41|  - `harness/templates/DONE_REPORT_TEMPLATE.md`
    65|    65|    42|    42|    42|    42|    42|
    66|    66|    43|    43|    43|    43|    43|## [2.0.0] — 2026-05-31 — Factory Harness v2 Upgrade
    67|    67|    44|    44|    44|    44|    44|
    68|    68|    45|    45|    45|    45|    45|### Añadido
    69|    69|    46|    46|    46|    46|    46|- **Sistema de memoria persistente:**
    70|    70|    47|    47|    47|    47|    47|  - `progress/tasks.json` — Task tracking estandarizado
    71|    71|    48|    48|    48|    48|    48|  - `progress/memory/decisions.md` — Decisiones del proyecto
    72|    72|    49|    49|    49|    49|    49|  - `progress/memory/bugs.md` — Bugs conocidos
    73|    73|    50|    50|    50|    50|    50|  - `progress/memory/preferences.md` — Preferencias del director
    74|    74|    51|    51|    51|    51|    51|  - `progress/memory/open-questions.md` — Preguntas abiertas
    75|    75|    52|    52|    52|    52|    52|- **Documentos maestros nuevos:**
    76|    76|    53|    53|    53|    53|    53|  - `FACTORY_HARNESS_MASTER.md` — Documento maestro completo
    77|    77|    54|    54|    54|    54|    54|  - `PROMPT_ARRANQUE.md` — 8 variantes de prompts
    78|    78|    55|    55|    55|    55|    55|  - `docs/AIONUI_MODE.md` — Modo AionUI/Hermes
    79|    79|    56|    56|    56|    56|    56|  - `docs/PORTABLE_MODE.md` — Modo portable universal
    80|    80|    57|    57|    57|    57|    57|- **Contratos nuevos:**
    81|    81|    58|    58|    58|    58|    58|  - `harness/contracts/FEATURE_CONTRACT_TEMPLATE.md`
    82|    82|    59|    59|    59|    59|    59|  - `harness/contracts/AI_AGENT_CONTRACT.md`
    83|    83|    60|    60|    60|    60|    60|  - `harness/contracts/INTEGRATION_CONTRACT.md`
    84|    84|    61|    61|    61|    61|    61|- **Guías prácticas:**
    85|    85|    62|    62|    62|    62|    62|  - `harness/guides/COMO_ENTREGAR_AVANCES.md`
    86|    86|    63|    63|    63|    63|    63|  - `harness/guides/COMO_PEDIR_APROBACION.md`
    87|    87|    64|    64|    64|    64|    64|- **Templates:**
    88|    88|    65|    65|    65|    65|    65|  - `harness/templates/RELEASE_NOTE_TEMPLATE.md`
    89|    89|    66|    66|    66|    66|    66|  - `harness/quick-start/cursor.md`
    90|    90|    67|    67|    67|    67|    67|- **Scripts:**
    91|    91|    68|    68|    68|    68|    68|  - `scripts/create-starter-pack.sh` — ZIP starter pack portable
    92|    92|    69|    69|    69|    69|    69|- **Config:**
    93|    93|    70|    70|    70|    70|    70|  - `config/supabase.env.example`, `airtable.env.example`, `n8n.env.example`
    94|    94|    71|    71|    71|    71|    71|- **Reglas anti-caos:** 14 reglas en PERMISSIONS.md
    95|    95|    72|    72|    72|    72|    72|
    96|    96|    73|    73|    73|    73|    73|### Modificado
    97|    97|    74|    74|    74|    74|    74|- `README.md` — Sección de versión 2.0
    98|    98|    75|    75|    75|    75|    75|- `START.md` — Prompt Cursor + referencia PROMPT_ARRANQUE.md
    99|    99|    76|    76|    76|    76|    76|- `harness/HARNESS.md` — Tabla de componentes actualizada
   100|   100|    77|    77|    77|    77|    77|- `harness/PERMISSIONS.md` — 14 reglas prohibidas
   101|   101|    78|    78|    78|    78|    78|- `.env.example` — Variables AGENT_NAME y FACTORY_HARNESS_VERSION
   102|   102|    79|    79|    79|    79|    79|
   103|   103|    80|    80|    80|    80|    80|### Pendiente (próximas fases)
   104|   104|    81|    81|    81|    81|    81|- `AGENTS.md` — Pendiente de revisión como entry point universal
   105|   105|    82|    82|    82|    82|    82|- `harness/AGENT_RUNBOOK.md` — Pendiente de actualización
   106|   106|    83|    83|    83|    83|    83|- `harness/CONTEXT.md` — Pendiente de actualización
   107|   107|    84|    84|    84|    84|    84|- `harness/init.sh` — Pendiente de revisión
   108|   108|    85|    85|    85|    85|    85|
   109|   109|    86|    86|    86|    86|    86|## [2.1.0] — 2026-06-02 — Fase 4: Entry Point Universal + Runbook + Contexto
   110|   110|    87|    87|    87|    87|    87|
   111|   111|    88|    88|    88|    88|    88|### Modificado
   112|   112|    89|    89|    89|    89|    89|- `AGENTS.md` — Rees...[truncated]
   113|   113|    90|    90|    90|    90|    90|test-line-1780201401
   114|   114|    91|    91|    91|    91|    91|
   115|   115|    92|    92|    92|    92|## [2.1.0] — 2026-06-02 — Fase 4: Entry Point Universal + Runbook + Contexto
   116|   116|    93|    93|    93|    93|
   117|   117|    94|    94|    94|    94|### Modificado
   118|   118|    95|    95|    95|    95|- `AGENTS.md` — Reescrito como entry point universal (147 lineas, max 200). Roles, jerarquia 10 pasos, 9 reglas anti-caos, aprobacion humana, formato de entrega, memoria.
   119|   119|    96|    96|    96|    96|- `harness/AGENT_RUNBOOK.md` — 5 patches: nota ACP excepcion temporal, Paso 2 con nuevos docs, Paso 3 con contratos, Paso 5 con tasks.json, Paso 8 con progress/, checklist expandido.
   120|   120|    97|    97|    97|    97|- `harness/CONTEXT.md` — Reescrito: jerarquia 13 pasos, tablas con docs nuevos, regla de contexto minimo.
   121|   121|    98|    98|    98|    98|- `README.md` — Inicio rapido con create-starter-pack.sh (no cp -r).
   122|   122|    99|    99|    99|    99|- `START.md` — Tips con starter pack en vez de copiar fabrica.
   123|   123|   100|   100|   100|   100|
   124|   124|   101|   101|   101|### Validado
   125|   125|   102|   102|   102|- `scripts/create-starter-pack.sh` — Probado con exito. ZIP de 91K, 59 archivos. Sin datos sensibles.
   126|   126|   103|   103|   103|- `dist/test-pack.zip` — 8/8 inclusiones OK, 8/8 exclusiones OK.
   127|   127|   104|   104|   104|
   128|   128|   105|   105|   105|### Corregido
   129|   129|   106|   106|   106|- `scripts/create-starter-pack.sh` — 2 bugs fixeados: (1) ahora incluye `scripts/` en el ZIP, (2) `.gitignore` ya no es filtrado por `-x "*.git*"`.
   130|   130|   107|   107|   107|
   131|   131|   108|   108|### Verificacion real (Fase 5.1)
   132|   132|   109|   109|- `test-pack.zip` probado en `/home/diegol/Documentos/test-proyecto-real/` — proyecto independiente.
   133|   133|   110|   110|- Simulacion de agente externo completada — flujo de arranque correcto.
   134|   134|   111|   111|- Exclusion zip corregida: `-x ".gitignore"` reemplazado por `-x "*/\.git/*"`.
   135|   135|   112|   112|- Sin dependencias del workspace original. Sin credenciales reales.
   136|   136|   113|   113|
   137|   137|   114|   114|
   138|   138|   115|### Auditoria init.sh (Fase 6)
   139|   139|   116|- `harness/init.sh` auditado: 511 lineas, 17.7KB, monolito sin funciones.
   140|   140|   117|- Corre sin errores (0/22 checks OK) pero desactualizado para Factory Harness v2.
   141|   141|   118|- Faltan: FACTORY_HARNESS_MASTER.md, PROMPT_ARRANQUE.md, progress/tasks.json, docs/, skills/, scripts/.
   142|   142|   119|- Checkea $HARNESS_DIR/progress/ en lugar de $ROOT_DIR/progress/.
   143|   143|   120|- 12 documentos legacy siguen siendo checkeados.
   144|   144|   121|- Propuesta de modularización entregada. Sin modificar aun.
   145|   145|   122|
   146|   146|   123|
   147|   147|   124|## v2.2.2 — Fase 6: Parche init.sh (Opción C) — 2026-05-31 01:45
   148|   148|   125|
   149|   149|   126|- Backup init.sh → init.sh.bak-factory-v2
   150|   150|   127|- Flag --first-run agregado
   151|   151|   128|- Checks v2 agregados (root, progress/ raíz, docs/, skills/, scripts/, config/)
   152|   152|   129|- 12 documentos legacy movidos a sección informativa (ℹ️)
   153|   153|   130|- --fix modificado: solo crea v2, no legacy v1
   154|   154|   131|- Prompts interactivos Engram/model-setup → solo --first-run
   155|   155|   132|- init.sh ejecutable y funcional con 0 errores
   156|   156|   133|
   157|   157|   134|## v2.2.3 — Fase 6.1: Revalidación starter pack — 2026-05-31 01:54
   158|   158|   135|
   159|   159|   136|- Verificado init.sh → 0 errores
   160|   160|   137|- create-starter-pack.sh: corregido (init.sh no estaba incluido)
   161|   161|   138|- Añadidas exclusiones *.bak, *.backup, *.old al zip
   162|   162|   139|- Añadidos sensors/, harness/progress/, harness/scripts/ al ZIP
   163|   163|   140|- Starter pack: 105 archivos, 244KB, sin residuos
   164|   164|   141|- Descomprimido y probado en /tmp: funcional
   165|   165|   142|
   166|   166|   143|## v2.2.4 — Fase 6.2: Modo Starter Pack en init.sh — 2026-05-31 01:59
   167|   167|   144|
   168|   168|   145|- Añadida detección STARTER_PACK_MODE en init.sh
   169|   169|   146|- Detección: existen v2 files clave + NO existe .env
   170|   170|   147|- 3 scripts de entorno (stack-setup, model-setup, deploy-surge) pasan a ⚠️ warning en modo starter pack
   171|   171|   148|- Mensaje final bifurcado: "Starter pack válido" vs "Proyecto en buen estado"
   172|   172|   149|- init.sh sigue siendo ❌ error crítico siempre
   173|   173|   150|- Test workspace original → ✅ exit 0
   174|   174|   151|- Test starter pack /tmp → ✅ exit 0
   175|   175|   152|
   176|   176|   153|## v2.3.0 — Fase 7.1: Auditoría de Skills — 2026-05-31 02:15
   177|   177|   154|
   178|   178|   155|- Auditadas 13 skills existentes contra 15 criterios de completitud
   179|   179|   156|- Puntaje promedio: 13.3/30 — todas INCOMPLETAS o ACEPTABLE
   180|   180|   157|- Problema #1 común: NINGUNA skill referencia documentos del harness
   181|   181|   158|- Problema #2 común: sin triggers de activación ni condiciones de exclusión
   182|   182|   159|- Problema #3 común: sin checklist de salida ni inputs formales
   183|   183|   160|- Mejor evaluada: harness-engineer (22.5/30 — ACEPTABLE)
   184|   184|   161|- Peor evaluada: documentation-generator (9/30 — INCOMPLETA)
   185|   185|   162|- Plantilla estándar propuesta: 5 secciones obligatorias + 3 opcionales
   186|   186|   163|- Orden de mejora priorizado documentado en reporte F7.1
   187|   187|   164|
   188|   188|   165|## v2.4.0 — Fase 7.2: Mejora de 5 Skills Prioritarias — 2026-05-31 02:45
   189|   189|   166|
   190|   190|   167|### Skills reescritas con plantilla unificada
   191|   191|   168|
   192|   192|   169|- Plantilla de 16 secciones: nombre, propósito, triggers, exclusiones, responsabilidades (5-11 items), archivos lectura/modificación/prohibidos, stack, inputs, flujo paso a paso (7 pasos), output, checklist (5-10 items), riesgos (3-4 con mitigación), aprobación humana, tabla relación 8 docs harness
   193|   193|   170|- **prompt-product-manager:** 30 → 115 líneas. Triggers, exclusiones, flujo 7 pasos, 3 riesgos, 5 checklists
   194|   194|   171|- **feature-contract-writer:** 29 → 121 líneas. 10 responsabilidades, 8 secciones de contrato, 10 checklists
   195|   195|   172|- **agent-safety-reviewer:** 39 → 124 líneas. Clasificación CRÍTICO/ALTO/MEDIO/BAJO, no modifica archivos, 4 riesgos
   196|   196|   173|- **harness-engineer:** 35 → 133 líneas. 7 triggers de activación, 7 grupos de archivos modificables, 4 riesgos
   197|   197|   174|- **documentation-generator:** 33 → 132 líneas. 6 triggers, 4 riesgos (incluye exponer secretos), 6 checklists
   198|   198|   175|- **No modificadas:** 8 skills restantes (pendientes Fase 7.3)
   199|   199|   176|
   200|   200|   177|
   201|   201|   178|## v2.5.0 — Fase 7.3: Mejora de 4 Skills (Segundo Grupo ERP y No-Code) — 2026-05-31
   202|   202|   179|
   203|   203|   180|### Skills reescritas con plantilla unificada (16 secciones)
   204|   204|   181|
   205|   205|   182|- **erp-module-designer:** 54 → 148 líneas. Diseño de módulos con entidades, permisos, pantallas, flujos, reportes, automatizaciones. Contrato de módulo obligatorio. MVP vs avanzado.
   206|   206|   183|- **no-code-translator:** 31 → 137 líneas. Traducción lenguaje natural a especificaciones. Tabla decisión tecnología (Supabase/Airtable/n8n/Frontend). Español simple con opciones y recomendación concreta.
   207|   207|   184|- **supabase-architect:** 50 → 159 líneas. Schema, migraciones rollback, RLS por rol, multi-tenant, storage, edge functions. Prohibición service_role_key en frontend. Checklist seguridad obligatorio.
   208|   208|   185|- **airtable-operator:** 42 → 149 líneas. Diseño bases/vistas/interfaces, mapa Airtable↔Supabase, reglas sincronización. Airtable NO es fuente principal si Supabase existe.
   209|   209|   186|
   210|   210|   187|### Flujo entre skills
   211|   211|   188|
   212|   212|   189|no-code-translator → erp-module-designer → supabase-architect → airtable-operator
   213|   213|   190|
   214|   214|   191|### No modificadas
   215|   215|   192|
   216|   216|   193|n8n-automation-builder, saas-product-builder, database-security-auditor, workflow-verifier (Fase 7.4)
   217|   217|   194|
   218|   218|   195|
   219|   219|   196|## v2.6.0 - Fase 7.4: Mejora de 4 Skills Restantes (Automatizacion y Seguridad) - 2026-05-31
   220|   220|   197|
   221|   221|   198|### Skills reescritas con plantilla unificada (16 secciones)
   222|   222|   199|- **n8n-automation-builder:** 49 -> 155 lineas. Workflows seguros con manejo de errores, credenciales por variables, export JSON, documentacion.
   223|   223|   200|- **saas-product-builder:** 40 -> 155 lineas. ICP, MVP estricto, pricing, onboarding, validacion previa. Regla: no inflar el MVP.
   224|   224|   201|- **database-security-auditor:** 36 -> 158 lineas. RLS, policies, multi-tenant, backups, entornos. Regla: bloquear cambios inseguros.
   225|   225|   202|- **workflow-verifier:** 35 -> 153 lineas. Validacion de logica, payloads, loops, idempotencia. Regla: no activar sin verificacion y aprobacion.
   226|   226|   203|
   227|   227|   204|### Flujo entre skills F7.4
   228|   228|   205|saas-product-builder -> n8n-automation-builder -> workflow-verifier -> database-security-auditor
   229|   229|   206|
   230|   230|   207|### Resultado Fase 7
   231|   231|   208|**Todas las 13 skills de la fabrica estandarizadas con la plantilla unificada de 16 secciones.**
   232|   232|   209|
   233|   233|   210|Pendiente: Fase 8 - Auditoria y mejora de configuracion MCP ✅ COMPLETADA
   234|   234|   211|
   235|   235|   212|---
   236|   236|   213|
   237|   237|   214|## v2.9.0 - Fase 8.3: Armonizacion contextos ai/progress/permisos - 2026-05-31
   238|   238|   215|
   239|   239|   216|### Archivos modificados (6)
   240|   240|   217|- AGENTS.md — seccion "Fuentes de verdad actual" con jerarquia oficial
   241|   241|   218|- FACTORY_HARNESS_MASTER.md — seccion 3.1 "Fuentes de verdad" + tabla memoria marcada legacy
   242|   242|   219|- harness/CONTEXT.md — jerarquia reordenada (progress/ primero, ai/ ultimo legacy)
   243|   243|   220|- harness/AGENT_RUNBOOK.md — Paso 2 con 5 fuentes principales explicitas + legacy note
   244|   244|   221|- config/permissions.md — convertido a resumen operativo apuntando a harness/PERMISSIONS.md
   245|   245|   222|- .env.example — separado en PUBLIC FRONTEND-SAFE y BACKEND ONLY con advertencias fuertes
   246|   246|   223|
   247|   247|   224|### Validacion
   248|   248|   225|- ✅ bash harness/init.sh
   249|   249|   226|- ✅ No hay referencias activas a ai/ como fuente principal en documentos clave
   250|   250|   227|- ✅ SUPABASE_SERVICE_ROLE_KEY en seccion BACKEND ONLY con advertencia
   251|   251|   228|
   252|   252|   229|### Registros
   253|   253|   230|- progress/logs/2026-05-31-fase-8-3-armonizacion-contextos.md
   254|   254|   231|
   255|   255|   232|---
   256|   256|   233|
   257|   257|   234|## v2.8.0 - Fase 8.2: Correcciones de configuracion MCP, Agentes, Permisos y Variables - 2026-05-31
   258|   258|   235|
   259|   259|   236|### Archivos modificados (10)
   260|   260|   237|- .env.example — advertencias de seguridad en secrets
   261|   261|   238|- config/supabase.env.example — naming unificado + tabla legacy
   262|   262|   239|- config/airtable.env.example — AIRTABLE_TOKEN → AIRTABLE_API_KEY + legacy
   263|   263|   240|- config/n8n.env.example — N8N_BASE_URL unificado + eliminar interpolaciones
   264|   264|   241|- config/environment.md — reescrito con 19 variables + tabla legacy
   265|   265|   242|- config/mcp-plan.json — naming unificado + env_vars a sensores
   266|   266|   243|- FACTORY_HARNESS_MASTER.md — permisos produccion corregidos
   267|   267|   244|- harness/PERMISSIONS.md — pipes rotos reparados
   268|   268|   245|- config/agents.yaml — cannot_touch agregado a 5 agentes
   269|   269|   246|- harness/AGENT_RUNBOOK.md — paths v1 reemplazados
   270|   270|   247|- harness/SKILL_REGISTRY.md — 13 skills estandar + mapeo legacy
   271|   271|   248|
   272|   272|   249|### Validacion
   273|   273|   250|✅ bash harness/init.sh — todos los checks pasaron
   274|   274|   251|✅ Sin referencias a paths v1 en AGENT_RUNBOOK.md
   275|   275|   252|✅ 13 skills correctamente listadas en SKILL_REGISTRY.md
   276|   276|   253|✅ Nombres de variables unificados en todos los archivos
   277|   277|   254|
   278|   278|   255|### Pendiente
   279|   279|   256|- Revisar config/permissions.md (duplicado parcial con harness/PERMISSIONS.md)
   280|   280|   257|
   281|   281|   258|### Archivos auditados (14)
   282|   282|   259|- config/mcp-plan.json, config/agents.yaml, config/permissions.md, config/environment.md
   283|   283|   260|- .env.example, config/supabase/airtable/n8n.env.example
   284|   284|   261|- harness/PERMISSIONS.md, harness/AGENT_RUNBOOK.md, harness/SKILL_REGISTRY.md
   285|   285|   262|- AGENTS.md, FACTORY_HARNESS_MASTER.md
   286|   286|   263|
   287|   287|   264|### Hallazgos principales
   288|   288|   265|| Prioridad | Cantidad | Detalle |
   289|   289|   266||:---------:|:--------:|---------|
   290|   290|   267|| 🔴 ALTO | 4 | Naming inconsistente de variables (SUPABASE_URL vs NEXT_PUBLIC_SUPABASE_URL, AIRTABLE_API_KEY vs AIRTABLE_TOKEN, N8N_BASE_URL vs N8N_URL). Service role key sin advertencia explicita. |
   291|   291|   268|| 🟡 MEDIO | 8 | Paths legacy (referencias a ai/DECISIONS.md, ai/TASKBOARD.md). Agentes no alineados con 13 skills. Formato pipes en harness/PERMISSIONS.md. Sin cannot_touch en 4 agentes. |
   292|   292|   269|| 🟢 BAJO | 5 | Placeholders vacios, documentacion incompleta, env.example faltantes por servicio. |
   293|   293|   270|
   294|   294|   271|### Sin modificar archivos - diagnostico puro
   295|   295|   272|### Pendiente: Fase 8.2 - Correcciones prioritarias
   296|   296|   273|## v2.9.2 — Fase 8.6: CHECK_ANTI_CAOS sensor + reglas en 13 skills — 2026-05-31
   297|
   298|### Archivos creados (1)
   299|- harness/sensors/CHECK_ANTI_CAOS.md — 25 checks (8 CRITICO, 11 ALTO, 4 MEDIO, 2 BAJO)
   300|
   301|### Skills actualizadas (13)
   302|- Todas con seccion "Reglas anti-caos aplicables" + reglas especificas por dominio
   303|
   304|### Validacion
   305|- `bash harness/init.sh` -> OK (13 sensores detectados)
   306|- Starter pack test-pack-anti-caos -> OK (111 archivos, sin sensibles)
   307|- init.sh en extracted pack -> OK
   308|## v2.9.3 — [FINAL] Fase 8.7 + Fase 9: Integracion anti-caos y cierre Factory Harness v2 — 2026-05-31

### Archivos modificados (5)
- harness/AGENT_RUNBOOK.md — Paso 7: CHECK_ANTI_CAOS como primer sensor obligatorio
- README.md — Seccion "Entrega" con referencia anti-caos
- START.md — Seccion "Entrega" con referencia anti-caos
- progress/tasks.json — Fase completada, T-009 agregada
- scripts/create-starter-pack.sh — Incluye START.md

### Version final
Factory Harness v2 cerrada. ZIP: dist/factory-harness-v2-final.zip (176K, 108 entradas, 13 sensores, 13 skills)

## v2.9.4 — [DEPLOY] Deploy final a Surge + starter pack validado — 2026-06-01

### Deploy
- index.html sincronizado desde MANUAL_HARNESS.html
- dist/factory-harness-v2-final.zip regenerado (402KB, 107 archivos)
- Deploy a https://manual-harness.surge.sh/ — HTTP 200 verificado
- CNAME agregado al repo

### Commits
- 564a7d2 — Fase 8.7 + 9 (anti-caos, 55 archivos)
- dfae193 — Deploy final (+ CNAME + index sync, 2 archivos)

### Validacion
- init.sh → exit 0 (workspace + ZIP extraido en /tmp)
- Surge deploy: 200 OK, 270KB, todas las features funcionando
- Falso negativo de Surge: el deploy realmente funciona aunque reporte error

### Decision registrada
- Tokens reales en HTML publico: riesgo aceptado por Diego. Migracion futura a proxy n8n.

## v3.7.0 — [STABLE] Factory Harness v3.7.0 estable candidata — 2026-06-12

### Incluye
- Manual web operativo (MANUAL_HARNESS.html + index.html → manual-harness.surge.sh)
- Exportacion de proyectos desde manual (MANUAL_EXPORT_MODE)
- Instalacion de Factory Harness en raiz (init.sh + starter pack + rsync)
- PROYECTO.md como contexto de negocio
- CREDENCIALES.md como archivo local sensible autorizado
- inicio-rapido/ con prompts por tarea (8 variantes)
- progress/session-summary.md para reducir tokens (~65 lineas)
- CHECK_ANTI_CAOS.md integrado (25 checks clasificados)
- Starter pack final regenerado y validado (164K, init.sh OK)
- Modo Mantenimiento documentado en harness/guides/FACTORY_MAINTENANCE.md

### Archivos modificados (23)
- 21 archivos en v3.7.0 (session-summary.md, init.sh, AGENTS.md, FACTORY_HARNESS_MASTER.md, PROMPT_ARRANQUE.md, README.md, START.md, MANUAL_HARNESS.html, index.html, PERMISSIONS.md, CONTEXT.md, AGENT_RUNBOOK.md, CHECK_ANTI_CAOS.md, 8 prompts inicio-rapido/)
- 2 archivos en cierre estable: decisions.md, CHANGELOG_AI.md

### Nuevos
- progress/session-summary.md
- harness/guides/FACTORY_MAINTENANCE.md
- skills/harness-engineer/SKILL.md (seccion Modo Mantenimiento de Fabrica)

### Comentarios
- v3.7.0 declarada version estable candidata
- Modo de mantenimiento documentado para futuras correcciones
- Skills no se modifican sin necesidad (reusar harness-engineer)

## v3.7.1 (2026-06-12) — Fix: session-summary en starter pack + msg model-setup
- `scripts/create-starter-pack.sh`: incluye `progress/session-summary.md` y `progress/logs/.gitkeep`
- `harness/init.sh`: en MANUAL_EXPORT_MODE no sugiere ejecutar model-setup.sh si no existe

## v3.7.2 (2026-06-12) — Fix: limpiar mensaje final model routing en MANUAL_EXPORT_MODE
- `harness/init.sh`: el bloque final (línea 790) ahora respeta MANUAL_EXPORT_MODE
- Muestra mensaje informativo sin sugerir `bash harness/model-setup.sh`

## v3.7.2 (2026-06-12) — [STABLE] Factory Harness v3.7.2 Stable — cierre final
- Flujo completo validado: Manual web → exportar → Factory en raíz → MANUAL_EXPORT_MODE
- session-summary.md y progress/logs/ en starter pack
- model routing limpio en MANUAL_EXPORT_MODE
- Manual web actualizado con estado estable
- Deploy a manual-harness.surge.sh
- v3.7.2 declarada Stable. Próximo paso: proyecto real chico


### 2026-06-01 — Limpieza de fábrica: archivo vacío eliminado
- **Eliminado:** `GPT_SYSTEM_INSTRUCTIONS_FULL.md` de la raíz de la fábrica (0 bytes, archivo vacío remanente).
- **Confirmado:** El paquete GPT externo completo está en `~/Documentos/factory-harness-copilot-gpt/` (11 archivos, 60K).
- **Sin impacto:** El starter pack no referenciaba este archivo. No se tocaron secretos.


## 2026-06-01 20:26 -- T-021: Validacion post-limpieza y starter pack

### Verificacion
- init.sh fabrica: OK 0 errores
- Starter pack: 168K, dist/harness-pack-v2.zip
- init.sh starter temporal: OK 'Starter pack valido'

### Inclusiones
agent-brief.md (31 lineas), session-summary.md, tasks.json, memory/, AGENTS.md, harness/, skills/, config/, docs/

### Exclusiones
gpt-factory-copilot/, factory-harness-copilot-gpt/, .env real, CREDENCIALES.md, tokens/keys -- todo excluido.
