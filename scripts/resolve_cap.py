#!/usr/bin/env python3
# voseo-allowed: doc interno de maquinaria (no user-facing)
"""resolve_cap.py — resuelve `cap_target` (de checkpoint.md) → archivo(s) cap YAML.

Origen: HB-43 (2026-06-04). El "cap-as-locator" estaba dormido porque `cap_target`
→ path del YAML NO es resoluble de forma ingenua: las formas son mixtas —
  · "crm/adrian-embudo"        (module/slug · path-style)
  · "lisa.doctores"           (functional_area · agent.feature)
  · "adrian.inbox"            (functional_area que abarca VARIAS caps → área)
  · "adrian-embudo"           (slug pelado)
  · "vitalia.crm.adrian-embudo" (capability_id)
No hay dir `adrian/`; el archivo vive en `capabilities/{tech_module}/{file-slug}.yaml`.

Este resolver es la pieza determinística que mata el footgun: los agentes
(architect-orchestrator, context-builder, builder-{backend,frontend}) lo llaman en vez
de adivinar el path. Determinístico + testeable (scripts/tests/test_resolve_cap.py) →
NO se vuelve paper-rule: si se rompe, los tests fallan.

Resolución por TIERS (gana el primer tier no-vacío, para no mezclar preciso con fuzzy):
  TIER 1 (preciso):  capability_id · functional_area · slug(==ct o dashed) ·
                     "{module}/{slug}" · "{module}.{slug}" · relpath-sin-.yaml
  TIER 2 (fuzzy):    stem == último segmento de ct (sólo si TIER 1 vacío)

Un `cap_target` que es un ÁREA funcional (`adrian.inbox`) resuelve a N archivos — correcto:
el agente lee el dev_preview de todo el área. Ambigüedad ≠ error.

Uso:
    python3 scripts/resolve_cap.py <brand> "<cap_target>"             # imprime path(s), 1 por línea
    python3 scripts/resolve_cap.py <brand> "<cap_target>" --extract   # + bloque compacto dev_preview/code_ref/scenarios

Exit: 0 si resolvió ≥1 · 2 si 0 matches · 1 si error de uso.

Gating (responsabilidad del CALLER, no de este script): sólo vale la pena llamarlo cuando
`cap_change_type ∈ {fix, extend, derive}` — una cap `new` tiene `dev_preview` vacío (nada
que navegar). El caller lee `cap_change_type` de checkpoint.md antes de invocar.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - el venv root siempre lo trae
    yaml = None  # type: ignore[assignment]

WS = Path(
    subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
)


def _norm(s: str) -> str:
    """Normaliza para comparar: lower + strip + colapsa separadores . / a `/`."""
    return s.strip().lower().replace(".", "/")


def _identity(text: str) -> dict[str, str]:
    """Extrae campos identidad por line-scan robusto (tolera YAML malformado)."""
    out: dict[str, str] = {}
    wanted = ("capability_id", "slug", "functional_area", "module", "tech_module")
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].rstrip()  # drop inline comment
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        if key in wanted and key not in out:
            v = val.strip().strip("'\"")
            if v:
                out[key] = v
    return out


def _cap_root(brand: str, root: Path | None) -> Path:
    return root if root is not None else WS / brand / "docs" / "product" / "capabilities"


def cap_files(brand: str, root: Path | None = None) -> list[Path]:
    base = _cap_root(brand, root)
    if not base.is_dir():
        return []
    return sorted(p for p in base.rglob("*.yaml") if not p.name.startswith("_") and p.name != "README.md")


def resolve(brand: str, cap_target: str, root: Path | None = None) -> list[Path]:
    ct = _norm(cap_target)
    ct_dashed = ct.replace("/", "-")  # "lisa/doctores" -> "lisa-doctores"
    ct_tail = ct.rsplit("/", 1)[-1]  # último segmento
    base = _cap_root(brand, root)

    tier1: list[Path] = []
    tier2: list[Path] = []
    for f in cap_files(brand, root):
        ident = _identity(f.read_text(encoding="utf-8", errors="ignore"))
        cap_id = _norm(ident.get("capability_id", ""))
        slug = _norm(ident.get("slug", ""))
        fa = _norm(ident.get("functional_area", ""))
        module = _norm(ident.get("module") or ident.get("tech_module", ""))
        relpath = _norm(str(f.relative_to(base).with_suffix("")))  # "crm/adrian-embudo"
        stem = _norm(f.stem)

        precise = (
            cap_id == ct
            or cap_id.endswith("/" + ct)
            or fa == ct
            or slug == ct
            or slug == ct_dashed
            or relpath == ct
            or (module and (f"{module}/{slug}" == ct))
        )
        if precise:
            tier1.append(f)
        elif stem == ct_tail or stem == ct_dashed:
            tier2.append(f)

    return tier1 if tier1 else tier2


def _extract_block(f: Path) -> str:
    try:
        rel = f.relative_to(WS)
    except ValueError:  # fixture fuera de WS (tests)
        rel = f
    lines = [f"# cap: {rel}"]
    data: dict | None = None
    if yaml is not None:
        # Las cap YAML traen >1 documento (`---`) y el doc-cola suele ser prosa
        # malformada (colon suelto) que revienta safe_load_all entero. Split por
        # separador + parse por chunk con try/except → un doc roto no tumba el resto.
        merged: dict = {}
        for chunk in re.split(r"(?m)^---[ \t]*$", f.read_text(encoding="utf-8", errors="ignore")):
            if not chunk.strip():
                continue
            try:
                doc = yaml.safe_load(chunk)
            except Exception:  # noqa: BLE001 - extract es best-effort
                continue
            if isinstance(doc, dict):
                merged.update(doc)
        data = merged or None
    if not isinstance(data, dict):
        lines.append("  (no parseable — leé el archivo directo)")
        return "\n".join(lines)

    lines.append(f"  slug: {data.get('slug')} · status: {data.get('status')}")
    pkg = data.get("package_path")
    if pkg:
        lines.append(f"  package_path: {pkg}")

    dp = data.get("dev_preview")
    if isinstance(dp, dict):
        mc = dp.get("main_component")
        if mc:
            lines.append(f"  dev_preview.main_component: {mc}")
        for key in ("backend_endpoint", "backend_endpoints", "api", "route", "primary_route"):
            if dp.get(key):
                lines.append(f"  dev_preview.{key}: {dp[key]}")
        eps = dp.get("entry_points")
        if isinstance(eps, list):
            for ep in eps:
                if isinstance(ep, dict) and ep.get("path"):
                    lines.append(f"  entry_point: {ep['path']} (roles={ep.get('roles')})")
    elif dp:
        lines.append(f"  dev_preview: {dp}")

    brs = data.get("business_rules")
    if isinstance(brs, list):
        refs = [b["code_ref"] for b in brs if isinstance(b, dict) and b.get("code_ref")]
        for r in refs:
            lines.append(f"  code_ref: {r}")

    scs = data.get("scenarios")
    if isinstance(scs, list):
        names = []
        for s in scs:
            if isinstance(s, dict):
                names.append(str(s.get("id") or s.get("name") or s.get("title") or "?"))
        if names:
            lines.append(f"  scenarios ({len(names)}): {', '.join(names[:12])}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    extract = "--extract" in argv
    if len(args) != 2:
        print("uso: resolve_cap.py <brand> <cap_target> [--extract]", file=sys.stderr)
        return 1
    brand, cap_target = args
    if cap_target.lower() in ("null", "none", ""):
        print(f"UNRESOLVED: cap_target nulo ({cap_target!r}) — cap `new` sin hogar o story sin cap", file=sys.stderr)
        return 2

    matches = resolve(brand, cap_target)
    if not matches:
        print(f"UNRESOLVED: ningún cap matchea '{cap_target}' en {brand}/docs/product/capabilities/", file=sys.stderr)
        return 2

    if extract:
        if len(matches) > 1:
            print(f"# {len(matches)} caps en el área '{cap_target}' — navegá los punteros de TODAS:")
        for f in matches:
            print(_extract_block(f))
    else:
        for f in matches:
            print(f.relative_to(WS))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
