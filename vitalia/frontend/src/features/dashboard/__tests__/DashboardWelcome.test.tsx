/**
 * DashboardWelcome unit tests — T-3 TDD RED → GREEN
 *
 * Coverage: SC-06 (welcome state + tenant context + onboarding CTA).
 *
 * DashboardWelcome is a Server Component — we render its public interface
 * by testing via a thin test wrapper that calls the exported component.
 *
 * Strategy:
 *   - Mock @clerk/nextjs/server auth() to return controlled userId / orgId
 *   - Mock global fetch to return IAMUserResponse shape for /api/v1/iam/me
 *   - Render DashboardWelcome via renderServerComponent helper (awaited)
 *
 * @see vitalia/docs/product/stories/vitalia-auth-base-functional/06-tickets.yaml § T-3.gherkin_coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ────────────────────────────────────────────────────────────────────────────
// Mocks declared BEFORE component import (hoisting safe with vi.mock)
// ────────────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ────────────────────────────────────────────────────────────────────────────
// Import AFTER mocks
// ────────────────────────────────────────────────────────────────────────────

import { auth } from "@clerk/nextjs/server";
import { DashboardWelcome } from "../components/DashboardWelcome";
import type { DashboardUserData } from "../types/DashboardData";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const mockAuthResult = {
  userId: "user_test_123",
  orgId: "org_clinic_abc",
  getToken: vi.fn().mockResolvedValue("test_jwt_token"),
} as unknown as Awaited<ReturnType<typeof auth>>;

const makeIamResponse = (overrides?: Partial<DashboardUserData>): DashboardUserData => ({
  userId: "user_test_123",
  firstName: "María",
  lastName: "González",
  email: "maria@clinica.com",
  role: "admin_clinic",
  isOnboarded: true,
  clinicName: "Clínica Vitalia",
  planTier: "professional",
  tenantId: "org_clinic_abc",
  clinicId: "clinic_001",
  ...overrides,
});

function mockFetchSuccess(data: DashboardUserData) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(data),
    })
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("DashboardWelcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAuthResult);
  });

  it("renders_welcome_with_tenant_context", async () => {
    // Arrange
    const userData = makeIamResponse({ firstName: "María", clinicName: "Clínica Vitalia", planTier: "professional" });
    mockFetchSuccess(userData);

    // Act — render the Server Component (async)
    const Component = await DashboardWelcome({ userId: "user_test_123" });
    render(Component);

    // Assert — h1 greeting
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hola, María");

    // Assert — tenant badge with clinic name + plan
    const badge = screen.getByTestId("tenant-badge");
    expect(badge).toHaveTextContent("Clínica Vitalia");
    expect(badge).toHaveTextContent("professional");

    // Assert — 5 stub cards present
    const stubCards = screen.getAllByTestId("stub-card");
    expect(stubCards).toHaveLength(5);
  });

  it("renders_onboarding_cta_when_not_onboarded", async () => {
    // Arrange
    const userData = makeIamResponse({ isOnboarded: false, firstName: "Carlos" });
    mockFetchSuccess(userData);

    // Act
    const Component = await DashboardWelcome({ userId: "user_test_123" });
    render(Component);

    // Assert — CTA "Configurar tu clínica" visible and links to /onboarding/wizard
    const cta = screen.getByRole("link", { name: /Configurar tu clínica/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/onboarding/wizard");
  });

  it("hides_onboarding_cta_when_onboarded", async () => {
    // Arrange
    const userData = makeIamResponse({ isOnboarded: true, firstName: "Ana" });
    mockFetchSuccess(userData);

    // Act
    const Component = await DashboardWelcome({ userId: "user_test_123" });
    render(Component);

    // Assert — CTA NOT present
    const cta = screen.queryByRole("link", { name: /Configurar tu clínica/i });
    expect(cta).not.toBeInTheDocument();

    // Assert — h1 still present (component renders normally)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hola, Ana");
  });
});
