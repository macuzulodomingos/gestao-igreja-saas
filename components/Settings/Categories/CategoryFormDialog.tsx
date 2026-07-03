"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { saveCategoryAction } from "@/app/actions/finance-category-actions";
import { FinanceCategory } from "@/types/category";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";
import { useRouter } from "@/i18n/navigation";

const schema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired").max(50, "validation.categoryNameTooLong"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

type CategoryFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinanceCategory | null;
  churchId: string;
}

export function CategoryFormDialog({ open, onOpenChange, category, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("categories.form");
  const tc = useTranslations("common");
  const router = useRouter();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "INCOME" },
  });

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      name: category?.name ?? "",
      type: category?.type ?? "INCOME",
    });
  }, [open, category?.id, reset]);

  const handleSubmit = (data: CategoryFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("type", data.type);

        const result = await saveCategoryAction(formData, category?.id, churchId);

        if (result.success) {
          toast.success(category ? t("updated") : t("created"));
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.errorCode ? t(`errors.${result.errorCode}`) : t("error"));
        }
      } catch (error) {
        console.error("[SAVE_CATEGORY_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isPending) return;
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {category ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} {...field} />
                </FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("type")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("typePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">{t("income")}</SelectItem>
                    <SelectItem value="EXPENSE">{t("expense")}</SelectItem>
                  </SelectContent>
                </Select>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : category ? t("save") : t("create")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}