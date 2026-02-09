// app/components/Member/MemberHistoryButton.tsx
"use client";

import { useState } from "react";
import { getMemberHistoryAction } from "@/app/actions/audit";
import { AuditHistory } from "@/components/audit/AuditHistory";
import { AuditLog } from "@prisma/client";

export function MemberHistoryButton({ memberId }: { memberId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
    const result = await getMemberHistoryAction(memberId);
    if (result.success) {
      // O "|| []" resolve o erro do 'undefined'
      // O "as AuditLog[]" resolve a confusão de campos (entity vs entityName)
      setLogs((result.data as AuditLog[]) || []);
    } else {
      setLogs([]); // Limpa se houver erro
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-blue-600 hover:underline"
      >
        Ver Histórico
      </button>

      {/* Modal / Aba Lateral Simples */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Histórico do Membro</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500"
              >
                Fechar
              </button>
            </div>

            {loading ? (
              <p>Carregando histórico...</p>
            ) : (
              <AuditHistory logs={logs} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
