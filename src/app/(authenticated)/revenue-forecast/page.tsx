'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Calendar,
  Download,
  ChevronDown,
  Filter,
  Eye,
  MoreVertical,
  TrendingUp,
  SlidersHorizontal,
  Target,
  DollarSign,
  AlertCircle,
  FileBarChart2,
  Clock,
  ArrowRight,
  TrendingDown,
  ChevronLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line
} from 'recharts';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import {
  fetchRevenueForecastKPIView,
  fetchForecastByMonthView,
  fetchPipelineByStageWeightedView,
  fetchForecastAccuracyTrendView,
  fetchForecastSummaryByOwnerView
} from '@/service/api/Analytics/api';
import { PeriodFilter, getPeriodRange } from '@/components/ui/PeriodFilter';

// Formatting currency helper (formatting Indian Rupees)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Formatting currency to abbreviated Lakhs / Crores
const formatAbbreviated = (value: number) => {
  const val = value || 0;
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
};

const formatDateObj = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const customChartPresets = [
  {
    label: 'Next 2 Months',
    getRange: () => {
      const today = new Date();
      const end = new Date(today);
      end.setMonth(today.getMonth() + 2);
      return `${formatDateObj(today)} - ${formatDateObj(end)}`;
    }
  },
  {
    label: 'Next 3 Months',
    getRange: () => {
      const today = new Date();
      const end = new Date(today);
      end.setMonth(today.getMonth() + 3);
      return `${formatDateObj(today)} - ${formatDateObj(end)}`;
    }
  },
  {
    label: 'Next 6 Months',
    getRange: () => {
      const today = new Date();
      const end = new Date(today);
      end.setMonth(today.getMonth() + 6);
      return `${formatDateObj(today)} - ${formatDateObj(end)}`;
    }
  },
  {
    label: 'Next 9 Months',
    getRange: () => {
      const today = new Date();
      const end = new Date(today);
      end.setMonth(today.getMonth() + 9);
      return `${formatDateObj(today)} - ${formatDateObj(end)}`;
    }
  },
  {
    label: 'Next 1 Year',
    getRange: () => {
      const today = new Date();
      const end = new Date(today);
      end.setFullYear(today.getFullYear() + 1);
      return `${formatDateObj(today)} - ${formatDateObj(end)}`;
    }
  }
];

const parseDateRange = (dateStr: string) => {
  if (!dateStr) return { start_date: '', end_date: '' };
  const parts = dateStr.split(' - ');
  if (parts.length !== 2) return { start_date: '', end_date: '' };

  const parseDate = (d: string) => {
    const p = d.trim().split(' ');
    if (p.length !== 3) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = String(months.indexOf(p[1]) + 1).padStart(2, '0');
    return `${p[2]}-${month}-${p[0]}`; // YYYY-MM-DD
  };

  return { start_date: parseDate(parts[0]), end_date: parseDate(parts[1]) };
};

export default function RevenueForecastPage() {
  const { primaryColor } = useStore();

  const [dateRange, setDateRange] = useState(() => getPeriodRange('This Year'));
  const [periodPreset, setPeriodPreset] = useState('This Year');
  const [chartDateRange, setChartDateRange] = useState(() => customChartPresets[2].getRange());
  const [chartPeriodPreset, setChartPeriodPreset] = useState<any>('Next 6 Months');
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [forecastType, setForecastType] = useState('Default Forecast');
  const [showForecastDropdown, setShowForecastDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [stageData, setStageData] = useState<any[]>([]);
  const [accuracyData, setAccuracyData] = useState<any[]>([]);
  const [ownerForecasts, setOwnerForecasts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let queryStr = '?Organization_Id=1'; // Replace with dynamic if needed later
        
        if (dateRange) {
          const { start_date, end_date } = parseDateRange(dateRange);
          if (start_date && end_date) {
            queryStr += `&start_date=${start_date}&end_date=${end_date}`;
          }
        }
        
        const [kpiRes, stageRes, accuracyRes, ownerRes] = await Promise.all([
          fetchRevenueForecastKPIView(queryStr),
          fetchPipelineByStageWeightedView(queryStr),
          fetchForecastAccuracyTrendView(queryStr),
          fetchForecastSummaryByOwnerView(queryStr)
        ]);

        if (kpiRes?.data) setKpiData(kpiRes.data);
        if (stageRes?.data?.stages) setStageData(stageRes.data.stages);
        if (Array.isArray(accuracyRes?.data)) setAccuracyData(accuracyRes.data);
        else if (accuracyRes?.data?.trend) setAccuracyData(accuracyRes.data.trend);
        if (ownerRes?.data?.owners) setOwnerForecasts(ownerRes.data.owners);

      } catch (error) {
        console.error('Failed to fetch revenue forecast data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  // Fetch monthly chart data based on separate filter
  useEffect(() => {
    const loadChartData = async () => {
      setIsChartLoading(true);
      try {
        let queryStr = '?Organization_Id=1';
        if (chartDateRange) {
          const { start_date, end_date } = parseDateRange(chartDateRange);
          if (start_date && end_date) {
            queryStr += `&start_date=${start_date}&end_date=${end_date}`;
          }
        }
        const monthRes = await fetchForecastByMonthView(queryStr);
        if (Array.isArray(monthRes?.data)) setMonthlyData(monthRes.data);
        else if (monthRes?.data?.months) setMonthlyData(monthRes.data.months);
      } catch (error) {
        console.error('Failed to fetch monthly chart data:', error);
      } finally {
        setIsChartLoading(false);
      }
    };
    loadChartData();
  }, [chartDateRange]);

  const tableColumns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-7.5 w-7.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200/55 dark:border-slate-800 shrink-0">
            {row.owner ? row.owner.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'U'}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {row.owner || 'Unknown'}
          </span>
        </div>
      )
    },
    {
      key: 'open_pipeline',
      header: 'Open Pipeline (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(row.open_pipeline)}</span>
    },
    {
      key: 'weighted_forecast',
      header: 'Weighted Forecast (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.weighted_forecast)}</span>
    },
    {
      key: 'best_case_forecast',
      header: 'Best Case (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(row.best_case_forecast)}</span>
    },
    {
      key: 'committed_revenue',
      header: 'Committed (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(row.committed_revenue)}</span>
    },
    {
      key: 'forecast_target',
      header: 'Forecast Target (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(row.forecast_target)}</span>
    },
    {
      key: 'pipeline_coverage',
      header: 'Coverage',
      align: 'center',
      render: (row) => {
        const coverageNum = parseFloat(row.coverage || '0');
        return (
          <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide ${coverageNum >= 2.0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/40' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/40'}`}>
            {row.coverage || '0x'}
          </span>
        );
      }
    },
    {
      key: 'accuracy_percentage',
      header: 'Accuracy',
      align: 'center',
      render: (row) => {
        const accuracyNum = parseFloat(row.accuracy || '0');
        return (
          <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide ${accuracyNum >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/40' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/40'}`}>
            {row.accuracy || '0%'}
          </span>
        );
      }
    }
  ], []);

  // Filter forecasts locally
  const filteredForecasts = useMemo(() => {
    if (selectedOwner === 'All') return ownerForecasts;
    return ownerForecasts.filter((f) => f.owner === selectedOwner);
  }, [ownerForecasts, selectedOwner]);

  // Unique owners for selector dropdown
  const ownerOptions = useMemo(() => {
    const unique = new Set(ownerForecasts.map((f) => f.owner).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [ownerForecasts]);

  // Aggregate metrics based on filtered records
  const aggregatedMetrics = useMemo(() => {
    const totals = {
      forecasted: kpiData?.total_forecasted_revenue || 0,
      weighted: kpiData?.weighted_forecast || 0,
      bestCase: kpiData?.best_case_forecast || 0,
      target: kpiData?.forecast_target || 0,
      committed: kpiData?.committed_revenue || 0,
      coverage: kpiData?.pipeline_coverage || '0x'
    };

    return [
      { id: 'forecasted', label: 'Total Forecasted Revenue', value: totals.forecasted, color: '#10B981', icon: TrendingUp },
      { id: 'weighted', label: 'Weighted Forecast', value: totals.weighted, color: '#3B82F6', icon: Clock },
      { id: 'best-case', label: 'Best Case Forecast', value: totals.bestCase, color: '#8B5CF6', icon: SlidersHorizontal },
      { id: 'target', label: 'Forecast Target', value: totals.target, color: '#F59E0B', icon: Target },
      { id: 'committed', label: 'Committed Revenue', value: totals.committed, color: '#0D9488', icon: DollarSign },
      { id: 'coverage', label: 'Pipeline Coverage', value: totals.coverage, color: '#F43F5E', icon: AlertCircle, isCoverage: true },
    ];
  }, [kpiData]);

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Forecast Generated Successfully', {
        description: 'New pipeline models and regression trends updated.',
      });
    } catch (e) {
      toast.error('Failed to generate forecast.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    toast.success('Export Successful', {
      description: `Revenue Forecast Report exported as CSV.`,
    });
  };

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Breadcrumb section */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">Lead Tracking</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Conversion</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Heading Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Revenue Forecasting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Forecast your future revenue based on pipeline, historical data and trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
          {/* Date Picker */}
          <PeriodFilter
            value={dateRange}
            period={periodPreset}
            onChange={(range, period) => {
              setDateRange(range);
              setPeriodPreset(period);
              toast.info(`Selected range: ${range}`);
            }}
          />

          {/* Generate Forecast Button */}
          <Button
            onClick={handleGenerateForecast}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 h-10.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            {isGenerating ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            <span>{isGenerating ? 'Calculating...' : 'Generate Forecast'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {aggregatedMetrics.map((card) => {
          const CardIcon = card.icon;
          return (
            <Card key={card.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl overflow-hidden hover:shadow-2xs transition-shadow">
              <CardContent className="p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div
                    className="h-8.5 w-8.5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}15`, color: card.color }}
                  >
                    <CardIcon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {card.isCoverage 
                    ? card.value 
                    : formatCurrency(card.value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart 1: Forecast by Month */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl flex flex-col">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Forecast by Month
              {isChartLoading && <Clock className="h-3 w-3 animate-spin text-slate-400" />}
            </h3>
            <PeriodFilter
              value={chartDateRange}
              period={chartPeriodPreset}
              customPresets={customChartPresets}
              hideCustomDate={true}
              dropdownOnly={true}
              onChange={(range, period) => {
                setChartDateRange(range);
                setChartPeriodPreset(period);
              }}
            />
          </div>
          
          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => `${val / 100000}L`}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg space-y-1">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {payload[0].payload.period}
                            </p>
                            {payload.map((p, idx) => (
                              <p key={idx} className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {p.name}: <span className="font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(p.value as number)}</span>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar name="Best Case Forecast" dataKey="best_case_forecast" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={15} />
                  <Bar name="Weighted Forecast" dataKey="weighted_forecast" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <button 
              onClick={() => toast.info('Navigating to Period Forecast details')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-end gap-1 outline-none self-end mt-2"
            >
              <span>View Forecast by Period</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>

        {/* Chart 2: Pipeline by Stage (Weighted) */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl flex flex-col">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Pipeline by Stage (Weighted)
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Stage Breakdown</span>
          </div>

          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
            <div className="relative aspect-[4/3] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="weighted_amount"
                  >
                    {stageData.map((entry, index) => {
                      const colors = ['#3B82F6', '#06B6D4', '#EC4899', '#F59E0B', '#10B981'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatAbbreviated(kpiData?.weighted_forecast || 0)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Weighted Total
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
              {stageData.map((d, i) => {
                const colors = ['#3B82F6', '#06B6D4', '#EC4899', '#F59E0B', '#10B981'];
                return (
                  <div key={d.stage} className="flex items-start gap-2">
                    <div className="h-2.5 w-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 block">
                        {d.stage}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                        {formatAbbreviated(d.weighted_amount || 0)} ({d.percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Forecast Accuracy (Trend) */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl flex flex-col">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Forecast Accuracy (Trend)
            </h3>
            <span className="text-[11px] font-bold text-slate-400 hover:text-slate-655 cursor-pointer flex items-center gap-1">
              <span>Last 6 Quarters</span>
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>

          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {payload[0].payload.period}
                            </p>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              Accuracy: {payload[0].value}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: '#FFFFFF' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button 
              onClick={() => toast.info('Navigating to Accuracy Report details')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-end gap-1 outline-none self-end mt-2"
            >
              <span>View Accuracy Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>

      </div>

      {/* Table Section */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl overflow-hidden">
        <div className="p-5 border-b dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Forecast Summary by Owner
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Owner dropdown selector */}
            <div className="relative">
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="h-10 pl-3.5 pr-8 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none min-w-[120px]"
              >
                <option value="All">All Owners</option>
                {ownerOptions.filter(o => o !== 'All').map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <ReusableTable
            columns={tableColumns}
            data={filteredForecasts}
            rowKey="owner_id"
            borderless
            showGear={false}
          />
        </div>
      </Card>
    </div>
  );
}
