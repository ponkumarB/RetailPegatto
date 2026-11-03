import { create } from 'zustand';
import { useMemo } from 'react';

export interface ResourceItem {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  type: string;
  department: string;
  role: string;
  reportingManager: string;
  employmentType: string;
  dateOfJoining: string;
  status: 'Active' | 'Inactive';
  color: string;
  photo?: string;
  primarySkills: string[];
  otherSkills: string[];
  experience: number;
  rate: number;
  availability: string;
  capacity: number;
  timezone: string;
  workLocation: string;
  officeLocation: string;
  remarks?: string;
  documents: any[];
}

interface ResourceListState {
  resources: ResourceItem[];
  searchQuery: string;
  deptFilter: string;
  statusFilter: string;

  setSearchQuery: (query: string) => void;
  setDeptFilter: (dept: string) => void;
  setStatusFilter: (status: string) => void;
  addResource: (resource: Omit<ResourceItem, 'id'>) => void;
  deleteResource: (id: string) => void;
  clearFilters: () => void;
}

const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'RES-001',
    name: 'Priya Kapoor',
    code: 'EMP-101',
    email: 'priya.kapoor@pegatto.com',
    phone: '9876543210',
    type: 'Employee',
    department: 'Business Analysis',
    role: 'Business Analyst',
    reportingManager: 'Sarah Davis',
    employmentType: 'Full Time',
    dateOfJoining: '2024-01-15',
    status: 'Active',
    color: '#3B82F6',
    primarySkills: ['Requirements Analysis', 'Business Process Modeling', 'SDLC'],
    otherSkills: ['Agile Methodologies', 'Jira'],
    experience: 5,
    rate: 1500,
    availability: 'Full Time',
    capacity: 40,
    timezone: '(GMT+05:30) Asia/Kolkata',
    workLocation: 'On-site',
    officeLocation: 'Bangalore (Office)',
    remarks: 'Senior Business Analyst handling CRM requirements.',
    documents: ['Resume_Priya.pdf']
  },
  {
    id: 'RES-002',
    name: 'Arjun Singh',
    code: 'EMP-102',
    email: 'arjun.singh@pegatto.com',
    phone: '9876543211',
    type: 'Employee',
    department: 'Development',
    role: 'Developer',
    reportingManager: 'Sarah Davis',
    employmentType: 'Full Time',
    dateOfJoining: '2023-06-10',
    status: 'Active',
    color: '#10B981',
    primarySkills: ['React', 'Next.js', 'TypeScript'],
    otherSkills: ['Node.js', 'Express', 'Tailwind CSS'],
    experience: 4,
    rate: 1800,
    availability: 'Full Time',
    capacity: 40,
    timezone: '(GMT+05:30) Asia/Kolkata',
    workLocation: 'On-site',
    officeLocation: 'Bangalore (Office)',
    remarks: 'Frontend developer working on pegatto system.',
    documents: ['Resume_Arjun.pdf', 'React_Cert.pdf']
  },
  {
    id: 'RES-003',
    name: 'Rahul Mehta',
    code: 'EMP-103',
    email: 'rahul.mehta@pegatto.com',
    phone: '9876543212',
    type: 'Employee',
    department: 'Design',
    role: 'UI/UX Designer',
    reportingManager: 'Aarav Rao',
    employmentType: 'Full Time',
    dateOfJoining: '2023-09-01',
    status: 'Active',
    color: '#8B5CF6',
    primarySkills: ['Figma', 'User Research', 'Wireframing'],
    otherSkills: ['Adobe XD', 'Prototyping', 'CSS'],
    experience: 3,
    rate: 1200,
    availability: 'Full Time',
    capacity: 40,
    timezone: '(GMT+05:30) Asia/Kolkata',
    workLocation: 'On-site',
    officeLocation: 'Hyderabad (Office)',
    remarks: 'Lead UI Designer for Mobile Apps.',
    documents: ['Portfolio_Link.pdf']
  },
  {
    id: 'RES-004',
    name: 'Suresh Kumar',
    code: 'EMP-104',
    email: 'suresh.kumar@pegatto.com',
    phone: '9876543213',
    type: 'Employee',
    department: 'Development',
    role: 'Database Engineer',
    reportingManager: 'Aarav Rao',
    employmentType: 'Full Time',
    dateOfJoining: '2022-11-20',
    status: 'Active',
    color: '#EC4899',
    primarySkills: ['PostgreSQL', 'Database Tuning', 'SQL Optimization'],
    otherSkills: ['MongoDB', 'Redis', 'Docker'],
    experience: 6,
    rate: 2000,
    availability: 'Full Time',
    capacity: 40,
    timezone: '(GMT+05:30) Asia/Kolkata',
    workLocation: 'Remote',
    officeLocation: 'Remote',
    remarks: 'DB Admin overseeing schema migrations.',
    documents: ['DB_Tuning_Cert.docx']
  },
  {
    id: 'RES-005',
    name: 'Neha Bansal',
    code: 'EMP-105',
    email: 'neha.bansal@pegatto.com',
    phone: '9876543214',
    type: 'Employee',
    department: 'Development',
    role: 'Developer',
    reportingManager: 'Sarah Davis',
    employmentType: 'Full Time',
    dateOfJoining: '2024-03-01',
    status: 'Active',
    color: '#F59E0B',
    primarySkills: ['Angular', 'RxJS', 'HTML5/CSS3'],
    otherSkills: ['Sass', 'Webpack', 'Karma Testing'],
    experience: 3,
    rate: 1400,
    availability: 'Full Time',
    capacity: 40,
    timezone: '(GMT+05:30) Asia/Kolkata',
    workLocation: 'On-site',
    officeLocation: 'Pune (Office)',
    remarks: 'Frontend Engineer on HR Portal redesign.',
    documents: []
  }
];

export const useResourceListStore = create<ResourceListState>((set) => ({
  resources: INITIAL_RESOURCES,
  searchQuery: '',
  deptFilter: 'All',
  statusFilter: 'All',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDeptFilter: (deptFilter) => set({ deptFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  addResource: (resource) => set((state) => {
    const nextId = `RES-${String(state.resources.length + 1).padStart(3, '0')}`;
    return {
      resources: [
        ...state.resources,
        {
          ...resource,
          id: nextId
        }
      ]
    };
  }),

  deleteResource: (id) => set((state) => ({
    resources: state.resources.filter(r => r.id !== id)
  })),

  clearFilters: () => set({
    searchQuery: '',
    deptFilter: 'All',
    statusFilter: 'All'
  })
}));

export const useFilteredResourcesList = () => {
  const resources = useResourceListStore((state) => state.resources);
  const searchQuery = useResourceListStore((state) => state.searchQuery);
  const deptFilter = useResourceListStore((state) => state.deptFilter);
  const statusFilter = useResourceListStore((state) => state.statusFilter);

  return useMemo(() => {
    return resources.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = deptFilter === 'All' || r.department === deptFilter;
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [resources, searchQuery, deptFilter, statusFilter]);
};
