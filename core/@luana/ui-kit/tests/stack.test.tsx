import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Stack, Grid } from "../src/layout/stack";

describe("Stack", () => {
  it("renders default classes (flex flex-col gap-2)", () => {
    render(<Stack data-testid="stk">child</Stack>);
    const el = screen.getByTestId("stk");
    expect(el).toHaveClass("flex", "flex-col", "gap-2");
  });

  it("renders children", () => {
    render(
      <Stack>
        <span>uno</span>
        <span>dos</span>
      </Stack>,
    );
    expect(screen.getByText("uno")).toBeInTheDocument();
    expect(screen.getByText("dos")).toBeInTheDocument();
  });

  it("maps direction=row to flex-row", () => {
    render(
      <Stack data-testid="stk" direction="row">
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass("flex", "flex-row");
  });

  it.each([
    [0, "gap-0"],
    [1, "gap-1"],
    [2, "gap-2"],
    [3, "gap-3"],
    [4, "gap-4"],
    [5, "gap-5"],
    [6, "gap-6"],
    [8, "gap-8"],
  ] as const)("maps gap=%s to %s", (gap, expected) => {
    render(
      <Stack data-testid="stk" gap={gap}>
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass(expected);
  });

  it.each([
    ["start", "items-start"],
    ["center", "items-center"],
    ["end", "items-end"],
    ["stretch", "items-stretch"],
  ] as const)("maps align=%s to %s", (align, expected) => {
    render(
      <Stack data-testid="stk" align={align}>
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass(expected);
  });

  it.each([
    ["start", "justify-start"],
    ["center", "justify-center"],
    ["end", "justify-end"],
    ["between", "justify-between"],
  ] as const)("maps justify=%s to %s", (justify, expected) => {
    render(
      <Stack data-testid="stk" justify={justify}>
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass(expected);
  });

  it("omits align/justify classes when not provided", () => {
    render(<Stack data-testid="stk">x</Stack>);
    const cls = screen.getByTestId("stk").className;
    expect(cls).not.toMatch(/items-/);
    expect(cls).not.toMatch(/justify-/);
  });

  it("passes through className (additive)", () => {
    render(
      <Stack data-testid="stk" className="min-w-0">
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass("flex", "flex-col", "gap-2", "min-w-0");
  });

  it("lets className override the default gap via tailwind-merge (gap-1 wins)", () => {
    render(
      <Stack data-testid="stk" className="gap-1">
        x
      </Stack>,
    );
    const cls = screen.getByTestId("stk").className;
    expect(screen.getByTestId("stk")).toHaveClass("gap-1");
    expect(cls).not.toMatch(/\bgap-2\b/);
  });

  it("passes through aria/role attributes", () => {
    render(
      <Stack data-testid="stk" aria-busy="true" aria-label="Cargando" role="group">
        x
      </Stack>,
    );
    const el = screen.getByTestId("stk");
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).toHaveAttribute("aria-label", "Cargando");
    expect(el).toHaveAttribute("role", "group");
  });

  it("visual output of <Stack gap={1}> equals a flex-col gap-1 div", () => {
    render(
      <Stack data-testid="stk" gap={1}>
        x
      </Stack>,
    );
    expect(screen.getByTestId("stk")).toHaveClass("flex", "flex-col", "gap-1");
  });
});

describe("Grid", () => {
  it("renders default classes (grid grid-cols-1 gap-3)", () => {
    render(<Grid data-testid="grd">child</Grid>);
    const el = screen.getByTestId("grd");
    expect(el).toHaveClass("grid", "grid-cols-1", "gap-3");
  });

  it("renders children", () => {
    render(
      <Grid>
        <span>a</span>
        <span>b</span>
      </Grid>,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });

  it.each([
    [1, "grid-cols-1"],
    [2, "grid-cols-2"],
    [3, "grid-cols-3"],
    [4, "grid-cols-4"],
  ] as const)("maps cols=%s to %s", (cols, expected) => {
    render(
      <Grid data-testid="grd" cols={cols}>
        x
      </Grid>,
    );
    expect(screen.getByTestId("grd")).toHaveClass("grid", expected);
  });

  it.each([
    [0, "gap-0"],
    [2, "gap-2"],
    [3, "gap-3"],
    [6, "gap-6"],
    [8, "gap-8"],
  ] as const)("maps gap=%s to %s", (gap, expected) => {
    render(
      <Grid data-testid="grd" gap={gap}>
        x
      </Grid>,
    );
    expect(screen.getByTestId("grd")).toHaveClass(expected);
  });

  it("renders a 3-col grid", () => {
    render(
      <Grid data-testid="grd" cols={3} gap={3}>
        x
      </Grid>,
    );
    expect(screen.getByTestId("grd")).toHaveClass("grid", "grid-cols-3", "gap-3");
  });

  it("passes through className (additive)", () => {
    render(
      <Grid data-testid="grd" className="md:grid-cols-2">
        x
      </Grid>,
    );
    expect(screen.getByTestId("grd")).toHaveClass("grid", "grid-cols-1", "gap-3", "md:grid-cols-2");
  });

  it("passes through aria/data attributes", () => {
    render(
      <Grid data-testid="grd" aria-label="campos" data-section="datos">
        x
      </Grid>,
    );
    const el = screen.getByTestId("grd");
    expect(el).toHaveAttribute("aria-label", "campos");
    expect(el).toHaveAttribute("data-section", "datos");
  });
});
