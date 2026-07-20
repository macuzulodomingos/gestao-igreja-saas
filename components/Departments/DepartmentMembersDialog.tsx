"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2 } from "lucide-react";
import { syncDepartmentMembersAction } from "@/app/actions/department-actions";
import { searchActiveMembersAction } from "@/app/actions/member-actions";
import { Department } from "@/types/department";
import { MemberSearchResult } from "@/types/member";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useDebounce } from "@/hooks/use-debounce";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  totalActiveMembers: number;
  churchId: string;
}

export function DepartmentMembersDialog({ open, onOpenChange, department, totalActiveMembers, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [knownMembers, setKnownMembers] = useState<Map<string, MemberSearchResult>>(new Map());
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const t = useTranslations("departments.membersDialog");
  const td = useTranslations("departments.errors");
  const router = useRouter();

  // Popula selecionados e mapa de "conhecidos" a partir dos membros já
  // vinculados ao departamento — esses dados já vêm com nome/role.
  useEffect(() => {
    if (!open) return;
    const initialSelected = department.members.map(m => m.member.id);
    const initialKnown = new Map(department.members.map(m => [m.member.id, m.member]));
    setSelectedIds(initialSelected);
    setKnownMembers(initialKnown);
    setSearchTerm("");
    setSearchResults([]);
    setInitialLoadDone(true);
  }, [open, department.id]);

  // Busca assíncrona conforme o utilizador digita
  useEffect(() => {
    if (!open || !initialLoadDone) return;
    let cancelled = false;
    setLoadingSearch(true);

    searchActiveMembersAction(debouncedSearch, churchId)
      .then(result => {
        if (cancelled) return;
        if (result.success) {
          setSearchResults(result.data);
          setKnownMembers(prev => {
            const next = new Map(prev);
            result.data.forEach(m => next.set(m.id, m));
            return next;
          });
        }
      })
      .catch((error) => {
        console.error("[SEARCH_MEMBERS_ERROR]:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingSearch(false);
      });

    return () => { cancelled = true; };
  }, [debouncedSearch, open, initialLoadDone, churchId]);

  // Lista exibida: resultados da busca atual + selecionados que não
  // apareceram nesses resultados (para não "sumirem" da tela).
  const displayedMembers = useMemo(() => {
    const searchIds = new Set(searchResults.map(m => m.id));
    const selectedNotInSearch = selectedIds
      .filter(id => !searchIds.has(id))
      .map(id => knownMembers.get(id))
      .filter((m): m is MemberSearchResult => !!m);
    return [...selectedNotInSearch, ...searchResults];
  }, [searchResults, selectedIds, knownMembers]);

  const handleToggle = (memberId: string) => {
    setSelectedIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = displayedMembers.map(m => m.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await syncDepartmentMembersAction(department.id, selectedIds, churchId);
        if (result.success) {
          toast.success(t("updated"));
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.errorCode ? td(result.errorCode) : t("error"));
        }
      } catch (error) {
        console.error("[SYNC_DEPARTMENT_MEMBERS_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  const allVisibleSelected = displayedMembers.length > 0 &&
    displayedMembers.every(m => selectedIds.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isPending) return;
      onOpenChange(isOpen);
      if (!isOpen) setInitialLoadDone(false);
    }}>
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
              {selectedIds.length} {t("selectedLabel")} {totalActiveMembers} {t("selectedLabel")}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllVisible}
              disabled={displayedMembers.length === 0}
            >
              {allVisibleSelected ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {loadingSearch && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingSearch && displayedMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noMembers")}
                </p>
              ) : (
                displayedMembers.map(member => (
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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