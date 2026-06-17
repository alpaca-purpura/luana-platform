---
ticket: T-chat-store
brand: comunify
story: comunify-shell-organism
state: built
commit: ef3279e8
pushed_to: wip/comunify
date: 2026-06-15
---

# T-chat-store — Result

## Files created (2)

1. `comunify/frontend/src/stores/chat-store.ts` — Zustand store implementing `ShellChatStoreApi`
2. `comunify/frontend/src/stores/__tests__/chat-store.test.ts` — 18 unit tests

## Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src/stores/` | 0 errors, 0 warnings |
| `vitest run src/stores/` | 18/18 PASS |
| cap-format G1 | resolved to `comunify-shell-organism` |

## Scenarios covered

| SC | Description | Result |
|---|---|---|
| SC-chat-ok | SSE happy path: thinking→streaming→idle, content accumulated | PASS |
| SC-chat-error | 5xx → status "error", bot bubble removed, user msg kept | PASS |
| SC-chat-network | AbortError / null body → status "network" | PASS |
| SC-chat-double-send | Second sendMessage while thinking/streaming is no-op | PASS |
| SC-chat-delegate | agentic-no-domain-write: only /copilot/chat called | PASS |

## Key design decisions

- **Extended internal type** `ChatStoreStatus = ShellChatStatus | "error" | "network"` — kit's `ShellChatStatus` lacks error/network; injection site uses `as unknown as ShellChatStore` cast per 03-arch-fe.md.
- **Auth via `setAuthContext(token, tenantId)`** — Zustand store can't call hooks; ShellLayoutWire (T-shell) calls `setAuthContext` from a `useEffect` with `useAuth()` + `useTenantId()`.
- **SSE via raw `fetch()` + ReadableStream** — `EventSource` only supports GET; POST requires fetch streaming.
- **`_hasHydrated: true` stub** — chat is ephemeral (no localStorage persist); stub satisfies the `SsrSafeHydration` interface shape for the cast.
- **`conversations` field** — initialized as `[]`; `newConversation()` archives current messages.
- **LIFT CANDIDATE** header comment in file line 1 per spec.
- **cap header** `// cap: comunify-shell-organism` (cap_id format, resolves to `platform/shell-organism.yaml`).

## Skills consulted

| Skill | Why | Decision |
|---|---|---|
| frontend-expert | FSD-Lite structure, Zustand patterns, ESLint gates | `stores/` at `src/stores/`, no default exports, named export `useChatStore` |
| copilot-expert | SSE event protocol, chat.py event types | Used SSE event types from `luana_core_copilot/api/chat.py`: message_start, block_delta, message_end, done, error |
| tenant-isolation | X-Tenant-ID injection pattern for Zustand (not a React hook) | Explicit `setAuthContext(token, tenantId)` setter; never `useAuth().orgId` |

## Acceptance validators

- `nf-fe-tsc` — PASS (0 errors)
- `nf-fe-eslint` — PASS (0 errors)
- `agentic-no-domain-write` — PASS (SC-chat-delegate asserts only `/copilot/chat` called)

## What T-shell must do (injection wiring, NOT this ticket's scope)

```tsx
// In ShellLayoutWire (T-shell ticket):
const { getToken } = useAuth();
const tenantId = useTenantId();
const setAuthContext = useChatStore((s) => s.setAuthContext);

useEffect(() => {
  async function arm() {
    const token = await getToken();
    if (token && tenantId) setAuthContext(token, tenantId);
  }
  void arm();
}, [getToken, tenantId, setAuthContext]);

// Injection:
<ShellLayout useChatStore={useChatStore as unknown as ShellChatStore} ... />
```
