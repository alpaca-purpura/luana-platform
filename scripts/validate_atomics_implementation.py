#!/usr/bin/env python3
"""Valida que los paths de implementación declarados en atomics[] existen en el filesystem.

Produce ``{brand}/docs/product/capabilities/_atomics-verification.json``
(gitignored R3 v2) con un status por atomic (verified/partial/unverified/drift)
y un resumen global.

Algoritmo:
  Para cada atomic con bloque verification:
    - fe_path, be_path: verifica que el archivo exista (os.path.exists)
    - agentic_path: ídem + bonus check que no esté vacío si es slot .txt/.j2
    - e2e_test: ídem + bonus check que contenga test( o test.describe(

Estado por atomic:
  verified   -> todos los paths declarados existen
  partial    -> surface declara superficies pero solo subset verificado
  unverified -> NINGÚN path de verification declarado (verificación ausente)
  drift      -> algún path declarado NO existe en filesystem (bug / archivo movido)

Uso:
  python3 scripts/validate_atomics_implementation.py --brand vitalia [--out PATH] [--verbose] [--strict]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

# Campos de paths dentro del bloque verification de cada atomic
VERIFICATION_PATH_FIELDS = ("fe_path", "be_path", "agentic_path", "e2e_test")

# Superficies válidas según schema v3.1
VALID_SURFACES = {"FE", "BE", "AGENTIC", "FE+BE", "FE+BE+AGENTIC", "DOCS", "INFRA"}

# Mapeo surface → campos aplicables de verification
SURFACE_APPLICABLE_FIELDS: dict[str, set[str]] = {
    "FE": {"fe_path", "e2e_test"},
    "BE": {"be_path"},
    "AGENTIC": {"agentic_path"},
    "FE+BE": {"fe_path", "be_path", "e2e_test"},
    "FE+BE+AGENTIC": {"fe_path", "be_path", "agentic_path", "e2e_test"},
    "DOCS": set(),
    "INFRA": set(),
}

# Extensiones de slot agéntico para check de contenido no-vacío
AGENTIC_SLOT_EXTENSIONS = {".txt", ".j2"}

# Patrones que indican un archivo de test Playwright válido
E2E_TEST_PATTERNS = ("test(", "test.describe(")


# ---------------------------------------------------------------------------
# Parsing YAML frontmatter
# ---------------------------------------------------------------------------


def _parse_frontmatter(path: Path) -> dict[str, Any] | None:
    """Parsea YAML frontmatter del capability file.

    Soporta ``---\\n<yaml>\\n---`` (estilo Markdown) y YAML desnudo.
    Retorna None y emite warning en stderr si falla.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"  [WARN] No se pudo leer {path}: {exc}", file=sys.stderr)
        return None

    # Saltar líneas de comentario o espacios en blanco al inicio
    lines = text.splitlines(keepends=True)
    cursor = 0
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("#") or stripped in {"", "\n"}:
            cursor += len(line)
            continue
        break

    body = text[cursor:]
    if not body.startswith("---"):
        print(f"  [WARN] Sin frontmatter YAML en {path} — omitido", file=sys.stderr)
        return None

    after = body[3:].lstrip("\n")
    yaml_text = after.split("\n---", 1)[0]

    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        print(f"  [WARN] YAML malformado en {path}: {exc}", file=sys.stderr)
        return None

    if not isinstance(data, dict):
        print(f"  [WARN] Frontmatter no es mapping en {path} — omitido", file=sys.stderr)
        return None

    return data


# ---------------------------------------------------------------------------
# Verificación de paths individuales
# ---------------------------------------------------------------------------


def _check_single_path(
    field: str,
    declared_path: str | None,
    workspace_root: Path,
) -> dict[str, Any]:
    """Construye el check dict para un campo path declarado.

    Returns:
        {"declared": str|None, "exists": bool|None, "applicable": bool,
         "drift_reason": str|None, "extra": dict}
    """
    if declared_path is None:
        return {
            "declared": None,
            "exists": None,
            "applicable": False,
            "drift_reason": None,
            "extra": {},
        }

    full_path = workspace_root / declared_path
    # Un path que apunta a un directorio es considerado drift (atomic apuntaba a archivo)
    if full_path.is_dir():
        return {
            "declared": declared_path,
            "exists": False,
            "applicable": True,
            "drift_reason": f"{field}='{declared_path}' apunta a directorio, se esperaba archivo",
            "extra": {"is_dir": True},
        }

    path_exists = full_path.exists()

    extra: dict[str, Any] = {}
    drift_reason: str | None = None

    if not path_exists:
        drift_reason = f"{field}='{declared_path}' no existe en filesystem"
    else:
        # Checks de contenido para campos especiales
        if field == "agentic_path" and full_path.suffix in AGENTIC_SLOT_EXTENSIONS:
            try:
                content = full_path.read_text(encoding="utf-8").strip()
                extra["slot_non_empty"] = bool(content)
                if not content:
                    drift_reason = (
                        f"{field}='{declared_path}' existe pero está vacío (slot sin contenido)"
                    )
            except OSError:
                extra["slot_non_empty"] = None

        elif field == "e2e_test":
            try:
                content = full_path.read_text(encoding="utf-8")
                has_pattern = any(p in content for p in E2E_TEST_PATTERNS)
                extra["contains_test_pattern"] = has_pattern
                if not has_pattern:
                    drift_reason = (
                        f"{field}='{declared_path}' existe pero no contiene "
                        f"'test(' ni 'test.describe(' (¿no es un spec Playwright?)"
                    )
            except OSError:
                extra["contains_test_pattern"] = None

    return {
        "declared": declared_path,
        "exists": path_exists,
        "applicable": True,
        "drift_reason": drift_reason,
        "extra": extra,
    }


# ---------------------------------------------------------------------------
# Verificación por atomic
# ---------------------------------------------------------------------------


def _determine_applicable_fields(surface: str) -> set[str]:
    """Retorna los campos applicable según la surface del atomic."""
    if surface in SURFACE_APPLICABLE_FIELDS:
        return SURFACE_APPLICABLE_FIELDS[surface]
    # Surface inválida o DOCS/INFRA → ningún campo aplicable
    return set()


def _compute_atomic_status(
    atomic: dict[str, Any],
    workspace_root: Path,
) -> dict[str, Any]:
    """Computa el status de verificación para un atomic individual.

    Returns dict con:
      atomic_id, surface, verification_status, checks, drift_reasons
    """
    atomic_id: str = str(atomic.get("id", "<sin-id>"))
    surface_raw = atomic.get("surface", "")
    surface: str = str(surface_raw).strip() if surface_raw else ""

    verification_block = atomic.get("verification")
    applicable_fields = _determine_applicable_fields(surface)

    checks: dict[str, Any] = {}
    drift_reasons: list[str] = []

    # Construir checks para cada campo de verification
    for field in VERIFICATION_PATH_FIELDS:
        declared: str | None = None
        if isinstance(verification_block, dict):
            raw = verification_block.get(field)
            declared = str(raw) if raw is not None else None

        check = _check_single_path(field, declared, workspace_root)

        # Enriquecer con flag 'applicable' según surface
        check["applicable"] = field in applicable_fields if applicable_fields else (
            # Si surface inválida o DOCS/INFRA, ningún campo aplica
            False
        )

        checks[field] = {
            "declared": check["declared"],
            "exists": check["exists"],
            "applicable": check["applicable"],
            **({k: v for k, v in check["extra"].items()} if check.get("extra") else {}),
        }

        if check["drift_reason"]:
            drift_reasons.append(f"atomic '{atomic_id}' {check['drift_reason']}")

    # -------------------------------------------------------------------------
    # Determinar verification_status
    # -------------------------------------------------------------------------

    # Contar paths declarados y cuántos existen
    declared_paths = [
        field for field in VERIFICATION_PATH_FIELDS
        if checks[field]["declared"] is not None
    ]
    existing_paths = [
        field for field in declared_paths
        if checks[field]["exists"] is True
    ]
    drift_paths = [
        field for field in declared_paths
        if checks[field]["exists"] is False
    ]

    if not declared_paths:
        # Sin ningún path declarado → unverified (advisory, no error)
        status = "unverified"
    elif drift_paths:
        # Al menos un path declarado no existe en filesystem → drift (bug / archivo movido)
        status = "drift"
    elif len(existing_paths) == len(declared_paths):
        # Todos los paths declarados existen.
        # verified: todos los paths declarados existen (sin importar si faltan por declarar).
        # partial: surface es una superficie compuesta (FE+BE, FE+BE+AGENTIC) pero solo
        #          se declaró un subset de los campos aplicables primarios (fe_path/be_path/agentic_path).
        #          e2e_test siempre es opcional y no determina partial por sí solo.
        primary_applicable = applicable_fields - {"e2e_test"}
        if primary_applicable:
            declared_primaries = [
                f for f in primary_applicable
                if checks.get(f, {}).get("declared") is not None
            ]
            if declared_primaries:
                # Al menos un primary field está declarado y existe → verified
                # (puede no estar todo declarado, pero lo declarado existe)
                status = "verified"
            else:
                # Superficie compuesta declarada pero ningún primary path declarado
                status = "partial"
        else:
            # Surface DOCS/INFRA o sin campos aplicables → verificado lo declarado
            status = "verified"
    else:
        status = "partial"

    return {
        "atomic_id": atomic_id,
        "surface": surface,
        "verification_status": status,
        "checks": checks,
        "drift_reasons": drift_reasons,
    }


# ---------------------------------------------------------------------------
# Procesamiento de capabilities
# ---------------------------------------------------------------------------


def _process_cap(
    path: Path,
    workspace_root: Path,
    verbose: bool,
) -> dict[str, Any] | None:
    """Procesa un YAML de capability y retorna métricas de atomics.

    Retorna None si la cap no tiene atomics o no puede parsearse.
    """
    data = _parse_frontmatter(path)
    if data is None:
        return None

    atomics_raw = data.get("atomics")
    if not isinstance(atomics_raw, list) or len(atomics_raw) == 0:
        # Sin atomics → skip (no entry en output)
        return None

    atomics: list[dict[str, Any]] = [a for a in atomics_raw if isinstance(a, dict)]
    slug: str = str(data.get("slug") or path.stem)

    details: list[dict[str, Any]] = []
    counts: dict[str, int] = {
        "verified": 0,
        "partial": 0,
        "unverified": 0,
        "drift": 0,
    }

    for atomic in atomics:
        result = _compute_atomic_status(atomic, workspace_root)
        details.append(result)
        status = result["verification_status"]
        counts[status] = counts.get(status, 0) + 1

    if verbose:
        drift_count = counts["drift"]
        flag = " ⚠ DRIFT" if drift_count > 0 else ""
        print(
            f"  {slug:<60} atomics={len(atomics):<3} "
            f"verified={counts['verified']} partial={counts['partial']} "
            f"unverified={counts['unverified']} drift={counts['drift']}{flag}"
        )

    return {
        "atomics_total": len(atomics),
        "verified": counts["verified"],
        "partial": counts["partial"],
        "unverified": counts["unverified"],
        "drift": counts["drift"],
        "details": details,
    }


def process_brand(
    brand: str,
    workspace_root: Path,
    verbose: bool,
) -> dict[str, Any]:
    """Procesa todas las caps de una brand y computa verificación de atomics.

    Retorna dict con capabilities + summary.
    """
    caps_root = workspace_root / brand / "docs" / "product" / "capabilities"

    if not caps_root.exists():
        print(
            f"[ERROR] Directorio de capabilities no encontrado: {caps_root}",
            file=sys.stderr,
        )
        sys.exit(1)

    yaml_paths = sorted(caps_root.rglob("*.yaml"))
    # Excluir templates y archivos internos que empiecen con _
    yaml_paths = [
        p for p in yaml_paths
        if not p.name.startswith("_")
    ]

    capabilities: dict[str, Any] = {}
    summary: dict[str, int] = {
        "total_atomics": 0,
        "verified": 0,
        "partial": 0,
        "unverified": 0,
        "drift": 0,
    }

    total = len(yaml_paths)
    if not verbose:
        print(f"Verificando {total} capabilities de {brand}...", end="", flush=True)

    for idx, path in enumerate(yaml_paths):
        if not verbose:
            if (idx + 1) % 10 == 0 or (idx + 1) == total:
                print(".", end="", flush=True)

        data = _parse_frontmatter(path)
        if data is None:
            continue

        slug = str(data.get("slug") or path.stem)
        cap_result = _process_cap(path, workspace_root, verbose)

        if cap_result is None:
            # Cap sin atomics → skip
            continue

        capabilities[slug] = cap_result

        summary["total_atomics"] += cap_result["atomics_total"]
        summary["verified"] += cap_result["verified"]
        summary["partial"] += cap_result["partial"]
        summary["unverified"] += cap_result["unverified"]
        summary["drift"] += cap_result["drift"]

    if not verbose:
        print()  # newline después de los puntos

    return {"capabilities": capabilities, "summary": summary}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Punto de entrada CLI."""
    parser = argparse.ArgumentParser(
        description=(
            "Verifica que los paths de implementación declarados en atomics[] "
            "existen en el filesystem."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--brand", required=True, help="Slug de la brand (ej. vitalia)")
    parser.add_argument(
        "--out",
        default=None,
        help=(
            "Path de salida JSON. "
            "Default: {brand}/docs/product/capabilities/_atomics-verification.json"
        ),
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Log detallado por capability y atomic",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Sale con código 1 si hay algún atomic en estado 'drift'",
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Raíz del workspace. Default: detectado via git rev-parse",
    )
    args = parser.parse_args()

    # Resolver workspace root
    if args.repo:
        workspace_root = Path(args.repo).resolve()
    else:
        import subprocess  # noqa: PLC0415

        try:
            result = subprocess.run(
                ["git", "rev-parse", "--show-toplevel"],
                capture_output=True,
                text=True,
                check=True,
            )
            workspace_root = Path(result.stdout.strip())
        except (subprocess.CalledProcessError, FileNotFoundError):
            workspace_root = Path.cwd()

    out_path = (
        Path(args.out).resolve()
        if args.out
        else workspace_root
        / args.brand
        / "docs"
        / "product"
        / "capabilities"
        / "_atomics-verification.json"
    )

    if args.verbose:
        print(f"Workspace root : {workspace_root}")
        print(f"Brand          : {args.brand}")
        print(f"Output         : {out_path}")
        print()

    result_data = process_brand(args.brand, workspace_root, args.verbose)

    now_iso = datetime.now(tz=timezone.utc).astimezone().isoformat(timespec="seconds")
    output: dict[str, Any] = {
        "verified_at": now_iso,
        "brand": args.brand,
        "capabilities": result_data["capabilities"],
        "summary": result_data["summary"],
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    summary = result_data["summary"]
    print(
        f"Completado: total_atomics={summary['total_atomics']} · "
        f"verified={summary['verified']} · "
        f"partial={summary['partial']} · "
        f"unverified={summary['unverified']} · "
        f"drift={summary['drift']}"
    )
    print(f"Guardado en: {out_path}")

    if args.strict and summary.get("drift", 0) > 0:
        print(
            f"[STRICT] {summary['drift']} atomic(s) en estado 'drift' detectados.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
