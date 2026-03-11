export interface MemberRole {
  id: string;
  name: string;
  churchId: string;
  _count?: { members: number };
}