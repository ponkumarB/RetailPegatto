'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFromApi } from '@/service/apiClient';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Store, Search, Users, Trash2, X, PlusCircle, CheckCircle2, TrendingUp, TrendingDown,
  LayoutDashboard, List, FileBarChart, Monitor, Download, Printer, Box, AlertCircle, ShoppingBag,
  DollarSign, Clock, XCircle, CreditCard, Calendar, RefreshCw, Receipt
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { toast } from 'sonner';

// Recharts colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CounterManagementDashboard({ children, onAddCounter }: { children?: React.ReactNode; onAddCounter?: () => void }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('This Year');
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [counterFilter, setCounterFilter] = useState('All Counters');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportStore, setReportStore] = useState('All Stores');
  const [reportCounter, setReportCounter] = useState('All Counters');
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const dashboardPayload = useMemo(() => {
    const periodMap: Record<string, string> = {
      'Today': 'today',
      'This Month': 'this_month',
      'This Year': 'this_year',
      'Last Year': 'last_year',
    };
    return {
      method: 'POST',
      body: JSON.stringify({
        period: periodMap[yearFilter] || 'today',
        ...(storeFilter !== 'All Stores' ? { store_id: storeFilter } : {}),
        ...(counterFilter !== 'All Counters' ? { counter_id: counterFilter } : {}),
      }),
    };
  }, [yearFilter, storeFilter, counterFilter]);

  // 1. Dashboard KPI
  const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: ['counter-kpi', yearFilter, storeFilter, counterFilter],
    queryFn: () => fetchFromApi('/user/CounterCardDashboard/', dashboardPayload),
  });

  // 2. Top Performing Cashiers
  const { data: topCashiers, isLoading: cashiersLoading, error: cashiersError } = useQuery({
    queryKey: ['counter-top-cashiers', yearFilter, storeFilter, counterFilter],
    queryFn: () => fetchFromApi('/user/TopPerformingCashiers/', dashboardPayload),
  });

  // 3. Counter Performance
  const { data: counterPerformance, isLoading: perfLoading, error: perfError } = useQuery({
    queryKey: ['counter-performance', yearFilter, storeFilter, counterFilter],
    queryFn: () => fetchFromApi('/user/CounterPerformance/', dashboardPayload),
  });

  // 4. Hourly Sales
  const { data: hourlyTrend, isLoading: hourlyLoading, error: hourlyError } = useQuery({
    queryKey: ['counter-hourly-trend', yearFilter, storeFilter, counterFilter],
    queryFn: () => fetchFromApi('/user/HourlySalesOrdersTrend/', dashboardPayload),
  });

  // 5. Payment Mode Distribution
  const { data: paymentMode, isLoading: paymentLoading, error: paymentError } = useQuery({
    queryKey: ['counter-payment-mode', yearFilter, storeFilter, counterFilter],
    queryFn: () => fetchFromApi('/user/PaymentModeDistribution/', dashboardPayload),
  });

  // 6. Fetch Stores for dropdown
  const { data: storesData, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => fetchFromApi('/user/StoreMasterAdditional/?Is_Deleted=False&page_size=100'),
    staleTime: 5 * 60_000,
  });

  // 7. Fetch Counters for dropdown - use GET instead of POST
  const { data: countersData, isLoading: countersLoading, error: countersError } = useQuery({
    queryKey: ['counters-list'],
    queryFn: () => fetchFromApi('/user/CounterMasterlist/?page_size=100'),
    staleTime: 5 * 60_000,
  });

  // Safe data access handling legacy payload structures
  const kpi = kpiData?.data || { total_counters: 0, active_counters: 0, total_sales: 0, total_orders: 0 };
  const hourlyData = Array.isArray(hourlyTrend?.data) ? hourlyTrend.data : [];
  const paymentData = Array.isArray(paymentMode?.data?.distribution) ? paymentMode.data.distribution : [];
  const topCashiersList = Array.isArray(topCashiers?.data) ? topCashiers.data : [];
  const counterPerfList = Array.isArray(counterPerformance?.data) ? counterPerformance.data : [];

  // Debug logging for API responses
  console.log('KPI Data:', kpiData, 'Error:', kpiError);
  console.log('Hourly Data:', hourlyTrend, 'Error:', hourlyError);
  console.log('Payment Data:', paymentMode, 'Error:', paymentError);
  console.log('Top Cashiers:', topCashiers, 'Error:', cashiersError);
  console.log('Counter Performance:', counterPerformance, 'Error:', perfError);

  // Show error toasts for failed API calls
  if (kpiError) toast.error('Failed to load KPI data');
  if (hourlyError) toast.error('Failed to load hourly trend data');
  if (paymentError) toast.error('Failed to load payment mode data');
  if (cashiersError) toast.error('Failed to load cashier data');
  if (perfError) toast.error('Failed to load counter performance data');

  // Process stores and counters for dropdowns.
  const storesList = useMemo(() => {
    console.log('Stores Data:', storesData);
    console.log('Stores Error:', storesError);
    console.log('Stores Loading:', storesLoading);

    // Try to get real data first
    let realStores: any[] = [];
    if (storesData) {
      if (Array.isArray(storesData)) realStores = storesData;
      else if (Array.isArray(storesData.data)) realStores = storesData.data;
      else if (Array.isArray(storesData.results)) realStores = storesData.results;
      else if (Array.isArray(storesData.Data)) realStores = storesData.Data;
      else if (storesData.data && Array.isArray(storesData.data.results)) realStores = storesData.data.results;
    }

    return realStores;
  }, [storesData, storesError, storesLoading]);

  const countersList = useMemo(() => {
    console.log('Counters Data:', countersData);
    console.log('Counters Error:', countersError);
    console.log('Counters Loading:', countersLoading);

    // Try to get real data first
    let realCounters: any[] = [];
    if (countersData) {
      if (Array.isArray(countersData)) realCounters = countersData;
      else if (Array.isArray(countersData.data)) realCounters = countersData.data;
      else if (Array.isArray(countersData.results)) realCounters = countersData.results;
      else if (Array.isArray(countersData.Data)) realCounters = countersData.Data;
      else if (countersData.data && Array.isArray(countersData.data.results)) realCounters = countersData.data.results;
    }

    return realCounters;
  }, [countersData, countersError, countersLoading]);

  // Helper functions to get display names from selected IDs
  const getStoreName = (storeId: string) => {
    if (storeId === 'All Stores') return 'All Stores';
    const store = storesList.find((s: any) => String(s.id) === storeId);
    return store?.Store_Name || store?.name || storeId;
  };

  const getCounterName = (counterId: string) => {
    if (counterId === 'All Counters') return 'All Counters';
    const counter = countersList.find((c: any) => String(c.id) === counterId);
    return counter?.Counter_Name || counter?.name || counterId;
  };

  // Report Handlers
  const handleOpenReportModal = (reportType: string) => {
    setSelectedReport(reportType);
    setReportData(null);
    setIsReportModalOpen(true);
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    setIsGeneratingReport(true);
    try {
      const toNumber = (value: unknown) => {
        const parsed = Number(value ?? 0);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const selectedCounters = countersList.filter((counter: any) => {
        const counterId = String(counter.id || counter.Counter_Id || '');
        const storeId = String(counter.Store_Id?.id || counter.Store_Id || counter.store_id || '');
        return (reportCounter === 'All Counters' || counterId === reportCounter)
          && (reportStore === 'All Stores' || storeId === reportStore);
      });

      const reportCounters = selectedCounters.map((counter: any) => {
        const counterId = String(counter.id || counter.Counter_Id || '');
        const counterName = counter.Counter_Name || counter.name || 'Counter';
        const performance = counterPerfList.find((item: any) =>
          String(item.counter_id || item.Counter_Id || item.id || '') === counterId
          || String(item.counter_name || item.Counter_Name || '') === String(counterName)
        ) || {};
        const active = counter.Active_Status !== false && counter.Active_Status !== 'false' && counter.Status !== 'Inactive';

        return {
          counter_id: counter.Counter_Id || performance.counter_id || `CNT-${counterId.padStart(3, '0')}`,
          counter_name: counterName,
          incharge: counter.Counter_Incharge || counter.Incharge || 'N/A',
          status: active ? 'Active' : 'Inactive',
          today_sales: toNumber(counter.Today_Sales ?? counter.Total_Sales ?? performance.today_sales ?? performance.total_sales),
          today_orders: toNumber(counter.Today_Orders ?? counter.Total_Orders ?? performance.today_orders ?? performance.orders),
        };
      });

      setReportData({
        total_counters: reportCounters.length,
        active_counters: reportCounters.filter((counter) => counter.status === 'Active').length,
        total_sales: reportCounters.reduce((total, counter) => total + counter.today_sales, 0),
        total_orders: reportCounters.reduce((total, counter) => total + counter.today_orders, 0),
        counters: reportCounters,
      });
      toast.success('Report generated successfully!');
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast.error(`Failed to generate report: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Counter Management</h2>
          <p className="text-sm text-slate-500">Configure billing & sales counters across your store locations</p>
        </div>
        <Button className="rounded-xl font-semibold shadow-sm" onClick={onAddCounter}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Counter
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
          <TabsTrigger value="dashboard" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <List className="h-4 w-4 mr-2" /> Counter List
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileBarChart className="h-4 w-4 mr-2" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            <Select value={yearFilter} onValueChange={(value) => setYearFilter(value || 'This Year')}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Last Year">Last Year</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
              </SelectContent>
            </Select>
            <Select value={storeFilter} onValueChange={(value) => setStoreFilter(value || 'All Stores')}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Stores">All Stores</SelectItem>
                {storesList.map((store: any) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.Store_Name || store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={counterFilter} onValueChange={(value) => setCounterFilter(value || 'All Counters')}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Counters">All Counters</SelectItem>
                {countersList.map((counter: any) => (
                  <SelectItem key={counter.id} value={String(counter.id)}>
                    {counter.Counter_Name || counter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Counters</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.total_counters}</h3>
                    <p className="text-xs text-slate-400 mt-1">{kpi.active_counters} Active</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <Store className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Sales</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{((kpi.total_sales || 0) / 1000).toFixed(1)}K</h3>
                    <p className="text-xs text-slate-400 mt-1">{kpi.total_orders} Orders</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Avg. Billing Time</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.avg_billing_time ?? kpi.average_billing_time ?? '—'}</h3>
                  </div>
                  <div className="h-10 w-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Returns</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.total_returns ?? kpi.return_count ?? '—'}</h3>
                  </div>
                  <div className="h-10 w-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Trend Chart */}
            <Card className="rounded-2xl border-slate-100 shadow-sm col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Hourly Sales & Orders Trend</CardTitle>
                <CardDescription>Sales velocity over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  {hourlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                        <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode Distribution */}
            <Card className="rounded-2xl border-slate-100 shadow-sm col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Payment Mode Distribution</CardTitle>
                <CardDescription>Revenue broken down by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4 flex items-center justify-center">
                  {paymentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="amount"
                          nameKey="mode"
                        >
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Counter Performance */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Counter Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold rounded-tl-lg rounded-bl-lg">Counter Name</th>
                      <th className="px-6 py-3 font-semibold text-right">Total Sales</th>
                      <th className="px-6 py-3 font-semibold text-right">% Share</th>
                      <th className="px-6 py-3 font-semibold text-right rounded-tr-lg rounded-br-lg">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterPerfList.map((counter: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium">{counter.counter_name || 'Counter'}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{counter.total_sales?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-6 py-4 text-right text-slate-600">{counter.share_percentage || 0}%</td>
                        <td className="px-6 py-4 text-right text-slate-600">{counter.orders || 0}</td>
                      </tr>
                    ))}
                    {counterPerfList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No counter data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Cashiers */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Top Performing Cashiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold rounded-tl-lg rounded-bl-lg">Cashier Name</th>
                      <th className="px-6 py-3 font-semibold text-right">Sales</th>
                      <th className="px-6 py-3 font-semibold text-right">Orders</th>
                      <th className="px-6 py-3 font-semibold text-right rounded-tr-lg rounded-br-lg">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCashiersList.map((cashier, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {cashier.cashier_name?.charAt(0) || 'U'}
                          </div>
                          {cashier.cashier_name}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">₹{cashier.sales?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-right text-slate-600">{cashier.orders}</td>
                        <td className="px-6 py-4 text-right text-slate-600">{cashier.avg_time} min</td>
                      </tr>
                    ))}
                    {topCashiersList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No cashier data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="animate-in fade-in-50 duration-500">
          {children ? (
            children
          ) : (
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search counters..." 
                      className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Fallback table since dynamic table is inside StoreModulePage */}
                <div className="text-center py-12 text-slate-500">
                  <p>Standard Module Table will be injected here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileBarChart className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Counter Sales Report</h3>
                <p className="text-sm text-slate-500 mb-6">View daily sales summary by counter</p>
                <Button variant="outline" className="rounded-xl w-full" onClick={() => handleOpenReportModal('daily-counter-sales')}>Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cashier Productivity Report</h3>
                <p className="text-sm text-slate-500 mb-6">Detailed metric analysis per cashier</p>
                <Button variant="outline" className="rounded-xl w-full" onClick={() => handleOpenReportModal('cashier-productivity')}>Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Mode Summary</h3>
                <p className="text-sm text-slate-500 mb-6">Revenue breakdown by payment method</p>
                <Button variant="outline" className="rounded-xl w-full" onClick={() => handleOpenReportModal('payment-mode-summary')}>Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Monthly Sales Report</h3>
                <p className="text-sm text-slate-500 mb-6">Monthly sales performance overview</p>
                <Button variant="outline" className="rounded-xl w-full" onClick={() => handleOpenReportModal('monthly-sales')}>Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Return & Cancellation Report</h3>
                <p className="text-sm text-slate-500 mb-6">Track returns and cancellations by counter</p>
                <Button variant="outline" className="rounded-xl w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleOpenReportModal('return-cancellation')}>Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Receipt className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Counter Collection Report</h3>
                <p className="text-sm text-slate-500 mb-6">Cash collection summary per counter</p>
                <Button variant="outline" className="rounded-xl w-full" onClick={() => handleOpenReportModal('counter-collection')}>Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedReport === 'return-cancellation' ? 'Return & Cancellation Report' :
               selectedReport === 'daily-counter-sales' ? 'Daily Counter Sales Report' :
               selectedReport === 'cashier-productivity' ? 'Cashier Productivity Report' :
               selectedReport === 'payment-mode-summary' ? 'Payment Mode Summary' :
               selectedReport === 'monthly-sales' ? 'Monthly Sales Report' :
               selectedReport === 'counter-collection' ? 'Counter Collection Report' : 'Report'}
            </DialogTitle>
            <DialogDescription>Configure filters and generate the report</DialogDescription>
          </DialogHeader>

          {!reportData ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Start Date</Label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">End Date</Label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Select Store</Label>
                  <Select value={getStoreName(reportStore)} onValueChange={(value) => setReportStore(value === 'All Stores' ? 'All Stores' : String(storesList.find((s: any) => (s.Store_Name || s.name) === value)?.id || value))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Stores">All Stores</SelectItem>
                      {storesList.map((store: any) => (
                        <SelectItem key={store.id} value={store.Store_Name || store.name}>
                          {store.Store_Name || store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Select Counter</Label>
                  <Select value={getCounterName(reportCounter)} onValueChange={(value) => setReportCounter(value === 'All Counters' ? 'All Counters' : String(countersList.find((c: any) => (c.Counter_Name || c.name) === value)?.id || value))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a counter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Counters">All Counters</SelectItem>
                      {countersList.map((counter: any) => (
                        <SelectItem key={counter.id} value={counter.Counter_Name || counter.name}>
                          {counter.Counter_Name || counter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-semibold">TOTAL COUNTERS</p>
                  <p className="text-xl font-bold text-slate-900">{reportData?.total_counters ?? 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-semibold">ACTIVE COUNTERS</p>
                  <p className="text-xl font-bold text-slate-900">{reportData?.active_counters ?? 0}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-semibold">TOTAL SALES</p>
                  <p className="text-xl font-bold text-slate-900">{'₹'}{(reportData?.total_sales ?? 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-semibold">TOTAL ORDERS</p>
                  <p className="text-xl font-bold text-slate-900">{reportData?.total_orders ?? 0}</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Counter ID</th>
                      <th className="px-4 py-3 font-semibold">Counter Name</th>
                      <th className="px-4 py-3 font-semibold">Incharge</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Today Sales</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Today Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reportData?.counters) ? reportData.counters.map((counter: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium">{counter.counter_id || 'CNT-001'}</td>
                        <td className="px-4 py-3">{counter.counter_name || 'Counter'}</td>
                        <td className="px-4 py-3">{counter.incharge || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={counter.status === 'Active' ? 'default' : 'secondary'}>
                            {counter.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">₹{counter.today_sales?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-3 text-right">{counter.today_orders || 0}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReportModalOpen(false);
                setReportData(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            {!reportData && (
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="rounded-xl"
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render StoreModulePage dialogs (create/edit/delete) so they are mounted */}
      {children && <div className="sr-only" aria-hidden="true">{children}</div>}
    </div>
  );
}
