'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Settings,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  CouponItem,
  fetchCoupons,
  deleteCoupon
} from '@/service/api/coupons/api';
import { CouponFormDialog } from '@/components/coupons/CouponFormDialog';

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}-${day}-${year}`;
    }
  } catch {}
  return dateStr.split('T')[0];
}

function getCouponTypeLabel(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'PERCENTAGE':
      return '% Off';
    case 'FLAT':
      return 'Flat Off';
    case 'BUY_GET':
      return 'Buy X Get Y';
    default:
      return type || 'Discount';
  }
}

export default function CouponsManagementPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load coupons from backend
  const loadCoupons = useCallback(
    async (currentPage = page, searchTerm = search, type = selectedType, status = selectedStatus) => {
      setLoading(true);
      try {
        const res = await fetchCoupons({
          page: currentPage,
          search: searchTerm,
          type: type === 'ALL' ? undefined : type,
          status: status === 'ALL' ? undefined : status
        });
        setCoupons(res.coupons || []);
        setTotalCount(res.totalCount ?? (res.coupons?.length || 0));
      } catch (err: any) {
        console.error('Failed to load coupons:', err);
        toast.error('Failed to fetch coupons from server');
      } finally {
        setLoading(false);
      }
    },
    [page, search, selectedType, selectedStatus]
  );

  useEffect(() => {
    loadCoupons(page, search, selectedType, selectedStatus);
  }, [page, selectedType, selectedStatus]);

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadCoupons(1, search, selectedType, selectedStatus);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Client-side filtering to guarantee exact & immediate match across all states
  const displayedCoupons = useMemo(() => {
    return coupons.filter((item) => {
      if (selectedType !== 'ALL' && item.Counpon_Type?.toUpperCase() !== selectedType.toUpperCase()) {
        return false;
      }
      if (selectedStatus !== 'ALL' && item.Status?.toUpperCase() !== selectedStatus.toUpperCase()) {
        return false;
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = (item.Counpon_Code || '').toLowerCase().includes(q);
        const matchDesc = (item.Description || item.Counpon_Description || '').toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [coupons, selectedType, selectedStatus, search]);

  const displayedTotal =
    selectedType === 'ALL' && selectedStatus === 'ALL' && !search.trim()
      ? totalCount
      : displayedCoupons.length;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied code: ${code}`);
  };

  const handleCreate = () => {
    setSelectedCoupon(null);
    setDialogOpen(true);
  };

  const handleEdit = (c: CouponItem) => {
    setSelectedCoupon(c);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      toast.success('Coupon deleted successfully');
      setDeleteTarget(null);
      loadCoupons(page, search, selectedType, selectedStatus);
    } catch (err: any) {
      console.error('Delete coupon error:', err);
      toast.error('Failed to delete coupon');
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns matching oldretailproject Coupons.jsx
  const [columns, setColumns] = useState<ColumnConfig<CouponItem>[]>([
    {
      key: 'Counpon_Code',
      header: 'Coupon Code',
      sortable: true,
      draggable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {row.Counpon_Code}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyCode(row.Counpon_Code);
              }}
              className="text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          {(row.Description || row.Counpon_Description) && (
            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
              {row.Description || row.Counpon_Description}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'Counpon_Type',
      header: 'Type',
      sortable: true,
      draggable: true,
      width: 120,
      render: (row) => (
        <Badge variant="outline" className="text-xs font-medium">
          {getCouponTypeLabel(row.Counpon_Type)}
        </Badge>
      )
    },
    {
      key: 'Discount_Value',
      header: 'Discount',
      sortable: true,
      draggable: true,
      width: 130,
      render: (row) => (
        <div>
          <div className="text-xs font-bold text-emerald-600 dark:text-blue-400">
            {row.Counpon_Type === 'PERCENTAGE'
              ? `${row.Discount_Value}% OFF`
              : `₹${Number(row.Discount_Value || 0).toLocaleString()} OFF`}
          </div>
          {row.Max_Discount && Number(row.Max_Discount) > 0 && (
            <div className="text-[10px] text-slate-400">
              Max: ₹{Number(row.Max_Discount).toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'Min_Order_Value',
      header: 'Min Order',
      sortable: true,
      draggable: true,
      width: 120,
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.Min_Order_Value && Number(row.Min_Order_Value) > 0
            ? `₹${Number(row.Min_Order_Value).toLocaleString()}`
            : 'No Min'}
        </span>
      )
    },
    {
      key: 'Usage',
      header: 'Usage',
      sortable: false,
      draggable: true,
      width: 130,
      render: (row) => {
        const used = Number(row.Used_Count || 0);
        const limit = row.Usage_Limit ? Number(row.Usage_Limit) : null;
        const percent = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
        return (
          <div className="w-24 space-y-1">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {used} <span className="text-slate-400 font-normal">/ {limit || '∞'}</span>
            </div>
            {limit ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'Valid_Period',
      header: 'Validity',
      sortable: true,
      draggable: true,
      width: 150,
      render: (row) => (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <div>From: {formatDisplayDate(row.Valid_From)}</div>
          <div>To: {formatDisplayDate(row.Valid_To)}</div>
        </div>
      )
    },
    {
      key: 'Status',
      header: 'Status',
      sortable: true,
      draggable: true,
      width: 110,
      render: (row) => {
        const st = (row.Status || 'ACTIVE').toUpperCase();
        const color =
          st === 'ACTIVE'
            ? 'bg-emerald-500 text-white'
            : st === 'EXPIRED'
            ? 'bg-slate-500 text-white'
            : 'bg-amber-500 text-white';
        return <Badge className={`text-[10px] ${color}`}>{row.Status || 'Active'}</Badge>;
      }
    }
  ]);

  // 3-dot dropdown menu action cell matching other modules
  const tableActions = (row: CouponItem) => (
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
            <Pencil className="h-4 w-4 text-[#7ac6a4]" /> Edit Coupon
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => copyCode(row.Counpon_Code)}
          >
            <Copy className="h-4 w-4 text-blue-600" /> Copy Code
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4 text-rose-600" /> Delete Coupon
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Coupon Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Create and manage discount coupons for your customers
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Control Bar: Type, Status, Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Coupon Type Select */}
          <div className="w-40">
            <Select
              value={selectedType}
              onValueChange={(val) => {
                const nextType = val || 'ALL';
                setSelectedType(nextType);
                setPage(1);
                loadCoupons(1, search, nextType, selectedStatus);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="FLAT">Flat Discount</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                <SelectItem value="BUY_GET">Buy X Get Y</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="w-36">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                const nextStatus = val || 'ALL';
                setSelectedStatus(nextStatus);
                setPage(1);
                loadCoupons(1, search, selectedType, nextStatus);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-800 dark:text-slate-200">{displayedTotal}</span> coupons
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or description..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* ReusableTable with the required column header styling */}
      <ReusableTable<CouponItem>
        columns={columns}
        setColumns={setColumns}
        data={displayedCoupons}
        actions={tableActions}
        actionsHeader={<Settings className="h-4 w-4 mx-auto text-slate-400" />}
        showGear={false}
        loading={loading}
        page={page}
        totalRecords={displayedTotal}
        pageSize={10}
        onChangePage={(p) => setPage(p)}
        rowKey="id"
        className="w-full"
      />

      {/* Create / Edit Form Modal */}
      <CouponFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={selectedCoupon}
        onSuccess={() => loadCoupons(page, search, selectedType, selectedStatus)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Coupon
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete coupon{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    "{deleteTarget?.Counpon_Code}"
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
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
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
