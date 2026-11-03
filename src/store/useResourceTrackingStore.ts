import { create } from 'zustand';
import { useMemo } from 'react';

export interface ResourceTrackingData {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
  department: string;
  projectTask: string;
  location: 'Bangalore (Office)' | 'Hyderabad (Office)' | 'Pune (Office)' | 'Mumbai (Office)' | 'Remote';
  status: 'Working' | 'Available' | 'On Leave' | 'Unavailable';
  currentActivity: string;
  utilisation: number;
  lastActive: string;
  isActive: boolean;
}

export interface TrackingKpis {
  total: number;
  working: number;
  workingPct: number;
  available: number;
  availablePct: number;
  onLeave: number;
  onLeavePct: number;
  unavailable: number;
  unavailablePct: number;
}

interface ResourceTrackingState {
  resources: ResourceTrackingData[];
  activeTab: 'list' | 'location' | 'activity';
  searchQuery: string;
  deptFilter: string;
  roleFilter: string;
  statusFilter: string;
  projectFilter: string;
  locationFilter: string;
  showOnlyActive: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  kpiData: TrackingKpis | null;
  locationDistribution: any[];
  statusOverview: any[];
  dateRange: string;
  setDateRange: (range: string) => void;

  setResources: (resources: ResourceTrackingData[]) => void;
  setActiveTab: (tab: 'list' | 'location' | 'activity') => void;
  setSearchQuery: (query: string) => void;
  setDeptFilter: (dept: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  setProjectFilter: (project: string) => void;
  setLocationFilter: (location: string) => void;
  setShowOnlyActive: (show: boolean) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setItemsPerPage: (size: number) => void;
  setTotalCount: (totalCount: number) => void;
  setKpiData: (kpiData: TrackingKpis | null) => void;
  setLocationDistribution: (dist: any[]) => void;
  setStatusOverview: (overview: any[]) => void;
  clearFilters: () => void;
}

const INITIAL_RESOURCES: ResourceTrackingData[] = [
  {
    id: 'R-01',
    name: 'Priya Kapoor',
    initials: 'PK',
    avatarBg: 'bg-violet-600 text-white',
    role: 'Business Analyst',
    department: 'Business Analysis',
    projectTask: 'CRM Implementation / Requirements Analysis',
    location: 'Bangalore (Office)',
    status: 'Working',
    currentActivity: 'Working on requirements document',
    utilisation: 80,
    lastActive: 'Just now',
    isActive: true
  },
  {
    id: 'R-02',
    name: 'Arjun Singh',
    initials: 'AS',
    avatarBg: 'bg-indigo-600 text-white',
    role: 'Developer',
    department: 'Development',
    projectTask: 'Bug Fixing / Module #124',
    location: 'Bangalore (Office)',
    status: 'Working',
    currentActivity: 'Fixing API integration issues',
    utilisation: 100,
    lastActive: '2 min ago',
    isActive: true
  },
  {
    id: 'R-03',
    name: 'Rahul Mehta',
    initials: 'RM',
    avatarBg: 'bg-gray-500 text-white',
    role: 'UI/UX Designer',
    department: 'Design',
    projectTask: 'Mobile App Design / Dashboard',
    location: 'Hyderabad (Office)',
    status: 'Working',
    currentActivity: 'Designing dashboard wireframes',
    utilisation: 60,
    lastActive: '5 min ago',
    isActive: true
  },
  {
    id: 'R-04',
    name: 'Suresh Kumar',
    initials: 'SK',
    avatarBg: 'bg-pink-500 text-white',
    role: 'Database Engineer',
    department: 'Development',
    projectTask: 'Database Migration / Optimization',
    location: 'Remote',
    status: 'Working',
    currentActivity: 'Optimizing DB performance',
    utilisation: 90,
    lastActive: '1 min ago',
    isActive: true
  },
  {
    id: 'R-05',
    name: 'Neha Bansal',
    initials: 'NB',
    avatarBg: 'bg-emerald-600 text-white',
    role: 'Developer',
    department: 'Development',
    projectTask: 'Frontend Development / User Module',
    location: 'Pune (Office)',
    status: 'On Leave',
    currentActivity: 'Casual Leave',
    utilisation: 0,
    lastActive: '-',
    isActive: true
  },
  {
    id: 'R-06',
    name: 'Vikram Tiwari',
    initials: 'VT',
    avatarBg: 'bg-orange-600 text-white',
    role: 'QA Engineer',
    department: 'Quality Assurance',
    projectTask: 'Testing / User Module',
    location: 'Bangalore (Office)',
    status: 'Available',
    currentActivity: 'Available for allocation',
    utilisation: 0,
    lastActive: '10 min ago',
    isActive: true
  },
  {
    id: 'R-07',
    name: 'Pooja Patel',
    initials: 'PP',
    avatarBg: 'bg-teal-600 text-white',
    role: 'Trainer',
    department: 'Training',
    projectTask: 'User Training / Batch #23',
    location: 'Mumbai (Office)',
    status: 'Working',
    currentActivity: 'Conducting training session',
    utilisation: 70,
    lastActive: '3 min ago',
    isActive: true
  },
  {
    id: 'R-08',
    name: 'Aarav Rao',
    initials: 'AR',
    avatarBg: 'bg-slate-900 text-slate-100',
    role: 'Project Manager',
    department: 'Project Management',
    projectTask: 'CRM Implementation / Overall',
    location: 'Bangalore (Office)',
    status: 'Working',
    currentActivity: 'Project review and planning',
    utilisation: 75,
    lastActive: 'Just now',
    isActive: true
  },
  { id: 'R-09', name: 'Jisan Mahmud', initials: 'JM', avatarBg: 'bg-indigo-600 text-white', role: 'Developer', department: 'Development', projectTask: 'CRM Implementation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Writing API tests', utilisation: 85, lastActive: '5 min ago', isActive: true },
  { id: 'R-10', name: 'Sadia Afrin', initials: 'SA', avatarBg: 'bg-violet-650 text-white', role: 'Business Analyst', department: 'Business Analysis', projectTask: 'Billing Automation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'User interviews', utilisation: 70, lastActive: '12 min ago', isActive: true },
  { id: 'R-11', name: 'Sarah Davis', initials: 'SD', avatarBg: 'bg-pink-600 text-white', role: 'Project Manager', department: 'Project Management', projectTask: 'HR Portal Redesign', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Project planning', utilisation: 80, lastActive: 'Just now', isActive: true },
  { id: 'R-12', name: 'Monirul Islam', initials: 'MI', avatarBg: 'bg-blue-600 text-white', role: 'QA Engineer', department: 'Quality Assurance', projectTask: 'Bug Fixing', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Testing release builds', utilisation: 75, lastActive: '15 min ago', isActive: true },
  { id: 'R-13', name: 'Pooja Gupta', initials: 'PG', avatarBg: 'bg-teal-600 text-white', role: 'Developer', department: 'Development', projectTask: 'Billing Automation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Refactoring database models', utilisation: 90, lastActive: '4 min ago', isActive: true },
  { id: 'R-14', name: 'Rohit Sharma', initials: 'RS', avatarBg: 'bg-slate-700 text-white', role: 'Developer', department: 'Development', projectTask: 'CRM Implementation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Optimizing codebase', utilisation: 80, lastActive: '8 min ago', isActive: true },
  { id: 'R-15', name: 'Amit Patel', initials: 'AP', avatarBg: 'bg-purple-600 text-white', role: 'Database Engineer', department: 'Development', projectTask: 'HR Portal Redesign', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Index tuning', utilisation: 85, lastActive: '10 min ago', isActive: true },
  { id: 'R-16', name: 'Sanjay Kumar', initials: 'SK', avatarBg: 'bg-emerald-505 text-white', role: 'Developer', department: 'Development', projectTask: 'CRM Implementation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Adding search endpoints', utilisation: 75, lastActive: 'Just now', isActive: true },
  { id: 'R-17', name: 'Rani Javaji', initials: 'RJ', avatarBg: 'bg-teal-500 text-white', role: 'UI/UX Designer', department: 'Design', projectTask: 'Billing Automation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Polishing payment screens', utilisation: 65, lastActive: '6 min ago', isActive: true },
  { id: 'R-18', name: 'NR Patnaik', initials: 'NP', avatarBg: 'bg-slate-900 text-slate-100', role: 'Project Manager', department: 'Project Management', projectTask: 'CRM Implementation', location: 'Bangalore (Office)', status: 'Working', currentActivity: 'Stakeholder presentation', utilisation: 85, lastActive: '1 min ago', isActive: true },
  { id: 'R-19', name: 'Elena Rostova', initials: 'ER', avatarBg: 'bg-orange-500 text-white', role: 'Developer', department: 'Development', projectTask: 'None', location: 'Hyderabad (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '20 min ago', isActive: true },
  { id: 'R-20', name: 'Thomas Mueller', initials: 'TM', avatarBg: 'bg-indigo-600 text-white', role: 'QA Engineer', department: 'Quality Assurance', projectTask: 'None', location: 'Hyderabad (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '30 min ago', isActive: true },
  { id: 'R-21', name: 'Sophie Dubois', initials: 'SD', avatarBg: 'bg-violet-600 text-white', role: 'Business Analyst', department: 'Business Analysis', projectTask: 'None', location: 'Hyderabad (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '25 min ago', isActive: true },
  { id: 'R-22', name: 'John Doe', initials: 'JD', avatarBg: 'bg-slate-600 text-white', role: 'Developer', department: 'Development', projectTask: 'CRM Implementation', location: 'Hyderabad (Office)', status: 'Working', currentActivity: 'Debugging auth middleware', utilisation: 80, lastActive: '2 min ago', isActive: true },
  { id: 'R-23', name: 'Alice Smith', initials: 'AS', avatarBg: 'bg-pink-600 text-white', role: 'UI/UX Designer', department: 'Design', projectTask: 'None', location: 'Pune (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '15 min ago', isActive: true },
  { id: 'R-24', name: 'Bob Johnson', initials: 'BJ', avatarBg: 'bg-teal-600 text-white', role: 'Developer', department: 'Development', projectTask: 'None', location: 'Pune (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '45 min ago', isActive: true },
  { id: 'R-25', name: 'Charlie Brown', initials: 'CB', avatarBg: 'bg-slate-700 text-white', role: 'Trainer', department: 'Training', projectTask: 'None', location: 'Pune (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '1 hr ago', isActive: true },
  { id: 'R-26', name: 'David Lee', initials: 'DL', avatarBg: 'bg-purple-600 text-white', role: 'Developer', department: 'Development', projectTask: 'None', location: 'Mumbai (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '10 min ago', isActive: true },
  { id: 'R-27', name: 'Emma Watson', initials: 'EW', avatarBg: 'bg-violet-600 text-white', role: 'Business Analyst', department: 'Business Analysis', projectTask: 'None', location: 'Mumbai (Office)', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '50 min ago', isActive: true },
  { id: 'R-28', name: 'Frank Harris', initials: 'FH', avatarBg: 'bg-emerald-600 text-white', role: 'QA Engineer', department: 'Quality Assurance', projectTask: 'HR Portal Redesign', location: 'Remote', status: 'Working', currentActivity: 'Running regression tests', utilisation: 75, lastActive: 'Just now', isActive: true },
  { id: 'R-29', name: 'Grace Kelly', initials: 'GK', avatarBg: 'bg-pink-500 text-white', role: 'UI/UX Designer', department: 'Design', projectTask: 'CRM Implementation', location: 'Remote', status: 'Working', currentActivity: 'Working on mockups', utilisation: 80, lastActive: '4 min ago', isActive: true },
  { id: 'R-30', name: 'Henry Ford', initials: 'HF', avatarBg: 'bg-blue-600 text-white', role: 'Developer', department: 'Development', projectTask: 'None', location: 'Remote', status: 'Available', currentActivity: 'Available for allocation', utilisation: 0, lastActive: '30 min ago', isActive: true },
  { id: 'R-31', name: 'Isabella Ross', initials: 'IR', avatarBg: 'bg-orange-600 text-white', role: 'Developer', department: 'Development', projectTask: 'None', location: 'Remote', status: 'On Leave', currentActivity: 'Sick Leave', utilisation: 0, lastActive: '-', isActive: true },
  { id: 'R-32', name: 'Jack Reacher', initials: 'JR', avatarBg: 'bg-slate-900 text-slate-100', role: 'Project Manager', department: 'Project Management', projectTask: 'None', location: 'Remote', status: 'Unavailable', currentActivity: 'Client meeting out of office', utilisation: 0, lastActive: '-', isActive: false }
];

const getInitial2YearRange = () => {
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return `${formatDate(twoYearsAgo)} - ${formatDate(today)}`;
};

export const useResourceTrackingStore = create<ResourceTrackingState>((set) => ({
  resources: INITIAL_RESOURCES,
  activeTab: 'list',
  searchQuery: '',
  deptFilter: 'All',
  roleFilter: 'All',
  statusFilter: 'All',
  projectFilter: 'All',
  locationFilter: 'All',
  showOnlyActive: false,
  currentPage: 1,
  itemsPerPage: 8,
  totalCount: INITIAL_RESOURCES.length,
  kpiData: null,
  locationDistribution: [],
  statusOverview: [],
  dateRange: getInitial2YearRange(),
  setDateRange: (dateRange) => set({ dateRange }),

  setResources: (resources) => set({ resources }),
  setActiveTab: (activeTab) => set({ activeTab, currentPage: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setDeptFilter: (deptFilter) => set({ deptFilter, currentPage: 1 }),
  setRoleFilter: (roleFilter) => set({ roleFilter, currentPage: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
  setProjectFilter: (projectFilter) => set({ projectFilter, currentPage: 1 }),
  setLocationFilter: (locationFilter) => set({ locationFilter, currentPage: 1 }),
  setShowOnlyActive: (showOnlyActive) => set({ showOnlyActive, currentPage: 1 }),
  setCurrentPage: (updater) => set((state) => ({
    currentPage: typeof updater === 'function' ? updater(state.currentPage) : updater
  })),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage, currentPage: 1 }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setKpiData: (kpiData) => set({ kpiData }),
  setLocationDistribution: (locationDistribution) => set({ locationDistribution }),
  setStatusOverview: (statusOverview) => set({ statusOverview }),
  clearFilters: () => set({
    searchQuery: '',
    deptFilter: 'All',
    roleFilter: 'All',
    statusFilter: 'All',
    projectFilter: 'All',
    locationFilter: 'All',
    showOnlyActive: false,
    currentPage: 1
  })
}));

export const useFilteredTrackingResources = () => {
  const resources = useResourceTrackingStore((state) => state.resources);
  const searchQuery = useResourceTrackingStore((state) => state.searchQuery);
  const deptFilter = useResourceTrackingStore((state) => state.deptFilter);
  const roleFilter = useResourceTrackingStore((state) => state.roleFilter);
  const statusFilter = useResourceTrackingStore((state) => state.statusFilter);
  const projectFilter = useResourceTrackingStore((state) => state.projectFilter);
  const locationFilter = useResourceTrackingStore((state) => state.locationFilter);
  const showOnlyActive = useResourceTrackingStore((state) => state.showOnlyActive);

  return useMemo(() => {
    return resources.filter(res => {
      const matchSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.projectTask.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDept = deptFilter === 'All' || res.department === deptFilter;
      const matchRole = roleFilter === 'All' || res.role === roleFilter;
      const matchStatus = statusFilter === 'All' || res.status === statusFilter;
      const matchLocation = locationFilter === 'All' || res.location === locationFilter;
      
      // Project matching
      let matchProject = true;
      if (projectFilter !== 'All') {
        if (projectFilter === 'CRM') {
          matchProject = res.projectTask.toLowerCase().includes('crm');
        } else if (projectFilter === 'HR') {
          matchProject = res.projectTask.toLowerCase().includes('hr');
        } else if (projectFilter === 'Billing') {
          matchProject = res.projectTask.toLowerCase().includes('billing');
        }
      }

      // Active toggle
      const matchActive = !showOnlyActive || res.isActive;

      return matchSearch && matchDept && matchRole && matchStatus && matchLocation && matchProject && matchActive;
    });
  }, [resources, searchQuery, deptFilter, roleFilter, statusFilter, projectFilter, locationFilter, showOnlyActive]);
};

export const useTrackingKpis = () => {
  const filtered = useFilteredTrackingResources();
  const kpiData = useResourceTrackingStore((state) => state.kpiData);
  return useMemo(() => {
    if (kpiData) return kpiData;
    const total = filtered.length;
    const working = filtered.filter(r => r.status === 'Working').length;
    const available = filtered.filter(r => r.status === 'Available').length;
    const onLeave = filtered.filter(r => r.status === 'On Leave').length;
    const unavailable = filtered.filter(r => r.status === 'Unavailable').length;

    const workingPct = total > 0 ? Math.round((working / total) * 10000) / 100 : 0;
    const availablePct = total > 0 ? Math.round((available / total) * 10000) / 100 : 0;
    const onLeavePct = total > 0 ? Math.round((onLeave / total) * 10000) / 100 : 0;
    const unavailablePct = total > 0 ? Math.round((unavailable / total) * 10000) / 100 : 0;

    return {
      total,
      working,
      workingPct,
      available,
      availablePct,
      onLeave,
      onLeavePct,
      unavailable,
      unavailablePct
    };
  }, [filtered, kpiData]);
};
