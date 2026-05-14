import type { Metadata } from "next";

interface BrandStudioSectionPageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata(
  { params }: BrandStudioSectionPageProps
): Promise<Metadata> {
  const { section } = await params;
  return {
    title: `${section} — Studio de marca — Vitalia`,
  };
}

/**
 * Editor de sección de brand studio — sección dinámica (identity/contact/team/testimonials).
 * Server Component — delegará en <BrandStudioSectionClient /> (T-fe-3).
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function BrandStudioSectionPage({
  params,
}: BrandStudioSectionPageProps) {
  const { section } = await params;

  return (
    <section aria-label={`Sección de marca: ${section}`}>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Editar sección
      </h1>
      {/* TODO T-fe-3: renderizar <BrandStudioSectionClient section={section} /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Editor de sección &quot;{section}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
