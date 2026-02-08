"use server";

import { DashboardService } from "@/services/dashboardService";
import { auth } from "@/lib/auth";

/**
 * Server Action segura para buscar estatísticas do Dashboard
 * com validação de tenant (igreja)
 */
export async function getDashboardStatsAction(churchId: string) {
  // 1. Verificar se o usuário está autenticado
  const session = await auth();

  if (!session?.user) {
    console.warn("🚨 Acesso sem sessão válida");
    return {
      success: false,
      error: "Você precisa estar autenticado."
    };
  }

   // 2. Validação de Segurança (O "Pulo do Gato" do SaaS)
  // Verificamos se o churchId solicitado é o mesmo que o usuário pertence.
  // Se for um SuperAdmin, você poderia pular essa verificação.

  const userChurchId = session.user.churchId;
  const userRole = session.user.role;

  // 2️⃣ Autorização / Tenant Guard (o coração da segurança)
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  if (!isSuperAdmin && userChurchId !== churchId) {
    // Log detalhado APENAS no servidor
    console.error(
      `🚨 Tentativa de acesso ilegal | userId=${session.user.id} | userChurch=${userChurchId} | requestedChurch=${churchId}`
    );

    // Resposta genérica (não vaza informação)
    return {
      success: false,
      error: "Você não tem permissão para acessar esses dados."
    };
  }

  // 3️⃣ Execução segura (já validado)
  try {
    const stats = await DashboardService.getChurchStats(churchId);

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    // Nunca expor erro interno
    console.error("🔥 Erro ao buscar estatísticas do dashboard:", error);

    return {
      success: false,
      error: "Erro interno ao carregar o dashboard."
    };
  }
}

