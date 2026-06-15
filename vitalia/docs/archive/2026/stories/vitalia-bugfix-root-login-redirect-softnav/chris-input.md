---
story_id: vitalia-bugfix-root-login-redirect-softnav
created_at: 2026-06-15T00:00:00-05:00
last_modified: 2026-06-15T00:00:00-05:00
notes_count: 1
refs_count: 0
conversation_count: 1
---

# chris-input.md · vitalia-bugfix-root-login-redirect-softnav

## 💭 Notas

### 2026-06-15
Chris: "luego de loguearme se queda pensando con el mensaje 'rendering' en la consola de Next y
no avanza; tengo que refrescar para que recién aparezca lo de Mateo".

## 📎 Referencias

(sin referencias)

## 💬 Conversación

> Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-15 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Diagnóstico (patrón ya documentado): el root `/` (`app/page.tsx`) hace `redirect()` in-render
post-login → soft-nav al grupo `(shell-organism)` `ssr:false` → "Rendered more hooks" (Next 16,
~40% flake) → colgado; el refresh (hard-nav) lo destraba. El fix previo (bug#1) cubrió el caso
bare-tenant vía `proxy.ts`; el root `/` quedó sin edge-ificar.

Fix: extender el edge-redirect (307) de `proxy.ts` al root `/` autenticado (resolviendo el primer
tenant via IAM en el middleware) — mismo patrón que `bareTenantLandingRedirect`. Story creada
`type=bugfix` `cap_target=auth.clerk-middleware`. Spawneo Opus builder-frontend fix-and-own +
Playwright real-backend (login → cae en mateo/agenda sin refresh, determinístico).
