import { z } from "zod";

const VALID_TIMEZONES = [
  "Africa/Luanda",
  "Africa/Kinshasa",
  "Africa/Lubumbashi",
  "America/Sao_Paulo",
  "America/Manaus",
  "Europe/Lisbon",
  "Africa/Maputo",
] as const;

export const registerSchema = z.object({
  churchName: z.string().trim()
    .min(3, "validation.nameRequired")
    .max(100, "validation.nameTooLong"),
  churchSlug: z.string().trim().toLowerCase()
    .min(3, "validation.nameRequired")
    .max(50, "validation.nameTooLong")
    .regex(/^[a-z0-9-]+$/, "register.slugHint"), // 👈
  adminName: z.string().trim()
    .min(2, "validation.nameRequired")
    .max(100, "validation.nameTooLong"),
  adminEmail: z.string().trim().toLowerCase()
    .email("validation.emailInvalid"),
  adminPassword: z.string()
    .min(6, "validation.passwordTooShort")
    .max(100)
    .refine((val) => /[A-Z]/.test(val), {
      message: "validation.passwordUppercase", // 👈
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "validation.passwordNumber", // 👈
    }),
  timezone: z.enum(VALID_TIMEZONES, {
    message: "validation.required",
  }),
});