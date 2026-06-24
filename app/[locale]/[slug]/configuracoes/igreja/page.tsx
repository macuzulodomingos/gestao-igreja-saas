import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
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
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();

  const churchId = isSuperAdmin ? church.id : session.user.churchId;
  if (!churchId) redirect("/login");

  return <ChurchSettingsClient church={church} />;
}