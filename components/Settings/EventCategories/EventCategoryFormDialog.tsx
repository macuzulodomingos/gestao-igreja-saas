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
import { Loader2 } from "lucide-react";
import { saveEventCategoryAction } from "@/app/actions/event-category-actions";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";
import { useRouter } from "@/i18n/navigation";

const schema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired").max(100, "validation.nameTooLong"),
});

type EventCategoryFormValues = z.infer<typeof schema>;

type EventCategory = {
  id: string;
  name: string;
};

interface EventCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: EventCategory | null;
  onSuccess: (category: EventCategory) => void;
  churchId: string;
}

export function EventCategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  onSuccess,
  churchId
}: EventCategoryFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("eventCategories.form");
  const tc = useTranslations("common");
  const te = useTranslations("eventCategories.errors");
  const tv = useTranslations("validation");
  const router = useRouter();

  const form = useForm<EventCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset({ name: editingCategory?.name ?? "" });
  }, [open, editingCategory?.id, reset]);

  const handleSubmit = (data: EventCategoryFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);

        const result = await saveEventCategoryAction(formData, editingCategory?.id, churchId);

        if (result.success) {
          toast.success(editingCategory ? t("updated") : t("created"));
          onSuccess({ id: result.id!, name: data.name });
          onOpenChange(false);
          router.refresh();
        } else if (result.fieldErrors) {
          const validationMessages: Record<string, string> = {
            nameRequired: tv("nameRequired"),
            nameTooLong: tv("nameTooLong"),
          };
          const categoryErrorMessages: Record<string, string> = {
            duplicate: te("duplicate"),
            errorSave: te("errorSave"),
          };

          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            const msg = messages[0];
            let translated = msg;
            if (msg.startsWith("validation.")) {
              translated = validationMessages[msg.replace("validation.", "")] ?? msg;
            } else if (msg.startsWith("eventCategories.errors.")) {
              translated = categoryErrorMessages[msg.replace("eventCategories.errors.", "")] ?? msg;
            }
            form.setError(field as keyof EventCategoryFormValues, { message: translated });
          });
          toast.error(t("errorForm"));
        } else {
          toast.error(result.errorCode ? te(result.errorCode) : t("error"));
        }
      } catch (error) {
        console.error("[SAVE_EVENT_CATEGORY_ERROR]:", error);
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
            {editingCategory ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} {...field} />
                </FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}</>
                ) : (
                  editingCategory ? t("save") : t("create")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}