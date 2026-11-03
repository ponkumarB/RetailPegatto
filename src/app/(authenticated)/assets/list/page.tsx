'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { searchAssetMaster, filterAssetMaster } from '@/service/api/Assets/api';
import { 
  Laptop, 
  Search, 
  Grid, 
  List, 
  MoreVertical, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Layers,
  ChevronDown,
  Building,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  Coins,
  Tag,
  Wrench,
  X,
  Eye,
  Trash2,
  Edit,
  Loader2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Asset } from '@/types/asset';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AssetListPage() {
  const router = useRouter();
  const { 
    assets, 
    assetsCount, 
    assetsPage, 
    fetchAssetsPage, 
    deleteAsset, 
    addMaintenance,
    fetchInitialData, 
    isLoaded, 
    isLoading 
  } = useAssetStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    Asset_Name: '',
    Asset_Code: '',
    Brand: '',
    Location: '',
    Asset_Status: '',
    Model_Number: '',
    Serial_Number: '',
    Created_By: '',
    fromdate: '',
    todate: ''
  });
  const [activeFilters, setActiveFilters] = useState<any>(null);

  // Search API state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (activeFilters) {
      setActiveFilters(null);
      setSearchResults([]);
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 400);
  };

  // Fire API search when debouncedSearch changes
  useEffect(() => {
    if (!debouncedSearch) {
      if (!activeFilters) {
        setSearchResults([]);
        setIsSearching(false);
      }
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchAssetMaster(debouncedSearch)
      .then((res) => {
        if (!cancelled) {
          const result = res as any;
          const list: any[] = Array.isArray(result) ? result : result?.results ?? [];
          setSearchResults(list);
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => { cancelled = true; };
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
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await filterAssetMaster(payload);
      const list: any[] = Array.isArray(res) ? res : (res as any)?.results ?? [];
      setSearchResults(list);
    } catch (err) {
      console.error('Filter asset master failed', err);
      setSearchResults([]);
      toast.error('Failed to apply filters');
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    const cleared = {
      Asset_Name: '',
      Asset_Code: '',
      Brand: '',
      Location: '',
      Asset_Status: '',
      Model_Number: '',
      Serial_Number: '',
      Created_By: '',
      fromdate: '',
      todate: ''
    };
    setFilterValues(cleared);
    setActiveFilters(null);
    setSearchResults([]);
  };

  // Stats
  const totalAssets = assetsCount;
  const inUseCount = assets.filter(a => a.status === 'In Use').length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const maintenanceCount = assets.filter(a => a.status === 'Maintenance').length;
  
  // Total Value Calculation
  const totalValue = assets.reduce((sum, asset) => {
    const priceStr = asset.purchasePrice.replace(/[^0-9]/g, '');
    const price = parseInt(priceStr) || 0;
    return sum + price;
  }, 0);

  // Determine which list to display
  const isSearchOrFilterMode = debouncedSearch.length > 0 || (activeFilters !== null && Object.keys(activeFilters).length > 0);

  // Map API search result to Asset display shape
  const mappedSearchResults: Asset[] = searchResults.map((item: any) => ({
    id: item.id?.toString() ?? '',
    tagId: item.Asset_Code ?? 'N/A',
    name: item.Asset_Name ?? 'N/A',
    category: item.Category_Id?.Category_Name ?? item.Category_Name ?? '',
    subcategory: item.SubCategory_Id?.SubCategory_Name ?? item.SubCategory_Name ?? '',
    brand: item.Brand ?? '',
    model: item.Model_Number ?? '',
    serialNumber: item.Serial_Number ?? '',
    type: (item.Asset_Type ?? item.type ?? 'Hardware') as Asset['type'],
    status: (item.Asset_Status ?? 'Available') as Asset['status'],
    assignedTo: item.Current_Employee ?? undefined,
    location: item.Location ?? '',
    purchaseDate: item.Purchase_Date ?? '',
    purchasePrice: item.Purchase_Cost?.toString() ?? '0',
    warrantyExpiryDate: item.Warranty_Expiry_Date ?? item.Warranty_End_Date ?? '',
    vendorSupplier: item.Vendor_Id?.Vendor_Name ?? item.Vendor_Name ?? '',
    invoiceNumber: item.Invoice_Number ?? '',
    poNumber: item.PO_Number ?? '',
    criticality: (item.criticality ?? 'Low') as Asset['criticality'],
    department: item.Current_Department ?? '',
    notes: item.Remarks ?? '',
    ipAddress: item.IP_Address ?? '',
    macAddress: item.MAC_Address ?? '',
  }));

  const filteredAssets = isSearchOrFilterMode
    ? mappedSearchResults
    : assets;

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
            Available
          </span>
        );
      case 'In Use':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            In Use
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Maintenance
          </span>
        );
      case 'Retired':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Retired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
            {status}
          </span>
        );
    }
  };

  const getCriticalityBadge = (criticality: Asset['criticality']) => {
    switch (criticality) {
      case 'High':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold bg-slate-50 text-slate-655 dark:bg-slate-900 dark:text-slate-400">
            Low
          </span>
        );
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.warning('Are you sure you want to delete this asset?', {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteAsset(id);
          if (selectedAsset && selectedAsset.id === id) {
            setSelectedAsset(null);
          }
        }
      }
    });
  };

  const handleLogMaintenance = (asset: Asset) => {
    toast.warning(`Are you sure you want to send "${asset.name}" to maintenance?`, {
      action: {
        label: 'Send',
        onClick: async () => {
          const newLog = {
            id: `MNT-2024-${Math.floor(100 + Math.random() * 900)}`,
            assetId: asset.id,
            assetName: asset.name,
            assetTag: asset.tagId,
            maintenanceType: 'Corrective' as const,
            description: 'Asset sent to maintenance from Asset Registry',
            cost: '0',
            startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            endDate: '-',
            status: 'Pending' as const,
            performedBy: 'IT Support Team',
            notes: ''
          };
          try {
            await addMaintenance(newLog);
            toast.success(`"${asset.name}" has been moved to maintenance.`);
          } catch (error) {
            console.error('Failed to send asset to maintenance:', error);
            toast.error('Failed to send asset to maintenance.');
          }
        }
      }
    });
  };

  const columns = useMemo<ColumnConfig<Asset>[]>(() => [
    {
      key: 'tagId',
      header: 'Asset Tag',
      sortable: true,
    },
    {
      key: 'name',
      header: 'Asset Name',
      sortable: true,
      render: (asset) => (
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors">
            {asset.name}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {asset.category}{asset.subcategory ? ` > ${asset.subcategory}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'brand',
      header: 'Brand / Model',
      sortable: true,
      render: (asset) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
          {asset.brand} &bull; {asset.model}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'serialNumber',
      header: 'Serial Number',
      sortable: true,
      className: 'font-mono',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (asset) => getStatusBadge(asset.status),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      render: (asset) => asset.assignedTo ? (
        <div className="flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
            {asset.assignedTo.split(' ').map((n: string) => n[0]).join('')}
          </span>
          <span>{asset.assignedTo}</span>
        </div>
      ) : (
        <span className="text-slate-400 font-medium">Unassigned</span>
      ),
    },
    {
      key: 'criticality',
      header: 'Criticality',
      sortable: true,
      render: (asset) => getCriticalityBadge(asset.criticality),
    },
  ], [router]);

  const renderActions = (asset: Asset) => {
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] text-slate-450">
              <MoreVertical className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Asset Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/assets/${asset.id}`)}>
              <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/assets/${asset.id}/edit`)}>
              <Edit className="h-3.5 w-3.5 text-slate-500" /> Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/assets/allocation/create?assetId=${asset.id}`)}>
              <User className="h-3.5 w-3.5 text-slate-500" /> Allocate Asset
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleLogMaintenance(asset)}>
              <Wrench className="h-3.5 w-3.5 text-slate-500" /> Log Maintenance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={(e) => handleDelete(asset.id, e)}>
              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left relative">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="text-slate-500 font-medium">Asset List</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Asset List</h1>
          <p className="text-xs text-slate-450 mt-1">Manage and track your organization's physical and digital assets.</p>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          
          <Button 
            onClick={() => router.push('/assets/create')}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* KPI stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* KPI 1 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assets</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalAssets}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Active Inventory</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-550">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Use</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{inUseCount}</h3>
              <p className="text-[9px] text-blue-600 mt-1 font-bold">{((inUseCount / (totalAssets || 1)) * 100).toFixed(0)}% Allocated</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{availableCount}</h3>
              <p className="text-[9px] text-emerald-650 mt-1 font-bold">In Stock</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{maintenanceCount}</h3>
              <p className="text-[9px] text-amber-600 mt-1 font-bold">Needs Support</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Value</p>
              <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5"> {totalValue.toLocaleString()}</h3>
              <p className="text-[9px] text-slate-455 mt-1 font-semibold">Estimated Cost</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content table card */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
        
        {/* Table Tabs/Toolbar */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Asset Registry</h3>
            {isSearchOrFilterMode && (
              <span className="text-xs text-slate-400 font-semibold">
                {isSearching ? 'Searching...' : `${filteredAssets.length} result${filteredAssets.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              )}
              <Input 
                placeholder="Search assets..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8.5 pl-8.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 placeholder-slate-400 w-full bg-white dark:bg-slate-900 pr-8" 
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setSearchResults([]); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
 
      {/* Table Content */}
      {((isLoading && !isSearchOrFilterMode) || isSearching) ? (
        <div className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4 py-3 border-b dark:border-slate-850 last:border-0 animate-pulse">
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-28 shrink-0 hidden md:block" />
                <Skeleton className="h-4 w-16 shrink-0" />
                <Skeleton className="h-4 w-24 shrink-0 hidden sm:block" />
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28 shrink-0 hidden lg:block" />
                <Skeleton className="h-6 w-14 rounded-full shrink-0" />
                <Skeleton className="h-8 w-16 rounded shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ReusableTable
          columns={columns}
          data={filteredAssets}
          initialPageSize={10}
          actions={renderActions}
          enableSelection={true}
          onRowClick={(asset) => router.push(`/assets/${asset.id}`)}
          page={isSearchOrFilterMode ? undefined : assetsPage}
          totalRecords={isSearchOrFilterMode ? undefined : assetsCount}
          onChangePage={isSearchOrFilterMode ? undefined : fetchAssetsPage}
        />
      )}

      {/* Filter Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Filter Asset Registry
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Name</label>
                  <Input
                    placeholder="Enter asset name"
                    value={filterValues.Asset_Name}
                    onChange={(e) => setFilterValues({ ...filterValues, Asset_Name: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Code</label>
                  <Input
                    placeholder="Enter code"
                    value={filterValues.Asset_Code}
                    onChange={(e) => setFilterValues({ ...filterValues, Asset_Code: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand</label>
                  <Input
                    placeholder="Enter brand"
                    value={filterValues.Brand}
                    onChange={(e) => setFilterValues({ ...filterValues, Brand: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</label>
                  <Input
                    placeholder="Enter location"
                    value={filterValues.Location}
                    onChange={(e) => setFilterValues({ ...filterValues, Location: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={filterValues.Asset_Status}
                    onChange={(e) => setFilterValues({ ...filterValues, Asset_Status: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Number</label>
                  <Input
                    placeholder="Enter model"
                    value={filterValues.Model_Number}
                    onChange={(e) => setFilterValues({ ...filterValues, Model_Number: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Serial Number</label>
                  <Input
                    placeholder="Enter serial"
                    value={filterValues.Serial_Number}
                    onChange={(e) => setFilterValues({ ...filterValues, Serial_Number: e.target.value })}
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
