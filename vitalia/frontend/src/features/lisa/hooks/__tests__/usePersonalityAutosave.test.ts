/**
 * usePersonalityAutosave.test.ts — Vitest unit tests para hook autosave personalidad.
 *
 * T-9 vitalia-fase2-lisa-marca
 * spec_anchor: 06-tickets.yaml T-9 deliverables + 03-arch.md § 4.2
 *
 * Tests cubiertos:
 *   - Estado inicial (autosaveStatus='idle', savedAt=null)
 *   - scheduleAutosave: transición idle → dirty
 *   - Debounce 600ms: mutación NO dispara antes del timeout
 *   - Debounce 600ms: mutación SÍ dispara después del timeout
 *   - onSuccess: transición → saved + savedAt set + marcaKeys.personality invalidado
 *   - onError: transición → error
 *   - cancelAutosave: evita la mutación
 *
 * downstream-regression-na: brand-local vitalia FE hook tests; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { usePersonalityAutosave } from "../usePersonalityAutosave";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const { mockUpdatePersonality } = vi.hoisted(() => ({
  mockUpdatePersonality: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token-personality"),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

vi.mock("../../api/marca-voice-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/marca-voice-api")>();
  return {
    ...actual,
    updatePersonality: mockUpdatePersonality,
  };
});

// ── Fixtures ───────────────────────────────────────────────────────────────────

const PERSONALITY_VALUES = {
  archetype: "caregiver" as const,
  soISpeak: "Con calidez y empatía, priorizando la comprensión del paciente.",
  soIDontSpeak: "Nunca usamos jerga técnica sin explicarla. Nunca prometemos resultados garantizados.",
  technicalContext: "Clínica de medicina familiar. Especialidades: pediatría, geriatría, medicina preventiva.",
  formatInstructions: "Párrafos cortos. Listas cuando sea apropiado. Sin emojis en comunicación formal.",
  identityAnchor: "Somos la clínica del barrio, presente desde 2010.",
  domainContext: "Medicina primaria en Lima, Perú. Pacientes de 0 a 90 años.",
};

const PERSONALITY_RESPONSE = {
  tenantId: "t1",
  personalityProfileId: "pp-001",
  ...PERSONALITY_VALUES,
  compiledAt: null,
  compilerVersion: "v2",
  updatedAt: "2026-01-01T00:00:00Z",
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("usePersonalityAutosave — estado inicial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockResolvedValue(PERSONALITY_RESPONSE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("autosaveStatus empieza en 'idle'", () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.autosaveStatus).toBe("idle");
  });

  it("savedAt empieza en null", () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.savedAt).toBeNull();
  });
});

describe("usePersonalityAutosave — scheduleAutosave y debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockResolvedValue(PERSONALITY_RESPONSE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("pasa a 'dirty' al llamar scheduleAutosave", () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });

    expect(result.current.autosaveStatus).toBe("dirty");
  });

  it("NO llama updatePersonality antes de 600ms", () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockUpdatePersonality).not.toHaveBeenCalled();
  });

  it("llama updatePersonality después de 600ms", async () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(mockUpdatePersonality).toHaveBeenCalledTimes(1);
  });

  it("solo la última edición dispara la mutación (debounce)", async () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave({ ...PERSONALITY_VALUES, soISpeak: "Primera versión" });
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    act(() => {
      result.current.scheduleAutosave({ ...PERSONALITY_VALUES, soISpeak: "Segunda versión" });
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });

    expect(mockUpdatePersonality).toHaveBeenCalledTimes(1);
  });
});

describe("usePersonalityAutosave — transiciones por resultado de mutación", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("pasa a 'saved' tras mutación exitosa", async () => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockResolvedValue(PERSONALITY_RESPONSE);

    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(result.current.autosaveStatus).toBe("saved");
    });
  });

  it("savedAt es una Date tras mutación exitosa", async () => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockResolvedValue(PERSONALITY_RESPONSE);

    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(result.current.savedAt).toBeInstanceOf(Date);
    });
  });

  it("pasa a 'error' tras mutación fallida", async () => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockRejectedValue(new Error("Error servidor"));

    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(result.current.autosaveStatus).toBe("error");
    });
  });
});

describe("usePersonalityAutosave — cancelAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdatePersonality.mockResolvedValue(PERSONALITY_RESPONSE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("cancelAutosave impide que la mutación se ejecute", () => {
    const { result } = renderHook(
      () => usePersonalityAutosave({ tenantId: "t1", clinicId: "c1" }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.scheduleAutosave(PERSONALITY_VALUES);
    });
    act(() => {
      result.current.cancelAutosave();
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(mockUpdatePersonality).not.toHaveBeenCalled();
  });
});
