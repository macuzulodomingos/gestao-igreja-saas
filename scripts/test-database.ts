// scripts/test-database.ts
import "dotenv/config";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function testDatabase() {
  console.log("🚀 Iniciando Setup Completo do SaaS (ChurchOS)...\n");

  try {
    // 1. Criar a Igreja Sede
    console.log("⛪ Criando igreja de sede...");
    const church = await prisma.church.upsert({
      where: { slug: "igreja-sede" },
      update: {},
      create: {
        name: "Igreja Sede Luanda",
        slug: "igreja-sede",
        plan: "PRO",
      },
    });

    // 2. Criar as Categorias Financeiras (Essencial para o novo Schema)
    console.log("📂 Criando categorias financeiras padrão...");
    const categories = [
      { name: "Dízimo", type: "INCOME" },
      { name: "Oferta", type: "INCOME" },
      { name: "Aluguer", type: "EXPENSE" },
      { name: "Energia/Água", type: "EXPENSE" },
      { name: "Missões", type: "EXPENSE" },
    ];

    for (const cat of categories) {
      await prisma.financeCategory.upsert({
        where: { 
          churchId_name_type: { 
            churchId: church.id, 
            name: cat.name, 
            type: cat.type as any 
          } 
        },
        update: {},
        create: { ...cat, churchId: church.id },
      });
    }

    // 3. Criar Cargos de Membros
    console.log("🎖️ Criando cargos de membros...");
    const roles = ["Pastor", "Diácono", "Membro", "Visitante"];
    for (const roleName of roles) {
      await prisma.memberRole.upsert({
        where: { churchId_name: { churchId: church.id, name: roleName } },
        update: {},
        create: { name: roleName, churchId: church.id },
      });
    }

    // 4. Criar o Usuário Admin com Hash
    console.log("👤 Criando usuário pastor admin...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.upsert({
      where: { email: "admin@churchos.com" },
      update: { password: hashedPassword }, // Atualiza a senha caso já exista
      create: {
        email: "admin@churchos.com",
        name: "Pastor Administrador",
        password: hashedPassword,
        churchId: church.id,
        role: "ADMIN",
      },
    });

    console.log(`\n✅ SETUP CONCLUÍDO COM SUCESSO!`);
    console.log(`-----------------------------------`);
    console.log(`📧 Login: admin@churchos.com`);
    console.log(`🔑 Senha: admin123`);
    console.log(`🔗 URL: http://localhost:3000/igreja-sede/painel`);
    console.log(`-----------------------------------`);

  } catch (error) {
    console.error("❌ Erro fatal no script:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();