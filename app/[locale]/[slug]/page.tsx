import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma"; // Assumindo que o seu cliente prisma está aqui

export default async function ChurchRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Validamos no banco de dados se esse slug pertence a uma igreja real
  const church = await prisma.church.findUnique({
    where: { slug },
    select: { id: true }, // Buscamos apenas o ID para ser rápido
  });

  // 2. Se a igreja não existir, mostramos a página 404 do Next.js
  if (!church) {
    notFound();
  }

  // 3. Se existir, redirecionamos para o dashboard interno daquela igreja
  redirect(`/${slug}/painel`);
}