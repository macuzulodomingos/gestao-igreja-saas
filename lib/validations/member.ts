import { z } from "zod";

export const memberSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),

  email: z
    .string()
    .email("Formato de e-mail inválido")
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)), // 👈 Limpa string vazia para o banco

  phone: z
    .string()
    .regex(/^[\d+\s()\-]+$/, "Use apenas números, +, parênteses ou traços")
    .min(8, "Telefone muito curto")
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)),

  role: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform(val => (val === "" ? null : val)),

  // 🔥 VALIDAÇÃO DE DATA SEGURA
  joinDate: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (AAAA-MM-DD)")
    .refine((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(`${dateStr}T12:00:00Z`);
      
      // Verifica se o JS não "corrigiu" a data automaticamente
      // Ex: Se o usuário mandar 2024-02-31, o JS criaria 2024-03-02. 
      // O check abaixo invalida isso.
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
      );
    }, "Esta data não existe no calendário"),

  status: z
    .enum(["ATIVO", "INATIVO", "TRANSFERIDO", "FALECIDO"])
    .optional()
    .default("ATIVO"),
});