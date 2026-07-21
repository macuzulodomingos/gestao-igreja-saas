import { z } from "zod";

export const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("validation.emailInvalid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "validation.required"),
  password: z.string()
    .min(6, "validation.passwordTooShort")
    .max(100)
    .refine((val) => /[A-Z]/.test(val), { message: "validation.passwordUppercase" })
    .refine((val) => /[0-9]/.test(val), { message: "validation.passwordNumber" }),
});