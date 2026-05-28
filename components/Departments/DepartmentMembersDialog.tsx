"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2 } from "lucide-react";
import { syncDepartmentMembersAction } from "@/app/actions/department-actions";
import { Department, DepartmentListMember } from "@/types/department";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  allMembers: DepartmentListMember[];
  churchId: string;
}

export function DepartmentMembersDialog({ open, onOpenChange, department, allMembers, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("departments.membersDialog");
  const td = useTranslations("departments.errors");

  useEffect(() => {
    if (open) {
      setSelectedIds(department.members.map(m => m.member.id));
      setSearchTerm("");
    }
  }, [open, department]);

  const activeMembers = allMembers.filter(m => m.status === "ATIVO");

  const filteredMembers = activeMembers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (memberId: string) => {
    setSelectedIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredMembers.map(m => m.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await syncDepartmentMembersAction(department.id, selectedIds, churchId);
      if (result.success) {
        toast.success(t("updated"));
        onOpenChange(false);
      } else {
        const errorCode = (result as any).errorCode;
        toast.error(errorCode ? td(errorCode) : t("error"));
      }
    });
  };

  const allFilteredSelected = filteredMembers.length > 0 &&
    filteredMembers.every(m => selectedIds.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("title")} — {department.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {selectedIds.length} {t("selected")} {activeMembers.length} {t("selectedLabel")}
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
              {allFilteredSelected ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noMembers")}
                </p>
              ) : (
                filteredMembers.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={() => handleToggle(member.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role?.name || t("noRole")}
                      </p>
                    </div>
                    {member.id === department.leaderId && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {t("leader")}
                      </Badge>
                    )}
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}