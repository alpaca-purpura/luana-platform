// canon: design-system-canon.md §2.7 · story-origin: core-ds-foundation
import * as React from "react";

import { cn } from "@luana/format/utils";

/** Cuerpo de una hoja: padding interior estándar del shell (≈1.25rem 1.5rem). */
export function PageContainer({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("px-6 py-5", className)} {...props}>
      {children}
    </section>
  );
}

/** Gestor de espaciado vertical uniforme entre bloques de una hoja. */
export function PageContentStack({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </div>
  );
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Encabezado de página: título + subtítulo + acciones (distribución flex-between). */
export function PageHeader({ title, subtitle, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
}

/** Sección semántica con título H2 opcional + bloque de contenido. */
export function PageSection({ title, children, className, ...props }: PageSectionProps) {
  const headingId = React.useId();
  return (
    <section
      className={cn("flex flex-col gap-3", className)}
      aria-labelledby={title ? headingId : undefined}
      {...props}
    >
      {title ? (
        <h2 id={headingId} className="text-base font-medium text-foreground">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
