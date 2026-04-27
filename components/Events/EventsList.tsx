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
import { isPast, isToday } from "date-fns";
import { ptBR, fr } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { ChurchEvent } from "@/types/event";
import { useTranslations, useLocale } from "next-intl";

const dateLocalesMap = {
  pt: ptBR,
  fr: fr,
};

interface EventsListProps {
  events: ChurchEvent[];
  onEdit: (event: ChurchEvent) => void;
  onDelete: (eventId: string) => void;
  onManageAttendance: (event: ChurchEvent) => void;
  timezone: string;
}

export function EventsList({ events, onEdit, onDelete, onManageAttendance, timezone }: EventsListProps) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  const sorted = [...events].sort((a, b) =>
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  const upcomingEvents = sorted.filter(e => !isPast(new Date(e.startAt)) || isToday(new Date(e.startAt)));
  const pastEvents = sorted.filter(e => isPast(new Date(e.startAt)) && !isToday(new Date(e.startAt)));

  const renderRow = (event: ChurchEvent) => {
    const startAt = new Date(event.startAt);
    const isEventToday = isToday(startAt);
    const isEventPast = isPast(startAt) && !isEventToday;

    const dateFormatted = formatInTimeZone(startAt, timezone, "dd 'de' MMM, yyyy", { locale: dateLocale });
    const timeFormatted = formatInTimeZone(startAt, timezone, "HH:mm");

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
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {event.category.name}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isEventToday ? "font-medium text-primary" : ""}>
              {isEventToday ? t("table.today") : dateFormatted}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {timeFormatted}
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
            {event._count.attendees}
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
                {t("table.attendance")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); onDelete(event.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tc("delete")}
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
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.category")}</TableHead>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead>{t("table.time")}</TableHead>
            <TableHead>{t("table.department")}</TableHead>
            <TableHead>{t("table.attendance")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
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
          <CardTitle className="text-lg text-primary">{t("table.upcoming")}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("table.noUpcoming")}
            </p>
          ) : renderTable(upcomingEvents)}
        </CardContent>
      </Card>

      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">{t("table.past")}</CardTitle>
          </CardHeader>
          <CardContent>{renderTable(pastEvents)}</CardContent>
        </Card>
      )}
    </div>
  );
}