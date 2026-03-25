"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitMessage: string;
}

const PRO_FEATURES = [
  "Até 500 membros",
  "Até 5 utilizadores",
  "Departamentos ilimitados",
  "Eventos ilimitados",
  "Transacções ilimitadas",
  "Exportação PDF",
  "Exportação de dados",
  "Suporte por email",
];

const ENTERPRISE_FEATURES = [
  "Membros ilimitados",
  "Utilizadores ilimitados",
  "Todas as funcionalidades PRO",
  "Suporte prioritário",
  "Acesso à API",
];

export function UpgradeModal({ open, onOpenChange, limitMessage }: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = (plan: "PRO" | "ENTERPRISE") => {
    onOpenChange(false);
    router.push(`/billing?plan=${plan}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-primary" />
            Actualize o seu plano
          </DialogTitle>
          <DialogDescription className="text-base">
            {limitMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* PRO */}
          <div className="rounded-lg border-2 border-primary p-5 space-y-4 relative">
            <Badge className="absolute -top-3 left-4 bg-primary">
              Mais popular
            </Badge>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">PRO</h3>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleUpgrade("PRO")}
            >
              Upgrade para PRO
            </Button>
          </div>

          {/* ENTERPRISE */}
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-lg">ENTERPRISE</h3>
            </div>
            <ul className="space-y-2">
              {ENTERPRISE_FEATURES.map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleUpgrade("ENTERPRISE")}
            >
              Contactar vendas
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Sem compromisso. Cancele quando quiser.
        </p>
      </DialogContent>
    </Dialog>
  );
}