import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, UserCircle } from "lucide-react";
import { Department } from "@/types/department";
import { useTranslations } from "next-intl";

interface DepartmentsListProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
  onManageMembers: (department: Department) => void;
}

export function DepartmentsList({ departments, onEdit, onDelete, onManageMembers }: DepartmentsListProps) {
  const t = useTranslations("departments.list");
  const tc = useTranslations("common");

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {departments.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        departments.map(department => (
          <Card key={department.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-lg text-primary truncate">{department.name}</CardTitle>
                {department.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {department.description}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onManageMembers(department)}>
                    <Users className="h-4 w-4 mr-2" />
                    {t("manageMembers")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(department)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {tc("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={e => { e.preventDefault(); onDelete(department.id); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tc("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end space-y-3">
              {department.leader ? (
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("leader")}:</span>
                  <span className="font-medium">{department.leader.name}</span>
                  {department.leader.role && (
                    <Badge variant="secondary" className="text-xs">
                      {department.leader.role.name}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                  <span>{t("noLeader")}</span>
                </div>
              )}

              <Badge variant="secondary" className="gap-1 w-fit">
                <Users className="h-3 w-3" />
                {department.members.length}{" "}
                {department.members.length === 1 ? t("member") : t("members")}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageMembers(department)}
                className="w-full mt-2"
              >
                <Users className="h-4 w-4 mr-2" />
                {t("manageMembers")}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}