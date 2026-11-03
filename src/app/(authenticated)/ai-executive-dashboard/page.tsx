'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  LineChart as LineChartIcon,
  Activity,
  Download,
  Users,
  Package,
  AlertTriangle,
  Shield,
  Store,
  Monitor,
  Smartphone,
  ShoppingBag,
  ChevronRight,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

const mockData = {
  executive_summary: {
    total_revenue: { value: 45.2, change: 8.4 },
    total_orders: { value: 12500, change: 5.2 },
    gross_profit: { value: 15.8, change: 6.1 },
    profit_margin: { value: 34.9, change: -1.2 },
    customer_retention: { value: 68.5, change: 4.2 },
    forecast_accuracy: { value: 92.4, change: 1.5 }
  },
  revenue_trend: [
    { date: 'Week 1', revenue: 10.2 },
    { date: 'Week 2', revenue: 11.5 },
    { date: 'Week 3', revenue: 10.8 },
    { date: 'Week 4', revenue: 12.7 }
  ],
  sales_by_channel: [
    { name: 'In-Store', percentage: 45, color: '#348169', revenue: 20.34 },
    { name: 'Online', percentage: 35, color: '#3B82F6', revenue: 15.82 },
    { name: 'Mobile App', percentage: 15, color: '#10B981', revenue: 6.78 },
    { name: 'Partners', percentage: 5, color: '#6B7280', revenue: 2.26 }
  ],
  top_stores: [
    { store_name: 'Store Downtown', location: 'New York, NY', revenue_cr: 12.5, order_count: 3200, color: '#3B82F6' },
    { store_name: 'Store Uptown', location: 'Chicago, IL', revenue_cr: 9.8, order_count: 2800, color: '#10B981' },
    { store_name: 'Store Mall', location: 'Los Angeles, CA', revenue_cr: 8.5, order_count: 2500, color: '#F59E0B' },
    { store_name: 'Store Airport', location: 'Atlanta, GA', revenue_cr: 5.2, order_count: 1500, color: '#EF4444' }
  ],
  ai_insights: {
    alerts: [
      { title: 'Low Stock on Flagship Product', message: 'Wireless Earbuds PRO at Store Downtown will stock out in 3 days.', type: 'Low Stock Alert' },
      { title: 'High Churn Risk Detected', message: '45 high-value customers show inactivity over 60 days.', type: 'Churn Alert' }
    ],
    insights: [
      'Mobile App revenue grew 15% faster than Online channel this month.',
      'Average Order Value increases by 20% when customers purchase bundled electronics.',
      'Store Uptown has the highest customer retention rate at 78%.'
    ],
    recommendations: [
      { title: 'Launch Targeted Email Campaign', description: 'Re-engage 45 inactive high-value customers.' },
      { title: 'Increase Mobile App Promotions', description: 'Capitalize on mobile app growth with app-exclusive discounts.' }
    ]
  }
};

const StatCard = ({ title, value, change, icon: Icon, color, suffix = '', unit = '' }) => {
  const isPositive = change > 0;
  
  // Custom logic for isGood (if churn/error, lower is better)
  const isGood = title.toLowerCase().includes('churn') || title.toLowerCase().includes('error') ? change < 0 : change > 0;
  const isColorClass = color && (color.startsWith('bg-') || color.includes(' text-'));
  
  const formatValue = () => {
    if (typeof value === 'number') {
      if (title === 'Total Revenue' || title === 'Gross Profit' || unit === 'Cr') return `₹${value.toFixed(2)} Cr`;
      if (title === 'Profit Margin' || title === 'Customer Retention' || title === 'Forecast Accuracy' || unit === '%') return `${value.toFixed(1)}%`;
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

export default function AIExecutiveDashboard() {
  const {
    executive_summary: summary,
    revenue_trend: revenueTrend,
    sales_by_channel: salesByChannel,
    top_stores: topStores,
    ai_insights: { alerts, insights, recommendations }
  } = mockData;

  const getChannelIcon = (name: string) => {
    if (name === 'In-Store') return <Store className="h-4 w-4" />;
    if (name === 'Online') return <Monitor className="h-4 w-4" />;
    if (name === 'Mobile App') return <Smartphone className="h-4 w-4" />;
    return <ShoppingBag className="h-4 w-4" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'Low Stock Alert': return <Package className="h-5 w-5 text-amber-500" />;
      case 'Fraud Alert': return <Shield className="h-5 w-5 text-rose-500" />;
      case 'Churn Alert': return <Users className="h-5 w-5 text-blue-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'Low Stock Alert': return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20';
      case 'Fraud Alert': return 'border-rose-200 bg-rose-50 dark:bg-rose-950/20';
      case 'Churn Alert': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      default: return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20';
    }
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
            <h1 className="text-2xl font-bold">Retail AI Executive Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">Overview of Retail Business Performance</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Revenue"
          value={summary.total_revenue.value}
          change={summary.total_revenue.change}
          icon={DollarSign}
          color="#3B82F6"
        />
        <StatCard
          title="Total Orders"
          value={summary.total_orders.value}
          change={summary.total_orders.change}
          icon={ShoppingCart}
          color="#10B981"
        />
        <StatCard
          title="Gross Profit"
          value={summary.gross_profit.value}
          change={summary.gross_profit.change}
          icon={TrendingUp}
          color="#3B82F6"
        />
        <StatCard
          title="Profit Margin"
          value={summary.profit_margin.value}
          change={summary.profit_margin.change}
          icon={LineChartIcon}
          color="#F59E0B"
        />
        <StatCard
          title="Customer Retention"
          value={summary.customer_retention.value}
          change={summary.customer_retention.change}
          icon={Users}
          color="#8B5CF6"
        />
        <StatCard
          title="Forecast Accuracy"
          value={summary.forecast_accuracy.value}
          change={summary.forecast_accuracy.change}
          icon={Activity}
          color="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                <p className="text-xs text-slate-500">Weekly Trend</p>
              </div>
              <Badge variant="outline" className="bg-[#348169] text-white hover:bg-[#348169]">Weekly</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#348169" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#348169" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#348169" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sales by Channel</CardTitle>
              <p className="text-xs text-slate-500">By Revenue</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={salesByChannel}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="percentage"
                      labelLine={false}
                    >
                      {salesByChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {salesByChannel.map((channel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md" style={{ backgroundColor: `${channel.color}20`, color: channel.color }}>
                          {getChannelIcon(channel.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{channel.name}</p>
                          <p className="text-xs text-slate-500">₹{channel.revenue} Cr</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold">{channel.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#348169]" />
                Actionable AI Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getAlertColor(alert.type)} flex gap-3 items-start`}>
                  <div className="shrink-0 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-sm">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto shrink-0 h-6 w-6">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-l-4 border-[#348169]">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top Performing Stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStores.map((store, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{store.store_name}</h4>
                      <p className="text-xs text-slate-500">{store.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-sm text-[#348169]">₹{store.revenue_cr} Cr</h4>
                    <p className="text-xs text-slate-500">{store.order_count} orders</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
