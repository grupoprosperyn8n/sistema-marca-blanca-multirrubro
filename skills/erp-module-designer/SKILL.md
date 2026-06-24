     1|# Skill: ERP Module Designer
     2|
     3|## 1. Propósito
     4|
     5|Diseñar módulos ERP claros, escalables y conectados con procesos reales de negocio, asegurando que cada módulo tenga contrato, arquitectura aprobada y separación MVP vs versión avanzada antes de construir.
     6|
     7|## 2. Cuándo se activa
     8|
     9|- El usuario pide un nuevo módulo ERP (CRM, stock, ventas, compras, etc.)
    10|- Una tarea en `progress/tasks.json` tiene status `ready` y fase `module-design`
    11|- El `no-code-translator` entrega una especificación que necesita diseño de módulo
    12|- Se detecta que un módulo existente necesita refactor por cambio de scope
    13|- Un contrato en `harness/contracts/` referencia un módulo no diseñado aún
    14|
    15|## 3. Cuándo NO se activa
    16|
    17|- Durante implementación de código (ahí actúa `supabase-architect` o `airtable-operator`)
    18|- Para features pequeñas que no constituyen un módulo completo (usa `feature-contract-writer`)
    19|- Para debugging de módulos ya construidos
    20|- Cuando el usuario solo pide un ajuste de pantalla o campo existente
    21|- Cuando no hay contrato de módulo aprobado (primero debe pasar por `prompt-product-manager`)
    22|
    23|## 4. Responsabilidades
    24|
    25|1. Definir objetivo del módulo y usuario principal.
    26|2. Diseñar entidades del módulo (tablas, campos, relaciones).
    27|3. Definir permisos y roles que interactúan con el módulo.
    28|4. Diseñar pantallas necesarias (listado, detalle, formulario, reportes).
    29|5. Definir flujos de negocio del módulo (estados, transiciones, triggers).
    30|6. Diseñar reportes y dashboards del módulo.
    31|7. Definir automatizaciones n8n asociadas al módulo.
    32|8. Documentar integración con Supabase, Airtable y n8n.
    33|9. Separar MVP de versión avanzada en el diseño.
    34|10. Generar el contrato del módulo en `harness/contracts/`.
    35|
    36|## 5. Archivos que puede leer
    37|
    38|- `harness/contracts/` — contratos existentes de otros módulos
    39|- `progress/tasks.json` — tareas pendientes y su fase
    40|- `progress/memory/` — decisiones previas sobre módulos
    41|- `docs/MODULES.md` — documentación de módulos existentes
    42|- `docs/SUPABASE_SETUP.md` — esquema actual de Supabase
    43|- `docs/AIRTABLE_SETUP.md` — esquema actual de Airtable
    44|- `harness/templates/MODULE_CONTRACT_TEMPLATE.md` — template de contrato
    45|
    46|## 6. Archivos que puede modificar
    47|
    48|- `docs/MODULES.md` — agregar documentación del nuevo módulo
    49|- `harness/contracts/[MODULE]_MODULE_CONTRACT.md` — contrato del módulo
    50|- `progress/memory/decisions.md` — registrar decisiones de diseño
    51|- `progress/tasks.json` — crear tareas técnicas derivadas del diseño
    52|
    53|## 7. Archivos que NO puede tocar
    54|
    55|- `.env` o cualquier archivo con credenciales reales
    56|- `harness/init.sh`
    57|- Código en `src/` o `app/` (su función es diseñar, no implementar)
    58|- Bases de datos reales (Supabase o Airtable)
    59|- `harness/PERMISSIONS.md` o `harness/SENSORS.md` (compete a `harness-engineer`)
    60|- Skills de otros agentes
    61|- El monolito legacy
    62|
    63|## 8. Herramientas / Stack relacionado
    64|
    65|- `harness/contracts/MODULE_CONTRACT_TEMPLATE.md`
    66|- `harness/templates/FEATURE_CONTRACT_TEMPLATE.md`
    67|- `docs/UX_UI_Engineering_Brief.md` — para diseñar pantallas
    68|- Supabase (para definir tablas y relaciones)
    69|- Airtable (para capa no-code asociada)
    70|- n8n (para automatizaciones del módulo)
    71|- `progress/tasks.json` — para crear tareas derivadas
    72|
    73|## 9. Inputs mínimos necesarios
    74|
    75|1. ¿Qué problema de negocio resuelve este módulo?
    76|2. ¿Quién lo usa? (rol, perfil)
    77|3. ¿Qué datos maneja? (entidades principales)
    78|4. ¿Qué flujo sigue? (pasos del proceso)
    79|5. ¿Qué debe reportar? (métricas, informes)
    80|6. ¿Con qué otros módulos se conecta?
    81|7. ¿Cuál es el MVP mínimo? (qué es indispensable para funcionar)
    82|
    83|## 10. Flujo operativo paso a paso
    84|
    85|```
    86|Paso 1: Recibir requerimiento del usuario o del no-code-translator
    87|Paso 2: Preguntar inputs mínimos si faltan
    88|Paso 3: Definir entidades, campos y relaciones del módulo
    89|Paso 4: Definir pantallas necesarias (listado / detalle / formulario / reporte)
    90|Paso 5: Definir permisos y roles
    91|Paso 6: Definir automatizaciones n8n
    92|Paso 7: Separar MVP de versión avanzada
    93|Paso 8: Documentar integración con Supabase, Airtable y n8n
    94|Paso 9: Redactar contrato en harness/contracts/
    95|Paso 10: Registrar en progress/memory/decisions.md
    96|Paso 11: Actualizar progress/tasks.json con tareas derivadas
    97|Paso 12: Solicitar aprobación humana si el módulo es crítico
    98|```
    99|
   100|## 11. Output esperado
   101|
   102|- `docs/MODULES.md` actualizado con el nuevo módulo
   103|- `harness/contracts/[MODULE]_MODULE_CONTRACT.md` listo para revisión
   104|- `progress/memory/decisions.md` — decisiones de diseño registradas
   105|- `progress/tasks.json` — tareas técnicas creadas
   106|
   107|## 12. Checklist de salida
   108|
   109|- [ ] ¿Objetivo del módulo definido?
   110|- [ ] ¿Usuario principal identificado?
   111|- [ ] ¿Entidades, campos y relaciones definidos?
   112|- [ ] ¿Pantallas necesarias listadas?
   113|- [ ] ¿Permisos y roles definidos?
   114|- [ ] ¿Flujo de negocio documentado?
   115|- [ ] ¿Automatizaciones n8n identificadas?
   116|- [ ] ¿MVP separado de versión avanzada?
   117|- [ ] ¿Contrato redactado en `harness/contracts/`?
   118|- [ ] ¿Decisiones registradas en `progress/memory/`?
   119|- [ ] ¿Tareas derivadas creadas en `progress/tasks.json`?
   120|
   121|## 13. Riesgos
   122|
   123|| Riesgo | Impacto | Mitigación |
   124||--------|---------|------------|
   125|| Módulo gigante imposible de implementar | Alto | Separar MVP claro; si el módulo tiene más de 5 entidades, dividir en submódulos |
   126|| Scope creep durante diseño | Medio | Congelar alcance en el contrato; cambios requieren nuevo contrato |
   127|| Duplicación con módulo existente | Alto | Leer `docs/MODULES.md` y contratos existentes antes de diseñar |
   128|| Dependencia circular entre módulos | Alto | Definir dependencias en el contrato; no diseñar A→B→A |
   129|
   130|## 14. Cuándo pedir aprobación humana
   131|
   132|- **Siempre** antes de crear un módulo que toca facturación, pagos o datos financieros
   133|- **Siempre** antes de crear un módulo multi-tenant
   134|- **Siempre** si el diseño afecta a más de 3 módulos existentes
   135|- **Siempre** si el MVP propuesto requiere cambios en la arquitectura actual de Supabase
   136|- En caso de duda, preguntar
   137|
   138|## 15. Relación con el Harness
   139|
   140|| Documento | Cómo se relaciona |
   141||-----------|-------------------|
   142|| `AGENTS.md` | Esta skill es invocada por agentes que reciben tareas de diseño de módulo |
   143|| `FACTORY_HARNESS_MASTER.md` | Los módulos diseñados siguen la arquitectura definida en el master |
   144|| `harness/AGENT_RUNBOOK.md` | El diseño sigue los pasos del runbook (fase de diseño antes de desarrollo) |
   145|| `harness/PERMISSIONS.md` | Los permisos del módulo deben cumplir las reglas anti-caos |
   146|| `harness/SENSORS.md` | Los sensores validan el módulo diseñado antes de pasar a construcción |
   147|| `harness/contracts/` | Produce contratos de módulo que otros agentes ejecutan |
   148|| `progress/tasks.json` | Crea tareas técnicas derivadas del diseño |
   149|| `progress/memory/` | Registra decisiones de diseño para trazabilidad |
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
- No inventar modulos o entidades sin documentarlos en contrato.
- Todo modulo requiere contrato aprobado antes de construccion.
- No crear estructuras paralelas a modulos existentes.
