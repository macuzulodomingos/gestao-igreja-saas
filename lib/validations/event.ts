import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(1, "validation.eventNameRequired").max(100).trim(),
  description: z.string().max(500, "validation.descriptionTooLong").optional().or(z.literal("")),
  categoryId: z.string().min(1, "validation.categoryRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  time: z.string().min(1, "validation.eventTimeRequired"),
  departmentId: z.string().optional().or(z.literal("")),
});

export type EventFormData = z.infer<typeof eventSchema>;