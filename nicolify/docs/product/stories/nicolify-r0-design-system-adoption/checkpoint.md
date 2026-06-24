---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
type: ui-story                       # adopción visual cross-cutting — todas las hojas re-expresadas vía primitivas compartidas (esencia homologada · valores de marca propios)
state: reviewing                     # idea → refining → refined → ready → developing → developed → reviewing → done · /auditor pickup 2026-06-24 (reconciled:true + chris_verify.signoff SATISFIED)
release: R0                          # Fundación — homologar ANTES de crecer (ADR-014 HARD: "empezar homologado")
map_zone: infraestructura            # paradigma 3 zonas — atributo de calidad (consistencia UI cross-hoja) · derivada de SYSTEM-MAP::zones (a confirmar /architect)
map_box: plataforma-tecnica
map_area: design-system
module: design-system                # bucket code:design-system · toca nicolify/frontend/src broad + globals.css
architecture_pattern: ADR-014-design-system-homologation   # doctrina platform que implementa (5 capas + enforcement mecánico) + HARD cumplir SHELL-DESIGN-CONTRACT.md
cap_target: design-system/nicolify-ui-homologation
cap_change_type: new                 # NUEVA cap (no existía design-system/nicolify-ui-homologation) — 03-arch crea el YAML schema v2. (revert de un flip erróneo del commit worker 3bbbabea: "adopción cero-creación de COMPONENTES" ≠ "no cap nueva"; el cap protocol mira la cap, no los componentes)
route: null                          # cross-cutting — no es una hoja con ruta única
demo_required: true                  # visual: las hojas deben render idéntico/mejor, cero regresión
last_modified: 2026-06-24
phase: HANDOFF_TO_PM_MERGE            # /auditor APPROVED 2026-06-24 (Auditor Responsable v5). Carril R/A fixes aplicados (test-ds stale + eslint config dedup + prettier autofix); engine tsc #3 → /pm-luana HB-109. → /pm-nicolify merge.
audit_verdict: APPROVED              # /auditor 2026-06-24 · CHECKPOINTS.md C1-C5 · gherkin 6/6 PASS · surface nicolify 100% verde
audit_fixes:                         # fixes del auditor (Carril R/A) durante reviewing — re-verificados verdes
  - "Carril R · test-ds-single-token-source.test.ts:168 — anti-FOUC stale (testeaba el script borrado por 42f759c8) → reescrito a next-themes + suppressHydrationWarning. test-ds 47/47."
  - "Carril R · eslint.config.mjs — dedup @typescript-eslint (next/typescript vs tseslint) → eslint corre + ds-lock activo. 0 errores."
  - "Carril A · eslint --fix prettier en src/__tests__/architecture/ (8 errores de HB-106 825ec59a). 0 errores restantes."
  - "Boundary · #3 tsc engine core/@luana/hooks (zustand persist, pre-existente HB-78) → flag /pm-luana HB-109. nicolify src tsc limpio. NO bloquea."
gate_state_final:                    # tras fixes del auditor (re-verificado 2026-06-24)
  tsc: "nicolify src 0 errores (único: engine core/@luana/hooks → HB-109 out-of-scope)"
  eslint: "0 errores (219 warnings pre-existentes, no bloquean)"
  vitest: "549/549 (incl. arch suite 191)"
  live_verify_37: "satisfecha (write PATCH 200 + persist + dark toggle real x3 + pill — Chrome MCP)"
gherkin_matrix: 06-audit/gherkin-matrix.md
dod_live_verified: true              # estructural — ejercido live en dev-app nicolify (Chrome DevTools MCP) 2026-06-15
dod_env: "docker dev stack (BE :8001 + FE :3001) · Chrome DevTools MCP · tenant alpaca-purpura (7f464ab7) · owner.demo@nicolify.com"
dod_evidence:
  - action: "Login Clerk (owner.demo@nicolify.com) → /alpaca-purpura/abel/icp → master render"
    observed: "shell homologado: Ribbon 5 agentes (Abel/Brenda/Christian/Sara·Próximamente/Norvil/Configurar) + Luana sidebar orquestador + kit EmptyState ('Define tu cliente ideal' + CTAs) + kit ListPageSkeleton de carga"
    backend_log: "GET /api/v1/abel/icp 200 OK ×2 · sin traceback"
  - action: "Click 'Empezar en blanco' (CREATE write)"
    observed: "navegó a /abel/icp/82aa34d1-.../datos = EntityWorkspaceLayout + EntitySubNavBar N3 (ICPs ‹ · Nuevo ICP · Datos del ICP · + buyer) + Group sections (Identidad/Firmográficos/Dolor/Señales/Anti-patrón) con tooltips + autosave indicator — todo compuesto de @luana/ui-kit"
    backend_log: "icp_created icp_id=82aa34d1 tenant_id=7f464ab7 · POST /api/v1/abel/icp 201 Created"
  - action: "Editar 'Nombre del ICP' → 'ICP Live-Verify DS-Adoption 2026-06-15' (AUTOSAVE write)"
    observed: "autosave disparó; refetch del detalle tras guardar"
    backend_log: "PATCH /api/v1/abel/icp/82aa34d1 200 OK · GET .../82aa34d1 200 (persistencia confirmada)"
  - console: "1 error pre-existente (GET /agents/config/avatar.svg 500 = avatar placeholder de config, NO regresión de adopción — shell cap E4 'avatar fallback'); 0 errores de adopción, sin burbuja de hidratación, /abel/icp todo 200/201"
  - action: "PILL controls live-verify (G round-2, Chrome DevTools MCP /abel/icp autenticado, 2026-06-16)"
    observed: "getComputedStyle(documentElement)['--radius-control'] = 9999px; 4 control atoms con clase rounded-control → border-radius 9999px (allPill=true); botón 'Nuevo ICP' pill (screenshot). Shell homologado render OK."
    backend_log: "GET/POST /api/v1/abel/icp 200; CSS compilado del dev server `.rounded-control{border-radius:var(--radius-control)}` (antes del fix: 0 ocurrencias). 500s = avatar.svg placeholder conocido + PG-restart transitorio, NO adopción."
  - action: "Toggle dark/light en /christian/pipeline (DARK MODE — G round-1 fix, Chrome DevTools MCP, 2026-06-16)"
    observed: "body bg conmuta white(rgb255,255,255)↔deep-indigo(rgb18,18,28); dark:hidden (logo swap) display block→none conmuta=true (dark: variant honra el toggle data-theme); todo el shell (Ribbon + Luana sidebar + EmptyState + kit molecules) renderiza dark correcto. Screenshots dark-fix-{light,dark}.png"
    backend_log: "compiled CSS vivo: media_prefers dark rules=0 (dark: ya NO usa @media prefers-color-scheme); console solo warns CSS-preload + 1 WebSocket-HMR reset (dev-infra footgun), 0 errores de dark"
verified_at: 2026-06-16
dod_caveats:
  - "PILL controls (RN-7) ✅ VERIFICADO live (G round-2, 2026-06-16) — kit-lift aterrizó (@luana/ui-kit 0.6.0, control atoms usan `rounded-control`). Live-verify Chrome DevTools MCP /abel/icp autenticado: `--radius-control` resuelve 9999px; 4 control atoms render pill (border-radius 9999px, allPill=true); botón 'Nuevo ICP' pill. Golden atoms.png capturado (pill real, no skeleton)."
  - "Goldens A/C1/C2/D (tokens-swatch/master/detail/states) AÚN sin baseline — pre-existente (round-1 deferred por inestabilidad de stack), NO introducido en round-2. Follow-up con stack estable (C2 detail además requiere seed ICP válido)."
  - "FE dev-server (webpack, ~83% de 3GiB) reinicia en loop → cold-compile de /abel/icp (~20s) puede dejar 'Cargando' >15s o resetear socket → golden flaky (cae en el HB-68 guard, NO falso-verde). Dev-infra footgun, NO bug de adopción (BE 200/201/PATCH-200). Harness-issue capturado (dev-stack memory + CLERK_TESTING_TOKEN ausente)."
chris_verify:
  required: true
  signoff:                           # ✅ 2026-06-24 — Chris delegó la live-verify a Claude (Chrome DevTools MCP) + pre-autorizó cierre ("si me dices que ya está, pues lo cerramos")
    by: "Chris (delegó live-verify a Claude · pre-autorizó cierre)"
    date: 2026-06-24
    result: SATISFIED
    notes: >
      Claude live-verificó el FE homologado en dev-app.nicolify.com (Clerk owner.demo@nicolify.com, tenant 7f464ab7):
      (1) LOGIN redirect afterSignIn=/ → aterriza en /…/christian/pipeline, 0 'Rendered more hooks', edge-redirect proxy.ts (GET / 307).
      (2) DARK toggle REAL (click del botón) ×3 en AMBAS direcciones LIMPIO: data-theme dark↔light, htmlClass='' SIEMPRE
          (la clase .dark ya NUNCA queda pegada = el bug de round-3 resuelto), bodyBg rgb(18,18,28)↔rgb(255,255,255),
          persiste localStorage nicolify-theme, 0 reglas @media prefers-color-scheme. Banner/molecules honran dark.
      (3) PILL controls: --radius-control=9999px (vive en @theme), 4 control atoms border-radius 9999px.
      (4) WRITE autosave: PATCH /api/v1/abel/icp/82aa34d1 200 + valor persiste tras reload (Vertical/industria).
      Motivo real confirmado = el mismo mecanismo de vitalia (single-axis data-theme + anti-FOUC de next-themes, sin script custom);
      el port a nicolify había dropeado eso → 42f759c8 lo alineó. Cero engine. 500s = avatar.svg/favicon placeholder (no regresión).
    open_items: []
  rounds:
    - date: 2026-06-16
      by: Chris
      finding: "Dark mode NO funciona tras adoptar el organism shell del kit."
      root_cause: "BUG-A (switch): falta cableado del dark variant (sin tailwind.config/@config/@custom-variant) → en Tailwind v4 los dark: variants usan @media prefers-color-scheme e ignoran el toggle data-theme=dark de next-themes; estilos por CSS-var sí conmutan, dark: literal del kit (AutosaveBadge/alert/chart/FloatingAutosaveIndicator) + propios (badge/dropdown/input/alert/LogoMark) NO. BUG-B (scan): @source solo escanea organism/shell; los molecules consumidos (EntityWorkspaceLayout/EntitySubNavBar/Group/AutosaveBadge) viven en src/ raíz → clases dark: no se generan por JIT. Precedente vitalia tiene tailwind.config darkMode + @config + @source ui-kit/src completo; el port a nicolify dropeó las 3."
      scope: "EN SCOPE de la story (homologación = honrar tokens compartidos en dark). Fix brand ≈3 cambios espejo vitalia + re-live-verify ejerciendo el toggle dark (lo que faltó en la live-verify estructural)."
      core_concern: "Kit shippea dark: variants sin css/@custom-variant ni cláusula de dark-wiring en SHELL-DESIGN-CONTRACT → proposal /pm-luana (dark-contract del kit + arch-test consumer)."
      resolution: fixed-pending-chris-reverify   # /dev-team fix-round aplicado + live-verified 2026-06-16. Chris re-ejerce el toggle en G + firma.
      fix:
        commits: [b09bc9dc]
        changes:
          - "globals.css: @custom-variant dark (&:where(.dark, .dark *, [data-theme=\"dark\"], [data-theme=\"dark\"] *)) — idiom v4-puro, homologa el EFECTO no el mecanismo de vitalia (@config)"
          - "globals.css: @source widened organism/shell → core/@luana/ui-kit/src completo (= vitalia)"
          - "test-ds-single-token-source.test.ts: +3 regression tests (custom-variant data-theme + .dark + @source whole-src)"
        live_verify: "Chrome DevTools MCP en /christian/pipeline (sesión autenticada). dark:hidden (logo swap) display block(light)→none(dark) conmuta=true; body bg white↔rgb(18,18,28); compiled CSS media_prefers=0 (dark: ya NO usa media query). Screenshots dark-fix-{light,dark}.png. Console: solo warns CSS-preload + 1 WebSocket-HMR reset (dev-infra footgun conocido), 0 errores de dark."
        gates: "tsc 0 · arch suite 179/179 (+3) · eslint 0"
      core_followup: "PENDIENTE /pm-luana — proposal dark-contract del kit (NO en esta story)."
    - date: 2026-06-16
      by: Claude (live-verify G round-2 · directive /pm-nicolify de Chris)
      finding: "Controles del kit (Button/Input/Select/Textarea) renderizan CUADRADOS, no pill, tras aterrizar el kit-lift."
      root_cause: "El kit-lift (@luana/ui-kit 0.6.0) cambió los control atoms a la clase `rounded-control`. nicolify declaró `--radius-control: var(--radius-pill)` en `:root` (no en `@theme`). En Tailwind v4 la utilidad `rounded-control` SOLO se genera desde una var de `@theme` → la clase quedaba INERTE (0 ocurrencias en el CSS compilado) → border-radius 0 (cuadrado). Análogo de radius del bug-B de round-1 (token presente pero no cableado al mecanismo que lo consume)."
      scope: "EN SCOPE (homologación = controles honran el token pill compartido). Fix brand: mover `--radius-control` a `@theme` (1 línea) + regression test + des-gatear golden."
      gate_gap: "El arch test verificaba que la var estuviera DECLARADA, no que la UTILIDAD se generara (verde-fantasma HB-79) → pasó verde con el pill roto. El fix endurece el gate (+test: la var vive en @theme)."
      resolution: fixed-pending-chris-reverify
      fix:
        commits: [7411c862]
        changes:
          - "globals.css: `--radius-control: var(--radius-pill)` movido de :root a @theme (genera `.rounded-control{border-radius:var(--radius-control)}` = 9999px) + borrado bloque :root stale."
          - "test-ds-single-token-source.test.ts: +1 regression test (--radius-control vive en @theme, no solo declarado)."
          - "abel-icp-fidelity.spec.ts: des-gateado bloque B (atoms.png) + guard HB-68 (espera control atom montado antes del visual)."
          - "Golden capturado: abel-icp-fidelity.spec.ts-snapshots/atoms-regression-linux.png (pill real, no skeleton)."
        live_verify: "Chrome DevTools MCP /abel/icp autenticado (owner.demo, tenant 7f464ab7): --radius-control=9999px; 4 control atoms border-radius 9999px (allPill=true); 'Nuevo ICP' pill (screenshot). CSS compilado del dev server tiene `.rounded-control{border-radius:var(--radius-control)}` (antes 0). BE GET/POST /api/v1/abel/icp 200."
        gates: "tsc 0 · arch suite 181/181 (+1) · eslint 0 · golden atoms.png ✅ pill"
      core_followup: "PENDIENTE /pm-luana — el kit shippea `rounded-control` asumiendo que el consumer registra `--radius-control` en @theme; cláusula en SHELL-DESIGN-CONTRACT / kit doc + arch-test consumer (junto al dark-contract de round-1)."
    - date: 2026-06-17
      by: Chris (re-ejerció dark toggle + reportó login redirect roto)
      finding: "Dark/light toggle SIGUE sin funcionar (round-1 no lo arregló) + el login no redirecciona al shell tras autenticar."
      root_cause: >
        DOS bugs, ambos cazados por live-verify real (no por el verde). (1) DARK TOGGLE: el round-1 solo
        tocó CSS (@custom-variant) — nunca el MECANISMO del toggle. El script anti-FOUC (layout.tsx) agrega
        la CLASE .dark al <html>; next-themes con attribute="data-theme" maneja SOLO el atributo data-theme
        y NUNCA remueve esa clase .dark. Live-verify (click real del botón): al pasar a claro data-theme→light
        pero class="dark" QUEDA → overrides de globals keyean en .dark → tema trabado en oscuro para siempre.
        (2) LOGIN REDIRECT: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/ → Clerk soft-nav a `/` tras sign-in →
        app/page.tsx (Server Component) hace redirect() in-render hacia el shell (dynamic ssr:false) → flaky
        "Rendered more hooks" de Next 16 (learning 2026-06-03) → el login no redirecciona. Mi login previo
        funcionaba sólo porque usaba redirect_url=deep-link, saltándose RootPage.
      scope: "EN SCOPE (homologación = el tema y el shell deben funcionar). Ambos fix brand-local, cero engine."
      gate_gap: "El dark se declaró 'live-verified' en round-1 testeando la RESOLUCIÓN del variant (evaluate_script seteando atributos), NO el botón real → falso verde. round-3 ejerce el click real. Login nunca se ejerció desde el path afterSignIn=/ (sólo con redirect_url)."
      resolution: fixed-pending-chris-reverify
      fix:
        commits: [b5acab8e, 42f759c8]   # b5acab8e=round-3 · 42f759c8=align-to-vitalia (borra el script anti-FOUC custom, light default, sin system) — espejo exacto de vitalia
        changes:
          - "providers.tsx: attribute='data-theme' (eje ÚNICO) — eliminada la dualidad .dark/data-theme."
          - "layout.tsx: script anti-FOUC custom ELIMINADO (42f759c8) → anti-FOUC delegado al script propio de next-themes (= vitalia); nada agrega .dark al <html>."
          - "proxy.ts: redirect del root `/` movido al EDGE (307 antes de render, mismo patrón que isBareTenantRoute) → mata el redirect() in-render de RootPage en soft-nav. Resuelve tenant vía pickTenantSlug (fast-path JWT + fallback clerkClient)."
          - "resolve-primary-tenant.ts: extraído pickTenantSlug + exportado DEV_FALLBACK_TENANT/TenantMetadata (reuso proxy↔server, anti-dup)."
          - "test-ds-single-token-source.test.ts: +3 regression (anti-FOUC sin classList.add dark · seedea data-theme · providers attribute=data-theme)."
        live_verify: >
          Chrome DevTools MCP /abel/icp autenticado (owner.demo, tenant 7f464ab7). DARK (escenario del bug,
          arranque dark): click real del toggle ×3 — data-theme dark→light→dark, bodyBg rgb(18,18,28)↔rgb(255,255,255)
          en CADA dirección, hasDarkClass=false siempre (cls=''). Screenshots round3-dark-fix-{light,dark}.png =
          shell completo (Ribbon+Luana+cards+logo-swap+toggle-icon) fiel en ambos modos. LOGIN: fresh isolated
          context (sin cookies) → / → /sign-in?redirect_url=/ → sign-in → aterrizó en el shell
          /7f464ab7-.../christian/pipeline (FE log: `GET / 307 ... proxy.ts`). Console 0 'Rendered more hooks',
          0 hook errors (sólo 500 conocido de avatar/favicon placeholder).
        gates: "tsc 0 · eslint 0 errors · arch suite test-ds 47/47 (+3 round-3) · vitest FE 542/542 (incl. los 2 ex-reds R0 ya verdes) · 0 regresiones"
      core_followup: "PENDIENTE /pm-luana — proposals del kit (dark-contract round-1 + rounded-control round-2) siguen; round-3 fue cableado brand-local (anti-FOUC dual-write + afterSignIn root redirect) — candidato a cláusula en SHELL-DESIGN-CONTRACT/ADR-nicolify (single-axis theme + edge-redirect del root)."
    - date: 2026-06-24
      by: Claude (re-verify final · live-verify delegada por Chris · Chrome DevTools MCP)
      finding: "Re-verify del G tras 42f759c8 (align-to-vitalia). TODO VERDE — login + dark toggle real + pill + write/persist."
      root_cause: "N/A — verificación, no bug. El motivo real del dark trabado (round-3) era la dualidad .dark/data-theme; 42f759c8 borró el script anti-FOUC custom y dejó SOLO el mecanismo de next-themes (= vitalia). Confirmado por click real del toggle."
      scope: "N/A (verify)."
      resolution: verified-live-pass
      fix:
        commits: []
        live_verify: >
          dev-app.nicolify.com autenticado (owner.demo, tenant 7f464ab7). DARK toggle ×3 ambas direcciones:
          data-theme dark↔light, htmlClass='' siempre, bodyBg 18,18,28↔255,255,255, persiste nicolify-theme.
          LOGIN afterSignIn=/ → shell, GET / 307 (edge), 0 'Rendered more hooks'. PILL --radius-control=9999px (4 atoms).
          WRITE PATCH /api/v1/abel/icp/82aa34d1 200 + persiste tras reload. Console: solo 500 avatar.svg/favicon placeholder (no regresión).
        gates: "live-verify Chrome DevTools MCP — 4/4 escenarios verdes."
      core_followup: "Sin cambios — los followups de round-1/2/3 al kit siguen pendientes en /pm-luana (NO bloquean esta story)."
reconciled: true                     # ✅ R aplicado /pm-nicolify 2026-06-24 (tras chris_verify.signoff SATISFIED): (1) round-3 commits PENDING→[b5acab8e,42f759c8]; (2) 04-validators cat-4 goldens A/C1/C2/D → deferred+must_pass:false (HB-79 anti-verde-fantasma, baselines nunca capturados, cubiertos por live-verify V8/#37); (3) V8-live-verify-dod37 blocked_on→null + status:satisfied; (4) scope-deltas round-1..4 (single-axis theme + edge-redirect) ya en chris_verify.rounds = allowlist auditor. cap YAML design-system/nicolify-ui-homologation existe (cap_change_type:new OK). → AUTO-HANDOFF /auditor.
build_status:                        # /dev-team 2026-06-15 — 5/5 tickets pushed, green native
  T-1: { commit: cb8de344, status: tests-passing, note: "globals↔design-tokens + --radius-control + arch-test (39/39)" }
  T-2: { commit: facdd25b, status: tests-passing, note: "4 mirrors killed → @luana/ui-kit (518/518 + arch 160/160)" }
  T-3: { commit: 4baa816e, status: tests-passing, note: "abel/icp + shell re-expresado vía primitivas/archetypes (241/241)" }
  T-4: { commit: 45052deb, status: tests-passing, note: "no-arbitrary lock ON @ zero baseline; 2 text-[10px] vía ds-lock-allow (Bif-2) + FLAG /pm-luana 10px tier (16/16)" }
  T-5: { commit: 52dd47d3, status: tests-passing, note: "goldens (pill/accent gated kit-lift) + a11y-subnav + demo-script + SHELL-DESIGN-CONTRACT §7 (arch 176/176); live-verify PENDING G" }
blocked_on: []                       # RESUELTO — kit-radius-control-lift migrated (proposal 2026-06-15, lift ad492254 en main, synced wip/nicolify 28b0d456). Pill live-verified G round-2.
next_step_at_G:                      # boundary G (Chris-verify) — estado 2026-06-16 (round-2):
  - "✅ Live-verify dod_evidence (abel/icp render + CREATE 201 + autosave PATCH 200 + logs)"
  - "✅ Kit-lift RN-7 aterrizó → controles pill live-verified (9999px) + golden atoms.png capturado"
  - "⬜ Chris ejerce demo #37 (Abel convergence: dark toggle + controles pill) + firma chris_verify.signoff → cierra G"
input_spec_signed: true             # ✍ FIRMA 1 (RONDA 1 funcional) — Chris 2026-06-15
mockup_final_signed: true           # ✍ FIRMA 2 (mockup ds-base.html) — Chris 2026-06-15 · colores verificados vs nicolify.com live
ratified_by_chris: true
mockup_reratified: true              # iteraciones ribbon-función/thumbnails/gear/luana-bubbles/pill-controls — Chris "todo bien" 2026-06-15
mockup_decisions:
  ribbon_labels: "función + agente: Mi Empresa·Abel · Atraer·Brenda · Vender·Christian · Operar·Sara · Retener·Norvil (Chris confirmó)"
  thumbnails: "avatares SVG placeholder existentes (public/agents/{slug}) — Chris entrega finales; NO regenerar"
  config: "⚙️ gear"
  luana_bar: "indigo de marca + estructura vitalia (header avatar + burbujas opacas bot=blanca/user=indigo-claro + composer adornos)"
  control_radius: "fully-rounded (pill) vía token --radius-control brand-overridable (RN-7) — flag /architect: kit Input/Button/Select debe exponerlo"
mockup_base_set: true               # _shared.css + ADR-nicolify-003 + rule shell-mockup-per-component.md (mirror vitalia)
last_artifact: 06-tickets.yaml
next_action: "/auditor APPROVED 2026-06-24 (CHECKPOINTS.md). → /pm-nicolify MERGE: 07-merge.md 5 secciones (copiar gherkin-matrix §1 + comando verify §5; run Playwright visual/a11y = follow-up stack-estable, NO falso-verde) → cap design-system/nicolify-ui-homologation change_log[0] type=new → archive story (R2, git mv mismo commit) → state reviewing→done. Pendiente /pm-luana: HB-109 (engine tsc zustand) + learning eslint dep-drift (HB-110). Lock code:design-system se libera para storybook-inventory tras done."
ready_package:                       # /architect 2026-06-16 — paquete completo FE-only
  - 03-arch.md                       # consolidado FE (= 03-arch-fe; cero BE/agentic)
  - 03-arch-fe.md                    # quick-ref builder-frontend
  - 04-validators.yaml               # 5 categorías · SC-1..6 mapeados · goldens gated kit-lift
  - 05-guidelines.md                 # must_load_skills + patterns required/forbidden + files scope
  - 06-tickets.yaml                  # T-1..T-5 · builder-frontend workhorse · DAG · assignment blocks
  - dispatch-plan.md                 # autonomous_mode false · matrix · RN-7 external dep
arch_decisions:
  - "EXTEND/ADOPT @luana/ui-kit 0.4.1 + @luana/design-tokens 0.2.0 + @luana/eslint-config 0.1.0 (cero NEW layer)"
  - "DELETE 4 mirrors locales (EntityWorkspaceLayout/EntitySubNavBar/EmptyState/AutosaveBadge) + repoint a kit con adaptación de prop-divergence (03-arch §6)"
  - "globals.css = valores de marca + escala compartida (Q1: espejo @theme + arch-test drift); --radius-control/--radius-pill brand-scoped agregados"
  - "RN-7 (kit controls consumen --radius-control) = /pm-luana lift EN PARALELO, NUNCA en esta story; gatea golden pill + demo #37"
  - "anti-default-flip al encender no-arbitrary lock off→on (migrar first, flip second, suite verde ambos lados)"
---

## Prior art scan (anti-duplication-refining — corrido 2026-06-15 · /pm-nicolify+/pm-luana)

> Resultado: **ADOPCIÓN PURA, cero creación**. Todo lo que esta story consume YA existe en el engine. No se recrea nada.

| Pieza | Existe en | Decisión |
|---|---|---|
| Átomos shadcn (button/card/dialog/select…) | `@luana/ui-kit` 0.4.1 | consumir (nicolify ya importa, 8 imports) |
| Moléculas (Entity*, AutosaveBadge, detail-panel) | `@luana/ui-kit` 0.4.1 | consumir |
| Layout-primitives (Page/Toolbar/states/pagination/skeletons) | `@luana/ui-kit` src/layout/ | **adoptar** (nicolify hoy: 0 consumidas, arma `<div>` crudos) |
| Page archetypes (List/Detail/Form/DashboardPageScaffold) | `@luana/ui-kit` src/archetypes/ | **adoptar** |
| Escala tokens (spacing/radius/typo/z-index) | `@luana/design-tokens` 0.2.0 | alinear globals.css a la escala |
| Enforcement no-arbitrary | `@luana/eslint-config` src/no-arbitrary-value.js (+test) | **encender** en nicolify/frontend |

- **Doctrina:** ADR-014-design-system-homologation + proposal `2026-06-07-design-system-homologation` (ambos **accepted**, ratif Chris). nicolify = consumer (Fase 3 adoption).
- **Fases 0-2 (escala + primitivas + archetypes + enforcement) = YA BUILT en @luana/ui-kit 0.4.1** → nicolify NO espera story platform; adopta lo shippeado.
- **Estado nicolify hoy:** 27 arbitrary-values, 0 layout-primitives consumidas. Superficie chica (vs vitalia 368) → costo de adopción bajo + momento ideal (status: rebuild, esqueleto).
- **NO abre proposal nueva** — cuelga del `2026-06-07` accepted.

## Nota de continuidad (fusión)

La entrada de backlog `nicolify-r0-design-system-tokens` (tokens base color/fuente/dark) fue **fusionada en `nicolify-r0-shell` (DONE, ratif Chris 2026-05-30)** — los tokens de marca ya shippearon con el shell. Esta story NO la resucita: cubre la pieza net-new que no existía entonces — adopción de los **primitivas/archetypes/enforcement COMPARTIDOS** del design system homologado (ADR-014, accepted 2026-06-07, posterior al shell).
