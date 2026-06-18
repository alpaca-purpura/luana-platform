"""Pilot B (2026-06-16) — hidrata config NO-SECRETA desde nicolify/config/brand.yaml.

Problema: la config no-secreta (LOG_LEVEL, DOMAIN_NAME, ...) estaba triplicada en
`.env.dev` + `brand.yaml` + `project.config.yaml`, y SOLO el `.env` la alimentaba al
runtime (el engine `Settings` lee `env_file=".env"`; nada lee `brand.yaml`). Este shim
cablea el yaml al runtime: lee `runtime_env.<env>` de `brand.yaml` y lo inyecta a
`os.environ` ANTES de que el engine `get_settings()` (lazy `@lru_cache`) instancie Settings.

Diseño:
  - `setdefault` semantics → el `.env` / env real SIGUE GANANDO si la key está presente
    (cero ruptura). El shim solo RELLENA lo que falta. Cuando la key se borra del `.env`,
    el yaml la provee.
  - SOLO config no-secreta. Secrets (claves, passwords, tokens, KEK) NUNCA acá — siguen
    exclusivamente en `.env.dev` (gitignored).
  - Scope: nicolify (piloto). Si convence → graduar a una fuente YAML nativa de pydantic
    Settings en el engine vía /pm-luana (cross-brand, mata la triplicación en las 4 marcas).

Orden de import: el engine `get_settings()` es lazy, así que alcanza con que este módulo
se importe en `src/main.py` (corre al cargar el módulo, antes del primer request).
"""

from __future__ import annotations

import os
from pathlib import Path

import yaml

# nicolify/backend/src/config_bootstrap.py → parents[2] = nicolify/
_BRAND_YAML = Path(__file__).resolve().parents[2] / "config" / "brand.yaml"

# ENVIRONMENT (.env) → clave del bloque `runtime_env` de brand.yaml
_ENV_ALIAS = {"development": "dev", "production": "prod", "staging": "staging"}


def hydrate_runtime_env() -> dict[str, str]:
    """Inyecta `runtime_env.<env>` de brand.yaml a os.environ (no pisa lo ya presente).

    Returns:
        dict {key: source} con source ∈ {"yaml", "env"} — "yaml" = la proveyó este shim,
        "env" = ya venía del entorno (.env) y se respetó. Útil para diagnóstico.
    """
    if not _BRAND_YAML.exists():
        return {}
    data = yaml.safe_load(_BRAND_YAML.read_text(encoding="utf-8")) or {}
    env_name = _ENV_ALIAS.get(os.environ.get("ENVIRONMENT", "development"), "dev")
    block = (data.get("runtime_env") or {}).get(env_name) or {}
    result: dict[str, str] = {}
    for key, value in block.items():
        if value is None:
            continue
        k = str(key)
        if k in os.environ:
            result[k] = "env"
        else:
            os.environ[k] = str(value)
            result[k] = "yaml"
    return result


# Side-effect: hidratar al importar. `_LOADED` queda disponible para diagnóstico/tests.
_LOADED = hydrate_runtime_env()
