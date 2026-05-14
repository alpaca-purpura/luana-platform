import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Vitalia",
};

/**
 * Página de inicio de sesión — Clerk sign-in.
 * Contenido real con <SignIn /> de @clerk/nextjs en T-fe-3.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Iniciar sesión
        </h1>
        <p className="text-sm text-gray-500">
          {/* TODO T-fe-3: renderizar <SignIn /> de @clerk/nextjs */}
          Inicio de sesión con Clerk (pendiente T-fe-3)
        </p>
      </div>
    </main>
  );
}
