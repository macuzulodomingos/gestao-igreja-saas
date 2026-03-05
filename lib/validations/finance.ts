import { z } from "zod";

export const financeSchema = z.object({
  description: z
    .string()
    .max(200, "Descrição muito longa")
    .optional()
    .default(""),

  amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser positivo"),

  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Selecione o tipo",
  }),

  categoryId: z.string().min(1, "Categoria obrigatória"), // 👈 era "category"

  date: z
    .string()
    .min(1, "Data obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
});

export type FinanceFormData = z.infer<typeof financeSchema>;