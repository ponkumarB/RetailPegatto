'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAnalysticSalesKPIAndChurnDashboard } from '@/service/api/Analytics/api';
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
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Percent,
  CheckCircle,
  FileText,
  BarChart3
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

export default function SalesKPIDashboardPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [userid, setUserid] = useState<string>('all');

  const [users, setUsers] = useState<any[]>([]);
  const [salesKPIs, setSalesKPIs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);

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

  // Fetch Sales KPI data
  const loadSalesKPIData = useCallback(async () => {
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

      const res = await fetchAnalysticSalesKPIAndChurnDashboard({
        Is_Deleted: false,
        fromdate,
        todate,
        userid: apiUserId
      });
      setSalesKPIs(res);
    } catch (err) {
      console.error('Failed to fetch sales KPI and churn dashboard', err);
      toast.error('Failed to load Sales KPI data.');
      setSalesKPIs(null);
    } finally {
      setIsLoading(false);
    }
  }, [fromdate, todate, userid, users]);

  useEffect(() => {
    loadSalesKPIData();
  }, [loadSalesKPIData]);

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
    if (!salesKPIs) {
      toast.warning('No data available to export.');
      return;
    }
    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Sales Invoices', 'Paid Invoices Count', salesKPIs.paid?.total_invoices ?? 0],
      ['Sales Invoices', 'Unpaid Invoices Count', salesKPIs.unpaid?.total_invoices ?? 0],
      ['Revenue', 'Total Paid Amount (INR)', salesKPIs.paid?.total_amount ?? 0],
      ['Revenue', 'Total Unpaid Amount (INR)', salesKPIs.unpaid?.total_amount ?? 0],
      ['Up/Cross Selling', 'Total Cross Selling Revenue (INR)', salesKPIs.cross_selling?.total_Cross_Selling_Revenue ?? 0],
      ['Up/Cross Selling', 'Total Invoice Amount (INR)', salesKPIs.cross_selling?.total_invoice_amount ?? 0],
      ['Up/Cross Selling', 'Revenue Contribution Percentage (%)', salesKPIs.cross_selling?.revenue_percentage ?? 0],
      ['Churn Revenue', 'No of Churn Customer', salesKPIs.churn_revenue?.No_of_Churn_Customer ?? 0],
      ['Churn Revenue', 'Total Churn Revenue (INR)', salesKPIs.churn_revenue?.total_churn_revenue ?? 0],
      ['Churn Revenue', 'Churn Revenue Percentage (%)', salesKPIs.churn_revenue?.churn_revenue_percentage ?? 0]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_kpi_overview_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // Extract totals
  const totalInvoicesCount = useMemo(() => {
    const paidCount = salesKPIs?.paid?.total_invoices ?? 0;
    const unpaidCount = salesKPIs?.unpaid?.total_invoices ?? 0;
    return paidCount + unpaidCount;
  }, [salesKPIs]);

  const totalPaidRevenue = salesKPIs?.paid?.total_amount ?? 0;
  const totalUnpaidRevenue = salesKPIs?.unpaid?.total_amount ?? 0;

  // Area Chart (Sales Revenue Trend)
  const trendChartData = useMemo(() => {
    const paidAmounts = salesKPIs?.paid?.date_wise_amounts || [];
    const unpaidAmounts = salesKPIs?.unpaid?.date_wise_amounts || [];

    // Map unique dates and sort
    const allDates = Array.from(new Set([
      ...paidAmounts.map((x: any) => x.date),
      ...unpaidAmounts.map((x: any) => x.date)
    ])).sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());

    // Map values to dates
    const paidData = allDates.map(date => {
      const match = paidAmounts.find((x: any) => x.date === date);
      return match ? match.total : 0;
    });

    const unpaidData = allDates.map(date => {
      const match = unpaidAmounts.find((x: any) => x.date === date);
      return match ? match.total : 0;
    });

    const formattedDates = allDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    });

    return {
      categories: formattedDates,
      series: [
        { name: 'Paid Revenue', data: paidData },
        { name: 'Unpaid Revenue', data: unpaidData }
      ]
    };
  }, [salesKPIs]);

  const trendChartOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif'
    },
    stroke: { curve: 'smooth' as const, width: 3 },
    colors: ['#10B981', '#F59E0B'], // Green for Paid, Amber for Unpaid
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
      categories: trendChartData.categories,
      labels: {
        style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 650 }
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
    markers: { size: 4, strokeWidth: 1, hover: { size: 6 } },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Sales KPI Dashboard
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Strategic sales tracking, invoice collections, expansion selling, and churn leak analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSalesKPIData}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-9 text-xs border-slate-200 dark:border-slate-850 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={!salesKPIs}
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
          <p className="text-sm font-bold text-slate-400">Loading Sales KPI Analytics...</p>
        </Card>
      ) : !salesKPIs ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[450px]">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-700 dark:text-slate-350">No Sales KPI Data Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Try adjusting your dates or choosing a different sales owner.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 text-left animate-fade-in">
          
          {/* Top Row: Simple & stylish KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Number of Sales */}
            <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Number of Sales
                  </span>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mt-0.5">
                    {totalInvoicesCount}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                    Paid ({salesKPIs.paid?.total_invoices ?? 0}) + Unpaid ({salesKPIs.unpaid?.total_invoices ?? 0})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Total Paid Revenue */}
            <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Total Paid Revenue
                  </span>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mt-0.5">
                    {formatCurrency(totalPaidRevenue)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                    Collected sales amount
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Total Unpaid Invoice Amount */}
            <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-amber-50 dark:bg-amber-955/40 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Outstanding Unpaid Sales
                  </span>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mt-0.5">
                    {formatCurrency(totalUnpaidRevenue)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                    Receivable invoice amount
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Core Chart: Sales Revenue Trend */}
          <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="text-left pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Sales Revenue Trend
              </CardTitle>
              <CardDescription className="text-[10px]">
                Timeline analysis of collections (Paid) vs receivables (Unpaid)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 min-h-[300px] flex items-center justify-center">
              {trendChartData.categories.length === 0 ? (
                <p className="text-xs font-bold text-slate-400">No chronological transaction history logged.</p>
              ) : (
                <div className="w-full">
                  <Chart options={trendChartOptions} series={trendChartData.series} type="area" height="280" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Grid: Up/Cross Selling vs Churn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* UP/CROSS SELLING Widget Card */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2 border-b dark:border-slate-850 text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-850 dark:text-slate-200">
                      Up / Cross Selling Expansion
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      Share of expansion revenues vs main product billing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                {/* Metrics detail table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed dark:border-slate-850">
                    <span className="text-xs text-slate-500 font-medium">Cross Selling Revenue</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-350">
                      {formatCurrency(salesKPIs.cross_selling?.total_Cross_Selling_Revenue ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed dark:border-slate-850">
                    <span className="text-xs text-slate-500 font-medium">Total Invoiced Amount</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-350">
                      {formatCurrency(salesKPIs.cross_selling?.total_invoice_amount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs text-slate-500 font-medium">Contribution Rate</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {(salesKPIs.cross_selling?.revenue_percentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar representation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Contribution progress</span>
                    <span>{(salesKPIs.cross_selling?.revenue_percentage ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(salesKPIs.cross_selling?.revenue_percentage ?? 0, 100)}%` }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* CHURN Widget Card */}
            <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
              <CardHeader className="pb-2 border-b dark:border-slate-850 text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-850 dark:text-slate-200">
                      Revenue Churn & Customer Leaks
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      Revenue and client losses during the selected interval
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                {/* Metrics detail table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed dark:border-slate-850">
                    <span className="text-xs text-slate-500 font-medium">No. of Churned Customers</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      {salesKPIs.churn_revenue?.No_of_Churn_Customer ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed dark:border-slate-850">
                    <span className="text-xs text-slate-500 font-medium">Lost Churn Revenue</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-350">
                      {formatCurrency(salesKPIs.churn_revenue?.total_churn_revenue ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs text-slate-500 font-medium">Churn Revenue Percentage</span>
                    <span className="text-xs font-black text-rose-500">
                      {(salesKPIs.churn_revenue?.churn_revenue_percentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar representation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Revenue leakage rate</span>
                    <span>{(salesKPIs.churn_revenue?.churn_revenue_percentage ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(salesKPIs.churn_revenue?.churn_revenue_percentage ?? 0, 100)}%` }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
