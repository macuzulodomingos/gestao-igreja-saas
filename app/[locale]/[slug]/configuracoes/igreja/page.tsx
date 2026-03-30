import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChurchSettingsClient from "@/components/Settings/Church/ChurchSettingsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChurchSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const church = await prisma.church.findUnique({
    where: { id: session.user.churchId },
    select: { id: true, name: true, slug: true, timezone: true, plan: true },
  });

  if (!church) redirect("/login");

  return <ChurchSettingsClient church={church} />;
}