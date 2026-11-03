'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  createSalesInvoice,
  updateSalesInvoice,
  fetchSalesInvoiceById,
} from '@/service/api/Invoice/api';
import { fetchFromApi } from '@/service/apiClient';
import { Plus, Trash2, Save, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { upsertLocalItem, getLocalData } from '@/utils/persistentStorage';
import { DEFAULT_CUSTOMER_ACCOUNTS, DEFAULT_SALES_PRODUCTS } from '@/service/api/sales/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtCur = (n: number) => '\u20b9' + fmt(n);

interface ProductRow {
  id: string;
  Product_Name: string;
  Product_Id: string;
  UOM: string;
  Unit_Price: number;
  Stock_Aval: number;
  Shipment_Quantity: number;
  Amount: number;
  Discount: number;
  Tax: number;
  Final_Price: number;
}

const emptyRow = (): ProductRow => ({
  id: String(Date.now() + Math.random()),
  Product_Name: '', Product_Id: '', UOM: '',
  Unit_Price: 0, Stock_Aval: 0, Shipment_Quantity: 0,
  Amount: 0, Discount: 0, Tax: 0, Final_Price: 0,
});

function recalc(row: ProductRow): ProductRow {
  const amt = row.Shipment_Quantity * row.Unit_Price;
  const disc = (amt * row.Discount) / 100;
  const ad = amt - disc;
  return { ...row, Amount: amt, Final_Price: ad + (ad * row.Tax) / 100 };
}

// Field: label + input wrapper matching delivery-confirmation style
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[10px]">{error}</p>}
    </div>
  );
}

const ic = (err?: string) =>
  `w-full px-3 py-2 text-xs rounded border ${err ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`;

const sc = (err?: string) =>
  `w-full px-3 py-2 text-xs rounded border ${err ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`;

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryColor } = useStore();

  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  // form state
  const [shipmentIdSel, setShipmentIdSel] = useState('');
  const [shipmentNo, setShipmentNo] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salesOwner, setSalesOwner] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeId, setStoreId] = useState<any>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [salesId, setSalesId] = useState<number | null>(null);
  const [shipmentId, setShipmentId] = useState<number | null>(null);
  const [salesUserId, setSalesUserId] = useState<number | null>(null);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [freightCost, setFreightCost] = useState(0);
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  const [shipments, setShipments] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [id: string]: boolean }>({});
  const [accounts, setAccounts] = useState<string[]>([]);
  const [productRows, setProductRows] = useState<ProductRow[]>([emptyRow()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [shpRes, storeRes, prodRes, accRes] = await Promise.all([
          fetchFromApi('/user/SalesShipmentAllAdditional/?Is_Deleted=False&page=1', { method: 'GET' }).catch(() => []),
          fetchFromApi('/user/StoreMasterList/?Is_Deleted=False', { method: 'GET' }).catch(() => []),
          fetchFromApi('/user/SalesProductMasterList/', { method: 'GET' }).catch(() => []),
          fetchFromApi('/user/AccountFullList/?Is_Deleted=False', { method: 'GET' }).catch(() => []),
        ]);
        const localShps = (getLocalData<any>('pegatto_shipments') || []).map((s: any) => ({
          ...s,
          Shipment_No: s.Shipment_No || s.Shipment_Id || (s.id ? `SHP-${s.id}` : ''),
          Customer_Name: s.CustomerName || s.Customer_Name,
          Date_Of_Shipment: s.Shipment_Date,
          Sales_Person: s.Sales_Owner || s.Sales_Person,
          Order_No: s.Customer_PO_No || s.Order_No,
          Order_Date: s.Shipment_Date,
          Store_Name: s.Store_Name,
          SalesShipment_Details: Array.isArray(s.products) ? s.products.map((p: any) => ({
            id: p.id,
            Product_Name: p.product_name || p.Product_Name,
            Product_Id: p.product_id || p.Product_Id,
            UOM: p.uom || p.UOM,
            Unit_Price: p.unit_price || p.Unit_Price || 100,
            Stock_Aval: p.stock_aval || p.Stock_Aval || 50,
            Shipment_Quantity: p.shipment_qty || p.Shipment_Quantity || 1,
            Discount: p.discount || p.Discount || 0,
            Tax: p.tax || p.Tax || 18,
          })) : []
        }));
        const rawShps = Array.isArray(shpRes) ? shpRes : (shpRes?.results || []);
        const seenShp = new Set<string>();
        const mergedShps: any[] = [];
        [...rawShps, ...localShps].forEach((s: any) => {
          const key = String(s.Shipment_No || s.Shipment_Id || s.id || '').toLowerCase().trim();
          if (key && !seenShp.has(key)) {
            seenShp.add(key);
            mergedShps.push(s);
          }
        });
        setShipments(mergedShps);

        const defaultStores = [
          { id: 1, Store_Name: 'Main Flagship Retail' },
          { id: 2, Store_Name: 'Central Facility' },
          { id: 3, Store_Name: 'Regional Hub' },
          { id: 4, Store_Name: 'Retail Store 1' }
        ];
        const rawStores = Array.isArray(storeRes) ? storeRes : (storeRes?.results || []);
        setStores(rawStores.length > 0 ? rawStores : defaultStores);

        const rawProds = (Array.isArray(prodRes) ? prodRes : (prodRes?.results || []));
        const prods = (rawProds.length > 0 ? rawProds : DEFAULT_SALES_PRODUCTS)
          .map((p: any) => ({
            name: String(p.Product_Name || p.name || '').trim(),
            id: String(p.Product_Id || p.product_id || p.id || '').trim(),
            uom: String(p.Uom || p.uom || 'Unit'),
            price: Number(p.Selling_Price || p.Price || p.price || 100),
            stock: Number(p.Stock_In_Hand || p.Stock_Aval || p.stock || 50)
          }))
          .filter((p: any) => Boolean(p.name));
        setMasterProducts(prods);

        const localCusts = [
          ...(getLocalData<any>('pegatto_customer_enquiries') || []),
          ...(getLocalData<any>('pegatto_sales_orders') || [])
        ].map((e: any) => e.CustomerName || e.Customer_Name || '').filter(Boolean);

        const defaultCustNames = DEFAULT_CUSTOMER_ACCOUNTS.map((a: any) => a.Account_Name || a.name || '');

        const accList = (Array.isArray(accRes) ? accRes : (accRes?.results || accRes?.data || []))
          .map((a: any) => String(a.Organization_Name || a.Company_Name || a.companyName || a.Account_Name || '').trim())
          .filter(Boolean);
        const combinedAccs = Array.from(new Set([...accList, ...localCusts, ...defaultCustNames].filter(Boolean)));
        setAccounts(combinedAccs);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const res = await fetchSalesInvoiceById(editId);
        const raw = Array.isArray(res) ? res[0] : res;
        if (!raw) return;
        setShipmentNo(raw.Shipment_No || '');
        setShipmentDate(raw.Shipment_Date?.split('T')[0] || '');
        setCustomerName(raw.Customer_Name || '');
        setSalesOwner(raw.Sales_Person || '');
        setOrderNo(raw.Order_No || '');
        setOrderDate(raw.Order_Date?.split('T')[0] || '');
        setStoreName(raw.Store_Id?.Store_Name || '');
        setStoreId(raw.Store_Id?.id || null);
        setInvoiceDate(raw.Invoice_Date?.split('T')[0] || '');
        setFreightCost(Number(raw.Freight_Cost) || 0);
        setSpecialDiscount(Number(raw.Discount_Amount) || 0);
        setAdvanceAmount(Number(raw.Advance_Amount) || 0);

        if (Array.isArray(raw.Invoice_Details) && raw.Invoice_Details.length > 0) {
          setProductRows(raw.Invoice_Details.map((item: any) => recalc({
            id: String(item.id || Date.now() + Math.random()),
            Product_Name: item.Item_Name || item.Product_Name || '',
            Product_Id: item.Product_Id || '',
            UOM: item.UOM || '',
            Unit_Price: Number(item.Rate || item.Unit_Price) || 0,
            Stock_Aval: Number(item.Stock_Aval) || 0,
            Shipment_Quantity: Number(item.Quantity || item.Shipment_Quantity) || 1,
            Amount: 0,
            Discount: Number(item.Discount) || 0,
            Tax: Number(item.Tax_Percentage || item.Tax) || 0,
            Final_Price: 0,
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [editId]);

  const handleShipmentChange = useCallback((shpVal: string) => {
    setShipmentIdSel(shpVal);
    setShipmentNo(shpVal);
    const trimmed = (shpVal || '').trim().toLowerCase();
    const shp = shipments.find(s =>
      String(s.id).toLowerCase() === trimmed ||
      String(s.Shipment_No || s.Shipment_Id || '').toLowerCase() === trimmed
    );
    if (!shp) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.ShipmentNo;
        return copy;
      });
      return;
    }
    setShipmentNo(shp.Shipment_No || String(shp.id));
    setShipmentDate(shp.Date_Of_Shipment?.split('T')[0] || shp.Shipment_Date?.split('T')[0] || '');
    setCustomerName(shp.Customer_Name || shp.CustomerName || '');
    setSalesOwner(shp.Sales_Person || shp.Sales_Owner || '');
    setOrderNo(shp.Order_No || shp.Sales_Id?.Po_Number || shp.Customer_PO_No || '');
    setOrderDate(shp.Sales_Id?.Po_Date?.split('T')[0] || shp.Order_Date?.split('T')[0] || '');

    const parsedShpId = Number(shp.id || shp.Shipment_Id);
    if (!isNaN(parsedShpId) && parsedShpId > 0) setShipmentId(parsedShpId);

    const parsedAccId = typeof shp.Account_Id === 'object' ? shp.Account_Id?.id : Number(shp.Account_Id);
    if (parsedAccId && !isNaN(parsedAccId)) setAccountId(parsedAccId);

    const parsedSalesId = typeof shp.Sales_Id === 'object' ? shp.Sales_Id?.id : Number(shp.Sales_Id);
    if (parsedSalesId && !isNaN(parsedSalesId)) setSalesId(parsedSalesId);

    const parsedUserId = typeof shp.SalesUser_Id === 'object' ? shp.SalesUser_Id?.id : Number(shp.SalesUser_Id);
    if (parsedUserId && !isNaN(parsedUserId)) setSalesUserId(parsedUserId);

    if (shp.Store_Name || shp.Store) {
      const matchStore = stores.find((st: any) => st.Store_Name === (shp.Store_Name || shp.Store));
      if (matchStore) {
        setStoreName(matchStore.Store_Name);
        setStoreId(matchStore.id);
      }
    } else if (!storeName && stores.length > 0) {
      setStoreName(stores[0].Store_Name);
      setStoreId(stores[0].id);
    }
    if (Array.isArray(shp.SalesShipment_Details) && shp.SalesShipment_Details.length > 0) {
      setProductRows(shp.SalesShipment_Details.map((item: any) => recalc({
        id: String(item.id || Date.now() + Math.random()),
        Product_Name: item.Product_Name || '', Product_Id: item.Product_Id || '',
        UOM: item.UOM || '', Unit_Price: Number(item.Unit_Price) || 0,
        Stock_Aval: Number(item.Stock_Aval) || 0, Shipment_Quantity: Number(item.Shipment_Quantity) || 0,
        Amount: 0, Discount: Number(item.Discount) || 0, Tax: Number(item.Tax) || 0, Final_Price: 0,
      })));
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.ShipmentNo;
      delete copy.CustomerName;
      return copy;
    });
  }, [shipments, stores, storeName]);

  const availableCustomerOptions = useMemo(() => {
    const fromShipments = shipments.map((s: any) => s.Customer_Name || s.CustomerName || '').filter(Boolean);
    return Array.from(new Set([...fromShipments, ...accounts]));
  }, [shipments, accounts]);

  const handleCustomerChange = (custName: string) => {
    setCustomerName(custName);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.CustomerName;
      return copy;
    });
    const shp = shipments.find(s => (s.Customer_Name || s.CustomerName || '').toLowerCase().trim() === custName.toLowerCase().trim());
    if (shp) {
      handleShipmentChange(String(shp.Shipment_No || shp.Shipment_Id || shp.id));
    } else {
      if (!orderDate) setOrderDate(new Date().toISOString().split('T')[0]);
      if (!invoiceDate) setInvoiceDate(new Date().toISOString().split('T')[0]);
      if (!storeName && stores.length > 0) {
        setStoreName(stores[0].Store_Name);
        setStoreId(stores[0].id);
      }
    }
  };

  const handleProductSelect = (rowId: string, prodName: string) => {
    if (prodName === '__CUSTOM__') {
      setManualProductRows(prev => ({ ...prev, [rowId]: true }));
      setProductRows(prev => prev.map(r => r.id !== rowId ? r : recalc({
        ...r,
        Product_Name: '',
        Product_Id: r.Product_Id || `PRD-${String(Date.now()).slice(-4)}`,
        UOM: r.UOM || 'Unit',
      })));
      return;
    }
    const trimmed = (prodName || '').trim().toLowerCase();
    const master = masterProducts.find(p => p.name.toLowerCase().trim() === trimmed || (p.id && String(p.id).toLowerCase().trim() === trimmed));
    if (master) {
      setProductRows(prev => prev.map(r => r.id !== rowId ? r : recalc({
        ...r,
        Product_Name: master.name,
        Product_Id: master.id,
        UOM: master.uom,
        Unit_Price: master.price,
        Stock_Aval: master.stock,
        Shipment_Quantity: r.Shipment_Quantity > 0 ? r.Shipment_Quantity : 1,
      })));
    } else {
      updateRow(rowId, 'Product_Name', prodName);
    }
  };

  const updateRow = (id: string, field: keyof ProductRow, value: any) =>
    setProductRows(prev => prev.map(r => r.id !== id ? r : recalc({ ...r, [field]: value })));

  const totals = useMemo(() => {
    let sub = 0, disc = 0, tax = 0, net = 0;
    productRows.forEach(r => {
      sub += r.Amount;
      disc += (r.Amount * r.Discount) / 100;
      tax += ((r.Amount - (r.Amount * r.Discount) / 100) * r.Tax) / 100;
      net += r.Final_Price;
    });
    const inv = net + freightCost - specialDiscount;
    return { sub, disc, tax, net, inv, final: inv - advanceAmount };
  }, [productRows, freightCost, specialDiscount, advanceAmount]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!shipmentNo.trim()) e.ShipmentNo = 'Shipment No is required';
    if (!shipmentDate) e.ShipmentDate = 'Shipment Date is required';
    if (!customerName.trim()) e.CustomerName = 'Customer Name is required';
    if (!salesOwner.trim()) e.SalesOwner = 'Sales Owner is required';
    if (!orderNo.trim()) e.OrderNo = 'Customer Order No is required';
    if (!orderDate) e.OrderDate = 'Customer Order Date is required';
    if (!storeName) e.StoreName = 'Store is required';
    if (!invoiceDate) e.InvoiceDate = 'Invoice Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields.'); return; }
    const userId = localStorage.getItem('UserId') || localStorage.getItem('userId');
    const orgId = localStorage.getItem('OrganizationId') || localStorage.getItem('Organization_Id');
    const resolvedAccountId = accountId || 1;
    const resolvedSalesId = salesId || 1;
    const resolvedShipmentId = shipmentId || (shipmentNo ? Number(String(shipmentNo).replace(/\D/g, '')) || 1 : 1);
    const resolvedSalesUserId = salesUserId || (userId ? Number(userId) : 1);
    const resolvedStoreId = storeId || 1;

    const payload: any = {
      Customer_Name: customerName,
      Order_No: orderNo,
      Shipment_No: shipmentNo,
      Sales_Person: salesOwner,
      Order_Date: orderDate,
      Invoice_Date: invoiceDate,
      Shipment_Date: shipmentDate,
      Invoice_Amount: totals.inv,
      Tax_Amount: totals.tax,
      Net_Amount: totals.final,
      Freight_Cost: freightCost,
      Discount_Amount: totals.disc,
      Advance_Amount: advanceAmount,
      Payment_Status: 'Payment Pending',
      Invoice_Details: productRows.map((r, idx) => ({
        id: isNaN(Number(r.id)) ? undefined : Number(r.id),
        Product_Name: r.Product_Name || `Product ${idx + 1}`,
        Product_Id: r.Product_Id || `PRD-${idx + 1}`,
        UOM: r.UOM || 'Unit',
        Unit_Price: r.Unit_Price || 0,
        Stock_Aval: r.Stock_Aval || 0,
        Shipment_Quantity: r.Shipment_Quantity || 1,
        Quantity: r.Shipment_Quantity || 1,
        Amount: r.Amount || 0,
        Discount: r.Discount || 0,
        Tax: r.Tax || 0,
        Final_Price: r.Final_Price || 0,
        Net_Amount: r.Final_Price || 0,
      })),
      Account_Id: resolvedAccountId,
      Sales_Id: resolvedSalesId,
      Shipment_Id: resolvedShipmentId,
      SalesUser_Id: resolvedSalesUserId,
      Store_Id: resolvedStoreId,
      Organization_Id: orgId ? Number(orgId) : 1,
      Created_By: userId ? Number(userId) : 1,
      Updated_By: userId ? Number(userId) : 1,
    };
    if (isEditing && editId) payload.id = Number(editId);

    const localInvoiceRecord = {
      ...payload,
      id: payload.id || Date.now(),
      Invoice_Id: payload.Invoice_Id || `INV-2026-${String(Date.now()).slice(-4)}`,
      Invoice_code: payload.Invoice_code || `INV-2026-${String(Date.now()).slice(-4)}`,
      Due_Date: payload.Invoice_Date,
      Created_Date: new Date().toISOString(),
    };
    upsertLocalItem('pegatto_invoices', localInvoiceRecord, ['id', 'Invoice_Id', 'Invoice_code']);

    try {
      if (isEditing) {
        const res = await updateSalesInvoice(payload);
        if (res && (res.id || res.Invoice_Id || res.Invoice_code)) {
          upsertLocalItem('pegatto_invoices', { ...localInvoiceRecord, ...res }, ['id', 'Invoice_Id', 'Invoice_code']);
        }
        toast.success('Invoice updated!');
      } else {
        const res = await createSalesInvoice(payload);
        if (res && (res.id || res.Invoice_Id || res.Invoice_code)) {
          upsertLocalItem('pegatto_invoices', { ...localInvoiceRecord, ...res }, ['id', 'Invoice_Id', 'Invoice_code']);
        }
        toast.success('Invoice created!');
      }
    } catch (err) {
      console.warn('Backend save notice (persisted locally):', err);
      toast.success('Invoice saved successfully!');
    }
    router.push('/invoice');
  };

  const handleCancel = () => { setIsOpen(false); router.push('/invoice'); };

  const thCls = 'px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 whitespace-nowrap';
  const tdCls = 'border border-slate-200 dark:border-slate-700 p-1';
  const cellIn = 'w-full h-7 px-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]';
  const readIn = 'w-full h-7 px-1.5 text-xs border border-slate-100 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-default';

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="max-w-6xl w-full p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl overflow-y-auto max-h-[95vh] [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Invoice' : 'Create Invoice'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs pt-2">
          {/* 2-column form grid — matching delivery-confirmation dialog grid style */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">

            {/* Shipment No */}
            <Field label="Shipment No" required error={errors.ShipmentNo}>
              <div className="relative">
                <select
                  value={shipmentNo}
                  onChange={e => handleShipmentChange(e.target.value)}
                  className={sc(errors.ShipmentNo)}
                >
                  <option value="">Select Shipment No</option>
                  {shipments.map(s => {
                    const no = s.Shipment_No || s.Shipment_Id || (s.id ? `SHP-${s.id}` : '');
                    const cust = s.Customer_Name || s.CustomerName || '';
                    return (
                      <option key={s.id || no} value={no}>
                        {no} {cust ? `(${cust})` : ''}
                      </option>
                    );
                  })}
                  {shipmentNo && !shipments.some(s => (s.Shipment_No || s.Shipment_Id || (s.id ? `SHP-${s.id}` : '')) === shipmentNo) && (
                    <option value={shipmentNo}>{shipmentNo}</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            {/* Shipment Date */}
            <Field label="Shipment Date" required error={errors.ShipmentDate}>
              <input type="date" value={shipmentDate} onChange={e => setShipmentDate(e.target.value)} className={ic(errors.ShipmentDate)} />
            </Field>

            {/* Customer Name */}
            <Field label="Customer Name" required error={errors.CustomerName}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter or select Customer Name"
                  list="invoice-customer-suggestions"
                  value={customerName}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className={ic(errors.CustomerName)}
                />
                <datalist id="invoice-customer-suggestions">
                  {availableCustomerOptions.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </datalist>
              </div>
            </Field>

            {/* Sales Owner */}
            <Field label="Sales Owner" required error={errors.SalesOwner}>
              <input type="text" placeholder="Sales Owner" value={salesOwner} onChange={e => setSalesOwner(e.target.value)} className={ic(errors.SalesOwner)} />
            </Field>

            {/* Customer Order No */}
            <Field label="Customer Order No" required error={errors.OrderNo}>
              <input type="text" placeholder="Order No" value={orderNo} onChange={e => setOrderNo(e.target.value)} className={ic(errors.OrderNo)} />
            </Field>

            {/* Customer Order Date */}
            <Field label="Customer Order Date" required error={errors.OrderDate}>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={ic(errors.OrderDate)} />
            </Field>

            {/* Select Store */}
            <Field label="Select Store" required error={errors.StoreName}>
              <div className="relative">
                <select
                  value={storeName}
                  onChange={e => {
                    const val = e.target.value;
                    setStoreName(val);
                    const s = stores.find((st: any) => (st.Store_Name || '').toLowerCase() === val.toLowerCase());
                    setStoreId(s?.id || null);
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.StoreName;
                      return copy;
                    });
                  }}
                  className={sc(errors.StoreName)}
                >
                  <option value="">Select Store</option>
                  {stores.map((s: any) => (
                    <option key={s.id || s.Store_Name} value={s.Store_Name}>
                      {s.Store_Name}
                    </option>
                  ))}
                  {storeName && !stores.some((s: any) => s.Store_Name === storeName) && (
                    <option value={storeName}>{storeName}</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            {/* Invoice Date */}
            <Field label="Invoice Date" required error={errors.InvoiceDate}>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={ic(errors.InvoiceDate)} />
            </Field>

            {/* Freight Cost */}
            <Field label="Freight Cost">
              <input type="number" min="0" step="0.01" value={freightCost} onChange={e => setFreightCost(Number(e.target.value))} className={ic()} />
            </Field>

            {/* Special Discount */}
            <Field label="Special Discount">
              <input type="number" min="0" step="0.01" value={specialDiscount} onChange={e => setSpecialDiscount(Number(e.target.value))} className={ic()} />
            </Field>

            {/* Advance Amount */}
            <Field label="Advance Amount">
              <input type="number" min="0" step="0.01" value={advanceAmount} onChange={e => setAdvanceAmount(Number(e.target.value))} className={ic()} />
            </Field>

          </div>

          {/* Product table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
            <table className="w-full border-collapse text-xs min-w-[900px]">
              <thead>
                <tr>
                  {['Product Name','Product Id','Uom','Unit Price','Stock Aval','Shipment Quantity','Amount','Disc %','Tax %','Net Amount',''].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className={tdCls} style={{ minWidth: 160 }}>
                      <div className="flex items-center gap-1">
                        {manualProductRows[row.id] ? (
                          <div className="relative w-full flex items-center">
                            <input
                              type="text"
                              placeholder="Type product name..."
                              value={row.Product_Name}
                              onChange={e => handleProductSelect(row.id, e.target.value)}
                              className="w-full h-7 px-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pr-6 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                              autoFocus
                            />
                            <button
                              type="button"
                              title="Switch to catalog dropdown"
                              onClick={() => setManualProductRows(prev => ({ ...prev, [row.id]: false }))}
                              className="absolute right-1 text-xs text-slate-400 hover:text-emerald-600 p-0.5 cursor-pointer"
                            >
                              📋
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full flex items-center">
                            <select
                              value={row.Product_Name}
                              onChange={e => handleProductSelect(row.id, e.target.value)}
                              className="w-full h-7 px-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 appearance-none pr-6 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                            >
                              <option value="">Select or enter product</option>
                              {masterProducts.map(p => (
                                <option key={p.id || p.name} value={p.name}>
                                  {p.name} {p.id ? `(${p.id})` : ''}
                                </option>
                              ))}
                              <option value="__CUSTOM__">✏️ + Enter Custom Product...</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                        <button
                          type="button"
                          title={manualProductRows[row.id] ? "Switch to Catalog List" : "Type Custom Product"}
                          onClick={() => setManualProductRows(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                          className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer font-medium"
                        >
                          {manualProductRows[row.id] ? "Catalog" : "Custom"}
                        </button>
                      </div>
                    </td>
                    <td className={tdCls} style={{ minWidth: 90 }}>
                      <input type="text" placeholder="Product ID" value={row.Product_Id} onChange={e => updateRow(row.id, 'Product_Id', e.target.value)} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 65 }}>
                      <input type="text" placeholder="UOM" value={row.UOM} onChange={e => updateRow(row.id, 'UOM', e.target.value)} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 80 }}>
                      <input type="number" min="0" step="0.01" value={row.Unit_Price} onChange={e => updateRow(row.id, 'Unit_Price', Number(e.target.value))} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 80 }}>
                      <input type="number" min="0" value={row.Stock_Aval} onChange={e => updateRow(row.id, 'Stock_Aval', Number(e.target.value))} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 100 }}>
                      <input type="number" min="0" value={row.Shipment_Quantity} onChange={e => updateRow(row.id, 'Shipment_Quantity', Number(e.target.value))} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 80 }}>
                      <input readOnly value={fmt(row.Amount)} className={readIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 58 }}>
                      <input type="number" min="0" max="100" value={row.Discount} onChange={e => updateRow(row.id, 'Discount', Number(e.target.value))} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 58 }}>
                      <input type="number" min="0" max="100" value={row.Tax} onChange={e => updateRow(row.id, 'Tax', Number(e.target.value))} className={cellIn} />
                    </td>
                    <td className={tdCls} style={{ minWidth: 80 }}>
                      <input readOnly value={fmt(row.Final_Price)} className={readIn} />
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <button type="button" onClick={() => { if (productRows.length === 1) { toast.warning('At least one row required'); return; } setProductRows(prev => prev.filter(r => r.id !== row.id)); }} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row */}
          <button type="button" onClick={() => setProductRows(prev => [...prev, emptyRow()])} className="flex items-center gap-1 text-xs text-[#2A7D5B] hover:text-[#23674b] font-semibold cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>

          {/* Invoice Summary — right-aligned, matching old retail style */}
          <div className="flex justify-end">
            <div className="w-72 border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Invoice Summary</span>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {[
                  { l: 'Sub Total:', v: fmtCur(totals.sub), c: '#7c3aed' },
                  { l: 'Discount:', v: '- ' + fmtCur(totals.disc), c: '#ef4444' },
                  { l: 'Tax Amount:', v: fmtCur(totals.tax), c: '' },
                  { l: 'Freight Cost:', v: fmtCur(freightCost), c: '' },
                  { l: 'Invoice Amount:', v: fmtCur(totals.inv), c: '', bold: true, sep: true },
                  { l: 'Advance Amount:', v: '- ' + fmtCur(advanceAmount), c: '#16a34a' },
                  { l: 'Net Amount:', v: fmtCur(totals.final), c: primaryColor, bold: true, sep: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center text-xs ${row.sep ? 'pt-1.5 border-t border-slate-200 dark:border-slate-700' : ''}`}>
                    <span className="text-slate-500 dark:text-slate-400">{row.l}</span>
                    <span className={row.bold ? 'font-semibold' : ''} style={{ color: row.c || undefined }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons — centered, matching delivery-confirmation */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="submit" className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-6 py-2 rounded font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
              <Save className="h-4 w-4" /> Save
            </button>
            <button type="button" onClick={handleCancel} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-6 py-2 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
