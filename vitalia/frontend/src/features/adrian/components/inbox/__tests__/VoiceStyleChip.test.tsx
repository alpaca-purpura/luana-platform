/**
 * VoiceStyleChip.test.tsx — Unit tests for VoiceStyleChip.
 *
 * Tests:
 *   - Renders configured state with custom styleLabel
 *   - Renders unconfigured state with default copy
 *   - CTA link always visible with correct href
 *   - aria-label and data-testid present
 *
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoiceStyleChip } from "../VoiceStyleChip";
import { INBOX_COPY } from "../../../lib/copy";

describe("VoiceStyleChip", () => {
  it("renders with data-testid=voice-style-chip", () => {
    render(<VoiceStyleChip />);
    expect(screen.getByTestId("voice-style-chip")).toBeDefined();
  });

  it("shows unconfigured label when isConfigured=false", () => {
    render(<VoiceStyleChip isConfigured={false} />);
    expect(screen.getByTestId("voice-style-chip").textContent).toContain(
      INBOX_COPY.voiceStyleChip.unconfigured,
    );
  });

  it("shows default configured label when isConfigured=true and no styleLabel", () => {
    render(<VoiceStyleChip isConfigured={true} />);
    expect(screen.getByTestId("voice-style-chip").textContent).toContain(
      INBOX_COPY.voiceStyleChip.configured,
    );
  });

  it("shows custom styleLabel when isConfigured=true and styleLabel provided", () => {
    render(
      <VoiceStyleChip isConfigured={true} styleLabel="empático · directo" />,
    );
    expect(screen.getByTestId("voice-style-chip").textContent).toContain(
      "empático · directo",
    );
  });

  it("always renders CTA link with INBOX_COPY.voiceStyleChip.cta text", () => {
    render(<VoiceStyleChip isConfigured={false} />);
    const cta = screen.getByTestId("voice-style-chip-cta");
    expect(cta).toBeDefined();
    expect(cta.textContent).toBe(INBOX_COPY.voiceStyleChip.cta);
  });

  it("CTA link defaults to /brand-studio/estilo", () => {
    render(<VoiceStyleChip />);
    const cta = screen.getByTestId("voice-style-chip-cta");
    expect(cta.getAttribute("href")).toBe("/brand-studio/estilo");
  });

  it("CTA link uses custom configureHref when provided", () => {
    render(<VoiceStyleChip configureHref="/custom/path" />);
    const cta = screen.getByTestId("voice-style-chip-cta");
    expect(cta.getAttribute("href")).toBe("/custom/path");
  });

  it("has accessible aria-label on container", () => {
    render(<VoiceStyleChip />);
    const chip = screen.getByTestId("voice-style-chip");
    expect(chip.getAttribute("aria-label")).toBe(
      INBOX_COPY.voiceStyleChip.ariaLabel,
    );
  });
});
