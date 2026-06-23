# dispatch-plan — Nueva cita usable (D11)

> Consume con `06-tickets.yaml`. Para `/dev-team` (spawn) + `/pm-vitalia` (ratify autonomous).

## autonomous_mode

```yaml
autonomous_mode: false        # default — Chris opt-in al ratificar
```

**Por qué false (HARD):** story funcional con writes PHI reales (citas + pacientes), constraint DB nuevo (anti-doble-booking), reconciliación de enum (origin), engine-boundary (EXCLUDE), y soft-dep de 4 atoms del canon que pasan por `/pm-luana`. Live-verify obligatoria (Rule #37) + demo Chris en G. NO es safe para autonomous end-to-end. El architect propone; Chris ratifica si quiere relajar.

## Precursora P-0 (NO builder · /pm-luana)

`/pm-luana` promotion proposal de los 4 atoms del canon → `@luana/ui-kit`:
- `FormActionBar` · `Badge variant=success|warning` · `PageHeader back-pill` · `EntityPicker.createAction`
- Contrato: `mockups/PROPOSED-CANON-ATOMS.md`
- Proposal a crear: `docs/promotion-protocol/proposals/2026-06-22-ui-kit-nueva-cita-atoms.md`
- **Secuencia:** P-0 idealmente PRIMERO (o en paralelo con el BE). Los tickets FE (T-FE-1..4) consumen los atoms desde el kit. Si el kit no los tiene al arrancar el FE → bloqueo soft: o se ejecuta P-0 antes del FE, o T-FE-1 arranca tras el merge del kit. **NUNCA un ticket de marca edita `core/@luana/ui-kit/src/`.**
- `DayAvailabilityStrip` NO entra en P-0 (es feature scheduling, lift-candidate aparte — no ahora).

## Handoff matrix (ticket → agent → model → costo estimado)

| Ticket | Surface | primary_agent | model | costo rel. | depende |
|---|---|---|---|---|---|
| P-0 | promote | `/pm-luana` | coordinator | bajo | — |
| T-BE-1 | offer DTO | builder-backend | workhorse | bajo | — |
| T-BE-2 | migration EXCLUDE | builder-backend | workhorse | medio | — |
| T-BE-3 | availability endpoints | builder-backend | workhorse | alto | T-BE-2 |
| T-BE-4 | create + origin | builder-backend | workhorse | alto | T-BE-2, T-BE-3 |
| T-BE-5 | patient inline + search | builder-backend | workhorse | medio | — |
| T-FE-1 | ruta + schema | builder-frontend | workhorse | alto | T-BE-1, T-BE-3, T-BE-4, (P-0) |
| T-FE-2 | pickers | builder-frontend | workhorse | medio | T-FE-1, T-BE-5, (P-0) |
| T-FE-3 | disponibilidad | builder-frontend | workhorse | alto | T-FE-1, T-BE-3, (P-0) |
| T-FE-4 | FormActionBar + E2E live | builder-frontend | workhorse | alto | T-FE-1/2/3, (P-0) |

Auditores: `auditor-backend` (BE tickets), `auditor-frontend` (FE tickets) — flagship.

## DAG de ejecución

```
                       ┌─ T-BE-1 ─────────────────────┐
P-0 (/pm-luana) ╌╌soft╌┤                               ├─ T-FE-1 ─┬─ T-FE-2 ─┐
                       ├─ T-BE-2 ─→ T-BE-3 ─→ T-BE-4 ──┤          ├─ T-FE-3 ─┼─→ T-FE-4
                       └─ T-BE-5 ─────────────────────┘          └──────────┘
```

- **Wave 1 (paralelo):** P-0, T-BE-1, T-BE-2, T-BE-5.
- **Wave 2:** T-BE-3 (tras T-BE-2).
- **Wave 3:** T-BE-4 (tras T-BE-2 + T-BE-3).
- **Wave 4:** T-FE-1 (tras BE endpoints + P-0).
- **Wave 5 (paralelo):** T-FE-2, T-FE-3.
- **Wave 6:** T-FE-4 (integración + E2E + live-verify).

Single-hub (ADR-009): bucket `code:scheduling` + `code:crm` + `code:mateo` — paralelizar tickets de módulos distintos OK; mismo módulo serializa. Commit por pathspec.

## Playwright visual scope (D3)

- `story_scope_routes`: `/{tenantId}/mateo/agenda/nueva-cita`.
- `story_scope_components`: NuevaCitaView, ServicePicker, DoctorPicker, PatientPickerWithCreate, AvailabilityChip, DayAvailabilityStrip, FreeDoctorsList, NuevaCitaActions.
- `out_of_mockup_scope`: la grilla de Agenda (solo se verifica que refleja la cita), AppointmentDrawer, CobrarSaldoSubform.
- `render_sanity`: `assertShellMounted(page)` antes de axe/visual sobre el shell (HB-68).
- Smoke nuevo obligatorio (ruta nueva): `e2e/specs/smoke/nueva-cita.smoke.spec.ts`.

## Live-verify gate (Rule #37 · funcional)

- `verification_nature: funcional` → `demo_required: true` + `dev_app_verified.required: true`.
- T-FE-4 ejerce writes reales en dev-app: crear cita (201 + grilla + toast), crear paciente inline (201 + directorio), forzar solape (409). Lee logs BE + confirma efecto DB.
- `dod_live_verified: true` + `dod_evidence` + `verified_at` en checkpoint antes de `developed`.
- Chris firma `chris_verify.signoff` en G (pausa-y-ofrece, no autonomous).

## Soft-dep de los 4 atoms del canon (recordatorio)

Los tickets FE consumen `FormActionBar`, `Badge variant=success|warning`, `PageHeader back-pill`, `EntityPicker.createAction` desde `@luana/ui-kit`. Si P-0 no se completó, el builder-frontend NO los re-implementa local (driftea → auditor CHANGES_REQUESTED). Escalar a `/pm-luana` si el kit no los tiene al arrancar el FE.
