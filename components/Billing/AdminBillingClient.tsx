"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ExternalLink, Clock } from "lucide-react";
import { confirmPaymentAction, rejectPaymentAction } from "@/app/actions/billing-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type PendingPayment = {
  id: string;
  churchId: string;
  pendingPlan: string | null;
  pendingCycle: string | null;
  proofOfPayment: string | null;
  proofUploadedAt: Date | string | null;
  church: { name: string; slug: string };
};

export function AdminBillingClient({ pendingPayments }: { pendingPayments: PendingPayment[] }) {
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleConfirm = async (churchId: string) => {
    setProcessing(churchId);
    const result = await confirmPaymentAction(churchId);
    setProcessing(null);
    if (result.success) toast.success("Pagamento confirmado! Plano actualizado.");
    else toast.error(result.error || "Erro ao confirmar.");
  };

  const handleReject = async (churchId: string) => {
    const reason = rejectionReasons[churchId];
    if (!reason?.trim()) {
      toast.error("Indica o motivo da rejeição.");
      return;
    }
    setProcessing(churchId);
    const result = await rejectPaymentAction(churchId, reason);
    setProcessing(null);
    if (result.success) toast.success("Pagamento rejeitado.");
    else toast.error(result.error || "Erro ao rejeitar.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos Pendentes</h1>
        <p className="text-muted-foreground">
          {pendingPayments.length} pedido(s) a aguardar confirmação.
        </p>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum pagamento pendente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {payment.church.name}
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Pendente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plano pedido</p>
                    <p className="font-medium">{payment.pendingPlan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ciclo</p>
                    <p className="font-medium">
                      {payment.pendingCycle === "MONTHLY" ? "Mensal" : "Anual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submetido em</p>
                    <p className="font-medium">
                      {payment.proofUploadedAt
                        ? format(new Date(payment.proofUploadedAt), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comprovativo</p>
                    {payment.proofOfPayment ? (
                      <a  // 👈 adiciona esta linha
                        href={payment.proofOfPayment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        Ver <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">Sem comprovativo</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                    value={rejectionReasons[payment.churchId] || ""}
                    onChange={(e) =>
                      setRejectionReasons((prev) => ({
                        ...prev,
                        [payment.churchId]: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10 gap-2"
                      disabled={processing === payment.churchId}
                      onClick={() => handleReject(payment.churchId)}
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={processing === payment.churchId}
                      onClick={() => handleConfirm(payment.churchId)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}