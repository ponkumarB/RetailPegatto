'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePosInvoiceStore, PosInvoice } from '@/store/usePosInvoiceStore';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Calendar,
  Phone,
  Truck,
  Check,
  Clock,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  GripVertical,
  ArrowUpDown,
  MoreHorizontal,
  SquarePen,
  Trash2,
  FileText,
  CheckSquare,
  Mail,
  PhoneCall,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'invoiceNumber' | 'customerName' | 'storeName' | 'items' | 'discountAmount' | 'totalAmount' | 'status';

export default function PosInvoicesListPage() {
  const router = useRouter();
  const { invoices, loadInvoices, isLoading, deleteInvoice } = usePosInvoiceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<PosInvoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  React.useEffect(() => {
    loadInvoices({ search: searchTerm, status: statusFilter, customer: customerFilter });
  }, [loadInvoices, searchTerm, statusFilter, customerFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Extract unique customers
  const customerOptions = useMemo(() => {
    const list = Array.from(new Set(invoices.map((inv) => inv.customerName).filter(Boolean)));
    return list;
  }, [invoices]);

  // Metrics matching exact UI
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    const totalSales = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === 'Un Paid' || inv.status === 'Pending')
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const completedCount = invoices.filter((inv) => inv.status === 'Paid').length;

    return { totalCount, totalSales, pendingAmount, completedCount };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !searchTerm ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerPhone.includes(searchTerm) ||
        (inv.storeName && inv.storeName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        inv.status === statusFilter ||
        (statusFilter === 'Un Paid' && (inv.status === 'Un Paid' || inv.status === 'Pending'));

      const matchCustomer =
        customerFilter === 'ALL' || inv.customerName === customerFilter;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [invoices, searchTerm, statusFilter, customerFilter]);

  const sortedInvoices = useMemo(() => {
    if (!sortField) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (sortField === 'items') {
        aVal = a.items?.length || 0;
        bVal = b.items?.length || 0;
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal || '').localeCompare(bVal || '')
          : (bVal || '').localeCompare(aVal || '');
      }
      return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });
  }, [filteredInvoices, sortField, sortOrder]);

  const handleViewReceipt = (invoice: PosInvoice) => {
    setSelectedInvoice(invoice);
    setIsReceiptOpen(true);
  };

  const handleEdit = (invoice: PosInvoice) => {
    if (invoice.status?.toLowerCase() === 'paid') {
      toast.warning('Paid bills cannot be edited.');
      return;
    }
    const idParam = invoice.id || invoice.invoiceNumber;
    router.push(`/pos-invoices/billing?id=${encodeURIComponent(idParam)}&invoiceNumber=${encodeURIComponent(invoice.invoiceNumber)}`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Bill No.',
      'Date',
      'Customer',
      'Phone',
      'Store',
      'Items Count',
      'Discount',
      'Net Amount',
      'Payment Method',
      'Status',
      'Delivery'
    ];
    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      i.date,
      `"${i.customerName}"`,
      i.customerPhone,
      `"${i.storeName || '-'}"`,
      i.items.length,
      i.discountAmount.toFixed(2),
      i.totalAmount.toFixed(2),
      i.paymentMethod,
      i.status,
      `"${i.delivery || '-'}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `POS_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Invoices exported successfully');
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 w-full max-w-[1600px] mx-auto select-none">
      {/* 1. Header with Avatar, Title, and + New Invoice button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#0F3B2C] flex items-center justify-center text-white shadow-sm shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              POS Invoices
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all sales invoices
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push('/pos-invoices/billing')}
          className="bg-[#1d7042] hover:bg-[#155d36] text-white font-semibold text-xs px-3.5 py-2 h-8.5 rounded-md shadow-sm gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* 2. Top Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Total Invoices */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-[90px]">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoices
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.totalCount}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl shrink-0">
            <Receipt className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-500" />
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-[90px]">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ₹{metrics.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl shrink-0">
            <DollarSign className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-600" />
          </div>
        </div>

        {/* Card 3: Pending Amount */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-[90px]">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Amount
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ₹{metrics.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl shrink-0">
            <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-500" />
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-[90px]">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.completedCount}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 3. Invoices List Table & Filter Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 shadow-none">
        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by bill no, customer or mobile..."
              className="h-9 pl-9 text-xs border-slate-200 dark:border-slate-700 rounded-md placeholder:text-slate-400"
            />
          </div>

          {/* Status Select */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'ALL')}>
            <SelectTrigger className="h-9 text-xs w-36 border-slate-200 dark:border-slate-700 rounded-md">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Un Paid">Un Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Customer Select */}
          <Select value={customerFilter} onValueChange={(val) => setCustomerFilter(val || 'ALL')}>
            <SelectTrigger className="h-9 text-xs w-36 border-slate-200 dark:border-slate-700 rounded-md">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Customers</SelectItem>
              {customerOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Download Export Button */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              title="Export"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="border-0 hover:bg-transparent">
                {/* BILL NO. */}
                <TableHead
                  onClick={() => handleSort('invoiceNumber')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>BILL NO.</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'invoiceNumber' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* CUSTOMER */}
                <TableHead
                  onClick={() => handleSort('customerName')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CUSTOMER</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'customerName' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* STORE */}
                <TableHead
                  onClick={() => handleSort('storeName')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>STORE</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'storeName' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* ITEMS */}
                <TableHead
                  onClick={() => handleSort('items')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ITEMS</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'items' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* DISCOUNT */}
                <TableHead
                  onClick={() => handleSort('discountAmount')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>DISCOUNT</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'discountAmount' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* NET AMOUNT */}
                <TableHead
                  onClick={() => handleSort('totalAmount')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>NET AMOUNT</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'totalAmount' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* PAYMENT METHOD */}
                <TableHead className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>PAYMENT METHOD</span>
                  </div>
                </TableHead>

                {/* STATUS */}
                <TableHead
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>STATUS</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        sortField === 'status' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </TableHead>

                {/* DELIVERY */}
                <TableHead className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>DELIVERY</span>
                  </div>
                </TableHead>

                {/* ACTION */}
                <TableHead className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center min-w-[100px]">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80"
                >
                  {/* Bill No. */}
                  <TableCell className="py-3.5 px-4">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{inv.date}</span>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-3.5 px-4">
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {inv.customerName}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{inv.customerPhone}</span>
                    </div>
                  </TableCell>

                  {/* Store */}
                  <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                    {inv.storeName || 'Main Store'}
                  </TableCell>

                  {/* Items */}
                  <TableCell className="py-3.5 px-4 text-center">
                    <span className="inline-block rounded-full border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {inv.items.length} items
                    </span>
                  </TableCell>

                  {/* Discount */}
                  <TableCell className="py-3.5 px-4 text-center font-medium text-xs text-[#ef4444]">
                    ₹ {inv.discountAmount.toFixed(2)}
                  </TableCell>

                  {/* Net Amount */}
                  <TableCell className="py-3.5 px-4 text-center font-bold text-xs text-slate-900 dark:text-white">
                    ₹ {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  {/* Payment Method */}
                  <TableCell className="py-3.5 px-4 text-center">
                    <span className="inline-block rounded-full border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {inv.paymentMethod}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4 text-center text-xs font-semibold">
                    {inv.status === 'Paid' ? (
                      <span className="text-[#10b981]">Paid</span>
                    ) : (
                      <span className="text-[#ef4444]">Un Paid</span>
                    )}
                  </TableCell>

                  {/* Delivery */}
                  <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {inv.delivery !== 'Store Pickup' && <Truck className="w-3 h-3 text-slate-400" />}
                      <span>{inv.delivery || 'Store Pickup'}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button
                          type="button"
                          className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          title="POS Invoice Actions"
                        >
                          <MoreHorizontal className="h-4.5 w-4.5" />
                        </button>
                      } />
                      <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                        <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                          POS Invoice Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => handleViewReceipt(inv)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" /> View Receipt
                        </DropdownMenuItem>

                        {inv.status?.toLowerCase() !== 'paid' && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => handleEdit(inv)}
                          >
                            <SquarePen className="h-4 w-4 text-slate-500" /> Edit Invoice
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 py-1.5 rounded-lg"
                          onClick={() => toast.error(`Bill #${inv.invoiceNumber} deleted`)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" /> Delete POS Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {sortedInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-400 text-xs">
                    No POS invoices found matching the current criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
