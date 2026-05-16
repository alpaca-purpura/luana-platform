"""F1 — Architectural fitness: provider pattern compliance.

Three invariants every fase must respect after F1:

1. Every ``src/modules/{name}/copilot_provider/__init__.py`` exports a
   top-level ``provider`` attribute that satisfies the ``CopilotProvider``
   Protocol.
2. Discovery wires every provider correctly (``module_id`` matches the
   registry key, ``module_data`` is consistent).
3. Every module listed in the runtime ``MODULE_REGISTRY`` (i.e. every module
   the copilot can introspect by name) has a ``copilot_provider/`` directory.

Fitness tests live next to ``test_no_new_copilot_module_imports.py`` so the
ratchet and the structural invariants stay in the same review surface.
"""

from __future__ import annotations

from pathlib import Path

from luana_core_copilot.application.discovery import (
    discover_providers,
    health,
    reset_discovery,
)
from luana_core_copilot.domain.module_registry import (
    get_module_registry,
    reset_module_registry_cache,
)
from luana_core_copilot.domain.ports import CopilotProvider

_MODULES_BASE = Path(__file__).resolve().parents[2] / "src" / "modules"


def setup_function() -> None:
    """Reset cached singletons so each test sees a fresh discovery."""

    reset_discovery()
    reset_module_registry_cache()


def test_every_in_repo_provider_satisfies_protocol() -> None:
    """Every discovered provider object satisfies ``CopilotProvider`` Protocol."""

    registry = discover_providers()
    assert registry, "Discovery must surface at least one in-repo provider after F1."
    for module_id, provider in registry.items():
        assert isinstance(provider, CopilotProvider), (
            f"Provider for {module_id!r} does not satisfy CopilotProvider Protocol."
        )


def test_provider_module_id_matches_registry_key() -> None:
    """A provider must self-identify using the same id discovery keyed it under."""

    for module_id, provider in discover_providers().items():
        assert provider.module_id == module_id, (
            f"module_id mismatch: registry key={module_id!r} provider={provider.module_id!r}"
        )


def test_module_registry_built_only_from_providers() -> None:
    """``MODULE_REGISTRY`` must mirror discovered providers' ``module_data()``."""

    descriptors = get_module_registry()
    providers = discover_providers()
    for module_id, descriptor in descriptors.items():
        provider = providers.get(module_id)
        assert provider is not None, f"Descriptor {module_id!r} has no provider."
        data = provider.module_data()
        assert data is not None
        assert descriptor.label == data.label
        assert descriptor.description == data.description
        assert descriptor.route_prefix == data.route_prefix


def test_all_registered_modules_have_copilot_provider() -> None:
    """Every module surfaced through ``MODULE_REGISTRY`` exposes a discoverable provider.

    Post-multibrand-reorg 2026-05-15: providers may live in `core/luana-core-*/` engine
    packages (canonical for cross-brand modules) or in `{brand}/backend/src/modules/{brand}/`
    (brand-vertical overlays). We verify the provider OBJECT exists and is registered, not
    its filesystem location (which varies post-carve-out).
    """
    import inspect

    providers = discover_providers()
    for module_id in get_module_registry():
        provider = providers.get(module_id)
        assert provider is not None, (
            f"Module {module_id!r} is in registry but has no discoverable provider. "
            "Check entry_points in `core/luana-core-*/pyproject.toml` "
            "or `nicolify/backend/src/modules/*/copilot_provider/`."
        )
        # Verify the provider's source file is loadable (not stale import)
        source_file = inspect.getfile(provider.__class__)
        assert Path(source_file).is_file(), (
            f"Provider for {module_id!r} resolved to {source_file} which doesn't exist."
        )


def test_health_check_reports_healthy_after_load() -> None:
    """Boot-time health: every provider returns healthy after discovery."""

    snapshot = health()
    assert snapshot, "health() must surface at least one provider after F1."
    for module_id, status in snapshot.items():
        assert status.healthy, f"{module_id!r} provider unhealthy: {status.last_error}"
