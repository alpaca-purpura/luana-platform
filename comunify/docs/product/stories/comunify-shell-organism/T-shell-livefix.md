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

## 🔴 Pendiente — T-shell fix (builder-frontend)

| # | Defecto | Diagnóstico | Pista de fix |
|---|---|---|---|
| A | **Avatares del Ribbon gigantes (~300px)** | el kit usa `<Avatar className="size-7">`; Tailwind v4 **no genera `.size-7` en el bundle del cliente** pese al `@source`. Probado `@source` bare-dir (forma de vitalia) → no; `@source ".../**/*.{ts,tsx}"` → `.size-7` aparece en un chunk **server** (`.next/dev/.../[root-of-the-server]*.css`) pero **NO en el stylesheet que carga el browser** (`size7_in_css:false` vía evaluate_script, hard-reload). vitalia con `@source` idéntico SÍ anda. | Bug de chunking Tailwind-v4 + Turbopack específico de comunify. Investigar: postcss config / orden `@import`+`@source`+`@theme` / si comunify necesita `next dev --webpack` (como nicolify) en vez de Turbopack / diferencia exacta vs vitalia. El `@source` glob ya quedó en `globals.css`. |
| B | **Sidebar Luana no renderiza** (panel izq vacío) | el `ShellLayoutWire` debería montar el `SupervisorSidebar`/`ChatPanel` del kit a la izquierda; en vivo solo aparece el panel app (Ribbon). | Revisar el wire del kit `ShellLayout`/`ShellLayoutClient` (split dual-pane) + la inyección del `useChatStore`. Posible relación con (A) (clases de layout del kit no generadas). |
| C | **`useTenantId` usa Clerk org** | `comunify/frontend/src/lib/use-tenant-id.ts` retorna `useOrganization().id ?? useUser().id` — **viola `no-clerk-organizations`** (mismo bug sistémico que vitalia arregló: 35 archivos, 500 en data real). Por eso "tenant binding pendiente". | Cambiar `useTenantId` a leer de iam / `publicMetadata.tenant_id` (patrón vitalia post-fix). Requiere seed de tenant comunify en iam + binding del usuario. Para el chrome estático no molesta; para data real sí. |
| D | **Chat de Luana 404** | el endpoint `/api/v1/comunify/copilot/chat` está **guardado** (404) — motor copilot no brand-mountable. | NO es T-shell — es el **fix de engine B** (`/pm-luana` proposal `2026-06-16-copilot-chat-brand-mountable.md`, en vitalia). T-agentic v2 lo re-cablea cuando aterrice. |

## Notas de entorno (no-commiteables / runtime)
- 4 usuarios Clerk de prueba creados (3 `@example.com` + `hola@alpacapurpura.lat`), emails verificados, password-enabled.
- Túnel cloudflared comunify levantado (`make dev-comunify-tunnel`) — era opt-in, estaba apagado.
- `AFTER_SIGN_IN_URL` apunta a un slug demo fijo (`comunify-demo`) — `# ponytail`: provisional para el demo; el resolver real user→tenant es parte de (C).
