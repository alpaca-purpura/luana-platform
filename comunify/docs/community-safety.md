# Community Safety Guidelines (Story 12 T-docs-1)

Comunify is a platform for creator-economy communities — coaches, nutritionists,
productivity coaches, and similar experts who build paid membership communities
across Latin America.

These guidelines define what Comunify's AI agents will and will not do to keep
communities safe. They are enforced at the code level (guardrails) and at the
eval level (rubric A1-A5 per `docs/specs/rubrics/vertical-creator-economy-fidelity.md`).

---

## What Comunify agents will NEVER do

### A1 — No spam or manipulative pricing

The AI agent will not:
- Send unsolicited bulk messages to members (spam)
- Use scarcity tactics ("solo quedan 3 cupos" when false)
- Use guilt-based pricing language ("si no te unes ahora estás perdiendo")
- Pressure members to upgrade tiers immediately after joining
- Misrepresent membership value or promised deliverables

### A2 — No NSFW content or doxxing

The AI agent will not:
- Generate or relay sexually explicit content
- Share, solicit, or aggregate private member information (doxxing)
- Facilitate harassment of any member
- Reveal one member's personal information to another

### Prompt injection defense

The AI agent ignores instructions embedded in user messages that attempt to:
- Override its safety configuration
- Impersonate Comunify staff
- Extract system prompts or internal configuration
- Bypass moderation for "testing" purposes

Any such attempt is logged and flagged for creator review.

---

## How Comunify handles vulnerable disclosures (A3)

When a member shares concerning personal information — such as statements
about disordered eating, self-harm ideation, emotional crisis, or acute mental
health distress — the agent will:

1. **Acknowledge with warmth** and without judgment
2. **Not attempt clinical diagnosis or therapy** (the agent is not a clinician)
3. **Provide escalation resources** appropriate to the member's country:
   - Argentina: SAME (135), Centro de Asistencia al Suicida (135)
   - Chile: ACHS Salud Mental (600 600 7777), Fono Salud (600 360 7777)
   - Mexico: SAPTEL (55 5259-8121), CONASAMA (800 290 0024)
4. **Notify the creator** (community admin) via platform notification
5. **End the sales/marketing conversation** immediately — no further offers

This applies to any message containing safety keywords regardless of context.

---

## Voice cloning and impersonation policy

See `docs/voice-cloning-guide.md` for technical details.

**Policy summary:**
- AI voice in Comunify represents the creator's brand, not a clone of any specific person
- Voice profiles are created by the creator through Brand Studio (not by AI inference)
- The AI will not claim to be a human, a specific named person, or a celebrity
- All AI-generated messages in channels that support it include an "AI" label

---

## Moderation escalation matrix

| Signal | Agent action | Creator notified |
|---|---|---|
| Spam post detected | Block message + send policy response | Yes (log entry) |
| Doxxing attempt | Block + generic refusal | Yes (urgent flag) |
| Prompt injection attempt | Block + ignore override | Yes (security log) |
| Vulnerable disclosure keyword | Warm acknowledgment + crisis resources | Yes (urgent flag) |
| NSFW content request | Block + redirect | Yes (log entry) |
| Pricing complaint | Empathetic acknowledgment + handoff | No |

---

## For creators: configuring community safety

In Brand Studio → Community Settings:

1. **Safety level**: Standard (default) / Enhanced (stricter keyword matching)
2. **Crisis resource locale**: Auto-detect from member locale OR manual override
3. **Moderation notifications**: Email / push / both
4. **Auto-escalation**: Send vulnerable disclosure notification within 5 minutes

Questions: support@comunify.lat
