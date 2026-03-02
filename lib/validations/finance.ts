import { z } from "zod";

export const financeSchema = z.object({
  description: z
    .string()
    .min(3, "A descrição deve ter pelo menos 3 caracteres")
    .max(100, "Descrição muito longa"),
  
  amount: z.coerce
    .number()
    .positive("O valor deve ser maior que zero")
    .or(z.string().transform((val) => Number(val.replace(",", ".")))),

  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Selecione o tipo da transação",
  }),

  category: z
    .string()
    .min(1, "Selecione ou digite uma categoria"),

  date: z
    .string()
    .min(1, "A data é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida",
    }),
});

export type FinanceFormData = z.infer<typeof financeSchema>;