"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { eventSchema } from "@/lib/validations/event";
import { saveEventAction } from "@/app/actions/event-actions";
import { ChurchEvent, EventCategory, EventListDepartment } from "@/types/event";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";

type FormData = z.infer<typeof eventSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent | null;
  departments: EventListDepartment[];
  categories: EventCategory[];
  onUpgrade?: (message: string) => void;
}

export function EventFormDialog({ open, onOpenChange, event, departments, categories, onUpgrade }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("events.form");
  const tc = useTranslations("common");
  const te = useTranslations("events.errors");

  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      date: "",
      time: "",
      departmentId: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        const startAt = new Date(event.startAt);
        const date = startAt.toLocaleDateString("en-CA");
        const time = startAt.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        form.reset({
          name: event.name,
          description: event.description || "",
          categoryId: event.categoryId,
          date,
          time,
          departmentId: event.departmentId || "none",
        });
      } else {
        form.reset({
          name: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          date: new Date().toLocaleDateString("en-CA"),
          time: "09:00",
          departmentId: "none",
        });
      }
    }
  }, [event, open, form, categories]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("categoryId", data.categoryId);
      formData.append("date", data.date);
      formData.append("time", data.time);
      formData.append("departmentId", data.departmentId || "none");

      const result = await saveEventAction(formData, event?.id ?? undefined);

      if (result.success) {
        toast.success(event ? t("updated") : t("created"));
        onOpenChange(false);
      } else if ("upgrade" in result && result.upgrade) {
        onOpenChange(false);
        const errorCode = (result as any).errorCode;
        onUpgrade?.(errorCode ? te(errorCode) : tc("upgrade")); // 👈
      } else if (result.fieldErrors) {
        toast.error(t("checkErrors"));
      } else {
        const errorCode = (result as any).errorCode;
        toast.error(errorCode ? te(errorCode) : t("error")); // 👈
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? t("editTitle") : t("addTitle")}</DialogTitle>
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
                    {categories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>
                        {t("noCategories")}
                      </SelectItem>
                    ) : (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("date")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("time")}</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("department")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("departmentPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("noDepartment")}</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <TranslatedFormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : event ? t("save") : t("add")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}