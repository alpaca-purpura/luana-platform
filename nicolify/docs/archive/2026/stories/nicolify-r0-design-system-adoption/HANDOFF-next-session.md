# HANDOFF · nicolify-r0-design-system-adoption (2026-06-15)

> Sesión saturó contexto. Estado + próximos pasos para retomar en conversación nueva.

## Estado

- **Story:** `nicolify-r0-design-system-adoption` · **state: `refined`** (FIRMA 1 + FIRMA 2 ratificadas).
- **Qué es:** Fase 3 de homologación del design system (ADR-014) en nicolify — ADOPCIÓN pura de `@luana/ui-kit` 0.4.1 + `@luana/design-tokens` + lock no-arbitrary. Cross-cutting (todas las hojas, incluido Abel — decisión Chris Bif-5 b).
- **Bases de mockup SETEADAS** (lo que pidió Chris antes del GO, mirror de vitalia):
  - `mockups/_shared.css` — base reusable (tokens espejo de globals.css + átomos + moléculas + layout-primitives + shell wrapper verbatim). Todo mockup la linkea.
  - `mockups/ds-base.html` — showcase + hoja abel/icp, compone de `_shared.css`. Ratificado.
  - `ADR-nicolify-003-mockup-base-protocol.md` + `nicolify/.claude/rules/shell-mockup-per-component.md` — protocolo obligatorio (cero alucinación UI · mockup=código).
- **Mockup re-ratificado** tras iteraciones: ribbon=función+agente+thumbnail (Mi Empresa·Abel / Atraer·Brenda / Vender·Christian / Operar·Sara / Retener·Norvil) · ⚙️ Configurar · barra Luana indigo + estructura vitalia (burbujas opacas) · **controles fully-rounded (pill) vía token `--radius-control`** (RN-7).
- **Colores verificados vs nicolify.com live.** Thumbnails = avatares SVG placeholder (Chris entrega finales, NO regenerar).

## Pendiente OPERATIVO (hacer primero en la sesión nueva)

1. **Commit por pathspec** (NO `git add -A` — índice compartido). Archivos:
   ```
   git -C ~/Proyectos/luana-nicolify add \
     nicolify/.claude/rules/README.md \
     nicolify/.claude/rules/shell-mockup-per-component.md \
     nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md \
     nicolify/docs/architecture/ADR-nicolify-003-mockup-base-protocol.md \
     nicolify/docs/product/releases/R0.yaml \
     nicolify/docs/product/stories/nicolify-r0-design-system-adoption/
   ```
   (branch `wip/nicolify`). Delegar a Haiku (>2 files · git-haiku-delegation).

## Próximo paso

- **`/architect nicolify nicolify-r0-design-system-adoption`** → ready package (refined→ready). Notas clave para el architect (ya en `01-spec.md`):
  - **Bif-5 (a):** Abel (`nicolify-r1-abel-icp-buyer`, en `reviewing` esperando demo gate #37) **converge dentro de esta historia** → un solo demo sobre el FE homologado.
  - **RN-7 / `--radius-control`:** verificar que `Input`/`Button`/`Select` de `@luana/ui-kit` expongan el token brand-overridable; si hardcodean radio → cambio de kit vía `/pm-luana`.
  - **Mirror muerto:** borrar `EntityWorkspaceLayout`/`EntitySubNavBar`/`EmptyState`/`AutosaveBadge` locales → consumir kit.
  - **Lock no-arbitrary:** migrar los 27 actuales, encender en cero (anti-default-flip).
  - Verification: `ambas` (técnica eslint/arch/tsc + funcional fidelidad visual + live-verify dev-app).

## Cross-brand (post-merge)

- El protocolo mockup-base + el token `--radius-control` son **candidate lift `/pm-luana`** (vitalia+nicolify ya lo corren).

## SSoT

- `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/{checkpoint.md, 01-spec.md, chris-input.md, mockups/}`
- Doctrina: `docs/architecture/luana-platform/{ADR-014, design-system-canon.md}` · `nicolify/docs/architecture/ADR-nicolify-003`
