'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Repeat,
  AlertTriangle,
  Brain,
  Download,
  Star,
  MapPin,
  MessageSquare,
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
  Legend
} from 'recharts';

const COLORS = [
  '#7c3aed',
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
    total_customers: { value: 24500, change: 12.5 },
    total_revenue: { value: 8.5, change: 15.2 },
    avg_order_value: { value: 3450, change: 2.1 },
    purchase_frequency: { value: 3.2, change: 5.4 },
    churn_rate: { value: 12.5, change: -2.1 }
  },
  customer_segments: [
    { segment: 'Loyal Champions', customers: 4500, percentage: 18, revenue: 3.5 },
    { segment: 'Active Buyers', customers: 8500, percentage: 35, revenue: 2.8 },
    { segment: 'New Customers', customers: 5200, percentage: 21, revenue: 1.2 },
    { segment: 'At Risk', customers: 3800, percentage: 16, revenue: 0.8 },
    { segment: 'Lost', customers: 2500, percentage: 10, revenue: 0.2 }
  ],
  customer_behavior: [
    { week: 'W1', new_customers: 120, active_customers: 850, returning_customers: 450 },
    { week: 'W2', new_customers: 150, active_customers: 890, returning_customers: 480 },
    { week: 'W3', new_customers: 180, active_customers: 920, returning_customers: 510 },
    { week: 'W4', new_customers: 140, active_customers: 950, returning_customers: 530 },
    { week: 'W5', new_customers: 210, active_customers: 1050, returning_customers: 580 },
    { week: 'W6', new_customers: 250, active_customers: 1120, returning_customers: 620 },
    { week: 'W7', new_customers: 220, active_customers: 1150, returning_customers: 650 },
    { week: 'W8', new_customers: 280, active_customers: 1250, returning_customers: 710 }
  ],
  customer_locations: [
    { country: 'United States', percentage: 45 },
    { country: 'India', percentage: 25 },
    { country: 'United Kingdom', percentage: 12 },
    { country: 'Australia', percentage: 8 },
    { country: 'Canada', percentage: 6 },
    { country: 'Germany', percentage: 4 }
  ],
  engagement_channels: [
    { channel: 'Email Marketing', percentage: 35, orders: 4200 },
    { channel: 'Social Media', percentage: 28, orders: 3500 },
    { channel: 'Organic Search', percentage: 22, orders: 2800 },
    { channel: 'Direct Traffic', percentage: 15, orders: 1800 }
  ],
  recent_feedback: [
    { customer: 'Sarah Jenkins', rating: 5, text: 'Absolutely love the new product features! The customer service was also very helpful.', date: '2 days ago' },
    { customer: 'Michael Chen', rating: 4, text: 'Good quality, but shipping took a bit longer than expected.', date: '3 days ago' },
    { customer: 'Emma Watson', rating: 5, text: 'Best purchase Ive made this year. Highly recommend to everyone.', date: '5 days ago' },
    { customer: 'David Miller', rating: 2, text: 'The item arrived damaged. Had to request a replacement.', date: '1 week ago' },
    { customer: 'Lisa Taylor', rating: 4, text: 'Great value for money. Will definitely buy again.', date: '1 week ago' }
  ],
  ai_recommendations: [
    { type: 'reactivation', title: 'Re-engage 3,800 At-Risk Customers', description: '3,800 customers havent purchased recently. Send personalized win-back offers.', impact: 'Potential recovery of ₹25L revenue' },
    { type: 'loyalty', title: 'Enhance Loyalty Program', description: '4,500 loyal customers drive significant revenue. Introduce VIP tier benefits.', impact: 'Expected 20% increase in repeat purchase rate' },
    { type: 'targeting', title: 'Cross-sell to Active Buyers', description: '8,500 active buyers show interest in complementary categories.', impact: 'Potential AOV increase of 20-25%' }
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

export default function AICustomerInsightsDashboard() {
  const {
    executive_summary: summary,
    customer_segments: segments,
    customer_behavior: behavior,
    customer_locations: locations,
    engagement_channels: channels,
    recent_feedback: feedback,
    ai_recommendations: recommendations
  } = mockData;

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
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Customer Insights Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">AI-Powered Customer Analytics | Real-time Insights</p>
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
          title="Total Customers"
          value={summary.total_customers.value}
          change={summary.total_customers.change}
          icon={Users}
          color="#7c3aed"
        />
        <StatCard
          title="Total Revenue"
          value={summary.total_revenue.value}
          change={summary.total_revenue.change}
          icon={DollarSign}
          color="#10b981"
          unit="Cr"
        />
        <StatCard
          title="Average Order Value"
          value={summary.avg_order_value.value}
          change={summary.avg_order_value.change}
          icon={ShoppingCart}
          color="#06b6d4"
          unit="₹"
        />
        <StatCard
          title="Purchase Frequency"
          value={summary.purchase_frequency.value}
          change={summary.purchase_frequency.change}
          icon={Repeat}
          color="#f59e0b"
        />
        <StatCard
          title="Churn Rate"
          value={summary.churn_rate.value}
          change={summary.churn_rate.change}
          icon={AlertTriangle}
          color="#ef4444"
          unit="%"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Customer Behavior (Last 8 Weeks)</CardTitle>
            <p className="text-xs text-slate-500">Active vs New vs Returning Customers</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={behavior}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="active_customers" name="Active Customers" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
                <Area type="monotone" dataKey="returning_customers" name="Returning Customers" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                <Area type="monotone" dataKey="new_customers" name="New Customers" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Customer Segments</CardTitle>
            <p className="text-xs text-slate-500">Distribution by AI Segmentation</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="percentage"
                  labelLine={false}
                >
                  {segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Customer Segments Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">Segment</th>
                    <th className="px-4 py-3 text-right">Customers</th>
                    <th className="px-4 py-3 text-right">% Total</th>
                    <th className="px-4 py-3 text-right">Revenue (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {segments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.segment}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{item.customers.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.percentage}%</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">₹{item.revenue} Cr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3 text-right">Customer Count (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {locations.map((loc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {loc.country}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-slate-700">{loc.percentage}%</span>
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${loc.percentage}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Channels & Feedback Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Engagement Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channels} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="channel" width={120} tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`${value}%`, "Share"]} />
                <Bar dataKey="percentage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {feedback.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="shrink-0 pt-1">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{item.customer}</span>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
        <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/50">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-purple-900 dark:text-purple-300">AI-Powered Recommendations</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => {
              const colors: Record<string, string> = {
                reactivation: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800',
                loyalty: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800',
                targeting: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-blue-800',
              };
              const colorClass = colors[rec.type] || 'border-purple-200 bg-purple-50 dark:bg-purple-950/20 text-purple-800';

              return (
                <div key={idx} className={`p-4 rounded-xl border-t-4 ${colorClass}`}>
                  <h4 className="font-bold text-sm mb-2">{rec.title}</h4>
                  <p className="text-xs opacity-80 mb-3 line-clamp-3">{rec.description}</p>
                  <p className="text-xs font-bold opacity-100 mt-auto">Impact: {rec.impact}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
