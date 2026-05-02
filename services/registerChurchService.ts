import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RegisterChurchDTO {
  churchName: string;
  churchSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  timezone: string;
}

export const RegisterChurchService = {
  async registerChurch(data: RegisterChurchDTO) {

    const slug = data.churchSlug.toLowerCase().trim(); // 👈
    const email = data.adminEmail.toLowerCase().trim(); // 👈

    const existing = await prisma.church.findUnique({ where: { slug } }); // 👈
    if (existing) throw new Error("SLUG_TAKEN"); // 👈

    const existingUser = await prisma.user.findUnique({ where: { email } }); // 👈
    if (existingUser) throw new Error("EMAIL_TAKEN");

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    // 👈 Transacção curta — só operações críticas
    const church = await prisma.$transaction(
      async (tx) => {
        const church = await tx.church.create({
          data: { name: data.churchName, slug, plan: "FREE", timezone: data.timezone }, // 👈 usa slug
          select: { id: true, slug: true, name: true },
        });

        await tx.user.create({
          data: {
            name: data.adminName,
            email, // 👈 usa email
            password: hashedPassword,
            role: "ADMIN",
            churchId: church.id,
          },
          select: { id: true },
        });

        await tx.financeCategory.createMany({
          data: [
            { name: "Dízimo", type: "INCOME", churchId: church.id },
            { name: "Oferta", type: "INCOME", churchId: church.id },
            { name: "Doação", type: "INCOME", churchId: church.id },
            { name: "Salários", type: "EXPENSE", churchId: church.id },
            { name: "Manutenção", type: "EXPENSE", churchId: church.id },
            { name: "Utilities", type: "EXPENSE", churchId: church.id },
          ],
        });

        await tx.memberRole.createMany({
          data: [
            { name: "Pastor", churchId: church.id },
            { name: "Diácono", churchId: church.id },
            { name: "Secretário", churchId: church.id },
            { name: "Tesoureiro", churchId: church.id },
          ],
        });

        await tx.eventCategory.createMany({
          data: [
            { name: "Culto", churchId: church.id },
            { name: "Oração", churchId: church.id },
            { name: "Ensaio", churchId: church.id },
            { name: "Reunião", churchId: church.id },
            { name: "Conferência", churchId: church.id },
          ],
        });

        return church;
      },
      {
        maxWait: 5000,  // 👈 timeout explícito
        timeout: 15000,
      }
    );

    // 👈 AuditLog fora — falha silenciosa não afecta o utilizador
    try {
      await prisma.auditLog.create({
        data: {
          churchId: church.id,
          userEmail: data.adminEmail,
          action: "CREATE_CHURCH",
          entityName: "Church",
          entityId: church.id,
          newData: { name: data.churchName, slug, plan: "FREE", timezone: data.timezone, },
        },
      });
    } catch (auditError) {
      // Log do erro mas não quebra o fluxo — a igreja foi criada com sucesso
      console.error("[ChurchService] auditLog error:", auditError);
    }

    return church;
  },
};