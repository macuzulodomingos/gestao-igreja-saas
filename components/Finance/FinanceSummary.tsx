import { IncomeEntry, ExpenseEntry } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";

interface FinanceSummaryProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
}

export function FinanceSummary({ incomeEntries, expenseEntries }: FinanceSummaryProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = incomeEntries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  const monthlyExpenses = expenseEntries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = monthlyIncome - monthlyExpenses;

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const overallBalance = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    // Formatação para Kwanza angolano (AOA)
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(amount).replace("AOA", "Kz");
  };

  // Nome do mês em português
  const monthName = now.toLocaleString("pt-BR", { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Receita Mensal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas de {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total deste mês</p>
        </CardContent>
      </Card>

      {/* Despesas Mensais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas de {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total deste mês</p>
        </CardContent>
      </Card>

      {/* Saldo Mensal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo de {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Receitas menos despesas</p>
        </CardContent>
      </Card>

      {/* Saldo Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Geral
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${overallBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(overallBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Saldo acumulado total</p>
        </CardContent>
      </Card>
    </div>
  );
}