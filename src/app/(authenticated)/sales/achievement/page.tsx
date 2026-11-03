'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useSalesTargetStore } from '@/store/useSalesTargetStore';
import { FilterPopover } from '@/components/ui/FilterPopover';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Plus,
  Target,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { useEffect } from 'react';

export default function SalesAchievementPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const {
    canCreateSalesTarget,
    canExportSalesTarget,
    canViewSalesTargetOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewSalesTargetOverview) {
      toast.error('You do not have permission to view Sales Targets.');
      router.push('/');
    }
  }, [canViewSalesTargetOverview, isLoaded, router]);

  const {
    dashboardData,
    usersList,
    loadDashboardData,
    loadUsersList
  } = useSalesTargetStore();

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<'This Year' | 'Last Year' | 'This Quarter' | 'Last Quarter' | 'This Month' | 'Last Month' | 'Custom'>('This Year');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-06-29');
  const [salesManager, setSalesManager] = useState('All');
  const [statusTab, setStatusTab] = useState('All');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getPresetDateRange = (preset: string): [string, string] => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    switch (preset) {
      case 'This Year': {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Year': {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Quarter': {
        const q = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), q * 3, 1);
        const end = new Date(now.getFullYear(), (q + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Quarter': {
        const q = Math.floor(now.getMonth() / 3) - 1;
        const start = new Date(now.getFullYear(), q * 3, 1);
        const end = new Date(now.getFullYear(), (q + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return [formatDate(start), formatDate(end)];
      }
      default:
        return ['2026-01-01', '2026-06-29'];
    }
  };

  const activeDateRange = useMemo<[string, string]>(() => {
    if (periodPreset === 'Custom') {
      return [customStartDate, customEndDate];
    }
    return getPresetDateRange(periodPreset);
  }, [periodPreset, customStartDate, customEndDate]);

  // Load dashboard data on mount / filter changes
  React.useEffect(() => {
    loadDashboardData(activeDateRange);
    loadUsersList();
  }, [activeDateRange, loadDashboardData, loadUsersList]);

  // Destructure dashboard metrics safely
  const cards = dashboardData?.cards ?? {};
  const totalAchievementVal = Number(cards?.total_achievement ?? 0);
  const achievementPercent = Number(cards?.target_realization_percentage ?? 0);
  const totalTargetVal = Number(cards?.target_realization_amount ?? 0);
  const achievedTargetsCount = Number(cards?.achieved_targets_count ?? 0);
  const achievedTargetsOutOf = Number(cards?.achieved_targets_out_of ?? 0);
  const inProgressCount = Number(cards?.in_progress_count ?? 0);
  const behindTargetCount = Number(cards?.behind_target_count ?? 0);

  const activePeriod = dashboardData?.active_period ?? '';
  const achievementBySalesPerson = dashboardData?.achievement_by_sales_person ?? [];
  const achievementByRegion = dashboardData?.achievement_by_region ?? [];
  const achievementTrend = dashboardData?.achievement_trend ?? [];
  const tableData = dashboardData?.table_data ?? [];

  // Format currency helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filtered Achievements Table by sales manager and status tab
  const filteredAchievements = useMemo(() => {
    return tableData.filter((item: any) => {
      const matchesTab = statusTab === 'All' || item.status === statusTab;

      let matchesManager = true;
      if (salesManager !== 'All') {
        const managerName = item.sales_manager || '';
        const chosenUser = usersList.find(u => String(u.id) === salesManager);
        const chosenName = chosenUser ? (chosenUser.first_name ? `${chosenUser.first_name} ${chosenUser.last_name || ''}` : chosenUser.username) : '';
        matchesManager = managerName.toLowerCase() === chosenName.toLowerCase();
      }

      return matchesTab && matchesManager;
    });
  }, [tableData, salesManager, statusTab, usersList]);

  // Horizontal Bar Chart Data (Achievement by Sales Person)
  const salesPersonData = useMemo(() => {
    return achievementBySalesPerson.map((item: any) => ({
      name: item.name,
      Achievement: Number(item.achievement)
    })).reverse();
  }, [achievementBySalesPerson]);

  // Donut Chart Data (Region breakdown)
  const regionBreakdown = useMemo(() => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
    return achievementByRegion.map((item: any, idx: number) => ({
      name: item.name,
      value: Number(item.value),
      color: colors[idx % colors.length]
    }));
  }, [achievementByRegion]);

  // Achievement Trend line data
  const trendData = useMemo(() => {
    return achievementTrend.map((item: any) => ({
      name: item.month,
      Achievement: Number(item.value)
    }));
  }, [achievementTrend]);



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Achieved':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 py-0.5 px-2.5 font-bold">Achieved</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 py-0.5 px-2.5 font-bold">In Progress</Badge>;
      case 'Behind Target':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 py-0.5 px-2.5 font-bold">Behind Target</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border border-slate-200 py-0.5 px-2.5">{status}</Badge>;
    }
  };

  const resetFilters = () => {
    setPeriodPreset('This Year');
    setSalesManager('All');
    setStatusTab('All');
    toast.success('Filters reset to default.');
  };

  if (isLoaded && !canViewSalesTargetOverview) {
    return null;
  }

  // achievements with synthetic ids for ReusableTable
  const achievementsWithIds = useMemo(() => {
    return filteredAchievements.map((ach: any, idx: number) => ({
      ...ach,
      id: ach.id || `${ach.sales_person}-${idx}`
    }));
  }, [filteredAchievements]);

  // ReusableTable Columns config
  const achievementColumns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'sales_person',
      header: 'Sales Person',
      sortable: true,
      className: 'py-3 font-bold text-slate-850 dark:text-slate-200'
    },
    {
      key: 'sales_manager',
      header: 'Sales Manager',
      sortable: true,
      className: 'py-3 text-slate-605 dark:text-slate-400 font-semibold'
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      className: 'py-3 text-slate-650 dark:text-slate-400 font-semibold'
    },
    {
      key: 'branch',
      header: 'Branch',
      sortable: true,
      className: 'py-3 text-slate-655 dark:text-slate-400 font-semibold'
    },
    {
      key: 'target',
      header: 'Target (₹)',
      sortable: true,
      className: 'py-3 text-right font-mono font-bold text-xs',
      render: (row) => formatCurrency(row.target)
    },
    {
      key: 'achievement',
      header: 'Achievement (₹)',
      sortable: true,
      className: 'py-3 text-right font-mono font-bold text-xs',
      render: (row) => formatCurrency(row.achievement)
    },
    {
      key: 'achievement_percentage',
      header: 'Achievement %',
      sortable: true,
      className: 'py-3 text-center',
      render: (row) => (
        <div className="flex flex-col items-center justify-center gap-1.5 max-w-[120px] mx-auto">
          <span className="font-bold font-mono text-[11px]">{Number(row.achievement_percentage).toFixed(1)}%</span>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Number(row.achievement_percentage))}%`,
                backgroundColor:
                  row.status === 'Achieved' ? '#10b981' :
                    row.status === 'In Progress' ? '#3b82f6' : '#ef4444'
              }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'py-3',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'last_updated',
      header: 'Last Updated',
      sortable: true,
      className: 'py-3 text-slate-500 font-semibold font-mono text-[10px]'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      className: 'py-3 text-center pr-4',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-550 hover:text-slate-800 rounded-lg cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <DropdownMenuItem className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-805" onClick={() => toast.success(`Viewing record of ${row.sales_person}`)}>
              View Detailed Performance
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-805" onClick={() => toast.info(`Prompted update request to ${row.sales_person}`)}>
              Request Update
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], [primaryColor]);

  return (
    <div className="space-y-6 text-left" style={{ '--theme-primary': primaryColor } as React.CSSProperties}>

      {/* Breadcrumbs */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/sales/target-vs-achievement')}>Targets</span>
        <span> / </span>
        <span className="font-semibold text-slate-700 dark:text-slate-355">Sales Target</span>
      </div>

      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sales Target</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400 font-medium">
            Track and analyze sales performance against targets. {activePeriod && `(Period: ${activePeriod})`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canExportSalesTarget && (
            <Button variant="outline" onClick={() => toast.info('Exporting...')} className="border-slate-200 dark:border-slate-800 font-bold rounded-xl gap-2 h-9 text-xs cursor-pointer">
              <Download className="h-4 w-4" /> Export
            </Button>
          )}
          {canCreateSalesTarget && (
            <Button
              onClick={() => router.push('/sales/target')}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-bold rounded-xl gap-2 h-9 text-xs cursor-pointer hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Target
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Achievement</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">{formatCurrency(totalAchievementVal)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">in INR (₹)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Target Realization</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">{achievementPercent}%</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">of {formatCurrency(totalTargetVal)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-purple-50 dark:bg-purple-955/30 rounded-xl">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Achieved Targets</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">{achievedTargetsCount}</div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Out of {achievedTargetsOutOf}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-105 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-amber-50 dark:bg-amber-955/30 rounded-xl">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">In Progress</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">{inProgressCount}</div>
              <p className="text-[10px] text-slate-550 mt-0.5 font-bold">Sales Persons</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-rose-50 dark:bg-rose-955/30 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Behind Target</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">{behindTargetCount}</div>
              <p className="text-[10px] text-rose-500 font-bold mt-0.5">Sales Persons</p>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Dropdown Filters Panel */}
      <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-550">
            {/* Period Picker */}
            <div className="flex flex-col gap-1 text-left w-48">
              <label>Select Period</label>
              <Select value={periodPreset} onValueChange={(val) => val && setPeriodPreset(val as any)}>
                <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200">
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="Last Year">Last Year</SelectItem>
                  <SelectItem value="This Quarter">This Quarter</SelectItem>
                  <SelectItem value="Last Quarter">Last Quarter</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Last Month">Last Month</SelectItem>
                  <SelectItem value="Custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Dates */}
            {periodPreset === 'Custom' && (
              <>
                <div className="flex flex-col gap-1 text-left w-36">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left w-36">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2"
                  />
                </div>
              </>
            )}

            {/* Sales Manager */}
            <div className="flex flex-col gap-1 text-left w-48">
              <label>Sales Manager</label>
              <Select value={salesManager} onValueChange={(val) => val && setSalesManager(val)}>
                <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 max-h-48 overflow-y-auto">
                  <SelectItem value="All">All Managers</SelectItem>
                  {usersList.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-[11px] font-bold border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-805"
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Visual Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal bar chart */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Achievement by Sales Person</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400 font-semibold">Horizontal realization breakdown of top sales executives</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {salesPersonData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No data available for this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesPersonData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 100000}L`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '']} />
                  <Bar dataKey="Achievement" fill={primaryColor} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut chart for regions */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Achievement by Region</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400 font-semibold">Distribution of corporate revenue realization by region</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 pt-0">
            <div className="h-[150px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {regionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-extrabold text-slate-850 dark:text-white">{formatCurrency(totalAchievementVal)}</span>
                <span className="text-[8px] text-slate-450 font-bold uppercase mt-0.5">Achievement</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-slate-105 dark:border-slate-800 pt-2.5">
              {regionBreakdown.map(item => (
                <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-650 dark:text-slate-400 truncate">
                    {item.name}: {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line chart for achievement trend */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Achievement Trend</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400 font-semibold">Chronological trend of actual figures over active months</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 100000}L`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '']} />
                <Line type="monotone" dataKey="Achievement" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Listing */}
      <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">

        {/* Custom Tab filtering */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4">
          {[
            { id: 'All', label: 'All Achievements' },
            { id: 'Achieved', label: 'Achieved' },
            { id: 'In Progress', label: 'In Progress' },
            { id: 'Behind Target', label: 'Behind Target' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusTab(tab.id);
                setSelectedIds([]);
              }}
              className="py-3 px-4 text-xs font-bold transition-all relative border-b-2 cursor-pointer focus:outline-none"
              style={{
                color: statusTab === tab.id ? primaryColor : undefined,
                borderColor: statusTab === tab.id ? primaryColor : 'transparent',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="p-0">
          <ReusableTable
            columns={achievementColumns}
            data={achievementsWithIds}
            enableSelection={false}
            selectedRowIds={selectedIds}
            onSelectionChange={(selectedRows) => {
              setSelectedIds(selectedRows.map(r => r.id));
            }}
            rowIdKey="id"
            showGear={false}
            title="No achievements found matching filtered criteria."
            borderless={true}
            initialPageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}