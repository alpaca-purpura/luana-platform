# Nicolify — Brand overlay

> **Auto-cargado** cuando cwd cae dentro `nicolify/...` o worktree `~/Proyectos/luana-nicolify*/`. Coexiste con root `CLAUDE.md`.

**Brand:** Nicolify. **Vertical:** Agencias + Servicios B2B (CRM ciclo largo, portal cliente, propuestas/contratos, horas facturables).

**Status:** 🔵 frozen snapshot post-multibrand-reorg 2026-05-15. El brand-level `nicolify/docs/product/` está vacío. Las 24 stories shipped + 12 modules + 15 capabilities pre-reorg viven como **referencia arqueológica read-only** en `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/`. **NO** es brand activamente desarrollada post-reorg (corrección audit 2026-05-27 — la asunción inicial "brand más madura ~80% prod" era pre-reorg).

**Cross-brand learning source:** OK como referencia histórica pero NO source principal live (ver `docs/process/audits/2026-05-27-stories-sweep.md` § Hallazgo CRÍTICO #0 + `.claude/rules/anti-duplication-refining.md` § Tabla fuentes prior-art correcta).

## Product vision (pointer)

→ `nicolify/docs/product/vision.md`.

**TL;DR:** SaaS para agencias creativas/digital/consultoría B2B LatAm que manejan múltiples clientes con ciclos comerciales largos (3-12 meses), propuestas/contratos formales, horas facturables, deliverables documentados. Diferenciador: portal cliente white-label + CRM verticalizado + integración facturación (no es Asana ni Monday genérico).

## Verticales target

| Vertical | Ticket promedio | Recurrencia |
|---|---|---|
| Agencias creativas/marketing | USD 2K-15K/mes retainer | Mensual recurrente 6-24 meses |
| Consultoría digital | USD 5K-30K proyecto | Per proyecto + upsell servicios |
| Desarrollo software B2B | USD 10K-100K proyecto | Per proyecto + maintenance |
| Estudios de diseño | USD 1K-10K proyecto | Per proyecto + retainer subset |
| Servicios SEO/SEM | USD 800-5K/mes retainer | Mensual recurrente 6-12 meses |

## Brand-specific gates

### B2B contracts compliance

- Propuestas/contratos con firma electrónica (eIDAS-like LatAm: AR Ley 25.506, MX FIEL, CO Ley 527, BR ICP-Brasil)
- Facturación electrónica integración (AR AFIP / MX SAT / CO DIAN / CL SII / PE SUNAT / BR SEFAZ)
- Retención de docs comerciales 5-10 años per jurisdicción
- Confidencialidad contractual (NDA workflows)

### Brand-specific anti-patterns

- ❌ Asumir pago al contado (B2B casi siempre net-30/60/90)
- ❌ Hardcodear monedas (multi-currency mandatory)
- ❌ Notificaciones automáticas a cliente sin opt-in del Account Manager (B2B requiere control)
- ❌ Voseo en UI (Nicolify es LatAm neutro, agencia rep multi-país)

## Brand-specific commands

```bash
WS=$(git rev-parse --show-toplevel)

make dev-nicolify                              # BE :8001 + FE :3001
docker logs luana-nicolify-backend-dev --tail 100
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/{module}/ -v
cd ${WS}/nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke
docker exec luana-nicolify-backend-dev alembic upgrade head
curl http://127.0.0.1:8001/health
```

## Brand-specific skills

- `/pm-nicolify` — owner SSoT funcional Nicolify
- `/po-ux`, `/po`, `/ux-agentico` — refining stories nicolify
- `/architect`, `/dev-team`, `/auditor` (con `<brand>: nicolify`)
- `manychat-expert` — ManyChat flows (canal nicolify-specific)
- `data-storyteller` — dashboards analytics (Growth Studio nicolify)

## Cross-brand reference (snapshot arqueológico)

Nicolify es **referencia histórica frozen 2026-05-15**, NO source live. Cuando otras brands necesitan ver patterns shipped antes del reorg, consultar:

- `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/stories/` — 24 stories pre-reorg done (CRM ciclo largo, B2B agencias)
- `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/` — 15 capabilities históricas
- `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/modules/` — 12 modules docs
- `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/outcomes/` — outcomes históricos

**Live cross-brand source** (post-reorg, brands ACTIVAS):
- `vitalia/` — brand más activa actualmente (Fase 1 shell complete + Fase 2 in-progress + 27 archived done + 71 capabilities)
- `comunify/` — bootstrap done con 2 stories shipped + 18 capabilities

**Code en repo** (legacy nicolify-isms purgados via promotion proposals 2026-05-16/19): `core/luana-core-*/` packages tienen el código común consolidado. NO existe `nicolify/backend/` ni `nicolify/frontend/` activo post-reorg.

## Brand checkpoint pointer

```bash
cat nicolify/docs/product/checkpoint.md
ls nicolify/docs/product/stories/
ls nicolify/docs/archive/2026/stories/   # rich history shipped
```

## Voz nicolify

Spanish neutro LatAm (tuteo). Tono: profesional cercano. NUNCA jergoso, NUNCA frío corporativo. Sales_agent: voz tenant respect (puede ser voseo AR si tenant AR).

## Referencias

- `nicolify/docs/product/vision.md`
- `nicolify/docs/learnings/` — fuente principal cross-brand learnings
- `nicolify/docs/architecture/` — ADRs brand-specific
- `core/luana-core-*/` (engine compartido)
- `.claude/rules/claude-md-overlay.md` — schema
