"use client";
import { useState } from "react";
import { EventsList } from "@/components/Events/EventsList";
import { EventFormDialog } from "@/components/Events/EventFormDialog";
import { EventAttendanceDialog } from "@/components/Events/EventAttendanceDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { churchEvents as initialEvents, ChurchEvent } from "@/lib/mock-data";

export default function Events() {
  const [events, setEvents] = useState<ChurchEvent[]>(initialEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<ChurchEvent | null>(null);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: ChurchEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId));
  };

  const handleSaveEvent = (eventData: Omit<ChurchEvent, "id">) => {
    if (editingEvent) {
      setEvents(events.map((e) => (e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e)));
    } else {
      const newEvent: ChurchEvent = {
        ...eventData,
        id: `evt-${Date.now()}`,
      };
      setEvents([newEvent, ...events]);
    }
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleManageAttendance = (event: ChurchEvent) => {
    setSelectedEventForAttendance(event);
    setIsAttendanceOpen(true);
  };

  const handleSaveAttendance = (eventId: string, attendeeIds: string[]) => {
    setEvents(events.map((e) => (e.id === eventId ? { ...e, attendeeIds } : e)));
    setIsAttendanceOpen(false);
    setSelectedEventForAttendance(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Eventos</h1>
            <p className="text-muted-foreground mt-1">Gerencia as atividades da sua igreja e controla a frequência.</p>
          </div>
          <Button onClick={handleAddEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Evento
          </Button>
        </div>

        <EventsList
          events={events}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onManageAttendance={handleManageAttendance}
        />

        <EventFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          event={editingEvent}
          onSave={handleSaveEvent}
        />

        {selectedEventForAttendance && (
          <EventAttendanceDialog
            open={isAttendanceOpen}
            onOpenChange={setIsAttendanceOpen}
            event={selectedEventForAttendance}
            onSave={handleSaveAttendance}
          />
        )}
      </div>
    </>
  );
}
