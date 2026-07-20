"use client";

import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import { getMemberHistoryAction } from "@/app/actions/audit-actions";
import { AuditHistory } from "@/components/audit/AuditHistory";
import { Loader2, History, AlertCircle } from "lucide-react";
import { Member } from "@/types/member";
import { AuditLog } from "@/types/audit";
import { useTranslations } from "next-intl";

interface MemberHistorySheetProps {
  member: Member;
  trigger: React.ReactNode;
}

export function MemberHistorySheet({ member, trigger }: MemberHistorySheetProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const t = useTranslations("members");
  const tm = useTranslations("members.errors");


  async function loadHistory() {
    setLoading(true);
    setErrorKey(null);
    setLogs([]);
    try {
      const result = await getMemberHistoryAction(member.id);
      if (result.success) {
        setLogs(result.data);
      } else {
        setErrorKey(result.errorCode ?? "errorLoad");
      }
    } catch (error) {
      console.error("[LOAD_MEMBER_HISTORY_ERROR]:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val) loadHistory();
      }}
    >
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("historyTitle")} {member.name}
          </SheetTitle>
          <SheetDescription>
            {t("historyDesc")}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>{t("historyLoading")}</p>
          </div>
        ) : errorKey ? (
          <div className="flex flex-col items-center justify-center py-20 text-destructive text-center gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">
              {errorKey === "unauthorized" ? tm("unauthorizedError") : tm("loadError")}
            </p>
          </div>
        ) : (
          <AuditHistory logs={logs} />
        )}
      </SheetContent>
    </Sheet>
  );
}