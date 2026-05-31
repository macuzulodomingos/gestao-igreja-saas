import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR, fr } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
};

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

const dateLocalesMap = { pt: ptBR, fr: fr };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(amount).replace("AOA", "Kz");

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  return (
    <Card className="card-shadow rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t("recentTransactions")}</CardTitle>
          <Receipt className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("lastActivity")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("noTransactions")}
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                tx.type === "INCOME"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}>
                {tx.type === "INCOME"
                  ? <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.category} • {format(new Date(tx.date), "dd 'de' MMM", { locale: dateLocale })}
                </p>
              </div>
              <span className={cn(
                "text-sm font-semibold",
                tx.type === "INCOME"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}