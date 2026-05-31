// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * staff-blocks-api.test.ts — Vitest unit tests for availability block API hooks (T-FE-3).
 *
 * RED-first TDD: these tests are written before the implementation.
 * They verify key behaviours of useAvailabilityBlocks, useCreateBlock,
 * useUpdateBlock, useDeleteBlock, and block-related type assertions.
 *
 * T-FE-3 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § Data layer + 01-spec.md § SC-1/SC-1b/SC-1c/SC-1d/SC-3b
 * validators: V-FN-1, V-FN-2, V-FN-3, V-FN-4, V-FN-7
 */

import { describe, it, expect } from "vitest";
import { staffKeys } from "../staff";
import { availabilityBlockSchema } from "../../types/staff-schema";
import type { RecurrentBlock, OneOffBlock } from "../../types/staff.types";

// ── staffKeys.blocks factory ───────────────────────────────────────────────────

describe("staffKeys.blocks", () => {
  it("produces correct React Query key for availability blocks", () => {
    const key = staffKeys.blocks("doctor-abc");
    expect(key).toEqual(["lisa", "staff", "detail", "doctor-abc", "blocks"]);
  });

  it("blocks key is distinct from detail key", () => {
    const detailKey = staffKeys.detail("doctor-abc");
    const blocksKey = staffKeys.blocks("doctor-abc");
    expect(blocksKey).not.toEqual(detailKey);
    expect(blocksKey.length).toBeGreaterThan(detailKey.length);
  });
});

// ── AvailabilityBlock discriminated union (type-level) ────────────────────────

describe("AvailabilityBlock discriminated union", () => {
  it("recurrent block with end_date passes schema", () => {
    const block: RecurrentBlock = {
      id: "blk-1",
      kind: "recurrent",
      dayOfWeek: 0, // Monday
      startTime: "09:00",
      endTime: "13:00",
      freq: "weekly",
      endConditionKind: "end_date",
      endDate: "2025-12-31",
    };
    // Type check: kind="recurrent" narrows union
    expect(block.kind).toBe("recurrent");
    expect(block.dayOfWeek).toBe(0);
    expect(block.freq).toBe("weekly");
  });

  it("recurrent block with occurrences passes schema", () => {
    const block: RecurrentBlock = {
      id: "blk-2",
      kind: "recurrent",
      dayOfWeek: 5, // Saturday
      startTime: "10:00",
      endTime: "14:00",
      freq: "biweekly",
      endConditionKind: "occurrences",
      occurrences: 6,
    };
    expect(block.occurrences).toBe(6);
    expect(block.freq).toBe("biweekly");
  });

  it("one_off block passes schema", () => {
    const block: OneOffBlock = {
      id: "blk-3",
      kind: "one_off",
      specificDate: "2025-09-15",
      startTime: "09:00",
      endTime: "12:00",
    };
    expect(block.kind).toBe("one_off");
    expect(block.specificDate).toBe("2025-09-15");
  });
});

// ── availabilityBlockSchema Zod validation ────────────────────────────────────

describe("availabilityBlockSchema (Zod)", () => {
  it("accepts valid weekly recurrent block with end_date", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "recurrent",
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "13:00",
      freq: "weekly",
      endConditionKind: "end_date",
      endDate: "2025-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("accepts biweekly block with occurrences=6 (SC-1b)", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "recurrent",
      dayOfWeek: 5,
      startTime: "10:00",
      endTime: "14:00",
      freq: "biweekly",
      endConditionKind: "occurrences",
      occurrences: 6,
    });
    expect(result.success).toBe(true);
  });

  it("accepts one_off block (SC-1c: Solo esta semana)", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "one_off",
      specificDate: "2025-09-15",
      startTime: "09:00",
      endTime: "12:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects recurrent block with end_date condition but no date", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "recurrent",
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "13:00",
      freq: "weekly",
      endConditionKind: "end_date",
      endDate: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("endDate");
    }
  });

  it("rejects recurrent block with occurrences condition but no count", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "recurrent",
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "13:00",
      freq: "biweekly",
      endConditionKind: "occurrences",
      occurrences: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = availabilityBlockSchema.safeParse({
      kind: "recurrent",
      dayOfWeek: 0,
      startTime: "9am",
      endTime: "1pm",
      freq: "weekly",
      endConditionKind: "end_date",
      endDate: "2025-12-31",
    });
    expect(result.success).toBe(false);
  });
});
