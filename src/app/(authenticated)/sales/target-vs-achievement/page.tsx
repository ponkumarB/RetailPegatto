'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useSalesTargetStore } from '@/store/useSalesTargetStore';
import { fetchNewITAchievementRegionBranch } from '@/service/api/SalesAchievement/api';
import { fetchFromApi } from '@/service/apiClient';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Target,
  TrendingUp,
  Award,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

export default function SalesTargetVsAchievementPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const {
    canViewSalesTargetVsAchievementOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewSalesTargetVsAchievementOverview) {
      toast.error('You do not have permission to view Target vs Achievement.');
      router.push('/');
    }
  }, [canViewSalesTargetVsAchievementOverview, isLoaded, router]);

  const { 
    salesTargetsAdditional, 
    loadSalesTargetsAdditional, 
    usersList, 
    loadUsersList 
  } = useSalesTargetStore();

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<'This Year' | 'Last Year' | 'This Quarter' | 'Last Quarter' | 'This Month' | 'Last Month' | 'Custom'>('This Year');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-12-31');
  const [selectedTarget, setSelectedTarget] = useState('All');
  const [salesManager, setSalesManager] = useState('All');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Load target list and users on mount
  useEffect(() => {
    loadSalesTargetsAdditional();
    loadUsersList();
  }, [loadSalesTargetsAdditional, loadUsersList]);

  // Compute start/end dates from preset
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
        return [customStartDate, customEndDate];
    }
  };

  const activeDateRange = useMemo(() => {
    return getPresetDateRange(periodPreset);
  }, [periodPreset, customStartDate, customEndDate]);

  // Fetch Achievement Region/Branch data based on filters
  useEffect(() => {
    const orgId = Number(localStorage.getItem('Organization_Id') || '1');
    const payload: any = {
      organization_id: orgId,
      start_date: activeDateRange[0],
      end_date: activeDateRange[1]
    };
    if (selectedTarget && selectedTarget !== 'All') {
      payload.target_id = Number(selectedTarget);
    }
    if (salesManager && salesManager !== 'All') {
      payload.sales_manager_id = Number(salesManager);
    }

    setApiLoading(true);
    fetchNewITAchievementRegionBranch(payload)
      .then(res => {
        if (res && res.status) {
          setDashboardData(res.data);
        } else {
          setDashboardData(null);
        }
      })
      .catch(err => {
        console.error('Failed to load region/branch data:', err);
        setDashboardData(null);
      })
      .finally(() => {
        setApiLoading(false);
      });
  }, [activeDateRange, selectedTarget, salesManager]);

  // Dynamic KPI metrics
  const totalTargetVal = dashboardData?.total_target ?? 0;
  const totalAchievementVal = dashboardData?.total_achievement ?? 0;
  const achievementPercent = dashboardData?.achievement_percentage ?? 0;

  // Monthly trends line chart data
  const overTimeData = useMemo(() => {
    const months = dashboardData?.monthwise || [];
    return months.map((m: any) => ({
      name: `${m.month_name} ${m.month_key.split('-')[0]}`,
      Target: m.target ?? 0,
      Achievement: m.achievement ?? 0
    }));
  }, [dashboardData]);

  // Salespersons achievement list mapping
  const filteredAchievements = useMemo(() => {
    const list = dashboardData?.salespersons || [];
    return list.map((item: any, idx: number) => {
      const user = usersList.find(u => u.id === item.salesperson_id);
      const name = user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username) : `Sales Rep #${item.salesperson_id}`;
      const percent = item.percentage ?? 0;
      const status = percent >= 100 ? 'Achieved' : (percent >= 85 ? 'In Progress' : 'Behind Target');
      return {
        id: `${item.salesperson_id}-${idx}`,
        salesPerson: name,
        target: item.target ?? 0,
        achievement: item.achievement ?? 0,
        achievementPercent: percent,
        status
      };
    });
  }, [dashboardData, usersList]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Achieved':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 py-0.5 px-2 font-bold">Achieved</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 py-0.5 px-2 font-bold">In Progress</Badge>;
      case 'Behind Target':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 py-0.5 px-2 font-bold">Behind Target</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 dark:bg-slate-900 border border-slate-200 py-0.5 px-2">{status}</Badge>;
    }
  };

  if (isLoaded && !canViewSalesTargetVsAchievementOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left" style={{ '--theme-primary': primaryColor } as React.CSSProperties}>

      {/* Breadcrumbs */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/')}>Targets</span>
        <span> / </span>
        <span className="font-semibold text-slate-700 dark:text-slate-355">Target vs Achievement</span>
      </div>

      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sales Target vs Achievement</h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1 font-medium">
            Compare sales targets with actual achievements across teams, regions, and time periods.
          </p>
        </div>
      </div>

      {/* Dropdown Filters Panel */}
      <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 ${periodPreset === 'Custom' ? 'sm:grid-cols-2 md:grid-cols-5' : 'sm:grid-cols-3'} gap-3 text-xs font-semibold text-slate-550`}>
            {/* Time Period */}
            <div className="flex flex-col gap-1 text-left">
              <label>Time Period</label>
              <Select value={periodPreset} onValueChange={(val) => val && setPeriodPreset(val as any)}>
                <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg">
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

            {/* Custom Date Ranges */}
            {periodPreset === 'Custom' && (
              <>
                <div className="flex flex-col gap-1 text-left">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
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

            {/* Target Select */}
            <div className="flex flex-col gap-1 text-left">
              <label>Target</label>
              <Select value={selectedTarget} onValueChange={(val) => val && setSelectedTarget(val)}>
                <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg">
                  <SelectValue placeholder="All Targets" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 max-h-48 overflow-y-auto">
                  <SelectItem value="All">All Targets</SelectItem>
                  {salesTargetsAdditional.map((tgt: any) => (
                    <SelectItem key={tgt.id} value={String(tgt.id)}>{tgt.Target_Name || `Target #${tgt.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Manager Select */}
            <div className="flex flex-col gap-1 text-left">
              <label>Sales Manager</label>
              <Select value={salesManager} onValueChange={(val) => val && setSalesManager(val)}>
                <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg">
                  <SelectValue placeholder="All Managers" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 max-h-48 overflow-y-auto">
                  <SelectItem value="All">All Managers</SelectItem>
                  {usersList.map((u: any) => {
                    const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
                    return <SelectItem key={u.id} value={String(u.id)}>{name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Target */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Target</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {apiLoading ? '...' : formatCurrency(totalTargetVal)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">100% of goal</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Achievement */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Achievement</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {apiLoading ? '...' : formatCurrency(totalAchievementVal)}
              </div>
              <p className="text-[10px] text-emerald-650 dark:text-emerald-400 mt-0.5 font-bold">
                {apiLoading ? '...' : `${achievementPercent}% of target`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievement % */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Achievement %</span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {apiLoading ? '...' : `${achievementPercent}%`}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">vs 100% target</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts */}
      <div className="w-full">
        {/* Line/Area Chart */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Target vs Achievement Over Time</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400 font-semibold">Monthly targets mapped against actual sales achievements</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {apiLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading trend...</div>
            ) : overTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="105%">
                <AreaChart data={overTimeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAchievement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 100000}L`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Target" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTarget)" />
                  <Area type="monotone" dataKey="Achievement" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAchievement)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No monthly data matches filters.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Grid */}
      <div className="w-full">
        {/* Sales Persons Table */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs flex flex-col justify-between overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Achievement by Sales Person</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400 font-semibold">Performances of active sales team members relative to set targets</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <Table className="min-w-[650px]">
                <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                  <TableRow>
                    <TableHead className="py-2.5 font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500 pl-4">Sales Person</TableHead>
                    <TableHead className="py-2.5 font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500 text-right">Target (₹)</TableHead>
                    <TableHead className="py-2.5 font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500 text-right">Achievement (₹)</TableHead>
                    <TableHead className="py-2.5 font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500 text-center">Achievement %</TableHead>
                    <TableHead className="py-2.5 font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500 pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">Loading salespersons statistics...</TableCell>
                    </TableRow>
                  ) : filteredAchievements.length > 0 ? (
                    filteredAchievements.map((ach) => (
                      <TableRow key={ach.id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/20">
                        <TableCell className="py-3 pl-4 font-semibold text-slate-850 dark:text-slate-200">
                          {ach.salesPerson}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-medium text-xs">
                          {formatCurrency(ach.target)}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-xs">
                          {formatCurrency(ach.achievement)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-bold text-xs font-mono w-10 text-right">{ach.achievementPercent}%</span>
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ach.achievementPercent)}%`,
                                  backgroundColor:
                                    ach.status === 'Achieved' ? '#10b981' :
                                      ach.status === 'In Progress' ? '#3b82f6' : '#ef4444'
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 pr-4">
                          {getStatusBadge(ach.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">No salesperson data found matching filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-left">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/sales/achievement')}
                className="text-xs font-bold gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                View All Sales Persons <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Progress Footer Bar */}
      <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
        <CardContent className="p-4 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row items-center gap-6 justify-between text-xs font-semibold">
          <div className="text-left space-y-1">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Summary</span>
            <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              Overall achievement of <span className="text-emerald-600 font-bold">{apiLoading ? '...' : formatCurrency(totalAchievementVal)} ({apiLoading ? '...' : `${achievementPercent}%`})</span> against the target of <span className="text-blue-600 font-bold">{apiLoading ? '...' : formatCurrency(totalTargetVal)}</span>
            </p>
          </div>

          <div className="flex-1 max-w-lg w-full bg-slate-200/60 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, achievementPercent)}%`,
                backgroundColor: '#10b981'
              }}
            />
          </div>

          <div className="flex gap-4 font-mono">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400">Achievement</span>
              <div className="text-sm font-bold text-emerald-600">
                {apiLoading ? '...' : `${formatCurrency(totalAchievementVal)} (${achievementPercent}%)`}
              </div>
            </div>
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400">Target</span>
              <div className="text-sm font-bold text-blue-600">
                {apiLoading ? '...' : formatCurrency(totalTargetVal)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
