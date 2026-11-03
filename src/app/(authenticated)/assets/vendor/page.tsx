'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { searchAssetVendors, filterAssetVendors } from '@/service/api/Assets/api';
import * as api from '@/service/api/Assets/api';
import { 
  Building2, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Coins, 
  Wrench, 
  X, 
  Trash2, 
  Edit, 
  Loader2,
  Filter,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import { toast } from 'sonner';

export default function AssetVendorPage() {
  const router = useRouter();
  const { 
    vendors, 
    vendorsCount, 
    vendorsPage, 
    fetchVendorsPage, 
    deleteVendor, 
    fetchInitialData, 
    isLoaded, 
    isLoading 
  } = useAssetStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);

  // Search API state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<api.AssetVendor[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    Contact_Person: '',
    Vendor_Name: '',
    Email: '',
    Mobile_Number: '',
    Address: '',
    Created_By: '',
    fromdate: '',
    todate: ''
  });
  const [activeFilters, setActiveFilters] = useState<any>(null);
  
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
    searchAssetVendors(debouncedSearch)
      .then((res) => {
        if (!cancelled) {
          const list: api.AssetVendor[] = Array.isArray(res) ? res : (res as any)?.results ?? [];
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
      const res = await filterAssetVendors(payload);
      const list: api.AssetVendor[] = Array.isArray(res) ? res : (res as any)?.results ?? [];
      setSearchResults(list);
    } catch (err) {
      console.error('Filter asset vendors failed', err);
      setSearchResults([]);
      toast.error('Failed to apply filters');
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    const cleared = {
      Contact_Person: '',
      Vendor_Name: '',
      Email: '',
      Mobile_Number: '',
      Address: '',
      Created_By: '',
      fromdate: '',
      todate: ''
    };
    setFilterValues(cleared);
    setActiveFilters(null);
    setSearchResults([]);
  };

  // stats
  const totalCount = vendorsCount;
  const activeCount = vendors.filter(v => v.Is_Active).length;
  const inactiveCount = totalCount - activeCount;

  // Determine list to show
  const isSearchOrFilterMode = debouncedSearch.length > 0 || (activeFilters !== null && Object.keys(activeFilters).length > 0);
  const displayList = isSearchOrFilterMode ? searchResults : vendors;

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.warning(`Are you sure you want to delete vendor "${name}"?`, {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteVendor(id.toString());
        }
      }
    });
  };

  const handleOpenCreateModal = () => {
    router.push('/assets/vendor/create');
  };

  const handleOpenEditModal = (vendor: api.AssetVendor, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/assets/vendor/${vendor.id}/edit`);
  };

  const columns = useMemo<ColumnConfig<api.AssetVendor>[]>(() => [
    {
      key: 'Vendor_Name',
      header: 'Vendor Name',
      sortable: true,
      render: (vendor) => (
        <div className="font-bold text-slate-800 dark:text-slate-200">
          {vendor.Vendor_Name}
        </div>
      )
    },
    {
      key: 'Contact_Person',
      header: 'Contact Person',
      sortable: true,
      render: (vendor) => (
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          {vendor.Contact_Person || <span className="text-slate-400 font-medium italic">Not Specified</span>}
        </span>
      )
    },
    {
      key: 'Email',
      header: 'Contact Details',
      render: (vendor) => (
        <div className="space-y-0.5">
          {vendor.Email && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <Mail className="h-3 w-3 shrink-0 text-slate-400" />
              {vendor.Email}
            </p>
          )}
          {vendor.Mobile_Number && (
            <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-655 dark:text-slate-350">
              <Phone className="h-3 w-3 shrink-0 text-slate-400" />
              {vendor.Mobile_Number}
            </p>
          )}
          {!vendor.Email && !vendor.Mobile_Number && (
            <span className="text-slate-400 italic">No details</span>
          )}
        </div>
      )
    },
    {
      key: 'GST_Number',
      header: 'GST Number',
      render: (vendor) => (
        <span className="font-mono text-slate-600 dark:text-slate-400 uppercase">
          {vendor.GST_Number || '-'}
        </span>
      )
    },
    {
      key: 'Address',
      header: 'Address',
      render: (vendor) => (
        <span className="text-slate-500 max-w-[240px] truncate block" title={vendor.Address ?? undefined}>
          {vendor.Address || '-'}
        </span>
      )
    },
    {
      key: 'Is_Active',
      header: 'Status',
      sortable: true,
      render: (vendor) => vendor.Is_Active ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
          <Check className="h-2.5 w-2.5" /> Active
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border dark:border-slate-700">
          Inactive
        </span>
      )
    }
  ], []);

  const renderActions = (vendor: api.AssetVendor) => {
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] text-slate-450"
          onClick={(e) => handleOpenEditModal(vendor, e)}
          title="Edit Vendor"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-[5px] text-slate-450 hover:text-rose-500"
          onClick={(e) => handleDelete(vendor.id, vendor.Vendor_Name, e)}
          title="Delete Vendor"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
            <span className="text-slate-500 font-medium">Asset Vendors</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Asset Vendors</h1>
          <p className="text-xs text-slate-450 mt-1">Manage external vendors and suppliers who supply or maintain your organization's assets.</p>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* KPI stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* KPI 1 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Vendors</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalCount}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Registered Suppliers</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Vendors</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{activeCount}</h3>
              <p className="text-[9px] text-emerald-650 mt-1 font-bold">Currently Operational</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              <X className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive Vendors</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{inactiveCount}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Suspended or Dormant</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content table card */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Tabs/Toolbar */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Vendor Registry</h3>
            {isSearchOrFilterMode && (
              <span className="text-xs text-slate-400 font-semibold">
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              )}
              <Input 
                placeholder="Search vendors by name or contact..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8.5 pl-8.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 placeholder-slate-400 w-full bg-white dark:bg-slate-900 pr-8" 
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setSearchResults([]); }}
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
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                <Skeleton className="h-8 w-16 rounded shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ReusableTable
          columns={columns}
          data={displayList}
          initialPageSize={10}
          actions={renderActions}
          enableSelection={true}
          page={isSearchOrFilterMode ? undefined : vendorsPage}
          totalRecords={isSearchOrFilterMode ? undefined : vendorsCount}
          onChangePage={isSearchOrFilterMode ? undefined : fetchVendorsPage}
        />
      )}

      {/* Filter Dialog */}
      {isFilterDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Filter Vendor Registry
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor Name</label>
                  <Input
                    placeholder="Enter vendor name"
                    value={filterValues.Vendor_Name}
                    onChange={(e) => setFilterValues({ ...filterValues, Vendor_Name: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Person</label>
                  <Input
                    placeholder="Contact person name"
                    value={filterValues.Contact_Person}
                    onChange={(e) => setFilterValues({ ...filterValues, Contact_Person: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <Input
                    placeholder="Enter email"
                    type="email"
                    value={filterValues.Email}
                    onChange={(e) => setFilterValues({ ...filterValues, Email: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile Number</label>
                  <Input
                    placeholder="Enter mobile number"
                    value={filterValues.Mobile_Number}
                    onChange={(e) => setFilterValues({ ...filterValues, Mobile_Number: e.target.value })}
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
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</label>
                  <Input
                    placeholder="Enter address"
                    value={filterValues.Address}
                    onChange={(e) => setFilterValues({ ...filterValues, Address: e.target.value })}
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
