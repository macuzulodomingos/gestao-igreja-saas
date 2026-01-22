// app/[slug]/dashboard/page.tsx
import { getChurchBySlug } from "@/lib/tenant";
import { getChurchMembers } from "@/services/member.service";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// O Next.js exige que seja EXPORT DEFAULT
export default async function DashboardPage(props: PageProps) {
  // No Next 15, primeiro aguardamos os params
  const { slug } = await props.params;

  const church = await getChurchBySlug(slug);

  if (!church) {
    return notFound();
  }

  const members = await getChurchMembers(church.id);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Painel Administrativo
        </h1>
        <p className="text-blue-600 font-medium">{church.name}</p>
      </header>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Membros da Congregação</h2>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.id} className="px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{member.name}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">
                  {member.status}
                </span>
              </div>
            </li>
          ))}
          
          {members.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-500 italic">
              Nenhum membro cadastrado nesta igreja.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}