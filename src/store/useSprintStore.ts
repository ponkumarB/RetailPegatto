import { create } from 'zustand';

export interface SprintTeamMember {
  name: string;
  avatar: string;
  email: string;
}

export interface Sprint {
  id: string;
  name: string;
  project: string;
  goal: string;
  type: 'Development' | 'Planning' | 'Design' | 'Bugfix';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // in days
  workingDays: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  owner: string;
  velocity?: number;
  description?: string;
  teamMembers: SprintTeamMember[];
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Cancelled';
  progress: number; // 0 to 100
  lastSaved: string;
}

interface SprintStore {
  sprints: Sprint[];
  addSprint: (sprint: Sprint) => void;
  deleteSprint: (id: string) => void;
  updateSprint: (id: string, updated: Partial<Sprint>) => void;
}

const mockTeam: SprintTeamMember[] = [
  { name: 'Aarav Rao', avatar: 'AR', email: 'aarav.rao@crmfarm.it' },
  { name: 'Sneha Sharma', avatar: 'SS', email: 'sneha.sharma@crmfarm.it' },
  { name: 'Rohit Kumar', avatar: 'RK', email: 'rohit.kumar@crmfarm.it' },
  { name: 'Deepa Patel', avatar: 'DP', email: 'deepa.patel@crmfarm.it' },
  { name: 'Manish Raj', avatar: 'MR', email: 'manish.raj@crmfarm.it' }
];

const initialSprints: Sprint[] = [
  {
    id: 'SPR-004',
    name: 'Sprint 4 - Homepage & UI Improvements',
    project: 'Website Redesign Project',
    goal: 'Design and implement the new homepage and improve UI components.',
    type: 'Development',
    startDate: '2024-05-20',
    endDate: '2024-06-02',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Rohit Kumar',
    velocity: 40,
    description: 'This sprint focuses on designing the new homepage, implementing UI improvements and responsive adjustments.',
    teamMembers: [mockTeam[0], mockTeam[2], mockTeam[1], mockTeam[3]],
    status: 'In Progress',
    progress: 65,
    lastSaved: 'Just now'
  },
  {
    id: 'SPR-003',
    name: 'Sprint 3 - API Integration',
    project: 'Website Redesign Project',
    goal: 'Integrate the CRM backend APIs with the portal interface.',
    type: 'Development',
    startDate: '2024-05-06',
    endDate: '2024-05-19',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Rohit Kumar',
    velocity: 45,
    teamMembers: [mockTeam[2], mockTeam[3], mockTeam[0]],
    status: 'Completed',
    progress: 100,
    lastSaved: '2 days ago'
  },
  {
    id: 'SPR-002',
    name: 'Sprint 2 - CRM Enhancements',
    project: 'CRM Enhancement',
    goal: 'Optimize invoice creation pipelines and lead scoring calculations.',
    type: 'Development',
    startDate: '2024-04-22',
    endDate: '2024-05-05',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Sadia Afrin',
    velocity: 38,
    teamMembers: [mockTeam[0], mockTeam[2]],
    status: 'Completed',
    progress: 100,
    lastSaved: '3 weeks ago'
  },
  {
    id: 'SPR-005',
    name: 'Sprint 5 - Mobile App Features',
    project: 'Mobile App Development',
    goal: 'Add biometric authentication and offline sync to the mobile dashboard.',
    type: 'Development',
    startDate: '2024-06-03',
    endDate: '2024-06-16',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Sneha Sharma',
    velocity: 40,
    teamMembers: [mockTeam[1], mockTeam[3], mockTeam[2], mockTeam[0]],
    status: 'In Progress',
    progress: 40,
    lastSaved: '1 day ago'
  },
  {
    id: 'SPR-006',
    name: 'Sprint 6 - Performance Optimization',
    project: 'Website Redesign Project',
    goal: 'Minimize JS bundle size and configure service worker caching.',
    type: 'Development',
    startDate: '2024-06-17',
    endDate: '2024-06-30',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Rohit Kumar',
    velocity: 35,
    teamMembers: [mockTeam[2], mockTeam[0], mockTeam[1]],
    status: 'Upcoming',
    progress: 0,
    lastSaved: '-'
  },
  {
    id: 'SPR-007',
    name: 'Sprint 7 - User Feedback & Fixes',
    project: 'Mobile App Development',
    goal: 'Fix crash issues reported on Android 12 device viewports.',
    type: 'Development',
    startDate: '2024-07-01',
    endDate: '2024-07-14',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Sneha Sharma',
    velocity: 30,
    teamMembers: [mockTeam[3], mockTeam[1]],
    status: 'Upcoming',
    progress: 0,
    lastSaved: '-'
  },
  {
    id: 'SPR-001',
    name: 'Sprint 1 - Project Setup & Planning',
    project: 'API Integration Project',
    goal: 'Set up repository structure, CI/CD pipelines, and seed database.',
    type: 'Planning',
    startDate: '2024-05-13',
    endDate: '2024-05-19',
    duration: 7,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Manish Raj',
    velocity: 25,
    teamMembers: [mockTeam[4], mockTeam[0]],
    status: 'Completed',
    progress: 100,
    lastSaved: '1 month ago'
  },
  {
    id: 'SPR-008',
    name: 'Sprint 2 - Authentication Module',
    project: 'API Integration Project',
    goal: 'Implement JWT session verification and permissions middleware.',
    type: 'Development',
    startDate: '2024-05-20',
    endDate: '2024-06-02',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Manish Raj',
    velocity: 35,
    teamMembers: [mockTeam[4], mockTeam[2]],
    status: 'In Progress',
    progress: 20,
    lastSaved: 'Just now'
  },
  {
    id: 'SPR-009',
    name: 'Sprint 3 - Data Sync Module',
    project: 'API Integration Project',
    goal: 'Implement automated background sync triggers with CRM ERP database.',
    type: 'Development',
    startDate: '2024-06-03',
    endDate: '2024-06-16',
    duration: 14,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Manish Raj',
    velocity: 40,
    teamMembers: [mockTeam[4], mockTeam[3]],
    status: 'Upcoming',
    progress: 0,
    lastSaved: '-'
  },
  {
    id: 'SPR-010',
    name: 'Cancelled Sprint - Old UI',
    project: 'Website Redesign Project',
    goal: 'Implement grid list layout for invoice cards (cancelled due to scope change).',
    type: 'Development',
    startDate: '2024-04-15',
    endDate: '2024-04-24',
    duration: 10,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    owner: 'Rohit Kumar',
    velocity: 20,
    teamMembers: [mockTeam[0], mockTeam[2]],
    status: 'Cancelled',
    progress: 0,
    lastSaved: '-'
  }
];

export const useSprintStore = create<SprintStore>((set) => ({
  sprints: initialSprints,
  addSprint: (sprint) => set((state) => ({ sprints: [sprint, ...state.sprints] })),
  deleteSprint: (id) => set((state) => ({ sprints: state.sprints.filter(s => s.id !== id) })),
  updateSprint: (id, updated) => set((state) => ({
    sprints: state.sprints.map(s => s.id === id ? { ...s, ...updated } : s)
  }))
}));
