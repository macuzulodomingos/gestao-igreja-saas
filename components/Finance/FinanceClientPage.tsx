"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FinanceSummary } from "./FinanceSummary";
import { IncomeList } from "./IncomeList";
import { ExpenseList } from "./ExpenseList";
import { IncomeFormDialog } from "./IncomeFormDialog";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { deleteTransactionAction, loadMoreTransactionsAction } from "@/app/actions/finance";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FinanceTransaction, FinanceStats } from "@/types/finance";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const DownloadPDFButton = dynamic(
  () => import("./DownloadPDFButton").then(mod => mod.DownloadPDFButton),
  { ssr: false }
);

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type Category = {
  id: string;
  name: string;
};

interface FinanceClientProps {
  initialIncome: FinanceTransaction[];
  initialExpenses: FinanceTransaction[];
  initialIncomeCursor: string | null;
  initialExpenseCursor: string | null;
  hasMoreIncome: boolean;
  hasMoreExpenses: boolean;
  stats: FinanceStats;
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentMonth: number;
  currentYear: number;
  churchName: string;
  canExportPdf: boolean;
  churchId: string;
}

export default function FinanceClientPage({
  initialIncome,
  initialExpenses,
  initialIncomeCursor,
  initialExpenseCursor,
  hasMoreIncome,
  hasMoreExpenses,
  stats,
  incomeCategories,
  expenseCategories,
  currentMonth,
  currentYear,
  churchName,
  canExportPdf,
  churchId
}: FinanceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const upgrade = useUpgradeModal();
  const t = useTranslations("finance");
  const tf = useTranslations("finance.errors");

  // 👈 detecta locale pelo pathname
  const locale = pathname.startsWith("/fr") ? "fr" : "pt";
  const MONTHS = locale === "fr" ? MONTHS_FR : MONTHS_PT;

  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("income");
  const [entryToDelete, setEntryToDelete] = useState<FinanceTransaction | null>(null);

  const [incomeList, setIncomeList] = useState(initialIncome);
  const [expenseList, setExpenseList] = useState(initialExpenses);
  const [incomeCursor, setIncomeCursor] = useState(initialIncomeCursor);
  const [expenseCursor, setExpenseCursor] = useState(initialExpenseCursor);
  const [hasMoreInc, setHasMoreInc] = useState(hasMoreIncome);
  const [hasMoreExp, setHasMoreExp] = useState(hasMoreExpenses);
  const [isPendingNav, startNavTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setIncomeList(initialIncome);
    setExpenseList(initialExpenses);
    setIncomeCursor(initialIncomeCursor);
    setExpenseCursor(initialExpenseCursor);
    setHasMoreInc(hasMoreIncome);
    setHasMoreExp(hasMoreExpenses);
  }, [initialIncome, initialExpenses, initialIncomeCursor, initialExpenseCursor, hasMoreIncome, hasMoreExpenses]);

  const navigateToMonth = (month: number, year: number) => {
    startNavTransition(() => {
      router.push(`${pathname}?month=${month}&year=${year}`, { scroll: false });
    });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      navigateToMonth(12, currentYear - 1);
    } else {
      navigateToMonth(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (currentMonth === 12) {
      navigateToMonth(1, currentYear + 1);
    } else {
      navigateToMonth(currentMonth + 1, currentYear);
    }
  };

  const handleLoadMore = async (type: "INCOME" | "EXPENSE") => {
    const cursor = type === "INCOME" ? incomeCursor : expenseCursor;
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const result = await loadMoreTransactionsAction(type, currentMonth, currentYear, churchId, cursor);
      if (!result.success) {
        toast.error(tf((result as any).errorCode) ?? t("errorLoadMore"));
        return;
      }
      if (type === "INCOME") {
        setIncomeList(prev => [...prev, ...result.data]);
        setIncomeCursor(result.nextCursor ?? null);
        setHasMoreInc(result.hasMore ?? false);
      } else {
        setExpenseList(prev => [...prev, ...result.data]);
        setExpenseCursor(result.nextCursor ?? null);
        setHasMoreExp(result.hasMore ?? false);
      }
    } catch {
      toast.error(t("errorLoadMore"));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAdd = () => {
    setEditingEntry(null);
    if (activeTab === "income") setIsIncomeFormOpen(true);
    else setIsExpenseFormOpen(true);
  };

  const handleEdit = (entry: FinanceTransaction) => {
    setEditingEntry(entry);
    if (entry.type === "INCOME") setIsIncomeFormOpen(true);
    else setIsExpenseFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const entry = incomeList.find(e => e.id === id) || expenseList.find(e => e.id === id);
    if (entry) setEntryToDelete(entry);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    const targetId = entryToDelete.id;
    const targetType = entryToDelete.type;
    try {
      const result = await deleteTransactionAction(targetId, churchId);
      if (result.success) {
        toast.success(t("deleted"));
        if (targetType === "INCOME") {
          setIncomeList(prev => prev.filter(item => item.id !== targetId));
        } else {
          setExpenseList(prev => prev.filter(item => item.id !== targetId));
        }
        router.refresh();
      } else {
        toast.error(t("errorDelete"));
      }
    } catch {
      toast.error(t("errorDelete"));
    } finally {
      setEntryToDelete(null);
    }
  };

  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 5 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <DownloadPDFButton
            churchName={churchName}
            month={currentMonth}
            year={currentYear}
            income={incomeList}
            expenses={expenseList}
            stats={stats}
            canExportPdf={canExportPdf}
          />
          <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isPendingNav}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={String(currentMonth)}
            onValueChange={(val) => navigateToMonth(Number(val), currentYear)}
            disabled={isPendingNav}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(currentYear)}
            onValueChange={(val) => navigateToMonth(currentMonth, Number(val))}
            disabled={isPendingNav}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth || isPendingNav}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FinanceSummary stats={stats} month={currentMonth} year={currentYear} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="income">
              <TrendingUp className="mr-2 h-4 w-4" /> {t("income")} ({incomeList.length})
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <TrendingDown className="mr-2 h-4 w-4" /> {t("expenses")} ({expenseList.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            {activeTab === "income" ? t("addIncome") : t("addExpense")}
          </Button>
        </div>

        <TabsContent value="income">
          <IncomeList entries={incomeList} onEdit={handleEdit} onDelete={handleDelete} />
          {hasMoreInc && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => handleLoadMore("INCOME")} disabled={loadingMore}>
                {loadingMore
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}</>
                  : t("loadMoreIncome")
                }
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseList entries={expenseList} onEdit={handleEdit} onDelete={handleDelete} />
          {hasMoreExp && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => handleLoadMore("EXPENSE")} disabled={loadingMore}>
                {loadingMore
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}</>
                  : t("loadMoreExpenses")
                }
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <IncomeFormDialog
        open={isIncomeFormOpen}
        onOpenChange={setIsIncomeFormOpen}
        entry={editingEntry}
        categories={incomeCategories}
        churchId={churchId}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      <ExpenseFormDialog
        open={isExpenseFormOpen}
        onOpenChange={setIsExpenseFormOpen}
        entry={editingEntry}
        categories={expenseCategories}
        churchId={churchId}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")}{" "}
              <strong>
                {entryToDelete?.type === "INCOME" ? t("income").toLowerCase() : t("expenses").toLowerCase()}
              </strong>{" "}
              {t("category")} <strong>{entryToDelete?.category}</strong>?{" "}
              {t("irreversible")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        open={upgrade.isOpen}
        onOpenChange={upgrade.onOpenChange}
        limitMessage={upgrade.message}
      />
    </div>
  );
}