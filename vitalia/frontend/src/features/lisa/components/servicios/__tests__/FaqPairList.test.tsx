// cap: lisa.servicios
// story-origin: vitalia-fase2-lisa-servicios T-5
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqPairList, type FaqPair } from "../FaqPairList";

const sample: FaqPair[] = [
  { id: "q1", question: "¿Duele?", answer: "Molestias leves los primeros días." },
  { id: "q2", question: "¿Cuánto tarda?", answer: "2-3 semanas." },
];

describe("FaqPairList", () => {
  it("renders one row per Q/A pair", () => {
    render(<FaqPairList value={sample} onChange={() => {}} />);
    expect(screen.getByTestId("faq-row-q1")).toBeInTheDocument();
    expect(screen.getByTestId("faq-row-q2")).toBeInTheDocument();
  });

  it("shows an empty state with no pairs", () => {
    render(<FaqPairList value={[]} onChange={() => {}} />);
    expect(screen.getByTestId("faq-empty")).toBeInTheDocument();
  });

  it("adds a pair when 'Agregar pregunta' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FaqPairList value={sample} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /agregar pregunta/i }));
    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });

  it("removes a pair by its delete button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FaqPairList value={sample} onChange={onChange} />);
    await user.click(screen.getByTestId("faq-del-q2"));
    expect(onChange).toHaveBeenCalledWith([sample[0]]);
  });

  it("patches the answer on edit", () => {
    const onChange = vi.fn();
    render(<FaqPairList value={sample} onChange={onChange} />);
    const firstAnswer = screen.getAllByLabelText("Respuesta")[0];
    fireEvent.change(firstAnswer, { target: { value: "Respuesta nueva" } });
    expect(onChange).toHaveBeenCalledWith([{ ...sample[0], answer: "Respuesta nueva" }, sample[1]]);
  });
});
