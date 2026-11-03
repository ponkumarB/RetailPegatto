'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import { fetchNewITProjectAnalyticsDashboard } from '@/service/api/Analytics/api';
import {
  Calendar, RefreshCw, SlidersHorizontal, ArrowRight,
  FolderKanban, CheckSquare, Clock, AlertTriangle, ShieldAlert
} from 'lucide-react';

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
  const modifiedOptions = {
    ...props.options,
    chart: {
      ...props.options?.chart,
      animations: {
        enabled: false
      }
    }
  };
  return <ApexChart {...props} options={modifiedOptions} />;
}

const formatDateForApi = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProjectAnalyticsPage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize date range on mount
  useEffect(() => {
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    setDateRange(`${formatDate(twoYearsAgo)} - ${formatDate(today)}`);
  }, []);

  // Fetch dashboard data whenever dateRange changes
  useEffect(() => {
    const dates = dateRange.split(' - ');
    const startDate = formatDateForApi(dates[0]);
    const endDate = formatDateForApi(dates[1] || dates[0]);

    setIsLoading(true);
    fetchNewITProjectAnalyticsDashboard({ start_date: startDate, end_date: endDate })
      .then((res: any) => {
        setData(res);
      })
      .catch((err: any) => {
        console.error('Error fetching analytics:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dateRange]);

  // KPI Data
  const kpis = data ? [
    { label: 'Total Projects', value: String(data.summary?.total_projects || 0), isPositive: true, icon: FolderKanban, iconBg: 'bg-blue-50 dark:bg-blue-950/30', iconCol: 'text-blue-600' },
    { label: 'Active Projects', value: String(data.summary?.active_projects || 0), isPositive: true, icon: RefreshCw, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30', iconCol: 'text-emerald-600' },
    { label: 'Projects Completed', value: String(data.summary?.completed_projects || 0), isPositive: true, icon: CheckSquare, iconBg: 'bg-purple-50 dark:bg-purple-950/30', iconCol: 'text-purple-600' },
    { label: 'On Track', value: String(data.summary?.on_track_projects || 0), isPositive: true, icon: FolderKanban, iconBg: 'bg-teal-50 dark:bg-teal-950/30', iconCol: 'text-teal-600' },
    { label: 'At Risk', value: String(data.summary?.at_risk_projects || 0), isPositive: false, icon: AlertTriangle, iconBg: 'bg-amber-50 dark:bg-amber-950/30', iconCol: 'text-amber-600' },
    { label: 'Overdue', value: String(data.summary?.overdue_projects || 0), isPositive: false, icon: Clock, iconBg: 'bg-rose-50 dark:bg-rose-950/30', iconCol: 'text-rose-600' }
  ] : [];

  // Projects Progress Overview Donut Chart
  const progressOverviewOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['On Track', 'In Progress', 'At Risk', 'Overdue'],
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    legend: {
      show: true,
      position: 'bottom' as const,
      fontFamily: 'Inter',
      fontSize: '11px',
      fontWeight: 600,
      labels: {
        colors: '#64748B',
      },
      markers: {
        radius: 12,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4
      }
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Projects',
              formatter: () => String(data?.summary?.total_projects || 0),
              style: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B'
            }
          }
        }
      }
    }
  };

  // Projects by Client Donut Chart
  const clientLabels = data?.projects_by_client?.map((c: any) => c.Customer_Name) || [];
  const projectsByClientOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: clientLabels,
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#64748B', '#0EA5E9', '#EC4899', '#14B8A6', '#F43F5E', '#8B5CF6'].slice(0, clientLabels.length || 5),
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Clients',
              formatter: () => String(data?.projects_by_client?.length || 0),
              style: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B'
            }
          }
        }
      }
    }
  };

  // Project Health Trend Line Chart
  const healthTrendOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    xaxis: {
      categories: data?.project_health_trend?.map((t: any) => t.period) || [],
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    yaxis: { labels: { style: { colors: '#94A3B8', fontSize: '10px' } } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 }
  };

  // Projects by Status Column Bar Chart
  const projectsByStatusOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 6,
        columnWidth: '45%'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data?.projects_by_status?.map((s: any) => s.Status) || [],
      labels: { style: { colors: '#94A3B8', fontSize: '10px', fontWeight: 600 } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 }
  };

  const getGrowthDisplay = (changeStr: string) => {
    if (changeStr.toLowerCase().includes('vs')) {
      return changeStr.replace(/vs\s+.*/gi, `vs ${period}`);
    }
    return changeStr;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 font-medium">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Heading Panel */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Project Analytics
          </h1>
          <p className="text-sm text-slate-450 mt-1">Real-time insights and data-driven overview of all projects</p>
        </div>

        {/* Date Filters block */}
        <div className="flex items-center gap-2">
          <PeriodFilter
            value={dateRange}
            period={period}
            onChange={(newRange, newPeriod) => {
              setDateRange(newRange);
              setPeriod(newPeriod);
            }}
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-shadow hover:shadow-md flex items-center justify-between text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">{k.label}</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{k.value}</h3>
            </div>
            <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${k.iconBg} ${k.iconCol}`}>
              <k.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* 3-Column Visual Layout (Exact match to Slide 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

        {/* Column 1: Projects Progress, Projects by Client, Top Projects by Progress */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Projects Progress Overview</h4>
            <div className="h-[240px] flex items-center justify-center">
              <Chart options={progressOverviewOpts} series={data ? [data.project_health?.on_track || 0, data.project_health?.in_progress || 0, data.project_health?.at_risk || 0, data.project_health?.overdue || 0] : []} type="donut" height="230" />
            </div>
            
            {/* Legend & Color Indicators Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t dark:border-slate-800/80">
              {[
                { label: 'On Track', color: 'bg-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400', value: data?.project_health?.on_track || 0 },
                { label: 'In Progress', color: 'bg-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 dark:text-blue-400', value: data?.project_health?.in_progress || 0 },
                { label: 'At Risk', color: 'bg-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 dark:text-amber-400', value: data?.project_health?.at_risk || 0 },
                { label: 'Overdue', color: 'bg-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 dark:text-rose-450', value: data?.project_health?.overdue || 0 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl border dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color.split(' ')[0]}`} />
                    <span className="text-slate-550 dark:text-slate-400 font-semibold">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Detailed breakdown</span>
              <Link href="/analytics/reports?report=project-summary" className="flex items-center gap-1">View Full Report <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Projects by Client</h4>
            <div className="h-[180px] flex items-center justify-center">
              <Chart options={projectsByClientOpts} series={data?.projects_by_client?.map((c: any) => c.total_projects) || []} type="donut" height="180" />
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Client distributions</span>
              <Link href="/analytics/sales-by-customer" className="flex items-center gap-1">View Client Report <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Projects by Progress</h4>
            <div className="space-y-3.5">
              {data?.top_projects_by_progress?.map((p: any, idx: number) => (
                <div key={idx} className="space-y-1 pb-3 border-b dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <h5>{p.project_name}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{p.avg_progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${p.avg_progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Project Health Trend, Time Performance, Risks & Issues Overviews */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Project Health Trend</h4>
            </div>
            <Chart
              options={healthTrendOpts}
              series={[
                { name: 'On Track', data: data?.project_health_trend?.map((t: any) => t.on_track) || [] },
                { name: 'In Progress', data: data?.project_health_trend?.map((t: any) => t.in_progress) || [] },
                { name: 'At Risk', data: data?.project_health_trend?.map((t: any) => t.at_risk) || [] },
                { name: 'Overdue', data: data?.project_health_trend?.map((t: any) => t.overdue) || [] }
              ]}
              type="line"
              height="200"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Time Performance</h4>
            <div className="grid grid-cols-3 gap-2 py-2 text-center">
              <div>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-4 border-emerald-500 text-sm font-black text-slate-800 dark:text-slate-100">{data?.time_performance?.on_time?.percentage || 0}%</div>
                <span className="text-[10px] font-bold text-slate-400 block mt-2">On-Time Projects ({data?.time_performance?.on_time?.count || 0})</span>
              </div>
              <div>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-4 border-amber-500 text-sm font-black text-slate-800 dark:text-slate-100">{data?.time_performance?.at_risk?.percentage || 0}%</div>
                <span className="text-[10px] font-bold text-slate-400 block mt-2">At-Risk Projects ({data?.time_performance?.at_risk?.count || 0})</span>
              </div>
              <div>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-4 border-rose-500 text-sm font-black text-slate-800 dark:text-slate-100">{data?.time_performance?.overdue?.percentage || 0}%</div>
                <span className="text-[10px] font-bold text-slate-400 block mt-2">Overdue Projects ({data?.time_performance?.overdue?.count || 0})</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Performance indexes</span>
              <Link href="/analytics/reports?report=timesheet" className="flex items-center gap-1">View Time Report <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Risks & Issues Overviews</h4>
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Top Risks</span>
                {data?.risk_overview?.top_risks?.map((risk: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{risk.name}</span>
                    <span className="text-amber-600 font-black">{risk.count}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-450">Top Issues</span>
                {data?.risk_overview?.top_issues?.map((issue: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{issue.name}</span>
                    <span className="text-rose-600 font-black">{issue.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Projects by Status, Cost Performance, Key Insights */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Projects by Status</h4>
            </div>
            <Chart options={projectsByStatusOpts} series={[{ data: data?.projects_by_status?.map((s: any) => s.total) || [] }]} type="bar" height="200" />
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Cost Performance</h4>
            <div className="space-y-3.5 py-1">
              {(() => {
                const under = data?.cost_performance?.under_budget || 0;
                const on = data?.cost_performance?.on_budget || 0;
                const over = data?.cost_performance?.over_budget || 0;
                const total = under + on + over;
                const getPct = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;
                return [
                  { label: `Under Budget (${under} Projects)`, pct: `${getPct(under)}%`, bar: 'bg-emerald-500' },
                  { label: `On Budget (${on} Projects)`, pct: `${getPct(on)}%`, bar: 'bg-blue-500' },
                  { label: `Over Budget (${over} Projects)`, pct: `${getPct(over)}%`, bar: 'bg-rose-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{item.label}</span>
                      <span>{item.pct}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.bar}`} style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Financial rollup</span>
              <Link href="/analytics/reports?report=budget-cost" className="flex items-center gap-1">View Cost Report <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
