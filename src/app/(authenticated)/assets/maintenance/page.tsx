'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import {
  searchAssetMaintenances,
  filterAssetMaintenances,
  fetchAssetMasterWithoutPagination
} from '@/service/api/Assets/api';
import { 
  Building, 
  Calendar, 
  Clock, 
  ChevronDown, 
  Plus, 
  Search,
  Download,
  Laptop,
  CheckCircle,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Wrench,
  Coins,
  Briefcase,
  Play,
  X,
  Filter,
  PlusCircle,
  Check,
  Info,
  Trash2,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AssetMaintenance } from '@/types/asset';
import { Skeleton } from '@/components/ui/skeleton';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AssetMaintenancePage() {
  const router = useRouter();
  const { 
    maintenances, 
    maintenancesCount, 
    maintenancesPage, 
    fetchMaintenancesPage, 
    assets, 
    addMaintenance, 
    updateMaintenance, 
    deleteMaintenance,
    fetchInitialData, 
    isLoaded, 
    isLoading 
  } = useAssetStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);
  
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Pending' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [apiResults, setApiResults] = useState<any[] | null>(null);
  const [isSearchingOrFiltering, setIsSearchingOrFiltering] = useState(false);

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    Status: '',
    Remarks: '',
    Created_By: '',
    fromdate: '',
    todate: ''
  });
  const [activeFilters, setActiveFilters] = useState<any>(null);

  const debounceTimerSearch = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (activeFilters) {
      setActiveFilters(null);
      setApiResults(null);
    }
    if (debounceTimerSearch.current) clearTimeout(debounceTimerSearch.current);
    debounceTimerSearch.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 400);
  };

  // Effect for general search (AssetMaintenanceSearch)
  useEffect(() => {
    if (!debouncedSearch) {
      if (!activeFilters) {
        setApiResults(null);
        setIsSearchingOrFiltering(false);
      }
      return;
    }
    let active = true;
    setIsSearchingOrFiltering(true);

    const performSearch = async () => {
      try {
        let currentRawAssets = useAssetStore.getState().rawAssetsForMapping;
        if (currentRawAssets.length === 0) {
          currentRawAssets = await fetchAssetMasterWithoutPagination();
          useAssetStore.setState({ rawAssetsForMapping: currentRawAssets });
        }
        const res = await searchAssetMaintenances(debouncedSearch);
        if (active) {
          const list = Array.isArray(res) ? res : (res as any)?.results ?? [];
          const mapped = list.map((item: any) => {
            const assetObj = currentRawAssets.find(a => a.id === item.Asset_Id);
            return {
              id: item.id.toString(),
              assetId: item.Asset_Id.toString(),
              assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
              assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown',
              maintenanceType: 'Corrective',
              description: item.Issue_Description || '',
              cost: ` ${Number(item.Maintenance_Cost || 0).toLocaleString()}`,
              startDate: item.Start_Date ? item.Start_Date.split('T')[0] : '',
              endDate: item.End_Date ? item.End_Date.split('T')[0] : '',
              status: (item.Status as any) || 'Pending',
              performedBy: item.Vendor_Id ? 'Vendor ' + item.Vendor_Id : 'IT Support Team',
              notes: item.Remarks
            };
          });
          setApiResults(mapped);
        }
      } catch (err) {
        console.error('Search maintenances failed', err);
        if (active) setApiResults([]);
      } finally {
        if (active) setIsSearchingOrFiltering(false);
      }
    };
    performSearch();
    return () => { active = false; };
  }, [debouncedSearch]);

  const applyFilters = async (values: typeof filterValues) => {
    // Clear simple search
    setSearchQuery('');
    setDebouncedSearch('');
    
    // Remove empty values from payload
    const payload: any = {};
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (key === 'Created_By') {
          payload[key] = Number(val) || val;
        } else {
          payload[key] = val;
        }
      }
    });

    setActiveFilters(payload);
    setIsFilterDialogOpen(false);

    if (Object.keys(payload).length === 0) {
      setApiResults(null);
      return;
    }

    setIsSearchingOrFiltering(true);
    try {
      let currentRawAssets = useAssetStore.getState().rawAssetsForMapping;
      if (currentRawAssets.length === 0) {
        currentRawAssets = await fetchAssetMasterWithoutPagination();
        useAssetStore.setState({ rawAssetsForMapping: currentRawAssets });
      }

      const res = await filterAssetMaintenances(payload);
      const list = Array.isArray(res) ? res : (res as any)?.results ?? [];
      const mapped = list.map((item: any) => {
        const assetObj = currentRawAssets.find(a => a.id === item.Asset_Id);
        return {
          id: item.id.toString(),
          assetId: item.Asset_Id.toString(),
          assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
          assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown',
          maintenanceType: 'Corrective',
          description: item.Issue_Description || '',
          cost: ` ${Number(item.Maintenance_Cost || 0).toLocaleString()}`,
          startDate: item.Start_Date ? item.Start_Date.split('T')[0] : '',
          endDate: item.End_Date ? item.End_Date.split('T')[0] : '',
          status: (item.Status as any) || 'Pending',
          performedBy: item.Vendor_Id ? 'Vendor ' + item.Vendor_Id : 'IT Support Team',
          notes: item.Remarks
        };
      });
      setApiResults(mapped);
    } catch (err) {
      console.error('Filtering maintenances failed', err);
      setApiResults([]);
      toast.error('Failed to apply filters');
    } finally {
      setIsSearchingOrFiltering(false);
    }
  };

  const clearFilters = () => {
    const cleared = {
      Status: '',
      Remarks: '',
      Created_By: '',
      fromdate: '',
      todate: ''
    };
    setFilterValues(cleared);
    setActiveFilters(null);
    setApiResults(null);
  };


  // Stats
  const totalCount = maintenancesCount;
  const inProgressCount = maintenances.filter(m => m.status === 'In Progress').length;
  const pendingCount = maintenances.filter(m => m.status === 'Pending').length;
  const completedCount = maintenances.filter(m => m.status === 'Completed').length;

  const totalPages = Math.ceil(maintenancesCount / 10) || 1;
  const handlePrevPage = () => {
    if (maintenancesPage > 1) {
      fetchMaintenancesPage(maintenancesPage - 1);
    }
  };
  const handleNextPage = () => {
    if (maintenancesPage < totalPages) {
      fetchMaintenancesPage(maintenancesPage + 1);
    }
  };

  // Total maintenance cost calculation
  const totalCost = maintenances.reduce((sum, item) => {
    const costNum = parseInt(item.cost.replace(/[^0-9]/g, '')) || 0;
    return sum + costNum;
  }, 0);

  const baseMaintenances = apiResults !== null ? apiResults : maintenances;

  const filteredMaintenances = baseMaintenances.filter(item => {
    if (apiResults !== null) return true;
    if (activeTab !== 'All' && item.status !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(query) ||
        item.assetName.toLowerCase().includes(query) ||
        item.assetTag.toLowerCase().includes(query) ||
        item.performedBy.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status: AssetMaintenance['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400">
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400">
            Pending
          </span>
        );
    }
  };

  const handleStatusUpdate = (id: string, newStatus: AssetMaintenance['status']) => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const updates: Partial<AssetMaintenance> = { status: newStatus };
    if (newStatus === 'Completed') {
      updates.endDate = todayStr;
    }
    updateMaintenance(id, updates);
  };

  const handleDelete = (id: string) => {
    toast.warning('Are you sure you want to delete this maintenance record?', {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteMaintenance(id);
        }
      }
    });
  };

  const renderActions = (item: AssetMaintenance) => {
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {item.status === 'Pending' && (
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            onClick={() => handleStatusUpdate(item.id, 'In Progress')}
            title="Start Service"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
        {item.status === 'In Progress' && (
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 hover:text-emerald-700"
            onClick={() => handleStatusUpdate(item.id, 'Completed')}
            title="Complete Service"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] text-slate-455">
              <MoreVertical className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Service Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.status === 'Pending' && (
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-xs font-semibold text-blue-650 hover:text-blue-700"
                onClick={() => handleStatusUpdate(item.id, 'In Progress')}
              >
                <Play className="h-3.5 w-3.5 text-blue-500" /> Start Service
              </DropdownMenuItem>
            )}
            {item.status === 'In Progress' && (
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => handleStatusUpdate(item.id, 'Completed')}
              >
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Complete Service
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-xs font-semibold"
              onClick={() => router.push(`/assets/maintenance/${item.id}`)}
            >
              <Info className="h-3.5 w-3.5 text-slate-500" /> View Summary
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700"
              onClick={() => router.push(`/assets/maintenance/${item.id}/edit`)}
            >
              <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit Service Log
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Log
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const columns = React.useMemo<ColumnConfig<AssetMaintenance>[]>(() => [
    {
      key: 'id',
      header: 'Log ID',
      sortable: true,
      className: 'text-blue-650 font-bold hover:underline cursor-pointer',
      render: (item) => (
        <span onClick={() => router.push(`/assets/maintenance/${item.id}`)}>
          {item.id}
        </span>
      )
    },
    {
      key: 'assetName',
      header: 'Asset Details',
      sortable: true,
      render: (item) => (
        <div>
          <p className="text-xs font-bold text-slate-805 dark:text-white">{item.assetName}</p>
          <p className="text-[9px] text-slate-400 font-semibold">{item.assetTag}</p>
        </div>
      )
    },
    {
      key: 'maintenanceType',
      header: 'Maintenance Type',
      sortable: true,
      render: (item) => (
        <span className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] uppercase tracking-wider font-bold",
          item.maintenanceType === 'Upgrade' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400' :
          item.maintenanceType === 'Preventive' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400' :
          item.maintenanceType === 'Calibration' ? 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400' :
          'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400'
        )}>
          {item.maintenanceType}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Service Details',
      sortable: true,
      className: 'text-slate-500 max-w-[180px] truncate',
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      sortable: true,
      className: 'text-slate-550',
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      className: 'text-slate-455 font-medium',
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      className: 'text-slate-455 font-medium',
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      className: 'text-slate-700 dark:text-slate-200',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => getStatusBadge(item.status),
    }
  ], []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left relative">

      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer">Asset Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Asset Maintenance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Asset Maintenance</h1>
          <p className="text-xs text-slate-450 mt-1">Track service, repairs, upgrades, and calibrations for your inventory.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350">
            <Download className="h-3.5 w-3.5" />
            Export Log
          </Button>
          <Button 
            onClick={() => router.push('/assets/maintenance/create')}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Log Maintenance
          </Button>
        </div>
      </div>

      {/* KPI Stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* KPI 1 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-blue-600 shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Logs</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalCount}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Service History</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-550 shrink-0">
              <Clock className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{inProgressCount}</h3>
              <p className="text-[9px] text-blue-600 mt-1 font-bold">Currently Active</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{pendingCount}</h3>
              <p className="text-[9px] text-amber-600 mt-1 font-bold">Waiting for Service</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{completedCount}</h3>
              <p className="text-[9px] text-emerald-600 mt-1 font-bold">Repairs Done</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
              <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalCost.toLocaleString()}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Service Costs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance table log card */}
      {/* Table Toolbar Card */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
        
        {/* Table header menu tabs */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Maintenance Registry</h3>
            {(searchQuery || activeFilters) && (
              <span className="text-xs text-slate-400 font-semibold">
                {isSearchingOrFiltering ? 'Searching...' : `${filteredMaintenances.length} result${filteredMaintenances.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Search */}
            <div className="relative w-full md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search log..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8.5 pl-8.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 placeholder-slate-400 w-full bg-white dark:bg-slate-900 pr-8" 
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <Button
              onClick={() => setIsFilterDialogOpen(true)}
              className={cn(
                "h-8.5 px-4 rounded-[5px] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeFilters && Object.keys(activeFilters).length > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border dark:border-slate-800"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {activeFilters && Object.keys(activeFilters).length > 0 ? 'Filtered' : 'Filter'}
            </Button>

            {activeFilters && Object.keys(activeFilters).length > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-8.5 px-3 rounded-[5px] text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table content list */}
      {isLoading || isSearchingOrFiltering ? (
        <div className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-955/30 border-b dark:border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3 w-8">
                    <input type="checkbox" className="rounded-[5px] border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-5 py-3">Log ID</th>
                  <th className="px-5 py-3">Asset Details</th>
                  <th className="px-5 py-3">Maintenance Type</th>
                  <th className="px-5 py-3">Service Details</th>
                  <th className="px-5 py-3">Performed By</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">End Date</th>
                  <th className="px-5 py-3">Cost</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-xs font-semibold text-slate-700">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-[5px]" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-5 py-3.5 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <ReusableTable
          columns={columns}
          data={filteredMaintenances}
          initialPageSize={10}
          actions={renderActions}
          enableSelection={true}
          page={apiResults !== null ? undefined : maintenancesPage}
          totalRecords={apiResults !== null ? undefined : maintenancesCount}
          onChangePage={apiResults !== null ? undefined : fetchMaintenancesPage}
        />
      )}

      {/* Filter Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Filter Maintenance Registry
              </h3>
              <button 
                onClick={() => setIsFilterDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={filterValues.Status}
                    onChange={(e) => setFilterValues({ ...filterValues, Status: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remarks</label>
                  <Input
                    placeholder="Enter remarks keyword"
                    value={filterValues.Remarks}
                    onChange={(e) => setFilterValues({ ...filterValues, Remarks: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created By User ID</label>
                  <Input
                    placeholder="Enter user ID"
                    type="number"
                    value={filterValues.Created_By}
                    onChange={(e) => setFilterValues({ ...filterValues, Created_By: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</label>
                  <Input
                    type="date"
                    value={filterValues.fromdate}
                    onChange={(e) => setFilterValues({ ...filterValues, fromdate: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</label>
                  <Input
                    type="date"
                    value={filterValues.todate}
                    onChange={(e) => setFilterValues({ ...filterValues, todate: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="h-8.5 rounded-[5px] text-xs font-semibold cursor-pointer"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={() => applyFilters(filterValues)}
                className="h-8.5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
