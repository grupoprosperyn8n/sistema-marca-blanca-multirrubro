     1|# Skill: Feature Contract Writer
     2|
     3|## Propósito
     4|
     5|Crear contratos de feature claros y obligatorios antes de construir cualquier funcionalidad importante. Ninguna feature se construye sin contrato previo.
     6|
     7|## Cuándo se activa
     8|
     9|- Una feature está definida en `progress/tasks.json` con estado "ready".
    10|- El usuario pide "construir [feature X]" sin contrato existente.
    11|- Se inicia una nueva fase de desarrollo de feature.
    12|- El harness sensor detecta que una feature no tiene contrato asociado.
    13|
    14|## Cuándo NO se activa
    15|
    16|- Durante la definición de producto (es competencia de prompt-product-manager).
    17|- Durante la implementación de la feature (ya debe tener contrato).
    18|- Para bugs, hotfixes o cambios mínimos aprobados sin contrato.
    19|- Para tareas puramente técnicas (infraestructura, CI/CD) sin impacto en producto.
    20|
    21|## Responsabilidades
    22|
    23|1. Definir el **objetivo** de la feature (qué problema resuelve, para quién).
    24|2. Definir el **usuario** o actor que interactúa con la feature.
    25|3. Definir los **datos** que entran, salen y persisten (campos, tablas, validaciones).
    26|4. Definir las **pantallas** o interfaces involucradas (rutas, componentes, estados).
    27|5. Definir los **workflows** o flujos de trabajo que ejecuta la feature.
    28|6. Definir los **permisos** necesarios (roles, RLS, autorización).
    29|7. Definir los **sensores** que monitorean la feature (alertas, errores, uso).
    30|8. Definir el **criterio de terminado** (qué significa "feature completa").
    31|9. Documentar supuestos, dependencias y riesgos.
    32|10. Asignar severidad: core (bloqueante sin ella) / standard / enhancement.
    33|
    34|## Archivos que puede leer
    35|
    36|- `docs/PRD.md` (requisitos de producto).
    37|- `progress/tasks.json` (tareas existentes).
    38|- `harness/contracts/*` (contratos existentes como referencia y template).
    39|- `harness/PERMISSIONS.md` (para definir permisos consistentes).
    40|- `FACTORY_HARNESS_MASTER.md` (filosofía y estándares del harness).
    41|
    42|## Archivos que puede modificar
    43|
    44|- `harness/contracts/[feature-name]_CONTRACT.md` (el contrato de la feature).
    45|
    46|## Archivos que NO puede tocar
    47|
    48|- `.env`, `.env.example`.
    49|- `docs/PRD.md` (es competencia de prompt-product-manager).
    50|- `progress/tasks.json` (es competencia de prompt-product-manager).
    51|- `harness/HARNESS.md`, `harness/GUIDES.md`, `harness/SENSORS.md`.
    52|- `skills/`, `config/`, `supabase/`, `airtable/`, `n8n/`.
    53|- Código fuente, migraciones, configuraciones de producción.
    54|
    55|## Herramientas / Stack relacionado
    56|
    57|- `harness/contracts/MODULE_CONTRACT_TEMPLATE.md` — plantilla de contrato base.
    58|- `harness/contracts/FEATURE_CONTRACT_TEMPLATE.md` — plantilla específica de feature.
    59|- `harness/contracts/SUPABASE_CONTRACT.md` — estándares de base de datos.
    60|- `harness/contracts/UI_CONTRACT.md` — estándares de interfaz.
    61|- `harness/contracts/AI_AGENT_CONTRACT.md` — límites de lo que los agentes pueden hacer.
    62|- `harness/SENSORS.md` — los sensores validan que el contrato esté completo.
    63|
    64|## Inputs mínimos necesarios
    65|
    66|- Nombre de la feature.
    67|- PRD o descripción funcional de lo que debe hacer.
    68|- Contexto: ¿es feature core, standard o enhancement?
    69|
    70|## Flujo operativo paso a paso
    71|
    72|1. **Recibir feature** — leer el PRD o descripción del usuario.
    73|2. **Identificar tipo** — ¿es módulo nuevo, feature existente, mejora?
    74|3. **Abrir template** — usar `harness/contracts/FEATURE_CONTRACT_TEMPLATE.md` como base.
    75|4. **Completar cada sección** — objetivo, usuario, datos, pantallas, workflows, permisos, sensores, criterio de terminado.
    76|5. **Documentar supuestos** — si algo no está definido en el PRD, asumir mínimo y marcarlo.
    77|6. **Guardar contrato** — en `harness/contracts/[feature-slug]_CONTRACT.md`.
    78|7. **Presentar al usuario** — pedir aprobación antes de pasar a implementación.
    79|
    80|## Output esperado
    81|
    82|- `harness/contracts/[feature-slug]_CONTRACT.md` completo con las 8 secciones.
    83|
    84|## Checklist de salida
    85|
    86|- [ ] Feature tiene nombre y propósito definidos.
    87|- [ ] Usuario/actor identificado.
    88|- [ ] Datos definidos (entrada, salida, persistencia).
    89|- [ ] Pantallas definidas (o "sin interfaz" si es backend).
    90|- [ ] Workflows definidos (o "sin flujo automatizado" si es manual).
    91|- [ ] Permisos definidos.
    92|- [ ] Sensores definidos (o "sin monitoreo" si es feature simple).
    93|- [ ] Criterio de terminado definido.
    94|- [ ] Supuestos documentados.
    95|- [ ] Usuario aprobó el contrato.
    96|
    97|## Riesgos
    98|
    99|- **Sobre-especificación:** el contrato es tan detallado que bloquea el avance. Mitigación: mantenerlo al nivel de feature, no de implementación.
   100|- **Sub-especificación:** el contrato es tan vago que no guía la implementación. Mitigación: checklist obligatorio de 10 ítems.
   101|- **Contrato sin aprobación:** se implementa sobre especificaciones no validadas. Mitigación: no pasar a implementación sin aprobación.
   102|
   103|## Cuándo pedir aprobación humana
   104|
   105|- Features que afectan pagos, usuarios, datos sensibles o producción.
   106|- Features que cambian permisos existentes.
   107|- Features con dependencias externas (APIs de terceros, integraciones).
   108|- Features core del producto (bloqueantes).
   109|
   110|## Relación con el harness
   111|
   112|| Documento | Relación |
   113||-----------|----------|
   114|| `AGENTS.md` | Define cómo opera este skill dentro de la fábrica |
   115|| `FACTORY_HARNESS_MASTER.md` | Alinea el contrato con la filosofía del harness |
   116|| `harness/AGENT_RUNBOOK.md` | El runbook detalla cuándo ejecutar este skill |
   117|| `harness/PERMISSIONS.md` | Los permisos del contrato deben ser consistentes con este documento |
   118|| `harness/SENSORS.md` | Los sensores validan que el contrato esté completo |
   119|| `harness/contracts/` | Aquí se guarda el contrato; los templates guían el formato |
   120|| `progress/tasks.json` | La feature debe tener una tarea asociada |
   121|| `progress/memory/` | Decisiones sobre el contrato se registran aquí |
   122|
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
- No construir feature sin contrato previo.
- Contrato debe incluir criterios Ready, Done y Production Ready.
- No aprobar contracts sin revision humana para cambios de alto riesgo.
