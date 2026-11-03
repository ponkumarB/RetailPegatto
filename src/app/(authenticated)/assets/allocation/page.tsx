'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { 
  searchAssetTransactions, 
  filterAssetTransactions, 
  fetchAssetMasterWithoutPagination 
} from '@/service/api/Assets/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { useQuery } from '@tanstack/react-query';

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
  Activity,
  ShieldCheck,
  Briefcase,
  Monitor,
  Volume2,
  HardDrive,
  Wrench,
  Trash2,
  Eye,
  RefreshCw,
  Edit,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetAllocation } from '@/types/asset';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';

export default function AssetsAllocationPage() {
  const router = useRouter();
  const { 
    allocations, 
    allocationsCount, 
    allocationsPage, 
    fetchAllocationsPage, 
    assets, 
    updateAllocation, 
    updateAsset, 
    deleteAllocation,
    fetchInitialData, 
    isLoaded, 
    isLoading,
    rawAssetsForMapping
  } = useAssetStore();

  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = React.useMemo(() => {
    if (Array.isArray(usersRaw)) {
      return usersRaw.map((u: any) => ({
        id: u.id,
        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || 'Unknown',
      }));
    }
    return [];
  }, [usersRaw]);

  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);
  
  const [activeTab, setActiveTab] = useState<'List' | 'User' | 'Location' | 'History'>('List');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [apiResults, setApiResults] = useState<any[] | null>(null);
  const [isSearchingOrFiltering, setIsSearchingOrFiltering] = useState(false);

  const handleExport = () => {
    const dataToExport = apiResults !== null ? apiResults : allocations;
    if (dataToExport.length === 0) {
      toast.error('No asset allocations available to export');
      return;
    }

    const excelData = dataToExport.map((alc) => ({
      'Allocation ID': alc.id,
      'Asset ID': alc.assetId,
      'Asset Name': alc.assetName,
      'Asset Tag': alc.assetTag,
      'Asset Type': alc.assetType,
      'Allocated To': alc.allocatedTo,
      'Email': alc.email,
      'Phone': alc.phone,
      'Department': alc.department,
      'Reporting Manager': alc.reportingManager,
      'Location': alc.location,
      'Cost Center': alc.costCenter,
      'Allocation Date': alc.allocationDate ? new Date(alc.allocationDate).toLocaleDateString() : '',
      'Expected Return': alc.expectedReturnDate ? new Date(alc.expectedReturnDate).toLocaleDateString() : '',
      'Status': alc.status,
      'Purpose / Comments': alc.purposeComments || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset Allocations');
    XLSX.writeFile(workbook, `Asset_Allocations_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Asset allocations exported successfully');
  };

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    Employee_Name: '',
    Department: '',
    Location: '',
    Transaction_Type: '',
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

  const handleDelete = (id: string) => {
    toast.warning('Are you sure you want to delete this allocation?', {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteAllocation(id);
        }
      }
    });
  };

  // Effect for general search (AssetTransactionSearch API)
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

        const res = await searchAssetTransactions(debouncedSearch);
        if (active) {
          const list = Array.isArray(res) ? res : (res as any)?.results ?? [];
          const mapped = list.map((item: any) => {
            const assetObj = currentRawAssets.find(a => a.id === item.Asset_Id);
            return {
              id: item.id.toString(),
              assetId: item.Asset_Id.toString(),
              assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
              assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown Tag',
              assetType: 'Hardware',
              allocatedTo: item.Employee_Name || '',
              email: item.Email || '',
              phone: item.Mobile_Number || '',
              department: item.Department || '',
              reportingManager: '',
              location: item.Location || '',
              address: item.Address || '',
              costCenter: item.Cost_Center || '',
              allocationDate: item.Transaction_Date || '',
              expectedReturnDate: item.Expected_Return || '',
              status: (assetObj && assetObj.Asset_Status === 'Maintenance') ? 'Maintenance' : (item.Transaction_Type === 'ALLOCATE' ? 'Allocated' : 'Returned'),
              purposeComments: item.Remarks
            };
          });
          setApiResults(mapped);
        }
      } catch (err) {
        console.error('Search transactions failed', err);
        if (active) setApiResults([]);
      } finally {
        if (active) setIsSearchingOrFiltering(false);
      }
    };

    performSearch();

    return () => {
      active = false;
    };
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

      const res = await filterAssetTransactions(payload);
      const list = Array.isArray(res) ? res : (res as any)?.results ?? [];
      const mapped = list.map((item: any) => {
        const assetObj = currentRawAssets.find(a => a.id === item.Asset_Id);
        return {
          id: item.id.toString(),
          assetId: item.Asset_Id.toString(),
          assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
          assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown Tag',
          assetType: 'Hardware',
          allocatedTo: item.Employee_Name || '',
          email: item.Email || '',
          phone: item.Mobile_Number || '',
          department: item.Department || '',
          reportingManager: '',
          location: item.Location || '',
          address: item.Address || '',
          costCenter: item.Cost_Center || '',
          allocationDate: item.Transaction_Date || '',
          expectedReturnDate: item.Expected_Return || '',
          status: (assetObj && assetObj.Asset_Status === 'Maintenance') ? 'Maintenance' : (item.Transaction_Type === 'ALLOCATE' ? 'Allocated' : 'Returned'),
          purposeComments: item.Remarks
        };
      });
      setApiResults(mapped);
    } catch (err) {
      console.error('Filtering transactions failed', err);
      setApiResults([]);
      toast.error('Failed to apply filters');
    } finally {
      setIsSearchingOrFiltering(false);
    }
  };

  const clearFilters = () => {
    const cleared = {
      Employee_Name: '',
      Department: '',
      Location: '',
      Transaction_Type: '',
      Created_By: '',
      fromdate: '',
      todate: ''
    };
    setFilterValues(cleared);
    setActiveFilters(null);
    setApiResults(null);
  };

  // Stats
  const totalCount = allocationsCount;
  const allocatedCount = allocations.filter(a => a.status === 'Allocated').length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const maintenanceCount = assets.filter(a => a.status === 'Maintenance').length;
  const retiredCount = 0;

  // Pie chart data
  const pieData = [
    { name: 'Allocated', value: allocatedCount, color: '#10b981' },
    { name: 'Available', value: availableCount, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceCount, color: '#f59e0b' },
    { name: 'Retired', value: retiredCount, color: '#8b5cf6' }
  ];

  const baseAllocations = apiResults !== null ? apiResults : allocations;

  const filteredAllocations = baseAllocations.filter(alc => {
    if (apiResults === null && searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alc.assetName.toLowerCase().includes(query) ||
        alc.assetTag.toLowerCase().includes(query) ||
        alc.allocatedTo.toLowerCase().includes(query) ||
        alc.department.toLowerCase().includes(query) ||
        alc.location.toLowerCase().includes(query)
      );
    }
    return true;
  });


  const getAssetIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('laptop') || cat.includes('computer')) return <Laptop className="h-4 w-4 text-blue-500" />;
    if (cat.includes('monitor') || cat.includes('screen')) return <Monitor className="h-4 w-4 text-purple-500" />;
    if (cat.includes('phone') || cat.includes('mobile')) return <Laptop className="h-4 w-4 text-emerald-500" />; // Laptop serves as display
    if (cat.includes('headset') || cat.includes('audio')) return <Volume2 className="h-4 w-4 text-cyan-500" />;
    if (cat.includes('storage') || cat.includes('hdd') || cat.includes('drive')) return <HardDrive className="h-4 w-4 text-rose-500" />;
    return <Briefcase className="h-4 w-4 text-slate-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Allocated':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
            Allocated
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Maintenance
          </span>
        );
      case 'Returned':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Returned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            Available
          </span>
        );
    }
  };

  const totalPages = Math.ceil(allocationsCount / 10) || 1;
  const handlePrevPage = () => {
    if (allocationsPage > 1) {
      fetchAllocationsPage(allocationsPage - 1);
    }
  };
  const handleNextPage = () => {
    if (allocationsPage < totalPages) {
      fetchAllocationsPage(allocationsPage + 1);
    }
  };

  const renderActions = (alc: AssetAllocation) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] text-slate-450">
            <MoreVertical className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Allocation Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {alc.status === 'Allocated' && (
            <>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => {
                  updateAllocation(alc.id, { status: 'Returned', expectedReturnDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
                  updateAsset(alc.assetId, { status: 'Available', assignedTo: undefined, department: undefined, location: undefined });
                  toast.success('Asset returned successfully');
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-500" /> Return Asset
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-xs font-semibold text-amber-600 hover:text-amber-700"
                onClick={() => {
                  updateAllocation(alc.id, { status: 'Maintenance' });
                  updateAsset(alc.assetId, { status: 'Maintenance' });
                  toast.success('Asset sent to maintenance');
                }}
              >
                <Wrench className="h-3.5 w-3.5 text-amber-500" /> Send to Maintenance
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700"
                onClick={() => router.push(`/assets/allocation/${alc.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit Allocation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem 
            className="gap-2 cursor-pointer text-xs font-semibold"
            onClick={() => router.push(`/assets/allocation/create?assetId=${alc.assetId}`)}
          >
            <User className="h-3.5 w-3.5 text-slate-500" /> Reallocate Asset
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold"
            onClick={() => handleDelete(alc.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Allocation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const columns = React.useMemo<ColumnConfig<AssetAllocation>[]>(() => [
    {
      key: 'assetName',
      header: 'Asset Details',
      sortable: true,
      render: (alc) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-[5px] border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-center shrink-0">
            {getAssetIcon(alc.assetName)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{alc.assetName}</p>
            <p className="text-[9px] text-slate-400 font-semibold">{alc.assetTag}</p>
          </div>
        </div>
      )
    },
    {
      key: 'assetType',
      header: 'Asset Type',
      sortable: true,
      className: 'text-slate-500',
    },
    {
      key: 'serialNumber',
      header: 'Serial Number / ID',
      sortable: true,
      className: 'text-slate-500 font-mono',
      render: (alc) => assets.find(a => a.id === alc.assetId)?.serialNumber || 'DL5420-87921',
    },
    {
      key: 'allocatedTo',
      header: 'Allocated To',
      sortable: true,
      render: (alc) => alc.allocatedTo !== 'Available' ? (
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs">
            {alc.allocatedTo.split(' ').map(n => n[0]).join('')}
          </span>
          <span className="text-xs text-slate-750 dark:text-slate-300 font-semibold">{alc.allocatedTo}</span>
        </div>
      ) : (
        <span className="text-slate-400 font-medium">Unallocated</span>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      className: 'text-slate-500',
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      className: 'text-slate-500',
    },
    {
      key: 'allocationDate',
      header: 'Allocated Date',
      sortable: true,
      className: 'text-slate-455 font-medium',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (alc) => getStatusBadge(alc.status),
    }
  ], [assets]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-650 cursor-pointer">Asset Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Assets Allocation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Assets Allocation</h1>
          <p className="text-xs text-slate-450 mt-1">Allocate and track assets assigned to users and locations.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport}
            variant="outline" 
            size="sm" 
            className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button 
            onClick={() => router.push('/assets/allocation/create')}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Allocate Asset
          </Button>
        </div>
      </div>

      {/* KPI Stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* KPI 1 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assets</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalCount}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">All Assets</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocated Assets</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{allocatedCount}</h3>
              <p className="text-[9px] text-emerald-600 mt-1 font-bold">{((allocatedCount / totalCount) * 100).toFixed(2)}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-550 shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Assets</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{availableCount}</h3>
              <p className="text-[9px] text-blue-600 mt-1 font-bold">{((availableCount / totalCount) * 100).toFixed(2)}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{maintenanceCount}</h3>
              <p className="text-[9px] text-amber-650 mt-1 font-bold">{((maintenanceCount / totalCount) * 100).toFixed(2)}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-650 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Retired Assets</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{retiredCount}</h3>
              <p className="text-[9px] text-purple-600 mt-1 font-bold">{((retiredCount / totalCount) * 100).toFixed(2)}% of total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Allocation Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Columns (Tab board and table list) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Table Toolbar Card */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            
            {/* Table toolbar */}
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Allocation Registry</h3>
                {(searchQuery || activeFilters) && (
                  <span className="text-xs text-slate-400 font-semibold">
                    {isSearchingOrFiltering ? 'Searching...' : `${(apiResults ?? allocations).length} result${(apiResults ?? allocations).length !== 1 ? 's' : ''}`}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Search */}
                <div className="relative w-full md:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Search allocation..." 
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

          {/* Allocation Table */}
          {isLoading || isSearchingOrFiltering ? (
            <div className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-955/30 border-b dark:border-slate-855 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3 w-8">
                        <input type="checkbox" className="rounded-[5px] border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="px-5 py-3">Asset Details</th>
                      <th className="px-5 py-3">Asset Type</th>
                      <th className="px-5 py-3">Serial Number / ID</th>
                      <th className="px-5 py-3">Allocated To</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Allocated Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-xs font-semibold text-slate-700">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-4 rounded" /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-7 w-7 rounded-[5px]" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
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
              data={apiResults ?? allocations}
              initialPageSize={10}
              actions={renderActions}
              enableSelection={true}
              page={apiResults !== null ? undefined : allocationsPage}
              totalRecords={apiResults !== null ? undefined : allocationsCount}
              onChangePage={apiResults !== null ? undefined : fetchAllocationsPage}
            />
          )}
        </div>

        {/* Right Side Allocation Panels */}
        <div className="space-y-6">
          
          {/* Card 1: Allocation Overview (Chart) */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Allocation Overview</h3>
            </div>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="h-[140px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '5px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-850 dark:text-white">{totalCount}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                </div>
              </div>
              
              <div className="space-y-1.5 w-full pt-4 text-xs font-semibold text-slate-450">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-350">{entry.name}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-extrabold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Asset Status Summary */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Asset Status Summary</h3>
            </div>
            <CardContent className="p-4.5 space-y-3.5 text-xs font-semibold text-slate-500">
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span>All Assets</span>
                <span className="text-slate-850 dark:text-white font-bold">{totalCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span>Allocated Assets</span>
                <span className="text-slate-850 dark:text-white font-bold">{allocatedCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span>Available Assets</span>
                <span className="text-slate-850 dark:text-white">{availableCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-850">
                <span>Maintenance</span>
                <span className="text-slate-850 dark:text-white">{maintenanceCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Retired Assets</span>
                <span className="text-slate-855 dark:text-white">{retiredCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Recent Allocations */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Recent Allocations</h3>
            </div>
            <CardContent className="p-4 space-y-3">
              {allocations.slice(0, 3).map(alc => (
                <div key={alc.id} className="flex items-start gap-2.5 text-xs py-1.5 border-b last:border-b-0 dark:border-slate-850">
                  <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                    {alc.allocatedTo.split(' ').map(n => n[0]).join('')}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{alc.allocatedTo}</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">{alc.assetName} ({alc.assetTag})</p>
                    <p className="text-[9px] text-slate-450">{alc.allocationDate}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Filter Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Filter Allocation Registry
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee Name</label>
                  <select
                    value={filterValues.Employee_Name}
                    onChange={(e) => setFilterValues({ ...filterValues, Employee_Name: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
                  >
                    <option value="">All Employees</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <Input
                    placeholder="Enter department"
                    value={filterValues.Department}
                    onChange={(e) => setFilterValues({ ...filterValues, Department: e.target.value })}
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction Type</label>
                  <select
                    value={filterValues.Transaction_Type}
                    onChange={(e) => setFilterValues({ ...filterValues, Transaction_Type: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 cursor-pointer"
                  >
                    <option value="">All Types</option>
                    <option value="ALLOCATE">ALLOCATE</option>
                    <option value="RETURN">RETURN</option>
                  </select>
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
