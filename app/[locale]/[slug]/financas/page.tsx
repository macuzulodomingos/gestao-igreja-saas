import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceService } from "@/services/financeService";
import FinanceClientPage from "@/components/Finance/FinanceClientPage";
import prisma from "@/lib/prisma";
import { getPlanLimits, PlanType } from "@/lib/plans";
import { getTimezone } from "@/lib/get-timezone";

interface FinancasPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function FinancasPage({ searchParams }: FinancasPageProps) {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;
  const sParams = await searchParams;

  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { name: true, timezone: true, plan: true },
  });

  if (!church) redirect("/login");

  const timezone = church.timezone ?? "Africa/Luanda";
  const planLimits = getPlanLimits(church.plan as PlanType);

  const now = new Date();
  const month = Number(sParams.month) || now.getMonth() + 1;
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
    />
  );
}