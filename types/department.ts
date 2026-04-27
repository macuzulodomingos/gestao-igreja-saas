// types/department.ts

export interface DepartmentMember {
  member: { // 👈 reflecte o que o service retorna
    id: string;
    name: string;
    role: { name: string } | null;
  };
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leader: { id: string; name: string; role: { name: string } | null } | null;
  members: DepartmentMember[];
}

export interface DepartmentListMember {
  id: string;
  name: string;
  role: { name: string } | null;
  status: string;
}