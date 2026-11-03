'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Send,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Settings,
  ArrowRight,
  ClipboardList,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/usePermission';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { NavLink } from '@/components/layout/NavLink';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Task } from '@/types/tasks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patchTask, deleteTask as apiDeleteTask, searchTasks, filterTasks, fetchAllTasksNew } from '@/service/api/Leads/api';

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

function getAssignedPhoto(item: any): string | undefined {
  const photo = item.Assigned_To?.User_Photo;
  if (photo && !photo.includes('pngtree-user-icon') && !photo.includes('default.png')) return photo;
  return undefined;
}

function getRelatedTo(item: any): { label: string; type: string } {
  if (item.Project) return { label: item.Project.project_name || 'Project', type: 'Project' };
  if (item.Deal_Id) return { label: item.Deal_Id.Deal_Name || 'Deal', type: 'Deal' };
  if (item.Lead_Id) {
    const l = item.Lead_Id;
    const name = `${l.LeadFirstName || ''} ${l.LeadLastName || ''}`.trim() || l.CompanyName || 'Lead';
    return { label: name, type: 'Lead' };
  }
  return { label: item.Task_Related || '—', type: item.Related_To || '' };
}

function mapBackendTaskToFrontend(b: any): Task {
  const assignedTo = getAssignedName(b);
  const rel = getRelatedTo(b);

  let overdueByDays = 0;
  if (b.Due_Date) {
    const due = new Date(b.Due_Date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    if (diffTime > 0) {
      overdueByDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  const assignedPhoto = getAssignedPhoto(b);

  return {
    id: String(b.id),
    title: b.TaskName || '',
    type: (b.Task_Type || 'Task') as any,
    category: b.Task_Category || 'Follow Up',
    relatedTo: rel.label,
    relatedToType: rel.type as any,
    assignedTo,
    assignedPhoto,
    priority: (b.Priority || 'High') as any,
    status: (b.Status || 'Pending') as any,
    tags: Array.isArray(b.Tags) ? b.Tags : [],
    startDate: b.Start_Date ? b.Start_Date.split('T')[0] : '',
    startTime: '',
    dueDate: b.Due_Date ? b.Due_Date.split('T')[0] : '',
    dueTime: '',
    repeat: 'Does not repeat',
    reminderEnabled: !!b.UserReminder,
    description: b.Task_Desc || '',
    subtasks: [],
    comments: [],
    activities: [],
    overdueByDays,
    project: b.Project?.project_name || '',
    createdAt: b.Created_At || new Date().toISOString(),
    updatedAt: b.Updated_At || new Date().toISOString()
  };
}

export default function OverdueTasksPage() {
  const router = useRouter();
  const {
    canViewOverdueTasksOverview,
    canExportOverdueTasks,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewOverdueTasksOverview) {
      toast.error('You do not have permission to view Overdue Tasks.');
      router.push('/');
    }
  }, [canViewOverdueTasksOverview, isLoaded, router]);

  const { primaryColor } = useStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce 300ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter Dialog
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Temp (dialog-local) filter states
  const [tempCreatedBy, setTempCreatedBy] = useState('');
  const [tempAssignedTo, setTempAssignedTo] = useState('');
  const [tempPriority, setTempPriority] = useState('');
  const [tempCompletion, setTempCompletion] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Active (committed) filter states used in API calls
  const [activeCreatedBy, setActiveCreatedBy] = useState('');
  const [activeAssignedTo, setActiveAssignedTo] = useState('');
  const [activePriority, setActivePriority] = useState('');
  const [activeCompletion, setActiveCompletion] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');

  const handleApplyFilters = () => {
    setActiveCreatedBy(tempCreatedBy);
    setActiveAssignedTo(tempAssignedTo);
    setActivePriority(tempPriority);
    setActiveCompletion(tempCompletion);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setPage(1);
    setIsFilterDialogOpen(false);
  };

  const handleClearAll = () => {
    setTempCreatedBy(''); setTempAssignedTo(''); setTempPriority(''); setTempCompletion(''); setTempStartDate(''); setTempEndDate('');
    setActiveCreatedBy(''); setActiveAssignedTo(''); setActivePriority(''); setActiveCompletion(''); setActiveStartDate(''); setActiveEndDate('');
    setSearchQuery('');
    setPage(1);
    setIsFilterDialogOpen(false);
  };

  const hasActiveFilters = !!(activeCreatedBy || activeAssignedTo || activePriority || activeCompletion || activeStartDate || activeEndDate);

  // Server-side query — always pass status=overdue
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['overdueTasks', page, debouncedSearchQuery, activeCreatedBy, activeAssignedTo, activePriority, activeCompletion, activeStartDate, activeEndDate],
    queryFn: () => {
      const finalCreatedBy = activeCreatedBy ? Number(activeCreatedBy) : undefined;
      const finalAssignedTo = activeAssignedTo ? Number(activeAssignedTo) : undefined;

      // Only use the filter POST API when user has applied explicit filters
      const hasAdvancedFilters = !!(activePriority || activeCompletion || activeStartDate || activeEndDate);

      if (debouncedSearchQuery.trim() !== '') {
        // ── Search path ─────────────────────────────────────────────────
        // GET /user/Newtaskmanagmentsearch/?status=overdue&search=...
        return searchTasks({
          status: 'overdue',
          created_by: finalCreatedBy,
          assigned_to: finalAssignedTo,
          search: debouncedSearchQuery,
          page,
        });
      } else if (hasAdvancedFilters) {
        // ── Filter path (user-triggered only) ───────────────────────────
        // POST /user/Newtaskmanagmentfilter/
        const dateRangeArray = (activeStartDate && activeEndDate) ? [activeStartDate, activeEndDate] : [];
        return filterTasks({
          status: 'overdue',
          created_by: finalCreatedBy || null,
          assigned_to: finalAssignedTo || null,
          TaskName: '',
          Completion: activeCompletion || '',
          Priority: activePriority || null,
          Assigned_person: '',
          Start_Date: dateRangeArray,
          project_name: '',
          page,
        });
      } else {
        // ── Default list path ────────────────────────────────────────────
        // GET /user/NewTaskManagemntMyAdditionalNew/?status=overdue
        return fetchAllTasksNew({
          status: 'overdue',
          created_by: finalCreatedBy,
          assigned_to: finalAssignedTo,
          page,
        });
      }
    },
    staleTime: 30_000,
  });

  const rawTasks: any[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  const tasks = useMemo(() => rawTasks.map(mapBackendTaskToFrontend), [rawTasks]);

  // Use server results directly (no client-side filtering)
  const overdueTasks = tasks;

  // Selection state
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // KPI Calculations
  const totalOverdueCount = totalCount;

  // Overdue Today (due date matches today or overdue by <= 1 day)
  const overdueTodayCount = tasks.filter(t => {
    const days = t.overdueByDays || 0;
    return days <= 1;
  }).length;

  // Overdue > 7 Days
  const overdueLongTermCount = tasks.filter(t => {
    const days = t.overdueByDays || 0;
    return days > 7;
  }).length;

  // Overdue summary ranges (fixed double-counting by directly checking ranges without bad defaults)
  const range1to3 = tasks.filter(t => {
    const days = t.overdueByDays;
    return days !== undefined && days >= 1 && days <= 3;
  }).length;

  const range4to7 = tasks.filter(t => {
    const days = t.overdueByDays;
    return days !== undefined && days >= 4 && days <= 7;
  }).length;

  const range8to14 = tasks.filter(t => {
    const days = t.overdueByDays;
    return days !== undefined && days >= 8 && days <= 14;
  }).length;

  const range15Plus = tasks.filter(t => {
    const days = t.overdueByDays;
    return days !== undefined && days >= 15;
  }).length;

  const handleDeleteTask = (id: string) => {
    toast.warning('Delete this task?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await apiDeleteTask(id);
            setSelectedTasks(prev => prev.filter(item => item !== id));
            toast.success(`Task ${id} has been deleted.`);
            queryClient.invalidateQueries({ queryKey: ['overdueTasks'] });
            refetch();
          } catch {
            toast.error('Failed to delete task');
          }
        },
      },
    });
  };

  const handleSendReminder = () => {
    const targetCount = selectedTasks.length > 0 ? selectedTasks.length : overdueTasks.length;
    toast.success(`Sent reminders for ${targetCount} overdue tasks successfully!`);
  };

  const handleExport = () => {
    const listToExport = selectedTasks.length > 0
      ? tasks.filter(t => selectedTasks.includes(t.id))
      : overdueTasks;

    const headers = [
      'ID', 'Task Title', 'Project', 'Assignee', 'Priority', 'Due Date', 'Overdue By', 'Est. Hours', 'Status'
    ];
    const data = listToExport.map(t => [
      t.id, t.title, t.project || t.relatedTo, t.assignedTo, t.priority, t.dueDate, `${t.overdueByDays || 0} Days`, t.estimatedHours || 'N/A', t.status
    ]);
    const csvContent = [headers.join(','), ...data.map(row => row.map(val => `"${val || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overdue_tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${listToExport.length} overdue tasks successfully.`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getOwnerBgColor = (owner: string) => {
    if (owner === 'Sadia Afrin') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400';
    if (owner === 'Jisan Mahmud') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-400';
    if (owner === 'Priya Kapoor') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-955/30 dark:text-sky-455';
    if (owner === 'Suresh Kumar') return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-955/30 dark:text-indigo-455';
    if (owner === 'Arjun Singh') return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-455';
    if (owner === 'Rahul Mehta') return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-955/30 dark:text-orange-455';
    if (owner === 'Vikram Tiwari') return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-955/30 dark:text-teal-455';
    return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-955/30 dark:text-purple-455';
  };

  const priorityStyles: Record<Task['priority'], string> = {
    'High': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30',
    'Medium': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-455 dark:border-amber-900/30',
    'Low': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-455 dark:border-blue-900/30',
  };

  const statusStyles: Record<Task['status'], string> = {
    'Not Started': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700',
    'In Progress': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
    'Pending': 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-955/20 dark:text-violet-450 dark:border-violet-900/30',
    'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30',
    'Overdue': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
  };

  const columns: ColumnConfig<Task>[] = [
    {
      key: 'title',
      header: 'Task Name',
      sortable: true,
      render: (task) => (
        <NavLink
          to={`/tasks/${task.id}`}
          className="text-sm font-semibold text-slate-900 hover:text-primary dark:text-slate-100 dark:hover:text-primary transition-colors cursor-pointer text-left block truncate max-w-[240px]"
        >
          {task.title}
        </NavLink>
      )
    },
    {
      key: 'project',
      header: 'Related to',
      sortable: true,
      render: (task) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350">
          {task.project || task.relatedTo}
        </span>
      )
    },
    {
      key: 'assignedTo',
      header: 'Assignee',
      sortable: true,
      render: (task) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 border shadow-2xs shrink-0">
            {task.assignedPhoto && <AvatarImage src={task.assignedPhoto} alt={task.assignedTo} />}
            <AvatarFallback className={`font-bold text-[9px] ${getOwnerBgColor(task.assignedTo)}`}>
              {getInitials(task.assignedTo)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{task.assignedTo}</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (task) => (
        <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${priorityStyles[task.priority]}`}>
          {task.priority}
        </Badge>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (task) => (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {new Date(task.dueDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'overdueByDays',
      header: 'Overdue By',
      sortable: true,
      render: (task) => (
        <Badge variant="outline" className="rounded-[5px] border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/30 dark:bg-rose-955/20 dark:text-rose-400 font-bold text-xs">
          {task.overdueByDays ? `${task.overdueByDays} Days` : '1 Day'}
        </Badge>
      )
    },
    {
      key: 'estimatedHours',
      header: 'Estimated Hours',
      render: (task) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350">
          {task.estimatedHours || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (task) => (
        <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${statusStyles[task.status]}`}>
          {task.status}
        </Badge>
      )
    }
  ];

  if (isLoaded && !canViewOverdueTasksOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">CRM</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/tasks">Tasks</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overdue Tasks</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2 text-left">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-955/20 rounded-[5px] text-rose-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Overdue Tasks</h1>
            <p className="text-sm text-slate-400 mt-1">View and manage all tasks that are past their due date.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          <Button
            onClick={handleSendReminder}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-semibold rounded-[5px] h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Send Reminder
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Overdue Tasks */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Overdue Tasks</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalOverdueCount}</p>
            <span className="text-[10px] text-slate-400">Tasks</span>
          </div>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-955/30 rounded-[5px]">
            <AlertCircle className="h-6 w-6 text-rose-500" />
          </div>
        </div>

        {/* Overdue Tasks Today */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Tasks (Today)</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{overdueTodayCount}</p>
            <span className="text-[10px] text-slate-400">Tasks</span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-955/30 rounded-[5px]">
            <Calendar className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        {/* Overdue Tasks > 7 Days */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Tasks (&gt; 7 Days)</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{overdueLongTermCount}</p>
            <span className="text-[10px] text-slate-400">Tasks</span>
          </div>
          <div className="p-3.5 bg-purple-50 dark:bg-purple-955/30 rounded-[5px]">
            <Clock className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        {/* Overdue Hours */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Hours</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">142h 30m</p>
            <span className="text-[10px] text-slate-400">Total</span>
          </div>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-955/30 rounded-[5px]">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Main Content Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column - Reusable Table Container (9 Columns) */}
        <div className="lg:col-span-9 min-w-0 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-xs p-4">

          {/* Table Header Filter controls */}
          <div className="flex flex-col gap-3 pb-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 mb-2">
            <div className="flex items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8.5 h-8.5 bg-slate-55 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-xs rounded-[5px] focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dialog Trigger */}
              <Button
                variant="outline"
                onClick={() => setIsFilterDialogOpen(true)}
                className={cn(
                  'h-8.5 px-3.5 gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-200',
                  hasActiveFilters && 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:border-blue-900 dark:text-blue-400'
                )}
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </Button>
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Active Filters:</span>
                {activePriority && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                    Priority: {activePriority}
                    <button onClick={() => { setActivePriority(''); setTempPriority(''); }} className="ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {activeCompletion && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                    Completion: {activeCompletion}%
                    <button onClick={() => { setActiveCompletion(''); setTempCompletion(''); }} className="ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(activeStartDate || activeEndDate) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                    Dates: {activeStartDate || 'N/A'} → {activeEndDate || 'N/A'}
                    <button onClick={() => { setActiveStartDate(''); setActiveEndDate(''); setTempStartDate(''); setTempEndDate(''); }} className="ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                <button onClick={handleClearAll} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer ml-1">Clear All</button>
              </div>
            )}
          </div>

          {/* Filter Dialog */}
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Filter Overdue Tasks</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-left">

                {/* Priority */}
                <div className="grid gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                  <select
                    value={tempPriority}
                    onChange={(e) => setTempPriority(e.target.value)}
                    className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">All Priorities</option>
                    {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Completion */}
                <div className="grid gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion (%)</label>
                  <input
                    type="number" min="0" max="100" placeholder="e.g. 50"
                    value={tempCompletion}
                    onChange={(e) => setTempCompletion(e.target.value)}
                    className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Start Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</label>
                    <input
                      type="date" value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</label>
                    <input
                      type="date" value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="h-9 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={handleClearAll} className="text-xs font-bold text-slate-500 cursor-pointer">Clear All</Button>
                <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)} className="h-9 text-xs font-bold rounded-[5px] cursor-pointer">Cancel</Button>
                <Button onClick={handleApplyFilters} className="h-9 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-[5px] cursor-pointer">Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ReusableTable
            columns={columns}
            data={overdueTasks}
            loading={isLoading}
            selectable={true}
            selectedRowIds={selectedTasks}
            onSelectionChange={(selectedList) => setSelectedTasks(selectedList.map(t => t.id))}
            page={page}
            totalRecords={totalCount}
            onChangePage={(newPage) => setPage(newPage)}
            pageSize={10}
            showGear={false}
            title="Overdue tasks"
            actions={(task) => (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-[5px] cursor-pointer">
                    <MoreHorizontal className="h-4.5 w-4.5" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
                  <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Task Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/tasks/${task.id}`)}>
                    <Eye className="h-4 w-4 text-slate-500" /> View Details
                  </DropdownMenuItem>

                  <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                    <Edit className="h-4 w-4 text-slate-500" /> Edit Task
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                      <RefreshCw className="h-4 w-4 text-slate-500" /> Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                      {(['Not Started', 'In Progress', 'Pending', 'Completed', 'Overdue'] as const).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={async () => {
                            try {
                              await patchTask(task.id, { Status: s });
                              toast.success(`Task status updated to ${s}`);
                              queryClient.invalidateQueries({ queryKey: ['overdueTasks'] });
                              refetch();
                            } catch {
                              toast.error('Failed to update task status');
                            }
                          }}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" /> Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>

        {/* Right Column - Stats and Actions (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Overdue Summary Stats Card */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] p-5 space-y-4 shadow-2xs text-left">
            <span className="text-sm font-bold text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 block">Overdue Summary</span>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>1 - 3 Days</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{range1to3}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span>4 - 7 Days</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{range4to7}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span>8 - 14 Days</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{range8to14}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
                  <span>15+ Days</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{range15Plus}</span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Overdue Tasks</span>
                <span className="font-bold text-rose-600">{totalOverdueCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Overdue Hours</span>
                <span className="font-bold text-rose-600">142h 30m</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
