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
import { saveRoleAction } from "@/app/actions/member-role-actions";
import { MemberRole } from "@/types/role";
import { useTranslations } from "next-intl";
import { TranslatedFormMessage } from "@/components/ui/TranslatedFormMessage";
import { useRouter } from "@/i18n/navigation";

const schema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired").max(50, "validation.nameTooLong"),
});

type RoleFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole | null;
  churchId: string;
}

export function RoleFormDialog({ open, onOpenChange, role, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("roles.form");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const router = useRouter();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset({ name: role?.name ?? "" });
  }, [open, role?.id, reset]);

  const handleSubmit = (data: RoleFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);

        const result = await saveRoleAction(formData, role?.id, churchId);

        if (result.success) {
          toast.success(role ? t("updated") : t("created"));
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.errorCode ? tr(`errors.${result.errorCode}`) : t("error"));
        }
      } catch (error) {
        console.error("[SAVE_ROLE_ERROR]:", error);
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
          <DialogTitle>{role ? t("editTitle") : t("addTitle")}</DialogTitle>
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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : role ? t("save") : t("create")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}