---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
schema_version: v4.1
---

# 05-guidelines — nicolify-r0-storybook-inventory

> Reglas de implementación para `builder-frontend`. Naturaleza técnica (design-system inventory). NO hay BE, NO hay agentic, NO hay rutas de usuario.

## must_load_skills (verbatim — cargar antes de tocar nada)

- `nicolify-design-system` — índice DS nicolify (Storybook-first). Tokens en `globals.css`, balde-1 en el kit.
- `frontend-expert` — CSF3, FSD-Lite, React Query, patrón de decorators.
- Rule `.claude/rules/frontend-visual-fidelity.md § Storybook` — doctrina binding (canon §5: partir de Storybook + promover).
- `docs/architecture/luana-platform/design-system-canon.md §5` — bucle de los 5 actores.
- `nicolify/.claude/rules/shell-mockup-per-component.md` (Storybook-first) — overlay nicolify.
- Storybook CSF3 conventions — `Meta` + `StoryObj` (replicar de `vitalia/.../AgentAvatar.stories.tsx` + el set del kit).
- shadcn-ui — los átomos del kit siguen el patrón Shadcn (entender la API de los componentes que las stories componen).

## must_load_artifacts

- `03-arch.md` (consolidado) + `03-arch-fe.md` + `03-arch-docs.md` (esta story).
- `01-spec.md` (el contrato ratificado — RN-1..8, AC-1..6, § baldes, § Roster, § Modelo de divergencia).
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` (el documento a subir a 1:1).
- `core/@luana/ui-kit/stories/*` (las 82 stories del kit — referencia de convención + balde-1 a citar).
- `vitalia/frontend/src/components/shared/agents/AgentAvatar.stories.tsx` (patrón a espejar para nicolify AgentAvatar).
- Los `.test.tsx` de Abel ICP (`IcpMasterListView.test.tsx` etc.) — el patrón de mock Clerk/RQ/router a traducir a decorator.

## Patterns required

1. **CSF3** — `const meta: Meta<typeof X> = {...}; export default meta; export const Story: StoryObj<typeof X> = {...}`. `tags: ["autodocs"]`. `argTypes` con controls por prop.
2. **Co-locación** — `Componente.stories.tsx` JUNTO al `Componente.tsx` (mismo dir). El glob `main.ts::stories` las descubre.
3. **`title` jerárquico** — `Abel/ICP/*` (Grupo A), `Shared/*` (Grupo B), `Agentes/Roster` (Grupo C). Espeja la jerarquía de vitalia/kit.
4. **Una story por estado discreto** — idle/selected/loading/error/empty/etc. (columna "Estados" del 03-arch). NO una sola story genérica.
5. **Decorators para deps** (containers Abel ICP):
   - `appDirectory: true` en `preview.ts` + `parameters.nextjs.navigation.params` por-story (next/navigation).
   - `withSeededQuery((qc) => qc.setQueryData(<key-verbatim>, fixture))` (React Query). Keys: `['abel','icp','list']`, `['abel','icp',id]`, `['abel','buyer','list',icpId]`.
   - module-mock `@clerk/nextjs` + `use-tenant-id` en `.storybook/mocks/` (NO per-story).
   - fixtures sintéticas en `.storybook/fixtures/abel-icp.ts` (LatAm B2B, spanish neutro).
6. **Consumir tokens nicolify** — clases Tailwind mapeadas a `globals.css` (ya importado en `preview.ts`). Colores agent vía `--agent-{slug}`.
7. **Roster doc-story** — estilo `foundations.AgentColors` del kit: un `render: () => (...)` que compone `AgentAvatar` + pill de status. Helper de status inline o en `.storybook/` (NO en `features/`).
8. **Contrato 1:1** — extender `SHELL-DESIGN-CONTRACT.md` (conservar § normativas, AGREGAR § descriptivas). Cada componente brand-local = una fila con balde. Linkear balde-3 a su story por `title`.

## Patterns forbidden

- ❌ **Re-storiar un átomo/molécula/shell del kit (balde 1/2).** Los compartidos se ven en el storybook del KIT con `brand=nicolify`. Los ports (balde 2) se LISTAN marcados "consumir-kit", NO se les escribe story.
- ❌ **Editar `core/@luana/ui-kit/src/`** (engine — `/pm-luana` lift). Solo consumir + citar story por id.
- ❌ **Editar otras marcas** (vitalia/comunify/lupulo) — solo LEER vitalia como modelo.
- ❌ **Reescribir un componente de producto** (`features/abel/**/*.tsx`, `components/**/*.tsx` runtime) para hacerlo "storybook-friendly". El decorator inyecta el entorno; el componente se storia tal cual.
- ❌ **Story falsa de un agente/componente inexistente** (Brenda/Christian/Sara/Norvil aún no construidos como código → roster con `status: pendiente`, NUNCA `.stories.tsx` de un componente que no existe — RN-8).
- ❌ **Inventar CSS / hex / px / arbitrary-value** en las stories (RN-5 · `@luana/ds/no-arbitrary-value` es eslint error).
- ❌ **Crear un componente de producto con nombre de primitiva pelado** en `features/` (HB-107 ratchet baseline 0). El helper de status del roster va en `.storybook/`, no en `features/`.
- ❌ **Subir el baseline** de los ratchets HB-106 (`no-div-layout` 39, `no-native-select` 1) — cero layout-div crudo, cero `<select>` nativo en stories.
- ❌ **`vi.mock` en stories** (eso es Vitest) — Storybook usa decorators + module-mocks de `@storybook/nextjs-vite`.
- ❌ **MSW** — usar cache-seed (`qc.setQueryData`), no introducir dep nueva.
- ❌ **Voseo** en strings/fixtures user-facing (tuteo, neutro LatAm).

## Files in scope (lo que el builder PUEDE tocar)

- `nicolify/frontend/src/**/*.stories.tsx` (crear, co-locadas).
- `nicolify/frontend/.storybook/preview.ts` (modificar: appDirectory).
- `nicolify/frontend/.storybook/{decorators,mocks,fixtures}/**` (crear).
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` (extender a 1:1).

## NEVER touches (HARD)

- `core/@luana/ui-kit/src/**` · `core/luana-core-*/src/**` (engine — lift gate).
- `vitalia/**` · `comunify/**` · `lupulo/**` (cross-brand).
- `nicolify/frontend/src/components/**/*.tsx` runtime (no-story) · `nicolify/frontend/src/features/abel/**/*.tsx` runtime (solo storiar, NO modificar).
- `.claude/**` (harness — NUNCA mid-feature).
- BE (`nicolify/backend/**`) — no hay surface BE en esta story.

## Owner eligibility

- **builder-frontend** (workhorse). FE no-agentic. R23 NO aplica (no es agentic production_code → NO flagship). Las `.stories.tsx` son `production_code: true` (FE); el `.md` del contrato es `production_code: false` (docs) pero lo construye el mismo lane (deriva del inventario).
