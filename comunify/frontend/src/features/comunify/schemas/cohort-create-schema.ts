import { z } from "zod";

export const cohortCreateSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
  offer_id: z.string().min(1, "Selecciona una oferta"),
  capacity_max: z.number().int().min(1).max(10000),
  start_date: z.string().min(1, "Selecciona la fecha de inicio"),
  end_date: z.string().min(1, "Selecciona la fecha de fin"),
  description: z.string().max(500).optional(),
  enrollment_criteria: z.record(z.string(), z.unknown()).optional(),
});

export type CohortCreateInput = z.infer<typeof cohortCreateSchema>;
