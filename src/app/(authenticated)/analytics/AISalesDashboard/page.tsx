'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Brain,
  LineChart,
  Download,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const salesData = [
  { month: 'Jan', sales: 450000, predicted: 430000, orders: 1200 },
  { month: 'Feb', sales: 520000, predicted: 500000, orders: 1350 },
  { month: 'Mar', sales: 480000, predicted: 490000, orders: 1180 },
  { month: 'Apr', sales: 580000, predicted: 560000, orders: 1450 },
  { month: 'May', sales: 620000, predicted: 600000, orders: 1520 },
  { month: 'Jun', sales: 550000, predicted: 570000, orders: 1380 },
];

const topProducts = [
  { product: 'iPhone 15 Pro', sales: 125000, growth: 15, trend: 'up' },
  { product: 'Nike Air Max', sales: 98000, growth: 8, trend: 'up' },
  { product: 'Samsung Galaxy', sales: 87000, growth: -3, trend: 'down' },
  { product: 'Sony Headphones', sales: 65000, growth: 12, trend: 'up' },
];

const StatCard = ({ title, value, change, icon: Icon, color, unit }) => {
  const isPositive = change > 0;
  const isGood = change > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {unit === '₹' ? `₹${value.toLocaleString()}` : `${value}${unit || ''}`}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <ArrowUpRight className={`h-4 w-4 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
          ) : (
            <ArrowDownRight className={`h-4 w-4 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
          )}
          <span className={`text-xs font-semibold ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
            {Math.abs(change)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AISalesDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Product Analysis' },
    { id: 'forecast', label: 'Sales Forecast' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LineChart className="h-6 w-6 text-emerald-500" />
            AI Sales Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI-powered sales analytics and revenue forecasting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={3200000}
          change={12.5}
          icon={DollarSign}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          unit="₹"
        />
        <StatCard
          title="Total Orders"
          value={8080}
          change={8.3}
          icon={ShoppingCart}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          unit=""
        />
        <StatCard
          title="Average Order Value"
          value={396}
          change={4.2}
          icon={TrendingUp}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
          unit="₹"
        />
        <StatCard
          title="Conversion Rate"
          value={3.8}
          change={1.5}
          icon={Users}
          color="bg-amber-50 dark:bg-amber-950/30 text-amber-600"
          unit="%"
        />
      </div>

      {/* Custom Tabs */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Sales vs AI Predicted</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Actual Sales" />
                    <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'products' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((product) => (
                  <div key={product.product} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{product.product}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Sales: ₹{product.sales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.trend === 'up' ? 'default' : 'destructive'}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </Badge>
                      {product.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'forecast' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">AI Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Actual Sales" />
                  <Area type="monotone" dataKey="predicted" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="AI Predicted" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}