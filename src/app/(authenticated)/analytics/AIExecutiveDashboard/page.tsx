'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Brain,
  Crown,
  BarChart3,
  RefreshCw,
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
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

const executiveData = [
  { month: 'Jan', revenue: 3200000, profit: 480000, growth: 12 },
  { month: 'Feb', revenue: 3500000, profit: 520000, growth: 15 },
  { month: 'Mar', revenue: 3300000, profit: 490000, growth: 8 },
  { month: 'Apr', revenue: 3800000, profit: 570000, growth: 18 },
  { month: 'May', revenue: 4100000, profit: 615000, growth: 22 },
  { month: 'Jun', revenue: 3900000, profit: 585000, growth: 16 },
];

const kpiData = [
  { name: 'Revenue Growth', value: 18.5, target: 20, color: '#10b981' },
  { name: 'Profit Margin', value: 15.2, target: 18, color: '#3b82f6' },
  { name: 'Customer Satisfaction', value: 92, target: 95, color: '#8b5cf6' },
  { name: 'Market Share', value: 8.5, target: 12, color: '#f59e0b' },
];

const performanceDistribution = [
  { name: 'Excellent', value: 35, color: '#10b981' },
  { name: 'Good', value: 40, color: '#3b82f6' },
  { name: 'Average', value: 20, color: '#f59e0b' },
  { name: 'Below Average', value: 5, color: '#ef4444' },
];

const executiveInsights = [
  { type: 'success', title: 'Revenue Target Achievement', description: 'Current trajectory indicates 95% probability of meeting Q3 revenue targets', confidence: 94 },
  { type: 'warning', title: 'Profit Margin Optimization', description: 'AI suggests potential 8% margin improvement through supply chain optimization', confidence: 87 },
  { type: 'info', title: 'Market Expansion Opportunity', description: 'Analysis shows untapped potential in emerging markets with 25% growth opportunity', confidence: 82 },
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
      case 'warning': return <Target className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'info': return <Brain className="h-5 w-5 text-blue-500" />;
      default: return <BarChart3 className="h-5 w-5 text-slate-500" />;
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

export default function AIExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'kpis', label: 'KPI Analysis' },
    { id: 'performance', label: 'Performance' },
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
            <Crown className="h-6 w-6 text-amber-500" />
            AI Executive Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Strategic AI insights for executive decision-making
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
          title="Total Revenue"
          value={21800000}
          change={18.5}
          icon={DollarSign}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          unit="₹"
        />
        <StatCard
          title="Net Profit"
          value={3260000}
          change={22.3}
          icon={Target}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          unit="₹"
        />
        <StatCard
          title="Profit Margin"
          value={15.2}
          change={3.8}
          icon={TrendingUp}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
          unit="%"
        />
        <StatCard
          title="Market Share"
          value={8.5}
          change={1.2}
          icon={PieChart}
          color="bg-amber-50 dark:bg-amber-950/30 text-amber-600"
          unit="%"
        />
      </div>

      {/* AI Executive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Executive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {executiveInsights.map((insight) => (
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
                <CardTitle className="text-sm font-semibold">Revenue & Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={executiveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'kpis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">KPI Performance vs Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpiData.map((kpi) => (
                    <div key={kpi.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{kpi.name}</span>
                        <span className="text-xs text-slate-500">Target: {kpi.target}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                            backgroundColor: kpi.color
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{kpi.value}%</span>
                        <Badge variant={kpi.value >= kpi.target ? 'default' : 'destructive'}>
                          {kpi.value >= kpi.target ? 'On Track' : 'Below Target'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={performanceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Overall Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={executiveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue" />
                  <Area type="monotone" dataKey="profit" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}