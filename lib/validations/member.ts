import { z } from "zod";

export const memberSchema = z.object({
  name: z
    .string()
    .min(3, "validation.nameRequired")
    .max(100, "validation.nameTooLong"),

  email: z
    .string()
    .email("validation.emailInvalid")
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)),

  phone: z
    .string()
    .regex(/^[\d+\s()\-]+$/, "validation.phoneFormat")
    .min(8, "validation.phoneTooShort")
    .max(20, "validation.phoneTooLong")
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)),

  role: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)),

  joinDate: z
    .string()
    .min(1, "validation.joinDateRequired")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "validation.dateInvalid")
    .refine((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(`${dateStr}T12:00:00Z`);
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
      );
    }, "validation.dateInvalid"),

  status: z
    .enum(["ATIVO", "INATIVO", "TRANSFERIDO", "FALECIDO"])
    .optional()
    .default("ATIVO"),
});