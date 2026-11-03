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
  const isNeutral = change === 0;
  
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
    <Card className="rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:shadow-sm transition-all min-w-0">
      <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 h-full">
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <div className="mt-1 mb-1">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none truncate">
              {formatValue()}{suffix}
            </h3>
          </div>
          <div className="flex items-center gap-1 mt-auto">
            {isNeutral ? (
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                No change from last month
              </span>
            ) : isPositive ? (
              <>
                <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${isGood ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                  {Math.abs(change)}% from last month
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className={`h-3.5 w-3.5 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${isGood ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                  {Math.abs(change)}% from last month
                </span>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <div
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${isColorClass ? color : ''}`}
            style={!isColorClass ? { backgroundColor: `${color}15`, color: color } : {}}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
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
      className="max-w-[1600px] mx-auto space-y-3.5 sm:space-y-4 p-3 sm:p-4.5 lg:p-5 min-w-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 shrink-0" />
            <span>AI Forecast Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Predictive analytics for returns and refunds forecasting
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button variant="outline" size="sm" className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh Models</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer">
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Forecast</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
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
      <div className="space-y-3">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Forecast vs Actual */}
              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
                <CardHeader className="p-3.5 sm:p-4 pb-1">
                  <CardTitle className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center justify-between">
                    <span>Forecast vs Actual Returns</span>
                    <Badge variant="outline" className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800">
                      AI Projected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-2">
                  <div className="w-full h-[260px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" connectNulls={false} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted" dot={{ r: 3 }} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Forecast */}
              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
                <CardHeader className="p-3.5 sm:p-4 pb-1">
                  <CardTitle className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center justify-between">
                    <span>Category-wise Forecast</span>
                    <span className="text-[11px] font-normal text-slate-400">Next 90 Days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-2">
                  <div className="space-y-2">
                    {categoryForecast.map((item) => (
                      <div key={item.category} className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Current</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.current}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-purple-500 font-medium">Forecast</p>
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400">{item.forecast}</p>
                          </div>
                          <div className="w-5 flex justify-center">
                            {item.trend === 'up' ? (
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
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
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <CardHeader className="p-3.5 sm:p-4 pb-1">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100">
                Model Accuracy Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">94.2%</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Overall Accuracy</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">0.89</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">F1 Score</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">87%</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Precision</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600">91%</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Recall</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'trends' && (
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <CardHeader className="p-3.5 sm:p-4 pb-1">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100">
                Forecast Confidence Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="w-full h-[280px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Area type="monotone" dataKey="confidence" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name="Model Confidence %" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}