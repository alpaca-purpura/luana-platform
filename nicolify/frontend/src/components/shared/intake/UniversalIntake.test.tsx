// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * UniversalIntake.test.tsx — TDD tests for the 4-mode intake component.
 *
 * Covers:
 *   - 4 mode tabs rendered (URL, Archivo, Texto, Conectar)
 *   - "Conectar fuente" mode is disabled (aria-disabled + tabIndex=-1)
 *   - "Conectar fuente" disabled mode shows CTA "Configurar → Conexiones"
 *   - URL mode: input renders + submit enabled when value present
 *   - Texto mode: textarea renders + submit enabled
 *   - Archivo mode: dropzone renders + file input
 *   - Submit emits correct IcpExtractRequest payload
 *   - Cancel callback fires
 *   - isSubmitting disables the analyze button
 *
 * TDD RED-first: tests written before implementation per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §7 intake + validators_gate: RN-9 + SC-network
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/link (needed for CTA rendering)
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { UniversalIntake } from "./UniversalIntake";

const noop = () => undefined;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("UniversalIntake — 4 modos", () => {
  // ── Mode tabs ─────────────────────────────────────────────────────────────

  it("renders 4 mode tabs: URL, Archivo, Texto, Conectar fuente", () => {
    render(<UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" />);

    expect(screen.getByTestId("intake-tab-url")).toBeTruthy();
    expect(screen.getByTestId("intake-tab-archivo")).toBeTruthy();
    expect(screen.getByTestId("intake-tab-texto")).toBeTruthy();
    expect(screen.getByTestId("intake-tab-conectar")).toBeTruthy();
  });

  it("mode tabs have role=tab and are within a role=tablist", () => {
    render(<UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeTruthy();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(4);
  });

  it("'Conectar fuente' tab is disabled — aria-disabled=true + tabIndex=-1", () => {
    render(<UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" />);

    const conectarTab = screen.getByTestId("intake-tab-conectar");
    expect(conectarTab.getAttribute("aria-disabled")).toBe("true");
    expect(conectarTab.getAttribute("tabindex")).toBe("-1");
  });

  it("'Conectar fuente' cannot be selected (click on disabled tab stays on current mode)", () => {
    render(
      <UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" initialMode="url" />,
    );

    // URL mode active initially
    const urlTab = screen.getByTestId("intake-tab-url");
    expect(urlTab.getAttribute("aria-selected")).toBe("true");

    // Click Conectar — should not change active mode
    const conectarTab = screen.getByTestId("intake-tab-conectar");
    fireEvent.click(conectarTab);

    // URL still selected
    expect(urlTab.getAttribute("aria-selected")).toBe("true");
  });

  it("'Conectar fuente' CTA link points to /{tenantId}/config/conexiones", () => {
    render(<UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" />);

    // The CTA link in the footer copy
    const ctaLinks = screen.getAllByRole("link");
    const conexionesLink = ctaLinks.find((l) =>
      l.getAttribute("href")?.includes("config/conexiones"),
    );
    expect(conexionesLink).toBeTruthy();
    expect(conexionesLink?.getAttribute("href")).toBe("/tenant-abc/config/conexiones");
  });

  // ── URL mode ──────────────────────────────────────────────────────────────

  describe("URL mode (default)", () => {
    it("shows URL input in URL mode", () => {
      render(
        <UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" initialMode="url" />,
      );
      expect(screen.getByTestId("intake-url-input")).toBeTruthy();
    });

    it("Analizar button is disabled when URL input is empty", () => {
      render(
        <UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" initialMode="url" />,
      );
      const btn = screen.getByTestId("intake-submit-btn");
      expect(btn).toBeDisabled();
    });

    it("Analizar button is enabled when URL input has value", () => {
      render(
        <UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" initialMode="url" />,
      );
      const input = screen.getByTestId("intake-url-input");
      fireEvent.change(input, { target: { value: "https://empresa.com" } });

      const btn = screen.getByTestId("intake-submit-btn");
      expect(btn).not.toBeDisabled();
    });

    it("submits correct IcpExtractRequest payload for URL mode", () => {
      const onSubmit = vi.fn();
      render(
        <UniversalIntake
          onSubmit={onSubmit}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="url"
        />,
      );

      const input = screen.getByTestId("intake-url-input");
      fireEvent.change(input, { target: { value: "https://empresa.com" } });

      const btn = screen.getByTestId("intake-submit-btn");
      fireEvent.click(btn);

      // Submit is async but payload formation is sync for URL mode
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          seedType: "url",
          url: "https://empresa.com",
        }),
      );
    });
  });

  // ── Texto mode ────────────────────────────────────────────────────────────

  describe("Texto mode", () => {
    it("shows textarea in Texto mode", () => {
      render(
        <UniversalIntake
          onSubmit={noop}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="texto"
        />,
      );
      expect(screen.getByTestId("intake-texto-input")).toBeTruthy();
    });

    it("Analizar button is disabled when text is empty", () => {
      render(
        <UniversalIntake
          onSubmit={noop}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="texto"
        />,
      );
      const btn = screen.getByTestId("intake-submit-btn");
      expect(btn).toBeDisabled();
    });

    it("Analizar enabled when text has content", () => {
      render(
        <UniversalIntake
          onSubmit={noop}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="texto"
        />,
      );
      const input = screen.getByTestId("intake-texto-input");
      fireEvent.change(input, { target: { value: "Describe el cliente..." } });
      const btn = screen.getByTestId("intake-submit-btn");
      expect(btn).not.toBeDisabled();
    });
  });

  // ── Archivo mode ──────────────────────────────────────────────────────────

  describe("Archivo mode", () => {
    it("shows file dropzone in Archivo mode", () => {
      render(
        <UniversalIntake
          onSubmit={noop}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="archivo"
        />,
      );
      expect(screen.getByTestId("intake-file-dropzone")).toBeTruthy();
      expect(screen.getByTestId("intake-file-input")).toBeTruthy();
    });

    it("Analizar button is disabled when no file selected", () => {
      render(
        <UniversalIntake
          onSubmit={noop}
          onCancel={noop}
          tenantId="tenant-abc"
          initialMode="archivo"
        />,
      );
      const btn = screen.getByTestId("intake-submit-btn");
      expect(btn).toBeDisabled();
    });
  });

  // ── isSubmitting state ────────────────────────────────────────────────────

  it("Analizar button shows 'Analizando…' and is disabled when isSubmitting=true", () => {
    render(
      <UniversalIntake
        onSubmit={noop}
        onCancel={noop}
        tenantId="tenant-abc"
        initialMode="url"
        isSubmitting={true}
      />,
    );

    const btn = screen.getByTestId("intake-submit-btn");
    expect(btn.textContent).toContain("Analizando");
    expect(btn).toBeDisabled();
  });

  // ── Cancel ────────────────────────────────────────────────────────────────

  it("calls onCancel when Cancelar button clicked", () => {
    const onCancel = vi.fn();
    render(<UniversalIntake onSubmit={noop} onCancel={onCancel} tenantId="tenant-abc" />);
    fireEvent.click(screen.getByTestId("intake-cancel-btn"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  // ── Mode switching ────────────────────────────────────────────────────────

  it("clicking Texto tab switches content to textarea", () => {
    render(
      <UniversalIntake onSubmit={noop} onCancel={noop} tenantId="tenant-abc" initialMode="url" />,
    );

    // Initially URL mode
    expect(screen.getByTestId("intake-url-input")).toBeTruthy();

    // Switch to Texto
    fireEvent.click(screen.getByTestId("intake-tab-texto"));

    // Texto mode now active
    expect(screen.getByTestId("intake-texto-input")).toBeTruthy();
    expect(screen.queryByTestId("intake-url-input")).toBeNull();
  });
});
