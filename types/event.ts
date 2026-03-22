export interface EventCategory {
  id: string;
  name: string;
}

export interface EventAttendee {
  member: { id: string; name: string }; // 👈 reflecte o que o service retorna
}

export interface EventDepartment {
  id: string;
  name: string;
}

export interface ChurchEvent {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;           // 👈 substitui type
  category: EventCategory;      // 👈 novo
  startAt: Date;        // 👈 substitui date + time
  departmentId: string | null;
  department: EventDepartment | null;
  attendees: EventAttendee[];
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