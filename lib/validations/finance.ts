import { z } from "zod";

export const financeSchema = z.object({
  description: z
    .string()
    .max(200, "validation.descriptionTooLong")
    .optional()
    .default(""),
  amount: z
    .string()
    .min(1, "validation.amountRequired")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "validation.amountPositive"
    ),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "validation.typeRequired",
  }),
  categoryId: z.string().min(1, "validation.categoryRequired"),
  date: z
    .string()
    .min(1, "validation.dateRequired")
    .refine((val) => !isNaN(Date.parse(val)), "validation.dateInvalid"),
});


export type FinanceSchemaData = z.infer<typeof financeSchema>;