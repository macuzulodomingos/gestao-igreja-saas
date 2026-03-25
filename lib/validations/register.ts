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
    churchName: z.string().trim().min(3, "Nome da igreja obrigatório").max(100),
    churchSlug: z.string()
        .trim()
        .toLowerCase()
        .min(3, "Slug obrigatório")
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
    adminName: z.string().trim().min(2, "Nome obrigatório").max(100),
    adminEmail: z.string().trim().toLowerCase().email("E-mail inválido"),
    adminPassword: z.string()
        .min(6, "Mínimo 6 caracteres")
        .max(100)
        .refine((val) => /[A-Z]/.test(val), {
            message: "Deve conter pelo menos uma letra maiúscula",
        })
        .refine((val) => /[0-9]/.test(val), {
            message: "Deve conter pelo menos um número",
        }),
    timezone: z.enum(VALID_TIMEZONES, {
        message: "Timezone inválido",
    })
});



