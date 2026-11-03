'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { searchAssetRequests, filterAssetRequests } from '@/service/api/Assets/api';
import {
  Building,
  Calendar,
  Clock,
  Plus,
  Search,
  Download,
  Laptop,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  MapPin,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Briefcase,
  Volume2,
  HardDrive,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Mail,
  Phone,
  FileText,
  Check,
  XCircle,
  Loader2,
  X,
  Filter,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetRequest } from '@/types/asset';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AssetsRequestPage() {
  const router = useRouter();
  const {
    requests,
    requestsCount,
    requestsPage,
    fetchRequestsPage,
    updateRequest,
    deleteRequest,
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    Location: '',
    Asset_Type: '',
    Priority: '',
    Status: '',
    Reporting_Manager: '',
    Department: '',
    Requested_By: '',
    Created_By: '',
    fromdate: '',
    todate: ''
  });
  const [activeFilters, setActiveFilters] = useState<any>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Locations list for dropdown filter
  const locationsList = React.useMemo(() => {
    const locs = new Set<string>();
    const defaults = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune'];
    defaults.forEach(l => locs.add(l));
    requests.forEach(r => {
      if (r.location) {
        locs.add(r.location.trim());
      }
    });
    return Array.from(locs).sort();
  }, [requests]);

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
    searchAssetRequests(debouncedSearch)
      .then((res) => {
        if (!cancelled) {
          const list: any[] = Array.isArray(res) ? res : (res as any)?.results ?? [];
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
      const res = await filterAssetRequests(payload);
      const list: any[] = Array.isArray(res) ? res : (res as any)?.results ?? [];
      setSearchResults(list);
    } catch (err) {
      console.error('Filter asset requests failed', err);
      setSearchResults([]);
      toast.error('Failed to apply filters');
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    const cleared = {
      Location: '',
      Asset_Type: '',
      Priority: '',
      Status: '',
      Reporting_Manager: '',
      Department: '',
      Requested_By: '',
      Created_By: '',
      fromdate: '',
      todate: ''
    };
    setFilterValues(cleared);
    setActiveFilters(null);
    setSearchResults([]);
  };

  const isSearchOrFilterMode = debouncedSearch.length > 0 || (activeFilters !== null && Object.keys(activeFilters).length > 0);

  // Map API search result to AssetRequest display shape
  const mappedSearchResults = React.useMemo<AssetRequest[]>(() => {
    return searchResults.map(item => ({
      id: item.id?.toString() ?? '',
      requestedBy: item.Requested_By || '',
      department: item.Department || '',
      email: item.Email || '',
      phone: item.Phone || '',
      reportingManager: item.Reporting_Manager || '',
      costCenter: '',
      location: item.Location || '',
      assetType: item.Asset_Type || 'Laptop',
      brand: item.Preferred_Brand || '',
      model: item.Preferred_Model || '',
      configuration: item.Configuration || '',
      quantity: parseInt(item.Quantity || '1') || 1,
      priority: (item.Priority as any) || 'Medium',
      requiredFor: item.Purpose || '',
      requiredDate: item.Required_Date || '',
      purpose: item.Purpose || '',
      status: (item.Status as any) || 'Pending',
      requestDate: item.Created_Date || '',
      allocatedUserRadio: 'Yes',
      expectedDuration: item.Expected_Duration || 'More than 1 year'
    }));
  }, [searchResults]);

  // Stats
  const totalCount = requestsCount;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const issuedCount = requests.filter(r => r.status === 'Issued').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const totalPages = Math.ceil(requestsCount / 10) || 1;
  const handlePrevPage = () => {
    if (requestsPage > 1) {
      fetchRequestsPage(requestsPage - 1);
    }
  };
  const handleNextPage = () => {
    if (requestsPage < totalPages) {
      fetchRequestsPage(requestsPage + 1);
    }
  };

  const pendingPercent = ((pendingCount / (totalCount || 1)) * 100).toFixed(0);
  const approvedPercent = ((approvedCount / (totalCount || 1)) * 100).toFixed(0);
  const issuedPercent = ((issuedCount / (totalCount || 1)) * 100).toFixed(0);
  const rejectedPercent = ((rejectedCount / (totalCount || 1)) * 100).toFixed(0);

  // Pie chart data
  const pieData = [
    { name: 'Pending', value: pendingCount, color: '#f59e0b', percent: pendingPercent },
    { name: 'Approved', value: approvedCount, color: '#10b981', percent: approvedPercent },
    { name: 'Issued', value: issuedCount, color: '#3b82f6', percent: issuedPercent },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444', percent: rejectedPercent }
  ];

  const filteredRequests = isSearchOrFilterMode ? mappedSearchResults : requests;

  const getAssetIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('laptop') || cat.includes('computer')) return <Laptop className="h-4 w-4 text-blue-500" />;
    if (cat.includes('monitor') || cat.includes('screen')) return <Laptop className="h-4 w-4 text-purple-500" />;
    if (cat.includes('headset') || cat.includes('audio')) return <Volume2 className="h-4 w-4 text-cyan-500" />;
    if (cat.includes('keyboard') || cat.includes('input')) return <Laptop className="h-4 w-4 text-amber-500" />;
    if (cat.includes('storage') || cat.includes('hdd') || cat.includes('drive')) return <HardDrive className="h-4 w-4 text-rose-500" />;
    return <Briefcase className="h-4 w-4 text-slate-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
            Approved
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            Issued
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Pending
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  const handleDelete = (id: string) => {
    toast.warning('Are you sure you want to delete this request?', {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteRequest(id);
        }
      }
    });
  };

  const renderActions = (req: AssetRequest) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] text-slate-450">
            <MoreVertical className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Request Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {req.status === 'Pending' && (
            <>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-750"
                onClick={() => router.push(`/assets/request/${req.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit Request
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => updateRequest(req.id, { status: 'Approved' })}
              >
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Approve Request
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700"
                onClick={() => updateRequest(req.id, { status: 'Rejected' })}
              >
                <XCircle className="h-3.5 w-3.5 text-rose-500" /> Reject Request
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {req.status === 'Approved' && (
            <>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700"
                onClick={() => updateRequest(req.id, { status: 'Issued' })}
              >
                <Laptop className="h-3.5 w-3.5 text-blue-500" /> Issue Asset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-semibold"
            onClick={() => router.push(`/assets/request/${req.id}`)}
          >
            <User className="h-3.5 w-3.5 text-slate-500" /> View Summary
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-955/20"
            onClick={() => handleDelete(req.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete Request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const columns = React.useMemo<ColumnConfig<AssetRequest>[]>(() => [
    {
      key: 'id',
      header: 'Request ID',
      sortable: true,
      className: 'text-blue-650 font-bold hover:underline cursor-pointer',
      render: (req) => (
        <span onClick={() => router.push(`/assets/request/${req.id}`)}>
          {req.id}
        </span>
      )
    },
    {
      key: 'assetType',
      header: 'Assets',
      sortable: true,
      render: (req) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-[5px] border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-center shrink-0">
            {getAssetIcon(req.assetType)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{req.assetType}</p>
            <p className="text-[9px] text-slate-400 font-semibold">{req.brand} {req.model}</p>
          </div>
        </div>
      )
    },
    {
      key: 'requestedBy',
      header: 'Requested For',
      sortable: true,
      render: (req) => (
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs">
            {req.requestedBy.split(' ').map(n => n[0]).join('')}
          </span>
          <span className="text-xs text-slate-750 dark:text-slate-300 font-semibold">{req.requestedBy}</span>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      className: 'text-slate-500',
    },
    {
      key: 'requestDate',
      header: 'Request Date',
      sortable: true,
      className: 'text-slate-455 font-medium',
    },
    {
      key: 'requiredDate',
      header: 'Required Date',
      sortable: true,
      className: 'text-slate-455 font-medium',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (req) => getStatusBadge(req.status)
    }
  ], []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer">Asset Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Assets Request</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Assets Request</h1>
          <p className="text-xs text-slate-450 mt-1">Request assets you need to perform your work efficiently.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/assets/request/create')}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* KPI Stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

        {/* KPI 1 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalCount}</h3>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">All Time</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{pendingCount}</h3>
              <p className="text-[9px] text-amber-600 mt-1 font-bold">{pendingPercent}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{approvedCount}</h3>
              <p className="text-[9px] text-emerald-600 mt-1 font-bold">{approvedPercent}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-550 shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issued</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{issuedCount}</h3>
              <p className="text-[9px] text-blue-600 mt-1 font-bold">{issuedPercent}% of total</p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-[5px] bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-650 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{rejectedCount}</h3>
              <p className="text-[9px] text-rose-600 mt-1 font-bold">{rejectedPercent}% of total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Request Grid Block */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Side: Requests Board Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Table Toolbar Card */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Request Registry</h3>
                {isSearchOrFilterMode && (
                  <span className="text-xs text-slate-400 font-semibold">
                    {isSearching ? 'Searching...' : `${filteredRequests.length} result${filteredRequests.length !== 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-72">
                  {isSearching ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  )}
                  <Input 
                    placeholder="Search requests..." 
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
 
          {/* Requests Table */}
          <ReusableTable
            columns={columns}
            data={filteredRequests}
            initialPageSize={10}
            actions={renderActions}
            enableSelection={true}
            page={isSearchOrFilterMode ? undefined : requestsPage}
            totalRecords={isSearchOrFilterMode ? undefined : requestsCount}
            onChangePage={isSearchOrFilterMode ? undefined : fetchRequestsPage}
            loading={isLoading || isSearching}
          />
        </div>

        {/* Right Side Column Panels */}
        <div className="space-y-6">

          {/* Card 1: Request Summary (Pie Chart) */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Request Summary</h3>
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

              {/* Legends list */}
              <div className="space-y-1.5 w-full pt-4 text-xs font-semibold text-slate-450">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-350">{entry.name}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-extrabold">{entry.value} ({entry.percent}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Quick Actions */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Quick Actions</h3>
            </div>
            <CardContent className="p-4.5 space-y-3 text-xs font-bold text-blue-600">
              <div className="hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => router.push('/assets/request/create')}>
                <Plus className="h-4 w-4" />
                New Request
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Need Help? */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Need Help?</h3>
            </div>
            <CardContent className="p-4.5 space-y-3.5 text-xs font-semibold text-slate-500">
              <p className="text-[11px] leading-relaxed">For any issues with asset requests, contact IT Support.</p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">support@crmfarmit.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>+91 80 1234 5678</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Guidelines */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Guidelines</h3>
            </div>
            <CardContent className="p-4.5 space-y-3 text-[11px] font-medium leading-relaxed text-slate-550 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>Raise a request for assets you need.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>Provide accurate details and justification.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>Requests are reviewed by your reporting manager.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>You will be notified once the request is approved or issued.</span>
              </div>
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
                Filter Request Registry
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
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</label>
                  <select
                    value={filterValues.Location}
                    onChange={(e) => setFilterValues({ ...filterValues, Location: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
                  >
                    <option value="">All Locations</option>
                    {locationsList.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Type</label>
                  <Input
                    placeholder="Enter type (e.g. Laptop)"
                    value={filterValues.Asset_Type}
                    onChange={(e) => setFilterValues({ ...filterValues, Asset_Type: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</label>
                  <select
                    value={filterValues.Priority}
                    onChange={(e) => setFilterValues({ ...filterValues, Priority: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={filterValues.Status}
                    onChange={(e) => setFilterValues({ ...filterValues, Status: e.target.value })}
                    className="flex h-8.5 w-full rounded-[5px] border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Issued">Issued</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager</label>
                  <Input
                    placeholder="Manager name"
                    value={filterValues.Reporting_Manager}
                    onChange={(e) => setFilterValues({ ...filterValues, Reporting_Manager: e.target.value })}
                    className="h-8.5 rounded-[5px] text-xs mt-1 bg-white dark:bg-slate-900"
                  />
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requested By</label>
                  <Input
                    placeholder="Requester name"
                    value={filterValues.Requested_By}
                    onChange={(e) => setFilterValues({ ...filterValues, Requested_By: e.target.value })}
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
