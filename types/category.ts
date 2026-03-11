export type TransactionType = "INCOME" | "EXPENSE";

export interface FinanceCategory {
  id: string;
  name: string;
  type: TransactionType;
  churchId: string;
  _count?: { transactions: number };
}