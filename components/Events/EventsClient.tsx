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

interface EventsClientProps {
  initialEvents: ChurchEvent[];
  members: EventListMember[];
  departments: EventListDepartment[];
  categories: EventCategory[]; // 👈 NOVO
  timezone: string; // 👈 NOVO
}

export default function EventsClient({
  initialEvents,
  members,
  departments,
  categories, // 👈 NOVO
  timezone, // 👈 NOVO
}: EventsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ChurchEvent | null>(null);

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
    if (result.success) toast.success("Evento eliminado!");
    else toast.error(result.error || "Erro ao eliminar.");
    setEventToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground mt-1">
            Gere as actividades da sua igreja e controla a frequência.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Evento
        </Button>
      </div>

      <EventsList
        events={initialEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageAttendance={handleManageAttendance}
        timezone={timezone} // 👈 NOVO
      />

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        event={editingEvent}
        departments={departments}
        categories={categories} // 👈 NOVO
      />

      {selectedEvent && (
        <EventAttendanceDialog
          open={isAttendanceOpen}
          onOpenChange={setIsAttendanceOpen}
          event={selectedEvent}
          allMembers={members}
          timezone={timezone} // 👈 NOVO
        />
      )}

      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente eliminar o evento{" "}
              <strong>{eventToDelete?.name}</strong>?{" "}
              Esta acção é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Confirmar Eliminação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}