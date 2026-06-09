// canon: design-system-canon.md §6.1 · story-origin: core-ds-foundation
/**
 * Typography tier NAME contract — shared tiers cross-brand (RN-5).
 *
 * NAMES only; the font-size / line-height / weight per tier is PER-BRAND.
 *  - display — page hero / largest
 *  - heading — section titles
 *  - body    — default reading text
 *  - caption — meta / helper text
 */
export const TYPOGRAPHY_TIERS = Object.freeze(["display", "heading", "body", "caption"] as const);

export type TypographyTier = (typeof TYPOGRAPHY_TIERS)[number];
