import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChurchBySlug } from "@/lib/tenant";

export default async function ChurchRootPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const session = await auth();

  const { slug, locale } = await params;

  if (!session?.user) {
    redirect({ href: "/login", locale });
    return;
  }

  // 1. Validamos no banco de dados se esse slug pertence a uma igreja real
  const church = await getChurchBySlug(slug, session.user.churchId ?? undefined);

  // 2. Se a igreja não existir, mostramos a página 404 do Next.js
  if (!church) {
    notFound();
  }

  redirect({ href: `/${slug}/painel`, locale });
}