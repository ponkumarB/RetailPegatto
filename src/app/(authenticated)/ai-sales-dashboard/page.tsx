'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Download,
  CreditCard,
  Store,
  Monitor,
  Smartphone,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend
} from 'recharts';

const COLORS = [
  '#348169',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const mockData = {
  executive_summary: {
    total_sales: { value: 45.2, change: 8.4 },
    total_orders: { value: 12500, change: 5.2 },
    avg_order_value: { value: 3616, change: 3.1 },
    profit_margin: { value: 24.5, change: -1.2 },
    sales_forecast: { predicted_revenue_cr: 52.8 }
  },
  daily_sales: [
    { date: '1 Sep', value: 1.2 },
    { date: '2 Sep', value: 1.5 },
    { date: '3 Sep', value: 1.1 },
    { date: '4 Sep', value: 1.8 },
    { date: '5 Sep', value: 2.1 },
    { date: '6 Sep', value: 2.5 },
    { date: '7 Sep', value: 2.8 },
    { date: '8 Sep', value: 1.9 },
    { date: '9 Sep', value: 2.2 },
    { date: '10 Sep', value: 2.6 },
    { date: '11 Sep', value: 3.1 },
    { date: '12 Sep', value: 3.5 },
    { date: '13 Sep', value: 3.2 },
    { date: '14 Sep', value: 4.1 }
  ],
  sales_by_store: [
    { store_name: 'Store Downtown', value: 12.5 },
    { store_name: 'Store Uptown', value: 9.8 },
    { store_name: 'Store Mall', value: 8.5 },
    { store_name: 'Store Airport', value: 5.2 },
    { store_name: 'Store Suburb', value: 4.1 }
  ],
  sales_by_channel: [
    { name: 'In-Store', value: 45 },
    { name: 'Online', value: 35 },
    { name: 'Mobile App', value: 15 },
    { name: 'Partners', value: 5 }
  ],
  sales_by_payment_mode: [
    { name: 'Credit Card', value: 42 },
    { name: 'UPI', value: 38 },
    { name: 'Debit Card', value: 12 },
    { name: 'Cash', value: 8 }
  ],
  sales_heatmap: [
    { day: 'Mon', value: 5.2, percentage: 12 },
    { day: 'Tue', value: 4.8, percentage: 11 },
    { day: 'Wed', value: 5.5, percentage: 13 },
    { day: 'Thu', value: 6.1, percentage: 14 },
    { day: 'Fri', value: 7.2, percentage: 16 },
    { day: 'Sat', value: 9.5, percentage: 22 },
    { day: 'Sun', value: 6.9, percentage: 12 }
  ],
  top_products: [
    { name: 'Smartphone Pro Max', sales: 15200 },
    { name: 'Wireless Headphones', sales: 12400 },
    { name: '4K Ultra TV', sales: 8500 },
    { name: 'Gaming Console X', sales: 6200 },
    { name: 'Smartwatch Series 8', sales: 5800 }
  ]
};

const StatCard = ({ title, value, change, icon: Icon, color, suffix = '', unit = '' }) => {
  const isPositive = change > 0;
  
  // Custom logic for isGood (if churn/error, lower is better)
  const isGood = title.toLowerCase().includes('churn') || title.toLowerCase().includes('error') ? change < 0 : change > 0;
  const isColorClass = color && (color.startsWith('bg-') || color.includes(' text-'));
  
  const formatValue = () => {
    if (typeof value === 'number') {
      if (title.includes('Revenue') || title.includes('Profit') || unit === 'Cr') return `₹${value.toFixed(2)} Cr`;
      if (title.includes('Margin') || title.includes('Retention') || title.includes('Accuracy') || unit === '%') return `${value.toFixed(1)}%`;
      if (unit === '₹') return `₹${value.toLocaleString()}`;
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-slate-950 hover:shadow-md transition-all">
      <CardContent className="p-5 flex items-center justify-between gap-3 h-full">
        <div className="flex flex-col justify-center h-full min-w-0 py-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{title}</p>
          <div className="mt-2 mb-2">
            <h3 className="text-2xl xl:text-[28px] font-bold text-slate-900 dark:text-white leading-none truncate">
              {formatValue()}{suffix}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-auto">
            {isPositive ? (
              <ArrowUpRight className={`h-4 w-4 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
            ) : (
              <ArrowDownRight className={`h-4 w-4 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
            )}
            <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isGood ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
              {Math.abs(change)}% from last month
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isColorClass ? color : ''}`} style={!isColorClass ? { backgroundColor: `${color}15`, color: color } : {}}>
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AISalesDashboard() {
  const {
    executive_summary: summary,
    daily_sales: recentSales,
    sales_by_store: formattedStores,
    sales_by_channel: salesByChannel,
    sales_by_payment_mode: paymentModes,
    sales_heatmap: weeklyData,
    top_products: topProducts
  } = mockData;

  const getChannelIcon = (name: string) => {
    if (name === 'In-Store') return <Store className="h-4 w-4" />;
    if (name === 'Online') return <Monitor className="h-4 w-4" />;
    if (name === 'Mobile App') return <Smartphone className="h-4 w-4" />;
    return <ShoppingBag className="h-4 w-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#348169] p-6 rounded-2xl text-white shadow-md gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sales Analytics Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">AI-Powered Sales Performance | Real-time Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 border-0 text-white">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Sales"
          value={summary.total_sales.value}
          change={summary.total_sales.change}
          icon={DollarSign}
          color="#7c3aed"
          unit="Cr"
        />
        <StatCard
          title="Total Orders"
          value={summary.total_orders.value}
          change={summary.total_orders.change}
          icon={ShoppingCart}
          color="#06b6d4"
        />
        <StatCard
          title="Avg Order Value"
          value={summary.avg_order_value.value}
          change={summary.avg_order_value.change}
          icon={LineChartIcon}
          color="#10b981"
          unit="₹"
        />
        <StatCard
          title="Profit Margin"
          value={summary.profit_margin.value}
          change={summary.profit_margin.change}
          icon={PieChartIcon}
          color="#f59e0b"
          unit="%"
        />
        <StatCard
          title="Forecast Revenue"
          value={summary.sales_forecast.predicted_revenue_cr}
          change={8.5} // Mock change for forecast
          icon={Activity}
          color="#8b5cf6"
          unit="Cr"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Daily Sales Trend</CardTitle>
            <p className="text-xs text-slate-500">Daily revenue in ₹ Crores</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={recentSales}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#salesGradient)" />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales by Store</CardTitle>
            <p className="text-xs text-slate-500">Top performing stores (₹ in Crores)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={formattedStores} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="store_name" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Sales"]} />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales by Channel</CardTitle>
            <p className="text-xs text-slate-500">Revenue distribution by channel</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByChannel}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {salesByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {salesByChannel.map((channel, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                      {getChannelIcon(channel.name)}
                    </div>
                    <span className="text-sm font-medium">{channel.name}</span>
                  </div>
                  <span className="text-sm font-bold">{channel.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales by Payment Mode</CardTitle>
            <p className="text-xs text-slate-500">Revenue distribution by payment method</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentModes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentModes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {paymentModes.map((mode, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{mode.name}</span>
                  </div>
                  <span className="text-sm font-bold">{mode.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales by Day of Week</CardTitle>
            <p className="text-xs text-slate-500">Average daily revenue (₹ in Crores)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Revenue"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.day === 'Sat' || entry.day === 'Sun') ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Performing Products</CardTitle>
            <p className="text-xs text-slate-500">Highest revenue generating products</p>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 text-right">Sales Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500">#{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{product.name}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{product.sales.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
