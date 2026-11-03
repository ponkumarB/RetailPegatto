'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ApexChart = dynamic(() => import('react-apexcharts').then((mod) => {
  if (typeof window !== 'undefined') {
    const windowWithApex = window as any;
    if (windowWithApex.ApexCharts && !windowWithApex.ApexCharts.prototype._originalDestroy) {
      windowWithApex.ApexCharts.prototype._originalDestroy = windowWithApex.ApexCharts.prototype.destroy;
      windowWithApex.ApexCharts.prototype.destroy = function () {
        try {
          this._originalDestroy();
        } catch (e) {
          console.debug('Safely intercepted ApexCharts unmount error:', e);
        }
      };
    }
  }
  return mod.default;
}), { ssr: false });

import { PeriodFilter } from '@/components/ui/PeriodFilter';
import {
  Briefcase, Target, Users, Percent, DollarSign, Sparkles,
  RefreshCw, SlidersHorizontal, ArrowRight, Activity, ArrowUpRight
} from 'lucide-react';
import {
  fetchPipelineKPIs,
  fetchPipelineByStage,
  fetchPipelineConversionRate,
  fetchPipelineTrend,
  fetchForecastVsActual,
  fetchPipelineBySource,
  fetchPipelineHealth,
  fetchRecentPipelineActivity,
  fetchTopPipelineOpportunities
} from '@/service/api/Analytics/api';

const formatDateForApi = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatRupee = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return '₹ 0';
  if (value >= 10000000) {
    return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100005) {
    return `₹ ${(value / 100000).toFixed(2)} L`;
  }
  return `₹ ${value.toLocaleString('en-IN')}`;
};

const formatOppCount = (val: any, fallback: string) => val !== null && val !== undefined ? `${val} Opps` : fallback;
const formatStageValue = (val: any, fallback: string) => val !== null && val !== undefined ? formatRupee(Number(val)) : fallback;
const formatStageWtd = (val: any, fallback: string) => val !== null && val !== undefined ? `${formatRupee(Number(val))} Wtd` : fallback;
const formatStageProb = (val: any, fallback: string) => val !== null && val !== undefined ? `${val}% Prob` : fallback;

function Chart(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-400"
        style={{ height: props.height || '220px' }}
      >
        Loading chart...
      </div>
    );
  }
  const modifiedOptions = {
    ...props.options,
    chart: {
      ...props.options?.chart,
      animations: {
        enabled: false
      }
    }
  };
  return <ApexChart {...props} options={modifiedOptions} />;
}

export default function PipelineAnalyticsPage() {
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // API State
  const [kpiData, setKpiData] = useState<any>(null);
  const [stageData, setStageData] = useState<any>(null);
  const [conversionRateData, setConversionRateData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [sourceData, setSourceData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [recentActivityData, setRecentActivityData] = useState<any>(null);
  const [topOpportunitiesData, setTopOpportunitiesData] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    setDateRange(`${formatDate(twoYearsAgo)} - ${formatDate(today)}`);
  }, []);

  // Fetch Pipeline Analytics when dateRange or refreshKey changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || '1') : '1';
        const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || '72') : '72';
        
        const dates = dateRange.split(' - ');
        const startDate = formatDateForApi(dates[0]) || '2026-01-01';
        const endDate = formatDateForApi(dates[1] || dates[0]) || '2026-06-30';

        const params = { start_date: startDate, end_date: endDate, Organization_Id: orgId };
        const userParams = { ...params, User_Id: userId };

        const [
          kpisRes,
          stageRes,
          conversionRes,
          trendRes,
          forecastRes,
          sourceRes,
          healthRes,
          activityRes,
          oppsRes
        ] = await Promise.allSettled([
          fetchPipelineKPIs(params),
          fetchPipelineByStage(userParams),
          fetchPipelineConversionRate(params),
          fetchPipelineTrend(params),
          fetchForecastVsActual(userParams),
          fetchPipelineBySource(params),
          fetchPipelineHealth(userParams),
          fetchRecentPipelineActivity(params),
          fetchTopPipelineOpportunities(params)
        ]);

        if (kpisRes.status === 'fulfilled') setKpiData(kpisRes.value);
        if (stageRes.status === 'fulfilled') setStageData(stageRes.value);
        if (conversionRes.status === 'fulfilled') setConversionRateData(conversionRes.value);
        if (trendRes.status === 'fulfilled') setTrendData(trendRes.value);
        if (forecastRes.status === 'fulfilled') setForecastData(forecastRes.value);
        if (sourceRes.status === 'fulfilled') setSourceData(sourceRes.value);
        if (healthRes.status === 'fulfilled') setHealthData(healthRes.value);
        if (activityRes.status === 'fulfilled') setRecentActivityData(activityRes.value);
        if (oppsRes.status === 'fulfilled') setTopOpportunitiesData(oppsRes.value);

      } catch (err: any) {
        console.error('Error fetching pipeline analytics:', err);
        setError(err.message || 'An error occurred while fetching pipeline analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, refreshKey]);

  // Robust Helpers for KPI Data Retrieval
  const getKpiValue = (key: string) => {
    if (!kpiData) return '-';
    const dataObj = kpiData.data || kpiData;
    const summary = dataObj.summary || dataObj;
    const value = summary[key];
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('prob') || key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent')) return `${value}%`;
      if (key.toLowerCase().includes('opp') || key.toLowerCase().includes('count')) return value.toLocaleString();
      return formatRupee(value);
    }
    return String(value);
  };

  const getKpiChange = (key: string) => {
    if (!kpiData) return '';
    const dataObj = kpiData.data || kpiData;
    const summary = dataObj.summary || dataObj;
    return summary[key] !== undefined ? String(summary[key]) : '';
  };

  const getKpiIsPositive = (key: string) => {
    if (!kpiData) return true;
    const dataObj = kpiData.data || kpiData;
    const summary = dataObj.summary || dataObj;
    return summary[key] !== undefined ? Boolean(summary[key]) : true;
  };

  // KPIs setup mapping backend data to labels
  const kpis = [
    { 
      label: 'Total Pipeline Value', 
      value: getKpiValue('total_pipeline_value'), 
      change: getKpiChange('total_pipeline_value_change'), 
      isPositive: getKpiIsPositive('total_pipeline_value_is_positive'), 
      icon: DollarSign, 
      bg: 'bg-blue-50 dark:bg-blue-950/30', 
      col: 'text-blue-600' 
    },
    { 
      label: 'Weighted Pipeline', 
      value: getKpiValue('weighted_pipeline'), 
      change: getKpiChange('weighted_pipeline_change'), 
      isPositive: getKpiIsPositive('weighted_pipeline_is_positive'), 
      icon: Target, 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
      col: 'text-emerald-600' 
    },
    { 
      label: 'Open Opportunities', 
      value: getKpiValue('open_opportunities'), 
      change: getKpiChange('open_opportunities_change'), 
      isPositive: getKpiIsPositive('open_opportunities_is_positive'), 
      icon: Briefcase, 
      bg: 'bg-indigo-50 dark:bg-indigo-950/30', 
      col: 'text-indigo-600' 
    },
    { 
      label: 'Win Probability (Avg.)', 
      value: getKpiValue('average_win_probability'), 
      change: getKpiChange('average_win_probability_change'), 
      isPositive: getKpiIsPositive('average_win_probability_is_positive'), 
      icon: Percent, 
      bg: 'bg-orange-50 dark:bg-orange-950/30', 
      col: 'text-orange-600' 
    },
    { 
      label: 'Forecast (This Quarter)', 
      value: getKpiValue('forecast_this_quarter'), 
      change: getKpiChange('forecast_this_quarter_change'), 
      isPositive: getKpiIsPositive('forecast_this_quarter_is_positive'), 
      icon: Sparkles, 
      bg: 'bg-teal-50 dark:bg-teal-950/30', 
      col: 'text-teal-600' 
    },
    { 
      label: 'Expected Revenue', 
      value: getKpiValue('expected_revenue'), 
      change: getKpiChange('expected_revenue_change'), 
      isPositive: getKpiIsPositive('expected_revenue_is_positive'), 
      icon: Users, 
      bg: 'bg-rose-50 dark:bg-rose-950/30', 
      col: 'text-rose-600' 
    }
  ];

  // Stage Data parsing
  const getStageMetric = (stageName: string, metric: 'count' | 'value' | 'weighted_value' | 'probability', fallback: any) => {
    if (!stageData) return fallback;
    const list = Array.isArray(stageData) 
      ? stageData 
      : (stageData.data || stageData.stages || []);
    
    const stageObj = list.find((s: any) => 
      String(s.stage || s.name || '').toLowerCase().replace(/[\s_/]/g, '') === stageName.toLowerCase().replace(/[\s_/]/g, '')
    );
    if (!stageObj) return fallback;
    const val = stageObj[metric];
    if (val === undefined || val === null) return fallback;
    return val;
  };

  const stagesDef = [
    { name: 'Qualification', key: 'Qualification' },
    { name: 'Needs Analysis', key: 'NeedsAnalysis' },
    { name: 'Proposal / Quote', key: 'ProposalQuote' },
    { name: 'Negotiation', key: 'Negotiation' },
    { name: 'Closed Won', key: 'ClosedWon' }
  ];

  const getDonutSeries = () => {
    const rawVals = stagesDef.map(s => getStageMetric(s.key, 'value', null));
    if (rawVals.every(v => v === null)) return [0, 0, 0, 0, 0];
    return rawVals.map(v => {
      const num = Number(v || 0);
      if (num >= 100000) return Number((num / 10000000).toFixed(2));
      return num;
    });
  };

  const getDonutTotal = () => {
    if (!stageData) return '-';
    const rawVals = stagesDef.map(s => getStageMetric(s.key, 'value', 0));
    const sum = rawVals.reduce((acc, curr) => acc + Number(curr || 0), 0);
    if (sum === 0) return '-';
    return sum >= 10000000 ? `${(sum / 10000000).toFixed(2)} Cr` : formatRupee(sum);
  };

  const stageDonutOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Qualification', 'Needs Analysis', 'Proposal / Quote', 'Negotiation', 'Closed Won'],
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Pipeline',
              formatter: getDonutTotal,
              style: { fontSize: '11px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 800,
              color: '#1E293B'
            }
          }
        }
      }
    }
  };

  // Conversion rate parsing
  const getConversionRate = () => {
    if (!conversionRateData) return '-';
    const dataObj = conversionRateData.data || conversionRateData;
    const rate = dataObj.conversion_rate ?? dataObj.rate ?? dataObj.value;
    if (rate === undefined || rate === null) return '-';
    return `${rate}%`;
  };

  // Trend Data parsing
  const getTrendData = () => {
    if (!trendData) {
      return {
        categories: [],
        series: [
          { name: 'Total Pipeline', data: [] },
          { name: 'Weighted Pipeline', data: [] }
        ]
      };
    }
    const list = Array.isArray(trendData) ? trendData : (trendData.data || trendData.trend || []);
    const categories = list.map((item: any) => item.period || item.month || item.date || '');
    const totalData = list.map((item: any) => {
      const val = Number(item.total_pipeline || item.total || item.value || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });
    const weightedData = list.map((item: any) => {
      const val = Number(item.weighted_pipeline || item.weighted || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });

    return {
      categories,
      series: [
        { name: 'Total Pipeline', data: totalData },
        { name: 'Weighted Pipeline', data: weightedData }
      ]
    };
  };
  const trendResult = getTrendData();

  const trendLineOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: ['#0565FD', '#10B981'],
    xaxis: {
      categories: trendResult.categories,
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      title: { text: '₹ in Crores', style: { color: '#94A3B8', fontSize: '9px', fontWeight: 650 } },
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'left' as const }
  };

  // Forecast vs Actual Parsing
  const getForecastVsActualData = () => {
    if (!forecastData) {
      return {
        categories: [],
        series: [
          { name: 'Forecast', data: [] },
          { name: 'Actual', data: [] },
          { name: 'Target', data: [] }
        ]
      };
    }
    const list = Array.isArray(forecastData) ? forecastData : (forecastData.data || forecastData.forecasts || []);
    const categories = list.map((item: any) => item.period || item.month || item.date || '');
    const forecastVal = list.map((item: any) => {
      const val = Number(item.forecast || item.expected || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });
    const actualVal = list.map((item: any) => {
      const val = Number(item.actual || item.revenue || item.won || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });
    const targetVal = list.map((item: any) => {
      const val = Number(item.target || item.quota || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });

    return {
      categories,
      series: [
        { name: 'Forecast', data: forecastVal },
        { name: 'Actual', data: actualVal },
        { name: 'Target', data: targetVal }
      ]
    };
  };
  const forecastResult = getForecastVsActualData();

  const forecastVsActualOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#3B82F6', '#10B981', '#EF4444'],
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: forecastResult.categories,
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    yaxis: {
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const }
  };

  // Source distribution parsing
  const getSourceData = () => {
    if (!sourceData) {
      return {
        categories: [],
        series: [{ name: 'Value (Cr)', data: [] }]
      };
    }
    const list = Array.isArray(sourceData) ? sourceData : (sourceData.data || sourceData.sources || []);
    const categories = list.map((item: any) => item.source || item.name || '');
    const data = list.map((item: any) => {
      const val = Number(item.value || item.amount || item.pipeline || 0);
      return val >= 100000 ? Number((val / 10000000).toFixed(2)) : val;
    });

    return {
      categories,
      series: [{ name: 'Value (Cr)', data }]
    };
  };
  const sourceResult = getSourceData();

  const sourceBarOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#0565FD'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '50%'
      }
    },
    xaxis: {
      categories: sourceResult.categories,
      labels: { style: { colors: '#94A3B8', fontSize: '9px' } }
    },
    grid: { borderColor: '#F1F5F9' }
  };

  // Top Opportunities parsing
  const getTopOpportunities = () => {
    if (!topOpportunitiesData) return [];
    const list = Array.isArray(topOpportunitiesData) 
      ? topOpportunitiesData 
      : (topOpportunitiesData.data || topOpportunitiesData.opportunities || []);
    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };
    return list.map((item: any) => ({
      name: item.name || item.opportunity || '',
      account: item.account || item.company || '',
      stage: item.stage || '',
      val: formatRupee(Number(item.value || item.amount || 0)),
      exp: formatRupee(Number(item.expected_revenue || item.weighted_value || 0)),
      date: formatDateStr(item.close_date || item.expected_close_date || '')
    }));
  };
  const opportunities = getTopOpportunities();

  // Health Score parsing
  const getPipelineHealth = () => {
    if (!healthData) {
      return {
        score: 0,
        status: '-',
        description: 'No pipeline health data available.'
      };
    }
    const dataObj = healthData.data || healthData;
    return {
      score: dataObj.score ?? dataObj.health_score ?? dataObj.value ?? 0,
      status: dataObj.status ?? dataObj.health_status ?? '-',
      description: dataObj.description ?? dataObj.message ?? 'No pipeline health data available.'
    };
  };
  const health = getPipelineHealth();

  // Recent activity timeline parsing
  const getRecentActivities = () => {
    if (!recentActivityData) return [];
    const list = Array.isArray(recentActivityData) 
      ? recentActivityData 
      : (recentActivityData.data || recentActivityData.activities || []);
    return list.map((item: any) => {
      const text = item.text || item.description || item.activity || '';
      const type = String(item.type || '').toLowerCase();
      let color = 'text-blue-500';
      if (type.includes('won') || type.includes('success') || type.includes('add')) {
        color = 'text-emerald-500';
      } else if (type.includes('lost') || type.includes('fail') || type.includes('drop')) {
        color = 'text-rose-500';
      } else if (type.includes('warn') || type.includes('negotiat')) {
        color = 'text-amber-500';
      }
      return { text, color };
    });
  };
  const recentActivities = getRecentActivities();

  const getGrowthDisplay = (changeStr: string) => {
    if (changeStr && changeStr.toLowerCase().includes('vs')) {
      return changeStr.replace(/vs\s+.*/gi, `vs ${period}`);
    }
    return changeStr || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Pipeline Analytics
          </h1>
          <p className="text-sm text-slate-455 mt-1">Monitor sales pipeline health, deal flow and forecast accuracy in real-time</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <PeriodFilter
            value={dateRange}
            period={period}
            onChange={(newRange, newPeriod) => {
              setDateRange(newRange);
              setPeriod(newPeriod);
            }}
          />
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="p-2.5 border dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-50 transition-all flex items-center justify-center shrink-0 shadow-xs"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !kpiData ? (
        <div className="h-[50vh] w-full flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading pipeline analytics...</p>
        </div>
      ) : error ? (
        <div className="h-[50vh] w-full flex flex-col items-center justify-center gap-3 text-red-500">
          <p className="text-sm font-semibold">Failed to load pipeline data: {error}</p>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((k, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">{k.label}</span>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{k.value}</h3>
                  <span className={`text-[10px] font-bold block ${k.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {k.isPositive ? '↑' : '↓'} {getGrowthDisplay(k.change)}
                  </span>
                </div>
                <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${k.bg} ${k.col}`}>
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Row 1: Pipeline by Stage Horizontal Process + Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Left Funnel Table */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Pipeline by Stage</h4>

                {/* Header Stage Labels Row */}
                <div className="grid grid-cols-5 gap-1 text-center py-2 text-[10px] font-black uppercase text-white">
                  <div className="py-2 bg-blue-600 rounded-lg">Qualification</div>
                  <div className="py-2 bg-purple-600 rounded-lg">Needs Analysis</div>
                  <div className="py-2 bg-emerald-600 rounded-lg">Proposal/Quote</div>
                  <div className="py-2 bg-amber-500 rounded-lg">Negotiation</div>
                  <div className="py-2 bg-rose-500 rounded-lg">Closed Won</div>
                </div>

                {/* Stages Grid Data */}
                <div className="space-y-3 mt-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-5 gap-1 text-center border-b dark:border-slate-800 pb-2">
                    {stagesDef.map((s, idx) => (
                      <span key={idx} className="font-black">
                        {formatOppCount(getStageMetric(s.key, 'count', null), '0 Opps')}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center border-b dark:border-slate-800 pb-2">
                    {stagesDef.map((s, idx) => (
                      <span key={idx} className="text-blue-600 font-black">
                        {formatStageValue(getStageMetric(s.key, 'value', null), '₹ 0')}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center border-b dark:border-slate-800 pb-2">
                    {stagesDef.map((s, idx) => (
                      <span key={idx} className="text-slate-400 font-medium">
                        {formatStageWtd(getStageMetric(s.key, 'weighted_value', null), '₹ 0 Wtd')}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {stagesDef.map((s, idx) => (
                      <span key={idx} className="text-emerald-600">
                        {formatStageProb(getStageMetric(s.key, 'probability', null), '0% Prob')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mt-4">
                <span>Overall Conversion Rate:</span>
                <span className="text-blue-600 dark:text-blue-400 font-black text-sm">{getConversionRate()}</span>
              </div>
            </div>

            {/* Right: Pipeline value by stage donut */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pipeline Value by Stage</h4>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">This Month</span>
                </div>
                <div className="h-[180px] flex items-center justify-center">
                  <Chart options={stageDonutOpts} series={getDonutSeries()} type="donut" height="180" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
                <span className="text-slate-400 font-medium">Stage allocations</span>
                <a href="#" className="flex items-center gap-1">View Detailed Report <ArrowRight className="h-3 w-3" /></a>
              </div>
            </div>
          </div>

          {/* Row 2: Pipeline Trend, Forecast vs Actual, Pipeline by Source */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Pipeline Trend */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pipeline Trend</h4>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">This Year</span>
                </div>
                <Chart
                  options={trendLineOpts}
                  series={trendResult.series}
                  type="line"
                  height="180"
                />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
                <span className="text-slate-400 font-medium">Monthly trajectory</span>
                <a href="#" className="flex items-center gap-1">View Trend Report <ArrowRight className="h-3 w-3" /></a>
              </div>
            </div>

            {/* Forecast vs Actual */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Forecast vs Actual</h4>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400">This Quarter</span>
                </div>
                <Chart
                  options={forecastVsActualOpts}
                  series={forecastResult.series}
                  type="bar"
                  height="180"
                />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
                <span className="text-slate-400 font-medium">Variance mapping</span>
                <a href="#" className="flex items-center gap-1">View Forecast Report <ArrowRight className="h-3 w-3" /></a>
              </div>
            </div>

            {/* Pipeline by Source */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Pipeline by Source</h4>
                <Chart
                  options={sourceBarOpts}
                  series={sourceResult.series}
                  type="bar"
                  height="180"
                />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-slate-800 text-xs font-bold text-blue-600">
                <span className="text-slate-400 font-medium">Channel distributions</span>
                <a href="#" className="flex items-center gap-1">View Source Report <ArrowRight className="h-3 w-3" /></a>
              </div>
            </div>
          </div>

          {/* Row 3: Top Pipeline Opportunities, Pipeline Health, Recent Pipeline Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Top Pipeline Opportunities Table */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Pipeline Opportunities</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700 dark:text-slate-300">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                      <th className="pb-2">Opportunity</th>
                      <th className="pb-2">Account</th>
                      <th className="pb-2">Stage</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Expected Revenue</th>
                      <th className="pb-2">Close Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {opportunities.length > 0 ? (
                      opportunities.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-2.5 font-bold text-slate-850 dark:text-slate-100">{row.name}</td>
                          <td className="py-2.5 text-slate-455">{row.account}</td>
                          <td className="py-2.5 text-blue-600 font-bold">{row.stage}</td>
                          <td className="py-2.5 font-black text-slate-850 dark:text-slate-100">{row.val}</td>
                          <td className="py-2.5 font-black text-emerald-600">{row.exp}</td>
                          <td className="py-2.5 font-mono">{row.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No opportunities found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pipeline Health Dial & Recent Activity */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Pipeline Health</h4>
                <div className="flex items-center gap-4 py-1">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-4 border-emerald-500 text-sm font-black text-slate-800 dark:text-slate-100 shrink-0">
                    {health.score}%
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-150 block">{health.status}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{health.description}</span>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-slate-800 pt-4 mt-3">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">Recent Pipeline Activity</h5>
                <div className="space-y-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className={`${act.color} shrink-0`}>●</span>
                        <span>{act.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">
                      No recent activity.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
