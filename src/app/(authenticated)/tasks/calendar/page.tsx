'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useQuery } from '@tanstack/react-query';
import { fetchUsersList } from '@/service/api/Leads/api';
import {
  fetchNewTaskManagemntList,
  filterNewITTaskCalendar,
  fetchNewITTaskSummary,
  NewITTaskCalendarFilterPayload
} from '@/service/api/ProjectTask/api';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Phone,
  Users,
  Mail,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { Task } from '@/types/tasks';

const getUserId = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const s = localStorage.getItem('userData');
      if (s) {
        const u = JSON.parse(s);
        const id = Number(u?.id);
        if (!isNaN(id) && id > 0) return id;
      }
    } catch { }
  }
  return 0;
};

function getAssignedName(item: any): string {
  if (item.Assigned_To) {
    const u = item.Assigned_To;
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return full || u.username || 'Unknown';
  }
  return item.Assigned_person || '—';
}

function getRelatedTo(item: any): { label: string; type: string } {
  if (item.Project) return { label: item.Project.project_name || 'Project', type: 'Project' };
  if (item.Project_Name) return { label: item.Project_Name, type: 'Project' };
  if (item.Deal_Id) return { label: item.Deal_Id.Deal_Name || 'Deal', type: 'Deal' };
  if (item.Lead_Id) {
    const l = item.Lead_Id;
    const name = `${l.LeadFirstName || ''} ${l.LeadLastName || ''}`.trim() || l.CompanyName || 'Lead';
    return { label: name, type: 'Lead' };
  }
  if (item.Task_Category) return { label: item.Task_Category, type: 'Category' };
  return { label: item.Task_Related || '—', type: item.Related_To || '' };
}

function isBackendTaskOverdue(item: any): boolean {
  if (item.Status === 'Completed') return false;
  const dueDateStr = item.Due_Date || item.Deadline_Date || item.Completion_Date;
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

function formatTimeFromISO(isoStr?: string): string {
  if (!isoStr || !isoStr.includes('T')) return '';
  try {
    const timePart = isoStr.split('T')[1].split('+')[0]; // e.g. "14:43:00"
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return '';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const mFormatted = m < 10 ? `0${m}` : m;
    return `${h}:${mFormatted} ${ampm}`;
  } catch {
    return '';
  }
}

function mapBackendTaskToFrontend(b: any): Task {
  const assignedName = getAssignedName(b);
  const rel = getRelatedTo(b);

  let status: Task['status'] = 'Pending';
  if (b.Status === 'Completed') status = 'Completed';
  else if (b.Status === 'In Progress' || b.Status === 'In Assigned') status = 'In Progress';
  else if (b.Status === 'Not Started' || b.Status === 'New') status = 'Not Started';
  else if (isBackendTaskOverdue(b)) status = 'Overdue';

  let priority: Task['priority'] = 'Low';
  if (b.Priority === 'High') priority = 'High';
  else if (b.Priority === 'Medium') priority = 'Medium';
  else if (b.Priority === 'Normal') priority = 'Medium';

  let type: Task['type'] = 'Task';
  if (b.Task_Type === 'Call') type = 'Call';
  else if (b.Task_Type === 'Meeting' || b.Task_Type === 'Appointment') type = 'Meeting';
  else if (b.Task_Type === 'Email') type = 'Email';

  // Dates: format as YYYY-MM-DD
  const startDate = b.Allocated_Date ? b.Allocated_Date.split('T')[0] : (b.Start_Date ? b.Start_Date.split('T')[0] : '');
  const dueDate = b.Due_Date ? b.Due_Date.split('T')[0] : (b.Deadline_Date ? b.Deadline_Date.split('T')[0] : (b.Completion_Date ? b.Completion_Date.split('T')[0] : ''));

  const startTime = b.Start_Time || formatTimeFromISO(b.Start_Date) || '';
  const dueTime = b.End_Time || formatTimeFromISO(b.Completion_Date || b.Deadline_Date || b.Due_Date) || '';

  // Clean description of HTML tags if present (since calendar sidebar shows raw description in tooltips/etc)
  let description = b.Description || '';
  if (description && typeof description === 'string' && description.includes('<')) {
    description = description.replace(/<[^>]*>/g, '').trim();
  }

  return {
    id: String(b.id || b.Task_Id || b.Nonproject_TaskManagement_Id || ''),
    title: b.TaskName || b.Task_Name || 'Untitled Task',
    type,
    category: b.Task_Category || b.Task_Type || 'Task',
    relatedTo: rel.label,
    relatedToType: (rel.type as any) || 'Project',
    assignedTo: assignedName,
    priority,
    status,
    tags: Array.isArray(b.Tags)
      ? b.Tags
      : (typeof b.Tags === 'string' && b.Tags
          ? b.Tags.split(',').map((s: string) => s.trim())
          : []),
    startDate,
    startTime,
    dueDate,
    dueTime,
    repeat: 'Does not repeat',
    reminderEnabled: false,
    description,
    subtasks: [],
    comments: [],
    activities: [],
    createdAt: b.Created_Date || new Date().toISOString(),
    updatedAt: b.Updated_Date || new Date().toISOString()
  };
}

export default function TaskCalendarPage() {
  const router = useRouter();
  const {
    canViewTaskCalendarOverview,
    canCreateTaskCalendar,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTaskCalendarOverview) {
      toast.error('You do not have permission to view Task Calendar.');
      router.push('/');
    }
  }, [canViewTaskCalendarOverview, isLoaded, router]);
  const { primaryColor } = useStore();

  // Main date state. Default to actual current date.
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Fetch users list from backend to resolve names to IDs
  const { data: rawUsers } = useQuery({
    queryKey: ['taskCalendarUsersList'],
    queryFn: fetchUsersList,
    staleTime: 300_000,
  });

  const usersList = useMemo(() => {
    const list = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.results || rawUsers?.data || []);
    return list.map((u: any) => ({
      id: u.id || u.User_Id || u.UserId,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.Username || String(u)
    }));
  }, [rawUsers]);

  const ownerNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    usersList.forEach(u => {
      if (u.name && u.id) {
        map.set(u.name, Number(u.id));
      }
    });
    return map;
  }, [usersList]);

  // Sidebar temporary filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Applied filter states
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'All',
    owner: 'All',
    priority: 'All',
    type: 'All'
  });

  const isFilterActive = useMemo(() => {
    return (
      appliedFilters.status !== 'All' ||
      appliedFilters.owner !== 'All' ||
      appliedFilters.type !== 'All' ||
      appliedFilters.priority !== 'All'
    );
  }, [appliedFilters]);

  // Unique list of owners in current tasks for filtering
  const allOwners = useMemo<string[]>(() => {
    const names = usersList.map(u => u.name).filter(Boolean);
    return Array.from(new Set<string>(names));
  }, [usersList]);

  // Fetch tasks from the backend using the integrated calendar APIs
  const { data: rawTasks, isLoading } = useQuery({
    queryKey: ['taskCalendarBackendTasks', currentDate, appliedFilters, isFilterActive, ownerNameToIdMap],
    queryFn: async () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const start_date = format(gridStart, 'yyyy-MM-dd');
      const end_date = format(gridEnd, 'yyyy-MM-dd');
      const userId = getUserId();
      const orgId = typeof window !== 'undefined' ? Number(localStorage.getItem('Organization_Id') || 1) : 1;

      if (isFilterActive) {
        // Prepare filter payload
        const payload: NewITTaskCalendarFilterPayload = {
          organization_id: orgId
        };
        if (appliedFilters.status !== 'All') {
          payload.status = appliedFilters.status;
        }
        if (appliedFilters.owner !== 'All') {
          const ownerId = ownerNameToIdMap.get(appliedFilters.owner);
          if (ownerId !== undefined) {
            payload.owner_id = ownerId;
          }
        }
        if (appliedFilters.type !== 'All') {
          payload.task_type = appliedFilters.type;
        }
        if (appliedFilters.priority !== 'All') {
          payload.Priority = appliedFilters.priority;
        }
        return filterNewITTaskCalendar(payload);
      } else {
        return fetchNewTaskManagemntList({
          Startdate: start_date,
          Enddate: end_date,
          Created_By: userId || undefined
        });
      }
    },
    staleTime: 30_000,
  });

  const backendTasks = useMemo(() => {
    const list = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.results || rawTasks?.data || []);
    return list.map(mapBackendTaskToFrontend);
  }, [rawTasks]);

  // Only backend tasks
  const allTasks = useMemo(() => {
    return backendTasks;
  }, [backendTasks]);

  // Fetch summary metrics from backend
  const { data: rawSummary } = useQuery({
    queryKey: ['taskCalendarSummary', currentDate],
    queryFn: () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const start_date = format(monthStart, 'yyyy-MM-dd');
      const end_date = format(monthEnd, 'yyyy-MM-dd');
      return fetchNewITTaskSummary({
        period: [start_date, end_date]
      });
    },
    staleTime: 30_000,
  });

  // Handle month switching
  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date()); // Reset to actual current date
  };

  // Filter apply logic
  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      owner: ownerFilter,
      priority: priorityFilter,
      type: typeFilter
    });
  };

  const handleClearFilters = () => {
    setStatusFilter('All');
    setOwnerFilter('All');
    setPriorityFilter('All');
    setTypeFilter('All');
    setAppliedFilters({
      status: 'All',
      owner: 'All',
      priority: 'All',
      type: 'All'
    });
  };

  // 2. Computed list of filtered tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (appliedFilters.status !== 'All') {
        if (appliedFilters.status === 'Overdue' && task.status !== 'Overdue') return false;
        if (appliedFilters.status !== 'Overdue' && task.status !== appliedFilters.status) return false;
      }
      if (appliedFilters.owner !== 'All' && task.assignedTo !== appliedFilters.owner) return false;
      if (appliedFilters.priority !== 'All' && task.priority !== appliedFilters.priority) return false;
      if (appliedFilters.type !== 'All') {
        const targetType = appliedFilters.type.toLowerCase();
        const taskType = task.type.toLowerCase();
        const taskCategory = (task.category || '').toLowerCase();

        if (targetType === 'call') {
          if (taskType !== 'call') return false;
        } else if (targetType === 'meeting') {
          if (taskType !== 'meeting') return false;
        } else if (targetType === 'email') {
          if (taskType !== 'email') return false;
        } else if (targetType === 'task') {
          if (taskType !== 'task') return false;
        } else if (targetType === 'follow up') {
          if (taskType !== 'follow up' && taskCategory !== 'follow up') return false;
        } else if (targetType === 'other') {
          const matchedStandard = ['call', 'meeting', 'email', 'task', 'follow up'].includes(taskType) || taskCategory === 'follow up';
          if (matchedStandard) return false;
        }
      }
      return true;
    });
  }, [allTasks, appliedFilters]);

  // 3. Sidebar metrics summary calculations (based on today)
  const summaryMetrics = useMemo(() => {
    const s = rawSummary?.data || rawSummary || {};
    // Check if the response contains values
    if (s.hasOwnProperty('Overdue Tasks') || s.hasOwnProperty('overdue') || s.hasOwnProperty('total') || s.hasOwnProperty('Overdue')) {
      const overdue = Number(s['Overdue Tasks'] ?? s.overdue ?? s.Overdue ?? s.overdue_tasks ?? 0);
      const today = Number(s["Today's Tasks"] ?? s.today ?? s.Today ?? s.today_tasks ?? 0);
      const upcoming = Number(s['Upcoming Tasks'] ?? s.upcoming ?? s.Upcoming ?? s.upcoming_tasks ?? 0);
      const completed = Number(s['Completed Tasks'] ?? s.completed ?? s.Completed ?? s.completed_tasks ?? 0);
      const total = Number(s['Total Tasks'] ?? s.total ?? s.Total ?? s.total_tasks ?? (overdue + today + upcoming + completed));
      return { overdue, today, upcoming, completed, total };
    }

    const simulatedTodayStr = format(new Date(), 'yyyy-MM-dd');

    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    filteredTasks.forEach(task => {
      const taskDate = task.startDate || task.dueDate;

      if (task.status === 'Completed') {
        completed++;
      } else if (task.status === 'Overdue' || (taskDate && taskDate < simulatedTodayStr)) {
        overdue++;
      } else if (taskDate === simulatedTodayStr) {
        today++;
      } else {
        upcoming++;
      }
    });

    return {
      overdue,
      today,
      upcoming,
      completed,
      total: overdue + today + upcoming + completed
    };
  }, [rawSummary, filteredTasks]);

  // Generate grid calendar days (standard 7x5 or 7x6 block of days starting from startOfWeek of startOfMonth)
  const calendarGridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Get task styling color dictionary based on priority and type
  const getTaskStyle = (task: Task) => {
    if (task.priority === 'High') {
      return {
        bg: 'bg-rose-50 hover:bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50',
        dot: 'bg-rose-500',
      };
    } else if (task.priority === 'Medium') {
      return {
        bg: 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50',
        dot: 'bg-amber-500',
      };
    } else if (task.priority === 'Low' && task.type !== 'Call' && task.type !== 'Meeting') {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50',
        dot: 'bg-emerald-500',
      };
    } else if (task.type === 'Call') {
      return {
        bg: 'bg-blue-50 hover:bg-blue-100/80 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/50',
        dot: 'bg-blue-500',
      };
    } else if (task.type === 'Meeting') {
      return {
        bg: 'bg-purple-50 hover:bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/50',
        dot: 'bg-purple-500',
      };
    }
    // Default fallback
    return {
      bg: 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-350 dark:border-slate-800',
      dot: 'bg-slate-400',
    };
  };

  // Mini Calendar grid generation helpers
  const miniCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  if (isLoaded && !canViewTaskCalendarOverview) {
    return null;
  }

  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col gap-6 text-left pb-24">
      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/tasks" className="hover:text-slate-600 transition-colors">Tasks</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Task Calendar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Header and Main Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-slate-800 rounded-[5px]">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Task Calendar</h1>
              {isLoading && <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full shrink-0" />}
            </div>
            <p className="text-xs text-slate-400">View and manage your tasks in calendar view.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Today Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-[5px]"
          >
            Today
          </Button>

          {/* Navigation Arrows */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-[5px] overflow-hidden bg-white dark:bg-slate-950 h-8">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-r border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="h-4.5 w-4.5 text-slate-655" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4.5 w-4.5 text-slate-655" />
            </button>
          </div>

          {/* Current Month Name */}
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 px-2 min-w-24 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>



          {/* Dialog Filters */}
          <Dialog>
            <DialogTrigger render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-[5px]"
              >
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>Filters</span>
                {(appliedFilters.status !== 'All' || appliedFilters.owner !== 'All' || appliedFilters.priority !== 'All' || appliedFilters.type !== 'All') && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                )}
              </Button>
            } />
            <DialogContent className="max-w-md w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 shadow-xl text-left">
              <DialogHeader className="border-b dark:border-slate-800 pb-3">
                <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-200">Calendar Filters</DialogTitle>
                <p className="text-[11px] text-slate-400">Refine the tasks shown on the calendar</p>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                {/* Task Status */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Status</span>
                  <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                    <SelectTrigger className="h-9 w-full text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Owner */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Owner</span>
                  <Select value={ownerFilter} onValueChange={(val) => val && setOwnerFilter(val)}>
                    <SelectTrigger className="h-9 w-full text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]">
                      <SelectValue placeholder="All Owners" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Owners</SelectItem>
                      {allOwners.map(owner => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</span>
                  <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
                    <SelectTrigger className="h-9 w-full text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Priority</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Type */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Type</span>
                  <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
                    <SelectTrigger className="h-9 w-full text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="Task">Task</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Follow Up">Follow Up</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center gap-2 pt-3">
                <DialogClose render={
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="h-9 text-xs font-bold text-slate-400 hover:text-slate-655"
                  >
                    Clear All
                  </Button>
                } />
                <DialogClose render={
                  <Button
                    onClick={handleApplyFilters}
                    className="h-9 text-xs font-bold text-white shadow-xs px-5 rounded-[5px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Apply Filters
                  </Button>
                } />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add New Task Button */}
          <Button
            onClick={() => router.push('/tasks/create')}
            className="h-8 text-xs font-bold text-white shadow-xs gap-1.5 hover:opacity-90 transition-opacity rounded-[5px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* 3. Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

        {/* Calendar Month Grid (Spans 3 Columns) */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] p-4 shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">

              {/* Day Headers (Sun-Sat) */}
              <div className="grid grid-cols-7 border-b dark:border-slate-800 pb-3 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayHeader) => (
                  <div key={dayHeader} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {dayHeader}
                  </div>
                ))}
              </div>

              {/* Monthly Grid Blocks */}
              <div className="grid grid-cols-7 grid-rows-5 border-l border-t dark:border-slate-800/80">
                {calendarGridDays.map((day, dayIdx) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  // Filter tasks that match the active filter criteria
                  const dayTasks = filteredTasks.filter(task => {
                    const taskDate = task.startDate || task.dueDate;
                    return taskDate === dayStr;
                  });

                  // Today checks
                  const isDayToday = isSameDay(day, new Date());

                  // Render limited tasks on the grid cell, trigger Popover for "+X more"
                  const visibleTasks = dayTasks.slice(0, 2);
                  const extraTasksCount = dayTasks.length - visibleTasks.length;

                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger
                        render={
                          <div
                            onClick={() => router.push(`/tasks/create?date=${dayStr}`)}
                            className={cn(
                              "min-h-[120px] p-2 border-r border-b dark:border-slate-800/80 flex flex-col justify-between transition-colors bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
                              !isCurrentMonth && "bg-slate-50/40 dark:bg-slate-950/20"
                            )}
                          >
                            {/* Day Number Header */}
                            <div className="flex justify-between items-center mb-1">
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isCurrentMonth ? "text-slate-800 dark:text-slate-200" : "text-slate-350 dark:text-slate-605",
                                  isDayToday && "flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-extrabold"
                                )}
                              >
                                {format(day, 'd')}
                              </span>
                            </div>

                            {/* Day Tasks List */}
                            <div className="flex-1 flex flex-col gap-1.5 justify-start overflow-hidden py-1">
                              {visibleTasks.map((task) => {
                                const style = getTaskStyle(task);
                                return (
                                  <div
                                    key={task.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/tasks/${task.id}`);
                                    }}
                                    className={cn(
                                      "flex flex-col px-2 py-1.5 rounded-[5px] border text-left cursor-pointer transition-all duration-150 shadow-3xs",
                                      style.bg
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
                                      <span className="text-[10px] font-bold tracking-wide leading-none uppercase truncate">
                                        {task.title}
                                      </span>
                                    </div>
                                    {task.startTime && (
                                      <span className="text-[9px] font-semibold opacity-80 pl-3">
                                        {task.startTime}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Popover list for "+X more" tasks */}
                            {extraTasksCount > 0 && (
                              <div className="text-left mt-0.5" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  <PopoverTrigger className="text-[10px] font-bold text-primary hover:underline transition-all cursor-pointer">
                                    +{extraTasksCount} more
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 p-3 rounded-[5px] shadow-lg flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Tasks for {format(day, 'MMMM d, yyyy')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                                      {dayTasks.map((task) => {
                                        const style = getTaskStyle(task);
                                        return (
                                          <div
                                            key={task.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              router.push(`/tasks/${task.id}`);
                                            }}
                                            className={cn(
                                              "flex flex-col px-2.5 py-1.5 rounded-[5px] border cursor-pointer hover:scale-[1.01] transition-all",
                                              style.bg
                                            )}
                                          >
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                                              <span className="text-xs font-bold truncate">{task.title}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] opacity-80 pl-3 font-medium">
                                              <span>{task.startTime || 'No time'}</span>
                                              <span className="uppercase text-[9px] font-bold bg-white/40 dark:bg-black/20 px-1.5 py-0.5 rounded">
                                                {task.type}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}

                          </div>
                        }
                      />
                      <TooltipContent className="bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border border-slate-850 px-3 py-1.5 text-[11px] font-bold rounded shadow-lg">
                        create task
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar widgets panel (Spans 1 Column) */}
        <div className="flex flex-col gap-6">

          {/* Mini Calendar Widget */}
          <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900">
            <CardHeader className="p-4 border-b dark:border-slate-800 flex flex-row items-center justify-between pb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 border dark:border-slate-800 rounded-[5px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3 text-slate-655" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 border dark:border-slate-800 rounded-[5px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-3 w-3 text-slate-655" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              {/* Day initials */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Mini date grid */}
              <div className="grid grid-cols-7 text-center gap-y-1">
                {miniCalendarDays.map((day, dayIdx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  // Today check
                  const isDayToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => setCurrentDate(day)}
                      className={cn(
                        "text-[11px] font-bold h-6 w-6 rounded-full mx-auto flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
                        !isCurrentMonth && "text-slate-300 dark:text-slate-700",
                        isCurrentMonth && "text-slate-700 dark:text-slate-200",
                        isDayToday && "bg-primary text-white font-extrabold hover:bg-primary/95"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>


          {/* Task Summary Card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardHeader className="p-4 border-b dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Task Summary This Month</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">

              {/* Overdue */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Overdue</span>
                </div>
                <span className="font-extrabold text-rose-600">{summaryMetrics.overdue}</span>
              </div>

              {/* Today */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Today</span>
                </div>
                <span className="font-extrabold text-amber-600">{summaryMetrics.today}</span>
              </div>

              {/* Upcoming */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Upcoming</span>
                </div>
                <span className="font-extrabold text-blue-600">{summaryMetrics.upcoming}</span>
              </div>

              {/* Completed */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Completed</span>
                </div>
                <span className="font-extrabold text-emerald-600">{summaryMetrics.completed}</span>
              </div>

              {/* Separator line */}
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {/* Total Tasks */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">Total Tasks</span>
                <span className="text-primary text-sm font-extrabold">{summaryMetrics.total}</span>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>


    </div>
    </TooltipProvider>
  );
}
