'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Search, Download, MoreHorizontal, Edit, Trash2,
  AlertCircle, CheckCircle2, Filter, LayoutGrid, ChevronDown,
  MoreVertical, UserPlus, RefreshCw, Eye, ClipboardList, Play,
  Clock, List, ChevronLeft, ChevronRight, Tag, X,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { useTaskDashboardFilterDropdownQuery } from '@/service/dashboardQueries';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllTasksNew, searchTasks, filterTasks, fetchUsersList } from '@/service/api/Leads/api';
import { fetchFromApi } from '@/service/apiClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUserId = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const s = localStorage.getItem('userData');
      if (s) { const u = JSON.parse(s); const id = Number(u?.id); if (!isNaN(id) && id > 0) return id; }
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

function formatDate(d?: string | null): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function isOverdue(item: any): boolean {
  return !!item.Due_Date && new Date(item.Due_Date) < new Date() && item.Status !== 'Completed';
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

function avatarBg(name: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  ];
  return palette[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

const STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Progress': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
  Pending: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400',
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
  Overdue: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400',
};

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400',
  Medium: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400',
  Low: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
  Normal: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
};

type TabKey = 'all' | 'my' | 'assigned' | 'overdue' | 'completed';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Tasks' },
  { key: 'my', label: 'My Tasks' },
  { key: 'assigned', label: 'Assigned to Me' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
];

const ASSIGNEES = [
  { name: 'Aarav Rao', initials: 'AR', color: 'bg-slate-900' },
  { name: 'Priya Nair', initials: 'PN', color: 'bg-slate-800' },
  { name: 'Vikram Joshi', initials: 'VJ', color: 'bg-emerald-605' },
  { name: 'Sneha Verma', initials: 'SV', color: 'bg-indigo-900' },
  { name: 'Amit Singh', initials: 'AS', color: 'bg-indigo-600' },
  { name: 'Neha Patel', initials: 'NP', color: 'bg-slate-705' }
];

const PROJECTS = [
  'Website Redesign',
  'CRM Implementation',
  'Mobile App Development',
  'HRMS Integration',
  'ERP Migration'
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllTasks() {
  const {
    canCreateTaskList,
    canEditTaskList,
    canDeleteTaskList,
    canExportTaskList,
  } = usePermission();

  const { primaryColor } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'List' | 'Card'>('List');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

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

  // Fetch dropdown values
  const { data: dropdownsData } = useTaskDashboardFilterDropdownQuery();
  const dropdowns = dropdownsData?.data || dropdownsData || {};

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

    setSearchQuery('');
    setPage(1);
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
    setPage(1);
    setIsFilterDialogOpen(false);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['allTasksNew', activeTab, page, debouncedSearchQuery, activeCreatedBy, activeAssignedTo, activeStatus, activePriority, activeCompletion, activeStartDate, activeEndDate],
    queryFn: () => {
      const uid = getUserId();

      // Tab-based params — these map directly to the list API query params
      // GET /user/NewTaskManagemntMyAdditionalNew/
      //   ?status=overdue      → Overdue tab
      //   ?created_by=<uid>    → My Tasks tab
      //   ?assigned_to=<uid>   → Assigned to Me tab
      //   ?status=Completed    → Completed tab
      //   (no params)          → All Tasks tab
      const statusParam = activeTab === 'overdue' ? 'overdue' : activeTab === 'completed' ? 'Completed' : undefined;
      const createdByParam = activeTab === 'my' ? uid : undefined;
      const assignedToParam = activeTab === 'assigned' ? uid : undefined;

      const finalCreatedBy = activeCreatedBy ? Number(activeCreatedBy) : createdByParam;
      const finalAssignedTo = activeAssignedTo ? Number(activeAssignedTo) : assignedToParam;
      const finalStatus = activeStatus || statusParam;

      // Only use the filter POST API when the user has explicitly applied
      // advanced filters (priority / completion % / date range) via the filter dialog
      const hasAdvancedFilters = !!(activePriority || activeCompletion || activeStartDate || activeEndDate);

      if (debouncedSearchQuery.trim() !== '') {
        // ── Search ──────────────────────────────────────────────────────
        // GET /user/Newtaskmanagmentsearch/
        return searchTasks({
          created_by: finalCreatedBy,
          assigned_to: finalAssignedTo,
          status: finalStatus || undefined,
          search: debouncedSearchQuery,
          page,
        });
      } else if (hasAdvancedFilters) {
        // ── Advanced Filter (user-triggered) ────────────────────────────
        // POST /user/Newtaskmanagmentfilter/
        const dateRangeArray = (activeStartDate && activeEndDate) ? [activeStartDate, activeEndDate] : [];
        return filterTasks({
          created_by: finalCreatedBy || null,
          assigned_to: finalAssignedTo || null,
          status: finalStatus || null,
          TaskName: '',
          Completion: activeCompletion || '',
          Priority: activePriority || null,
          Assigned_person: '',
          Start_Date: dateRangeArray,
          project_name: '',
          page,
        });
      } else {
        // ── Default List (all tabs, no active filters) ───────────────────
        // GET /user/NewTaskManagemntMyAdditionalNew/
        // Overdue  → ?status=overdue
        // My Tasks → ?created_by=<uid>
        // Assigned → ?assigned_to=<uid>
        // All      → (no extra params)
        return fetchAllTasksNew({
          created_by: finalCreatedBy,
          assigned_to: finalAssignedTo,
          status: finalStatus,
          page,
        });
      }
    },
    staleTime: 30_000,
  });

  const tasks: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = data?.count ?? (Array.isArray(data) ? data.length : 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  const filtered = tasks;

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleSelect = (id: number) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = (c: boolean) => setSelectedIds(c ? new Set(filtered.map(t => t.id)) : new Set());

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab); setPage(1); setSearchQuery('');
    setActivePriority(''); setSelectedIds(new Set());
  };

  const handleDelete = (id: number) => {
    toast.warning('Delete this task?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await fetchFromApi(`/user/NewTaskManagemntCRUD/?id=${id}`, { method: 'DELETE' });
            toast.success('Task deleted');
            queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
          } catch { toast.error('Failed to delete task'); }
        },
      },
    });
  };

  const handleExport = () => {
    const rows = selectedIds.size > 0 ? filtered.filter(t => selectedIds.has(t.id)) : filtered;
    const csv = [
      ['ID', 'Task Name', 'Priority', 'Status', 'Assigned To', 'Due Date', 'Related To'].join(','),
      ...rows.map(t => [t.Task_Id, t.TaskName, t.Priority, t.Status, getAssignedName(t), formatDate(t.Due_Date), getRelatedTo(t).label].map(v => `"${v || ''}"`).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'tasks.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} tasks exported`);
  };

  const selectedRowIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const handleSelectionChange = useCallback((rows: any[]) => {
    setSelectedIds(new Set(rows.map(r => r.id)));
  }, []);

  const columns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'TaskName',
      header: 'Task Name',
      sortable: true,
      render: (task) => {
        return (
          <div className="flex flex-col gap-0.5 text-left">
            <button onClick={() => router.push(`/tasks/${task.id}`)} className="text-sm font-semibold text-slate-800 hover:text-primary dark:text-slate-100 transition-colors text-left truncate block">
              {task.TaskName || '(Untitled)'}
            </button>
            <span className="text-[10px] text-slate-400 font-medium">{task.Task_Id}</span>
            {Array.isArray(task.Tags) && task.Tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {task.Tags.slice(0, 2).map((tg: string) => (
                  <span key={tg} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-[3px] font-medium">{tg}</span>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'relatedTo',
      header: 'Related To',
      render: (task) => {
        const rel = getRelatedTo(task);
        return (
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[130px]">{rel.label}</span>
            {rel.type && <span className="text-[10px] text-slate-400 font-medium">{rel.type}</span>}
          </div>
        );
      }
    },
    {
      key: 'Priority',
      header: 'Priority',
      sortable: true,
      render: (task) => (
        <Badge variant="outline" className={cn('rounded-[5px] font-semibold text-xs py-0.5 px-2.5', PRIORITY_STYLES[task.Priority] || PRIORITY_STYLES.Normal)}>
          {task.Priority || 'Normal'}
        </Badge>
      )
    },
    {
      key: 'Assigned_To',
      header: 'Assigned To',
      render: (task) => {
        const aName = getAssignedName(task);
        const aPhoto = getAssignedPhoto(task);
        return (
          <div className="flex items-center gap-2 text-left">
            <Avatar className="h-6.5 w-6.5 border shadow-2xs">
              {aPhoto && <AvatarImage src={aPhoto} />}
              <AvatarFallback className={cn('font-bold text-[10px]', avatarBg(aName))}>{getInitials(aName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[100px]">{aName}</span>
          </div>
        );
      }
    },
    {
      key: 'Due_Date',
      header: 'Due Date',
      sortable: true,
      render: (task) => {
        const over = isOverdue(task);
        return (
          <div className="text-left">
            <span className={cn('text-sm font-semibold', over ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300')}>{formatDate(task.Due_Date)}</span>
            {over && <span className="block text-[10px] text-rose-500 font-medium">Overdue</span>}
          </div>
        );
      }
    },
    {
      key: 'Completion',
      header: 'Progress',
      sortable: true,
      render: (task) => {
        const completion = Math.min(parseInt(task.Completion || '0') || 0, 100);
        return (
          <div className="space-y-1 min-w-[90px] text-left">
            <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{completion}%</span>
          </div>
        );
      }
    },
    {
      key: 'Status',
      header: 'Status',
      sortable: true,
      render: (task) => (
        <Badge variant="outline" className={cn('rounded-[5px] font-semibold text-xs py-0.5 px-2.5', STATUS_STYLES[task.Status] || STATUS_STYLES.Pending)}>
          {task.Status || 'Pending'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (task) => (
        <div className="text-right flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-[5px] cursor-pointer">
                <MoreHorizontal className="h-4.5 w-4.5" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
              <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Task Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/tasks/${task.id}`)}>
                <Eye className="h-4 w-4 text-slate-440" /> View Details
              </DropdownMenuItem>
              {canEditTaskList && (
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                  <Edit className="h-4 w-4 text-slate-440" /> Edit Task
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canDeleteTaskList && (
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="h-4 w-4" /> Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [selectedIds, router]);

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink render={<NavLink to="/">CRM</NavLink>} /></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>All Tasks</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage all tasks across your organisation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}
            className={cn('h-9 px-4 gap-2 border-slate-200 dark:border-slate-800 rounded-[5px] cursor-pointer font-semibold text-xs',
              (activeCreatedBy || activeAssignedTo || activeStatus || activePriority || activeCompletion || activeStartDate || activeEndDate) && 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30')}
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" /> Filters
          </Button>
          <Button variant="outline" onClick={() => { queryClient.invalidateQueries({ queryKey: ['allTasksNew'] }); refetch(); }}
            className="h-9 px-3 gap-2 border-slate-200 dark:border-slate-800 rounded-[5px] cursor-pointer text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {canCreateTaskList && (
            <Button onClick={() => router.push('/tasks/create')} style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-[5px] h-9 px-4 hover:opacity-90 text-xs">
              <Plus className="h-4 w-4 mr-1.5" /> Add Task
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: totalCount, icon: ClipboardList, bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-500' },
          { label: 'Completed', value: tasks.filter(t => t.Status === 'Completed').length, icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-500' },
          { label: 'In Progress', value: tasks.filter(t => t.Status === 'In Progress').length, icon: Play, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-500' },
          { label: 'Pending', value: tasks.filter(t => t.Status === 'Pending').length, icon: Clock, bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-500' },
          { label: 'Overdue', value: tasks.filter(isOverdue).length, icon: AlertCircle, bg: 'bg-rose-50 dark:bg-rose-950/30', color: 'text-rose-500' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] p-4 flex items-center justify-between hover:shadow-xs transition-all">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? <Skeleton className="h-7 w-10 mt-1" /> : value}
              </div>
            </div>
            <div className={cn('p-2.5 rounded-[5px]', bg)}><Icon className={cn('h-5 w-5', color)} /></div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-xs overflow-hidden">

        {/* Toolbar */}
        <AnimatePresence mode="wait">
          {selectedIds.size === 0 ? (
            <div key="toolbar" className="flex flex-col border-b dark:border-slate-800">
              <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between px-6 py-2 bg-white dark:bg-slate-900 border-b dark:border-slate-800">
                {/* Tabs */}
                <div className="flex items-center gap-5 overflow-x-auto">
                  {TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => switchTab(tab.key)}
                      className={cn(
                        'py-3 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer pb-3',
                        activeTab === tab.key ? 'text-primary' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <motion.div layoutId="taskTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Search + view controls */}
                <div className="flex flex-wrap items-center gap-2 py-2 md:py-0">
                  <div className="relative w-full md:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input placeholder="Search tasks..." className="pl-8.5 h-8.5 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-xs rounded-[5px] w-full"
                      value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center border dark:border-slate-800 rounded-[5px] p-0.5 bg-slate-50/50">
                    {(['List', 'Card'] as const).map(mode => (
                      <Button key={mode} variant="ghost" size="icon" onClick={() => setViewMode(mode)}
                        className={cn('h-7 w-7 rounded-[5px] cursor-pointer', viewMode === mode ? 'bg-white dark:bg-slate-850 text-primary shadow-2xs border dark:border-slate-750' : 'text-slate-400')}>
                        {mode === 'List' ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                      </Button>
                    ))}
                  </div>
                  {canExportTaskList && (
                    <Button variant="outline" size="icon" onClick={handleExport} className="h-8.5 w-8.5 border-slate-200 dark:border-slate-800 rounded-[5px] cursor-pointer" title="Export CSV">
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Filters Applied Badges */}
              {(activeCreatedBy || activeAssignedTo || activeStatus || activePriority || activeCompletion || activeStartDate || activeEndDate) && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-left">
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
              )}
            </div>
          ) : (
            <motion.div key="bulk-bar" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="flex flex-wrap items-center gap-4 px-5 py-3 border-b dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Checkbox checked={allSelected} onCheckedChange={c => toggleSelectAll(!!c)} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedIds.size} selected</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-[5px]" onClick={() => toast.info('Assigning selected')}>
                <UserPlus className="h-3.5 w-3.5" /> Assign
              </Button>
              <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-[5px]">
                <Tag className="h-3.5 w-3.5" /> Tag
              </Button>
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5 h-8 px-2.5 rounded-[5px]"
                onClick={() => { selectedIds.forEach(id => handleDelete(id)); setSelectedIds(new Set()); }}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 h-8 px-2.5 ml-auto rounded-[5px]" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {isError && (
          <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
            <AlertCircle className="h-8 w-8 text-rose-450" />
            <p className="text-sm font-medium">Failed to load tasks.</p>
            <Button variant="outline" onClick={() => refetch()} className="h-8 text-xs rounded-[5px]">Try Again</Button>
          </div>
        )}

        {/* List View */}
        {!isError && viewMode === 'List' && (
          <div className="p-1">
            <ReusableTable
              columns={columns}
              data={filtered}
              loading={isLoading}
              enableSelection={true}
              selectedRowIds={selectedRowIds}
              onSelectionChange={handleSelectionChange}
              rowIdKey="id"
              showGear={false}
              page={page}
              totalRecords={totalCount}
              pageSize={10}
              onChangePage={(newPage) => setPage(newPage)}
              showPageSizeSelector={false}
            />
          </div>
        )}

        {/* Card View */}
        {!isError && viewMode === 'Card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6 bg-slate-50/20 dark:bg-slate-900/10">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))
              : filtered.length === 0
                ? <div className="col-span-full py-12 flex flex-col items-center gap-2 text-slate-400"><ClipboardList className="h-8 w-8" /><p className="text-sm font-medium">No tasks found</p></div>
                : filtered.map(task => {
                  const sel = selectedIds.has(task.id);
                  const over = isOverdue(task);
                  const rel = getRelatedTo(task);
                  const aName = getAssignedName(task);
                  const aPhoto = getAssignedPhoto(task);
                  const completion = Math.min(parseInt(task.Completion || '0') || 0, 100);
                  return (
                    <div key={task.id} className={cn('relative flex flex-col bg-white dark:bg-slate-900 border rounded-[5px] p-5 shadow-2xs hover:shadow-xs transition-all text-left',
                      sel ? 'border-primary/50 ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800')}>
                      <div className="flex items-start justify-between mb-3">
                        <Checkbox checked={sel} onCheckedChange={() => toggleSelect(task.id)} />
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 rounded-[5px] cursor-pointer -mr-1.5 -mt-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800">
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => router.push(`/tasks/${task.id}`)}>
                              <Eye className="h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                              <Edit className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-rose-600" onClick={() => handleDelete(task.id)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <button onClick={() => router.push(`/tasks/${task.id}`)} className="text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-primary text-left line-clamp-2 mb-0.5">
                        {task.TaskName || '(Untitled)'}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium mb-2">{task.Task_Id}</span>
                      {rel.label !== '—' && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-3 truncate">{rel.label}</span>}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Badge variant="outline" className={cn('rounded-[5px] font-semibold text-[10px] py-0.5 px-2', PRIORITY_STYLES[task.Priority] || PRIORITY_STYLES.Normal)}>{task.Priority || 'Normal'}</Badge>
                        <Badge variant="outline" className={cn('rounded-[5px] font-semibold text-[10px] py-0.5 px-2', STATUS_STYLES[task.Status] || STATUS_STYLES.Pending)}>{task.Status || 'Pending'}</Badge>
                      </div>
                      <div className="mb-3">
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{completion}% complete</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6 border">
                            {aPhoto && <AvatarImage src={aPhoto} />}
                            <AvatarFallback className={cn('text-[9px] font-bold', avatarBg(aName))}>{getInitials(aName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{aName}</span>
                        </div>
                        <span className={cn('text-[10px] font-semibold', over ? 'text-rose-500' : 'text-slate-400')}>{formatDate(task.Due_Date)}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* Pagination for Card View */}
        {!isLoading && !isError && viewMode === 'Card' && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages} · {totalCount} total</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="h-8 px-3 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 cursor-pointer">
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 cursor-pointer">
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
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
    </div>
  );
}
