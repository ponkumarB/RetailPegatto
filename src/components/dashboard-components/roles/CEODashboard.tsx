'use client';

import React from 'react';
import {
  useCEODashboardITNewQuery,
  useCEODashboardAnalyticsNewITQuery
} from '@/service/dashboardQueries';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Ticket,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Chart from './Chart';
import { KPICard } from './KPICard';
import { getXAxisTitle } from './utils';

interface CEODashboardProps {
  startDate: string;
  endDate: string;
  createdBy: number;
  primaryColor: string;
  period: string;
}

export default function CEODashboard({
  startDate,
  endDate,
  createdBy,
  primaryColor,
  period
}: CEODashboardProps) {
  const router = useRouter();

  // CEO Queries (hooks execute only when component is rendered)
  const { data: ceoDashboardRes, isLoading: isCeoDashboardLoading } = useCEODashboardITNewQuery(
    startDate,
    endDate,
    createdBy,
    true
  );
  const { data: ceoAnalyticsRes, isLoading: isCeoAnalyticsLoading } = useCEODashboardAnalyticsNewITQuery(
    startDate,
    endDate,
    createdBy,
    true
  );

  const ceoDashboard = ceoDashboardRes?.data || ceoDashboardRes;
  const ceoAnalytics = ceoAnalyticsRes?.data || ceoAnalyticsRes;

  if (isCeoDashboardLoading || isCeoAnalyticsLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>Loading CEO Dashboard data...</span>
      </div>
    );
  }

  const revTrend = ceoAnalytics?.revenue_trend || [];
  const revTrendCategories = revTrend.map((d: any) => d.date) || [];
  const revTrendSeries = revTrend.map((d: any) => Number((Number(d.revenue) / 100000).toFixed(2))) || [];

  const revenueTrendOpts = {
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
      categories: revTrendCategories.length > 0 ? revTrendCategories : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: getXAxisTitle(revTrendCategories, period),
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
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const health = ceoDashboard?.project_health || { total: 0, on_track: 0, at_risk: 0, delayed: 0, cancelled: 0 };
  const projectHealthSeries = [health.on_track || 0, health.at_risk || 0, health.delayed || 0, health.cancelled || 0];

  const projectHealthOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['On Track', 'At Risk', 'Delayed', 'Cancelled'],
    colors: ['#10B981', '#0565FD', '#EF4444', '#94A3B8'],
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
              label: 'Active Projects',
              formatter: () => String(health.total),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(health.total)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const utilVal = ceoAnalytics?.resource_utilization?.utilization || 0;

  const resourceUtilGaugeOpts = {
    chart: { type: 'radialBar' as const, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: '#F1F5F9',
          strokeWidth: '97%',
          margin: 5,
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -2,
            fontSize: '30px',
            fontWeight: 800,
            formatter: (val: number) => `${val}%`
          }
        }
      }
    },
    grid: { padding: { top: -10 } },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#10B981'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    colors: ['#0565FD'],
    labels: ['Average Utilization']
  };

  const financialSparklineOpts = (color: string) => ({
    chart: { type: 'line' as const, sparkline: { enabled: true } },
    stroke: { width: 2, curve: 'smooth' as const },
    colors: [color],
    tooltip: { enabled: false }
  });

  const kpi = ceoDashboard?.kpi_cards || { total_revenue: 0, gross_profit: 0, active_projects: 0, total_clients: 0, total_employees: 0, open_tickets: 0 };
  const fin = ceoAnalytics?.financial_overview || { total_invoiced: 0, total_received: 0, outstanding: 0, overdue: 0 };

  const finCards = [
    { label: 'Total Invoiced', value: `₹ ${Number(fin.total_invoiced || 0).toLocaleString('en-IN')}`, data: [10, 15, 8, 12, 16, 20], color: '#10B981' },
    { label: 'Total Received', value: `₹ ${Number(fin.total_received || 0).toLocaleString('en-IN')}`, data: [8, 12, 7, 10, 14, 18], color: '#10B981' },
    { label: 'Outstanding', value: `₹ ${Number(fin.outstanding || 0).toLocaleString('en-IN')}`, data: [2, 3, 1, 2, 2, 2], color: fin.outstanding >= 0 ? '#10B981' : '#EF4444' },
    { label: 'Overdue', value: `₹ ${Number(fin.overdue || 0).toLocaleString('en-IN')}`, data: [5, 4, 6, 5, 5, 5], color: '#EF4444' }
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard title="Total Revenue" value={`₹ ${Number(kpi.total_revenue || 0).toLocaleString('en-IN')}`} growth="Lifetime revenue value" isPositive={true} icon={<DollarSign className="h-5 w-5" />} iconBg="bg-blue-50 dark:bg-blue-950/30" iconColor="text-blue-600 dark:text-blue-400" period={period} />
        <KPICard title="Gross Profit" value={`₹ ${Number(kpi.gross_profit || 0).toLocaleString('en-IN')}`} growth="Operating margins" isPositive={true} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" period={period} />

        <KPICard title="Total Clients" value={String(kpi.total_clients || 0)} growth="Registered customers" isPositive={true} icon={<Users className="h-5 w-5" />} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" period={period} />
        <KPICard title="Total Employees" value={String(kpi.total_employees || 0)} growth="Registered staff count" isPositive={true} icon={<Users className="h-5 w-5" />} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" period={period} />
        <KPICard title="Open Tickets" value={String(kpi.open_tickets || 0)} growth="Urgent client tasks" isPositive={false} icon={<Ticket className="h-5 w-5" />} iconBg="bg-rose-50 dark:bg-rose-950/30" iconColor="text-rose-600 dark:text-rose-400" period={period} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Revenue Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Revenue Trend</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Total Revenue: <span className="font-bold text-slate-700 dark:text-slate-200">₹{Number(kpi.total_revenue || 0).toLocaleString('en-IN')}</span></p>
            </div>
          </div>
          <Chart options={revenueTrendOpts} series={[{ name: 'Revenue', data: revTrendSeries.length > 0 ? revTrendSeries : [0] }]} type="area" height={220} />
        </div>


      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Clients by Revenue */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Top 5 Clients by Revenue</h4>
            <button onClick={() => router.push('/companies')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All Clients <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {(ceoAnalytics?.top_clients || []).slice(0, 5).map((client: any, idx: number) => {
              return (
                <div key={idx} className="space-y-1 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-755 dark:text-slate-250">
                    <span className="truncate">{idx + 1}. {client.client_name}</span>
                    <span>₹ {Number(client.revenue).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
            {(!ceoAnalytics?.top_clients || ceoAnalytics.top_clients.length === 0) && (
              <div className="text-xs text-slate-400 text-center py-4">No top clients data available</div>
            )}
          </div>
        </div>

        {/* Resource Utilization Semi-circle Gauge */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Resource Utilization</h4>
            <button onClick={() => router.push('/resource-master/resource-list')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Resource Report <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex justify-center items-center h-[140px] pt-4">
            <Chart options={resourceUtilGaugeOpts} series={[utilVal]} type="radialBar" height={190} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold mt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl">
              <span className="text-slate-400 block text-[9px] uppercase">Total Employees</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{ceoAnalytics?.resource_utilization?.total_employees || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl">
              <span className="text-slate-400 block text-[9px] uppercase">Billable</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{ceoAnalytics?.resource_utilization?.billable_employees || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl">
              <span className="text-slate-400 block text-[9px] uppercase">On Bench</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{ceoAnalytics?.resource_utilization?.bench_employees || 0}</span>
            </div>
          </div>
        </div>

        {/* Financial Overview Sparklines */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Financial Overview</h4>
            <button onClick={() => router.push('/invoice')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Financial Report <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {finCards.map((finCard, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-2xl border dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left">
                <div className="space-y-1.5 text-left flex-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">{finCard.label}</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-101">{finCard.value}</span>
                </div>
                <div className="w-[80px] h-[30px] ml-2">
                  <Chart options={financialSparklineOpts(finCard.color)} series={[{ name: finCard.label, data: finCard.data }]} type="line" height={30} width={80} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
