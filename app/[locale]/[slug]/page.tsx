import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChurchBySlug } from "@/lib/tenant";

export default async function ChurchRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  // 1. Validamos no banco de dados se esse slug pertence a uma igreja real
  const church = await getChurchBySlug(slug, session.user.churchId ?? undefined);

  // 2. Se a igreja não existir, mostramos a página 404 do Next.js
  if (!church) {
    notFound();
  }

  // 3. Se existir, redirecionamos para o dashboard interno daquela igreja
  redirect(`/${slug}/painel`);
}