     1|# Skill: SaaS Product Builder
     2|
     3|## 1. Propósito
     4|
     5|Convertir ideas en productos SaaS vendibles con foco en MVP ajustado, promesa clara, onboarding rápido, modelo de monetización definido y validación antes de construir. No inflar el MVP.
     6|
     7|## 2. Cuándo se activa
     8|
     9|- El usuario dice "quiero crear un SaaS de [tema]"
    10|- Una tarea en `progress/tasks.json` tiene fase `product-definition` o `saas`
    11|- El `no-code-translator` detecta que el pedido de Diego requiere un producto SaaS completo (no solo un módulo ERP)
    12|- Se necesita definir plan de precios, onboarding o modelo de negocio
    13|- Se necesita validar idea antes de construir
    14|
    15|## 3. Cuándo NO se activa
    16|
    17|- Cuando el proyecto es un ERP interno (no SaaS público) — ahí actúa `erp-module-designer`
    18|- Para features pequeñas de un SaaS existente (usa `feature-contract-writer`)
    19|- Para implementación técnica de código (ahí actúan `supabase-architect`, `airtable-operator`, `n8n-automation-builder`)
    20|- Cuando no hay validación de idea (primero definir problema e ICP)
    21|- Para debugging o mantenimiento de producto existente
    22|
    23|## 4. Responsabilidades
    24|
    25|1. Definir ICP (Ideal Customer Profile) — quién es el cliente ideal.
    26|2. Definir problema principal que resuelve el producto.
    27|3. Definir propuesta de valor y promesa concreta.
    28|4. Diseñar funcionalidades MVP (mínimas para generar valor).
    29|5. Separar MVP de versión avanzada (roadmap sin inflar).
    30|6. Diseñar onboarding simple (primeros 5 minutos del usuario).
    31|7. Diseñar plan gratuito (si aplica), plan pago y upgrade path.
    32|8. Definir métricas clave (MRR, churn, activación, retención).
    33|9. Definir modelo multi-tenant y permisos por plan.
    34|10. Definir integraciones necesarias (pagos, email, CRM, etc.).
    35|11. Documentar en `docs/PRD.md` y `docs/BUSINESS_MODEL.md`.
    36|12. Validar la idea antes de construir (entrevistas, landing page, waitlist).
    37|
    38|## 5. Archivos que puede leer
    39|
    40|- `harness/contracts/` — contratos de módulos existentes
    41|- `progress/tasks.json` — tareas existentes
    42|- `progress/memory/preferences.md` — preferencias de Diego sobre el producto
    43|- `docs/PRD.md` — PRD existente si ya hay uno
    44|- `docs/BUSINESS_MODEL.md` — modelo de negocio existente
    45|- `docs/MODULES.md` — módulos que podría tener el producto
    46|
    47|## 6. Archivos que puede modificar
    48|
    49|- `docs/PRD.md` — documento de requerimientos de producto
    50|- `docs/BUSINESS_MODEL.md` — modelo de negocio, pricing, métricas
    51|- `progress/memory/decisions.md` — decisiones de producto
    52|- `progress/memory/open-questions.md` — preguntas abiertas sobre el producto
    53|- `progress/tasks.json` — tareas de producto derivadas
    54|
    55|## 7. Archivos que NO puede tocar
    56|
    57|- `.env` o cualquier archivo con credenciales reales
    58|- Código en `src/` o `app/`
    59|- Bases de datos reales
    60|- `harness/PERMISSIONS.md` o `harness/SENSORS.md`
    61|- `harness/init.sh`
    62|- Skills de otros agentes
    63|- El monolito legacy
    64|- Contratos en `harness/contracts/` (los crea `feature-contract-writer` o `erp-module-designer`)
    65|
    66|## 8. Herramientas / Stack relacionado
    67|
    68|- `erp-module-designer` — para diseñar módulos específicos del producto
    69|- `prompt-product-manager` — para transformar ideas en PRD detallados
    70|- `harness/contracts/MODULE_CONTRACT_TEMPLATE.md` — para contratos de módulos
    71|- `docs/UX_UI_Engineering_Brief.md` — para diseño de onboarding y UX
    72|- Supabase (autenticación multi-plan, RLS por plan)
    73|- Stripe o similar (pagos recurrentes)
    74|- Herramientas de validación (landing page, waitlist, encuestas)
    75|
    76|## 9. Inputs mínimos necesarios
    77|
    78|1. ¿Qué problema resuelve tu producto? (en una frase)
    79|2. ¿Quién es tu cliente ideal? (tamaño de empresa, rol, industria)
    80|3. ¿Qué promesa le hacés al cliente? ("en 5 minutos tenés X funcionando")
    81|4. ¿Cuánto están dispuestos a pagar? (estimación, rango de precio)
    82|5. ¿Ya tenés clientes o validación? (entrevistas, encuestas, waitlist)
    83|6. ¿Qué es lo mínimo indispensable para que funcione? (MVP estricto)
    84|7. ¿Qué NO debe tener el MVP? (exclusiones explícitas)
    85|
    86|## 10. Flujo operativo paso a paso
    87|
    88|```
    89|Paso 1: Recibir idea de Diego o del no-code-translator
    90|Paso 2: Preguntar inputs mínimos si faltan
    91|Paso 3: Definir ICP, problema y promesa de valor
    92|Paso 4: Definir MVP estricto (lo mínimo para lanzar)
    93|Paso 5: Separar MVP de versión avanzada (roadmap)
    94|Paso 6: Diseñar onboarding simple (primeros pasos del usuario)
    95|Paso 7: Definir plan gratuito (si aplica), plan pago y upgrade path
    96|Paso 8: Definir métricas clave y modelo de retención
    97|Paso 9: Definir multi-tenant y permisos por plan
    98|Paso 10: Documentar en docs/PRD.md y docs/BUSINESS_MODEL.md
    99|Paso 11: Validar idea antes de construir (si no hay validación aún)
   100|Paso 12: Solicitar aprobación humana antes de pasar a diseño técnico
   101|```
   102|
   103|## 11. Output esperado
   104|
   105|- `docs/PRD.md` — documento de requerimientos completo
   106|- `docs/BUSINESS_MODEL.md` — modelo de negocio, pricing, métricas
   107|- Lista de módulos MVP vs versión avanzada
   108|- Onboarding flow descrito
   109|- Métricas clave definidas (MRR, churn, activación)
   110|- Tareas de implementación en `progress/tasks.json`
   111|- Decisiones registradas en `progress/memory/`
   112|
   113|## 12. Checklist de salida
   114|
   115|- [ ] ¿ICP definido claramente?
   116|- [ ] ¿Problema principal definido en una frase?
   117|- [ ] ¿Promesa de valor concreta? ("en X minutos tenés Y funcionando")
   118|- [ ] ¿MVP estricto definido (sin features infladas)?
   119|- [ ] ¿Versión avanzada separada (roadmap)?
   120|- [ ] ¿Onboarding simple diseñado?
   121|- [ ] ¿Plan gratuito y pago definidos?
   122|- [ ] ¿Upgrade path claro?
   123|- [ ] ¿Métricas clave definidas?
   124|- [ ] ¿Validación de idea hecha o planificada?
   125|- [ ] ¿Documentación escrita en `docs/PRD.md` y `docs/BUSINESS_MODEL.md`?
   126|- [ ] ¿Aprobación humana obtenida antes de implementar?
   127|
   128|## 13. Riesgos
   129|
   130|| Riesgo | Impacto | Mitigación |
   131||--------|---------|------------|
   132|| MVP inflado (demasiadas features para lanzar) | Alto | Regla: MVP es lo MÍNIMO para que el cliente obtenga valor. Todo lo demás va a roadmap |
   133|| Sin validación → construir algo que nadie quiere | Crítico | No empezar implementación sin validación (landing page, entrevistas, waitlist) |
   134|| Pricing mal definido → clientes no pagan o producto no rentable | Alto | Investigar precios de competidores; definir precio basado en valor, no en costo |
   135|| Onboarding complejo → abandono en primeros 5 minutos | Alto | Onboarding = 3 pasos máximo. "Primer éxito" en menos de 5 minutos |
   136|
   137|## 14. Cuándo pedir aprobación humana
   138|
   139|- **Siempre** antes de definir pricing final (planes y precios)
   140|- **Siempre** antes de definir alcance del MVP (Diego debe aprobar qué entra y qué no)
   141|- **Siempre** si el producto toca pagos, facturación o datos financieros
   142|- **Siempre** si se necesita inversión externa o recursos adicionales
   143|- En caso de duda, preguntar
   144|
   145|## 15. Relación con el Harness
   146|
   147|| Documento | Cómo se relaciona |
   148||-----------|-------------------|
   149|| `AGENTS.md` | Los agentes invocan esta skill para definir productos SaaS |
   150|| `FACTORY_HARNESS_MASTER.md` | La definición de producto sigue la arquitectura del master |
   151|| `harness/AGENT_RUNBOOK.md` | El producto se define antes de diseñar módulos o features |
   152|| `harness/PERMISSIONS.md` | No inflar el MVP — regla anti-caos |
   153|| `harness/SENSORS.md` | Los sensores validan que el MVP no está inflado |
   154|| `harness/contracts/` | La definición del producto alimenta contratos de módulos y features |
   155|| `progress/tasks.json` | Crea tareas de definición de producto y validación |
   156|| `progress/memory/` | Guarda decisiones de producto, pricing y roadmap |
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
- No construir UI sin revisar `ux/UX_UI_Engineering_Brief.md`.
- No inventar features sin contrato aprobado.
- No copiar la fabrica al proyecto; usar starter pack.
- Entregar resumen entendible para Diego.
