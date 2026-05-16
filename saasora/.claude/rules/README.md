# SaaSora brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific saasora (SaaS y Productos Digitales — startups tech, micro-SaaS, software).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `saasora/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `saasora/`.

| Rule | Descripción |
|---|---|
| `stripe-subscriptions-and-churn.md` | Stripe subscriptions idempotentes, MRR/ARR/Churn event-sourced, changelog versioning SemVer + release notes automatizados |

**Naming:** `{topic}.md` (ej. `stripe-subscriptions-and-churn.md`).
