'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSalesOrderStore } from '@/store/useSalesOrderStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  Eye,
  Trash2,
  ChevronDown,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  RefreshCw,
  MoreHorizontal,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchSalesordercardsapiview,
  fetchUserSalesList,
  deleteUserSales,
  searchUserSales
} from '@/service/api/SalesOrder';
import { fetchAccountFullList } from '@/service/api/Company';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

export default function SalesOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSelectedSalesOrderId } = useSalesOrderStore();
  const {
    canCreateSalesOrder,
    canEditSalesOrder,
    canDeleteSalesOrder,
    canViewSalesOrderOverview,
    canExportSalesOrder,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewSalesOrderOverview) {
      toast.error('You do not have permission to view Sales Orders.');
      router.push('/');
    }
  }, [canViewSalesOrderOverview, isLoaded, router]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Helper to map API items
  const mapApiToSalesOrder = (apiItem: any): any => {
    const mappedItems: any[] = (apiItem.SalesOrder_Details || []).map((det: any, detIdx: number) => ({
      id: String(detIdx + 1),
      itemType: 'Service',
      product: det.Project_Id || '',
      description: det.Description || det.Project_Name || '',
      quantity: det.Quantity ? parseInt(det.Quantity) || 1 : 1,
      unitPrice: det.Unit_Price ? parseFloat(det.Unit_Price) || 0 : 0,
      discount: det.Discount ? `${det.Discount}%` : '0%',
      tax: det.Tax ? `VAT ${det.Tax}%` : 'VAT 5%',
      amount: det.Net_Amount || det.Amount || 0
    }));

    const formatDateString = (dateStr: string | null) => {
      if (!dateStr) return '—';
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };

    return {
      id: String(apiItem.id),
      orderDate: formatDateString(apiItem.Po_Date || apiItem.Order_Date),
      customer: apiItem.Customer_Name || 'Unknown Customer',
      totalAmount: apiItem.Total_Amount || 0,
      status: apiItem.Is_Draft ? 'Draft' : (apiItem.StatusTrack === 'Sales Order Created' ? 'Confirmed' : (apiItem.StatusTrack || 'Confirmed')),
      deliveryDate: formatDateString(apiItem.Required_Date),
      createdBy: apiItem.Created_By
        ? (typeof apiItem.Created_By === 'object'
          ? `${apiItem.Created_By.first_name || ''} ${apiItem.Created_By.last_name || ''}`.trim() || apiItem.Created_By.username || 'Admin User'
          : `User ${apiItem.Created_By}`)
        : 'Admin User',
      contactPerson: apiItem.Contact_Person || '',
      contactPhone: '',
      contactEmail: '',
      billingAddress: apiItem.Billing_Address || '',
      shippingAddress: apiItem.Billing_Address || '',
      currency: apiItem.Currency || 'USD',
      paymentTerms: apiItem.Payment_Terms || 'Net 30',
      salesRepresentative: apiItem.Sales_Person || 'Admin User',
      reference: apiItem.Po_Number || '',
      items: mappedItems,
      timeline: [],
      projects: [],
      saleId: apiItem.Sale_Id // Custom property for display
    };
  };

  // Queries
  const { data: cardsRes, isLoading: isCardsLoading } = useQuery({
    queryKey: ['salesOrderCards'],
    queryFn: fetchSalesordercardsapiview
  });

  const { data: listRes, isLoading: isListLoading } = useQuery({
    queryKey: ['salesOrdersList', debouncedSearchQuery, currentPage],
    queryFn: async () => {
      if (debouncedSearchQuery.trim() !== '') {
        return searchUserSales(debouncedSearchQuery, currentPage);
      } else {
        return fetchUserSalesList();
      }
    },
    placeholderData: keepPreviousData
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accountsList'],
    queryFn: fetchAccountFullList
  });

  const isLoading = isCardsLoading || isListLoading;

  const orders: any[] = useMemo(() => {
    if (!listRes) return [];
    const rawList = Array.isArray(listRes) ? listRes : ((listRes as any).results || []);
    return rawList.map(mapApiToSalesOrder);
  }, [listRes]);

  // Synchronize with Zustand store
  useEffect(() => {
    if (listRes) {
      useSalesOrderStore.setState({ salesOrders: orders });
    }
  }, [orders, listRes]);

  // Calculate dynamic stats from API KPI cards response
  const stats = useMemo(() => {
    return {
      total: (cardsRes as any)?.All_Orders ?? 0,
      draft: (cardsRes as any)?.Draft_Orders ?? 0,
      confirmed: (cardsRes as any)?.Confirmed_Orders ?? 0,
      partiallyDelivered: (cardsRes as any)?.Partially_Delivered_Orders ?? 0,
      delivered: (cardsRes as any)?.Delivered_Orders ?? 0,
      cancelled: (cardsRes as any)?.Cancelled_Orders ?? 0
    };
  }, [cardsRes]);

  const customersList: string[] = useMemo(() => {
    if (!accountsData) return ['ALL'];
    const rawList = Array.isArray(accountsData) ? accountsData : ((accountsData as any).results || []);
    const names = rawList.map((acc: any) => acc.Contact_Name || acc.Lead_Name || acc.Organization_Name || '').filter(Boolean) as string[];
    return ['ALL', ...Array.from(new Set(names))];
  }, [accountsData]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search matches order ID, customer name, reference, or creator
      const matchesSearch = searchQuery === '' ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order as any).saleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.reference && order.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      // Customer filter
      const matchesCustomer = customerFilter === 'ALL' || order.customer === customerFilter;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [orders, searchQuery, statusFilter, customerFilter]);

  // Total Count of records
  const totalCount = useMemo(() => {
    if (debouncedSearchQuery.trim() !== '') {
      return (listRes as any)?.count ?? filteredOrders.length;
    }
    return filteredOrders.length;
  }, [listRes, filteredOrders.length, debouncedSearchQuery]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    if (debouncedSearchQuery.trim() !== '') {
      // Backend search API response is already paginated for this page.
      return filteredOrders;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, debouncedSearchQuery]);

  const totalPages = useMemo(() => {
    if (debouncedSearchQuery.trim() !== '') {
      return Math.ceil(((listRes as any)?.count ?? 0) / itemsPerPage) || 1;
    }
    return Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  }, [filteredOrders.length, listRes, debouncedSearchQuery]);

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: deleteUserSales,
    onSuccess: () => {
      toast.success("Sales Order deleted successfully.");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['salesOrderCards'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrdersList'] });
      // Adjust page if needed
      if (paginatedOrders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (err) => {
      console.error("Failed to delete sales order:", err);
      toast.error("Failed to delete sales order.");
    }
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Confirmed':
        return 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'Partially Delivered':
        return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 'Delivered':
        return 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'Cancelled':
        return 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const handleExport = () => {
    toast.info('Exporting Sales Orders to CSV...');
    const headers = ['Order No', 'Order Date', 'Customer', 'Total Amount', 'Status', 'Delivery Date', 'Created By'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.orderDate,
      o.customer,
      o.totalAmount.toFixed(2),
      o.status,
      o.deliveryDate,
      o.createdBy
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales Orders exported successfully.');
  };

  if (isLoaded && !canViewSalesOrderOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Sales</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Sales Orders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Orders</h1>
          <p className="text-xs text-slate-450 mt-1">Manage and track your customer sales transactions, order statuses, and shipments.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {canExportSalesOrder && (
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="h-9 rounded-[5px] text-xs font-semibold gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            >
              <Download className="h-3.5 w-3.5" />
              Export Data
            </Button>
          )}

          {canCreateSalesOrder && (
            <Link href="/sales/orders/create" className="inline-flex items-center justify-center h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm border border-transparent">
              <Plus className="h-4 w-4" />
              New Sales Order
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* All Orders */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Orders</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl">
            <ShoppingBag className="h-5 w-5 text-blue-505" />
          </div>
        </div>

        {/* Draft */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Draft</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.draft}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
            <Clock className="h-5 w-5 text-slate-450" />
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.confirmed}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-2xl">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        {/* Partial Deliv. */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partial Deliv.</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.partiallyDelivered}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-955/30 rounded-2xl">
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.delivered}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl">
            <Truck className="h-5 w-5 text-blue-600 hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancelled</span>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.cancelled}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-955/30 rounded-2xl">
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
        </div>
      </div>
      {/* Table & Filter Container */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between p-4 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Orders Registry</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-505">
              {totalCount} records found
            </span>
          </div>

          {/* Filters List */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search No, customer, ref..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
              />
            </div>

            {/* Customer Dropdown */}
            <div className="w-44 text-xs font-semibold">
              <Select value={customerFilter} onValueChange={(val) => {
                setCustomerFilter(val || 'ALL');
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl font-medium">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border dark:border-slate-850">
                  {customersList.map(cust => (
                    <SelectItem key={cust} value={cust}>
                      {cust === 'ALL' ? 'All Customers' : cust}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Dropdown */}
            <div className="w-40 text-xs font-semibold">
              <Select value={statusFilter} onValueChange={(val) => {
                setStatusFilter(val || 'ALL');
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl font-medium">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border dark:border-slate-850">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Partially Delivered">Partially Delivered</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCustomerFilter('ALL');
                setCurrentPage(1);
                toast.success('Filters cleared.');
              }}
              variant="ghost"
              size="icon"
              className="h-9.5 w-9.5 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
              title="Reset Filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow className="border-b dark:border-slate-800">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Order No.</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Order Date</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Customer</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-right">Total Amount</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Delivery Date</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Created By</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-505 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Loading Sales Orders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 transition-colors duration-150">
                  {/* Order Number Link */}
                  <TableCell className="py-3">
                    <Link
                      href={`/sales/orders/${order.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {order?.saleId}
                    </Link>
                  </TableCell>

                  {/* Order Date */}
                  <TableCell className="py-3 text-slate-505 dark:text-slate-400 font-medium text-sm">
                    {order.orderDate}
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-3 text-left">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.customer}</span>
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell className="py-3 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                    ₹ {order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3 text-left">
                    <Badge variant="outline" className={cn(
                      "rounded-md font-semibold text-xs py-0.5 px-2.5",
                      getStatusBadge(order.status)
                    )}>
                      {order.status}
                    </Badge>
                  </TableCell>

                  {/* Delivery Date */}
                  <TableCell className="py-3 text-slate-505 dark:text-slate-400 font-medium text-sm">
                    {order.deliveryDate}
                  </TableCell>

                  {/* Created By */}
                  <TableCell className="py-3 text-slate-505 dark:text-slate-400 font-medium text-sm">
                    {order.createdBy}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>


                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-[5px]">
                          <DropdownMenuLabel className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSalesOrderId(order.id);
                              router.push(`/sales/orders/${order.id}`);
                            }}
                            className="cursor-pointer text-xs font-semibold gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" /> View Order
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSalesOrderId(order.id);
                              router.push(`/sales/orders/create?edit=${order.id}`);
                            }}
                            className="cursor-pointer text-xs font-semibold gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-550" /> Edit Order
                          </DropdownMenuItem>

                          {canDeleteSalesOrder && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold"
                                onClick={() => handleDelete(order.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Order
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-16 text-center text-slate-505 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-400" />
                      <span className="text-sm">No sales orders matched your filters. Click "New Sales Order" to start.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-t dark:border-slate-800 text-xs font-medium text-slate-505">
          <span>Showing {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} orders</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? 'default' : 'outline'}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-all",
                  currentPage === i + 1
                    ? "border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 font-bold text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50"
                )}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        isLoading={deleteMutation.isPending}
        onClose={() => { if (!deleteMutation.isPending) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        title="Delete Sales Order"
        description="Are you sure you want to delete this sales order? This action cannot be undone."
        itemType="sales order"
      />
    </div>
  );
}
