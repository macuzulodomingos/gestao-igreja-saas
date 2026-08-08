"use client";

import { useEffect, useState, useTransition } from "react";
import { EventsList } from "./EventsList";
import { EventFormDialog } from "./EventFormDialog";
import { EventAttendanceDialog } from "./EventAttendanceDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEventAction } from "@/app/actions/event-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChurchEvent, EventCategory, EventListMember, EventListDepartment } from "@/types/event";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { getMonthNames } from "@/lib/date";
import { useLocale } from "next-intl";

interface EventsClientProps {
  initialEvents: ChurchEvent[];
  departments: EventListDepartment[];
  categories: EventCategory[];
  timezone: string;
  churchId: string;
  currentMonth: number;
  currentYear: number;
}

export default function EventsClient({
  initialEvents,
  departments,
  categories,
  timezone,
  churchId,
  currentMonth,
  currentYear,
}: EventsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ChurchEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [isPendingNav, startNavTransition] = useTransition();
  const upgrade = useUpgradeModal();
  const t = useTranslations("events");
  const te = useTranslations("events.errors");

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const navigateToMonth = (month: number, year: number) => {
    startNavTransition(() => {
      router.push(`${pathname}?month=${month}&year=${year}`, { scroll: false });
    });
  };

  const nowYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => nowYear - 5 + i);
  const monthNames = getMonthNames(useLocale()); // 👈 reutiliza o utilitário que já criamos em @/lib/date

  const handleAdd = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event) setEventToDelete(event);
  };

  const handleManageAttendance = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsAttendanceOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete || isDeleting) return;
    setIsDeleting(true);
    const targetId = eventToDelete.id;
    try {
      const result = await deleteEventAction(targetId, churchId);
      if (result.success) {
        toast.success(t("successDeleted"));
        setEvents(prev => prev.filter(e => e.id !== targetId));
        router.refresh();
      } else {
        toast.error(result.errorCode ? te(result.errorCode) : t("errorDelete"));
      }
    } catch (error) {
      console.error("[DELETE_EVENT_ERROR]:", error);
      toast.error(t("errorDelete"));
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(currentMonth)}
            onValueChange={(val) => navigateToMonth(Number(val), currentYear)}
            disabled={isPendingNav}
          >
            <SelectTrigger className="w-32.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(currentYear)}
            onValueChange={(val) => navigateToMonth(currentMonth, Number(val))}
            disabled={isPendingNav}
          >
            <SelectTrigger className="w-22.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addEvent")}
          </Button>
        </div>
      </div>

      <EventsList
        events={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageAttendance={handleManageAttendance}
        timezone={timezone}
      />

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent}
        departments={departments}
        categories={categories}
        churchId={churchId}
        timezone={timezone}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      {selectedEvent && (
        <EventAttendanceDialog
          open={isAttendanceOpen}
          onOpenChange={(open) => {
            setIsAttendanceOpen(open);
            if (!open) setSelectedEvent(null);
          }}
          event={selectedEvent}
          timezone={timezone}
          churchId={churchId}
        />
      )}

      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && !isDeleting && setEventToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")}{" "}
              <strong>{eventToDelete?.name}</strong>?{" "}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        open={upgrade.isOpen}
        onOpenChange={upgrade.onOpenChange}
        limitMessage={upgrade.message}
      />
    </div>
  );
}