"use client";
import { useState, useEffect } from "react";
import { Department, members as allMembers } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";

interface DepartmentMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  onSave: (departmentId: string, memberIds: string[]) => void;
}

export function DepartmentMembersDialog({
  open,
  onOpenChange,
  department,
  onSave,
}: DepartmentMembersDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSelectedIds(department.memberIds);
    setSearchTerm("");
  }, [department]);

  const activeMembers = allMembers.filter((m) => m.status === "Activo");
  const filteredMembers = activeMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleMember = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredMembers.map((m) => m.id);
    setSelectedIds((prev) => {
      const allSelected = filteredIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...prev, ...filteredIds])];
    });
  };

  const handleSave = () => {
    onSave(department.id, selectedIds);
  };

  const allFilteredSelected = filteredMembers.every((m) =>
    selectedIds.includes(m.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {department.name} Membros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {selectedIds.length} de {activeMembers.length} selecionados
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {allFilteredSelected ? "Desmarcar tudo" : "Selecionar tudo"}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(member.id)}
                    onCheckedChange={() => handleToggleMember(member.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  {member.id === department.leaderId && (
                    <Badge variant="outline" className="shrink-0">
                      Líder
                    </Badge>
                  )}
                </label>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro encontrado.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Membros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
