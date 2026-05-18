---
module: observability
brand: vitalia
last_updated: 2026-05-18
---

# observability — OpenTelemetry + Sentry

Stack de tracing distribuído (OTel BatchSpanProcessor) + alertas declarative IaC (Sentry) con graceful degradation cuando SDKs absent (dev venv).

11 NAMED cron span constants en `cron_spans.py`. PHI sanitization en agent_spans via import from `compliance/` (anti-duplication compliant — sanitize_phi_payload de engine).

## Capabilities

<!-- auto-list:start -->
- `vitalia-otel-sentry-graceful-degradation` (live)
<!-- auto-list:end -->
