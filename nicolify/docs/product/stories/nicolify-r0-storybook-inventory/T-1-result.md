# T-1 result — Clasificación grep-cross-kit (post-merge ds-adoption)

> **Owner:** /dev-team orchestrator (análisis directo · mode (a) verify). **Date:** 2026-06-24.
> Re-grep contra el frontend POST-merge de ds-adoption (`2b465e91`). Confirma la clasificación del architect en lo esencial. Twin = match de nombre contra las 82 stories de `@luana/ui-kit`.

## Balde (2) — port de pieza del kit → NO story, listar como deuda consumir-kit

| Componente | Twin kit | Nota |
|---|---|---|
| `components/ui/button.tsx` | `atoms.Button` | port standalone (barrel R0) |
| `components/ui/input.tsx` | `atoms.Input` | port |
| `components/ui/dialog.tsx` | `overlays.Dialog` | port |
| `components/ui/badge.tsx` | `atoms.Badge` | port |
| `components/ui/alert.tsx` | `overlays.Alert` | port |
| `components/ui/dropdown-menu.tsx` | `overlays.DropdownMenu` | port |
| `components/ui/skeleton.tsx` | `atoms.Skeleton` | port |
| `components/ui/tooltip.tsx` | `overlays.Tooltip` | port |
| `components/shared/shell-organism/SubSubTabsBar.tsx` | `shell.SubSubTabsBar` | port |

→ 9 ports. Deuda de convergencia = `ds-adoption` (cap `nicolify-ui-homologation` live). NO se les escribe story (el kit ya las tiene).

## Infra / no-storiable — wire / dispatcher / helper (listar en contrato como routing-infra, NO story · OQ-3 architect)

| Componente | Rol |
|---|---|
| `app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx` | wire de `shell.ShellLayout` del kit |
| `components/shared/shell-organism/SubTabContent.tsx` | dispatcher de contenido por sub-tab |
| `components/shared/shell-organism/SubSubTab.tsx` | fragmento de render hijo de SubSubTabsBar |
| `app/**/{page,layout,not-found}.tsx`, `providers.tsx`, `_agent-tw-classes.ts`, `types.ts` | rutas Next + helpers JIT — no son componentes visuales |

## Balde (3) — ÚNICO de nicolify → ESCRIBIR `.stories.tsx`

**Abel ICP (7):**
- `features/abel/components/icp/IcpCard.tsx`
- `features/abel/components/icp/IcpMasterListView.tsx`
- `features/abel/components/icp/IcpWorkspaceView.tsx`
- `features/abel/components/icp/IcpDatosForm.tsx`
- `features/abel/components/icp/BuyerLeafForm.tsx`
- `features/abel/components/icp/IcpEntityLayoutClient.tsx`
- `features/abel/components/icp/IcpIntakeOverlay.tsx`

**Moléculas / shell nicolify-only (10):**
- `components/shared/agents/AgentAvatar.tsx`
- `components/shared/ProposalBanner.tsx`
- `components/shared/DraftFirstStarter.tsx`
- `components/shared/WhatForChip.tsx`
- `components/shared/intake/UniversalIntake.tsx`
- `components/shared/shell-organism/AddAgencyPlaceholderModal.tsx`
- `components/shared/shell-organism/LogoMark.tsx`
- `components/shared/shell-organism/ThemeToggle.tsx`
- `components/shared/shell-organism/TenantSwitcher.tsx` (compone TenantBadge + TenantOption — storiar el switcher; badge/option como sub-stories o N/A)
- `components/shared/shell-organism/ConfigTab.tsx`

**Roster doc-story (1):** `Agentes/Roster` — los 6 agentes con avatar + color + pill status (construido|pendiente) · RN-8.

## Total

- **Balde-2 (ports):** 9 · **Infra:** ~5 · **Balde-3 (stories a escribir):** **17 component stories + 1 roster doc-story = 18**.
- Ajuste vs estimación del architect (15): +2/3 por contar TenantSwitcher/ConfigTab como stories propias (el architect los tenía como ports/infra). Decisión: **TenantSwitcher + ConfigTab SÍ son molécula nicolify-specific** (lógica de tenant/config propia, no port directo del kit) → story. TenantBadge/TenantOption = sub-partes de TenantSwitcher (sub-stories opcionales, no cuentan aparte).

## Verificación de gate (T-1)
- `classification_correct`: cada componente tiene balde asignado ✓ · cero balde-2 marcado para story · cero balde-3 omitido.
- Próximo: T-2 (infra storybook: decorators QueryClient+Clerk para organismos Abel) → T-3/T-4 stories → T-5 roster → T-6 poblar contrato.

state: pushed (análisis — sin código; el commit va con T-2+)
done -> T-1-result.md
