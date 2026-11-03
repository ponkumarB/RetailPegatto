'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Search,
  Filter,
  RotateCcw,
  Plus,
  BarChart2,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  OfferItem,
  fetchOffersList,
  deleteOfferRecord,
  fetchBanks,
  fetchOfferTypes
} from '@/service/api/offers/api';
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog';
import { EditOfferDialog } from '@/components/offers/EditOfferDialog';
import { AnalyticsDialog } from '@/components/offers/AnalyticsDialog';
import { toast } from 'sonner';

const TYPE_CONFIG_MAP: Record<string, { label: string; color: string }> = {
  percentage: { label: 'Percentage', color: '#4CAF50' },
  fixed: { label: 'Fixed Amount', color: '#2196F3' },
  bogo: { label: 'BOGO', color: '#FF9800' },
  shipping: { label: 'Free Shipping', color: '#9C27B0' },
  bank: { label: 'Bank Offer', color: '#E91E63' }
};

const DEFAULT_BANK_OPTIONS = [
  { value: '', label: 'All Banks' },
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'State Bank of India', label: 'State Bank of India' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
  { value: 'Yes Bank', label: 'Yes Bank' },
  { value: 'American Express', label: 'American Express' }
];

const DEFAULT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'shipping', label: 'Free Shipping' },
  { value: 'bank', label: 'Bank Offer' }
];

const CARD_TYPE_OPTIONS = [
  { value: '', label: 'All Cards' },
  { value: 'Credit', label: 'Credit Card' },
  { value: 'Debit', label: 'Debit Card' },
  { value: 'Both', label: 'Both' }
];

export default function OffersManagementPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Status tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0); // 0: All, 1: Active, 2: Scheduled, 3: Expired, 4: Draft

  // Popover filter state matching existing system
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [bankFilter, setBankFilter] = useState<string>('');
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('');
  const [showBankOffersOnly, setShowBankOffersOnly] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openAnalyticsDialog, setOpenAnalyticsDialog] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);

  // Dynamic API lookups for filters
  const [bankOptions, setBankOptions] = useState<Array<{ value: string; label: string }>>(DEFAULT_BANK_OPTIONS);
  const [typeOptions, setTypeOptions] = useState<Array<{ value: string; label: string }>>(DEFAULT_TYPE_OPTIONS);

  useEffect(() => {
    Promise.all([fetchBanks(), fetchOfferTypes()])
      .then(([banks, types]) => {
        if (banks && banks.length > 0) {
          setBankOptions([
            { value: '', label: 'All Banks' },
            ...banks.map((b: any) => {
              const name = b.Bank_Name || b.name || b.code || '';
              return { value: name, label: name };
            })
          ]);
        }
        if (types && types.length > 0) {
          setTypeOptions([
            { value: '', label: 'All Types' },
            ...types.map((t: any) => ({
              value: t.value || t.code || t.name || '',
              label: t.label || t.name || t.value || ''
            }))
          ]);
        }
      })
      .catch((e) => console.warn('Could not load filter lookups from API:', e));
  }, []);

  const getStatusFromTab = useCallback(() => {
    switch (tabValue) {
      case 1:
        return 'Active';
      case 2:
        return 'Scheduled';
      case 3:
        return 'Expired';
      case 4:
        return 'Draft';
      default:
        return '';
    }
  }, [tabValue]);

  // Load offers from API / storage
  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeStatus = statusFilter || getStatusFromTab();
      const res = await fetchOffersList({
        page,
        search: searchQuery,
        type: typeFilter || undefined,
        status: activeStatus || undefined,
        bank: bankFilter || undefined,
        cardType: cardTypeFilter || undefined,
        showBankOnly: showBankOffersOnly,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      setOffers(res.results);
      setTotalCount(res.count);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, typeFilter, statusFilter, bankFilter, cardTypeFilter, showBankOffersOnly, fromDate, toDate, getStatusFromTab]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter) count++;
    if (statusFilter && !getStatusFromTab()) count++;
    if (bankFilter) count++;
    if (cardTypeFilter) count++;
    if (showBankOffersOnly) count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [typeFilter, statusFilter, bankFilter, cardTypeFilter, showBankOffersOnly, fromDate, toDate, getStatusFromTab]);

  const handleClearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setBankFilter('');
    setCardTypeFilter('');
    setShowBankOffersOnly(false);
    setFromDate('');
    setToDate('');
    setFilterOpen(false);
    setPage(1);
    toast.info('All filters cleared');
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterOpen(false);
    setPage(1);
    toast.success('Filters applied');
  };

  const handleTabChange = (index: number) => {
    setTabValue(index);
    setPage(1);
    setStatusFilter('');
  };

  const handleEdit = (row: OfferItem) => {
    setSelectedOffer(row);
    setOpenEditDialog(true);
  };

  const handleDelete = async (row: OfferItem) => {
    if (window.confirm(`Are you sure you want to delete offer "${row.Offer_Name || row.name}"?`)) {
      try {
        await deleteOfferRecord(row.id);
        toast.success(`Offer "${row.Offer_Name || row.name}" deleted successfully`);
        loadOffers();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete offer');
      }
    }
  };

  // Helper date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper offer type chip
  const getOfferTypeChip = (type?: string) => {
    const key = (type || '').toLowerCase();
    const config = TYPE_CONFIG_MAP[key] || { label: type || 'Standard', color: '#64748B' };
    return (
      <span
        className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-colors select-none"
        style={{ borderColor: config.color, color: config.color }}
      >
        {config.label}
      </span>
    );
  };

  // Helper status chip
  const getStatusChip = (status?: string) => {
    let styles = 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    if (status === 'Active') {
      styles = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-blue-950/40 dark:text-emerald-300 dark:border-emerald-800';
    } else if (status === 'Scheduled') {
      styles = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    } else if (status === 'Expired') {
      styles = 'bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400';
    } else if (status === 'Draft') {
      styles = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold select-none ${styles}`}>
        {status || 'Draft'}
      </span>
    );
  };

  // Helper discount value rendering matching existing system
  const renderDiscountValue = (row: OfferItem) => {
    const offerType = (row.Offer_Type || row.type || '').toLowerCase();
    const discountType = (row.Discount_Type || row.discount_type || '').toLowerCase();
    const discountValue = Number(row.Offer_Value || row.discount_value || row.Discount_Value || 0);

    if (offerType === 'bank') {
      if (discountType === 'cashback') {
        return (
          <span className="font-bold text-[#E91E63] text-xs">
            ₹{discountValue.toLocaleString()} Cashback
          </span>
        );
      } else if (discountType === 'emi') {
        return (
          <span className="font-bold text-[#E91E63] text-xs">
            No Cost EMI
          </span>
        );
      } else if (discountType === 'instant') {
        return (
          <span className="font-bold text-[#E91E63] text-xs">
            {discountValue}% Instant
          </span>
        );
      }
      return (
        <span className="font-bold text-[#E91E63] text-xs">
          {discountValue}% OFF
        </span>
      );
    }

    if (discountType === 'percentage' || offerType === 'percentage') {
      return (
        <span className="font-bold text-blue-600 text-xs">
          {discountValue}% OFF
        </span>
      );
    }
    if (discountType === 'fixed' || offerType === 'fixed') {
      return (
        <span className="font-bold text-blue-600 text-xs">
          ₹{discountValue.toLocaleString()} OFF
        </span>
      );
    }
    if (discountType === 'bogo' || offerType === 'bogo') {
      return (
        <span className="font-bold text-blue-600 text-xs">
          Buy One Get One
        </span>
      );
    }
    if (discountType === 'shipping' || offerType === 'shipping') {
      return (
        <span className="font-bold text-blue-600 text-xs">
          Free Shipping
        </span>
      );
    }
    return <span className="text-slate-400">—</span>;
  };

  // Columns definition matching existing system OffersManagement.jsx
  const columns = useMemo<ColumnConfig<OfferItem>[]>(
    () => [
      {
        key: 'Offer_Name',
        header: 'Offer Name',
        sortable: true,
        width: 220,
        render: (row) => (
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {row.Offer_Name || row.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Code: {row.Offer_Code || row.code}
            </div>
          </div>
        )
      },
      {
        key: 'Offer_Type',
        header: 'Type',
        sortable: true,
        width: 120,
        render: (row) => getOfferTypeChip(row.Offer_Type || row.type)
      },
      {
        key: 'Bank_Details',
        header: 'Bank Details',
        width: 170,
        render: (row) => {
          if (row.Offer_Type !== 'bank') return <span className="text-slate-400">—</span>;
          const bank = row.Bank_Offer_Id && row.Bank_Offer_Id[0];
          const cardLabel =
            bank?.Card_Type === 'Credit'
              ? 'Credit Card'
              : bank?.Card_Type === 'Debit'
              ? 'Debit Card'
              : bank?.Card_Type || 'All Cards';

          return (
            <div>
              <div className="font-bold text-[#E91E63] text-xs">
                {bank?.Bank_Name || 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {cardLabel}
              </div>
            </div>
          );
        }
      },
      {
        key: 'Discount_Value',
        header: 'Discount',
        sortable: true,
        width: 130,
        render: (row) => renderDiscountValue(row)
      },
      {
        key: 'Min_Purchase',
        header: 'Min Purchase',
        width: 110,
        render: (row) => {
          const minPurchase = Number(row.Min_Purchase || row.min_purchase || 0);
          return minPurchase > 0 ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              ₹{minPurchase.toLocaleString()}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          );
        }
      },
      {
        key: 'Start_Date',
        header: 'Valid From',
        sortable: true,
        width: 110,
        render: (row) => (
          <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {formatDate(row.Start_Date || row.start_date)}
          </span>
        )
      },
      {
        key: 'End_Date',
        header: 'Valid To',
        sortable: true,
        width: 110,
        render: (row) => (
          <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {formatDate(row.End_Date || row.end_date)}
          </span>
        )
      },
      {
        key: 'Status',
        header: 'Status',
        sortable: true,
        width: 100,
        render: (row) => getStatusChip(row.Status || row.status)
      },
      {
        key: 'Usage_Count',
        header: 'Uses',
        sortable: true,
        width: 100,
        render: (row) => {
          const usageCount = Number(row.Usage_Count || row.usage_count || 0);
          const usageLimit = row.Usage_Limit || row.usage_limit;
          return (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {usageCount.toLocaleString()}
              {usageLimit ? ` / ${Number(usageLimit).toLocaleString()}` : ''}
            </span>
          );
        }
      },
      {
        key: 'applicableItems',
        header: 'Applicable To',
        width: 180,
        render: (row) => {
          const prods = row.Applicable_Products || row.applicable_products || [];
          if (prods.length === 0) {
            return <span className="text-xs text-slate-500">All Products</span>;
          }
          return (
            <div className="flex items-center gap-1 flex-wrap">
              {prods.slice(0, 2).map((p: any, i: number) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[100px] truncate"
                  title={p.name || p.Product_Name}
                >
                  {p.name || p.Product_Name}
                </span>
              ))}
              {prods.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  +{prods.length - 2}
                </span>
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  // 3-dot action button with DropdownMenu matching existing design
  const tableActions = (row: OfferItem) => (
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
        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
            Offer Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => handleEdit(row)}
          >
            <Edit2 className="h-4 w-4 text-[#7ac6a4]" /> Edit Offer
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
            onClick={() => handleDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-rose-600" /> Delete Offer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto text-left">
      {/* 1. Top Card: Header & Analytics button matching JumboContentLayoutMain header */}
      <Card className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                Offer Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create and manage promotional offers, discounts, and special deals
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={() => setOpenAnalyticsDialog(true)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <BarChart2 className="h-4 w-4 text-blue-600" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 2. Second Card: Search Bar, Filter Button with Popover, Total Count, and Create Button */}
      <Card className="border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Filter popover button and Total Count */}
          <div className="flex items-center gap-3 w-full md:w-auto relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total: {totalCount}
            </span>

            {/* Filter Popover */}
            {filterOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Filters
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
                    title="Reset Filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleApplyFilters} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Offer Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {typeOptions.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Expired">Expired</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">From Date</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">To Date</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="showBankOffersOnly"
                      checked={showBankOffersOnly}
                      onChange={(e) => setShowBankOffersOnly(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="showBankOffersOnly" className="text-slate-700 dark:text-slate-300 font-medium select-none cursor-pointer">
                      Show Bank Offers Only
                    </label>
                  </div>

                  {showBankOffersOnly && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-400 font-medium">Select Bank</label>
                        <select
                          value={bankFilter}
                          onChange={(e) => setBankFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          {bankOptions.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-400 font-medium">Card Type</label>
                        <select
                          value={cardTypeFilter}
                          onChange={(e) => setCardTypeFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          {CARD_TYPE_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Middle: Search Field */}
          <div className="w-full md:flex-1 md:max-w-md relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code or bank..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Right: Create Button */}
          <div className="w-full md:w-auto flex justify-end">
            <button
              onClick={() => setOpenCreateDialog(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Offer</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Status Tabs matching existing system */}
      <Card className="border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 bg-white dark:bg-slate-900 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max text-xs">
          {['All Offers', 'Active', 'Scheduled', 'Expired', 'Draft'].map((label, idx) => (
            <button
              key={label}
              onClick={() => handleTabChange(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                tabValue === idx
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Table Container using project standard ReusableTable */}
      <Card className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        <CardContent className="p-0">
          <ReusableTable<OfferItem>
            columns={columns}
            data={offers}
            actions={tableActions}
            actionsHeader={
              <div className="flex items-center justify-center">
                <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            }
            showGear={false}
            selectable={false}
            rowKey="id"
            borderless={true}
            page={page}
            totalRecords={totalCount}
            pageSize={rowsPerPage}
            onChangePage={setPage}
            loading={isLoading}
            onRowClick={(row) => handleEdit(row)}
          />
        </CardContent>
      </Card>

      {/* 5. Dialogs */}
      <CreateOfferDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSuccess={() => {
          loadOffers();
        }}
      />

      <EditOfferDialog
        open={openEditDialog}
        offer={selectedOffer}
        onClose={() => {
          setOpenEditDialog(false);
          setSelectedOffer(null);
        }}
        onSuccess={() => {
          loadOffers();
        }}
      />

      <AnalyticsDialog
        open={openAnalyticsDialog}
        onClose={() => setOpenAnalyticsDialog(false)}
      />
    </div>
  );
}
