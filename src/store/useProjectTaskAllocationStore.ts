import { create } from 'zustand';

export interface AllocationTask {
  id: string;
  title: string;
  description: string;
  milestone: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  assignee: {
    name: string;
    role: string;
    initials: string;
    bgColor: string;
  };
  startDate: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

export const TEAM_MEMBERS = [
  { name: 'Aarav Rao', role: 'Project Manager', initials: 'AR', bgColor: 'bg-slate-900 text-slate-100' },
  { name: 'Priya Kapoor', role: 'Business Analyst', initials: 'PK', bgColor: 'bg-violet-650 text-white' },
  { name: 'Rahul Mehta', role: 'UI/UX Designer', initials: 'RM', bgColor: 'bg-gray-500 text-white' },
  { name: 'Suresh Kumar', role: 'Database Engineer', initials: 'SK', bgColor: 'bg-pink-500 text-white' },
  { name: 'Arjun Singh', role: 'Developer', initials: 'AS', bgColor: 'bg-indigo-600 text-white' },
  { name: 'Neha Bansal', role: 'Frontend Developer', initials: 'NB', bgColor: 'bg-emerald-600 text-white' },
  { name: 'Vikram Tiwari', role: 'QA Engineer', initials: 'VT', bgColor: 'bg-orange-600 text-white' },
  { name: 'Pooja Patel', role: 'Trainer', initials: 'PP', bgColor: 'bg-teal-600 text-white' }
];

const INITIAL_TASKS: AllocationTask[] = [
  {
    id: 'TSK-01',
    title: 'Requirements Gathering',
    description: 'Gather and analyze client requirements',
    milestone: 'Discovery',
    priority: 'High',
    estimatedHours: 12,
    assignee: TEAM_MEMBERS[0],
    startDate: '10 May 2024',
    dueDate: '15 May 2024',
    status: 'Completed'
  },
  {
    id: 'TSK-02',
    title: 'System Analysis',
    description: 'Analyze requirements and create functional specs',
    milestone: 'Planning',
    priority: 'High',
    estimatedHours: 16,
    assignee: TEAM_MEMBERS[1],
    startDate: '16 May 2024',
    dueDate: '22 May 2024',
    status: 'In Progress'
  },
  {
    id: 'TSK-03',
    title: 'UI/UX Design',
    description: 'Design wireframes and prototypes',
    milestone: 'Design',
    priority: 'Medium',
    estimatedHours: 20,
    assignee: TEAM_MEMBERS[2],
    startDate: '23 May 2024',
    dueDate: '31 May 2024',
    status: 'In Progress'
  },
  {
    id: 'TSK-04',
    title: 'Database Design',
    description: 'Design database schema',
    milestone: 'Design',
    priority: 'Medium',
    estimatedHours: 10,
    assignee: TEAM_MEMBERS[3],
    startDate: '23 May 2024',
    dueDate: '27 May 2024',
    status: 'Pending'
  },
  {
    id: 'TSK-05',
    title: 'Backend Development',
    description: 'Develop backend APIs and services',
    milestone: 'Development',
    priority: 'High',
    estimatedHours: 40,
    assignee: TEAM_MEMBERS[4],
    startDate: '01 Jun 2024',
    dueDate: '20 Jun 2024',
    status: 'Pending'
  },
  {
    id: 'TSK-06',
    title: 'Frontend Development',
    description: 'Develop frontend modules',
    milestone: 'Development',
    priority: 'High',
    estimatedHours: 40,
    assignee: TEAM_MEMBERS[5],
    startDate: '01 Jun 2024',
    dueDate: '20 Jun 2024',
    status: 'Pending'
  },
  {
    id: 'TSK-07',
    title: 'Testing',
    description: 'Perform system and integration testing',
    milestone: 'Testing',
    priority: 'High',
    estimatedHours: 24,
    assignee: TEAM_MEMBERS[6],
    startDate: '21 Jun 2024',
    dueDate: '30 Jun 2024',
    status: 'Pending'
  },
  {
    id: 'TSK-08',
    title: 'User Training',
    description: 'Train end users on the new system',
    milestone: 'Deployment',
    priority: 'Medium',
    estimatedHours: 8,
    assignee: TEAM_MEMBERS[7],
    startDate: '01 Jul 2024',
    dueDate: '05 Jul 2024',
    status: 'Pending'
  },
  {
    id: 'TSK-09',
    title: 'Go Live & Support',
    description: 'Deploy system and provide support',
    milestone: 'Deployment',
    priority: 'High',
    estimatedHours: 16,
    assignee: TEAM_MEMBERS[0],
    startDate: '06 Jul 2024',
    dueDate: '10 Jul 2024',
    status: 'Pending'
  }
];

interface ProjectTaskAllocationState {
  tasks: AllocationTask[];
  addTask: (task: AllocationTask) => void;
  updateTask: (id: string, updatedTask: Partial<AllocationTask>) => void;
  deleteTask: (id: string) => void;
}

export const useProjectTaskAllocationStore = create<ProjectTaskAllocationState>((set) => ({
  tasks: INITIAL_TASKS,
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedTask } : t)),
    })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
}));
