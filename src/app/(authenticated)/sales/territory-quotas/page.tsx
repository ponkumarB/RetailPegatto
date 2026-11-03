'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTerritoryStore, TerritoryQuota, TerritoryAchievement } from '@/store/useTerritoryStore';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { PeriodFilter, PeriodPreset } from '@/components/ui/PeriodFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Plus,
  History,
  Download,
  MoreHorizontal,
  Edit2,
  Trash2,
  TrendingUp,
  Users,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function TerritoryQuotasPage() {
  const router = useRouter();
  const {
    quotas,
    quotasCount,
    addQuota,
    updateQuota,
    deleteQuota,
    territories,
    loadQuotas,
    loadTerritories,
    isLoading,
    quotaSummary,
    performanceDashboard,
    performanceTable,
    loadQuotaSummary,
    loadPerformanceDashboard,
    loadPerformanceTable
  } = useTerritoryStore();

  const {
    canViewTerritoryQuotasOverview,
    canCreateTerritoryQuotas,
    canEditTerritoryQuotas,
    canDeleteTerritoryQuotas,
    isLoaded: permissionsLoaded,
  } = usePermission();

  useEffect(() => {
    if (permissionsLoaded && !canViewTerritoryQuotasOverview) {
      router.push('/sales/territory');
    }
  }, [permissionsLoaded, canViewTerritoryQuotasOverview, router]);

  // Filter Toolbar States
  const [periodPreset, setPeriodPreset] = useState<string>('This Year');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-06-29');
  const [selectedTerritory, setSelectedTerritory] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const serverPageSize = 10;

  const isServerSide = selectedTerritory === 'All';

  // Helper to get [start, end] date range as strings
  const getPresetDateRange = (preset: string): [string, string] => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    switch (preset) {
      case 'This Year': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Year': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const start = new Date(today.getFullYear(), quarter * 3, 1);
        const end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Quarter': {
        let quarter = Math.floor(today.getMonth() / 3) - 1;
        let year = today.getFullYear();
        if (quarter < 0) {
          quarter = 3;
          year -= 1;
        }
        const start = new Date(year, quarter * 3, 1);
        const end = new Date(year, (quarter + 1) * 3, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'This Month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return [formatDate(start), formatDate(end)];
      }
      case 'Last Month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return [formatDate(start), formatDate(end)];
      }
      default:
        return [customStartDate, customEndDate];
    }
  };

  const activeDateRange = useMemo<[string, string]>(() => {
    if (periodPreset === 'Custom') {
      return [customStartDate, customEndDate];
    }
    return getPresetDateRange(periodPreset);
  }, [periodPreset, customStartDate, customEndDate]);

  useEffect(() => {
    loadTerritories();
  }, [loadTerritories]);

  useEffect(() => {
    const terrId = selectedTerritory === 'All' ? null : Number(selectedTerritory);
    loadQuotas(undefined, currentPage, terrId);
  }, [loadQuotas, currentPage, selectedTerritory]);

  // Reset page when territory selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTerritory]);

  // Fetch Performance Dashboard & Detailed Performance Table when filters change
  useEffect(() => {
    const terrId = selectedTerritory === 'All' ? null : Number(selectedTerritory);
    loadPerformanceDashboard(terrId, activeDateRange);
    loadPerformanceTable(terrId, activeDateRange);
  }, [selectedTerritory, activeDateRange, loadPerformanceDashboard, loadPerformanceTable]);

  // Fetch Quota Summary data
  useEffect(() => {
    loadQuotaSummary();
  }, [loadQuotaSummary, quotas]);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Form Fields States (for Create & Edit)
  const [formData, setFormData] = useState({
    id: '',
    territory: '',
    revenueTarget: 0,
    leadTarget: 0,
    opportunityTarget: 0,
    conversionTarget: 0
  });

  const [editTerritoryName, setEditTerritoryName] = useState('');

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Find the selected territory name (since selectedTerritory stores numeric ID or "All")
  const selectedTerritoryObj = useMemo(() => {
    if (selectedTerritory === 'All') return null;
    return territories.find(t => String(t.id) === selectedTerritory || t.code === selectedTerritory);
  }, [selectedTerritory, territories]);

  // Pagination is handled server-side
  const paginatedQuotas = quotas;
  const displayTotal = quotasCount;
  const totalPages = Math.ceil(quotasCount / serverPageSize) || 1;

  // Summary Metrics parsed from API Response or defaults
  const totalRevenueTarget = quotaSummary?.total_revenue_target ?? 0;
  const totalLeadTarget = quotaSummary?.total_lead_target ?? 0;
  const totalOpportunityTarget = quotaSummary?.total_opportunity_target ?? 0;
  const averageConversionTarget = quotaSummary?.conversion_target ?? 0;

  // Mini Card Metrics parsed from Dashboard API response
  const revDashboard = performanceDashboard?.revenue_achievement ?? { target: 0, achieved: 0, percentage: 0 };
  const leadDashboard = performanceDashboard?.lead_achievement ?? { target: 0, achieved: 0, percentage: 0 };
  const oppDashboard = performanceDashboard?.opportunity_achievement ?? { target: 0, achieved: 0, percentage: 0 };
  const convDashboard = performanceDashboard?.average_conversion ?? { target: 0, achieved: 0 };

  const totalRevenueAchieved = revDashboard.achieved;
  const totalLeadAchieved = leadDashboard.achieved;
  const totalOpportunityAchieved = oppDashboard.achieved;
  const overallConversionAchieved = convDashboard.achieved;

  const revenueAchievementPercent = revDashboard.percentage ?? 0;
  const leadAchievementPercent = leadDashboard.percentage ?? 0;
  const opportunityAchievementPercent = oppDashboard.percentage ?? 0;

  const handleApplyFilters = () => {
    const terrId = selectedTerritory === 'All' ? null : Number(selectedTerritory);
    loadPerformanceDashboard(terrId, activeDateRange);
    loadPerformanceTable(terrId, activeDateRange);
    toast.success(`Filters applied for: ${periodPreset} (${activeDateRange[0]} to ${activeDateRange[1]})`);
  };

  const handleResetFilters = () => {
    setPeriodPreset('This Year');
    setCustomStartDate('2026-01-01');
    setCustomEndDate('2026-06-29');
    setSelectedTerritory('All');
    toast.info('Filters reset to defaults.');
  };

  // Add Quota Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.territory) {
      toast.error('Please select a territory.');
      return;
    }
    // Check duplication
    if (quotas.some(q => q.territory.toLowerCase() === formData.territory.toLowerCase())) {
      toast.error(`Quota target for ${formData.territory} already exists.`);
      return;
    }

    try {
      await addQuota({
        territory: formData.territory,
        revenueTarget: Number(formData.revenueTarget),
        leadTarget: Number(formData.leadTarget),
        opportunityTarget: Number(formData.opportunityTarget),
        conversionTarget: Number(formData.conversionTarget)
      });
      toast.success(`Quota targets established for "${formData.territory}"`);
      setCreateDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to establish quota.');
    }
  };

  // Edit Quota Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateQuota(editTerritoryName, {
        id: formData.id,
        revenueTarget: Number(formData.revenueTarget),
        leadTarget: Number(formData.leadTarget),
        opportunityTarget: Number(formData.opportunityTarget),
        conversionTarget: Number(formData.conversionTarget)
      });
      toast.success(`Quota updated for territory "${editTerritoryName}"`);
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update quota.');
    }
  };

  const openCreateDialog = () => {
    setFormData({
      id: '',
      territory: territories[0]?.name || '',
      revenueTarget: 0,
      leadTarget: 0,
      opportunityTarget: 0,
      conversionTarget: 0
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (q: TerritoryQuota) => {
    setEditTerritoryName(q.territory);
    setFormData({
      id: q.id || '',
      territory: q.territory,
      revenueTarget: q.revenueTarget,
      leadTarget: q.leadTarget,
      opportunityTarget: q.opportunityTarget,
      conversionTarget: q.conversionTarget
    });
    setEditDialogOpen(true);
  };

  const handleDeleteQuota = async (territoryName: string) => {
    if (confirm(`Are you sure you want to delete quota for "${territoryName}"?`)) {
      try {
        await deleteQuota(territoryName);
        toast.success(`Deleted quota targets for "${territoryName}"`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete quota.');
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Territory Quota Management</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Target className="h-6 w-6 text-blue-650" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territory Quota Management</h1>
              <p className="text-xs text-slate-450 mt-0.5">Set sales targets for territories and track achievement.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Loading quota history logs...')}
            className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border border-slate-205 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
          >
            <History className="h-3.5 w-3.5" />
            Quota History
          </Button> */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Initiating bulk quota CSV upload...')}
            className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border border-slate-205 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
          >
            <Download className="h-3.5 w-3.5" />
            Import Quotas
          </Button> */}
          {canCreateTerritoryQuotas && (
            <Button
              onClick={openCreateDialog}
              size="sm"
              className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Quota
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar Filters Panel */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs text-xs font-semibold">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selection */}
            <div className="space-y-1 w-48">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Select Period</Label>
              <Select value={periodPreset} onValueChange={(val) => setPeriodPreset(val || 'This Year')}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border">
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="Last Year">Last Year</SelectItem>
                  <SelectItem value="This Quarter">This Quarter</SelectItem>
                  <SelectItem value="Last Quarter">Last Quarter</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Last Month">Last Month</SelectItem>
                  <SelectItem value="Custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Inputs */}
            {periodPreset === 'Custom' && (
              <div className="flex items-center gap-2 pt-5">
                <div className="space-y-1">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50 border-slate-200 dark:border-slate-800 w-36"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">to</span>
                <div className="space-y-1">
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50 border-slate-200 dark:border-slate-800 w-36"
                  />
                </div>
              </div>
            )}

            {/* Territory Selection */}
            <div className="space-y-1 w-64">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Select Territory</Label>
              <Select value={selectedTerritory} onValueChange={(val) => setSelectedTerritory(val || 'All')}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="All Territories" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  <SelectItem value="All">All Territories</SelectItem>
                  {territories.map(t => (
                    <SelectItem key={t.id || t.code} value={String(t.id || t.code)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <Button
              onClick={handleResetFilters}
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1 border-slate-205 bg-white dark:bg-slate-900 text-slate-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Left Quota Targets, Right Quota Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quota Targets Table */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quota Targets</h2>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 pl-4">Territory</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 text-right">Revenue Target (₹)</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 text-right">Lead Target</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 text-right">Opportunity Target</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 text-right">Conversion Target (%)</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 text-right pr-4 w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuotas.map((q) => (
                    <TableRow key={q.territory} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800">
                      <TableCell className="py-3 pl-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-50 dark:bg-blue-955 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase">
                            {q.territory.substring(0, 2)}
                          </span>
                          {q.territory}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono font-medium">{formatCurrency(q.revenueTarget)}</TableCell>
                      <TableCell className="py-3 text-right font-mono font-medium">{q.leadTarget.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-3 text-right font-mono font-medium">{q.opportunityTarget.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-3 text-right font-mono font-medium">{q.conversionTarget}%</TableCell>
                      <TableCell className="py-3 text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-450 rounded-md">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="dark:bg-slate-900 border">
                            {canEditTerritoryQuotas && (
                              <DropdownMenuItem onClick={() => openEditDialog(q)} className="text-xs font-semibold gap-2 cursor-pointer">
                                <Edit2 className="h-3 w-3 text-slate-400" />
                                Edit Quota
                              </DropdownMenuItem>
                            )}
                            {canDeleteTerritoryQuotas && (
                              <DropdownMenuItem onClick={() => handleDeleteQuota(q.territory)} className="text-xs font-bold gap-2 text-rose-600 hover:bg-rose-50 cursor-pointer">
                                <Trash2 className="h-3 w-3" />
                                Delete Quota
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedQuotas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                        <span>No Quota Targets match the filter criteria.</span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t dark:border-slate-800 text-xs font-medium text-slate-505">
              <span>Showing {displayTotal > 0 ? (currentPage - 1) * (isServerSide ? serverPageSize : itemsPerPage) + 1 : 0} to {Math.min(currentPage * (isServerSide ? serverPageSize : itemsPerPage), displayTotal)} of {displayTotal} entries</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-slate-205"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currentPage === i + 1
                      ? "border-blue-200 bg-blue-50/60 font-bold text-blue-600"
                      : "border-slate-205 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-slate-205"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Quota Summary Metrics Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quota Summary</h2>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Total Revenue Target */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue Target</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalRevenueTarget)}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  ₹
                </div>
              </div>

              {/* Total Lead Target */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Lead Target</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{totalLeadTarget.toLocaleString('en-IN')}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              {/* Total Opportunity Target */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Opportunity Target</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{totalOpportunityTarget.toLocaleString('en-IN')}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
              </div>

              {/* Conversion Target */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conversion Target</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{averageConversionTarget.toFixed(0)}%</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  %
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quota Performance Section */}
      <div className="space-y-4 pt-6 border-t dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Territory Quota Performance</h2>
            <p className="text-xs text-slate-450 mt-0.5">Real-time achievements compared to active quota allocations.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-450">View By</span>
            <Select defaultValue="territory">
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-205 dark:border-slate-800 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border">
                <SelectItem value="territory">Territory</SelectItem>
                <SelectItem value="manager">Sales Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mini Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
          {/* Revenue Achievement */}
          <Card className="border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Revenue Achievement</span>
                <span className="h-6 w-6 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">₹</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenueAchieved)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  <span className="text-emerald-600 font-bold">{revenueAchievementPercent}%</span> of {formatCurrency(totalRevenueTarget)}
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, revenueAchievementPercent)}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Lead Achievement */}
          <Card className="border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Lead Achievement</span>
                <span className="h-6 w-6 rounded bg-blue-50 dark:bg-blue-955/30 text-blue-600 flex items-center justify-center"><Users className="h-3.5 w-3.5" /></span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{totalLeadAchieved.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  <span className="text-blue-600 font-bold">{leadAchievementPercent}%</span> of {totalLeadTarget.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, leadAchievementPercent)}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Opportunity Achievement */}
          <Card className="border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Opportunity Achievement</span>
                <span className="h-6 w-6 rounded bg-amber-50 dark:bg-amber-955/30 text-amber-600 flex items-center justify-center"><Target className="h-3.5 w-3.5" /></span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{totalOpportunityAchieved.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  <span className="text-amber-605 font-bold">{opportunityAchievementPercent}%</span> of {totalOpportunityTarget.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, opportunityAchievementPercent)}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Average Conversion Achievement */}
          <Card className="border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">Average Conversion</span>
                <span className="h-6 w-6 rounded bg-purple-50 dark:bg-purple-955/30 text-purple-600 flex items-center justify-center font-bold">%</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{overallConversionAchieved.toFixed(2)}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  vs target <span className="font-bold">{averageConversionTarget.toFixed(0)}%</span>
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (overallConversionAchieved / (averageConversionTarget || 1)) * 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Performance Table */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                <TableRow className="border-b dark:border-slate-800">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3 pl-4" rowSpan={2}>Territory</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Revenue (₹)</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Leads</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={3}>Opportunities</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-1.5 text-center border-b border-slate-100 dark:border-slate-850" colSpan={2}>Conversion %</TableHead>
                </TableRow>
                <TableRow className="border-b dark:border-slate-800">
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5 border-r dark:border-slate-850">Target</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Target</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Target</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-right py-1.5">Achieved</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5 border-r dark:border-slate-850">% Ach.</TableHead>

                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5">Target</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 text-center py-1.5">Achieved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceTable.map((item) => {
                  const revPercent = item.revenue.percentage ?? 0;
                  const leadPercent = item.leads.percentage ?? 0;
                  const oppPercent = item.opportunities.percentage ?? 0;

                  return (
                    <TableRow key={item.territory_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 text-xs">
                      <TableCell className="py-2.5 pl-4 font-bold text-slate-900 dark:text-white">{item.territory_name}</TableCell>

                      {/* Revenue */}
                      <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500 border-r dark:border-slate-850">{formatCurrency(item.revenue.target)}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.revenue.achieved)}</TableCell>
                      <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{revPercent}%</TableCell>

                      {/* Leads */}
                      <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500">{item.leads.target.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.leads.achieved.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{leadPercent}%</TableCell>

                      {/* Opportunities */}
                      <TableCell className="py-2.5 text-right font-mono font-medium text-slate-500">{item.opportunities.target.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.opportunities.achieved.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450 border-r dark:border-slate-850">{oppPercent}%</TableCell>

                      {/* Conversion */}
                      <TableCell className="py-2.5 text-center font-mono font-medium text-slate-500">{item.conversion.target}%</TableCell>
                      <TableCell className="py-2.5 text-center font-mono font-bold text-slate-805 dark:text-slate-200">{item.conversion.achieved}%</TableCell>
                    </TableRow>
                  );
                })}
                {performanceTable.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-12 text-center text-slate-400">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                      <span>No Quota Performance records match the filter criteria.</span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* dialogs */}

      {/* Create Quota Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-blue-650" />
              Create Territory Quota
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Establish a new target quota for a selected territory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs font-semibold">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Select Territory</Label>
              <Select value={formData.territory} onValueChange={(val) => setFormData({ ...formData, territory: val || '' })}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950">
                  <SelectValue placeholder="Select territory" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  {territories.map(t => (
                    <SelectItem key={t.id || t.code} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Revenue Target (₹)</Label>
              <Input
                type="number"
                value={formData.revenueTarget}
                onChange={(e) => setFormData({ ...formData, revenueTarget: Number(e.target.value) })}
                className="h-9 text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Lead Target</Label>
                <Input
                  type="number"
                  value={formData.leadTarget}
                  onChange={(e) => setFormData({ ...formData, leadTarget: Number(e.target.value) })}
                  className="h-9 text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Opportunity Target</Label>
                <Input
                  type="number"
                  value={formData.opportunityTarget}
                  onChange={(e) => setFormData({ ...formData, opportunityTarget: Number(e.target.value) })}
                  className="h-9 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Conversion Target (%)</Label>
              <Input
                type="number"
                value={formData.conversionTarget}
                onChange={(e) => setFormData({ ...formData, conversionTarget: Number(e.target.value) })}
                className="h-9 text-xs bg-slate-50"
              />
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Create Quota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Quota Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="h-4.5 w-4.5 text-blue-650" />
              Edit Territory Quota: {editTerritoryName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update targets for the selected territory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs font-semibold">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Revenue Target (₹)</Label>
              <Input
                type="number"
                value={formData.revenueTarget}
                onChange={(e) => setFormData({ ...formData, revenueTarget: Number(e.target.value) })}
                className="h-9 text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Lead Target</Label>
                <Input
                  type="number"
                  value={formData.leadTarget}
                  onChange={(e) => setFormData({ ...formData, leadTarget: Number(e.target.value) })}
                  className="h-9 text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Opportunity Target</Label>
                <Input
                  type="number"
                  value={formData.opportunityTarget}
                  onChange={(e) => setFormData({ ...formData, opportunityTarget: Number(e.target.value) })}
                  className="h-9 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Conversion Target (%)</Label>
              <Input
                type="number"
                value={formData.conversionTarget}
                onChange={(e) => setFormData({ ...formData, conversionTarget: Number(e.target.value) })}
                className="h-9 text-xs bg-slate-50"
              />
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
