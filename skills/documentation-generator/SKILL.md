     1|# Skill: Documentation Generator
     2|
     3|## Propósito
     4|
     5|Crear documentación clara, mantenible y útil para humanos (usuarios finales, clientes, stakeholders) y para agentes (contratos, specs, CHANGELOG). Separar documentación técnica de documentación comercial.
     6|
     7|## Cuándo se activa
     8|
     9|- Una feature está completa, aprobada y tiene contrato firmado.
    10|- Un módulo completo está listo para release.
    11|- El usuario pide "generar documentación de [X]".
    12|- Se necesita actualizar el README o CHANGELOG después de un cambio importante.
    13|- Se solicita documentación para un stakeholder o cliente externo.
    14|- Antes de un deploy o release (actualizar DEPLOYMENT.md).
    15|
    16|## Cuándo NO se activa
    17|
    18|- Durante el desarrollo activo de la feature (la documentación se genera al finalizar).
    19|- Para documentar features no aprobadas o no contratadas.
    20|- Para documentar ideas no implementadas (inventar funcionalidades).
    21|- Para reemplazar documentación existente sin motivo.
    22|- Cuando la feature no tiene contrato en `harness/contracts/`.
    23|
    24|## Responsabilidades
    25|
    26|1. Crear y mantener `README.md` del proyecto (visión general, cómo empezar, cómo contribuir).
    27|2. Crear documentación técnica (arquitectura, componentes, flujos).
    28|3. Crear manual de usuario (funcionalidades, pantallas, pasos).
    29|4. Crear documentación de API (endpoints, autenticación, schemas, ejemplos).
    30|5. Crear documentación de workflows n8n (triggers, pasos, errores manejados).
    31|6. Crear documentación de Airtable (bases, tablas, campos, relaciones).
    32|7. Crear documentación de Supabase (tablas, RLS, funciones, políticas).
    33|8. Preparar versiones DOCX/PDF/PPTX si la herramienta (pandoc o similar) está disponible.
    34|9. Actualizar `docs/CHANGELOG_AI.md` con cada cambio documentado.
    35|10. Actualizar `docs/DEPLOYMENT.md` con instrucciones de despliegue.
    36|
    37|## Archivos que puede leer
    38|
    39|- `harness/contracts/*` (contratos de features — para documentar lo que existe).
    40|- `docs/PRD.md` (requisitos del producto — fuente de verdad funcional).
    41|- Todo el proyecto (estructura de archivos, código, configuraciones).
    42|- `harness/HARNESS.md` (para entender la arquitectura del harness).
    43|- `supabase/`, `airtable/`, `n8n/` (para documentar cada capa).
    44|- `progress/memory/decisions.md` (decisiones de diseño relevantes).
    45|
    46|## Archivos que puede modificar
    47|
    48|- `README.md`.
    49|- `docs/` (toda la carpeta de documentación: manuales, specs, guías).
    50|- `docs/CHANGELOG_AI.md` (actualizar con cada release/cambio documentado).
    51|- `docs/DEPLOYMENT.md` (actualizar instrucciones de deploy).
    52|
    53|## Archivos que NO puede tocar
    54|
    55|- `.env`, `.env.example`.
    56|- `harness/contracts/*` (solo lectura — no modificar contratos).
    57|- `harness/HARNESS.md`, `harness/GUIDES.md`, `harness/SENSORS.md`, `harness/PERMISSIONS.md`.
    58|- `harness/FAILURE_LOG.md`.
    59|- `skills/` (ninguna skill).
    60|- `progress/tasks.json`, `progress/memory/` (solo lectura).
    61|- Código fuente, migraciones, configuraciones de producción.
    62|
    63|## Herramientas / Stack relacionado
    64|
    65|- `AGENTS.md` — para entender cómo opera la fábrica (documentar para otros agentes).
    66|- `FACTORY_HARNESS_MASTER.md` — documentar la filosofía del harness para nuevos integrantes.
    67|- `harness/AGENT_RUNBOOK.md` — el runbook debe estar documentado.
    68|- `harness/PERMISSIONS.md` — documentar qué permisos existen y por qué.
    69|- `harness/contracts/` — los contratos son la fuente de verdad de lo documentado.
    70|- `progress/memory/` — decisiones de diseño que deben documentarse.
    71|- Herramientas externas: pandoc (DOCX/PDF), wkhtmltopdf (PDF desde HTML).
    72|
    73|## Inputs mínimos necesarios
    74|
    75|- Qué feature/módulo documentar (nombre y ruta del contrato asociado).
    76|- Tipo de documentación solicitada (técnica / usuario / API / deploy / CHANGELOG).
    77|- Audiencia (desarrolladores, usuarios finales, stakeholders, clientes).
    78|
    79|## Flujo operativo paso a paso
    80|
    81|1. **Recibir solicitud** — qué documentar, para quién, qué formato.
    82|2. **Leer contrato asociado** — en `harness/contracts/[feature]_CONTRACT.md` para entender exactamente qué se construyó.
    83|3. **Revisar lo construido** — leer el código, schemas, configuraciones relevantes.
    84|4. **Escribir documentación** — siguiendo los estándares del tipo solicitado.
    85|5. **NO inventar funcionalidades** — solo documentar lo que realmente existe.
    86|6. **Actualizar CHANGELOG_AI.md** — registrar qué se documentó.
    87|7. **Entregar al usuario** — confirmar que la documentación refleja la realidad.
    88|
    89|## Output esperado
    90|
    91|- `README.md` actualizado (si es documentación general o nuevo proyecto).
    92|- `docs/USER_MANUAL.md` si es manual de usuario.
    93|- `docs/API_SPEC.md` si es documentación de API.
    94|- `docs/DEPLOYMENT.md` actualizado si hay cambios de infraestructura.
    95|- `docs/CHANGELOG_AI.md` actualizado.
    96|- Archivos DOCX/PDF/PPTX si se solicitaron y la herramienta está disponible.
    97|
    98|## Checklist de salida
    99|
   100|- [ ] Documentación leída contra el contrato (coincide con lo implementado).
   101|- [ ] No se inventaron funcionalidades no construidas.
   102|- [ ] El CHANGELOG_AI.md fue actualizado.
   103|- [ ] No se expusieron secretos, tokens ni credenciales en la documentación.
   104|- [ ] Lenguaje claro y adaptado a la audiencia.
   105|- [ ] Usuario revisó y aprobó la documentación (si es para cliente externo).
   106|
   107|## Riesgos
   108|
   109|- **Exponer secretos:** documentar endpoints, credenciales o configuraciones sensibles. Mitigación: revisar que no haya tokens, claves ni URLs internas en la documentación pública.
   110|- **Inventar funcionalidades:** documentar algo que no se construyó. Mitigación: leer el contrato y verificar contra el código real.
   111|- **Documentación desactualizada:** documentar una versión anterior de la feature. Mitigación: siempre leer el contrato y el código actual.
   112|- **Mezclar audiencias:** documentación técnica para usuarios no técnicos. Mitigación: separar docs/ técnica de docs/ comercial.
   113|
   114|## Cuándo pedir aprobación humana
   115|
   116|- Documentación para clientes externos o stakeholders.
   117|- Documentación de API que se expone públicamente.
   118|- Documentación de seguridad (permisos, RLS, autenticación).
   119|- Cualquier documentación que pueda malinterpretarse y causar errores de uso.
   120|
   121|## Relación con el harness
   122|
   123|| Documento | Relación |
   124||-----------|----------|
   125|| `AGENTS.md` | Define cómo opera este skill dentro de la fábrica |
   126|| `FACTORY_HARNESS_MASTER.md` | Documentar la fábrica para nuevos agentes y usuarios |
   127|| `harness/AGENT_RUNBOOK.md` | El runbook debe estar documentado para los agentes |
   128|| `harness/PERMISSIONS.md` | La documentación de seguridad referencia este documento |
   129|| `harness/SENSORS.md` | Los sensores pueden detectar documentación faltante |
   130|| `harness/contracts/` | Los contratos son la fuente de verdad para documentar |
   131|| `progress/tasks.json` | Las tareas documentadas deben tener estado "done" |
   132|| `progress/memory/` | Decisiones de diseño relevantes se documentan aquí |
   133|
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
- No documentar features inexistentes como si estuvieran construidas.
- Apuntar a `progress/` como fuente de verdad, no a `ai/`.
- No generar documentacion de algo que no existe.
