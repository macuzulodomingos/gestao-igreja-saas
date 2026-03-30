// app/[slug]/membros/[id]/page.tsx
import { MemberService } from "@/services/memberService";
import { auth } from "@/lib/auth";
import { AuditHistory } from "@/components/audit/AuditHistory";
import { notFound } from "next/navigation";

export default async function MemberDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const churchId = session?.user?.churchId;

  if (!churchId) return <div>Acesso negado</div>;

  // Carregamos os logs diretamente do Service (Server-side)
  const logs = await MemberService.getMemberHistory(params.id, churchId);
  
  // Opcional: Carregar dados atuais do membro para o cabeçalho
  // const member = await MemberService.getMemberById(params.id, churchId);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Detalhes do Membro</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Info do Membro */}
        <div className="bg-white p-6 shadow rounded-lg">
           <p>Aqui colocarias os inputs de edição do membro...</p>
        </div>

        {/* Lado Direito: O teu componente de Auditoria */}
        <div className="bg-white p-6 shadow rounded-lg">
          <AuditHistory logs={logs} />
        </div>
      </div>
    </div>
  );
}