"use client";

import { useState } from "react";
import { EventsList } from "./EventsList";
import { EventFormDialog } from "./EventFormDialog";
import { EventAttendanceDialog } from "./EventAttendanceDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteEventAction } from "@/app/actions/event-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChurchEvent, EventCategory, EventListMember, EventListDepartment } from "@/types/event";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useTranslations } from "next-intl";

interface EventsClientProps {
  initialEvents: ChurchEvent[];
  members: EventListMember[];
  departments: EventListDepartment[];
  categories: EventCategory[];
  timezone: string;
}

export default function EventsClient({
  initialEvents,
  members,
  departments,
  categories,
  timezone,
}: EventsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ChurchEvent | null>(null);
  const upgrade = useUpgradeModal();
  const t = useTranslations("events");

  const handleAdd = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const event = initialEvents.find(e => e.id === id);
    if (event) setEventToDelete(event);
  };

  const handleManageAttendance = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsAttendanceOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    const result = await deleteEventAction(eventToDelete.id);
    if (result.success) toast.success(t("successDeleted"));
    else toast.error(result.error || t("errorDelete"));
    setEventToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addEvent")}
        </Button>
      </div>

      <EventsList
        events={initialEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageAttendance={handleManageAttendance}
        timezone={timezone}
      />

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        event={editingEvent}
        departments={departments}
        categories={categories}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      {selectedEvent && (
        <EventAttendanceDialog
          open={isAttendanceOpen}
          onOpenChange={setIsAttendanceOpen}
          event={selectedEvent}
          allMembers={members}
          timezone={timezone}
        />
      )}

      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
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
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("confirm")}
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