'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import { fetchFromApi } from '@/service/apiClient';
import {
  DollarSign, Target, Briefcase, Percent, Users, Sparkles,
  RefreshCw, SlidersHorizontal, ArrowRight, Phone, Mail, Activity, ArrowUpRight
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

const formatRupee = (value: number) => {
  if (!value || value === 0) return '₹ 0';
  if (value >= 10000000) {
    return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹ ${(value / 100000).toFixed(2)} L`;
  }
  return `₹ ${value.toLocaleString('en-IN')}`;
};

export default function SalesPerformancePage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [revVsTargetData, setRevVsTargetData] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [activityPerformance, setActivityPerformance] = useState<any>(null);

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

  // Fetch sales performance analytics whenever the dateRange changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || '1') : '1';
        const dates = dateRange.split(' - ');
        const startDate = formatDateForApi(dates[0]) || '2026-01-01';
        const endDate = formatDateForApi(dates[1] || dates[0]) || '2026-06-30';

        const [analyticsRes, revVsTargetRes, topPerformersRes, revenueBySalesPersonRes, activityPerformanceRes] = await Promise.all([
          fetchFromApi(`/user/NewITSalesPerformanceAnalytics/?Organization_Id=${orgId}&Start_Date=${startDate}&End_Date=${endDate}`),
          fetchFromApi(`/user/NewITRevenuevstarget/?Organization_Id=${orgId}&Start_Date=${startDate}&End_Date=${endDate}`),
          fetchFromApi(`/user/NewITTopperformers/?Organization_Id=${orgId}&Start_Date=${startDate}&End_Date=${endDate}`),
          fetchFromApi(`/user/NewITRevenueBySalesPerson/?Organization_Id=${orgId}&Start_Date=${startDate}&End_Date=${endDate}`),
          fetchFromApi(`/user/NewITActivityperformance/?Organization_Id=${orgId}&Start_Date=${startDate}&End_Date=${endDate}`)
        ]);

        if (analyticsRes && analyticsRes.data) {
          setAnalyticsData(analyticsRes.data);
        } else {
          setError('Failed to fetch sales analytics data.');
        }

        if (revVsTargetRes && revVsTargetRes.status && revVsTargetRes.data) {
          setRevVsTargetData(revVsTargetRes.data.revenue_vs_target || []);
        } else {
          setRevVsTargetData([]);
        }

        if (topPerformersRes && topPerformersRes.data) {
          setTopPerformers(topPerformersRes.data.top_performers);
        }

        if (revenueBySalesPersonRes && revenueBySalesPersonRes.sales_persons) {
          setSalesPersons(revenueBySalesPersonRes.sales_persons);
        }

        if (activityPerformanceRes && activityPerformanceRes.data) {
          setActivityPerformance(activityPerformanceRes.data.activity_performance);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching sales performance analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  // Aggregate metrics summary from state
  const wonDealsVal = analyticsData?.summary?.won_deals ?? 0;
  const pipelineVal = analyticsData?.summary?.pipeline_val ?? 0;
  const weightedVal = analyticsData?.summary?.weighted_val ?? 0;
  const avgWinProb = analyticsData?.summary?.average_win_probablity ?? 0;
  const winRateVal = analyticsData?.summary?.win_rate ?? 0;
  const newLeadsVal = analyticsData?.summary?.new_leads ?? 0;

  // Sparkline data
  const sparklineData = [
    { label: 'Won Deals', value: String(wonDealsVal), data: [Math.round(wonDealsVal * 0.7), Math.round(wonDealsVal * 0.85), wonDealsVal], color: '#3B82F6' },
    { label: 'Pipeline Val', value: formatRupee(pipelineVal), data: [Math.round(pipelineVal * 0.7), Math.round(pipelineVal * 0.85), pipelineVal], color: '#10B981' },
    { label: 'Weighted Val', value: formatRupee(weightedVal), data: [Math.round(weightedVal * 0.7), Math.round(weightedVal * 0.85), weightedVal], color: '#8B5CF6' },
    { label: 'Avg Win Prob', value: `${avgWinProb}%`, data: [Math.round(avgWinProb * 0.7), Math.round(avgWinProb * 0.85), avgWinProb], color: '#F59E0B' },
    { label: 'Win Rate', value: `${winRateVal}%`, data: [Math.round(winRateVal * 0.7), Math.round(winRateVal * 0.85), winRateVal], color: '#06B6D4' },
    { label: 'New Leads', value: String(newLeadsVal), data: [Math.round(newLeadsVal * 0.7), Math.round(newLeadsVal * 0.85), newLeadsVal], color: '#EC4899' }
  ];

  // Calculate totals across team performance
  const teamPerformance = analyticsData?.team_performance || [];

  // Monthly Revenue vs Target (from dedicated API)
  const monthlyRevenueVsTarget = revVsTargetData || [];
  const totalRevVsTargetRevenue = monthlyRevenueVsTarget.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);
  const totalRevVsTargetTarget = monthlyRevenueVsTarget.reduce((acc: number, curr: any) => acc + (curr.target || 0), 0);
  const revVsTargetAchievedPct = totalRevVsTargetTarget > 0 ? Math.round((totalRevVsTargetRevenue / totalRevVsTargetTarget) * 100) : 0;

  const revVsTargetCategories = monthlyRevenueVsTarget.length > 0 ? monthlyRevenueVsTarget.map((u: any) => u.label) : ['No Data'];
  const revVsTargetAchieved = monthlyRevenueVsTarget.length > 0 ? monthlyRevenueVsTarget.map((u: any) => (u.revenue || 0) / 100000) : [0]; // in Lakhs
  const revVsTargetBudget = monthlyRevenueVsTarget.length > 0 ? monthlyRevenueVsTarget.map((u: any) => (u.target || 0) / 100000) : [0]; // in Lakhs

  // Revenue vs Target Chart Configs
  const revVsTargetOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: [0, 3], curve: 'smooth' as const },
    colors: ['#3B82F6', '#10B981'],
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: revVsTargetCategories,
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      title: { text: '₹ in Lakhs', style: { color: '#94A3B8', fontSize: '9px', fontWeight: 650 } },
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const }
  };

  // Chart Performers List (Top 5 by Revenue from team performance summary)
  const chartPerformers = [...teamPerformance]
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  const horizontalBarCategories = salesPersons.map((p: any) => p.sales_person);
  const horizontalBarData = salesPersons.map((p: any) => p.revenue / 100000); // in Lakhs

  // Revenue by Sales Person Horizontal Bar Chart
  const salespersonOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#0565FD'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '55%'
      }
    },
    xaxis: {
      categories: horizontalBarCategories,
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9' }
  };

  // Deals Won by Sales Person Chart
  const dealsWonOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: ['#3B82F6'],
    xaxis: {
      categories: chartPerformers.map((p: any) => p.user_name),
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 }
  };

  // Win Rate by Sales Person Chart
  const winRateOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: ['#06B6D4'],
    xaxis: {
      categories: chartPerformers.map((p: any) => p.user_name),
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 }
  };

  // Revenue by Product / Service Donut
  const productRevenue = analyticsData?.revenue_by_product_service || [];
  const productDonutLabels = productRevenue.map((p: any) => p.product);
  const productDonutSeries = productRevenue.map((p: any) => p.revenue);
  const totalProductRevenue = productRevenue.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);

  const productDonutOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: productDonutLabels.length > 0 ? productDonutLabels : ['No Product Data'],
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: () => formatRupee(totalProductRevenue),
              style: { fontSize: '11px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: (val: any) => formatRupee(Number(val))
            }
          }
        }
      }
    }
  };

  const recentWins = analyticsData?.recent_top_wins || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Sales Performance
          </h1>
          <p className="text-sm text-slate-450 mt-1">Monitor sales team achievements, won deals, and activity indexes</p>
        </div>

        {/* Date Filter */}
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

      {loading && !analyticsData ? (
        <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Fetching sales performance analytics...</p>
        </div>
      ) : error ? (
        <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3 text-red-500">
          <p className="text-sm font-semibold">Failed to load analytics: {error}</p>
          <button
            onClick={() => setDateRange(prev => prev + ' ')} // triggers refetch
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Sparkline Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sparklineData.map((s, idx) => {
              const sparklineOpts = {
                chart: { sparkline: { enabled: true } },
                stroke: { curve: 'smooth' as const, width: 2 },
                colors: [s.color],
                tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
              };
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-3 rounded-2xl shadow-xs text-left flex flex-col justify-between h-[120px]">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">{s.label}</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-black text-slate-850 dark:text-slate-100">{s.value}</span>
                    </div>
                  </div>
                  <div className="h-8 w-full mt-3">
                    <Chart options={sparklineOpts} series={[{ data: s.data }]} type="line" height="24" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 1: Revenue vs Target, Top Performers, Revenue by Sales Person */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Left: Revenue vs Target */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue vs Target</h4>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">This Period</span>
                </div>
                <Chart
                  options={revVsTargetOpts}
                  series={[
                    { name: 'Revenue Achieved', type: 'bar', data: revVsTargetAchieved },
                    { name: 'Target Revenue', type: 'line', data: revVsTargetBudget }
                  ]}
                  height="200"
                />
              </div>
              <div className="flex justify-between border-t dark:border-slate-800 pt-4 mt-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Revenue Achieved</span>
                  <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">{formatRupee(totalRevVsTargetRevenue)}</h5>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Target</span>
                  <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">{formatRupee(totalRevVsTargetTarget)}</h5>
                  {totalRevVsTargetTarget > 0 && (
                    <span className="text-[9px] text-blue-600 font-bold">{revVsTargetAchievedPct}% Target Achieved</span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Top Performers */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Performers</h4>
                <div className="space-y-3">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((p: any, idx: number) => {
                      const maxRevenue = topPerformers[0]?.revenue || 1;
                      const pctWidth = `${Math.max(5, Math.min(100, Math.round((p.revenue / maxRevenue) * 100)))}%`;
                      const pctDisplay = `${p.achievement}% Achieved`;
                      const color = p.achievement >= 100 ? 'bg-emerald-500' : 'bg-blue-500';

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-3 font-semibold text-slate-700 dark:text-slate-300">
                            <span>{p.user_name}</span>
                            <span className="text-slate-450">{formatRupee(p.revenue)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                              <div className={`h-full ${color}`} style={{ width: pctWidth }}></div>
                            </div>
                            <span className="text-[10px] font-black w-20 text-right text-slate-500 shrink-0">{pctDisplay}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-450 text-center py-6">No data available</div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Top 5 Members by Revenue</span>
              </div>
            </div>

            {/* Right: Revenue by Sales Person Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue by Sales Person</h4>
                <Chart
                  options={salespersonOpts}
                  series={[{ name: 'Revenue (L)', data: horizontalBarData }]}
                  type="bar"
                  height="200"
                />
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Lakhs (L) Achieved</span>
              </div>
            </div>
          </div>

          {/* Row 2: Deals Won, Win Rate Trend, Activity Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Deals Won */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Deals Won by Sales Person</h4>
                <Chart
                  options={dealsWonOpts}
                  series={[{ name: 'Deals Won', data: chartPerformers.map((p: any) => p.deals_won) }]}
                  type="line"
                  height="180"
                />
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Count of Deals</span>
              </div>
            </div>

            {/* Win Rate Trend */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Win Rate by Sales Person (%)</h4>
                <Chart
                  options={winRateOpts}
                  series={[{ name: 'Win Rate (%)', data: chartPerformers.map((p: any) => p.win_rate) }]}
                  type="line"
                  height="180"
                />
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Percentage Win Ratio</span>
              </div>
            </div>

            {/* Activity Performance Grid */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Activity Performance</h4>
                <div className="grid grid-cols-3 gap-3">
                  {activityPerformance ? [
                    { label: 'Calls', value: activityPerformance.calls },
                    { label: 'Meetings', value: activityPerformance.meetings },
                    { label: 'Activities', value: activityPerformance.activities },
                    { label: 'Tasks', value: activityPerformance.tasks },
                    { label: 'Notes', value: activityPerformance.notes },
                    { label: 'Project Tasks', value: activityPerformance.project_tasks },
                    { label: 'Mails', value: activityPerformance.mail }
                  ].map((act, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-2 border dark:border-slate-850 rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">{act.label}</span>
                      <h6 className="text-sm font-black text-slate-850 dark:text-slate-100 mt-1 leading-none">{act.value}</h6>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center text-xs text-slate-450 py-6">No data available</div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Activity Performance Metrics</span>
              </div>
            </div>
          </div>

          {/* Row 3: Team Performance Summary table, Product Donut, Recent Wins list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Table: Team Performance Summary */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Team Performance Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-700 dark:text-slate-350">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                        <th className="pb-2">Team Member</th>
                        <th className="pb-2">Revenue</th>
                        <th className="pb-2">Target</th>
                        <th className="pb-2">Achievement %</th>
                        <th className="pb-2">Deals Won</th>
                        <th className="pb-2">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {teamPerformance.length > 0 ? (
                        teamPerformance.map((row: any, idx: number) => {
                          const achVal = row.target > 0 ? Math.round((row.revenue / row.target) * 100) : row.achievement;
                          const achCol = achVal >= 100 ? 'text-emerald-600' : achVal >= 50 ? 'text-amber-600' : 'text-slate-500';
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                              <td className="py-2.5 font-bold text-slate-850 dark:text-slate-100">{row.user_name}</td>
                              <td className="py-2.5 font-black text-slate-850 dark:text-slate-100">{formatRupee(row.revenue)}</td>
                              <td className="py-2.5 text-slate-450">{formatRupee(row.target)}</td>
                              <td className={`py-2.5 font-black ${achCol}`}>{achVal}%</td>
                              <td className="py-2.5 font-bold text-center w-20">{row.deals_won} / {row.total_deals}</td>
                              <td className="py-2.5 font-mono">{row.win_rate}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">No team member performance record found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">Full team listings</span>
              </div>
            </div>

            {/* Column 2 & 3: Product Donut & Recent wins */}
            <div className="space-y-6">
              {/* Product Donut */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue by Product / Service</h4>
                <div className="h-[180px] flex items-center justify-center">
                  <Chart options={productDonutOpts} series={productDonutSeries.length > 0 ? productDonutSeries : [0]} type="donut" height="180" />
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-slate-400">
                  <span className="font-medium">Product performance distribution</span>
                </div>
              </div>

              {/* Recent Top Wins */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Recent Top Wins</h4>
                <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-350">
                  {recentWins.length > 0 ? (
                    recentWins.map((w: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center border-b dark:border-slate-800 pb-2 last:border-0 last:pb-0 text-left">
                        <div className="truncate pr-2 max-w-[70%]">
                          <span className="block truncate text-slate-800 dark:text-slate-200">{w.Deal_Name}</span>
                          <span className="block text-[10px] text-slate-400 font-medium truncate">{w.Account_Name} • {w.Won_Deal_Date || w.Created_Date}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-slate-850 dark:text-slate-100">{formatRupee(w.Amount)}</span>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">Won</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-450 text-center py-6">No recent wins recorded</div>
                  )}
                </div>
                <div className="flex justify-end mt-3 pt-3 border-t dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold">Top deals converted</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
