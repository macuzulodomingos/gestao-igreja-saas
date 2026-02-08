// app/components/members/MemberHistorySheet.tsx
"use client";

import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { getMemberHistoryAction } from "@/app/actions/audit"; // Certifique-se de criar esta action
import { AuditHistory } from "@/components/audit/AuditHistory";
import { Loader2, History } from "lucide-react";

interface MemberHistorySheetProps {
  member: any;
  trigger: React.ReactNode;
}

export function MemberHistorySheet({ member, trigger }: MemberHistorySheetProps) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function loadHistory() {
    setLoading(true);
    const result = await getMemberHistoryAction(member.id);
    if (result.success) {
      setLogs(result.data);
    }
    setLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) loadHistory();
    }}>
      {/* O gatilho será o item do Dropdown que você já tem */}
      <div onClick={() => setOpen(true)} className="w-full cursor-pointer">
        {trigger}
      </div>
      
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de {member.name}
          </SheetTitle>
          <SheetDescription>
            Rastreio completo de alterações feitas neste registro.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Carregando linha do tempo...</p>
          </div>
        ) : (
          <AuditHistory logs={logs} />
        )}
      </SheetContent>
    </Sheet>
  );
}