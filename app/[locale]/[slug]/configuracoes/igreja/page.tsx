import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import ChurchSettingsClient from "@/components/Settings/Church/ChurchSettingsClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChurchSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  
  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  

  return <ChurchSettingsClient church={church} />;
}