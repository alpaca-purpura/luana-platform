# Demo script — nicolify-r0-storybook-inventory (técnica · design-system)

> Story técnica: la "demo" = **navegar el Storybook + leer el contrato 1:1**. No hay writes a dev-app (no es funcional). Lo que se verifica: el storybook de marca está poblado + el mapa no miente.

## Cómo levantar

```bash
cd nicolify/frontend && pnpm storybook   # → http://localhost:6006
# (ya corriendo en esta sesión en :6006)
```

## Qué ejercer (checklist de Chris en G)

1. **Storybook de marca poblado** (antes 0 stories):
   - [ ] `Features/Abel/ICP/*` — 7 stories (IcpCard, IcpMasterListView, IcpWorkspaceView, IcpDatosForm, BuyerLeafForm, IcpEntityLayoutClient, IcpIntakeOverlay) renderizan.
   - [ ] `Shared/*` — 9 moléculas (AgentAvatar, ProposalBanner, DraftFirstStarter, WhatForChip, UniversalIntake, AddAgencyPlaceholderModal, LogoMark, ThemeToggle, TenantSwitcher) renderizan.
   - [ ] `Agentes/Roster` — los 6 agentes con avatar + color + **pill de status** (Construido: Abel/Luana · Pendiente: Brenda/Christian/Sara/Norvil). El mapa no miente.
2. **Tema:** toggle light/dark arriba → los componentes responden.
3. **Skin de marca compartido** (opcional): `cd core/@luana/ui-kit && pnpm storybook` → toolbar Marca → nicolify → los átomos compartidos en indigo #635BFF/pill.
4. **El contrato 1:1** (`nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md § 9`):
   - [ ] § 9.1 balde-3 (17 stories) · § 9.2 balde-2 (ports/deuda) · § 9.3 infra · § 9.4 roster · § 9.5 token-overrides.
   - [ ] Pregunta-test: "¿qué toco si cambio el radio de los inputs?" → § 9.5: `--radius-control` en `globals.css` (no el kit). El mapa contesta.

## Evidencia técnica (gates)

- `build-storybook` exit 0 (render-sanity 17/17).
- `eslint` 0 errores.
- `completeness_check` exit 0 (cero componente sin clasificar en el contrato).
- tsc limpio en stories (RED global = engine HB-109 zustand/persist, pre-existente, escalado /pm-luana).

## Firma

Si el storybook navega + el contrato mapea todo → firmás `chris_verify.signoff: SATISFIED`. Correcciones (ej. ConfigTab faltante, una story a pulir) → entran a `chris_verify.rounds`.
