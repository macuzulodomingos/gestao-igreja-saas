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
import { eventSchema } from "@/lib/validations/event";
import { saveEventAction } from "@/app/actions/event-actions";
import { ChurchEvent, EventCategory, EventListDepartment } from "@/types/event";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";
import { parseISO } from "date-fns";
import { useRouter } from "@/i18n/navigation";
import { formatInTimeZone } from "date-fns-tz";

type EventFormValues = z.infer<typeof eventSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent | null;
  departments: EventListDepartment[];
  categories: EventCategory[];
  onUpgrade?: (message: string) => void;
  churchId: string;
  timezone: string;
}

export function EventFormDialog({ open, onOpenChange, event, departments, categories, onUpgrade, churchId, timezone }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("events.form");
  const tc = useTranslations("common");
  const te = useTranslations("events.errors");
  const router = useRouter();

  const form = useForm<EventFormValues>({
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

  const { reset } = form;

  useEffect(() => {
    if (!open) return;

    if (event) {
      const startAt = typeof event.startAt === "string" ? parseISO(event.startAt) : event.startAt;
      const date = formatInTimeZone(startAt, timezone, "yyyy-MM-dd");
      const time = formatInTimeZone(startAt, timezone, "HH:mm");
      reset({
        name: event.name,
        description: event.description ?? "",
        categoryId: event.categoryId,
        date,
        time,
        departmentId: event.departmentId ?? "none",
      });
    } else {
      const now = new Date();
      reset({
        name: "",
        description: "",
        categoryId: categories[0]?.id ?? "",
        date: formatInTimeZone(now, timezone, "yyyy-MM-dd"),
        time: "09:00",
        departmentId: "none",
      });
    }
  }, [open, event?.id, reset, timezone]);

  const handleSubmit = (data: EventFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description || "");
        formData.append("categoryId", data.categoryId);
        formData.append("date", data.date);
        formData.append("time", data.time);
        formData.append("departmentId", data.departmentId || "none");

        const result = await saveEventAction(formData, event?.id ?? undefined, churchId);

        if (result.success) {
          toast.success(event ? t("updated") : t("created"));
          onOpenChange(false);
          router.refresh();
        } else if ("upgrade" in result && result.upgrade) {
          onOpenChange(false);
          onUpgrade?.(result.errorCode ? te(result.errorCode) : tc("upgrade"));
        } else if (result.fieldErrors) {
          toast.error(t("checkErrors"));
        } else {
          toast.error(result.errorCode ? te(result.errorCode) : t("error"));
        }
      } catch (error) {
        console.error("[SAVE_EVENT_ERROR]:", error);
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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