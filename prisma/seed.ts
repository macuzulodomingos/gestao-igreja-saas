import prisma from "../lib/prisma";


async function main() {
  const church = await prisma.church.findFirst();
  if (!church) return console.log("❌ Nenhuma igreja encontrada");

  const categories = [
    // Receitas
    { name: "Dízimo",  type: "INCOME"  },
    { name: "Oferta",  type: "INCOME"  },
    { name: "Doação",  type: "INCOME"  },
    // Despesas
    { name: "Água e Luz",   type: "EXPENSE" },
    { name: "Aluguer",      type: "EXPENSE" },
    { name: "Salários",     type: "EXPENSE" },
    { name: "Manutenção",   type: "EXPENSE" },
    { name: "Material",     type: "EXPENSE" },
  ];

  for (const cat of categories) {
    await prisma.financeCategory.upsert({
      where: {
        churchId_name_type: {
          churchId: church.id,
          name: cat.name,
          type: cat.type as any,
        },
      },
      update: {},
      create: {
        name: cat.name,
        type: cat.type as any,
        churchId: church.id,
      },
    });
  }

  console.log(`✅ Categorias criadas para: ${church.name}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());