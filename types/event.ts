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
  startAt: Date | string;       
  departmentId: string | null;
  department: EventDepartment | null;
  _count: { attendees: number };
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