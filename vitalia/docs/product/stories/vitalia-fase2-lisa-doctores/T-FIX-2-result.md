# T-FIX-2 — Result: batch de cierre Pendiente B

**Story:** vitalia-fase2-lisa-doctores
**State:** developing (NO done — blocker Clerk)
**Date:** 2026-06-01
**Owner:** orchestrator `/dev-team` (Opus) + `builder-frontend` (Sonnet, agentId a8f8b42a8f9edbebe, cortado por budget tras 129 tool-uses) + verificación independiente orchestrator
**Veredicto:** ⏸ **doctores NO alcanza `done` esta sesión — blocker de configuración Clerk (no-código) destapado.** (a) DoD evidence ✅ real. (b)(d)(c-relocation) ✅ committeados. Regen baselines + flujos profundos bloqueados por el blocker.

## Resumen por item

| Item | Estado | Detalle |
|---|---|---|
| **(a) seed-by-WRITE real** | ✅ **GREEN-real** | 3 doctores creados vía flujo create real autenticado (POST → 201). Evidencia DoD confirmada independientemente por orchestrator (DB + audit). Es Scenario 1 happy-path + i18n credencial 3 países. |
| **(b) quitar workaround POMs** | ✅ committeado (fd512f33) | `.filter({visible:true})` removido de DoctorWorkspace/AvailabilityCalendar/ShellLayout/StaffDirectory (single-slot confirmado en prod). **Re-verificación de asserts revertidos BLOQUEADA** por Clerk blocker. |
| **(d) fix medición perf** | ✅ committeado (fd512f33) | Medición de búsqueda excluye el debounce 500ms del POM; SLO 500ms intacto (no se subió threshold). |
| **(c) reubicar visual goldens** | ⚠️ parcial | Relocación a `e2e/regression/vitalia-fase2-lisa-doctores/visual-goldens.spec.ts` ✅ committeado (fd512f33) + junk smoke baselines borrados ✅. **Regeneración de baselines BLOQUEADA** por Clerk blocker (setup auth falla). 0 baselines `staff/*` generados aún. |
| **(e) flujos profundos + i18n** | ⏸ bloqueado | Requiere e2e autenticado → bloqueado por Clerk blocker. |

## (a) DoD live evidence — VERIFICADO REAL (no mock, no GET-200)

3 doctores creados vía el flujo real (POST `/api/v1/vitalia/clinics/doctors`) por `builder-frontend` (Playwright autenticado), confirmados **independientemente por el orchestrator** contra `vitalia_dev`:

**EVIDENCE 1 — filas en `vitalia_doctors`** (tenant `e69a691d` / clinic `f035be5b` Sanaré, PHI cifrado pgcrypto BYTEA):
```
Ana       | Garcia Mendoza  | Odontologia Cosmetica | PE
Carlos    | Lopez Herrera   | Medicina Estetica     | MX
Valentina | Rivas Molina    | Dermatologia          | AR
```

**EVIDENCE 2 — `vitalia_audit_log` (sync write, HIPAA-lite):**
```
doctor.created | doctor | 2cb5e668-4d16-46d2-bcda-b3be208d7d64 | 2026-06-01 18:10:39 UTC
doctor.created | doctor | 2464fad7-2124-46a0-9b41-cef9e489cc8d | 2026-06-01 18:10:33 UTC
doctor.created | doctor | 2b0d9466-7654-4b0c-a8aa-b4a81e3aa580 | 2026-06-01 18:10:25 UTC
```

**EVIDENCE 3 — DOM:** el directorio re-renderiza las 3 cards doctor (reportado por builder; pendiente captura durable bloqueada por Clerk).

Esto es la evidencia DoD más fuerte (writes reales + efecto en DB + audit), cubre Gherkin Scenario 1 (crear-doctor-horarios) y ejercita i18n credencial PE/MX/AR.

## ★ BLOCKER destapado — Clerk `choose-organization` session-task

`npx playwright test --project=setup` falla 3/3 con redirect a `/sign-in/tasks/choose-organization`. La instancia Clerk de Vitalia tiene **Organizations + session-task forzada de selección de org**; al borrarse la Clerk org en sesión 1 (correcto per no-clerk-org), dr.demo quedó sin org → sign-in nunca completa → **todo browser auth bloqueado** (e2e + login real dev-app).

**Fix = configuración instancia Clerk (no-código, dominio Chris):** deshabilitar Organizations / la tarea `choose-organization`. Completitud correcta de no-clerk-organizations. Doc completo: `vitalia/docs/observed-bugs/2026-06-01-clerk-choose-organization-task-blocks-signin.md`.

## Artefactos sin commitear (WIP builder, NO en suite hasta fix Clerk)

- `e2e/regression/vitalia-fase2-lisa-doctores/live-seed-dod-evidence.spec.ts` (golden durable del seed-write — corre en smoke, hoy fallaría por Clerk blocker → no se commitea hasta el fix).
- `e2e/regression/vitalia-fase2-lisa-doctores/doctors-live-check.spec.ts` (helper).

## Commits

- `fd512f33` — items b + d + c-relocation (remove workarounds + perf measurement + relocate visual goldens).

## Remaining honesto para `done`

1. **[BLOQUEANTE no-código]** Fix Clerk instance: deshabilitar `choose-organization` task / Organizations.
2. Tras fix → `npm run test:e2e:fresh` → regenerar baselines visuales V-VIS-1..4 (project=visual) → ratificación Chris (ADR-vitalia-003).
3. Re-verificar asserts revertidos (cross-tenant adversarial real + focus-return a11y).
4. (e) flujos profundos workspace/calendar + i18n.
5. Commit live-seed-dod-evidence.spec.ts como golden durable.
6. `/auditor` → merge.

## Skills consulted (must_load enforcement v4.1)

| Skill / Rule | Status | When |
|---|---|---|
| playwright-expert | ✅ (builder + orchestrator) | Clerk auth lifecycle + setup diagnosis |
| .claude/rules/definition-of-done-live-verify.md | ✅ | DoD evidence bar (writes + efecto, no GET-200) |
| .claude/rules/test-design-doctrine.md | ✅ | verificación REAL ≠ HTTP 200 |
| MEMORY no-clerk-organizations | ✅ | diagnóstico root-cause del blocker |
| frontend-fsd.md / hipaa-lite.md | ✅ | dual-filter tenant+clinic en seed-write |

done -> vitalia/docs/product/stories/vitalia-fase2-lisa-doctores/T-FIX-2-result.md
