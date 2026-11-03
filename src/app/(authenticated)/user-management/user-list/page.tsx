'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Search,
  RotateCcw,
  Mail,
  Eye,
  Filter,
  CheckCircle,
  PauseCircle,
  LockKeyhole,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { fetchUserAdditional } from '@/service/api/useradmin/api';

interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Locked' | 'Pending';
  lastLogin: string;
  isAdmin?: boolean;
}

const defaultUsers: AppUser[] = [
  {
    id: 'usr-1',
    name: 'Raghav S.',
    username: 'raghav.s',
    email: 'raghav.s@crmfarm.com',
    role: 'IT Manager',
    department: 'IT',
    status: 'Active',
    lastLogin: '26/06/2025 10:30 AM',
    isAdmin: true
  },
  {
    id: 'usr-2',
    name: 'Sneha R.',
    username: 'sneha.r',
    email: 'sneha.r@crmfarm.com',
    role: 'Support Lead',
    department: 'Support',
    status: 'Active',
    lastLogin: '26/06/2025 09:15 AM'
  },
  {
    id: 'usr-3',
    name: 'Arjun K.',
    username: 'arjun.k',
    email: 'arjun.k@crmfarm.com',
    role: 'Support Agent',
    department: 'Support',
    status: 'Active',
    lastLogin: '25/06/2025 04:45 PM'
  },
  {
    id: 'usr-4',
    name: 'Vikram P.',
    username: 'vikram.p',
    email: 'vikram.p@crmfarm.com',
    role: 'Change Manager',
    department: 'IT',
    status: 'Active',
    lastLogin: '25/06/2025 02:20 PM'
  },
  {
    id: 'usr-5',
    name: 'Priya M.',
    username: 'priya.m',
    email: 'priya.m@crmfarm.com',
    role: 'Support Agent',
    department: 'Support',
    status: 'Inactive',
    lastLogin: '20/06/2025 11:05 AM'
  },
  {
    id: 'usr-6',
    name: 'Karthik V.',
    username: 'karthik.v',
    email: 'karthik.v@crmfarm.com',
    role: 'Problem Manager',
    department: 'IT',
    status: 'Active',
    lastLogin: '24/06/2025 05:30 PM'
  },
  {
    id: 'usr-7',
    name: 'Anita N.',
    username: 'anita.n',
    email: 'anita.n@crmfarm.com',
    role: 'Asset Manager',
    department: 'IT',
    status: 'Locked',
    lastLogin: '15/06/2025 03:10 PM'
  },
  {
    id: 'usr-8',
    name: 'Ramesh S.',
    username: 'ramesh.s',
    email: 'ramesh.s@crmfarm.com',
    role: 'Service Manager',
    department: 'Operations',
    status: 'Active',
    lastLogin: '26/06/2025 09:30 AM'
  },
  {
    id: 'usr-9',
    name: 'Harish N.',
    username: 'harish.n',
    email: 'harish.n@crmfarm.com',
    role: 'IT Technician',
    department: 'IT',
    status: 'Inactive',
    lastLogin: '18/06/2025 10:50 AM'
  },
  {
    id: 'usr-10',
    name: 'Pooja S.',
    username: 'pooja.s',
    email: 'pooja.s@crmfarm.com',
    role: 'Requester',
    department: 'HR',
    status: 'Active',
    lastLogin: '26/06/2025 08:15 AM'
  }
];

export default function UserListPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
  const [bulkAction, setBulkAction] = useState('None');

  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const orgId = localStorage.getItem('Organization_Id') || '1';
      let isActiveParam = 'True';
      if (statusFilter === 'Inactive') {
        isActiveParam = 'False';
      }
      
      const response = await fetchUserAdditional({
        is_active: isActiveParam,
        Organization_Id: orgId,
        page: page
      });
      
      if (response && response.results) {
        const mappedUsers: AppUser[] = response.results.map((u: any) => ({
          id: String(u.id),
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
          username: u.username,
          email: u.email,
          role: u.Designation || u.UserType || '',
          department: u.City || '',
          status: u.is_active ? 'Active' : 'Inactive',
          lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : '—',
          isAdmin: u.is_superuser
        }));
        setUsers(mappedUsers);
        setTotalRecords(response.count || mappedUsers.length);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users from API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'All') count++;
    if (deptFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    return count;
  }, [roleFilter, deptFilter, statusFilter]);

  const saveToStorage = (updatedList: AppUser[]) => {
    setUsers(updatedList);
  };

  const handleApplyFilters = () => {
    if (bulkAction !== 'None' && selectedUsers.length > 0) {
      let updated = [...users];
      if (bulkAction === 'Activate') {
        updated = users.map(u => selectedUsers.some(su => su.id === u.id) ? { ...u, status: 'Active' as const } : u);
        toast.success(`Activated ${selectedUsers.length} user(s).`);
      } else if (bulkAction === 'Deactivate') {
        updated = users.map(u => selectedUsers.some(su => su.id === u.id) ? { ...u, status: 'Inactive' as const } : u);
        toast.success(`Deactivated ${selectedUsers.length} user(s).`);
      } else if (bulkAction === 'Lock') {
        updated = users.map(u => selectedUsers.some(su => su.id === u.id) ? { ...u, status: 'Locked' as const } : u);
        toast.success(`Locked ${selectedUsers.length} user(s).`);
      } else if (bulkAction === 'Delete') {
        updated = users.filter(u => !selectedUsers.some(su => su.id === u.id));
        toast.success(`Deleted ${selectedUsers.length} user(s).`);
      }
      saveToStorage(updated);
      setSelectedUsers([]);
      setBulkAction('None');
    }
    setIsFilterDialogOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== id);
      saveToStorage(updated);
      toast.success('User deleted successfully.');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All');
    setDeptFilter('All');
    setStatusFilter('All');
  };

  // Get unique lists for filtering dropdowns
  const allRoles = useMemo(() => {
    const roles = new Set(users.map(u => u.role).filter(Boolean));
    return Array.from(roles);
  }, [users]);

  const allDepts = useMemo(() => {
    const depts = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(depts);
  }, [users]);

  // Compute metrics cards dynamically
  const metrics = useMemo(() => {
    let total = users.length;
    let active = users.filter(u => u.status === 'Active').length;
    let inactive = users.filter(u => u.status === 'Inactive').length;
    let locked = users.filter(u => u.status === 'Locked').length;
    let pending = users.filter(u => u.status === 'Pending').length;

    return {
      total,
      active,
      inactive,
      locked,
      pending
    };
  }, [users]);

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter(usr => {
      const query = searchQuery.toLowerCase();
      const matchQuery = 
        (usr.name || '').toLowerCase().includes(query) ||
        (usr.username || '').toLowerCase().includes(query) ||
        (usr.email || '').toLowerCase().includes(query);
      
      const matchRole = roleFilter === 'All' || usr.role === roleFilter;
      const matchDept = deptFilter === 'All' || usr.department === deptFilter;
      const matchStatus = statusFilter === 'All' || usr.status === statusFilter;

      return matchQuery && matchRole && matchDept && matchStatus;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Get Initials for Avatar
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Get Avatar background styling color dynamically
  const getAvatarColorClass = (nameStr: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450',
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450',
      'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450',
      'bg-purple-50 text-purple-750 dark:bg-purple-950/20 dark:text-purple-450',
      'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450',
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-450'
    ];
    let sum = 0;
    for (let i = 0; i < nameStr.length; i++) sum += nameStr.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // ReusableTable Column Configuration
  const columns = useMemo<ColumnConfig<AppUser>[]>(() => [
    {
      key: 'name',
      header: 'User Details',
      sortable: true,
      render: (row: AppUser) => (
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${getAvatarColorClass(row.name)}`}>
            {getInitials(row.name)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>
            {row.isAdmin && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 rounded-[3px] border border-blue-100 dark:border-blue-900/50">
                Admin
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (row: AppUser) => <span className="text-slate-500 font-semibold">{row.username}</span>
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row: AppUser) => <span className="text-slate-500 font-medium">{row.email}</span>
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row: AppUser) => <span className="text-slate-655 dark:text-slate-400 font-medium">{row.role || '—'}</span>
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (row: AppUser) => <span className="text-slate-655 dark:text-slate-400 font-medium">{row.department || '—'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: AppUser) => {
        let styles = 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        let dot = 'bg-slate-400';

        if (row.status === 'Active') {
          styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
          dot = 'bg-emerald-500';
        } else if (row.status === 'Inactive') {
          styles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-405';
          dot = 'bg-amber-505';
        } else if (row.status === 'Locked') {
          styles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450';
          dot = 'bg-rose-500';
        } else if (row.status === 'Pending') {
          styles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
          dot = 'bg-blue-500';
        }

        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${styles}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: (row: AppUser) => <span className="text-slate-500 font-medium">{row.lastLogin || '—'}</span>
    }
  ], []);

  const tableActions = (usr: AppUser) => (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px]"
        onClick={(e) => { e.stopPropagation(); router.push(`/user-management/user-list/${usr.id}/edit`); }}
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[5px]"
        onClick={(e) => handleDelete(usr.id, e)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 text-left pb-24">
      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-650 transition-colors">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="hover:text-slate-655 transition-colors">User Management</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">User List</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <Users className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User List</h1>
            <p className="text-xs text-slate-450 font-medium">Manage corporate portal users, system roles, and account state.</p>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
              <Users className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider leading-none">Total Users</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 leading-none">{metrics.total}</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-[5px]">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Active Users</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 leading-none">{metrics.active}</p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-[5px]">
              <PauseCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Inactive Users</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 leading-none">{metrics.inactive}</p>
            </div>
          </CardContent>
        </Card>

        {/* Locked Users */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-[5px]">
              <LockKeyhole className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Locked Users</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 leading-none">{metrics.locked}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-[5px]">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Pending Invitations</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 leading-none">{metrics.pending}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Table Toolbar / Filters Panel - Directly inline matching client's screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-[260px] text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
            />
          </div>

          {/* More Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDialogOpen(true)}
            className="h-9 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px] relative"
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>More Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs" style={{ backgroundColor: primaryColor }}>
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Clear Filters Button */}
          {(searchQuery || roleFilter !== 'All' || deptFilter !== 'All' || statusFilter !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 rounded-[5px]"
            >
              <RotateCcw className="h-3 w-3 text-slate-500" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Invite User Action Button */}
        <Button
          onClick={() => router.push('/user-management/user-list/create')}
          className="h-9 text-xs font-bold text-white shadow-xs gap-1.5 hover:opacity-90 rounded-[5px]"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-4 w-4" />
          <span>Invite User</span>
        </Button>
      </div>

      {/* ReusableTable Card Container */}
      <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <ReusableTable
            columns={columns}
            data={filteredUsers}
            actions={tableActions}
            onRowClick={(row) => router.push(`/user-management/user-list/${row.id}/edit`)}
            showGear={true}
            selectable={true}
            selectedRows={selectedUsers}
            onRowSelectChange={setSelectedUsers}
            rowKey="id"
            borderless={true}
            page={page}
            totalRecords={totalRecords}
            onChangePage={setPage}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Filters Modal Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsFilterDialogOpen(false)}
          />
          
          {/* Modal Container */}
          <Card className="relative w-full max-w-md border dark:border-slate-800 shadow-2xl rounded-[5px] bg-white dark:bg-slate-900 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <CardContent className="p-6 flex flex-col gap-5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Filter Users</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsFilterDialogOpen(false)}
                  className="p-1 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 rounded-[5px] transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Filters Fields */}
              <div className="flex flex-col gap-4">
                
                {/* Role */}
                <div className="flex flex-col gap-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">System Role</Label>
                  <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Roles</SelectItem>
                      {allRoles.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="flex flex-col gap-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Department</Label>
                  <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Departments</SelectItem>
                      {allDepts.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Account Status</Label>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Locked">Locked</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Actions (Only visible if rows are selected in the table) */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-col gap-1.5 text-left border-t dark:border-slate-800 pt-4">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Bulk Actions ({selectedUsers.length} selected)
                    </Label>
                    <Select value={bulkAction} onValueChange={(val) => setBulkAction(val || 'None')}>
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[5px]">
                        <SelectItem value="None">No Action</SelectItem>
                        <SelectItem value="Activate">Activate Selection</SelectItem>
                        <SelectItem value="Deactivate">Deactivate Selection</SelectItem>
                        <SelectItem value="Lock">Lock Selection</SelectItem>
                        <SelectItem value="Delete">Delete Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 border-t dark:border-slate-800 pt-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleClearFilters();
                    setIsFilterDialogOpen(false);
                    setBulkAction('None');
                  }}
                  className="h-8.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px]"
                >
                  Reset All
                </Button>
                
                <Button
                  onClick={handleApplyFilters}
                  size="sm"
                  className="h-8.5 text-xs font-bold text-white hover:opacity-90 rounded-[5px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Apply Filters
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
