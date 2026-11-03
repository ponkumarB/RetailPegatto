'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchDeliverablesMonthWise,
  fetchTaskEstimatedVsActual,
  fetchTaskCompletionTrend,
  fetchTeamProductivityPatterns,
  fetchPredictiveProjectRiskMetrics
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
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  Clock,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText
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

// Format numbers as Indian Rupees (INR)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

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

export default function PredictiveProjectRiskPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [projectId, setProjectId] = useState<string>('');

  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for API data
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [deliverablesData, setDeliverablesData] = useState<any[]>([]);
  const [estimatedVsActualData, setEstimatedVsActualData] = useState<any[]>([]);
  const [taskCompletionTrend, setTaskCompletionTrend] = useState<any[]>([]);
  const [teamProductivity, setTeamProductivity] = useState<any[]>([]);

  // Fetch projects list
  useEffect(() => {
    setIsProjectsLoading(true);
    fetchProjectlistwithoutpaginaton()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        setProjects(list);
        if (list.length > 0) {
          // Find first project or default 219 if it exists
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

  // Fetch all predictive metrics
  const loadDashboardData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);

    const pId = Number(projectId);
    try {
      const [
        resMetrics,
        resDeliverables,
        resHours,
        resTrend,
        resProductivity
      ] = await Promise.all([
        fetchPredictiveProjectRiskMetrics({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchDeliverablesMonthWise({ Project_Id: pId, Start_Date: fromdate, End_Date: todate }),
        fetchTaskEstimatedVsActual({ Project_Id: pId, Start_Date: fromdate, End_Date: todate }),
        fetchTaskCompletionTrend({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchTeamProductivityPatterns({ project_id: pId, start_date: fromdate, end_date: todate })
      ]);

      setKpiMetrics(resMetrics?.metrics || null);
      setDeliverablesData(resDeliverables?.Monthly_Deliverables || []);
      setEstimatedVsActualData(resHours?.Tasks || []);
      setTaskCompletionTrend(resTrend?.task_completion_trend || []);
      setTeamProductivity(resProductivity?.resources || []);
    } catch (err) {
      console.error('Failed to fetch predictive risk data', err);
      toast.error('Failed to load Predictive Project Risk telemetry.');
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

    const headers = ['Dataset', 'Item/Metric', 'Value/Duration'];
    const rows: any[] = [];

    if (kpiMetrics) {
      rows.push(['KPI Metrics', 'Total Weeks', kpiMetrics.total_weeks]);
      rows.push(['KPI Metrics', 'Total Hours', kpiMetrics.total_hours]);
      rows.push(['KPI Metrics', 'Total Resources', kpiMetrics.total_resources]);
      rows.push(['KPI Metrics', 'Average Project Cost (INR)', kpiMetrics.average_project_cost]);
    }

    estimatedVsActualData.forEach((t: any) => {
      rows.push(['Task Estimation vs Actual', `${t.Task_Name} (Est)`, t.Estimated_Hours]);
      rows.push(['Task Estimation vs Actual', `${t.Task_Name} (Act)`, t.Actual_Hours]);
      rows.push(['Task Estimation vs Actual', `${t.Task_Name} (Variance)`, t.Variance_Hours]);
    });

    deliverablesData.forEach((d: any) => {
      rows.push(['Deliverables Completed', `${d.Month} ${d.Year}`, d.Completed_Deliverables]);
    });

    teamProductivity.forEach((r: any) => {
      rows.push(['Team Productivity', r.resource_name, r.task_completion_hours]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `predictive_risk_${projName}_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // Chart 1: Task Completion History Options (Area Chart)
  const taskCompletionOptions = useMemo(() => {
    const categories = taskCompletionTrend.map(t => `${t.Month || ''} ${t.Year || ''}`.trim());
    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'smooth' as const, width: 3 },
      colors: ['#3B82F6'], // Primary blue
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
        labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      markers: { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val: number) => `${val} tasks` }
      }
    };
  }, [taskCompletionTrend]);

  const taskCompletionSeries = useMemo(() => {
    const data = taskCompletionTrend.map(t => t.Task_completion_count || 0);
    return [{ name: 'Tasks Completed', data }];
  }, [taskCompletionTrend]);

  // Chart 2: Estimation vs Actual Hours (Top 10 tasks with non-zero hours)
  const taskHoursOptionsAndSeries = useMemo(() => {
    // Filter and sort tasks by estimated hours descending to display meaningful data
    const filteredTasks = estimatedVsActualData
      .filter(t => (t.Estimated_Hours > 0 || t.Actual_Hours > 0))
      .slice(0, 10);

    const categories = filteredTasks.map(t => {
      const name = t.Task_Name || 'Unnamed Task';
      return name.length > 25 ? name.substring(0, 22) + '...' : name;
    });

    const estData = filteredTasks.map(t => t.Estimated_Hours || 0);
    const actData = filteredTasks.map(t => t.Actual_Hours || 0);

    return {
      options: {
        chart: {
          type: 'bar' as const,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 4
          }
        },
        xaxis: {
          categories,
          labels: {
            style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 600 },
            rotate: -20,
            rotateAlways: true
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
        },
        grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
        colors: ['#34D399', '#F87171'], // Light Green for Estimated, Light Red for Actual
        dataLabels: { enabled: false },
        legend: {
          position: 'top' as const,
          horizontalAlign: 'right' as const,
          fontSize: '11px',
          labels: { colors: '#64748B' }
        },
        tooltip: {
          y: { formatter: (val: number) => `${val} hours` }
        }
      },
      series: [
        { name: 'Estimated Hours', data: estData },
        { name: 'Actual Hours', data: actData }
      ]
    };
  }, [estimatedVsActualData]);

  // Chart 3: Deliverables Month-Wise Options (Area Chart)
  const deliverablesOptions = useMemo(() => {
    const categories = deliverablesData.map(d => `${d.Month || ''} ${d.Year || ''}`.trim());
    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'straight' as const, width: 3 },
      colors: ['#F59E0B'], // Amber
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
        labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      markers: { size: 5, strokeColors: '#F59E0B', hover: { size: 7 } },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val: number) => `${val} deliverables` }
      }
    };
  }, [deliverablesData]);

  const deliverablesSeries = useMemo(() => {
    const data = deliverablesData.map(d => d.Completed_Deliverables || 0);
    return [{ name: 'Completed Deliverables', data }];
  }, [deliverablesData]);

  // Chart 4: Team Productivity Patterns Options (Horizontal Bar Chart)
  const productivityOptions = useMemo(() => {
    const categories = teamProductivity.map(r => r.resource_name || 'Resource');
    return {
      chart: {
        type: 'bar' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          barHeight: '40%'
        }
      },
      xaxis: {
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px' }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        categories,
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px', fontWeight: 600 }
        }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      colors: ['#10B981'], // Emerald green
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val: number) => `${val} hours completed` }
      }
    };
  }, [teamProductivity]);

  const productivitySeries = useMemo(() => {
    const data = teamProductivity.map(r => r.task_completion_hours || 0);
    return [{ name: 'Completed Task Hours', data }];
  }, [teamProductivity]);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Predictive Project Risk
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Analyze resource capacities, timeline variances, deliverables completion rates, and predicted risk KPIs
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
          <p className="text-sm font-bold text-slate-400">Loading Predictive Project Risks...</p>
        </Card>
      ) : !projectId ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <Briefcase className="h-12 w-12 text-slate-350 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-750 dark:text-slate-300">Choose a Project</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Select a project from the filter menu to pull resource telemetry.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 text-left animate-fade-in">
          
          {/* KPI Risk Banner Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Weeks */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Weeks
                </span>
                <h3 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {kpiMetrics?.total_weeks ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Project cycle span
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Calendar className="h-6 w-6" />
              </div>
            </Card>

            {/* Total Hours */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Hours
                </span>
                <h3 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {kpiMetrics?.total_hours ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Allocated task hours
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-6 w-6" />
              </div>
            </Card>

            {/* Total Resources */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Resources
                </span>
                <h3 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {kpiMetrics?.total_resources ?? 0}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Assigned headcount
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
            </Card>

            {/* Average Project Cost */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Average Cost
                </span>
                <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {formatCurrency(kpiMetrics?.average_project_cost ?? 0)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Estimated budget spend
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </Card>

          </div>

          {/* First Row Charts: Task Completion History & Estimation vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Task Completion History */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Task Completion History
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Chrono-telemetry of monthly completed task volumes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                {taskCompletionTrend.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No completion timeline recorded.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={taskCompletionOptions} series={taskCompletionSeries} type="area" height="260" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estimation vs Actual Hours */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Estimation vs Actual Hours
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Comparison of budgeted effort vs actual recorded times (Top 10 Tasks)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                {taskHoursOptionsAndSeries.series[0]?.data.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No estimation effort recorded on active tasks.</p>
                ) : (
                  <div className="w-full">
                    <Chart
                      options={taskHoursOptionsAndSeries.options}
                      series={taskHoursOptionsAndSeries.series}
                      type="bar"
                      height="260"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Second Row Charts: Deliverables & Team Productivity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Deliverables Month-wise */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Deliverables Progress
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Month-wise delivery rate indicating pipeline progression
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                {deliverablesData.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No deliverables tracked for this timeline.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={deliverablesOptions} series={deliverablesSeries} type="area" height="260" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Productivity Patterns */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Team Productivity Patterns
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Completion efforts mapped per project resource
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
                {teamProductivity.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No team resource activities logged.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={productivityOptions} series={productivitySeries} type="bar" height="260" />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Full Task Grid list to inspect variances */}
          {estimatedVsActualData.length > 0 && (
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-3 border-b dark:border-slate-850">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Task Auditing & Variances
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Complete list of task logs comparing estimates vs actuals and calculated variance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-850">
                        <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pl-6 py-3">
                          Task Name
                        </TableHead>
                        <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3 text-right">
                          Estimated Hours
                        </TableHead>
                        <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3 text-right">
                          Actual Hours
                        </TableHead>
                        <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pr-6 py-3 text-right">
                          Variance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimatedVsActualData.map((task: any, index: number) => {
                        const isOver = (task.Variance_Hours ?? 0) > 0;
                        const isUnder = (task.Variance_Hours ?? 0) < 0;
                        return (
                          <TableRow
                            key={index}
                            className="border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                          >
                            <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-350 pl-6 py-3">
                              {task.Task_Name}
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-slate-500 text-right py-3">
                              {task.Estimated_Hours?.toFixed(1) ?? '0.0'} hrs
                            </TableCell>
                            <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-300 text-right py-3">
                              {task.Actual_Hours?.toFixed(1) ?? '0.0'} hrs
                            </TableCell>
                            <TableCell className={`font-black text-xs text-right pr-6 py-3 ${isOver ? 'text-rose-500' : isUnder ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {task.Variance_Hours > 0 ? `+${task.Variance_Hours.toFixed(1)}` : task.Variance_Hours?.toFixed(1) ?? '0.0'} hrs
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
