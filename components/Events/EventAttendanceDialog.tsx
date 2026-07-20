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
import { getEventAttendeesAction, syncAttendeesAction } from "@/app/actions/event-actions";
import { searchActiveMembersAction } from "@/app/actions/member-actions";
import { ChurchEvent, AttendeeMember } from "@/types/event";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR, fr } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { parseISO, isValid } from "date-fns";
import { useRouter } from "@/i18n/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { dateLocalesMap } from "@/lib/date";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent;
  timezone: string;
  churchId: string;
}

export function EventAttendanceDialog({ open, onOpenChange, event, timezone, churchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Guarda os dados (nome/role) de todo membro já "visto" — vindo dos
  // presentes carregados no início OU de qualquer resultado de busca.
  // Isso permite mostrar quem já está marcado mesmo que a busca atual
  // não o traga de volta.
  const [knownMembers, setKnownMembers] = useState<Map<string, AttendeeMember>>(new Map());
  const [searchResults, setSearchResults] = useState<AttendeeMember[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const t = useTranslations("events.attendance");
  const te = useTranslations("events.errors");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? dateLocalesMap.pt;
  const dateFormatPattern = locale === "fr" ? "dd MMM yyyy" : "dd 'de' MMM, yyyy";
  const router = useRouter();

  const startAt = typeof event.startAt === "string" ? parseISO(event.startAt) : event.startAt;
  const isStartAtValid = isValid(startAt);

  // Carrega presenças já marcadas, com nomes, quando o dialog abre
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSearchTerm("");
    setSearchResults([]);
    setLoadError(false);
    setLoadingInitial(true);

    getEventAttendeesAction(event.id, churchId)
      .then(result => {
        if (cancelled) return;
        if (result.success) {
          setSelectedIds(result.attendees.map(a => a.id));
          setKnownMembers(new Map(result.attendees.map(a => [a.id, a])));
        } else if (result.errorCode === "unauthorized") {
          router.push("/login");
        } else {
          setLoadError(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[LOAD_ATTENDEES_ERROR]:", error);
        setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });

    return () => { cancelled = true; };
  }, [open, event.id, churchId, router]);

  // Busca assíncrona conforme o utilizador digita
  useEffect(() => {
    if (!open || loadingInitial) return;
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
  }, [debouncedSearch, open, loadingInitial, churchId]);

  // Lista exibida: resultados da busca atual + quaisquer já selecionados
  // que não apareceram nesses resultados (para não "sumir" da tela).
  const displayedMembers = useMemo(() => {
    const searchIds = new Set(searchResults.map(m => m.id));
    const selectedNotInSearch = selectedIds
      .filter(id => !searchIds.has(id))
      .map(id => knownMembers.get(id))
      .filter((m): m is AttendeeMember => !!m);
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
        const result = await syncAttendeesAction(event.id, selectedIds, churchId);
        if (result.success) {
          toast.success(t("updated"));
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.errorCode ? te(result.errorCode) : t("error"));
        }
      } catch (error) {
        console.error("[SYNC_ATTENDEES_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  const isLoading = loadingInitial;
  const allVisibleSelected = displayedMembers.length > 0 &&
    displayedMembers.every(m => selectedIds.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isPending) return;
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{event.name}</span>
            <span className="mx-2">•</span>
            {isStartAtValid && formatInTimeZone(startAt, timezone, dateFormatPattern, { locale: dateLocale })}
            {` ${t("at")} `}
            {isStartAtValid && formatInTimeZone(startAt, timezone, "HH:mm")}
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
              disabled={isLoading || loadError}
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {selectedIds.length} {t("present")}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllVisible}
              disabled={isLoading || loadError || displayedMembers.length === 0}
            >
              {allVisibleSelected ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-center text-destructive text-sm">
                  {t("errorLoadAttendees")}
                </p>
              </div>
            ) : (
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
                    </label>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading || loadError}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}