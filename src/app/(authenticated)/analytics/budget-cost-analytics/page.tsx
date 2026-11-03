'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchBudgetCostAnalyticsCards,
  fetchInvoiceActivityTrend,
  fetchMonthlyLabourCostTrend
} from '@/service/api/Analytics/api';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project/api';
import { formatPersonName } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  Clock,
  Briefcase,
  TrendingUp,
  Percent,
  Coins,
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

export default function BudgetCostAnalyticsPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [projectId, setProjectId] = useState<string>('');

  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for API data
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [invoiceTrend, setInvoiceTrend] = useState<any[]>([]);
  const [labourCostTrend, setLabourCostTrend] = useState<any[]>([]);

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

  // Fetch all budget and cost metrics
  const loadDashboardData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);

    const pId = Number(projectId);
    try {
      const [
        resMetrics,
        resInvoice,
        resLabour
      ] = await Promise.all([
        fetchBudgetCostAnalyticsCards({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchInvoiceActivityTrend({ project_id: pId, start_date: fromdate, end_date: todate }),
        fetchMonthlyLabourCostTrend({ project_id: pId, start_date: fromdate, end_date: todate })
      ]);

      const metricsData = resMetrics?.data?.[0]?.metrics || null;
      setKpiMetrics(metricsData);
      setInvoiceTrend(resInvoice?.data || []);
      setLabourCostTrend(resLabour?.data || []);
    } catch (err) {
      console.error('Failed to fetch budget & cost data', err);
      toast.error('Failed to load Budget & Cost telemetry.');
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

    const headers = ['Dataset', 'Month/Metric', 'Value'];
    const rows: any[] = [];

    if (kpiMetrics) {
      rows.push(['KPI Metrics', 'Planned Budget (INR)', kpiMetrics.planned_budget]);
      rows.push(['KPI Metrics', 'Actual Revenue (INR)', kpiMetrics.actual_revenue]);
      rows.push(['KPI Metrics', 'Budget Utilization (%)', kpiMetrics.budget_utilization_percent]);
      rows.push(['KPI Metrics', 'Burn Rate Per Day (INR)', kpiMetrics.burn_rate_per_day]);
    }

    invoiceTrend.forEach((i: any) => {
      rows.push(['Invoice Activity', `${i.Month} ${i.Year}`, i.Invoice_count]);
    });

    labourCostTrend.forEach((l: any) => {
      rows.push(['Labour Cost Trend', `${l.Month} ${l.Year}`, l.labour_cost]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `budget_cost_analytics_${projName}_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // KPIs
  const plannedBudget = kpiMetrics?.planned_budget ?? 0;
  const actualRevenue = kpiMetrics?.actual_revenue ?? 0;
  const budgetUtilization = kpiMetrics?.budget_utilization_percent ?? 0;
  const burnRate = kpiMetrics?.burn_rate_per_day ?? 0;

  // Chart 1: Budget vs Revenue Donut Chart Options
  const budgetDonutOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif'
    },
    labels: ['Planned Budget', 'Actual Revenue', 'Remaining Budget'],
    colors: ['#3B82F6', '#10B981', '#E2E8F0'], // Blue, Green, Light Gray
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      labels: { colors: '#64748B' }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['#ffffff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Planned Budget',
              fontSize: '12px',
              color: '#64748B',
              formatter: () => formatCurrency(plannedBudget)
            },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: (val: string) => formatCurrency(Number(val))
            }
          }
        }
      }
    },
    tooltip: {
      y: { formatter: (val: number) => formatCurrency(val) }
    }
  };

  const budgetDonutSeries = useMemo(() => {
    const remaining = Math.max(plannedBudget - actualRevenue, 0);
    return [plannedBudget, actualRevenue, remaining];
  }, [plannedBudget, actualRevenue]);

  // Chart 2: Invoice Activity Options (Area Chart)
  const invoiceChartOptions = useMemo(() => {
    const categories = invoiceTrend.map(i => `${i.Month || ''} ${i.Year || ''}`.trim());
    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'smooth' as const, width: 3 },
      colors: ['#6366F1'], // Indigo
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
        y: { formatter: (val: number) => `${val} invoices` }
      }
    };
  }, [invoiceTrend]);

  const invoiceChartSeries = useMemo(() => {
    const data = invoiceTrend.map(i => i.Invoice_count || 0);
    return [{ name: 'Invoices Issued', data }];
  }, [invoiceTrend]);

  // Chart 3: Monthly Labour Cost Trend Options (Gradient Line/Area Chart)
  const labourCostChartOptions = useMemo(() => {
    const categories = labourCostTrend.map(l => {
      const month = l.Month || '';
      return month.length > 3 ? month.substring(0, 3) : month;
    });

    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'smooth' as const, width: 3 },
      colors: ['#0EA5E9'], // Sky blue
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
          style: { colors: '#94A3B8', fontSize: '10px', fontWeight: 650 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px' },
          formatter: (val: number) => formatCurrency(val)
        }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      markers: { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val: number) => formatCurrency(val) }
      }
    };
  }, [labourCostTrend]);

  const labourCostChartSeries = useMemo(() => {
    const data = labourCostTrend.map(l => l.labour_cost || 0);
    return [{ name: 'Labour Cost', data }];
  }, [labourCostTrend]);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Budget & Cost Analytics
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Monitor planned budgets, actual revenues, utilization levels, burn rates, and billing trends
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
          <p className="text-sm font-bold text-slate-400">Loading Budget Cost Analytics...</p>
        </Card>
      ) : !projectId ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <Briefcase className="h-12 w-12 text-slate-355 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-750 dark:text-slate-300">Choose a Project</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Select a project from the filter menu to pull financial telemetry.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 text-left animate-fade-in">
          
          {/* KPI Analytics Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Planned Budget */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Planned Budget
                </span>
                <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {formatCurrency(plannedBudget)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Total allocated project funds
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Coins className="h-6 w-6" />
              </div>
            </Card>

            {/* Actual Revenue */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Actual Revenue
                </span>
                <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {formatCurrency(actualRevenue)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Accumulated invoice earnings
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </Card>

            {/* Budget Utilization % */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Budget Utilization
                </span>
                <h3 className="text-3xl font-black text-indigo-600 tracking-tight">
                  {budgetUtilization.toFixed(1)}%
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Budget consumed percentage
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Percent className="h-6 w-6" />
              </div>
            </Card>

            {/* Burn Rate Per Day */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex items-center justify-between hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Burn Rate /day
                </span>
                <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                  {formatCurrency(burnRate)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Daily financial consumption
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
            </Card>

          </div>

          {/* First Row: Budget Donut & Invoice Activity Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Budget allocation Donut */}
            <Card className="lg:col-span-5 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Budget Breakdown
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Breakdown mapping Planned Budget vs Revenue and Remaining funds
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center flex-grow min-h-[300px]">
                <div className="w-full max-w-[280px]">
                  <Chart options={budgetDonutOptions} series={budgetDonutSeries} type="donut" height="260" />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Activity Trend */}
            <Card className="lg:col-span-7 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Invoice Activity
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Timeline analysis showing quantities of monthly invoices issued
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[300px] flex items-center justify-center">
                {invoiceTrend.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No invoices logged for this period.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={invoiceChartOptions} series={invoiceChartSeries} type="area" height="260" />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Second Row: Monthly Labour Cost Trend */}
          <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Monthly Labour Cost Trend
              </CardTitle>
              <CardDescription className="text-[10px]">
                Monthly tracking of operational labor expenditures incurred
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 min-h-[280px] flex items-center justify-center">
              {labourCostTrend.length === 0 ? (
                <p className="text-xs font-bold text-slate-400">No labor costs logged for this period.</p>
              ) : (
                <div className="w-full">
                  <Chart options={labourCostChartOptions} series={labourCostChartSeries} type="area" height="260" />
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
