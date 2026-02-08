// app/components/Member/MemberHistorySheet.tsx
"use client";

import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger // Adicione este import
} from "@/components/ui/sheet";
import { getMemberHistoryAction } from "@/app/actions/audit";
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
    // Este log TEM que aparecer no console do NAVEGADOR (F12)
    console.log("Iniciando busca de logs para ID:", member.id); 
    
    const result = await getMemberHistoryAction(member.id);
    
    if (result.success) {
      setLogs(result.data || []);
    }
    setLoading(false);
  }

  return (
    <Sheet 
      open={open} 
      onOpenChange={(val) => {
        setOpen(val);
        if (val) {
          loadHistory();
        }
      }}
    >
      {/* MUDANÇA AQUI: Usamos o SheetTrigger asChild. 
         Isso faz com que o seu DropdownMenuItem funcione como o botão da Sheet.
      */}
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      
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