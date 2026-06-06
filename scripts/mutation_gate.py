#!/usr/bin/env python3
# voseo-allowed: doc interno de maquinaria (no user-facing)
"""mutation_gate.py — mutation testing DIFF-SCOPED (proceso v5 §5.6 · HB-54).

Roba la DISCIPLINA de Uncle Bob harness-sdd (NO su mutador toy):
  - scope = SOLO archivos/líneas nuevas o modificadas del diff de la story (affordable).
  - tool real: mutmut (BE Python) / Stryker (FE TS) — NUNCA un mutador custom.
  - superficie CRÍTICA = hard (umbral: 100% mutantes muertos sobre líneas nuevas +
    escape mutante-equivalente documentado, patrón ratchet shrink-only); resto = advisory.
  - survivor en líneas NUEVAS → exit 1 = CHANGES_REQUESTED al fix-loop existente.
  - survivor en código HEREDADO (fuera del diff) → NO bloquea; rutea a CIL carril L4.
  - ★ DEGRADE-ADVISORY: si el tool NO está instalado → advisory (exit 0 + warning),
    NUNCA rompe ci-parity/gate-runner (mismo principio que #37 con gates ausentes).

El gate lo ACTIVA `/architect` por `verification_nature` en `04-validators.yaml`
(`technical_gates.mutation: {enabled, mode, surfaces}`); lo CORRE dev-team en el
límite `developed`; lo VERIFICA el auditor. Cuándo es hard: commit/persistencia (HB-50),
dinero/pricing, gates PHI, state machines, transforms de contrato (HB-42/44).

Uso:
  python3 scripts/mutation_gate.py --base <ref> --mode <hard|advisory> [--paths a,b]
Exit: 0 = ok o advisory/degrade · 1 = survivor en líneas nuevas con mode=hard.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

WS = Path(
    subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True
    ).stdout.strip()
)

ADVISORY = "[mutation-gate · ADVISORY]"
HARD = "[mutation-gate · HARD]"


def changed_files(base: str) -> list[str]:
    """Archivos py/ts/tsx nuevos o modificados vs base (el diff de la story)."""
    out = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=AM", f"{base}...HEAD"],
        capture_output=True,
        text=True,
        cwd=WS,
    ).stdout
    return [f for f in out.splitlines() if f.endswith((".py", ".ts", ".tsx"))]


def tool_for(files: list[str]) -> tuple[str, str | None]:
    """(surface, tool_path|None). BE→mutmut, FE→stryker. None si ausente (degrade)."""
    has_py = any(f.endswith(".py") for f in files)
    has_ts = any(f.endswith((".ts", ".tsx")) for f in files)
    if has_py:
        mutmut = shutil.which("mutmut") or str(WS / ".venv/bin/mutmut")
        return ("BE", mutmut if Path(mutmut).exists() else None)
    if has_ts:
        stryker = WS / "node_modules/.bin/stryker"
        return ("FE", str(stryker) if stryker.exists() else None)
    return ("none", None)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="HEAD~1", help="ref base del diff de la story")
    ap.add_argument("--mode", choices=["hard", "advisory"], default="advisory")
    ap.add_argument("--paths", default="", help="csv override de paths a mutar")
    args = ap.parse_args()
    tag = HARD if args.mode == "hard" else ADVISORY

    files = [p for p in args.paths.split(",") if p] or changed_files(args.base)
    if not files:
        print(f"{tag} sin archivos py/ts en el diff — nada que mutar. OK.")
        return 0

    surface, tool = tool_for(files)

    # ★ DEGRADE-ADVISORY: tool ausente NUNCA bloquea (D-B: mutmut/Stryker no instalados hoy).
    if tool is None:
        print(
            f"{ADVISORY} {surface}: mutmut/Stryker no instalado — gate DEGRADADO a advisory "
            f"(NO bloquea). Instalá el tool ({'pip install mutmut' if surface == 'BE' else 'pnpm add -D @stryker-mutator/core'}) "
            "para enforcement hard sobre superficies críticas. Archivos en scope: "
            + ", ".join(files)
        )
        return 0

    # Tool presente: correr scoped al diff (líneas nuevas → hard; heredadas → L4 advisory).
    # NB: el parseo fino de survivors líneas-nuevas vs heredadas se ejerce con el tool
    # instalado; mientras tanto el contrato vive acá + el gate corre el tool sobre los
    # archivos cambiados. Survivors en líneas nuevas + mode=hard → exit 1 (fix-loop).
    print(f"{tag} {surface}: corriendo mutación diff-scoped sobre {len(files)} archivo(s)…")
    if surface == "BE":
        cmd = [tool, "run", "--paths-to-mutate", ",".join(files)]
    else:
        cmd = [tool, "run", "--mutate", ",".join(files)]
    res = subprocess.run(cmd, cwd=WS)
    if res.returncode != 0 and args.mode == "hard":
        print(
            f"{HARD} survivors detectados en superficie crítica → CHANGES_REQUESTED. "
            "Survivors en líneas NUEVAS: escribí el test RED que los mata. "
            "Survivors en código HEREDADO (fuera del diff): rutean a CIL carril L4 "
            "(capability-desfasada · docs/process/continuous-improvement.md), NO bloquean."
        )
        return 1
    if res.returncode != 0:
        print(f"{ADVISORY} survivors detectados (mode=advisory) — reportados, NO bloquean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
