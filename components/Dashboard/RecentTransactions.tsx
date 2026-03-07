import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
};

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(amount).replace("AOA", "Kz");

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="card-shadow rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Transações recentes</CardTitle>
          <Receipt className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Última actividade financeira</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma transação recente.
          </p>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                t.type === "INCOME"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}>
                {t.type === "INCOME"
                  ? <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {t.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.category} • {format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              <span className={cn(
                "text-sm font-semibold",
                t.type === "INCOME"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}