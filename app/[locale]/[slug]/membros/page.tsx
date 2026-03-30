import { auth } from "@/lib/auth";
import { MemberService } from "@/services/memberService";
import { MemberRoleService } from "@/services/memberRoleService";
import MembersClient from "@/components/Member/MembersClient";
import { redirect } from "next/navigation";

interface MembersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>; // Captura a URL
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const session = await auth();
  const { slug } = await params;
  const sParams = await searchParams; // Essencial no Next.js 15

  // 🛡️ Segurança de Tenant: Bloqueio imediato se o slug não bater com a sessão
  if (
    !session?.user || 
    (session.user.role !== "SUPER_ADMIN" && session.user.churchSlug !== slug)
  ) {
    return redirect("/login");
  }

  // 1. Extração de variáveis da URL e Sessão
  const churchId = session.user.churchId;
  const currentPage = Number(sParams.page) || 1;
  const searchTerm = sParams.search || ""; // Já prevendo a busca futura

  if (!churchId) {
    return redirect("/login");
  }

  // 2. Busca Paginada no Banco de Dados
  // Passamos o churchId da sessão para garantir isolamento total
  const [{ members, metadata }, roles] = await Promise.all([
    MemberService.getMembersByChurch(churchId, currentPage, 10, searchTerm),
    MemberRoleService.getRoles(churchId),
  ]);

  // 3. Renderização
  return (
    <div className=" ">
      <MembersClient 
        initialMembers={members} 
        slug={slug}
        metadata={metadata} // Dados da paginação (total, atual, etc)
        roles={roles}
      />
    </div>
  );
}