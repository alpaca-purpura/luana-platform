"use client";

// TODO T-fe-2 polish post-merge: wire FormRuntime + useBrandStudioSections

interface BrandStudioSectionClientProps {
  section?: string;
}

export function BrandStudioSectionClient({ section }: BrandStudioSectionClientProps) {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="brand-studio-section-client">
      <h1 className="text-2xl font-bold capitalize">
        {section ? section.replace(/-/g, " ") : "Sección"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Edita esta sección de tu Brand Studio.
      </p>
    </div>
  );
}
