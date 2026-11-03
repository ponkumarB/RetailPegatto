import { create } from 'zustand';

export interface ResourceData {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
  department: string;
  location: string;
  allocationHours: number;
  capacityHours: number;
  status: 'Optimal' | 'Over Utilised' | 'Under Utilised';
  trendPath: string; // SVG path
  weeklyCapacity: number[];
  capacityUtilisation: number;
  capacityStatus: 'Optimal' | 'Over Utilised' | 'Under Utilised';
}

export interface UtilisationKpis {
  averageUtil: number;
  overUtil: number;
  underUtil: number;
  total: number;
}

interface ResourceUtilisationState {
  resources: ResourceData[];
  activeTab: 'utilisation' | 'capacity' | 'timesheet';
  searchQuery: string;
  roleFilter: string;
  deptFilter: string;
  locationFilter: string;
  statusFilter: string;
  projectFilter: string;
  groupBy: string;
  currentPage: number;
  itemsPerPage: number;
  capacityPeriod: 'week' | 'month';
  totalCount: number;
  utilisationKpis: UtilisationKpis | null;
  utilisationSummary: Record<string, number> | null;
  dateRange: string;
  setDateRange: (range: string) => void;

  setResources: (resources: ResourceData[]) => void;
  setActiveTab: (tab: 'utilisation' | 'capacity' | 'timesheet') => void;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setDeptFilter: (dept: string) => void;
  setLocationFilter: (loc: string) => void;
  setStatusFilter: (status: string) => void;
  setProjectFilter: (project: string) => void;
  setGroupBy: (groupBy: string) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setItemsPerPage: (size: number) => void;
  setCapacityPeriod: (period: 'week' | 'month') => void;
  setTotalCount: (totalCount: number) => void;
  setUtilisationKpis: (kpis: UtilisationKpis | null) => void;
  setUtilisationSummary: (summary: Record<string, number> | null) => void;
  handleTabChange: (tab: 'utilisation' | 'capacity' | 'timesheet') => void;
  clearFilters: () => void;
}

const INITIAL_RESOURCES: ResourceData[] = [
  {
    id: 'R-01',
    name: 'Priya Kapoor',
    initials: 'PK',
    avatarBg: 'bg-violet-650 text-white',
    role: 'Business Analyst',
    department: 'Business Analysis',
    location: 'Frankfurt',
    allocationHours: 32,
    capacityHours: 40,
    status: 'Optimal',
    trendPath: 'M 0 12 Q 10 5, 20 15 T 40 8 T 60 12',
    weeklyCapacity: [32, 36, 40, 32, 24],
    capacityUtilisation: 80,
    capacityStatus: 'Optimal'
  },
  {
    id: 'R-02',
    name: 'Arjun Singh',
    initials: 'AS',
    avatarBg: 'bg-indigo-600 text-white',
    role: 'Developer',
    department: 'Development',
    location: 'Munich',
    allocationHours: 48,
    capacityHours: 40,
    status: 'Over Utilised',
    trendPath: 'M 0 10 Q 15 18, 30 5 T 60 18',
    weeklyCapacity: [40, 40, 48, 40, 32],
    capacityUtilisation: 100,
    capacityStatus: 'Over Utilised'
  },
  {
    id: 'R-03',
    name: 'Rahul Mehta',
    initials: 'RM',
    avatarBg: 'bg-gray-500 text-white',
    role: 'UI/UX Designer',
    department: 'Design',
    location: 'Berlin',
    allocationHours: 28,
    capacityHours: 40,
    status: 'Optimal',
    trendPath: 'M 0 15 Q 10 8, 20 15 T 40 5 T 60 14',
    weeklyCapacity: [24, 24, 32, 24, 16],
    capacityUtilisation: 60,
    capacityStatus: 'Under Utilised'
  },
  {
    id: 'R-04',
    name: 'Suresh Kumar',
    initials: 'SK',
    avatarBg: 'bg-pink-500 text-white',
    role: 'Database Engineer',
    department: 'Development',
    location: 'Frankfurt',
    allocationHours: 42,
    capacityHours: 40,
    status: 'Over Utilised',
    trendPath: 'M 0 16 Q 12 4, 24 18 T 48 8 T 60 15',
    weeklyCapacity: [40, 40, 40, 40, 40],
    capacityUtilisation: 100,
    capacityStatus: 'Optimal'
  },
  {
    id: 'R-05',
    name: 'Neha Bansal',
    initials: 'NB',
    avatarBg: 'bg-emerald-600 text-white',
    role: 'Developer',
    department: 'Development',
    location: 'Munich',
    allocationHours: 24,
    capacityHours: 40,
    status: 'Under Utilised',
    trendPath: 'M 0 5 Q 15 15, 30 10 T 60 12',
    weeklyCapacity: [24, 32, 32, 24, 24],
    capacityUtilisation: 68,
    capacityStatus: 'Optimal'
  },
  {
    id: 'R-06',
    name: 'Vikram Tiwari',
    initials: 'VT',
    avatarBg: 'bg-orange-600 text-white',
    role: 'QA Engineer',
    department: 'Quality Assurance',
    location: 'Berlin',
    allocationHours: 20,
    capacityHours: 40,
    status: 'Under Utilised',
    trendPath: 'M 0 18 Q 10 10, 20 15 T 40 8 T 60 16',
    weeklyCapacity: [16, 24, 24, 16, 16],
    capacityUtilisation: 48,
    capacityStatus: 'Under Utilised'
  },
  {
    id: 'R-07',
    name: 'Pooja Patel',
    initials: 'PP',
    avatarBg: 'bg-teal-600 text-white',
    role: 'Trainer',
    department: 'Training',
    location: 'Frankfurt',
    allocationHours: 16,
    capacityHours: 40,
    status: 'Under Utilised',
    trendPath: 'M 0 10 Q 15 5, 30 15 T 60 10',
    weeklyCapacity: [8, 16, 16, 8, 8],
    capacityUtilisation: 28,
    capacityStatus: 'Under Utilised'
  },
  {
    id: 'R-08',
    name: 'Aarav Rao',
    initials: 'AR',
    avatarBg: 'bg-slate-900 text-slate-100',
    role: 'Project Manager',
    department: 'Project Management',
    location: 'Berlin',
    allocationHours: 36,
    capacityHours: 40,
    status: 'Optimal',
    trendPath: 'M 0 8 Q 10 16, 20 5 T 40 12 T 60 8',
    weeklyCapacity: [32, 32, 40, 32, 32],
    capacityUtilisation: 84,
    capacityStatus: 'Optimal'
  },
  { id: 'R-09', name: 'Jisan Mahmud', initials: 'JM', avatarBg: 'bg-indigo-550 text-white', role: 'Developer', department: 'Development', location: 'Munich', allocationHours: 35, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 15 18, 30 8 T 60 12', weeklyCapacity: [32, 32, 36, 32, 28], capacityUtilisation: 80, capacityStatus: 'Optimal' },
  { id: 'R-10', name: 'Sadia Afrin', initials: 'SA', avatarBg: 'bg-violet-650 text-white', role: 'Business Analyst', department: 'Business Analysis', location: 'Frankfurt', allocationHours: 30, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 14 Q 10 5, 20 15 T 60 10', weeklyCapacity: [28, 30, 32, 28, 24], capacityUtilisation: 70, capacityStatus: 'Optimal' },
  { id: 'R-11', name: 'Sarah Davis', initials: 'SD', avatarBg: 'bg-pink-600 text-white', role: 'Project Manager', department: 'Project Management', location: 'Berlin', allocationHours: 38, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 6 Q 12 16, 24 5 T 60 10', weeklyCapacity: [36, 36, 40, 36, 32], capacityUtilisation: 88, capacityStatus: 'Optimal' },
  { id: 'R-12', name: 'Monirul Islam', initials: 'MI', avatarBg: 'bg-blue-600 text-white', role: 'QA Engineer', department: 'Quality Assurance', location: 'Munich', allocationHours: 22, capacityHours: 40, status: 'Under Utilised', trendPath: 'M 0 12 Q 10 18, 20 12 T 60 14', weeklyCapacity: [20, 24, 24, 20, 16], capacityUtilisation: 52, capacityStatus: 'Under Utilised' },
  { id: 'R-13', name: 'Pooja Gupta', initials: 'PG', avatarBg: 'bg-teal-650 text-white', role: 'Developer', department: 'Development', location: 'Frankfurt', allocationHours: 45, capacityHours: 45, status: 'Over Utilised', trendPath: 'M 0 18 Q 15 5, 30 15 T 60 8', weeklyCapacity: [40, 40, 48, 40, 36], capacityUtilisation: 102, capacityStatus: 'Over Utilised' },
  { id: 'R-14', name: 'Rohit Sharma', initials: 'RS', avatarBg: 'bg-slate-700 text-white', role: 'Developer', department: 'Development', location: 'Berlin', allocationHours: 36, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 8 Q 10 12, 20 8 T 60 10', weeklyCapacity: [32, 32, 36, 32, 28], capacityUtilisation: 80, capacityStatus: 'Optimal' },
  { id: 'R-15', name: 'Amit Patel', initials: 'AP', avatarBg: 'bg-purple-650 text-white', role: 'Database Engineer', department: 'Development', location: 'Munich', allocationHours: 41, capacityHours: 40, status: 'Over Utilised', trendPath: 'M 0 15 Q 12 8, 24 15 T 60 10', weeklyCapacity: [38, 40, 42, 38, 34], capacityUtilisation: 96, capacityStatus: 'Optimal' },
  { id: 'R-16', name: 'Sanjay Kumar', initials: 'SK', avatarBg: 'bg-emerald-50 text-white', role: 'Developer', department: 'Development', location: 'Frankfurt', allocationHours: 32, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 12 Q 10 5, 20 12 T 60 14', weeklyCapacity: [30, 32, 34, 30, 26], capacityUtilisation: 76, capacityStatus: 'Optimal' },
  { id: 'R-17', name: 'Rani Javaji', initials: 'RJ', avatarBg: 'bg-teal-50 text-white', role: 'UI/UX Designer', department: 'Design', location: 'Berlin', allocationHours: 26, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 14 Q 10 10, 20 16 T 60 12', weeklyCapacity: [24, 24, 28, 24, 20], capacityUtilisation: 60, capacityStatus: 'Under Utilised' },
  { id: 'R-18', name: 'NR Patnaik', initials: 'NP', avatarBg: 'bg-slate-900 text-slate-100', role: 'Project Manager', department: 'Project Management', location: 'Munich', allocationHours: 40, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 15 15, 30 8 T 60 10', weeklyCapacity: [38, 40, 40, 38, 36], capacityUtilisation: 96, capacityStatus: 'Optimal' },
  { id: 'R-19', name: 'Elena Rostova', initials: 'ER', avatarBg: 'bg-orange-50 text-white', role: 'Developer', department: 'Development', location: 'Berlin', allocationHours: 24, capacityHours: 40, status: 'Under Utilised', trendPath: 'M 0 16 Q 10 12, 20 18 T 60 15', weeklyCapacity: [20, 24, 24, 20, 16], capacityUtilisation: 52, capacityStatus: 'Under Utilised' },
  { id: 'R-20', name: 'Thomas Mueller', initials: 'TM', avatarBg: 'bg-indigo-650 text-white', role: 'QA Engineer', department: 'Quality Assurance', location: 'Munich', allocationHours: 35, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 12 Q 12 5, 24 12 T 60 10', weeklyCapacity: [32, 32, 36, 32, 28], capacityUtilisation: 80, capacityStatus: 'Optimal' },
  { id: 'R-21', name: 'Sophie Dubois', initials: 'SD', avatarBg: 'bg-violet-600 text-white', role: 'Business Analyst', department: 'Business Analysis', location: 'Frankfurt', allocationHours: 34, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 15 18, 30 12 T 60 14', weeklyCapacity: [30, 32, 36, 32, 28], capacityUtilisation: 78, capacityStatus: 'Optimal' },
  { id: 'R-22', name: 'John Doe', initials: 'JD', avatarBg: 'bg-slate-600 text-white', role: 'Developer', department: 'Development', location: 'Frankfurt', allocationHours: 44, capacityHours: 40, status: 'Over Utilised', trendPath: 'M 0 15 Q 12 4, 24 15 T 60 8', weeklyCapacity: [40, 40, 46, 40, 34], capacityUtilisation: 100, capacityStatus: 'Over Utilised' },
  { id: 'R-23', name: 'Alice Smith', initials: 'AS', avatarBg: 'bg-pink-600 text-white', role: 'UI/UX Designer', department: 'Design', location: 'Berlin', allocationHours: 28, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 12 Q 10 8, 20 12 T 60 10', weeklyCapacity: [24, 26, 30, 26, 20], capacityUtilisation: 64, capacityStatus: 'Under Utilised' },
  { id: 'R-24', name: 'Bob Johnson', initials: 'BJ', avatarBg: 'bg-teal-600 text-white', role: 'Developer', department: 'Development', location: 'Munich', allocationHours: 20, capacityHours: 40, status: 'Under Utilised', trendPath: 'M 0 18 Q 15 10, 30 18 T 60 15', weeklyCapacity: [16, 20, 24, 20, 16], capacityUtilisation: 48, capacityStatus: 'Under Utilised' },
  { id: 'R-25', name: 'Charlie Brown', initials: 'CB', avatarBg: 'bg-slate-700 text-white', role: 'Trainer', department: 'Training', location: 'Berlin', allocationHours: 12, capacityHours: 40, status: 'Under Utilised', trendPath: 'M 0 14 Q 10 5, 20 15 T 60 10', weeklyCapacity: [8, 12, 16, 12, 8], capacityUtilisation: 28, capacityStatus: 'Under Utilised' },
  { id: 'R-26', name: 'David Lee', initials: 'DL', avatarBg: 'bg-purple-600 text-white', role: 'Developer', department: 'Development', location: 'Munich', allocationHours: 32, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 15 15, 30 8 T 60 12', weeklyCapacity: [28, 30, 34, 30, 26], capacityUtilisation: 74, capacityStatus: 'Optimal' },
  { id: 'R-27', name: 'Emma Watson', initials: 'EW', avatarBg: 'bg-violet-650 text-white', role: 'Business Analyst', department: 'Business Analysis', location: 'Frankfurt', allocationHours: 36, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 12 Q 10 6, 20 12 T 60 10', weeklyCapacity: [32, 34, 38, 34, 30], capacityUtilisation: 84, capacityStatus: 'Optimal' },
  { id: 'R-28', name: 'Frank Harris', initials: 'FH', avatarBg: 'bg-emerald-600 text-white', role: 'QA Engineer', department: 'Quality Assurance', location: 'Munich', allocationHours: 38, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 15 18, 30 10 T 60 12', weeklyCapacity: [34, 36, 40, 36, 32], capacityUtilisation: 88, capacityStatus: 'Optimal' },
  { id: 'R-29', name: 'Grace Kelly', initials: 'GK', avatarBg: 'bg-pink-500 text-white', role: 'UI/UX Designer', department: 'Design', location: 'Berlin', allocationHours: 30, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 12 Q 10 8, 20 14 T 60 10', weeklyCapacity: [26, 28, 32, 28, 24], capacityUtilisation: 68, capacityStatus: 'Optimal' },
  { id: 'R-30', name: 'Henry Ford', initials: 'HF', avatarBg: 'bg-blue-600 text-white', role: 'Developer', department: 'Development', location: 'Frankfurt', allocationHours: 32, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 10 Q 12 15, 24 8 T 60 10', weeklyCapacity: [28, 30, 34, 30, 26], capacityUtilisation: 74, capacityStatus: 'Optimal' },
  { id: 'R-31', name: 'Isabella Ross', initials: 'IR', avatarBg: 'bg-orange-600 text-white', role: 'Developer', department: 'Development', location: 'Munich', allocationHours: 36, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 14 Q 10 10, 20 14 T 60 12', weeklyCapacity: [32, 34, 38, 34, 30], capacityUtilisation: 84, capacityStatus: 'Optimal' },
  { id: 'R-32', name: 'Jack Reacher', initials: 'JR', avatarBg: 'bg-slate-900 text-slate-100', role: 'Project Manager', department: 'Project Management', location: 'Berlin', allocationHours: 38, capacityHours: 40, status: 'Optimal', trendPath: 'M 0 8 Q 12 16, 24 5 T 60 10', weeklyCapacity: [34, 36, 40, 36, 32], capacityUtilisation: 88, capacityStatus: 'Optimal' }
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

export const useResourceUtilisationStore = create<ResourceUtilisationState>((set) => ({
  resources: INITIAL_RESOURCES,
  activeTab: 'utilisation',
  searchQuery: '',
  roleFilter: 'All',
  deptFilter: 'All',
  locationFilter: 'All',
  statusFilter: 'All',
  projectFilter: 'All',
  groupBy: 'None',
  currentPage: 1,
  itemsPerPage: 10,
  capacityPeriod: 'week',
  totalCount: INITIAL_RESOURCES.length,
  utilisationKpis: null,
  utilisationSummary: null,
  dateRange: getInitial2YearRange(),
  setDateRange: (dateRange) => set({ dateRange }),

  setResources: (resources) => set({ resources }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setDeptFilter: (deptFilter) => set({ deptFilter }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setProjectFilter: (projectFilter) => set({ projectFilter }),
  setGroupBy: (groupBy) => set({ groupBy }),
  setCurrentPage: (updater) => set((state) => ({
    currentPage: typeof updater === 'function' ? updater(state.currentPage) : updater
  })),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
  setCapacityPeriod: (capacityPeriod) => set({ capacityPeriod }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setUtilisationKpis: (utilisationKpis) => set({ utilisationKpis }),
  setUtilisationSummary: (utilisationSummary) => set({ utilisationSummary }),
  handleTabChange: (tab) => set((state) => {
    let size = 8;
    if (tab === 'utilisation') size = 10;
    else if (tab === 'capacity') size = 8;
    else size = 5;
    return {
      activeTab: tab,
      currentPage: 1,
      itemsPerPage: size
    };
  }),
  clearFilters: () => set({
    searchQuery: '',
    roleFilter: 'All',
    deptFilter: 'All',
    locationFilter: 'All',
    statusFilter: 'All',
    projectFilter: 'All',
    currentPage: 1
  })
}));

export const useFilteredResources = () => {
  const resources = useResourceUtilisationStore((state) => state.resources);
  const searchQuery = useResourceUtilisationStore((state) => state.searchQuery);
  const roleFilter = useResourceUtilisationStore((state) => state.roleFilter);
  const deptFilter = useResourceUtilisationStore((state) => state.deptFilter);
  const locationFilter = useResourceUtilisationStore((state) => state.locationFilter);
  const statusFilter = useResourceUtilisationStore((state) => state.statusFilter);
  const activeTab = useResourceUtilisationStore((state) => state.activeTab);

  return useMemo(() => {
    return resources.filter(res => {
      const matchSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'All' || res.role === roleFilter;
      const matchDept = deptFilter === 'All' || res.department === deptFilter;
      const matchLoc = locationFilter === 'All' || res.location === locationFilter;
      const matchStatus = statusFilter === 'All' || (activeTab === 'capacity' ? res.capacityStatus === statusFilter : res.status === statusFilter);

      return matchSearch && matchRole && matchDept && matchLoc && matchStatus;
    });
  }, [resources, searchQuery, roleFilter, deptFilter, locationFilter, statusFilter, activeTab]);
};

import { useMemo } from 'react';

export const useUtilisationKpis = () => {
  const filteredResources = useFilteredResources();
  const apiKpis = useResourceUtilisationStore((state) => state.utilisationKpis);
  return useMemo(() => {
    if (apiKpis) return apiKpis;
    const total = filteredResources.length;
    let totalAllocation = 0;
    let totalCapacity = 0;
    filteredResources.forEach(r => {
      totalAllocation += r.allocationHours;
      totalCapacity += r.capacityHours;
    });

    const averageUtil = totalCapacity > 0 ? Math.round((totalAllocation / totalCapacity) * 100) : 0;
    const overUtil = filteredResources.filter(r => r.status === 'Over Utilised').length;
    const underUtil = filteredResources.filter(r => r.status === 'Under Utilised').length;

    return {
      averageUtil,
      overUtil,
      underUtil,
      total
    };
  }, [filteredResources, apiKpis]);
};

export const useCapacityKpis = () => {
  const filteredResources = useFilteredResources();
  const kpis = useUtilisationKpis();
  return useMemo(() => {
    const totalCapacityVal = filteredResources.reduce((acc, r) => acc + r.capacityHours, 0);
    const allocatedVal = filteredResources.reduce((acc, r) => acc + r.allocationHours, 0);
    const nonBillableVal = Math.round(totalCapacityVal * 0.125);
    const availableVal = Math.max(0, totalCapacityVal - allocatedVal - nonBillableVal);
    const allocatedPct = totalCapacityVal > 0 ? Math.round((allocatedVal / totalCapacityVal) * 100) : 0;
    const nonBillablePct = totalCapacityVal > 0 ? Math.round((nonBillableVal / totalCapacityVal) * 100) : 0;
    const availablePct = totalCapacityVal > 0 ? Math.round((availableVal / totalCapacityVal) * 100) : 0;

    return {
      totalCapacity: totalCapacityVal.toLocaleString() + 'h',
      allocated: allocatedVal.toLocaleString() + 'h',
      allocatedPct: `${allocatedPct}% of total`,
      nonBillable: nonBillableVal.toLocaleString() + 'h',
      nonBillablePct: `${nonBillablePct}% of total`,
      available: availableVal.toLocaleString() + 'h',
      availablePct: `${availablePct}% of total`,
      resourcesText: `${filteredResources.length} resources`
    };
  }, [filteredResources, kpis.averageUtil]);
};

export const useTimesheetKpis = () => {
  const filteredResources = useFilteredResources();
  const apiKpis = useResourceUtilisationStore((state) => state.utilisationKpis);
  const searchQuery = useResourceUtilisationStore((state) => state.searchQuery);
  const roleFilter = useResourceUtilisationStore((state) => state.roleFilter);
  const deptFilter = useResourceUtilisationStore((state) => state.deptFilter);
  const locationFilter = useResourceUtilisationStore((state) => state.locationFilter);
  const statusFilter = useResourceUtilisationStore((state) => state.statusFilter);
  const projectFilter = useResourceUtilisationStore((state) => state.projectFilter);
  const currentPage = useResourceUtilisationStore((state) => state.currentPage);

  return useMemo(() => {
    const totalResourcesVal = apiKpis?.total ?? filteredResources.length;

    let totalAllocationVal = 0;
    let totalCapacityVal = 0;
    filteredResources.forEach(r => {
      totalAllocationVal += r.allocationHours;
      totalCapacityVal += r.capacityHours;
    });

    // Use API average_utilisation if available, else compute from resources
    const averageUtil = apiKpis != null
      ? apiKpis.averageUtil
      : (totalCapacityVal > 0 ? Math.round((totalAllocationVal / totalCapacityVal) * 100) : 0);

    const billableVal = Math.round(totalAllocationVal * 0.75);
    const nonBillableVal = totalAllocationVal - billableVal;

    return {
      averageUtil,
      totalAllocation: `${totalAllocationVal.toLocaleString()}h`,
      billable: `${billableVal.toLocaleString()}h`,
      billablePct: `${totalAllocationVal > 0 ? Math.round((billableVal / totalAllocationVal) * 100) : 0}% of total`,
      nonBillable: `${nonBillableVal.toLocaleString()}h`,
      nonBillablePct: `${totalAllocationVal > 0 ? Math.round((nonBillableVal / totalAllocationVal) * 100) : 0}% of total`,
      totalResources: totalResourcesVal
    };
  }, [filteredResources, apiKpis, searchQuery, roleFilter, deptFilter, locationFilter, statusFilter, projectFilter, currentPage]);
};;
