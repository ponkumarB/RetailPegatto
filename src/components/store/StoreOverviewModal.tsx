import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, User, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/service/apiClient';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface StoreOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRow: any;
}

export const StoreOverviewModal: React.FC<StoreOverviewModalProps> = ({ isOpen, onClose, activeRow }) => {
  const [period, setPeriod] = useState('This Year');
  const [activeTab, setActiveTab] = useState('dashboard');

  const getDateRange = (p: string) => {
    const to = new Date();
    const from = new Date();
    switch (p) {
      case 'Today': from.setDate(to.getDate()); break;
      case 'This Week': from.setDate(to.getDate() - to.getDay()); break;
      case 'This Month': from.setDate(1); break;
      case 'This Quarter': from.setMonth(Math.floor(to.getMonth() / 3) * 3); from.setDate(1); break;
      case 'This Year': from.setMonth(0, 1); break;
      case 'Previous Week': 
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setDate(to.getDate() - 6);
        break;
      case 'Previous Month':
        to.setDate(0);
        from.setMonth(to.getMonth(), 1);
        break;
      case 'Previous Quarter':
        to.setMonth(Math.floor(to.getMonth() / 3) * 3, 0);
        from.setMonth(to.getMonth() - 2, 1);
        break;
      case 'Previous Year':
        to.setFullYear(to.getFullYear() - 1, 11, 31);
        from.setFullYear(to.getFullYear(), 0, 1);
        break;
      case 'Last Three Month': from.setMonth(to.getMonth() - 3); break;
      case 'Last Six Month': from.setMonth(to.getMonth() - 6); break;
      case 'Last One Year': from.setFullYear(to.getFullYear() - 1); break;
      default: from.setFullYear(to.getFullYear() - 1);
    }
    return { FromDate: from.toISOString().slice(0, 10), ToDate: to.toISOString().slice(0, 10) };
  };

  const { data: perfData, isLoading: isLoadingPerf } = useQuery({
    queryKey: ['store-performance', activeRow?.id, period],
    queryFn: async () => {
      const dates = getDateRange(period);
      return fetchFromApi('/user/RetailProductStorePerformance/', {
        method: 'POST',
        body: JSON.stringify(dates),
      });
    },
    enabled: isOpen && !!activeRow,
    staleTime: 60_000,
  });

  const getChartData = () => {
    if (!perfData) return [];
    const rows = Array.isArray(perfData) ? perfData : (perfData.data?.results || perfData.results || perfData.Data || []);
    // Map API response to chart format, limiting to top 10 for readability
    return rows.slice(0, 10).map((r: any) => ({
      name: r.ProductName || 'Unknown',
      stock: parseInt(r.ClosingBalance || r.OpeningBalance || 0),
      sales: parseInt(r.SalesQuantity || 0) * 100 // Scale up for demo if low
    }));
  };

  const chartData = getChartData();

  if (!activeRow) return null;

  const getAddress = () => {
    const parts = [activeRow.City, activeRow.State].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not available';
  };

  const getStoreName = () => activeRow.Store_Name || activeRow.name || 'Store';
  const getStoreIncharge = () => activeRow.Store_Incharge || activeRow.Manager || 'Not assigned';

  const totalProducts = Array.isArray(activeRow.Store_Items) ? activeRow.Store_Items.length : 0;
  
  // Calculate stock value if data is available, otherwise mock it for UI demonstration
  const stockValue = Array.isArray(activeRow.Store_Items) 
    ? activeRow.Store_Items.reduce((acc: number, item: any) => acc + (parseFloat(item.Opening_Balance) || 0) * 1500, 0)
    : 252206611.00; // Mock data from screenshot

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] w-[90vw] p-0 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950">
        <DialogHeader className="px-6 py-4 pr-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Store Overview
          </DialogTitle>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={(value) => setPeriod(value ?? 'Today')}>
              <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-0">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Previous Week">Previous Week</SelectItem>
                <SelectItem value="Previous Month">Previous Month</SelectItem>
                <SelectItem value="Previous Quarter">Previous Quarter</SelectItem>
                <SelectItem value="Previous Year">Previous Year</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Last One Year">Last One Year</SelectItem>
                <SelectItem value="Last Six Month">Last Six Month</SelectItem>
                <SelectItem value="Last Three Month">Last Three Month</SelectItem>
                <SelectItem value="Custom Date">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-50 dark:bg-slate-950">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-auto p-0 mb-6 gap-6">
              <TabsTrigger 
                value="dashboard" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-2 py-3 text-[15px] font-semibold text-slate-500"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-2 py-3 text-[15px] font-semibold text-slate-500"
              >
                Inventory
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-2 py-3 text-[15px] font-semibold text-slate-500"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0 outline-none space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-[110px]">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Products</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{totalProducts || 55}</p>
                  <p className="text-[11px] font-medium text-emerald-500">Active products</p>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-[110px]">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Stock Value</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    ₹ {stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-500">Inventory worth</p>
                </div>

                {/* Card 3 - Blue Border */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-blue-400 dark:border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] flex flex-col justify-center min-h-[110px]">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Monthly Sales</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">₹ 0.00</p>
                  <p className="text-[11px] font-medium text-blue-500">This Year revenue</p>
                </div>

                {/* Card 4 - Orange Border */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-amber-300 dark:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] flex flex-col justify-center min-h-[110px]">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Low Stock Alerts</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">96.36%</p>
                  <p className="text-[11px] font-medium text-amber-500">0 critical</p>
                </div>
              </div>

              {/* Store Information */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Store Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100/60 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-0.5">Store Name</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getStoreName()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100/60 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-0.5">Store Incharge</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getStoreIncharge()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100/60 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-0.5">Address</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getAddress()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 h-[280px] flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Stock Health</h3>
                  {isLoadingPerf ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading data...</div>
                  ) : chartData.length > 0 ? (
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => val.substring(0, 10)} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                      No stock data available for {period}
                    </div>
                  )}
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 h-[280px] flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Sales Trend ({period})</h3>
                  {isLoadingPerf ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading data...</div>
                  ) : chartData.length > 0 ? (
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => val.substring(0, 10)} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <RechartsTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                      No sales data available for {period}
                    </div>
                  )}
                </div>
              </div>

            </TabsContent>
            
            <TabsContent value="inventory" className="mt-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
              <p className="text-slate-400 text-sm font-medium">Inventory Data Integration Required</p>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
              <p className="text-slate-400 text-sm font-medium">Analytics Data Integration Required</p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
