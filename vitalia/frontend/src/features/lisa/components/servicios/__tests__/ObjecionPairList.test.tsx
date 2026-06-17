// cap: lisa.servicios
// story-origin: vitalia-fase2-lisa-servicios T-5
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ObjecionPairList, type ObjecionPair } from "../ObjecionPairList";

const sample: ObjecionPair[] = [
  { id: "o1", tag: "Precio", response: "Tenemos planes en cuotas." },
  { id: "o2", tag: "Miedo", response: "Procedimiento suave con anestesia." },
];

describe("ObjecionPairList", () => {
  it("renders one row per objection", () => {
    render(<ObjecionPairList value={sample} onChange={() => {}} />);
    expect(screen.getByTestId("obj-row-o1")).toBeInTheDocument();
    expect(screen.getByTestId("obj-row-o2")).toBeInTheDocument();
  });

  it("shows an empty state with no objections", () => {
    render(<ObjecionPairList value={[]} onChange={() => {}} />);
    expect(screen.getByTestId("obj-empty")).toBeInTheDocument();
  });

  it("adds an objection when 'Agregar objeción' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ObjecionPairList value={sample} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /agregar objeci/i }));
    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });

  it("removes an objection by its delete button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ObjecionPairList value={sample} onChange={onChange} />);
    await user.click(screen.getByTestId("obj-del-o1"));
    expect(onChange).toHaveBeenCalledWith([sample[1]]);
  });

  it("patches the response on edit", () => {
    const onChange = vi.fn();
    render(<ObjecionPairList value={sample} onChange={onChange} />);
    const firstResponse = screen.getAllByLabelText("Cómo responder")[0];
    fireEvent.change(firstResponse, { target: { value: "Respuesta distinta" } });
    expect(onChange).toHaveBeenCalledWith([
      { ...sample[0], response: "Respuesta distinta" },
      sample[1],
    ]);
  });
});
