'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Users as UsersIcon,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Calendar,
  ChevronDown,
  X,
  Trophy
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
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  fetchEmployeePerformance,
  fetchTotalVsCompletedCallsChart,
  fetchTopEmployeePerformance,
  fetchUserCallCenterListDashboard,
  fetchNewITTodayCallCard
} from '@/service/api/CallCenter/api';
import { PeriodFilter, PeriodPreset } from '@/components/ui/PeriodFilter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Format helper for dates
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
};

// Fallback avatar helper
const getAvatarUrl = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
};

// Format week range label (e.g. 29 Apr - 05 May)
const formatWeekRangeLabel = (startStr: string, endStr: string) => {
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sDay = String(s.getDate()).padStart(2, '0');
    const sMonth = months[s.getMonth()];
    const eDay = String(e.getDate()).padStart(2, '0');
    const eMonth = months[e.getMonth()];
    return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
  } catch {
    return '';
  }
};

// Calculate start and end dates of a given week number in a given year
const getDatesOfWeek = (weekLabel: string, year: number) => {
  if (!weekLabel.startsWith('W-')) return null;
  const weekNum = parseInt(weekLabel.replace('W-', ''), 10);
  if (isNaN(weekNum)) return null;

  // Find the first Thursday of the year (standard ISO week formula)
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - (dayOfJan4 === 0 ? 6 : dayOfJan4 - 1));

  // Add (weekNum - 1) * 7 days to get the start of the target week (Monday)
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (weekNum - 1) * 7);

  // End of the target week is Sunday (start + 6 days)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  // Format as YYYY-MM-DD
  const format = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: format(start), endDate: format(end) };
};

export function EmployeeCallPerformanceInner() {
  const router = useRouter();
  const {
    canViewEmployeeCallPerformanceOverview,
    canExportEmployeeCallPerformance,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewEmployeeCallPerformanceOverview) {
      toast.error('You do not have permission to view Employee Call Performance.');
      router.push('/');
    }
  }, [canViewEmployeeCallPerformanceOverview, isLoaded, router]);

  const { primaryColor, user } = useStore();

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

  // Filter States
  const [period, setPeriod] = useState<PeriodPreset | string>('This Month');
  const [dateRange, setDateRange] = useState(() => {
    const formatDateStr = (yyyyMmDd: string): string => {
      const parts = yyyyMmDd.split('-');
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[monthIdx];
      const day = String(parseInt(parts[2], 10)).padStart(2, '0');
      return `${day} ${month} ${year}`;
    };
    return `${formatDateStr(currentMonthRange.startDate)} - ${formatDateStr(currentMonthRange.endDate)}`;
  });
  const [selectedCallListId, setSelectedCallListId] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Helper to parse "DD MMM YYYY - DD MMM YYYY" back to start_date & end_date YYYY-MM-DD
  const parsedDates = useMemo(() => {
    const parts = dateRange.split(' - ');
    if (parts.length !== 2) return { startDate: '', endDate: '' };

    const parsePart = (dateStr: string): string => {
      const subparts = dateStr.trim().split(' ');
      if (subparts.length !== 3) return '';
      const day = subparts[0].padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = months.indexOf(subparts[1]);
      if (monthIdx === -1) return '';
      const month = String(monthIdx + 1).padStart(2, '0');
      const year = subparts[2];
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: parsePart(parts[0]),
      endDate: parsePart(parts[1])
    };
  }, [dateRange]);

  const startDate = parsedDates.startDate;
  const endDate = parsedDates.endDate;

  // UI States
  const [loading, setLoading] = useState(true);

  // Loaded Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [callLists, setCallLists] = useState<any[]>([]);

  const selectedCallListName = useMemo(() => {
    if (!selectedCallListId) return 'All Call Lists';
    const matched = callLists.find(item => String(item.id) === String(selectedCallListId));
    return matched ? matched.name : selectedCallListId;
  }, [selectedCallListId, callLists]);

  const selectedWeekName = useMemo(() => {
    if (!selectedWeek) return 'All Weeks';
    const stat = weeklyStats.find(s => s.week === selectedWeek);
    return stat ? `${stat.week} (${stat.label})` : selectedWeek;
  }, [selectedWeek, weeklyStats]);


  const [cardStats, setCardStats] = useState<any>(null);

  // Derived calculated metrics from cardStats response
  const totalEmployeesVal = Number(cardStats?.total_employee || 0);
  const totalCallsVal = Number(cardStats?.total_calls || 0);
  const completedVal = Number(cardStats?.completed || 0);
  const pendingVal = Number(cardStats?.pending || 0);
  const overdueVal = Number(cardStats?.overdue || 0);

  const completedRate = totalCallsVal > 0 ? ((completedVal / totalCallsVal) * 100).toFixed(0) : '0';
  const pendingRate = totalCallsVal > 0 ? ((pendingVal / totalCallsVal) * 100).toFixed(2) : '0.00';
  const overdueRate = totalCallsVal > 0 ? ((overdueVal / totalCallsVal) * 100).toFixed(2) : '0.00';

  // Donut chart representation
  const donutData = useMemo(() => {
    return [
      { name: 'Completed', value: completedVal, color: '#10b981' },
      { name: 'Pending', value: pendingVal, color: '#f59e0b' },
      { name: 'Overdue', value: overdueVal, color: '#ef4444' }
    ];
  }, [completedVal, pendingVal, overdueVal]);

  // Weekly bar chart mapped data
  const barChartData = useMemo(() => {
    return weeklyStats.map(stat => ({
      name: stat.week,
      sublabel: stat.label.split(' - ')[0],
      fullLabel: stat.label,
      'Total Calls': stat.totalCalls,
      'Completed Calls': stat.completedCalls
    }));
  }, [weeklyStats]);

  const [topPerformers, setTopPerformersList] = useState<any[]>([]);

  // Load Call Lists for filters
  useEffect(() => {
    let active = true;
    const loadCallLists = async () => {
      if (!orgId) return;
      try {
        const data = await fetchUserCallCenterListDashboard({
          Organization_Id: orgId
        });
        if (active) {
          const results = data.results || (Array.isArray(data) ? data : []);
          const mapped = results.map((item: any) => ({
            id: String(item.Id || item.id),
            name: item.CallListName || item.ListName || 'Unnamed List'
          }));
          setCallLists(mapped);
        }
      } catch (err) {
        console.error('Failed to load call lists', err);
      }
    };
    loadCallLists();
    return () => {
      active = false;
    };
  }, [orgId]);

  // Load stats
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      if (!orgId) return;
      try {
        setLoading(true);

        const perfPayload: any = {
          user_id: Number(userId) || userId,
        };

        if (selectedCallListId && selectedCallListId !== '') {
          perfPayload.list_id = Number(selectedCallListId) || selectedCallListId;
        } else {
          perfPayload.start_date = startDate;
          perfPayload.end_date = endDate;
        }

        // Fetch Employee Performance
        const perfData = await fetchEmployeePerformance(perfPayload);

        // Fetch Top Employee Performance
        let topPerfData: any = null;
        try {
          topPerfData = await fetchTopEmployeePerformance(perfPayload);
        } catch (e) {
          console.error('Failed to fetch top employee performance', e);
        }

        // Fetch Today Call Card metrics (NewITTodayCallCardAPI)
        let cardData: any = null;
        try {
          const cardPayload: any = {
            user_id: Number(userId) || userId,
          };
          if (selectedCallListId && selectedCallListId !== '') {
            cardPayload.list_id = Number(selectedCallListId) || selectedCallListId;
          } else {
            cardPayload.start_date = startDate;
            cardPayload.end_date = endDate;
          }
          cardData = await fetchNewITTodayCallCard(cardPayload);
        } catch (e) {
          console.error('Failed to fetch today call card data', e);
        }

        // Fetch Week-Wise Chart data (always query the outer date range to show the trend)
        let chartData: any = null;
        try {
          const chartPayload = {
            organization_id: Number(orgId) || orgId,
            created_by: Number(userId) || userId,
            start_date: startDate,
            end_date: endDate
          };
          chartData = await fetchTotalVsCompletedCallsChart(chartPayload);
        } catch (e) {
          console.error('Failed to fetch total vs completed calls chart data', e);
        }

        if (active) {
          setCardStats(cardData);
          // Parse Employee Performance (Clean and Simple mapping)
          const empList = perfData?.employee_summary || [];
          const mappedEmployees = empList.map((emp: any) => {
            const total = Number(emp.TotalCalls || 0);
            const completed = Number(emp.Completed || 0);
            const pending = Number(emp.Pending || 0);
            const overdue = Number(emp.Overdue || 0);
            const rate = typeof emp.CompletionPercentage === 'number'
              ? emp.CompletionPercentage
              : Number(emp.CompletionPercentage || 0);

            return {
              id: String(emp.Assign_Id || Math.random()),
              name: emp.Assign_Name || 'Unknown',
              avatarUrl: emp.User_Photo || getAvatarUrl(emp.Assign_Name || 'Unknown'),
              totalCalls: total,
              completedCalls: completed,
              pendingCalls: pending,
              overdueCalls: overdue,
              completionRate: rate,
              avgCallDuration: emp.AverageDuration,
              performanceRating: emp.Performance
            };
          });
          setEmployees(mappedEmployees);

          // Parse Top Employee Performance
          const topList = topPerfData?.top_performers || [];
          const mappedTopEmployees = topList.map((emp: any) => {
            return {
              id: String(emp.Assign_Id || Math.random()),
              name: emp.Assign_Name || 'Unknown',
              avatarUrl: emp.User_Photo || getAvatarUrl(emp.Assign_Name || 'Unknown'),
              totalCalls: Number(emp.TotalCalls || 0),
              completionRate: Number(emp.CompletionPercentage || 0)
            };
          });
          setTopPerformersList(mappedTopEmployees);

          // Parse Week-wise chart stats
          const chartItems = chartData?.data || (Array.isArray(chartData) ? chartData : []);
          const currentYear = new Date(startDate).getFullYear();
          const mappedWeekly = chartItems.map((item: any, idx: number) => {
            const weekLabel = item.label || `W-${idx + 1}`;
            const dates = getDatesOfWeek(weekLabel, currentYear);
            const dateRangeLabel = dates ? formatWeekRangeLabel(dates.startDate, dates.endDate) : 'Custom Range';
            return {
              week: weekLabel,
              label: dateRangeLabel,
              totalCalls: Number(item.total_calls || 0),
              completedCalls: Number(item.completed_calls || 0)
            };
          });
          setWeeklyStats(mappedWeekly);
        }
      } catch (err) {
        console.error('Failed to load employee performance stats', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, [startDate, endDate, selectedCallListId, selectedWeek, orgId, userId]);

  const getPerformanceBadge = (rating: string) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800">
        {rating}
      </span>
    );
  };

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
      header: 'Employee Name',
      sortable: true,
      render: (emp: any) => (
        <div className="flex items-center gap-2">
          <img
            src={emp.avatarUrl}
            alt={emp.name}
            className="h-6.5 w-6.5 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-855"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{emp.name}</span>
        </div>
      )
    },
    {
      key: 'totalCalls',
      header: 'Total Calls',
      sortable: true,
      className: 'text-center text-xs font-extrabold text-slate-900 dark:text-white'
    },
    {
      key: 'completedCalls',
      header: 'Completed',
      sortable: true,
      className: 'text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400'
    },
    {
      key: 'pendingCalls',
      header: 'Pending',
      sortable: true,
      className: 'text-center text-xs font-extrabold text-amber-600 dark:text-amber-400'
    },
    {
      key: 'overdueCalls',
      header: 'Overdue',
      sortable: true,
      className: 'text-center text-xs font-extrabold text-rose-600 dark:text-rose-455'
    },
    {
      key: 'completionRate',
      header: 'Completion %',
      sortable: true,
      className: 'text-right',
      render: (emp: any) => (
        <div className="flex items-center justify-end gap-2 w-full">
          <div className="w-10 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${emp.completionRate}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{emp.completionRate}%</span>
        </div>
      )
    },
    {
      key: 'performanceRating',
      header: 'Performance',
      sortable: true,
      className: 'text-center',
      render: (emp: any) => getPerformanceBadge(emp.performanceRating)
    }
  ], []);

  const topColumns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'index',
      header: '#',
      sortable: false,
      draggable: false,
      className: 'w-10 text-center pl-4 font-mono text-[11px] font-bold text-slate-500',
      render: (_row: any, index: number) => <span>{index + 1}</span>
    },
    {
      key: 'name',
      header: 'Employee',
      sortable: false,
      render: (emp: any) => (
        <div className="flex items-center gap-2">
          <img
            src={emp.avatarUrl}
            alt={emp.name}
            className="h-6.5 w-6.5 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-855"
          />
          <span className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate max-w-[90px]">{emp.name}</span>
        </div>
      )
    },
    {
      key: 'completionRate',
      header: 'Completion %',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400',
      render: (emp: any) => <span>{emp.completionRate}%</span>
    },
    {
      key: 'totalCalls',
      header: 'Total Calls',
      sortable: false,
      className: 'text-center text-xs font-extrabold text-slate-900 dark:text-white'
    }
  ], []);

  if (isLoaded && !canViewEmployeeCallPerformanceOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header with Preset selectors */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Employees Performance on Call
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>{getTenantName().toUpperCase()}</span>
            <span>/</span>
            <span>Call Management</span>
            <span>/</span>
            <span>Reports</span>
            <span>/</span>
            <span>Call Performance</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Call Performance (Week Wise)</span>
          </nav>
        </div>

        {/* Date Preset Selector, Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          
          {(selectedCallListId || selectedWeek || period !== 'This Month') && (
            <Button
              onClick={() => {
                setSelectedCallListId('');
                setSelectedWeek('');
                setPeriod('This Month');
                const formatDateStr = (yyyyMmDd: string): string => {
                  const parts = yyyyMmDd.split('-');
                  const year = parts[0];
                  const monthIdx = parseInt(parts[1], 10) - 1;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const month = months[monthIdx];
                  const day = String(parseInt(parts[2], 10)).padStart(2, '0');
                  return `${day} ${month} ${year}`;
                };
                setDateRange(`${formatDateStr(currentMonthRange.startDate)} - ${formatDateStr(currentMonthRange.endDate)}`);
                toast.info('Returned to default month view');
              }}
              variant="ghost"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer"
            >
              <span>Clear filters</span>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          <PeriodFilter
            value={dateRange}
            period={period}
            onChange={(newRange, newPeriod) => {
              setDateRange(newRange);
              setPeriod(newPeriod);
              setSelectedCallListId('');
              setSelectedWeek('');
            }}
          />

          {/* Call List Dropdown Selector */}
          <Select
            value={selectedCallListId || 'all'}
            onValueChange={(val) => {
              const safeVal = val ?? 'all';
              setSelectedCallListId(safeVal === 'all' ? '' : safeVal);
              setSelectedWeek('');
            }}
          >
            <SelectTrigger className="w-[160px] !h-10 data-[size=default]:!h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-xs">
              <SelectValue placeholder="All Call Lists">
                {selectedCallListName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-955 border dark:border-slate-850 text-xs font-bold">
              <SelectItem value="all" className="text-xs font-semibold">All Call Lists</SelectItem>
              {callLists.map((list) => (
                <SelectItem key={list.id} value={list.id} className="text-xs font-semibold">
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Performance Week Dropdown Selector */}
          {weeklyStats.length > 0 && (
            <Select
              value={selectedWeek || 'all'}
              onValueChange={(val) => {
                const safeVal = val ?? 'all';
                setSelectedWeek(safeVal === 'all' ? '' : safeVal);
              }}
            >
              <SelectTrigger className="w-[160px] !h-10 data-[size=default]:!h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-xs">
                <SelectValue placeholder="All Weeks">
                  {selectedWeekName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-955 border dark:border-slate-850 text-xs font-bold">
                <SelectItem value="all" className="text-xs font-semibold">All Weeks</SelectItem>
                {weeklyStats.map((stat) => (
                  <SelectItem key={stat.week} value={stat.week} className="text-xs font-semibold">
                    {stat.week} ({stat.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Total Employees */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
                  <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Employees</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalEmployeesVal}</h3>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Active in range
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Total Calls */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Calls</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCallsVal}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                    Active in filter
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Completed Calls */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed Calls</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{completedVal}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {completedRate}% of total
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Calls */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Calls</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingVal}</h3>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {pendingRate}% of total
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Overdue Calls */}
            <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Calls</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{overdueVal}</h3>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-450 mt-0.5 block">
                    {overdueRate}% of total
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Charts section (Total vs Completed, Status Distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly Bar Chart (Col Span 2) */}
            <Card className="lg:col-span-2 border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
              <CardHeader className="pb-2 text-left">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Total Calls vs Completed Calls (Week/Month Wise)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelFormatter={(value) => {
                        const dataPoint = barChartData.find(d => d.name === value);
                        return dataPoint ? `${value} (${dataPoint.fullLabel})` : value;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="square" fontSize={11} wrapperStyle={{ top: -5, right: 10 }} />
                    <Bar dataKey="Total Calls" fill={primaryColor} radius={[3, 3, 0, 0]} barSize={16}>
                      {barChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.name === selectedWeek || selectedWeek === '' ? primaryColor : '#60a5fa'} />
                      ))}
                    </Bar>
                    <Bar dataKey="Completed Calls" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={16}>
                      {barChartData.map((entry, idx) => (
                        <Cell key={`cell-c-${idx}`} fill={entry.name === selectedWeek || selectedWeek === '' ? '#22c55e' : '#4ade80'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="text-center text-[10px] text-slate-400 font-bold pb-2 uppercase tracking-widest">
                Trend Label
              </div>
            </Card>

            {/* Status Distribution Donut Chart */}
            <Card className="border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
              <CardHeader className="pb-2 text-left">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Call Status Distribution (This Range)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                
                {/* Donut graphic */}
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
                        {donutData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCallsVal}</span>
                    <span className="text-[10px] font-bold text-slate-400">Total Calls</span>
                  </div>
                </div>

                {/* Custom legends */}
                <div className="flex-1 space-y-2.5 text-left text-xs font-semibold w-full">
                  {donutData.map(item => (
                    <div key={item.name} className="flex items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-900 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-extrabold">
                        {item.value} ({totalCallsVal > 0 ? ((item.value / totalCallsVal) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Performance tables grid: 70% left, 30% right */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 w-full">
            
            {/* Left table (70%) */}
            <Card className="lg:col-span-7 border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="text-left">
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Employee Performance Summary ({selectedWeek ? 'This Week' : period === 'This Month' ? 'This Week' : 'This Range'})
                  </CardTitle>
                </CardHeader>
                <ReusableTable
                  columns={columns}
                  data={employees}
                  loading={loading}
                  title="No performance data found for the selected filters."
                  rowKey="id"
                  showGear={false}
                  borderless={true}
                  showPageSizeSelector={false}
                />
              </div>
            </Card>

            {/* Right table (30%) - Top Performers */}
            <Card className="lg:col-span-3 border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="text-left flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 flex flex-row items-center gap-2 space-y-0">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg shrink-0">
                    <Trophy className="h-4 w-4 text-blue-650 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Top Performers ({selectedWeek ? 'This Week' : period === 'This Month' ? 'This Week' : 'This Range'})
                  </CardTitle>
                </CardHeader>
                
                <ReusableTable
                  columns={topColumns}
                  data={topPerformers}
                  loading={loading}
                  title="No data found"
                  rowKey="id"
                  showGear={false}
                  borderless={true}
                  showPageSizeSelector={false}
                />
              </div>
            </Card>

          </div>
        </>
      )}

    </div>
  );
}

export default function EmployeePerformancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    }>
      <EmployeeCallPerformanceInner />
    </Suspense>
  );
}
