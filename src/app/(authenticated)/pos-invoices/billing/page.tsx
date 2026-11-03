'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  usePosInvoiceStore,
  PosProduct,
  PosInvoice,
  PosCartItem
} from '@/store/usePosInvoiceStore';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { AddProductModal } from '@/components/pos/AddProductModal';
import {
  ArrowLeft,
  Plus,
  User,
  Calculator,
  Printer,
  Search,
  Tag,
  Receipt,
  Trash2,
  Percent,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Home,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductRow {
  id: string;
  sNo: string;
  productId: string;
  productCode: string;
  productName: string;
  productImage?: string;
  offers: string[];
  qty: number | '';
  unit: string;
  rate: number | '';
  discount: number | '';
  gst: number | '';
  amount: number;
}

function PosBillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const editInvoiceNum = searchParams.get('invoiceNumber');
  const isEditMode = Boolean(editId || editInvoiceNum);
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null);

  const { products, addProduct, addCustomInvoice, loadProducts, invoices, loadInvoices } = usePosInvoiceStore();
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadInvoices();
    import('@/service/apiClient').then(({ fetchFromApi }) => {
      fetchFromApi('/user/AccountFullList/?Is_Deleted=False', { method: 'GET' })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
          setAccounts(list);
        })
        .catch(() => {});
    });
  }, [loadProducts, loadInvoices]);

  // Load existing invoice data in Edit Mode
  useEffect(() => {
    if (!isEditMode || loadedEditId === (editId || editInvoiceNum)) return;

    let target = invoices.find(
      (inv) => inv.id === editId || inv.invoiceNumber === editInvoiceNum || inv.invoiceNumber === editId
    );

    if (!target && typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('pegatto_pos_invoices') || '[]');
        if (Array.isArray(local)) {
          target = local.find(
            (inv: any) => inv.id === editId || inv.invoiceNumber === editInvoiceNum || inv.invoiceNumber === editId
          );
        }
      } catch (e) {}
    }

    if (target) {
      if (target.status?.toLowerCase() === 'paid') {
        toast.error('Paid invoices cannot be edited.');
        router.push('/pos-invoices');
        return;
      }

      setLoadedEditId(target.id || target.invoiceNumber);
      setBillNumber(target.invoiceNumber);
      if (target.date) setBillDate(target.date);
      if (target.customerName) setCustomerName(target.customerName);
      if (target.customerPhone) setCustomerMobile(target.customerPhone);
      if (target.cashierName) setSalesman(target.cashierName);
      if (target.paymentMethod) setPaymentMethod(target.paymentMethod as any);

      if (target.delivery && target.delivery !== 'Store Pickup') {
        setIsHomeDelivery(true);
        setDeliveryAddress(target.delivery);
      }

      if (target.discountAmount && target.discountAmount > 0) {
        setIsDiscountChecked(true);
        setSummaryDiscount(target.discountAmount);
      }

      if (target.amountReceived !== undefined && target.amountReceived !== null) {
        setAmountReceived(target.amountReceived);
      }

      if (target.items && target.items.length > 0) {
        const mappedRows: ProductRow[] = target.items.map((it, idx) => ({
          id: `row-${idx + 1}`,
          sNo: String(idx + 1),
          productId: it.product?.id || `item-${idx + 1}`,
          productCode: it.product?.sku || it.product?.barcode || `SKU-${idx + 1}`,
          productName: it.product?.name || `Product ${idx + 1}`,
          offers: [],
          qty: it.quantity || 1,
          unit: it.product?.unit || 'Pcs',
          rate: it.rate || 0,
          discount: it.discountPercent || 0,
          gst: it.product?.taxRate || 0,
          amount: it.total || (it.rate * it.quantity)
        }));

        while (mappedRows.length < 3) {
          mappedRows.push({
            id: `row-${mappedRows.length + 1}`,
            sNo: String(mappedRows.length + 1),
            productId: '',
            productCode: '',
            productName: '',
            offers: [],
            qty: '',
            unit: '',
            rate: '',
            discount: 0,
            gst: 0,
            amount: 0
          });
        }
        setRows(mappedRows);
      }
    }
  }, [isEditMode, editId, editInvoiceNum, invoices, loadedEditId, router]);

  // Header & Info States
  const storeName = 'Thoraipakkam store';
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salesman, setSalesman] = useState('Tamil');

  // Generate a realistic initial bill number e.g. INV-20260917-853
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD for input
  });
  const [billNumber, setBillNumber] = useState(() => {
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `INV-${yyyymmdd}-${rand}`;
  });

  // Table Rows (starts with 3 rows matching the screenshot)
  const [rows, setRows] = useState<ProductRow[]>([
    {
      id: 'row-1',
      sNo: '1',
      productId: '',
      productCode: '',
      productName: '',
      offers: [],
      qty: '',
      unit: '',
      rate: '',
      discount: 0,
      gst: 0,
      amount: 0
    },
    {
      id: 'row-2',
      sNo: '2',
      productId: '',
      productCode: '',
      productName: '',
      offers: [],
      qty: '',
      unit: '',
      rate: '',
      discount: 0,
      gst: 0,
      amount: 0
    },
    {
      id: 'row-3',
      sNo: '3',
      productId: '',
      productCode: '',
      productName: '',
      offers: [],
      qty: '',
      unit: '',
      rate: '',
      discount: 0,
      gst: 0,
      amount: 0
    }
  ]);

  // Additional Information
  const [discountReason, setDiscountReason] = useState('');
  const [givenBy, setGivenBy] = useState('');

  // Bill Summary
  const [packingCharges, setPackingCharges] = useState<number>(0);
  const [isDiscountChecked, setIsDiscountChecked] = useState(false);
  const [summaryDiscount, setSummaryDiscount] = useState<number>(0);
  const [isFreightChecked, setIsFreightChecked] = useState(false);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number | ''>('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Credit'>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryBoy, setDeliveryBoy] = useState('Ramesh (Delivery Partner)');

  // Modals
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchTargetRowIndex, setSearchTargetRowIndex] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Receipt Modal on Save
  const [savedInvoice, setSavedInvoice] = useState<PosInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Quick Customer Lookup on 10-digit mobile
  useEffect(() => {
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (cleanMobile.length >= 10) {
      // Check live accounts list
      const found = accounts.find((a: any) => {
        const phone = String(a.Phone_Number || a.Mobile_Number || a.Phone || a.mobile || '').replace(/\D/g, '');
        return phone.endsWith(cleanMobile) || cleanMobile.endsWith(phone);
      });
      if (found) {
        const name = found.Organization_Name || found.Company_Name || found.Account_Name || found.Name || found.companyName;
        if (name) {
          setCustomerName(name);
          toast.success(`Customer found: ${name}`);
          return;
        }
      }

      if (cleanMobile === '9876543210') {
        setCustomerName('Rajesh Kumar');
        toast.success('Customer found: Rajesh Kumar');
      } else if (cleanMobile === '9123456789') {
        setCustomerName('Priya Sharma');
        toast.success('Customer found: Priya Sharma');
      } else if (cleanMobile === '9988776655') {
        setCustomerName('Suresh Raina');
        toast.success('Customer found: Suresh Raina');
      } else if (!customerName) {
        setCustomerName('Walk-in Customer');
      }
    }
  }, [customerMobile, accounts]);

  // Recalculate row amount
  const calculateRowAmount = (qty: number, rate: number, discount: number, gst: number) => {
    const base = qty * rate;
    const discounted = base - (base * discount) / 100;
    const withGst = discounted + (discounted * gst) / 100;
    return Number(withGst.toFixed(2));
  };

  // Handle row change
  const handleRowChange = (index: number, field: keyof ProductRow, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (field === 'productCode') {
        current.productCode = value;
        // Search if matches existing product
        const matched = products.find(
          (p) =>
            p.sku.toLowerCase() === String(value).trim().toLowerCase() ||
            p.barcode === String(value).trim() ||
            p.name.toLowerCase() === String(value).trim().toLowerCase()
        );
        if (matched) {
          current.productId = matched.id;
          current.productName = matched.name;
          current.unit = matched.unit;
          current.rate = matched.price;
          current.gst = matched.taxRate;
          current.qty = current.qty ? current.qty : 1;
          current.discount = current.discount !== '' ? current.discount : 0;
          current.amount = calculateRowAmount(
            Number(current.qty),
            Number(current.rate),
            Number(current.discount),
            Number(current.gst)
          );
        }
      } else {
        (current as any)[field] = value;
      }

      if (['qty', 'rate', 'discount', 'gst'].includes(field as string)) {
        const q = parseFloat(String(current.qty)) || 0;
        const r = parseFloat(String(current.rate)) || 0;
        const d = parseFloat(String(current.discount)) || 0;
        const g = parseFloat(String(current.gst)) || 0;
        current.amount = calculateRowAmount(q, r, d, g);
      }

      next[index] = current;
      return next;
    });
  };

  // Add Product from modal or selection
  const selectProductForRow = (product: PosProduct, rowIndex?: number) => {
    setRows((prev) => {
      const next = [...prev];
      let targetIndex = rowIndex !== undefined ? rowIndex : -1;

      // If no specific row provided, find first empty row
      if (targetIndex === -1) {
        targetIndex = next.findIndex((r) => !r.productId);
      }
      // If still none, add new row
      if (targetIndex === -1) {
        targetIndex = next.length;
        next.push({
          id: `row-${Date.now()}`,
          sNo: String(next.length + 1),
          productId: '',
          productCode: '',
          productName: '',
          offers: [],
          qty: 1,
          unit: '',
          rate: '',
          discount: 0,
          gst: 0,
          amount: 0
        });
      }

      const currentQty = next[targetIndex].qty;
      const q = typeof currentQty === 'number' && Number(currentQty) > 0 ? currentQty : 1;
      const r = product.price;
      const d = typeof next[targetIndex].discount === 'number' ? next[targetIndex].discount : 0;
      const g = product.taxRate;

      next[targetIndex] = {
        ...next[targetIndex],
        productId: product.id,
        productCode: product.sku,
        productName: product.name,
        unit: product.unit,
        rate: r,
        qty: q,
        discount: d,
        gst: g,
        amount: calculateRowAmount(Number(q), Number(r), Number(d), Number(g))
      };

      return next;
    });
    toast.success(`Added ${product.name}`);
    setShowProductSearch(false);
  };

  // Add empty row
  const handleAddEmptyRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        sNo: String(prev.length + 1),
        productId: '',
        productCode: '',
        productName: '',
        offers: [],
        qty: '',
        unit: '',
        rate: '',
        discount: 0,
        gst: 0,
        amount: 0
      }
    ]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        // Reset row instead of deleting last
        return [
          {
            id: 'row-1',
            sNo: '1',
            productId: '',
            productCode: '',
            productName: '',
            offers: [],
            qty: '',
            unit: '',
            rate: '',
            discount: 0,
            gst: 0,
            amount: 0
          }
        ];
      }
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, idx) => ({ ...item, sNo: String(idx + 1) }));
    });
  };

  // Calculations
  const validRowsCount = rows.filter((r) => r.productId || (r.productName && r.amount > 0)).length;

  const subtotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [rows]);

  const totalAmount = useMemo(() => {
    const pack = Number(packingCharges) || 0;
    const disc = isDiscountChecked ? Number(summaryDiscount) || 0 : 0;
    const freight = isFreightChecked ? Number(freightCost) || 0 : 0;
    const net = subtotal + pack + freight - disc;
    return Math.max(0, Number(net.toFixed(2)));
  }, [subtotal, packingCharges, isDiscountChecked, summaryDiscount, isFreightChecked, freightCost]);

  const refund = useMemo(() => {
    if (amountReceived === '' || isNaN(Number(amountReceived))) return 0;
    return Number((Number(amountReceived) - totalAmount).toFixed(2));
  }, [amountReceived, totalAmount]);

  const paymentStatus = useMemo(() => {
    if (amountReceived !== '' && Number(amountReceived) >= totalAmount && totalAmount > 0) {
      return 'Paid';
    }
    return 'Pending';
  }, [amountReceived, totalAmount]);

  // Save Invoice Handler
  const handleSaveInvoice = () => {
    if (!customerMobile.trim()) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    if (validRowsCount === 0) {
      toast.error('At least one product item is required in the order');
      return;
    }

    const items: PosCartItem[] = rows
      .filter((r) => r.productId || (r.productName && r.amount > 0))
      .map((r) => {
        const prod = products.find((p) => p.id === r.productId) || {
          id: r.productId || `custom-${Date.now()}`,
          name: r.productName,
          sku: r.productCode,
          barcode: r.productCode,
          category: 'General',
          price: Number(r.rate) || 0,
          taxRate: Number(r.gst) || 0,
          stock: 100,
          unit: r.unit || 'Pcs'
        };
        const quantity = Number(r.qty) || 1;
        const rate = Number(r.rate) || 0;
        const discountPercent = Number(r.discount) || 0;
        const total = r.amount;
        const taxable = rate * quantity * (1 - discountPercent / 100);
        const taxAmount = (taxable * (Number(r.gst) || 0)) / 100;

        return {
          product: prod,
          quantity,
          rate,
          discountPercent,
          taxAmount,
          total
        };
      });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newInvoiceObj: PosInvoice = {
      id: editId || `inv-${Date.now()}`,
      invoiceNumber: billNumber,
      date: billDate,
      time: timeStr,
      customerName: customerName.trim(),
      customerPhone: customerMobile.trim(),
      storeName: storeName,
      delivery: isHomeDelivery ? deliveryAddress : undefined,
      items,
      subtotal,
      discountAmount: isDiscountChecked ? Number(summaryDiscount) || 0 : 0,
      taxAmount: items.reduce((sum, item) => sum + item.taxAmount, 0),
      roundOff: 0,
      totalAmount,
      amountReceived: amountReceived !== '' ? Number(amountReceived) : totalAmount,
      changeReturned: refund > 0 ? refund : 0,
      paymentMethod,
      status: paymentStatus as 'Paid' | 'Pending',
      cashierName: salesman,
      notes: discountReason ? `Discount: ${discountReason} (${givenBy || 'Authorized'})` : undefined
    };

    addCustomInvoice(newInvoiceObj);
    setSavedInvoice(newInvoiceObj);
    setShowReceiptModal(true);
    toast.success(isEditMode ? `Invoice ${billNumber} updated successfully!` : `Invoice ${billNumber} created successfully!`);
  };

  // Calculator State & Logic
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [calcShouldReset, setCalcShouldReset] = useState(false);

  const handleCalcNumber = (digit: string) => {
    if (calcShouldReset || calcDisplay === '0') {
      setCalcDisplay(digit);
      setCalcEquation(calcEquation === '0' ? digit : calcEquation + digit);
      setCalcShouldReset(false);
    } else {
      setCalcDisplay((prev) => prev + digit);
      setCalcEquation((prev) => prev + digit);
    }
  };

  const handleCalcOperator = (op: string) => {
    setCalcEquation((prev) => prev + ' ' + op + ' ');
    setCalcShouldReset(true);
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcEquation('');
    setCalcShouldReset(false);
  };

  const handleCalcEqual = () => {
    try {
      // Safe arithmetic evaluator
      const sanitized = calcEquation.replace(/[^0-9+\-*/. ]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      const formatted = Number(result.toFixed(2)).toString();
      setCalcDisplay(formatted);
      setCalcEquation(formatted);
      setCalcShouldReset(true);
    } catch (e) {
      setCalcDisplay('Error');
      setTimeout(handleCalcClear, 1200);
    }
  };

  const handleApplyCalcToAmount = () => {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) {
      setAmountReceived(val);
      toast.success(`Amount Received set to ₹${val.toFixed(2)}`);
      setShowCalculator(false);
    }
  };

  // Filtered products for modal
  const modalFilteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)
    );
  }, [products, productSearchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1f2937] pb-8 flex flex-col justify-between">
      <div className="max-w-[1600px] w-full mx-auto px-1 sm:px-2 py-1">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Back button + Page Title */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/pos-invoices')}
              className="bg-[#2a5d4c] hover:bg-[#1f483b] text-white p-2 rounded-[10px] transition-all duration-150 flex items-center justify-center shadow-sm"
              title="Back to Invoices"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F3B2C] tracking-tight">
              {isEditMode ? `Edit Invoice - ${billNumber}` : `Create New Bill - ${storeName}`}
            </h1>
          </div>

          {/* 4 Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Add New Product */}
            <button
              type="button"
              onClick={() => setShowAddProduct(true)}
              className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-emerald-300 text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all flex items-center justify-center shadow-sm"
              title="Add New Product"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Add New Customer */}
            <button
              type="button"
              onClick={() => {
                setNewCustomerPhone(customerMobile);
                setShowAddCustomer(true);
              }}
              className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-purple-200 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all flex items-center justify-center shadow-sm"
              title="Add New Customer"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Calculator */}
            <button
              type="button"
              onClick={() => setShowCalculator(true)}
              className="w-10 h-10 rounded-xl bg-[#FFFBEB] border border-amber-200 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white transition-all flex items-center justify-center shadow-sm"
              title="Calculator"
            >
              <Calculator className="w-5 h-5" />
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => {
                if (validRowsCount === 0) {
                  toast.error('Add at least one item to print bill');
                  return;
                }
                handleSaveInvoice();
              }}
              className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-rose-200 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-all flex items-center justify-center shadow-sm"
              title="Print Invoice"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Two Cards: Customer Information & Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
          {/* Customer Information (Left Card: 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#e0e0e0] p-3 shadow-none">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-[#0F3B2C]/10 text-[#0F3B2C] flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#0F3B2C]">Customer Information</h2>
              <span className="bg-rose-50 text-rose-500 border border-rose-200 text-[11px] px-2 py-0.5 rounded-full font-medium leading-none">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mobile Number */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="Enter 10 digit mobile number"
                  maxLength={10}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] focus:border-[#0F3B2C]"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] focus:border-[#0F3B2C]"
                />
              </div>

              {/* Salesman */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Salesman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={salesman}
                  disabled
                  className="w-full text-xs sm:text-sm border border-gray-200 bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details (Right Card: 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-[#e0e0e0] p-3 shadow-none">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-[#0F3B2C]/10 text-[#0F3B2C] flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#0F3B2C]">Invoice Details</h2>
              <span className="bg-rose-50 text-rose-500 border border-rose-200 text-[11px] px-2 py-0.5 rounded-full font-medium leading-none">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] focus:border-[#0F3B2C]"
                />
              </div>

              {/* Bill Number */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Bill Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] focus:border-[#0F3B2C]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table Card */}
        <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden mb-3 shadow-none">
          {/* Card Header */}
          <div className="p-2.5 bg-[#F9FAFB] border-b border-[#e0e0e0] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#0F3B2C]/10 text-[#0F3B2C] flex items-center justify-center">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#0F3B2C]">
                Order Items ({validRowsCount} items)
              </h2>
            </div>

            {/* Quick Product Search Icon */}
            <button
              type="button"
              onClick={() => {
                setSearchTargetRowIndex(null);
                setShowProductSearch(true);
              }}
              className="text-gray-500 hover:text-[#0F3B2C] transition-colors p-1 rounded-md hover:bg-gray-200"
              title="Search Products"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-white text-gray-800 font-semibold text-xs">
                  <th className="py-2 px-2.5 w-10 text-center">S.No</th>
                  <th className="py-2 px-2 w-14 text-center">Product Image</th>
                  <th className="py-2 px-2.5 min-w-[140px]">Product Code</th>
                  <th className="py-2 px-2.5 min-w-[170px]">Product Name</th>
                  <th className="py-2 px-2.5 w-20 text-center">Offers</th>
                  <th className="py-2 px-2.5 w-20">Qty</th>
                  <th className="py-2 px-2.5 w-16 text-center">Unit</th>
                  <th className="py-2 px-2.5 w-24">Rate</th>
                  <th className="py-2 px-2.5 w-24">Discount</th>
                  <th className="py-2 px-2.5 w-24">Gst( %)</th>
                  <th className="py-2 px-2.5 w-28 text-right">Amount</th>
                  <th className="py-2 px-2.5 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* S.No */}
                    <td className="py-1.5 px-2.5 text-center text-gray-700 font-medium">
                      {row.sNo}
                    </td>

                    {/* Product Image */}
                    <td className="py-1.5 px-2 text-center">
                      <div className="w-7 h-7 mx-auto rounded-full bg-gray-300 text-white flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-white fill-white" />
                      </div>
                    </td>

                    {/* Product Code with quick autocomplete datalist */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        list={`product-codes-${row.id}`}
                        value={row.productCode}
                        onChange={(e) => handleRowChange(index, 'productCode', e.target.value)}
                        placeholder="Product Code"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                      />
                      <datalist id={`product-codes-${row.id}`}>
                        {products.map((p) => (
                          <option key={p.id} value={p.sku}>
                            {p.name} - ₹{p.price}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    {/* Product Name */}
                    <td className="py-1.5 px-2.5 text-gray-700 text-xs truncate max-w-[200px]">
                      {row.productName || '-'}
                    </td>

                    {/* Offers */}
                    <td className="py-1.5 px-2.5 text-center text-gray-400 text-xs">
                      {row.offers.length > 0 ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {row.offers.length} offer
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Qty */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        min="0"
                        value={row.qty}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'qty',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-1.5 px-2.5 text-center text-gray-600 text-xs">
                      {row.unit || '-'}
                    </td>

                    {/* Rate */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.rate}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'rate',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-20 text-xs border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                      />
                    </td>

                    {/* Discount */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.discount}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'discount',
                            e.target.value === '' ? 0 : parseFloat(e.target.value)
                          )
                        }
                        className="w-20 text-xs border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                      />
                    </td>

                    {/* Gst( %) */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        min="0"
                        value={row.gst}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'gst',
                            e.target.value === '' ? 0 : parseFloat(e.target.value)
                          )
                        }
                        className="w-20 text-xs border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-1.5 px-2.5 text-right font-semibold text-gray-900 text-xs">
                      ₹ {row.amount.toFixed(2)}
                    </td>

                    {/* Action */}
                    <td className="py-1.5 px-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button Bar */}
          <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={handleAddEmptyRow}
              className="text-[#0F3B2C] hover:text-[#1a5d48] font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
            <span className="text-gray-400">
              Total items: {validRowsCount}
            </span>
          </div>
        </div>

        {/* Bottom Section: Additional Information & Bill Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
          {/* Additional Information (Left: 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-[#e0e0e0] p-3 shadow-none">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#374151]">Additional Information</h2>
            </div>

            <div className="space-y-3">
              {/* Discount Reason */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Discount Reason <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white text-gray-700"
                >
                  <option value="">Select discount reason</option>
                  <option value="Festival Offer">Festival Offer</option>
                  <option value="Bulk Purchase">Bulk Purchase</option>
                  <option value="Customer Loyalty">Customer Loyalty</option>
                  <option value="Seasonal Discount">Seasonal Discount</option>
                  <option value="Clearance Sale">Clearance Sale</option>
                  <option value="Manager Approval">Manager Approval</option>
                  <option value="Damaged Goods">Damaged Goods</option>
                </select>
              </div>

              {/* Given By */}
              <div>
                <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                  Given By <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={givenBy}
                  onChange={(e) => setGivenBy(e.target.value)}
                  placeholder="Name of person who given discount"
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                />
              </div>
            </div>
          </div>

          {/* Bill Summary (Right: 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#e0e0e0] p-0 shadow-none overflow-hidden">
            <table className="w-full text-xs sm:text-sm">
              <tbody className="divide-y divide-gray-100">
                {/* Subtotal */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Subtotal</td>
                  <td className="py-2 px-3 text-right font-semibold text-gray-900">
                    ₹ {subtotal.toFixed(2)}
                  </td>
                </tr>

                {/* Packing Charges */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Packing Charges</td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={packingCharges}
                      onChange={(e) => setPackingCharges(parseFloat(e.target.value) || 0)}
                      className="w-24 text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                    />
                  </td>
                </tr>

                {/* Discount */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDiscountChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsDiscountChecked(checked);
                          if (checked && summaryDiscount === 0 && subtotal > 0) {
                            setSummaryDiscount(Number((subtotal * 0.05).toFixed(2))); // 5% default
                          }
                        }}
                        className="rounded text-[#0F3B2C] focus:ring-[#0F3B2C]"
                      />
                      <span>Discount</span>
                    </label>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={summaryDiscount}
                      disabled={!isDiscountChecked}
                      onChange={(e) => setSummaryDiscount(parseFloat(e.target.value) || 0)}
                      className={`w-24 text-xs sm:text-sm border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] ${
                        !isDiscountChecked ? 'bg-gray-100 text-gray-400 border-gray-200' : 'border-gray-300'
                      }`}
                    />
                  </td>
                </tr>

                {/* Freight */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFreightChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsFreightChecked(checked);
                          if (checked && freightCost === 0) {
                            setFreightCost(50);
                          }
                        }}
                        className="rounded text-[#0F3B2C] focus:ring-[#0F3B2C]"
                      />
                      <span>Freight</span>
                    </label>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={freightCost}
                      disabled={!isFreightChecked}
                      onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                      className={`w-24 text-xs sm:text-sm border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] ${
                        !isFreightChecked ? 'bg-gray-100 text-gray-400 border-gray-200' : 'border-gray-300'
                      }`}
                    />
                  </td>
                </tr>

                {/* Amount Received */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Amount Received</td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={amountReceived}
                      placeholder="0.00"
                      onChange={(e) =>
                        setAmountReceived(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-24 text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                    />
                  </td>
                </tr>

                {/* Total Amount Row */}
                <tr className="bg-[#F9FAFB]">
                  <td className="py-2.5 px-3 font-bold text-gray-900">Total Amount</td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-lg text-[#0F3B2C]">
                    ₹ {totalAmount.toFixed(2)}
                  </td>
                </tr>

                {/* Refund to Customer */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Refund to Customer</td>
                  <td className="py-2 px-3 text-right font-semibold">
                    <span
                      className={
                        refund > 0
                          ? 'text-emerald-600'
                          : refund < 0
                          ? 'text-rose-600'
                          : 'text-gray-500'
                      }
                    >
                      ₹ {Math.abs(refund).toFixed(2)}{' '}
                      {refund > 0 && <span className="text-xs font-normal">(Refund)</span>}
                      {refund < 0 && <span className="text-xs font-normal">(Balance Due)</span>}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="bg-white rounded-lg border border-[#e0e0e0] p-3 shadow-none mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#0F3B2C]">Payment Method</h2>
              <span className="bg-rose-50 text-rose-500 border border-rose-200 text-[11px] px-2 py-0.5 rounded-full font-medium leading-none">
                Required
              </span>
            </div>

            {/* Home Delivery Checkbox */}
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isHomeDelivery}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsHomeDelivery(checked);
                  if (checked && !isFreightChecked) {
                    setIsFreightChecked(true);
                    setFreightCost(50);
                  }
                }}
                className="rounded text-[#0F3B2C] focus:ring-[#0F3B2C]"
              />
              <Home className="w-4 h-4 text-gray-500" />
              <span>Home Delivery</span>
            </label>
          </div>

          {/* If Home Delivery is Checked */}
          {isHomeDelivery && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8">
                <label className="block text-[12px] text-gray-600 mb-1 font-semibold">
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter complete delivery address with landmark, city, pincode"
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[12px] text-gray-600 mb-1 font-semibold">
                  Delivery Boy
                </label>
                <select
                  value={deliveryBoy}
                  onChange={(e) => setDeliveryBoy(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white"
                >
                  <option value="Ramesh (Delivery Partner)">Ramesh (Delivery Partner)</option>
                  <option value="Vignesh (Store Delivery)">Vignesh (Store Delivery)</option>
                  <option value="Karthik (Express)">Karthik (Express)</option>
                </select>
              </div>
            </div>
          )}

          {/* Payment Method Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* 4 Icon Buttons */}
            <div className="sm:col-span-6 flex items-center gap-2">
              {[
                { name: 'Cash', icon: Banknote, color: '#10B981', bg: 'bg-emerald-50' },
                { name: 'Card', icon: CreditCard, color: '#3B82F6', bg: 'bg-blue-50' },
                { name: 'UPI', icon: QrCode, color: '#8B5CF6', bg: 'bg-purple-50' },
                { name: 'Credit', icon: FileText, color: '#F59E0B', bg: 'bg-amber-50' }
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = paymentMethod === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setPaymentMethod(m.name as any)}
                    className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-2 shadow-sm scale-105'
                        : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isSelected ? m.color : undefined,
                      backgroundColor: isSelected ? `${m.color}10` : 'white'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1 text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700">{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Transaction ID */}
            <div className="sm:col-span-3">
              <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                Transaction ID <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
              />
            </div>

            {/* Payment Status Chip */}
            <div className="sm:col-span-3">
              <label className="block text-[12px] text-gray-500 mb-1 font-medium">
                Payment Status
              </label>
              <div
                className={`text-center py-1.5 px-3 rounded-md text-xs font-semibold ${
                  paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {paymentStatus}
              </div>
            </div>
          </div>

          {/* Conditional Sub-panels */}
          {paymentMethod === 'Cash' && (
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-gray-700">Cash Payment:</span>{' '}
                <span className="text-gray-600">Total payable ₹ {totalAmount.toFixed(2)}</span>
              </div>
              {refund !== 0 && (
                <div
                  className={`font-semibold ${
                    refund > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {refund > 0
                    ? `Refund Due: ₹ ${refund.toFixed(2)}`
                    : `Balance Pending: ₹ ${Math.abs(refund).toFixed(2)}`}
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'UPI' && (
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex-1">
                <span className="font-semibold text-gray-700">UPI ID / VPA:</span>{' '}
                <span className="text-gray-600 font-mono">thoraipakkam.pos@okhdfcbank</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUpiQr(true)}
                className="px-3 py-1 bg-[#0F3B2C] text-white rounded text-xs font-semibold flex items-center gap-1 hover:bg-[#1f483b]"
              >
                <QrCode className="w-3.5 h-3.5" /> Show QR
              </button>
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Card Number (**** **** **** ****)"
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              />
              <input
                type="text"
                placeholder="MM/YY"
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              />
              <input
                type="password"
                placeholder="CVV (***)"
                maxLength={3}
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              />
            </div>
          )}

          {paymentMethod === 'Credit' && (
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Customer Account ID / Credit Ledger"
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              />
              <input
                type="date"
                defaultValue={
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
                className="border border-gray-300 rounded px-2 py-1 bg-white"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: Save & Cancel */}
        <div className="flex items-center justify-end gap-2.5 mb-6">
          <button
            type="button"
            onClick={handleSaveInvoice}
            className="bg-[#0F3B2C] hover:bg-[#1a5d48] text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> {isEditMode ? 'Update Invoice' : 'Save Invoice'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/pos-invoices')}
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16213e] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-xs overflow-hidden text-white">
            <div className="p-3 bg-[#0f3460] flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Calculator className="w-4 h-4 text-amber-400" /> POS Calculator
              </div>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#0d1b2a]">
              {/* Equation / Display */}
              <div className="bg-[#1b263b] rounded-xl p-3 mb-4 text-right border border-slate-700">
                <div className="text-[11px] text-gray-400 min-h-[16px]">
                  {calcEquation || '0'}
                </div>
                <div className="text-3xl font-extrabold text-[#00ffcc] tracking-tight">
                  {calcDisplay}
                </div>
              </div>

              {/* Calculator Keypad */}
              <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
                {['7', '8', '9', '/'].map((k) => (
                  <button
                    key={k}
                    onClick={() => (k === '/' ? handleCalcOperator(k) : handleCalcNumber(k))}
                    className={`h-11 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      k === '/' ? 'bg-[#f39c12] hover:bg-[#e67e22]' : 'bg-[#1b263b] hover:bg-[#273852]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['4', '5', '6', '*'].map((k) => (
                  <button
                    key={k}
                    onClick={() => (k === '*' ? handleCalcOperator(k) : handleCalcNumber(k))}
                    className={`h-11 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      k === '*' ? 'bg-[#f39c12] hover:bg-[#e67e22]' : 'bg-[#1b263b] hover:bg-[#273852]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['1', '2', '3', '-'].map((k) => (
                  <button
                    key={k}
                    onClick={() => (k === '-' ? handleCalcOperator(k) : handleCalcNumber(k))}
                    className={`h-11 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      k === '-' ? 'bg-[#f39c12] hover:bg-[#e67e22]' : 'bg-[#1b263b] hover:bg-[#273852]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['0', '.', '=', '+'].map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === '=') handleCalcEqual();
                      else if (k === '+') handleCalcOperator(k);
                      else handleCalcNumber(k);
                    }}
                    className={`h-11 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      k === '='
                        ? 'bg-[#00b894] hover:bg-[#00a383]'
                        : k === '+'
                        ? 'bg-[#f39c12] hover:bg-[#e67e22]'
                        : 'bg-[#1b263b] hover:bg-[#273852]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Calculator Actions */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCalcClear}
                  className="py-2 border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApplyCalcToAmount}
                  className="py-2 bg-[#00b894] hover:bg-[#00a383] text-white rounded-lg text-xs font-semibold"
                >
                  Apply to Amount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Search / Quick Add Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 bg-[#0F3B2C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Search className="w-4 h-4 text-emerald-300" /> Search Products
              </div>
              <button
                onClick={() => setShowProductSearch(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by product name, SKU, or barcode..."
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100">
              {modalFilteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No products matched your search.
                </div>
              ) : (
                modalFilteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectProductForRow(p, searchTargetRowIndex ?? undefined)}
                    className="py-2.5 px-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm">{p.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-3">
                        <span>SKU: {p.sku}</span>
                        <span>Unit: {p.unit}</span>
                        <span>Stock: {p.stock}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F3B2C] text-xs sm:text-sm">₹ {p.price.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">GST: {p.taxRate}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProductSearch(false)}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="p-3 bg-[#0F3B2C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <User className="w-4 h-4 text-purple-300" /> Add New Customer
              </div>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="10 digit phone number"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-[#0F3B2C]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-[#0F3B2C]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  placeholder="Address (Optional)"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-[#0F3B2C]"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCustomerPhone || newCustomerPhone.length !== 10) {
                    toast.error('Enter valid 10-digit mobile number');
                    return;
                  }
                  if (!newCustomerName) {
                    toast.error('Customer name is required');
                    return;
                  }
                  setCustomerMobile(newCustomerPhone);
                  setCustomerName(newCustomerName);
                  if (newCustomerAddress) {
                    setDeliveryAddress(newCustomerAddress);
                  }
                  toast.success(`Customer ${newCustomerName} added`);
                  setShowAddCustomer(false);
                }}
                className="px-4 py-1.5 bg-[#0F3B2C] text-white rounded font-medium hover:bg-[#1f483b]"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductCreated={(newProd) => {
          addProduct(newProd);
          selectProductForRow(newProd);
        }}
      />

      {/* UPI QR Code Modal */}
      {showUpiQr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden text-center">
            <div className="p-3 bg-[#0F3B2C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <QrCode className="w-4 h-4 text-emerald-300" /> UPI QR Code
              </div>
              <button onClick={() => setShowUpiQr(false)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4">
                <QrCode className="w-32 h-32 text-gray-800" />
              </div>
              <div className="mt-4 font-bold text-sm text-[#0F3B2C]">Bill No: {billNumber}</div>
              <div className="text-xs text-gray-500 mt-1">Scan using any UPI App (GPay, PhonePe, Paytm)</div>
              <div className="mt-2 text-base font-extrabold text-[#0F3B2C]">
                Amount: ₹ {totalAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setAmountReceived(totalAmount);
                  setShowUpiQr(false);
                  toast.success('UPI payment recorded!');
                }}
                className="px-5 py-1.5 bg-[#0F3B2C] text-white text-xs font-semibold rounded hover:bg-[#1f483b]"
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {savedInvoice && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            router.push('/pos-invoices');
          }}
          invoice={savedInvoice}
        />
      )}
    </div>
  );
}

export default function PosBillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#0F3B2C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Billing Terminal...</p>
      </div>
    }>
      <PosBillingContent />
    </Suspense>
  );
}
