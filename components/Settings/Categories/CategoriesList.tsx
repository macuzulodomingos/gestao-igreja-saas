import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { FinanceCategory } from "@/types/category";

interface Props {
  categories: FinanceCategory[];
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoriesList({ categories, onEdit, onDelete }: Props) {
  const incomeCategories = categories.filter(c => c.type === "INCOME");
  const expenseCategories = categories.filter(c => c.type === "EXPENSE");

  const renderCard = (category: FinanceCategory) => (
    <div
      key={category.id}
      className="flex items-center justify-between p-3 rounded-lg border"
    >
      <div className="flex items-center gap-3">
        {category.type === "INCOME"
          ? <TrendingUp className="h-4 w-4 text-green-500" />
          : <TrendingDown className="h-4 w-4 text-red-500" />
        }
        <span className="font-medium">{category.name}</span>
        {category._count && (
          <Badge variant="secondary" className="text-xs">
            {category._count.transactions} transacção(ões)
          </Badge>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={e => { e.preventDefault(); onDelete(category.id); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Receitas ({incomeCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              Nenhuma categoria de receita criada.
            </p>
          ) : (
            <div className="space-y-2">
              {incomeCategories.map(renderCard)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Despesas ({expenseCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              Nenhuma categoria de despesa criada.
            </p>
          ) : (
            <div className="space-y-2">
              {expenseCategories.map(renderCard)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}