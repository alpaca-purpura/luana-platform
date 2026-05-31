---
story_id: build-autosave-primitive-luana
created_at: '2026-05-31T01:20:00.000Z'
last_modified: '2026-05-31T01:20:00.000Z'
notes_count: 0
refs_count: 0
conversation_count: 1
---
<!-- voseo-allowed: conversación interna Chris↔Claude (buzón de la story), no es texto user-facing -->
# chris-input.md · build-autosave-primitive-luana

> Cocina de la story (Notas + Referencias + Conversación). Separada de spec/design/arch.

## 💭 Notas

- Story de plataforma (brand=platform). Construye la primitiva; NO migra brands (eso son stories consumer).
- Decisión: ADR-012 (accepted). Outcome: autosave-primitive-platform.

## 📎 Referencias

- `docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md`
- `docs/product/outcomes/autosave-primitive-platform.md`
- Prior-art vitalia: `vitalia/frontend/src/features/lisa/hooks/use*Autosave.ts` + `getTokenReady` en VozTonoView.
- Prior-art nicolify: ~23 archivos con autosave (a reconciliar).

## 💬 Conversación

### 2026-05-31T01:20 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Ratificaste ADR-012 → marqué **accepted** + outcome `refining`. Creé esta story de plataforma
`build-autosave-primitive-luana` (brand=platform, refining, ratificada) para **construir la primitiva**
(`useAutosave` @luana/hooks + `<AutosaveBadge>` @luana/ui-kit + `AutosaveContract` @luana/schemas) con tests
+ consumer de referencia. La adopción de vitalia y nicolify son stories consumer SEPARADAS (en el outcome) —
así no metemos un big-bang. Encadeno a `/po-ux` (platform) para el 01-spec (contrato + scenarios, derivado de
ADR-012 reconciliando vitalia+nicolify). **Heads-up de scope:** esto es el primer paso de un build multi-story;
después del spec te muestro el ready package antes de codear.

### 2026-05-31T01:35 · 🤖 claude · `/po-ux` · ✓ APLICADO
Escribí `01-spec.md` (v1, draft) de la primitiva. Hallazgo del prior-art: los **4 hooks de vitalia son
idénticos** (solo cambian tipos + la fn save + la key) → colapsan en un `useAutosave<T>` limpio; **nicolify ya
tiene un `form-runtime` más centralizado** (Provider + AutosaveBanner + `use-debounce`) → el form-runtime
queda como consumer de alto nivel del mismo bloque. **Contrato propuesto:** `useAutosave({save, getToken,
onSaved, onError, debounceMs=600, telemetry?, authReadyAttempts})` → `{status, savedAt, scheduleSave, cancel,
retry}` + `<AutosaveBadge status savedAt>` (aria-live, contraste AA) + tipos en `@luana/schemas`. `getToken`
inyectado (no acopla a Clerk). 10 scenarios (debounce, save, auth-ready robusto, error+retry, concurrencia,
network, unmount, a11y, i18n, telemetría) verificados con Vitest unit/component (el E2E real-backend vive en
las stories consumer).
**Necesito 2 decisiones tuyas para cerrar refined:**
1. El `form-runtime` de nicolify ¿lo reescribo sobre `useAutosave` en ESTA story, o lo dejo para la story de
   adopción de nicolify? (recomiendo: dejarlo para la adopción — esta story solo construye la primitiva + un
   showcase de referencia).
2. ¿El contrato te cierra así, o querés cambiar algo (nombres, debounce default, retry explícito vs automático)?
