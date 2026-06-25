import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LanguageClient } from "@/components/Settings/Language/LanguageClient";
import { getLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function IdiomaPage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  // 👈 valida acesso ao slug
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { locale: true },
  });

  return (
    <LanguageClient
      currentLocale={(user?.locale ?? "pt") as "pt" | "fr"}
      slug={slug}
    />
  );
}