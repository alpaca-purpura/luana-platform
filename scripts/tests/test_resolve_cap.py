# voseo-allowed: test interno de maquinaria (no user-facing)
"""Tests de scripts/resolve_cap.py — HB-43.

Hermético: fixture tmp con todas las formas REALES de `cap_target` que rompían el
locator (path-style · functional_area dotted · área multi-cap · capability_id · slug
pelado) + un cap con doc-cola YAML malformado (footgun #2: `---` múltiples). Drift-proof:
NO depende de la data viva de vitalia.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

_SPEC = importlib.util.spec_from_file_location("resolve_cap", Path(__file__).resolve().parents[1] / "resolve_cap.py")
rc = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(rc)  # type: ignore[union-attr]


# Segundo documento DELIBERADAMENTE malformado (colon suelto en prosa) — replica
# el footgun real de adrian-embudo.yaml: safe_load_all reventaba todo el stream.
_TAIL_MALFORMED = "\n---\n# notas\nesto es prosa: con un colon suelto que rompe yaml aquí: sí\n"


def _cap(slug: str, *, cap_id: str, module: str, fa: str = "", main_component: str = "") -> str:
    body = f"---\ncapability_id: {cap_id}\nslug: {slug}\nstatus: planned\ntech_module: {module}\nmodule: {module}\n"
    if fa:
        body += f"functional_area: {fa}\n"
    if main_component:
        body += f"dev_preview:\n  main_component: {main_component}\n  route: /x/{slug}\n"
    return body + _TAIL_MALFORMED


@pytest.fixture()
def caps(tmp_path: Path) -> Path:
    """Árbol fixture de capabilities/ con las formas footgun."""
    root = tmp_path / "capabilities"
    files = {
        "crm/adrian-embudo.yaml": _cap(
            "adrian-embudo",
            cap_id="vitalia.crm.adrian-embudo",
            module="crm",
            main_component="features/crm/components/embudo/AdrianEmbudoView.tsx",
        ),
        "clinics/lisa-doctores.yaml": _cap(
            "lisa-doctores",
            cap_id="vitalia-lisa-doctores",
            module="clinics",
            fa="lisa.doctores",
            main_component="features/lisa/components/doctores/View.tsx",
        ),
        # ÁREA: dos caps comparten functional_area adrian.inbox
        "copilot/inbox-tools.yaml": _cap(
            "inbox-tools",
            cap_id="vitalia-inbox-tools",
            module="copilot",
            fa="adrian.inbox",
        ),
        "sales_agent/inbox-handler.yaml": _cap(
            "inbox-handler",
            cap_id="vitalia-inbox-handler",
            module="sales_agent",
            fa="adrian.inbox",
        ),
        # Deben ser EXCLUIDOS del scan
        "_template.yaml": "---\nslug: __template__\n",
    }
    for rel, content in files.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    (root / "README.md").write_text("# caps\n", encoding="utf-8")
    return root


def _slugs(paths: list[Path]) -> set[str]:
    return {p.stem for p in paths}


# ── Resolución por forma de cap_target ──────────────────────────────────────
def test_path_style_resolves_single(caps: Path) -> None:
    # "crm/adrian-embudo" (module/slug path) → exactamente 1
    assert _slugs(rc.resolve("vitalia", "crm/adrian-embudo", root=caps)) == {"adrian-embudo"}


def test_functional_area_dotted_resolves_single(caps: Path) -> None:
    # "lisa.doctores" (functional_area · NO existe dir lisa/) → clinics/lisa-doctores
    assert _slugs(rc.resolve("vitalia", "lisa.doctores", root=caps)) == {"lisa-doctores"}


def test_dotted_collapses_to_dashed_slug(caps: Path) -> None:
    # "lisa.doctores" también matchea por slug dashed == lisa-doctores
    res = rc.resolve("vitalia", "lisa.doctores", root=caps)
    assert len(res) == 1


def test_area_multi_cap_returns_all(caps: Path) -> None:
    # "adrian.inbox" es un ÁREA (2 caps) → devuelve AMBAS (navegar el barrio)
    assert _slugs(rc.resolve("vitalia", "adrian.inbox", root=caps)) == {"inbox-tools", "inbox-handler"}


def test_capability_id_full_resolves(caps: Path) -> None:
    assert _slugs(rc.resolve("vitalia", "vitalia.crm.adrian-embudo", root=caps)) == {"adrian-embudo"}


def test_bare_slug_resolves(caps: Path) -> None:
    assert _slugs(rc.resolve("vitalia", "adrian-embudo", root=caps)) == {"adrian-embudo"}


def test_unknown_resolves_empty(caps: Path) -> None:
    assert rc.resolve("vitalia", "fantasma.inexistente", root=caps) == []


def test_template_and_readme_excluded(caps: Path) -> None:
    slugs = _slugs(rc.cap_files("vitalia", root=caps))
    assert "__template__" not in slugs
    assert all(not s.startswith("_") for s in slugs)
    # README.md no es .yaml → no aparece de todos modos
    assert len(rc.cap_files("vitalia", root=caps)) == 4


# ── Extract (lo que el agente consume) ──────────────────────────────────────
def test_extract_shows_main_component(caps: Path) -> None:
    block = rc._extract_block(caps / "crm/adrian-embudo.yaml")
    assert "main_component" in block
    assert "AdrianEmbudoView" in block


def test_extract_survives_malformed_tail_doc(caps: Path) -> None:
    # FOOTGUN #2 regression: doc-cola malformado NO debe tumbar el extract
    block = rc._extract_block(caps / "crm/adrian-embudo.yaml")
    assert "no parseable" not in block
    assert "slug: adrian-embudo" in block


# ── main() exit codes ───────────────────────────────────────────────────────
def test_main_null_returns_2(capsys: pytest.CaptureFixture[str]) -> None:
    assert rc.main(["vitalia", "null"]) == 2
    assert "UNRESOLVED" in capsys.readouterr().err


def test_main_bad_usage_returns_1() -> None:
    assert rc.main(["solo-un-arg"]) == 1
