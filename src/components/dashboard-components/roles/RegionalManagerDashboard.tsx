'use client';

import React from 'react';
import {
  useAdminSummaryChartQuery,
  useAdminDashboardNewITQuery
} from '@/service/dashboardQueries';
import {
  Users,
  Briefcase,
  CheckSquare,
  Ticket,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Chart from './Chart';
import { KPICard } from './KPICard';
import { getXAxisTitle } from './utils';

interface AdminDashboardProps {
  startDate: string;
  endDate: string;
  primaryColor: string;
  period: string;
}

export default function RegionalManagerDashboard({
  startDate,
  endDate,
  primaryColor,
  period
}: AdminDashboardProps) {
  // 1. Admin Queries (hook executes only when component is rendered)
  const { data: adminSummaryRes, isLoading: isAdminSummaryLoading } = useAdminSummaryChartQuery(
    startDate,
    endDate,
    true
  );
  const { data: adminDashboardRes, isLoading: isAdminDashboardLoading } = useAdminDashboardNewITQuery(
    startDate,
    endDate,
    true
  );

  const adminSummary = adminSummaryRes?.data || adminSummaryRes;
  const adminDashboard = adminDashboardRes?.data || adminDashboardRes;

  if (isAdminSummaryLoading || isAdminDashboardLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>Loading Admin Dashboard data...</span>
      </div>
    );
  }

  const projectStatusData = adminSummary?.charts?.project_status_overview || [];
  const projectStatusLabels = projectStatusData.map((d: any) => d.status) || [];
  const projectStatusSeries = projectStatusData.map((d: any) => Number(d.count)) || [];
  const projectStatusTotal = projectStatusSeries.reduce((a: number, b: number) => a + b, 0);

  const projectStatusOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: projectStatusLabels.length > 0 ? projectStatusLabels : ['No Projects'],
    colors: ['#64748B', '#0565FD', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#8B5CF6'],
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
              label: 'Total',
              formatter: () => String(projectStatusTotal),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(projectStatusTotal)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const crmTasks = adminSummary?.charts?.task_overview?.crm_tasks || [];
  const projTasks = adminSummary?.charts?.task_overview?.project_tasks || [];
  const taskMap: Record<string, number> = {};
  [...crmTasks, ...projTasks].forEach((t: any) => {
    taskMap[t.status] = (taskMap[t.status] || 0) + Number(t.count);
  });
  const taskLabels = Object.keys(taskMap);
  const taskSeries = Object.values(taskMap);
  const taskTotal = taskSeries.reduce((a, b) => a + b, 0);

  const taskOverviewOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: taskLabels.length > 0 ? taskLabels : ['No Tasks'],
    colors: ['#0565FD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
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
              label: 'Total',
              formatter: () => String(taskTotal),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(taskTotal)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const revData = adminSummary?.charts?.revenue_overview || [];
  const revLabels = revData.map((d: any) => d.label) || [];
  const revSeriesFormatted = revData.map((d: any) => {
    const amt = Number(d.amount);
    return Number((amt / 100000).toFixed(2));
  });

  const revenueOverviewOpts = {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: [primaryColor],
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
      categories: revLabels.length > 0 ? revLabels : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: getXAxisTitle(revLabels, period),
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      labels: { formatter: (v: number) => `₹${v}L` },
      title: {
        text: 'Revenue (Lakhs)',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { show: false }
  };

  const resUtilData = adminDashboard?.resource_utilization || [];
  const resUtilCategories = resUtilData.map((d: any) => d.department) || [];
  const resUtilSeries = resUtilData.map((d: any) => Number(d.utilization)) || [];

  const resourceUtilizationOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
      }
    },
    colors: [primaryColor],
    xaxis: {
      categories: resUtilCategories.length > 0 ? resUtilCategories : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: 'Department',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      max: 100,
      labels: { formatter: (v: number) => `${v}%` },
      title: {
        text: 'Utilization (%)',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard title="Total Leads" value={String(adminSummary?.cards?.total_leads || 0)} growth="Overall leads count" isPositive={true} icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50 dark:bg-blue-950/30" iconColor="text-blue-600 dark:text-blue-400" period={period} />

        <KPICard title="Total Clients" value={String(adminSummary?.cards?.total_clients || 0)} growth="Registered customers" isPositive={true} icon={<Users className="h-5 w-5" />} iconBg="bg-purple-50 dark:bg-purple-950/30" iconColor="text-purple-600 dark:text-purple-400" period={period} />
        <KPICard title="Open Tasks" value={String(adminSummary?.cards?.total_open_tasks || 0)} growth={`Total Tasks: ${adminSummary?.cards?.crm_open_tasks || 0}`} isPositive={true} icon={<CheckSquare className="h-5 w-5" />} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" period={period} />
        <KPICard title="Open Tickets" value={String(adminSummary?.cards?.open_tickets || 0)} growth="Requires attention" isPositive={true} icon={<Ticket className="h-5 w-5" />} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" period={period} />
        <KPICard title="Total Revenue" value={`₹ ${adminSummary?.cards?.revenue?.toLocaleString('en-IN') || 0}`} growth="Lifetime revenue value" isPositive={true} icon={<DollarSign className="h-5 w-5" />} iconBg="bg-pink-50 dark:bg-pink-950/30" iconColor="text-pink-600 dark:text-pink-400" period={period} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Revenue Overview</h4>
              <p className="text-[10px] text-slate-450">Total Revenue: <span className="font-bold text-slate-700 dark:text-slate-200">₹{adminSummary?.cards?.revenue?.toLocaleString('en-IN') || 0}</span></p>
            </div>
          </div>
          <Chart options={revenueOverviewOpts} series={[{ name: 'Revenue', data: revSeriesFormatted.length > 0 ? revSeriesFormatted : [0] }]} type="area" height={240} />
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Task Overview</h4>
            <Badge variant="secondary" className="text-[10px] font-bold">{taskTotal} Total</Badge>
          </div>
          <div className="flex items-center justify-center py-4">
            <Chart options={taskOverviewOpts} series={taskSeries.length > 0 ? taskSeries : [0]} type="donut" height={220} width={260} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-semibold">
            {taskLabels.map((label: string, idx: number) => {
              const colorClasses = [
                'bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500'
              ];
              const dotColor = colorClasses[idx % colorClasses.length];
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-855">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                    {label}
                  </span>
                  <span>{taskMap[label]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Resource Utilization</h4>
          <Chart options={resourceUtilizationOpts} series={[{ name: 'Utilization', data: resUtilSeries.length > 0 ? resUtilSeries : [0] }]} type="bar" height={220} />
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Open Tickets</h4>
          <div className="space-y-3">
            {(adminDashboard?.open_tickets || []).slice(0, 5).map((t: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-2xl border dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left">
                <div className="space-y-1.5 text-left min-w-0 flex-1 mr-2">
                  <span className="text-[10px] font-extrabold text-slate-400 block">{t.ticket_id} - Age: {t.age}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {t.description ? t.description.replace(/<[^>]*>?/gm, '').trim() : ''}
                  </span>
                </div>
                <Badge className={
                  t.priority?.toLowerCase().includes('high') || t.priority?.toLowerCase().includes('p1') ? 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border-red-150' :
                  t.priority?.toLowerCase().includes('medium') || t.priority?.toLowerCase().includes('p2') ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border-amber-150' :
                  'bg-slate-50 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                }>
                  {t.priority}
                </Badge>
              </div>
            ))}
            {(!adminDashboard?.open_tickets || adminDashboard.open_tickets.length === 0) && (
              <div className="text-xs text-slate-400 text-center py-4">No open tickets</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
