'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PeriodFilter, PeriodPreset } from '@/components/ui/PeriodFilter';
import {
  Trophy,
  XCircle,
  TrendingUp,
  FileText,
  Target,
  TrendingDown,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp as WinRateIcon
} from 'lucide-react';

// Dynamically import ApexCharts to avoid Next.js SSR hydration mismatch issues
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

// Format numbers as Indian Rupees (e.g. ₹ 3,12,40,000)
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export default function WonLostAnalysisPage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState<PeriodPreset | string>('Custom');

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

  const [activeTab, setActiveTab] = useState<'overview' | 'won' | 'lost' | 'reasons' | 'compare'>('overview');
  const [timeframe, setTimeframe] = useState<'6months' | '12months'>('6months');

  // Pagination for Recent Deals Table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'won', label: 'Won Analysis' },
    { id: 'lost', label: 'Lost Analysis' },
    { id: 'reasons', label: 'Reasons Analysis' },
    { id: 'compare', label: 'Compare' }
  ] as const;

  // KPI Metrics (matching Slide 12 top banner & user's screenshot)
  const kpis = [
    {
      label: 'Won Deals',
      count: '128',
      value: 31240000,
      change: '18.6% vs last period',
      isPositive: true,
      icon: Trophy,
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-500',
      themeColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Lost Deals',
      count: '74',
      value: 12860000,
      change: '9.4% vs last period',
      isPositive: false,
      icon: XCircle,
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      iconColor: 'text-rose-500',
      themeColor: 'text-rose-600 dark:text-rose-400'
    },
    {
      label: 'Win Rate',
      count: '63.3%',
      value: null,
      change: '7.8% vs last period',
      isPositive: true,
      icon: WinRateIcon,
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-500',
      themeColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Total Deals',
      count: '202',
      value: 44100000,
      change: '9.7% vs last period',
      isPositive: true,
      icon: FileText,
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-500',
      themeColor: 'text-purple-650 dark:text-purple-400'
    },
    {
      label: 'Avg. Deal Size (Won)',
      count: null,
      value: 2440000,
      change: '11.3% vs last period',
      isPositive: true,
      icon: Target,
      bg: 'bg-amber-50 dark:bg-amber-955/20',
      iconColor: 'text-amber-500',
      themeColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Avg. Deal Size (Lost)',
      count: null,
      value: 1736000,
      change: '6.5% vs last period',
      isPositive: false,
      icon: TrendingDown,
      bg: 'bg-cyan-50 dark:bg-cyan-950/20',
      iconColor: 'text-cyan-500',
      themeColor: 'text-cyan-600 dark:text-cyan-400'
    }
  ];

  // 1. Won vs Lost Deals Over Time (Line Chart options)
  const wonVsLostTimeOpts = {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: [3, 3], curve: 'smooth' as const },
    colors: ['#10B981', '#EF4444'], // Emerald (Won) and Rose (Lost)
    xaxis: {
      categories: ['Dec 2023', 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024'],
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    yaxis: {
      min: 0,
      max: 30,
      tickAmount: 3,
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { show: false },
    markers: { size: 4, strokeWidth: 1, hover: { size: 6 } },
    dataLabels: { enabled: false }
  };

  const wonVsLostTimeSeries = [
    { name: 'Won Deals', data: [15, 18, 22, 20, 25, 28] },
    { name: 'Lost Deals', data: [12, 15, 10, 13, 11, 13] }
  ];

  // 2. Deals by Outcome Donut Chart
  const dealsOutcomeDonutOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Won Deals', 'Lost Deals'],
    colors: ['#10B981', '#EF4444'],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['#ffffff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Deals',
              formatter: () => '202',
              style: { fontSize: '11px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: (val: any) => val
            }
          }
        }
      }
    }
  };

  // 3. Win Rate Trend (%) Line Chart
  const winRateTrendOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 2.5, curve: 'smooth' as const },
    colors: ['#3B82F6'],
    xaxis: {
      categories: ['Dec 2023', 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024'],
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: {
        formatter: (val: number) => `${val}%`,
        style: { colors: '#94A3B8', fontSize: '10px' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    markers: { size: 4, strokeWidth: 1 },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      style: { fontSize: '10px', colors: ['#1E293B'] },
      background: { enabled: false }
    }
  };

  const winRateTrendSeries = [
    { name: 'Win Rate (%)', data: [52, 55, 68, 61, 65, 63] }
  ];

  // 4. Won / Lost by Deal Stage Grouped Column Chart
  const wonLostStageOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#10B981', '#EF4444'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4,
        dataLabels: { position: 'top' }
      }
    },
    xaxis: {
      categories: ['Qualification', 'Needs Analysis', 'Proposal/Quote', 'Negotiation', 'Closed Won / Lost'],
      labels: { style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 600 } }
    },
    yaxis: {
      min: 0,
      max: 40,
      tickAmount: 4,
      labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      offsetY: -16,
      style: { fontSize: '10px', colors: ['#475569'], fontWeight: 'bold' }
    }
  };

  const wonLostStageSeries = [
    { name: 'Won Deals', data: [18, 25, 32, 28, 25] },
    { name: 'Lost Deals', data: [12, 15, 20, 18, 9] }
  ];

  // 5. Top Reasons for Lost Deals
  const lostReasons = [
    { reason: 'Price Too High', count: 22, percentage: 29.7 },
    { reason: 'Chose Competitor', count: 18, percentage: 24.3 },
    { reason: 'No Budget', count: 12, percentage: 16.2 },
    { reason: 'Requirements Changed', count: 8, percentage: 10.8 },
    { reason: 'Lost to Inaction', count: 6, percentage: 8.1 },
    { reason: 'Other', count: 8, percentage: 10.8 }
  ];

  // 6. Won vs Lost by Source
  const sourceDeals = [
    { source: 'Website', won: 38, lost: 16 },
    { source: 'Referral', won: 28, lost: 12 },
    { source: 'LinkedIn', won: 22, lost: 10 },
    { source: 'Email Campaign', won: 18, lost: 12 },
    { source: 'Phone Inquiry', won: 12, lost: 8 },
    { source: 'Other', won: 10, lost: 6 }
  ];

  // 7. Recent Won / Lost Deals Table Data
  const recentDeals = [
    {
      id: 1,
      dealName: 'Cloud Migration Services',
      account: 'TechNova Solutions',
      stage: 'Closed Won',
      value: 4800000,
      outcome: 'Won',
      reason: '-',
      closedDate: 'May 20, 2024',
      owner: { name: 'Ajay Kumar', role: 'Admin', avatarColor: 'bg-emerald-500' }
    },
    {
      id: 2,
      dealName: 'CRM Implementation',
      account: 'BrightWay Enterprises',
      stage: 'Closed Lost',
      value: 3250000,
      outcome: 'Lost',
      reason: 'Chose Competitor',
      closedDate: 'May 19, 2024',
      owner: { name: 'Priya Sharma', role: 'Sales Rep', avatarColor: 'bg-amber-500' }
    },
    {
      id: 3,
      dealName: 'IT Support Services',
      account: 'HexaTech Pvt. Ltd.',
      stage: 'Closed Won',
      value: 2675000,
      outcome: 'Won',
      reason: '-',
      closedDate: 'May 18, 2024',
      owner: { name: 'Rahul Verma', role: 'Sales Rep', avatarColor: 'bg-blue-500' }
    },
    {
      id: 4,
      dealName: 'Software Development',
      account: 'NextGen Retail',
      stage: 'Closed Lost',
      value: 2140000,
      outcome: 'Lost',
      reason: 'Price Too High',
      closedDate: 'May 17, 2024',
      owner: { name: 'Neha Singh', role: 'Sales Rep', avatarColor: 'bg-purple-500' }
    }
  ];

  // Export handler
  const handleExport = () => {
    alert('Exporting Won / Lost Analysis Report...');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex items-start justify-between flex-wrap gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-2">
            Won / Lost Analysis
          </h1>
          <p className="text-sm text-slate-450 mt-1">
            Analyze won and lost deals to identify trends, reasons and improve future outcomes.
          </p>
        </div>

        {/* Date Selector & Export Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodFilter
            value={dateRange}
            period={period}
            onChange={(newRange, newPeriod) => {
              setDateRange(newRange);
              setPeriod(newPeriod);
            }}
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:bg-slate-50 border dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-450" />
            Export Report
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-black transition-all border-b-2 cursor-pointer ${activeTab === t.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold scale-[1.02]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Dashboard metrics banner */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((k, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left transition-all hover:scale-[1.01]"
              >
                <div className="space-y-1 w-full">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                    {k.label}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {k.count && (
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        {k.count}
                      </h3>
                    )}
                    {k.value !== null && (
                      <span className={`text-[12px] font-black tracking-tight ${k.count ? 'text-slate-500 dark:text-slate-400' : 'text-xl text-slate-850 dark:text-slate-100 font-black'}`}>
                        {formatINR(k.value)}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold flex items-center gap-1 ${k.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <span>{k.isPositive ? '↑' : '↓'}</span>
                    <span>{k.change}</span>
                  </span>
                </div>
                <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${k.bg} ${k.iconColor}`}>
                  <k.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Row 1: Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Won vs Lost Deals Over Time */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-850 dark:text-slate-200">Won vs Lost Deals Over Time</h4>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Won Deals</span>
                      <span className="flex items-center gap-1.5 text-rose-500"><span className="h-2 w-2 rounded-full bg-rose-500" /> Lost Deals</span>
                    </div>
                  </div>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="text-[10px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg text-slate-500 focus:outline-none"
                  >
                    <option value="6months">Last 6 Months</option>
                    <option value="12months">Last 12 Months</option>
                  </select>
                </div>
                <div className="h-[200px] flex items-center justify-center">
                  <Chart options={wonVsLostTimeOpts} series={wonVsLostTimeSeries} type="area" height="200" />
                </div>
              </div>
            </div>

            {/* Chart 2: Deals by Outcome Donut */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-4">Deals by Outcome</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="h-[170px] flex items-center justify-center md:col-span-5">
                    <Chart options={dealsOutcomeDonutOpts} series={[128, 74]} type="donut" height="170" />
                  </div>
                  {/* Customized visual details legend matching the image */}
                  <div className="md:col-span-7 space-y-3 pl-2 text-left">
                    <div className="border-l-4 border-emerald-500 pl-3.5 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Won Deals</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">128</span>
                        <span className="text-[10px] font-bold text-emerald-600">(63.3%)</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{formatINR(31240000)}</span>
                    </div>

                    <div className="border-l-4 border-rose-500 pl-3.5 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Lost Deals</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">74</span>
                        <span className="text-[10px] font-bold text-rose-500">(36.7%)</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{formatINR(12860000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Win Rate Trend (%) */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black text-slate-850 dark:text-slate-200">Win Rate Trend (%)</h4>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="text-[10px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg text-slate-500 focus:outline-none"
                  >
                    <option value="6months">Last 6 Months</option>
                    <option value="12months">Last 12 Months</option>
                  </select>
                </div>
                <div className="h-[200px] flex items-center justify-center">
                  <Chart options={winRateTrendOpts} series={winRateTrendSeries} type="line" height="200" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 4: Won / Lost by Deal Stage */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-200">Won / Lost by Deal Stage</h4>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Won</span>
                  <span className="flex items-center gap-1.5 text-rose-500"><span className="h-2 w-2 rounded-full bg-rose-500" /> Lost</span>
                </div>
              </div>
              <div className="h-[230px] flex items-center justify-center">
                <Chart options={wonLostStageOpts} series={wonLostStageSeries} type="bar" height="230" />
              </div>
            </div>

            {/* Analysis 5: Top Reasons for Lost Deals */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-4">Top Reasons for Lost Deals</h4>
                <div className="overflow-hidden">
                  <table className="w-full text-xs text-slate-700 dark:text-slate-350">
                    <thead>
                      <tr className="text-[10px] uppercase text-slate-400 font-extrabold text-left border-b dark:border-slate-800 pb-2">
                        <th className="pb-2 w-[40%]">Reason</th>
                        <th className="pb-2 w-[30%]">Visual Indicator</th>
                        <th className="pb-2 text-right">Deals</th>
                        <th className="pb-2 text-right">% of Lost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-850">
                      {lostReasons.map((r, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="py-2.5 font-bold text-slate-700 dark:text-slate-350">{r.reason}</td>
                          <td className="py-2.5">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full"
                                style={{ width: `${r.percentage}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2.5 font-black text-right">{r.count}</td>
                          <td className="py-2.5 font-bold text-right text-slate-500">{r.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-black">
                <span className="text-slate-400 font-bold">Total Lost Deals</span>
                <span className="text-rose-500 font-black">74 Deals (100%)</span>
              </div>
            </div>

            {/* Analysis 6: Won vs Lost by Source */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-4">Won vs Lost by Source</h4>
                <div className="space-y-3.5">
                  {sourceDeals.map((s, index) => {
                    const total = s.won + s.lost;
                    const wonPercentage = (s.won / (total || 1)) * 100;
                    const lostPercentage = (s.lost / (total || 1)) * 100;

                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                          <span>{s.source}</span>
                          <div className="flex gap-3 text-[10px]">
                            <span className="text-emerald-600 font-black">Won: {s.won}</span>
                            <span className="text-rose-500 font-black">Lost: {s.lost}</span>
                          </div>
                        </div>
                        {/* Custom horizontal parallel bar indicators (green vs red) */}
                        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div
                            className="bg-emerald-500 rounded-l-full h-full transition-all"
                            style={{ width: `${wonPercentage}%` }}
                          />
                          <div
                            className="bg-rose-500 rounded-r-full h-full transition-all"
                            style={{ width: `${lostPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
                <span className="text-slate-400 font-medium">Outcomes based on lead channel</span>
                <a href="#" className="flex items-center gap-1 font-black">Source Insights <ArrowRight className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          </div>

          {/* Row 3: Recent Won / Lost Deals Table */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
              <h4 className="text-base font-black text-slate-850 dark:text-slate-100">Recent Won / Lost Deals</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-450 font-bold">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg text-slate-650 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-xs text-slate-455 font-bold">per page</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-700 dark:text-slate-350">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                    <th className="pb-3">Deal Name</th>
                    <th className="pb-3">Account</th>
                    <th className="pb-3">Deal Stage</th>
                    <th className="pb-3">Deal Value</th>
                    <th className="pb-3">Outcome</th>
                    <th className="pb-3">Reason (If Lost)</th>
                    <th className="pb-3">Closed Date</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {recentDeals.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3.5 font-bold text-slate-850 dark:text-slate-100">{row.dealName}</td>
                      <td className="py-3.5 text-slate-450 font-semibold">{row.account}</td>
                      <td className="py-3.5 font-bold text-slate-500">{row.stage}</td>
                      <td className="py-3.5 font-black text-slate-850 dark:text-slate-100">
                        {formatINR(row.value)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.outcome === 'Won'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-900/60'
                            }`}
                        >
                          {row.outcome}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-450 font-semibold">{row.reason}</td>
                      <td className="py-3.5 font-bold text-slate-500">{row.closedDate}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${row.owner.avatarColor}`}>
                            {row.owner.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-850 dark:text-slate-200 leading-none">{row.owner.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{row.owner.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t dark:border-slate-800 flex-wrap gap-3">
              <span className="text-xs text-slate-450 font-bold">
                Showing 1 to {recentDeals.length} of {recentDeals.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-7 w-7 rounded-lg border dark:border-slate-850 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-450 hover:text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-7 w-7 rounded-lg border dark:border-slate-850 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-450 hover:text-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis View Panels */}
      {activeTab === 'won' && (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Won Deals Deep Dive</h3>
              <p className="text-xs text-slate-450 mt-1">Detailed analysis of successful conversions and speed to close.</p>
            </div>
            <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center rounded-2xl">
              <Trophy className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Avg. Velocity to Win</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">18.4 Days</h4>
              <p className="text-[10px] text-emerald-600 mt-1 font-bold">↓ 2.1 days faster than last month</p>
            </div>
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Top Win Rep</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">Ajay Kumar</h4>
              <p className="text-[10px] text-slate-450 mt-1 font-bold">24 deals successfully closed</p>
            </div>
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Won conversion target</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">94.8% of Quota</h4>
              <p className="text-[10px] text-emerald-600 mt-1 font-bold">↑ 4.2% higher achievement rate</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-emerald-400">
              <strong>Key Success Factor:</strong> Deals that completed 'Needs Analysis' within 5 days had a 72% higher chance of being marked Closed Won.
            </span>
          </div>
        </div>
      )}

      {activeTab === 'lost' && (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Lost Deals Deep Dive</h3>
              <p className="text-xs text-slate-450 mt-1">Analysis of stalled deals, dropped pipelines, and early dropouts.</p>
            </div>
            <div className="h-9 w-9 bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center rounded-2xl">
              <XCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Avg. Days to Lose</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">29.1 Days</h4>
              <p className="text-[10px] text-rose-500 mt-1 font-bold">↑ 4.5 days longer stall period</p>
            </div>
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Critical Stage Loss</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">Proposal/Quote</h4>
              <p className="text-[10px] text-slate-450 mt-1 font-bold">20 deals lost in this stage (27% drop)</p>
            </div>
            <div className="border dark:border-slate-800 p-4 rounded-xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Loss Revenue Impact</span>
              <h4 className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{formatINR(12860000)}</h4>
              <p className="text-[10px] text-rose-500 mt-1 font-bold">↓ 9.4% value variation vs last quarter</p>
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-rose-450">
              <strong>Risk Warning:</strong> 34% of lost deals did not have any follow-up emails sent in the last 10 days before they stalled.
            </span>
          </div>
        </div>
      )}

      {activeTab === 'reasons' && (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Reasons Analysis</h3>
              <p className="text-xs text-slate-450 mt-1">Detailed breakdown of loss tags to prevent future deal degradation.</p>
            </div>
            <div className="h-9 w-9 bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center rounded-2xl">
              <WinRateIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border dark:border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Competitive losses</h4>
              <p className="text-xs text-slate-450">Deals lost specifically to competitive bids represents 24.3% of losses. Our average discount margin was 8% below competitors.</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] font-black text-slate-450 uppercase block">Action Plan recommendation</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-1">Increase deal-value communication during initial Qualification call.</span>
              </div>
            </div>

            <div className="border dark:border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Price sensitivity</h4>
              <p className="text-xs text-slate-450">Pricing remains the primary loss reason (29.7%). Small/Medium account brackets show a higher susceptibility to price sensitivity.</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] font-black text-slate-450 uppercase block">Pricing Adjustments</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-1">Introduce multi-tiered packaging with cheaper entry-level tiers.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Won vs Lost Comparative Dashboard</h3>
              <p className="text-xs text-slate-450 mt-1">Compare performance factors across periods, regions, or sizes.</p>
            </div>
            <div className="h-9 w-9 bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center rounded-2xl">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 dark:text-slate-350">
              <thead>
                <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                  <th className="pb-3">Dimension</th>
                  <th className="pb-3">Won Deals (128)</th>
                  <th className="pb-3">Lost Deals (74)</th>
                  <th className="pb-3">Win Rate %</th>
                  <th className="pb-3">Average Value Won</th>
                  <th className="pb-3">Average Value Lost</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-850">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="py-3.5 font-bold">Enterprise Accounts</td>
                  <td className="py-3.5 font-black text-emerald-600">42 Deals</td>
                  <td className="py-3.5 font-black text-rose-500">18 Deals</td>
                  <td className="py-3.5 font-bold">70.0%</td>
                  <td className="py-3.5">{formatINR(4200000)}</td>
                  <td className="py-3.5">{formatINR(2800000)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="py-3.5 font-bold">Mid-Market Accounts</td>
                  <td className="py-3.5 font-black text-emerald-600">58 Deals</td>
                  <td className="py-3.5 font-black text-rose-500">32 Deals</td>
                  <td className="py-3.5 font-bold">64.4%</td>
                  <td className="py-3.5">{formatINR(2200000)}</td>
                  <td className="py-3.5">{formatINR(1500000)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="py-3.5 font-bold">SMB Accounts</td>
                  <td className="py-3.5 font-black text-emerald-600">28 Deals</td>
                  <td className="py-3.5 font-black text-rose-500">24 Deals</td>
                  <td className="py-3.5 font-bold">53.8%</td>
                  <td className="py-3.5">{formatINR(980000)}</td>
                  <td className="py-3.5">{formatINR(850000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
