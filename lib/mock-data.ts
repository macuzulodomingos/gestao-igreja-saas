// Mock data for Church Management Dashboard
// Structured to easily swap for real API data later

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Membro" | "Díacono" | "Ancião" | "Pastor" | "Voluntário";
  joinDate: string;
  avatar?: string;
  status: "Active" | "Inactive";
  departmentIds?: string[];
}

export interface Transaction {
  id: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  type: "Tithe" | "Offering" | "Donation" | "Other";
  amount: number;
  description?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: "Rent" | "Utilities" | "Maintenance" | "Supplies" | "Salaries" | "Other";
  amount: number;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  leaderId?: string;
  description?: string;
  memberIds: string[];
}

export interface ChurchEvent {
  id: string;
  name: string;
  type: "Serviço" | "Reunião" | "Ensaio" | "Conferência" | "Outro";
  date: string;
  time: string;
  departmentId?: string;
  description?: string;
  attendeeIds: string[];
}

export interface ChurchInfo {
  name: string;
  plan: "Basic" | "Standard" | "Premium";
  memberCount: number;
  foundedYear: number;
}

export interface MonthlyData {
  month: string;
  members: number;
  income: number;
  expenses: number;
}

// Church Information
export const churchInfo: ChurchInfo = {
  name: "Grace Community Church",
  plan: "Standard",
  memberCount: 342,
  foundedYear: 1985,
};

// Stats Data
export const statsData = {
  totalMembers: 342,
  memberGrowth: 12,
  eventsThisMonth: 8,
  nextEvent: "Sunday Service",
  monthlyBalance: 15420,
  balanceTrend: 8.2,
  planStatus: "Active",
  planRenewal: "Dec 15, 2026",
};

// Departments Data
export const departments: Department[] = [
  {
    id: "dept-1",
    name: "Ministério de Adoração",
    leaderId: "6",
    description: "Liderar a congregação em adoração através da música e do louvor.",
    memberIds: ["1", "3", "7"],
  },
  {
    id: "dept-2",
    name: "Ministério Juvenil",
    leaderId: "2",
    description: "Envolver e discipular jovens.",
    memberIds: ["3", "4", "8"],
  },
  {
    id: "dept-3",
    name: "Escola Dominical",
    leaderId: "1",
    description: "Ensinar e educar as crianças na fé.",
    memberIds: ["3", "7"],
  },
  {
    id: "dept-4",
    name: "Ministério de Extensão",
    leaderId: "2",
    description: "Programas de serviço comunitário e evangelização.",
    memberIds: ["1", "4", "5", "8"],
  },
  {
    id: "dept-5",
    name: "Ministério de Intercessão",
    leaderId: "6",
    description: "Oração intercessória e apoio espiritual.",
    memberIds: ["1", "2", "6"],
  },
];

// Members Data
export const members: Member[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    role: "Ancião",
    joinDate: "2024-01-15",
    status: "Activo",
    departmentIds: ["dept-1", "dept-3", "dept-4", "dept-5"],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "(555) 234-5678",
    role: "Diácono",
    joinDate: "2024-02-20",
    status: "Activo",
    departmentIds: ["dept-2", "dept-4", "dept-5"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    phone: "(555) 345-6789",
    role: "Voluntário",
    joinDate: "2024-03-10",
    status: "Activo",
    departmentIds: ["dept-1", "dept-2", "dept-3"],
  },
  {
    id: "4",
    name: "David Williams",
    email: "d.williams@email.com",
    phone: "(555) 456-7890",
    role: "Membro",
    joinDate: "2024-04-05",
    status: "Activo",
    departmentIds: ["dept-2", "dept-4"],
  },
  {
    id: "5",
    name: "Jessica Brown",
    email: "j.brown@email.com",
    phone: "(555) 567-8901",
    role: "Membro",
    joinDate: "2024-05-18",
    status: "Inactivo",
    departmentIds: ["dept-4"],
  },
  {
    id: "6",
    name: "Robert Taylor",
    email: "r.taylor@email.com",
    phone: "(555) 678-9012",
    role: "Pastor",
    joinDate: "2020-06-01",
    status: "Activo",
    departmentIds: ["dept-1", "dept-5"],
  },
  {
    id: "7",
    name: "Amanda Martinez",
    email: "a.martinez@email.com",
    phone: "(555) 789-0123",
    role: "Voluntário",
    joinDate: "2024-06-22",
    status: "Activo",
    departmentIds: ["dept-1", "dept-3"],
  },
  {
    id: "8",
    name: "Christopher Lee",
    email: "c.lee@email.com",
    phone: "(555) 890-1234",
    role: "Membro",
    joinDate: "2024-07-14",
    status: "Activo",
    departmentIds: ["dept-2", "dept-4"],
  },
];

// Recent Transactions (legacy format for dashboard)
export const transactions: Transaction[] = [
  {
    id: "1",
    type: "Income",
    category: "Tithes",
    amount: 5200,
    description: "Sunday offering collection",
    date: "2026-01-12",
  },
  {
    id: "2",
    type: "Expense",
    category: "Utilities",
    amount: 850,
    description: "Electricity bill - January",
    date: "2026-01-10",
  },
  {
    id: "3",
    type: "Income",
    category: "Donations",
    amount: 1500,
    description: "Building fund donation",
    date: "2026-01-08",
  },
  {
    id: "4",
    type: "Expense",
    category: "Supplies",
    amount: 320,
    description: "Office supplies",
    date: "2026-01-05",
  },
  {
    id: "5",
    type: "Income",
    category: "Events",
    amount: 800,
    description: "Youth retreat registration",
    date: "2026-01-03",
  },
];

// Income Entries
export const incomeEntries: IncomeEntry[] = [
  { id: "inc-1", date: "2026-01-12", type: "Dízimo", amount: 3200, description: "Sunday morning tithe" },
  { id: "inc-2", date: "2026-01-12", type: "Ofrta", amount: 2000, description: "Sunday offering" },
  { id: "inc-3", date: "2026-01-08", type: "Doação", amount: 1500, description: "Building fund donation" },
  { id: "inc-4", date: "2026-01-05", type: "Dízimo", amount: 2800, description: "Midweek tithe" },
  { id: "inc-5", date: "2026-01-03", type: "Outro", amount: 800, description: "Youth retreat registration" },
  { id: "inc-6", date: "2025-12-29", type: "Dízimo", amount: 4200, description: "End of year tithe" },
  { id: "inc-7", date: "2025-12-22", type: "Doação", amount: 5000, description: "Christmas offering" },
  { id: "inc-8", date: "2025-12-15", type: "Oferta", amount: 2200, description: "Sunday offering" },
];

// Expense Entries
export const expenseEntries: ExpenseEntry[] = [
  { id: "exp-1", date: "2026-01-10", category: "Utilities", amount: 850, description: "Electricity bill" },
  { id: "exp-2", date: "2026-01-08", category: "Utilities", amount: 120, description: "Water bill" },
  { id: "exp-3", date: "2026-01-05", category: "Supplies", amount: 320, description: "Office supplies" },
  { id: "exp-4", date: "2026-01-03", category: "Maintenance", amount: 450, description: "HVAC service" },
  { id: "exp-5", date: "2025-12-28", category: "Rent", amount: 2500, description: "Monthly rent" },
  { id: "exp-6", date: "2025-12-20", category: "Salaries", amount: 4500, description: "Staff salaries" },
  { id: "exp-7", date: "2025-12-15", category: "Supplies", amount: 280, description: "Cleaning supplies" },
  { id: "exp-8", date: "2025-12-10", category: "Other", amount: 650, description: "Christmas decorations" },
];

// Church Events
export const churchEvents: ChurchEvent[] = [
  {
    id: "evt-1",
    name: "Sunday Morning Service",
    type: "Serviço",
    date: "2026-01-19",
    time: "10:00",
    departmentId: "dept-1",
    description: "Regular Sunday morning worship service.",
    attendeeIds: ["1", "2", "3", "4", "6", "7", "8"],
  },
  {
    id: "evt-2",
    name: "Youth Group Meeting",
    type: "Reunião",
    date: "2026-01-21",
    time: "18:30",
    departmentId: "dept-2",
    description: "Weekly youth gathering with games and Bible study.",
    attendeeIds: ["3", "4", "8"],
  },
  {
    id: "evt-3",
    name: "Wednesday Bible Study",
    type: "Reunião",
    date: "2026-01-22",
    time: "19:00",
    description: "Midweek Bible study and prayer meeting.",
    attendeeIds: ["1", "2", "6"],
  },
  {
    id: "evt-4",
    name: "Choir Rehearsal",
    type: "Ensaio",
    date: "2026-01-23",
    time: "19:00",
    departmentId: "dept-1",
    description: "Weekly choir practice for Sunday worship.",
    attendeeIds: ["1", "3", "7"],
  },
  {
    id: "evt-5",
    name: "Children's Sunday School",
    type: "Serviço",
    date: "2026-01-19",
    time: "10:00",
    departmentId: "dept-3",
    description: "Sunday school for children ages 4-11.",
    attendeeIds: ["3", "7"],
  },
  {
    id: "evt-6",
    name: "Community Outreach",
    type: "Outro",
    date: "2026-01-25",
    time: "09:00",
    departmentId: "dept-4",
    description: "Volunteering at the local food bank.",
    attendeeIds: ["1", "2", "4", "8"],
  },
  {
    id: "evt-7",
    name: "Prayer Breakfast",
    type: "Reunião",
    date: "2026-01-18",
    time: "07:00",
    departmentId: "dept-5",
    description: "Monthly prayer and fellowship breakfast.",
    attendeeIds: ["1", "2", "6"],
  },
  {
    id: "evt-8",
    name: "Annual Church Conference",
    type: "Conferência",
    date: "2026-02-15",
    time: "09:00",
    description: "Annual church business meeting and vision casting.",
    attendeeIds: [],
  },
];

// Monthly Data for Charts
export const monthlyData: MonthlyData[] = [
  { month: "Jan", members: 285, income: 12500, expenses: 9800 },
  { month: "Fev", members: 292, income: 13200, expenses: 10200 },
  { month: "Mar", members: 298, income: 11800, expenses: 9500 },
  { month: "Abr", members: 305, income: 14500, expenses: 11000 },
  { month: "Mai", members: 312, income: 13800, expenses: 10800 },
  { month: "Jun", members: 318, income: 15200, expenses: 11500 },
  { month: "Jul", members: 322, income: 14000, expenses: 10200 },
  { month: "Ago", members: 328, income: 13500, expenses: 10800 },
  { month: "Set", members: 332, income: 16000, expenses: 12000 },
  { month: "Out", members: 335, income: 14800, expenses: 11200 },
  { month: "Nov", members: 338, income: 15500, expenses: 11800 },
  { month: "Dez", members: 342, income: 17200, expenses: 12500 },
];

// User roles for the system
export type UserRole = "Admin" | "Pastor" | "Secretary";

export const currentUser = {
  name: "Pastor David",
  email: "pastor.david@gracechurch.org",
  role: "Pastor" as UserRole,
  avatar: undefined,
};

// Helper functions
export const getMemberById = (id: string): Member | undefined => {
  return members.find((m) => m.id === id);
};

export const getDepartmentById = (id: string): Department | undefined => {
  return departments.find((d) => d.id === id);
};

export const getEventById = (id: string): ChurchEvent | undefined => {
  return churchEvents.find((e) => e.id === id);
};

export const getMembersByDepartment = (departmentId: string): Member[] => {
  const dept = getDepartmentById(departmentId);
  if (!dept) return [];
  return members.filter((m) => dept.memberIds.includes(m.id));
};

export const getEventsByDepartment = (departmentId: string): ChurchEvent[] => {
  return churchEvents.filter((e) => e.departmentId === departmentId);
};

export const calculateMonthlyFinanceSummary = (month: number, year: number) => {
  const incomeTotal = incomeEntries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expenseTotal = expenseEntries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    income: incomeTotal,
    expenses: expenseTotal,
    balance: incomeTotal - expenseTotal,
  };
};
