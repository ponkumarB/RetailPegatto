'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAnalysticSalesByCustomer } from '@/service/api/Analytics/api';
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
  UserCheck,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import ApexCharts to avoid SSR hydration issues
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

export default function SalesByCustomerPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2026-01-01');
  const [todate, setTodate] = useState<string>('2026-12-31');
  const [userid, setUserid] = useState<string>('all');

  const [users, setUsers] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
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
        toast.error('Failed to load Sales Owners dropdown.');
      })
      .finally(() => {
        setIsUsersLoading(false);
      });
  }, []);

  // Fetch sales analytics data
  const loadSalesData = useCallback(async () => {
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

      const res = await fetchAnalysticSalesByCustomer({
        Is_Deleted: false,
        fromdate,
        todate,
        userid: apiUserId
      });
      if (res && res.sales_within_period) {
        // Sort data by total sales descending
        const sorted = [...res.sales_within_period].sort((a, b) => b.total_sales - a.total_sales);
        setSalesData(sorted);
      } else {
        setSalesData([]);
      }
    } catch (err) {
      console.error('Failed to fetch sales by customer analytics', err);
      toast.error('Failed to load Sales by Customer data.');
      setSalesData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fromdate, todate, userid, users]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  // Handle Preset Period Change
  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== 'custom') {
      const dates = getPeriodDates(val);
      setFromdate(dates.from);
      setTodate(dates.to);
    }
  };

  // KPI calculations
  const totalSales = useMemo(() => {
    return salesData.reduce((acc, item) => acc + (item.total_sales || 0), 0);
  }, [salesData]);

  const topCustomer = useMemo(() => {
    if (salesData.length === 0) return null;
    return salesData[0]; // Already sorted descending
  }, [salesData]);

  const totalCustomers = useMemo(() => {
    return salesData.length;
  }, [salesData]);

  // Export report to CSV
  const handleExport = () => {
    if (!salesData || salesData.length === 0) {
      toast.warning('No data available to export.');
      return;
    }
    const headers = ['Customer Name', 'Total Sales (INR)', 'Percentage (%)'];
    const rows = salesData.map(item => {
      const percentage = totalSales > 0 ? ((item.total_sales / totalSales) * 100).toFixed(1) : '0';
      return [
        item.Customer_Name,
        item.total_sales,
        `${percentage}%`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_by_customer_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // ApexCharts Config
  const chartOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
    },
    labels: salesData.map((d) => d.Customer_Name),
    colors: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'],
    legend: {
      show: true,
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      markers: { radius: 12 },
      itemMargin: { horizontal: 10, vertical: 6 },
      labels: {
        colors: '#64748B',
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      dropShadow: { enabled: false }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#ffffff']
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Sales',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748B',
              formatter: function () {
                return formatCurrency(totalSales);
              }
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: function (val: string) {
                return formatCurrency(Number(val));
              }
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: function (val: number) {
          return formatCurrency(val);
        }
      }
    }
  };

  const chartSeries = salesData.map((d) => d.total_sales);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Sales By Customers
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Breakdown of sales revenue generated per customer for the selected period
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSalesData}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-9 text-xs border-slate-200 dark:border-slate-850 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={salesData.length === 0}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-2xs h-9 text-xs px-4 rounded-xl cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Selector Panel */}
      <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            {/* Period Selector */}
            <div className="space-y-1.5 text-left">
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
            <div className="space-y-1.5 text-left">
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
              <div className="space-y-1.5 text-left">
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
              <div className="space-y-1.5 text-left">
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

      {/* KPI metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sales KPI */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Sales Revenue
              </span>
              <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                {isLoading ? '...' : formatCurrency(totalSales)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customer KPI */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Top Value Customer
              </span>
              <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5 truncate max-w-[200px]">
                {isLoading ? '...' : topCustomer ? `${topCustomer.Customer_Name} (${formatCurrency(topCustomer.total_sales)})` : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers count KPI */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl">
              <Users className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Active Customer Count
              </span>
              <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                {isLoading ? '...' : totalCustomers}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Graph and Table */}
      {isLoading ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400">Loading Customer Sales Analytics...</p>
        </Card>
      ) : salesData.length === 0 ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[400px]">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-700 dark:text-slate-350">No Sales Data Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Try adjusting your dates, choosing a different sales owner, or verifying your system transactions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Donut Chart Card */}
          <Card className="lg:col-span-5 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="text-left pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Sales Share by Customer
              </CardTitle>
              <CardDescription className="text-[10px]">
                Visual split between {fromdate} and {todate}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-center items-center min-h-[350px]">
              <div className="w-full max-w-[340px]">
                <Chart options={chartOptions} series={chartSeries} type="donut" height="320" />
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table Card */}
          <Card className="lg:col-span-7 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="text-left pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Customer Contribution breakdown
              </CardTitle>
              <CardDescription className="text-[10px]">
                Detail breakdown table of revenue totals per client
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-850">
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pl-6 py-3 text-left">
                        Customer Name
                      </TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3 text-right">
                        Total Sales
                      </TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pr-6 py-3 text-right">
                        Share Percentage
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((item, index) => {
                      const sharePct = totalSales > 0 ? (item.total_sales / totalSales) * 100 : 0;
                      return (
                        <TableRow
                          key={index}
                          className="border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                        >
                          <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-300 pl-6 py-3.5 text-left">
                            {item.Customer_Name}
                          </TableCell>
                          <TableCell className="font-black text-xs text-slate-800 dark:text-slate-200 py-3.5 text-right">
                            {formatCurrency(item.total_sales)}
                          </TableCell>
                          <TableCell className="pr-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="font-extrabold text-xs text-slate-500 min-w-[36px]">
                                {sharePct.toFixed(1)}%
                              </span>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${sharePct}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
