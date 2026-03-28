"use client";

import { useEffect, useState } from "react";
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
import { DownloadPDFButton } from "./DownloadPDFButton";
import { FinanceTransaction, FinanceStats } from "@/types/finance";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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
}: FinanceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const upgrade = useUpgradeModal();

  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("income");
  const [entryToDelete, setEntryToDelete] = useState<FinanceTransaction | null>(null);

  // Estados para paginação
  const [incomeList, setIncomeList] = useState(initialIncome);
  const [expenseList, setExpenseList] = useState(initialExpenses);
  const [incomeCursor, setIncomeCursor] = useState(initialIncomeCursor);
  const [expenseCursor, setExpenseCursor] = useState(initialExpenseCursor);
  const [hasMoreInc, setHasMoreInc] = useState(hasMoreIncome);
  const [hasMoreExp, setHasMoreExp] = useState(hasMoreExpenses);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset quando mês/ano muda
  useEffect(() => {
    setIncomeList(initialIncome);
    setExpenseList(initialExpenses);
    setIncomeCursor(initialIncomeCursor);
    setExpenseCursor(initialExpenseCursor);
    setHasMoreInc(hasMoreIncome);
    setHasMoreExp(hasMoreExpenses);
  }, [initialIncome, initialExpenses, initialIncomeCursor, initialExpenseCursor, hasMoreIncome, hasMoreExpenses]);

  const navigateToMonth = (month: number, year: number) => {
    router.push(`${pathname}?month=${month}&year=${year}`);
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
  if (!cursor) return;

  setLoadingMore(true);
  const result = await loadMoreTransactionsAction(type, currentMonth, currentYear, cursor);
  setLoadingMore(false);

  if (!result.success || !result.data) {
    toast.error("Erro ao carregar mais.");
    return;
  }

  // 👈 TypeScript já sabe que result.data existe aqui
  if (type === "INCOME") {
    setIncomeList(prev => [...prev, ...result.data]);
    setIncomeCursor(result.nextCursor ?? null);
    setHasMoreInc(result.hasMore ?? false);
  } else {
    setExpenseList(prev => [...prev, ...result.data]);
    setExpenseCursor(result.nextCursor ?? null);
    setHasMoreExp(result.hasMore ?? false);
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
    const entry =
      incomeList.find(e => e.id === id) ||
      expenseList.find(e => e.id === id);
    if (entry) setEntryToDelete(entry);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    const result = await deleteTransactionAction(entryToDelete.id);
    if (result.success) toast.success("Eliminado com sucesso!");
    else toast.error("Erro ao eliminar.");
    setEntryToDelete(null);
  };

  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  const years = Array.from(
    { length: 6 },
    (_, i) => now.getFullYear() - 5 + i
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanças</h1>
          <p className="text-muted-foreground">
            Acompanhe as receitas e despesas da sua igreja.
          </p>
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
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={String(currentMonth)}
            onValueChange={(val) => navigateToMonth(Number(val), currentYear)}
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

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FinanceSummary stats={stats} month={currentMonth} year={currentYear} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="income">
              <TrendingUp className="mr-2 h-4 w-4" /> Receitas ({incomeList.length})
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <TrendingDown className="mr-2 h-4 w-4" /> Despesas ({expenseList.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar {activeTab === "income" ? "Receita" : "Despesa"}
          </Button>
        </div>

        <TabsContent value="income">
          <IncomeList
            entries={incomeList}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {hasMoreInc && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => handleLoadMore("INCOME")}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar...</>
                ) : (
                  "Carregar mais receitas"
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseList
            entries={expenseList}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {hasMoreExp && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => handleLoadMore("EXPENSE")}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar...</>
                ) : (
                  "Carregar mais despesas"
                )}
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
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      <ExpenseFormDialog
        open={isExpenseFormOpen}
        onOpenChange={setIsExpenseFormOpen}
        entry={editingEntry}
        categories={expenseCategories}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente eliminar este registo de{" "}
              <strong>
                {entryToDelete?.type === "INCOME" ? "receita" : "despesa"}
              </strong>{" "}
              da categoria <strong>{entryToDelete?.category}</strong>?{" "}
              Esta acção é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Confirmar Eliminação
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