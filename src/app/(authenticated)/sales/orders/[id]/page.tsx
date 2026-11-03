'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchUserSalesById } from '@/service/api/SalesOrder';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Truck, 
  ChevronRight, 
  DollarSign, 
  FileText, 
  Layers, 
  User, 
  CreditCard,
  History,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building,
  Plus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useEffect } from 'react';

export default function SalesOrderOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { canViewSalesOrderOverview, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewSalesOrderOverview) {
      toast.error('You do not have permission to view Sales Order details.');
      router.push('/sales/orders');
    }
  }, [canViewSalesOrderOverview, isLoaded, router]);

  const orderId = params.id as string;

  const { data: orderRes, isLoading: isOrderLoading } = useQuery({
    queryKey: ['salesOrderDetail', orderId],
    queryFn: () => fetchUserSalesById(orderId),
    enabled: !!orderId,
  });

  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'deliveries' | 'invoices' | 'payments' | 'activities' | 'notes' | 'attachments'>('items');
  const [noteContent, setNoteContent] = useState('');
  const [localNotes, setLocalNotes] = useState<any[]>([]);

  const order = useMemo(() => {
    if (!orderRes) return null;
    
    // Extract the raw item from response (handle lists/objects)
    const apiItem = Array.isArray(orderRes) 
      ? orderRes[0] 
      : (orderRes?.results && Array.isArray(orderRes.results) ? orderRes.results[0] : orderRes);
      
    if (!apiItem) return null;

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

    const timeline: any[] = [];
    if (apiItem.Created_Date) {
      const creatorName = apiItem.Created_By
        ? (typeof apiItem.Created_By === 'object'
          ? `${apiItem.Created_By.first_name || ''} ${apiItem.Created_By.last_name || ''}`.trim() || apiItem.Created_By.username
          : `User ${apiItem.Created_By}`)
        : 'Admin User';
      timeline.push({
        id: 't-1',
        title: 'Sales Order Created',
        details: `Created by ${creatorName}`,
        timestamp: formatDateString(apiItem.Created_Date.split('T')[0])
      });
    }
    if (apiItem.StatusTrack) {
      timeline.push({
        id: 't-2',
        title: 'Status Update',
        details: `Order status set to ${apiItem.StatusTrack}`,
        timestamp: formatDateString((apiItem.Updated_Date || apiItem.Created_Date).split('T')[0])
      });
    }

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
      terms: apiItem.Terms_Condition || '',
      items: mappedItems,
      timeline,
      projects: [] as any[],
      saleId: apiItem.Sale_Id
    };
  }, [orderRes]);

  const combinedTimeline = useMemo(() => {
    if (!order) return [];
    return [...localNotes, ...order.timeline];
  }, [order, localNotes]);

  if (isOrderLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Loading Order Details...</h3>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sales Order Not Found</h3>
        <p className="text-sm text-center text-slate-400">The sales transaction record you requested could not be retrieved or is invalid.</p>
        <Button variant="outline" className="h-9 rounded-xl" onClick={() => router.push('/sales/orders')}>
          Back to Sales Orders
        </Button>
      </div>
    );
  }

  // Calculate dynamic stats
  const itemQtyTotal = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveredVal = order.status === 'Delivered' ? order.totalAmount : (order.status === 'Partially Delivered' ? order.totalAmount * 0.6 : 0);
  const invoicedVal = order.status !== 'Draft' ? order.totalAmount : 0;
  const balanceDue = order.status !== 'Delivered' && order.status !== 'Draft' ? order.totalAmount : 0;

  const handlePrint = () => {
    toast.success(`Printing receipt of order ${order.id}...`);
    window.print();
  };

  const handleDownload = () => {
    toast.info(`Downloading PDF invoice for ${order.id}...`);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newTimelineEvent = {
      id: `ev-${Date.now()}`,
      title: 'Order Note Added',
      details: noteContent,
      timestamp: `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} by Admin User`
    };

    setLocalNotes(prev => [newTimelineEvent, ...prev]);
    setNoteContent('');
    toast.success('Note added to timeline successfully.');
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
        return 'text-rose-700 bg-rose-50 dark:bg-rose-955/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (isLoaded && !canViewSalesOrderOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Button variant="ghost" size="sm" onClick={() => router.push('/sales/orders')} className="h-7 px-2 gap-1 text-xs rounded-xl border border-transparent">
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <span>/</span>
          <Link href="/sales/orders" className="hover:underline">Sales Orders</Link>
          <span>/</span>
          <span className="font-semibold text-slate-700 dark:text-slate-305">{order.saleId || order.id}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="h-9 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl gap-1.5 bg-white dark:bg-slate-900">
            <Printer className="h-4 w-4 text-slate-500" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="h-9 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl gap-1.5 bg-white dark:bg-slate-900">
            <Download className="h-4 w-4 text-slate-500" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Banner Card - General Info */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-6 gap-6 md:gap-0">
          {/* Col 1: Customer Details */}
          <div className="space-y-2 text-left md:pr-6 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To / Deliver To</span>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border",
                getStatusBadge(order.status)
              )}>
                {order.status}
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg text-blue-600 dark:text-blue-450 leading-tight">
                {order.customer}
              </h4>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact: {order.contactPerson} • {order.contactPhone}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{order.contactEmail}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                <span className="font-bold text-slate-500">Address:</span> {order.billingAddress}
              </p>
            </div>
          </div>

          {/* Col 2: Order Metadata */}
          <div className="space-y-2 text-left md:px-6 pt-6 md:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Details</span>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs font-semibold">
              <span className="text-slate-400">Order No.</span>
              <span className="text-slate-800 dark:text-white font-bold">{order.saleId || order.id}</span>
              
              <span className="text-slate-400">Order Date</span>
              <span className="text-slate-705 dark:text-slate-305">{order.orderDate}</span>
              
              <span className="text-slate-400">Required Date</span>
              <span className="text-slate-705 dark:text-slate-305">{order.deliveryDate}</span>

              <span className="text-slate-400">Payment Terms</span>
              <span className="text-slate-705 dark:text-slate-305">{order.paymentTerms || 'Net 30'}</span>
            </div>
          </div>

          {/* Col 3: Financial summary */}
          <div className="space-y-2 text-left md:pl-6 pt-6 md:pt-0 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Valuation</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-455 mt-1">
                ₹ {order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              <span className="text-slate-400">Sales Representative:</span>
              <p className="text-slate-705 dark:text-slate-300 font-bold">{order.salesRepresentative}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Mini Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 hover:shadow-xs transition-all duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Value</span>
          <p className="text-base font-bold text-slate-800 dark:text-white mt-1">
            ₹ {order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 hover:shadow-xs transition-all duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items Quantity</span>
          <p className="text-base font-bold text-slate-800 dark:text-white mt-1">
            {itemQtyTotal} Units
          </p>
        </Card>
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 hover:shadow-xs transition-all duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase text-blue-600 tracking-wider">Delivered Amount</span>
          <p className="text-base font-bold text-blue-600 mt-1">
            ₹ {deliveredVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 hover:shadow-xs transition-all duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase text-blue-600 tracking-wider">Invoiced Amount</span>
          <p className="text-base font-bold text-blue-600 mt-1">
            ₹ {invoicedVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 hover:shadow-xs transition-all duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase text-rose-600 tracking-wider">Balance Due</span>
          <p className="text-base font-bold text-rose-600 mt-1">
            ₹ {balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
      </div>      {/* Main Grid: Left tab details, Right vertical timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic tabs panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            {/* Custom Tab selectors */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto gap-1">
              {[
                { id: 'items', label: 'Order Items' },
                { id: 'details', label: 'Billing & Terms' },
                { id: 'invoices', label: 'Invoices' },
                { id: 'payments', label: 'Payments' },
                { id: 'activities', label: 'Audit Trail' },
                { id: 'attachments', label: 'Attachments' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-3 px-4 text-xs font-bold transition-all relative whitespace-nowrap shrink-0 border-b-2",
                    activeTab === tab.id 
                      ? "text-blue-600 border-blue-600 font-extrabold" 
                      : "text-slate-400 border-transparent hover:text-slate-655"
                  )}
                  style={{ marginBottom: '-1.5px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CardContent className="p-0 text-left">
              {/* Tab: Items */}
              {activeTab === 'items' && (
                <div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-955/20 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3 w-10 text-center">#</th>
                        <th className="px-6 py-3">Product / SKU</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 text-right">Quantity</th>
                        <th className="px-6 py-3 text-right">Price</th>
                        <th className="px-6 py-3 text-center">Tax</th>
                        <th className="px-6 py-3 text-right">Discount</th>
                        <th className="px-6 py-3 text-right pr-6">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-955/5">
                          <td className="px-6 py-3.5 text-center text-slate-455">{idx + 1}</td>
                          <td className="px-6 py-3.5 text-slate-900 dark:text-white font-bold">{item.product}</td>
                          <td className="px-6 py-3.5 text-slate-500 font-medium">{item.description}</td>
                          <td className="px-6 py-3.5 text-right font-bold">{item.quantity}</td>
                          <td className="px-6 py-3.5 text-right font-medium">₹ {item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3.5 text-center text-slate-455">{item.tax || 'VAT 5%'}</td>
                          <td className="px-6 py-3.5 text-right text-blue-600 font-bold">{item.discount || '0%'}</td>
                          <td className="px-6 py-3.5 text-right pr-6 font-bold text-slate-900 dark:text-white">₹ {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculations Summary */}
                  {(() => {
                    const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                    const discountVal = order.items.reduce((sum, item) => {
                      const discPercent = parseFloat(item.discount) || 0;
                      return sum + (item.quantity * item.unitPrice * (discPercent / 100));
                    }, 0);
                    const taxAmount = Math.max(0, order.totalAmount - (subtotal - discountVal));
                    return (
                      <div className="flex flex-col items-end p-6 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-bold text-slate-500 bg-slate-50/20 dark:bg-slate-955/5">
                        <div className="flex justify-between w-64 text-slate-400">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-800 dark:text-white">
                            ₹ {(subtotal - discountVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {taxAmount > 0 && (
                          <div className="flex justify-between w-64 text-slate-400">
                            <span>Tax / VAT</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                              ₹ {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between w-64 text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span>Grand Total</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-base">
                            ₹ {order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: Details */}
              {activeTab === 'details' && (
                <div className="p-6 space-y-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Shipping Information</h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-455">Delivery Mode</span>
                          <span className="text-slate-800 dark:text-white font-bold">Standard Cargo Truck</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-455">Destination Address</span>
                          <span className="text-slate-800 dark:text-white font-bold max-w-[200px] text-right truncate" title={order.shippingAddress}>
                            {order.shippingAddress}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-455">Reference ID</span>
                          <span className="text-slate-800 dark:text-white font-bold">{order.reference || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Billing Conditions</h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-450">Currency</span>
                          <span className="text-slate-805 dark:text-white font-bold">INR (₹)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-450">Billing Address</span>
                          <span className="text-slate-800 dark:text-white font-bold max-w-[200px] text-right truncate" title={order.billingAddress}>
                            {order.billingAddress}
                          </span>
                        </div>
                         <div className="flex justify-between py-1">
                          <span className="text-slate-455">Tax Structure</span>
                          <span className="text-slate-800 dark:text-white font-bold">{order.items[0]?.tax || 'VAT 5%'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] mb-2">Terms & Conditions</h4>
                    <p className="text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {order.terms || 'No terms & conditions specified.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Invoices */}
              {activeTab === 'invoices' && (
                <div className="p-6 text-left space-y-4">
                  <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wider">Associated Sales Invoices</h4>
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No commercial sales invoices found.
                  </div>
                </div>
              )}

              {/* Tab: Payments */}
              {activeTab === 'payments' && (
                <div className="p-10 text-center text-slate-400 text-xs">
                  No payments recorded for this sales order. Accounts Receivables is pending invoice submission.
                </div>
              )}

              {/* Tab: Activities */}
              {activeTab === 'activities' && (
                <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-4">Transactional Log Audit Trail</h4>
                  <div className="space-y-4">
                    {combinedTimeline.length > 0 ? (
                      combinedTimeline.map((item, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-normal">
                          <div className="w-24 text-slate-400 shrink-0 mt-0.5">{item.timestamp.split(' ')[0]}</div>
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-800 dark:text-white">{item.title}</span>
                            <span className="text-slate-500 font-medium">{item.details}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        No audit trail entries recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Attachments */}
              {activeTab === 'attachments' && (
                <div className="p-10 text-center text-slate-400 text-xs">
                  No document attachments found. You can add PDFs or purchase orders via Edit mode.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Timeline Sidebar (1/3 width) */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-bold">Order Progress Timeline</h3>
            </div>
            
            <CardContent className="p-6">
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 text-left">
                {combinedTimeline.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Stepper Dot */}
                    <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border bg-white dark:bg-slate-900 border-blue-500 shadow-xs flex items-center justify-center" />
                    
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-normal">{event.title}</h4>
                      <p className="text-xs text-slate-505 font-medium leading-relaxed">{event.details}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{event.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
