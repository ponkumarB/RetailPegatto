import { create } from 'zustand';

export interface Milestone {
  id: string;
  name: string;
  code: string;
  description: string;
  project: string;
  parentMilestone?: string;
  targetDate: string; // YYYY-MM-DD
  expectedCompletionDate?: string; // YYYY-MM-DD
  owner: string;
  ownerRole: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue' | 'On Hold';
  progress: number; // 0 to 100
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencies?: string[];
  notes?: string;
  lastSaved: string;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
}

interface MilestoneStore {
  milestones: Milestone[];
  addMilestone: (milestone: Milestone) => void;
  deleteMilestone: (id: string) => void;
  updateMilestone: (id: string, updated: Partial<Milestone>) => void;
}

const initialMilestones: Milestone[] = [
  // Website Redesign Project (from mockup)
  {
    id: 'MS-101',
    name: 'Project Kickoff',
    code: 'MS-101',
    description: 'Project initiation and team alignment',
    project: 'Website Redesign',
    startDate: '2024-04-01',
    dueDate: '2024-04-02',
    targetDate: '2024-04-02',
    owner: 'Aarav Rao',
    ownerRole: 'Project Manager',
    status: 'Completed',
    progress: 100,
    priority: 'Medium',
    lastSaved: '29 May 2024 10:30 AM'
  },
  {
    id: 'MS-102',
    name: 'Requirement Analysis',
    code: 'MS-102',
    description: 'Gather and analyze all requirements',
    project: 'Website Redesign',
    startDate: '2024-04-03',
    dueDate: '2024-04-10',
    targetDate: '2024-04-10',
    owner: 'Priya Nair',
    ownerRole: 'Business Analyst',
    status: 'Completed',
    progress: 100,
    priority: 'High',
    lastSaved: '28 May 2024 04:15 PM'
  },
  {
    id: 'MS-103',
    name: 'UI/UX Design',
    code: 'MS-103',
    description: 'Design wireframes and prototypes',
    project: 'Website Redesign',
    startDate: '2024-04-11',
    dueDate: '2024-04-25',
    targetDate: '2024-04-25',
    owner: 'Vikram Joshi',
    ownerRole: 'UI/UX Designer',
    status: 'In Progress',
    progress: 75,
    priority: 'High',
    lastSaved: '29 May 2024 11:20 AM'
  },
  {
    id: 'MS-104',
    name: 'Frontend Development',
    code: 'MS-104',
    description: 'Implement frontend using React',
    project: 'Website Redesign',
    startDate: '2024-04-26',
    dueDate: '2024-05-15',
    targetDate: '2024-05-15',
    owner: 'Amit Singh',
    ownerRole: 'Frontend Developer',
    status: 'In Progress',
    progress: 60,
    priority: 'Critical',
    lastSaved: '29 May 2024 09:45 AM'
  },
  {
    id: 'MS-105',
    name: 'Backend Development',
    code: 'MS-105',
    description: 'Develop backend APIs and services',
    project: 'Website Redesign',
    startDate: '2024-05-16',
    dueDate: '2024-06-05',
    targetDate: '2024-06-05',
    owner: 'Sneha Verma',
    ownerRole: 'Backend Developer',
    status: 'In Progress',
    progress: 40,
    priority: 'High',
    lastSaved: '28 May 2024 05:30 PM'
  },
  {
    id: 'MS-106',
    name: 'Testing',
    code: 'MS-106',
    description: 'System & UAT testing',
    project: 'Website Redesign',
    startDate: '2024-06-06',
    dueDate: '2024-06-20',
    targetDate: '2024-06-20',
    owner: 'Neha Patel',
    ownerRole: 'QA Engineer',
    status: 'On Hold',
    progress: 10,
    priority: 'Medium',
    lastSaved: '27 May 2024 12:10 PM'
  },
  {
    id: 'MS-107',
    name: 'Deployment',
    code: 'MS-107',
    description: 'Deploy to production server',
    project: 'Website Redesign',
    startDate: '2024-06-21',
    dueDate: '2024-06-30',
    targetDate: '2024-06-30',
    owner: 'Aarav Rao',
    ownerRole: 'Project Manager',
    status: 'Overdue',
    progress: 0,
    priority: 'Critical',
    lastSaved: '27 May 2024 01:00 PM'
  },

  // CRM Implementation Project
  {
    id: 'MS-001',
    name: 'Requirements Gathering',
    code: 'MS-001',
    description: 'Complete all requirement collection and stakeholder sign-off',
    project: 'CRM Implementation (PRJ-001)',
    startDate: '2025-05-01',
    dueDate: '2025-05-14',
    targetDate: '2025-05-14',
    expectedCompletionDate: '2025-05-14',
    owner: 'Sadia Afrin',
    ownerRole: 'Project Manager',
    status: 'Completed',
    progress: 100,
    priority: 'Medium',
    lastSaved: '2 days ago'
  },
  {
    id: 'MS-002',
    name: 'System Design',
    code: 'MS-002',
    description: 'Finalize system architecture and design documents',
    project: 'CRM Implementation (PRJ-001)',
    startDate: '2025-05-15',
    dueDate: '2025-05-19',
    targetDate: '2025-05-19',
    expectedCompletionDate: '2025-05-19',
    owner: 'Jisan Mahmud',
    ownerRole: 'Developer',
    status: 'Completed',
    progress: 100,
    priority: 'High',
    dependencies: ['MS-001'],
    lastSaved: '1 day ago'
  },
  {
    id: 'MS-003',
    name: 'Development',
    code: 'MS-003',
    description: 'Complete core development and module integration',
    project: 'CRM Implementation (PRJ-001)',
    startDate: '2025-05-20',
    dueDate: '2025-05-27',
    targetDate: '2025-05-27',
    expectedCompletionDate: '2025-05-27',
    owner: 'Monirul Islam',
    ownerRole: 'QA Engineer',
    status: 'In Progress',
    progress: 60,
    priority: 'Medium',
    dependencies: ['MS-002'],
    lastSaved: 'Just now'
  },
  {
    id: 'MS-004',
    name: 'Testing',
    code: 'MS-004',
    description: 'Complete system, integration and user acceptance testing',
    project: 'CRM Implementation (PRJ-001)',
    startDate: '2025-05-28',
    dueDate: '2025-05-29',
    targetDate: '2025-05-29',
    expectedCompletionDate: '2025-05-29',
    owner: 'Nazia Akter',
    ownerRole: 'Business Analyst',
    status: 'Pending',
    progress: 0,
    priority: 'High',
    dependencies: ['MS-003'],
    lastSaved: '-'
  },
  {
    id: 'MS-005',
    name: 'Go Live',
    code: 'MS-005',
    description: 'Deploy to production and go live',
    project: 'CRM Implementation (PRJ-001)',
    startDate: '2025-05-30',
    dueDate: '2025-05-30',
    targetDate: '2025-05-30',
    expectedCompletionDate: '2025-05-30',
    owner: 'Sadia Afrin',
    ownerRole: 'Project Manager',
    status: 'Overdue',
    progress: 0,
    priority: 'Critical',
    dependencies: ['MS-004'],
    lastSaved: '-'
  }
];

export const useMilestoneStore = create<MilestoneStore>((set) => ({
  milestones: initialMilestones,
  addMilestone: (milestone) => set((state) => ({ milestones: [...state.milestones, milestone] })),
  deleteMilestone: (id) => set((state) => ({ milestones: state.milestones.filter(m => m.id !== id) })),
  updateMilestone: (id, updated) => set((state) => ({
    milestones: state.milestones.map(m => m.id === id ? { ...m, ...updated } : m)
  }))
}));
