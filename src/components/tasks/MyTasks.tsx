'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  LayoutGrid, 
  Info, 
  ChevronDown, 
  MoreVertical, 
  UserPlus, 
  Tag, 
  RefreshCw, 
  Eye, 
  Users, 
  ClipboardList, 
  Play, 
  Clock, 
  CheckCircle,
  FileText,
  List,
  Settings,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { useTaskStore } from '@/store/useTaskStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Task } from '@/types/tasks';

export default function MyTasks() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const { tasks, deleteTask, updateTask } = useTaskStore();
  
  const currentUser = 'Sadia Afrin'; // Current user name matching context

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Not Started' | 'In Progress' | 'Pending' | 'Completed' | 'Overdue'>('All');
  const [viewMode, setViewMode] = useState<'List' | 'Card'>('List');
  const [showFilters, setShowFilters] = useState(false);

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    setSelectedTasks(prev => prev.filter(item => item !== id));
    toast.success(`Task ${id} has been deleted.`);
  };

  const handleDeleteSelected = () => {
    selectedTasks.forEach(id => deleteTask(id));
    toast.success(`Deleted ${selectedTasks.length} tasks successfully.`);
    setSelectedTasks([]);
  };

  const handleExport = () => {
    const listToExport = selectedTasks.length > 0 
      ? tasks.filter(t => selectedTasks.includes(t.id))
      : tasks.filter(t => t.assignedTo === currentUser);
      
    const headers = [
      'ID', 'Task Title', 'Related To', 'Type', 'Category', 'Priority', 'Assigned To', 'Start Date', 'Due Date', 'Status', 'Description'
    ];
    const data = listToExport.map(t => [
      t.id, t.title, t.relatedTo, t.type, t.category, t.priority, t.assignedTo, t.startDate, t.dueDate, t.status, t.description
    ]);
    const csvContent = [headers.join(','), ...data.map(row => row.map(val => `"${val || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${listToExport.length} tasks exported successfully!`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, id]);
    } else {
      setSelectedTasks(prev => prev.filter(item => item !== id));
    }
  };

  // Filter tasks for Sadia Afrin and match search/priority/status tabs
  const filteredTasks = tasks.filter(t => {
    if (t.assignedTo !== currentUser) return false;

    // Search Query
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.relatedTo.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Priority Filter
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

    // Type Filter
    const matchesType = typeFilter === 'All' || t.type === typeFilter;

    // Tab Filter
    let matchesTab = true;
    if (activeTab === 'Not Started') {
      matchesTab = t.status === 'Not Started';
    } else if (activeTab === 'In Progress') {
      matchesTab = t.status === 'In Progress';
    } else if (activeTab === 'Pending') {
      matchesTab = t.status === 'Pending';
    } else if (activeTab === 'Overdue') {
      const isPastDue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
      matchesTab = t.status === 'Overdue' || isPastDue;
    } else if (activeTab === 'Completed') {
      matchesTab = t.status === 'Completed';
    }

    return matchesSearch && matchesPriority && matchesType && matchesTab;
  });

  // KPI calculations for current user
  const myTasks = tasks.filter(t => t.assignedTo === currentUser);
  const totalTasksCount = myTasks.length;
  const completedCount = myTasks.filter(t => t.status === 'Completed').length;
  const inProgressCount = myTasks.filter(t => t.status === 'In Progress').length;
  const pendingCount = myTasks.filter(t => t.status === 'Pending').length;
  const overdueCount = myTasks.filter(t => {
    const isPastDue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
    return t.status === 'Overdue' || isPastDue;
  }).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getOwnerBgColor = (owner: string) => {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400';
  };

  // Type Icon and Styles
  const getTypeBadge = (type: Task['type']) => {
    const styles: Record<Task['type'], { bg: string, icon: React.ElementType }> = {
      'Call': { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400', icon: Phone },
      'Email': { bg: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400', icon: Mail },
      'Meeting': { bg: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-955/20 dark:text-purple-400', icon: Users },
      'Task': { bg: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400', icon: CheckSquare },
    };
    const config = styles[type] || styles['Task'];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 flex items-center gap-1.5 w-fit ${config.bg}`}>
        <Icon className="h-3.5 w-3.5" />
        {type}
      </Badge>
    );
  };

  // Status and Priority styles
  const statusStyles: Record<Task['status'], string> = {
    'Not Started': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700',
    'In Progress': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
    'Pending': 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-955/20 dark:text-violet-450 dark:border-violet-900/30',
    'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30',
    'Overdue': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
  };

  const priorityStyles: Record<Task['priority'], string> = {
    'High': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30',
    'Medium': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-455 dark:border-amber-900/30',
    'Low': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-455 dark:border-blue-900/30',
  };

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">CRM</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Tasks</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage tasks assigned directly to you. Stay on top of your workflow.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filters Toggle Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 px-4 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-200",
              showFilters ? "bg-slate-100 dark:bg-slate-800 text-primary border-primary/30" : ""
            )}
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Filter with the icon
          </Button>

          {/* Create Task Primary Action */}
          <div className="flex items-center">
            <Button 
              onClick={() => router.push('/tasks/create')}
              style={{ backgroundColor: primaryColor }} 
              className="text-white font-semibold rounded-l-[5px] rounded-r-none h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs border-r border-white/20"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button 
                  style={{ backgroundColor: primaryColor }} 
                  className="text-white rounded-r-[5px] rounded-l-none h-9 w-8 px-0 hover:opacity-90 active:scale-95 transition-all"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800">
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => router.push('/tasks/create')}>
                  Single Add
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => toast.info('Import from Excel/CSV')}>
                  Import Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Tasks</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalTasksCount}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-[5px]">
            <ClipboardList className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{completedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-[5px]">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{inProgressCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-955/30 rounded-[5px]">
            <Play className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{pendingCount}</p>
          </div>
          <div className="p-3 bg-violet-50 dark:bg-violet-955/30 rounded-[5px]">
            <Clock className="h-5 w-5 text-violet-500" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-[5px] p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{overdueCount}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-955/30 rounded-[5px]">
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-xs overflow-hidden">
        
        {/* Table Filter/Search Header */}
        <AnimatePresence mode="wait">
          {selectedTasks.length === 0 ? (
            <div className="flex flex-col border-b dark:border-slate-800">
              <motion.div 
                key="default-header"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3 md:flex-row md:items-center justify-between px-6 py-2 border-b dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {/* Left Side: Filter Tabs */}
                <div className="flex items-center gap-6 overflow-x-auto">
                  {(['All', 'Not Started', 'In Progress', 'Pending', 'Overdue', 'Completed'] as const).map((tab) => {
                    let count = myTasks.length;
                    if (tab === 'Not Started') {
                      count = myTasks.filter(t => t.status === 'Not Started').length;
                    } else if (tab === 'In Progress') {
                      count = myTasks.filter(t => t.status === 'In Progress').length;
                    } else if (tab === 'Pending') {
                      count = myTasks.filter(t => t.status === 'Pending').length;
                    } else if (tab === 'Overdue') {
                      count = myTasks.filter(t => {
                        const isPastDue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
                        return t.status === 'Overdue' || isPastDue;
                      }).length;
                    } else if (tab === 'Completed') {
                      count = myTasks.filter(t => t.status === 'Completed').length;
                    }
                    
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer pb-3 ${
                          activeTab === tab 
                            ? 'text-primary' 
                            : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab === 'All' ? 'All My Tasks' : tab} ({count})
                        {activeTab === tab && (
                          <motion.div 
                            layoutId="activeTabUnderlineMy" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Side: Search and Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto py-2 md:py-0">
                  <div className="relative w-full md:w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search my tasks..."
                      className="pl-8.5 h-8.5 bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-[5px] focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* View Toggles */}
                  <div className="flex items-center border dark:border-slate-800 rounded-[5px] p-0.5 bg-slate-50/50 dark:bg-slate-955/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('List')}
                      className={cn(
                        "h-7 w-7 rounded-[5px] cursor-pointer transition-all",
                        viewMode === 'List' 
                          ? "bg-white dark:bg-slate-850 text-primary shadow-2xs border dark:border-slate-750 font-semibold" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('Card')}
                      className={cn(
                        "h-7 w-7 rounded-[5px] cursor-pointer transition-all",
                        viewMode === 'Card' 
                          ? "bg-white dark:bg-slate-850 text-primary shadow-2xs border dark:border-slate-750 font-semibold" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Settings Button */}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => toast.info('Configure View Settings')}
                    className="h-8.5 w-8.5 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>

              {/* Toggleable Slide-down Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-slate-50/40 dark:bg-slate-900/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-3">
                        <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || 'All')}>
                          <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-[5px] font-semibold">
                            <SelectValue placeholder="All Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Priority</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || 'All')}>
                          <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-[5px] font-semibold">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Task">Task</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {(priorityFilter !== 'All' || typeFilter !== 'All' || searchQuery !== '') && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setPriorityFilter('All');
                              setTypeFilter('All');
                              setSearchQuery('');
                            }}
                            className="h-9 px-3 text-xs text-rose-605 font-bold hover:bg-rose-50/50 dark:hover:bg-rose-955/20 rounded-[5px]"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={handleExport} 
                        className="h-9 px-3.5 gap-1.5 bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-[5px] hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Download className="h-4 w-4" /> Export CSV
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Multi-Select Action Bar */
            <motion.div 
              key="selected-header"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-slate-50/80 dark:bg-slate-955/60 border-b dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox 
                    checked={selectedTasks.length === filteredTasks.length} 
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedTasks.length} selected
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                <div className="flex flex-wrap items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-semibold text-slate-650 dark:text-slate-400 gap-1.5 h-8.5 rounded-[5px] px-2.5"
                    onClick={() => toast.info(`Assigning ${selectedTasks.length} tasks`)}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Assign
                  </Button>

                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-655 dark:text-slate-400 gap-1.5 h-8.5 rounded-[5px] px-2.5">
                    <Tag className="h-3.5 w-3.5" /> Tag
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-655 dark:text-slate-400 gap-1.5 h-8.5 rounded-[5px] px-2.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Change Status
                      </Button>
                    } />
                    <DropdownMenuContent className="dark:bg-slate-900 border dark:border-slate-850">
                      {(['Not Started', 'In Progress', 'Pending', 'Completed', 'Overdue'] as const).map(s => (
                        <DropdownMenuItem 
                          key={s} 
                          className="text-xs cursor-pointer" 
                          onClick={() => {
                            selectedTasks.forEach(id => updateTask(id, { status: s }));
                            toast.success(`Updated ${selectedTasks.length} tasks to status ${s}.`);
                            setSelectedTasks([]);
                          }}
                        >
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-semibold text-rose-605 hover:text-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-955/20 gap-1.5 h-8.5 rounded-[5px] px-2.5"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 gap-1.5 h-8.5 rounded-[5px] px-2.5 ml-2"
                    onClick={() => setSelectedTasks([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* Top Mini-Pagination in Selected Bar */}
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium self-end md:self-auto">
                <span>Showing 1-{filteredTasks.length} of {filteredTasks.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Mode content */}
        {viewMode === 'List' ? (
          /* Table View */
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                <TableRow className="border-b dark:border-slate-800">
                  <TableHead className="w-12 px-4 py-3.5">
                    <Checkbox 
                      checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length} 
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Task Title</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Related To</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Type</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Priority</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Assigned To</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Due Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-3.5 text-center w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const isSelected = selectedTasks.includes(task.id);
                  return (
                    <TableRow 
                      key={task.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 transition-colors duration-155 ${isSelected ? 'bg-blue-50/20 dark:bg-blue-955/10' : ''}`}
                    >
                      <TableCell className="px-4 py-3">
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="py-3 max-w-[280px]">
                        <div className="flex flex-col gap-0.5">
                          <NavLink 
                            to={`/tasks/${task.id}`}
                            className="text-sm font-semibold text-slate-905 hover:text-primary dark:text-slate-100 dark:hover:text-primary transition-colors cursor-pointer text-left block truncate"
                          >
                            {task.title}
                          </NavLink>
                          {task.description && (
                            <span className="text-xs text-slate-400 truncate max-w-[240px] text-left block">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer">
                            {task.relatedTo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {task.relatedToType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getTypeBadge(task.type)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6.5 w-6.5 border shadow-2xs">
                            <AvatarFallback className={`font-bold text-[10px] ${getOwnerBgColor(task.assignedTo)}`}>
                              {getInitials(task.assignedTo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{task.assignedTo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col text-left">
                          <span className={`text-sm font-semibold ${task.status === 'Overdue' ? 'text-rose-600' : 'text-slate-755 dark:text-slate-300'}`}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {task.dueTime && (
                            <span className={`text-[10px] font-medium ${task.status === 'Overdue' ? 'text-rose-500' : 'text-slate-400'}`}>
                              {task.dueTime} {task.status === 'Overdue' && 'Overdue'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${statusStyles[task.status]}`}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center">
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
                                    onClick={() => {
                                      updateTask(task.id, { status: s });
                                      toast.success(`Task status updated to ${s}`);
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                        <span className="text-sm">No tasks found matching the filters.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Card View */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-6 bg-slate-50/20 dark:bg-slate-900/10">
              {filteredTasks.map((task) => {
                const isSelected = selectedTasks.includes(task.id);
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      "relative flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-[5px] p-5 shadow-2xs hover:shadow-xs hover:border-slate-350 dark:hover:border-slate-750 transition-all duration-200 group text-left",
                      isSelected ? "border-primary/50 bg-blue-50/10 dark:bg-blue-955/5 ring-1 ring-primary/20" : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    {/* Top Row: Checkbox and Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                        className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            const newPriority = task.priority === 'High' ? 'Medium' : 'High';
                            updateTask(task.id, { priority: newPriority });
                            toast.success(`Priority updated to ${newPriority}`);
                          }}
                          className={cn(
                            "text-slate-355 hover:text-amber-500 dark:text-slate-600 transition-colors p-1 rounded-[5px] cursor-pointer",
                            task.priority === 'High' ? "text-amber-500" : ""
                          )}
                        >
                          <Star className={cn("h-4 w-4", task.priority === 'High' ? "fill-amber-500 text-amber-500" : "")} />
                        </button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-[5px] cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Task Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}`)}>
                              <Eye className="h-4 w-4 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                              <Edit className="h-4 w-4 text-slate-500" /> Edit Task
                            </DropdownMenuItem>
 
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-semibold">
                                <RefreshCw className="h-4 w-4 text-slate-500" /> Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                                {(['Not Started', 'In Progress', 'Pending', 'Completed', 'Overdue'] as const).map((s) => (
                                  <DropdownMenuItem 
                                    key={s}
                                    onClick={() => {
                                      updateTask(task.id, { status: s });
                                      toast.success(`Task status updated to ${s}`);
                                    }}
                                    className="cursor-pointer text-xs font-semibold"
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
                      </div>
                    </div>

                    {/* Middle Section: Avatar, Title and Subtitle */}
                    <div className="flex flex-col items-center text-center flex-1 py-2">
                      <div className="relative mb-3">
                        <Avatar className="h-14 w-14 border shadow-2xs flex items-center justify-center">
                          <AvatarFallback className={cn("font-bold text-base", getOwnerBgColor(task.assignedTo))}>
                            {getInitials(task.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-[5px] border shadow-2xs flex items-center justify-center">
                          {React.createElement(
                            task.type === 'Call' ? Phone :
                            task.type === 'Email' ? Mail :
                            task.type === 'Meeting' ? Users : CheckSquare,
                            { className: "h-3 w-3 text-slate-500" }
                          )}
                        </span>
                      </div>

                      <NavLink 
                        to={`/tasks/${task.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer line-clamp-1 mb-1 px-2"
                      >
                        {task.title}
                      </NavLink>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer truncate max-w-[180px]">
                          {task.relatedTo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {task.relatedToType}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Owner and Status */}
                    <div className="flex items-center justify-between border-t dark:border-slate-800 pt-3.5 mt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5.5 w-5.5 border shadow-2xs">
                          <AvatarFallback className={cn("font-bold text-[8px]", getOwnerBgColor(task.assignedTo))}>
                            {getInitials(task.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                          {task.assignedTo.split(' ')[0]}
                        </span>
                      </div>

                      <Badge variant="outline" className={cn("rounded-[5px] font-semibold text-[10px] py-0 px-2 h-5 flex items-center justify-center", statusStyles[task.status])}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-16 text-slate-450 font-semibold">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                  <span className="text-sm">No tasks found matching the filters.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Pagination controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-t dark:border-slate-800 text-xs font-medium text-slate-455">
          <span>Showing 1 to {filteredTasks.length} of {filteredTasks.length} tasks</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-[5px] border-slate-200 dark:border-slate-800" disabled>
              &lt;
            </Button>
            <Button variant="outline" className="h-8 px-3 rounded-[5px] border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-955/40 font-bold text-blue-600 dark:text-blue-400">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-[5px] border-slate-200 dark:border-slate-800" disabled>
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
