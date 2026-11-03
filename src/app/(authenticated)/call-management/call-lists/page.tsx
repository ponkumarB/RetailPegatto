'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useStore } from '@/store/useStore';
import { useCallStore } from '@/store/useCallStore';
import { fetchUserCallCenterListDashboard, deleteCallCenterList, searchCallCenterLists } from '@/service/api/CallCenter/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import {
  Phone,
  Plus,
  Search,
  Trash2,
  Eye,
  BarChart2,
  Calendar,
  MoreVertical,
  CalendarCheck
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { motion } from 'motion/react';

// Format helper for dates
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

export default function CallListsDirectoryPage() {
  const router = useRouter();
  const {
    canCreateCallList,
    canDeleteCallList,
    canViewCallListOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCallListOverview) {
      toast.error('You do not have permission to view Call Lists.');
      router.push('/');
    }
  }, [canViewCallListOverview, isLoaded, router]);

  const { primaryColor, user } = useStore();
  const { deleteCallList, setSelectedCallListId } = useCallStore();

  const userId = useMemo(() => {
    return user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || '71';
  }, [user]);

  const orgId = useMemo(() => {
    return user?.organizationId || (typeof window !== 'undefined' ? (localStorage.getItem('orgDetail') || localStorage.getItem('Organization_Id')) : null) || '1';
  }, [user]);

  const [callLists, setCallLists] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // API default page size

  // Debounce search query to prevent excessive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!userId || !orgId) return;
      setLoading(true);
      try {
        let data;
        if (debouncedSearchQuery.trim() !== '') {
          data = await searchCallCenterLists(debouncedSearchQuery, orgId, userId, currentPage);
        } else {
          data = await fetchUserCallCenterListDashboard({
            Organization_Id: orgId,
            page: currentPage
          });
        }

        if (active) {
          const resultsArray = data.results || (Array.isArray(data) ? data : []);
          const total = data.count !== undefined ? data.count : resultsArray.length;

          const mappedLists = resultsArray.map((item: any) => {
            const isDashboardItem = 'CallListName' in item;

            if (isDashboardItem) {
              return {
                id: item.Id,
                name: item.CallListName || 'Unnamed List',
                callListId: item.ListId || 'N/A',
                date: formatDate(item.Date),
                totalCalls: item.TotalLeads || 0,
                completed: item.Completed || 0,
                pending: item.Pending || 0,
                overdue: item.Overdue || 0,
                followUps: item.FollowUps || 0,
                completionRate: typeof item.CompletionPercentage === 'number' ? Math.round(item.CompletionPercentage) : 0
              };
            } else {
              // Map from search result format
              const listIndustry = item.Industry || item.ListIndustry || [];
              const completed = listIndustry.filter((c: any) => c.Call_Status === 'Completed').length;
              const pending = listIndustry.filter((c: any) => c.Call_Status === 'Pending' || c.Call_Status === 'Unassigned').length;
              const overdue = listIndustry.filter((c: any) => c.Call_Status === 'Overdue').length;
              const followUps = listIndustry.filter((c: any) => c.Call_Status === 'Follow Up').length;
              const totalCalls = item.TotalLeads || listIndustry.length || 0;
              const completionRate = totalCalls > 0 ? Math.round((completed / totalCalls) * 100) : 0;

              return {
                id: item.id,
                name: item.ListName || 'Unnamed List',
                callListId: item.ContactListId || 'N/A',
                date: formatDate(item.Call_Date || item.Created_Date),
                totalCalls,
                completed,
                pending,
                overdue,
                followUps,
                completionRate
              };
            }
          });
          setCallLists(mappedLists);
          setTotalCount(total);
        }
      } catch (err) {
        console.error('Error fetching call center lists', err);
        toast.error('Failed to load call lists');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [currentPage, userId, orgId, debouncedSearchQuery]);

  // Search results are already filtered server-side
  const filteredLists = useMemo(() => {
    return callLists;
  }, [callLists]);

  // Total pages based on backend total count
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleDelete = async (id: string | number, name: string) => {
    try {
      await deleteCallCenterList(id);
      setCallLists(prev => prev.filter(list => list.id !== id));
      toast.success(`Call list "${name}" has been deleted successfully.`);
    } catch (err: any) {
      console.error('Failed to delete call list:', err);
      toast.error(err?.message || 'Failed to delete Call List. Please try again.');
    }
  };

  const handleViewDetails = (id: string | number) => {
    setSelectedCallListId(String(id));
    router.push(`/call-management/call-lists/${id}`);
  };

  const handleViewSummary = (id: string | number) => {
    setSelectedCallListId(String(id));
    router.push(`/call-management/call-summary?listId=${id}`);
  };

  const columns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'index',
      header: '#',
      align: 'center',
      className: 'w-12 font-mono font-bold text-slate-400',
      render: (row, idx) => (currentPage - 1) * itemsPerPage + idx + 1
    },
    {
      key: 'name',
      header: 'Call List Name',
      align: 'left',
      className: 'font-bold',
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="text-left font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block"
        >
          {row.name}
        </button>
      )
    },
    {
      key: 'callListId',
      header: 'List ID',
      align: 'center',
      className: 'font-mono font-semibold text-slate-500 dark:text-slate-400',
      render: (row) => row.callListId
    },
    {
      key: 'date',
      header: 'Date',
      align: 'center',
      className: 'font-mono font-semibold text-slate-500 dark:text-slate-400',
      render: (row) => row.date
    },
    {
      key: 'totalCalls',
      header: 'Total Leads',
      align: 'center',
      className: 'font-extrabold text-slate-900 dark:text-white',
      render: (row) => row.totalCalls
    },
    {
      key: 'completed',
      header: 'Completed',
      align: 'center',
      className: 'font-extrabold text-emerald-600 dark:text-emerald-400',
      render: (row) => row.completed
    },
    {
      key: 'pending',
      header: 'Pending',
      align: 'center',
      className: 'font-extrabold text-amber-600 dark:text-amber-400',
      render: (row) => row.pending
    },
    {
      key: 'overdue',
      header: 'Overdue',
      align: 'center',
      className: 'font-extrabold text-rose-600 dark:text-rose-400',
      render: (row) => row.overdue
    },
    {
      key: 'completionRate',
      header: 'Completion %',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full"
              style={{ width: `${row.completionRate}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {row.completionRate}%
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleViewDetails(row.id)}
            title="View Call Details"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleViewSummary(row.id)}
            title="View Summary Dashboard"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
          </button>
          {canDeleteCallList && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              title="Delete List"
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ], [currentPage, canDeleteCallList]);

  if (isLoaded && !canViewCallListOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left pb-10">

      {/* Header with CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Call Lists
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>{getTenantName().toUpperCase()}</span>
            <span>/</span>
            <span>Call Management</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Call Lists</span>
          </nav>
        </div>

        {canCreateCallList && (
          <Button
            onClick={() => router.push('/call-management/create')}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Call List</span>
          </Button>
        )}
      </div>

      {/* Directory Content Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">All Call Lists</CardTitle>
              <CardDescription className="dark:text-slate-400">Manage, search, and navigate through lead calling batches.</CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search call lists..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ReusableTable
            columns={columns}
            data={filteredLists}
            loading={loading}
            page={currentPage}
            totalRecords={totalCount}
            onChangePage={setCurrentPage}
            pageSize={itemsPerPage}
            showGear={false}
            borderless={true}
          />
        </CardContent>
      </Card>

    </div>
  );
}
