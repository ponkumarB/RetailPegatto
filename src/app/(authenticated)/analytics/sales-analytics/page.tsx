'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import {
  DollarSign, Briefcase, Users, Percent, Sparkles, RefreshCw, SlidersHorizontal,
  ArrowRight, Phone, Mail, Activity, Target
} from 'lucide-react';
import { 
  fetchNewITSalesAnalyticsDashboard,
  fetchNewITRevenueTrend,
  fetchNewITSalesPerformanceAnalytics,
  fetchNewITOpportunityPipeline,
  fetchNewITRevenueBySalesPerson
} from '@/service/api/Analytics/api';

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

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');
  const [data, setData] = useState<any>(null);
  const [revenueTrendData, setRevenueTrendData] = useState<any>(null);
  const [salesPerformanceData, setSalesPerformanceData] = useState<any>(null);
  const [opportunityPipelineData, setOpportunityPipelineData] = useState<any>(null);
  const [revenueBySalesPersonData, setRevenueBySalesPersonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          dashboardRes,
          revenueTrendRes,
          salesPerformanceRes,
          opportunityPipelineRes,
          revenueBySalesPersonRes
        ] = await Promise.all([
          fetchNewITSalesAnalyticsDashboard(),
          fetchNewITRevenueTrend(),
          fetchNewITSalesPerformanceAnalytics(),
          fetchNewITOpportunityPipeline(),
          fetchNewITRevenueBySalesPerson()
        ]);
        
        setData(dashboardRes);
        setRevenueTrendData(revenueTrendRes);
        setSalesPerformanceData(salesPerformanceRes);
        setOpportunityPipelineData(opportunityPipelineRes);
        setRevenueBySalesPersonData(revenueBySalesPersonRes);
      } catch (error) {
        console.error('Failed to fetch sales analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // KPI Metrics
  const formatValue = (val: number | undefined, fallback: string) => (val !== undefined ? val.toLocaleString() : fallback);
  const formatCurrency = (val: number | undefined, fallback: string) => (val !== undefined ? `₹ ${val.toLocaleString()}` : fallback);
  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(data?.cards?.total_revenue, '₹ 0'), change: '', isPositive: true, icon: DollarSign, iconBg: 'bg-blue-50 dark:bg-blue-950/30', iconCol: 'text-blue-600' },
    { label: 'Won Revenue', value: formatCurrency(data?.cards?.won_revenue, '₹ 0'), change: '', isPositive: true, icon: Target, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30', iconCol: 'text-emerald-600' },
    { label: 'Open Opportunities', value: formatValue(data?.cards?.open_opportunities, '0'), change: '', isPositive: true, icon: Briefcase, iconBg: 'bg-indigo-50 dark:bg-indigo-950/30', iconCol: 'text-indigo-600' },
    { label: 'Win Rate', value: data?.cards?.win_rate !== undefined ? `${data.cards.win_rate}%` : '0%', change: '', isPositive: true, icon: Percent, iconBg: 'bg-purple-50 dark:bg-purple-950/30', iconCol: 'text-purple-600' },
    { label: 'New Leads', value: formatValue(data?.cards?.new_leads, '0'), change: '', isPositive: true, icon: Users, iconBg: 'bg-teal-50 dark:bg-teal-950/30', iconCol: 'text-teal-600' },
    { label: 'Avg Deal Size', value: formatCurrency(data?.cards?.avg_deal_size, '₹ 0'), change: '', isPositive: true, icon: Sparkles, iconBg: 'bg-amber-50 dark:bg-amber-950/30', iconCol: 'text-amber-600' }
  ];

  // Revenue Trend Area Chart
  const trendCategories = revenueTrendData?.revenue_trend?.map((item: any) => item.period) || [];
  const trendData = revenueTrendData?.revenue_trend?.map((item: any) => item.revenue) || [];

  const revenueTrendOpts = {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: ['#0565FD'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 }
    },
    xaxis: {
      categories: trendCategories,
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    yaxis: { 
      labels: { 
        style: { colors: '#94A3B8', fontSize: '10px' },
        formatter: (val: number) => `₹ ${val.toLocaleString()}` 
      } 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    tooltip: { theme: 'light', y: { formatter: (val: number) => `₹ ${val.toLocaleString()}` } }
  };
  const revenueSeries = [{ name: 'Revenue', data: trendData }];

  // Revenue by Source Donut
  const revenueSourceLabels = data?.revenue_by_source?.length > 0 
    ? data.revenue_by_source.map((s: any) => s.source) 
    : [];
  
  const revenueSourceSeries = data?.revenue_by_source?.length > 0 
    ? data.revenue_by_source.map((s: any) => s.revenue) 
    : [];

  const totalRevSource = data?.cards?.total_revenue || 0;
  const totalRevSourceFormatted = totalRevSource >= 10000000 
    ? `${(totalRevSource / 10000000).toFixed(2)} Cr` 
    : `${(totalRevSource / 100000).toFixed(2)} L`;

  const revenueSourceOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: revenueSourceLabels,
    colors: ['#0565FD', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => `₹ ${val.toLocaleString()}` } },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: () => `₹ ${totalRevSourceFormatted}`,
              style: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: (val: number) => `₹ ${(val / 100000).toFixed(1)} L`
            }
          }
        }
      }
    }
  };

  // Sales by Product / Service Donut
  const salesProductOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: salesPerformanceData?.data?.revenue_by_product_service ? salesPerformanceData.data.revenue_by_product_service.map((i: any) => i.product) : [],
    colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => `₹ ${val.toLocaleString()}` } }
  };
  const salesProductSeries = salesPerformanceData?.data?.revenue_by_product_service ? salesPerformanceData.data.revenue_by_product_service.map((i: any) => i.revenue) : [];

  const getGrowthDisplay = (changeStr: string) => {
    if (changeStr.toLowerCase().includes('vs')) {
      return changeStr.replace(/vs\s+.*/gi, `vs ${period}`);
    }
    return changeStr;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Sales Analytics
          </h1>
          <p className="text-sm text-slate-450 mt-1">Real-time insights and performance overview of sales activities</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm font-bold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading dashboard...
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">{k.label}</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{k.value}</h3>
              <span className={`text-[10px] font-bold block ${k.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {k.isPositive ? '↑' : '↓'} {getGrowthDisplay(k.change)}
              </span>
            </div>
            <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${k.iconBg} ${k.iconCol}`}>
              <k.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* 3-Column Layout matching Slide 10 exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

        {/* Column 1: Revenue Trend, Revenue by Sales Person, Top Open Opportunities */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue Trend</h4>
            <Chart options={revenueTrendOpts} series={[{ name: 'Revenue', data: trendData }]} type="area" height="200" />
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue by Sales Person</h4>
            <div className="space-y-3">
              {(() => {
                let list: any[] = [];
                if (revenueBySalesPersonData?.sales_persons?.length > 0) {
                  const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                  const topPerformers = [...revenueBySalesPersonData.sales_persons].sort((a: any, b: any) => b.revenue - a.revenue);
                  const maxRevenue = topPerformers[0]?.revenue || 1;
                  list = topPerformers.slice(0, 5).map((person: any, idx: number) => ({
                    name: person.sales_person,
                    val: `₹ ${(person.revenue / 100000).toFixed(1)} L`,
                    pct: `${Math.round((person.revenue / maxRevenue) * 100)}%`,
                    color: colors[idx % colors.length]
                  }));
                }
                return list.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{s.name}</span>
                      <span>{s.val}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: s.pct }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Top performers rollup</span>
              <a href="#" className="flex items-center gap-1">View All Sales Performance <ArrowRight className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Open Opportunities</h4>
            <div className="space-y-3.5">
              {(data?.top_open_opportunities?.length > 0 ? data.top_open_opportunities.map((op: any) => ({
                name: op.Deal_Name,
                owner: op.Account_Name || 'N/A',
                value: op.Amount ? `₹ ${op.Amount.toLocaleString()}` : '0',
                stage: op.Deal_Stage
              })) : []).map((op: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center border-b dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate w-[140px]" title={op.name}>{op.name}</h5>
                    <span className="text-[10px] text-slate-400">Owner: {op.owner}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{op.value}</span>
                    <span className="text-[9px] block text-blue-600 font-bold uppercase">{op.stage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Revenue by Source, Sales by Product, Revenue vs Target */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue by Source</h4>
            <div className="h-[180px] flex items-center justify-center">
              <Chart options={revenueSourceOpts} series={revenueSourceSeries} type="donut" height="180" />
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Channel distributions</span>
              <a href="#" className="flex items-center gap-1">View Source Report <ArrowRight className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Sales by Product / Service</h4>
            <div className="h-[180px] flex items-center justify-center">
              <Chart options={salesProductOpts} series={salesProductSeries} type="donut" height="180" />
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Product performance</span>
              <a href="#" className="flex items-center gap-1">View Product Report <ArrowRight className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue vs Target</h4>
            <div className="text-center my-auto py-4">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-8 border-indigo-600 text-xl font-black text-slate-800 dark:text-slate-100">{data?.revenue_vs_target?.achievement_percentage !== undefined ? `${data.revenue_vs_target.achievement_percentage}%` : '78%'}</div>
              <span className="text-xs font-bold text-slate-400 block mt-3">Target: {data?.revenue_vs_target?.target_amount !== undefined ? `₹ ${data.revenue_vs_target.target_amount.toLocaleString()}` : '1.60 Cr'} | Achieved: {data?.revenue_vs_target?.achieved_amount !== undefined ? `₹ ${data.revenue_vs_target.achieved_amount.toLocaleString()}` : '1.24 Cr'}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Opportunity Pipeline, Leads to Revenue Conversion, Recent Sales Activities */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Opportunity Pipeline</h4>
            <div className="space-y-3.5 my-auto text-left">
              {(() => {
                let pipelineList: any[] = [];
                if (opportunityPipelineData?.pipeline) {
                  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500', 'bg-teal-500', 'bg-purple-500', 'bg-cyan-500'];
                  const total = opportunityPipelineData.total_opportunities || 1;
                  const activeStages = opportunityPipelineData.pipeline.filter((item: any) => item.count > 0);
                  if (activeStages.length > 0) {
                    pipelineList = activeStages.map((item: any, idx: number) => ({
                      stage: item.Deal_Stage,
                      val: `${item.count} Opportunities`,
                      pct: `${Math.round((item.count / total) * 100)}%`,
                      bg: colors[idx % colors.length]
                    }));
                  }
                }
                return pipelineList.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                      <span>{s.stage}</span>
                      <span>{s.val} ({s.pct})</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${s.bg}`} style={{ width: s.pct }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Conversion funnel</span>
              <a href="#" className="flex items-center gap-1">View Pipeline Report <ArrowRight className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Leads to Revenue Conversion</h4>
            {data?.lead_conversion ? (
              <div className="space-y-3 font-bold text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <span>Total Leads</span>
                  <span className="text-slate-850 dark:text-slate-100 font-extrabold">{data.lead_conversion.total_leads || 0}</span>
                </div>
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <span>Qualified Leads</span>
                  <span className="text-slate-850 dark:text-slate-100 font-extrabold">{data.lead_conversion.qualified_leads || 0}</span>
                </div>
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <span>Qualified Percentage</span>
                  <span className="text-blue-600 font-extrabold">{data.lead_conversion.qualified_percentage || 0}%</span>
                </div>
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <span>Opportunities</span>
                  <span className="text-slate-850 dark:text-slate-100 font-extrabold">{data.lead_conversion.opportunities || 0}</span>
                </div>
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <span>Won Deals</span>
                  <span className="text-emerald-600 font-extrabold">{data.lead_conversion.won_deals || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Revenue</span>
                  <span className="text-slate-850 dark:text-slate-100 font-extrabold">₹ {data.lead_conversion.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs font-bold text-slate-500">No lead conversion data available</div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
              <span className="text-slate-400 font-medium">Campaign success</span>
              <a href="#" className="flex items-center gap-1">View Conversion Report <ArrowRight className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Recent Sales Activities</h4>
            <div className="space-y-3.5">
              {(data?.recent_activities?.length > 0 ? data.recent_activities.map((act: any) => ({
                label: act.Deal_Name,
                time: `${act.Deal_Stage} - ${act.Created_Date}`,
                icon: Activity,
                color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20'
              })) : []).map((act: any, idx: number) => (
                <div key={idx} className="flex gap-3 items-start border-b dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                  <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center ${act.color}`}>
                    <act.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{act.label}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
}
