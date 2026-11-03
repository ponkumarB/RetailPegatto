'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { fetchAccountFullList } from '@/service/api/Company/api';
import { fetchSalesInvoiceListWithoutPagination, fetchSalesInvoiceList } from '@/service/api/Invoice/api';
import { getLocalData } from '@/utils/persistentStorage';
import { DEFAULT_CUSTOMER_ACCOUNTS } from '@/service/api/sales/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Save,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Hash,
  DollarSign,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerOption {
  id: number;
  name: string;
}

interface InvoiceOption {
  id: number;
  invoiceId: string;
  customerName: string;
  amount: number;
  accountId?: number;
}

const DEFAULT_INVOICES: InvoiceOption[] = [
  { id: 101, invoiceId: 'INV-2026-001', customerName: 'AR INFO PARK', amount: 90000, accountId: 1 },
  { id: 102, invoiceId: 'INV-2026-002', customerName: 'Teena Sharma', amount: 45000, accountId: 2 },
  { id: 103, invoiceId: 'INV-2026-003', customerName: 'Rajesh Kumar', amount: 32000, accountId: 3 },
  { id: 104, invoiceId: 'INV-2026-004', customerName: 'Priya Patel', amount: 28500, accountId: 4 },
  { id: 105, invoiceId: 'INV-2026-005', customerName: 'AR INFO PARK', amount: 150000, accountId: 1 },
];

export default function CreateOrEditPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { primaryColor } = useStore();
  const { addPayment, updatePayment, getPaymentById } = usePaymentStore();

  // Loading and Customer options state
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [invoicesList, setInvoicesList] = useState<InvoiceOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [selectedInvoiceDbId, setSelectedInvoiceDbId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [modeOfPayment, setModeOfPayment] = useState<string>('Cash');
  const [transactionNo, setTransactionNo] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  // Load Customers & Unpaid Invoices dropdown dynamically
  useEffect(() => {
    async function loadDropdowns() {
      setIsLoadingDropdowns(true);
      try {
        const [accountsData, unpaidInvoicesRes, paidInvoicesRes, allInvoicesRes] = await Promise.all([
          fetchAccountFullList().catch(() => []),
          fetchSalesInvoiceListWithoutPagination(false).catch(() => []),
          fetchSalesInvoiceListWithoutPagination(true).catch(() => []),
          fetchSalesInvoiceList('', 1).catch(() => [])
        ]);

        // Map customers dynamically from API + default fallbacks + local storage
        const rawAccounts = (Array.isArray(accountsData) && accountsData.length > 0)
          ? accountsData
          : DEFAULT_CUSTOMER_ACCOUNTS;

        const localCusts: CustomerOption[] = [
          ...(getLocalData<any>('pegatto_customer_enquiries') || []),
          ...(getLocalData<any>('pegatto_sales_orders') || [])
        ].map((e: any) => ({
          id: Number(e.CustomerId || e.AccountId || e.id || 1),
          name: String(e.CustomerName || e.Customer_Name || '').trim(),
        })).filter((c: CustomerOption) => Boolean(c.name));

        const apiCusts: CustomerOption[] = (rawAccounts || [])
          .map((a: any) => ({
            id: Number(a.id || 1),
            name: String(
              a.Organization_Name ||
              a.Company_Name ||
              a.companyName ||
              a.Account_Name ||
              a.Contact_Name ||
              a.name ||
              ''
            ).trim(),
          }))
          .filter((c: CustomerOption) => Boolean(c.name));

        const seenCusts = new Set<string>();
        const mergedCustomers: CustomerOption[] = [];
        [...apiCusts, ...localCusts].forEach((c) => {
          const key = c.name.toLowerCase().trim();
          if (key && !seenCusts.has(key)) {
            seenCusts.add(key);
            mergedCustomers.push(c);
          }
        });

        setCustomersList(mergedCustomers);

        // Map invoices dynamically from all endpoints + local storage + fallbacks
        const invArray = [
          ...(Array.isArray(unpaidInvoicesRes) ? unpaidInvoicesRes : unpaidInvoicesRes?.results || unpaidInvoicesRes?.data || []),
          ...(Array.isArray(paidInvoicesRes) ? paidInvoicesRes : paidInvoicesRes?.results || paidInvoicesRes?.data || []),
          ...(Array.isArray(allInvoicesRes) ? allInvoicesRes : allInvoicesRes?.results || allInvoicesRes?.data || []),
        ];

        const mappedInvoices: InvoiceOption[] = invArray
          .map((inv: any) => {
            const accObj = typeof inv.Account_Id === 'object' ? inv.Account_Id : null;
            const accIdNum = accObj ? accObj.id : (typeof inv.Account_Id === 'number' ? inv.Account_Id : undefined);
            const custName = inv.Customer_Name || inv.CustomerName || accObj?.Lead_Name || accObj?.Contact_Name || accObj?.Organization_Name || '';
            const invCode = inv.Invoice_Id || inv.Invoice_code || inv.Invoice_No || (inv.id ? `INV-${inv.id}` : '');
            return {
              id: Number(inv.id || Date.now()),
              invoiceId: String(invCode).trim(),
              customerName: String(custName).trim(),
              amount: Number(inv.Net_Amount || inv.Total_Amount || inv.Invoice_Amount || 0),
              accountId: accIdNum ? Number(accIdNum) : undefined,
            };
          })
          .filter((inv: InvoiceOption) => Boolean(inv.invoiceId));

        const localInvoices: InvoiceOption[] = (getLocalData<any>('pegatto_invoices') || []).map((inv: any) => {
          const accId = inv.Account_Id || (inv.Account ? inv.Account.id : 1);
          return {
            id: Number(inv.id || Date.now()),
            invoiceId: String(inv.Invoice_Id || inv.Invoice_No || inv.Invoice_code || (inv.id ? `INV-${inv.id}` : '')).trim(),
            customerName: String(inv.Customer_Name || inv.CustomerName || '').trim(),
            amount: Number(inv.Net_Amount || inv.Total_Amount || inv.Invoice_Amount || 0),
            accountId: Number(accId || 1),
          };
        }).filter((inv: InvoiceOption) => Boolean(inv.invoiceId));

        const seenInvs = new Set<string>();
        const combinedInvoices: InvoiceOption[] = [];
        [...mappedInvoices, ...localInvoices, ...DEFAULT_INVOICES].forEach((inv) => {
          const key = inv.invoiceId.toLowerCase().trim();
          if (key && !seenInvs.has(key)) {
            seenInvs.add(key);
            combinedInvoices.push(inv);
          }
        });

        setInvoicesList(combinedInvoices);
      } catch (err) {
        console.error('Failed to load dropdowns:', err);
      } finally {
        setIsLoadingDropdowns(false);
      }
    }
    loadDropdowns();
  }, []);

  // Load existing Payment details when editing
  useEffect(() => {
    async function loadExistingPayment() {
      if (!editId) return;
      try {
        const existing = await getPaymentById(editId);
        if (existing) {
          if (existing.Account_Id) setSelectedAccountId(String(existing.Account_Id));
          if (existing.Customer_Name) setCustomerName(existing.Customer_Name);
          if (existing.Invoice_No) setInvoiceNo(existing.Invoice_No);
          if (existing.Invoice_Id) setSelectedInvoiceDbId(Number(existing.Invoice_Id));
          if (existing.Payment_Date) setPaymentDate(existing.Payment_Date);
          if (existing.Paid_Amount !== undefined) setPaidAmount(String(existing.Paid_Amount));
          if (existing.Invoice_Amount !== undefined) setInvoiceAmount(String(existing.Invoice_Amount));
          if (existing.Mode_of_Payment) setModeOfPayment(existing.Mode_of_Payment);
          if (existing.Transaction_No) setTransactionNo(existing.Transaction_No);
          if (existing.Status) setStatus(existing.Status);
        }
      } catch (err) {
        console.error('Failed to load existing payment for edit:', err);
        toast.error('Failed to load payment record details.');
      }
    }
    loadExistingPayment();
  }, [editId, getPaymentById]);

  // Handle Customer Selection change (Sets Name string directly)
  const handleCustomerSelectChange = (nameStr: string | null) => {
    const val = nameStr || '';
    setCustomerName(val);
    const trimmed = val.trim().toLowerCase();
    const selectedCust = customersList.find((c) => c.name.toLowerCase().trim() === trimmed);
    if (selectedCust) {
      setSelectedAccountId(String(selectedCust.id));
    }
    // Auto-fill matching invoice if available
    const matchInv = invoicesList.find(
      (inv) => inv.customerName.toLowerCase().trim() === trimmed || (selectedCust && inv.accountId === selectedCust.id)
    );
    if (matchInv) {
      setInvoiceNo(matchInv.invoiceId);
      setSelectedInvoiceDbId(matchInv.id);
      if (matchInv.amount > 0) {
        setInvoiceAmount(String(matchInv.amount));
        setPaidAmount(String(matchInv.amount));
      }
    }
  };

  // Handle Invoice Selection Dropdown change
  const handleInvoiceSelectChange = (invNoStr: string | null) => {
    if (!invNoStr) {
      setInvoiceNo('');
      setSelectedInvoiceDbId(null);
      return;
    }
    setInvoiceNo(invNoStr);
    const selectedInv = invoicesList.find((i) => i.invoiceId === invNoStr);
    if (selectedInv) {
      setSelectedInvoiceDbId(selectedInv.id);
      if (selectedInv.customerName) {
        setCustomerName(selectedInv.customerName);
        const matchCust = customersList.find((c) => c.name.toLowerCase().trim() === selectedInv.customerName.toLowerCase().trim());
        if (matchCust) {
          setSelectedAccountId(String(matchCust.id));
        }
      }
      if (selectedInv.accountId) {
        setSelectedAccountId(String(selectedInv.accountId));
      }
      if (selectedInv.amount > 0) {
        setInvoiceAmount(String(selectedInv.amount));
        setPaidAmount(String(selectedInv.amount));
      }
    }
  };

  // Compute segregated invoices for dropdown
  const { customerInvoices, otherInvoices } = useMemo(() => {
    const trimmedCust = customerName.trim().toLowerCase();
    if (!trimmedCust) {
      return { customerInvoices: [], otherInvoices: invoicesList };
    }
    const custInvs = invoicesList.filter(
      (inv) =>
        inv.customerName.toLowerCase().trim() === trimmedCust ||
        (selectedAccountId && String(inv.accountId) === String(selectedAccountId))
    );
    const othInvs = invoicesList.filter(
      (inv) =>
        inv.customerName.toLowerCase().trim() !== trimmedCust &&
        (!selectedAccountId || String(inv.accountId) !== String(selectedAccountId))
    );
    return { customerInvoices: custInvs, otherInvoices: othInvs };
  }, [customerName, invoicesList, selectedAccountId]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      toast.error('Please select a Customer Name.');
      return;
    }
    if (!paidAmount || Number(paidAmount) <= 0) {
      toast.error('Please enter a valid Paid Amount.');
      return;
    }
    if (!modeOfPayment) {
      toast.error('Please select Mode of Payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAccountId = selectedAccountId ? Number(selectedAccountId) : 0;
      const orgId = localStorage.getItem('Organization_Id');
      const userId = localStorage.getItem('userId');

      const payload: Record<string, any> = {
        ...(editId ? { id: Number(editId) } : {}),
        Customer_Name: customerName,
        Customer_Id: String(numericAccountId),
        Account_Id: numericAccountId,
        Payment_Date: paymentDate,
        Paid_Amount: Number(paidAmount),
        Invoice_Amount: invoiceAmount ? Number(invoiceAmount) : Number(paidAmount),
        Invoice_No: invoiceNo || (transactionNo ? `INV-${transactionNo}` : 'INV-DIRECT'),
        ...(selectedInvoiceDbId ? { Invoice_Id: selectedInvoiceDbId } : {}),
        Mode_of_Payment: modeOfPayment,
        Payment_Flag: true,
        Transaction_No: transactionNo || '',
        ...(status ? { Status: status } : {}),
        Is_Deleted: false,
        ...(orgId ? { Organization_Id: Number(orgId) } : {}),
        ...(userId ? { Created_By: Number(userId), Updated_By: Number(userId) } : {})
      };

      if (editId) {
        await updatePayment(payload);
        toast.success('Payment record updated successfully!');
      } else {
        await addPayment(payload);
        toast.success('Payment record created successfully!');
      }

      router.push('/payment');
    } catch (err: any) {
      console.error('Error saving payment record:', err);
      toast.error(err.message || 'Failed to save payment record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-6 text-left max-w-4xl mx-auto"
      style={{ '--theme-primary': primaryColor } as React.CSSProperties}
    >
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/payment')}
          className="h-7 px-2 gap-1 text-xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <span>/</span>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => router.push('/payment')}
        >
          Payments
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {editId ? 'Edit Payment' : 'Create Payment'}
        </span>
      </div>

      {/* Main Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Receipt className="h-7 w-7 text-primary" style={{ color: primaryColor }} />
          {editId ? 'Edit Payment Record' : 'Create New Payment'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {editId
            ? 'Update the details for this payment record.'
            : 'Fill in the customer payment details below to record a transaction.'}
        </p>
      </div>

      {/* Form Card Container */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
        <CardHeader className="border-b dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
            Payment Details Form
          </CardTitle>
          <CardDescription className="text-xs dark:text-slate-400">
            Select a customer and enter the transaction amount and reference details.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">

              {/* Customer Name Input with Datalist */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Customer Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter or select Customer Name"
                    list="payment-customer-suggestions"
                    value={customerName}
                    onChange={(e) => handleCustomerSelectChange(e.target.value)}
                    className="w-full h-9.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-slate-900 dark:text-slate-100"
                  />
                  <datalist id="payment-customer-suggestions">
                    {customersList.map((cust) => (
                      <option key={cust.id || cust.name} value={cust.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Invoice Number Dropdown */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold block flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Invoice No
                </label>
                <div className="relative">
                  <select
                    value={invoiceNo}
                    onChange={(e) => handleInvoiceSelectChange(e.target.value)}
                    className="w-full h-9.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{isLoadingDropdowns ? 'Loading Invoices...' : 'Select Invoice No'}</option>
                    {customerInvoices.length > 0 && (
                      <optgroup label={`Invoices for ${customerName}`}>
                        {customerInvoices.map((inv) => (
                          <option key={`cust-${inv.id}-${inv.invoiceId}`} value={inv.invoiceId}>
                            {inv.invoiceId}{inv.amount > 0 ? ` — ₹${inv.amount.toLocaleString('en-IN')}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherInvoices.length > 0 && (
                      <optgroup label={customerInvoices.length > 0 ? 'All Other Invoices' : 'Available Invoices'}>
                        {otherInvoices.map((inv) => (
                          <option key={`other-${inv.id}-${inv.invoiceId}`} value={inv.invoiceId}>
                            {inv.invoiceId}{inv.customerName ? ` — ${inv.customerName}` : ''}{inv.amount > 0 ? ` (₹${inv.amount.toLocaleString('en-IN')})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {invoiceNo && !invoicesList.some((i) => i.invoiceId === invoiceNo) && (
                      <option value={invoiceNo}>{invoiceNo}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold block flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Payment Date *
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
                  required
                />
              </div>

              {/* Paid Amount */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold block flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Paid Amount (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50000.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
                  required
                />
              </div>

              {/* Mode of Payment */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold block flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Mode of Payment *
                </label>
                <div className="relative">
                  <select
                    value={modeOfPayment}
                    onChange={(e) => setModeOfPayment(e.target.value)}
                    className="w-full h-9.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-slate-900 dark:text-slate-100"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Credit Cards">Credit Cards</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI / Online">UPI / Online</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Transaction Number */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold block flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-slate-400" /> Transaction / Ref No
                </label>
                <Input
                  type="text"
                  placeholder="e.g. TXN666888"
                  value={transactionNo}
                  onChange={(e) => setTransactionNo(e.target.value)}
                  className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-200 dark:focus:border-slate-800"
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/payment')}
                className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-6 text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all gap-1.5 shadow-xs"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : editId ? 'Update Payment' : 'Save Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
