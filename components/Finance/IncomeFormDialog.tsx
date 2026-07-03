"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { saveTransactionAction } from "@/app/actions/finance";
import { FinanceTransaction } from "@/types/finance";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";
import { useRouter } from "@/i18n/navigation";


const schema = z.object({
  date: z.string().min(1, "validation.dateRequired"),
  categoryId: z.string().min(1, "validation.categoryRequired"),
  amount: z
    .string()
    .min(1, "validation.amountRequired")
    .refine((val) => {
      const cleaned = val.replace(/\./g, "").replace(",", ".");
      return !isNaN(Number(cleaned)) && Number(cleaned) > 0;
    }, "validation.amountPositive"),
  description: z.string().max(200, "validation.descriptionTooLong").optional(),
});

type IncomeFormValues = z.infer<typeof schema>;
type Category = { id: string; name: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinanceTransaction | null;
  categories: Category[];
  churchId: string;
  onUpgrade?: (message: string) => void;
}

export function IncomeFormDialog({ open, onOpenChange, entry, categories, churchId, onUpgrade }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("finance.incomeForm");
  const tc = useTranslations("common");
  const tf = useTranslations("finance.errors");
  const router = useRouter();

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", categoryId: "", amount: "", description: "" },
  });

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      entry
        ? {
          date: typeof entry.date === "string"
            ? entry.date.split("T")[0]
            : entry.date.toISOString().split("T")[0],
          categoryId: categories.find(c => c.name === entry.category)?.id || "",
          amount: entry.amount.toString(),
          description: entry.description ?? "",
        }
        : {
          date: new Date().toISOString().split("T")[0],
          categoryId: categories[0]?.id || "",
          amount: "",
          description: "",
        }
    );
  }, [open, entry?.id, reset]);

  const handleSubmit = (data: IncomeFormValues) => {
    startTransition(async () => {
      try {
        const cleanAmount = data.amount.trim()
          .replace(/\./g, "")
          .replace(",", ".");

        const formData = new FormData();
        formData.append("description", data.description || t("defaultDescription"));
        formData.append("amount", cleanAmount);
        formData.append("type", "INCOME");
        formData.append("categoryId", data.categoryId);
        formData.append("date", data.date);

        const result = await saveTransactionAction(formData, entry?.id ?? undefined, churchId);

        if (result.success) {
          toast.success(entry ? t("updated") : t("created"));
          onOpenChange(false);
          router.refresh();
        } else if (result.upgrade) {
          onOpenChange(false);
          onUpgrade?.(result.errorCode ? tf(result.errorCode) : tc("upgrade"));
        } else {
          toast.error(result.errorCode ? tf(result.errorCode) : t("error"));
        }
      } catch (error) {
        console.error("[SAVE_INCOME_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isPending) return;
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("date")}</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("category")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("categoryPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={t("amountPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("descriptionPlaceholder")}
                    className="resize-none"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : entry ? t("save") : t("add")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}