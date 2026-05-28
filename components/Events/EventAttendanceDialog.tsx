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
import { getEventAttendeesAction, syncAttendeesAction } from "@/app/actions/event-actions";
import { ChurchEvent, EventListMember } from "@/types/event";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR, fr } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

const dateLocalesMap = {
  pt: ptBR,
  fr: fr,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent;
  allMembers: EventListMember[];
  timezone: string;
  churchId: string;
}

export function EventAttendanceDialog({ open, onOpenChange, event, allMembers, timezone, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false); // 👈
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("events.attendance");
  const te = useTranslations("events.errors");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setLoadError(false); // 👈 reset ao abrir
      setLoading(true);
      getEventAttendeesAction(event.id, churchId).then(result => {
        if (result.success) {
          setSelectedIds(result.memberIds);
        } else if (result.errorCode === "unauthorized") {
          window.location.href = "/login"; // 👈 redireciona
        } else {
          setLoadError(true); // 👈 bloqueia em vez de toast
        }
        setLoading(false);
      });
    }
  }, [open, event.id]);

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
      const result = await syncAttendeesAction(event.id, selectedIds, churchId);
      if (result.success) {
        toast.success(t("updated"));
        onOpenChange(false);
      } else {
        toast.error(result.errorCode ? te(result.errorCode) : t("error"));
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
            {t("title")}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{event.name}</span>
            <span className="mx-2">•</span>
            {formatInTimeZone(new Date(event.startAt), timezone, "dd 'de' MMM, yyyy", { locale: dateLocale })}
            {` ${t("at")} `}
            {formatInTimeZone(new Date(event.startAt), timezone, "HH:mm")}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading || loadError} // 👈
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {selectedIds.length} {t("present")} {activeMembers.length} {t("presentLabel")}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading || loadError} // 👈
            >
              {allFilteredSelected ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {/* 👈 loading state */}
            {loading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : loadError ? ( // 👈 erro state
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-center text-destructive text-sm">
                  {t("errorLoadAttendees")}
                </p>
              </div>
            ) : (
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
                    </label>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || loading || loadError} // 👈 bloqueia save
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}