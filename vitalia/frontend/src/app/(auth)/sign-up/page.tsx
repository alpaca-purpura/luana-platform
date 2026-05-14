import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta — Vitalia",
};

/**
 * Página de registro — Clerk sign-up.
 * Contenido real con <SignUp /> de @clerk/nextjs en T-fe-3.
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Crear cuenta
        </h1>
        <p className="text-sm text-gray-500">
          {/* TODO T-fe-3: renderizar <SignUp /> de @clerk/nextjs */}
          Registro con Clerk (pendiente T-fe-3)
        </p>
      </div>
    </main>
  );
}
