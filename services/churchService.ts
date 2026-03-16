import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RegisterChurchDTO {
  churchName: string;
  churchSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export const ChurchService = {
  async registerChurch(data: RegisterChurchDTO) {
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    await prisma.$transaction(async (tx) => {
      const church = await tx.church.create({
        data: {
          name: data.churchName,
          slug: data.churchSlug,
          plan: "FREE",
        },
      });

      await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          churchId: church.id,
        },
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

      await tx.auditLog.create({
        data: {
          churchId: church.id,
          userEmail: data.adminEmail,
          action: "CREATE_CHURCH",
          entityName: "Church",
          entityId: church.id,
          newData: { name: data.churchName, slug: data.churchSlug, plan: "FREE" },
        },
      });
    });
  },
};