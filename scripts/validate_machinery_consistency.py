#!/usr/bin/env python3
# voseo-allowed: doc interno de maquinaria (no user-facing)
"""validate_machinery_consistency.py — anti-drift lock-in para la maquinaria agéntica.

Origen: auditoría 2026-05-28 (docs/process/audits/2026-05-28-agentic-machinery-audit.md).
El bug-class #1 fue DRIFT: la doctrina vive en rules/skills pero los templates que los
agentes copian (o los greps que ejecutan) quedaron atrás → artefactos no-conformes silenciosos.

Este script codifica los invariantes concretos que driftearon, para que NO vuelvan a pasar
inadvertidos. Cada CHECK es named + falla con mensaje accionable. Exit 1 si algún check falla.

Uso:
    python3 scripts/validate_machinery_consistency.py
    (o vía pre-commit Section / make machinery-check)

NO pretende ser un validador semántico general — es un guard de regresión para las clases
de drift reales encontradas. Agregá un CHECK cuando cementes un nuevo invariante doctrina↔template.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

WS = Path(
    subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
)

# Rules auto-load + templates que NO deben reintroducir el concepto muerto `atomics`
# (scenario es la unidad atómica desde lifecycle v4 2026-05-28). Se permiten líneas que
# mencionan la muerte del concepto ("MUERTO", "killed", "atomics↔headers", "Atomic write" DB).
ATOMICS_DEAD_FILES = [
    ".claude/rules/story-closure-gate.md",
    ".claude/rules/brand-docs-schema.md",
    ".claude/rules/anti-duplication-refining.md",
]
ATOMICS_ALLOWED_CTX = re.compile(
    r"MUERT|killed|muert|atomics↔headers|Atomic write|atomics/outcome|"
    r"reemplaza|se reemplaza|v4 alignment|dead|deprecat",
    re.IGNORECASE,
)
ATOMICS_TOKEN = re.compile(r"atomics?_added|atomics?_modified|`atomics\[\]`|# atomics:|atomics iniciales|atomic nuevo")

# Paths pre-multibrand (reorg 2026-05-15) que NO deben aparecer como greps ejecutables en skills.
PREMULTIBRAND_PATHS = re.compile(r"(?<![\w/])backend/src/(shared|core)/")
PREMULTIBRAND_SCAN_FILES = [
    ".claude/skills/architect-be/SKILL.md",
    ".claude/skills/architect-agentic/SKILL.md",
]

# Rules nuevas que deben existir + estar registradas en CLAUDE.md tabla Critical Rules.
REQUIRED_RULES = [
    "anti-orphan-integration.md",
    "frontend-visual-fidelity.md",
    "test-design-doctrine.md",
]

# Conceptos obligatorios que TODO spec-template (raíz + overrides por marca) debe llevar.
# El template raíz docs/specs/templates/01-spec-template.md es el SSoT de la estructura del
# 01-spec; cuando se cementa un concepto ahí, los overrides por marca deben sincronizarse o
# generan drift silencioso (HB-29 2026-06-04: shell-template sin § Mapa funcional/§ Matriz).
# Concept-based (substring, NO header-exact) porque los overrides re-estructuran las secciones.
# Agregá un concepto cuando cementes uno nuevo en el raíz (y propagalo a los overrides).
MANDATORY_SPEC_CONCEPTS = [
    "Mapa funcional",       # capa humana del refinamiento (cement 2026-05-31)
    "Matriz de cobertura",  # puente humano↔verificación (cement 2026-05-31)
    "FIRMA 1",              # RONDA 1 input-spec gate (cement 2026-06-03)
    "FIRMA 2",              # RONDA 2 ejecutable gate (cement 2026-06-03)
]

# HB-43 (cap-as-locator): el resolver `resolve_cap.py` cablea la lectura de las caps
# (dev_preview/code_ref) en el pipeline. El bug original fue que el cable estaba ROTO
# (builder keyeaba 06-tickets vacío) → locator dormido. Este CHECK evita que vuelva a
# desconectarse silenciosamente: cada superficie del pipeline DEBE referenciar el resolver.
CAP_LOCATOR_WIRED_FILES = [
    ".claude/agents/builder-backend.md",
    ".claude/agents/builder-frontend.md",
    ".claude/agents/context-builder.md",
    ".claude/agents/architect-orchestrator.md",
    ".claude/skills/architect/SKILL.md",
]

failures: list[str] = []
checks_run = 0


def check(name: str, ok: bool, detail: str) -> None:
    global checks_run
    checks_run += 1
    if ok:
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name}\n      {detail}")
        failures.append(f"{name}: {detail}")


# ── CHECK 1 — atomics muerto en rules auto-load ──────────────────────────────
def check_atomics_dead() -> None:
    bad: list[str] = []
    for rel in ATOMICS_DEAD_FILES:
        p = WS / rel
        if not p.exists():
            continue
        for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if ATOMICS_TOKEN.search(line) and not ATOMICS_ALLOWED_CTX.search(line):
                bad.append(f"{rel}:{i}: {line.strip()[:80]}")
    check(
        "CHECK 1 · atomics muerto (rules auto-load usan scenarios, no atomics)",
        not bad,
        "líneas con atomics sin contexto de muerte:\n      " + "\n      ".join(bad),
    )


# ── CHECK 2 — assignment block en 06-tickets-template ────────────────────────
def check_assignment_block() -> None:
    p = WS / "docs/specs/templates/06-tickets-template.yaml"
    txt = p.read_text(encoding="utf-8") if p.exists() else ""
    # ≥3 bloques assignment reales (T1/T2/T3), con primary_agent
    n_primary = len(re.findall(r"^\s{4}primary_agent:\s*builder-", txt, re.MULTILINE))
    check(
        "CHECK 2 · 06-tickets-template tiene assignment block (primary_agent en T1/T2/T3)",
        n_primary >= 3,
        f"esperaba ≥3 'primary_agent: builder-*' indentados, encontró {n_primary} (rule architect-autonomous-mode.md Step 7.5)",
    )


# ── CHECK 3 — greps pre-multibrand en architect skills ───────────────────────
def check_premultibrand_paths() -> None:
    bad: list[str] = []
    for rel in PREMULTIBRAND_SCAN_FILES:
        p = WS / rel
        if not p.exists():
            continue
        for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if PREMULTIBRAND_PATHS.search(line):
                bad.append(f"{rel}:{i}: {line.strip()[:80]}")
    check(
        "CHECK 3 · architect skills sin paths pre-multibrand (backend/src/{shared,core}/)",
        not bad,
        "NO-NEW-LAYER no-op risk:\n      " + "\n      ".join(bad),
    )


# ── CHECK 4 — dispatch-plan-template existe ──────────────────────────────────
def check_dispatch_plan_template() -> None:
    p = WS / "docs/specs/templates/dispatch-plan-template.md"
    check(
        "CHECK 4 · dispatch-plan-template.md existe (5º artefacto ready package)",
        p.exists(),
        "falta docs/specs/templates/dispatch-plan-template.md",
    )


# ── CHECK 5 — rules nuevas existen + registradas en CLAUDE.md ────────────────
def check_rules_registered() -> None:
    claude_md = (WS / "CLAUDE.md").read_text(encoding="utf-8")
    for rule in REQUIRED_RULES:
        p = WS / ".claude/rules" / rule
        check(f"CHECK 5 · rule existe: {rule}", p.exists(), f"falta .claude/rules/{rule}")
        check(
            f"CHECK 5 · rule registrada en CLAUDE.md: {rule}",
            rule in claude_md,
            f"{rule} no aparece en CLAUDE.md (tabla Critical Rules)",
        )


# ── CHECK 6 — refs .claude/rules/*.md en la MAQUINARIA resuelven ─────────────
# Scope: pipeline architect→dev-team→auditor + agentes (builders/auditores/etc).
# NO escanea skills PM brand-domain (referencian rules brand planeadas, p.ej. hipaa-lite.md —
# eso es deuda PM separada, no de la maquinaria; ver plan de hardening).
MACHINERY_SKILL_DIRS = [
    ".claude/skills/architect", ".claude/skills/architect-be",
    ".claude/skills/architect-fe", ".claude/skills/architect-agentic",
    ".claude/skills/dev-team", ".claude/skills/auditor",
]


def check_rule_refs_resolve() -> None:
    ref_re = re.compile(r"\.claude/rules/([a-z0-9-]+\.md)")
    missing: set[str] = set()
    scan_paths = [WS / ".claude/agents"] + [WS / d for d in MACHINERY_SKILL_DIRS]
    for d in scan_paths:
        if not d.exists():
            continue
        for f in d.rglob("*.md"):
            for m in ref_re.finditer(f.read_text(encoding="utf-8", errors="ignore")):
                rule = m.group(1)
                if not (WS / ".claude/rules" / rule).exists():
                    missing.add(f"{rule} (citada en {f.relative_to(WS)})")
    check(
        "CHECK 6 · refs .claude/rules/*.md en la maquinaria resuelven en filesystem",
        not missing,
        "referencias a rules inexistentes:\n      " + "\n      ".join(sorted(missing)),
    )


# ── CHECK 7 — sub-auditores tienen tool Edit (Carril A v4.2) ─────────────────
def check_auditors_have_edit() -> None:
    bad: list[str] = []
    for name in ("auditor-backend", "auditor-frontend", "auditor-agentic"):
        p = WS / ".claude/agents" / f"{name}.md"
        if not p.exists():
            bad.append(f"{name}.md ausente")
            continue
        # Parsear el frontmatter completo (entre los dos primeros '---'), no un truncado fijo:
        # la línea `description:` puede ser muy larga y empujar `tools:` más allá de N chars.
        text = p.read_text(encoding="utf-8")
        fm_match = re.search(r"^---\n(.*?)\n---", text, re.DOTALL)
        frontmatter = fm_match.group(1) if fm_match else text[:3000]
        m = re.search(r"^tools:\s*(.+)$", frontmatter, re.MULTILINE)
        if not m or "Edit" not in m.group(1):
            bad.append(f"{name}.md sin 'Edit' en tools (Carril A v4.2)")
    check(
        "CHECK 7 · sub-auditores tienen tool Edit (self-fix Carril A v4.2)",
        not bad,
        "\n      ".join(bad),
    )


# ── CHECK 8 — este validador está cableado en el pre-commit hook ─────────────
def check_self_wired_in_precommit() -> None:
    p = WS / "scripts/git-hooks/pre-commit"
    wired = p.exists() and "validate_machinery_consistency" in p.read_text(encoding="utf-8")
    check(
        "CHECK 8 · machinery-check cableado en scripts/git-hooks/pre-commit",
        wired,
        "el pre-commit no invoca validate_machinery_consistency.py (enforcement no activa). "
        "Nota: en worktrees el hook activo resuelve al checkout de main — activa al mergear.",
    )


# ── CHECK 9 — spec-template overrides sin drift vs raíz (HB-29/30) ───────────
def check_spec_template_drift() -> None:
    root = WS / "docs/specs/templates/01-spec-template.md"
    if not root.exists():
        check(
            "CHECK 9 · spec-template raíz existe",
            False,
            "falta docs/specs/templates/01-spec-template.md (SSoT estructura 01-spec)",
        )
        return
    # overrides por marca: {brand}/docs/specs/templates/01-spec-*-template.md
    overrides = sorted(WS.glob("*/docs/specs/templates/01-spec-*-template.md"))
    for tpl in [root, *overrides]:
        text = tpl.read_text(encoding="utf-8", errors="ignore")
        missing = [c for c in MANDATORY_SPEC_CONCEPTS if c not in text]
        rel = tpl.relative_to(WS)
        check(
            f"CHECK 9 · spec-template sin drift: {rel}",
            not missing,
            f"falta(n) concepto(s) cementado(s) {missing} — sincronizá con el raíz "
            "(HB-30: drift override↔raíz). Si cementaste un concepto nuevo en el raíz, "
            "propagalo a los overrides + agregalo a MANDATORY_SPEC_CONCEPTS.",
        )


# ── CHECK 10 — cap-as-locator cableado (HB-43) ───────────────────────────────
def check_cap_locator_wired() -> None:
    resolver = WS / "scripts/resolve_cap.py"
    check(
        "CHECK 10 · resolve_cap.py existe (cap-as-locator · HB-43)",
        resolver.is_file(),
        "falta scripts/resolve_cap.py — el resolver determinístico cap_target→YAML.",
    )
    if not resolver.is_file():
        return
    for rel in CAP_LOCATOR_WIRED_FILES:
        p = WS / rel
        if not p.exists():
            check(f"CHECK 10 · superficie existe: {rel}", False, f"falta {rel}")
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        check(
            f"CHECK 10 · cap-locator cableado: {rel}",
            "resolve_cap.py" in text,
            f"{rel} NO referencia resolve_cap.py — el cable cap-as-locator se desconectó "
            "(HB-43: el locator vuelve a quedar dormido). Re-cableá la lectura de la cap.",
        )


def main() -> int:
    print("validate_machinery_consistency.py — anti-drift lock-in\n")
    check_atomics_dead()
    check_assignment_block()
    check_premultibrand_paths()
    check_dispatch_plan_template()
    check_rules_registered()
    check_rule_refs_resolve()
    check_auditors_have_edit()
    check_self_wired_in_precommit()
    check_spec_template_drift()
    check_cap_locator_wired()
    print(f"\n{checks_run} checks · {len(failures)} fallos")
    if failures:
        print("\nFALLOS (drift detectado):")
        for f in failures:
            print(f"  - {f.splitlines()[0]}")
        return 1
    print("✓ machinery consistente — sin drift")
    return 0


if __name__ == "__main__":
    sys.exit(main())
