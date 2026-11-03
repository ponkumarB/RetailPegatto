'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Download,
  Filter,
  RefreshCw,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  MoreVertical,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  Sparkles,
  Lightbulb,
  X,
  Save,
  DollarSign,
  Trash2,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';

import { 
  usePriceTrackingList, 
  useCreatePriceTracking, 
  useDeletePriceTracking, 
  usePriceTrackingDashboard 
} from '@/service/api/PriceTracking/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface TrackedItem {
  id: number;
  Price_Tracking_Id: string;
  Product_Service: string;
  Current_Price: string;
  Previous_Price: string;
  Price_Status: string;
  Last_Tracked_On: string | null;
  Next_Tracking_On: string;
  Competitor_Id?: { id: number; Competitor_Name: string };
  Deal_Id?: { id: number; Deal_Name: string };
}

export function PriceTrackingTab() {
  const { primaryColor } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'alerts' | 'history' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: priceData, isLoading } = usePriceTrackingList(page);
  const { data: dashboardData } = usePriceTrackingDashboard(['2026-01-01', '2026-12-31']);
  const createMutation = useCreatePriceTracking();
  const deleteMutation = useDeletePriceTracking();

  const trackedItems: TrackedItem[] = useMemo(() => {
    return priceData?.results || priceData?.data?.results || [];
  }, [priceData]);

  // Filter variables
  const [competitorFilter, setCompetitorFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [dealFilter, setDealFilter] = useState('All');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (competitorFilter !== 'All') count++;
    if (productFilter !== 'All') count++;
    if (dealFilter !== 'All') count++;
    return count;
  }, [competitorFilter, productFilter, dealFilter]);

  // Modal States
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newCompetitorId, setNewCompetitorId] = useState('');
  const [newDealId, setNewDealId] = useState('');
  const [newCurrentPrice, setNewCurrentPrice] = useState('');
  const [newPreviousPrice, setNewPreviousPrice] = useState('');


  const handleAddTracked = () => {
    if (!newProduct.trim()) return toast.error('Product / Service name is required.');
    if (!newCompetitorId.trim()) return toast.error('Competitor ID is required.');
    if (!newDealId.trim()) return toast.error('Deal ID is required.');
    if (!newCurrentPrice.trim()) return toast.error('Current Price is required.');

    const currPrice = parseFloat(newCurrentPrice);
    const prevPrice = newPreviousPrice.trim() ? parseFloat(newPreviousPrice) : currPrice;

    if (isNaN(currPrice) || isNaN(prevPrice)) {
      return toast.error('Please enter valid numeric values for prices.');
    }

    const payload = {
      Organization_Id: 1, // Defaulting to 1 for MVP
      Product_Service: newProduct.trim(),
      Competitor_Id: parseInt(newCompetitorId, 10),
      Deal_Id: parseInt(newDealId, 10),
      Current_Price: currPrice,
      Previous_Price: prevPrice,
      Next_Tracking_On: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      Created_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) || 1 : 1,
      Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) || 1 : 1,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setNewProduct('');
        setNewCompetitorId('');
        setNewDealId('');
        setNewCurrentPrice('');
        setNewPreviousPrice('');
        setIsTrackModalOpen(false);
      }
    });
  };

  const handleDeleteItem = (id: number) => {
    deleteMutation.mutate(id);
    setDeleteId(null);
  };



  // Unique Lists for Dropdown filtering
  const allCompetitors = useMemo(() => {
    return Array.from(new Set(trackedItems.map(item => item.Competitor_Id?.Competitor_Name).filter(Boolean)));
  }, [trackedItems]);

  const allProducts = useMemo(() => {
    return Array.from(new Set(trackedItems.map(item => item.Product_Service).filter(Boolean)));
  }, [trackedItems]);

  const allDeals = useMemo(() => {
    return Array.from(new Set(trackedItems.map(item => item.Deal_Id?.Deal_Name).filter(Boolean)));
  }, [trackedItems]);

  const kpi = dashboardData?.data?.kpi_cards || dashboardData?.kpi_cards || {};
  const metrics = useMemo(() => ({
    total: kpi.total_tracked_items?.count || 0,
    across_deals: kpi.total_tracked_items?.across_deals || 0,
    increased: kpi.price_increased?.count || 0,
    pctIncreased: kpi.price_increased?.percentage?.toFixed(1) || '0.0',
    decreased: kpi.price_decreased?.count || 0,
    pctDecreased: kpi.price_decreased?.percentage?.toFixed(1) || '0.0',
    noChange: kpi.no_change?.count || 0,
    pctNoChange: kpi.no_change?.percentage?.toFixed(1) || '0.0',
  }), [kpi]);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return trackedItems.filter(item => {
      const query = searchQuery.toLowerCase();
      const product = item.Product_Service || '';
      const comp = item.Competitor_Id?.Competitor_Name || '';
      const deal = item.Deal_Id?.Deal_Name || '';

      const matchesSearch =
        product.toLowerCase().includes(query) ||
        comp.toLowerCase().includes(query) ||
        deal.toLowerCase().includes(query);

      const matchesCompetitor = competitorFilter === 'All' || comp === competitorFilter;
      const matchesProduct = productFilter === 'All' || product === productFilter;
      const matchesDeal = dealFilter === 'All' || deal === dealFilter;

      return matchesSearch && matchesCompetitor && matchesProduct && matchesDeal;
    });
  }, [trackedItems, searchQuery, competitorFilter, productFilter, dealFilter]);

  // ReusableTable Columns Configuration
  const columns = useMemo<ColumnConfig<TrackedItem>[]>(() => [
    {
      key: 'Product_Service',
      header: 'Product / Service',
      sortable: true,
      render: (row: TrackedItem) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-50 dark:bg-slate-950 shrink-0">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-205 text-xs">{row.Product_Service}</span>
        </div>
      )
    },
    {
      key: 'Competitor_Name',
      header: 'Competitor',
      sortable: true,
      render: (row: TrackedItem) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-655 dark:text-slate-300">
          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.Competitor_Id?.Competitor_Name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'Deal_Name',
      header: 'Deal',
      sortable: true,
      render: (row: TrackedItem) => (
        <span className="text-primary hover:underline font-bold text-xs cursor-pointer">
          {row.Deal_Id?.Deal_Name || 'Unknown'}
        </span>
      )
    },
    {
      key: 'Current_Price',
      header: 'Current Price',
      sortable: true,
      render: (row: TrackedItem) => (
        <span className="font-bold text-slate-800 dark:text-slate-205">
          ${parseFloat(row.Current_Price || '0').toFixed(2)} <span className="text-[10px] text-slate-455">/ user / mo</span>
        </span>
      )
    },
    {
      key: 'Previous_Price',
      header: 'Previous Price',
      sortable: true,
      render: (row: TrackedItem) => (
        <span className="font-medium text-slate-500">
          ${parseFloat(row.Previous_Price || '0').toFixed(2)} <span className="text-[10px] text-slate-455">/ user / mo</span>
        </span>
      )
    },
    {
      key: 'change',
      header: 'Change',
      render: (row: TrackedItem) => {
        const diff = parseFloat(row.Current_Price || '0') - parseFloat(row.Previous_Price || '0');
        if (diff > 0) {
          return <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">↑ ${diff.toFixed(2)}</span>;
        } else if (diff < 0) {
          return <span className="text-rose-600 font-extrabold flex items-center gap-0.5">↓ ${Math.abs(diff).toFixed(2)}</span>;
        }
        return <span className="text-slate-400 font-bold">—</span>;
      }
    },
    {
      key: 'changePercent',
      header: 'Change %',
      render: (row: TrackedItem) => {
        const curr = parseFloat(row.Current_Price || '0');
        const prev = parseFloat(row.Previous_Price || '0');
        const diff = curr - prev;
        if (prev === 0 || diff === 0) return <span className="text-slate-500 font-semibold">0%</span>;
        const pct = (diff / prev) * 100;
        if (pct > 0) {
          return <span className="text-emerald-605 font-bold">↑ {pct.toFixed(2)}%</span>;
        }
        return <span className="text-rose-605 font-bold">↓ {Math.abs(pct).toFixed(2)}%</span>;
      }
    },
    {
      key: 'Last_Tracked_On',
      header: 'Last Tracked On',
      sortable: true,
      render: (row: TrackedItem) => <span className="text-slate-505 font-medium">{row.Last_Tracked_On ? new Date(row.Last_Tracked_On).toLocaleDateString() : '-'}</span>
    },
    {
      key: 'Price_Status',
      header: 'Status',
      sortable: true,
      render: (row: TrackedItem) => {
        let styles = 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        let dot = 'bg-slate-400';
        if (row.Price_Status === 'Increased') {
          styles = 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450';
          dot = 'bg-rose-500';
        } else if (row.Price_Status === 'Decreased') {
          styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450';
          dot = 'bg-emerald-500';
        } else if (row.Price_Status === 'No Change') {
          styles = 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-450';
          dot = 'bg-amber-500';
        }

        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${styles}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {row.Price_Status}
          </span>
        );
      }
    }
  ], []);

  const tableActions = (item: TrackedItem) => (
    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-[5px]"
        onClick={() => setDeleteId(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <TrendingUp className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Price Tracking</span>
              <Sparkles className="h-4.5 w-4.5 text-blue-500 fill-blue-500" />
            </h1>
            <p className="text-xs text-slate-455 font-semibold mt-0.5">
              Track and monitor competitor pricing for deals to make informed decisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsTrackModalOpen(true)}
            className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            <span>Track New Price</span>
          </Button>
          <Button
            variant="outline"
            className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
          >
            <Download className="h-3.5 w-3.5 text-slate-505" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b dark:border-slate-800 gap-6 text-xs font-bold text-slate-400 select-none pb-0.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 border-b-2 transition-all ${activeTab === 'overview'
            ? 'text-slate-900 border-slate-900 dark:text-white dark:border-white font-extrabold'
            : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-2.5 border-b-2 transition-all ${activeTab === 'items'
            ? 'text-slate-900 border-slate-900 dark:text-white dark:border-white font-extrabold'
            : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          Tracked Items
        </button>
      </div>

      {/* Filter Row Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Button */}
          <Button
            variant="outline"
            className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-[5px] gap-2"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>01 May 2024 - 15 May 2024</span>
          </Button>

          {/* Filters Toggle Button */}
          <Button
            variant="outline"
            onClick={() => setIsFilterDialogOpen(true)}
            className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px] relative"
          >
            <Filter className="h-3.5 w-3.5 text-slate-505" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs" style={{ backgroundColor: primaryColor }}>
                {activeFilterCount}
              </span>
            )}
          </Button>

          {(searchQuery || competitorFilter !== 'All' || productFilter !== 'All' || dealFilter !== 'All') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setCompetitorFilter('All');
                setProductFilter('All');
                setDealFilter('All');
              }}
              className="h-9.5 w-9.5 p-0 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-[5px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-505" />
            </Button>
          )}
        </div>

        {/* Search Search queries */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.75 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search price trackers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 w-[250px] text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
          />
        </div>
      </div>

      {/* Row of Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total items */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
              <Tag className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Total Tracked Items</p>
              <p className="text-lg font-black text-slate-805 dark:text-slate-200 mt-2 leading-none">{metrics.total}</p>
              <p className="text-[9px] text-slate-450 font-bold mt-1.5 leading-none">Across {allDeals.length} Active Deals</p>
            </div>
          </CardContent>
        </Card>

        {/* Increased */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-[5px]">
              <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Price Increased</p>
              <p className="text-lg font-black text-slate-805 dark:text-slate-200 mt-2 leading-none">
                {metrics.increased} <span className="text-xs font-bold text-emerald-600">({metrics.pctIncreased}%)</span>
              </p>
              <p className="text-[9px] text-slate-450 font-bold mt-1.5 leading-none">vs previous tracking</p>
            </div>
          </CardContent>
        </Card>

        {/* Decreased */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-[5px]">
              <ArrowDownCircle className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">Price Decreased</p>
              <p className="text-lg font-black text-slate-805 dark:text-slate-200 mt-2 leading-none">
                {metrics.decreased} <span className="text-xs font-bold text-rose-600">({metrics.pctDecreased}%)</span>
              </p>
              <p className="text-[9px] text-slate-450 font-bold mt-1.5 leading-none">vs previous tracking</p>
            </div>
          </CardContent>
        </Card>

        {/* No Change */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-[5px]">
              <Info className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider leading-none">No Change</p>
              <p className="text-lg font-black text-slate-805 dark:text-slate-200 mt-2 leading-none">
                {metrics.noChange} <span className="text-xs font-bold text-amber-600">({metrics.pctNoChange}%)</span>
              </p>
              <p className="text-[9px] text-slate-450 font-bold mt-1.5 leading-none">vs previous tracking</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Left side Chart & Table vs Right side insights column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Grid: Chart + Table (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Price Trend Chart Card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 text-left">
            <CardContent className="p-6">

              {/* Header inside Chart Card */}
              <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Price Trend (Last 6 Months)</h3>
                  <p className="text-[10px] text-slate-455 mt-0.5">Monthly competitor price analysis index.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border dark:border-slate-800 rounded-[5px] overflow-hidden">
                    <button className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-850 text-slate-805 dark:text-white border-r dark:border-slate-800">
                      Line
                    </button>
                    <button className="px-2.5 py-1 text-[10px] font-bold text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850">
                      Bar
                    </button>
                  </div>
                  <Select defaultValue="Monthly">
                    <SelectTrigger className="h-7 text-[10px] font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Monthly" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Legends Row */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold mb-6">
                <span className="flex items-center gap-1.5 text-slate-655 dark:text-slate-350">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Salesforce
                </span>
                <span className="flex items-center gap-1.5 text-slate-655 dark:text-slate-355">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  HubSpot CRM
                </span>
                <span className="flex items-center gap-1.5 text-slate-655 dark:text-slate-355">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Zoho CRM
                </span>
                <span className="flex items-center gap-1.5 text-slate-655 dark:text-slate-355">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Pipedrive
                </span>
              </div>

              {/* Premium Interactive SVG Chart Grid */}
              <div className="relative w-full h-[180px] select-none">
                {/* SVG Graph curves */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" className="stroke-slate-100 dark:stroke-slate-855" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="500" y2="50" className="stroke-slate-100 dark:stroke-slate-855" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="500" y2="80" className="stroke-slate-100 dark:stroke-slate-855" strokeDasharray="3,3" />
                  <line x1="0" y1="110" x2="500" y2="110" className="stroke-slate-200 dark:stroke-slate-800" />

                  {/* Curve 1: Salesforce (blue) */}
                  <path d="M 0,40 Q 100,38 200,45 T 400,42 T 500,42" fill="none" className="stroke-blue-500" strokeWidth="2.5" />
                  {/* Curve 2: HubSpot (green) */}
                  <path d="M 0,60 Q 100,55 200,62 T 400,58 T 500,58" fill="none" className="stroke-emerald-500" strokeWidth="2.5" />
                  {/* Curve 3: Zoho (purple) */}
                  <path d="M 0,80 Q 100,78 200,82 T 400,75 T 500,75" fill="none" className="stroke-purple-500" strokeWidth="2.5" />
                  {/* Curve 4: Pipedrive (orange) */}
                  <path d="M 0,105 Q 100,105 200,105 T 400,103 T 500,103" fill="none" className="stroke-amber-500" strokeWidth="2.5" />

                  {/* Intercept dots on May 2024 */}
                  <circle cx="500" cy="42" r="4.5" className="fill-blue-500 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                  <circle cx="500" cy="58" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                  <circle cx="500" cy="75" r="4.5" className="fill-purple-500 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                  <circle cx="500" cy="103" r="4.5" className="fill-amber-500 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[8px] font-black text-slate-455 uppercase mt-2.5">
                  <span>Dec 2023</span>
                  <span>Jan 2024</span>
                  <span>Feb 2024</span>
                  <span>Mar 2024</span>
                  <span>Apr 2024</span>
                  <span>May 2024</span>
                </div>

                {/* Simulated Chart Tooltip Hover overlay */}
                <div className="absolute right-[25px] top-[15px] border dark:border-slate-800 shadow-xl rounded-[5px] bg-white dark:bg-slate-955 p-2.5 text-[9px] font-semibold text-slate-800 dark:text-slate-200 flex flex-col gap-1 w-28 text-left z-10 select-none">
                  <div className="font-extrabold text-[8px] uppercase text-slate-455 border-b dark:border-slate-850 pb-1 mb-1">
                    May 2024
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Salesforce
                    </span>
                    <span className="font-bold">$25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      HubSpot CRM
                    </span>
                    <span className="font-bold">$20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Zoho CRM
                    </span>
                    <span className="font-bold">$18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pipedrive
                    </span>
                    <span className="font-bold">$14.90</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Recently Tracked Items Table */}
          <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900 text-left">
            <CardContent className="p-0">
              <div className="p-5 border-b dark:border-slate-850 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Recently Tracked Items</h3>
                  <p className="text-[10px] text-slate-455 mt-0.5">List of live competitor price checkpoints.</p>
                </div>
                <span className="text-[10px] text-slate-450 font-bold hover:underline cursor-pointer">
                  View Full Tracked Items &rarr;
                </span>
              </div>
              <ReusableTable
                columns={columns}
                data={filteredItems}
                actions={tableActions}
                borderless={true}
                showGear={false}
              />
            </CardContent>
          </Card>

        </div>

        {/* Right Grid: Sidebar Alerts, Changes, Insights (Spans 1 column) */}
        <div className="flex flex-col gap-6 text-left">

          {/* Price Alert Summary */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b dark:border-slate-850 pb-3">
                <h4 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Price Alert Summary
                </h4>
                <span className="text-[10px] text-slate-450 hover:underline cursor-pointer font-bold">View All</span>
              </div>

              <div className="flex flex-col gap-3 text-xs font-bold">
                <div className="flex items-center justify-between p-2 rounded bg-rose-500/5 dark:bg-rose-500/10">
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    High Increase Alerts
                  </span>
                  <span className="h-5 w-5 flex items-center justify-center bg-rose-500 text-white rounded-[3px] text-[10px]">3</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-500/5 dark:bg-emerald-500/10">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    New Price Drops
                  </span>
                  <span className="h-5 w-5 flex items-center justify-center bg-emerald-505 text-white rounded-[3px] text-[10px]">2</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-500/5 dark:bg-amber-500/10">
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    No Change
                  </span>
                  <span className="h-5 w-5 flex items-center justify-center bg-amber-500 text-white rounded-[3px] text-[10px]">4</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Price Changes */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b dark:border-slate-850 pb-3">
                <h4 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-wider">Top Price Changes</h4>
                <Select defaultValue="30">
                  <SelectTrigger className="h-6.5 text-[9px] font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                    <SelectValue placeholder="Last 30 Days" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[5px]">
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="60">Last 60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3.5 text-xs font-bold text-slate-700 dark:text-slate-350">

                {/* Salesforce */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Salesforce
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">$20 &rarr; $25</span>
                    <span className="text-emerald-600 flex items-center gap-0.5">&uarr; 25%</span>
                  </div>
                </div>

                {/* HubSpot */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    HubSpot CRM
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">$18 &rarr; $20</span>
                    <span className="text-emerald-600 flex items-center gap-0.5">&uarr; 11.11%</span>
                  </div>
                </div>

                {/* Zoho */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Zoho CRM
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">$22 &rarr; $18</span>
                    <span className="text-rose-600 flex items-center gap-0.5">&darr; 18.18%</span>
                  </div>
                </div>

                {/* Pipedrive */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Pipedrive
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">$12.50 &rarr; $14.90</span>
                    <span className="text-emerald-600 flex items-center gap-0.5">&uarr; 19.20%</span>
                  </div>
                </div>

                {/* Freshdesk */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    Freshdesk
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">$13 &rarr; $15</span>
                    <span className="text-emerald-600 flex items-center gap-0.5">&uarr; 15.38%</span>
                  </div>
                </div>

              </div>

              <div className="border-t dark:border-slate-850 pt-3 mt-1.5 text-center">
                <span className="text-[10px] text-primary hover:underline font-bold cursor-pointer">
                  View Full Report &rarr;
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-slate-50/50 dark:bg-slate-900/30">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-850 dark:text-white font-extrabold text-xs">
                <Lightbulb className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />
                <span>Insights</span>
              </div>
              <ul className="list-disc pl-4 text-[10px] text-slate-655 dark:text-slate-400 font-semibold space-y-2">
                <li>Salesforce pricing increased by 25% this month for new subscriptions.</li>
                <li>Zoho CRM price decreased by 18.18% for the CRM Suite deal integration.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Tracking Card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2.5">
                <div className="flex items-center gap-2 text-slate-850 dark:text-white font-bold text-xs">
                  <Calendar className="h-4.5 w-4.5 text-slate-455" />
                  <span>Next Tracking Check</span>
                </div>
                <span className="text-[9px] text-primary hover:underline font-bold cursor-pointer">Edit Schedule</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-black text-slate-855 dark:text-white">16 May 2024, 09:30 AM</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/10" />
                  Auto tracking is enabled
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Track New Price Modal Overlay Dialog */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsTrackModalOpen(false)}
          />

          {/* Modal Container */}
          <Card className="relative w-full max-w-md border dark:border-slate-800 shadow-2xl rounded-[5px] bg-white dark:bg-slate-900 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <CardContent className="p-6 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Track New Price</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-[5px] transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Input Fields */}
              <div className="flex flex-col gap-4 text-left">
                {/* Product */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Product / Service *</Label>
                  <Input
                    placeholder="e.g. CRM Suite"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>

                {/* Competitor */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Competitor ID *</Label>
                  <Input
                    placeholder="e.g. 1"
                    type="number"
                    value={newCompetitorId}
                    onChange={(e) => setNewCompetitorId(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>

                {/* Deal Link / Name */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Deal ID *</Label>
                  <Input
                    placeholder="e.g. 255"
                    type="number"
                    value={newDealId}
                    onChange={(e) => setNewDealId(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Current Price */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Price ($) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        placeholder="e.g. 18"
                        value={newCurrentPrice}
                        onChange={(e) => setNewCurrentPrice(e.target.value)}
                        className="pl-8 h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
                      />
                    </div>
                  </div>

                  {/* Previous Price */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Previous Price ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        placeholder="e.g. 22"
                        value={newPreviousPrice}
                        onChange={(e) => setNewPreviousPrice(e.target.value)}
                        className="pl-8 h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t dark:border-slate-800 pt-4 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 rounded-[5px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTracked}
                  size="sm"
                  className="h-8.5 text-xs font-bold text-white hover:opacity-90 gap-1.5 rounded-[5px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Track Price</span>
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Modal Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDialogOpen(false)}
          />

          {/* Modal Container */}
          <Card className="relative w-full max-w-md border dark:border-slate-800 shadow-2xl rounded-[5px] bg-white dark:bg-slate-900 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <CardContent className="p-6 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Filter Price Trackers</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDialogOpen(false)}
                  className="p-1 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 rounded-[5px] transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Filters Fields */}
              <div className="flex flex-col gap-4 text-left">

                {/* Deals Select */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Deal</Label>
                  <Select value={dealFilter} onValueChange={(val) => setDealFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Deals" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Deals</SelectItem>
                      {allDeals.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Competitor Select */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Competitor</Label>
                  <Select value={competitorFilter} onValueChange={(val) => setCompetitorFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Competitors" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Competitors</SelectItem>
                      {allCompetitors.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Select */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Product / Service</Label>
                  <Select value={productFilter} onValueChange={(val) => setProductFilter(val || 'All')}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Products</SelectItem>
                      {allProducts.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between gap-3 border-t dark:border-slate-800 pt-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompetitorFilter('All');
                    setProductFilter('All');
                    setDealFilter('All');
                    setIsFilterDialogOpen(false);
                  }}
                  className="h-8.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px]"
                >
                  Reset All
                </Button>

                <Button
                  onClick={() => setIsFilterDialogOpen(false)}
                  size="sm"
                  className="h-8.5 text-xs font-bold text-white hover:opacity-90 rounded-[5px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Apply Filters
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[5px] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the price tracking record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[5px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && handleDeleteItem(deleteId)} 
              className="bg-rose-500 hover:bg-rose-600 rounded-[5px]"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
