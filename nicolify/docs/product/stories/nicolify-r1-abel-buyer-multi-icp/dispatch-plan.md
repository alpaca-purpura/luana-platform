# dispatch-plan.md — nicolify-r1-abel-buyer-multi-icp

> Owner: `/architect`. Consumido por `/dev-team`. **autonomous_mode: false** (default — Chris ratifica en G/Chris-verify; el gate más riesgoso, SC-8 migración con data real, exige verify humano).

## autonomous_mode
```yaml
autonomous_mode: false
reason: "Schema rewrite con data real posible (abel_buyers.icp_id NOT NULL shipped). SC-8 (backfill sin pérdida) + SC-4 (edit propaga cross-ICP live) exigen Chris-verify. Architect propone false; Chris puede opt-in tras revisar."
```

## Handoff matrix (ticket → agent → model → costo)

| Ticket | Surface | Agent | Model tier | Est. h | Depends |
|---|---|---|---|---|---|
| T-BE-1 | migración (v2: backfill ICPs vivos + zombies) + models + domain | `builder-backend` | workhorse | 5 | — |
| T-BE-2 | repos (join + buyer diff · v2: +count_buyers_in_icp +race SC-13) | `builder-backend` | workhorse | 5 | T-BE-1 |
| T-BE-3 | dtos + services (v2: `_attach_link` RN-12 + cascade RN-11) + router + api tests | `builder-backend` | workhorse | 9 | T-BE-2 |
| T-FE-1 | types + api + hooks (contrato · v2: −isPrimary muerto, +409, +invalidaciones) | `builder-frontend` | workhorse | 5 | T-BE-3 |
| T-FE-2 | sheets + BuyerLeafForm 5 cambios (v2: +detach confirm ×2 +badges +name-required +empty-states) + IcpEntityLayout + IcpWorkspaceView copy | `builder-frontend` | workhorse | 9 | T-FE-1 |
| T-FE-3 | directory + registro sub-tab + e2e | `builder-frontend` | workhorse | 6 | T-FE-1 |

**Tier rationale:** 100% non-agentic (BE service+FE, cero `copilot/`/`sales_agent/`) → `workhorse` (R23 no aplica; flagship no requerido). production_code: true en todos.

## DAG
```
T-BE-1 ──> T-BE-2 ──> T-BE-3 ──> T-FE-1 ──┬──> T-FE-2
                                          └──> T-FE-3
```
Bucket WIP: `code:abel` (BE y FE mismo módulo). BE serial (schema→repo→service). FE: T-FE-2 y T-FE-3 dependen de T-FE-1; mismo bucket → serializar (T-FE-2 luego T-FE-3) salvo lanes distintas.

## Playwright visual scope (resumen · full en 04-validators)
- **Scope routes:** `/{tenantId}/abel/buyers`, `/{tenantId}/abel/icp/{icpId}/{buyerId}`, `/{tenantId}/abel/icp/{icpId}/datos`.
- **Forbidden:** `components/ui/`, `app/layout.tsx`, `[subtab]/[subsubtab]/{layout,page}.tsx` (dispatch entity-bearing). `components/shared/SubTabContent.tsx` = EXCEPCIÓN de registro (1-línea dispatch, no visual).
- **Reuse-only:** cero átomo/story nuevo del kit; composiciones feature-local (§5.bis).

## Invocación manual (si !autonomous)
```
/dev-team nicolify nicolify-r1-abel-buyer-multi-icp T-BE-1
# → developed → G (Chris-verify: correr migración sobre DB con filas + attach/detach/edit live) → R → /auditor → /pm-nicolify merge
```

## Riesgos priorizados
1. **SC-8 migración (mayor riesgo):** backfill ANTES de drop, idempotente, prod-clone test obligatorio (`03-arch-be.md §1`). **v2:** JOINea ICPs vivos + cierra zombies legacy — sembrar las 3 clases de filas en el test. mutation HARD.
2. **Contrato FE↔BE (SC-1/4):** `BuyerResponse.attached_icps` — el FE debe mirror-earlo EXACTO (T-FE-1 contract tests). Anti [[embudo-imagined-contract]].
3. **Reachability sub-tab (AC-6):** registro en 2 puntos exactos; e2e ejerce el shell real.
4. **(v2) Cascade RN-11 (SC-12):** `IcpService.soft_delete` — UN commit; commits parciales = huérfano RN-5. Test transaccional obligatorio.
5. **(v2) `_attach_link` RN-12 (SC-13):** desambiguación del `IntegrityError` por ESTADO (no constraint-name); en create → savepoint. Si el builder duplica la lógica primary entre create y attach, reintroduce el bug que v2 arregla — el auditor lo caza con grep de una sola definición.
6. **(v2) Destructive UX (SC-14):** confirm último-detach — cancelar sin requests; e2e real con dialog.

## Checklist G (Chris-verify) — qué ejercer live
1. Migración sobre DB con filas reales (las 3 clases) → counts + zombies.
2. Attach "CTO" a 2º ICP → badge doble en directory; edit propaga (SC-4, recarga ambas pantallas).
3. Attach a ICP vacío → ★ primary automática (RN-12).
4. Quitar del último ICP → dialog destructivo → perfil desaparece del directory (SC-14).
5. Descartar borrador de un ICP con buyer exclusivo + compartido → exclusivo desaparece, compartido pierde solo el badge (SC-12).
6. Crear desde el sheet sin nombre → botón disabled; con nombre → leaf nuevo (AC-10).
