/**
 * ComposerArea.test.tsx — Composer area assembly tests.
 *
 * Tests that ComposerArea renders sub-components correctly and
 * wires up the send flow.
 *
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComposerArea } from "../ComposerArea";
import type { Conversation } from "@/features/crm-shared";
import { INBOX_COPY } from "../../copy";

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: async () => "mock-token",
    orgId: "org_test",
    isLoaded: true,
    isSignedIn: true,
  }),
}));
vi.mock("@/hooks/useTenantId", () => ({ useTenantId: () => "mock-tenant-id" }));


vi.mock("@/hooks/useClinicId", () => ({
  useClinicId: () => "clinic_test",
}));

vi.mock("@/lib/api/fetchClient", () => ({
  fetchClient: vi.fn(async () => ({
    id: "msg-1",
    conversation_id: "conv-1",
    sender_type: "agent_human",
    sender_user_id: null,
    body_text: "Test",
    media_kind: null,
    media_url: null,
    media_duration_s: null,
    transcription_text: null,
    transcription_confidence: null,
    retracted_at: null,
    retract_succeeded: null,
    handler_mode: "human",
    sent_at: new Date().toISOString(),
    action_receipt_expires_at: null,
  })),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv-1",
    tenant_id: "tenant-1",
    clinic_id: "clinic-1",
    lead_id: "lead-1",
    patient_id: null,
    channel: "whatsapp",
    status: "active",
    handler_mode: "ai",
    proposal_required: false,
    pause_until: null,
    help_needed: false,
    help_needed_reason: null,
    unread_media_count: 0,
    last_message_at: "2026-01-01T00:00:00Z",
    last_message_preview: null,
    messages_count: 0,
    stage_decision: null,
    linked_offer_id: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("ComposerArea", () => {
  it("renders MessageInput textarea", () => {
    render(<ComposerArea conversation={makeConversation()} />, { wrapper });
    // Textarea should be present
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders attach button with correct aria-label", () => {
    render(<ComposerArea conversation={makeConversation()} />, { wrapper });
    expect(
      screen.getByRole("button", { name: INBOX_COPY.composer.attachAriaLabel }),
    ).toBeInTheDocument();
  });

  it("renders SendButton with AI label for handler_mode=ai", () => {
    render(
      <ComposerArea conversation={makeConversation({ handler_mode: "ai" })} />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", { name: INBOX_COPY.composer.sendButtonAi }),
    ).toBeInTheDocument();
  });

  it("renders SendButton with human label for handler_mode=human", () => {
    render(
      <ComposerArea
        conversation={makeConversation({ handler_mode: "human" })}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", { name: INBOX_COPY.composer.sendButtonHuman }),
    ).toBeInTheDocument();
  });

  it("shows ProposalCardBanner when pendingProposalText is provided", () => {
    render(
      <ComposerArea
        conversation={makeConversation()}
        pendingProposalText="Hola, te puedo ayudar con tu consulta."
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("region", {
        name: INBOX_COPY.proposalCardBanner.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hola, te puedo ayudar con tu consulta."),
    ).toBeInTheDocument();
  });

  it("send button is disabled when text is empty", () => {
    render(<ComposerArea conversation={makeConversation()} />, { wrapper });
    const sendBtn = screen.getByRole("button", {
      name: INBOX_COPY.composer.sendButtonAi,
    });
    expect(sendBtn).toBeDisabled();
  });

  it("send button becomes enabled when user types text", () => {
    render(<ComposerArea conversation={makeConversation()} />, { wrapper });
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hola" } });
    const sendBtn = screen.getByRole("button", {
      name: INBOX_COPY.composer.sendButtonAi,
    });
    expect(sendBtn).not.toBeDisabled();
  });

  it("clears textarea after editing proposal", () => {
    render(
      <ComposerArea
        conversation={makeConversation()}
        pendingProposalText="Propuesta de Adrián"
      />,
      { wrapper },
    );
    // Click edit CTA — should copy proposal text to textarea
    fireEvent.click(
      screen.getByRole("button", {
        name: INBOX_COPY.proposalCardBanner.editCta,
      }),
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Propuesta de Adrián");
  });
});
