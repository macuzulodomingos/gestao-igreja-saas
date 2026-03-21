import { z } from "zod";

export const eventSchema = z.object({
    name: z.string().min(1, "Nome obrigatório").max(100),
    description: z.string().max(500).optional().or(z.literal("")),
    categoryId: z.string().min(1, "Categoria obrigatória"),
    date: z.string().min(1, "Data obrigatória").refine((val) => {
        // 👈 ambas as datas em UTC — consistente em qualquer servidor
        const selected = new Date(val + "T00:00:00Z");
        const today = new Date();
        const todayUTC = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
        ));
        return selected >= todayUTC;
    }, "A data não pode ser no passado"),
    time: z.string().min(1, "Hora obrigatória"),
    departmentId: z.string().optional().or(z.literal("")),
});

export type EventFormData = z.infer<typeof eventSchema>;