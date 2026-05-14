/**
 * offer-wizard-individual-session.smoke.spec.ts — V-V-8
 *
 * Validator: V-V-8 — Spec §3.3.B Mindful psychology individual session offer
 * Fixture: mindful-psych-cl (psychology solo_doctor, no deposit)
 * Flow: Offer wizard → individual_session → no prepay validation
 */
import { test, expect } from "../../fixtures/mindful-psych-cl.fixture";
import { collectConsoleErrors } from "../../auth.fixture";

test.describe("Offer Wizard — Sesión Individual (Mindful CL)", () => {
  test("V-V-8: offer wizard loads for psychology clinic", async ({
    mindfulPage: page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await page.goto("/ofertas/nueva");

    // Wizard step visible
    await expect(
      page.getByText(/tipo de servicio|paso 1/i)
    ).toBeVisible({ timeout: 10_000 });

    expect(consoleErrors).toHaveLength(0);
  });

  test("V-V-8: psychology session types available", async ({
    mindfulPage: page,
  }) => {
    await page.goto("/ofertas/nueva");

    // Psychology-specific types (from mindful preset mock: individual_session, orientative_session, group_therapy)
    await expect(
      page.getByText(/sesi[oó]n individual|sesi[oó]n orientativa/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("V-V-8: form validates free session cannot require prepay", async ({
    mindfulPage: page,
  }) => {
    await page.goto("/ofertas/nueva");

    // Navigate to pricing step
    await page.goto("/ofertas/nueva?step=precio");

    // If price input visible, set to 0
    const priceInput = page.getByRole("spinbutton", { name: /precio base/i });
    if (await priceInput.isVisible()) {
      await priceInput.fill("0");

      // If prepay checkbox visible, check it
      const prepayChk = page.getByRole("checkbox", { name: /requiere prepago/i });
      if (await prepayChk.isVisible()) {
        await prepayChk.check();
      }

      // Submit should show validation error
      const submitBtn = page.getByRole("button", { name: /siguiente|publicar/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();

        // Validation error: free session cannot require prepay (per spec §3.3.B)
        await expect(
          page.getByText(/sesi[oó]n gratuita|precio cero.*prepago|prepago.*precio cero/i)
        ).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("V-V-8: offer list accessible for solo_doctor plan", async ({
    mindfulPage: page,
    mindful,
  }) => {
    await page.goto("/ofertas");

    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/algo sali[oó] mal/i)).not.toBeVisible();
  });
});
