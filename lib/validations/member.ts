import { z } from "zod";

export const memberSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),

  // O email está seguro: valida o formato se existir, ou aceita vazio
  email: z
    .string()
    .email("Formato de e-mail inválido")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(/^[\d+\s()\-]+$/, "Use apenas números, +, parênteses ou traços")
    .min(8, "Telefone muito curto")
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal("")),

  // Alterado de enum para string para aceitar qualquer cargo (Pastor, Diácono, etc)
    role: z
    .string()
    .max(50, "Cargo muito longo")
    .optional()
    .or(z.literal(""))
    .default("Membro"),

  joinDate: z.coerce.date({
    errorMap: () => ({ message: "Data de adesão inválida" }),
  }),
});
