import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceService } from "@/services/financeService";
import FinanceClientPage from "@/components/Finance/FinanceClientPage";
import prisma from "@/lib/prisma";

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
    select: { name: true },
  });
  const now = new Date();
  const month = Number(sParams.month) || now.getMonth() + 1;
  const year = Number(sParams.year) || now.getFullYear();

  const [incomeList, expenseList, stats, incomeCategories, expenseCategories] =
    await Promise.all([
      FinanceService.getTransactions(churchId, 50, "INCOME", month, year),
      FinanceService.getTransactions(churchId, 50, "EXPENSE", month, year),
      FinanceService.getFinanceStats(churchId, month, year),
      FinanceService.getCategories(churchId, "INCOME"),
      FinanceService.getCategories(churchId, "EXPENSE"),
    ]);

  return (
    <FinanceClientPage
      initialIncome={incomeList}
      initialExpenses={expenseList}
      stats={stats}
      incomeCategories={incomeCategories}
      expenseCategories={expenseCategories}
      currentMonth={month}
      currentYear={year}
      churchName={church?.name ?? "Igreja"}
    />
  );
}