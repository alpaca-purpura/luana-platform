"""Comunify agentic guardrails — registered via EP-13 in extensions.py.

Created Story 12 T-guards-{1,2,3,4} (luana-comunify-bootstrap). Guardrail
implementations:

  T-guards-1 → community_safety_no_spam (input + output)
  T-guards-2 → community_safety_no_nsfw (image vision + text input)
  T-guards-3 → community_safety_no_doxxing (cross-ref cohort_members)
  T-guards-4 → prompt_injection_block_reuse (Story E sandbox markers)

Each guard exposes its own frozen result dataclass + cement constants.
To avoid silent collision at the package surface (sibling guards 1 and
2 both expose `InputGuardrailResult` / `OutputGuardrailResult`), those
types are NOT re-exported from this `__init__.py`. Callers MUST import
by fully qualified module path:

    from src.modules.comunify.agentic.guardrails.community_safety_no_spam import (
        InputGuardrailResult as SpamInputResult,
    )
    from src.modules.comunify.agentic.guardrails.community_safety_no_nsfw import (
        NsfwGuardrailResult,
    )

Pattern matches vitalia/backend/src/modules/vitalia/agentic/guardrails/__init__.py
per anti-duplication.md sibling convention.
"""

from src.modules.comunify.agentic.guardrails.community_safety_no_doxxing import (
    AUTHOR_WARNING_RESPONSE,
    DoxxingGuardrailResult,
    community_safety_no_doxxing_input_check,
    extract_email_candidates,
    extract_phone_candidates,
)
from src.modules.comunify.agentic.guardrails.community_safety_no_nsfw import (
    IMAGE_FALLBACK_RESPONSE,
    Attachment,
    NsfwGuardrailResult,
    community_safety_no_nsfw_input_check,
)
from src.modules.comunify.agentic.guardrails.community_safety_no_spam import (
    FALLBACK_RESPONSE as SPAM_FALLBACK_RESPONSE,
)
from src.modules.comunify.agentic.guardrails.community_safety_no_spam import (
    community_safety_no_spam_input_check,
    community_safety_no_spam_output_check,
    fires_input_regex,
    fires_output_regex,
)
from src.modules.comunify.agentic.guardrails.prompt_injection_block_reuse import (
    REFUSAL_RESPONSE,
    SANDBOX_MARKER_BEGIN,
    SANDBOX_MARKER_END,
    PromptInjectionResult,
    detect_prompt_injection,
    prompt_injection_block_check,
)

__all__ = [
    # community_safety_no_doxxing (T-guards-3)
    "AUTHOR_WARNING_RESPONSE",
    "DoxxingGuardrailResult",
    "community_safety_no_doxxing_input_check",
    "extract_email_candidates",
    "extract_phone_candidates",
    # community_safety_no_nsfw (T-guards-2)
    "Attachment",
    "IMAGE_FALLBACK_RESPONSE",
    "NsfwGuardrailResult",
    "community_safety_no_nsfw_input_check",
    # community_safety_no_spam (T-guards-1)
    "SPAM_FALLBACK_RESPONSE",
    "community_safety_no_spam_input_check",
    "community_safety_no_spam_output_check",
    "fires_input_regex",
    "fires_output_regex",
    # prompt_injection_block_reuse (T-guards-4)
    "PromptInjectionResult",
    "REFUSAL_RESPONSE",
    "SANDBOX_MARKER_BEGIN",
    "SANDBOX_MARKER_END",
    "detect_prompt_injection",
    "prompt_injection_block_check",
]
