'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Brain,
  Box,
  RefreshCw,
  Download,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const inventoryData = [
  { month: 'Jan', stock: 1200, demand: 950, predicted: 1100 },
  { month: 'Feb', stock: 1150, demand: 1050, predicted: 1080 },
  { month: 'Mar', stock: 1250, demand: 980, predicted: 1120 },
  { month: 'Apr', stock: 1100, demand: 1150, predicted: 1050 },
  { month: 'May', stock: 1300, demand: 900, predicted: 1200 },
  { month: 'Jun', stock: 1250, demand: 950, predicted: 1180 },
];

const stockAlerts = [
  { product: 'iPhone 15 Pro', current: 15, threshold: 50, urgency: 'critical' },
  { product: 'Nike Air Max', current: 25, threshold: 40, urgency: 'high' },
  { product: 'Samsung Galaxy', current: 35, threshold: 60, urgency: 'medium' },
  { product: 'Sony Headphones', current: 45, threshold: 50, urgency: 'low' },
];

const StatCard = ({ title, value, change, icon: Icon, color, unit }) => {
  const isPositive = change > 0;
  const isGood = title.includes('Alerts') ? change < 0 : change > 0;

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

export default function AIInventoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'alerts', label: 'Stock Alerts' },
    { id: 'optimization', label: 'Optimization' },
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
            <Box className="h-6 w-6 text-blue-500" />
            AI Inventory Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI-powered inventory management and stock optimization
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
          title="Total Inventory Value"
          value={2450000}
          change={8.5}
          icon={Package}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          unit="₹"
        />
        <StatCard
          title="Stock Accuracy"
          value={96.8}
          change={2.3}
          icon={CheckCircle2}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          unit="%"
        />
        <StatCard
          title="Stock Alerts"
          value={12}
          change={-15}
          icon={AlertTriangle}
          color="bg-rose-50 dark:bg-rose-950/30 text-rose-600"
          unit=""
        />
        <StatCard
          title="Reorder Efficiency"
          value={89.2}
          change={5.1}
          icon={Brain}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
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
                <CardTitle className="text-sm font-semibold">Stock vs Demand Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} name="Current Stock" />
                    <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2} name="Demand" />
                    <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Stock Alerts & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAlerts.map((alert) => (
                  <div key={alert.product} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.urgency === 'critical' ? 'bg-rose-500' :
                        alert.urgency === 'high' ? 'bg-amber-500' :
                        alert.urgency === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.product}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Current: {alert.current} | Threshold: {alert.threshold}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      alert.urgency === 'critical' ? 'destructive' :
                      alert.urgency === 'high' ? 'destructive' : 'outline'
                    }>
                      {alert.urgency.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'optimization' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">AI Stock Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Auto-Reorder Suggestion</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    AI recommends increasing order quantity for iPhone 15 Pro by 25% based on predicted demand surge.
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Stock Level Optimization</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Current stock levels are optimal for 85% of products. Consider reducing safety stock for slow-moving items.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}