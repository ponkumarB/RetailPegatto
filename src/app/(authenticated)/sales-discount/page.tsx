'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Filter,
  RotateCcw,
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Settings
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { toast } from 'sonner';
import {
  DiscountItem,
  FilterDiscountPayload,
  fetchDiscounts,
  deleteDiscount
} from '@/service/api/discount/api';
import { DiscountDialog } from '@/components/discount/DiscountDialog';

// Formatter to match screenshot MM-DD-YYYY (e.g., 02-01-2026)
function formatDiscountDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      // parts: [YYYY, MM, DD] -> MM-DD-YYYY
      return `${parts[1]}-${parts[2]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}-${day}-${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDiscountId, setFilterDiscountId] = useState('');
  const [filterDiscountName, setFilterDiscountName] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterDiscountPayload | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountItem | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data function
  const loadDiscounts = useCallback(
    async (currentPage = page, searchTerm = search, filterObj = activeFilter) => {
      setLoading(true);
      try {
        const res = await fetchDiscounts({
          page: currentPage,
          search: searchTerm,
          filterData: filterObj || undefined
        });
        setDiscounts(res.results || []);
        setCount(res.count || 0);
      } catch (err: any) {
        console.error('Failed to load discounts:', err);
        toast.error('Failed to fetch discount setup list');
      } finally {
        setLoading(false);
      }
    },
    [page, search, activeFilter]
  );

  useEffect(() => {
    loadDiscounts(page, search, activeFilter);
  }, [page, activeFilter, loadDiscounts]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadDiscounts(1, search, activeFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Apply filter
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const filterData: FilterDiscountPayload = {
      Discount_Id: filterDiscountId.trim(),
      Discount_Name: filterDiscountName.trim(),
      fromdate: filterFromDate,
      todate: filterToDate
    };
    setActiveFilter(filterData);
    setPage(1);
    setIsFilterOpen(false);
  };

  // Reset filter
  const handleResetFilter = () => {
    setFilterDiscountId('');
    setFilterDiscountName('');
    setFilterFromDate('');
    setFilterToDate('');
    setActiveFilter(null);
    setPage(1);
    setIsFilterOpen(false);
  };

  // Open Create Dialog
  const handleCreate = () => {
    setSelectedDiscount(null);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleEdit = (item: DiscountItem) => {
    setSelectedDiscount(item);
    setDialogOpen(true);
  };

  // Open Delete confirmation
  const handleDeleteClick = (item: DiscountItem) => {
    setDiscountToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDiscount(discountToDelete.id);
      toast.success('Discount deleted successfully');
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
      loadDiscounts(page, search, activeFilter);
    } catch (err: any) {
      console.error('Delete discount error:', err);
      toast.error('Failed to delete discount');
    } finally {
      setIsDeleting(false);
    }
  };

  // Define Table Columns matching oldretailproject:
  // Discount ID | Discount Name | Discount Type | Discount % | Start Date | End Date | Actions
  const [columns, setColumns] = useState<ColumnConfig<DiscountItem>[]>([
    {
      key: 'Discount_Id',
      header: 'Discount ID',
      sortable: true,
      draggable: true,
      width: 140,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.Discount_Id || `DCS${row.id}`}
        </span>
      )
    },
    {
      key: 'Discount_Name',
      header: 'Discount Name',
      sortable: true,
      draggable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
          {row.Discount_Name}
        </span>
      )
    },
    {
      key: 'Discount_Type',
      header: 'Discount Type',
      sortable: true,
      draggable: true,
      width: 130,
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.Discount_Type || 'Flat'}
        </span>
      )
    },
    {
      key: 'Discount_Percentage',
      header: 'Discount %',
      sortable: true,
      draggable: true,
      width: 110,
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.Discount_Percentage !== undefined ? `${row.Discount_Percentage}` : '0'}
        </span>
      )
    },
    {
      key: 'Start_Date',
      header: 'Start Date',
      sortable: true,
      draggable: true,
      width: 130,
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {formatDiscountDate(row.Start_Date)}
        </span>
      )
    },
    {
      key: 'End_Date',
      header: 'End Date',
      sortable: true,
      draggable: true,
      width: 130,
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {formatDiscountDate(row.End_Date)}
        </span>
      )
    }
  ]);

  // 3-dot dropdown menu action cell matching other modules (Price Book, Coupons, Offers Management)
  const tableActions = (row: DiscountItem) => (
    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <button
            type="button"
            className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Actions"
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
          </button>
        } />
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
            onClick={() => handleEdit(row)}
          >
            <Pencil className="h-4 w-4 text-[#7ac6a4]" /> Edit Rule
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 className="h-4 w-4 text-rose-600" /> Delete Rule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Top Title matching old project */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Setting Up Discount
        </h1>
      </div>

      {/* Toolbar: Filter + Count on Left | Search + Create on Right */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Filter popover button & count */}
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger render={
              <button
                type="button"
                className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
                  activeFilter
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Filter Discounts"
              >
                <Filter className="h-4 w-4 text-blue-600" />
              </button>
            } />
            <PopoverContent
              align="start"
              className="w-80 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                  title="Reset Filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleApplyFilter} className="space-y-3 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Discount Id
                  </label>
                  <Input
                    value={filterDiscountId}
                    onChange={(e) => setFilterDiscountId(e.target.value)}
                    placeholder="Discount Id"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Discount Name
                  </label>
                  <Input
                    value={filterDiscountName}
                    onChange={(e) => setFilterDiscountName(e.target.value)}
                    placeholder="Discount Name"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
            ( <span className="font-semibold text-slate-800 dark:text-slate-200">{count}</span> ) Discount Pack
          </span>
        </div>

        {/* Right: Search box & Create + button */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-9 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            className="h-9 px-4 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
          >
            Create +
          </Button>
        </div>
      </div>

      {/* ReusableTable with the required column header styling */}
      <ReusableTable<DiscountItem>
        columns={columns}
        setColumns={setColumns}
        data={discounts}
        actions={tableActions}
        actionsHeader={<Settings className="h-4 w-4 mx-auto text-slate-400" />}
        showGear={false}
        loading={loading}
        page={page}
        totalRecords={count}
        pageSize={10}
        onChangePage={(newPage) => setPage(newPage)}
        rowKey="id"
        className="w-full"
      />

      {/* Add / Edit Setup Discount Modal */}
      <DiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discount={selectedDiscount}
        onSuccess={() => loadDiscounts(page, search, activeFilter)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Discount Setup
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    "{discountToDelete?.Discount_Name}"
                  </span>
                  ? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-5 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
