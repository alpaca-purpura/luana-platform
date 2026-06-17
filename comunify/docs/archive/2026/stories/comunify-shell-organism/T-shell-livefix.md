# T-shell — live-verify fix log (2026-06-16)

> Origen: live-verify del shell en dev-app (`dev-app.comunifyagents.com`, Chrome DevTools MCP, usuario `hola@alpacapurpura.lat`). El build de T-shell salió con **121 tests verdes** pero **roto en vivo** — exactamente el valor del DoD #37 (verde ≠ funciona). El chrome ahora **carga + es navegable**; quedan defectos visuales/data que son material de un ciclo `builder-frontend` sobre T-shell.

## ✅ Fixes aplicados (en vivo, commiteados)

| # | Bug (síntoma live) | Root cause | Fix |
|---|---|---|---|
| 1 | **Login loop infinito** | post-login → `/` → `redirect("/sign-in")`; Clerk con sesión activa → `AFTER_SIGN_IN_URL=/` → loop. (el choose-organization task ya estaba off — no era eso) | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/comunify-demo/nina/marca` en `.env.dev` (gitignored) + **recreate** del contenedor (un `docker restart` NO recarga `env_file`) |
| 2 | **BE FE boot crash-loop** (FE 000, RestartCount↑) | cold-compile del shell (`@luana/ui-kit` completo, Turbopack) reventaba V8 con `--max-old-space-size=768`; antes lo tapaba el `.next` caliente | `docker-compose.dev.yml`: heap `768→2048` + mem `1G→3G` |
| 3 | **404 en sub-tabs con N3** (marca/ofertas/comunidad/cuenta) | `[subtab]/page.tsx` hacía `redirect()` a `/{...}/{subsubtab}` pero la ruta `[subsubtab]/page.tsx` **no existía** | agregué `[agent]/[subtab]/[subsubtab]/page.tsx` (espejo del subtab, valida whitelist + render `SubTabContent`) |
| 4 | **"Rendered more hooks than during the previous render"** (500, pantalla no carga) | el `redirect()` IN-RENDER del subtab→N3 dispara el bug Next 16 soft-nav (learning `2026-06-03-next16-softnav-redirect-rendered-more-hooks`) | quité el redirect in-render de `[subtab]/page.tsx` (render directo; N3 reachable por su ruta + SubSubTabsBar). Si se quiere "auto-land en 1er N3" → al EDGE (proxy.ts), como vitalia |

Resultado: login OK · shell carga · Ribbon (Nina·Tomás·Sofía·Bruno·Lucía·Plataforma·Config) + sub-tabs + placeholders "en construcción" navegables · theme toggle.

## ✅ T-shell fix 2026-06-16 (builder-frontend · A/B/C resueltos + live-verified DoD #37)

| # | Defecto | Root cause REAL | Fix aplicado | Live-verify (Chrome MCP, dev-app) |
|---|---|---|---|---|
| A | **Avatares del Ribbon gigantes (~300px)** | DOS causas combinadas: (1) `@source` en glob `".../src/**/*.{ts,tsx}"` no aterrizaba las utilidades del kit en el stylesheet del **cliente** bajo Turbopack — vitalia usa **bare-dir** `".../src"`; (2) el chunk dev `[root-of-the-server]__*.css` tiene **nombre estable** entre rebuilds → el browser reusaba el CSSOM **cacheado viejo** (un `reload` no lo soltaba; `fetch(cache:'reload')` SÍ traía el size-7 → confirmó que el byte estaba bien y la cache era el culpable). 300px = **ninguna** clase del kit aplicada (ni `h-10` base), no sólo `size-7`. | `globals.css`: `@source` → **bare-dir** verbatim de vitalia. + limpiar `.next` del contenedor FE + restart (el hard-reload del browser NO limpia el `.next` compilado del server). | ✅ avatares **28px** (`size-7`) en **fresh load** normal · `size7InCss:true` · screenshot ribbon limpio. |
| B | **Sidebar Luana no renderiza** (panel izq vacío) | **Misma causa raíz que A** (clases de layout del kit no generadas en el cliente → el dual-pane colapsaba a 0px). Confirmada la hipótesis original del log. | Resuelto **por el fix de A** (cero código extra). | ✅ `luana-sidebar`/`supervisor-panel` monta **382px** full-height con `chat-header`/`chat-messages`/`chat-composer`/`supervisor-avatar` presentes. (El chat muestra el agente activo Nina; el cableado supervisor-identity/chat real = defect D / engine B). |
| C | **`useTenantId` usa Clerk org** | `use-tenant-id.ts` retornaba `useOrganization().id ?? useUser().id` — viola `no-clerk-organizations` (`org_xxx` no es UUID → 500 en data real). | `use-tenant-id.ts` reescrito al patrón vitalia post-fix: lee **sólo** `user.publicMetadata.tenant_id`, dropea `useOrganization`. + test `lib/__tests__/use-tenant-id.test.tsx` (5 casos, el mock provee sólo `useUser` → guarda el no-org). tsc/eslint/vitest verde. | ✅ live: `publicMetadata = {role:"owner"}` → hook resuelve `null` (sin `org_xxx`, sin crash). **Data path real sigue gateado por el seed de tenant comunify en iam** (escribir `tenant_id` en publicMetadata) — pendiente conocido, NO regresión. |
| D | **Chat de Luana 404** | endpoint `/api/v1/comunify/copilot/chat` **guardado** (404) — motor copilot no brand-mountable. | NO es T-shell — **engine fix B** (proposal `2026-06-16-copilot-chat-brand-mountable.md`, accepted). T-agentic v2 lo re-cablea cuando aterrice. | n/a (probe live = 404 esperado). |

### Regla cazada (para el harness / cross-brand)
- **Dev cache-trap del shell:** un chunk CSS dev con nombre estable (`[root-of-the-server]__*.css`) + cache-control con TTL hace que el browser sirva CSS viejo aunque el fix esté en disco. La live-verify honesta exige **limpiar `.next` + restart del contenedor FE** (no basta hard-reload del browser). Diagnóstico decisivo: `fetch(href,{cache:'reload'})` devolvía la clase, el `document.styleSheets` cacheado no. (Refuerza dev-infra-triple: deps del FE de comunify → rebuild imagen; CSS del kit → limpiar `.next`.)
- **`@source` del kit = bare-dir, no glob:** copiar verbatim la forma de vitalia (`".../core/@luana/ui-kit/src"`), no `".../**/*.{ts,tsx}"`.

### Defectos cosméticos nuevos observados (fuera de A/B/C — follow-up, NO bloquean)
- LogoMark top-izq: warning Next/Image "width/height modified but not both" → logo distorsionado/superpuesto. Fix trivial (`height:auto`), 1 archivo — diferido (no estaba en scope A/B/C).
- `public/agents/plataforma/avatar.svg` → 500 (asset placeholder faltante); el RibbonTab cae al fallback (inicial "P"), no rompe. (Avatares = placeholders hasta que Chris entregue finales.)
- `favicon.ico` → 500 (cosmético).

## Notas de entorno (no-commiteables / runtime)
- 4 usuarios Clerk de prueba creados (3 `@example.com` + `hola@alpacapurpura.lat`), emails verificados, password-enabled.
- Túnel cloudflared comunify levantado (`make dev-comunify-tunnel`) — era opt-in, estaba apagado.
- `AFTER_SIGN_IN_URL` apunta a un slug demo fijo (`comunify-demo`) — `# ponytail`: provisional para el demo; el resolver real user→tenant es parte de (C).
