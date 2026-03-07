// types/department.ts

export interface DepartmentMember {
  memberId: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leader: { id: string; name: string; role: { name: string } | null } | null;
  members: DepartmentMember[];
  churchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentListMember {
  id: string;
  name: string;
  role: { name: string } | null;
  status: string;
}