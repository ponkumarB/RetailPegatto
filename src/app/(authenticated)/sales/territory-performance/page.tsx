'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTerritoryStore } from '@/store/useTerritoryStore';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  Download,
  Filter,
  BarChart4,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Layers,
  Award,
  AlertTriangle,
  Lightbulb,
  FileText,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import { toast } from 'sonner';

export default function TerritoryPerformancePage() {
  const router = useRouter();
  const {
    quotas,
    loadQuotas,
    loadTerritories,
    territoryDashboardView,
    territoryPerformanceDashboard,
    loadTerritoryDashboardView,
    loadTerritoryPerformanceDashboard,
    isLoading
  } = useTerritoryStore();

  const {
    canViewTerritoryPerformanceOverview,
    canExportTerritoryPerformance,
    isLoaded: permissionsLoaded,
  } = usePermission();

  useEffect(() => {
    if (permissionsLoaded && !canViewTerritoryPerformanceOverview) {
      router.push('/sales/territory');
    }
  }, [permissionsLoaded, canViewTerritoryPerformanceOverview, router]);

  // Filter Toolbar States
  const [periodPreset, setPeriodPreset] = useState<string>('This Year');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-06-29');

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to get [start, end] date range as strings
  const getPresetDateRange = (preset: string): [string, string] => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    switch (preset) {
      case 'This Year': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Year': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const start = new Date(today.getFullYear(), quarter * 3, 1);
        const end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Quarter': {
        let quarter = Math.floor(today.getMonth() / 3) - 1;
        let year = today.getFullYear();
        if (quarter < 0) {
          quarter = 3;
          year -= 1;
        }
        const start = new Date(year, quarter * 3, 1);
        const end = new Date(year, (quarter + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return [formatDate(start), formatDate(end)];
      }
      default:
        return [customStartDate, customEndDate];
    }
  };

  const activeDateRange = useMemo<[string, string]>(() => {
    if (periodPreset === 'Custom') {
      return [customStartDate, customEndDate];
    }
    return getPresetDateRange(periodPreset);
  }, [periodPreset, customStartDate, customEndDate]);

  React.useEffect(() => {
    loadTerritories();
    loadQuotas();
  }, [loadTerritories, loadQuotas]);

  React.useEffect(() => {
    loadTerritoryDashboardView(activeDateRange);
    loadTerritoryPerformanceDashboard(activeDateRange);
  }, [activeDateRange, loadTerritoryDashboardView, loadTerritoryPerformanceDashboard]);

  // Overall calculations mapped from territoryDashboardView
  const summaryCards = territoryDashboardView?.summary_cards ?? {};

  const totalRevenue = Number(summaryCards?.total_revenue ?? 0);
  const revenueTarget = Number(summaryCards?.revenue_target ?? 0);
  const revenueAchievementPct = Number(summaryCards?.revenue_achievement_pct ?? 0);
  const leadsGenerated = Number(summaryCards?.leads_generated ?? 0);
  const leadsTarget = Number(summaryCards?.leads_target ?? 0);
  const leadsAchievementPct = Number(summaryCards?.leads_achievement_pct ?? 0);
  const opportunities = Number(summaryCards?.opportunities ?? 0);
  const opportunitiesTarget = Number(summaryCards?.opportunities_target ?? 0);
  const opportunitiesAchievementPct = Number(summaryCards?.opportunities_achievement_pct ?? 0);
  const conversionRate = Number(summaryCards?.conversion_rate ?? 0);
  const conversionTarget = Number(summaryCards?.conversion_target ?? 20);
  const winRate = Number(summaryCards?.win_rate ?? 0);
  const winRateTarget = Number(summaryCards?.win_rate_target ?? 25);
  const avgDealSize = Number(summaryCards?.avg_deal_size ?? 0);

  // Compile detailed territory metrics
  const performanceData = territoryPerformanceDashboard?.territory_performance_summary ?? [];

  // Chart data 1: Revenue by Territory (Bar Chart)
  const barChartData = useMemo(() => {
    const list = territoryDashboardView?.revenue_by_territory || [];
    return list.map((item: any) => ({
      name: item.territory_name,
      'Achieved Revenue': Number(item.revenue_achieved),
      'Target Revenue': Number(item.revenue_target)
    }));
  }, [territoryDashboardView]);

  // Chart data 2: Achievement % by Territory (Donut Chart)
  const donutChartData = useMemo(() => {
    const list = territoryDashboardView?.achievement_by_territory || [];
    return list.map((item: any) => ({
      name: item.territory_name,
      value: Number(item.achievement_percentage)
    }));
  }, [territoryDashboardView]);

  // Donut colors
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  // Sorting for Top / Bottom Performers
  const topPerformers = territoryPerformanceDashboard?.top_performing_territories ?? [];
  const bottomPerformers = territoryPerformanceDashboard?.lowest_performing_territories ?? [];

  // Dynamic Insights Bullet Points
  const insights = territoryPerformanceDashboard?.insights ?? [];

  // Pipeline funnel values
  const funnelData = useMemo(() => {
    const list = territoryDashboardView?.pipeline_by_territory || [];
    return list.map((item: any) => ({
      name: item.territory_name,
      value: Number(item.pipeline_value),
      opportunities: Number(item.opportunities_count)
    }));
  }, [territoryDashboardView]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Territory Performance</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <BarChart4 className="h-6 w-6 text-blue-650" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territory Performance Dashboard</h1>
              <p className="text-xs text-slate-450 mt-0.5">Overview of territory performance and achievement.</p>
            </div>
          </div>
        </div>

        {/* Filter and Export controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <Select value={periodPreset} onValueChange={(val) => setPeriodPreset(val || 'This Year')}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-40 font-semibold">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border">
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Last Year">Last Year</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="Last Quarter">Last Quarter</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {periodPreset === 'Custom' && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-32"
                />
                <span className="text-[10px] text-slate-400 font-bold">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-32"
                />
              </div>
            )}
          </div>

          {canExportTerritoryPerformance && (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border border-slate-205 bg-white dark:bg-slate-900 text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              } />
              <DropdownMenuContent align="end" className="dark:bg-slate-900 border w-36">
                <DropdownMenuItem onClick={() => toast.success('Exporting CSV...')} className="text-xs font-semibold gap-2 cursor-pointer">
                  <FileText className="h-3.5 w-3.5" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('Exporting PDF...')} className="text-xs font-semibold gap-2 cursor-pointer">
                  <FileText className="h-3.5 w-3.5" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* KPI summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-semibold">
        {/* Total Revenue */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Total Revenue</span>
              <span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-sm">₹</span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                <span className="font-semibold text-slate-750 dark:text-slate-200">{revenueAchievementPct.toFixed(2)}%</span> of {formatCurrency(revenueTarget)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leads Generated */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Leads Generated</span>
              <span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-955/30 text-blue-600 flex items-center justify-center"><Users className="h-4 w-4" /></span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{leadsGenerated.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                <span className="font-semibold text-slate-750 dark:text-slate-200">{leadsAchievementPct.toFixed(2)}%</span> of {leadsTarget.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Opportunities</span>
              <span className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-955/30 text-amber-600 flex items-center justify-center"><Layers className="h-4 w-4" /></span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{opportunities.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                <span className="font-semibold text-slate-750 dark:text-slate-200">{opportunitiesAchievementPct.toFixed(2)}%</span> of {opportunitiesTarget.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Conversion Rate</span>
              <span className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-955/30 text-purple-600 flex items-center justify-center font-bold text-sm">%</span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{conversionRate.toFixed(2)}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                vs Target {conversionTarget.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Win Rate</span>
              <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-955/30 text-indigo-600 flex items-center justify-center"><Award className="h-4 w-4" /></span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{winRate.toFixed(2)}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                vs Target {winRateTarget.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Deal Size */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Avg. Deal Size</span>
              <span className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-955/30 text-orange-600 flex items-center justify-center font-bold text-sm">₹</span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(avgDealSize)}</p>
              <p className="text-[10px] text-slate-450 mt-0.5 font-normal">
                calculated value
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue by Territory Bar Chart */}
        <Card className="lg:col-span-5 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Revenue by Territory</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-4 text-[10px] font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `${(v / 10000000).toFixed(1)}Cr`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '']} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Achieved Revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Target Revenue" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Achievement % by Territory Donut Chart */}
        <Card className="lg:col-span-4 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Achievement % by Territory</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Achievement']} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '9px', lineHeight: '20px' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner absolute text */}
            <div className="absolute top-[52%] left-[34.5%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Overall</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">{revenueAchievementPct.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline by Territory Funnel (Custom Responsive SVG Funnel) */}
        <Card className="lg:col-span-3 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-850 dark:text-white">Pipeline by Territory</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-between h-[250px] text-[10px] font-semibold">
            {/* Funnel SVG */}
            <div className="flex-1 flex items-center justify-center pr-2">
              <svg viewBox="0 0 200 160" width="100%" height="100%" className="max-w-[170px]">
                {/* Segment 1 */}
                <polygon points="10,10 190,10 170,40 30,40" fill="#2563eb" opacity={0.95} />
                <text x="100" y="28" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {funnelData[0] ? formatCurrency(funnelData[0].value) : formatCurrency(0)}
                </text>

                {/* Segment 2 */}
                <polygon points="33,45 167,45 147,75 53,75" fill="#10b981" opacity={0.95} />
                <text x="100" y="63" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {funnelData[1] ? formatCurrency(funnelData[1].value) : formatCurrency(0)}
                </text>

                {/* Segment 3 */}
                <polygon points="56,80 144,80 124,110 76,110" fill="#f59e0b" opacity={0.95} />
                <text x="100" y="98" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {funnelData[2] ? formatCurrency(funnelData[2].value) : formatCurrency(0)}
                </text>

                {/* Segment 4 */}
                <polygon points="79,115 121,115 108,145 92,145" fill="#8b5cf6" opacity={0.95} />
                <text x="100" y="133" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {funnelData[3] ? formatCurrency(funnelData[3].value) : formatCurrency(0)}
                </text>
              </svg>
            </div>

            {/* Funnel Legends */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] border-t dark:border-slate-800 pt-2 shrink-0">
              {funnelData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-500 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territory Performance Summary Table */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
        <div className="p-4 border-b dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Territory Performance Summary</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow className="border-b dark:border-slate-800">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 pl-4" rowSpan={2}>Territory</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Revenue (₹)</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Leads</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Opportunities</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={2}>Metrics (%)</TableHead>
              </TableRow>
              <TableRow className="border-b dark:border-slate-800">
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5 border-r dark:border-slate-850">Target</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Target</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Target</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">Conv. Rate</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((item: any, idx) => (
                <TableRow key={item.territory_id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 text-xs">
                  <TableCell className="py-2.5 pl-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.territory_name}
                    </div>
                  </TableCell>

                  {/* Revenue */}
                  <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500 border-r dark:border-slate-850">{formatCurrency(item.revenue_target)}</TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.revenue_achieved)}</TableCell>
                  <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{Number(item.revenue_percentage).toFixed(2)}%</TableCell>

                  {/* Leads */}
                  <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500">{Number(item.lead_target || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{Number(item.lead_achieved || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{Number(item.lead_percentage || 0).toFixed(2)}%</TableCell>

                  {/* Opportunities */}
                  <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500">{Number(item.opportunity_target || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{Number(item.opportunity_achieved || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{Number(item.opportunity_percentage || 0).toFixed(2)}%</TableCell>

                  {/* Conversion / Win Rates */}
                  <TableCell className="py-2.5 text-center font-mono font-bold text-slate-750 dark:text-slate-200 border-r dark:border-slate-850">{Number(item.conversion_rate || 0).toFixed(2)}%</TableCell>
                  <TableCell className="py-2.5 text-center font-mono font-bold text-slate-750 dark:text-slate-200">{Number(item.win_rate || 0).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Bottom Insights grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Performing Territories */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Top Performing Territories</h3>
          </div>
          <div className="space-y-4 text-xs font-semibold">
            {topPerformers.map((item: any, idx) => (
              <div key={item.territory_id || idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{item.territory_name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-black">{Number(item.revenue_percentage || 0).toFixed(2)}%</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Number(item.revenue_percentage || 0))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Lowest Performing Territories */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Lowest Performing Territories</h3>
          </div>
          <div className="space-y-4 text-xs font-semibold">
            {bottomPerformers.map((item: any, idx) => (
              <div key={item.territory_id || idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{item.territory_name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-black">{Number(item.revenue_percentage || 0).toFixed(2)}%</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Number(item.revenue_percentage || 0))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights Bulletin */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Insights</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold list-disc pl-4 leading-relaxed text-left">
            {insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  );
}
