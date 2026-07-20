// types/finance.ts
import { TransactionType } from "@prisma/client";

export interface FinanceTransaction {
  id: string;
  description: string;
  amount: number;       
  type: TransactionType; // INCOME ou EXPENSE
  categoryId: string;    // 👈 novo
  category: string;      // Dízimo, Oferta, Aluguel, etc.
  date: Date | string;   // Date no back, string (ISO) no front
}

// Para facilitar no formulário e listas específicas
export type FinanceIncome = FinanceTransaction & { type: "INCOME" };
export type FinanceExpense = FinanceTransaction & { type: "EXPENSE" };

// Resumo para os Cards do Dashboard
export interface FinanceStats {
  totalIncomes: number;
  totalExpenses: number;
  netBalance: number;
  monthlyIncomes: number;
  monthlyExpenses: number;
  monthlyBalance: number;
}