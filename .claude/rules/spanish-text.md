# Spanish Text (UI user-facing)

Aplica: React components, form-runtime schemas (labels/hints/placeholders), BE catalogs user-facing, DTOs messages, prompts LLM output user, emails, notificaciones.
NO aplica: logs internos, errors técnicos, comentarios, variables, tests sin UI string.

## R1 — Ortografía
Tildes + ñ + apertura `¿`/`¡`. Ej: días, Campaña, Inversión, Conversión, Configuración, Atracción, Nutrición, Adopción, Expansión, activación, adquisición, retención, ubicación.

## R2 — Español LatAm neutro (sin voseo)

Tuteo (`tú`). PROHIBIDO voseo (`vos/sos/tenés/podés/mirá/dejá`) + léxico marcado (`laburo/quilombo/pibe/dale/che/bárbaro/fijate`). Voseo excluye MX/CO/PE/CL/EC.

**Subset alta-frecuencia (glosario completo en `docs/rules-detail/spanish-glossary.md`):**

| Voseo | Neutro | Voseo | Neutro |
|---|---|---|---|
| vos / sos | tú / eres | tenés / podés | tienes / puedes |
| mirá / dejá | mira / deja | poné / usá | pon / usa |
| seleccioná / agregá | selecciona / agrega | configurá / revisá | configura / revisa |
| guardá / escribí | guarda / escribe | elegí | elige |
| cambiá / volvé | cambia / vuelve | activás / desactivás | activas / desactivas |
| dale (imperativo) | asígnale/ponle/define | fijate | revisa/ten en cuenta |

## Checklist pre-commit
1. Imperativo voseado (`-ás/-és/-ís`) → tuteo · 2. Léxico regional → neutro · 3. Tildes/eñes/¿¡

## Excepción sales_agent
Output sales_agent respeta voz tenant (puede tener voseo si tenant AR). Ver `sales-agent-expert`.

## Magic comment escape (R25)
Files que citan voseo como referencia técnica (rules MD, audit reports, test fixtures) → `# voseo-allowed` o `<!-- voseo-allowed -->` (con/sin razón). NUNCA en user-facing strings. Hook regex + 4 variantes detalladas en `docs/rules-detail/spanish-glossary.md § Magic comment`.

## Referencias
- `docs/rules-detail/spanish-glossary.md` — **glosario completo (50+ conversiones) + magic comment detalle**
