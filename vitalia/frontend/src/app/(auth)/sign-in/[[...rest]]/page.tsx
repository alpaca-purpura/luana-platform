import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Iniciar sesión — Vitalia",
};

/**
 * Página de inicio de sesión — Clerk SignIn.
 *
 * SC-03: <SignIn /> renderizado, inputs email+contraseña visibles, sin placeholder.
 * Apariencia alineada con design tokens Vitalia:
 *   colorPrimary  = var(--vitalia-cian-color)    [#01B2F8 — hero, CTA primario]
 *   colorText     = var(--vitalia-text-color)      [#1A1F36 — cuerpo principal]
 *   colorTextSecondary = var(--vitalia-text-muted-color)
 *   borderRadius  = 0.5rem (--vitalia-radius-md equivalente)
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vitalia-bg p-6">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "var(--vitalia-cian-color)",
            colorTextSecondary: "var(--vitalia-text-muted-color)",
            borderRadius: "0.5rem",
            fontFamily: "inherit",
          },
        }}
      />
    </main>
  );
}
