"use client";
import { useState } from "react";
import { FinanceSummary } from "@/components/Finance/FinanceSummary";
import { IncomeList } from "@/components/Finance/IncomeList";
import { ExpenseList } from "@/components/Finance/ExpenseList";
import { IncomeFormDialog } from "@/components/Finance/IncomeFormDialog";
import { ExpenseFormDialog } from "@/components/Finance/ExpenseFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import {
  incomeEntries as initialIncome,
  expenseEntries as initialExpenses,
  IncomeEntry,
  ExpenseEntry,
} from "@/lib/mock-data";

export default function Finance() {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(initialIncome);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(initialExpenses);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [activeTab, setActiveTab] = useState("income");

  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeFormOpen(true);
  };

  const handleEditIncome = (entry: IncomeEntry) => {
    setEditingIncome(entry);
    setIsIncomeFormOpen(true);
  };

  const handleDeleteIncome = (id: string) => {
    setIncomeEntries(incomeEntries.filter((e) => e.id !== id));
  };

  const handleSaveIncome = (data: Omit<IncomeEntry, "id">) => {
    if (editingIncome) {
      setIncomeEntries(incomeEntries.map((e) => (e.id === editingIncome.id ? { ...data, id: editingIncome.id } : e)));
    } else {
      const newEntry: IncomeEntry = {
        ...data,
        id: `inc-${Date.now()}`,
      };
      setIncomeEntries([newEntry, ...incomeEntries]);
    }
    setIsIncomeFormOpen(false);
    setEditingIncome(null);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseFormOpen(true);
  };

  const handleEditExpense = (entry: ExpenseEntry) => {
    setEditingExpense(entry);
    setIsExpenseFormOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseEntries(expenseEntries.filter((e) => e.id !== id));
  };

  const handleSaveExpense = (data: Omit<ExpenseEntry, "id">) => {
    if (editingExpense) {
      setExpenseEntries(expenseEntries.map((e) => (e.id === editingExpense.id ? { ...data, id: editingExpense.id } : e)));
    } else {
      const newEntry: ExpenseEntry = {
        ...data,
        id: `exp-${Date.now()}`,
      };
      setExpenseEntries([newEntry, ...expenseEntries]);
    }
    setIsExpenseFormOpen(false);
    setEditingExpense(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Finanças</h1>
            <p className="text-muted-foreground mt-1">Acompanhe as receitas e despesas da sua igreja.</p>
          </div>
        </div>

        <FinanceSummary incomeEntries={incomeEntries} expenseEntries={expenseEntries} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="income" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Receitas
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Despesas
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={activeTab === "income" ? handleAddIncome : handleAddExpense}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar {activeTab === "income" ? "Receita" : "Despesa"}
            </Button>
          </div>

          <TabsContent value="income" className="mt-4">
            <IncomeList entries={incomeEntries} onEdit={handleEditIncome} onDelete={handleDeleteIncome} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <ExpenseList entries={expenseEntries} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />
          </TabsContent>
        </Tabs>

        <IncomeFormDialog
          open={isIncomeFormOpen}
          onOpenChange={setIsIncomeFormOpen}
          entry={editingIncome}
          onSave={handleSaveIncome}
        />

        <ExpenseFormDialog
          open={isExpenseFormOpen}
          onOpenChange={setIsExpenseFormOpen}
          entry={editingExpense}
          onSave={handleSaveExpense}
        />
      </div>
    </>
  );
}
