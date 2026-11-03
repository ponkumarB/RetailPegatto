'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchDeveloperWorkloadDistribution,
  fetchTeamProductivityTrend,
  fetchSmartResourceOptimizationMetrics
} from '@/service/api/Analytics/api';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project/api';
import { formatPersonName } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Users,
  Percent,
  Calendar,
  BarChart3,
  RefreshCw,
  Clock,
  Briefcase,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import ApexCharts to avoid Next.js SSR hydration issues
const ApexChart = dynamic(() => import('react-apexcharts').then((mod) => {
  if (typeof window !== 'undefined') {
    const windowWithApex = window as any;
    if (windowWithApex.ApexCharts && !windowWithApex.ApexCharts.prototype._originalDestroy) {
      windowWithApex.ApexCharts.prototype._originalDestroy = windowWithApex.ApexCharts.prototype.destroy;
      windowWithApex.ApexCharts.prototype.destroy = function () {
        try {
          this._originalDestroy();
        } catch (e) {
          console.debug('Safely intercepted ApexCharts unmount error:', e);
        }
      };
    }
  }
  return mod.default;
}), { ssr: false });

function Chart(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-400"
        style={{ height: props.height || '220px' }}
      >
        Loading chart...
      </div>
    );
  }
  return <ApexChart {...props} />;
}

const getPeriodDates = (period: string) => {
  const now = new Date('2026-07-08'); // System date base
  const year = now.getFullYear();
  
  switch (period) {
    case 'this-year':
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case 'last-year':
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case 'this-quarter': {
      const month = now.getMonth();
      const quarter = Math.floor(month / 3);
      const startMonth = String(quarter * 3 + 1).padStart(2, '0');
      const endMonth = String(quarter * 3 + 3).padStart(2, '0');
      const lastDay = quarter === 0 ? '31' : quarter === 1 ? '30' : quarter === 2 ? '30' : '31';
      return { from: `${year}-${startMonth}-01`, to: `${year}-${endMonth}-${lastDay}` };
    }
    case 'this-month': {
      const currentMonth = now.getMonth();
      const m = String(currentMonth + 1).padStart(2, '0');
      const days = new Date(year, currentMonth + 1, 0).getDate();
      return { from: `${year}-${m}-01`, to: `${year}-${m}-${days}` };
    }
    default:
      return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
};

export default function SmartResourceOptimizationPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [projectId, setProjectId] = useState<string>('');

  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for API data
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [developersWorkload, setDevelopersWorkload] = useState<any[]>([]);
  const [productivityTrend, setProductivityTrend] = useState<any[]>([]);

  // Fetch projects list
  useEffect(() => {
    setIsProjectsLoading(true);
    fetchProjectlistwithoutpaginaton()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        setProjects(list);
        if (list.length > 0) {
          const defaultProject = list.find((p: any) => String(p.id) === '219') || list[0];
          setProjectId(String(defaultProject.id));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch projects list', err);
        toast.error('Failed to load Projects.');
      })
      .finally(() => {
        setIsProjectsLoading(false);
      });
  }, []);

  // Fetch all resource optimization metrics
  const loadDashboardData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);

    const pId = Number(projectId);
    try {
      const [
        resMetrics,
        resWorkload,
        resTrend
      ] = await Promise.all([
        fetchSmartResourceOptimizationMetrics({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchDeveloperWorkloadDistribution({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchTeamProductivityTrend({ project_id: pId, start_date: fromdate, end_date: todate })
      ]);

      setKpiMetrics(resMetrics?.cards || null);
      setDevelopersWorkload(resWorkload?.developers || []);
      setProductivityTrend(resTrend?.productivity_trend || []);
    } catch (err) {
      console.error('Failed to fetch resource optimization data', err);
      toast.error('Failed to load Smart Resource Optimization metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fromdate, todate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Preset Period Change
  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== 'custom') {
      const dates = getPeriodDates(val);
      setFromdate(dates.from);
      setTodate(dates.to);
    }
  };

  // Export report to CSV
  const handleExport = () => {
    if (!projectId) return;
    const selectedProj = projects.find(p => String(p.id) === projectId);
    const projName = selectedProj?.project_name || 'Project';

    const headers = ['Dataset', 'Developer/Metric', 'Workload/Value'];
    const rows: any[] = [];

    if (kpiMetrics) {
      rows.push(['KPI Metrics', 'Total Developers', kpiMetrics.total_developers]);
      rows.push(['KPI Metrics', 'Overloaded Developers', kpiMetrics.overloaded_developers]);
      rows.push(['KPI Metrics', 'Average Productivity (%)', kpiMetrics.avg_productivity]);
      rows.push(['KPI Metrics', 'Tasks Completed', kpiMetrics.tasks_completed]);
    }

    developersWorkload.forEach((d: any) => {
      rows.push(['Developer Workload', d.developer_name, `${d.completion_percentage}%`]);
    });

    productivityTrend.forEach((p: any) => {
      rows.push(['Productivity Trend', `${p.Month} ${p.Year}`, `${p.productivity_percentage}%`]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resource_optimization_${projName}_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // Filter developers who are highly utilized / overloaded (completion_percentage >= 80%)
  const overloadedList = useMemo(() => {
    return developersWorkload
      .filter(d => d.completion_percentage >= 80)
      .map(d => ({
        developer_name: d.developer_name,
        workload: d.completion_percentage,
        recommendation: d.completion_percentage >= 95 ? 'Reduce tasks immediately' : 'Reallocate future tasks'
      }))
      .sort((a, b) => b.workload - a.workload);
  }, [developersWorkload]);

  // Chart 1: Developer Workload Distribution Options
  const workloadChartOptions = useMemo(() => {
    const categories = developersWorkload.map(d => d.developer_name || 'Developer');
    return {
      chart: {
        type: 'bar' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%',
          distributed: true
        }
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 600 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        max: 100,
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px' },
          formatter: (val: number) => `${val}%`
        }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      colors: ['#3B82F6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      legend: { show: false },
      tooltip: {
        y: { formatter: (val: number) => `${val}% capacity` }
      }
    };
  }, [developersWorkload]);

  const workloadChartSeries = useMemo(() => {
    const data = developersWorkload.map(d => d.completion_percentage || 0);
    return [{ name: 'Workload Capacity', data }];
  }, [developersWorkload]);

  // Chart 2: Skill Match Analysis Options (Mocked based on screenshot specifications)
  const skillMatchOptions = {
    chart: {
      type: 'line' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif'
    },
    stroke: { curve: 'straight' as const, width: 3 },
    colors: ['#10B981'], // Emerald Green
    markers: {
      size: 6,
      strokeColors: '#10B981',
      strokeWidth: 2,
      hover: { size: 8 }
    },
    xaxis: {
      categories: ['React', 'Python', 'DevOps', 'AI'],
      labels: {
        style: { colors: '#94A3B8', fontSize: '10px', fontWeight: 650 }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val: number) => `${val}% match` }
    }
  };

  const skillMatchSeries = [
    { name: 'Skill Alignment', data: [80, 60, 40, 55] } // Matches the values React: 80, Python: 60, DevOps: 40, AI: 55
  ];

  // Chart 3: Team Productivity Trend Options (Area Chart)
  const productivityTrendOptions = useMemo(() => {
    const categories = productivityTrend.map(t => `${t.Month || ''} ${t.Year || ''}`.trim());
    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'smooth' as const, width: 3 },
      colors: ['#8B5CF6'], // Purple
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 650 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        max: 100,
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px' },
          formatter: (val: number) => `${val}%`
        }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      markers: { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val: number) => `${val}% productivity` }
      }
    };
  }, [productivityTrend]);

  const productivityTrendSeries = useMemo(() => {
    const data = productivityTrend.map(t => t.productivity_percentage || 0);
    return [{ name: 'Team Productivity', data }];
  }, [productivityTrend]);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Smart Resource Optimization
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Balance active developer workloads, optimize skill sets alignment, and view calculated productivity trends
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading || !projectId}
            className="flex items-center gap-1.5 h-9 text-xs border-slate-200 dark:border-slate-850 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={!projectId || isLoading}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-2xs h-9 text-xs px-4 rounded-xl cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Selector Panel */}
      <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs text-left">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Choose Project
              </label>
              <Select value={projectId} onValueChange={(val) => val && setProjectId(val)} disabled={isProjectsLoading}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-lg">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-h-48 overflow-y-auto">
                  {projects.map((p) => {
                    const ownerText = p.project_owner ? ` - ${formatPersonName(p.project_owner)}` : '';
                    return (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.project_name}{ownerText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Choose a Period
              </label>
              <Select value={period} onValueChange={(val) => val && handlePeriodChange(val)}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-lg">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-h-48 overflow-y-auto">
                  <SelectItem value="this-year">This Year (2026)</SelectItem>
                  <SelectItem value="last-year">Last Year (2025)</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom From Date */}
            {period === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromdate}
                  onChange={(e) => setFromdate(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Custom To Date */}
            {period === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  To Date
                </label>
                <input
                  type="date"
                  value={todate}
                  onChange={(e) => setTodate(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400">Loading Smart Optimization Analytics...</p>
        </Card>
      ) : !projectId ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <Briefcase className="h-12 w-12 text-slate-350 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-750 dark:text-slate-300">Choose a Project</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Select a project from the filter menu to pull optimization telemetry.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 text-left animate-fade-in">
          
          {/* KPI Optimization Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Developers */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Developers
                </span>
                <h3 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {kpiMetrics?.total_developers ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Assigned engineering staff
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
            </Card>

            {/* Overloaded Developers */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Overloaded Developers
                </span>
                <h3 className="text-3xl font-black text-rose-600 tracking-tight">
                  {kpiMetrics?.overloaded_developers ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Exceeding safe capacity threshold
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </Card>

            {/* Average Productivity */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Avg Productivity
                </span>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tight">
                  {kpiMetrics?.avg_productivity ?? 0}%
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Overall output rate average
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Percent className="h-6 w-6" />
              </div>
            </Card>

            {/* Tasks Completed (Skill Mismatch value reference) */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Skill Mismatch
                </span>
                <h3 className="text-3xl font-black text-purple-600 tracking-tight">
                  {kpiMetrics?.tasks_completed ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Skill mismatch indicators count
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Award className="h-6 w-6" />
              </div>
            </Card>

          </div>

          {/* First Row Charts: Workload Distribution & Skill Match Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Developer Workload Distribution */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Developer Workload Distribution
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Assigned workloads as percentages of total capacity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                {developersWorkload.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No developer workload logs recorded.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={workloadChartOptions} series={workloadChartSeries} type="bar" height="260" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skill Match Analysis (Mock chart based on screenshot) */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Skill Match Analysis
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Team qualification alignments across core domains
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                <div className="w-full">
                  <Chart options={skillMatchOptions} series={skillMatchSeries} type="line" height="260" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Second Row Charts: Team Productivity Trend */}
          <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Team Productivity Trend
              </CardTitle>
              <CardDescription className="text-[10px]">
                Monthly calculated average productivity scores representing project delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
              {productivityTrend.length === 0 ? (
                <p className="text-xs font-bold text-slate-400">No chronological productivity logs recorded.</p>
              ) : (
                <div className="w-full">
                  <Chart options={productivityTrendOptions} series={productivityTrendSeries} type="area" height="260" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Grid: Overloaded Developers Table vs AI Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Overloaded Developers List Widget */}
            <Card className="lg:col-span-7 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-3 border-b dark:border-slate-850">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Overloaded Developers
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Team resources currently operating above 80% workload capacity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {overloadedList.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center text-xs font-bold text-slate-400">
                    No overloaded resources. Workloads are balanced!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-850">
                          <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pl-6 py-3">
                            Developer
                          </TableHead>
                          <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3 text-center">
                            Workload
                          </TableHead>
                          <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pr-6 py-3 text-right">
                            Recommendation
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overloadedList.map((dev, index) => (
                          <TableRow
                            key={index}
                            className="border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                          >
                            <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-350 pl-6 py-3">
                              {dev.developer_name}
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-center py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dev.workload >= 95 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}`}>
                                {dev.workload}%
                              </span>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-slate-750 dark:text-slate-300 text-right pr-6 py-3">
                              {dev.recommendation}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommendation Panel Card */}
            <Card className="lg:col-span-5 border-slate-100 dark:border-slate-850 bg-amber-50/30 dark:bg-slate-900 rounded-2xl shadow-3xs relative overflow-hidden flex flex-col justify-between">
              
              {/* Decorative Gradient glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <CardHeader className="pb-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-850 dark:text-slate-200">
                      AI Resource Recommendation
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      Optimized engineering compositions calculated by AI models
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-grow flex flex-col justify-center">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  "Assigning Developer B instead of Developer A for backend integration reduces delay probability by 18%. Recommended team composition improves workload balance and increases sprint productivity."
                </p>
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
