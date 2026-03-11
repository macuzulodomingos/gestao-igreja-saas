import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, Calendar, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChurchEvent, EventType } from "@/types/event";

const eventTypeLabels: Record<EventType, string> = {
  SERVICO: "Serviço",
  REUNIAO: "Reunião",
  ENSAIO: "Ensaio",
  CONFERENCIA: "Conferência",
  OUTRO: "Outro",
};

const eventTypeColors: Record<EventType, string> = {
  SERVICO: "bg-primary/10 text-primary",
  REUNIAO: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ENSAIO: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONFERENCIA: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  OUTRO: "bg-muted text-muted-foreground",
};

interface EventsListProps {
  events: ChurchEvent[];
  onEdit: (event: ChurchEvent) => void;
  onDelete: (eventId: string) => void;
  onManageAttendance: (event: ChurchEvent) => void;
}

export function EventsList({ events, onEdit, onDelete, onManageAttendance }: EventsListProps) {
  const sorted = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingEvents = sorted.filter(e => !isPast(new Date(e.date)) || isToday(new Date(e.date)));
  const pastEvents = sorted.filter(e => isPast(new Date(e.date)) && !isToday(new Date(e.date)));

  const renderRow = (event: ChurchEvent) => {
    const eventDate = new Date(event.date);
    const isEventToday = isToday(eventDate);
    const isEventPast = isPast(eventDate) && !isEventToday;

    return (
      <TableRow key={event.id} className={isEventPast ? "opacity-60" : ""}>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{event.name}</span>
            {event.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {event.description}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={eventTypeColors[event.type]}>
            {eventTypeLabels[event.type]}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isEventToday ? "font-medium text-primary" : ""}>
              {isEventToday ? "Hoje" : format(eventDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {event.time}
          </div>
        </TableCell>
        <TableCell>
          {event.department
            ? <Badge variant="outline">{event.department.name}</Badge>
            : <span className="text-muted-foreground text-sm">—</span>
          }
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            {event.attendees.length}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onManageAttendance(event)}>
                <Users className="h-4 w-4 mr-2" />
                Presenças
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); onDelete(event.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (eventList: ChurchEvent[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Presenças</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{eventList.map(renderRow)}</TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary">Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Não há eventos futuros agendados.
            </p>
          ) : renderTable(upcomingEvents)}
        </CardContent>
      </Card>

      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">Eventos Passados</CardTitle>
          </CardHeader>
          <CardContent>{renderTable(pastEvents)}</CardContent>
        </Card>
      )}
    </div>
  );
}