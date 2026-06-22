import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { FinanceService } from "@/services/financeService";
import FinanceClientPage from "@/components/Finance/FinanceClientPage";
import { getPlanLimits, PlanType } from "@/lib/plans";
import { getChurchBySlug } from "@/lib/tenant";

interface FinancasPageProps {
  params: Promise<{ slug: string }>; // 👈 adiciona params
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function FinancasPage({ params, searchParams }: FinancasPageProps) {
  const session = await auth();
  const { slug } = await params; // 👈 adiciona
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

  const timezone = church.timezone ?? "Africa/Luanda";

  const planLimits = getPlanLimits(church.plan as PlanType);

  const now = new Date();
  const parsedMonth = Number(sParams.month) || now.getMonth() + 1;
  const month = parsedMonth < 1 || parsedMonth > 12 ? now.getMonth() + 1 : parsedMonth;
  const year = Number(sParams.year) || now.getFullYear();

  const [incomeResult, expenseResult, stats, incomeCategories, expenseCategories] =
    await Promise.all([
      FinanceService.getTransactions(churchId, 20, "INCOME", month, year, timezone),
      FinanceService.getTransactions(churchId, 20, "EXPENSE", month, year, timezone),
      FinanceService.getFinanceStats(churchId, timezone, month, year),
      FinanceService.getCategories(churchId, "INCOME"),
      FinanceService.getCategories(churchId, "EXPENSE"),
    ]);

  return (
    <FinanceClientPage
      initialIncome={incomeResult.data}
      initialExpenses={expenseResult.data}
      initialIncomeCursor={incomeResult.nextCursor}
      initialExpenseCursor={expenseResult.nextCursor}
      hasMoreIncome={incomeResult.hasMore}
      hasMoreExpenses={expenseResult.hasMore}
      stats={stats}
      incomeCategories={incomeCategories}
      expenseCategories={expenseCategories}
      currentMonth={month}
      currentYear={year}
      churchName={church.name}
      canExportPdf={planLimits.pdfExport}
      churchId={churchId} // 👈 passa churchId para o client
    />
  );
}