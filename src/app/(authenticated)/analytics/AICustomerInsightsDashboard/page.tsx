'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  ShoppingCart,
  Brain,
  Star,
  RefreshCw,
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const customerData = [
  { month: 'Jan', new: 450, returning: 1200, churn: 35 },
  { month: 'Feb', new: 520, returning: 1350, churn: 42 },
  { month: 'Mar', new: 480, returning: 1280, churn: 38 },
  { month: 'Apr', new: 580, returning: 1450, churn: 45 },
  { month: 'May', new: 620, returning: 1520, churn: 50 },
  { month: 'Jun', new: 550, returning: 1380, churn: 40 },
];

const segmentData = [
  { name: 'Premium', value: 35, color: '#8b5cf6' },
  { name: 'Regular', value: 45, color: '#3b82f6' },
  { name: 'Occasional', value: 15, color: '#10b981' },
  { name: 'At Risk', value: 5, color: '#ef4444' },
];

const customerInsights = [
  { type: 'warning', title: 'Churn Risk Alert', description: '23 customers at high risk of churning', confidence: 88 },
  { type: 'success', title: 'Loyalty Program Success', description: 'Loyalty members show 40% higher retention', confidence: 92 },
  { type: 'info', title: 'Segment Opportunity', description: 'Occasional segment shows high upsell potential', confidence: 85 },
];

const StatCard = ({ title, value, change, icon: Icon, color, unit }) => {
  const isPositive = change > 0;
  const isGood = title.includes('Churn') ? change < 0 : change > 0;

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

const InsightCard = ({ insight }) => {
  const getTypeColor = () => {
    switch (insight.type) {
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
      case 'success': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900';
      case 'info': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900';
      default: return 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800';
    }
  };

  const getIcon = () => {
    switch (insight.type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'info': return <Brain className="h-5 w-5 text-blue-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <Card className={`border ${getTypeColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</h4>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {insight.confidence}% confidence
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{insight.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AICustomerInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'segments', label: 'Customer Segments' },
    { id: 'behavior', label: 'Behavior Analysis' },
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
            <Users className="h-6 w-6 text-pink-500" />
            AI Customer Insights Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI-powered customer behavior analysis and segmentation
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
          title="Total Customers"
          value={18500}
          change={8.5}
          icon={Users}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          unit=""
        />
        <StatCard
          title="Customer Lifetime Value"
          value={12500}
          change={12.3}
          icon={DollarSign}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          unit="₹"
        />
        <StatCard
          title="Churn Rate"
          value={2.8}
          change={-0.5}
          icon={TrendingDown}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
          unit="%"
        />
        <StatCard
          title="Retention Rate"
          value={94.2}
          change={3.1}
          icon={Heart}
          color="bg-pink-50 dark:bg-pink-950/30 text-pink-600"
          unit="%"
        />
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Customer Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerInsights.map((insight) => (
              <InsightCard key={insight.title} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>

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
                <CardTitle className="text-sm font-semibold">Customer Acquisition & Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={2} name="New Customers" />
                    <Line type="monotone" dataKey="returning" stroke="#10b981" strokeWidth={2} name="Returning Customers" />
                    <Line type="monotone" dataKey="churn" stroke="#ef4444" strokeWidth={2} name="Churned" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Segment Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Premium Customers</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">35% • High value, low churn risk</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Regular Customers</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">45% • Steady purchasing pattern</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Occasional Customers</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">15% • Seasonal buyers, high potential</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">At Risk Customers</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">5% • High churn risk, needs attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'behavior' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Customer Behavior Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Average Purchase Frequency</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">2.3 purchases per month</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    +12% vs last quarter
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Customer Satisfaction</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">4.6/5 average rating</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                    Stable
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}