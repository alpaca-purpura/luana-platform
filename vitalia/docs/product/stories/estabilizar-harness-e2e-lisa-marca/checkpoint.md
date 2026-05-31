---
story_id: estabilizar-harness-e2e-lisa-marca
brand: vitalia
type: bugfix
state: idea
release: F2
cap_target: lisa-marca
cap_change_type: fix
architecture_pattern: ADR-vitalia-004
adr_004_compliance: bugfix-lite-na
parent_story: arreglar-guardado-voz-y-tono
agent_owner: lisa
module: brand_studio
last_modified: '2026-05-30T23:45:00.000Z'
spawned_at: '2026-05-30'
spawned_by: chris-followup
ratified_by_chris: true
ratified_by_chris_at: '2026-05-30T23:45:00-05:00'
repro_verified: true
parallel_safe: true
next_action: /po (o /po-ux) refina spec lite de regresión → /architect lite → /dev-team → /auditor → done
goal: >-
  Estabilizar el harness E2E de lisa-marca (Clerk auth-readiness). El GET
  /personality in-browser flaquea (getToken() transitorio null tras nav directa /
  reload) → la pantalla muestra "No se pudo cargar" sin recuperar → la suite
  lisa-marca es flaky/no-determinista. Además, varios specs viejos de lisa-marca
  siguen mockeando el backend + usando data-testids fantasma (verde falso). Dejar
  la suite lisa-marca verde-determinista contra backend real.
---
# estabilizar-harness-e2e-lisa-marca — checkpoint

## Goal

Dejar la suite E2E de **lisa-marca verde y determinista** contra backend real. Origen: durante
`arreglar-guardado-voz-y-tono` (bugfix del guardado voz-y-tono) se descubrió que el harness E2E de
lisa-marca **nunca estuvo realmente verde** — mockeaba el backend, usaba data-testids fantasma, y apuntaba
a un tenant ficticio. Eso fue **la razón estructural por la que el bug del guardado shipeó** (la
"verificación" era teatro). Parte ya se corrigió para voz-y-tono; esta story cierra lo que falta.

## Tipo: `bugfix` (lite — ADR-011)

Arreglo de comportamiento roto del harness de test (sin diseño nuevo). Hereda gate repro-first
(`repro_verified: true` — el flake está reproducido abajo). NO toca lógica de producto; sí puede tocar
componentes para robustez de la query (retry/auth-ready) y los specs/POMs/fixtures de E2E.

## Root cause primario (reproducido)

El GET `/api/v1/lisa/marca/personality` **in-browser** flaquea en el contexto E2E: tras navegación directa
a `/{tenantId}/lisa/marca/voz-y-tono` (o un `reload`), `useAuth().getToken()` de Clerk devuelve `null`
transitoriamente. El `queryFn` hace `if (!token) throw new Error("Not authenticated")` → la query entra en
error → `isPersonalityError=true` → ArchetypeSelector muestra "No se pudo cargar la configuración de voz"
y NO se recupera. (Se le agregó `retry:5` en `VozTonoView` durante la story padre — mejora pero NO
determinista: si Clerk tarda más que el backoff, agota reintentos.)

**Evidencia (story padre):** correr la suite voz-y-tono con el tenant correcto da **~5-7/9 verde**; los
2-3 que flaquean SIEMPRE son los que recargan/reintentan (bloque-persiste-en-recarga, error-reintento).
Cuando se forzó un `waitFor` HARD del card (sin `.catch`), los fallos subieron a 5/9 → confirma que el GET
in-browser frecuentemente no hidrata a tiempo. **Ningún GET llega al backend** en esos casos (el throw es
client-side) → es 100% race de auth-readiness de Clerk, no del backend.

## Alcance afectado (toda la suite lisa-marca, no solo voz-y-tono)

Specs lisa-marca que heredan el mismo problema (mock + testids fantasma + tenant + auth-race):
`lisa-marca-identidad-autosave.spec.ts`, `lisa-marca-race-autosave.spec.ts`,
`lisa-marca-concurrent-owners.spec.ts`, `lisa-marca-logo-upload-size.spec.ts`,
`lisa-marca-cross-tenant.spec.ts`, `lisa-marca-voice-warning.spec.ts`, `lisa-marca-large-dataset.spec.ts`,
+ fixture `vitalia-fase2-lisa-marca/fixtures/lisa-marca.fixture.ts`.

> `voz-y-tono` (la story padre) ya quedó con tenant correcto + data-testids reales + GET real. Esta story
> extiende ese patrón al resto + ataca la race de auth-readiness de raíz.

## Sub-bug relacionado encontrado (decidir si entra acá)

`GET /api/v1/lisa/marca/prohibited-phrases` requiere header `X-User-ID` (router línea ~576) pero el
`fetchClient` FE **no lo inyecta** → siempre 422 (visto en logs `make dev-vitalia`). No bloquea el archetype
test, pero es un contrato FE↔BE roto del mismo módulo. Opciones: BE hace `X-User-ID` opcional en ese GET
(es un read, no necesita user para listar por tenant+país), ó FE/api-layer lo inyecta. Recomiendo BE-opcional.

## Direcciones de fix candidatas (para /architect)

1. **Gate de Clerk-ready en el harness:** fixture/POM espera a que Clerk esté plenamente autenticado
   (`getToken()` no-null) antes de interactuar/asertar — p.ej. un helper `waitForClerkReady(page)` que
   poll-ea hasta que un GET autenticado responda, o usa el patrón oficial `@clerk/testing` de readiness.
2. **Query resiliente a auth transitoria:** en vez de `throw` en token null, la query espera/reintenta hasta
   token disponible (no deja la pantalla en error permanente). Beneficio: robustez también en producción
   (un blip de token no debe romper la pantalla). Parcialmente hecho (`retry:5`) — formalizar.
3. **De-mock + testids reales** en los specs lisa-marca restantes (mismo patrón ya aplicado a voz-y-tono):
   tenant = `E2E_TENANT_ID` real, backend real, data-testids reales, asserts con polling.
4. **(opcional) prohibited-phrases**: `X-User-ID` opcional en el GET BE.

## Definición de DONE

Suite E2E lisa-marca **determinista verde** (0 flaky en 3 corridas consecutivas) contra backend real, con
`make dev-vitalia` levantado, usando el tenant autenticado real. Wire de los `e2e_test` a los scenarios del
cap `lisa-marca` (mueve la cap de declared-live → verified-live de verdad).

## Estado

`idea` · ratificada por Chris (follow-up de `arreglar-guardado-voz-y-tono`). Lista para `/po`/`/po-ux` lite.
