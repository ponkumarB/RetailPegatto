'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useCallStore } from '@/store/useCallStore';
import { usePermission } from '@/hooks/usePermission';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchUserCallCenterListDashboard, fetchNewITTodayCallCard, fetchCallsByAssignedTo } from '@/service/api/CallCenter/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Phone,
  CalendarCheck,
  Clock,
  PhoneOff,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ArrowRight,
  Search,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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

export function CallSummaryPageInner() {
  const router = useRouter();
  const {
    canViewCallSummaryOverview,
    canExportCallSummary,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCallSummaryOverview) {
      toast.error('You do not have permission to view Call Summary.');
      router.push('/');
    }
  }, [canViewCallSummaryOverview, isLoaded, router]);

  const { primaryColor, user } = useStore();
  const { selectedCallListId, setSelectedCallListId } = useCallStore();
  const searchParams = useSearchParams();
  const listIdParam = searchParams.get('listId');

  // Sync listId from query parameter
  useEffect(() => {
    if (listIdParam !== null) {
      setSelectedCallListId(listIdParam);
    } else {
      setSelectedCallListId('');
    }
  }, [listIdParam, setSelectedCallListId]);

  const userId = useMemo(() => {
    return user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || '71';
  }, [user]);

  const orgId = useMemo(() => {
    return user?.organizationId || (typeof window !== 'undefined' ? (localStorage.getItem('orgDetail') || localStorage.getItem('Organization_Id')) : null) || '1';
  }, [user]);

  // Current month date range helper
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end };
  }, []);

  // Custom date range state
  const [startDate, setStartDate] = useState(() => currentMonthRange.startDate);
  const [endDate, setEndDate] = useState(() => currentMonthRange.endDate);

  // Call Lists state
  const [callLists, setCallLists] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active metrics
  const [activeListMetrics, setActiveListMetrics] = useState({
    totalCalls: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  // Teammate breakdown
  const [callsByAssignedTo, setCallsByAssignedTo] = useState<any[]>([]);

  // Search & Filter state for the Call Lists table
  const [searchTerm, setSearchTerm] = useState('');
  const [minTotalCalls, setMinTotalCalls] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Call List details
  const activeList = useMemo(() => {
    const selected = callLists.find(cl => cl.id === selectedCallListId);
    if (selected) return selected;
    return {
      id: '',
      name: 'All Lists (Date Range)',
      date: '-',
      totalCalls: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0
    };
  }, [callLists, selectedCallListId]);

  // Date picker dropdown state
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Display label in the header
  const displayDateRangeLabel = useMemo(() => {
    if (selectedCallListId && activeList.id) {
      return `${activeList.name}`;
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }, [selectedCallListId, activeList, startDate, endDate]);

  // Load all call lists for the details table
  useEffect(() => {
    let active = true;
    const loadCallLists = async () => {
      if (!orgId) return;
      try {
        const data = await fetchUserCallCenterListDashboard({
          Organization_Id: orgId,
          page: currentPage
        });
        if (active) {
          const results = data.results || (Array.isArray(data) ? data : []);
          const count = data.count !== undefined ? data.count : results.length;
          const mapped = results.map((item: any) => ({
            id: String(item.Id || item.id),
            name: item.CallListName || item.ListName || 'Unnamed List',
            date: formatDate(item.Date || item.Call_Date || item.Created_Date),
            totalCalls: item.TotalLeads || 0,
            completed: item.Completed || 0,
            pending: item.Pending || 0,
            overdue: item.Overdue || 0,
            completionRate: typeof item.CompletionPercentage === 'number' ? Math.round(item.CompletionPercentage) : 0
          }));
          setCallLists(mapped);
          setTotalCount(count);
        }
      } catch (err) {
        console.error('Failed to load call lists', err);
      }
    };
    loadCallLists();
    return () => {
      active = false;
    };
  }, [currentPage, orgId]);

  // Load stats based on selected list id or selected date range
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const cardPayload: any = {
          user_id: userId,
          start_date: startDate,
          end_date: endDate
        };
        const breakdownPayload: any = {
          user_id: userId,
          start_date: startDate,
          end_date: endDate
        };

        if (selectedCallListId && selectedCallListId !== '') {
          cardPayload.list_id = selectedCallListId;
          breakdownPayload.list_id = selectedCallListId;
        }

        const cardData = await fetchNewITTodayCallCard(cardPayload);
        const breakdownData = await fetchCallsByAssignedTo(breakdownPayload);

        if (active) {
          // Parse Summary Card metrics
          let total = 0, completed = 0, pending = 0, overdue = 0;
          if (cardData) {
            if (Array.isArray(cardData)) {
              cardData.forEach((item: any) => {
                const label = (item.label || item.name || '').toLowerCase();
                const val = Number(item.value || item.count || 0);
                if (label.includes('total')) total = val;
                else if (label.includes('complete')) completed = val;
                else if (label.includes('pending')) pending = val;
                else if (label.includes('overdue')) overdue = val;
              });
            } else {
              total = cardData.total_calls ?? cardData.total ?? cardData.TotalCalls ?? cardData.Total ?? 0;
              completed = cardData.completed_calls ?? cardData.completed ?? cardData.Completed ?? 0;
              pending = cardData.pending_calls ?? cardData.pending ?? cardData.Pending ?? 0;
              overdue = cardData.overdue_calls ?? cardData.overdue ?? cardData.Overdue ?? 0;
            }
          }
          setActiveListMetrics({
            totalCalls: Number(total),
            completed: Number(completed),
            pending: Number(pending),
            overdue: Number(overdue)
          });

          // Parse breakdown data
          let breakdownList: any[] = [];
          if (breakdownData) {
            if (Array.isArray(breakdownData)) {
              breakdownList = breakdownData;
            } else if (breakdownData.assigned_users && Array.isArray(breakdownData.assigned_users)) {
              breakdownList = breakdownData.assigned_users;
            } else if (typeof breakdownData === 'object') {
              breakdownList = breakdownData.data || breakdownData.results || [];
            }
          }
          setCallsByAssignedTo(breakdownList);
        }
      } catch (err) {
        console.error('Failed to load stats details', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, [selectedCallListId, startDate, endDate, userId]);

  // Derived metrics values (favoring fetched card metrics over static activeList)
  const totalCallsVal = activeListMetrics.totalCalls;
  const completedVal = activeListMetrics.completed;
  const pendingVal = activeListMetrics.pending;
  const overdueVal = activeListMetrics.overdue;

  // Filter call lists based on search term (bottom table)
  const filteredCallLists = useMemo(() => {
    return callLists.filter(list => {
      const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMinCalls = minTotalCalls ? list.totalCalls >= parseInt(minTotalCalls, 10) : true;
      return matchesSearch && matchesMinCalls;
    });
  }, [callLists, searchTerm, minTotalCalls]);

  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'index',
      header: '#',
      sortable: false,
      draggable: false,
      className: 'w-12 text-center pl-4 font-mono text-[11px] font-bold text-slate-500',
      render: (_row: any, index: number) => <span>{index + 1}</span>
    },
    {
      key: 'name',
      header: 'Call List Name',
      sortable: false,
      render: (list: any) => {
        const isSelected = selectedCallListId === list.id;
        return (
          <span className={`text-xs font-bold ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} hover:underline`}>
            {list.name}
          </span>
        );
      }
    },
    {
      key: 'date',
      header: 'Date',
      sortable: false,
      className: 'text-center text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono'
    },
    {
      key: 'totalCalls',
      header: 'Total',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-slate-900 dark:text-white'
    },
    {
      key: 'completed',
      header: 'Completed',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400'
    },
    {
      key: 'pending',
      header: 'Pending',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-amber-600 dark:text-amber-400'
    },
    {
      key: 'overdue',
      header: 'Overdue',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-rose-600 dark:text-rose-400'
    },
    {
      key: 'completionRate',
      header: 'Completion %',
      sortable: false,
      className: 'text-right pr-4',
      render: (list: any) => (
        <div className="flex items-center justify-end gap-2 w-full">
          <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full"
              style={{ width: `${list.completionRate}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {list.completionRate}%
          </span>
        </div>
      )
    }
  ], [selectedCallListId]);

  // Recharts Donut data for Call Outcome Summary
  const donutData = useMemo(() => {
    return [
      { name: 'Completed', value: completedVal, color: '#10b981' },
      { name: 'Pending', value: pendingVal, color: '#f59e0b' },
      { name: 'Overdue', value: overdueVal, color: '#ef4444' }
    ];
  }, [completedVal, pendingVal, overdueVal]);

  // Recharts Horizontal Bar chart data for Assigned To
  const assignedData = useMemo(() => {
    if (callsByAssignedTo.length > 0) {
      return callsByAssignedTo.map((item: any) => {
        const name = item.assigned_to || item.Assign_Name || item.username || item.name || 'Unknown';
        const count = Number(item.count || item.TotalCalls || item.value || 0);
        const percentage = typeof item.percentage === 'number'
          ? item.percentage
          : (totalCallsVal > 0 ? Math.round((count / totalCallsVal) * 100) : 0);
        return {
          name,
          value: count,
          label: `${count} (${percentage}%)`
        };
      }).reverse();
    }
    return [];
  }, [callsByAssignedTo, totalCallsVal]);

  // Export Call List to CSV
  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Preparing export...',
        success: () => {
          const headers = ['#', 'Call List Name', 'Date', 'Total Calls', 'Completed', 'Pending', 'Overdue', 'Completion %'];
          const rows = callLists.map((cl, i) => [
            i + 1,
            cl.name,
            cl.date,
            cl.totalCalls,
            cl.completed,
            cl.pending,
            cl.overdue,
            `${cl.completionRate}%`
          ]);
          const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `call_summary_${selectedCallListId ? (activeList.name || 'export') : 'aggregate'}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return 'Call summary data exported successfully!';
        },
        error: 'Export failed.'
      }
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setMinTotalCalls('');
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  if (isLoaded && !canViewCallSummaryOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left pb-10">

      {/* Breadcrumb & Date selection section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Call Summary
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>{getTenantName().toUpperCase()}</span>
            <span>/</span>
            <span>Call Management</span>
            <span>/</span>
            <span>Call Lists</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Call Summary</span>
          </nav>
        </div>

        {/* Date Preset Selector, Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">

          {selectedCallListId && (
            <Button
              onClick={() => {
                router.push('/call-management/call-summary');
                toast.info('Returned to date range aggregate view');
              }}
              variant="ghost"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer"
            >
              <span>Clear list filter: {activeList.name}</span>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Custom Date Range selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 cursor-pointer shadow-xs border-slate-200 dark:border-slate-800 transition-colors"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>{displayDateRangeLabel}</span>
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            </button>

            <AnimatePresence>
              {dateDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDateDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg p-4 z-40 text-left space-y-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Filter by Date Range
                      </span>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={() => {
                            const range = currentMonthRange;
                            setStartDate(range.startDate);
                            setEndDate(range.endDate);
                            router.push('/call-management/call-summary');
                            setDateDropdownOpen(false);
                            toast.success('Stats filtered for this month');
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 cursor-pointer"
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => {
                            const now = new Date();
                            const prior = new Date();
                            prior.setDate(now.getDate() - 30);
                            const start = prior.toISOString().split('T')[0];
                            const end = now.toISOString().split('T')[0];
                            setStartDate(start);
                            setEndDate(end);
                            router.push('/call-management/call-summary');
                            setDateDropdownOpen(false);
                            toast.success('Stats filtered for last 30 days');
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 cursor-pointer"
                        >
                          Last 30 Days
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            router.push('/call-management/call-summary');
                            setDateDropdownOpen(false);
                            toast.success('Custom date range applied');
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="w-full text-white text-xs font-bold h-8 rounded-lg mt-2 cursor-pointer"
                        >
                          Apply Range
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Or select a specific Call List
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {callLists.map((list) => {
                          const isSelected = selectedCallListId === list.id;
                          return (
                            <button
                              key={list.id}
                              onClick={() => {
                                router.push(`/call-management/call-summary?listId=${list.id}`);
                                setDateDropdownOpen(false);
                                toast.success(`Showing stats for ${list.name}`);
                              }}
                              className={`w-full px-3 py-1.5 text-left text-xs font-semibold rounded-lg flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${isSelected ? 'bg-slate-50 dark:bg-slate-900 text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-350'
                                }`}
                            >
                              <span className="font-bold truncate">{list.name}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{list.date}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Filters trigger */}
          <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
            <PopoverTrigger
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs transition-colors"
            >
              <Filter className="h-4 w-4 text-slate-500" />
              <span>Filters</span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Filter Call Lists</h4>
                  <Button
                    variant="ghost"
                    onClick={handleResetFilters}
                    className="text-xs h-7 text-slate-500"
                  >
                    Reset
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Search Name</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="e.g. May 2024"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-8 h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Minimum Calls</label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={minTotalCalls}
                      onChange={(e) => {
                        setMinTotalCalls(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Calls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.0 }}
        >
          <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Calls</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCallsVal}</h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                  <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                  ↑ 20% vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{completedVal}</h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {totalCallsVal > 0 ? ((completedVal / totalCallsVal) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingVal}</h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {totalCallsVal > 0 ? ((pendingVal / totalCallsVal) * 100).toFixed(2) : 0}% of total
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
                <PhoneOff className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{overdueVal}</h3>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {totalCallsVal > 0 ? ((overdueVal / totalCallsVal) * 100).toFixed(2) : 0}% of total
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Main Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Call Outcome Summary */}
        <Card className="border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Call Outcome Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center sm:flex-row items-center gap-4 py-4">

            {/* Donut representation */}
            <div className="h-[150px] w-[150px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400">Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCallsVal}</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex-1 space-y-2 text-left text-xs font-semibold w-full">
              {donutData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-900 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-extrabold shrink-0">
                    {item.value} ({totalCallsVal > 0 ? ((item.value / totalCallsVal) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>

        {/* Calls by Assigned To */}
        <Card className="border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Calls by Assigned To</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[200px] h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={assignedData}
                margin={{ top: 10, right: 70, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 'dataMax + 1']} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={12}>
                  <LabelList dataKey="label" position="right" fontSize={9} fill="#475569" className="font-bold dark:fill-slate-400" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="text-center text-[10px] text-slate-400 font-bold pb-2 uppercase tracking-widest">
            Number of Calls
          </div>
        </Card>

      </div>

      {/* Call Summary Details Table */}
      <Card className="w-full border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between">
        <div className="text-left">
          <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Call Summary Details</CardTitle>
          </CardHeader>
          <ReusableTable
            columns={columns}
            data={filteredCallLists}
            loading={loading}
            title="No entries found matching filters."
            rowKey="id"
            page={currentPage}
            totalRecords={searchTerm || minTotalCalls ? filteredCallLists.length : totalCount}
            onChangePage={setCurrentPage}
            pageSize={10}
            showGear={false}
            borderless={true}
            showPageSizeSelector={false}
            onRowClick={(list) => {
              router.push(`/call-management/call-summary?listId=${list.id}`);
              toast.success(`Selected Call List: ${list.name}`);
            }}
            rowClassName={(list) => {
              const isSelected = selectedCallListId === list.id;
              return isSelected
                ? 'bg-green-50/40 dark:bg-green-950/10 hover:bg-green-50/50 dark:hover:bg-green-950/20'
                : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30';
            }}
          />
        </div>
      </Card>

    </div>
  );
}

export default function CallSummaryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    }>
      <CallSummaryPageInner />
    </Suspense>
  );
}
