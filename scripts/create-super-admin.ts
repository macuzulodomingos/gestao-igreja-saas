import dotenv from "dotenv";
import { PrismaClient, UserRole } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" }); // 👈 carrega .env.local
dotenv.config({ path: ".env" }); // 👈 carrega também o .env

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("⚠️ Variáveis de Super Admin não encontradas. Pulando seed de admin.");
    return;
  }

  try {
    const count = await prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (count > 0) {
      console.log("ℹ️ Super Admin já existe.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Super Admin",
          email,
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          churchId: null,
        },
      });

      await tx.auditLog.create({
        data: {
          churchId: null,
          userEmail: email,
          action: "CREATE_SUPER_ADMIN",
          entityName: "User",
          entityId: user.id,
          newData: { email, role: "SUPER_ADMIN" },
        },
      });
    });

    console.log("✅ Super Admin criado com sucesso:", email);
    console.log("⚠️  Remove as credenciais do .env.local após o primeiro login.");
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });