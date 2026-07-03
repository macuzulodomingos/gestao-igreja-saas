"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR, fr } from "date-fns/locale";
import { FinanceTransaction } from "@/types/finance";
import { useTranslations, useLocale } from "next-intl";

const dateLocalesMap = {
  pt: ptBR,
  fr: fr,
};

interface ExpenseListProps {
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
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ];
  const index = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export function ExpenseList({ entries, onEdit, onDelete }: ExpenseListProps) {
  const t = useTranslations("finance.expenseList");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;
  const dateFormatPattern = locale === "fr" ? "dd MMM yyyy" : "dd 'de' MMM, yyyy";

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = typeof a.date === "string" ? parseISO(a.date) : a.date;
    const dateB = typeof b.date === "string" ? parseISO(b.date) : b.date;
    const timeA = isValid(dateA) ? dateA.getTime() : 0;
    const timeB = isValid(dateB) ? dateB.getTime() : 0;
    return timeB - timeA;
  });

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
                {sortedEntries.map((entry) => {
                  const date = typeof entry.date === "string" ? parseISO(entry.date) : entry.date;
                  const displayDate = isValid(date)
                    ? format(date, dateFormatPattern, { locale: dateLocale })
                    : "—";

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">{displayDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryColor(entry.category)}>
                          {entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                        {entry.description || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600 whitespace-nowrap">
                        -{formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={tc("actions")}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(entry)}>
                              <Pencil className="h-4 w-4 mr-2" /> {tc("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={e => { e.preventDefault(); onDelete(entry.id); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> {tc("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}