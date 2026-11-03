'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useStore } from '@/store/useStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Card, CardContent } from '@/components/ui/card';
import { fetchCallCenterListsWithoutPagination, fetchCallAssignmentDashboard, fetchCallAssignmentList } from '@/service/api/CallCenter/api';
import { fetchUsersList, assignLeadsToAgent } from '@/service/api/Leads/api';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  Users,
  Clock,
  Calendar,
  Settings,
  Filter,
  UserPlus,
  MoreVertical,
  Search,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { AssignmentCall } from '@/types/assignment';

export default function CallAssignmentPage() {
  const router = useRouter();
  const {
    canViewCallAssignmentOverview,
    canCreateCallAssignment,
    canEditCallAssignment,
    canDeleteCallAssignment,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCallAssignmentOverview) {
      toast.error('You do not have permission to view Call Assignment.');
      router.push('/');
    }
  }, [canViewCallAssignmentOverview, isLoaded, router]);

  const { primaryColor, user } = useStore();
  const {
    calls,
    selectedCallList,
    selectedStatus,
    searchQuery,
    setFilters,
    resetFilters,
    assignCallToUser,
    unassignCall,
    autoAssignCalls,
    setCalls
  } = useAssignmentStore();

  // Local Loading & Pagination State
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Teammates and Dashboard Metrics states
  const [users, setUsers] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    unassigned: number;
    unassignedPct: string;
    assigned: number;
    assignedPct: string;
    dueToday: number;
    dueTodayPct: string;
    overdue: number;
    overduePct: string;
  } | null>(null);

  // Helper for current month range formatted as YYYY-MM-DD
  const getCurrentMonthRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  }, []);

  // Active Dropdowns state for inline Assignee Selectors
  const [activeSelectCallId, setActiveSelectCallId] = useState<string | null>(null);

  // Dynamic user and organization IDs
  const userId = useMemo(() => {
    return user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  }, [user]);

  const orgId = useMemo(() => {
    return user?.organizationId || (typeof window !== 'undefined' ? (localStorage.getItem('orgDetail') || localStorage.getItem('Organization_Id')) : null);
  }, [user]);

  const [dropdownLists, setDropdownLists] = useState<any[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch users list on mount
  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const res = await fetchUsersList();
        if (!active) return;
        const list = res
          ? (Array.isArray(res) ? res : (res.results || res.data || []))
          : [];
        const mappedUsers = list.map((u: any) => {
          const id = u.id || u.User_Id || 0;
          const firstName = u.first_name || u.FirstName || '';
          const lastName = u.last_name || u.LastName || '';
          const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'Unknown';
          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
          return { id, name, avatarUrl };
        });
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Failed to load users list:', err);
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  // Fetch dashboard assignment metrics on mount / when userId changes
  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      if (!userId) return;
      try {
        const { startDate, endDate } = getCurrentMonthRange;
        const res = await fetchCallAssignmentDashboard({
          UserId: userId,
          StartDate: startDate,
          EndDate: endDate
        });
        if (!active) return;
        setDashboardMetrics({
          unassigned: res.UnassignedCalls || 0,
          unassignedPct: typeof res.UnassignedPercentage === 'number' ? res.UnassignedPercentage.toFixed(2) : '0.00',
          assigned: res.AssignedCalls || 0,
          assignedPct: typeof res.AssignedPercentage === 'number' ? res.AssignedPercentage.toFixed(2) : '0.00',
          dueToday: res.DueToday || 0,
          dueTodayPct: typeof res.DueTodayPercentage === 'number' ? res.DueTodayPercentage.toFixed(2) : '0.00',
          overdue: res.Overdue || 0,
          overduePct: typeof res.OverduePercentage === 'number' ? res.OverduePercentage.toFixed(2) : '0.00'
        });
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      }
    };
    fetchMetrics();
    return () => {
      active = false;
    };
  }, [userId, getCurrentMonthRange]);

  // Fetch dropdown call lists on mount / when credentials change
  useEffect(() => {
    let active = true;
    const loadDropdownLists = async () => {
      if (!userId || !orgId) return;
      try {
        const data = await fetchCallCenterListsWithoutPagination(userId, orgId);
        if (active && Array.isArray(data)) {
          setDropdownLists(data);
          // Auto-select first list if there is none selected or not matching
          if (data.length > 0) {
            const hasMatch = data.some(item => item.ListName === selectedCallList);
            if (!hasMatch) {
              setFilters({ selectedCallList: data[0].ListName || '' });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dropdown call lists', err);
      }
    };
    loadDropdownLists();
    return () => {
      active = false;
    };
  }, [userId, orgId, setFilters, selectedCallList]);

  // Find selected list ID
  const selectedListId = useMemo(() => {
    const matched = dropdownLists.find(list => list.ListName === selectedCallList);
    return matched?.id || null;
  }, [dropdownLists, selectedCallList]);

  // Fetch detailed list contacts on selection change / filters change
  useEffect(() => {
    if (!selectedListId || !userId) return;

    let active = true;
    const loadListDetails = async () => {
      setLoading(true);
      try {
        const res = await fetchCallAssignmentList({
          ListId: selectedListId,
          UserId: userId,
          ...(selectedStatus !== 'All' && { Status: selectedStatus }),
          ...(debouncedSearchQuery.trim() !== '' && { Search: debouncedSearchQuery })
        });
        if (!active) return;

        const resultsArray = res.results || (Array.isArray(res) ? res : []);
        const mappedCalls: AssignmentCall[] = [];

        resultsArray.forEach((item: any) => {
          const listIndustry = item.ListIndustry || [];
          listIndustry.forEach((lead: any) => {
            const isAssigned = lead.Assign_Status === 'Assigned';
            mappedCalls.push({
              id: String(lead.id),
              leadName: lead.Lead_Name || 'Unnamed Contact',
              company: lead.Company || 'N/A',
              location: [lead.City, lead.State, lead.Country].filter(Boolean).join(', ') || 'N/A',
              phone: lead.Phone_No || 'N/A',
              nextCallDateTime: item.Call_Date || 'N/A',
              status: isAssigned ? 'Assigned' : 'Unassigned',
              assignedTo: lead.Assign_Name || undefined,
              avatarUrl: lead.Assign_Name
                ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(lead.Assign_Name)}`
                : undefined,
              isDueToday: item.Call_Date === new Date().toISOString().split('T')[0],
              isOverdue: item.Call_Date && new Date(item.Call_Date) < new Date(new Date().setHours(0, 0, 0, 0)),
            });
          });
        });

        setCalls(mappedCalls);
      } catch (err) {
        console.error('Failed to load call list details', err);
        toast.error('Failed to load contact details for this list.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadListDetails();

    return () => {
      active = false;
    };
  }, [selectedListId, userId, selectedStatus, debouncedSearchQuery, setCalls]);


  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCallList, selectedStatus, searchQuery]);

  // Derived metrics from CallAssignmentDashboardAPI
  const metrics = useMemo(() => {
    if (dashboardMetrics) {
      return {
        total: dashboardMetrics.unassigned + dashboardMetrics.assigned,
        ...dashboardMetrics
      };
    }
    return {
      total: 0,
      unassigned: 0,
      unassignedPct: '0.00',
      assigned: 0,
      assignedPct: '0.00',
      dueToday: 0,
      dueTodayPct: '0.00',
      overdue: 0,
      overduePct: '0.00'
    };
  }, [dashboardMetrics]);

  // Filtered List of calls
  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      // Search Match
      const matchesSearch = searchQuery === '' ||
        c.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      // Dropdown Filters
      const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [calls, searchQuery, selectedStatus]);

  // Flat array representing order of rows in the table
  const tableRows = useMemo(() => {
    return filteredCalls.map(c => ({ type: 'call', data: c }));
  }, [filteredCalls]);

  // Paged Rows based on flat array
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return tableRows.slice(start, end);
  }, [tableRows, currentPage, pageSize]);

  const totalPages = Math.ceil(tableRows.length / pageSize) || 1;

  const handleAutoAssign = () => {
    if (metrics.unassigned === 0) {
      toast.info('All calls are already assigned.');
      return;
    }
    autoAssignCalls();
    toast.success('Unassigned calls successfully distributed among team members.');
  };

  const handleClearFilters = () => {
    resetFilters();
    toast.success('Filters cleared.');
  };

  const handleAssignCallToUser = async (callId: string, agent: any) => {
    try {
      await assignLeadsToAgent({
        lead_ids: [parseInt(callId, 10)],
        agent_id: agent.id
      });
      // Update local state in Zustand store
      assignCallToUser(callId, agent.name);
      toast.success(`Assigned call to ${agent.name}`);

      // Refresh dashboard metrics to update the KPI cards dynamically
      if (userId) {
        const { startDate, endDate } = getCurrentMonthRange;
        const res = await fetchCallAssignmentDashboard({
          UserId: userId,
          StartDate: startDate,
          EndDate: endDate
        });
        setDashboardMetrics({
          unassigned: res.UnassignedCalls || 0,
          unassignedPct: typeof res.UnassignedPercentage === 'number' ? res.UnassignedPercentage.toFixed(2) : '0.00',
          assigned: res.AssignedCalls || 0,
          assignedPct: typeof res.AssignedPercentage === 'number' ? res.AssignedPercentage.toFixed(2) : '0.00',
          dueToday: res.DueToday || 0,
          dueTodayPct: typeof res.DueTodayPercentage === 'number' ? res.DueTodayPercentage.toFixed(2) : '0.00',
          overdue: res.Overdue || 0,
          overduePct: typeof res.OverduePercentage === 'number' ? res.OverduePercentage.toFixed(2) : '0.00'
        });
      }
    } catch (err) {
      console.error('Failed to assign call:', err);
      toast.error('Failed to assign call to teammate.');
    }
  };

  const columns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'index',
      header: '#',
      align: 'center',
      className: 'w-12 font-mono font-bold text-slate-500 pl-4',
      render: (row, idx) => (currentPage - 1) * pageSize + idx + 1
    },
    {
      key: 'leadName',
      header: 'Lead Name',
      align: 'left',
      className: 'font-bold',
      render: (row) => (
        <button
          onClick={() => toast.info(`Viewing lead details for ${row.leadName}`)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer text-left"
        >
          {row.leadName}
        </button>
      )
    },
    {
      key: 'company',
      header: 'Company',
      align: 'left',
      className: 'text-xs font-semibold text-slate-700 dark:text-slate-300',
      render: (row) => row.company
    },
    {
      key: 'phone',
      header: 'Phone',
      align: 'left',
      className: 'text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono',
      render: (row) => row.phone
    },
    {
      key: 'nextCallDateTime',
      header: 'Next Call Date & Time',
      align: 'left',
      className: 'text-xs font-bold text-slate-700 dark:text-slate-300 font-mono',
      render: (row) => row.nextCallDateTime
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => {
        const isUnassigned = row.status === 'Unassigned';
        return isUnassigned ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50">
            Unassigned
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50">
            Assigned
          </span>
        );
      }
    },
    {
      key: 'assignTo',
      header: 'Assign To',
      align: 'left',
      className: 'min-w-[160px] relative',
      render: (row) => {
        const isUnassigned = row.status === 'Unassigned';
        return (
          <div className="relative">
            <DropdownMenu
              open={activeSelectCallId === row.id}
              onOpenChange={(open) => {
                setActiveSelectCallId(open ? row.id : null);
              }}
            >
              <DropdownMenuTrigger render={
                <button
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 w-full text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-left border-slate-200 dark:border-slate-800 shadow-xs transition-colors hover:bg-slate-50/50 cursor-pointer ${isUnassigned ? 'text-slate-400 dark:text-slate-550' : 'text-slate-800 dark:text-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {!isUnassigned && row.avatarUrl && (
                      <img
                        src={row.avatarUrl}
                        alt={row.assignedTo}
                        className="h-5 w-5 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                      />
                    )}
                    <span className="truncate">{row.assignedTo || 'Select User'}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </button>
              } />

              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-50"
              >
                <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Assign Teammate
                </div>
                <div className="mt-1 max-h-48 overflow-y-auto">
                  {users.map((user) => {
                    const isSelected = row.assignedTo === user.name;
                    return (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => {
                          handleAssignCallToUser(row.id, user);
                          setActiveSelectCallId(null);
                        }}
                        className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer ${isSelected ? 'bg-slate-50 dark:bg-slate-900 text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-5.5 w-5.5 rounded-full object-cover shrink-0 border border-slate-100"
                        />
                        <span className="flex-1 text-left truncate">{user.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [currentPage, pageSize, activeSelectCallId, users]);

  if (isLoaded && !canViewCallAssignmentOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left pb-10">

      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Call Assignment
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>{getTenantName().toUpperCase()}</span>
            <span>/</span>
            <span>Call Management</span>
            <span>/</span>
            <span>Call Lists</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Call Assignment</span>
          </nav>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Unassigned Calls Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
              <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unassigned Calls</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.unassigned}</h3>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {metrics.unassignedPct}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Calls Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Calls</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.assigned}</h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {metrics.assignedPct}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Due Today Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-2xl">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-450" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Today</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.dueToday}</h3>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-450 mt-0.5 block">
                {metrics.dueTodayPct}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.overdue}</h3>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-455 mt-0.5 block">
                {metrics.overduePct}% of total
              </span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">

        {/* Call List selector */}
        <div className="flex-1 min-w-[150px] text-left">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Call List</label>
          <div className="relative">
            <select
              value={selectedCallList}
              onChange={(e) => setFilters({ selectedCallList: e.target.value })}
              className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer"
            >
              {dropdownLists.length === 0 ? (
                <option value="">No Call Lists Available</option>
              ) : (
                dropdownLists.map(list => (
                  <option key={list.id} value={list.ListName || ''}>
                    {list.ListName || 'Unnamed List'}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>



        {/* Status selector */}
        <div className="flex-1 min-w-[130px] text-left">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setFilters({ selectedStatus: e.target.value })}
              className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Assigned">Assigned</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-[2] min-w-[220px] text-left">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Search by lead name, company, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Clear Filter button */}
        <Button
          onClick={handleClearFilters}
          variant="outline"
          className="h-8 rounded-xl px-3 py-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="h-3 w-3 text-slate-500" />
          <span>Clear</span>
        </Button>

      </div>

      {/* Main Table Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardContent className="p-4">
          <ReusableTable
            columns={columns}
            data={pagedRows.map(r => r.data)}
            loading={loading}
            page={currentPage}
            totalRecords={tableRows.length}
            onChangePage={setCurrentPage}
            pageSize={pageSize}
            onChangePageSize={setPageSize}
            showGear={false}
            borderless={true}
          />
        </CardContent>
      </Card>

    </div>
  );
}
