'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Calendar,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  FileText,
  Handshake,
  IndianRupee,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchDealSourceKPI, fetchDealSourceAnalytics } from '@/service/api/deal/api';

// ─────────────────────────────────────────
// Dynamic Source Color Palette
// ─────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  'Website / Enquiry Form': '#3b82f6',
  'Referral': '#22c55e',
  'Cold Call': '#f59e0b',
  'Email Campaign': '#8b5cf6',
  'Email Marketing': '#8b5cf6',
  'Social Media': '#06b6d4',
  'Facebook': '#1877f2',
  'News Paper': '#64748b',
  'Others': '#f43f5e',
  'Unknown': '#94a3b8',
};

const getSourceColor = (source: string) => {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source];
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#ec4899', '#14b8a6', '#f97316'];
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Tiny sparkline renderer for the detail table
function MiniSparkline({ color }: { color: string }) {
  const points = Array.from({ length: 6 }, () => 8 + Math.random() * 14);
  const w = 60, h = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(p => h - ((p - min) / range) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Custom donut label
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) {
  if (pct < 7) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${pct}%`}
    </text>
  );
}

// ─────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────
export default function DealBySourcePage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<'Week' | 'Month'>('Week');

  // Date Range and Period parameters for API body payloads
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-11');
  const [period, setPeriod] = useState<[string, string]>(['2025-06-08', '2026-06-15']);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [minDeals, setMinDeals] = useState('');
  const [maxDeals, setMaxDeals] = useState('');
  const [minWinRate, setMinWinRate] = useState('');
  const [minTotalValue, setMinTotalValue] = useState('');
  const [maxTotalValue, setMaxTotalValue] = useState('');

  // ==========================================
  // TanStack Queries
  // ==========================================

  const { data: kpiResponse, isLoading: isLoadingKPI } = useQuery({
    queryKey: ['dealSourceKPI', startDate, endDate],
    queryFn: () => fetchDealSourceKPI(startDate, endDate),
  });

  const { data: analyticsResponse, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['dealSourceAnalytics', startDate, endDate, period],
    queryFn: () => fetchDealSourceAnalytics(startDate, endDate, period),
  });

  const isLoading = isLoadingKPI || isLoadingAnalytics;

  // ==========================================
  // Data Transformations
  // ==========================================

  const detailedList = analyticsResponse?.data?.detailed || [];
  const trendData = analyticsResponse?.data?.trend || [];

  const mappedSourceData = detailedList.map(row => ({
    name: row.source || 'Unknown',
    deals: Number(row.deals_created) || 0,
    won: Number(row.won_deals) || 0,
    lost: Number(row.lost_deals) || 0,
    winRate: Number(row.win_rate) || 0,
    totalValue: Number(row.total_deal_value) || 0,
    avgValue: Number(row.avg_deal_value) || 0,
  }));

  // Filter source data dynamically based on the state variables
  const filteredSourceData = mappedSourceData.filter(row => {
    if (sourceSearch && !row.name.toLowerCase().includes(sourceSearch.toLowerCase())) return false;
    if (minDeals && row.deals < parseInt(minDeals)) return false;
    if (maxDeals && row.deals > parseInt(maxDeals)) return false;
    if (minWinRate && row.winRate < parseFloat(minWinRate)) return false;
    if (minTotalValue && row.totalValue < parseFloat(minTotalValue)) return false;
    if (maxTotalValue && row.totalValue > parseFloat(maxTotalValue)) return false;
    return true;
  });

  const totalDeals = filteredSourceData.reduce((acc, row) => acc + row.deals, 0);
  const totalWon = filteredSourceData.reduce((acc, row) => acc + row.won, 0);
  const totalLost = filteredSourceData.reduce((acc, row) => acc + row.lost, 0);
  const totalValueSum = filteredSourceData.reduce((acc, row) => acc + row.totalValue, 0);
  const avgWinRate = totalDeals > 0 ? (totalWon / totalDeals) * 100 : 0;
  const avgDealValueOverall = filteredSourceData.length > 0 ? (totalValueSum / filteredSourceData.length) : 0;

  const pieData = filteredSourceData.map(s => ({
    name: s.name,
    value: s.deals,
    pct: totalDeals > 0 ? parseFloat(((s.deals / totalDeals) * 100).toFixed(1)) : 0
  }));

  // Extract all unique source keys from trend items dynamically
  const trendSourcesSet = new Set<string>();
  trendData.forEach((item: any) => {
    Object.keys(item).forEach(key => {
      if (key !== 'label') {
        trendSourcesSet.add(key);
      }
    });
  });
  
  const dynamicTrendLines = Array.from(trendSourcesSet).map(source => ({
    key: source,
    label: source,
    color: getSourceColor(source)
  }));

  const filteredTrendLines = dynamicTrendLines.filter(line => 
    filteredSourceData.some(row => row.name === line.label)
  );

  const isFiltered = !!(sourceSearch || minDeals || maxDeals || minWinRate || minTotalValue || maxTotalValue);

  const displayTotalDeals = isFiltered ? totalDeals : (kpiResponse?.data?.total_deals_generated ?? totalDeals);
  const displayTotalWon = isFiltered ? totalWon : (kpiResponse?.data?.won_deals ?? totalWon);
  const displayTotalValue = isFiltered ? totalValueSum : (kpiResponse?.data?.total_deal_value ?? totalValueSum);
  const displayWinRate = isFiltered ? avgWinRate : (kpiResponse?.data?.win_rate ?? avgWinRate);

  const dynamicKpis = [
    {
      label: 'Total Deals Generated',
      value: displayTotalDeals.toString(),
      change: '+18.6% vs Apr 2024',
      up: true,
      icon: FileText,
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-505',
    },
    {
      label: 'Won Deals',
      value: displayTotalWon.toString(),
      change: '+14.3% vs Apr 2024',
      up: true,
      icon: Handshake,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-505',
    },
    {
      label: 'Total Deal Value',
      value: `₹ ${displayTotalValue.toLocaleString('en-IN')}`,
      change: '-22.7% vs Apr 2024',
      up: false,
      icon: IndianRupee,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-505',
    },
    {
      label: 'Win Rate',
      value: `${displayWinRate.toFixed(2)}%`,
      change: '-3.2% vs Apr 2024',
      up: false,
      icon: Trophy,
      iconBg: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-505',
    },
  ];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ── SKELETON ── */}
        {isLoading ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1">
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-5 h-24 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-5 h-72 animate-pulse" />
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-5 h-72 animate-pulse" />
            </div>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-5 h-64 animate-pulse" />
          </motion.div>
        ) : (

          /* ── FULL VIEW ── */
          <motion.div key="content" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-5 text-left p-1">

            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.push('/Deal')} className="cursor-pointer hover:text-slate-650 dark:hover:text-slate-200">
                    Deals
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-slate-500 dark:text-slate-400">Analytics</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-355">Deal Generation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Deals Generated from Different Sources
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                  Track and analyze deals created from various sources.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Date Range Picker (opens filter panel) */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 h-9 px-3.5 rounded-lg border text-xs font-bold transition-colors shadow-xs hover:cursor-pointer ${
                    showFilters ? 'bg-slate-100 dark:bg-slate-800 border-blue-500 text-blue-600' : 'border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {startDate} – {endDate}
                  <ChevronRight className="h-3 w-3 text-slate-400 rotate-90" />
                </button>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-905 transition-colors shadow-xs ${
                    showFilters ? 'bg-slate-100 dark:bg-slate-800 border-blue-500 text-blue-600' : ''
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>

                <button
                  onClick={() => toast.info('More options')}
                  className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Advanced Collapsible Filter Panel */}
            {showFilters && (
              <div className="border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl shadow-2xs p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  
                  {/* Source Search */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Name</label>
                    <Input
                      placeholder="Filter by source..."
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Min Deals */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Deals Created</label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={minDeals}
                      onChange={(e) => setMinDeals(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Max Deals */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Deals Created</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={maxDeals}
                      onChange={(e) => setMaxDeals(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-805 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Min Win Rate */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Win Rate (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 25"
                      value={minWinRate}
                      onChange={(e) => setMinWinRate(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-205 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Min Total Value */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Value (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={minTotalValue}
                      onChange={(e) => setMinTotalValue(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-205 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Max Total Value */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Value (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000000"
                      value={maxTotalValue}
                      onChange={(e) => setMaxTotalValue(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-205 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                  {/* Start Date */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Trend Period Start */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend Period Start</label>
                    <Input
                      type="date"
                      value={period[0]}
                      onChange={(e) => setPeriod([e.target.value, period[1]])}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Trend Period End */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend Period End</label>
                    <Input
                      type="date"
                      value={period[1]}
                      onChange={(e) => setPeriod([period[0], e.target.value])}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* Reset All Button */}
                  <div className="flex justify-start lg:justify-end pb-0.5">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSourceSearch('');
                        setMinDeals('');
                        setMaxDeals('');
                        setMinWinRate('');
                        setMinTotalValue('');
                        setMaxTotalValue('');
                        setStartDate('2026-01-01');
                        setEndDate('2026-06-11');
                        setPeriod(['2025-06-08', '2026-06-15']);
                      }}
                      className="h-8.5 text-xs font-bold text-rose-500 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-4 cursor-pointer shadow-none rounded-lg"
                    >
                      Reset All
                    </Button>
                  </div>
                </div>

              </div>
            )}

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {dynamicKpis.map((card) => (
                <div key={card.label}
                  className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">
                      {card.label}
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight truncate">
                      {card.value}
                    </p>
                    <div className={`flex items-center gap-1 mt-0.5 text-[10.5px] font-bold ${card.up ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500 dark:text-rose-450'}`}>
                      {card.up
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />}
                      {card.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Donut Chart + Legend Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100/90 dark:border-slate-850">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Deals by Source</h2>
                </div>
                <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* Donut */}
                  <div className="w-[170px] h-[170px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={CustomLabel}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] ?? '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} deals`, name]}
                          contentStyle={{
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="-mt-[106px] mb-14 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalDeals}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">Total Deals</span>
                    </div>
                  </div>

                  {/* Legend Table */}
                  <div className="flex-1 w-full overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <th className="text-left pb-2 font-extrabold text-slate-400 uppercase text-[10px] tracking-wide">Source</th>
                          <th className="text-right pb-2 font-extrabold text-slate-400 uppercase text-[10px] tracking-wide">Deals</th>
                          <th className="text-right pb-2 font-extrabold text-slate-400 uppercase text-[10px] tracking-wide pr-1">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSourceData.map(s => {
                          const pct = totalDeals > 0 ? ((s.deals / totalDeals) * 100).toFixed(1) : '0';
                          return (
                            <tr key={s.name} className="border-b border-slate-50 dark:border-slate-850 last:border-0">
                              <td className="py-2.5 flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: SOURCE_COLORS[s.name] }} />
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[120px]">{s.name}</span>
                              </td>
                              <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-300">{s.deals}</td>
                              <td className={`py-2.5 text-right font-bold pr-1 ${parseFloat(pct) >= 17 ? 'text-rose-500' : 'text-slate-505 dark:text-slate-400'}`}>
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-slate-200 dark:border-slate-800 font-extrabold">
                          <td className="pt-2.5 text-slate-900 dark:text-white text-[11px]">Total</td>
                          <td className="pt-2.5 text-right text-slate-900 dark:text-white">{totalDeals}</td>
                          <td className="pt-2.5 text-right text-slate-900 dark:text-white pr-1">{totalDeals > 0 ? '100%' : '0%'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Trend Line Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100/90 dark:border-slate-850 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Deals Trend by Source</h2>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Grouped by:</span>
                    <select
                      value={groupBy}
                      onChange={e => setGroupBy(e.target.value as any)}
                      className="bg-transparent text-slate-700 dark:text-slate-300 font-bold border-none outline-none cursor-pointer text-xs"
                    >
                      <option value="Week">Week</option>
                      <option value="Month">Month</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 pt-5">
                  <ResponsiveContainer width="100%" height={195}>
                    <LineChart data={trendData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }}
                      />
                      {filteredTrendLines.map(tl => (
                        <Line
                          key={tl.key}
                          type="monotone"
                          dataKey={tl.key}
                          stroke={tl.color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: tl.color, strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                          name={tl.label}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-2">
                    {filteredTrendLines.map(tl => (
                      <div key={tl.key} className="flex items-center gap-1.5">
                        <span className="h-2 w-5 rounded-full inline-block" style={{ background: tl.color }} />
                        <span className="text-[10px] font-semibold text-slate-505 dark:text-slate-400">{tl.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Detailed Table ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100/90 dark:border-slate-850">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Deals by Source (Detailed)</h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100/90 dark:border-slate-850">
                    <TableRow className="border-b-0">
                      {['Source', 'Deals Created', 'Won Deals', 'Lost Deals', 'Win Rate (%)', 'Total Deal Value (₹)', 'Avg Deal Value (₹)', 'Trend'].map(col => (
                        <TableHead key={col} className="text-[10.5px] font-extrabold uppercase text-slate-400 py-3.5 first:pl-6 last:pr-6 whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {filteredSourceData.map((row, idx) => (
                      <TableRow key={row.name} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                        <TableCell className="pl-6 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: SOURCE_COLORS[row.name] }} />
                            {row.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">{row.deals}</TableCell>
                        <TableCell className="py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{row.won}</TableCell>
                        <TableCell className="py-3.5 text-rose-500 dark:text-rose-455 font-bold">{row.lost}</TableCell>
                        <TableCell className="py-3.5">
                          <span className={`font-bold ${row.winRate >= 34 ? 'text-emerald-600 dark:text-emerald-400' : row.winRate < 20 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {row.winRate.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {row.totalValue.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-3.5 text-slate-600 dark:text-slate-400">
                          {row.avgValue.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-3.5 pr-6">
                          <MiniSparkline color={SOURCE_COLORS[row.name]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-slate-50/60 dark:bg-slate-850/20 border-t border-slate-200 dark:border-slate-800 font-extrabold">
                      <TableCell className="pl-6 py-3.5 text-slate-900 dark:text-white font-extrabold">Total</TableCell>
                      <TableCell className="py-3.5 text-slate-900 dark:text-white font-extrabold">{totalDeals}</TableCell>
                      <TableCell className="py-3.5 text-emerald-600 dark:text-emerald-400 font-extrabold">{totalWon}</TableCell>
                      <TableCell className="py-3.5 text-rose-500 dark:text-rose-455 font-extrabold">{totalLost}</TableCell>
                      <TableCell className="py-3.5 text-slate-900 dark:text-white font-extrabold">
                        {avgWinRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="py-3.5 text-slate-900 dark:text-white font-extrabold">
                        {totalValueSum.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-3.5 text-slate-900 dark:text-white font-extrabold">
                        {Math.round(avgDealValueOverall).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-3.5 pr-6 text-slate-400">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
