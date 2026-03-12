"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FinanceSummary } from "./FinanceSummary";
import { IncomeList } from "./IncomeList";
import { ExpenseList } from "./ExpenseList";
import { IncomeFormDialog } from "./IncomeFormDialog";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteTransactionAction } from "@/app/actions/finance";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  churchId: string;
};

type Category = {
  id: string;
  name: string;
};

interface FinanceClientProps {
  initialIncome: Transaction[];
  initialExpenses: Transaction[];
  stats: {
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
    monthlyIncomes: number;
    monthlyExpenses: number;
    monthlyBalance: number;
  };
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentMonth: number;
  currentYear: number;
}

export default function FinanceClientPage({
  initialIncome,
  initialExpenses,
  stats,
  incomeCategories,
  expenseCategories,
  currentMonth,
  currentYear,
}: FinanceClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState("income");
  const [entryToDelete, setEntryToDelete] = useState<Transaction | null>(null);

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

  const handleAdd = () => {
    setEditingEntry(null);
    if (activeTab === "income") setIsIncomeFormOpen(true);
    else setIsExpenseFormOpen(true);
  };

  const handleEdit = (entry: Transaction) => {
    setEditingEntry(entry);
    if (entry.type === "INCOME") setIsIncomeFormOpen(true);
    else setIsExpenseFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const entry =
      initialIncome.find(e => e.id === id) ||
      initialExpenses.find(e => e.id === id);
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

  // Anos disponíveis (5 anos atrás até ao ano actual)
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

        {/* Selector de mês/ano */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
          >
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
              <TrendingUp className="mr-2 h-4 w-4" /> Receitas ({initialIncome.length})
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <TrendingDown className="mr-2 h-4 w-4" /> Despesas ({initialExpenses.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar {activeTab === "income" ? "Receita" : "Despesa"}
          </Button>
        </div>

        <TabsContent value="income">
          <IncomeList
            entries={initialIncome}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseList
            entries={initialExpenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <IncomeFormDialog
        open={isIncomeFormOpen}
        onOpenChange={setIsIncomeFormOpen}
        entry={editingEntry}
        categories={incomeCategories}
      />

      <ExpenseFormDialog
        open={isExpenseFormOpen}
        onOpenChange={setIsExpenseFormOpen}
        entry={editingEntry}
        categories={expenseCategories}
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
    </div>
  );
}