import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Hora obrigatória"),
  departmentId: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  // 👈 superRefine permite adicionar erros em múltiplos campos
  const startAt = new Date(`${data.date}T${data.time}`);
  const now = new Date();

  if (startAt <= now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A data não pode ser no passado",
      path: ["date"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A hora não pode ser no passado",
      path: ["time"],
    });
  }
});

export type EventFormData = z.infer<typeof eventSchema>;