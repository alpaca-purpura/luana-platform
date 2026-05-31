---
brand: nicolify
vertical: "Agent-as-a-Service · agencias y servicios profesionales B2B LatAm"
status: rebuild           # idea | rebuild | shipped — reseteada a esqueleto 2026-05-29, reconstrucción agentic-first
paradigm: agentic-revenue-engine-v1
last_updated: 2026-05-30
active_releases: [R0]     # R0 Fundación + shell agéntico (in_progress) · R1..R4 ver vision.md § 8
active_stories:
  # done:
  # - nicolify-r0-shell-organism   # state: done 2026-05-29 · contrato + ADR + nav-tree + mockup ratificado
  # - nicolify-r0-dev-stack        # state: done 2026-05-30 · [1] blocker — BE :8001 + FE :3001 verdes + Clerk auth + alembic IAM + seed · cap platform/nicolify-brand-runtime-foundation
  # R0 backlog (state: idea · listas para refinar):
  - nicolify-r0-design-system-tokens     # [2] tokens nicolify.com + fuentes + dark
  - nicolify-r0-topbar                   # [3] TopBar + TenantSwitcher derecha
  - nicolify-r0-shell-layout-splitter    # [4] layout 50/50 + splitter resizable
  - nicolify-r0-luana-chat               # [5] LuanaSidebar orquestador
  - nicolify-r0-ribbon-subtabs           # [6] Ribbon + SubTabsBar + shell-routes
  - nicolify-r0-routing-empty-states     # [7] routing + empty states
ssot_owner: /pm-nicolify
---

# Nicolify — checkpoint

> Estado actual del brand. Actualizado por `/pm-nicolify` en cada transición.

## Estado macro

Nicolify fue **reseteada a esqueleto** (2026-05-29) desde el producto monolítico original (legacy preservado en branch `legacy/nicolify-original` + worktree `~/Proyectos/luana-nicolify-legacy`). Se reconstruye **desde cero** con paradigma **agentic-first**: equipo de agentes Revenue/Ops orquestados (Luana + Abel + Brenda + Christian + Norvil) bajo único punto de contacto conversacional. Ciclo Atracción → Cierre → Retención.

- **Visión de negocio:** `nicolify/docs/product/vision.md` (v1 — **ratificada parcial Chris 2026-05-29**: identidad agentic-pura + billing fuera del core + agentes + nichos Tier 1-3 + personas ✅. Pricing/planes/tokens NO decidido aún, solo direccional). **Mercado base: Perú.** Nicho destacado agregado: subcontratas/proveedores mineros B2B.
- **Harness PM:** `/pm-nicolify` (paridad con `/pm-vitalia`), overlay `nicolify/CLAUDE.md`, overlay rule `nicolify/.claude/rules/agent-revenue-engine.md`.
- `capabilities/` arranca vacía a propósito — se repuebla story-by-story. El gate `reconcile_capabilities --require-capabilities-exist` NO bloquea mientras `status != shipped`.

## Próximos pasos sugeridos

1. ✅ Release **R0 — Fundación + shell agéntico** creado (`releases/R0.yaml`, status=planning).
2. Crear + refinar la primera story de R0 (sugerida: `nicolify-r0-shell-organism`, design-story que cementa el contrato del shell + nav-tree de los 5 agentes reusando Vitalia) → `/pm-nicolify` "idea" → `/po-ux` o `/ux-agentico`.
3. Pricing/planes/tokens: pendiente decisión Chris (no prioritario aún).

## Bitácora

- 2026-05-15: brand topology bootstrap (F0 reorg multimarca).
- 2026-05-29: reset a esqueleto (legacy → branch `legacy/nicolify-original`). Harness reconstruido agentic-first: vision.md v1 + pm-nicolify skill a paridad + overlay CLAUDE.md refresh + agent-revenue-engine.md overlay rule + brand.yaml align. Status `shipped → rebuild`.
- 2026-05-30: **R0 [1] nicolify-r0-dev-stack DONE** — pipeline completo autónomo (idea→spec→arch→build→audit→merge). Brand activa y verde: BE :8001 + FE :3001 + Clerk auth slice (consume luana_core_iam) + alembic IAM baseline + seed agencia-demo/owner.demo. Reset completado (purgado monolito legacy: 457 tests+scripts + snapshot + e2e). Cap `platform/nicolify-brand-runtime-foundation`. Learning promotable cross-brand. Pendiente: squash wip/nicolify→main (gate Chris).
