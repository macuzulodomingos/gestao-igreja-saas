import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { MemberRole } from "@/types/role";
import { useTranslations } from "next-intl";

interface Props {
  roles: MemberRole[];
  onEdit: (role: MemberRole) => void;
  onDelete: (id: string) => void;
}

export function RolesList({ roles, onEdit, onDelete }: Props) {
  const t = useTranslations("roles.list");
  const tc = useTranslations("common");

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map(role => (
        <div
          key={role.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">{role.name}</p>
              {role._count && (
                <p className="text-xs text-muted-foreground">
                  {role._count.members} {role._count.members === 1 ? t("member") : t("members")}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(role)}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); onDelete(role.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tc("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}