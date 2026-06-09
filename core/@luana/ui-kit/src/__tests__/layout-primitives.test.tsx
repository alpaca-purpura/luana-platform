// canon: design-system-canon.md §2.7 · story-origin: core-ds-foundation
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { EmptyState, ErrorState, PageHeader, ListPageSkeleton, FormPageSkeleton, Pagination } from "../layout";

describe("layout-primitives", () => {
  it("ErrorState renders role=alert and Retry triggers onRetry", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Falló la carga" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("ErrorState without onRetry shows no button", () => {
    render(<ErrorState message="Sin reintento" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("EmptyState renders title, description and action slots", () => {
    render(
      <EmptyState
        title="Sin resultados"
        description="No hay nada acá todavía"
        action={<button>Crear</button>}
      />,
    );
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("No hay nada acá todavía")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("PageHeader renders title heading and actions", () => {
    render(<PageHeader title="Especialistas" subtitle="Equipo clínico" actions={<button>Nuevo</button>} />);
    expect(screen.getByRole("heading", { name: "Especialistas" })).toBeInTheDocument();
    expect(screen.getByText("Equipo clínico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
  });

  it("ListPageSkeleton renders N rows", () => {
    render(<ListPageSkeleton rows={4} />);
    expect(screen.getAllByTestId("list-skeleton-row")).toHaveLength(4);
  });

  it("FormPageSkeleton renders N sections", () => {
    render(<FormPageSkeleton sections={2} />);
    expect(screen.getAllByTestId("form-skeleton-section")).toHaveLength(2);
  });

  it("Pagination disables prev at first page and next at last", () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).not.toBeDisabled();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    rerender(<Pagination page={3} pageCount={3} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
