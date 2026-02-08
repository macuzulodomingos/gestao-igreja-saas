// scripts/test-database.ts
import "dotenv/config"
import prisma from "../lib/prisma"
import bcrypt from "bcryptjs" // ✅ Importante para o Auth.js

async function testDatabase() {
  console.log("🔍 Iniciando teste Prisma com Hash de Segurança...\n")

  try {
    // 1. Criar a Igreja com Slug fixo para teste facilitado
    console.log("⛪ Criando igreja de sede...")
    const church = await prisma.church.upsert({
      where: { slug: "igreja-sede" },
      update: {},
      create: {
        name: "Igreja Sede Luanda",
        slug: "igreja-sede",
        plan: "PRO",
      }
    })

    // 2. Criar a Password encriptada
    const hashedPassword = await bcrypt.hash("admin123", 10)

    // 3. Criar o Usuário vinculado
    console.log("👤 Criando usuário pastor admin...")
    const user = await prisma.user.upsert({
      where: { email: "admin@churchos.com" },
      update: {},
      create: {
        email: "admin@churchos.com",
        name: "Pastor Administrador",
        password: hashedPassword, // ✅ Agora o Auth.js vai conseguir validar
        churchId: church.id,
        role: "ADMIN"
      },
    })

    console.log(`✅ Sucesso! Login: admin@churchos.com | Senha: admin123`)
    console.log(`🔗 URL de Acesso: http://localhost:3000/igreja-sede/painel`)

  } catch (error) {
    console.error("❌ Erro no script:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()