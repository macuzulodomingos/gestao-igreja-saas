export type EventType = "SERVICO" | "REUNIAO" | "ENSAIO" | "CONFERENCIA" | "OUTRO";

export interface EventAttendee {
  memberId: string;
}

export interface EventDepartment {
  id: string;
  name: string;
}

export interface ChurchEvent {
  id: string;
  name: string;
  description: string | null;
  type: EventType;
  date: Date;
  time: string;
  departmentId: string | null;
  department: EventDepartment | null;
  attendees: EventAttendee[];
  churchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventListMember {
  id: string;
  name: string;
  role: { name: string } | null;
  status: string;
}

export interface EventListDepartment {
  id: string;
  name: string;
}