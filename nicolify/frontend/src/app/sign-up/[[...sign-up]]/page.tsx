/**
 * Sign-up page — Nicolify.
 *
 * Renders Clerk's <SignUp /> component.
 * Clerk handles routing via catch-all [[...sign-up]] segment.
 *
 * Public route — accesible sin sesión (declarado en proxy.ts allowlist).
 *
 * T-3 (nicolify-r0-dev-stack): auth vertical slice.
 */

import { SignUp } from "@clerk/nextjs";

/**
 * Sign-up page — renders Clerk SignUp component for new account registration.
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
