import { UserRole } from "@/app/generated/prisma/enums";



// Mapeamento com a inclusão do SUPER_ADMIN
const roleConfig: Record<UserRole, { label: string; classes: string }> = {
  SUPER_ADMIN: {
    label: "SaaS Owner",
    classes: "bg-purple-100 text-purple-700 border-purple-200 shadow-sm",
  },
  ADMIN: { 
    label: "Administrador", 
    classes: "bg-blue-100 text-blue-700 border-blue-200" 
  },
  TREASURER: { 
    label: "Tesoureiro", 
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  SECRETARY: { 
    label: "Secretário", 
    classes: "bg-amber-100 text-amber-700 border-amber-200" 
  },
  OPERATOR: { 
    label: "Operador", 
    classes: "bg-slate-100 text-slate-700 border-slate-200" 
  },
};

export function RoleBadge({ role }: { role: UserRole | string }) {
  // Garantimos que se o role for inválido ou vazio, caia no OPERATOR
  const config = roleConfig[role as UserRole] || roleConfig.OPERATOR;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border transition-all ${config.classes}`}>
      {config.label}
    </span>
  );
}