import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(1, "validation.eventNameRequired").max(100).trim(),
  description: z.string().max(500, "validation.descriptionTooLong").optional().or(z.literal("")),
  categoryId: z.string().min(1, "validation.categoryRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  time: z.string().min(1, "validation.eventTimeRequired"),
  departmentId: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const eventDate = new Date(`${data.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 👈 compara apenas datas, ignora horas

  if (eventDate < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validation.eventDatePast",
      path: ["date"],
    });
  }
});

export type EventFormData = z.infer<typeof eventSchema>;