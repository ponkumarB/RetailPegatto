'use client';

import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Download,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  X,
  Clock,
  Scan,
  Globe,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  useCompetitorMasterList,
  useCompetitorDashboard,
  useSearchCompetitorMaster,
  useFilterCompetitorMaster,
  useDeleteCompetitorMaster
} from '@/service/api/CompetitorTracking/queries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { usePermission } from '@/hooks/usePermission';

export function CompetitorTrackingTab() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const { canCreateCompetitorTracking, canEditCompetitorTracking, canDeleteCompetitorTracking } = usePermission();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection details state
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals States
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Data fetching
  const { data: listResponse, isLoading: listLoading } = useCompetitorMasterList(page);
  const { data: dashboardResponse } = useCompetitorDashboard();
  const { data: searchResponse, isLoading: searchLoading } = useSearchCompetitorMaster(searchQuery);
  
  const filterPayload = useMemo(() => {
    const p: any = {};
    if (categoryFilter !== 'All') p.Category = categoryFilter;
    if (statusFilter !== 'All') p.Tracking_Status = statusFilter;
    return p;
  }, [categoryFilter, statusFilter]);
  
  const { data: filterResponse, isLoading: filterLoading } = useFilterCompetitorMaster(filterPayload);

  const deleteMutation = useDeleteCompetitorMaster();

  const competitors = useMemo(() => {
    if (searchQuery && searchResponse?.results) return searchResponse.results;
    if (Object.keys(filterPayload).length > 0 && filterResponse?.results) return filterResponse.results;
    if (listResponse?.results) return listResponse.results;
    return [];
  }, [searchQuery, searchResponse, filterPayload, filterResponse, listResponse]);

  const isLoading = listLoading || searchLoading || filterLoading;

  const handleDeleteCompetitor = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          if (selectedCompetitor?.id === deleteId) {
            setSelectedCompetitor(null);
          }
        }
      });
    }
  };

  // Compute Metrics dynamically from dashboardResponse
  const metrics = useMemo(() => {
    if (dashboardResponse?.data?.cards) {
      return {
        total: dashboardResponse.data.cards.total_competitors,
        active: dashboardResponse.data.cards.active_competitors,
        alerts: dashboardResponse.data.cards.inactive_competitors,
        changes: 0, // Placeholder
      };
    }
    return { total: 0, active: 0, changes: 0, alerts: 0 };
  }, [dashboardResponse]);

  // Unique lists for filters
  const allCategories = useMemo(() => {
    return Array.from(new Set(competitors.map((c: any) => c.Category).filter(Boolean)));
  }, [competitors]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    return count;
  }, [categoryFilter, statusFilter]);

  // ReusableTable configuration columns list
  const columns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'Competitor_Name',
      header: 'Competitor',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 rounded-[5px] shrink-0 border dark:border-slate-800">
            <AvatarFallback className="rounded-[5px] text-[10px] font-black bg-blue-500/10 text-blue-500">
              {row.Competitor_Name ? row.Competitor_Name.charAt(0) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{row.Competitor_Name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'Website',
      header: 'Website',
      sortable: true,
      render: (row: any) => (
        row.Website ? (
          <a
            href={row.Website.startsWith('http') ? row.Website : `https://${row.Website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{row.Website.replace('https://www.', '').replace('https://', '')}</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        ) : <span className="text-slate-400 text-xs">-</span>
      )
    },
    {
      key: 'Category',
      header: 'Category',
      sortable: true,
      render: (row: any) => (
        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border dark:border-slate-850">
          {row.Category || 'Unknown'}
        </span>
      )
    },
    {
      key: 'Starting_Price',
      header: 'Pricing (Starting at)',
      sortable: true,
      render: (row: any) => (
        <span className="font-bold text-slate-800 dark:text-slate-205">
          ${parseFloat(row.Starting_Price || 0).toFixed(2)} <span className="text-[10px] text-slate-455">/ user / month</span>
        </span>
      )
    },
    {
      key: 'Updated_Date',
      header: 'Last Updated',
      sortable: true,
      render: (row: any) => <span className="text-slate-500 font-medium">{new Date(row.Updated_Date).toLocaleDateString()}</span>
    },
    {
      key: 'Tracking_Status',
      header: 'Status',
      sortable: true,
      render: (row: any) => {
        const activeClass = row.Tracking_Status === 'Active'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
          : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${activeClass}`}>
            {row.Tracking_Status || 'Unknown'}
          </span>
        );
      }
    }
  ], []);

  const tableActions = (row: any) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {canEditCompetitorTracking && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px]"
          onClick={() => router.push(`/administration/competitor-tracking/${row.id}`)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
      )}
      {canDeleteCompetitorTracking && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[5px]"
          onClick={() => setDeleteId(row.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Competitor Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Monitor leading competitors' pricing changes, feature updates, and market positioning. 
            Stay ahead by knowing exactly where they stand.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 font-bold text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-[5px] flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>
          {canCreateCompetitorTracking && (
            <Button
              onClick={() => router.push('/administration/competitor-tracking/create')}
              className="h-9 font-bold text-xs text-white hover:opacity-90 rounded-[5px] flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Competitor
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
            <Target className="h-10 w-10 text-slate-500" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Tracked</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{metrics.total}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
            <Scan className="h-10 w-10 text-emerald-500" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Monitoring</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{metrics.active}</span>
              <span className="text-[10px] font-bold text-slate-500">competitors</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-10 w-10 text-blue-500" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recent Changes</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{metrics.changes}</span>
              <span className="text-[10px] font-bold text-slate-500">price/feature updates</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Action Alerts</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-450">{metrics.alerts}</span>
              <span className="text-[10px] font-bold text-slate-500">require review</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Column: Table and Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Table Card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-0">
              
              {/* Toolbar */}
              <div className="p-4 border-b dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-[5px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search competitor..."
                      className="pl-8 h-9 w-[220px] text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] relative"
                    onClick={() => setIsFilterDialogOpen(true)}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-white text-[9px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-[5px]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-[10px] font-bold border-slate-200 dark:border-slate-800 rounded-[5px]"
                  >
                    <Sliders className="h-3 w-3 mr-1" /> View Columns
                  </Button>
                </div>
              </div>

              {/* Table rendering */}
              <div className="p-0">
                <ReusableTable
                  data={competitors}
                  columns={columns}
                  actions={tableActions}
                  selectable={false}
                  onRowClick={(row) => setSelectedCompetitor(row)}
                />
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Side Column: Interactive Details Pane */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          
          {selectedCompetitor ? (
            <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 overflow-hidden relative">
              <CardContent className="p-5 flex flex-col gap-4">
                
                {/* Close/Deselect button */}
                <button
                  onClick={() => setSelectedCompetitor(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Name & logo header */}
                <div className="flex items-center gap-2.5 border-b dark:border-slate-850 pb-3 pr-6">
                  <Avatar className="h-8.5 w-8.5 rounded-[5px] border dark:border-slate-800 shrink-0">
                    <AvatarFallback className="rounded-[5px] text-xs font-black bg-blue-500/10 text-blue-500">
                      {selectedCompetitor.Competitor_Name ? selectedCompetitor.Competitor_Name.charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{selectedCompetitor.Competitor_Name || 'Unknown'}</h3>
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 leading-none">
                        {selectedCompetitor.Tracking_Status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub tabs list */}
                <div className="flex border-b dark:border-slate-855 text-[10px] font-bold text-slate-400 pb-0.5 gap-4">
                  <span className="border-b border-primary text-slate-900 dark:text-white pb-1.5 cursor-pointer">Overview</span>
                  <span className="pb-1.5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Pricing</span>
                  <span className="pb-1.5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Features</span>
                </div>

                {/* Content body */}
                <div className="flex flex-col gap-3.5 text-xs text-left">
                  
                  {/* Website */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Website</span>
                    {selectedCompetitor.Website ? (
                      <a
                        href={selectedCompetitor.Website.startsWith('http') ? selectedCompetitor.Website : `https://${selectedCompetitor.Website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold flex items-center gap-1.5"
                      >
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        <span>{selectedCompetitor.Website}</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </a>
                    ) : <span className="text-slate-500">N/A</span>}
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Category</span>
                    <span className="font-bold text-slate-800 dark:text-slate-205">{selectedCompetitor.Category || 'N/A'}</span>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Description</span>
                    <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                      {selectedCompetitor.Description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Starting Price */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Pricing (Starting at)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-205">${parseFloat(selectedCompetitor.Starting_Price || 0).toFixed(2)} / user / month</span>
                  </div>

                  {/* Last updated */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Last Updated</span>
                    <span className="font-bold text-slate-800 dark:text-slate-205">{new Date(selectedCompetitor.Updated_Date).toLocaleDateString()}</span>
                  </div>

                </div>

                <div className="border-t dark:border-slate-850 pt-4 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/administration/competitor-tracking/${selectedCompetitor.id}`)}
                    className="w-full h-9 text-xs font-bold gap-1.5 rounded-[5px]"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Competitor</span>
                  </Button>
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] gap-2.5">
                <Target className="h-10 w-10 text-slate-305" />
                <h4 className="text-xs font-bold text-slate-855 dark:text-white leading-none">No Competitor Selected</h4>
                <p className="text-[10px] text-slate-450 leading-relaxed max-w-[200px] mt-1 font-semibold">
                  Select a competitor from the list to view detailed profile insights.
                </p>
              </CardContent>
            </Card>
          )}

        </div>

      </div>

      {/* Footer banner notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[5px] gap-3 text-[10px] font-bold text-slate-655 dark:text-slate-400 mt-2 select-none">
        <div className="flex items-center gap-2">
          <Info className="h-4.5 w-4.5 text-slate-455 shrink-0" />
          <span>Competitor data is collected from public sources and may not reflect real-time changes.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="h-4.5 w-4.5 text-slate-455" />
          <span>{dashboardResponse?.data?.cards?.last_market_scan ? `Last market scan: ${dashboardResponse.data.cards.last_market_scan}` : ''}</span>
        </div>
      </div>

      {/* Filters Modal Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDialogOpen(false)}
          />

          <Card className="relative w-full max-w-md border dark:border-slate-800 shadow-2xl rounded-[5px] bg-white dark:bg-slate-900 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <CardContent className="p-6 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Filter Competitors</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDialogOpen(false)}
                  className="p-1 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 rounded-[5px] transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4 text-left">
                
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Category</Label>
                  <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'All')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Categories</SelectItem>
                      {allCategories.map((cat: any) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Tracking Status</Label>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'All')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t dark:border-slate-800 pt-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('All');
                    setStatusFilter('All');
                    setIsFilterDialogOpen(false);
                  }}
                  className="h-8.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-880 rounded-[5px]"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Competitor</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this competitor tracker? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-lg font-bold border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCompetitor}
              className="rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Competitor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
