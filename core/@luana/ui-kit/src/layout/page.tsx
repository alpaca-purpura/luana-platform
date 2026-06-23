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
  /**
   * Etiqueta del pill de regreso (ej. "Agenda"). Cuando está presente renderiza un
   * pill clickeable «‹ {backLabel}» ARRIBA del título que llama a `onBack`. Aditivo:
   * sin `backLabel` el encabezado se comporta igual que antes.
   */
  backLabel?: string;
  /** Click en el pill de regreso. */
  onBack?: () => void;
  /** Nodo opcional a la izquierda del título (dot de agente / ícono). */
  leading?: React.ReactNode;
}

/** Encabezado de página: pill de regreso opcional + título + subtítulo + acciones (flex-between). */
export function PageHeader({
  title,
  subtitle,
  actions,
  backLabel,
  onBack,
  leading,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="min-w-0">
        {backLabel ? (
          <button
            type="button"
            onClick={onBack}
            data-testid="page-header-back"
            className={cn(
              "mb-1 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5",
              "text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <span aria-hidden="true">‹</span>
            {backLabel}
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
        </div>
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
