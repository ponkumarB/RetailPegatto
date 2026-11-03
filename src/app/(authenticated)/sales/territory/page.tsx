'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTerritoryStore, Territory } from '@/store/useTerritoryStore';
import { fetchTerritoryFullList } from '@/service/api/Territory/api';
import {
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  Map,
  ShieldCheck,
  ShieldAlert,
  FolderTree,
  MoreHorizontal,
  Edit2,
  AlertTriangle,
  MapPin,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FilterPopover, FilterField } from '@/components/ui/FilterPopover';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

export default function TerritoriesPage() {
  const router = useRouter();
  const {
    canCreateTerritory,
    canEditTerritory,
    canDeleteTerritory,
    canViewTerritoryOverview,
    canExportTerritory,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTerritoryOverview) {
      toast.error('You do not have permission to view Territories.');
      router.push('/');
    }
  }, [canViewTerritoryOverview, isLoaded, router]);

  const { territories, territoriesCount, deleteTerritory, loadTerritories, isLoading } = useTerritoryStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Dynamic filter options fetched on mount
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [allStates, setAllStates] = useState<string[]>([]);

  // Fetch unique regions, countries, and states on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetchTerritoryFullList();
        const list = Array.isArray(res) ? res : (res?.results || []);
        
        const regionsSet = new Set<string>();
        const countriesSet = new Set<string>();
        const statesSet = new Set<string>();

        list.forEach((item: any) => {
          if (item.Region) {
            regionsSet.add(item.Region.trim());
          }
          if (item.Country) {
            countriesSet.add(item.Country.trim());
          }
          if (item.State) {
            statesSet.add(item.State.trim());
          }
        });

        setAllRegions(Array.from(regionsSet).filter(Boolean).sort());
        setAllCountries(Array.from(countriesSet).filter(Boolean).sort());
        setAllStates(Array.from(statesSet).filter(Boolean).sort());
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);
  
  // Table Page State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const serverPageSize = 10;

  const isServerSide = !searchQuery && 
    regionFilter === 'All' && 
    countryFilter === 'All' && 
    stateFilter === 'All' && 
    statusFilter === 'All' && 
    typeFilter === 'All';

  useEffect(() => {
    if (isServerSide) {
      loadTerritories(undefined, currentPage);
    } else {
      loadTerritories(searchQuery || undefined);
    }
  }, [loadTerritories, currentPage, searchQuery, regionFilter, countryFilter, stateFilter, statusFilter, typeFilter, isServerSide]);

  // Dialog State
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [viewingTerritory, setViewingTerritory] = useState<Territory | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = isServerSide ? territoriesCount : territories.length;
    const active = territories.filter(t => t.isActive).length;
    const inactive = total - active;
    const parents = new Set(territories.map(t => t.parentTerritory).filter(Boolean)).size;
    return { total, active, inactive, parents };
  }, [territories, territoriesCount, isServerSide]);

  // Filtered Territories
  const filteredTerritories = useMemo(() => {
    if (isServerSide) return territories;
    return territories.filter((t) => {
      const matchesSearch =
        (t.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.parentTerritory || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = regionFilter === 'All' || t.region === regionFilter;
      const matchesCountry = countryFilter === 'All' || t.country === countryFilter;
      const matchesState = stateFilter === 'All' || t.state === stateFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && t.isActive) ||
        (statusFilter === 'Inactive' && !t.isActive);
      const matchesType = typeFilter === 'All' || t.type === typeFilter;

      return matchesSearch && matchesRegion && matchesCountry && matchesState && matchesStatus && matchesType;
    });
  }, [territories, searchQuery, regionFilter, countryFilter, stateFilter, statusFilter, typeFilter, isServerSide]);

  // Pagination
  const paginatedTerritories = useMemo(() => {
    if (isServerSide) return territories;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTerritories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTerritories, currentPage, isServerSide]);

  const displayTotal = isServerSide ? territoriesCount : filteredTerritories.length;
  const totalPages = isServerSide ? (Math.ceil(territoriesCount / serverPageSize) || 1) : (Math.ceil(filteredTerritories.length / itemsPerPage) || 1);

  // ReusableTable Columns Configuration
  const columns: ColumnConfig<Territory>[] = useMemo(() => [
    {
      key: 'code',
      header: 'Territory Code',
      sortable: true,
      render: (t) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {t.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Territory Name',
      sortable: true,
      render: (t) => <span className="text-slate-900 dark:text-white font-semibold">{t.name}</span>,
    },
    {
      key: 'type',
      header: 'Territory Type',
      sortable: true,
      render: (t) => <span className="text-slate-505 dark:text-slate-400 font-medium text-xs">{t.type}</span>,
    },
    {
      key: 'parentTerritory',
      header: 'Parent Territory',
      sortable: true,
      render: (t) => <span className="text-slate-505 dark:text-slate-400 font-medium text-xs">{t.parentTerritory || '—'}</span>,
    },
    {
      key: 'region',
      header: 'Region/Country',
      sortable: true,
      render: (t) => <span className="text-slate-550 dark:text-slate-400 font-medium text-xs">{t.region} / {t.country}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <Badge variant="outline" className={t.isActive 
          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-955/20 dark:text-emerald-400 border-emerald-100'
          : 'text-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-slate-400 border-slate-200'
        }>
          {t.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      sortable: true,
      render: (t) => <span className="text-slate-505 dark:text-slate-455 text-xs">{t.createdBy}</span>,
    },
  ], [canEditTerritory]);

  // ReusableTable Actions Configuration
  const renderActions = (t: Territory) => (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-455 hover:text-slate-705 dark:hover:text-slate-200 rounded-lg cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-[5px]">
          <DropdownMenuLabel className="text-slate-450 font-bold text-[9px] uppercase tracking-wider">Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setViewingTerritory(t)}
            className="cursor-pointer text-xs font-semibold gap-2"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
          </DropdownMenuItem>

          {canEditTerritory && (
            <DropdownMenuItem
              onClick={() => router.push(`/sales/territory/create?edit=${t.code}`)}
              className="cursor-pointer text-xs font-semibold gap-2"
            >
              <Edit2 className="h-3.5 w-3.5 text-slate-500" /> Edit Territory
            </DropdownMenuItem>
          )}

          {canDeleteTerritory && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteCode(t.code)}
                className="gap-2 cursor-pointer text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Handle Export
  const handleExport = () => {
    toast.info('Exporting territories list...');
    const headers = ['Territory Code', 'Territory Name', 'Type', 'Parent Territory', 'Region', 'Country', 'State', 'Status', 'Created By', 'Created On'];
    const rows = filteredTerritories.map(t => [
      t.code,
      t.name,
      t.type,
      t.parentTerritory,
      t.region,
      t.country,
      t.state,
      t.isActive ? 'Active' : 'Inactive',
      t.createdBy,
      t.createdOn
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Territories_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Territories exported successfully.');
  };

  // Delete Action
  const confirmDelete = async () => {
    if (deleteCode) {
      try {
        await deleteTerritory(deleteCode);
        toast.success(`Territory has been deleted successfully.`);
        setDeleteCode(null);
        if (paginatedTerritories.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete territory.');
      }
    }
  };

  // Filter Popover Fields Setup
  const filterFields: FilterField[] = [
    {
      id: 'region',
      label: 'Region',
      type: 'select',
      value: regionFilter,
      onChange: (val) => {
        setRegionFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: 'All Regions', value: 'All' },
        ...allRegions.map((r) => ({ label: r, value: r })),
      ],
    },
    {
      id: 'country',
      label: 'Country',
      type: 'select',
      value: countryFilter,
      onChange: (val) => {
        setCountryFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: 'All Countries', value: 'All' },
        ...allCountries.map((c) => ({ label: c, value: c })),
      ],
    },
    {
      id: 'state',
      label: 'State',
      type: 'select',
      value: stateFilter,
      onChange: (val) => {
        setStateFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: 'All States', value: 'All' },
        ...allStates.map((s) => ({ label: s, value: s })),
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
    {
      id: 'type',
      label: 'Territory Type',
      type: 'select',
      value: typeFilter,
      onChange: (val) => {
        setTypeFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: 'All Types', value: 'All' },
        { label: 'Geographical', value: 'Geographical' },
      ],
    },
  ];

  const clearAllFilters = () => {
    setRegionFilter('All');
    setCountryFilter('All');
    setStateFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
    setSearchQuery('');
    setCurrentPage(1);
    toast.success('Filters cleared.');
  };

  if (isLoaded && !canViewTerritoryOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Territories</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territories</h1>
          <p className="text-xs text-slate-450 mt-1">Manage boundaries, regions, and structured hierarchy configurations for sales targets.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {canExportTerritory && (
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355"
            >
              <Download className="h-3.5 w-3.5" />
              Export List
            </Button>
          )}

          {canCreateTerritory && (
            <Link href="/sales/territory/create" className="inline-flex items-center justify-center h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm border border-transparent">
              <Plus className="h-4 w-4" />
              New Territory
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Territories */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Territories</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl">
            <Map className="h-5 w-5 text-blue-505" />
          </div>
        </div>

        {/* Active Territories */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-2xl">
            <ShieldCheck className="h-5 w-5 text-emerald-655" />
          </div>
        </div>

        {/* Inactive Territories */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.inactive}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-955/30 rounded-2xl">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
        </div>

        {/* Parent Territories */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parent Nodes</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.parents}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-955/30 rounded-2xl">
            <FolderTree className="h-5 w-5 text-purple-505" />
          </div>
        </div>
      </div>

      {/* Table & Toolbar Container */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between p-4 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Territories registry</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-505">
              {filteredTerritories.length} records found
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search code, name, parent..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-8.5 bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
              />
            </div>

            {/* Filter Popover */}
            <FilterPopover
              fields={filterFields}
              onClear={clearAllFilters}
              triggerLabel="Filter"
            />
          </div>
        </div>

        {/* Reusable Data Table */}
        <div className="p-1">
          <ReusableTable<Territory>
            columns={columns}
            data={isServerSide ? territories : filteredTerritories}
            actions={renderActions}
            loading={isLoading}
            rowKey="code"
            borderless={true}
            title="Territories Registry"
            page={currentPage}
            totalRecords={displayTotal}
            onChangePage={(newPage) => setCurrentPage(newPage)}
            pageSize={isServerSide ? serverPageSize : itemsPerPage}
            showGear={true}
          />
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteCode} onOpenChange={(open) => { if (!open) setDeleteCode(null); }}>
        <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Delete Territory
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete territory <strong>{deleteCode}</strong>? This action cannot be undone and will remove it from CRM listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-605 hover:bg-rose-700 text-white text-xs font-bold"
              onClick={confirmDelete}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingTerritory} onOpenChange={(open) => { if (!open) setViewingTerritory(null); }}>
        <DialogContent className="max-w-2xl dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader className="border-b dark:border-slate-800 pb-3">
            <DialogTitle className="text-lg font-bold dark:text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-500" />
              Territory Details: {viewingTerritory?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Complete metadata and target matching criteria details.
            </DialogDescription>
          </DialogHeader>

          {viewingTerritory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 text-xs font-semibold">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Territory Code</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{viewingTerritory.code}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Territory Name</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{viewingTerritory.name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Territory Type</h4>
                  <p className="text-slate-700 dark:text-slate-350 mt-0.5">{viewingTerritory.type}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Parent Territory</h4>
                  <p className="text-slate-700 dark:text-slate-350 mt-0.5">{viewingTerritory.parentTerritory || '—'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-normal leading-relaxed mt-0.5">{viewingTerritory.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Geographic Info</h4>
                  <div className="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <p><span className="text-slate-400">Region:</span> {viewingTerritory.region}</p>
                    <p><span className="text-slate-400">Country:</span> {viewingTerritory.country}</p>
                    <p><span className="text-slate-400">State:</span> {viewingTerritory.state || '—'}</p>
                    <p><span className="text-slate-400">Timezone:</span> {viewingTerritory.timezone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Criteria Details</h4>
                  <div className="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <p><span className="text-slate-400">Pin Codes:</span> {viewingTerritory.pinCodes || 'All'}</p>
                    <p><span className="text-slate-400">Cities:</span> {viewingTerritory.cities || 'All'}</p>
                    <p><span className="text-slate-400">Industry Segment:</span> {viewingTerritory.industrySegment || 'All'}</p>
                    <p><span className="text-slate-400">Revenue Range:</span> {viewingTerritory.revenueRange || 'All'}</p>
                    <p><span className="text-slate-400">Product Line:</span> {viewingTerritory.productLine || 'All'}</p>
                    <p><span className="text-slate-400">Customer Type:</span> {viewingTerritory.customerType || 'All'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Meta Details</h4>
                  <p className="mt-1 text-slate-500"><span className="text-slate-450">Created By:</span> {viewingTerritory.createdBy}</p>
                  <p className="text-slate-505"><span className="text-slate-455">Created On:</span> {viewingTerritory.createdOn}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t dark:border-slate-800 pt-3">
            <DialogClose render={<Button variant="outline" className="text-xs" />}>
              Close Details
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
