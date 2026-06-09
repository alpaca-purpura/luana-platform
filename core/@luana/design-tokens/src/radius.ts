// canon: design-system-canon.md §6.1 · story-origin: core-ds-foundation
/**
 * Radius NAME contract — shared tiers cross-brand (RN-5).
 *
 * Carries the NAMES only. The rem VALUE per tier is PER-BRAND (lives in each
 * brand's globals.css `--radius*`). Never merge brand radius values here.
 *  - sm / md / lg — surface scale (cards, inputs, sheets)
 *  - bubble       — chat bubble radius (agent surfaces)
 *  - pill         — fully-rounded chips / toggles
 */
export const RADIUS_NAMES = Object.freeze(["sm", "md", "lg", "bubble", "pill"] as const);

export type RadiusName = (typeof RADIUS_NAMES)[number];
