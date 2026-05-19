/**
 * DashboardWelcome — Server Component.
 *
 * Renders the authenticated welcome state for the dashboard home.
 * Fetches /api/v1/iam/me server-side using Clerk auth() for the JWT + orgId.
 *
 * Per T-3:
 *   - h1 "Hola, {first_name}"
 *   - Badge "{clinic_name} · {plan_tier}"
 *   - CTA "Configurar tu clínica" → /onboarding/wizard (only when !is_onboarded)
 *   - SliceOneStubsRow: 5 stub cards
 *
 * Spanish neutro LatAm: tuteo, tildes correctas, no voseo.
 * HIPAA-lite: server-side fetch only, no PHI in localStorage/sessionStorage.
 */

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SliceOneStubsRow } from "./SliceOneStubsRow";
import type { DashboardUserData, DashboardWelcomeProps } from "../types/DashboardData";

/** Fetch IAM user data server-side (no client-side PHI exposure). */
async function fetchDashboardUser(
  token: string,
  tenantId: string
): Promise<DashboardUserData> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002";
  const response = await fetch(`${backendUrl}/api/v1/iam/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenantId,
      "Content-Type": "application/json",
    },
    // No cache — user data must be fresh
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`IAM me fetch failed: ${response.status}`);
  }

  return response.json() as Promise<DashboardUserData>;
}

/**
 * Dashboard welcome state — server-rendered, no client bundle cost.
 */
export async function DashboardWelcome({ userId }: DashboardWelcomeProps) {
  const authResult = await auth();

  if (!authResult.userId) {
    redirect("/sign-in");
  }

  const token = await authResult.getToken();
  const tenantId = authResult.orgId ?? "";

  if (!token) {
    redirect("/sign-in");
  }

  let userData: DashboardUserData;
  try {
    userData = await fetchDashboardUser(token, tenantId);
  } catch {
    // Fallback: render minimal welcome with Clerk data only
    userData = {
      userId,
      firstName: "usuario",
      lastName: "",
      email: "",
      role: "admin_clinic",
      isOnboarded: true,
      clinicName: "tu clínica",
      planTier: "starter",
      tenantId,
      clinicId: "",
    };
  }

  const { firstName, clinicName, planTier, isOnboarded } = userData;

  return (
    <section aria-label="Bienvenida al panel" className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Hola, {firstName}
        </h1>

        {/* Tenant badge */}
        <span
          data-testid="tenant-badge"
          className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
        >
          {clinicName}
          <span className="mx-1.5 text-gray-400" aria-hidden="true">·</span>
          {planTier}
        </span>
      </div>

      {/* Onboarding CTA — only when not onboarded */}
      {!isOnboarded && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-3 text-sm text-blue-800">
            Completa la configuración de tu clínica para aprovechar todas las funciones.
          </p>
          <Link
            href="/onboarding/wizard"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Configurar tu clínica
          </Link>
        </div>
      )}

      {/* Slice-one stubs row */}
      <SliceOneStubsRow />
    </section>
  );
}
