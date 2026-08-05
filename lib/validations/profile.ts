import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim()
    .min(2, "validation.nameRequired")
    .max(100, "validation.nameTooLong"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "validation.required"),
  newPassword: z.string()
    .min(6, "validation.passwordTooShort")
    .max(100)
    .refine((val) => /[A-Z]/.test(val), { message: "validation.passwordUppercase" })
    .refine((val) => /[0-9]/.test(val), { message: "validation.passwordNumber" }),
  confirmPassword: z.string().min(1, "validation.required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "validation.passwordMismatch",
  path: ["confirmPassword"],
});