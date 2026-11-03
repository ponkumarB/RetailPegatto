'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { 
  fetchSalesInvoiceById,
  fetchInvoiceSalesPaymentList,
  fetchSalesInvoiceListWithoutPagination,
  updateSalesInvoice,
  mapBackendToInvoice 
} from '@/service/api/Invoice/api';
import { getLocalData } from '@/utils/persistentStorage';
import { Invoice } from '@/types/invoice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Send,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  User,
  Plus,
  History,
  Paperclip,
  CreditCard,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { primaryColor } = useStore();
  const { addNote, addPayment, updateInvoice } = useInvoiceStore();

  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [originalBkRecord, setOriginalBkRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const fetchInvoiceDetails = async () => {
    setIsLoading(true);
    try {
      // Endpoint: GET /user/SalesInvoiceCRUD/?id=${invoiceId}
      const res = await fetchSalesInvoiceById(invoiceId);
      let match = res;
      if (res && (res.data || res.results)) {
        match = res.data || res.results;
      }
      if (Array.isArray(match)) {
        match = match[0];
      }

      // Fallback to list search if direct ID lookup is empty
      if (!match || !match.id) {
        const [paidRes, unpaidRes] = await Promise.all([
          fetchSalesInvoiceListWithoutPagination(true).catch(() => []),
          fetchSalesInvoiceListWithoutPagination(false).catch(() => [])
        ]);
        const combined = [...(Array.isArray(paidRes) ? paidRes : []), ...(Array.isArray(unpaidRes) ? unpaidRes : [])];
        match = combined.find(inv => String(inv.id) === String(invoiceId) || String(inv.Invoice_Id) === String(invoiceId) || String(inv.Invoice_code) === String(invoiceId));
      }

      // Fallback to persistent storage if not found in server response
      if (!match || !match.id) {
        const localInvoices = getLocalData<any>('pegatto_invoices');
        const localPosInvoices = getLocalData<any>('pegatto_pos_invoices');
        const allLocal = [...localInvoices, ...localPosInvoices];
        match = allLocal.find(inv =>
          String(inv.id) === String(invoiceId) ||
          String(inv.Invoice_Id) === String(invoiceId) ||
          String(inv.invoiceNumber) === String(invoiceId) ||
          String(inv.Invoice_code) === String(invoiceId)
        );
      }

      if (match) {
        setOriginalBkRecord(match);
        setInvoice(mapBackendToInvoice(match));
      } else {
        toast.error('Invoice details not found.');
      }
    } catch (e) {
      console.error(e);
      const localInvoices = getLocalData<any>('pegatto_invoices');
      const localPosInvoices = getLocalData<any>('pegatto_pos_invoices');
      const allLocal = [...localInvoices, ...localPosInvoices];
      const match = allLocal.find(inv =>
        String(inv.id) === String(invoiceId) ||
        String(inv.Invoice_Id) === String(invoiceId) ||
        String(inv.invoiceNumber) === String(invoiceId) ||
        String(inv.Invoice_code) === String(invoiceId)
      );
      if (match) {
        setOriginalBkRecord(match);
        setInvoice(mapBackendToInvoice(match));
      } else {
        toast.error('Failed to load invoice from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!invoiceId) return;
    setIsLoadingPayments(true);
    try {
      // Endpoint: GET /user/InvoicesalesPaymentlist/ with Invoice_Id
      const res = await fetchInvoiceSalesPaymentList(invoiceId);
      const list = Array.isArray(res) ? res : (res?.data || res?.results || []);
      if (Array.isArray(list)) {
        setPaymentsList(list);
      }
    } catch (e) {
      console.error('Failed to load payments for invoice:', e);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
    fetchPayments();
  }, [invoiceId]);

  const [activeTab, setActiveTab] = useState<'items' | 'payments' | 'notes' | 'attachments' | 'activities'>('items');

  // Note Form State
  const [noteContent, setNoteContent] = useState('');

  // Record Payment Dialog State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionId, setTransactionId] = useState('');
  const [amountToPay, setAmountToPay] = useState('');

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <h3 className="text-lg font-bold">Invoice Not Found</h3>
        <p className="text-sm mt-1">The invoice you are looking for does not exist or has been deleted.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/invoice')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSendInvoice = () => {
    if (!invoice) return;
    toast.success(`Invoice ${invoice.invoiceNumber} sent to ${invoice.billedTo.email} successfully!`);
  };

  const handleDownloadPDF = () => {
    toast.info(`Generating and downloading PDF for ${invoice.invoiceNumber}...`);
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !invoice || !originalBkRecord) return;

    try {
      const updatedPayload = {
        ...originalBkRecord,
        Invoice_Note: `${originalBkRecord.Invoice_Note || ''}\n${noteContent}`.trim()
      };
      await updateSalesInvoice(updatedPayload);
      setNoteContent('');
      toast.success('Note added successfully!');
      fetchInvoiceDetails();
    } catch (e) {
      console.error(e);
      toast.error('Failed to add note on server.');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !originalBkRecord) return;
    const parsedAmount = parseFloat(amountToPay);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      const currentPaid = Number(originalBkRecord.Amount_Received) || 0;
      const newPaid = currentPaid + parsedAmount;
      const totalAmount = Number(originalBkRecord.Net_Amount) || Number(originalBkRecord.Invoice_Amount) || 0;
      
      const updatedPayload = {
        ...originalBkRecord,
        Amount_Received: newPaid,
        Is_Paid: newPaid >= totalAmount,
        Payment_Status: newPaid >= totalAmount ? 'Paid' : 'Pending',
        Payment_Method: paymentMethod,
        Reference_Id: transactionId || `TXN-${Date.now().toString().substring(6)}`
      };
      await updateSalesInvoice(updatedPayload);
      setIsPaymentDialogOpen(false);
      setAmountToPay('');
      setTransactionId('');
      toast.success('Payment recorded successfully!');
      fetchInvoiceDetails();
    } catch (e) {
      console.error(e);
      toast.error('Failed to record payment on server.');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || !originalBkRecord) return;
    if (invoice.status === 'Paid') {
      toast.info('Invoice is already marked as Paid.');
      return;
    }

    try {
      const totalAmount = Number(originalBkRecord.Net_Amount) || Number(originalBkRecord.Invoice_Amount) || 0;
      const updatedPayload = {
        ...originalBkRecord,
        Is_Paid: true,
        Payment_Status: 'Paid',
        Amount_Received: totalAmount,
        Payment_Method: 'Manual Adjustment',
        Reference_Id: `ADJ-${Date.now().toString().substring(6)}`
      };
      await updateSalesInvoice(updatedPayload);
      toast.success('Invoice marked as Paid.');
      fetchInvoiceDetails();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status on server.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Paid</Badge>;
      case 'Overdue':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Overdue</Badge>;
      case 'Due Soon':
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Due Soon</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left" style={{ '--theme-primary': primaryColor } as React.CSSProperties}>

      {/* Breadcrumbs & Back Nav */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Button variant="ghost" size="sm" onClick={() => router.push('/invoice')} className="h-7 px-2 gap-1 text-xs">
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
        <span>/</span>
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/invoice')}>Invoices</span>
        <span>/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-350">{invoice.invoiceNumber}</span>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Invoice {invoice.invoiceNumber}
          </h1>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={handleDownloadPDF} className="border-slate-200 dark:border-slate-800 font-bold rounded-xl gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* 3-Column Info Panel */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-6 gap-6 md:gap-0">

          {/* Column 1: Billed To */}
          <div className="space-y-2 text-left md:pr-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To</span>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-primary" style={{ color: primaryColor }}>
                {invoice.billedTo.companyName}
              </h4>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{invoice.billedTo.contactPerson}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.billedTo.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.billedTo.mobileNumber}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{invoice.billedTo.address}</p>
            </div>
          </div>

          {/* Column 2: Invoice Details */}
          <div className="space-y-3 text-left md:px-6 pt-6 md:pt-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Info</span>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs">
              <span className="text-slate-500">Invoice Number</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span>

              <span className="text-slate-500">Invoice Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceDate}</span>

              <span className="text-slate-500">Due Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.dueDate}</span>

              <span className="text-slate-500">Terms</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.terms}</span>

              <span className="text-slate-500">Sales Owner</span>
              <span className="font-semibold text-slate-855 dark:text-slate-250 flex items-center gap-1">
                <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                  {invoice.salesOwner.split(' ').map(n => n[0]).join('')}
                </span>
                {invoice.salesOwner}
              </span>
            </div>
          </div>

          {/* Column 3: Amount Due Status */}
          <div className="space-y-3 text-left md:pl-6 pt-6 md:pt-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount Due</span>
            <div className="space-y-2.5">
              <div className="text-3xl font-extrabold text-slate-850 dark:text-white" style={{ color: invoice.amountDue > 0 ? '#ef4444' : '#10b981' }}>
                {formatCurrency(invoice.amountDue)}
              </div>

              {invoice.status === 'Paid' ? (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Paid on {invoice.paidDate || invoice.updatedAt.split(' ')[0]}</p>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold gap-1 py-1 px-2.5 border-emerald-250">
                    <CheckCircle className="h-3.5 w-3.5" /> Paid
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Payment is pending for this invoice.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Tabbed Area (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-slate-800">
            {/* Custom Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-4">
              {[
                { id: 'items', label: 'Invoice Items' },
                { id: 'payments', label: `Payments (${invoice.payments?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="py-3 px-4 text-sm font-semibold transition-all relative"
                  style={{
                    color: activeTab === tab.id ? primaryColor : undefined,
                    borderBottom: activeTab === tab.id ? `2px solid ${primaryColor}` : '2px solid transparent',
                    marginBottom: '-1px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CardContent className="p-0">

              {/* Tab 1: Invoice Items */}
              {activeTab === 'items' && (
                <div className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                      <TableRow className="border-b border-slate-100 dark:border-slate-800">
                        <TableHead className="w-12 text-center pl-4">#</TableHead>
                        <TableHead>Item / Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-center">Tax</TableHead>
                        <TableHead className="text-right pr-4">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                          <TableRow key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/30">
                            <TableCell className="text-center text-slate-500 font-medium pl-4">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.description}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.details}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.quantity.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-center text-slate-550 dark:text-slate-400 font-medium">{item.tax}</TableCell>
                            <TableCell className="text-right pr-4 font-bold">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                            No items added to this invoice.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pricing Calculations Summary */}
                  <div className="flex flex-col items-end p-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-sm">
                    <div className="flex justify-between w-64 text-slate-550 dark:text-slate-400">
                      <span>Sub Total</span>
                      <span className="font-semibold">{formatCurrency(invoice.subTotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between w-64 text-emerald-600 font-semibold">
                        <span>Discount</span>
                        <span>- {formatCurrency(invoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-64 text-slate-550 dark:text-slate-400">
                      <span>Taxable Amount</span>
                      <span className="font-semibold">{formatCurrency(invoice.taxableAmount)}</span>
                    </div>
                    {(() => {
                      const cgstRate = invoice.taxableAmount > 0 ? (invoice.cgst / invoice.taxableAmount) * 100 : 9;
                      const sgstRate = invoice.taxableAmount > 0 ? (invoice.sgst / invoice.taxableAmount) * 100 : 9;
                      const cgstLabel = cgstRate % 1 === 0 ? cgstRate.toFixed(0) : cgstRate.toFixed(1);
                      const sgstLabel = sgstRate % 1 === 0 ? sgstRate.toFixed(0) : sgstRate.toFixed(1);
                      return (
                        <>
                          <div className="flex justify-between w-64 text-slate-550 dark:text-slate-400">
                            <span>CGST ({cgstLabel}%)</span>
                            <span className="font-semibold">{formatCurrency(invoice.cgst)}</span>
                          </div>
                          <div className="flex justify-between w-64 text-slate-550 dark:text-slate-450 font-semibold">
                            <span>SGST ({sgstLabel}%)</span>
                            <span className="font-semibold">{formatCurrency(invoice.sgst)}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex justify-between w-64 text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>

                  {/* Add Item Trigger Placeholder to match screenshot */}


                  {/* Note Banner Footer */}
                  <div className="m-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl flex items-start gap-2.5 text-left">
                    <div className="h-5 w-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Note</span>
                      <p>Thank you for your business! If you have any questions about this invoice, please contact us at billing@crmfarmit.com or +91 120 456 7890.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Payments */}
              {activeTab === 'payments' && (
                <div className="p-6">
                  <div className="flex items-center justify-between pb-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Recorded Payments</h3>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                        <TableRow className="border-b border-slate-200 dark:border-slate-800">
                          <TableHead className="pl-4">Date</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Transaction ID / Ref</TableHead>
                          <TableHead className="text-right pr-4">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPayments ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                              Loading payments...
                            </TableCell>
                          </TableRow>
                        ) : paymentsList.length > 0 ? (
                          paymentsList.map((pmt: any, idx: number) => {
                            const pDate = pmt.Payment_Date || pmt.Created_Date || pmt.created_date || pmt.Date || invoice?.invoiceDate || '-';
                            const pMethod = pmt.Payment_Method || pmt.payment_method || pmt.Payment_Mode || 'Bank Transfer';
                            const pTxn = pmt.Reference_Id || pmt.Transaction_Id || pmt.transaction_id || pmt.Cheque_No || pmt.Reference_No || '-';
                            const pAmount = Number(pmt.Amount || pmt.Amount_Paid || pmt.amount || pmt.Paid_Amount || 0);

                            return (
                              <TableRow key={pmt.id || pmt.Payment_Id || idx} className="border-b border-slate-100 dark:border-slate-800">
                                <TableCell className="pl-4 font-semibold text-slate-800 dark:text-slate-200">{pDate}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-400">{pMethod}</TableCell>
                                <TableCell className="text-slate-500 font-medium">{pTxn}</TableCell>
                                <TableCell className="text-right pr-4 font-bold">{formatCurrency(pAmount)}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : invoice.payments && invoice.payments.length > 0 ? (
                          invoice.payments.map((pmt) => (
                            <TableRow key={pmt.id} className="border-b border-slate-100 dark:border-slate-800">
                              <TableCell className="pl-4 font-semibold text-slate-800 dark:text-slate-200">{pmt.paymentDate}</TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">{pmt.paymentMethod}</TableCell>
                              <TableCell className="text-slate-500 font-medium">{pmt.transactionId}</TableCell>
                              <TableCell className="text-right pr-4 font-bold">{formatCurrency(pmt.amountPaid)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                              No payments recorded for this invoice yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards Column */}
        <div className="space-y-6">

          {/* Sidebar 1: Invoice Summary */}
          <Card className="border-slate-100 dark:border-slate-800">
            <CardHeader className="pb-2 text-left">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-500">Invoice Status</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-500">Payment Status</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(invoice.total - invoice.amountDue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount Due</span>
                <span className="font-bold" style={{ color: invoice.amountDue > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(invoice.amountDue)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar 2: Payment Information */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-2 text-left">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs text-left">
                {invoice.payments.slice(0, 1).map((pmt) => (
                  <div key={pmt.id} className="space-y-2.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Payment Method</span>
                      <span className="text-slate-800 dark:text-slate-200">{pmt.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="text-slate-700 dark:text-slate-300">{pmt.transactionId}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Payment Date</span>
                      <span className="text-slate-700 dark:text-slate-300">{pmt.paymentDate}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Amount Paid</span>
                      <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(pmt.amountPaid)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-50 dark:border-slate-900">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab('payments');
                          toast.success('Navigated to Payments detail tab');
                        }}
                        className="w-full text-xs font-semibold"
                      >
                        View Payment Details
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sidebar 3: Related Information */}
          <Card className="border-slate-100 dark:border-slate-800">
            <CardHeader className="pb-2 text-left">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Related Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-left font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Related Deal</span>
                <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/Deal`)}>
                  {invoice.relatedDeal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Related Account</span>
                <span className="text-blue-600 hover:underline cursor-pointer max-w-[140px] truncate" onClick={() => router.push(`/contacts`)}>
                  {invoice.relatedAccount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created By</span>
                <span className="text-slate-700 dark:text-slate-300">{invoice.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created On</span>
                <span className="text-slate-655 dark:text-slate-400 text-[10px]">{invoice.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-655 dark:text-slate-400 text-[10px]">{invoice.updatedAt}</span>
              </div>


            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Payment Dialog Modal */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-slate-200 dark:border-slate-800 text-left">
          <form onSubmit={handleRecordPaymentSubmit}>
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Record Invoice Payment</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Record a partial or full payment received for this invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <div className="flex flex-col gap-1.5">
                <label>Amount Paid (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  className="h-9.5 text-sm"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9.5 px-2.5 rounded-lg border border-input bg-transparent text-sm outline-none focus:border-ring dark:bg-slate-900"
                >
                  <option value="Bank Transfer" className="dark:bg-slate-900">Bank Transfer</option>
                  <option value="Cash" className="dark:bg-slate-900">Cash</option>
                  <option value="Credit Card" className="dark:bg-slate-900">Credit Card</option>
                  <option value="Cheque" className="dark:bg-slate-900">Cheque</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Transaction ID / Reference (Optional)</label>
                <Input
                  placeholder="e.g. TXN-240524-XXXXX"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-9.5 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="rounded-lg h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white rounded-lg h-9 text-xs font-bold">
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
