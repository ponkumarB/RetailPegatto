'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Search,
  ChevronDown,
  Info,
  Briefcase,
  Clock,
  Layers,
  AlertTriangle,
  MoreVertical
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
} from 'recharts';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useOpportunityAgingDashboard } from '@/service/api/Dashboard/OpportunityAging/queries';
import { OpportunityDetail } from '@/service/api/Dashboard/OpportunityAging/api';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatAbbreviated = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function OpportunityAgingAnalysisPage() {
  const { primaryColor } = useStore();

  const [dateRange, setDateRange] = useState('May 14, 2024 - May 20, 2024');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stageChartMode, setStageChartMode] = useState<'value' | 'count'>('value');
  const [valueChartMode, setValueChartMode] = useState<'value' | 'count'>('value');

  // API Call
  const { data: response, isLoading } = useOpportunityAgingDashboard({
    organization_id: 1,
    period: ['2026-01-01', '2026-06-29'] // Hardcoded for demo, could be based on dateRange
  });

  const dashboardData = response?.data;
  
  // Extracting details for Reusable Table
  const opportunityDetails = useMemo(() => {
    let details = dashboardData?.opportunity_details || [];
    if (searchQuery) {
      details = details.filter(d => 
        d.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (d.account && d.account.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return details;
  }, [dashboardData, searchQuery]);

  const columns: ColumnConfig<OpportunityDetail>[] = [
    {
      header: 'Deal Name',
      key: 'deal_name',
      render: (item) => <span className="font-bold text-slate-800 dark:text-slate-100">{item.deal_name}</span>
    },
    {
      header: 'Account',
      key: 'account',
      render: (item) => <span className="font-semibold text-slate-500 dark:text-slate-400">{item.account || '-'}</span>
    },
    {
      header: 'Stage',
      key: 'stage',
      render: (item) => (
        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
          {item.stage}
        </span>
      )
    },
    {
      header: 'Owner',
      key: 'owner',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-350 flex items-center justify-center border border-slate-200/50 dark:border-slate-800">
            {item.owner.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {item.owner}
          </span>
        </div>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      align: 'right',
      render: (item) => <span className="font-extrabold text-slate-900 dark:text-white text-xs">{formatCurrency(item.amount)}</span>
    },
    {
      header: 'Age (Days)',
      key: 'age_days',
      align: 'center',
      render: (item) => {
        let ageTextColor = 'text-slate-700 dark:text-slate-300';
        if (item.age_days > 180) ageTextColor = 'text-rose-600 dark:text-rose-400 font-extrabold';
        else if (item.age_days > 90) ageTextColor = 'text-orange-600 dark:text-orange-400 font-extrabold';
        else if (item.age_days > 60) ageTextColor = 'text-amber-600 dark:text-amber-400 font-bold';
        else ageTextColor = 'text-emerald-600 dark:text-emerald-400 font-semibold';
        return <span className={ageTextColor}>{item.age_days}</span>;
      }
    },
    {
      header: 'Aging Bucket',
      key: 'aging_bucket',
      align: 'center',
      render: (item) => {
        let bucketStyles = 'bg-slate-50 text-slate-700';
        if (item.aging_bucket.includes('0-30')) bucketStyles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/40';
        else if (item.aging_bucket.includes('31-60')) bucketStyles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/40';
        else if (item.aging_bucket.includes('61-90')) bucketStyles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/40';
        else bucketStyles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100/40';

        return <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wide uppercase ${bucketStyles}`}>{item.aging_bucket}</span>
      }
    },
    {
      header: 'Probability',
      key: 'probability',
      align: 'center'
    },
    {
      header: 'Expected Close',
      key: 'expected_close',
      align: 'center'
    },
    {
      header: 'Last Activity',
      key: 'last_activity',
      align: 'center',
      render: (item) => item.last_activity || '-'
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (item) => item.status || '-'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsExporting(false);
    toast.success('Export Successful', {
      description: `Opportunity Aging Report for range ${dateRange} exported as CSV.`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
           {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Pre-process Colors
  const bucketColors: Record<string, string> = {
    '0-30 Days': '#10B981',
    '31-60 Days': '#3B82F6',
    '61-90 Days': '#F59E0B',
    '91-180 Days': '#EF4444',
    '>180 Days': '#8B5CF6'
  };

  const donutData = dashboardData?.aging_summary.buckets.map(b => ({
    name: b.bucket,
    value: b.count,
    amount: b.value,
    percentage: `${b.percentage}%`,
    color: bucketColors[b.bucket] || '#94A3B8'
  })) || [];

  const barChartData = donutData.map((d) => ({
    name: d.name,
    'Value (₹)': d.amount,
    'Count': d.value,
    color: d.color,
  }));

  const icons = [Briefcase, Calendar, Clock, Layers, AlertTriangle, AlertTriangle];

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Breadcrumb Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/analytics">Analytics</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Opportunity Aging Analysis</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Title Header with DatePicker & Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Opportunity Aging Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track the age of open opportunities to identify risks and take timely actions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-3xs transition-all outline-none"
            >
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1">
                {['May 14, 2024 - May 20, 2024', 'Last 30 Days', 'Last 90 Days', 'This Year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      toast.info(`Date range changed to ${range}`);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-3xs transition-all"
            variant="outline"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {dashboardData?.top_cards.map((card, i) => {
          const CardIcon = icons[i % icons.length];
          const color = Object.values(bucketColors)[i - 1] || '#3B82F6';
          return (
            <Card key={card.title} className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl overflow-hidden hover:shadow-2xs transition-shadow">
              <CardContent className="p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div
                    className="h-8.5 w-8.5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: `${color}15`, color: color }}
                  >
                    <CardIcon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {card.count}
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(card.value)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Opportunity Aging Summary
            </h3>
            <Info className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <CardContent className="p-5 flex flex-col gap-6">
            <div className="relative aspect-[4/3] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{dashboardData?.aging_summary.total_opportunities}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Total Opportunities
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1.5">
                  {formatAbbreviated(dashboardData?.aging_summary.total_value || 0)}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Total Value
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-start gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full mt-0.5 flex-none"
                    style={{ backgroundColor: d.color }}
                  />
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      {d.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                      {d.value} ({d.percentage}) • {formatAbbreviated(d.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Aging by Stage
            </h3>
          </div>
          <CardContent className="p-5 space-y-5">
            {dashboardData?.aging_by_stage.map((row) => (
              <div key={row.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 w-28 truncate">{row.stage}</span>
                  <span className="text-slate-500 dark:text-slate-400">{formatAbbreviated(row.value)}</span>
                </div>
                
                <div className="h-6 w-full rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-3xs">
                  {Object.entries(row.distribution).map(([key, val], idx) => {
                    const mappedKey = key.replace('_', '-').replace('_plus', ' Days');
                    const label = mappedKey === '180 Days' ? '> 180 Days' : mappedKey + ' Days';
                    const color = Object.values(bucketColors)[idx];
                    if(val === 0) return null;
                    return (
                      <div
                        key={key}
                        style={{
                          width: `${val}%`,
                          backgroundColor: color,
                        }}
                        className="h-full flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:opacity-90 transition-opacity"
                        title={`${row.stage} - ${label}: ${val}%`}
                      >
                        {val > 15 && `${val}%`}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-2xl">
          <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Aging by Value (₹)
            </h3>
            <div>
              <select
                value={valueChartMode}
                onChange={(e) => setValueChartMode(e.target.value as 'value' | 'count')}
                className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer border-none p-0 pr-4"
              >
                <option value="value">By Value (₹)</option>
                <option value="count">By Count</option>
              </select>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 15, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => {
                      if (valueChartMode === 'value') {
                        return `${val / 1000000}M`;
                      }
                      return val;
                    }}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg space-y-1 z-50">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              {data.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Value: <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(data['Value (₹)'])}</span>
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Count: <span className="font-bold text-slate-800 dark:text-slate-200">{data.Count} ops</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={valueChartMode === 'value' ? 'Value (₹)' : 'Count'}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Opportunities Detail
          </h3>
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs font-bold h-10 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-slate-350"
            />
          </div>
        </div>
        <ReusableTable 
          data={opportunityDetails}
          columns={columns}
          loading={false}
          actions={(row) => (
            <button
              onClick={() => toast.info(`Options menu opened for ${row.deal_name}`)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>
          )}
        />
      </div>
    </div>
  );
}
