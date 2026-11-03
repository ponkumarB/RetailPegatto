'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Brain,
  Calendar,
  BarChart3,
  LineChart,
  Download,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertTriangle
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

const forecastData = [
  { month: 'Jan', actual: 120, predicted: 115, confidence: 85 },
  { month: 'Feb', actual: 135, predicted: 130, confidence: 88 },
  { month: 'Mar', actual: 110, predicted: 120, confidence: 82 },
  { month: 'Apr', actual: 145, predicted: 140, confidence: 90 },
  { month: 'May', actual: 130, predicted: 135, confidence: 87 },
  { month: 'Jun', actual: 155, predicted: 150, confidence: 91 },
  { month: 'Jul', predicted: 165, confidence: 89 },
  { month: 'Aug', predicted: 175, confidence: 86 },
  { month: 'Sep', predicted: 160, confidence: 88 },
  { month: 'Oct', predicted: 185, confidence: 92 },
  { month: 'Nov', predicted: 195, confidence: 90 },
  { month: 'Dec', predicted: 210, confidence: 87 },
];

const categoryForecast = [
  { category: 'Electronics', current: 45, forecast: 52, trend: 'up' },
  { category: 'Apparel', current: 38, forecast: 42, trend: 'up' },
  { category: 'Home & Kitchen', current: 28, forecast: 30, trend: 'stable' },
  { category: 'Beauty', current: 22, forecast: 25, trend: 'up' },
  { category: 'Sports', current: 18, forecast: 20, trend: 'up' },
];

const StatCard = ({ title, value, change, icon: Icon, color, suffix = '', unit = '' }) => {
  const isPositive = change > 0;
  
  // Custom logic for isGood (if churn/error/low stock, lower is better)
  const isGood = title.toLowerCase().includes('error') ? change < 0 : change > 0;
  const isColorClass = color && (color.startsWith('bg-') || color.includes(' text-'));
  
  const formatValue = () => {
    if (typeof value === 'number') {
      if (unit === '₹') return `₹${value.toLocaleString()}`;
      return `${value}${unit || ''}`;
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

export default function AIForecastDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accuracy', label: 'Accuracy Metrics' },
    { id: 'trends', label: 'Forecast Trends' },
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
            <Target className="h-6 w-6 text-purple-500" />
            AI Forecast Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Predictive analytics for returns and refunds forecasting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Models
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Forecast
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Forecast Accuracy"
          value={94.2}
          change={2.1}
          icon={Target}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
          unit="%"
        />
        <StatCard
          title="Mean Absolute Error"
          value={8.5}
          change={-3.2}
          icon={TrendingDown}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          unit=""
        />
        <StatCard
          title="Forecast Horizon"
          value={90}
          change={0}
          icon={Calendar}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          unit=" days"
        />
        <StatCard
          title="Model Confidence"
          value={87}
          change={1.5}
          icon={Brain}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Forecast vs Actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Forecast vs Actual Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" connectNulls={false} />
                      <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Category-wise Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryForecast.map((item) => (
                      <div key={item.category} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Current</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.current}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Forecast</p>
                            <p className="text-sm font-bold text-purple-600">{item.forecast}</p>
                          </div>
                          {item.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'accuracy' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Model Accuracy Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">94.2%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Overall Accuracy</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">0.89</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">F1 Score</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">87%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Precision</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">91%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Recall</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'trends' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Forecast Confidence Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="confidence" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Model Confidence %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}