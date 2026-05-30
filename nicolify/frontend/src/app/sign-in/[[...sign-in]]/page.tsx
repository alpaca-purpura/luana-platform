/**
 * Sign-in page — Nicolify.
 *
 * Renders Clerk's <SignIn /> component.
 * Clerk handles routing via catch-all [[...sign-in]] segment.
 *
 * Public route — accesible sin sesión (declarado en proxy.ts allowlist).
 *
 * T-3 (nicolify-r0-dev-stack): auth vertical slice.
 */

import { SignIn } from "@clerk/nextjs";

/**
 * Sign-in page — renders Clerk SignIn component for authentication.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
