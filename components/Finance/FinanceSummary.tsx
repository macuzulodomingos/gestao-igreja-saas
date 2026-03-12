import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";

interface FinanceSummaryProps {
  stats: {
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
    monthlyIncomes: number;
    monthlyExpenses: number;
    monthlyBalance: number;
  };
  month: number;  // 👈 NOVO
  year: number;   // 👈 NOVO
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(amount).replace("AOA", "Kz");

export function FinanceSummary({ stats, month, year }: FinanceSummaryProps) {
  // 👇 Usa o mês do filtro em vez de new Date()
  const monthName = new Date(year, month - 1, 1)
    .toLocaleString("pt-AO", { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.monthlyIncomes)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total deste mês</p>
        </CardContent>
      </Card>

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
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.monthlyExpenses)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total deste mês</p>
        </CardContent>
      </Card>

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
          <p className={`text-2xl font-bold ${stats.monthlyBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(stats.monthlyBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Receitas menos despesas</p>
        </CardContent>
      </Card>

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
          <p className={`text-2xl font-bold ${stats.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(stats.netBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Saldo acumulado total</p>
        </CardContent>
      </Card>
    </div>
  );
}