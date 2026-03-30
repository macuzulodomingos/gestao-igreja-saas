import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { LanguageClient } from "@/components/Settings/Language/LanguageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function IdiomaPage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) redirect("/login");

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