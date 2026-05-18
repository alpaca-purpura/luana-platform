<!-- Slot 4 — MEDICAL_SAFETY_RAILS (anti-duplication pointer) -->
<!-- Cacheable per-brand. Story T-ag-tools-2 (R23 production_code=true). -->
<!-- Canonical content lives at: -->
<!--   vitalia/backend/src/modules/vitalia/agentic/prompts/slot_4_medical_safety_rails.j2 -->
<!-- (Story 11 T-prompts-1 cement, validated by -->
<!--  vitalia/backend/tests/architecture/test_vitalia_slot_4_safety_markers_present.py). -->

# Medical Safety Rails — pointer

This file is a **documentation pointer**, NOT a content mirror.

The Adrián sales_agent compiler v2 Slot 4 content is sourced via
`vitalia.sales_agent.prompts.load_slot_4_medical_safety_rails_canonical()`
which reads the canonical Jinja2 template:

```
vitalia/backend/src/modules/vitalia/agentic/prompts/slot_4_medical_safety_rails.j2
```

Single source enforced by:
- `.claude/rules/anti-duplication.md` § Regla cardinal — Slot 4 MEDICAL_SAFETY_RAILS is a shared abstraction across Adrián specialist + agentic prompts; mirroring duplicates the policy strings.
- `vitalia/backend/tests/architecture/test_vitalia_slot_4_safety_markers_present.py` — validates byte-level presence of `<<TRANSCRIPT_BEGIN>>` / `<<TRANSCRIPT_END>>` sandbox markers + `ASÍ HABLAS` / `ASÍ NO` blocks + `injection`/`adversarial` rationale.

## Why a pointer file (not direct re-export)

The ticket T-ag-tools-2 scope mandates `sales_agent/prompts/medical_safety_rails.md` exists at this path (for the compiler v2 Slot 4 lookup convention). To satisfy that requirement without duplicating policy text, this file:

1. **Documents** that Slot 4 lives at the canonical agentic/prompts path.
2. **Provides a Python loader helper** in `__init__.py` (`load_slot_4_medical_safety_rails_canonical()`).
3. **Renders to empty** as a markdown body — any prompt-compose path that accidentally reads THIS file instead of the canonical j2 will get NO content (defensive — fails loud rather than silently sending an empty safety rail).

## Validation invariants (replicated for grep convenience)

The canonical j2 file MUST contain (verified by arch fitness test):

- Literal `<<TRANSCRIPT_BEGIN>>` marker
- Literal `<<TRANSCRIPT_END>>` marker
- Sandbox markers in correct semantic order
- Explicit `injection` or `adversarial` rationale (DQ2 defense)
- `ASÍ HABLAS` section with bullet ✅ statements
- `ASÍ NO` section with bullet ❌ statements
- Hard prohibition: never diagnose, never prescribe, never discuss medical results on unencrypted channels
- Required footer: medical disclaimer trigger
- Emergency derive instruction
- Channel guard rules

To inspect the canonical content:

```python
from vitalia.backend.src.modules.vitalia.sales_agent.prompts import (
    load_slot_4_medical_safety_rails_canonical,
)
print(load_slot_4_medical_safety_rails_canonical())
```

## Cache safety (claude-api anchored Step 0 2026-05-18)

The canonical j2 satisfies all cache prefix invariants:
- NO timestamps
- NO conversation_id / turn_counter / random IDs
- NO tenant_name interpolated mid-block (slot boundary discipline)
- LLM-side substitution markers OK (`{doctor_specialty}`, `{doctor_name}`, `{clinic_name}`, `{emergency_line_by_country}`) — filled at generation time using Slot 8 task-specific data.
