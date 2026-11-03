'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAnalysticActivityOverview } from '@/service/api/Analytics/api';
import { fetchUsersList } from '@/service/api/Leads/api';
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
  TrendingUp,
  Calendar,
  Phone,
  BarChart3,
  RefreshCw,
  Video,
  Award,
  ArrowUpRight,
  ArrowDownRight
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

export default function ActivityOverviewPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [userid, setUserid] = useState<string>('all');

  const [users, setUsers] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);

  // Targets for Radial Gauges
  const CALL_DURATION_TARGET = 100; // minutes
  const DEMO_COUNT_TARGET = 10;

  // Fetch user list (Sales Owners)
  useEffect(() => {
    setIsUsersLoading(true);
    fetchUsersList()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        setUsers(list);
      })
      .catch((err) => {
        console.error('Failed to fetch users list', err);
        toast.error('Failed to load Sales Owners.');
      })
      .finally(() => {
        setIsUsersLoading(false);
      });
  }, []);

  // Fetch activity overview data
  const loadActivityData = useCallback(async () => {
    setIsLoading(true);
    try {
      let apiUserId: string | number = 'all';
      if (userid !== 'all') {
        const found = users.find((u) => {
          const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
          return name === userid;
        });
        if (found) {
          apiUserId = Number(found.id);
        }
      }

      const res = await fetchAnalysticActivityOverview({
        Is_Deleted: false,
        fromdate,
        todate,
        userid: apiUserId
      });
      setActivityData(res);
    } catch (err) {
      console.error('Failed to fetch activity overview analytics', err);
      toast.error('Failed to load Activity Overview data.');
      setActivityData(null);
    } finally {
      setIsLoading(false);
    }
  }, [fromdate, todate, userid, users]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

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
    if (!activityData) {
      toast.warning('No data available to export.');
      return;
    }
    const headers = ['Metric', 'Current Period Value', 'Previous Period Value'];
    const rows = [
      ['Sales Closed (Invoices)', activityData.invoice_count || '0', '-'],
      ['Total Invoice Amount (INR)', activityData.total_invoice_amount || '0', '-'],
      ['Average Sales (INR)', activityData.Avg_sales || '0', '-'],
      ['Outbound Calls Duration (Min)', activityData.current_total_call_duration || '0', activityData.previous_total_call_duration || '0'],
      ['Demos Conducted', activityData.current_demo_count || '0', activityData.previous_demo_count || '0']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activity_overview_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // KPI Extractions
  const invoiceCount = activityData?.invoice_count ?? 0;
  const totalInvoiceAmount = activityData?.total_invoice_amount ?? 0;
  const avgSales = activityData?.Avg_sales ?? 0;
  
  const currentCallDuration = activityData?.current_total_call_duration ?? 0;
  const previousCallDuration = activityData?.previous_total_call_duration ?? 0;
  const diffCallPct = activityData?.percentage_diff_call_duration;

  const currentDemoCount = activityData?.current_demo_count ?? 0;
  const previousDemoCount = activityData?.previous_demo_count ?? 0;
  const diffDemoPct = activityData?.percentage_diff_demo_count;

  // radial percentage calculations
  const callsPct = Math.min((currentCallDuration / CALL_DURATION_TARGET) * 100, 100);
  const demosPct = Math.min((currentDemoCount / DEMO_COUNT_TARGET) * 100, 100);

  // Radial Bar / Semi-circle Gauge config
  const createGaugeOptions = (title: string, value: number, target: number, color: string) => ({
    chart: {
      type: 'radialBar' as const,
      sparkline: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: '#f1f5f9',
          strokeWidth: '97%',
          margin: 5
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '11px',
            color: '#64748B',
            offsetY: 20
          },
          value: {
            offsetY: -15,
            fontSize: '24px',
            fontWeight: '900',
            color: '#1E293B',
            formatter: () => `${value}`
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10,
        bottom: 15
      }
    },
    fill: {
      colors: [color]
    },
    stroke: {
      lineCap: 'round' as const
    },
    labels: [`Target: ${target}`]
  });

  // Vertical Bar Chart options (Calls by Company)
  const companyChartOptions = useMemo(() => {
    const companies = activityData?.Current_Total_Call_Duration || [];
    const categories = companies.map((c: any) => c.Company_Name || 'Unknown');

    return {
      chart: {
        type: 'bar' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '35%',
          distributed: true
        }
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px', fontWeight: 600 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { colors: '#94A3B8', fontSize: '10px' }
        }
      },
      grid: {
        borderColor: '#F8FAFC',
        strokeDashArray: 4,
        padding: { left: 10, right: 10 }
      },
      colors: ['#0EA5E9', '#6366F1', '#10B981', '#F59E0B'],
      legend: { show: false },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} minutes`
        }
      }
    };
  }, [activityData]);

  const companyChartSeries = useMemo(() => {
    const companies = activityData?.Current_Total_Call_Duration || [];
    const data = companies.map((c: any) => c.total_call_duration || 0);
    return [{ name: 'Call Duration', data }];
  }, [activityData]);

  // Outbound Calls Per Weekday (Area Chart options)
  const weekdayChartOptions = useMemo(() => {
    const weekdays = activityData?.date_call_duration_data || [];
    // Format date string to display nicely
    const categories = weekdays.map((w: any) => {
      if (!w.Date) return '';
      const d = new Date(w.Date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      stroke: { curve: 'smooth' as const, width: 3 },
      colors: ['#6366F1'],
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
          style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 650 },
          rotate: -30
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: '#94A3B8', fontSize: '10px' } }
      },
      grid: { borderColor: '#F8FAFC', strokeDashArray: 4 },
      markers: { size: 4, strokeWidth: 1, hover: { size: 6 } },
      dataLabels: { enabled: false },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} minutes`
        }
      }
    };
  }, [activityData]);

  const weekdayChartSeries = useMemo(() => {
    const weekdays = activityData?.date_call_duration_data || [];
    const data = weekdays.map((w: any) => w.Total_Call_Duration || 0);
    return [{ name: 'Call Duration', data }];
  }, [activityData]);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Activity Overview
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Performances, closed deals, and customer interaction telemetry for the selected period
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivityData}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-9 text-xs border-slate-200 dark:border-slate-850 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={!activityData}
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

            {/* Sales Owner Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Choose Sales Owner
              </label>
              <Select value={userid} onValueChange={(val) => val && setUserid(val)} disabled={isUsersLoading}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-lg">
                  <SelectValue placeholder="Select Owner" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-h-48 overflow-y-auto">
                  <SelectItem value="all">All Sales Owners</SelectItem>
                  {users.map((u) => {
                    const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
                    return (
                      <SelectItem key={u.id} value={name}>
                        {name}
                      </SelectItem>
                    );
                  })}
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
          <p className="text-sm font-bold text-slate-400">Loading Activity Analytics...</p>
        </Card>
      ) : !activityData ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-700 dark:text-slate-350">No Activity Data Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Try adjusting your dates or choosing a different sales owner.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 text-left">
          
          {/* KPI Dashboard metrics banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Sales Closed (Invoice Count) */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs hover:scale-[1.01] transition-transform flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Sales Closed
                </span>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {invoiceCount}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Total deals finalized
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Award className="h-6 w-6" />
              </div>
            </Card>

            {/* Total Invoice Amount */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs hover:scale-[1.01] transition-transform flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Invoiced Sales
                </span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {formatCurrency(totalInvoiceAmount)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Accumulated revenue value
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </Card>

            {/* Average Sales */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs hover:scale-[1.01] transition-transform flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Average Deal Size
                </span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {formatCurrency(avgSales)}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Mean closed deal size
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </Card>

            {/* Total Call Duration */}
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl shadow-3xs hover:scale-[1.01] transition-transform flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Total Call Time
                </span>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {currentCallDuration} <span className="text-xs font-bold text-slate-400">mins</span>
                </h3>
                <span className="text-[9px] font-bold text-slate-400 block">
                  Interaction duration total
                </span>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                <Phone className="h-6 w-6" />
              </div>
            </Card>

          </div>

          {/* Gauges/Radial indicators row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Outbound Calls Gauge Card */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-1 text-left">
                <CardTitle className="text-sm font-black text-slate-850 dark:text-slate-200">
                  Outbound Call Duration
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Calls metrics compared against a {CALL_DURATION_TARGET} minute target
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[170px]">
                
                {/* Radial Semi-circle */}
                <div className="w-full max-w-[200px] flex justify-center shrink-0">
                  <Chart
                    options={createGaugeOptions('Outbound Calls', currentCallDuration, CALL_DURATION_TARGET, '#6366F1')}
                    series={[callsPct]}
                    type="radialBar"
                    height="190"
                  />
                </div>

                {/* Details side text */}
                <div className="w-full space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wide block">
                      Target Accomplished
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {callsPct.toFixed(0)}%
                    </h3>
                  </div>

                  <div className="flex items-center gap-6 divide-x dark:divide-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block">Current Duration</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{currentCallDuration} mins</span>
                    </div>
                    <div className="space-y-0.5 pl-6">
                      <span className="text-[9px] text-slate-400 font-bold block">Previous Duration</span>
                      <span className="text-sm font-bold text-slate-500">{previousCallDuration} mins</span>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  {diffCallPct !== null && diffCallPct !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black flex items-center ${Number(diffCallPct) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {Number(diffCallPct) >= 0 ? (
                          <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4.5 w-4.5 text-rose-500" />
                        )}
                        {Math.abs(Number(diffCallPct)).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">vs last period</span>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Demos Gauge Card */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-1 text-left">
                <CardTitle className="text-sm font-black text-slate-850 dark:text-slate-200">
                  Demos Performance
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Client demo calls conducted compared against a {DEMO_COUNT_TARGET} target
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[170px]">
                
                {/* Radial Semi-circle */}
                <div className="w-full max-w-[200px] flex justify-center shrink-0">
                  <Chart
                    options={createGaugeOptions('Demos', currentDemoCount, DEMO_COUNT_TARGET, '#10B981')}
                    series={[demosPct]}
                    type="radialBar"
                    height="190"
                  />
                </div>

                {/* Details side text */}
                <div className="w-full space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wide block">
                      Target Accomplished
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {demosPct.toFixed(0)}%
                    </h3>
                  </div>

                  <div className="flex items-center gap-6 divide-x dark:divide-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block">Current Demos</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{currentDemoCount} demos</span>
                    </div>
                    <div className="space-y-0.5 pl-6">
                      <span className="text-[9px] text-slate-400 font-bold block">Previous Demos</span>
                      <span className="text-sm font-bold text-slate-500">{previousDemoCount} demos</span>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  {diffDemoPct !== null && diffDemoPct !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black flex items-center ${Number(diffDemoPct) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {Number(diffDemoPct) >= 0 ? (
                          <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4.5 w-4.5 text-rose-500" />
                        )}
                        {Math.abs(Number(diffDemoPct)).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">vs last period</span>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Core Analytics Grid: Vertical Bar & weekday Line */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Calls Activities per Company */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="text-left pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Calls Activities (by Company)
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Comparison of outgoing call duration across client companies
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[300px] flex items-center justify-center">
                {companyChartSeries[0]?.data.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No calls registered per company.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={companyChartOptions} series={companyChartSeries} type="bar" height="280" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outbound Calls Per Weekday (Date-based) */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="text-left pb-2">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Outbound Calls Trend
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Outgoing call connection times charted across recent dates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 min-h-[300px] flex items-center justify-center">
                {weekdayChartSeries[0]?.data.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">No call timeline data registered.</p>
                ) : (
                  <div className="w-full">
                    <Chart options={weekdayChartOptions} series={weekdayChartSeries} type="area" height="280" />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
