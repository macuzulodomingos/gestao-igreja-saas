"use server"; // Indica que isso roda APENAS no servidor Node.js

import { MemberService } from "@/services/member.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Por que Zod? Ele garante que os dados estão no formato correto antes de tocarem o banco.
const memberSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email().optional(),
  role: z.string(),
});

export async function createMemberAction(formData: FormData) {
  // 1. Autenticação (Aqui você verificaria a sessão do usuário/igreja)
  const churchId = "id-da-igreja-vinda-da-sessao"; 

  // 2. Validação
  const data = Object.fromEntries(formData.entries());
  const validated = memberSchema.parse(data);

  // 3. Execução via Service
  await MemberService.createMember(validated, churchId);

  // 4. Cache (Sênior tip): Limpa o cache da página para os novos dados aparecerem.
  revalidatePath("/membros");
}