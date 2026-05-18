import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración inicial — Comunify",
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-comunify-bg">
      {/* Progress indicator placeholder */}
      <div className="mx-auto w-full max-w-xl px-4 py-2">
        <div className="h-1.5 w-full rounded-full bg-comunify-border">
          <div className="h-1.5 rounded-full bg-comunify-gradient transition-all" style={{ width: "25%" }} />
        </div>
      </div>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
