     1|# Skill: n8n Automation Builder
     2|
     3|## 1. Propósito
     4|
     5|Diseñar, documentar y preparar workflows n8n seguros para automatizar procesos ERP y SaaS, con manejo de errores obligatorio, credenciales por variables de entorno, webhooks documentados y aprobación humana antes de activar workflows productivos.
     6|
     7|## 2. Cuándo se activa
     8|
     9|- Un módulo ERP necesita automatización entre sistemas (Supabase → Airtable, Airtable → Supabase, API externa)
    10|- Una tarea en `progress/tasks.json` tiene fase `automation` o `n8n`
    11|- Se necesita sincronización Airtable ↔ Supabase
    12|- Se necesita enviar notificaciones (email, WhatsApp, Telegram)
    13|- Se necesita un webhook para recibir datos de un formulario o API externa
    14|- El `erp-module-designer` define automatizaciones en el contrato del módulo
    15|- Se necesita generar reportes periódicos automatizados
    16|
    17|## 3. Cuándo NO se activa
    18|
    19|- Para procesos que se resuelven dentro de Supabase (triggers, funciones SQL — ahí actúa `supabase-architect`)
    20|- Para automatizaciones 100% dentro de Airtable (usar automatizaciones nativas de Airtable)
    21|- Para tareas que requieren lógica en frontend (compete a UI/UX)
    22|- Cuando no hay contrato de módulo o feature aprobado
    23|- Cuando el workflow no tiene manejo de errores definido
    24|- Cuando se pide activar un workflow en producción sin aprobación humana
    25|
    26|## 4. Responsabilidades
    27|
    28|1. Diseñar workflows n8n completos (trigger + transformación + acción + error).
    29|2. Crear webhooks seguros con secret o validación.
    30|3. Conectar Supabase, Airtable, email, WhatsApp, Telegram, Stripe, Google Sheets y otras APIs.
    31|4. Documentar payloads de entrada y salida de cada webhook.
    32|5. Definir manejo de errores obligatorio en cada workflow (try/catch, retry, fallback).
    33|6. Definir logs de ejecución y alertas ante fallos.
    34|7. Usar variables de entorno para TODAS las credenciales (nunca hardcodeadas).
    35|8. Exportar workflows en JSON guardados en `n8n/workflow-exports/`.
    36|9. Documentar cada workflow en `n8n/workflow-docs/` o `docs/N8N_SETUP.md`.
    37|10. Prevenir loops infinitos Airtable ↔ Supabase ↔ n8n con condiciones de guarda.
    38|11. Crear payloads de prueba para testear cada workflow antes de activar.
    39|
    40|## 5. Archivos que puede leer
    41|
    42|- `harness/contracts/` — contratos de módulos para entender qué automatizar
    43|- `docs/N8N_SETUP.md` — documentación actual de n8n
    44|- `docs/SUPABASE_SETUP.md` — esquema Supabase actual para conexiones
    45|- `docs/AIRTABLE_SETUP.md` — esquema Airtable actual para conexiones
    46|- `config/n8n.env.example` — variables de entorno de ejemplo
    47|- `harness/templates/MODULE_CONTRACT_TEMPLATE.md`
    48|
    49|## 6. Archivos que puede modificar
    50|
    51|- `docs/N8N_SETUP.md` — documentación de setup y workflows
    52|- `n8n/workflow-docs/` — documentación individual de cada workflow
    53|- `n8n/workflow-exports/` — archivos JSON exportados de n8n
    54|- `progress/memory/decisions.md` — decisiones de diseño de automatizaciones
    55|- `progress/tasks.json` — tareas técnicas de automatización
    56|
    57|## 7. Archivos que NO puede tocar
    58|
    59|- `.env` o cualquier archivo con credenciales reales
    60|- Producción (workflows n8n activos sin aprobación)
    61|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    62|- `harness/init.sh`
    63|- Código en `src/` o `app/`
    64|- Skills de otros agentes
    65|- El monolito legacy
    66|- Bases de datos reales (Supabase o Airtable)
    67|
    68|## 8. Herramientas / Stack relacionado
    69|
    70|- n8n Dashboard (editor de workflows, testeo, activación)
    71|- n8n API (para exportar/importar workflows)
    72|- `harness/sensors/CHECK_WORKFLOW_SECURITY.md` — checklist post-diseño
    73|- `workflow-verifier` — verificará el workflow antes de activarlo
    74|- `harness/contracts/N8N_CONTRACT.md` — contrato específico de n8n
    75|- Supabase y Airtable (origen/destino de datos)
    76|- WhatsApp Business API, Telegram Bot API, SMTP (notificaciones)
    77|
    78|## 9. Inputs mínimos necesarios
    79|
    80|1. ¿Qué proceso se va a automatizar?
    81|2. ¿Cuál es el trigger del workflow? (webhook, schedule, evento en BD, formulario)
    82|3. ¿Qué sistemas conecta? (Supabase, Airtable, API externa, email, etc.)
    83|4. ¿Qué datos fluyen? (payload de entrada, transformación, payload de salida)
    84|5. ¿Qué pasa si falla? (manejo de errores requerido)
    85|6. ¿Con qué frecuencia se ejecuta? (tiempo real, cada hora, diario)
    86|7. ¿Quién o qué consume el resultado?
    87|
    88|## 10. Flujo operativo paso a paso
    89|
    90|```
    91|Paso 1: Leer contrato del módulo o feature que requiere automatización
    92|Paso 2: Identificar trigger, conexiones, datos y errores
    93|Paso 3: Diseñar workflow en n8n (o en papel si no hay acceso)
    94|Paso 4: Definir manejo de errores (try/catch, retry, notificación)
    95|Paso 5: Usar variables de entorno para TODAS las credenciales
    96|Paso 6: Crear payloads de prueba
    97|Paso 7: Documentar workflow en docs/N8N_SETUP.md o n8n/workflow-docs/
    98|Paso 8: Exportar workflow JSON a n8n/workflow-exports/
    99|Paso 9: Verificar con workflow-verifier
   100|Paso 10: Registrar decisiones en progress/memory/decisions.md
   101|Paso 11: Solicitar aprobación humana antes de activar en producción
   102|```
   103|
   104|## 11. Output esperado
   105|
   106|- Diseño del workflow (descripción + diagrama de flujo)
   107|- JSON exportable del workflow en `n8n/workflow-exports/`
   108|- Documentación en `n8n/workflow-docs/` o `docs/N8N_SETUP.md`
   109|- Payloads de prueba (entrada y salida esperada)
   110|- Lista de variables de entorno necesarias (sin valores reales)
   111|- Checklist de seguridad verificado
   112|- Decisiones registradas en `progress/memory/`
   113|
   114|## 12. Checklist de salida
   115|
   116|- [ ] ¿Workflow diseñado completo (trigger → transformación → acción → error)?
   117|- [ ] ¿Manejo de errores definido (try/catch, retry, notificación)?
   118|- [ ] ¿Variables de entorno para todas las credenciales?
   119|- [ ] ¿Webhook tiene secret o validación?
   120|- [ ] ¿Payloads de prueba creados?
   121|- [ ] ¿Workflow exportado a JSON?
   122|- [ ] ¿Documentación escrita?
   123|- [ ] ¿Evitado loop infinito Airtable ↔ Supabase ↔ n8n?
   124|- [ ] ¿Verificado por workflow-verifier?
   125|- [ ] ¿Aprobación humana obtenida antes de activar?
   126|
   127|## 13. Riesgos
   128|
   129|| Riesgo | Impacto | Mitigación |
   130||--------|---------|------------|
   131|| Loop infinito Airtable ↔ Supabase ↔ n8n | Crítico | Condición de guarda en cada workflow: "solo si cambió campo X" |
   132|| Credenciales hardcodeadas en workflow | Crítico | Regla: 100% variables de entorno, nunca texto plano |
   133|| Workflow productivo activado sin pruebas | Alto | workflow-verifier + aprobación humana obligatoria |
   134|| Webhook sin secret expuesto públicamente | Alto | Todo webhook debe tener secret o IP whitelist |
   135|| Sin manejo de errores → datos perdidos o duplicados | Alto | Manejo de errores obligatorio en cada workflow |
   136|
   137|## 14. Cuándo pedir aprobación humana
   138|
   139|- **Siempre** antes de activar un workflow en producción
   140|- **Siempre** si el workflow modifica datos críticos (facturación, clientes, stock)
   141|- **Siempre** si el workflow envía notificaciones a clientes reales
   142|- **Siempre** si es una sincronización bidireccional Airtable ↔ Supabase
   143|- En caso de duda, preguntar
   144|
   145|## 15. Relación con el Harness
   146|
   147|| Documento | Cómo se relaciona |
   148||-----------|-------------------|
   149|| `AGENTS.md` | Los agentes invocan esta skill cuando un módulo requiere automatización |
   150|| `FACTORY_HARNESS_MASTER.md` | Las automatizaciones siguen la arquitectura definida en el master |
   151|| `harness/AGENT_RUNBOOK.md` | El diseño de automatización es fase posterior a módulo y contrato |
   152|| `harness/PERMISSIONS.md` | No activar workflows sin aprobación — regla anti-caos |
   153|| `harness/SENSORS.md` | Los sensores validan credenciales, errores y loops antes de activar |
   154|| `harness/contracts/` | El contrato del módulo define qué automatizaciones necesita |
   155|| `progress/tasks.json` | Crea tareas de diseño, testeo y documentación de workflows |
   156|| `progress/memory/` | Registra decisiones de diseño de automatizaciones |
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
- No activar workflows n8n productivos sin aprobacion.
- Webhooks siempre con secret configurado.
- Manejo de errores obligatorio en toda automatizacion.
- No crear loops Airtable ↔ Supabase ↔ n8n.
- Verificar modo dry-run antes de activar en produccion.
