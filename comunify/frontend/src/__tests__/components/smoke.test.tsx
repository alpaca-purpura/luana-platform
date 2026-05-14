/**
 * Component smoke tests — T-fe-2/T-fe-3/T-fe-4/T-fe-5/T-fe-6 acceptance.
 * Verifies each component renders without throwing (data-testid presence).
 * Full interaction tests deferred to post-merge polish tickets.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// Components under test (all Server-compatible or "use client" stubs)
import { VoiceDistilledPreview } from "@/features/comunify/components/voice-distilled-preview";
import { LadderVisualizer, LadderVisualizerClient } from "@/features/comunify/components/ladder-visualizer";
import { OnboardingStep1Client } from "@/features/comunify/components/onboarding-step-1-client";
import { OnboardingStep2Client } from "@/features/comunify/components/onboarding-step-2-client";
import { OnboardingStep3Client } from "@/features/comunify/components/onboarding-step-3-client";
import { OnboardingStep4Client } from "@/features/comunify/components/onboarding-step-4-client";
import { BrandStudioSectionClient } from "@/features/comunify/components/brand-studio-section-client";
import { CohortDetailClient } from "@/features/comunify/components/cohort-detail-client";
import { CommunityAuditClient } from "@/features/comunify/components/community-audit-client";
import { CommunityModerationClient } from "@/features/comunify/components/community-moderation-client";
import { CommunityFeedClient } from "@/features/comunify/components/community-feed-client";
import { OfferWizardClient } from "@/features/comunify/components/offer-wizard-client";
import { SubscriptionsAdminClient } from "@/features/comunify/components/subscriptions-admin-client";
import { VoiceCloningClient } from "@/features/comunify/components/voice-cloning-client";
import { AuthorityVaultClient } from "@/features/comunify/components/authority-vault-editor";
import { SubscriptionMetricsCards } from "@/features/comunify/components/subscription-metrics-cards";
import { DunningActiveBanner } from "@/features/comunify/components/dunning-active-banner";
import { CreatorLandingHero } from "@/features/comunify/components/creator-landing-hero";

describe("VoiceDistilledPreview", () => {
  it("renders empty state when no compiled voice", () => {
    render(<VoiceDistilledPreview compiledVoice={null} />);
    expect(screen.getByText(/aún no hay voz destilada/i)).toBeTruthy();
  });

  it("renders loading state", () => {
    const { container } = render(<VoiceDistilledPreview compiledVoice={null} isLoading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("renders compiled voice data", () => {
    const voice = {
      identidad: "Coach de negocios",
      dialecto: "Español LatAm neutro",
      vocabulario: ["estrategia", "resultados"],
      registro: "Profesional y cercano",
      asi_no: ["no uses jerga técnica"],
      anclajes: ["tú puedes", "paso a paso"],
      confidence_score: 0.87,
    };
    render(<VoiceDistilledPreview compiledVoice={voice} />);
    expect(screen.getByText("Coach de negocios")).toBeTruthy();
    expect(screen.getByText(/87%/)).toBeTruthy();
  });
});

describe("LadderVisualizer", () => {
  it("renders empty state", () => {
    render(<LadderVisualizer />);
    expect(screen.getByTestId("ladder-visualizer")).toBeTruthy();
  });

  it("LadderVisualizerClient renders wrapper", () => {
    render(<LadderVisualizerClient />);
    expect(screen.getByTestId("ladder-visualizer-client")).toBeTruthy();
  });
});

describe("Onboarding steps", () => {
  it("step 1 renders", () => {
    render(<OnboardingStep1Client />);
    expect(screen.getByTestId("onboarding-step-1")).toBeTruthy();
  });

  it("step 2 renders", () => {
    render(<OnboardingStep2Client />);
    expect(screen.getByTestId("onboarding-step-2")).toBeTruthy();
  });

  it("step 3 renders", () => {
    render(<OnboardingStep3Client />);
    expect(screen.getByTestId("onboarding-step-3")).toBeTruthy();
  });

  it("step 4 renders", () => {
    render(<OnboardingStep4Client />);
    expect(screen.getByTestId("onboarding-step-4")).toBeTruthy();
  });
});

describe("Brand Studio", () => {
  it("BrandStudioSectionClient renders", () => {
    render(<BrandStudioSectionClient />);
    expect(screen.getByTestId("brand-studio-section-client")).toBeTruthy();
  });
});

describe("Cohorts", () => {
  it("CohortDetailClient renders detail mode", () => {
    render(<CohortDetailClient cohortId="test-id" />);
    expect(screen.getByTestId("cohort-detail-client")).toBeTruthy();
  });

  it("CohortDetailClient renders new mode", () => {
    render(<CohortDetailClient mode="new" />);
    expect(screen.getByTestId("cohort-create-client")).toBeTruthy();
  });
});

describe("Community", () => {
  it("CommunityAuditClient renders", () => {
    render(<CommunityAuditClient />);
    expect(screen.getByTestId("community-audit-client")).toBeTruthy();
  });

  it("CommunityModerationClient renders", () => {
    render(<CommunityModerationClient />);
    expect(screen.getByTestId("community-moderation-client")).toBeTruthy();
  });

  it("CommunityFeedClient renders", () => {
    render(<CommunityFeedClient />);
    expect(screen.getByTestId("community-feed-client")).toBeTruthy();
  });
});

describe("Offers", () => {
  it("OfferWizardClient renders", () => {
    render(<OfferWizardClient />);
    expect(screen.getByTestId("offer-wizard-client")).toBeTruthy();
  });
});

describe("Subscriptions", () => {
  it("SubscriptionsAdminClient renders", () => {
    render(<SubscriptionsAdminClient />);
    expect(screen.getByTestId("subscriptions-admin-client")).toBeTruthy();
  });

  it("SubscriptionMetricsCards renders", () => {
    render(<SubscriptionMetricsCards />);
    expect(screen.getByTestId("subscription-metrics-cards")).toBeTruthy();
  });

  it("SubscriptionMetricsCards shows loading state", () => {
    const { container } = render(<SubscriptionMetricsCards isLoading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("DunningActiveBanner renders null when dunningCount is 0", () => {
    const { container } = render(<DunningActiveBanner dunningCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("DunningActiveBanner renders when dunningCount > 0", () => {
    render(<DunningActiveBanner dunningCount={3} />);
    expect(screen.getByTestId("dunning-active-banner")).toBeTruthy();
    expect(screen.getByText(/3 suscripciones en cobranza/i)).toBeTruthy();
  });
});

describe("Voice Cloning", () => {
  it("VoiceCloningClient renders", () => {
    render(<VoiceCloningClient />);
    expect(screen.getByTestId("voice-cloning-client")).toBeTruthy();
  });
});

describe("Authority Vault", () => {
  it("AuthorityVaultClient renders", () => {
    render(<AuthorityVaultClient />);
    expect(screen.getByTestId("authority-vault-client")).toBeTruthy();
  });
});

describe("CreatorLandingHero", () => {
  it("renders with creator name", () => {
    render(<CreatorLandingHero creatorName="Ana García" handle="anagarcia" />);
    expect(screen.getByTestId("creator-landing-hero")).toBeTruthy();
    expect(screen.getByText("Ana García")).toBeTruthy();
    expect(screen.getByText("@anagarcia")).toBeTruthy();
  });

  it("renders with fallback initial when no avatar", () => {
    render(<CreatorLandingHero creatorName="Carlos" />);
    expect(screen.getByText("C")).toBeTruthy();
  });
});
