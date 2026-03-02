"use client";

import { useState } from "react";
import { FinanceSummary } from "./FinanceSummary";
import { IncomeList } from "./IncomeList";
import { ExpenseList } from "./ExpenseList";
import IncomeFormDialog from "./IncomeFormDialog";
import { ExpenseFormDialog } from "./ExpenseFormDialog"; // ✅ Importado
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { FinanceTransaction } from "@prisma/client";
import { deleteTransactionAction } from "@/app/actions/finance";
import { toast } from "sonner";

interface FinanceClientProps {
  initialIncome: FinanceTransaction[];
  initialExpenses: FinanceTransaction[];
  stats: { totalIncomes: number; totalExpenses: number; netBalance: number };
}

export default function FinanceClientPage({
  initialIncome,
  initialExpenses,
  stats,
}: FinanceClientProps) {
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceTransaction | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("income");

  const handleAdd = () => {
    setEditingEntry(null);
    if (activeTab === "income") {
      setIsIncomeFormOpen(true);
    } else {
      setIsExpenseFormOpen(true);
    }
  };

  const handleEdit = (entry: FinanceTransaction) => {
    setEditingEntry(entry);

    if (entry.type === "INCOME") {
      setIsIncomeFormOpen(true);
    } else {
      setIsExpenseFormOpen(true);
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja eliminar este registo?")) return;
    const result = await deleteTransactionAction(id);
    if (result.success) toast.success("Eliminado com sucesso");
    else toast.error("Erro ao eliminar");
  };

  return (
    <div className="space-y-6">
      <FinanceSummary stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="income">
              <TrendingUp className="mr-2 h-4 w-4" /> Receitas
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <TrendingDown className="mr-2 h-4 w-4" /> Despesas
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Registo
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

      {/* Modais de Formulário */}
      <IncomeFormDialog
        open={isIncomeFormOpen}
        onOpenChange={setIsIncomeFormOpen}
        entry={editingEntry}
      />

      <ExpenseFormDialog
        open={isExpenseFormOpen}
        onOpenChange={setIsExpenseFormOpen}
        entry={editingEntry}
      />
    </div>
  );
}
