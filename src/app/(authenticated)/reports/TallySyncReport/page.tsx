'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Calendar,
  Receipt,
  DollarSign,
  Clock,
  ArrowUpDown,
  Building2,
  ChevronDown,
  Settings,
  X,
  Landmark,
  ExternalLink,
  BarChart3,
  Store,
  Layers,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  User,
  Phone,
  Hash,
  MoreVertical,
  Download,
  Copy,
  Package,
  Truck,
  Box
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  fetchTallyReportInvoices,
  syncInvoiceToTally,
  syncMultipleInvoicesToTally,
  invalidateTallyInvoicesCache,
} from '@/api/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { useTallyReportInvoices, TALLY_INVOICES_QUERY_KEY } from '@/service/api/Invoice';
import { usePosInvoiceStore } from '@/store/usePosInvoiceStore';
import { fetchSalesInvoiceById } from '@/service/api/Invoice/api';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TallyConfigurationModal from '@/components/layout/TallyConfigurationModal';

/**
 * Standardizes line items across POS store, local storage, and various backend schemas
 */
function normalizeInvoiceItems(rawItems: any[]): any[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((it: any, idx: number) => {
    const prod = it.product || {};
    const name =
      it.name ||
      it.Product_Name ||
      it.Item_Name ||
      it.product_name ||
      it.item_name ||
      it.title ||
      prod.name ||
      prod.title ||
      `Item #${idx + 1}`;
    const sku = String(it.sku || it.Product_Id || it.Product_Code || it.item_code || prod.sku || prod.id || '');
    const quantity = Number(it.quantity || it.qty || it.Quantity || it.Shipment_Quantity || 1);
    const rate = Number(it.rate || it.price || it.Unit_Price || it.unit_price || it.Rate || prod.price || 0);
    const taxRate = Number(it.taxRate || it.Tax_Percentage || it.Tax || it.gst || prod.taxRate || 0);
    const tax = Number(
      it.taxAmount ||
      it.tax ||
      it.Tax_Amount ||
      it.Tax ||
      (taxRate > 0 ? (rate * quantity * taxRate) / 100 : 0)
    );
    const discount = Number(it.discountPercent || it.discount || it.Discount || 0);
    
    // Prioritize Amount / amount line calculations over raw Net_Amount strings
    let total = 0;
    if (it.Amount !== undefined && it.Amount !== null && Number(it.Amount) > 0) {
      total = Number(it.Amount);
    } else if (it.amount !== undefined && it.amount !== null && Number(it.amount) > 0) {
      total = Number(it.amount);
    } else if (it.total !== undefined && it.total !== null && Number(it.total) > 0) {
      total = Number(it.total);
    } else if (it.totalAmount !== undefined && it.totalAmount !== null && Number(it.totalAmount) > 0) {
      total = Number(it.totalAmount);
    } else if (it.Final_Price !== undefined && it.Final_Price !== null && Number(it.Final_Price) > 0) {
      total = Number(it.Final_Price);
    } else if (it.Net_Amount !== undefined && it.Net_Amount !== null && Number(it.Net_Amount) > 0) {
      total = Number(it.Net_Amount);
    } else {
      total = Math.max(0, rate * quantity - discount + tax);
    }

    const uom = it.unit || it.UOM || prod.unit || 'Unit';

    return {
      id: String(it.id || it.Product_Id || `item-${idx + 1}`),
      name,
      Product_Name: name,
      Item_Name: name,
      sku,
      quantity,
      qty: quantity,
      rate,
      price: rate,
      taxRate,
      tax,
      taxAmount: tax,
      discount,
      total,
      totalAmount: total,
      uom,
    };
  });
}

export default function TallySyncReportPage() {
  const { primaryColor } = useStore();
  const queryClient = useQueryClient();
  const { data: serverInvoices, isLoading: queryLoading, refetch: refetchInvoices } = useTallyReportInvoices();

  const [invoices, setInvoices] = useState<any[]>([]);

  // Keep local invoices state synchronized with TanStack Query cache
  useEffect(() => {
    if (serverInvoices && Array.isArray(serverInvoices)) {
      setInvoices(serverInvoices);
    }
  }, [serverInvoices]);

  const loading = queryLoading && invoices.length === 0;
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isMultiSyncing, setIsMultiSyncing] = useState(false);
  const [multiSyncProgress, setMultiSyncProgress] = useState({ current: 0, total: 0, currentInvoiceId: '' });
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [activeView, setActiveView] = useState<'records' | 'overview'>('records');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Single Record Overview Modal state
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isRecordOverviewOpen, setIsRecordOverviewOpen] = useState(false);
  const [isLoadingRecordItems, setIsLoadingRecordItems] = useState(false);

  // Asynchronously resolve line items and full financial charges from backend/stores
  const enrichRecordDetails = async (rec: any) => {
    if (!rec) return rec;

    // Check if record has already been fully enriched with backend details
    if (rec._isEnriched && Array.isArray(rec.items) && rec.items.length > 0) {
      return rec;
    }

    const invoiceId = String(rec.Invoice_Id || rec.invoiceNumber || rec.id || '').trim();
    const rawId = rec.id || rec.Invoice_Id;

    let bkItem: any = null;

    // 1. Primary: Direct lookup from backend database
    try {
      if (rawId && /^\d+$/.test(String(rawId))) {
        const res = await fetchSalesInvoiceById(rawId);
        const data = res?.data || res?.results || res;
        bkItem = Array.isArray(data) ? data[0] : (data?.id ? data : null);
      }

      // If not found or rawId is string code, search via SalesInvoiceSearch
      if (!bkItem && invoiceId) {
        const { fetchFromApi } = await import('@/service/apiClient');
        const searchRes = await fetchFromApi(`/user/SalesInvoiceSearch/?search=${encodeURIComponent(invoiceId)}`, { method: 'GET' });
        const list = Array.isArray(searchRes) ? searchRes : (searchRes?.results || []);
        bkItem = list.find(
          (item: any) =>
            String(item.Invoice_Id || item.Invoice_code || item.id).toLowerCase() === invoiceId.toLowerCase()
        );

        // If found from search, fetch full details by numeric ID if items are not yet included
        if (bkItem?.id && /^\d+$/.test(String(bkItem.id)) && (!bkItem.Invoice_Details || bkItem.Invoice_Details.length === 0)) {
          try {
            const detailRes = await fetchSalesInvoiceById(bkItem.id);
            const detailData = detailRes?.data || detailRes?.results || detailRes;
            const fullBk = Array.isArray(detailData) ? detailData[0] : (detailData?.id ? detailData : null);
            if (fullBk) {
              bkItem = { ...bkItem, ...fullBk };
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Backend fetch failed for invoice', invoiceId, e);
    }

    if (bkItem) {
      const rawItems =
        bkItem.Invoice_Details ||
        bkItem.SalesInvoice_Details ||
        bkItem.items ||
        bkItem.Product_Details ||
        bkItem.details ||
        [];
      const norm = normalizeInvoiceItems(rawItems);

      return {
        ...rec,
        ...bkItem,
        _isEnriched: true,
        items: norm,
        Invoice_Details: norm,
        Freight_Cost: Number(bkItem.Freight_Cost !== undefined && bkItem.Freight_Cost !== null ? bkItem.Freight_Cost : rec.Freight_Cost || 0),
        Packing_Charges: Number(bkItem.Packing_Charges !== undefined && bkItem.Packing_Charges !== null ? bkItem.Packing_Charges : rec.Packing_Charges || 0),
        Discount_Amount: Number(bkItem.Discount_Amount !== undefined && bkItem.Discount_Amount !== null ? bkItem.Discount_Amount : rec.Discount_Amount || 0),
        Amount_Received: Number(bkItem.Amount_Received ?? rec.Amount_Received ?? (bkItem.Is_Paid ? bkItem.Net_Amount : 0)),
        Refund_Amount: Number(bkItem.Refund_Amount ?? rec.Refund_Amount ?? 0),
        Store_Name: bkItem.Store_Id?.Store_Name || bkItem.Store_Name || rec.Store_Name || 'Default Store',
        Customer_Name: bkItem.Customer_Name || rec.Customer_Name || 'Walk-in Customer',
        Customer_Phone: bkItem.Customer_Mobile || bkItem.Customer_Phone || rec.Customer_Phone || '',
        Payment_Method: bkItem.Payment_Method || rec.Payment_Method || 'Cash',
        Is_Paid: bkItem.Is_Paid !== undefined ? bkItem.Is_Paid : rec.Is_Paid,
      };
    }

    // 2. Secondary: Check usePosInvoiceStore for preloaded items
    try {
      const posStoreInvs = usePosInvoiceStore?.getState?.()?.invoices || [];
      const matchPos = posStoreInvs.find(
        (p: any) =>
          String(p.invoiceNumber || p.id).toLowerCase() === invoiceId.toLowerCase()
      );
      if (matchPos && Array.isArray(matchPos.items) && matchPos.items.length > 0) {
        const norm = normalizeInvoiceItems(matchPos.items);
        return {
          ...rec,
          _isEnriched: true,
          items: norm,
          Invoice_Details: norm,
          Freight_Cost: Number(rec.Freight_Cost || 0),
          Packing_Charges: Number(rec.Packing_Charges || 0),
          Discount_Amount: Number(matchPos.discountAmount || rec.Discount_Amount || 0),
          Amount_Received: Number(matchPos.amountReceived || rec.Amount_Received || 0),
        };
      }
    } catch {}

    // 3. Check local persistent storage
    try {
      const { getLocalData } = await import('@/utils/persistentStorage');
      const posLocal = getLocalData<any>('pegatto_pos_invoices');
      const invLocal = getLocalData<any>('pegatto_invoices');
      const matchLocal = [...posLocal, ...invLocal].find(
        (p: any) =>
          String(p.invoiceNumber || p.Invoice_Id || p.id).toLowerCase() === invoiceId.toLowerCase()
      );
      const localItems = matchLocal?.items || matchLocal?.Invoice_Details;
      if (Array.isArray(localItems) && localItems.length > 0) {
        const norm = normalizeInvoiceItems(localItems);
        return {
          ...rec,
          _isEnriched: true,
          items: norm,
          Invoice_Details: norm,
          Freight_Cost: Number(matchLocal.Freight_Cost || rec.Freight_Cost || 0),
          Packing_Charges: Number(matchLocal.Packing_Charges || rec.Packing_Charges || 0),
          Discount_Amount: Number(matchLocal.Discount_Amount || rec.Discount_Amount || 0),
          Amount_Received: Number(matchLocal.Amount_Received || rec.Amount_Received || 0),
        };
      }
    } catch {}

    // 4. Fallback item so item breakdown is never blank
    const totalVal = Number(rec.Net_Amount || rec.totalAmount || rec.Invoice_Amount || 0);
    const taxVal = Number(rec.Tax_Amount || rec.taxAmount || 0);
    const baseVal = Number(rec.Invoice_Amount || rec.subtotal || Math.max(0, totalVal - taxVal));
    const fallback = [
      {
        id: `item-${invoiceId || '1'}`,
        name: rec.Order_No
          ? `Sales Order #${rec.Order_No} Items`
          : (rec.Store_Name ? `${rec.Store_Name} - Retail Goods` : 'Standard Retail Goods'),
        Product_Name: rec.Order_No
          ? `Sales Order #${rec.Order_No} Items`
          : (rec.Store_Name ? `${rec.Store_Name} - Retail Goods` : 'Standard Retail Goods'),
        sku: invoiceId || 'GEN-001',
        quantity: 1,
        qty: 1,
        rate: baseVal,
        price: baseVal,
        tax: taxVal,
        taxAmount: taxVal,
        taxRate: baseVal > 0 ? Math.round((taxVal / baseVal) * 100) : 0,
        discount: 0,
        total: totalVal,
        totalAmount: totalVal,
        uom: 'Unit',
      },
    ];

    return { ...rec, items: fallback, Invoice_Details: fallback };
  };

  // Open modal and load full line item details
  const handleOpenRecordOverview = async (record: any) => {
    if (!record) return;
    setSelectedRecord(record);
    setIsRecordOverviewOpen(true);

    setIsLoadingRecordItems(true);
    try {
      const enriched = await enrichRecordDetails(record);
      setSelectedRecord(enriched);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.Invoice_Id === enriched.Invoice_Id || inv.id === enriched.id ? enriched : inv
        )
      );
    } catch (err) {
      console.error('Error enriching record overview:', err);
    } finally {
      setIsLoadingRecordItems(false);
    }
  };

  // Memoized line items for selectedRecord (including product lines and extra charges)
  const displayItems = useMemo(() => {
    if (!selectedRecord) return [];

    let baseItems: any[] = [];
    if (Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0) {
      baseItems = [...selectedRecord.items];
    } else if (Array.isArray(selectedRecord.Invoice_Details) && selectedRecord.Invoice_Details.length > 0) {
      baseItems = normalizeInvoiceItems(selectedRecord.Invoice_Details);
    } else {
      const totalVal = Number(selectedRecord.Net_Amount || selectedRecord.totalAmount || selectedRecord.Invoice_Amount || 0);
      const taxVal = Number(selectedRecord.Tax_Amount || selectedRecord.taxAmount || 0);
      const baseVal = Number(selectedRecord.Invoice_Amount || selectedRecord.subtotal || Math.max(0, totalVal - taxVal));
      baseItems = [
        {
          id: `item-${selectedRecord.Invoice_Id || '1'}`,
          name: selectedRecord.Order_No
            ? `Sales Order #${selectedRecord.Order_No} Items`
            : (selectedRecord.Store_Name ? `${selectedRecord.Store_Name} - Retail Goods` : 'Standard Retail Goods'),
          Product_Name: selectedRecord.Order_No
            ? `Sales Order #${selectedRecord.Order_No} Items`
            : (selectedRecord.Store_Name ? `${selectedRecord.Store_Name} - Retail Goods` : 'Standard Retail Goods'),
          sku: selectedRecord.Invoice_Id || 'GEN-001',
          quantity: 1,
          qty: 1,
          rate: baseVal,
          price: baseVal,
          tax: taxVal,
          taxAmount: taxVal,
          taxRate: baseVal > 0 ? Math.round((taxVal / baseVal) * 100) : 0,
          discount: 0,
          total: totalVal,
          totalAmount: totalVal,
          uom: 'Unit',
        },
      ];
    }

    // Filter out previous extra charge lines to avoid duplicates
    baseItems = baseItems.filter((it: any) => !it.isExtraCharge);

    // If invoice has Freight or Packing charges, append them as transparent line items
    const freightCost = Number(selectedRecord.Freight_Cost || 0);
    const packingCharges = Number(selectedRecord.Packing_Charges || 0);

    if (freightCost > 0) {
      baseItems.push({
        id: `extra-freight-${selectedRecord.Invoice_Id}`,
        name: 'Freight & Delivery Charges',
        Product_Name: 'Freight & Delivery Charges',
        sku: 'FREIGHT',
        quantity: 1,
        qty: 1,
        rate: freightCost,
        price: freightCost,
        tax: 0,
        taxAmount: 0,
        taxRate: 0,
        discount: 0,
        total: freightCost,
        totalAmount: freightCost,
        uom: 'Shipment',
        isExtraCharge: true,
        chargeType: 'freight',
      });
    }

    if (packingCharges > 0) {
      baseItems.push({
        id: `extra-packing-${selectedRecord.Invoice_Id}`,
        name: 'Packing & Packaging Charges',
        Product_Name: 'Packing & Packaging Charges',
        sku: 'PACKING',
        quantity: 1,
        qty: 1,
        rate: packingCharges,
        price: packingCharges,
        tax: 0,
        taxAmount: 0,
        taxRate: 0,
        discount: 0,
        total: packingCharges,
        totalAmount: packingCharges,
        uom: 'Package',
        isExtraCharge: true,
        chargeType: 'packing',
      });
    }

    return baseItems;
  }, [selectedRecord]);

  // Comprehensive financial summary calculation for selectedRecord
  const recordFinancials = useMemo(() => {
    if (!selectedRecord) return null;

    const productItems = displayItems.filter((it: any) => !it.isExtraCharge);
    const itemsSubtotal = productItems.reduce(
      (sum: number, it: any) => sum + Number(it.total || (Number(it.rate || 0) * Number(it.quantity || 1))),
      0
    );

    const freightCost = Number(selectedRecord.Freight_Cost || 0);
    const packingCharges = Number(selectedRecord.Packing_Charges || 0);
    const extraCharges = freightCost + packingCharges;
    const discountAmount = Number(selectedRecord.Discount_Amount || 0);
    const taxAmount = Number(selectedRecord.Tax_Amount || 0);
    const cgst = Number(selectedRecord.CGST_Amount || (taxAmount / 2));
    const sgst = Number(selectedRecord.SGST_Amount || (taxAmount / 2));
    const taxableBase = Number(selectedRecord.Invoice_Amount || (itemsSubtotal + extraCharges - discountAmount));
    const netTotal = Number(selectedRecord.Net_Amount || (taxableBase + taxAmount));
    const amountReceived = Number(
      selectedRecord.Amount_Received !== undefined && selectedRecord.Amount_Received !== null && Number(selectedRecord.Amount_Received) > 0
        ? selectedRecord.Amount_Received
        : (selectedRecord.Is_Paid ? netTotal : 0)
    );
    const changeReturned = amountReceived > netTotal ? (amountReceived - netTotal) : Number(selectedRecord.Refund_Amount || 0);
    const balanceDue = Math.max(0, netTotal - amountReceived);

    return {
      productItemsCount: productItems.length,
      itemsSubtotal,
      freightCost,
      packingCharges,
      extraCharges,
      discountAmount,
      taxAmount,
      cgst,
      sgst,
      taxableBase,
      netTotal,
      amountReceived,
      changeReturned,
      balanceDue,
    };
  }, [selectedRecord, displayItems]);

  // Reload invoices on user-triggered refresh via TanStack Query
  const loadInvoices = async () => {
    invalidateTallyInvoicesCache();
    await refetchInvoices();
  };

  // Sync a single invoice to Tally
  const handleSyncToTally = async (rowOrId: any) => {
    if (!rowOrId) return;
    const isObj = typeof rowOrId === 'object' && rowOrId !== null;
    const invoiceIdStr = isObj ? String(rowOrId.Invoice_Id || rowOrId.id || '') : String(rowOrId);
    setSyncingId(invoiceIdStr);

    try {
      const res = await syncInvoiceToTally(rowOrId);
      if (res?.success === true || (res?.status === 200 && res?.success !== false) || res?.status === 'success') {
        const tallyId = res?.tally_id || res?.Tally_Id || invoiceIdStr;
        toast.success(res?.message || `Invoice ${invoiceIdStr} synced to Tally successfully!`, {
          description: `Tally ID: ${tallyId} has been generated and recorded.`,
        });
        setConnectionError(null);

        // Optimistically update local invoice state with Tally_Id and SUCCESS
        setInvoices((prev) =>
          prev.map((inv) =>
            (inv.Invoice_Id === invoiceIdStr || inv.id === (isObj ? rowOrId.id : undefined))
              ? {
                  ...inv,
                  Tally_Sync_Status: 'SUCCESS',
                  Tally_Id: String(tallyId),
                  Tally_Sync_Date: new Date().toISOString(),
                  Tally_Sync_Error: '',
                }
              : inv
          )
        );

        // Optimistically update selectedRecord if modal is currently open
        setSelectedRecord((prev: any) =>
          prev && (prev.Invoice_Id === invoiceIdStr || prev.id === (isObj ? rowOrId.id : undefined))
            ? {
                ...prev,
                Tally_Sync_Status: 'SUCCESS',
                Tally_Id: String(tallyId),
                Tally_Sync_Date: new Date().toISOString(),
                Tally_Sync_Error: '',
              }
            : prev
        );

        // Invalidate TanStack Query cache in background to persist sync state
        queryClient.invalidateQueries({ queryKey: TALLY_INVOICES_QUERY_KEY });
      } else {
        const errorMsg = res?.error || res?.details || res?.message || 'Failed to sync invoice to Tally';
        if (errorMsg.toLowerCase().includes('connect') || errorMsg.toLowerCase().includes('tally')) {
          setConnectionError(errorMsg);
          toast.error(errorMsg, {
            description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
            duration: 8000
          });
        } else {
          toast.error(errorMsg);
        }
      }
      await loadInvoices();
    } catch (err: any) {
      console.error('Sync Error:', err);
      const errMsg = err?.data?.error || err?.data?.message || err?.message || 'Tally Sync Server Error';
      if (errMsg.toLowerCase().includes('connect') || errMsg.toLowerCase().includes('tally')) {
        setConnectionError(errMsg);
        toast.error(errMsg, {
          description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
          duration: 8000
        });
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSyncingId(null);
    }
  };

  // Multi Sync Invoices to Tally
  const handleMultiSyncToTally = async () => {
    // Only proceed if at least one invoice checkbox is selected
    if (selectedInvoices.length === 0) {
      toast.warning('Please select at least one invoice checkbox to sync.');
      return;
    }

    const targetInvoices = selectedInvoices;

    setIsMultiSyncing(true);
    setMultiSyncProgress({ current: 0, total: targetInvoices.length, currentInvoiceId: '' });

    try {
      const { successCount, failCount, lastError, results } = await syncMultipleInvoicesToTally(
        targetInvoices,
        (current, total, currentInvoiceId) => {
          setMultiSyncProgress({ current, total, currentInvoiceId: String(currentInvoiceId) });
          setSyncingId(String(currentInvoiceId));
        }
      );

      // Optimistically update all successfully synced invoices locally
      setInvoices((prev) =>
        prev.map((inv) => {
          const match = results.find(
            (r) => r.success && (r.invoiceId === inv.Invoice_Id || r.invoiceId === inv.id)
          );
          if (match) {
            return {
              ...inv,
              Tally_Sync_Status: 'SUCCESS',
              Tally_Id: String(match.tallyId || inv.Tally_Id || inv.Invoice_Id),
              Tally_Sync_Date: new Date().toISOString(),
              Tally_Sync_Error: '',
            };
          }
          return inv;
        })
      );

      setSelectedInvoices([]);

      if (failCount === 0) {
        toast.success(`Successfully synced all ${successCount} invoice(s) to Tally Prime!`, {
          description: 'All vouchers and Tally IDs recorded successfully.',
        });
        setConnectionError(null);
      } else if (successCount > 0) {
        toast.warning(`Multi-sync completed: ${successCount} synced successfully, ${failCount} failed.`);
        if (lastError && (lastError.toLowerCase().includes('connect') || lastError.toLowerCase().includes('tally'))) {
          setConnectionError(lastError);
        }
      } else {
        const errMsg = lastError || 'Failed to sync invoices to Tally';
        if (errMsg.toLowerCase().includes('connect') || errMsg.toLowerCase().includes('tally')) {
          setConnectionError(errMsg);
          toast.error(errMsg, {
            description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
            duration: 8000,
          });
        } else {
          toast.error(errMsg);
        }
      }

      await loadInvoices();
    } catch (err: any) {
      console.error('Multi Sync Error:', err);
      toast.error('An unexpected error occurred during multi-sync.');
    } finally {
      setIsMultiSyncing(false);
      setSyncingId(null);
    }
  };

  // Filtered list based on search and period (shows all real invoices without dropping zero-tax)
  const filteredInvoices = useMemo(() => {
    let start: moment.Moment | null = null;
    let end: moment.Moment | null = null;

    if (selectedPeriod === 'This Year') {
      start = moment().startOf('year');
      end = moment().endOf('year');
    } else if (selectedPeriod === 'This Month') {
      start = moment().startOf('month');
      end = moment().endOf('month');
    } else if (selectedPeriod === 'Last Month') {
      start = moment().subtract(1, 'month').startOf('month');
      end = moment().subtract(1, 'month').endOf('month');
    } else if (selectedPeriod === 'This Quarter') {
      start = moment().startOf('quarter');
      end = moment().endOf('quarter');
    } else if (selectedPeriod === 'Today') {
      start = moment().startOf('day');
      end = moment().endOf('day');
    }

    return invoices.filter((inv) => {
      // 1. Filter by search query (Invoice ID, Customer Name, or Tally ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesInvoice = (inv.Invoice_Id || '').toLowerCase().includes(query);
        const matchesCustomer = (inv.Customer_Name || '').toLowerCase().includes(query);
        const matchesTally = (inv.Tally_Id || '').toLowerCase().includes(query);
        const matchesStore = (inv.Store_Name || '').toLowerCase().includes(query);
        if (!matchesInvoice && !matchesCustomer && !matchesTally && !matchesStore) return false;
      }

      // 2. Filter by date range (only if a specific period is selected, not 'All Time')
      if (selectedPeriod !== 'All Time' && start && end && inv.Invoice_Date) {
        const invDate = moment(inv.Invoice_Date);
        if (invDate.isValid()) {
          return invDate.isBetween(start, end, 'day', '[]');
        }
      }

      return true;
    });
  }, [invoices, selectedPeriod, searchQuery]);

  // Metric stats calculated from all filtered real invoices
  const stats = useMemo(() => {
    const totalCount = filteredInvoices.length;
    const totalGstCollected = filteredInvoices.reduce(
      (sum, inv) => sum + Number(inv.Tax_Amount || 0),
      0
    );
    const successCount = filteredInvoices.filter(
      (inv) => String(inv.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS'
    ).length;
    const pendingCount = filteredInvoices.filter(
      (inv) => String(inv.Tally_Sync_Status || '').trim().toUpperCase() !== 'SUCCESS'
    ).length;

    return {
      totalCount,
      totalGstCollected,
      successCount,
      pendingCount,
    };
  }, [filteredInvoices]);

  // Store distribution summary for Overview
  const storeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalAmount: number; syncedCount: number; pendingCount: number }>();
    filteredInvoices.forEach((inv) => {
      const store = inv.Store_Name || 'Default Store';
      const cur = map.get(store) || { count: 0, totalAmount: 0, syncedCount: 0, pendingCount: 0 };
      cur.count += 1;
      cur.totalAmount += Number(inv.Net_Amount || inv.Invoice_Amount || 0);
      const isSynced = String(inv.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS';
      if (isSynced) {
        cur.syncedCount += 1;
      } else {
        cur.pendingCount += 1;
      }
      map.set(store, cur);
    });
    return Array.from(map.entries()).map(([store, data]) => ({
      store,
      ...data,
    }));
  }, [filteredInvoices]);

  // Tax distribution breakdown for Overview
  const taxBreakdown = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalNet = 0;

    filteredInvoices.forEach((inv) => {
      totalTaxable += Number(inv.Invoice_Amount || 0);
      totalCgst += Number(inv.Tax_Amount || 0) / 2;
      totalSgst += Number(inv.Tax_Amount || 0) / 2;
      totalNet += Number(inv.Net_Amount || 0);
    });

    return {
      totalTaxable,
      totalCgst,
      totalSgst,
      totalNet,
    };
  }, [filteredInvoices]);

  // ReusableTable Columns Configuration (Responsive & Streamlined)
  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'Customer_Name',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div
          className="flex flex-col py-0.5 min-w-[130px] cursor-pointer group/cust"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenRecordOverview(row);
          }}
          title="Click to view record overview"
        >
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <span className="font-semibold text-slate-850 dark:text-slate-100 text-xs sm:text-sm truncate group-hover/cust:text-blue-600 dark:group-hover/cust:text-blue-400 group-hover/cust:underline transition-colors" title={row.Customer_Name || 'Walk-in Customer'}>
              {row.Customer_Name || 'Walk-in Customer'}
            </span>
            <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-0 group-hover/cust:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
            <span className="group-hover/cust:text-slate-700 dark:group-hover/cust:text-slate-200">{row.Invoice_Id}</span>
            {row.Tally_Id && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  Tally: #{row.Tally_Id}
                </span>
              </>
            )}
            {row.Invoice_Date && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-sans">
                  {moment(row.Invoice_Date).isValid() ? moment(row.Invoice_Date).format('DD MMM YYYY') : row.Invoice_Date}
                </span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'Invoice_Date',
      header: 'Date',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
          {row.Invoice_Date && moment(row.Invoice_Date).isValid() ? moment(row.Invoice_Date).format('DD MMM YYYY') : row.Invoice_Date || '-'}
        </span>
      ),
    },
    {
      key: 'Invoice_Amount',
      header: 'Taxable Value',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
          ₹{Number(row.Invoice_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'cgst',
      header: 'CGST',
      sortable: false,
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ₹{(Number(row.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'sgst',
      header: 'SGST',
      sortable: false,
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ₹{(Number(row.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'Net_Amount',
      header: 'Net Amount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end whitespace-nowrap">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            ₹{Number(row.Net_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 sm:hidden">
            Tax: ₹{Number(row.Tax_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      key: 'Tally_Sync_Status',
      header: 'Tally Status',
      sortable: true,
      align: 'center',
      render: (row) => {
        const isSyncing = syncingId === row.Invoice_Id;
        const status = String(row.Tally_Sync_Status || 'PENDING').trim();
        const lower = status.toLowerCase();
        const isSynced = lower === 'success' || lower === 'synced';
        const isFailed = lower === 'failed' || lower === 'error';

        if (isSyncing) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs whitespace-nowrap">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>SYNCING...</span>
            </span>
          );
        }

        if (isSynced) {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
                <span>SYNCED</span>
              </span>
              {row.Tally_Id && (
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400" title={`Tally Voucher ID: ${row.Tally_Id}`}>
                  ID: {row.Tally_Id}
                </span>
              )}
            </div>
          );
        }

        if (isFailed) {
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs whitespace-nowrap"
              title={row.Tally_Sync_Error || 'Sync failed'}
            >
              <XCircle className="w-3.5 h-3.5 fill-rose-500 text-white shrink-0" />
              <span>FAILED</span>
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0 animate-pulse" />
            <span>PENDING</span>
          </span>
        );
      },
    },
  ], [syncingId]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const exportData = filteredInvoices.map((inv) => ({
      'Invoice No': inv.Invoice_Id,
      'Tally ID': inv.Tally_Id || inv.Invoice_Id || '-',
      'Date': inv.Invoice_Date ? moment(inv.Invoice_Date).format('YYYY-MM-DD') : '',
      'Customer Name': inv.Customer_Name || 'Walk-in Customer',
      'Taxable Value': Number(inv.Invoice_Amount || 0).toFixed(2),
      'CGST (9%)': (Number(inv.Tax_Amount || 0) / 2).toFixed(2),
      'SGST (9%)': (Number(inv.Tax_Amount || 0) / 2).toFixed(2),
      'Total Tax': Number(inv.Tax_Amount || 0).toFixed(2),
      'Net Amount': Number(inv.Net_Amount || 0).toFixed(2),
      'Tally Status': inv.Tally_Sync_Status || 'PENDING',
      'Sync Date': inv.Tally_Sync_Date ? moment(inv.Tally_Sync_Date).format('YYYY-MM-DD HH:mm') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GST Tally Invoices');
    XLSX.writeFile(wb, `GST_Tally_Report_${moment().format('YYYYMMDD')}.xlsx`);
    toast.success('Excel report downloaded successfully!');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Tally GST Transactions Report', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')} | Period: ${selectedPeriod}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Customer', 'Invoice No', 'Tally ID', 'Date', 'Taxable Value', 'CGST', 'SGST', 'Net Amount', 'Tally Status']],
      body: filteredInvoices.map((inv) => [
        inv.Customer_Name || 'Walk-in Customer',
        inv.Invoice_Id || '',
        inv.Tally_Id || inv.Invoice_Id || '-',
        inv.Invoice_Date && moment(inv.Invoice_Date).isValid() ? moment(inv.Invoice_Date).format('DD MMM YYYY') : (inv.Invoice_Date || ''),
        `Rs. ${Number(inv.Invoice_Amount || 0).toFixed(2)}`,
        `Rs. ${(Number(inv.Tax_Amount || 0) / 2).toFixed(2)}`,
        `Rs. ${(Number(inv.Tax_Amount || 0) / 2).toFixed(2)}`,
        `Rs. ${Number(inv.Net_Amount || 0).toFixed(2)}`,
        inv.Tally_Sync_Status || 'PENDING',
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
    });

    doc.save(`GST_Tally_Report_${moment().format('YYYYMMDD')}.pdf`);
    toast.success('PDF report downloaded successfully!');
  };

  // Index of currently selected record in filtered invoices for next/prev navigation
  const currentRecordIndex = useMemo(() => {
    if (!selectedRecord) return -1;
    return filteredInvoices.findIndex(
      (inv) =>
        (inv.Invoice_Id && inv.Invoice_Id === selectedRecord.Invoice_Id) ||
        (inv.id && inv.id === selectedRecord.id)
    );
  }, [selectedRecord, filteredInvoices]);

  const handlePrevRecord = () => {
    if (currentRecordIndex > 0) {
      handleOpenRecordOverview(filteredInvoices[currentRecordIndex - 1]);
    }
  };

  const handleNextRecord = () => {
    if (currentRecordIndex >= 0 && currentRecordIndex < filteredInvoices.length - 1) {
      handleOpenRecordOverview(filteredInvoices[currentRecordIndex + 1]);
    }
  };

  // Export single record overview to PDF (including full itemized lines)
  const handleExportSingleRecordPDF = (record: any) => {
    if (!record) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Tax Invoice / GST Transaction Overview', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Invoice ID: ${record.Invoice_Id || record.id} | Generated: ${moment().format('YYYY-MM-DD HH:mm')}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 32,
      head: [['Field', 'Details']],
      body: [
        ['Customer Name', record.Customer_Name || 'Walk-in Customer'],
        ['Invoice Number', record.Invoice_Id || '-'],
        ['Tally ERP ID', record.Tally_Id ? `#${record.Tally_Id}` : 'Not Generated'],
        [
          'Date',
          record.Invoice_Date && moment(record.Invoice_Date).isValid()
            ? moment(record.Invoice_Date).format('DD MMM YYYY')
            : record.Invoice_Date || '-',
        ],
        ['Store Name', record.Store_Name || 'Default Store'],
        ['Payment Method', record.Payment_Method || 'Cash'],
        ['Taxable Value (Base)', `Rs. ${Number(record.Invoice_Amount || 0).toFixed(2)}`],
        ['CGST (Central Tax)', `Rs. ${(Number(record.Tax_Amount || 0) / 2).toFixed(2)}`],
        ['SGST (State Tax)', `Rs. ${(Number(record.Tax_Amount || 0) / 2).toFixed(2)}`],
        ['Total GST Tax', `Rs. ${Number(record.Tax_Amount || 0).toFixed(2)}`],
        ['Net Total Amount', `Rs. ${Number(record.Net_Amount || 0).toFixed(2)}`],
        ['Tally Sync Status', record.Tally_Sync_Status || 'PENDING'],
      ],
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
      },
    });

    const items =
      Array.isArray(record.items) && record.items.length > 0
        ? record.items
        : Array.isArray(record.Invoice_Details) && record.Invoice_Details.length > 0
        ? record.Invoice_Details
        : displayItems;

    if (items.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Tax', 'Total']],
        body: items.map((it: any, i: number) => [
          String(i + 1),
          it.name || it.Product_Name || `Item #${i + 1}`,
          it.sku || '-',
          String(it.quantity || it.qty || 1),
          `Rs. ${Number(it.rate || it.price || 0).toFixed(2)}`,
          `Rs. ${Number(it.tax || it.taxAmount || 0).toFixed(2)}`,
          `Rs. ${Number(it.total || it.totalAmount || 0).toFixed(2)}`,
        ]),
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
      });
    }

    doc.save(`Invoice_${record.Invoice_Id || 'record'}.pdf`);
    toast.success(`PDF for Invoice ${record.Invoice_Id} downloaded!`);
  };

  return (
    <div className="space-y-3 p-3 sm:p-4.5 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tally GST Reports
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
              Tally Prime ERP
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and push GST transactions directly into Tally Prime
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none h-8 pl-3 pr-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Today">Today</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={loading}
            className="h-8 px-2.5 gap-1.5 text-xs border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin text-emerald-600')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            className="h-8 px-2.5 gap-1.5 text-xs border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer bg-white dark:bg-slate-900"
            title="Configure Tally Connection"
          >
            <Settings className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Tally Config</span>
          </Button>

          {/* Overview Page Link */}
          <Link
            href="/analytics/reports?report=tally-sync"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="View Tally Report Overview in Report Center"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Overview Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Connection Troubleshooting Banner */}
      {connectionError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-2.5 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5">
            <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Tally Connection Notice
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                {connectionError}
              </p>
              <div className="pt-0.5 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold text-[10px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Quick Fix in Tally Prime:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                  <li>Open <strong>Tally Prime</strong> and select your Company.</li>
                  <li>Press <kbd className="px-1 py-0.5 text-[9px] bg-amber-200/60 dark:bg-amber-900 rounded font-mono font-semibold">F1</kbd> (Help) → <strong>Settings</strong> → <strong>Connectivity</strong>.</li>
                  <li>Set <em>TallyPrime acts as</em> to <strong>Both</strong> or <strong>Server</strong>, and <em>Port</em> to <strong>9000</strong>.</li>
                  <li>Restart Tally Prime, then try syncing again.</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfigModalOpen(true)}
              className="h-7 px-2 text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 cursor-pointer"
            >
              <Settings className="w-3 h-3 mr-1" />
              Tally Settings
            </Button>
            <button
              onClick={() => setConnectionError(null)}
              className="text-amber-500 hover:text-amber-700 dark:text-amber-400 p-0.5 rounded cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Modern Metric KPI Cards (matching RetailPegatto design system) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Card 1: Total GST Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Total Invoices
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {stats.totalCount}
            </p>
            <span className="text-[10px] text-slate-400 block font-medium truncate">
              Transactions available
            </span>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Receipt className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 2: GST Tax Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              GST Tax Collected
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              ₹{stats.totalGstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium truncate">
              CGST + SGST total
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 3: Synced to Tally */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Synced to Tally
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {stats.successCount}
            </p>
            <span className="text-[10px] text-slate-400 block font-medium truncate">
              {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 0}% pushed to ERP
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 4: Pending Sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Pending Sync
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-amber-500 dark:text-amber-400 truncate">
              {stats.pendingCount}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium truncate">
              Requires sync action
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 3. View Switcher: Transaction Records vs Overview Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('records')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeView === 'records'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Transaction Records</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeView === 'records'
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
              {filteredInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeView === 'overview'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Overview Dashboard</span>
          </button>
        </div>

        <Link
          href="/analytics/reports?report=tally-sync"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          <span>Open Full Report Center Overview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Main Body: Overview Dashboard or Transaction Records Table */}
      {activeView === 'overview' ? (
        <div className="space-y-3">
          {/* Top Row: ERP Sync Health Progress & Report Center Link Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Sync Completion Rate Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tally ERP Sync Health</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time posting status of sales vouchers into Tally Prime
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                  {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 0}% Synchronized
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${stats.totalCount > 0 ? (stats.successCount / stats.totalCount) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${stats.totalCount > 0 ? (stats.pendingCount / stats.totalCount) * 100 : 0}%` }}
                />
              </div>

              {/* Sync Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Invoices</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{stats.totalCount}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Synced to ERP</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.successCount}</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[10px] uppercase font-semibold text-amber-600 block">Pending Sync</span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-400">{stats.pendingCount}</span>
                </div>
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[10px] uppercase font-semibold text-blue-600 block">Net Revenue</span>
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400">
                    ₹{taxBreakdown.totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Report Center Link Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Report Center Overview
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Analyze full cross-module sales reports, customer engagement, and export consolidated GST records.
                </p>
              </div>

              <div className="pt-3 space-y-2">
                <Link
                  href="/analytics/reports?report=tally-sync"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2e7d32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  <span>Go to Report Center Overview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveView('records')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
                >
                  <span>View Transaction Records Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tax Breakdown & Store Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* GST Tax Slabs Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>GST Tax Breakdown</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Period: {selectedPeriod}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Taxable Value (Base)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">CGST (Central Tax)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">SGST (State Tax)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Total Tax Collected</span>
                  <span>
                    ₹{stats.totalGstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Distribution Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Store-Wise Distribution</span>
                </h3>
                <span className="text-[11px] text-slate-400">{storeBreakdown.length} Store(s)</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {storeBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No store data available</div>
                ) : (
                  storeBreakdown.map((item) => (
                    <div
                      key={item.store}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.store}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{item.count} invoices</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">{item.syncedCount} synced</span>
                          {item.pendingCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-medium">{item.pendingCount} pending</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs space-y-3 min-w-0">
          
          {/* Table Controls Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>GST Transaction Records</span>
                <span className="text-[11px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {filteredInvoices.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Review transaction details and click Sync To Tally to post vouchers to Tally ERP.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              {/* Search Box */}
              <div className="relative w-full sm:w-48 md:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice or customer..."
                  className="h-8 pl-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Multi Sync to Tally Button - Disabled if no checkbox is selected */}
                <Button
                  size="sm"
                  onClick={handleMultiSyncToTally}
                  disabled={isMultiSyncing || loading || selectedInvoices.length === 0}
                  className={cn(
                    "h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs flex-1 sm:flex-initial transition-all",
                    selectedInvoices.length > 0
                      ? "bg-[#1b5e20] hover:bg-[#154a19] text-white cursor-pointer"
                      : "bg-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                  )}
                  title={
                    selectedInvoices.length > 0
                      ? `Sync ${selectedInvoices.length} selected invoice(s) to Tally Prime`
                      : "Select at least one invoice checkbox to enable Multi Sync"
                  }
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isMultiSyncing && "animate-spin")} />
                  <span>
                    {isMultiSyncing
                      ? `Syncing (${multiSyncProgress.current}/${multiSyncProgress.total})...`
                      : selectedInvoices.length > 0
                      ? `Multi Sync (${selectedInvoices.length})`
                      : `Multi Sync To Tally`}
                  </span>
                </Button>

                {/* Combined Single Export Dropdown Button (Excel & PDF) */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold gap-1.5 bg-[#2e7d32] hover:bg-[#256628] text-white shadow-xs cursor-pointer flex-1 sm:flex-initial transition-all"
                        title="Export Invoices"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left"
                  >
                    <DropdownMenuItem
                      onClick={handleExportExcel}
                      className="gap-2.5 cursor-pointer text-xs font-medium px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">Export Excel</span>
                        <span className="text-[10px] text-slate-400 font-normal">.xlsx spreadsheet</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleExportPDF}
                      className="gap-2.5 cursor-pointer text-xs font-medium px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200"
                    >
                      <Printer className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">Export PDF</span>
                        <span className="text-[10px] text-slate-400 font-normal">.pdf report table</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Real-time Multi Sync Progress Banner */}
          {isMultiSyncing && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-800 dark:text-blue-200 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold">Multi-sync in progress:</span> syncing invoice{' '}
                  <strong className="font-mono text-blue-900 dark:text-blue-100">{multiSyncProgress.currentInvoiceId}</strong>{' '}
                  ({multiSyncProgress.current} of {multiSyncProgress.total})...
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="font-bold text-[11px] bg-blue-200/80 dark:bg-blue-900 px-2.5 py-0.5 rounded-full font-mono">
                  {Math.round((multiSyncProgress.current / Math.max(multiSyncProgress.total, 1)) * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Selected Rows Bulk Actions Toolbar */}
          {!isMultiSyncing && selectedInvoices.length > 0 && (
            <div className="p-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{selectedInvoices.length}</strong> invoice(s) selected for bulk sync
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedInvoices([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer mr-1"
                >
                  Deselect all
                </button>
                <Button
                  size="sm"
                  onClick={handleMultiSyncToTally}
                  className="h-7 px-3 text-xs font-semibold gap-1.5 bg-[#1b5e20] hover:bg-[#154a19] text-white shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Selected ({selectedInvoices.length})</span>
                </Button>
              </div>
            </div>
          )}

          {/* Standard ReusableTable with Responsive Wrapper */}
          <div className="overflow-x-auto min-w-0 w-full">
            <ReusableTable
              columns={columns}
              data={filteredInvoices}
              loading={loading}
              initialPageSize={10}
              showPageSizeSelector={true}
              showGear={false}
              borderless={true}
              selectable={true}
              rowKey="Invoice_Id"
              selectedRows={selectedInvoices}
              onRowSelectChange={(rows) => setSelectedInvoices(rows)}
              onRowClick={(row, _index, e) => {
                const target = (e as any)?.target as HTMLElement | null;
                if (
                  target?.closest('[data-slot="checkbox"]') ||
                  target?.closest('input[type="checkbox"]') ||
                  target?.closest('[data-selection-cell="true"]') ||
                  target?.closest('button') ||
                  target?.closest('a')
                ) {
                  return;
                }
                handleOpenRecordOverview(row);
              }}
              actionsHeader="Actions"
              actions={(row) => {
                const isSynced = String(row.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS';
                const isSyncing = syncingId === row.Invoice_Id || syncingId === String(row.id);

                return (
                  <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Quick 1-click Action: Sync for pending invoices, or View Overview icon for synced */}
                    {!isSynced ? (
                      <Button
                        size="sm"
                        onClick={() => handleSyncToTally(row)}
                        disabled={isSyncing || isMultiSyncing}
                        className="h-7 px-2.5 text-[11px] font-semibold bg-[#1b5e20] hover:bg-[#154a19] text-white rounded-md shadow-xs transition-all cursor-pointer gap-1"
                        title="Sync this invoice to Tally Prime"
                      >
                        <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenRecordOverview(row)}
                        className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md cursor-pointer transition-colors"
                        title="View Record Overview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* 3-Dots Dropdown Menu for all actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                            title="More actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 border dark:border-slate-800 shadow-lg text-xs font-medium">
                        <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                          Invoice #{row.Invoice_Id}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer font-medium py-1.5"
                          onClick={() => handleOpenRecordOverview(row)}
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>View Overview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer font-medium py-1.5"
                          disabled={isSyncing || isMultiSyncing}
                          onClick={() => handleSyncToTally(row)}
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5 text-emerald-600", isSyncing && "animate-spin")} />
                          <span>{isSynced ? 'Re-sync to Tally' : 'Sync to Tally'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer font-medium py-1.5"
                          onClick={() => handleExportSingleRecordPDF(row)}
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span>Download PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer font-medium py-1.5"
                          onClick={() => {
                            if (row.Invoice_Id) {
                              navigator.clipboard?.writeText(String(row.Invoice_Id));
                              toast.success(`Copied #${row.Invoice_Id} to clipboard`);
                            }
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy Invoice ID</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Single Record Overview Modal */}
      <Dialog
        open={isRecordOverviewOpen}
        onOpenChange={(open) => {
          setIsRecordOverviewOpen(open);
          if (!open) setSelectedRecord(null);
        }}
      >
        <DialogContent showCloseButton={false} className="w-[96vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          {selectedRecord && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Invoice Record Overview
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-750 px-2 py-0.5 rounded">
                        #{selectedRecord.Invoice_Id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedRecord.Customer_Name || 'Walk-in Customer'} • {selectedRecord.Invoice_Date ? moment(selectedRecord.Invoice_Date).format('DD MMMM YYYY') : 'Date N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badges */}
                  {String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-bold gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                      <span>Synced (Tally #{selectedRecord.Tally_Id})</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs font-bold gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending Tally Sync</span>
                    </Badge>
                  )}

                  <button
                    onClick={() => setIsRecordOverviewOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                
                {/* 1. Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {recordFinancials && recordFinancials.extraCharges > 0 ? 'Items Subtotal' : 'Taxable Base'}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                      ₹{(recordFinancials && recordFinancials.extraCharges > 0
                        ? recordFinancials.itemsSubtotal
                        : Number(selectedRecord.Invoice_Amount || 0)
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {recordFinancials?.productItemsCount || 1} {recordFinancials?.productItemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {recordFinancials && recordFinancials.extraCharges > 0 ? 'Shipping & Packing' : 'CGST (Central)'}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                      ₹{(recordFinancials && recordFinancials.extraCharges > 0
                        ? recordFinancials.extraCharges
                        : Number(selectedRecord.Tax_Amount || 0) / 2
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {recordFinancials && recordFinancials.extraCharges > 0 ? (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate" title={`₹${recordFinancials.freightCost.toFixed(2)} Freight • ₹${recordFinancials.packingCharges.toFixed(2)} Packing`}>
                        ₹{recordFinancials.freightCost.toFixed(2)} Frt • ₹{recordFinancials.packingCharges.toFixed(2)} Pck
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">Central GST</span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {recordFinancials && recordFinancials.extraCharges > 0 ? 'Taxable Base' : 'SGST (State)'}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                      ₹{(recordFinancials && recordFinancials.extraCharges > 0
                        ? recordFinancials.taxableBase
                        : Number(selectedRecord.Tax_Amount || 0) / 2
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                      {recordFinancials && recordFinancials.extraCharges > 0 ? 'Items + Charges' : 'State GST'}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">Net Total</span>
                    <p className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      ₹{Number(selectedRecord.Net_Amount || (recordFinancials?.netTotal || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {recordFinancials && recordFinancials.amountReceived > 0 && (
                      <span className="text-[10px] text-emerald-600 font-medium block">
                        Paid: ₹{recordFinancials.amountReceived.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Record Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Customer & Store Details */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Customer & Billing Info</span>
                    </h4>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Customer Name:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.Customer_Name || 'Walk-in Customer'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Contact Mobile:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{selectedRecord.Customer_Phone || selectedRecord.Customer_Mobile || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Store / Branch:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecord.Store_Name || 'Default Store'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Payment Method:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.Payment_Method || 'Cash'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Payment Status:</span>
                        <span className={cn("font-bold", selectedRecord.Is_Paid ? "text-emerald-600" : "text-amber-600")}>
                          {selectedRecord.Is_Paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      {recordFinancials && recordFinancials.amountReceived > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                          <span className="text-slate-400">Amount Paid:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            ₹{recordFinancials.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {recordFinancials.changeReturned > 0 ? ` (Change: ₹${recordFinancials.changeReturned.toFixed(2)})` : ''}
                          </span>
                        </div>
                      )}
                      {recordFinancials && recordFinancials.extraCharges > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Freight & Packing:</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            ₹{recordFinancials.freightCost.toFixed(2)} Frt + ₹{recordFinancials.packingCharges.toFixed(2)} Pck
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tally ERP Sync Details */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tally ERP Voucher Details</span>
                    </h4>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Sync Status:</span>
                        <span className={cn(
                          "font-bold px-2 py-0.5 rounded text-[11px]",
                          String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        )}>
                          {selectedRecord.Tally_Sync_Status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Tally ID / Voucher:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.Tally_Id ? `#${selectedRecord.Tally_Id}` : 'Not Generated'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Invoice Date:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedRecord.Invoice_Date ? moment(selectedRecord.Invoice_Date).format('YYYY-MM-DD') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Sync Timestamp:</span>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {selectedRecord.Tally_Sync_Date ? moment(selectedRecord.Tally_Sync_Date).format('DD MMM YYYY, HH:mm') : 'Not yet synced'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Voucher Type:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Sales Voucher (GST)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Invoice Item Details & Line Breakdown */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Invoice Item Details
                      </h4>
                      {isLoadingRecordItems && (
                        <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin ml-1" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {displayItems.length} {displayItems.length === 1 ? 'line' : 'lines'}
                    </span>
                  </div>

                  {/* Items Table with Horizontal Scroll & Responsive Design */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10 shrink-0">#</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Item Description</th>
                          <th className="py-2.5 px-3 text-center w-16 shrink-0">Qty</th>
                          <th className="py-2.5 px-3 text-right w-24 shrink-0 whitespace-nowrap">Unit Price</th>
                          <th className="py-2.5 px-3 text-right w-20 shrink-0 whitespace-nowrap">Discount</th>
                          <th className="py-2.5 px-3 text-right w-24 shrink-0 whitespace-nowrap">Tax (GST)</th>
                          <th className="py-2.5 px-3 text-right w-28 shrink-0 whitespace-nowrap">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {displayItems.map((item: any, idx: number) => {
                          const isCharge = !!item.isExtraCharge;
                          const itemQty = Number(item.quantity || item.qty || 1);
                          const itemRate = Number(item.rate || item.price || 0);
                          const itemDiscount = Number(item.discount || item.discountPercent || 0);
                          const itemTax = Number(item.tax || item.taxAmount || 0);
                          const itemTotal = Number(item.total || item.totalAmount || (itemRate * itemQty));

                          return (
                            <tr
                              key={item.id || idx}
                              className={cn(
                                "transition-colors",
                                isCharge
                                  ? "bg-slate-50/70 dark:bg-slate-800/40 font-medium text-slate-700 dark:text-slate-300"
                                  : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                              )}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-850 dark:text-slate-100">
                                  {item.chargeType === 'freight' && (
                                    <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  )}
                                  {item.chargeType === 'packing' && (
                                    <Box className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                  <span>{item.name || item.Product_Name || `Line Item #${idx + 1}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                                  {item.sku && (
                                    <span className={cn(
                                      "px-1.5 py-0.2 rounded font-sans",
                                      isCharge
                                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                    )}>
                                      {isCharge ? 'Extra Charge' : `SKU: ${item.sku}`}
                                    </span>
                                  )}
                                  {item.uom && (
                                    <span className="text-slate-400">
                                      • UOM: {item.uom}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                                  {itemQty}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                ₹{itemRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                                {itemDiscount > 0 ? `₹${itemDiscount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                ₹{itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {item.taxRate ? (
                                  <span className="text-[10px] text-slate-400 block font-sans">
                                    ({item.taxRate}%)
                                  </span>
                                ) : null}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Summary Footer with Perfect Column Alignment (Labels span Col 1-6, Amounts in Col 7) */}
                      <tfoot className="bg-slate-50/90 dark:bg-slate-800/80 font-semibold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <tr className="border-b border-slate-100 dark:border-slate-800/60">
                          <td colSpan={6} className="py-2 px-3 text-right text-slate-500 font-medium">
                            Products Subtotal ({recordFinancials?.productItemsCount || 1} {recordFinancials?.productItemsCount === 1 ? 'item' : 'items'}):
                          </td>
                          <td colSpan={1} className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            ₹{(recordFinancials?.itemsSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {recordFinancials && recordFinancials.freightCost > 0 && (
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-blue-50/25 dark:bg-blue-950/10 text-slate-700 dark:text-slate-300">
                            <td colSpan={6} className="py-1.5 px-3 text-right font-medium">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>Freight & Delivery Charges:</span>
                              </div>
                            </td>
                            <td colSpan={1} className="py-1.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              +₹{recordFinancials.freightCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        {recordFinancials && recordFinancials.packingCharges > 0 && (
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-amber-50/25 dark:bg-amber-950/10 text-slate-700 dark:text-slate-300">
                            <td colSpan={6} className="py-1.5 px-3 text-right font-medium">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Box className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Packing & Packaging Charges:</span>
                              </div>
                            </td>
                            <td colSpan={1} className="py-1.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              +₹{recordFinancials.packingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        {recordFinancials && recordFinancials.discountAmount > 0 && (
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 text-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10">
                            <td colSpan={6} className="py-1.5 px-3 text-right font-medium text-emerald-700 dark:text-emerald-400">
                              Invoice Discount:
                            </td>
                            <td colSpan={1} className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              -₹{recordFinancials.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        <tr className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/50">
                          <td colSpan={6} className="py-2 px-3 text-right text-slate-700 dark:text-slate-200 font-bold">
                            Total Taxable Base (Invoice Amount):
                          </td>
                          <td colSpan={1} className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            ₹{Number(selectedRecord.Invoice_Amount || (recordFinancials?.taxableBase || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {Number(selectedRecord.Tax_Amount || 0) > 0 && (
                          <>
                            <tr className="border-b border-slate-100 dark:border-slate-800/50 text-slate-500 font-normal">
                              <td colSpan={6} className="py-1 px-3 text-right">
                                CGST (Central Tax):
                              </td>
                              <td colSpan={1} className="py-1 px-3 text-right font-mono whitespace-nowrap">
                                ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-slate-800/50 text-slate-500 font-normal">
                              <td colSpan={6} className="py-1 px-3 text-right">
                                SGST (State Tax):
                              </td>
                              <td colSpan={1} className="py-1 px-3 text-right font-mono whitespace-nowrap">
                                ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </>
                        )}

                        <tr className="border-t-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-white">
                          <td colSpan={6} className="py-2.5 px-3 text-right font-bold text-sm text-emerald-800 dark:text-emerald-300">
                            Net Invoice Total:
                          </td>
                          <td colSpan={1} className="py-2.5 px-3 text-right font-mono font-bold text-base text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                            ₹{Number(selectedRecord.Net_Amount || (recordFinancials?.netTotal || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {recordFinancials && recordFinancials.amountReceived > 0 && (
                          <>
                            <tr className="border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              <td colSpan={6} className="py-1.5 px-3 text-right font-medium">
                                Amount Paid by Customer ({selectedRecord.Payment_Method || 'Cash'}):
                              </td>
                              <td colSpan={1} className="py-1.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                ₹{recordFinancials.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            {recordFinancials.changeReturned > 0 && (
                              <tr className="border-t border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                                <td colSpan={6} className="py-1 px-3 text-right">
                                  Change / Balance Returned:
                                </td>
                                <td colSpan={1} className="py-1 px-3 text-right font-mono whitespace-nowrap">
                                  ₹{recordFinancials.changeReturned.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Prev / Next navigation */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrevRecord}
                    disabled={currentRecordIndex <= 0}
                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Button>
                  <span className="text-[11px] text-slate-400 font-medium px-1">
                    {currentRecordIndex + 1} of {filteredInvoices.length}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextRecord}
                    disabled={currentRecordIndex >= filteredInvoices.length - 1}
                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSingleRecordPDF(selectedRecord)}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download PDF</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleSyncToTally(selectedRecord)}
                    disabled={syncingId === selectedRecord.Invoice_Id || isMultiSyncing}
                    className={cn(
                      "h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer",
                      String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                        ? "bg-slate-700 hover:bg-slate-800 text-white"
                        : "bg-[#1b5e20] hover:bg-[#154a19] text-white"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", syncingId === selectedRecord.Invoice_Id && "animate-spin")} />
                    <span>
                      {syncingId === selectedRecord.Invoice_Id
                        ? 'Syncing...'
                        : String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                        ? 'Re-sync to Tally'
                        : 'Sync to Tally'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tally Configuration Modal */}
      <TallyConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
}
