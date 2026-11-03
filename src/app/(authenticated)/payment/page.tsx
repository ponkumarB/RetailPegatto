'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { fetchAccountFullList } from '@/service/api/Company/api';
import { PaymentRecord } from '@/types/payment';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Download,
  Search,
  SlidersHorizontal,
  MoreVertical,
  RotateCcw,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { payments, paymentsCount, loadPayments, deletePayment, isLoading } = usePaymentStore();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Customers dropdown list
  const [customerNamesList, setCustomerNamesList] = useState<string[]>(['All']);

  // Modal Dialog Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempCustomerNameFilter, setTempCustomerNameFilter] = useState('All');
  const [tempPaymentModeFilter, setTempPaymentModeFilter] = useState('All');
  const [tempFromDateFilter, setTempFromDateFilter] = useState('');
  const [tempToDateFilter, setTempToDateFilter] = useState('');

  // Delete & View Detail Modals
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  // Load initial payments data
  useEffect(() => {
    loadPayments(currentPage);
  }, [loadPayments, currentPage]);

  // Load customer dropdown names
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetchAccountFullList();
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const names = list
          .map((a: any) => a.Organization_Name || a.Company_Name || a.companyName || a.Account_Name || '')
          .filter((n: string) => Boolean(n.trim()));
        const uniqueNames = Array.from(new Set(names)) as string[];
        setCustomerNamesList(['All', ...uniqueNames]);
      } catch (err) {
        console.error('Failed to load accounts for filter dropdown', err);
      }
    };
    loadAccounts();
  }, []);

  const handleOpenFilterModal = () => {
    setTempCustomerNameFilter(customerNameFilter);
    setTempPaymentModeFilter(paymentModeFilter);
    setTempFromDateFilter(fromDateFilter);
    setTempToDateFilter(toDateFilter);
    setIsFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setCustomerNameFilter(tempCustomerNameFilter);
    setPaymentModeFilter(tempPaymentModeFilter);
    setFromDateFilter(tempFromDateFilter);
    setToDateFilter(tempToDateFilter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setTempCustomerNameFilter('All');
    setTempPaymentModeFilter('All');
    setTempFromDateFilter('');
    setTempToDateFilter('');

    setCustomerNameFilter('All');
    setPaymentModeFilter('All');
    setFromDateFilter('');
    setToDateFilter('');
    setSearchTerm('');
    setCurrentPage(1);
    toast.success('Filters reset to default.');
  };

  const isFilterActive = useMemo(() => {
    return (
      customerNameFilter !== 'All' ||
      paymentModeFilter !== 'All' ||
      fromDateFilter !== '' ||
      toDateFilter !== ''
    );
  }, [customerNameFilter, paymentModeFilter, fromDateFilter, toDateFilter]);

  // Currency formatter
  const formatCurrency = (amount?: number) => {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Client-side filtering logic
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Search term matching
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (item.Payment_Id || '').toLowerCase().includes(term) ||
        (item.Customer_Name || '').toLowerCase().includes(term) ||
        (item.Invoice_No || '').toLowerCase().includes(term) ||
        (item.Transaction_No || '').toLowerCase().includes(term) ||
        (item.Mode_of_Payment || '').toLowerCase().includes(term);

      // Customer Filter
      const matchesCustomer =
        customerNameFilter === 'All' ||
        (item.Customer_Name || '').toLowerCase() === customerNameFilter.toLowerCase();

      // Payment Mode Filter
      const matchesMode =
        paymentModeFilter === 'All' ||
        (item.Mode_of_Payment || '').toLowerCase() === paymentModeFilter.toLowerCase();

      // Date Range Filter
      let matchesFromDate = true;
      let matchesToDate = true;
      if (fromDateFilter && item.Payment_Date) {
        matchesFromDate = new Date(item.Payment_Date) >= new Date(fromDateFilter);
      }
      if (toDateFilter && item.Payment_Date) {
        matchesToDate = new Date(item.Payment_Date) <= new Date(toDateFilter);
      }

      return matchesSearch && matchesCustomer && matchesMode && matchesFromDate && matchesToDate;
    });
  }, [payments, searchTerm, customerNameFilter, paymentModeFilter, fromDateFilter, toDateFilter]);

  // KPI Calculations
  const totalReceivedAmount = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (Number(p.Paid_Amount) || 0), 0);
  }, [filteredPayments]);

  const cardPaymentsCount = useMemo(() => {
    return filteredPayments.filter(
      (p) => (p.Mode_of_Payment || '').toLowerCase().includes('card') || (p.Mode_of_Payment || '').toLowerCase().includes('online')
    ).length;
  }, [filteredPayments]);

  // Delete Payment Action
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deletePayment(deleteTargetId);
      toast.success('Payment record deleted successfully.');
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to delete payment record.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('No payment records to export.');
      return;
    }
    const headers = ['Payment ID', 'Customer Name', 'Invoice No', 'Payment Date', 'Paid Amount (INR)', 'Payment Mode', 'Transaction No'];
    const rows = filteredPayments.map((p) => [
      p.Payment_Id || '',
      `"${p.Customer_Name || ''}"`,
      p.Invoice_No || '',
      p.Payment_Date || '',
      p.Paid_Amount || 0,
      `"${p.Mode_of_Payment || ''}"`,
      `"${p.Transaction_No || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Payments_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payment records exported successfully!');
  };

  // ReusableTable Columns Definition
  const columns: ColumnConfig<PaymentRecord>[] = useMemo(
    () => [
      {
        key: 'Payment_Id',
        header: 'Payment ID',
        sortable: true,
        render: (p) => (
          <span
            onClick={() => setViewingPayment(p)}
            className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-400" />
            {p.Payment_Id || `PAY-${p.id}`}
          </span>
        ),
      },
      {
        key: 'Customer_Name',
        header: 'Customer Name',
        sortable: true,
        render: (p) => (
          <span className="font-semibold text-slate-900 dark:text-white">
            {p.Customer_Name || '—'}
          </span>
        ),
      },
      {
        key: 'Invoice_No',
        header: 'Invoice No',
        sortable: true,
        render: (p) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {p.Invoice_No || '—'}
          </span>
        ),
      },
      {
        key: 'Payment_Date',
        header: 'Payment Date',
        sortable: true,
        render: (p) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {p.Payment_Date || '—'}
          </span>
        ),
      },
      {
        key: 'Paid_Amount',
        header: 'Paid Amount',
        sortable: true,
        className: 'text-right font-mono font-bold text-xs',
        render: (p) => (
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
            {formatCurrency(p.Paid_Amount)}
          </span>
        ),
      },
      {
        key: 'Mode_of_Payment',
        header: 'Payment Mode',
        sortable: true,
        render: (p) => {
          const mode = p.Mode_of_Payment || 'Cash';
          const isCard = mode.toLowerCase().includes('card');
          const isOnline = mode.toLowerCase().includes('online') || mode.toLowerCase().includes('upi');
          const isBank = mode.toLowerCase().includes('bank');

          return (
            <Badge
              variant="outline"
              className={`font-bold text-[10px] px-2.5 py-0.5 rounded-lg border-0 ${
                isCard
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                  : isOnline
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : isBank
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}
            >
              {mode}
            </Badge>
          );
        },
      },
      {
        key: 'Transaction_No',
        header: 'Transaction No',
        sortable: true,
        render: (p) => (
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {p.Transaction_No || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        className: 'text-right pr-4',
        render: (p) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer ml-auto"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800">
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold"
                onClick={() => setViewingPayment(p)}
              >
                <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs font-semibold"
                onClick={() => router.push(`/payment/create?edit=${p.id || p.Payment_Id}`)}
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" /> Edit Record
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400 font-semibold text-xs"
                onClick={() => setDeleteTargetId(p.id || p.Payment_Id || null)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  return (
    <div
      className="space-y-6 text-left"
      style={{ '--theme-primary': primaryColor } as React.CSSProperties}
    >
      {/* Header & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Payment Records
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400 font-medium">
            Manage customer payments, track transactions, and view payment history.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-200 dark:border-slate-800 font-bold rounded-xl gap-2 h-9 text-xs cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>

          <Button
            onClick={() => router.push('/payment/create')}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-bold rounded-xl gap-2 h-9 text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> Create Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Payments
              </span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {filteredPayments.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Received
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(totalReceivedAmount)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Card / Digital Mode
              </span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {cardPaymentsCount}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Records API
              </span>
              <div className="text-xl font-extrabold text-slate-850 dark:text-white mt-0.5">
                {paymentsCount || filteredPayments.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search payment ID, customer, transaction..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFilterModal}
                className={`font-semibold text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                  isFilterActive
                    ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                {isFilterActive && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </Button>

              {isFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2 text-xs font-bold text-rose-500 hover:text-rose-600 rounded-xl"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Reusable Data Table */}
      <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
        <CardContent className="p-0">
          <ReusableTable<PaymentRecord>
            columns={columns}
            data={filteredPayments}
            loading={isLoading}
            rowKey="id"
            borderless={true}
            title="No payment records found."
            page={currentPage}
            totalRecords={filteredPayments.length}
            onChangePage={(page) => setCurrentPage(page)}
            pageSize={10}
            showGear={true}
          />
        </CardContent>
      </Card>

      {/* Filter Side Panel Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-800 pb-4 text-left">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} />
              Filter Payments
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1 text-left">
              Specify criteria to filter payment transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            {/* Filter: Customer Name */}
            <div className="space-y-1.5 text-left sm:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Customer Name
              </label>
              <Select
                value={tempCustomerNameFilter}
                onValueChange={(val) => setTempCustomerNameFilter(val || 'All')}
              >
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                  {customerNamesList.map((name) => (
                    <SelectItem key={name} value={name} className="cursor-pointer">
                      {name === 'All' ? 'All Customers' : name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter: Payment Mode */}
            <div className="space-y-1.5 text-left sm:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Payment Mode
              </label>
              <Select
                value={tempPaymentModeFilter}
                onValueChange={(val) => setTempPaymentModeFilter(val || 'All')}
              >
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <SelectItem value="All" className="cursor-pointer">All Payment Modes</SelectItem>
                  <SelectItem value="Cash" className="cursor-pointer">Cash</SelectItem>
                  <SelectItem value="Bank Transfer" className="cursor-pointer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card" className="cursor-pointer">Credit Card</SelectItem>
                  <SelectItem value="Credit Cards" className="cursor-pointer">Credit Cards</SelectItem>
                  <SelectItem value="Cheque" className="cursor-pointer">Cheque</SelectItem>
                  <SelectItem value="UPI" className="cursor-pointer">UPI / Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter: Payment Date (From) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={tempFromDateFilter}
                  onChange={(e) => setTempFromDateFilter(e.target.value)}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
                />
              </div>
            </div>

            {/* Filter: Payment Date (To) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={tempToDateFilter}
                  onChange={(e) => setTempToDateFilter(e.target.value)}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t dark:border-slate-800 pt-4 gap-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFilterOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleApplyFilters}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-5 text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all"
              >
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white font-bold">
              Delete Payment Record
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this payment record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-9 text-xs font-bold rounded-xl cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Modal Dialog */}
      <Dialog open={!!viewingPayment} onOpenChange={() => setViewingPayment(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-800 pb-4">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
              Payment Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Metadata for payment record {viewingPayment?.Payment_Id || viewingPayment?.id}
            </DialogDescription>
          </DialogHeader>

          {viewingPayment && (
            <div className="space-y-3 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Payment ID</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingPayment.Payment_Id || viewingPayment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Customer Name</span>
                <span className="font-bold text-primary" style={{ color: primaryColor }}>{viewingPayment.Customer_Name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Account ID</span>
                <span>{viewingPayment.Account_Id || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Invoice Number</span>
                <span>{viewingPayment.Invoice_No || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Payment Date</span>
                <span>{viewingPayment.Payment_Date || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Paid Amount</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(viewingPayment.Paid_Amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Mode of Payment</span>
                <span>{viewingPayment.Mode_of_Payment || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-800">
                <span className="text-slate-400">Transaction No</span>
                <span className="font-mono text-xs">{viewingPayment.Transaction_No || '—'}</span>
              </div>
            </div>
          )}

          <DialogFooter className="border-t dark:border-slate-800 pt-4">
            <Button
              onClick={() => setViewingPayment(null)}
              className="h-9 px-5 text-xs font-bold rounded-xl cursor-pointer"
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
