# Voice Cloning Guide (Story 12 T-docs-1)

Comunify uses an AI brand voice system — NOT voice cloning.

This is an important distinction: Comunify never copies or synthesizes a creator's
actual voice audio. Instead, Brand Studio builds a **text-based voice profile** that
captures how you communicate: your vocabulary, energy level, warmth, and boundaries.
The AI then writes messages in your style.

---

## What "voice" means in Comunify

Your brand voice profile (configured in Brand Studio → Estilo) captures:

- **Tone**: warm / professional / energetic / calm
- **Formality level**: formal tuteo / informal tuteo / regional dialect (AR voseo)
- **Vocabulary anchors**: words you use often, expressions that are "you"
- **Things you never say**: formal language if you're casual, slang if you're professional
- **Emoji usage**: none / moderate / expressive

This profile lives in `personality_profiles.system_instruction` and is the single
source of truth for all AI-generated text in your community.

---

## Voice distillation from your chat history

If you have existing conversations (WhatsApp, DM, email threads), Brand Studio can
**distill** your voice from those samples automatically.

### How it works

1. **Upload samples** in Brand Studio → Estilo → "Subir conversaciones"
   - Supported formats: WhatsApp export (.txt), plain text (.txt), PDF
   - Minimum: 20 message samples
   - Maximum: 200 samples per distillation run
   - Each sample: ideally 50-300 words

2. **4-wave extraction pipeline**:
   - Wave 1: Extract voice anchors from each sample (compressed batch)
   - Wave 2: Synthesize patterns from extracted anchors
   - Wave 3: Compile structured voice profile
   - Wave 4: Render Slot 5 BRAND_VOICE text for AI prompt

3. **Review + approve** the generated voice profile in Brand Studio
   - Preview shows 3 sample responses in your distilled voice
   - Edit any anchor before approving
   - Approve → profile activates for all new AI messages

4. **Cost**: ≤$0.18 USD per distillation run (billed to your account)

### Privacy

- Chat samples are processed in memory only
- No sample content is stored after distillation completes
- Voice profile stores the **style description**, not raw samples
- Samples from other people in the conversation are anonymized before processing

---

## Cache invalidation

When you update your voice profile in Brand Studio, the system automatically
invalidates the AI prompt cache. The next AI response uses your updated voice.

**There is no delay** — the cache invalidation is synchronous with the profile save.

Technically: the voice profile includes a `rubric_version` field (currently `1`).
Any change to the profile increments an internal version counter which breaks the
cache prefix (Slot 5 BRAND_VOICE), forcing the next LLM call to rebuild the cache.

---

## Voice profile fields reference

| Field | Description | Example |
|---|---|---|
| `tone` | Overall communication energy | `"warmly_assertive"` |
| `formality` | Pronoun + conjugation style | `"informal_tuteo"` (es-MX/CL) / `"informal_voseo"` (es-AR) |
| `emoji_density` | How many emojis per message | `"moderate"` |
| `vocabulary_anchors` | Key phrases to include | `["¡Vamos!", "te acompaño", "paso a paso"]` |
| `forbidden_phrases` | Phrases to never use | `["oferta limitada", "no puedes perderte"]` |
| `closing_style` | How to end messages | `"warm_invitation"` |
| `escalation_warmth` | How warm to be in difficult conversations | `0.9` (0-1 scale) |

---

## Compliance notes

### Not voice synthesis

Comunify does NOT:
- Record or synthesize creator audio
- Generate voice audio of any kind
- Clone or imitate a creator's spoken voice

All AI output is **text only**. Text-to-speech (if used in your community's
video/audio content) is a separate tool not provided by Comunify.

### AI disclosure

All AI-generated text messages in Comunify include metadata marking them as
AI-generated. In WhatsApp and email channels, this appears as a small "AI" label.
In the community feed, AI posts show a bot indicator.

Creators must not remove or hide the AI indicator from member-facing channels.
This is a platform requirement, not optional.

---

## Troubleshooting

**Distillation failed — "No se encontraron patrones de voz"**:
- Upload more samples (minimum 20)
- Ensure samples are in Spanish (Comunify supports es-MX, es-AR, es-CL, es-PE, es-CO)
- Avoid samples that are purely logistical ("sí", "ok", "mañana")

**Distilled voice doesn't sound like me**:
- Review and edit vocabulary anchors in Brand Studio → Estilo → Editar
- Add 3-5 phrases you use often to `vocabulary_anchors`
- Add phrases you hate to `forbidden_phrases`
- Re-distill is free if done within 24h of previous distillation

**AI ignoring my voice profile**:
- Verify profile status in Brand Studio → "Perfil activo"
- Check that `rubric_version` incremented after your last save
- Contact support if issue persists after profile re-activation

Support: support@comunify.lat
