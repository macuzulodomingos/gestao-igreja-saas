import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChurchSettingsClient from "@/components/Settings/Church/ChurchSettingsClient";
import { getChurchBySlug } from "@/lib/tenant";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChurchSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    redirect("/login");
  }

  let churchId = session.user.churchId;

  if (isSuperAdmin) {
    const church = await getChurchBySlug(slug, undefined);
    if (!church) notFound();
    churchId = church.id;
  } else {
    const church = await getChurchBySlug(slug, churchId);
    if (!church) notFound();
  }

  if (!churchId) redirect("/login");

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : churchId);
  if (!church) notFound();

  return <ChurchSettingsClient church={church} />;
}