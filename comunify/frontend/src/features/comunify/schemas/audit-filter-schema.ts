import { z } from "zod";

export const auditFilterSchema = z.object({
  event_type: z.string().optional(),
  actor_id: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(10).max(100).default(25),
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
