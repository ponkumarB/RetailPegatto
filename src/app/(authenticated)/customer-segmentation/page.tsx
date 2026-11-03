'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Sliders,
  ChevronDown,
  Download,
  Star,
  Heart,
  Clock,
  Tag,
  Edit2,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useCustomerSegmentList,
  useCustomerSegmentSearch,
  useCustomerSegmentFilter,
  useCustomerSegmentationDashboard,
  useDeleteCustomerSegment
} from '@/service/api/CustomerSegment/queries';

const COLORS: Record<string, string> = {
  'Premium Customers': '#10b981',
  'High Value Customers': '#10b981',
  'Loyal Customers': '#3b82f6',
  'Potential Customers': '#8b5cf6',
  'New Customers': '#f59e0b',
  'Inactive Customers': '#06b6d4',
  'At Risk Customers': '#f43f5e',
  'Price Sensitive': '#eab308',
  'Others': '#64748b'
};

const DEFAULT_COLOR = '#6366f1';

export default function CustomerSegmentationDashboard() {
  const { primaryColor } = useStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const dashboardQuery = useCustomerSegmentationDashboard({
    organization_id: 1,
    period: ["2026-01-01", "2026-06-29"]
  });
  
  const listQuery = useCustomerSegmentList();
  const searchQuery = useCustomerSegmentSearch(debouncedSearch);
  const filterQuery = useCustomerSegmentFilter({ Segment_Type: typeFilter !== 'All' ? typeFilter : undefined });

  const deleteMutation = useDeleteCustomerSegment();

  const activeQuery = debouncedSearch ? searchQuery : (typeFilter !== 'All' ? filterQuery : listQuery);
  const segments = activeQuery.data?.results || [];

  const handleDownloadReport = () => {
    toast.success('Segment list report compilation initiated. Downloader starting shortly...');
  };

  const filteredSegments = useMemo(() => {
    return segments.filter((seg) => {
      const matchesStatus = statusFilter === 'All' || seg.Status === statusFilter;
      return matchesStatus;
    });
  }, [segments, statusFilter]);

  const paginatedSegments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSegments.slice(startIndex, startIndex + pageSize);
  }, [filteredSegments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSegments.length / pageSize) || 1;

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          toast.success('Customer segment successfully deleted!');
          setDeleteId(null);
        }
      });
    }
  };

  const getSegmentIcon = (name: string) => {
    if (name.includes('High') || name.includes('Premium')) {
      return (
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Star className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (name.includes('Loyal')) {
      return (
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Heart className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (name.includes('Potential')) {
      return (
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-650 dark:bg-purple-950/40 dark:text-purple-400">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (name.includes('Inactive')) {
      return (
        <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
          <Clock className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (name.includes('Risk')) {
      return (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-605 dark:bg-rose-955/40 dark:text-rose-405">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
      );
    }
    if (name.includes('Price')) {
      return (
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Tag className="h-4.5 w-4.5" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
        <Users className="h-4.5 w-4.5" />
      </div>
    );
  };

  const dashboardData = dashboardQuery.data?.data;
  const topCards = dashboardData?.top_cards;
  const distributionData = dashboardData?.segment_distribution || [];
  const trendData = dashboardData?.trend || [];

  const pieData = distributionData.map(s => ({
    name: s.segment_name,
    value: s.customer_count,
    percentage: s.percentage,
    color: COLORS[s.segment_name] || DEFAULT_COLOR
  }));

  const formattedTrendData = useMemo(() => {
    if (!trendData.length) return [];
    
    // Convert array of segment trend to list of time objects { month: 'Jan', 'Seg1': 10, 'Seg2': 20 }
    const months = trendData[0].data.map(d => d.label);
    const result: any[] = [];

    months.forEach((month, idx) => {
      const obj: any = { month };
      trendData.forEach(segmentTrend => {
        obj[segmentTrend.segment] = segmentTrend.data[idx].count;
      });
      result.push(obj);
    });

    return result;
  }, [trendData]);
  
  if (dashboardQuery.isLoading || listQuery.isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-10"
    >
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customer Segmentation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-3xs transition-all duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Customer Segmentation</h1>
          <p className="text-muted-foreground text-sm">Segment your customers based on behavior, demographics, purchase history and more.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/customer-segmentation/segments')}
            className="font-semibold gap-2 border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 rounded-xl h-9 cursor-pointer"
          >
            <Sliders className="h-4 w-4" />
            Manage Segments
          </Button>

          <Button
            style={{ backgroundColor: primaryColor }}
            onClick={() => router.push('/customer-segmentation/create')}
            className="text-white text-xs font-bold gap-2 px-4 rounded-xl h-9 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-100 dark:border-slate-850 hover:shadow-xs transition-shadow duration-300 bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Customers</span>
            <div className="p-2 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 text-emerald-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {topCards?.total_customers?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> 12.5%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-850 hover:shadow-xs transition-shadow duration-300 bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Segments</span>
            <div className="p-2 rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/20 text-blue-650">
              <Sliders className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {topCards?.total_segments?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> 2 New
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-850 hover:shadow-xs transition-shadow duration-300 bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Segmented Customers</span>
            <div className="p-2 rounded-xl border border-purple-100 dark:border-purple-955 bg-purple-50/20 text-purple-650">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {topCards?.segmented_customers.count?.toLocaleString() || 0}{' '}
              <span className="text-sm font-semibold text-slate-400">
                ({topCards?.segmented_customers.percentage || 0}%)
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8.3%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-850 hover:shadow-xs transition-shadow duration-300 bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Unsegmented Customers</span>
            <div className="p-2 rounded-xl border border-rose-100 dark:border-rose-955 bg-rose-50/20 text-rose-605">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {topCards?.unsegmented_customers.count?.toLocaleString() || 0}{' '}
              <span className="text-sm font-semibold text-slate-400">
                ({topCards?.unsegmented_customers.percentage || 0}%)
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
              <span className="text-rose-600 dark:text-rose-455 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-0.5" /> 4.1%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wide">
              Customers by Segment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center pt-2">
              <div className="relative h-[180px] w-[180px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {topCards?.total_customers?.toLocaleString() || 0}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] font-bold text-slate-655 dark:text-slate-355 pt-3 border-t dark:border-slate-800">
              {pieData.map((seg, idx) => (
                <div key={`${seg.name}-${idx}`} className="flex items-center justify-between border-b dark:border-slate-800/40 pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-800 dark:text-slate-300 font-bold truncate" title={seg.name}>
                      {seg.name.replace(' Customers', '')}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    {seg.value.toLocaleString()} <span className="text-[9px] opacity-70">({seg.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wide">
              Segment Distribution Over Time
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5">
              Last 6 Months <ChevronDown className="h-3 w-3 ml-1 text-slate-400" />
            </Badge>
          </CardHeader>
          <CardContent className="h-[290px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTrendData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                  }}
                  itemStyle={{ fontWeight: 'bold', fontSize: 11 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 9.5, fontWeight: 700, paddingTop: 10 }} />
                {trendData.map((td, idx) => (
                  <Line 
                    key={`${td.segment}-${idx}`} 
                    type="monotone" 
                    dataKey={td.segment} 
                    stroke={COLORS[td.segment] || DEFAULT_COLOR} 
                    strokeWidth={2.5} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-3xs">
        <div className="relative flex-1 w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs font-semibold h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-offset-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 w-32 border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
            <SelectTrigger className="h-9 w-36 border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <SelectValue placeholder="All Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Type</SelectItem>
              <SelectItem value="Behavioral">Behavioral</SelectItem>
              <SelectItem value="Transactional">Transactional</SelectItem>
              <SelectItem value="Demographic">Demographic</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            className={`font-semibold gap-1.5 border-slate-200 dark:border-slate-800 text-xs h-9 cursor-pointer rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 ${
              isMoreFiltersOpen ? 'bg-slate-50 dark:bg-slate-850' : ''
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            More Filters
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadReport}
            className="font-semibold gap-1.5 border-slate-200 dark:border-slate-800 text-xs h-9 cursor-pointer rounded-xl bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-355 ml-auto lg:ml-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            Download Report
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMoreFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/10 p-4 border dark:border-slate-800 rounded-xl space-y-2.5 text-xs font-semibold text-slate-655 dark:text-slate-355"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Extended filter parameters</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setTypeFilter('All');
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-455"
              >
                Reset all filters
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-850">
                <span className="text-[9px] uppercase tracking-wider block text-slate-400 mb-1">Customer Size Range</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">Any customer count</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-850">
                <span className="text-[9px] uppercase tracking-wider block text-slate-400 mb-1">Active Rules Conditions</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">Any active rules count</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-850">
                <span className="text-[9px] uppercase tracking-wider block text-slate-400 mb-1">Created Date Constraint</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">All acquisition history</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left font-semibold">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Segment Name</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Created On</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {paginatedSegments.length > 0 ? (
                paginatedSegments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-755 dark:text-slate-355">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {getSegmentIcon(seg.Segment_Name)}
                        <div>
                          <span className="block hover:text-blue-650 cursor-pointer transition-colors" onClick={() => router.push(`/customer-segmentation/${seg.id}/edit`)}>
                            {seg.Segment_Name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-medium tracking-wide">ID: {seg.CustomerSegment_Id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-slate-500 max-w-[280px]">
                      <div className="line-clamp-2 leading-relaxed" title={seg.Description}>
                        {seg.Description}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-medium">{new Date(seg.Created_Date).toLocaleDateString()}</td>

                    <td className="py-4 px-4 text-slate-500 font-medium">{new Date(seg.Updated_Date).toLocaleDateString()}</td>

                    <td className="py-4 px-4 text-center">
                      <Badge
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          seg.Status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/40'
                            : seg.Status === 'Warning'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800/40'
                            : 'bg-slate-500/10 text-slate-400 border-slate-200 dark:border-slate-800/40'
                        }`}
                      >
                        {seg.Status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8.5 w-8.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer"
                          onClick={() => router.push(`/customer-segmentation/${seg.id}/edit`)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-455" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800/70 cursor-pointer">
                              <MoreVertical className="h-3.5 w-3.5 text-slate-455" />
                            </Button>
                          } />
                          <DropdownMenuContent className="bg-white dark:bg-slate-950 border dark:border-slate-850" align="end">
                            <DropdownMenuItem className="text-xs font-semibold cursor-pointer py-2" onClick={() => router.push(`/customer-segmentation/${seg.id}/edit`)}>
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs font-semibold cursor-pointer py-2 text-rose-600 focus:text-rose-650"
                              onClick={() => setDeleteId(seg.id)}
                            >
                              Delete Segment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No customer segments matching the filters were found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t dark:border-slate-850 gap-4 text-xs font-bold text-slate-500">
          <div>
            Showing {filteredSegments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSegments.length)} of {filteredSegments.length} segments
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 cursor-pointer"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 cursor-pointer"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                <SelectTrigger className="h-8 w-16 border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 rounded-2xl border dark:border-slate-850 p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Confirm Segment Deletion
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-400 pt-1 leading-relaxed">
              Are you sure you want to delete this segment? This action is permanent, and the customers will be moved back to the unsegmented pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="text-xs font-semibold rounded-xl h-9 border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-9 text-xs px-4"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Segment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
