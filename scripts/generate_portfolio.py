#!/usr/bin/env python3
"""
generate_portfolio.py — Auto-gen docs/portfolio/ desde brand SSoT.

Lee:
- docs/architecture/luana-platform/01-core-audit.md (catálogo brands)
- {brand}/docs/product/checkpoint.md (frontmatter YAML state global brand)
- {brand}/docs/product/BACKLOG.md (extract counts por estado heuristic)
- docs/promotion-protocol/proposals/*.md (proposals abiertas)

Genera (idempotente, overwrite):
- docs/portfolio/PORTFOLIO.md (índice 11 universos en grilla)
- docs/portfolio/{brand}.md (1-pagers por brand) — solo regen si checkpoint cambia
- docs/portfolio/luana.md (1-pager core)

Uso:
    python3 scripts/generate_portfolio.py            # full regen
    python3 scripts/generate_portfolio.py --check    # diff dry-run, exit 1 si stale
"""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_PORTFOLIO = REPO_ROOT / "docs" / "portfolio"
DOCS_PROMOTION_PROPOSALS = REPO_ROOT / "docs" / "promotion-protocol" / "proposals"

# Catálogo 11 universos (1 luana + 10 brands).
# Ratificado per docs/architecture/luana-platform/01-core-audit.md.
UNIVERSES: list[dict[str, Any]] = [
    {
        "slug": "luana",
        "kind": "core",
        "vertical": "Engine compartido (no consumidor)",
        "cliente": "—",
        "diferenciacion": "26 paquetes luana-core-* + Extension SDK EP-1..EP-18 + cross-cutting concerns",
        "status_default": "active",
    },
    {
        "slug": "nicolify",
        "kind": "brand",
        "vertical": "Agencias + Servicios B2B",
        "cliente": "Agencias marketing, software boutique, consultoras",
        "diferenciacion": "CRM ciclo largo · portal cliente · propuestas/contratos · horas facturables",
        "status_default": "shipped",
    },
    {
        "slug": "vitalia",
        "kind": "brand",
        "vertical": "Salud + Bienestar",
        "cliente": "Clínicas médicas, dentales, estéticas",
        "diferenciacion": "Reservas prepagadas · historial médico · HIPAA-lite · seguimiento post-tratamiento",
        "status_default": "shipped",
    },
    {
        "slug": "comunify",
        "kind": "brand",
        "vertical": "Creator Economy + Educación",
        "cliente": "Coaches, creadores contenido, infoproductores",
        "diferenciacion": "Escalera valor · bóveda autoridad · motor comunidad · embudos venta",
        "status_default": "shipped",
    },
    {
        "slug": "lupulo",
        "kind": "brand",
        "vertical": "Gastronomía",
        "cliente": "Restaurantes, bares, cafeterías",
        "diferenciacion": "Reservas mesa · pedidos digitales · integración KDS via agentes IA",
        "status_default": "placeholder",
    },
    {
        "slug": "saasora",
        "kind": "brand",
        "vertical": "SaaS + Productos Digitales",
        "cliente": "Startups tech, micro-SaaS, software",
        "diferenciacion": "Onboarding automatizado · subscripciones Stripe · dashboards Churn/MRR · changelogs",
        "status_default": "pending-bootstrap",
    },
    {
        "slug": "inmoflow",
        "kind": "brand",
        "vertical": "Real Estate",
        "cliente": "Brokers, agencias inmobiliarias",
        "diferenciacion": "Integración portales · mapas interactivos · lead routing por zona · calculadoras financieras",
        "status_default": "pending-bootstrap",
    },
    {
        "slug": "retailly",
        "kind": "brand",
        "vertical": "E-commerce / D2C",
        "cliente": "Tiendas online, marcas físicas",
        "diferenciacion": "Catálogos dinámicos · cart recovery · integración logística · cross-selling checkout",
        "status_default": "pending-bootstrap",
    },
    {
        "slug": "fixia",
        "kind": "brand",
        "vertical": "Servicios Hogar + Oficios",
        "cliente": "Plomeros, electricistas, HVAC, contractors",
        "diferenciacion": "Técnicos en campo · cotización on-site · reseñas locales SEO automatizadas",
        "status_default": "pending-bootstrap",
    },
    {
        "slug": "guestly",
        "kind": "brand",
        "vertical": "Turismo + Hotelería",
        "cliente": "Hoteles boutique, rentas vacacionales, tours",
        "diferenciacion": "Motor reservas estacional · sync OTAs (Airbnb/Booking) · guest experience",
        "status_default": "pending-bootstrap",
    },
    {
        "slug": "fitflow",
        "kind": "brand",
        "vertical": "Fitness + Deporte",
        "cliente": "Gimnasios, estudios yoga, boxes",
        "diferenciacion": "Facturación recurrente · control aforo · calendario clases · waivers",
        "status_default": "pending-bootstrap",
    },
]

STATUS_EMOJI = {
    "active": "🟢",
    "shipped": "✅",
    "placeholder": "🟡",
    "pending-bootstrap": "⏳",
    "blocked": "🚧",
}


def parse_frontmatter(content: str) -> dict[str, Any]:
    """Extract YAML frontmatter from markdown. Returns {} if absent or malformed."""
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    fm: dict[str, Any] = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        fm[key.strip()] = value.strip().strip('"').strip("'")
    return fm


def read_brand_checkpoint(slug: str) -> dict[str, Any]:
    """Read {brand}/docs/product/checkpoint.md frontmatter."""
    path = REPO_ROOT / slug / "docs" / "product" / "checkpoint.md"
    if not path.exists():
        return {}
    return parse_frontmatter(path.read_text(encoding="utf-8"))


def count_proposals_by_state() -> dict[str, int]:
    """Count promotion proposals grouped by state."""
    counts = {"proposed": 0, "under_review": 0, "accepted": 0, "rejected": 0, "migrated": 0}
    if not DOCS_PROMOTION_PROPOSALS.exists():
        return counts
    for proposal_file in DOCS_PROMOTION_PROPOSALS.glob("*.md"):
        if proposal_file.stem.startswith("EXAMPLE"):
            continue  # Ejemplos no cuentan
        fm = parse_frontmatter(proposal_file.read_text(encoding="utf-8"))
        state = fm.get("state", "proposed")
        counts[state] = counts.get(state, 0) + 1
    return counts


def render_portfolio_md(today: str) -> str:
    """Render docs/portfolio/PORTFOLIO.md (índice grilla 11 universos)."""
    lines = [
        "<!-- AUTO-GENERATED por scripts/generate_portfolio.py — NO editar a mano -->",
        "<!-- Para regenerar: make portfolio -->",
        "",
        "# Portfolio Luana — 11 universos",
        "",
        "> Vista master del portfolio. Pointer-first: cada entrada apunta a SSoT vivo en `docs/portfolio/{slug}.md` (1-pager) y `{brand}/docs/product/checkpoint.md` (state actual).",
        ">",
        "> **Filosofía:** este file no contiene contenido — solo punteros. El detalle vive donde nace.",
        "",
        "---",
        "",
    ]

    # Núcleo
    luana = UNIVERSES[0]
    lines += [
        "## Núcleo",
        "",
        "| Slug | Tipo | Estado | 1-pager | SSoT live |",
        "|---|---|---|---|---|",
        f"| {luana['slug']} | {luana['kind']} | {STATUS_EMOJI['active']} active | [docs/portfolio/{luana['slug']}.md](./{luana['slug']}.md) | [docs/product/](../product/) + [docs/core-modules/](../core-modules/) |",
        "",
    ]

    # Brands shipped
    shipped = [u for u in UNIVERSES if u["kind"] == "brand" and u["status_default"] == "shipped"]
    if shipped:
        lines += [
            "## Brands shipped",
            "",
            "| Slug | Vertical | Estado actual | 1-pager | SSoT live |",
            "|---|---|---|---|---|",
        ]
        for u in shipped:
            cp = read_brand_checkpoint(u["slug"])
            status_actual = cp.get("status", u["status_default"])
            emoji = STATUS_EMOJI.get(status_actual, "")
            lines.append(
                f"| {u['slug']} | {u['vertical']} | {emoji} {status_actual} | "
                f"[{u['slug']}.md](./{u['slug']}.md) | "
                f"[{u['slug']}/docs/product/](../../{u['slug']}/docs/product/) |"
            )
        lines.append("")

    # Brands placeholder
    placeholder = [u for u in UNIVERSES if u["kind"] == "brand" and u["status_default"] == "placeholder"]
    if placeholder:
        lines += [
            "## Brands placeholder",
            "",
            "| Slug | Vertical | Estado actual | 1-pager | SSoT live |",
            "|---|---|---|---|---|",
        ]
        for u in placeholder:
            cp = read_brand_checkpoint(u["slug"])
            status_actual = cp.get("status", u["status_default"])
            emoji = STATUS_EMOJI.get(status_actual, "")
            lines.append(
                f"| {u['slug']} | {u['vertical']} | {emoji} {status_actual} | "
                f"[{u['slug']}.md](./{u['slug']}.md) | "
                f"[{u['slug']}/docs/product/](../../{u['slug']}/docs/product/) |"
            )
        lines.append("")

    # Brands pendientes bootstrap
    pending = [u for u in UNIVERSES if u["kind"] == "brand" and u["status_default"] == "pending-bootstrap"]
    if pending:
        lines += [
            "## Brands pendientes bootstrap",
            "",
            "| Slug | Vertical | Estado | Bootstrap target |",
            "|---|---|---|---|",
        ]
        for u in pending:
            lines.append(
                f"| {u['slug']} | {u['vertical']} | {STATUS_EMOJI['pending-bootstrap']} pending | "
                f"template `_pm-brand-template/` |"
            )
        lines.append("")

    # Promotion proposals
    proposals = count_proposals_by_state()
    total_open = proposals["proposed"] + proposals["under_review"] + proposals["accepted"]
    lines += [
        "---",
        "",
        "## Promotion proposals",
        "",
        f"> Patrones brand candidatos a lift a luana-core. Lifecycle: proposed → under_review → accepted/rejected → migrated.",
        "",
        f"- **Open:** {total_open} (proposed: {proposals['proposed']}, under_review: {proposals['under_review']}, accepted: {proposals['accepted']})",
        f"- **Migrated:** {proposals['migrated']}",
        f"- **Rejected (archive):** {proposals['rejected']}",
        "",
        "Ver [docs/promotion-protocol/proposals/](../promotion-protocol/proposals/).",
        "",
        "---",
        "",
        f"**Última regen:** {today} (auto via `make portfolio`).",
        "",
    ]
    return "\n".join(lines)


def render_brand_1pager(u: dict[str, Any], today: str) -> str:
    """Render docs/portfolio/{slug}.md 1-pager para brand."""
    slug = u["slug"]
    cp = read_brand_checkpoint(slug)
    status_actual = cp.get("status", u["status_default"])

    if u["kind"] == "core":
        return render_luana_1pager(today, status_actual)

    return f"""---
slug: {slug}
kind: brand
status: {status_actual}
vertical: "{u['vertical']}"
last_updated: {today}
ssot_live:
  - {slug}/docs/product/
  - {slug}/docs/domains/
  - {slug}/docs/learnings/
  - {slug}/docs/architecture/
owner: /pm-{slug}
---

# {slug.capitalize()} — {u['vertical']}

> 1-pager pointer. Detalle vivo en `{slug}/docs/`.

## Vertical

{u['vertical']}

## Cliente objetivo

{u['cliente']}

## Diferenciación core

{u['diferenciacion']}

## Estado

`{status_actual}`

## Surfaces

| Tipo | Path |
|---|---|
| Backlog | [{slug}/docs/product/BACKLOG.md](../../{slug}/docs/product/BACKLOG.md) |
| Outcomes | [{slug}/docs/product/outcomes/](../../{slug}/docs/product/outcomes/) |
| Stories | [{slug}/docs/product/stories/](../../{slug}/docs/product/stories/) |
| Capabilities | [{slug}/docs/product/capabilities/](../../{slug}/docs/product/capabilities/) |
| Modules | [{slug}/docs/product/modules/](../../{slug}/docs/product/modules/) |
| Domains | [{slug}/docs/domains/](../../{slug}/docs/domains/) |
| Learnings | [{slug}/docs/learnings/](../../{slug}/docs/learnings/) |
| Architecture (ADRs locales) | [{slug}/docs/architecture/](../../{slug}/docs/architecture/) |
| Brand config | [{slug}/config/](../../{slug}/config/) |
| Code BE | [{slug}/backend/](../../{slug}/backend/) |
| Code FE | [{slug}/frontend/](../../{slug}/frontend/) |

## Ownership

- `/pm-{slug}` (skill) — owner backlog, outcomes, stories
- `/pm` (master) — visibility cross-portfolio

## Drill-down

`cat {slug}/docs/product/checkpoint.md` para state actual.
"""


def render_luana_1pager(today: str, status: str) -> str:
    """Render docs/portfolio/luana.md 1-pager core."""
    proposals = count_proposals_by_state()
    return f"""---
slug: luana
kind: core
status: {status}
last_updated: {today}
ssot_live:
  - docs/product/
  - docs/core-modules/
  - docs/promotion-protocol/
  - docs/architecture/luana-platform/
owner: /pm-luana
---

# Luana — core engine

> El núcleo compartido del portfolio. NO es brand consumidora — es la "constitución" sobre la que las 10 brands construyen.

## Razón de existir

Acelerar dev cross-brand. Cada brand aporta aprendizaje → core captura abstracciones reutilizables → nuevas brands arrancan ya con superpoderes acumulados.

## Surfaces

| Tipo | Path | Descripción |
|---|---|---|
| Engine packages | [`core/luana-core-*`](../../core/) | 26 paquetes Python + TS publicables |
| Extension SDK | `core/luana-core-extension-sdk/` | EP-1..EP-18 contracts |
| Cross-cutting concerns | [`docs/core-modules/`](../core-modules/) | 22 transversales |
| Promotion protocol | [`docs/promotion-protocol/`](../promotion-protocol/) | brand→core lift gate |

## Promotion proposals (live)

- Proposed: {proposals['proposed']}
- Under review: {proposals['under_review']}
- Accepted (lift programado): {proposals['accepted']}
- Migrated (cerrados OK): {proposals['migrated']}
- Rejected (archive): {proposals['rejected']}

## State portfolio

- 26 packages extraídos
- 4 brands consumidoras (3 shipped: Nicolify, Vitalia, Comunify + 1 placeholder: Lupulo)
- 6 pendientes bootstrap (SaaSora, InmoFlow, Retailly, Fixia, Guestly, FitFlow)

## Ownership

- `/pm-luana` (skill) — owner promotion gate, semver, breaking changes, EPs
- `/pm` (master) — orquesta visibility cross-portfolio

## Drill-down

- Roadmap platform: `docs/product/outcomes/`
- Promotion candidates: `docs/promotion-protocol/proposals/`
- Plan multibrand original: `docs/architecture/luana-platform/01-core-audit.md`
- Purge audit: `docs/architecture/luana-platform/02-core-purge-audit.md`
"""


def regen_all(check_only: bool = False) -> int:
    """Regen full portfolio. Returns 0 if no changes (or check OK), 1 if stale."""
    today = date.today().isoformat()
    DOCS_PORTFOLIO.mkdir(parents=True, exist_ok=True)

    files_to_write: dict[Path, str] = {
        DOCS_PORTFOLIO / "PORTFOLIO.md": render_portfolio_md(today),
    }
    for u in UNIVERSES:
        files_to_write[DOCS_PORTFOLIO / f"{u['slug']}.md"] = render_brand_1pager(u, today)

    stale = False
    for path, content in files_to_write.items():
        existing = path.read_text(encoding="utf-8") if path.exists() else ""
        if existing.strip() != content.strip():
            stale = True
            if not check_only:
                path.write_text(content, encoding="utf-8")
                print(f"regen: {path.relative_to(REPO_ROOT)}")
            else:
                print(f"stale: {path.relative_to(REPO_ROOT)}")

    if check_only and stale:
        print("\nERROR: portfolio is stale. Run: python3 scripts/generate_portfolio.py", file=sys.stderr)
        return 1
    if not stale and not check_only:
        print("portfolio: nothing to regen (already fresh)")
    return 0


if __name__ == "__main__":
    check = "--check" in sys.argv
    sys.exit(regen_all(check_only=check))
