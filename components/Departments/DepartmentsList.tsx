import { Department, getMemberById, getEventsByDepartment } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, Calendar, UserCircle } from "lucide-react";

interface DepartmentsListProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
  onManageMembers: (department: Department) => void;
}

export function DepartmentsList({
  departments,
  onEdit,
  onDelete,
  onManageMembers,
}: DepartmentsListProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {departments.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          Ainda não existem departamentos criados. Adicione seu primeiro departamento para começar.
        </div>
      ) : (
        departments.map((department) => {
          const leader = department.leaderId ? getMemberById(department.leaderId) : null;
          const events = getEventsByDepartment(department.id);
          const upcomingEvents = events.filter(
            (e) => new Date(e.date) >= new Date()
          );

          return (
            <Card key={department.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{department.name}</CardTitle>
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
                      Gerenciar membros
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(department)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(department.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end space-y-3">
                {leader && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Líder:</span>
                    <span className="font-medium">{leader.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {department.memberIds.length} membros
                    </Badge>
                  </div>
                  {upcomingEvents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {upcomingEvents.length} próximos
                      </Badge>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageMembers(department)}
                  className="w-full mt-2"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar membros
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
