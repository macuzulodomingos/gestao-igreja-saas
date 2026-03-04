import { z } from "zod";

export const financeSchema = z.object({
  description: z
    .string()
    .max(100, "Descrição muito longa")
    .optional()
    .or(z.literal("")),

  amount: z.coerce
    .number({
      required_error: "O valor é obrigatório",
      invalid_type_error: "Digite um valor numérico válido",
    })
    .positive("O valor deve ser maior que zero"),

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