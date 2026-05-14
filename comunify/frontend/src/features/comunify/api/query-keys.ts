/**
 * comunifyQueryKeys — SSoT for React Query cache key management.
 * All keys namespaced under "comunify" prefix.
 * Per 03-arch-fe.md § 6.1 spec.
 */
export const comunifyQueryKeys = {
  onboarding: {
    plans: () => ["comunify", "onboarding", "plans"] as const,
    handleCheck: (handle: string) =>
      ["comunify", "onboarding", "handle-check", { handle }] as const,
  },
  brandStudio: {
    sections: () => ["comunify", "brand-studio", "sections"] as const,
  },
  voiceCloning: {
    samples: () => ["comunify", "voice-cloning", "samples", "status"] as const,
    distillation: (jobId: string) =>
      ["comunify", "voice-cloning", "distillation", { jobId }] as const,
  },
  authorityVault: {
    all: () => ["comunify", "authority-vault"] as const,
  },
  offers: {
    list: (filters?: object) =>
      ["comunify", "offers", "list", filters] as const,
    detail: (id: string) => ["comunify", "offers", "detail", id] as const,
    preset: (offerType: string) =>
      ["comunify", "offers", "presets", offerType] as const,
  },
  ladder: {
    detail: () => ["comunify", "ladder"] as const,
  },
  cohorts: {
    list: () => ["comunify", "cohorts", "list"] as const,
    detail: (id: string) => ["comunify", "cohorts", "detail", id] as const,
    roster: (id: string, filters: object) =>
      ["comunify", "cohorts", "roster", id, filters] as const,
    broadcasts: (id: string) =>
      ["comunify", "cohorts", "broadcasts", id] as const,
  },
  community: {
    feed: (filters: object) =>
      ["comunify", "community", "feed", filters] as const,
    moderationInbox: () =>
      ["comunify", "community", "moderation", "inbox"] as const,
  },
  subscriptions: {
    list: (filters: { status?: string }) =>
      ["comunify", "subscriptions", "list", filters] as const,
    detail: (id: string) =>
      ["comunify", "subscriptions", "detail", id] as const,
    metrics: () => ["comunify", "subscriptions", "metrics"] as const,
  },
  audit: {
    events: (filters: object) =>
      ["comunify", "audit", "events", filters] as const,
  },
} as const;
