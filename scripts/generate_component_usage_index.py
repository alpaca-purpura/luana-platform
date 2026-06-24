#!/usr/bin/env python3
"""Generate the Component Usage Index for a brand.

Maps each shared/kit component to the features/screens that consume it, so the
"qué toco si cambio X" question (design-system-canon.md §5.bis) has an objective
answer without browsing Storybook stories or doing ad-hoc greps.

The index also feeds the PROMOTE decision: a component used in ≥2 features (or
generic cross-brand) is a kit candidate; a single-use component stays feature-local.

Output: `{brand}/docs/architecture/COMPONENT-USAGE-INDEX.md` (gitignored · source = code).

Usage:
    python3 scripts/generate_component_usage_index.py --brand nicolify

Stdlib only (subprocess + re). If `{brand}/frontend/src/` does not exist, the
script reports it and exits 0 (not a fatal error — many brands are skeletons).
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ACTIVE_BRANDS = ("nicolify", "vitalia", "comunify", "lupulo")

# import { Foo, Bar as Baz } from "..."  →  capture the brace block + the source
_IMPORT_RE = re.compile(
    r"import\s+(?:type\s+)?(?:[\w*]+\s*,\s*)?\{([^}]*)\}\s*from\s*['\"]([^'\"]+)['\"]",
    re.DOTALL,
)
# default + namespace imports:  import Foo from "..."  /  import * as Foo from "..."
_DEFAULT_IMPORT_RE = re.compile(
    r"import\s+(?:type\s+)?([A-Z][\w]*)\s+from\s*['\"]([^'\"]+)['\"]",
)

# Sources we care about for "shared/kit/cross-feature" components.
_KIT_PREFIXES = ("@luana/ui-kit",)
_SHARED_HINTS = (
    "components/",      # ../../components/, @/components/, ../components/
    "@/components",
    "ui-kit",
)


def _workspace_root() -> Path:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        )
        return Path(out.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback: this file lives in `<root>/scripts/`.
        return Path(__file__).resolve().parent.parent


def _list_feature_files(features_dir: Path) -> list[Path]:
    """All .ts/.tsx under features/, excluding test files."""
    files: list[Path] = []
    for ext in ("*.ts", "*.tsx"):
        for p in features_dir.rglob(ext):
            name = p.name
            if name.endswith((".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".d.ts")):
                continue
            files.append(p)
    return files


def _feature_of(path: Path, features_dir: Path) -> str | None:
    """Return the feature name (first path segment under features/) for a file."""
    try:
        rel = path.relative_to(features_dir)
    except ValueError:
        return None
    parts = rel.parts
    return parts[0] if parts else None


def _is_relevant_source(source: str) -> bool:
    if any(source.startswith(p) or source == p for p in _KIT_PREFIXES):
        return True
    return any(hint in source for hint in _SHARED_HINTS)


def _parse_imports(text: str) -> list[tuple[str, str]]:
    """Return list of (component_name, source) for relevant import sources."""
    found: list[tuple[str, str]] = []

    for brace, source in _IMPORT_RE.findall(text):
        if not _is_relevant_source(source):
            continue
        for raw in brace.split(","):
            token = raw.strip()
            if not token:
                continue
            # "Foo as Bar" → keep the original exported name (Foo)
            name = token.split(" as ")[0].strip()
            # strip leading "type "
            name = name.removeprefix("type ").strip()
            if name and name[0].isupper():
                found.append((name, source))

    for name, source in _DEFAULT_IMPORT_RE.findall(text):
        if _is_relevant_source(source):
            found.append((name, source))

    return found


def _story_components(ws_root: Path) -> set[str]:
    """Component names that have a *.stories.tsx file anywhere in the workspace.

    A component "has a story in the kit" if a story file named after it exists.
    We match by basename (Button.stories.tsx → Button) and by the `title`/`id`
    heuristic of the filename, which is good enough for the index's Yes/No column.
    """
    storied: set[str] = set()
    # Limit the scan to the kit + brand frontends for speed; fall back to full
    # workspace if those dirs are absent.
    scan_roots = [
        ws_root / "core" / "@luana" / "ui-kit",
    ]
    scan_roots += [ws_root / b / "frontend" for b in ACTIVE_BRANDS]
    scan_roots = [r for r in scan_roots if r.exists()]
    if not scan_roots:
        scan_roots = [ws_root]

    for root in scan_roots:
        for p in root.rglob("*.stories.tsx"):
            base = p.name[: -len(".stories.tsx")]
            if base:
                storied.add(base)
        for p in root.rglob("*.stories.ts"):
            base = p.name[: -len(".stories.ts")]
            if base:
                storied.add(base)
    return storied


def build_index(ws_root: Path, brand: str) -> str | None:
    """Return the markdown body, or None if the brand frontend does not exist."""
    features_dir = ws_root / brand / "frontend" / "src" / "features"
    if not features_dir.exists():
        return None

    # component -> set of feature names
    usage: dict[str, set[str]] = defaultdict(set)
    # component -> representative source (for reference)
    source_of: dict[str, str] = {}

    for file in _list_feature_files(features_dir):
        feature = _feature_of(file, features_dir)
        if not feature:
            continue
        try:
            text = file.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for name, source in _parse_imports(text):
            usage[name].add(feature)
            source_of.setdefault(name, source)

    storied = _story_components(ws_root)

    lines: list[str] = []
    lines.append(f"# Component Usage Index — {brand}")
    lines.append("")
    lines.append(
        "> **Auto-generado** por `make component-index BRAND=" + brand + "` "
        "(`scripts/generate_component_usage_index.py`). **Gitignored · fuente = código.** "
        "NO editar a mano (R3 brand-docs-schema)."
    )
    lines.append("")
    lines.append(
        "Responde \"qué toco si cambio X\" (componente→features que lo consumen) sin "
        "browsear Storybook ni grep manual. Alimenta el criterio §5.bis "
        "(`design-system-canon.md`): ≥2 usos cross-feature o genérico cross-brand → kit; "
        "1 uso → feature-local."
    )
    lines.append("")

    if not usage:
        lines.append("_Sin imports de `@luana/ui-kit` / `components/` detectados en `features/`._")
        lines.append("")
        return "\n".join(lines)

    lines.append("| Componente | Importado en features | Story en kit |")
    lines.append("|---|---|---|")
    for name in sorted(usage):
        features = sorted(usage[name])
        features_str = ", ".join(f"features/{f}" for f in features)
        has_story = "Sí" if name in storied else "No"
        lines.append(f"| {name} | {features_str} | {has_story} |")
    lines.append("")

    # Quick promote signal
    kit_candidates = sorted(n for n, f in usage.items() if len(f) >= 2)
    lines.append("## Señal de promoción (§5.bis)")
    lines.append("")
    if kit_candidates:
        lines.append(
            "**≥2 usos cross-feature (kit candidate):** " + ", ".join(kit_candidates)
        )
    else:
        lines.append("_Ningún componente con ≥2 usos cross-feature en esta marca._")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--brand",
        required=True,
        help="Brand: nicolify | vitalia | comunify | lupulo",
    )
    args = parser.parse_args()
    brand = args.brand.strip().lower()

    if brand not in ACTIVE_BRANDS:
        print(
            f"[component-index] '{brand}' no es una marca activa "
            f"({', '.join(ACTIVE_BRANDS)}). Continuo igual.",
            file=sys.stderr,
        )

    ws_root = _workspace_root()
    body = build_index(ws_root, brand)

    if body is None:
        print(
            f"[component-index] {brand}/frontend/src/features/ no existe — "
            f"nada que indexar (marca esqueleto). Skipped."
        )
        return 0

    out_dir = ws_root / brand / "docs" / "architecture"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "COMPONENT-USAGE-INDEX.md"
    out_path.write_text(body, encoding="utf-8")
    print(f"[component-index] {brand} → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
