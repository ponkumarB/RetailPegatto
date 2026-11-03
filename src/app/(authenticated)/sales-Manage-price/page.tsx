'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  Settings,
  MoreHorizontal,
  RotateCcw,
  Store,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  ManagePriceItem,
  StoreOption,
  fetchManagePrices,
  deleteManagePrice,
  fetchStoresList
} from '@/service/api/manage-price/api';
import { ManagePriceDialog } from '@/components/manage-price/ManagePriceDialog';
import { toast } from 'sonner';

export default function ManagePricePage() {
  const [data, setData] = useState<ManagePriceItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Pagination
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Filter Popover state matching oldretailproject
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [bookIdFilter, setBookIdFilter] = useState<string>('');
  const [bookNameFilter, setBookNameFilter] = useState<string>('');
  const [storeFilter, setStoreFilter] = useState<string>('');
  const [fromDateFilter, setFromDateFilter] = useState<string>('');
  const [toDateFilter, setToDateFilter] = useState<string>('');

  // Stores for filter dropdown
  const [stores, setStores] = useState<StoreOption[]>([]);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedPriceBook, setSelectedPriceBook] = useState<ManagePriceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagePriceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch stores for filter dropdown
  useEffect(() => {
    fetchStoresList().then((res) => {
      if (res && res.length > 0) setStores(res);
    });
  }, []);

  // Fetch manage prices from API
  const loadManagePrices = useCallback(async () => {
    setLoading(true);
    try {
      const hasFilter =
        Boolean(bookIdFilter.trim()) ||
        Boolean(bookNameFilter.trim()) ||
        Boolean(storeFilter) ||
        Boolean(fromDateFilter) ||
        Boolean(toDateFilter);

      const res = await fetchManagePrices({
        page,
        search: search.trim() || undefined,
        filterData: hasFilter
          ? {
              Book_ID: bookIdFilter.trim() || undefined,
              Book_Name: bookNameFilter.trim() || undefined,
              storeId: storeFilter || undefined,
              fromdate: fromDateFilter || undefined,
              todate: toDateFilter || undefined
            }
          : undefined
      });

      setData(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err: any) {
      console.error('Failed to load manage prices:', err);
      toast.error('Failed to load price book data');
    } finally {
      setLoading(false);
    }
  }, [page, search, bookIdFilter, bookNameFilter, storeFilter, fromDateFilter, toDateFilter]);

  useEffect(() => {
    loadManagePrices();
  }, [loadManagePrices]);

  // Handle Search Input Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Reset filter
  const handleResetFilter = () => {
    setBookIdFilter('');
    setBookNameFilter('');
    setStoreFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setPage(1);
    setFilterOpen(false);
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilterOpen(false);
    loadManagePrices();
  };

  // Delete Price Book
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteManagePrice(deleteTarget.id);
      toast.success('Price Book deleted successfully');
      setDeleteTarget(null);
      loadManagePrices();
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete price book');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date helper matching DateFormatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Table Columns matching oldretailproject ManagePrice.js
  const columns = useMemo<ColumnConfig<ManagePriceItem>[]>(
    () => [
      {
        key: 'ManagePrice_Id',
        header: 'Book ID',
        sortable: true,
        width: 140,
        render: (row) => (
          <span className="font-mono font-semibold text-xs text-emerald-700 dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            {row.ManagePrice_Id || `MP-${row.id}`}
          </span>
        )
      },
      {
        key: 'Book_Name',
        header: 'Book Name',
        sortable: true,
        width: 220,
        render: (row) => (
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {row.Book_Name}
            </div>
            {row.ManagePrice_Details && row.ManagePrice_Details.length > 0 && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Layers className="h-3 w-3 text-slate-400" />
                {row.ManagePrice_Details.length} product(s) configured
              </div>
            )}
          </div>
        )
      },
      {
        key: 'PriceBook_Type',
        header: 'Price Type',
        sortable: true,
        width: 140,
        render: (row) => {
          const type = row.PriceBook_Type || 'List Price';
          const isSpecial = type.toLowerCase().includes('special');
          const isCity = type.toLowerCase().includes('city');

          return (
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2 py-0.5 ${
                isSpecial
                  ? 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800'
                  : isCity
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {type}
            </Badge>
          );
        }
      },
      {
        key: 'Start_Date',
        header: 'Start Date',
        sortable: true,
        width: 130,
        render: (row) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {formatDate(row.Start_Date)}
          </span>
        )
      },
      {
        key: 'End_Date',
        header: 'End Date',
        sortable: true,
        width: 130,
        render: (row) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {formatDate(row.End_Date)}
          </span>
        )
      },
      {
        key: 'Stores',
        header: 'Stores',
        width: 220,
        render: (row) => {
          const storeList = Array.isArray(row.Store_Id) ? row.Store_Id : [];
          if (storeList.length === 0) {
            return (
              <span className="text-xs text-slate-400">
                {row.Store_Names || 'All Stores'}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {storeList.slice(0, 2).map((s: any, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] rounded-md font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center gap-1 max-w-[140px] truncate"
                  title={s.Store_Name || s.name}
                >
                  <Store className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{s.Store_Name || s.name || `Store #${s.id}`}</span>
                </span>
              ))}
              {storeList.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  +{storeList.length - 2}
                </span>
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  // 3-dot dropdown menu action cell matching existing system
  const tableActions = (row: ManagePriceItem) => (
    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          title="Actions"
        >
          <MoreHorizontal className="h-4.5 w-4.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left"
        >
          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
            Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => {
              setSelectedPriceBook(row);
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-[#7ac6a4]" /> Edit Price Book
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4 text-rose-600" /> Delete Record
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Header matching oldretailproject Price Book Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-emerald-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Price Book Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage product selling prices, price lists, special discounts and store-wise pricing revisions.
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setSelectedPriceBook(null);
            setDialogOpen(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Create Price Book
        </Button>
      </div>

      {/* Control Toolbar: Filter Popover, Count, and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Filters</span>
              {(bookIdFilter || bookNameFilter || storeFilter || fromDateFilter || toDateFilter) && (
                <span className="h-2 w-2 rounded-full bg-blue-600 ml-0.5" />
              )}
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-80 sm:w-96 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-blue-600" /> Filter Price Books
                </span>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  title="Reset Filter"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleApplyFilter} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Book ID
                  </label>
                  <Input
                    value={bookIdFilter}
                    onChange={(e) => setBookIdFilter(e.target.value)}
                    placeholder="e.g. MP000000001"
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Book Name
                  </label>
                  <Input
                    value={bookNameFilter}
                    onChange={(e) => setBookNameFilter(e.target.value)}
                    placeholder="e.g. Standard Price"
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Store
                  </label>
                  <select
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    className="w-full h-8 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-2 mt-1 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Stores</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.Store_Name || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={fromDateFilter}
                      onChange={(e) => setFromDateFilter(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={toDateFilter}
                      onChange={(e) => setToDateFilter(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Apply Filter
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          {/* Live record count indicator matching oldretailproject: `({count}) Manage Price` */}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            (<strong className="text-slate-800 dark:text-slate-200 font-bold">{totalCount}</strong>) Manage Price
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search price books by ID, name or store..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <ReusableTable
          columns={columns}
          data={data}
          actions={tableActions}
          actionsHeader={<Settings className="h-4 w-4 mx-auto text-slate-400" />}
          page={page}
          totalRecords={totalCount}
          initialPageSize={10}
          onChangePage={(p) => setPage(p)}
          showGear={false}
          selectable={false}
        />
      </div>

      {/* Create / Edit Dialog */}
      <ManagePriceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        priceBook={selectedPriceBook}
        onSuccess={loadManagePrices}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> Delete Price Book
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-300 py-3">
            Are you sure you want to delete Price Book{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {deleteTarget?.Book_Name} ({deleteTarget?.ManagePrice_Id || deleteTarget?.id})
            </strong>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
