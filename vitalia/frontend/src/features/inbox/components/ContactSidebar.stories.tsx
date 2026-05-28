// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * ContactSidebar.stories.tsx — Storybook stories for the PHI-aware contact sidebar.
 *
 * Mocks useCurrentUser, PiiMaskedSpan, RequireRole, AuditedSection para evitar
 * dependencias de Clerk y audit log en Storybook.
 *
 * Cubre: doctor (ve NPS), marketing (sin NPS), contacto incompleto, NPS vacío.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { vi } from "vitest";
import { ContactSidebar } from "./ContactSidebar";
import type { InboxContactInfo } from "./ContactSidebar";

// ---------------------------------------------------------------------------
// Module-level mocks — PHI components + auth hook
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/components/shared/phi/PiiMaskedSpan", () => ({
  PiiMaskedSpan: ({
    value,
    className,
  }: {
    value: string;
    className?: string;
  }) => <span className={className}>{value}</span>,
}));

vi.mock("@/components/shared/phi/RequireRole", () => ({
  RequireRole: ({
    roles,
    userRole,
    children,
  }: {
    roles: string[];
    userRole: string;
    children: React.ReactNode;
  }) => (roles.includes(userRole) ? <>{children}</> : null),
}));

vi.mock("@/components/shared/phi/AuditedSection", () => ({
  AuditedSection: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CONTACT_COMPLETO: InboxContactInfo = {
  patientId: "pat-hash-abc123",
  name: "Valentina Gómez",
  phone: "+5491123456789",
  email: "valentina@example.com",
  statusTag: "Considerando",
  npsHistory: [
    {
      score: 9,
      recorded_at: "2026-04-15T10:00:00.000Z",
      comment: "Excelente atención.",
    },
    { score: 7, recorded_at: "2026-03-10T10:00:00.000Z", comment: null },
  ],
};

const CONTACT_INCOMPLETO: InboxContactInfo = {
  patientId: "pat-hash-def456",
  phone: "+5491198765432",
  statusTag: null,
  npsHistory: [],
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ContactSidebar> = {
  title: "Features/Inbox/ContactSidebar",
  component: ContactSidebar,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-surface" },
    layout: "padded",
  },
  args: {
    conversationId: "conv-abc-123",
    leadId: "lead-xyz-789",
    contact: CONTACT_COMPLETO,
  },
};

export default meta;
type Story = StoryObj<typeof ContactSidebar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const RolDoctor: Story = {
  name: "Rol doctor (ve historial NPS)",
  beforeEach: async () => {
    const { useCurrentUser } = await import("@/hooks/useCurrentUser");
    (useCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({
      role: "doctor",
    });
  },
};

export const RolMarketing: Story = {
  name: "Rol marketing (sin historial NPS)",
  beforeEach: async () => {
    const { useCurrentUser } = await import("@/hooks/useCurrentUser");
    (useCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({
      role: "marketing",
    });
  },
};

export const ContactoIncompleto: Story = {
  name: "Contacto sin nombre ni email",
  args: { contact: CONTACT_INCOMPLETO },
  beforeEach: async () => {
    const { useCurrentUser } = await import("@/hooks/useCurrentUser");
    (useCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({
      role: "admin_clinic",
    });
  },
};

export const NpsVacio: Story = {
  name: "Rol enfermera — NPS vacío",
  args: {
    contact: { ...CONTACT_COMPLETO, npsHistory: [] },
  },
  beforeEach: async () => {
    const { useCurrentUser } = await import("@/hooks/useCurrentUser");
    (useCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({
      role: "nurse",
    });
  },
};
