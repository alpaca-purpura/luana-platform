# cap: abel/icp-buyer  # noqa: ERA001
"""IcpExtractionOrchestrator — one-shot, wave-based ICP extraction (T-AG-1).

Subclasses the engine ``BaseExtractionOrchestrator`` (consume the wave pattern by
inheritance · backend-ddd §Extraction orchestrators) but runs a SINGLE wave: one
structured LLM call seed→draft. This is NOT the copilot runtime — no LangGraph graph,
no supervisor, no deepagents (03-arch-agentic §0).

Flow::

    seed (untrusted)
      → wrap_untrusted_seed (RN-9: sanitize + delimiter-wrap)
      → render icp_extraction.j2 (SLOT1 role · SLOT2 rules+schema · SLOT3 wrapped seed)
      → LLM call (engine router, NANO/FAST) with asyncio timeout
      → parse JSON → ExtractionResult (Pydantic)
      → return (result, usage)   # usage = token counts for best-effort cost recording

Graceful degradation (NF-res-extract / SC-network): the LLM call is wrapped in
``asyncio.wait_for``. Timeout / dispatch error → ``ExtractionTimeout`` / ``ExtractionFailed``
propagate to the service, which sets ``job.status=failed``. Never an infinite spinner.

LLM dispatch is INJECTED (``generate``) so the agentic tests stub it deterministically
(``RUN_LLM_EXTRACT=1`` swaps in the real engine router). Default = engine LiteLLM router.
"""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import structlog
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.nicolify.abel.extraction.schema import ExtractionResult
from src.modules.nicolify.abel.extraction.seed_sanitizer import wrap_untrusted_seed

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

logger = structlog.get_logger()

# The extraction uses the FAST model role (token economy — agent-revenue-engine §4):
# cheap structured extraction, no multi-turn reasoning needed. Role is selected directly
# via ModelRole.FAST in _default_generate (engine SSoT — no hardcoded wire-name).

# Configurable timeout for the single LLM call (NF-res-extract — no infinite spinner).
DEFAULT_EXTRACT_TIMEOUT_S = 45.0

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


class ExtractionError(Exception):
    """Base for extraction failures (mapped to job.status=failed)."""


class ExtractionTimeoutError(ExtractionError):
    """The LLM call exceeded the configured timeout (SC-network)."""


class ExtractionFailedError(ExtractionError):
    """The LLM call errored (5xx / dispatch) or the output could not be parsed."""


# Backward-compatible aliases (used in tests/service for readability).
ExtractionTimeout = ExtractionTimeoutError
ExtractionFailed = ExtractionFailedError


@dataclass
class LlmUsage:
    """Token usage for best-effort cost recording (consume engine calculate_cost)."""

    input_tokens: int = 0
    output_tokens: int = 0
    provider: str = ""
    model: str = ""


@dataclass
class ExtractionOutcome:
    """What the orchestrator returns: the parsed draft + usage for cost recording."""

    result: ExtractionResult
    usage: LlmUsage = field(default_factory=LlmUsage)


def _default_generate() -> Callable[[str, str], Awaitable[tuple[str, LlmUsage]]]:
    """Build the production LLM dispatch (engine LiteLLM router).

    Imported lazily so unit/agentic tests (which inject a stub) never pull the
    engine LLM client + provider settings into the import graph.
    """

    async def _generate(system_prompt: str, user_block: str) -> tuple[str, LlmUsage]:
        from langchain_core.messages import HumanMessage, SystemMessage
        from luana_core_llm.factory import LLMFactory
        from luana_core_platform.core.enums import ModelRole

        service = LLMFactory.get_service()
        client = service.get_client(ModelRole.FAST)
        # LangChain async invoke → AIMessage carries .content + .usage_metadata.
        lc_messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_block)]
        response = await client.ainvoke(lc_messages)
        usage_meta = getattr(response, "usage_metadata", None) or {}
        usage = LlmUsage(
            input_tokens=int(usage_meta.get("input_tokens", 0) or 0),
            output_tokens=int(usage_meta.get("output_tokens", 0) or 0),
            provider=str(getattr(service, "get_provider_for_role", lambda _r: "")(ModelRole.FAST) or ""),
            model=str((response.response_metadata or {}).get("model_name", "")),
        )
        content = response.content
        text = content if isinstance(content, str) else str(content)
        return text, usage

    return _generate


class IcpExtractionOrchestrator(BaseExtractionOrchestrator):
    """Single-wave seed→draft ICP extractor (consume engine wave pattern)."""

    log_prefix = "abel_icp_extraction"

    def __init__(
        self,
        generate: Callable[[str, str], Awaitable[tuple[str, LlmUsage]]] | None = None,
        timeout_s: float = DEFAULT_EXTRACT_TIMEOUT_S,
    ) -> None:
        """Initialize with an (optional) injected LLM dispatch + timeout.

        ``generate`` default = production engine LiteLLM router. Tests inject a stub.
        """
        self._generate = generate or _default_generate()
        self._timeout_s = timeout_s

    def _render_prompt(self, wrapped_seed: str) -> tuple[str, str]:
        """Render the j2 template → (system_prompt, user_block).

        The template body is the system instruction (SLOT 1 + SLOT 2); the wrapped seed
        is the user message (SLOT 3, NOT cached). We render the file and split on the
        seed placeholder so the stable prefix can be a system prompt (cache-friendly).
        """
        from pathlib import Path

        from jinja2 import Template

        template_path = Path(__file__).parent / "prompts" / "icp_extraction.j2"
        raw = template_path.read_text(encoding="utf-8")
        # Stable system prefix = everything before the {{ wrapped_seed }} placeholder.
        system_part = Template(raw.split("{{ wrapped_seed }}")[0]).render()
        return system_part.strip(), wrapped_seed

    async def run(self, seed_text: str) -> ExtractionOutcome:
        """One-shot extraction: sanitize → LLM (timeout) → parse → ExtractionResult.

        Raises ``ExtractionTimeout`` / ``ExtractionFailed`` on failure (→ job.status=failed).
        """
        wrapped = wrap_untrusted_seed(seed_text)  # RN-9
        system_prompt, user_block = self._render_prompt(wrapped)

        logger.info("abel_icp_extraction_start", seed_len=len(seed_text or ""))

        try:
            raw_text, usage = await asyncio.wait_for(
                self._generate(system_prompt, user_block),
                timeout=self._timeout_s,
            )
        except TimeoutError as exc:
            logger.warning("abel_icp_extraction_timeout", timeout_s=self._timeout_s)
            msg = "La extracción superó el tiempo límite."
            raise ExtractionTimeoutError(msg) from exc
        except Exception as exc:
            logger.warning("abel_icp_extraction_dispatch_failed", error=str(exc))
            msg = f"La extracción falló: {exc}"
            raise ExtractionFailedError(msg) from exc

        result = self._parse(raw_text)
        logger.info(
            "abel_icp_extraction_done",
            icp_count=len(result.icps),
            needs_more_info=result.needs_more_info,
        )
        return ExtractionOutcome(result=result, usage=usage)

    @staticmethod
    def _parse(raw_text: str) -> ExtractionResult:
        """Parse the LLM output into ExtractionResult (tolerant of code fences/preamble)."""
        match = _JSON_BLOCK_RE.search(raw_text or "")
        if not match:
            msg = "La respuesta del modelo no contenía JSON."
            raise ExtractionFailedError(msg)
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            msg = f"JSON inválido en la respuesta del modelo: {exc}"
            raise ExtractionFailedError(msg) from exc
        try:
            return ExtractionResult.model_validate(data)
        except Exception as exc:
            msg = f"La respuesta no coincide con el esquema: {exc}"
            raise ExtractionFailedError(msg) from exc
