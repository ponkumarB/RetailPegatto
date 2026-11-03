'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import {
  CheckSquare,
  Search,
  Grid,
  List,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Loader2,
  PauseCircle,
  AlertTriangle,
  Calendar,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTasksNew, searchTasks, filterTasks, fetchUsersList } from '@/service/api/Leads/api';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  useTaskDashboardKPIQuery,
  useTaskDashboardAnalyticsQuery,
  useTaskDashboardFilterDropdownQuery
} from '@/service/dashboardQueries';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: {
    name: string;
    initials: string;
    color: string;
  };
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'In Progress' | 'On Hold' | 'Overdue' | 'Not Started';
  progress: number;
  dueDate: string;
  dueDaysText: string;
  dueDaysColor: string;
  lastUpdated: string;
}

const PROJECTS = [
  'Website Redesign',
  'CRM Implementation',
  'Mobile App Development',
  'HRMS Integration',
  'ERP Migration'
];

const ASSIGNEES = [
  { name: 'Aarav Rao', initials: 'AR', color: 'bg-slate-900' },
  { name: 'Priya Nair', initials: 'PN', color: 'bg-slate-800' },
  { name: 'Vikram Joshi', initials: 'VJ', color: 'bg-emerald-605' },
  { name: 'Sneha Verma', initials: 'SV', color: 'bg-indigo-900' },
  { name: 'Amit Singh', initials: 'AS', color: 'bg-indigo-600' },
  { name: 'Neha Patel', initials: 'NP', color: 'bg-slate-705' }
];

// Helper to generate the exact 128 task list matching screenshot statistics
const generate128Tasks = (): TaskItem[] => {
  // First 6 tasks exactly from the screenshot
  const tasks: TaskItem[] = [
    {
      id: 'TSK-001',
      title: 'Design new homepage',
      description: 'Create wireframes and UI mockups',
      project: 'Website Redesign',
      assignee: ASSIGNEES[0], // Aarav Rao
      priority: 'High',
      status: 'In Progress',
      progress: 65,
      dueDate: '31 May 2024',
      dueDaysText: '2 days left',
      dueDaysColor: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
      lastUpdated: '29 May 2024 10:30 AM'
    },
    {
      id: 'TSK-002',
      title: 'Develop responsive layout',
      description: 'Implement responsive design',
      project: 'Website Redesign',
      assignee: ASSIGNEES[2], // Vikram Joshi
      priority: 'High',
      status: 'In Progress',
      progress: 40,
      dueDate: '02 Jun 2024',
      dueDaysText: '4 days left',
      dueDaysColor: 'text-amber-600 bg-amber-50 border-amber-105 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
      lastUpdated: '29 May 2024 09:15 AM'
    },
    {
      id: 'TSK-003',
      title: 'Setup CMS integration',
      description: 'Integrate with WordPress CMS',
      project: 'Website Redesign',
      assignee: ASSIGNEES[1], // Priya Nair
      priority: 'Medium',
      status: 'In Progress',
      progress: 70,
      dueDate: '03 Jun 2024',
      dueDaysText: '5 days left',
      dueDaysColor: 'text-amber-600 bg-amber-50 border-amber-105 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
      lastUpdated: '28 May 2024 04:45 PM'
    },
    {
      id: 'TSK-004',
      title: 'Content migration',
      description: 'Migrate old content to new site',
      project: 'Website Redesign',
      assignee: ASSIGNEES[3], // Sneha Verma
      priority: 'Medium',
      status: 'On Hold',
      progress: 20,
      dueDate: '05 Jun 2024',
      dueDaysText: '7 days left',
      dueDaysColor: 'text-amber-600 bg-amber-50 border-amber-105 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
      lastUpdated: '27 May 2024 11:20 AM'
    },
    {
      id: 'TSK-005',
      title: 'Cross browser testing',
      description: 'Ensure compatibility across browsers',
      project: 'Website Redesign',
      assignee: ASSIGNEES[4], // Amit Singh
      priority: 'Low',
      status: 'Not Started',
      progress: 0,
      dueDate: '06 Jun 2024',
      dueDaysText: '8 days left',
      dueDaysColor: 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      lastUpdated: '27 May 2024 10:10 AM'
    },
    {
      id: 'TSK-006',
      title: 'SEO optimization',
      description: 'Optimize meta tags and content',
      project: 'Website Redesign',
      assignee: ASSIGNEES[5], // Neha Patel
      priority: 'Low',
      status: 'Not Started',
      progress: 0,
      dueDate: '07 Jun 2024',
      dueDaysText: '9 days left',
      dueDaysColor: 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      lastUpdated: '28 May 2024 06:30 PM'
    }
  ];

  // Helper arrays to fill counts exactly to screenshot metrics
  // Target: Aarav: 32, Priya: 28, Vikram: 24, Sneha: 20, Amit: 12, Neha: 12
  // Initial (first 6): Aarav: 1, Priya: 1, Vikram: 1, Sneha: 1, Amit: 1, Neha: 1
  const remainingAssignees: number[] = [
    ...Array(31).fill(0), // Aarav
    ...Array(27).fill(1), // Priya
    ...Array(23).fill(2), // Vikram
    ...Array(19).fill(3), // Sneha
    ...Array(11).fill(4), // Amit
    ...Array(11).fill(5), // Neha
  ];

  // Target Statuses: Completed: 48, In Progress: 50, On Hold: 12, Overdue: 16, Not Started: 2
  // Initial (first 6): Completed: 0, In Progress: 3, On Hold: 1, Overdue: 0, Not Started: 2
  // Remaining to allocate: Completed: 48, In Progress: 47, On Hold: 11, Overdue: 16
  const remainingStatuses: TaskItem['status'][] = [
    ...Array(48).fill('Completed'),
    ...Array(47).fill('In Progress'),
    ...Array(11).fill('On Hold'),
    ...Array(16).fill('Overdue')
  ];

  // Target Priorities: High: 40, Medium: 56, Low: 32
  // Initial (first 6): High: 2, Medium: 2, Low: 2
  // Remaining to allocate: High: 38, Medium: 54, Low: 30
  const remainingPriorities: TaskItem['priority'][] = [
    ...Array(38).fill('High'),
    ...Array(54).fill('Medium'),
    ...Array(30).fill('Low')
  ];

  // Generate 122 more tasks to total 128
  for (let i = 0; i < 122; i++) {
    const idNum = String(i + 7).padStart(3, '0');
    const assignee = ASSIGNEES[remainingAssignees[i]];
    const status = remainingStatuses[i];
    const priority = remainingPriorities[i];

    let progress = 0;
    if (status === 'Completed') progress = 100;
    else if (status === 'In Progress') progress = Math.floor(Math.random() * 60) + 15;
    else if (status === 'On Hold') progress = Math.floor(Math.random() * 30) + 5;
    else if (status === 'Overdue') progress = Math.floor(Math.random() * 80) + 10;

    const projIndex = i % PROJECTS.length;
    const project = PROJECTS[projIndex];

    const dueDay = (i % 28) + 1;
    const dueDate = `${dueDay < 10 ? '0' + dueDay : dueDay} May 2024`;

    let dueDaysText = 'Expired';
    let dueDaysColor = 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
    if (status === 'Completed') {
      dueDaysText = 'Completed';
      dueDaysColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30';
    } else if (status === 'In Progress' || status === 'Not Started') {
      const left = (i % 12) + 2;
      dueDaysText = `${left} days left`;
      dueDaysColor = left > 5
        ? 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        : 'text-amber-600 bg-amber-50 border-amber-105 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30';
    }

    tasks.push({
      id: `TSK-${idNum}`,
      title: `Task implementation details ${idNum}`,
      description: `Description overview for task ${idNum}`,
      project,
      assignee,
      priority,
      status,
      progress,
      dueDate,
      dueDaysText,
      dueDaysColor,
      lastUpdated: '28 May 2024 02:15 PM'
    });
  }

  return tasks;
};

export default function TrackTaskDashboard() {
  const router = useRouter();
  const {
    canViewTaskStatusOverview,
    canCreateTaskStatus,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTaskStatusOverview) {
      toast.error('You do not have permission to view Task Status.');
      router.push('/');
    }
  }, [canViewTaskStatusOverview, isLoaded, router]);

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // Dialog & Active Filter States
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Dialog local filter states (applied on clicking 'Apply')
  const [tempCreatedBy, setTempCreatedBy] = useState<string>('');
  const [tempAssignedTo, setTempAssignedTo] = useState<string>('');
  const [tempStatus, setTempStatus] = useState<string>('');
  const [tempPriority, setTempPriority] = useState<string>('');
  const [tempCompletion, setTempCompletion] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');

  // Active filter states (used for API queries)
  const [activeCreatedBy, setActiveCreatedBy] = useState<string>('');
  const [activeAssignedTo, setActiveAssignedTo] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<string>('');
  const [activePriority, setActivePriority] = useState<string>('');
  const [activeCompletion, setActiveCompletion] = useState<string>('');
  const [activeStartDate, setActiveStartDate] = useState<string>('');
  const [activeEndDate, setActiveEndDate] = useState<string>('');

  // Keep compatibility states for projects
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [dateFilter, setDateFilter] = useState('All Time');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const createdBy = typeof window !== 'undefined' ? (Number(localStorage.getItem('userId') || localStorage.getItem('UserId')) || 71) : 71;

  // Helpers to parse dates
  const parseDateString = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split(' ');
    if (parts.length !== 3) return '';
    const day = parts[0].padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = months.indexOf(parts[1]);
    if (monthIdx === -1) return '';
    const month = String(monthIdx + 1).padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  };

  const parseDateRange = (rangeStr: string) => {
    if (!rangeStr || rangeStr === 'All Time') {
      return { start_date: '2024-01-01', end_date: '2027-12-31' };
    }
    const parts = rangeStr.split(' - ');
    if (parts.length !== 2) {
      return { start_date: '2024-01-01', end_date: '2027-12-31' };
    }
    return {
      start_date: parseDateString(parts[0]) || '2024-01-01',
      end_date: parseDateString(parts[1]) || '2027-12-31'
    };
  };

  const { start_date, end_date } = useMemo(() => parseDateRange(dateFilter), [dateFilter]);

  // Fetch dropdown values
  const { data: dropdownsData } = useTaskDashboardFilterDropdownQuery();
  const dropdowns = dropdownsData?.data || dropdownsData || {};

  // Fetch users from /useradmin/UsersList/ endpoint
  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
    staleTime: 5 * 60 * 1000,
  });

  const usersList = useMemo(() => {
    const raw = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((u: any) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        return {
          id: u.id || u.User_Id || u.UserId,
          name: fullName || u.username || `User ${u.id}`
        };
      }).filter((u: any) => u.id !== undefined && u.id !== null);
    }
    return [];
  }, [usersRaw]);

  // Extract lists dynamically from API response, fallback to default mock lists if empty or missing
  const projectList = useMemo(() => {
    const list = dropdowns.projects || dropdowns.project || [];
    return list.map((p: any) => ({
      id: p.id || p.Project_Id,
      name: p.Project_Name || p.name || String(p)
    }));
  }, [dropdowns]);

  const assigneeList = useMemo(() => {
    const list = dropdowns.assignees || dropdowns.assigned_to || dropdowns.users || [];
    return list.map((a: any) => ({
      id: a.id || a.User_Id || a.UserId || a.id,
      name: a.Username || a.name || a.first_name || String(a)
    }));
  }, [dropdowns]);

  const priorityList = useMemo(() => {
    const list = dropdowns.priorities || [];
    return list.map((p: any) => p.value || String(p));
  }, [dropdowns]);

  const statusList = useMemo(() => {
    const list = dropdowns.statuses || [];
    return list.map((s: any) => s.value || String(s));
  }, [dropdowns]);

  const projects = useMemo(() => {
    return projectList.length > 0 ? projectList : PROJECTS.map((p, idx) => ({ id: 224 + idx, name: p }));
  }, [projectList]);

  const assignees = useMemo(() => {
    if (usersList.length > 0) return usersList;
    if (assigneeList.length > 0) return assigneeList;
    return ASSIGNEES.map((a, idx) => ({ id: 72 + idx, name: a.name }));
  }, [usersList, assigneeList]);

  const priorities = useMemo(() => {
    return priorityList.length > 0 ? priorityList : ['High', 'Medium', 'Low'];
  }, [priorityList]);

  const statuses = useMemo(() => {
    return statusList.length > 0 ? statusList : ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Overdue'];
  }, [statusList]);

  // Map filters to API payload values
  const selectedProjectObj = projects.find(p => p.name === projectFilter);
  const projectId = selectedProjectObj ? selectedProjectObj.id : null;

  const selectedAssigneeObj = assignees.find(a => a.name === assigneeFilter);
  const assignedToId = selectedAssigneeObj ? selectedAssigneeObj.id : null;

  const statusApiVal = statusFilter === 'All Status' ? '' : statusFilter;
  const priorityApiVal = priorityFilter === 'All Priority' ? '' : priorityFilter;

  // 1. Fetch KPIs
  const { data: kpisData, isLoading: isKpisLoading } = useTaskDashboardKPIQuery({
    start_date: activeStartDate || '2024-01-01',
    end_date: activeEndDate || '2027-12-31'
  });

  // 2. Fetch Analytics
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useTaskDashboardAnalyticsQuery({
    project_id: null,
    assigned_to: activeAssignedTo ? Number(activeAssignedTo) : null,
    created_by: activeCreatedBy ? Number(activeCreatedBy) : createdBy,
    status: activeStatus || '',
    priority: activePriority || '',
    start_date: activeStartDate || '2024-01-01',
    end_date: activeEndDate || '2027-12-31'
  });

  // 3. Fetch Task List from the search and filter APIs: Newtaskmanagmentsearch and Newtaskmanagmentfilter
  const { data: listData, isLoading: isListLoading } = useQuery({
    queryKey: ['taskDashboardList', activeCreatedBy, activeAssignedTo, activeStatus, activePriority, activeCompletion, activeStartDate, activeEndDate, debouncedSearchQuery, currentPage],
    queryFn: () => {
      if (debouncedSearchQuery.trim() !== '') {
        return searchTasks({
          created_by: activeCreatedBy || undefined,
          status: activeStatus || undefined,
          assigned_to: activeAssignedTo || undefined,
          search: debouncedSearchQuery,
          page: currentPage
        });
      } else {
        const dateRangeArray = (activeStartDate && activeEndDate) ? [activeStartDate, activeEndDate] : [];
        return filterTasks({
          created_by: activeCreatedBy ? Number(activeCreatedBy) : null,
          assigned_to: activeAssignedTo ? Number(activeAssignedTo) : null,
          status: activeStatus || null,
          TaskName: '',
          Completion: activeCompletion || '',
          Priority: activePriority || null,
          Assigned_person: '',
          Start_Date: dateRangeArray,
          project_name: '',
          page: currentPage
        });
      }
    }
  });

  const kpis = kpisData?.data || kpisData || {};

  const getKpiCount = (val: any): number => {
    if (val && typeof val === 'object') {
      return Number(val.count ?? val.value ?? 0);
    }
    return Number(val ?? 0);
  };

  const getKpiPercent = (val: any, fallbackPercent: string): string => {
    if (val && typeof val === 'object' && val.percentage !== undefined) {
      return String(val.percentage);
    }
    return fallbackPercent;
  };

  const totalCount = getKpiCount(kpis.total_tasks ?? kpis.totalCount ?? kpis.TotalCount ?? kpis.total);
  const completedCount = getKpiCount(kpis.completed_tasks ?? kpis.completedCount ?? kpis.CompletedCount ?? kpis.completed);
  const inProgressCount = getKpiCount(kpis.in_progress_tasks ?? kpis.inProgressCount ?? kpis.InProgressCount ?? kpis.in_progress);
  const onHoldCount = getKpiCount(kpis.on_hold_tasks ?? kpis.onHoldCount ?? kpis.OnHoldCount ?? kpis.on_hold);
  const overdueCount = getKpiCount(kpis.overdue_tasks ?? kpis.overdueCount ?? kpis.OverdueCount ?? kpis.overdue);

  const completedPercent = getKpiPercent(
    kpis.completed_tasks ?? kpis.completedCount ?? kpis.CompletedCount ?? kpis.completed,
    totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(2) : '0'
  );
  const inProgressPercent = getKpiPercent(
    kpis.in_progress_tasks ?? kpis.inProgressCount ?? kpis.InProgressCount ?? kpis.in_progress,
    totalCount > 0 ? ((inProgressCount / totalCount) * 100).toFixed(2) : '0'
  );
  const onHoldPercent = getKpiPercent(
    kpis.on_hold_tasks ?? kpis.onHoldCount ?? kpis.OnHoldCount ?? kpis.on_hold,
    totalCount > 0 ? ((onHoldCount / totalCount) * 100).toFixed(2) : '0'
  );
  const overduePercent = getKpiPercent(
    kpis.overdue_tasks ?? kpis.overdueCount ?? kpis.OverdueCount ?? kpis.overdue,
    totalCount > 0 ? ((overdueCount / totalCount) * 100).toFixed(2) : '0'
  );

  const analytics = analyticsData?.data || analyticsData || {};
  const rawTasks: any[] = Array.isArray(listData) ? listData : (listData?.results || []);

  // Extract Status counts for Pie chart
  const statusPieData = useMemo(() => {
    if (analytics.task_status && Array.isArray(analytics.task_status)) {
      return analytics.task_status.map((item: any) => {
        const colors: Record<string, string> = {
          Completed: '#10B981',
          'In Progress': '#3B82F6',
          'On Hold': '#F59E0B',
          Overdue: '#EF4444',
          'Not Started': '#6B7280',
          Pending: '#8B5CF6'
        };
        return {
          name: item.status,
          value: Number(item.count),
          color: colors[item.status] || '#3B82F6',
          percent: String(item.percentage)
        };
      }).filter((d: any) => d.value > 0);
    }
    if (analytics.status_distribution) {
      return Object.entries(analytics.status_distribution).map(([name, val]: any) => {
        const colors: Record<string, string> = {
          Completed: '#10B981',
          'In Progress': '#3B82F6',
          'On Hold': '#F59E0B',
          Overdue: '#EF4444',
          'Not Started': '#6B7280',
          Pending: '#8B5CF6'
        };
        const value = Number(val);
        const percent = totalCount > 0 ? ((value / totalCount) * 100).toFixed(2) : '0';
        return { name, value, color: colors[name] || '#3B82F6', percent };
      }).filter(d => d.value > 0);
    }
    return [
      { name: 'Completed', value: completedCount, color: '#10B981', percent: completedPercent },
      { name: 'In Progress', value: inProgressCount, color: '#3B82F6', percent: inProgressPercent },
      { name: 'On Hold', value: onHoldCount, color: '#F59E0B', percent: onHoldPercent },
      { name: 'Overdue', value: overdueCount, color: '#EF4444', percent: overduePercent }
    ].filter(d => d.value > 0);
  }, [analytics, completedCount, inProgressCount, onHoldCount, overdueCount, totalCount, completedPercent, inProgressPercent, onHoldPercent, overduePercent]);

  // Extract Priority counts for Pie chart
  const priorityPieData = useMemo(() => {
    if (analytics.task_priority && Array.isArray(analytics.task_priority)) {
      return analytics.task_priority.map((item: any) => {
        const colors: Record<string, string> = {
          High: '#EF4444',
          Medium: '#F59E0B',
          Low: '#10B981'
        };
        return {
          name: item.priority,
          value: Number(item.count),
          color: colors[item.priority] || '#3B82F6',
          percent: String(item.percentage)
        };
      }).filter((d: any) => d.value > 0);
    }
    if (analytics.priority_distribution) {
      return Object.entries(analytics.priority_distribution).map(([name, val]: any) => {
        const colors: Record<string, string> = {
          High: '#EF4444',
          Medium: '#F59E0B',
          Low: '#10B981'
        };
        const value = Number(val);
        const percent = totalCount > 0 ? ((value / totalCount) * 100).toFixed(2) : '0';
        return { name, value, color: colors[name] || '#3B82F6', percent };
      }).filter(d => d.value > 0);
    }
    const highCount = rawTasks.filter((t: any) => t.Priority === 'High' || t.priority === 'High').length;
    const mediumCount = rawTasks.filter((t: any) => t.Priority === 'Medium' || t.priority === 'Medium').length;
    const lowCount = rawTasks.filter((t: any) => t.Priority === 'Low' || t.priority === 'Low').length;
    return [
      { name: 'High', value: highCount, color: '#EF4444', percent: totalCount > 0 ? ((highCount / totalCount) * 100).toFixed(2) : '0' },
      { name: 'Medium', value: mediumCount, color: '#F59E0B', percent: totalCount > 0 ? ((mediumCount / totalCount) * 100).toFixed(2) : '0' },
      { name: 'Low', value: lowCount, color: '#10B981', percent: totalCount > 0 ? ((lowCount / totalCount) * 100).toFixed(2) : '0' }
    ].filter(d => d.value > 0);
  }, [analytics, rawTasks, totalCount]);

  // Extract Assignee workloads
  const assigneeWorkloads = useMemo(() => {
    if (analytics.task_assignee && Array.isArray(analytics.task_assignee)) {
      return analytics.task_assignee.map((item: any) => {
        const name = item.user_name || 'Tamil selvan';
        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-600', 'bg-pink-500'];
        const barColor = colors[Math.abs(name.charCodeAt(0)) % colors.length];
        return {
          name,
          value: Number(item.count),
          barColor
        };
      }).sort((a: any, b: any) => b.value - a.value);
    }
    if (analytics.assignee_workloads) {
      return Object.entries(analytics.assignee_workloads).map(([name, val]: any) => {
        const value = Number(val);
        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-600', 'bg-pink-500'];
        const barColor = colors[Math.abs(name.charCodeAt(0)) % colors.length];
        return { name, value, barColor };
      }).sort((a, b) => b.value - a.value);
    }
    const counts = ASSIGNEES.map(as => {
      const value = rawTasks.filter((t: any) => (t.Assigned_person || t.assignedTo) === as.name).length;
      return {
        ...as,
        value,
        barColor: as.name === 'Aarav Rao' ? 'bg-blue-500' :
          as.name === 'Priya Nair' ? 'bg-indigo-500' :
            as.name === 'Vikram Joshi' ? 'bg-orange-500' :
              as.name === 'Sneha Verma' ? 'bg-emerald-500' :
                as.name === 'Amit Singh' ? 'bg-blue-600' : 'bg-pink-500'
      };
    });
    return counts.sort((a, b) => b.value - a.value);
  }, [analytics, rawTasks]);

  // Map API task array to TaskItem format
  const mappedTasks: TaskItem[] = useMemo(() => {
    return rawTasks.map((t: any) => {
      const id = String(t.Projecttask_Id || t.id || t.ProjectTask_Id || String(Math.random()).substring(2, 7));
      const title = t.TaskName || t.Task_Name || 'Untitled Task';
      const description = t.Task_Desc || t.Description || '';
      const project = t.Project_Name
        || (t.Project && typeof t.Project === 'object' ? (t.Project.project_name || t.Project.name || '') : t.Project)
        || 'Website Redesign';

      const rawAssignee = t.Assigned_person || t.Responsible_Persion;
      const assigneeName = rawAssignee && typeof rawAssignee === 'object'
        ? (rawAssignee.Username || rawAssignee.name || rawAssignee.first_name || 'Aarav Rao')
        : (rawAssignee || 'Aarav Rao');

      const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      const colors = ['bg-slate-900', 'bg-slate-800', 'bg-emerald-605', 'bg-indigo-900', 'bg-indigo-600', 'bg-slate-705'];
      const color = colors[Math.abs(assigneeName.charCodeAt(0)) % colors.length];

      const rawStatus = t.Status;
      const status = rawStatus && typeof rawStatus === 'object' ? (rawStatus.value || rawStatus.name || 'Not Started') : (rawStatus || 'Not Started');

      const progress = Number(t.Complete_Percentage || t.Completion || 0);

      const rawPriority = t.Priority;
      const priority = rawPriority && typeof rawPriority === 'object' ? (rawPriority.value || rawPriority.name || 'Medium') : (rawPriority || 'Medium');

      const rawDueDate = t.Due_Date || t.dueDate || '';
      const dueDate = rawDueDate ? new Date(rawDueDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';

      let dueDaysText = 'Expired';
      let dueDaysColor = 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';

      if (status === 'Completed') {
        dueDaysText = 'Completed';
        dueDaysColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30';
      } else if (status === 'In Progress' || status === 'Not Started') {
        dueDaysText = 'Active';
        dueDaysColor = 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      }

      const rawUpdated = t.Updated_Date || t.Updated_By || '';
      const lastUpdated = rawUpdated ? new Date(rawUpdated).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }) : 'Just now';

      return {
        id,
        title,
        description,
        project,
        assignee: {
          name: assigneeName,
          initials,
          color
        },
        priority,
        status,
        progress,
        dueDate,
        dueDaysText,
        dueDaysColor,
        lastUpdated
      };
    });
  }, [rawTasks]);

  // Total count from API pagination or array length
  const listTotalCount = typeof listData?.count === 'number' ? listData.count : mappedTasks.length;

  // Pagination bounds
  const totalPages = Math.ceil(listTotalCount / pageSize);
  const activePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (activePage - 1) * pageSize;

  // If backend returned paginated results object, use as is. Else slice client-side
  const paginatedTasks = typeof listData?.count === 'number'
    ? mappedTasks
    : mappedTasks.slice(startIndex, startIndex + pageSize);

  const handleResetFilters = () => {
    setTempCreatedBy('');
    setTempAssignedTo('');
    setTempStatus('');
    setTempPriority('');
    setTempCompletion('');
    setTempStartDate('');
    setTempEndDate('');

    setActiveCreatedBy('');
    setActiveAssignedTo('');
    setActiveStatus('');
    setActivePriority('');
    setActiveCompletion('');
    setActiveStartDate('');
    setActiveEndDate('');

    setProjectFilter('All Projects');
    setAssigneeFilter('All Assignees');
    setStatusFilter('All Status');
    setPriorityFilter('All Priority');
    setDateFilter('All Time');

    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    let validCompletion = tempCompletion;
    if (tempCompletion !== '') {
      const num = Number(tempCompletion);
      if (!isNaN(num)) {
        if (num < 0) validCompletion = '0';
        else if (num > 100) validCompletion = '100';
      }
    }
    setActiveCreatedBy(tempCreatedBy);
    setActiveAssignedTo(tempAssignedTo);
    setActiveStatus(tempStatus);
    setActivePriority(tempPriority);
    setActiveCompletion(validCompletion);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setCurrentPage(1);
    setIsFilterDialogOpen(false);
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30">Completed</span>;
      case 'In Progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">In Progress</span>;
      case 'On Hold':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-purple-50 text-purple-650 border border-purple-100 dark:bg-purple-955/20 dark:text-purple-400 dark:border-purple-900/30">On Hold</span>;
      case 'Overdue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30">Overdue</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-355 dark:border-slate-700">Not Started</span>;
    }
  };

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'High':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-105 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-105 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">Medium</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30">Low</span>;
    }
  };

  const columns = useMemo<ColumnConfig<TaskItem>[]>(() => [
    {
      key: 'title',
      header: 'Task Name',
      render: (task) => (
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors block truncate">{task.title}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate mt-0.5">{task.description}</span>
        </div>
      )
    },
    {
      key: 'project',
      header: 'Project',
      render: (task) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {task.project}
        </span>
      )
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (task) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-2xs select-none",
            task.assignee.color
          )}>
            {task.assignee.initials}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-350 font-semibold">{task.assignee.name}</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => getPriorityBadge(task.priority)
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => getStatusBadge(task.status)
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (task) => (
        <div className="flex items-center gap-2 max-w-[120px]">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                task.progress >= 60 ? "bg-emerald-500" :
                  task.progress >= 30 ? "bg-blue-500" : "bg-rose-500"
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] font-extrabold text-slate-550 dark:text-slate-355 shrink-0 w-8">{task.progress}%</span>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (task) => (
        <div className="flex flex-col text-left">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{task.dueDate}</span>
          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold w-fit mt-0.5", task.dueDaysColor)}>
            {task.dueDaysText}
          </span>
        </div>
      )
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (task) => (
        <span className="text-xs text-slate-400 font-medium">
          {task.lastUpdated}
        </span>
      )
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (task) => (
        <div className="text-right flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-[5px]">
                <MoreHorizontal className="h-4 w-4 text-slate-450" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
              <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Task Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={() => {
                alert('Task deletion requires permissions');
              }}>
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [router]);

  if (isLoaded && !canViewTaskStatusOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">

      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Task Status</h1>
          <p className="text-xs text-slate-450 mt-1">Monitor task progress, status, and updates in real-time.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDialogOpen(true)}
            className={cn(
              "h-9 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs",
              (activeCreatedBy || activeAssignedTo || activeStatus || activePriority || activeCompletion || activeStartDate || activeEndDate) && "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>

        </div>
      </div>

      {/* Active Filters Applied Badges */}
      {(activeCreatedBy || activeAssignedTo || activeStatus || activePriority || activeCompletion || activeStartDate || activeEndDate) && (
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs p-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-bold text-slate-500 mr-2">Active Filters Applied:</div>
              {activeCreatedBy && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Created By: {assignees.find(a => String(a.id) === activeCreatedBy)?.name || activeCreatedBy}
                  <button onClick={() => { setActiveCreatedBy(''); setTempCreatedBy(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeAssignedTo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Assigned To: {assignees.find(a => String(a.id) === activeAssignedTo)?.name || activeAssignedTo}
                  <button onClick={() => { setActiveAssignedTo(''); setTempAssignedTo(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeStatus && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Status: {activeStatus}
                  <button onClick={() => { setActiveStatus(''); setTempStatus(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activePriority && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Priority: {activePriority}
                  <button onClick={() => { setActivePriority(''); setTempPriority(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeCompletion && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Completion: {activeCompletion}%
                  <button onClick={() => { setActiveCompletion(''); setTempCompletion(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(activeStartDate || activeEndDate) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                  Dates: {activeStartDate || 'N/A'} to {activeEndDate || 'N/A'}
                  <button onClick={() => { setActiveStartDate(''); setActiveEndDate(''); setTempStartDate(''); setTempEndDate(''); }} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2.5 cursor-pointer shadow-none"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reset All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

        {/* Total Tasks */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 shrink-0">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Total Tasks</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalCount}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-semibold">All Time</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Completed</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{completedCount}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-bold">{completedPercent}%</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500 shrink-0">
              <Loader2 className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">In Progress</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{inProgressCount}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-bold">{inProgressPercent}%</p>
            </div>
          </CardContent>
        </Card>

        {/* On Hold */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-650 shrink-0">
              <PauseCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">On Hold</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{onHoldCount}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-bold">{onHoldPercent}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Overdue</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{overdueCount}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-bold">{overduePercent}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Filter Tasks
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-left">
            {/* Created By */}
            <div className="grid gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created By</label>
              <select
                value={tempCreatedBy}
                onChange={(e) => setTempCreatedBy(e.target.value)}
                className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Creators</option>
                {assignees.map(as => (
                  <option key={as.id} value={as.id}>{as.name}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div className="grid gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</label>
              <select
                value={tempAssignedTo}
                onChange={(e) => setTempAssignedTo(e.target.value)}
                className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Assignees</option>
                {assignees.map(as => (
                  <option key={as.id} value={as.id}>{as.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="grid gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Status</label>
              <select
                value={tempStatus}
                onChange={(e) => setTempStatus(e.target.value)}
                className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="grid gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
              <select
                value={tempPriority}
                onChange={(e) => setTempPriority(e.target.value)}
                className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Completion */}
            <div className="grid gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 50"
                value={tempCompletion}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTempCompletion('');
                    return;
                  }
                  const num = Number(val);
                  if (isNaN(num)) return;
                  if (num < 0) {
                    setTempCompletion('0');
                  } else if (num > 100) {
                    setTempCompletion('100');
                  } else {
                    setTempCompletion(val);
                  }
                }}
                className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            {/* Start Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterDialogOpen(false)}
              className="h-9 text-xs font-bold rounded-[5px] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="h-9 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-[5px] cursor-pointer"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Donut Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Task Status Overview */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Task Status Overview</h3>
          </div>
          <CardContent className="p-5 flex items-center justify-between gap-2 h-[170px]">
            <div className="h-[120px] w-[120px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={52}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-base font-extrabold text-slate-850 dark:text-white leading-none">{totalCount}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col justify-center space-y-1.5 text-[10px] font-semibold text-slate-450 w-full pl-2">
              {statusPieData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{entry.name}</span>
                  </div>
                  <span className="text-slate-850 dark:text-slate-200 font-extrabold">{entry.value} ({entry.percent}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Tasks by Priority</h3>
          </div>
          <CardContent className="p-5 flex items-center justify-between gap-2 h-[170px]">
            <div className="h-[120px] w-[120px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={52}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {priorityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-base font-extrabold text-slate-850 dark:text-white leading-none">{totalCount}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col justify-center space-y-1.5 text-[10px] font-semibold text-slate-450 w-full pl-2">
              {priorityPieData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{entry.name}</span>
                  </div>
                  <span className="text-slate-850 dark:text-slate-200 font-extrabold">{entry.value} ({entry.percent}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Assignee */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Tasks by Assignee</h3>
          </div>
          <CardContent className="p-5 flex flex-col justify-center gap-2.5 h-[170px] overflow-y-auto">
            {assigneeWorkloads.map((as, idx) => {
              const maxVal = Math.max(...assigneeWorkloads.map(x => x.value)) || 1;
              const barPercent = ((as.value / maxVal) * 100).toFixed(0);
              return (
                <div key={`${as.name}-${idx}`} className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-355">
                  <span className="w-24 truncate text-left">{as.name}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", as.barColor)}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-extrabold text-slate-800 dark:text-white">{as.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

      {/* Bottom Task List Card */}
      <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">

        {/* Table Toolbar */}
        <div className="border-b border-slate-100 dark:border-slate-855 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Task List</h3>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto justify-end">

            {/* Search Input */}
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search task..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8.5 pl-8 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 placeholder-slate-400 w-full focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 bg-transparent"
              />
            </div>

            {/* View Mode Layout toggles */}
            <div className="flex border border-slate-205 dark:border-slate-800 rounded-[5px] overflow-hidden bg-white dark:bg-slate-900 h-8.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  "h-full w-8 rounded-none border-r border-slate-100 dark:border-slate-800 cursor-pointer transition-colors",
                  viewMode === 'list'
                    ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('card')}
                className={cn(
                  "h-full w-8 rounded-none cursor-pointer transition-colors",
                  viewMode === 'card'
                    ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Grid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table/Card Content */}
        {viewMode === 'list' ? (
          <div className="p-1">
            <ReusableTable
              columns={columns}
              data={paginatedTasks}
              loading={isListLoading}
              selectable={true}
              showGear={false}
            />
          </div>
        ) : (
          <div className="p-6 bg-slate-50/10 dark:bg-slate-900/5">
            {isListLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
                    <div className="flex justify-between items-center pt-3 border-t dark:border-slate-800">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-6" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <CheckSquare className="h-8 w-8 text-slate-350" />
                <p className="text-sm font-medium">No tasks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedTasks.map((task) => (
                  <Card key={task.id} className="relative flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{task.project}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-450 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
                          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Task Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={(e) => {
                            e.stopPropagation();
                            alert('Task deletion requires permissions');
                          }}>
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => router.push(`/tasks/${task.id}`)}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[32px]">
                        {task.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 my-3">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-555 dark:text-slate-400">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            task.progress >= 60 ? "bg-emerald-500" :
                              task.progress >= 30 ? "bg-blue-500" : "bg-rose-500"
                          )}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer / Assignee and Due Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-2xs select-none",
                          task.assignee.color
                        )}>
                          {task.assignee.initials}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-350 font-semibold truncate max-w-[80px]">
                          {task.assignee.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Due Date</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">{task.dueDate}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Pagination */}
        <div className="border-t border-slate-105 dark:border-slate-850 px-6 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/20 dark:bg-slate-955/5">
          <div>
            Showing <span className="text-slate-800 dark:text-white font-extrabold">{startIndex + 1}</span> to <span className="text-slate-800 dark:text-white font-extrabold">{Math.min(startIndex + pageSize, listTotalCount)}</span> of <span className="text-slate-800 dark:text-white font-extrabold">{listTotalCount}</span> tasks
          </div>
          <div className="flex items-center gap-2">

            {/* Pagination controls */}
            <div className="flex items-center border border-slate-205 dark:border-slate-800 rounded-[5px] overflow-hidden bg-white dark:bg-slate-900">
              <Button
                variant="ghost"
                size="icon"
                disabled={activePage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-7.5 w-7.5 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 disabled:opacity-40 border-r dark:border-slate-800 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-3.5 text-xs text-slate-700 dark:text-slate-300 font-extrabold border-r dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20">
                {activePage} / {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={activePage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-7.5 w-7.5 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Page Size select */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-7.5 px-2 text-xs font-bold border border-slate-205 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {[5, 10, 20, 50].map(sz => (
                <option key={sz} value={sz}>{sz} / page</option>
              ))}
            </select>
          </div>
        </div>

      </Card>

    </div>
  );
}
