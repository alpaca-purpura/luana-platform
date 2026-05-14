/**
 * Comunify platform configuration constants.
 * Runtime values resolved from env vars where applicable.
 */

export const COMUNIFY_CONFIG = {
  /**
   * Maximum audio sample duration accepted for voice cloning (seconds).
   */
  MAX_VOICE_SAMPLE_DURATION_S: 300,

  /**
   * Maximum file size for voice sample upload (bytes: 50 MB).
   */
  MAX_VOICE_SAMPLE_BYTES: 50 * 1024 * 1024,

  /**
   * Accepted MIME types for voice sample uploads.
   */
  ACCEPTED_VOICE_MIME_TYPES: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/m4a"],

  /**
   * Minimum total voice sample duration to kick distillation (seconds).
   */
  MIN_TOTAL_VOICE_DURATION_S: 60,

  /**
   * Polling interval for active distillation jobs (ms).
   */
  DISTILLATION_POLL_MS: 5_000,

  /**
   * Maximum cohort capacity (members).
   */
  MAX_COHORT_CAPACITY: 1_000,

  /**
   * Default page size for paginated lists.
   */
  DEFAULT_PAGE_SIZE: 25,

  /**
   * Moderation inbox refresh interval (ms).
   */
  MODERATION_POLL_MS: 30_000,
} as const;
