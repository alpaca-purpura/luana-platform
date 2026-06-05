/**
 * shell-routes.test.ts — Vitest unit tests for DEFAULT_LANDING_SUBPATH SSoT.
 *
 * Bug #1 (vitalia-bugfix-shell-nav-scroll-errors T-1):
 *   El landing post-login DEBE aterrizar en una ruta que existe (nunca 404).
 *   `valeria/agenda` 404ea porque isValidAgent('valeria') === false (Valeria es
 *   supervisora sidebar, no ribbon agent). El default debe apuntar a `mateo/agenda`
 *   (ruta estática shipped → renderiza directo, sin pasar por isValidAgent).
 *
 * RN-1: el landing default nunca 404.
 *
 * downstream-regression-na: brand-local vitalia shell catalog test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_LANDING_SUBPATH,
  bareTenantLandingRedirect,
} from "./shell-routes";
import { isValidAgent, SHIPPED_STATIC_SUBTABS } from "./agent-catalog";

describe("DEFAULT_LANDING_SUBPATH — Bug #1 routing lands on a valid static route (RN-1)", () => {
  it("apunta a mateo/agenda (NO valeria/agenda — esa 404ea)", () => {
    expect(DEFAULT_LANDING_SUBPATH).toBe("mateo/agenda");
    expect(DEFAULT_LANDING_SUBPATH).not.toContain("valeria");
  });

  it("su agente (mateo) es un ribbon agent válido (no cae en notFound del [agent] layout)", () => {
    const [agent] = DEFAULT_LANDING_SUBPATH.split("/");
    expect(isValidAgent(agent)).toBe(true);
  });

  it("el combo agent.subtab del default es una ruta estática SHIPPED (renderiza sin 404)", () => {
    const [agent, subtab] = DEFAULT_LANDING_SUBPATH.split("/");
    const key = `${agent}.${subtab}` as never;
    expect(SHIPPED_STATIC_SUBTABS.has(key)).toBe(true);
  });

  it("regression — el agente 'valeria' del default viejo NO es válido (confirma el bug)", () => {
    expect(isValidAgent("valeria")).toBe(false);
  });
});

describe("bareTenantLandingRedirect — Bug #1 edge-redirect hardening (Next 16 soft-nav)", () => {
  const TENANT = "e69a691d-070e-5caf-a053-6e74642ec100";

  it("una ruta de tenant bare (/{uuid}) redirige al landing en el edge", () => {
    expect(bareTenantLandingRedirect(`/${TENANT}`)).toBe(
      `/${TENANT}/${DEFAULT_LANDING_SUBPATH}`,
    );
  });

  it("tolera el trailing slash (/{uuid}/)", () => {
    expect(bareTenantLandingRedirect(`/${TENANT}/`)).toBe(
      `/${TENANT}/${DEFAULT_LANDING_SUBPATH}`,
    );
  });

  it("NO redirige si el tenant ya trae subpath (/{uuid}/mateo/agenda) — evita loop", () => {
    expect(
      bareTenantLandingRedirect(`/${TENANT}/mateo/agenda`),
    ).toBeNull();
    expect(bareTenantLandingRedirect(`/${TENANT}/lisa/marca`)).toBeNull();
  });

  it("NO toca rutas no-tenant de un solo segmento (sign-in/sign-out/marketing/public)", () => {
    for (const p of [
      "/sign-in",
      "/sign-out",
      "/marketing",
      "/public",
      "/test-stack",
      "/",
    ]) {
      expect(bareTenantLandingRedirect(p), `${p} no debe redirigir`).toBeNull();
    }
  });
});
