import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";
import { ProfileClient } from "@/components/Profile/ProfileClient";

interface ProfilePageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId ?? undefined);
  if (!church) notFound();

  return (
    <ProfileClient
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    />
  );
}