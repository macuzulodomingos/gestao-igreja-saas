import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceService } from "@/services/financeService";
import FinanceClientPage from "@/components/Finance/FinanceClientPage";

export default async function FinancasPage() {
  const session = await auth();

  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;

  const [incomeList, expenseList, stats, incomeCategories, expenseCategories] =
    await Promise.all([
      FinanceService.getTransactions(churchId, 50, "INCOME"),
      FinanceService.getTransactions(churchId, 50, "EXPENSE"),
      FinanceService.getFinanceStats(churchId),
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
    />
  );
}