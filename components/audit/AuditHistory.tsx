// components/audit/AuditHistory.tsx
import { Prisma } from "@/app/generated/prisma";

interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  userEmail: string | null;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  createdAt: Date | string;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  role: "Cargo",
  status: "Status",
  joinDate: "Data de Ingresso",
  description: "Descrição",
  amount: "Valor",
  type: "Tipo",
  date: "Data",
  category: "Categoria",
  leaderId: "Líder",
  memberIds: "Membros",
  time: "Hora",
};

const IGNORED_FIELDS = [
  "id", "churchId", "updatedAt", "createdAt",
  "roleId", "categoryId", "departmentId", "leaderId",
];

function formatValue(key: string, value: Prisma.JsonValue): string {
  if (value === null || value === undefined) return "vazio";

  // Objectos (ex: role: { id, name }, category: { id, name })
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, Prisma.JsonValue>;
    if (obj.name) return String(obj.name);
    return JSON.stringify(obj);
  }

  // Arrays (ex: memberIds: [...])
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} item(s)` : "vazio";
  }

  // Datas
  if ((key === "joinDate" || key === "date") && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString("pt-BR");
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getDiff(oldData: Prisma.JsonValue, newData: Prisma.JsonValue) {
  if (
    !oldData ||
    !newData ||
    typeof oldData !== "object" ||
    Array.isArray(oldData)
  ) {
    return null;
  }

  const oldObj = oldData as Record<string, Prisma.JsonValue>;
  const newObj = newData as Record<string, Prisma.JsonValue>;
  const diff: Record<string, { old: Prisma.JsonValue; new: Prisma.JsonValue }> = {};

  Object.keys(newObj).forEach((key) => {
    if (IGNORED_FIELDS.includes(key)) return;

    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff[key] = {
        old: oldObj[key],
        new: newObj[key],
      };
    }
  });

  return diff;
}

export function AuditHistory({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Linha do Tempo</h3>

      <div className="flex flex-col gap-4">
        {logs.length === 0 && (
          <p className="text-muted-foreground text-sm italic">
            Nenhuma alteração registrada.
          </p>
        )}

        {logs.map((log) => {
          const diff = getDiff(log.oldData, log.newData);

          return (
            <div key={log.id} className="p-4 bg-card border rounded-lg shadow-sm text-sm">
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    log.action.includes("CREATE")
                      ? "bg-green-100 text-green-700"
                      : log.action.includes("DELETE")
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {log.action
                    .replace("_MEMBER", "")
                    .replace("_EVENT", "")
                    .replace("_DEPARTMENT", "")
                    .replace("_CATEGORY", "")
                    .replace("_ROLE", "")
                    .replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Alterado por:{" "}
                <span className="font-medium text-foreground">
                  {log.userEmail || "Sistema"}
                </span>
              </p>

              <div className="space-y-2">
                {/* Criação */}
                {log.action.includes("CREATE") && log.newData && (
                  <div className="grid grid-cols-1 gap-1 text-xs bg-green-50/50 p-2 rounded border border-green-100">
                    {Object.entries(log.newData as object).map(([k, v]) => {
                      if (IGNORED_FIELDS.includes(k)) return null;
                      return (
                        <div key={k}>
                          <span className="font-semibold text-green-800">
                            {FIELD_LABELS[k] || k}:
                          </span>{" "}
                          {formatValue(k, v)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Edição */}
                {log.action.includes("UPDATE") && diff && Object.keys(diff).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(diff).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100"
                      >
                        <span className="font-bold w-24 truncate text-gray-500 uppercase">
                          {FIELD_LABELS[key] || key}:
                        </span>
                        <span className="text-red-500 line-through truncate max-w-[120px]">
                          {formatValue(key, value.old)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-medium truncate">
                          {formatValue(key, value.new)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : log.action.includes("UPDATE") && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Campos técnicos actualizados.
                  </p>
                )}

                {/* Eliminação */}
                {log.action.includes("DELETE") && (
                  <p className="text-xs text-red-600 font-medium">
                    O registro foi removido permanentemente.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}