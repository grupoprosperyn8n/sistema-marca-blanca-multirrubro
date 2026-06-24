     1|# Skill: No-Code Translator
     2|
     3|## 1. Propósito
     4|
     5|Traducir pedidos de negocio de Diego (usuario no programador) a especificaciones técnicas claras para agentes de código, manteniendo a Diego como director del producto y tomando decisiones concretas sobre qué tecnología usar.
     6|
     7|## 2. Cuándo se activa
     8|
     9|- Diego dice "quiero hacer [algo]" o "necesito un [sistema/herramienta/módulo]"
    10|- Diego describe un problema de negocio en lenguaje natural
    11|- Una tarea en `progress/tasks.json` tiene fase `definition` o `requirement`
    12|- Se necesita decidir entre Supabase, Airtable o n8n para resolver algo
    13|- Un agente no entiende el pedido original de Diego
    14|
    15|## 3. Cuándo NO se activa
    16|
    17|- Cuando ya hay especificación técnica lista (ahí actúa `erp-module-designer` o `feature-contract-writer`)
    18|- Cuando el pedido es técnico detallado (ej. "crear tabla X con campo Y")
    19|- Para debugging de código existente
    20|- Para tareas de mantenimiento ya documentadas
    21|- Cuando el usuario es otro agente (no Diego)
    22|
    23|## 4. Responsabilidades
    24|
    25|1. Escuchar el problema de negocio en lenguaje natural.
    26|2. Traducir a especificación clara para agentes.
    27|3. Decidir qué tecnología usar según el tipo de dato o proceso.
    28|4. Explicar cada decisión en español simple con beneficio de negocio.
    29|5. Ofrecer al menos 2 opciones cuando haya alternativa técnica.
    30|6. Recomendar una opción concreta (no dejar indeciso al usuario).
    31|7. Separar lo urgente de lo importante (MVP vs después).
    32|8. Crear resumen para aprobación humana antes de pasar a diseño.
    33|9. Alimentar al `erp-module-designer` si el pedido requiere un módulo nuevo.
    34|
    35|## 5. Archivos que puede leer
    36|
    37|- `skill/no-code-translator/` — su propia configuración
    38|- `progress/tasks.json` — tareas existentes para no duplicar
    39|- `progress/memory/preferences.md` — preferencias de Diego
    40|- `docs/MODULES.md` — módulos existentes
    41|- `docs/SUPABASE_SETUP.md` — arquitectura Supabase actual
    42|- `docs/AIRTABLE_SETUP.md` — arquitectura Airtable actual
    43|- `harness/contracts/` — contratos existentes
    44|
    45|## 6. Archivos que puede modificar
    46|
    47|- `progress/memory/decisions.md` — registrar decisiones de tecnología y alcance
    48|- `progress/memory/open-questions.md` — preguntas pendientes para Diego
    49|- `progress/tasks.json` — crear tareas de definición/requerimiento
    50|
    51|## 7. Archivos que NO puede tocar
    52|
    53|- Cualquier archivo con código (`src/`, `app/`, `supabase/`)
    54|- Bases de datos reales
    55|- `.env` o credenciales
    56|- `harness/PERMISSIONS.md`, `harness/SENSORS.md` o `harness/init.sh`
    57|- Contratos en `harness/contracts/` (eso es tarea de `erp-module-designer`)
    58|- Skills de otros agentes
    59|- El monolito legacy
    60|
    61|## 8. Herramientas / Stack relacionado
    62|
    63|| Tecnología | Cuándo usar | Cuándo NO usar |
    64||-----------|-------------|----------------|
    65|| **Supabase** | Datos críticos, relaciones complejas, multi-tenant, auth, RLS necesario | Prototipos de 1 semana, datos que cambian constantemente sin estructura fija |
    66|| **Airtable** | Backoffice no-code, CRM liviano, carga de datos por personal no técnico, MVP rápido | Datos sensibles, alto volumen (>50K registros), transacciones críticas |
    67|| **n8n** | Automatización entre sistemas, sincronización Airtable↔Supabase, notificaciones, workflows | Una sola llamada API simple, proceso 100% dentro de Supabase |
    68|| **Frontend** | Usuario final necesita interfaz, app pública, dashboard interactivo | Solo administración interna (usar Airtable o Supabase Studio) |
    69|
    70|## 9. Inputs mínimos necesarios
    71|
    72|1. ¿Qué problema querés resolver? (en tus palabras, sin tecnicismos)
    73|2. ¿Quién va a usar esto? (vos solo, tu equipo, clientes, público)
    74|3. ¿Qué tan urgente es? (lo necesito hoy, esta semana, este mes)
    75|4. ¿Ya tenés algo funcionando? (Excel, Google Sheets, papel, nada)
    76|5. ¿Es para un proyecto nuevo o para agregar a algo existente?
    77|
    78|## 10. Flujo operativo paso a paso
    79|
    80|```
    81|Paso 1: Escuchar el pedido en lenguaje natural
    82|Paso 2: Identificar la necesidad real (no siempre es lo que parece)
    83|Paso 3: Decidir tecnología base (Supabase / Airtable / n8n / Frontend)
    84|Paso 4: Explicar la decisión en español simple
    85|Paso 5: Preguntar inputs mínimos si faltan
    86|Paso 6: Ofrecer opciones (2 mínimo) y recomendar una
    87|Paso 7: Si no hay dudas, pasar al erp-module-designer o feature-contract-writer
    88|Paso 8: Registrar decisión en progress/memory/decisions.md
    89|Paso 9: Dejar resumen para que Diego apruebe antes de construir
    90|```
    91|
    92|## 11. Output esperado
    93|
    94|- Resumen en español simple con decisión tomada
    95|- Recomendación de tecnología con justificación
    96|- Tareas de definición en `progress/tasks.json`
    97|- Registro de decisión en `progress/memory/decisions.md`
    98|- (Opcional) Especificación lista para `erp-module-designer`
    99|
   100|## 12. Checklist de salida
   101|
   102|- [ ] ¿Entendí correctamente el problema de Diego?
   103|- [ ] ¿Decidí qué tecnología usar con justificación?
   104|- [ ] ¿Expliqué en español simple sin tecnicismos?
   105|- [ ] ¿Ofrecí al menos 2 opciones?
   106|- [ ] ¿Recomendé una opción concreta?
   107|- [ ] ¿Especificación lista para el próximo agente?
   108|- [ ] ¿Decisión registrada en `progress/memory/`?
   109|- [ ] ¿Diego aprobó o necesita aprobación?
   110|
   111|## 13. Riesgos
   112|
   113|| Riesgo | Impacto | Mitigación |
   114||--------|---------|------------|
   115|| Malinterpretar el pedido | Alto | Repreguntar confirmando "entendí que querés [X]. ¿Es correcto?" |
   116|| Recomendar tecnología incorrecta | Alto | Usar la tabla de decisión del stack; si hay duda, preguntar a Diego |
   117|| Scope creep (Diego pide más de lo necesario) | Medio | Separar MVP estricto; lo demás va a "versión futura" |
   118|| Saltar directamente a implementación sin aprobación | Alto | Nunca pasar a diseño sin resumen aprobado por Diego |
   119|
   120|## 14. Cuándo pedir aprobación humana
   121|
   122|- **Siempre** antes de avanzar a diseño o implementación
   123|- **Siempre** si la recomendación implica cambiar de tecnología (ej. migrar de Airtable a Supabase)
   124|- **Siempre** si el costo estimado supera lo que Diego espera
   125|- Cuando no estés seguro de haber entendido bien
   126|
   127|## 15. Relación con el Harness
   128|
   129|| Documento | Cómo se relaciona |
   130||-----------|-------------------|
   131|| `AGENTS.md` | Esta skill es el primer filtro para pedidos de Diego |
   132|| `FACTORY_HARNESS_MASTER.md` | Las decisiones de tecnología siguen la arquitectura del master |
   133|| `harness/AGENT_RUNBOOK.md` | El runbook define que primero va definición, después diseño |
   134|| `harness/PERMISSIONS.md` | No decidir tecnologías que violen reglas anti-caos |
   135|| `harness/SENSORS.md` | Los sensores validan que la tecnología elegida es correcta |
   136|| `harness/contracts/` | Alimenta al `feature-contract-writer` con especificaciones |
   137|| `progress/tasks.json` | Crea tareas de definición |
   138|| `progress/memory/` | Guarda decisiones de tecnología y alcance |
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
- No inventar entidades, campos o flujos sin documentarlos.
- Traducir siempre con precision: no asumir funcionalidad que Diego no pidio.
- No dejar decisiones importantes solo en el chat: registrar en `progress/memory/`.
