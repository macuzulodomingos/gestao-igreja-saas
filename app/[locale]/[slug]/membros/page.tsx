import { auth } from "@/lib/auth";
import { MemberService } from "@/services/memberService";
import { MemberRoleService } from "@/services/memberRoleService";
import MembersClient from "@/components/Member/MembersClient";
import { redirect, notFound } from "next/navigation";
import { getChurchBySlug } from "@/lib/tenant";

interface MembersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const session = await auth();
  const { slug } = await params;
  const sParams = await searchParams;

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  // 👈 SUPER_ADMIN busca churchId pelo slug
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = isSuperAdmin ? church.id : session.user.churchId;
  if (!churchId) redirect("/login");

  const currentPage = Number(sParams.page) || 1;
  const searchTerm = sParams.search || "";

  const [{ members, metadata }, roles] = await Promise.all([
    MemberService.getMembersByChurch(churchId, currentPage, 10, searchTerm),
    MemberRoleService.getRoles(churchId),
  ]);

  return (
    <div>
      <MembersClient
        initialMembers={members}
        slug={slug}
        churchId={churchId} // 👈 adiciona
        metadata={metadata}
        roles={roles}
      />
    </div>
  );
}