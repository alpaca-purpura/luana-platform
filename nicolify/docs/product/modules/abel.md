# Module — Abel (nicolify brand-extension)

> Brand: nicolify
> Owner: Abel (Estratega — Branding & Oferta)
> Status: live (post nicolify-r1-abel-icp-buyer merge 2026-07-15)
> Pattern: ADR-nicolify-001 shell-feature-architecture (source story)
> Path: `nicolify/backend/src/modules/nicolify/abel/`

## Goal narrativa

Módulo Abel — el estratega de branding & oferta del ecosistema de agentes Nicolify. Primera hoja real: **"ICP & buyer"**, donde el dueño de la agencia define a quiénes apunta (perfil de cliente ideal a nivel cuenta: industria/tamaño/geo/dolor/ángulo) y quién decide (N buyer personas por ICP, rol + poder de decisión). Captura draft-first invertida (seed→extract→propone→ratifica) vía extractor agentic one-shot.

Materia prima que consumen Brenda (contenido/pauta) y Christian (outbound) — ver `nicolify/.claude/rules/agent-revenue-engine.md`.

## Boundaries

- **Domain ownership:** `ICP` net-new brand-local (nivel cuenta, alinea con `Account` del CRM). `Buyer` replica brand-local async del engine `BuyerPersona` (`core/luana-core-brand-studio`), con `icp_id` propio — engine es sync+engine-IAM sin ese campo (boundary mismatch documentado en `03-arch.md`), se consume el esquema/patrón por referencia, no se monta runtime sync.
- **No cross-brand mirror:** verificado (anti-duplication scan, ver 00-research.md §3).
- **Engine consumed via import:** extractor agentic (`BaseExtractionOrchestrator`), `sanitize_payload`, cost recording — todos de `core/luana-core-observability` / `core/luana-core-extraction`.

## Auto-list capabilities (AUTO-GENERATED por scripts/reconcile_capabilities.py — NO editar a mano)

<!-- AUTO-LIST START -->
| Capability | Status | Story introducer | Date | Path |
|---|---|---|---|---|
| abel.icp-buyer | live | nicolify-r1-abel-icp-buyer | 2026-06-03 | `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` |
<!-- AUTO-LIST END -->

## Tables (Postgres)

| Table | Purpose |
|---|---|
| `abel_icps` | Perfil de cliente ideal a nivel cuenta (industria, tamaño, geo, dolor, ángulo, status borrador/listo) |
| `abel_buyers` | Buyer persona (rol, poder de decisión, is_primary) — 1 ICP → N buyers (schema en revisión: `nicolify-r1-abel-buyer-multi-icp` lo reescribe a many-to-many) |

## Follow-ups conocidos

- **`nicolify-r1-abel-buyer-multi-icp`** (state=idea, desbloqueada 2026-07-15) — reescribe `abel_buyers` de FK 1:1 a join table `abel_icp_buyers` (many-to-many), agrega vista "Buyers" directory + attach-existing.
- **W1 (security, medium):** rutas abel confían en `X-Tenant-ID` sin Bearer/auth app-layer — ratificar antes de exposición non-localhost.
- **Promotion candidates (`/pm-luana`):** `GrowthStudioEmitter` (N=2 lift) · `EntitySubNavBar` → `@luana/ui-kit` (N=2) · entidad `ICP` (cuando N=2 vertical B2B).
- **Bugfix R0 (non_egoismo):** `ShellOrganismLayoutClient` AppPanelSlot duplicado — `nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md`.

## Referencias

- Story source: `nicolify/docs/archive/2026/stories/nicolify-r1-abel-icp-buyer/`
- ADR pattern: `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md`
- Agent model: `nicolify/.claude/rules/agent-revenue-engine.md`
- Shell design system: `.claude/skills/nicolify-design-system/SKILL.md`
