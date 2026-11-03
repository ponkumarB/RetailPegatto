'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import {
  DollarSign, Target, Briefcase, Sparkles, Percent, Users,
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

export default function SalesTrendPage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');

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

  const [timePeriodFilter, setTimePeriodFilter] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  // KPI Metrics (matching Slide 11 top banner)
  const kpis = [
    { label: 'Total Revenue (YTD)', value: '₹ 12.45 Cr', change: '18.7% vs last year', isPositive: true, icon: DollarSign, bg: 'bg-blue-50 dark:bg-blue-950/30', col: 'text-blue-600' },
    { label: 'Revenue This Month', value: '₹ 1.24 Cr', change: '15.3% vs last month', isPositive: true, icon: Target, bg: 'bg-emerald-50 dark:bg-emerald-950/30', col: 'text-emerald-600' },
    { label: 'Forecast (Next 3 Months)', value: '₹ 4.85 Cr', change: '22.4% vs this month', isPositive: true, icon: Briefcase, bg: 'bg-purple-50 dark:bg-purple-950/30', col: 'text-purple-600' },
    { label: 'Avg Deal Size', value: '₹ 3.45 L', change: '8.5% vs last month', isPositive: true, icon: Sparkles, bg: 'bg-amber-50 dark:bg-amber-950/30', col: 'text-amber-600' },
    { label: 'Win Rate', value: '32.5%', change: '5.6% vs last month', isPositive: true, icon: Percent, bg: 'bg-teal-50 dark:bg-teal-950/30', col: 'text-teal-600' },
    { label: 'New Leads (This Month)', value: '256', change: '20.4% vs last month', isPositive: true, icon: Users, bg: 'bg-rose-50 dark:bg-rose-950/30', col: 'text-rose-600' }
  ];

  // Revenue Trend (Actual vs Forecasted Line Chart)
  const revenueTrendOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: [3, 3], curve: 'smooth' as const, dashArray: [0, 5] },
    colors: ['#0565FD', '#A5B4FC'],
    xaxis: {
      categories: ['Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025'],
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      title: { text: '₹ in Lakhs', style: { color: '#94A3B8', fontSize: '9px', fontWeight: 650 } },
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'left' as const }
  };

  // Sales Forecast Next 6 Months (Dual Axis Bar + Line Chart)
  const salesForecastOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#3B82F6', '#10B981'],
    stroke: { width: [0, 3] },
    plotOptions: {
      bar: {
        columnWidth: '40%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: ['May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025'],
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: [
      {
        title: { text: 'Forecast Revenue (₹ in Lakhs)', style: { color: '#3B82F6', fontSize: '9px', fontWeight: 650 } },
        labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
      },
      {
        opposite: true,
        title: { text: 'Confidence Level (%)', style: { color: '#10B981', fontSize: '9px', fontWeight: 650 } },
        max: 100,
        labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
      }
    ],
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const }
  };

  // Revenue by Time Period (Actual vs Forecast Columns)
  const timePeriodOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#0565FD', '#C7D2FE'],
    plotOptions: {
      bar: {
        columnWidth: '50%',
        borderRadius: 3
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { show: false }
  };

  // Forecast vs Target (Quarterly Line Chart)
  const forecastVsTargetOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: [2.5, 2.5, 3], curve: 'smooth' as const, dashArray: [5, 5, 0] },
    colors: ['#8B5CF6', '#EF4444', '#10B981'],
    xaxis: {
      categories: ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'],
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const }
  };

  // Pipeline Contribution to Forecast Donut
  const pipelineContribOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Commitment', 'Best Case', 'Pipeline', 'Pipeline Value'],
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#64748B'],
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
              label: 'Total Forecast',
              formatter: () => '₹ 4.85 Cr',
              style: { fontSize: '11px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 800,
              color: '#1E293B'
            }
          }
        }
      }
    }
  };

  const getGrowthDisplay = (changeStr: string) => {
    if (changeStr.toLowerCase().includes('vs')) {
      return changeStr.replace(/vs\s+.*/gi, `vs ${period}`);
    }
    return changeStr;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Sales Trend & Forecast
          </h1>
          <p className="text-sm text-slate-455 mt-1">Real-time insights and performance overview of sales activities</p>
        </div>

        {/* Date Filter & Toolbar */}
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

      {/* KPI Row (Exactly 6 cards from slide) */}
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
            <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${k.bg} ${k.col}`}>
              <k.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* First Row: Revenue Trend & Sales Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Left: Revenue Trend */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Revenue Trend</h4>
            <Chart
              options={revenueTrendOpts}
              series={[
                { name: 'Actual Revenue', type: 'line', data: [48, 72, 60, 80, 92, null, null, null, null] },
                { name: 'Forecasted Revenue', type: 'line', data: [null, null, null, null, 92, 85, 96, 90, 115] }
              ]}
              height="200"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t dark:border-slate-800 pt-4 mt-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">YTD (Actual)</span>
              <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">₹ 8.21 Cr</h5>
              <span className="text-[9px] text-emerald-600 font-bold">↑ +18.7% vs last YTD</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Forecast (3 Months)</span>
              <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">₹ 4.85 Cr</h5>
              <span className="text-[9px] text-emerald-600 font-bold">↑ +22.4% vs last mo</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">FY 2024-25 (Proj)</span>
              <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">₹ 13.06 Cr</h5>
              <span className="text-[9px] text-emerald-600 font-bold">↑ +20.1% vs FY24</span>
            </div>
          </div>
        </div>

        {/* Right: Sales Forecast Next 6 Months */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sales Forecast (Next 6 Months)</h4>
              <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">Next 6 Months</span>
            </div>
            <Chart
              options={salesForecastOpts}
              series={[
                { name: 'Forecast Revenue (L)', type: 'bar', data: [85, 96, 90, 115, 120, 110] },
                { name: 'Confidence Level (%)', type: 'line', data: [85, 78, 80, 90, 92, 88] }
              ]}
              height="200"
            />
          </div>
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            <span>High confidence in forecast accuracy based on historical data and pipeline strength.</span>
            <span className="text-blue-600 dark:text-blue-400 font-black text-sm">78%</span>
          </div>
        </div>
      </div>

      {/* Second Row: Time Period, Forecast vs Target, Pipeline Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left: Revenue by Time Period */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue by Time Period</h4>
              <div className="flex bg-slate-50 dark:bg-slate-850 p-0.5 rounded-lg border dark:border-slate-800">
                {(['Monthly', 'Quarterly', 'Yearly'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTimePeriodFilter(mode)}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-colors ${timePeriodFilter === mode ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400'
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <Chart
              options={timePeriodOpts}
              series={[
                { name: 'Actual', data: [45, 50, 58, 65, 72, 80, 85, null, null, null, null, null] },
                { name: 'Forecast', data: [45, 52, 60, 68, 76, 85, 90, 95, 100, 110, 115, 120] }
              ]}
              type="bar"
              height="180"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 pt-2 border-t dark:border-slate-800">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600 block"></span> Actual</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-200 block"></span> Forecast</span>
            <span className="text-blue-600">Best Month: Dec 2025 (₹ 1.20 Cr)</span>
          </div>
        </div>

        {/* Middle: Forecast vs Target */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Forecast vs Target</h4>
              <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">This Year</span>
            </div>
            <Chart
              options={forecastVsTargetOpts}
              series={[
                { name: 'Forecast Revenue', data: [3.0, 3.8, 4.5, 5.0] },
                { name: 'Target Revenue', data: [3.2, 4.0, 4.8, 5.2] },
                { name: 'Achieved Revenue', data: [3.2, 4.1, null, null] }
              ]}
              type="line"
              height="180"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 border-t dark:border-slate-800 pt-3 mt-1 text-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Target Q1-Q4</span>
              <h6 className="text-xs font-black text-slate-800 dark:text-slate-100">₹ 14.50 Cr</h6>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Forecast Q1-Q4</span>
              <h6 className="text-xs font-black text-slate-850 dark:text-slate-100">₹ 13.06 Cr</h6>
              <span className="text-[8px] text-blue-600 font-extrabold block">90% of Target</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Achieved Q1-Q2</span>
              <h6 className="text-xs font-black text-slate-800 dark:text-slate-100">₹ 10.60 Cr</h6>
              <span className="text-[8px] text-emerald-600 font-extrabold block">73% of Target</span>
            </div>
          </div>
        </div>

        {/* Right: Pipeline Contribution */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Pipeline Contribution to Forecast</h4>
            <div className="h-[160px] flex items-center justify-center">
              <Chart options={pipelineContribOpts} series={[1.80, 2.95, 3.20, 6.80]} type="donut" height="160" />
            </div>
          </div>
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            <div className="flex justify-between items-center">
              <span>Strong pipeline coverage:</span>
              <span className="text-emerald-600 dark:text-emerald-450 font-black text-sm">2.1x</span>
            </div>
            <p className="text-[10px] text-slate-400 font-normal mt-0.5">Pipeline of ₹ 6.80 Cr against forecast of ₹ 4.85 Cr.</p>
          </div>
        </div>
      </div>

      {/* Third Row: Top Opportunities Impacting Forecast & Recent Sales Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left Table: Top Opportunities Impacting Forecast */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Opportunities Impacting Forecast</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                  <th className="pb-2">Opportunity</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2">Stage</th>
                  <th className="pb-2">Expected Close</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Probability</th>
                  <th className="pb-2">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {[
                  { name: 'ERP Implementation', account: 'ABC Solutions', stage: 'Proposal/Quote', date: '25 May 2025', val: '₹ 45.0 L', prob: 80, impact: 'High', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' },
                  { name: 'Mobile App Development', account: 'XYZ Tech', stage: 'Needs Analysis', date: '30 May 2025', val: '₹ 24.2 L', prob: 60, impact: 'Medium', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' },
                  { name: 'CRM Integration', account: 'Global Corp', stage: 'Needs Analysis', date: '15 Jun 2025', val: '₹ 20.1 L', prob: 55, impact: 'Medium', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' },
                  { name: 'Cloud Migration', account: 'Softline Inc', stage: 'Proposal/Quote', date: '20 Jun 2025', val: '₹ 15.5 L', prob: 45, impact: 'Medium', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-850 dark:text-slate-100">{row.name}</td>
                    <td className="py-2.5 text-slate-450">{row.account}</td>
                    <td className="py-2.5 text-blue-600 font-bold">{row.stage}</td>
                    <td className="py-2.5 font-mono">{row.date}</td>
                    <td className="py-2.5 font-black text-slate-850 dark:text-slate-100">{row.val}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-6">{row.prob}%</span>
                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${row.prob}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${row.color}`}>{row.impact}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right timeline: Recent Sales Activities */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Recent Sales Activities</h4>
          <div className="space-y-4">
            {[
              { text: 'Proposal sent to ABC Solutions for ERP implementation', time: '2 hours ago', icon: Mail, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
              { text: 'Follow-up call with XYZ Tech completed', time: '4 hours ago', icon: Phone, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
              { text: 'New opportunity added for Mobile App Development', time: 'Yesterday', icon: Activity, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
              { text: 'Quote accepted by Global Corp', time: 'Yesterday', icon: Target, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
            ].map((act, idx) => (
              <div key={idx} className="flex gap-3 items-start border-b dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center ${act.color}`}>
                  <act.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{act.text}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
