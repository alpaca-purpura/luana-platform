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
        capture_output=True,
        text=True,
        check=True,
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
    "Mapa funcional",  # capa humana del refinamiento (cement 2026-05-31)
    "Matriz de cobertura",  # puente humano↔verificación (cement 2026-05-31)
    "FIRMA 1",  # RONDA 1 input-spec gate (cement 2026-06-03)
    "FIRMA 2",  # RONDA 2 ejecutable gate (cement 2026-06-03)
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
    ".claude/skills/architect",
    ".claude/skills/architect-be",
    ".claude/skills/architect-fe",
    ".claude/skills/architect-agentic",
    ".claude/skills/dev-team",
    ".claude/skills/auditor",
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


# ── CHECK 11 — cap-format enforcement determinístico G1-G6 cableado (HB-51) ──
# Anti-rot CON DIENTES: si alguien borra un gate, su negative test, o un script de
# las 8 capas, el CHECK falla. El enforcement determinístico NO debe poder
# desconectarse en silencio (es la lección recurrente advisory≠enforcement).
def check_cap_format_enforcement_wired() -> None:
    bidir = WS / "scripts/validate_code_cap_bidirectional.py"
    bidir_src = bidir.read_text(encoding="utf-8") if bidir.exists() else ""
    test_bidir = WS / "scripts/tests/test_validate_code_cap_bidirectional.py"
    test_src = test_bidir.read_text(encoding="utf-8") if test_bidir.exists() else ""

    # 11a · los 6 gates + el dispatcher existen en el validador
    for gid in ("g1", "g2", "g3", "g4", "g5", "g6", "g7"):
        check(
            f"CHECK 11 · gate {gid.upper()} definido en validate_code_cap_bidirectional.py",
            f"def gate_{gid}_" in bidir_src,
            f"falta la función gate_{gid}_* — un gate determinístico se desconectó (HB-51 Capa 4).",
        )
    check(
        "CHECK 11 · dispatcher run_cap_gates presente",
        "def run_cap_gates" in bidir_src and "--cap-gates-hard" in bidir_src,
        "falta run_cap_gates / flag --cap-gates-hard.",
    )

    # 11b · cada gate tiene su negative test EN ROJO + el repro del incidente origen
    for gid in ("g1", "g2", "g3", "g4", "g5", "g6", "g7"):
        check(
            f"CHECK 11 · negative test del gate {gid.upper()} (con dientes)",
            f"def test_{gid}_red" in test_src,
            f"falta test_{gid}_red_* — un gate sin negative test es decorativo (handoff §0.3).",
        )
    check(
        "CHECK 11 · test de reproducción del incidente (borrar cap inbox → G1+G2 RED)",
        "test_repro_delete_inbox_cap_trips_g1_and_g2" in test_src,
        "falta el test de regresión del incidente origen.",
    )

    # 11c · resolver two-way + scripts de las capas 2/3/8 existen
    rc = (WS / "scripts/resolve_cap.py").read_text(encoding="utf-8") if (WS / "scripts/resolve_cap.py").exists() else ""
    check(
        "CHECK 11 · resolver two-way (resolve_cap_ids + canonical_cap_id)",
        "def resolve_cap_ids" in rc and "def canonical_cap_id" in rc,
        "resolve_cap.py perdió la resolución two-way (HB-51 Capa 1).",
    )
    for script, layer in (
        ("scripts/new_cap.py", "Capa 2 generator"),
        ("scripts/validate_caps_schema.py", "Capa 3 schema"),
        ("scripts/cap_doctor.py", "Capa 8 health report"),
    ):
        check(
            f"CHECK 11 · {script} existe ({layer})",
            (WS / script).is_file(),
            f"falta {script} ({layer}).",
        )

    # 11d · el generator es consumido por el índice (Capa 5) + gates HARD cableados en hooks
    idx = WS / "scripts/generate_code_to_cap_index.py"
    idx_src = idx.read_text(encoding="utf-8") if idx.exists() else ""
    check(
        "CHECK 11 · index consume el resolver (Capa 5 · resolved_cap_to_files)",
        "resolve_cap" in idx_src and "resolved_cap_to_files" in idx_src,
        "generate_code_to_cap_index.py NO unifica vía resolver (las 2 convenciones divergen).",
    )
    pc = WS / "scripts/git-hooks/pre-commit"
    pp = WS / "scripts/git-hooks/pre-push"
    check(
        "CHECK 11 · gates HARD cableados en pre-commit (5e) + pre-push (4e)",
        (pc.exists() and "cap-gates-hard" in pc.read_text(encoding="utf-8"))
        and (pp.exists() and "cap-gates-hard" in pp.read_text(encoding="utf-8")),
        "los gates G1-G6 no están cableados HARD en los hooks (advisory≠enforcement).",
    )


# ── CHECK 12 — cap-display = función, no versión (HB-52 · proceso v5 W1) ──────
# Anti-rot CON DIENTES: «✨ Qué puedo hacer» SIEMPRE responde QUÉ HAGO, nunca la
# versión interna del SDD. Si alguien reintroduce v3.x/F.3/migrará en el empty-state
# de ScenariosSection, o borra el fallback a user_facing_description, el CHECK falla.
# (negative-test: re-insertar "Cap todavía v3.1 · migrará…" → exit 1.)
CAP_DISPLAY_FILE = "tools/luana-cockpit/components/cap-drawer/sections/ScenariosSection.tsx"
CAP_DISPLAY_VERSION_JARGON = re.compile(r"v3\.\d|F\.3|migrar|Fase\s+F\.3", re.IGNORECASE)


def check_cap_display_no_version_jargon() -> None:
    p = WS / CAP_DISPLAY_FILE
    if not p.exists():
        check("CHECK 12 · ScenariosSection existe", False, f"falta {CAP_DISPLAY_FILE}")
        return
    text = p.read_text(encoding="utf-8", errors="ignore")
    jargon = CAP_DISPLAY_VERSION_JARGON.search(text)
    check(
        "CHECK 12 · cap-display sin jerga de versión (HB-52)",
        jargon is None,
        f"{CAP_DISPLAY_FILE} muestra jerga de versión del SDD interno "
        f"(«{jargon.group(0) if jargon else ''}») en la vista funcional. "
        "«✨ Qué puedo hacer» SIEMPRE responde función, nunca versión (v3.x/F.3/migrará). "
        "Quitala + caé al texto funcional (user_facing_description).",
    )
    check(
        "CHECK 12 · cap-display tiene fallback funcional (user_facing_description)",
        "userFacingDescription" in text or "user_facing_description" in text,
        f"{CAP_DISPLAY_FILE} no referencia user_facing_description — el empty-state debe "
        "caer al texto funcional de la cap, no a un placeholder mudo (HB-52 invariante).",
    )


# ── CHECK 13-18 — spine G/R/auditor (proceso v5 W2 · story-closure-gate) ─────
# Anti-rot CON DIENTES del corazón del rediseño: G (Chris-verify) pausa antes del
# auditor, R (reconcile) precede al auditor, el signoff es UN solo campo, y la
# story en G NO deadlockea su módulo. Si cualquier cable se corta → CHECK falla.
DEVTEAM_SKILL = ".claude/skills/dev-team/SKILL.md"
CHECKPOINT_TMPL = "docs/specs/templates/checkpoint-template.md"
CLOSURE_RULE = ".claude/rules/story-closure-gate.md"
AUDITOR_SKILL = ".claude/skills/auditor/SKILL.md"
PM_SKILLS = [
    ".claude/skills/pm-vitalia/SKILL.md",
    ".claude/skills/pm-nicolify/SKILL.md",
    ".claude/skills/pm-comunify/SKILL.md",
    ".claude/skills/pm-lupulo/SKILL.md",
]
DOD37_RULE = ".claude/rules/definition-of-done-live-verify.md"


def _read(rel: str) -> str:
    p = WS / rel
    return p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""


def check_g_pause_wired() -> None:
    t = _read(DEVTEAM_SKILL)
    check(
        "CHECK 13 · G · dev-team pausa-y-ofrece (AWAIT_CHRIS_VERIFY) en vez de auto-handoff",
        "AWAIT_CHRIS_VERIFY" in t and "autonomous_mode" in t,
        f"{DEVTEAM_SKILL} no cablea la pausa G (AWAIT_CHRIS_VERIFY) + rama autonomous_mode. "
        "Sin esto el dev-team auto-handoffea a /auditor sin que Chris verifique (proceso v5 §5.3).",
    )


def check_chris_verify_schema() -> None:
    t = _read(CHECKPOINT_TMPL)
    check(
        "CHECK 14 · checkpoint schema tiene chris_verify (signoff + rounds) + reconciled",
        "chris_verify:" in t and "rounds:" in t and "reconciled:" in t,
        f"{CHECKPOINT_TMPL} no tiene el bloque chris_verify (signoff/rounds) + reconciled. "
        "Es el hogar del signoff de G + el marcador de R (proceso v5 §5.3/§5.4).",
    )


def check_await_verify_wip_exempt() -> None:
    # ★ guard del deadlock: la story en G no debe contar contra developed≤1.
    dev = _read(DEVTEAM_SKILL)
    closure = _read(CLOSURE_RULE)
    dev_ok = "AWAIT_CHRIS_VERIFY" in dev and 'PHASE' in dev and 'AWAIT_CHRIS_VERIFY"' in dev
    check(
        "CHECK 15 · WIP-cap exime AWAIT_CHRIS_VERIFY en dev-team REFUSE-gate (anti-deadlock)",
        dev_ok,
        f"{DEVTEAM_SKILL} no exime phase AWAIT_CHRIS_VERIFY en el gate module-scoped. "
        "Una story en G deadlockearía otra del mismo módulo (proceso v5 · story-closure-gate).",
    )
    check(
        "CHECK 15 · story-closure-gate documenta AWAIT_CHRIS_VERIFY como parked",
        "AWAIT_CHRIS_VERIFY" in closure,
        f"{CLOSURE_RULE} no documenta la exención WIP-cap de AWAIT_CHRIS_VERIFY.",
    )


def check_signoff_single_field() -> None:
    # anti-dup: el signoff vive en chris_verify.signoff (G). NADIE debe gatear por
    # demo_signoff.result (el viejo campo F, duplicado).
    for rel in (PM_SKILLS[0], DOD37_RULE):
        t = _read(rel)
        check(
            f"CHECK 16 · signoff único chris_verify (no demo_signoff.result activo): {rel}",
            "chris_verify.signoff" in t and "demo_signoff.result" not in t,
            f"{rel} aún gatea por demo_signoff.result (duplicado F+G) o no referencia "
            "chris_verify.signoff. El signoff es UN solo campo en G (proceso v5 §5.3).",
        )


def check_reconcile_step() -> None:
    for rel in PM_SKILLS:
        t = _read(rel)
        check(
            f"CHECK 17 · R · reconcile-step (pre-auditor) + reconciled marker: {rel}",
            "reconcile" in t.lower() and "reconciled" in t,
            f"{rel} no tiene el paso R (reconcile pre-auditor) + marcador reconciled. "
            "Sin R el auditor lee un spec stale (proceso v5 §5.4).",
        )
    closure = _read(CLOSURE_RULE)
    check(
        "CHECK 17 · story-closure-gate documenta Fase R (reconcile)",
        "RECONCILE" in closure.upper(),
        f"{CLOSURE_RULE} no documenta la Fase R entre developed y reviewing.",
    )


def check_auditor_reads_reconciled() -> None:
    t = _read(AUDITOR_SKILL)
    check(
        "CHECK 18 · auditor precondición reconciled + chris_verify.signoff + rounds-allowlist",
        "reconciled" in t and "chris_verify" in t and "rounds" in t,
        f"{AUDITOR_SKILL} no exige reconciled (o autonomous) ni lee chris_verify.signoff/rounds. "
        "El auditor guardián NO revierte scope ratificado pero un delta fuera de rounds sí es "
        "finding (proceso v5 §5.5).",
    )


# ── CHECK 19-21 — mutation gate diff-scoped (proceso v5 W3 · HB-54) ───────────
# Anti-rot del gate de mutación: el wrapper diff-scoped existe + DEGRADA advisory si
# el tool no está (D-B: mutmut/Stryker ausentes hoy) + el survivor heredado rutea a L4.
MUTATION_GATE = "scripts/mutation_gate.py"
ARCHITECT_SKILL = ".claude/skills/architect/SKILL.md"
VALIDATORS_TMPL = "docs/specs/templates/04-validators-template.yaml"


def check_mutation_gate_validators() -> None:
    val = _read(VALIDATORS_TMPL)
    arch = _read(ARCHITECT_SKILL)
    dod = _read(DOD37_RULE)
    check(
        "CHECK 19 · 04-validators technical_gates.mutation (enabled/mode/surfaces)",
        "mutation:" in val and "surfaces:" in val and "mode:" in val,
        f"{VALIDATORS_TMPL} no tiene el bloque technical_gates.mutation (enabled/mode/surfaces) "
        "que /architect marca por verification_nature (proceso v5 §5.6).",
    )
    check(
        "CHECK 19 · architect marca superficies mutation-críticas + #37 aloja el gate",
        ("technical_gates.mutation" in arch or "mutation_gate.py" in arch) and "mutation_gate.py" in dod,
        "architect no marca technical_gates.mutation o #37 §2 no aloja scripts/mutation_gate.py.",
    )


def check_mutation_degrade_advisory() -> None:
    t = _read(MUTATION_GATE)
    check(
        "CHECK 20 · mutation_gate.py DEGRADA advisory si el tool está ausente (no rompe ci-parity)",
        bool(t) and "tool is None" in t and "DEGRADADO" in t and "return 0" in t,
        f"{MUTATION_GATE} no degrada a advisory cuando mutmut/Stryker está ausente. "
        "Sin el degrade, instalar/desinstalar el tool rompería el gate global (D-B · proceso v5 §5.6).",
    )


def check_inherited_survivor_routes_l4() -> None:
    t = _read(MUTATION_GATE)
    check(
        "CHECK 21 · mutation_gate.py rutea survivors HEREDADOS a CIL carril L4 (no bloquean)",
        "L4" in t and "continuous-improvement" in t,
        f"{MUTATION_GATE} no rutea survivors de código heredado al carril L4 del CIL "
        "(capability-desfasada). Sin esto, mutar el diff bloquearía por test-debt viejo (proceso v5 §5.6).",
    )


# ── CHECK 22-24 — CIL 4 carriles + /harnesses-improvement + routing (W4) ──────
# Anti-rot del CIL: es un ROUTER (no 5º store), el ritual existe + invoca el deep-sweep,
# learning-capture rutea al carril (DIP), y el parser cockpit tipa carril ADDITIVE (D-C).
CIL_DOC = "docs/process/continuous-improvement.md"
HARNESS_IMPROVE_SKILL = ".claude/skills/harnesses-improvement/SKILL.md"
LEARNING_CAPTURE = ".claude/rules/learning-capture.md"
COCKPIT_PARSER = "tools/luana-cockpit/lib/harness-backlog.ts"
HARNESS_AUDIT_WF = ".claude/workflows/harness-audit.js"


def check_cil_index_router() -> None:
    cil = _read(CIL_DOC)
    parser = _read(COCKPIT_PARSER)
    check(
        "CHECK 22 · CIL es router a los 4 hogares existentes (L1 backlog · L2 learnings · L3 tech-debt · L4 cap_doctor)",
        bool(cil)
        and "harness-backlog" in cil
        and "learning-capture" in cil
        and "tech-debt" in cil
        and "cap_doctor" in cil,
        f"{CIL_DOC} no apunta a los 4 hogares (debe ser router, NO 5º store: L1→harness-backlog, "
        "L2→learning-capture, L3→tech-debt, L4→cap_doctor). proceso v5 §5.7.",
    )
    check(
        "CHECK 22 · cockpit parser tipa carril ADDITIVE (conserva severidad · D-C)",
        "HarnessCarril" in parser and "HarnessSeveridad" in parser,
        f"{COCKPIT_PARSER} no tipa carril manteniendo severidad — la extensión a 4-lanes "
        "debe ser additive (OCP), no reemplazar la dimensión severidad (D-C).",
    )


def check_harnesses_improvement_skill() -> None:
    skill = _read(HARNESS_IMPROVE_SKILL)
    audit_wf = WS / HARNESS_AUDIT_WF
    check(
        "CHECK 23 · /harnesses-improvement lee 4 carriles + invoca deep-sweep + sin ref colgante",
        bool(skill)
        and "L4" in skill
        and "harness-audit-2026" in skill
        and "continuous-improvement" in skill
        and audit_wf.exists(),
        f"{HARNESS_IMPROVE_SKILL} no existe / no lee los 4 carriles / no invoca el deep-sweep "
        "harness-audit-2026, o el workflow que referencia no existe (ref colgante). proceso v5 §5.7.",
    )


def check_learning_capture_routing() -> None:
    lc = _read(LEARNING_CAPTURE)
    cil = _read(CIL_DOC)
    check(
        "CHECK 24 · learning-capture rutea al carril (DIP · CIL no forkea la taxonomía)",
        "carril" in lc and "continuous-improvement" in lc and "learning-capture" in cil,
        f"{LEARNING_CAPTURE} no rutea al carril del CIL, o el CIL no depende de su taxonomía "
        "(DIP roto: el CIL no debe forkear los paths canónicos de learnings). proceso v5 §5.7.",
    )


# ── CHECK 25-27 — ledger de cobertura vivo (proceso v5 W5 · §5.2) ─────────────
# Anti-rot del ledger: la § Matriz tiene columna estado VIVA (productor dev-team la
# mantiene · auditor la congela) + piso HARD happy-path (func. nueva no difiere el core).
SPEC_TMPL = "docs/specs/templates/01-spec-template.md"


def check_ledger_estado_column() -> None:
    spec = _read(SPEC_TMPL)
    aud = _read(AUDITOR_SKILL)
    check(
        "CHECK 25 · 01-spec § Matriz tiene columna estado VIVA + auditor la congela",
        "LEDGER DE COBERTURA VIVO" in spec
        and "✅ construido" in spec
        and "Ledger de cobertura" in aud
        and "congela" in aud,
        f"{SPEC_TMPL} no tiene la columna estado viva en la § Matriz, o {AUDITOR_SKILL} no la "
        "congela en Phase D. Sin esto el ledger no responde 'qué NO está construido' (proceso v5 §5.2).",
    )


def check_ledger_producer_step() -> None:
    dev = _read(DEVTEAM_SKILL)
    check(
        "CHECK 26 · dev-team es PRODUCTOR del ledger (mantiene estado vivo en developing)",
        "PRODUCTOR" in dev and "✅ construido" in dev,
        f"{DEVTEAM_SKILL} no tiene el paso productor del ledger. Sin él la § Matriz nace en "
        "refined y llega STALE a G — Chris leería una foto vieja (proceso v5 §5.2 · fix REVIEW).",
    )


def check_ledger_happy_floor() -> None:
    spec = _read(SPEC_TMPL)
    dev = _read(DEVTEAM_SKILL)
    closure = _read(CLOSURE_RULE)
    check(
        "CHECK 27 · piso HARD happy-path (cap_change_type: new → core ✅, no se difiere)",
        ("PISO HARD" in spec and "cap_change_type" in spec)
        and "PISO HARD" in dev
        and "happy-path" in closure.lower(),
        "el piso HARD happy-path no está documentado en spec-template + dev-team + story-closure-gate. "
        "Funcionalidad nueva NO puede llegar a done con el core diferido (proceso v5 §5.2/principio 3).",
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
    check_cap_format_enforcement_wired()
    check_cap_display_no_version_jargon()
    check_g_pause_wired()
    check_chris_verify_schema()
    check_await_verify_wip_exempt()
    check_signoff_single_field()
    check_reconcile_step()
    check_auditor_reads_reconciled()
    check_mutation_gate_validators()
    check_mutation_degrade_advisory()
    check_inherited_survivor_routes_l4()
    check_cil_index_router()
    check_harnesses_improvement_skill()
    check_learning_capture_routing()
    check_ledger_estado_column()
    check_ledger_producer_step()
    check_ledger_happy_floor()
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
