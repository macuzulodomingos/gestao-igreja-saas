import DashboardShell from "@/components/Dashboard/DashboardShell";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";

export default async function DashboardPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;

  // 🔍 Buscamos a igreja no banco para pegar o ID real
  const church = await getChurchBySlug(slug);

  // 🛡️ Segurança: Se alguém burlar a URL, paramos aqui
  if (!church) {
    return notFound();
  }

  // ✅ Passamos o ID para o Shell carregar os dados certos
  return <DashboardShell churchId={church.id} />;
}