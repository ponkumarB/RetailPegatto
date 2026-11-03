'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Search,
  Filter,
  Settings as SettingsIcon,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronDown,
  Info,
  BookOpen,
  Shield,
  User,
  Users,
  CheckCircle,
  HelpCircle,
  Headphones,
  Briefcase,
  TrendingUp,
  Wallet,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useRoleStore } from '@/store/useRoleStore';
import { Role } from '@/types/role';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  rolelist, 
  roledashboardcards,
  searchRoles,
  filterRoles,
  RoleFilterPayload,
  deleteRoleApi,
  createRole
} from '@/service/api/role/api';

// Drag handles icon (small 6 dots grip)
function GripIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-slate-300 dark:text-slate-600 cursor-grab"
      {...props}
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

// Available permissions in system
const AVAILABLE_PERMISSIONS = [
  'Dashboard Access',
  'Contact Management',
  'Marketing & Leads',
  'Deal Management',
  'Project Management',
  'Resource Management',
  'Customer Success',
  'Feedback Management',
  'Asset Tracker',
  'Task Scheduler',
  'Invoice & Billing',
  'System Settings',
];

export default function RolesPage() {
  const router = useRouter();
  const { roles, addRole, updateRole, deleteRole } = useRoleStore();
  const queryClient = useQueryClient();

  const getUserId = (): number => {
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const id = Number(userData?.id);
          if (!isNaN(id) && id > 0) {
            return id;
          }
        }
      } catch (e) {
        console.error('Error retrieving userId from localStorage', e);
      }
    }
    return 72; // default fallback
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items for edit/view/delete
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // TanStack Query for Roles list
  const { data: apiRolesData, isLoading: isApiListLoading } = useQuery({
    queryKey: ['rolesList', currentPage, searchQuery, statusFilter],
    queryFn: async () => {
      // 1. If statusFilter is not 'all', call filterRoles
      if (statusFilter !== 'all') {
        const payload: RoleFilterPayload = {
          Role_Name: searchQuery.trim() || undefined,
          Status: statusFilter === 'active' ? 'Active' : 'Inactive',
          page: currentPage,
        };
        return filterRoles(payload).catch(() => null);
      }

      // 2. If searchQuery is set and statusFilter is 'all', call searchRoles
      if (searchQuery.trim().length > 0) {
        return searchRoles(searchQuery.trim(), currentPage).catch(() => null);
      }

      // 3. Otherwise call default rolelist
      return rolelist({ page: currentPage }).catch(() => null);
    },
    retry: false,
  });

  // TanStack Query for Role dashboard cards
  const { data: apiCardsData, isLoading: isApiCardsLoading } = useQuery({
    queryKey: ['roleDashboardCards'],
    queryFn: () => roledashboardcards().catch(() => null),
    retry: false,
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoading = isApiListLoading || isApiCardsLoading || !isMounted;

  // Robust backend to frontend role mapper
  const mapBackendToFrontendRole = (backend: any): Role & { Role_Id?: string } => {
    const rawId = backend.Role_Id ?? backend.id ?? backend.Id ?? backend.role_id ?? '';
    return {
      id: String(rawId),
      Role_Id: String(rawId),
      name: backend.Role_Name || backend.name || backend.Name || 'No Name',
      type: (backend.Role_Type || backend.type || backend.Type || 'Custom') as 'System' | 'Custom',
      description: backend.Description || backend.description || backend.Role_Description || '',
      usersCount: backend.usersCount || backend.Users_Count || 0,
      status: (backend.Status || backend.status || 'Active') as 'Active' | 'Inactive',
      lastUpdated: backend.Updated_Date || backend.lastUpdated || backend.Created_Date || 'N/A',
      permissions: backend.permissions || backend.Permissions || backend.Configure_Permission || []
    };
  };

  // Roles list with mock fallback
  const rolesList = useMemo(() => {
    if (apiRolesData && Array.isArray(apiRolesData.results)) {
      return apiRolesData.results.map(mapBackendToFrontendRole);
    }
    return roles;
  }, [apiRolesData, roles]);

  // Map role icon based on name
  const getRoleIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('administrator') || n.includes('admin')) {
      return {
        icon: Shield,
        bg: 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40',
        color: 'text-indigo-600 dark:text-indigo-400',
      };
    }
    if (n.includes('project manager') || n.includes('pm')) {
      return {
        icon: User,
        bg: 'bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40',
        color: 'text-sky-600 dark:text-sky-400',
      };
    }
    if (n.includes('sales manager')) {
      return {
        icon: TrendingUp,
        bg: 'bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40',
        color: 'text-teal-600 dark:text-teal-400',
      };
    }
    if (n.includes('representative') || n.includes('sales')) {
      return {
        icon: User,
        bg: 'bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40',
        color: 'text-orange-600 dark:text-orange-400',
      };
    }
    if (n.includes('support')) {
      return {
        icon: Headphones,
        bg: 'bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40',
        color: 'text-pink-600 dark:text-pink-400',
      };
    }
    if (n.includes('marketing')) {
      return {
        icon: Briefcase,
        bg: 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/40',
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    }
    if (n.includes('read only') || n.includes('view')) {
      return {
        icon: Eye,
        bg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60',
        color: 'text-slate-600 dark:text-slate-400',
      };
    }
    if (n.includes('finance') || n.includes('account')) {
      return {
        icon: Wallet,
        bg: 'bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40',
        color: 'text-purple-600 dark:text-purple-400',
      };
    }
    return {
      icon: HelpCircle,
      bg: 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
      color: 'text-slate-400 dark:text-slate-500',
    };
  };

  // Stats with backend cards endpoint fallback
  const stats = useMemo(() => {
    const defaultStats = {
      total: roles.length,
      system: roles.filter((r) => r.type === 'System').length,
      custom: roles.filter((r) => r.type === 'Custom').length,
      active: roles.filter((r) => r.status === 'Active').length,
    };

    if (apiCardsData && Array.isArray(apiCardsData.data)) {
      const apiStats = { ...defaultStats };
      apiCardsData.data.forEach((card: any) => {
        const metric = card.metric || '';
        const count = Number(card.count) || 0;
        if (metric.includes('Total Roles')) apiStats.total = count;
        else if (metric.includes('System Roles')) apiStats.system = count;
        else if (metric.includes('Custom Roles')) apiStats.custom = count;
        else if (metric.includes('Active Roles')) apiStats.active = count;
      });
      return apiStats;
    }

    return defaultStats;
  }, [apiCardsData, roles]);

  const totalRoles = stats.total;
  const systemRoles = stats.system;
  const customRoles = stats.custom;
  const activeRoles = stats.active;

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'System Roles', value: systemRoles, color: '#3b82f6' }, // Blue
      { name: 'Custom Roles', value: customRoles, color: '#22c55e' }, // Green
    ];
  }, [systemRoles, customRoles]);

  // Filtering roles list
  const filteredRoles = useMemo(() => {
    if (apiRolesData && Array.isArray(apiRolesData.results)) {
      return rolesList;
    }
    return rolesList.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        role.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [apiRolesData, rolesList, searchQuery, statusFilter]);

  // Paginated roles
  const paginatedRoles = useMemo(() => {
    if (apiRolesData && Array.isArray(apiRolesData.results)) {
      return filteredRoles;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRoles.slice(startIndex, startIndex + pageSize);
  }, [apiRolesData, filteredRoles, currentPage, pageSize]);

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalRolesCount = useMemo(() => {
    if (apiRolesData && typeof apiRolesData.count === 'number') {
      return apiRolesData.count;
    }
    return filteredRoles.length;
  }, [apiRolesData, filteredRoles]);

  const showingFrom = useMemo(() => {
    if (apiRolesData && typeof apiRolesData.count === 'number') {
      return (currentPage - 1) * pageSize + 1;
    }
    return filteredRoles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  }, [apiRolesData, currentPage, pageSize, filteredRoles]);

  const showingTo = useMemo(() => {
    if (apiRolesData && typeof apiRolesData.count === 'number') {
      return Math.min(currentPage * pageSize, apiRolesData.count);
    }
    return Math.min(currentPage * pageSize, filteredRoles.length);
  }, [apiRolesData, currentPage, pageSize, filteredRoles]);

  const isNextDisabled = useMemo(() => {
    if (apiRolesData && typeof apiRolesData.count === 'number') {
      return currentPage * pageSize >= apiRolesData.count;
    }
    return currentPage * pageSize >= filteredRoles.length;
  }, [apiRolesData, currentPage, pageSize, filteredRoles]);

  const handleOpenAdd = () => {
    router.push('/system/roles/create');
  };

  const handleOpenEdit = (role: Role) => {
    const targetId = role.id || (role as any).Role_Id;
    if (!targetId) {
      toast.error('Invalid Role ID');
      return;
    }
    router.push(`/system/roles/${targetId}/edit`);
  };

  const handleOpenView = (role: Role) => {
    setActiveRole(role);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (role: Role) => {
    setActiveRole(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeRole) return;
    try {
      const roleIdToDelete = (activeRole as any).Role_Id || activeRole.id;
      await deleteRoleApi(roleIdToDelete);
      queryClient.invalidateQueries({ queryKey: ['rolesList'] });
      queryClient.invalidateQueries({ queryKey: ['roleDashboardCards'] });
      setIsDeleteOpen(false);
      toast.success('Role deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete role: ${err.message || err}`);
    }
  };



  const handleExport = () => {
    toast.success('Exporting role configs to CSV...');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="sk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1"
          >
            {/* Breadcrumb Skeleton */}
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />

            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              </div>
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-24 animate-pulse"
                />
              ))}
            </div>

            {/* Layout Columns Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[400px] animate-pulse" />
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[240px] animate-pulse" />
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[160px] animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-5 text-left p-1"
          >
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.push('/')}
                    className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    System
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">
                    Roles
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Role Master
                  </h1>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                  Create and manage roles. Assign permissions to control access across CRMFarm IT.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  Export
                </Button>

                <Button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Role
                </Button>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Roles */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Total Roles
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {totalRoles}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    All Roles
                  </span>
                </div>
              </div>

              {/* Card 2: System Roles */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    System Roles
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {systemRoles}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Default Roles
                  </span>
                </div>
              </div>

              {/* Card 3: Custom Roles */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Custom Roles
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {customRoles}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Created by Admin
                  </span>
                </div>
              </div>

              {/* Card 4: Active Roles */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Active Roles
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {activeRoles}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Currently Active
                  </span>
                </div>
              </div>
            </div>

            {/* ── Main Layout Column Split ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Side: Roles Table Card */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/20 dark:bg-slate-900/40">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">Status:</span>
                      <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                        <SelectTrigger className="h-8 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 min-w-[110px]">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toast.info('Layout options coming soon')}
                      className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950"
                    >
                      <SettingsIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/40 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="w-10 pl-4 py-3">
                          <Checkbox className="h-3.5 w-3.5 rounded-xs" />
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Role Name
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Role Type
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Description
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 text-center">
                          Users
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Last Updated
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 text-right pr-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {paginatedRoles.length > 0 ? (
                        paginatedRoles.map((role) => {
                          const iconObj = getRoleIcon(role.name);
                          const IconComponent = iconObj.icon;
                          return (
                            <TableRow
                              key={role.id}
                              className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors"
                            >
                              <TableCell className="pl-4 py-3">
                                <Checkbox className="h-3.5 w-3.5 rounded-xs" />
                              </TableCell>
                              <TableCell className="py-3 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <GripIcon />
                                  <div className={`h-8 w-8 rounded-full ${iconObj.bg} flex items-center justify-center shrink-0`}>
                                    <IconComponent className={`h-4 w-4 ${iconObj.color}`} />
                                  </div>
                                  <span className="truncate max-w-[150px]">{role.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    role.type === 'System'
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/40 dark:border-blue-900/30'
                                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/30'
                                  }`}
                                >
                                  {role.type}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-slate-500 dark:text-slate-400 font-medium">
                                <p className="max-w-[200px] truncate" title={role.description}>
                                  {role.description}
                                </p>
                              </TableCell>
                              <TableCell className="py-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                                {role.usersCount}
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    role.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700'
                                  }`}
                                >
                                  {role.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-slate-500 dark:text-slate-400">
                                {(() => {
                                  const parts = role.lastUpdated.split(' ');
                                  const dateStr = parts.slice(0, 3).join(' ');
                                  const timeStr = parts.slice(3).join(' ');
                                  return (
                                    <div className="flex flex-col text-[10.5px]">
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{dateStr}</span>
                                      <span className="text-slate-400 dark:text-slate-500 font-medium mt-0.5">{timeStr}</span>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="py-3 pr-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleOpenView(role)}
                                    className="h-7 w-7 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleOpenEdit(role)}
                                    className="h-7 w-7 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850"
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="text-xs">
                                      <DropdownMenuItem
                                        onClick={() => handleOpenEdit(role)}
                                        className="gap-2 cursor-pointer font-medium"
                                      >
                                        <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          const copyName = `${role.name} (Copy)`;
                                          try {
                                            const payload = {
                                              name: copyName,
                                              Role_Name: copyName,
                                              Role_Description: role.description || '',
                                              Description: role.description || '',
                                              Role_Type: 'Custom',
                                              Status: role.status || 'Active',
                                              permissions: role.permissions || [],
                                              FormNames: [],
                                              Modelname: [],
                                              RolePermissions: [],
                                              FormPermissions: [],
                                              Company_Id: 1,
                                              Created_By: getUserId(),
                                              Updated_By: getUserId(),
                                            };
                                            await createRole(payload);
                                            queryClient.invalidateQueries({ queryKey: ['rolesList'] });
                                            queryClient.invalidateQueries({ queryKey: ['roleDashboardCards'] });
                                            toast.success('Role duplicated successfully');
                                          } catch (err: any) {
                                            toast.error(`Failed to duplicate role: ${err.message || err}`);
                                          }
                                        }}
                                        className="gap-2 cursor-pointer font-medium"
                                      >
                                        <Plus className="h-3.5 w-3.5 text-slate-400" />
                                        Duplicate Role
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleOpenDelete(role)}
                                        className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-50/50 cursor-pointer font-medium"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                        Delete Role
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                            No roles found matching the search criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/10 dark:bg-slate-900/20">
                  <span>
                    Showing {showingFrom} to {showingTo} of {totalRolesCount} roles
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="h-7 w-7 rounded-md border-slate-200 dark:border-slate-850"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="h-7 w-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                      >
                        {currentPage}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={isNextDisabled}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="h-7 w-7 rounded-md border-slate-200 dark:border-slate-850"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(val) => setPageSize(parseInt(val || '10'))}
                      >
                        <SelectTrigger className="h-7 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 min-w-[80px]">
                          <SelectValue placeholder="10 / page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 / page</SelectItem>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="20">20 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Sidebar Cards */}
              <div className="lg:col-span-1 space-y-5">
                {/* Role Summary Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white text-left">
                    Role Summary
                  </h3>

                  {/* Donut Chart */}
                  <div className="relative flex justify-center items-center my-6 h-[170px]">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => [`${value} Roles`, name]}
                            contentStyle={{
                              borderRadius: 10,
                              border: '1px solid #e2e8f0',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-28 w-28 rounded-full border-4 border-slate-100 animate-pulse" />
                    )}

                    {/* Center stats */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {totalRoles}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1.5 leading-none">
                        Total Roles
                      </span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-50 dark:border-slate-850">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">System Roles</span>
                      </div>
                      <span className="text-slate-900 dark:text-white">
                        {systemRoles} ({totalRoles > 0 ? ((systemRoles / totalRoles) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">Custom Roles</span>
                      </div>
                      <span className="text-slate-900 dark:text-white">
                        {customRoles} ({totalRoles > 0 ? ((customRoles / totalRoles) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* About Roles Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                      <Info className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        About Roles
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Roles help you group users and define the level of access they have in CRMFarm IT.
                        You can create custom roles and assign permissions as required.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => toast.info('Documentation coming soon')}
                    className="w-full flex items-center justify-center gap-2 mt-4.5 h-9 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────
                MODALS / DIALOGS
            ───────────────────────────────────────── */}



            {/* VIEW ROLE DETAILS DIALOG */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border dark:border-slate-800">
                <DialogHeader className="text-left">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full ${activeRole ? getRoleIcon(activeRole.name).bg : ''} flex items-center justify-center`}>
                      {activeRole && React.createElement(getRoleIcon(activeRole.name).icon, { className: `h-4.5 w-4.5 ${getRoleIcon(activeRole.name).color}` })}
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {activeRole?.name}
                      </DialogTitle>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">
                        {activeRole?.type} Role
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="py-4 text-left space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-850 pb-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          activeRole?.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 border'
                        }`}
                      >
                        {activeRole?.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Users</p>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {activeRole?.usersCount} Users
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      {activeRole?.description || 'No description provided.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Granted Permissions ({activeRole?.permissions?.length || 0})</p>
                    {activeRole?.permissions && activeRole.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {activeRole.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20 text-[10.5px] font-semibold"
                          >
                            <Check className="h-3 w-3 shrink-0" />
                            {perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic font-medium">No permissions assigned to this role.</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>ID: {activeRole?.id}</span>
                    <span>Last Updated: {activeRole?.lastUpdated}</span>
                  </div>
                </div>

                <DialogFooter className="border-t dark:border-slate-800 mt-2">
                  <Button
                    onClick={() => setIsViewOpen(false)}
                    className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900 border dark:border-slate-800">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Role
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-slate-500 mt-1">
                    Are you sure you want to delete the role <span className="font-bold text-slate-800 dark:text-slate-200">"{activeRole?.name}"</span>? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-3 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100/50 dark:border-rose-900/30 text-left my-2 text-xs text-rose-600 dark:text-rose-400 font-semibold leading-relaxed">
                  <Info className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <p>
                    Deleting this role will remove it from the Role Master. Any users assigned to this role may lose access to modules.
                  </p>
                </div>

                <DialogFooter className="border-t dark:border-slate-800 mt-2">
                  <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Delete Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
