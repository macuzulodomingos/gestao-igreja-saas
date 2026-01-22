// scripts/test-database.ts
import "dotenv/config"  // ✅ Carrega o .env para o adapter em lib/prisma
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Iniciando teste Prisma 7 com Adapter-PG...\n")

  try {
    // 1. Criar primeiro a Igreja (Entidade Pai)
    console.log("⛪ Criando igreja de teste...")
    const church = await prisma.church.create({
      data: {
        name: "Igreja de Teste",
        slug: `teste-${Date.now()}`,
        plan: "FREE",
      }
    })

    // 2. Criar o Usuário vinculado à Igreja
    console.log("👤 Criando usuário administrador...")
    const newUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@exemplo.com`,
        name: "Demo User",
        churchId: church.id, // ✅ Obrigatório pelo seu schema
        role: "ADMIN"
      },
    })
    console.log("✅ Usuário criado com sucesso!")

    // 3. Buscar com include para testar a relação
    const users = await prisma.user.findMany({
      include: { church: true }
    })
    
    console.log(`\n🎉 Teste finalizado. Total no banco: ${users.length}`)
    users.forEach(u => console.log(`- ${u.name} [${u.church.name}]`))

  } catch (error) {
    console.error("❌ Erro de conexão ou validação:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()