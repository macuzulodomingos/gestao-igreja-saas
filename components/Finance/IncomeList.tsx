import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ptBR, fr } from "date-fns/locale";
import { format } from "date-fns";
import { FinanceTransaction } from "@/types/finance";
import { useTranslations, useLocale } from "next-intl";

const dateLocalesMap = {
  pt: ptBR,
  fr: fr,
};

interface IncomeListProps {
  entries: FinanceTransaction[];
  onEdit: (entry: FinanceTransaction) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(amount).replace("AOA", "Kz");

const getCategoryColor = (name: string) => {
  const colors = [
    "bg-primary/10 text-primary",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  ];
  const index = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export function IncomeList({ entries, onEdit, onDelete }: IncomeListProps) {
  const t = useTranslations("finance.incomeList");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEntries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {format(new Date(entry.date), "dd 'de' MMM, yyyy", { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(entry.category)}>
                        {entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(entry)}>
                            <Pencil className="h-4 w-4 mr-2" /> {tc("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(entry.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> {tc("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}