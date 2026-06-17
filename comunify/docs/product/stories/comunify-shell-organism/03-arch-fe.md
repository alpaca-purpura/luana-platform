# 03-arch-fe — comunify-shell-organism (FRONTEND surface)

> Surface-specific slice. SSoT consolidado: `03-arch.md` (§ 5 TS types, § 10 file structure, § 11 cross-cutting, Resolución puntos 4+5).
> Owner: **`builder-frontend` (workhorse)** · Auditor: **`auditor-frontend` (flagship)**.
> Goldens: `mockups/shell.html` (visual) + `design-inventory.md` (átomos/moléculas/organismos) + `design-system.md` (tokens) + `navigation-tree.md` (sitemap v2).

## Regla de oro — CONSUME del kit, NO mirror

El shell consume `@luana/ui-kit@0.4.1` (`organism/shell/index.ts` reexporta ShellLayout/Ribbon/ChatPanel/SupervisorSidebar/ConfigTab/SubTabsBar/EmptyState/DelegateMarker/create-shell-store/routing/useKeyboardShortcuts/useViewportGuard + átomos). comunify aporta SOLO: tokens + config + thin wrappers de marca + chat-store + el wrapper de ruta. **Cero copia de organismos del kit ni de los locals de nicolify** (anti-dup Cat 12).

## Tickets FE (4) — ver `06-tickets.yaml`

1. **T-tokens** — `globals.css` + `tailwind.config.ts` + fonts (Satoshi/Manrope/Inter). ⚠️ Incluir el path del kit en el Tailwind `content`/`@source` scan (memoria `tailwind-jit-scan-breaks-on-lift` — sin esto el kit pierde estilos; gate = visual e2e). Radius pill = controles `rounded-full` (clase literal, ya en el kit) + cards/burbujas `--radius-lg`; `--radius` se mantiene 0.75rem (token-driven, ver 03-arch Resolución punto 4).
2. **T-shell-wrapper** — `app/[tenantId]/(shell-organism)/{layout,page,_components/ShellLayoutWire,[agent]/...}` + `lib/routing/shell-routes.ts` + `lib/agents.ts` + `components/shared/shell-organism/{AgentAvatar,LogoMark,ThemeToggle,TenantSwitcher,_agent-tw-classes}` + `stores/shell-store.ts` + `proxy.ts` edge-redirect + retire `(dashboard)` del routing. Port re-temizado de nicolify.
3. **T-chat-store** — `stores/chat-store.ts` SSE real (depende del mount BE de T-agentic). LIFT CANDIDATE.

## Contrato chat-store (kit `ShellChatStoreApi` — importar tipos del kit, NO redefinir)

```ts
import type { ShellChatMessage, ShellChatStatus } from "@luana/ui-kit";
// el kit SOLO lee: messages, conversations, activeAgent, status,
//                  sendMessage, clearMessages, newConversation, setActiveAgent
```

`sendMessage(content)` de comunify = **SSE real** (no mock setTimeout como nicolify/vitalia):
1. push burbuja `user` + `status='thinking'` (composer bloqueado).
2. `fetchClient` POST SSE `/api/v1/comunify/copilot/chat` (auto-inyecta `X-Tenant-ID` + Bearer).
3. `status='streaming'` al primer `block_delta`; append incremental a la burbuja `bot`.
4. `message_end`/`done` → `status='idle'`.
5. `error` (5xx) → estado `error` (SC-chat-error) + Reintentar (sin perder el msg del user).
6. timeout/abort red → estado `network` (SC-chat-network) + Reintentar.
7. doble-envío: si `status ∈ {thinking,streaming}` → ignora el 2º (SC-chat-double-send, un request en vuelo).

## Inyección en el kit (port nicolify)

```ts
<ShellLayout
  supervisorName="Luana" supervisorSlug="luana"
  agentCatalog={RIBBON_CATALOG} ribbonOrder={[...nina,tomas,sofia,bruno,lucia,'plataforma']}
  subTabsByAgent={SUB_TABS} getAgentClasses={getAgentClasses}
  useShellStore={useShellStoreKit}
  useChatStore={useChatStore as unknown as ShellChatStore}
  splitGroupId="comunify-shell-split" logoSlot={LOGO} rightClusterSlot={THEME+TENANT}
  testIds={TEST_IDS} pathname={pathname} configTabSlug="plataforma" configTabLabel="Plataforma"
/>
```

## Cross-cutting (HARD)
- `useTenantId()` (iam) — NUNCA `useAuth().orgId` (arch-test `test-no-clerk-organizations`).
- Edge-redirect (`proxy.ts`) — NUNCA `redirect()` in-render (learning Next 16 soft-nav).
- SSR-safe: el kit hidrata su store en chunk `dynamic({ssr:false})`; skeleton store-free (ADR-vitalia-006).
- Tokens, no hardcoded hex (arch-test no-hardcoded-hex). Spanish neutro (pre-commit §1). Server-first; `"use client"` solo en wire + chat-store consumers.

## NEVER-TOUCH
- `core/@luana/ui-kit/src/**` (kit — consume; cambio = `/pm-luana` lift).
- `app/onboarding/**` (wizard intacto). `app/(dashboard)/**` (retirar del routing, NO refactorizar contenido).
- `nicolify/**` · `vitalia/**` (cross-brand — REFERENCE read-only, nunca importar).
