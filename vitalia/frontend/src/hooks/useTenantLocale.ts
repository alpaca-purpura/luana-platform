// cap: __orphan__
// story-origin: TBD
"use client";

/**
 * useTenantLocale — returns tenant-level locale preferences (currency + timezone).
 *
 * Per .claude/rules/master-data.md:
 *   - NEVER hardcode 'USD' — use this hook's currency as fallback
 *   - NEVER toLocaleDateString() — use formatTenantDate*() with this timezone
 *
 * Reads from Clerk organization public metadata:
 *   - org.publicMetadata.currency (ISO 4217 code)
 *   - org.publicMetadata.timezone (IANA timezone name)
 *
 * Fallback: ARS / America/Argentina/Buenos_Aires (vitalia primary market)
 */

import { useOrganization } from "@clerk/nextjs";

export interface TenantLocale {
  /** ISO 4217 currency code (e.g. "ARS", "MXN", "USD", "COP") */
  currency: string;
  /** IANA timezone name (e.g. "America/Argentina/Buenos_Aires") */
  timezone: string;
  /** BCP 47 locale for number/date formatting */
  locale: string;
}

const VITALIA_DEFAULT_LOCALE: TenantLocale = {
  currency: "ARS",
  timezone: "America/Argentina/Buenos_Aires",
  locale: "es-419",
};

/**
 * Returns tenant locale preferences from Clerk organization metadata.
 * Falls back to Vitalia defaults (ARS / Buenos Aires).
 */
export function useTenantLocale(): TenantLocale {
  const { organization } = useOrganization();

  if (!organization) {
    return VITALIA_DEFAULT_LOCALE;
  }

  const meta = organization.publicMetadata as Record<string, unknown>;
  const currency =
    typeof meta.currency === "string" && meta.currency.length === 3
      ? meta.currency
      : VITALIA_DEFAULT_LOCALE.currency;
  const timezone =
    typeof meta.timezone === "string" && meta.timezone.length > 0
      ? meta.timezone
      : VITALIA_DEFAULT_LOCALE.timezone;
  const locale =
    typeof meta.locale === "string" && meta.locale.length > 0
      ? meta.locale
      : VITALIA_DEFAULT_LOCALE.locale;

  return { currency, timezone, locale };
}
