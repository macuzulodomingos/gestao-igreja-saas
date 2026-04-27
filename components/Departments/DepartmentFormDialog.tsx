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
import { saveDepartmentAction } from "@/app/actions/department-actions";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";

const schema = z.object({
  name: z.string().min(1, "validation.nameRequired").max(100, "validation.departmentNameTooLong"),
  description: z.string().max(500, "validation.departmentDescTooLong").optional(),
  leaderId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Department = {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
};

type Member = {
  id: string;
  name: string;
  role: { name: string } | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  members: Member[];
  onUpgrade?: (message: string) => void;
}

export function DepartmentFormDialog({ open, onOpenChange, department, members, onUpgrade }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("departments.form");
  const tc = useTranslations("common");
  const td = useTranslations("departments.errors");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", leaderId: "none" },
  });

  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          name: department.name,
          description: department.description || "",
          leaderId: department.leaderId || "none",
        });
      } else {
        form.reset({ name: "", description: "", leaderId: "none" });
      }
    }
  }, [department, open, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("leaderId", data.leaderId || "none");

      const result = await saveDepartmentAction(
        formData,
        department?.id ?? undefined
      );

      if (result.success) {
        toast.success(department ? t("updated") : t("created"));
        onOpenChange(false);
      } else if ("upgrade" in result && result.upgrade) {
        onOpenChange(false);
        const errorCode = (result as any).errorCode;
        onUpgrade?.(errorCode ? td(errorCode) : tc("upgrade")); // 👈
      } else {
        const errorCode = (result as any).errorCode;
        toast.error(errorCode ? td(errorCode) : t("error")); // 👈
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? t("editTitle") : t("addTitle")}
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

            <FormField control={form.control} name="leaderId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("leader")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("leaderPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("noLeader")}</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.role ? `(${member.role.name})` : ""}
                      </SelectItem>
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
                  : department ? t("save") : t("add")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}