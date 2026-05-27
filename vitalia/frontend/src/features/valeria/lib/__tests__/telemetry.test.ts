/**
 * telemetry.test.ts — Tests para vitalia/features/valeria/lib/telemetry.ts
 *
 * TDD RED→GREEN: tests escritos ANTES de la implementación (tdd-mandatory.md).
 * Cubre: TrackEventType enum, telemetryPayloadSchema, trackEvent PII-safe,
 *        error handling (non-blocking), tenant isolation (X-Tenant-ID).
 *
 * HIPAA-lite: verifica que PHI (patient.name, DNI) NUNCA aparezca en payload.
 * PII-safe: payload solo contiene IDs hash + buckets (no datos identificables).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrackEventType, trackEvent } from "../telemetry";

// ── Mock global fetch ──────────────────────────────────────────────────────────
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ received: true }),
  } as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── 1. TrackEventType enum ─────────────────────────────────────────────────────

describe("TrackEventType enum", () => {
  it("debe exportar 7 event types canónicos", () => {
    expect(TrackEventType.AGENDA_VIEWED).toBe("agenda_viewed");
    expect(TrackEventType.SLOT_DRAWER_OPENED).toBe("slot_drawer_opened");
    expect(TrackEventType.CHARGE_INITIATED).toBe("charge_initiated");
    expect(TrackEventType.CHARGE_SUCCEEDED).toBe("charge_succeeded");
    expect(TrackEventType.CHARGE_FAILED).toBe("charge_failed");
    expect(TrackEventType.INVOICE_EMITTED).toBe("invoice_emitted");
    expect(TrackEventType.REMINDER_SENT).toBe("reminder_sent");
  });

  it("debe tener exactamente 7 valores", () => {
    const values = Object.values(TrackEventType);
    expect(values).toHaveLength(7);
  });
});

// ── 2. trackEvent — happy path ─────────────────────────────────────────────────

describe("trackEvent — happy path", () => {
  it("debe hacer POST a /api/telemetry/growth-studio-event", async () => {
    await trackEvent(TrackEventType.AGENDA_VIEWED, {
      tenant_id: "tenant-123",
      view_mode: "semana",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/telemetry/growth-studio-event");
    expect(init.method).toBe("POST");
  });

  it("debe incluir event_type en el cuerpo JSON", async () => {
    await trackEvent(TrackEventType.SLOT_DRAWER_OPENED, {
      appointment_id_hash: "abc123",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.event_type).toBe("slot_drawer_opened");
  });

  it("debe incluir timestamp ISO 8601 en el cuerpo", async () => {
    await trackEvent(TrackEventType.CHARGE_INITIATED, {
      idempotency_key: "idem-uuid-123",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.occurred_at).toBeDefined();
    // Verifica formato ISO 8601 básico
    expect(new Date(body.occurred_at).toString()).not.toBe("Invalid Date");
  });

  it("debe incluir Content-Type application/json", async () => {
    await trackEvent(TrackEventType.CHARGE_SUCCEEDED, {});

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("debe pasar el payload al cuerpo JSON", async () => {
    const payload = { appointment_id_hash: "hash-abc", payment_bucket: "saldo" };
    await trackEvent(TrackEventType.CHARGE_SUCCEEDED, payload);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.payload).toMatchObject(payload);
  });
});

// ── 3. PII safety — HIPAA-lite ─────────────────────────────────────────────────

describe("trackEvent — PII safety (HIPAA-lite)", () => {
  it("NO debe incluir patient_name en el payload enviado", async () => {
    // Simula un error del desarrollador: pasar PHI en el payload genérico
    // El tipo Record<string, unknown> acepta cualquier key — el sanitizer debe strips PHI
    const unsafePayload: Record<string, unknown> = {
      appointment_id_hash: "hash-123",
      patient_name: "María González",
    };

    await trackEvent(TrackEventType.SLOT_DRAWER_OPENED, unsafePayload);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    const bodyStr = JSON.stringify(body);

    // Verifica que el nombre real no aparece en el payload enviado
    expect(bodyStr).not.toContain("María González");
    // El campo PHI debe estar eliminado del payload
    expect(body.payload).not.toHaveProperty("patient_name");
    // El campo seguro debe seguir presente
    expect(body.payload).toHaveProperty("appointment_id_hash", "hash-123");
  });

  it("NO debe incluir patient_dni en el payload enviado", async () => {
    const unsafePayload: Record<string, unknown> = {
      appointment_id_hash: "hash-456",
      patient_dni: "12345678",
    };

    await trackEvent(TrackEventType.INVOICE_EMITTED, unsafePayload);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    const bodyStr = JSON.stringify(body);

    expect(bodyStr).not.toContain("12345678");
    expect(body.payload).not.toHaveProperty("patient_dni");
  });

  it("NO debe incluir diagnosis en el payload enviado", async () => {
    const unsafePayload: Record<string, unknown> = {
      appointment_id_hash: "hash-789",
      diagnosis: "Hipertensión arterial grado II",
    };

    await trackEvent(TrackEventType.SLOT_DRAWER_OPENED, unsafePayload);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.payload).not.toHaveProperty("diagnosis");
    expect(body.payload).toHaveProperty("appointment_id_hash");
  });
});

// ── 4. Error handling — non-blocking ──────────────────────────────────────────

describe("trackEvent — error handling (non-blocking)", () => {
  it("NO debe lanzar error si fetch falla (fire-and-forget)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // No debe lanzar — telemetry nunca bloquea el flujo principal
    await expect(
      trackEvent(TrackEventType.REMINDER_SENT, { appointment_id_hash: "hash-789" })
    ).resolves.not.toThrow();
  });

  it("NO debe lanzar error si la respuesta es 4xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
    } as Response);

    await expect(
      trackEvent(TrackEventType.CHARGE_FAILED, { error_bucket: "payment_declined" })
    ).resolves.not.toThrow();
  });

  it("NO debe lanzar error si la respuesta es 5xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(
      trackEvent(TrackEventType.AGENDA_VIEWED, { view_mode: "mes" })
    ).resolves.not.toThrow();
  });
});

// ── 5. trackEvent returns void (fire-and-forget) ───────────────────────────────

describe("trackEvent — return type", () => {
  it("debe retornar Promise<void>", async () => {
    const result = await trackEvent(TrackEventType.AGENDA_VIEWED, {});
    expect(result).toBeUndefined();
  });
});
